import { supabase } from "@/lib/supabase/client";
import ProductCard from "@/components/product-card";
import type { Product } from "@/types/product";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Suspense } from "react";
import ProductsLoading from "@/components/products-loading";
import { AlertCircle } from "lucide-react";

/**
 * @file app/products/page.tsx
 * @description 상품 목록 페이지 - 반응형 그리드 레이아웃, 카테고리 필터링, 페이지네이션
 *
 * 주요 기능:
 * 1. Supabase에서 상품 데이터 조회 (카테고리 필터링 포함)
 * 2. 반응형 그리드 레이아웃으로 상품 표시 (모바일 1열, 태블릿 2열, 데스크톱 4열)
 * 3. 카테고리별 필터링 (전체, 종합비타민/미네랄, 면역지원, 관절/뼈건강, 기타)
 * 4. 페이지네이션 (페이지당 12개 상품)
 * 5. 로딩 상태 처리 (Suspense 활용)
 * 6. 에러 및 빈 상태 처리
 *
 * @dependencies
 * - @/lib/supabase/client: Supabase 클라이언트
 * - @/components/product-card: 상품 카드 컴포넌트
 * - @/components/products-loading: 로딩 스켈레톤 컴포넌트
 * - @/components/ui/button: shadcn/ui 버튼 컴포넌트
 */

// 대표 카테고리 타입 정의
type DisplayCategory = "all" | "multivitamin" | "immune" | "joint" | "others";

// 대표 카테고리 한글 표시
const displayCategoryMap: Record<DisplayCategory, string> = {
  all: "전체",
  multivitamin: "종합비타민/미네랄",
  immune: "면역지원",
  joint: "관절/뼈건강",
  others: "기타",
};

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

// 표시할 카테고리 목록
const displayCategories: DisplayCategory[] = ["multivitamin", "immune", "joint", "others"];

// 페이지당 상품 수
const ITEMS_PER_PAGE = 12;

interface ProductsPageProps {
  searchParams: Promise<{ category?: string; page?: string }>;
}

/**
 * URL 쿼리 파라미터 생성 헬퍼 함수
 * 카테고리와 페이지 파라미터를 일관되게 처리합니다.
 */
function buildQueryString(
  page?: number,
  category?: DisplayCategory | string
): string {
  const params = new URLSearchParams();

  // 페이지 파라미터 (1이 아닌 경우만 추가)
  if (page && page > 1) {
    params.set("page", page.toString());
  }

  // 카테고리 파라미터 (전체가 아닌 경우만 추가)
  if (category && category !== "all") {
    params.set("category", category);
  }

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
}

/**
 * 상품 목록 조회 함수
 */
async function fetchProducts(
  category?: string,
  page: number = 1
): Promise<{ products: Product[]; totalCount: number; error: Error | null }> {
  console.group("📦 상품 목록 페이지 조회");
  console.log(`📂 필터: ${category || "전체"}`);
  console.log(`📄 페이지: ${page}`);

  let products: Product[] = [];
  let totalCount = 0;
  let error: Error | null = null;

  try {
    // 상품 조회 쿼리 생성
    let query = supabase.from("products").select("*", { count: "exact" });

    // 대표 카테고리로 필터링
    if (category && category !== "all") {
      const categoryKey = category as DisplayCategory;
      const originalCategories = categoryGroups[categoryKey] || [];
      if (originalCategories.length > 0) {
        query = query.in("category", originalCategories);
        console.log(`🔍 필터링 카테고리: ${originalCategories.join(", ")}`);
      }
    }

    // 페이지네이션 적용
    const from = (page - 1) * ITEMS_PER_PAGE;
    const to = page * ITEMS_PER_PAGE - 1;

    const { data, error: queryError, count } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (queryError) {
      console.error("❌ 상품 조회 실패:", queryError);
      error = new Error(queryError.message || "상품 조회 중 오류가 발생했습니다.");
      throw queryError;
    }

    products = (data as Product[]) || [];
    totalCount = count || 0;

    console.log(`✅ ${products.length}개의 상품 조회 성공 (전체 ${totalCount}개)`);
  } catch (err) {
    console.error("❌ 상품 데이터 로드 중 오류:", err);
    if (!error) {
      error =
        err instanceof Error
          ? err
          : new Error("상품 데이터를 불러오는 중 오류가 발생했습니다.");
    }
  }

  console.groupEnd();
  return { products, totalCount, error };
}

/**
 * 상품 목록 콘텐츠 컴포넌트
 */
