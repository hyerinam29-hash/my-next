"use server";

import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import type { Product } from "@/types/product";

/**
 * @file actions/cart.ts
 * @description 장바구니 관련 Server Actions (데이터 레이어)
 *
 * 이 파일은 장바구니 관련 모든 데이터베이스 작업을 Server Actions로 처리합니다.
 * 모든 함수는 서버 사이드에서 실행되며, Clerk 인증을 사용합니다.
 *
 * 주요 기능:
 * 1. 장바구니에 상품 추가 (기존 아이템 수량 업데이트 포함)
 * 2. 장바구니 아이템 수량 변경
 * 3. 장바구니 아이템 삭제
 * 4. 장바구니 아이템 조회 (상품 정보 포함)
 *
 * @dependencies
 * - @clerk/nextjs/server: Clerk 인증 (auth)
 * - @/lib/supabase/server: Supabase 클라이언트 (createClerkSupabaseClient)
 * - @/types/product: Product 타입
 */

/**
 * 장바구니 아이템 타입 정의
 */
export interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  product: Product;
}

/**
 * Server Action 결과 타입
 */
export type ActionResult<T = void> =
  | { success: true; data?: T; message?: string }
  | { success: false; error: string };

/**
 * 장바구니에 상품 추가 또는 기존 아이템 수량 업데이트
 *
 * @param productId - 추가할 상품 ID
 * @param quantity - 추가할 수량 (기본값: 1)
 * @returns ActionResult
 *
 * @example
 * ```ts
 * const result = await addToCart('product-id', 2);
 * if (result.success) {
 *   console.log('장바구니 추가 성공');
 * } else {
 *   console.error(result.error);
 * }
 * ```
 */
export async function addToCart(
  productId: string,
  quantity: number = 1
): Promise<ActionResult> {
  console.group("🛒 [Server Action] 장바구니 추가");
  console.log("📦 상품 ID:", productId);
  console.log("🔢 수량:", quantity);

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
    if (!productId || typeof productId !== "string") {
      return {
        success: false,
        error: "상품 ID가 올바르지 않습니다.",
      };
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      return {
        success: false,
        error: "수량은 1개 이상이어야 합니다.",
      };
    }

    // 3. Supabase 클라이언트 생성
    const supabase = createClerkSupabaseClient();

    // 4. 상품 정보 조회 (재고 확인용)
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("*")
      .eq("id", productId)
      .single();

    if (productError || !product) {
      console.error("❌ 상품 조회 실패:", productError);
      return {
        success: false,
        error: "상품을 찾을 수 없습니다.",
      };
    }

    console.log("✅ 상품 조회 성공:", product.name);
    console.log("📊 재고:", product.stock_quantity);

    // 5. 재고 확인
    if (product.stock_quantity < quantity) {
      return {
        success: false,
        error: `재고가 부족합니다. (현재 재고: ${product.stock_quantity}개)`,
      };
    }

    // 6. 기존 장바구니 아이템 확인
    const { data: existingItem, error: checkError } = await supabase
      .from("cart_items")
      .select("*")
      .eq("clerk_id", userId)
      .eq("product_id", productId)
      .single();

    // PGRST116은 "no rows returned" 에러 (아이템이 없는 경우는 정상)
    if (checkError && checkError.code !== "PGRST116") {
      console.error("❌ 장바구니 아이템 확인 실패:", checkError);
      throw checkError;
    }

    if (existingItem) {
      // 7-1. 기존 아이템이 있으면 수량 업데이트
      const newQuantity = existingItem.quantity + quantity;

      // 재고 확인
      if (newQuantity > product.stock_quantity) {
        return {
          success: false,
          error: `재고가 부족합니다. (현재 재고: ${product.stock_quantity}개, 장바구니 수량: ${existingItem.quantity}개)`,
        };
      }

      const { error: updateError } = await supabase
        .from("cart_items")
        .update({ quantity: newQuantity })
        .eq("id", existingItem.id)
        .eq("clerk_id", userId); // 소유권 확인

      if (updateError) {
        console.error("❌ 수량 업데이트 실패:", updateError);
        throw updateError;
      }

      console.log("✅ 장바구니 수량 업데이트 성공 (새 수량:", newQuantity, ")");
    } else {
      // 7-2. 새 아이템 추가
      const { error: insertError } = await supabase.from("cart_items").insert({
        clerk_id: userId,
        product_id: productId,
        quantity,
      });

      if (insertError) {
        console.error("❌ 장바구니 추가 실패:", insertError);
        throw insertError;
      }

      console.log("✅ 장바구니 추가 성공");
    }

    console.groupEnd();
    return {
      success: true,
      message: "장바구니에 추가되었습니다.",
    };
  } catch (error) {
    console.error("❌ 장바구니 추가 중 오류 발생:", error);
    console.groupEnd();
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "장바구니 추가에 실패했습니다. 다시 시도해주세요.",
    };
  }
}

/**
 * 장바구니 아이템 수량 변경
 *
 * @param itemId - 변경할 장바구니 아이템 ID
 * @param quantity - 새로운 수량 (1 이상)
 * @returns ActionResult
 */
