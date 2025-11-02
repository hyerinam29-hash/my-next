"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useClerkSupabaseClient } from "@/lib/supabase/clerk-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import type { Product } from "@/types/product";
import { useRouter } from "next/navigation";

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  product: Product;
}

export default function CheckoutPage() {
  const { userId, isSignedIn } = useAuth();
  const supabase = useClerkSupabaseClient();
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    addressDetail: "",
    postalCode: "",
    note: "",
  });

  useEffect(() => {
    if (isSignedIn && userId) {
      loadCartItems();
    } else {
      setLoading(false);
      router.push("/sign-in");
    }
  }, [isSignedIn, userId]);

  const loadCartItems = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from("cart_items")
        .select(`
          *,
          product:products(*)
        `)
        .eq("clerk_id", userId);

      if (error) throw error;

      const items = (data || []).map((item: any) => ({
        id: item.id,
        product_id: item.product_id,
        quantity: item.quantity,
        product: item.product as Product,
      }));

      setCartItems(items);
    } catch (error) {
      console.error("❌ 장바구니 조회 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setSubmitting(true);
    console.group("💳 주문 처리 시작");

    try {
      const totalAmount = cartItems.reduce(
        (sum, item) => sum + Number(item.product.price) * item.quantity,
        0
      );

      // 주문 생성
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          clerk_id: userId,
          total_amount: totalAmount,
          status: "pending",
          shipping_address: {
            name: formData.name,
            phone: formData.phone,
            address: formData.address,
            addressDetail: formData.addressDetail,
            postalCode: formData.postalCode,
          },
          order_note: formData.note,
        })
        .select()
        .single();

      if (orderError) throw orderError;
      console.log("✅ 주문 생성 성공:", order.id);

      // 주문 아이템 생성
      const orderItems = cartItems.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;
      console.log("✅ 주문 아이템 생성 성공");

      // 장바구니 비우기
      const { error: deleteError } = await supabase
        .from("cart_items")
        .delete()
        .eq("clerk_id", userId);

      if (deleteError) throw deleteError;
      console.log("✅ 장바구니 비우기 성공");

      // 결제 페이지로 이동
      router.push(`/payment/${order.id}`);
    } catch (error) {
      console.error("❌ 주문 처리 실패:", error);
      alert("주문 처리에 실패했습니다.");
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
            />
          </section>

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