async function ProductsContent({
  category,
  currentPage,
}: {
  category?: string;
  currentPage: number;
}) {
  const { products, totalCount, error } = await fetchProducts(category, currentPage);

  // 에러 상태
  if (error) {
    return (
      <section className="text-center py-16">
        <div className="flex flex-col items-center gap-4">
          <AlertCircle className="w-12 h-12 text-destructive" />
          <div>
            <h2 className="text-xl font-semibold mb-2">상품을 불러올 수 없습니다</h2>
            <p className="text-muted-foreground">{error.message}</p>
          </div>
          <Link href="/products">
            <Button variant="outline">새로고침</Button>
          </Link>
        </div>
      </section>
    );
  }

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const validPage = Math.max(1, Math.min(currentPage, totalPages || 1));

  // 페이지 번호가 유효하지 않은 경우 (현재 페이지가 전체 페이지 수를 초과)
  if (currentPage !== validPage && totalPages > 0) {
    // 올바른 페이지로 리다이렉트 (Next.js는 동적 리다이렉트를 지원하지 않으므로,
    // 여기서는 경고만 표시하고 유효한 페이지 데이터를 표시)
    console.warn(`⚠️ 요청된 페이지(${currentPage})가 유효하지 않습니다. 페이지 1로 표시합니다.`);
  }

  // 빈 상태
  if (products.length === 0) {
    return (
      <section className="text-center py-16">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <svg
              className="w-8 h-8 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-2">상품이 없습니다</h2>
            <p className="text-muted-foreground">
              {category && category !== "all"
                ? `${displayCategoryMap[category as DisplayCategory]} 카테고리에 상품이 없습니다.`
                : "현재 등록된 상품이 없습니다."}
            </p>
          </div>
          {category && category !== "all" && (
            <Link href="/products">
              <Button variant="outline">전체 상품 보기</Button>
            </Link>
          )}
        </div>
      </section>
    );
  }

  // 정상 상태: 상품 그리드 및 페이지네이션
  return (
    <>
      <section className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <section className="flex justify-center items-center gap-4 mt-8">
          {validPage > 1 && (
            <Link
              href={`/products${buildQueryString(validPage - 1, category)}`}
              aria-label="이전 페이지"
            >
              <Button variant="outline">이전</Button>
            </Link>
          )}
          <span className="text-sm text-muted-foreground min-w-[120px] text-center">
            페이지 {validPage} / {totalPages}
          </span>
          {validPage < totalPages && (
            <Link
              href={`/products${buildQueryString(validPage + 1, category)}`}
              aria-label="다음 페이지"
            >
              <Button variant="outline">다음</Button>
            </Link>
          )}
        </section>
      )}
    </>
  );
}

/**
 * 상품 목록 페이지 메인 컴포넌트
 */
export default async function ProductsPage({
  searchParams,
}: ProductsPageProps) {
  const params = await searchParams;
  const category = (params.category || "all") as DisplayCategory;
  const currentPage = Math.max(1, parseInt(params.page || "1", 10));

  // 카테고리 필터링 URL 생성 헬퍼
  const getCategoryUrl = (cat: DisplayCategory | "all") => {
    return `/products${buildQueryString(1, cat === "all" ? undefined : cat)}`;
  };

  return (
    <main className="min-h-[calc(100vh-80px)] px-4 py-8 lg:py-12">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <section className="mb-8">
          <h1 className="text-4xl font-bold mb-4">상품 목록</h1>
          {category && category !== "all" && (
            <p className="text-muted-foreground">
              카테고리: {displayCategoryMap[category] || category}
            </p>
          )}
        </section>

        {/* 카테고리 필터 */}
        <section className="mb-8">
          <div className="flex flex-wrap gap-3">
            <Link href={getCategoryUrl("all")}>
              <Button
                variant={category === "all" ? "default" : "outline"}
                className="rounded-full"
              >
                전체
              </Button>
            </Link>
            {displayCategories.map((cat) => (
              <Link key={cat} href={getCategoryUrl(cat)}>
                <Button
                  variant={category === cat ? "default" : "outline"}
                  className="rounded-full"
                >
                  {displayCategoryMap[cat]}
                </Button>
              </Link>
            ))}
          </div>
        </section>

        {/* 상품 목록 (Suspense로 감싸서 로딩 상태 처리) */}
        <Suspense fallback={<ProductsLoading />}>
          <ProductsContent category={category} currentPage={currentPage} />
        </Suspense>
      </div>
    </main>
  );
}

