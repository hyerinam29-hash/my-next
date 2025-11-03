import { supabase } from "@/lib/supabase/client";
import ProductCard from "@/components/product-card";
import type { Product } from "@/types/product";

/**
 * @file app/best/page.tsx
 * @description 베스트 상품 페이지
 *
 * 가격이 높은 상위 상품들을 베스트 상품으로 표시하는 페이지입니다.
 */

export default async function BestProductsPage() {
  console.group("🏆 베스트 상품 페이지 조회");

  let bestProducts: Product[] = [];

  try {
    console.log("📦 Supabase에서 베스트 상품 데이터 조회 중...");

    // 전체 상품 조회
    const { data: allProductsData, error: allProductsError } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (allProductsError) {
      console.error("❌ 상품 조회 실패:", allProductsError);
      throw allProductsError;
    }

    const allProducts = (allProductsData as Product[]) || [];

    // 베스트 상품 (가격이 높은 상위 상품들, 최대 20개)
    bestProducts = [...allProducts]
      .sort((a, b) => Number(b.price) - Number(a.price))
      .slice(0, 20);

    console.log(`✅ ${bestProducts.length}개의 베스트 상품 조회 성공`);
    console.log("🏆 베스트 상품:", bestProducts.map((p) => `${p.name} (${p.price}원)`));
  } catch (error) {
    console.error("❌ 베스트 상품 데이터 로드 중 오류 발생:", error);
  }

  console.groupEnd();

  return (
    <main className="min-h-[calc(100vh-80px)] px-4 py-8 lg:py-12">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 섹션 */}
        <section className="mb-12 text-center">
          <h1 className="text-4xl lg:text-5xl font-bold mb-4">베스트 상품</h1>
          <p className="text-lg text-muted-foreground">
            인기 있는 프리미엄 영양제를 만나보세요
          </p>
        </section>

        {/* 베스트 상품 그리드 */}
        {bestProducts.length > 0 ? (
          <section>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {bestProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        ) : (
          <section className="text-center py-16">
            <p className="text-muted-foreground">베스트 상품이 없습니다.</p>
          </section>
        )}
      </div>
    </main>
  );
}

