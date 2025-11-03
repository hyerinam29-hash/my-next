"use client";

/**
 * @file app/checkout/page.tsx
 * @description 주문하기 페이지
 *
 * 이 페이지는 장바구니에 담긴 상품을 주문하는 페이지입니다.
 * 사용자는 배송 정보와 주문 메모를 입력하고 주문을 생성합니다.
 *
 * 주요 기능:
 * 1. 장바구니 아이템 조회 및 표시
 * 2. 배송 정보 입력 폼 (이름, 전화번호, 주소, 우편번호, 상세주소)
 * 3. 주문 메모 입력 (선택사항)
 * 4. 주문 생성 (Server Action 사용)
 *
 * @dependencies
 * - @clerk/nextjs: Clerk 인증 (useAuth)
 * - @/actions/cart: 장바구니 조회 (getCartItems)
 * - @/actions/order: 주문 생성 (createOrder)
 */

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getCartItems, type CartItem } from "@/actions/cart";
import { createOrder, type ShippingAddress } from "@/actions/order";

export default function CheckoutPage() {
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    addressDetail: "",
    postalCode: "",
    note: "",
  });

  useEffect(() => {
    if (isSignedIn) {
      loadCartItems();
    } else {
      setLoading(false);
      router.push("/sign-in");
    }
  }, [isSignedIn]);

  const loadCartItems = async () => {
    console.group("🛒 [Checkout] 장바구니 조회");

    try {
      const result = await getCartItems();

      if (result.success && result.data) {
        setCartItems(result.data);
        console.log(`✅ ${result.data.length}개 아이템 조회 성공`);
      } else {
        console.error("❌ 장바구니 조회 실패:", result.error);
        setCartItems([]);
      }
    } catch (error) {
      console.error("❌ 장바구니 조회 중 오류 발생:", error);
      setCartItems([]);
    } finally {
      setLoading(false);
      console.groupEnd();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    console.group("💳 [Checkout] 주문 처리 시작");

    try {
      // 배송 정보 구성
      const shippingAddress: ShippingAddress = {
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        addressDetail: formData.addressDetail,
        postalCode: formData.postalCode,
      };

      // 주문 생성 (Server Action)
      const result = await createOrder({
        shippingAddress,
        orderNote: formData.note || undefined,
      });

      if (!result.success) {
        console.error("❌ 주문 생성 실패:", result.error);
        setError(result.error);
        return;
      }

      console.log("✅ 주문 생성 성공:", result.data?.orderId);

      // 결제 페이지로 이동
      if (result.data?.orderId) {
        router.push(`/payment/${result.data.orderId}`);
      }
    } catch (error) {
      console.error("❌ 주문 처리 중 예외 발생:", error);
      setError(
        error instanceof Error
          ? error.message
          : "주문 처리에 실패했습니다. 다시 시도해주세요."
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

  if (cartItems.length === 0) {
    return (
      <main className="min-h-[calc(100vh-80px)] px-4 py-8">
        <div className="max-w-7xl mx-auto text-center">
          <p className="mb-8">장바구니가 비어있습니다.</p>
          <Link href="/products">
            <Button>상품 보기</Button>
          </Link>
        </div>
      </main>
    );
  }

  const totalAmount = cartItems.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0
  );

  return (
    <main className="min-h-[calc(100vh-80px)] px-4 py-8 lg:py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">주문하기</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="border rounded-lg p-6 space-y-4">
            <h2 className="text-2xl font-bold">배송 정보</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">이름</Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="phone">전화번호</Label>
                <Input
                  id="phone"
                  required
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="postalCode">우편번호</Label>
                <Input
                  id="postalCode"
                  required
                  value={formData.postalCode}
                  onChange={(e) =>
                    setFormData({ ...formData, postalCode: e.target.value })
                  }
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="address">주소</Label>
                <Input
                  id="address"
                  required
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="addressDetail">상세주소</Label>
                <Input
                  id="addressDetail"
                  value={formData.addressDetail}
                  onChange={(e) =>
                    setFormData({ ...formData, addressDetail: e.target.value })
                  }
                />
              </div>
            </div>
          </section>

          <section className="border rounded-lg p-6 space-y-4">
            <h2 className="text-2xl font-bold">주문 요약</h2>
            <div className="space-y-2">
              {cartItems.map((item) => (
                <div key={item.id} className="flex justify-between">
                  <span>
                    {item.product.name} x {item.quantity}
                  </span>
                  <span>
                    {new Intl.NumberFormat("ko-KR", {
                      style: "currency",
                      currency: "KRW",
                    }).format(Number(item.product.price) * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t pt-4 flex justify-between text-xl font-bold">
              <span>총 금액</span>
              <span>
                {new Intl.NumberFormat("ko-KR", {
                  style: "currency",
                  currency: "KRW",
                }).format(totalAmount)}
              </span>
            </div>
          </section>

          <section className="border rounded-lg p-6">
            <Label htmlFor="note">주문 메모 (선택사항)</Label>
            <Textarea
              id="note"
              value={formData.note}
              onChange={(e) =>
                setFormData({ ...formData, note: e.target.value })
              }
              className="mt-2"
              placeholder="배송 요청사항이나 메모를 입력해주세요"
            />
          </section>

          {error && (
            <div className="border border-red-500 bg-red-50 rounded-lg p-4">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          <div className="flex gap-4">
            <Link href="/cart" className="flex-1">
              <Button type="button" variant="outline" className="w-full">
                취소
              </Button>
            </Link>
            <Button type="submit" disabled={submitting} className="flex-1">
              {submitting ? "처리 중..." : "주문하기"}
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}

