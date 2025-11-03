import { supabase } from "@/lib/supabase/client";
import type { Product } from "@/types/product";
import { Button } from "@/components/ui/button";
import { ImageIcon, AlertTriangle, Pill, Info } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import AddToCartButton from "./add-to-cart-button";

/**
 * @file app/products/[id]/page.tsx
 * @description 상품 상세 페이지 - 성분, 복용법, 주의사항 표시 및 장바구니 기능
 *
 * 주요 기능:
 * 1. 상품 기본 정보 표시 (이름, 가격, 설명, 재고)
 * 2. 성분 정보 표시
 * 3. 복용법 및 용법용량 표시
 * 4. 주의사항 및 부작용 표시
 * 5. 수량 선택기 및 장바구니 담기 버튼
 *
 * @dependencies
 * - @/lib/supabase/client: Supabase 클라이언트
 * - @/components/product-card: 상품 카드 컴포넌트
 * - @/components/ui/button: shadcn/ui 버튼 컴포넌트
 */

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
      .single();

    if (error || !data) {
      console.error("❌ 상품 조회 실패:", error);
      notFound();
    }

    product = data as Product;
    console.log("✅ 상품 조회 성공:", product.name);
    console.log("📋 성분 정보:", product.ingredients ? "있음" : "없음");
    console.log("💊 복용법 정보:", product.dosage ? "있음" : "없음");
    console.log("⚠️ 주의사항 정보:", product.precautions ? "있음" : "없음");
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
    <main className="min-h-[calc(100vh-80px)] px-0 py-10 lg:py-16">
      <div className="max-w-[1400px] mx-auto">
        <Link href="/products">
          <Button variant="ghost" className="mb-6">
            ← 상품 목록으로
          </Button>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 mb-12">
          {/* 이미지 영역 */}
          <div className="w-full aspect-square bg-muted rounded-lg flex items-center justify-center">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <ImageIcon className="w-60 h-60 text-muted-foreground/50" />
            )}
          </div>

          {/* 상품 정보 */}
          <div className="flex flex-col gap-6">
            {product.category && (
              <span className="text-sm text-muted-foreground uppercase">
                {product.category}
              </span>
            )}
            <h1 className="text-5xl font-bold">{product.name}</h1>
            <p className="text-4xl font-bold text-primary">{formattedPrice}</p>

            {product.description && (
              <div>
                <h2 className="text-xl font-semibold mb-2">상품 설명</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {product.description}
                </p>
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
                  <span className="text-sm text-destructive font-semibold">
                    품절
                  </span>
                )}
              </div>
            </div>

            <AddToCartButton product={product} />
          </div>
        </div>

        {/* 상품 상세 정보 섹션 (성분, 복용법, 주의사항) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 성분 정보 */}
          {product.ingredients && (
            <div className="border rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <Pill className="w-5 h-5 text-primary" />
                <h3 className="text-xl font-semibold">주요 성분</h3>
              </div>
              <div className="text-muted-foreground leading-relaxed whitespace-pre-line">
                {product.ingredients}
              </div>
            </div>
          )}

          {/* 복용법 */}
          {product.dosage && (
            <div className="border rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <Info className="w-5 h-5 text-primary" />
                <h3 className="text-xl font-semibold">복용법 및 용법용량</h3>
              </div>
              <div className="text-muted-foreground leading-relaxed whitespace-pre-line">
                {product.dosage}
              </div>
            </div>
          )}

          {/* 주의사항 */}
          {product.precautions && (
            <div className="border rounded-lg p-6 border-destructive/20 bg-destructive/5">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                <h3 className="text-xl font-semibold text-destructive">
                  주의사항
                </h3>
              </div>
              <div className="text-muted-foreground leading-relaxed whitespace-pre-line">
                {product.precautions}
              </div>
            </div>
          )}
        </div>

        {/* 정보가 없는 경우 안내 */}
        {!product.ingredients && !product.dosage && !product.precautions && (
          <div className="text-center py-8 text-muted-foreground">
            <p>상품 상세 정보를 준비 중입니다.</p>
          </div>
        )}
      </div>
    </main>
  );
}

