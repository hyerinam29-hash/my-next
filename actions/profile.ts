"use server";

import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { clerkClient } from "@clerk/nextjs/server";

/**
 * @file actions/profile.ts
 * @description 프로필 관련 Server Actions (데이터 레이어)
 *
 * 이 파일은 사용자 프로필 정보 조회 및 수정을 Server Actions로 처리합니다.
 * 모든 함수는 서버 사이드에서 실행되며, Clerk 인증을 사용합니다.
 *
 * 주요 기능:
 * 1. 프로필 정보 조회 (Clerk + Supabase)
 * 2. 프로필 정보 수정 (Supabase users 테이블)
 *
 * @dependencies
 * - @clerk/nextjs/server: Clerk 인증 (auth, clerkClient)
 * - @/lib/supabase/server: Supabase 클라이언트 (createClerkSupabaseClient)
 */

/**
 * 프로필 정보 타입 정의
 */
export interface Profile {
  clerkId: string;
  clerkEmail: string;
  clerkName: string;
  supabaseName: string;
  createdAt: string;
}

/**
 * 프로필 업데이트 요청 타입 정의
 */
export interface UpdateProfileRequest {
  name: string;
}

/**
 * Server Action 결과 타입
 */
export type ActionResult<T = void> =
  | { success: true; data?: T; message?: string }
  | { success: false; error: string };

/**
 * 현재 사용자의 프로필 정보 조회
 *
 * Clerk와 Supabase에서 사용자 정보를 가져와 통합합니다.
 *
 * @returns ActionResult<Profile>
 *
 * @example
 * ```ts
 * const result = await getProfile();
 * if (result.success) {
 *   console.log('프로필:', result.data);
 * } else {
 *   console.error(result.error);
 * }
 * ```
 */
export async function getProfile(): Promise<ActionResult<Profile>> {
  console.group("👤 [Server Action] 프로필 조회");

  try {
    // 1. 사용자 인증 확인
    const { userId } = await auth();

    if (!userId) {
      console.error("❌ 인증 실패: 사용자가 로그인하지 않았습니다.");
      return {
        success: false,
        error: "로그인이 필요합니다.",
      };
    }

    console.log("👤 사용자 ID:", userId);

    // 2. Clerk에서 사용자 정보 가져오기
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);

    if (!clerkUser) {
      return {
        success: false,
        error: "사용자 정보를 찾을 수 없습니다.",
      };
    }

    const clerkEmail =
      clerkUser.emailAddresses[0]?.emailAddress || "이메일 없음";
    const clerkName =
      clerkUser.fullName ||
      clerkUser.username ||
      clerkEmail.split("@")[0] ||
      "이름 없음";

    console.log("✅ Clerk 사용자 정보 조회 성공");

    // 3. Supabase에서 사용자 정보 가져오기
    const supabase = createClerkSupabaseClient();
    const { data: supabaseUser, error: supabaseError } = await supabase
      .from("users")
      .select("*")
      .eq("clerk_id", userId)
      .single();

    if (supabaseError && supabaseError.code !== "PGRST116") {
      // PGRST116은 "no rows returned" 에러 (사용자가 없을 수 있음)
      console.error("❌ Supabase 사용자 조회 실패:", supabaseError);
      // Supabase 사용자가 없어도 Clerk 정보는 반환
    }

    console.log("✅ Supabase 사용자 정보 조회 성공");

    const profile: Profile = {
      clerkId: userId,
      clerkEmail,
      clerkName,
      supabaseName: supabaseUser?.name || clerkName,
      createdAt: supabaseUser?.created_at || new Date().toISOString(),
    };

    console.groupEnd();
    return {
      success: true,
      data: profile,
    };
  } catch (error) {
    console.error("❌ 프로필 조회 중 오류 발생:", error);
    console.groupEnd();
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "프로필 조회에 실패했습니다. 다시 시도해주세요.",
    };
  }
}

/**
 * 프로필 정보 수정
 *
 * Supabase users 테이블의 name 필드를 업데이트합니다.
 * Clerk의 기본 정보는 Clerk 대시보드에서 관리하므로 Supabase에만 저장된 정보만 수정합니다.
 *
 * @param request - 프로필 수정 요청 정보
 * @returns ActionResult
 *
 * @example
 * ```ts
 * const result = await updateProfile({ name: "홍길동" });
 * if (result.success) {
 *   console.log('프로필 수정 성공');
 * } else {
 *   console.error(result.error);
 * }
 * ```
 */
export async function updateProfile(
  request: UpdateProfileRequest
): Promise<ActionResult> {
  console.group("✏️ [Server Action] 프로필 수정");
  console.log("📝 수정할 이름:", request.name);

  try {
    // 1. 사용자 인증 확인
    const { userId } = await auth();

    if (!userId) {
      console.error("❌ 인증 실패: 사용자가 로그인하지 않았습니다.");
      return {
        success: false,
        error: "로그인이 필요합니다.",
      };
    }

    console.log("👤 사용자 ID:", userId);

    // 2. 입력값 검증
    if (!request.name || request.name.trim().length === 0) {
      return {
        success: false,
        error: "이름을 입력해주세요.",
      };
    }

    const trimmedName = request.name.trim();

    if (trimmedName.length > 100) {
      return {
        success: false,
        error: "이름은 100자 이하여야 합니다.",
      };
    }

    // 3. Supabase 클라이언트 생성
    const supabase = createClerkSupabaseClient();

    // 4. Supabase users 테이블 업데이트 (upsert 사용)
    const { data, error } = await supabase
      .from("users")
      .upsert(
        {
          clerk_id: userId,
          name: trimmedName,
        },
        {
          onConflict: "clerk_id",
        }
      )
      .select()
      .single();

    if (error) {
      console.error("❌ 프로필 수정 실패:", error);
      throw error;
    }

    console.log("✅ 프로필 수정 성공:", data.name);
    console.groupEnd();

    return {
      success: true,
      message: "프로필이 수정되었습니다.",
    };
  } catch (error) {
    console.error("❌ 프로필 수정 중 오류 발생:", error);
    console.groupEnd();
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "프로필 수정에 실패했습니다. 다시 시도해주세요.",
    };
  }
}

