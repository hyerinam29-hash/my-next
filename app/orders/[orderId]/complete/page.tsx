import { supabase } from "@/lib/supabase/client";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface CompletePageProps {
  params: Promise<{ orderId: string }>;
}

export default async function OrderCompletePage({
  params,
}: CompletePageProps) {
  const { orderId } = await params;

  const { data: order, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (error || !order) {
    notFound();
  }

  // TODO: 실제 결제 완료 시 주문 상태를 'confirmed'로 업데이트
  // 현재는 테스트 모드로 바로 완료 처리

  return (
    <main className="min-h-[calc(100vh-80px)] px-4 py-8 lg:py-12">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-4xl font-bold mb-4">주문 완료</h1>
        <p className="text-lg text-muted-foreground mb-8">
          주문이 성공적으로 완료되었습니다.
        </p>
        <div className="border rounded-lg p-6 mb-8">
          <p className="text-sm text-muted-foreground mb-2">주문 번호</p>
          <p className="text-xl font-bold">{orderId}</p>
          <p className="text-sm text-muted-foreground mt-4 mb-2">주문 금액</p>
          <p className="text-2xl font-bold">
            {new Intl.NumberFormat("ko-KR", {
              style: "currency",
              currency: "KRW",
            }).format(Number(order.total_amount))}
          </p>
        </div>
        <div className="flex gap-4 justify-center">
          <Link href="/orders">
            <Button>주문 내역 보기</Button>
          </Link>
          <Link href="/products">
            <Button variant="outline">계속 쇼핑</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}

