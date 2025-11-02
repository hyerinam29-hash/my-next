import { supabase } from "@/lib/supabase/client";
import ProductCard from "@/components/product-card";
import type { Product } from "@/types/product";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * @file app/page.tsx
 * @description 홈페이지 - 상품 목록 그리드 레이아웃, 카테고리 네비게이션, 베스트 상품
 *
 * Supabase에서 활성화된 상품을 가져와서 반응형 그리드 레이아웃으로 표시합니다.
 * 카테고리 네비게이션과 베스트 상품 섹션을 포함합니다.
 */

// 시니어 영양제 카테고리 한글 매핑
const categoryMap: Record<string, string> = {
  "Joint & Bone Health": "관절/뼈 건강",
  "Immune Support": "면역 지원",
  "Multivitamin & Mineral": "종합 비타민/미네랄",
  "Cognitive & Memory": "인지/기억력",
  "Heart Health": "심장 건강",
  "Digestive Health": "소화 건강",
  "Eye Health": "눈 건강",
  "Sleep & Stress": "수면/스트레스",
  "Energy & Vitality": "에너지/활력",
};

export default async function Home() {
  console.group("🏠 홈페이지 상품 목록 조회 시작");

  let products: Product[] = [];
  let categories: string[] = [];
  let bestProducts: Product[] = [];

  try {
    console.log("📦 Supabase에서 상품 데이터 조회 중...");
    
    // 전체 상품 조회
    const { data: allProductsData, error: allProductsError } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (allProductsError) {
      console.error("❌ 상품 조회 실패:", allProductsError);
      throw allProductsError;
    }

    products = (allProductsData as Product[]) || [];
    
    // 카테고리 추출
    const uniqueCategories = Array.from(
      new Set(products.map((p) => p.category).filter(Boolean))
    ) as string[];
    categories = uniqueCategories;

    // 베스트 상품 (가격이 높은 상위 4개)
    bestProducts = [...products]
      .sort((a, b) => Number(b.price) - Number(a.price))
      .slice(0, 4);

    console.log(`✅ ${products.length}개의 상품 조회 성공`);
    console.log(`📂 ${categories.length}개의 카테고리 발견`);
    console.log("🏆 베스트 상품:", bestProducts.map((p) => p.name));
  } catch (error) {
    console.error("❌ 상품 데이터 로드 중 오류 발생:", error);
  }

  console.groupEnd();

  return (
    <main className="min-h-[calc(100vh-80px)] px-4 py-8 lg:py-12">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 섹션 */}
        <section className="mb-12 text-center">
              <h1 className="text-4xl lg:text-5xl font-bold mb-4">
                시니어 영양제 쇼핑몰
              </h1>
              <p className="text-lg text-muted-foreground">
                건강하고 활기찬 노후 생활을 위한 전문 영양제
              </p>
        </section>

        {/* 카테고리 네비게이션 */}
        {categories.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">카테고리</h2>
            <div className="flex flex-wrap gap-3">
              <Link href="/products">
                <Button variant="outline" className="rounded-full">
                  전체
                </Button>
              </Link>
              {categories.map((category) => (
                <Link key={category} href={`/products?category=${category}`}>
                  <Button variant="outline" className="rounded-full">
                    {categoryMap[category] || category}
                  </Button>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 베스트 상품 섹션 */}
        {bestProducts.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">베스트 상품</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {bestProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}

        {/* 전체 상품 목록 그리드 */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">전체 상품</h2>
            <Link href="/products">
              <Button variant="ghost">더보기 →</Button>
            </Link>
          </div>
          {products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {products.slice(0, 8).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground">
                현재 등록된 상품이 없습니다.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
