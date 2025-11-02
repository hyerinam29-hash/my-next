import { supabase } from "@/lib/supabase/client";
import ProductCard from "@/components/product-card";
import type { Product } from "@/types/product";

/**
 * @file app/page.tsx
 * @description 홈페이지 - 상품 목록 그리드 레이아웃
 *
 * Supabase에서 활성화된 상품을 가져와서 반응형 그리드 레이아웃으로 표시합니다.
 */

export default async function Home() {
  console.group("🏠 홈페이지 상품 목록 조회 시작");

  let products: Product[] = [];

  try {
    console.log("📦 Supabase에서 상품 데이터 조회 중...");
    
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(20); // 최대 20개 상품만 표시

    if (error) {
      console.error("❌ 상품 조회 실패:", error);
      throw error;
    }

    products = (data as Product[]) || [];
    console.log(`✅ ${products.length}개의 상품 조회 성공`);
    console.log("📋 상품 목록:", products.map((p) => ({ id: p.id, name: p.name })));
  } catch (error) {
    console.error("❌ 상품 데이터 로드 중 오류 발생:", error);
    // 에러가 발생해도 빈 배열로 처리하여 페이지는 정상 렌더링
  }

  console.groupEnd();

  return (
    <main className="min-h-[calc(100vh-80px)] px-4 py-8 lg:py-12">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 섹션 */}
        <section className="mb-12 text-center">
          <h1 className="text-4xl lg:text-5xl font-bold mb-4">
            쇼핑몰에 오신 것을 환영합니다
          </h1>
          <p className="text-lg text-muted-foreground">
            다양한 상품을 만나보세요
          </p>
        </section>

        {/* 상품 목록 그리드 */}
        {products.length > 0 ? (
          <section>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        ) : (
          <section className="text-center py-16">
            <p className="text-muted-foreground">
              현재 등록된 상품이 없습니다.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