export async function updateCartItem(
  itemId: string,
  quantity: number
): Promise<ActionResult> {
  console.group("📝 [Server Action] 장바구니 수량 변경");
  console.log("🆔 아이템 ID:", itemId);
  console.log("🔢 새 수량:", quantity);

  try {
    // 1. 사용자 인증 확인
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: "로그인이 필요합니다.",
      };
    }

    // 2. 입력값 검증
    if (!itemId || typeof itemId !== "string") {
      return {
        success: false,
        error: "아이템 ID가 올바르지 않습니다.",
      };
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
      return {
        success: false,
        error: "수량은 1개 이상이어야 합니다.",
      };
    }

    // 3. Supabase 클라이언트 생성
    const supabase = createClerkSupabaseClient();

    // 4. 장바구니 아이템 및 상품 정보 조회 (소유권 및 재고 확인)
    const { data: cartItem, error: cartItemError } = await supabase
      .from("cart_items")
      .select(`
        *,
        product:products(*)
      `)
      .eq("id", itemId)
      .eq("clerk_id", userId) // 소유권 확인
      .single();

    if (cartItemError || !cartItem) {
      console.error("❌ 장바구니 아이템 조회 실패:", cartItemError);
      return {
        success: false,
        error: "장바구니 아이템을 찾을 수 없습니다.",
      };
    }

    const product = cartItem.product as Product;

    // 5. 재고 확인
    if (quantity > product.stock_quantity) {
      return {
        success: false,
        error: `재고가 부족합니다. (현재 재고: ${product.stock_quantity}개)`,
      };
    }

    // 6. 수량 업데이트
    const { error: updateError } = await supabase
      .from("cart_items")
      .update({ quantity })
      .eq("id", itemId)
      .eq("clerk_id", userId); // 소유권 확인

    if (updateError) {
      console.error("❌ 수량 업데이트 실패:", updateError);
      throw updateError;
    }

    console.log("✅ 수량 업데이트 성공");
    console.groupEnd();
    return {
      success: true,
      message: "수량이 변경되었습니다.",
    };
  } catch (error) {
    console.error("❌ 수량 변경 중 오류 발생:", error);
    console.groupEnd();
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "수량 변경에 실패했습니다. 다시 시도해주세요.",
    };
  }
}

/**
 * 장바구니에서 아이템 삭제
 *
 * @param itemId - 삭제할 장바구니 아이템 ID
 * @returns ActionResult
 */
export async function removeCartItem(itemId: string): Promise<ActionResult> {
  console.group("🗑️ [Server Action] 장바구니 아이템 삭제");
  console.log("🆔 아이템 ID:", itemId);

  try {
    // 1. 사용자 인증 확인
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: "로그인이 필요합니다.",
      };
    }

    // 2. 입력값 검증
    if (!itemId || typeof itemId !== "string") {
      return {
        success: false,
        error: "아이템 ID가 올바르지 않습니다.",
      };
    }

    // 3. Supabase 클라이언트 생성
    const supabase = createClerkSupabaseClient();

    // 4. 장바구니 아이템 소유권 확인 및 삭제
    const { error: deleteError } = await supabase
      .from("cart_items")
      .delete()
      .eq("id", itemId)
      .eq("clerk_id", userId); // 소유권 확인

    if (deleteError) {
      console.error("❌ 삭제 실패:", deleteError);
      throw deleteError;
    }

    console.log("✅ 삭제 성공");
    console.groupEnd();
    return {
      success: true,
      message: "장바구니에서 제거되었습니다.",
    };
  } catch (error) {
    console.error("❌ 삭제 중 오류 발생:", error);
    console.groupEnd();
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "삭제에 실패했습니다. 다시 시도해주세요.",
    };
  }
}

/**
 * 현재 사용자의 장바구니 아이템 조회 (상품 정보 포함)
 *
 * @returns ActionResult<CartItem[]>
 */
export async function getCartItems(): Promise<ActionResult<CartItem[]>> {
  console.group("📋 [Server Action] 장바구니 조회");

  try {
    // 1. 사용자 인증 확인
    const { userId } = await auth();

    if (!userId) {
      return {
        success: false,
        error: "로그인이 필요합니다.",
      };
    }

    console.log("👤 사용자 ID:", userId);

    // 2. Supabase 클라이언트 생성
    const supabase = createClerkSupabaseClient();

    // 3. 장바구니 아이템 조회 (상품 정보 포함)
    const { data, error } = await supabase
      .from("cart_items")
      .select(`
        id,
        product_id,
        quantity,
        product:products(*)
      `)
      .eq("clerk_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ 장바구니 조회 실패:", error);
      throw error;
    }

    // 4. 데이터 포맷팅
    const cartItems: CartItem[] = (data || []).map((item: any) => ({
      id: item.id,
      product_id: item.product_id,
      quantity: item.quantity,
      product: item.product as Product,
    }));

    console.log(`✅ ${cartItems.length}개 아이템 조회 성공`);
    console.groupEnd();

    return {
      success: true,
      data: cartItems,
    };
  } catch (error) {
    console.error("❌ 장바구니 조회 중 오류 발생:", error);
    console.groupEnd();
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "장바구니 조회에 실패했습니다. 다시 시도해주세요.",
    };
  }
}

