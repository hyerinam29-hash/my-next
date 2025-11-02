"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useClerkSupabaseClient } from "@/lib/supabase/clerk-client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { Product } from "@/types/product";
import { useRouter } from "next/navigation";

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  product: Product;
}

export default function CartPage() {
  const { userId, isSignedIn } = useAuth();
  const supabase = useClerkSupabaseClient();
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isSignedIn && userId) {
      loadCartItems();
    } else {
      setLoading(false);
    }
  }, [isSignedIn, userId]);

  const loadCartItems = async () => {
    if (!userId) return;

    console.group("🛒 장바구니 조회");

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
      console.log(`✅ ${items.length}개 아이템 조회 성공`);
      setLoading(false);
    } catch (error) {
      console.error("❌ 장바구니 조회 실패:", error);
    } finally {
      setLoading(false);
      console.groupEnd();
    }
  };

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    console.log("📝 수량 변경:", { itemId, newQuantity });

    try {
      const { error } = await supabase
        .from("cart_items")
        .update({ quantity: newQuantity })
        .eq("id", itemId);

      if (error) throw error;

      await loadCartItems();
    } catch (error) {
      console.error("❌ 수량 변경 실패:", error);
      alert("수량 변경에 실패했습니다.");
    }
  };

  const removeItem = async (itemId: string) => {
    console.log("🗑️ 장바구니 아이템 삭제:", itemId);

    try {
      const { error } = await supabase
        .from("cart_items")
        .delete()
        .eq("id", itemId);

      if (error) throw error;

      await loadCartItems();
    } catch (error) {
      console.error("❌ 삭제 실패:", error);
      alert("삭제에 실패했습니다.");
    }
  };

  if (!isSignedIn) {
    return (
      <main className="min-h-[calc(100vh-80px)] px-4 py-8 lg:py-12">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4">장바구니</h1>
          <p className="text-muted-foreground mb-8">로그인이 필요합니다.</p>
          <Link href="/sign-in">
            <Button>로그인하기</Button>
          </Link>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="min-h-[calc(100vh-80px)] px-4 py-8 lg:py-12">
        <div className="max-w-7xl mx-auto text-center">
          <p>로딩 중...</p>
        </div>
      </main>
    );
  }

  const totalAmount = cartItems.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0
  );

  const formattedTotal = new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
  }).format(totalAmount);

  return (
    <main className="min-h-[calc(100vh-80px)] px-4 py-8 lg:py-12">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">장바구니</h1>

        {cartItems.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-8">장바구니가 비어있습니다.</p>
            <Link href="/products">
              <Button>상품 보기</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="border rounded-lg p-4 flex gap-4 items-center"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{item.product.name}</h3>
                    <p className="text-muted-foreground">
                      {new Intl.NumberFormat("ko-KR", {
                        style: "currency",
                        currency: "KRW",
                      }).format(Number(item.product.price))}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      -
                    </Button>
                    <span className="w-12 text-center">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      +
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeItem(item.id)}
                    >
                      삭제
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="lg:col-span-1">
              <div className="border rounded-lg p-6 space-y-4">
                <h2 className="text-2xl font-bold">주문 요약</h2>
                <div className="flex justify-between">
                  <span>총 금액</span>
                  <span className="text-2xl font-bold">{formattedTotal}</span>
                </div>
                <Link href="/checkout" className="block">
                  <Button className="w-full" size="lg">
                    주문하기
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

