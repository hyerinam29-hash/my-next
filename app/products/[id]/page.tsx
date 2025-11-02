import { supabase } from "@/lib/supabase/client";
import type { Product } from "@/types/product";
import { Button } from "@/components/ui/button";
import { ImageIcon } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import AddToCartButton from "./add-to-cart-button";

interface ProductDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const { id } = await params;

  console.group(`🔍 상품 상세 조회: ${id}`);

  let product: Product | null = null;

  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .eq("is_active", true)
      .single();

    if (error || !data) {
      console.error("❌ 상품 조회 실패:", error);
      notFound();
    }

    product = data as Product;
    console.log("✅ 상품 조회 성공:", product.name);
  } catch (error) {
    console.error("❌ 상품 데이터 로드 중 오류:", error);
    notFound();
  }

  console.groupEnd();

  const formattedPrice = new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
  }).format(Number(product.price));

  return (
    <main className="min-h-[calc(100vh-80px)] px-4 py-8 lg:py-12">
      <div className="max-w-7xl mx-auto">
        <Link href="/products">
          <Button variant="ghost" className="mb-6">
            ← 상품 목록으로
          </Button>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* 이미지 영역 */}
          <div className="w-full aspect-square bg-muted rounded-lg flex items-center justify-center">
            <ImageIcon className="w-32 h-32 text-muted-foreground/50" />
          </div>

          {/* 상품 정보 */}
          <div className="flex flex-col gap-6">
            {product.category && (
              <span className="text-sm text-muted-foreground uppercase">
                {product.category}
              </span>
            )}
            <h1 className="text-4xl font-bold">{product.name}</h1>
            <p className="text-3xl font-bold text-primary">{formattedPrice}</p>

            {product.description && (
              <div>
                <h2 className="text-xl font-semibold mb-2">상품 설명</h2>
                <p className="text-muted-foreground">{product.description}</p>
              </div>
            )}

            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-semibold">재고</span>
                {product.stock_quantity > 0 ? (
                  <span className="text-sm text-muted-foreground">
                    {product.stock_quantity}개 남음
                  </span>
                ) : (
                  <span className="text-sm text-destructive">품절</span>
                )}
              </div>
            </div>

            <AddToCartButton product={product} />
          </div>
        </div>
      </div>
    </main>
  );
}

