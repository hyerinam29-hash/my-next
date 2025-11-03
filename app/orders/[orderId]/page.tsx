import { supabase } from "@/lib/supabase/client";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface OrderDetailPageProps {
  params: Promise<{ orderId: string }>;
}

export default async function OrderDetailPage({
  params,
}: OrderDetailPageProps) {
  const { orderId } = await params;

  console.group(`📋 주문 상세 조회: ${orderId}`);

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    console.error("❌ 주문 조회 실패:", orderError);
    notFound();
  }

  const { data: orderItems, error: itemsError } = await supabase
    .from("order_items")
    .select(`
      *,
      product:products(name)
    `)
    .eq("order_id", orderId);

  if (itemsError) {
    console.error("❌ 주문 아이템 조회 실패:", itemsError);
  }

  console.groupEnd();

  const statusMap: Record<string, string> = {
    Pending: "결제 대기",
    Processing: "주문 확인",
    Shipped: "배송 중",
    Delivered: "배송 완료",
    Cancelled: "취소됨",
    Refunded: "환불됨",
  };

  // shipping_address를 JSON으로 파싱
  let shippingAddress: any = null;
  try {
    if (order.shipping_address) {
      if (typeof order.shipping_address === "string") {
        shippingAddress = JSON.parse(order.shipping_address);
      } else {
        shippingAddress = order.shipping_address;
      }
    }
  } catch (error) {
    console.warn("⚠️ 배송 주소 파싱 실패:", error);
    // 파싱 실패 시 원본 텍스트 사용
    shippingAddress = { address: order.shipping_address };
  }

  return (
    <main className="min-h-[calc(100vh-80px)] px-4 py-8 lg:py-12">
      <div className="max-w-4xl mx-auto">
        <Link href="/orders">
          <Button variant="ghost" className="mb-6">
            ← 주문 내역으로
          </Button>
        </Link>

        <h1 className="text-4xl font-bold mb-8">주문 상세</h1>

        <div className="space-y-6">
          {/* 주문 정보 */}
          <section className="border rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">주문 정보</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">주문 번호</span>
                <span className="font-semibold">{orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">주문 일시</span>
                <span>
                  {new Date(order.created_at).toLocaleString("ko-KR")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">주문 상태</span>
                <span>{statusMap[order.status] || order.status}</span>
              </div>
              <div className="flex justify-between text-xl font-bold pt-4 border-t">
                <span>총 금액</span>
                <span>
                  {new Intl.NumberFormat("ko-KR", {
                    style: "currency",
                    currency: "KRW",
                  }).format(Number(order.total_amount))}
                </span>
              </div>
            </div>
          </section>

          {/* 주문 상품 */}
          <section className="border rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">주문 상품</h2>
            <div className="space-y-4">
              {orderItems?.map((item: any) => {
                const productName =
                  item.product?.name || "상품 정보 없음";
                return (
                  <div key={item.id} className="flex justify-between">
                    <div>
                      <p className="font-semibold">{productName}</p>
                      <p className="text-sm text-muted-foreground">
                        수량: {item.quantity}개
                      </p>
                    </div>
                    <p className="font-semibold">
                      {new Intl.NumberFormat("ko-KR", {
                        style: "currency",
                        currency: "KRW",
                      }).format(Number(item.price_at_purchase) * item.quantity)}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 배송 정보 */}
          {shippingAddress && (
            <section className="border rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-4">배송 정보</h2>
              <div className="space-y-2">
                <p>
                  <span className="text-muted-foreground">이름:</span>{" "}
                  {shippingAddress.name}
                </p>
                <p>
                  <span className="text-muted-foreground">전화번호:</span>{" "}
                  {shippingAddress.phone}
                </p>
                <p>
                  <span className="text-muted-foreground">주소:</span>{" "}
                  {shippingAddress.postalCode} {shippingAddress.address}{" "}
                  {shippingAddress.addressDetail}
                </p>
              </div>
            </section>
          )}

          {/* 주문 메모 */}
          {order.order_note && (
            <section className="border rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-4">주문 메모</h2>
              <p className="text-muted-foreground">{order.order_note}</p>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}

