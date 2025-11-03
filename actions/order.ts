"use server";

import { auth } from "@clerk/nextjs/server";
import { createClerkSupabaseClient } from "@/lib/supabase/server";
import { getCartItems, type CartItem } from "./cart";

/**
 * @file actions/order.ts
 * @description 주문 관련 Server Actions (데이터 레이어)
 *
 * 이 파일은 주문 생성과 관련된 모든 데이터베이스 작업을 Server Actions로 처리합니다.
 * 모든 함수는 서버 사이드에서 실행되며, Clerk 인증을 사용합니다.
 *
 * 주요 기능:
 * 1. 주문 생성 (배송 정보 및 메모 포함)
 * 2. 주문 아이템 생성
 * 3. 주문 생성 후 장바구니 비우기
 *
 * @dependencies
 * - @clerk/nextjs/server: Clerk 인증 (auth)
 * - @/lib/supabase/server: Supabase 클라이언트 (createClerkSupabaseClient)
 * - @/actions/cart: 장바구니 조회 (getCartItems)
 */

/**
 * 배송 정보 타입 정의
 */
export interface ShippingAddress {
  name: string;
  phone: string;
  address: string;
  addressDetail?: string;
  postalCode: string;
}

/**
 * 주문 생성 요청 타입 정의
 */
export interface CreateOrderRequest {
  shippingAddress: ShippingAddress;
  orderNote?: string;
}

/**
 * 주문 생성 응답 타입 정의
 */
export interface CreateOrderResponse {
  orderId: string;
  totalAmount: number;
}

/**
 * Server Action 결과 타입
 */
export type ActionResult<T = void> =
  | { success: true; data?: T; message?: string }
  | { success: false; error: string };

/**
 * 주문 생성
 *
 * 주문 생성 흐름:
 * 1. 사용자 인증 확인
 * 2. 장바구니 아이템 조회 및 검증
 * 3. 주문 금액 계산
 * 4. 주문 생성 (배송 정보 및 메모 포함)
 * 5. 주문 아이템 생성
 * 6. 장바구니 비우기
 *
 * @param request - 주문 생성 요청 정보 (배송 정보 및 메모)
 * @returns ActionResult<CreateOrderResponse>
 *
 * @example
 * ```ts
 * const result = await createOrder({
 *   shippingAddress: {
 *     name: "홍길동",
 *     phone: "010-1234-5678",
 *     address: "서울시 강남구 테헤란로 123",
 *     addressDetail: "아파트 101동 1001호",
 *     postalCode: "06142"
 *   },
 *   orderNote: "부재 시 경비실에 맡겨주세요"
 * });
 *
 * if (result.success) {
 *   console.log('주문 ID:', result.data?.orderId);
 * } else {
 *   console.error(result.error);
 * }
 * ```
 */
