"use client";

import { useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";

/**
 * @file app/payment/[orderId]/page.tsx
 * @description 결제 페이지
 *
 * TODO: Toss Payments MCP 연동 필요
 * 현재는 주문 완료 페이지로 바로 이동
 */

export default function PaymentPage() {
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const params = useParams();
  const orderId = params.orderId as string;

  useEffect(() => {
    if (!isSignedIn) {
      router.push("/sign-in");
    }
  }, [isSignedIn, router]);

  const handlePayment = () => {
    console.log("💳 결제 처리 시작 (Toss Payments 연동 필요)");
    // TODO: Toss Payments 결제 위젯 연동
    // 현재는 주문 완료 페이지로 이동
    router.push(`/orders/${orderId}/complete`);
  };

  return (
    <main className="min-h-[calc(100vh-80px)] px-4 py-8 lg:py-12">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">결제하기</h1>

        <div className="border rounded-lg p-6 space-y-6">
          <p className="text-muted-foreground">
            Toss Payments 결제 위젯이 여기에 표시됩니다.
          </p>
          <p className="text-sm text-muted-foreground">
            주문 ID: {orderId}
          </p>

          <div className="flex gap-4">
            <Link href="/products" className="flex-1">
              <Button variant="outline" className="w-full">
                취소
              </Button>
            </Link>
            <Button onClick={handlePayment} className="flex-1">
              테스트 결제 진행
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}

