"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useClerkSupabaseClient } from "@/lib/supabase/clerk-client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Order {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
}

export default function OrdersPage() {
  const { userId, isSignedIn } = useAuth();
  const supabase = useClerkSupabaseClient();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isSignedIn && userId) {
      loadOrders();
    } else {
      setLoading(false);
      router.push("/sign-in");
    }
  }, [isSignedIn, userId]);

  const loadOrders = async () => {
    if (!userId) return;

    console.group("📋 주문 내역 조회");

    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("clerk_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setOrders((data as Order[]) || []);
      console.log(`✅ ${orders.length}개 주문 조회 성공`);
    } catch (error) {
      console.error("❌ 주문 내역 조회 실패:", error);
    } finally {
      setLoading(false);
      console.groupEnd();
    }
  };

  const statusMap: Record<string, string> = {
    pending: "결제 대기",
    confirmed: "주문 확인",
    shipped: "배송 중",
    delivered: "배송 완료",
    cancelled: "취소됨",
  };

  if (loading) {
    return (
      <main className="min-h-[calc(100vh-80px)] px-4 py-8">
        <div className="max-w-7xl mx-auto text-center">로딩 중...</div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-80px)] px-4 py-8 lg:py-12">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">주문 내역</h1>

        {orders.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-8">주문 내역이 없습니다.</p>
            <Link href="/products">
              <Button>상품 보기</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="block border rounded-lg p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-lg">주문 #{order.id.slice(0, 8)}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString("ko-KR")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-xl">
                      {new Intl.NumberFormat("ko-KR", {
                        style: "currency",
                        currency: "KRW",
                      }).format(Number(order.total_amount))}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {statusMap[order.status] || order.status}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

