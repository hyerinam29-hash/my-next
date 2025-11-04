"use client";

/**
 * @file app/mypage/page.tsx
 * @description 마이페이지
 *
 * 이 페이지는 사용자의 프로필 정보를 조회하고 수정할 수 있는 마이페이지입니다.
 *
 * 주요 기능:
 * 1. 프로필 정보 조회 (Clerk + Supabase)
 * 2. 프로필 정보 수정 (이름)
 * 3. 주문 내역 링크
 *
 * @dependencies
 * - @clerk/nextjs: Clerk 인증 (useAuth, useUser)
 * - @/actions/profile: 프로필 Server Actions (getProfile, updateProfile)
 * - @/components/ui: UI 컴포넌트
 */

import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { getProfile, updateProfile, type Profile } from "@/actions/profile";

export default function MyPage() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
  });

  useEffect(() => {
    if (isSignedIn) {
      loadProfile();
    } else {
      setLoading(false);
      router.push("/sign-in");
    }
  }, [isSignedIn]);

  const loadProfile = async () => {
    console.group("👤 [MyPage] 프로필 조회");

    try {
      const result = await getProfile();

      if (result.success && result.data) {
        setProfile(result.data);
        setFormData({ name: result.data.supabaseName });
        console.log("✅ 프로필 조회 성공");
      } else {
        const errorMessage =
          "error" in result ? result.error : "프로필을 불러올 수 없습니다.";
        console.error("❌ 프로필 조회 실패:", errorMessage);
        setError(errorMessage);
      }
    } catch (error) {
      console.error("❌ 프로필 조회 중 오류 발생:", error);
      setError("프로필을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
      console.groupEnd();
    }
  };

  const handleEdit = () => {
    setEditing(true);
    setError(null);
  };

  const handleCancel = () => {
    setEditing(false);
    if (profile) {
      setFormData({ name: profile.supabaseName });
    }
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    console.group("✏️ [MyPage] 프로필 수정");

    try {
      const result = await updateProfile({ name: formData.name });

      if (!result.success) {
        const errorMessage =
          "error" in result
            ? result.error
            : "프로필 수정에 실패했습니다.";
        console.error("❌ 프로필 수정 실패:", errorMessage);
        setError(errorMessage);
        return;
      }

      console.log("✅ 프로필 수정 성공");
      setEditing(false);
      // 프로필 다시 불러오기
      await loadProfile();
    } catch (error) {
      console.error("❌ 프로필 수정 중 예외 발생:", error);
      setError(
        error instanceof Error
          ? error.message
          : "프로필 수정에 실패했습니다. 다시 시도해주세요."
      );
    } finally {
      setSubmitting(false);
      console.groupEnd();
    }
  };

  if (loading) {
    return (
      <main className="min-h-[calc(100vh-80px)] px-4 py-8">
        <div className="max-w-7xl mx-auto text-center">로딩 중...</div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-[calc(100vh-80px)] px-4 py-8">
        <div className="max-w-7xl mx-auto text-center">
          <p className="mb-8 text-red-600">{error || "프로필을 불러올 수 없습니다."}</p>
          <Button onClick={loadProfile}>다시 시도</Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-80px)] px-4 py-8 lg:py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">마이페이지</h1>

        <div className="space-y-6">
          {/* 프로필 정보 섹션 */}
          <section className="border rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">프로필 정보</h2>
              {!editing && (
                <Button variant="outline" onClick={handleEdit}>
                  수정하기
                </Button>
              )}
            </div>

            {editing ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="email">이메일</Label>
                  <Input
                    id="email"
                    value={profile.clerkEmail}
                    disabled
                    className="bg-gray-100"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    이메일은 Clerk에서 관리됩니다.
                  </p>
                </div>

                <div>
                  <Label htmlFor="clerkName">Clerk 이름</Label>
                  <Input
                    id="clerkName"
                    value={profile.clerkName}
                    disabled
                    className="bg-gray-100"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Clerk 이름은 Clerk 대시보드에서 변경하세요.
                  </p>
                </div>

                <div>
                  <Label htmlFor="name">이름 (Supabase)</Label>
                  <Input
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="이름을 입력하세요"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    쇼핑몰에서 사용할 이름을 입력하세요.
                  </p>
                </div>

                {error && (
                  <div className="border border-red-500 bg-red-50 rounded-lg p-4">
                    <p className="text-red-700">{error}</p>
                  </div>
                )}

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={submitting}
                  >
                    취소
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "저장 중..." : "저장하기"}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label className="text-muted-foreground">이메일</Label>
                  <p className="text-lg">{profile.clerkEmail}</p>
                </div>

                <div>
                  <Label className="text-muted-foreground">Clerk 이름</Label>
                  <p className="text-lg">{profile.clerkName}</p>
                </div>

                <div>
                  <Label className="text-muted-foreground">이름 (Supabase)</Label>
                  <p className="text-lg">{profile.supabaseName}</p>
                </div>

                <div>
                  <Label className="text-muted-foreground">가입일</Label>
                  <p className="text-lg">
                    {new Date(profile.createdAt).toLocaleDateString("ko-KR")}
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* 빠른 링크 섹션 */}
          <section className="border rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">빠른 링크</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/orders">
                <Button variant="outline" className="w-full">
                  주문 내역 보기
                </Button>
              </Link>
              <Link href="/cart">
                <Button variant="outline" className="w-full">
                  장바구니 보기
                </Button>
              </Link>
              <Link href="/products">
                <Button variant="outline" className="w-full">
                  상품 보기
                </Button>
              </Link>
              {user && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    // Clerk UserButton 클릭 (모달 열기)
                    const event = new CustomEvent("clerk-user-button-click");
                    window.dispatchEvent(event);
                  }}
                >
                  계정 설정
                </Button>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