export async function createOrder(
  request: CreateOrderRequest
): Promise<ActionResult<CreateOrderResponse>> {
  console.group("💳 [Server Action] 주문 생성");
  console.log("📦 배송 정보:", request.shippingAddress);
  console.log("📝 주문 메모:", request.orderNote || "(없음)");

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
    const validationError = validateShippingAddress(request.shippingAddress);
    if (validationError) {
      console.error("❌ 입력값 검증 실패:", validationError);
      return {
        success: false,
        error: validationError,
      };
    }

    // 3. Supabase 클라이언트 생성
    const supabase = createClerkSupabaseClient();

    // 4. 장바구니 아이템 조회
    const cartResult = await getCartItems();
    if (!cartResult.success || !cartResult.data) {
      const errorMessage =
        cartResult.success === false ? cartResult.error : "장바구니를 불러올 수 없습니다.";
      console.error("❌ 장바구니 조회 실패:", errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }

    const cartItems = cartResult.data;

    if (cartItems.length === 0) {
      return {
        success: false,
        error: "장바구니가 비어있습니다.",
      };
    }

    console.log(`✅ ${cartItems.length}개 장바구니 아이템 조회 성공`);

    // 5. 재고 확인 및 주문 금액 계산
    let totalAmount = 0;
    for (const item of cartItems) {
      // 재고 확인
      if (item.quantity > item.product.stock_quantity) {
        return {
          success: false,
          error: `${item.product.name}의 재고가 부족합니다. (현재 재고: ${item.product.stock_quantity}개, 요청 수량: ${item.quantity}개)`,
        };
      }

      totalAmount += Number(item.product.price) * item.quantity;
    }

    console.log("💰 총 주문 금액:", totalAmount);

    // 6. 주문 생성
    // shipping_address는 JSON 문자열로 저장 (TEXT 타입)
    const shippingAddressJson = JSON.stringify({
      name: request.shippingAddress.name,
      phone: request.shippingAddress.phone,
      address: request.shippingAddress.address,
      addressDetail: request.shippingAddress.addressDetail || "",
      postalCode: request.shippingAddress.postalCode,
    });

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        clerk_id: userId,
        total_amount: totalAmount,
        status: "Pending",
        shipping_address: shippingAddressJson,
        recipient_name: request.shippingAddress.name,
        recipient_phone: request.shippingAddress.phone,
        order_note: request.orderNote || null,
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error("❌ 주문 생성 실패:", orderError);
      throw orderError || new Error("주문 생성에 실패했습니다.");
    }

    console.log("✅ 주문 생성 성공:", order.id);

    // 7. 주문 아이템 생성
    const orderItems = cartItems.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price_at_purchase: Number(item.product.price),
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      console.error("❌ 주문 아이템 생성 실패:", itemsError);
      // 주문 아이템 생성 실패 시 주문 삭제 (롤백)
      await supabase.from("orders").delete().eq("id", order.id);
      throw itemsError;
    }

    console.log(`✅ ${orderItems.length}개 주문 아이템 생성 성공`);

    // 8. 장바구니 비우기
    const { error: deleteError } = await supabase
      .from("cart_items")
      .delete()
      .eq("clerk_id", userId);

    if (deleteError) {
      console.warn("⚠️ 장바구니 비우기 실패 (주문은 생성됨):", deleteError);
      // 장바구니 비우기 실패는 치명적이지 않으므로 경고만 표시
    } else {
      console.log("✅ 장바구니 비우기 성공");
    }

    console.groupEnd();
    return {
      success: true,
      data: {
        orderId: order.id,
        totalAmount,
      },
      message: "주문이 생성되었습니다.",
    };
  } catch (error) {
    console.error("❌ 주문 생성 중 오류 발생:", error);
    console.groupEnd();
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "주문 생성에 실패했습니다. 다시 시도해주세요.",
    };
  }
}

/**
 * 배송 정보 입력값 검증
 *
 * @param shippingAddress - 검증할 배송 정보
 * @returns 에러 메시지 또는 null (검증 통과)
 */
function validateShippingAddress(
  shippingAddress: ShippingAddress
): string | null {
  if (!shippingAddress.name || shippingAddress.name.trim().length === 0) {
    return "이름을 입력해주세요.";
  }

  if (!shippingAddress.phone || shippingAddress.phone.trim().length === 0) {
    return "전화번호를 입력해주세요.";
  }

  // 전화번호 형식 검증 (간단한 형식: 숫자, 하이픈 포함 가능)
  const phoneRegex = /^[0-9-]+$/;
  if (!phoneRegex.test(shippingAddress.phone.replace(/\s/g, ""))) {
    return "올바른 전화번호 형식이 아닙니다.";
  }

  if (!shippingAddress.address || shippingAddress.address.trim().length === 0) {
    return "주소를 입력해주세요.";
  }

  if (
    !shippingAddress.postalCode ||
    shippingAddress.postalCode.trim().length === 0
  ) {
    return "우편번호를 입력해주세요.";
  }

  return null;
}

