import { supabase } from "@/lib/supabase/client";
import ProductCard from "@/components/product-card";
import type { Product } from "@/types/product";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import HomeProductFilter from "@/components/home-product-filter";
import { Suspense } from "react";

/**
 * @file app/page.tsx
 * @description 홈페이지 - 상품 목록 그리드 레이아웃, 카테고리 네비게이션, 베스트 상품
 *
 * Supabase에서 활성화된 상품을 가져와서 반응형 그리드 레이아웃으로 표시합니다.
 * 카테고리 네비게이션과 베스트 상품 섹션을 포함합니다.
 */

// 대표 카테고리 타입 정의
type DisplayCategory = "all" | "multivitamin" | "immune" | "joint" | "others";

// 대표 카테고리에 속하는 원본 카테고리 목록
const categoryGroups: Record<DisplayCategory, string[]> = {
  all: [], // 전체는 모든 카테고리 포함
  multivitamin: ["Multivitamin & Mineral"],
  immune: ["Immune Support"],
  joint: ["Joint & Bone Health"],
  others: [
    "Cognitive & Memory",
    "Heart Health",
    "Digestive Health",
    "Eye Health",
    "Sleep & Stress",
    "Energy & Vitality",
  ],
};

interface HomeProps {
  searchParams: Promise<{ category?: string }>;
}

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const category = (params.category || "all") as DisplayCategory;
  console.group("🏠 홈페이지 상품 목록 조회 시작");

  let products: Product[] = [];

  try {
    console.log("📦 Supabase에서 상품 데이터 조회 중...");
    console.log(`🔍 필터링 카테고리: ${category}`);

    // 상품 조회 쿼리 생성
    let query = supabase.from("products").select("*");

    // 카테고리 필터링 적용
    if (category && category !== "all") {
      const originalCategories = categoryGroups[category] || [];
      if (originalCategories.length > 0) {
        query = query.in("category", originalCategories);
        console.log(`📂 필터링 대상 카테고리: ${originalCategories.join(", ")}`);
      }
    }

    const { data: allProductsData, error: allProductsError } = await query.order(
      "created_at",
      { ascending: false }
    );

    if (allProductsError) {
      console.error("❌ 상품 조회 실패:", allProductsError);
      console.error("❌ 상세 에러:", JSON.stringify(allProductsError, null, 2));

      // 테이블이 존재하지 않는 경우 더 명확한 메시지
      if (allProductsError.message?.includes('relation "public.products" does not exist')) {
        console.error("🚨 products 테이블이 존재하지 않습니다. Supabase에서 SQL 마이그레이션을 실행해주세요.");
      }

      throw allProductsError;
    }

    products = (allProductsData as Product[]) || [];

    console.log(`✅ ${products.length}개의 상품 조회 성공`);
    console.log(`📂 선택된 필터: ${category}`);
  } catch (error) {
    console.error("❌ 상품 데이터 로드 중 오류 발생:", error);

    // 사용자에게 더 명확한 오류 메시지 표시를 위한 로그
    if (error && typeof error === 'object' && 'message' in error) {
      const errorMessage = (error as any).message;
      if (errorMessage?.includes('relation "public.products" does not exist')) {
        console.error("🔧 해결 방법: Supabase 대시보드에서 migration.sql 파일의 SQL을 실행하세요.");
      }
    }
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
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">카테고리</h2>
          <div className="flex flex-wrap gap-3">
            <Link href="/products">
              <Button variant="outline" className="rounded-full">
                전체
              </Button>
            </Link>
            {displayCategories.map((category) => (
              <Link key={category} href={`/products?category=${category}`}>
                <Button variant="outline" className="rounded-full">
                  {displayCategoryMap[category]}
                </Button>
              </Link>
            ))}
          </div>
        </section>

        {/* 전체 상품 목록 그리드 */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold">전체 상품</h1>
            <Link href="/products">
              <Button variant="ghost">더보기 →</Button>
            </Link>
          </div>
          
          {/* 카테고리 필터링 버튼 */}
          <Suspense fallback={<div className="h-12" />}>
            <HomeProductFilter />
          </Suspense>

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
