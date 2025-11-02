import { supabase } from "@/lib/supabase/client";
import ProductCard from "@/components/product-card";
import type { Product } from "@/types/product";
import { Button } from "@/components/ui/button";
import Link from "next/link";

/**
 * @file app/products/page.tsx
 * @description 상품 목록 페이지
 *
 * 카테고리 필터링 및 페이지네이션을 지원하는 상품 목록 페이지입니다.
 */

const categoryMap: Record<string, string> = {
  electronics: "전자제품",
  clothing: "의류",
  books: "도서",
  food: "식품",
  sports: "스포츠",
  beauty: "뷰티",
  home: "생활/가정",
};

interface ProductsPageProps {
  searchParams: Promise<{ category?: string; page?: string }>;
}

export default async function ProductsPage({
  searchParams,
}: ProductsPageProps) {
  const params = await searchParams;
  const category = params.category;
  const currentPage = parseInt(params.page || "1", 10);
  const itemsPerPage = 12;

  console.group("📦 상품 목록 페이지 조회");

  let products: Product[] = [];
  let categories: string[] = [];
  let totalCount = 0;

  try {
    // 카테고리 목록 조회
    const { data: allProducts } = await supabase
      .from("products")
      .select("category")
      .eq("is_active", true);

    if (allProducts) {
      const uniqueCategories = Array.from(
        new Set(allProducts.map((p) => p.category).filter(Boolean))
      ) as string[];
      categories = uniqueCategories;
    }

    // 상품 조회 (카테고리 필터링)
    let query = supabase
      .from("products")
      .select("*", { count: "exact" })
      .eq("is_active", true);

    if (category) {
      query = query.eq("category", category);
    }

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);

    if (error) {
      console.error("❌ 상품 조회 실패:", error);
      throw error;
    }

    products = (data as Product[]) || [];
    totalCount = count || 0;

    console.log(`✅ ${products.length}개의 상품 조회 성공`);
    console.log(`📂 필터: ${category || "전체"}`);
  } catch (error) {
    console.error("❌ 상품 데이터 로드 중 오류:", error);
  }

  console.groupEnd();

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  return (
    <main className="min-h-[calc(100vh-80px)] px-4 py-8 lg:py-12">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <section className="mb-8">
          <h1 className="text-4xl font-bold mb-4">상품 목록</h1>
          {category && (
            <p className="text-muted-foreground">
              카테고리: {categoryMap[category] || category}
            </p>
          )}
        </section>

        {/* 카테고리 필터 */}
        <section className="mb-8">
          <div className="flex flex-wrap gap-3">
            <Link href="/products">
              <Button
                variant={!category ? "default" : "outline"}
                className="rounded-full"
              >
                전체
              </Button>
            </Link>
            {categories.map((cat) => (
              <Link key={cat} href={`/products?category=${cat}`}>
                <Button
                  variant={category === cat ? "default" : "outline"}
                  className="rounded-full"
                >
                  {categoryMap[cat] || cat}
                </Button>
              </Link>
            ))}
          </div>
        </section>

        {/* 상품 그리드 */}
        {products.length > 0 ? (
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
              <section className="flex justify-center items-center gap-2">
                {currentPage > 1 && (
                  <Link href={`/products?page=${currentPage - 1}${category ? `&category=${category}` : ""}`}>
                    <Button variant="outline">이전</Button>
                  </Link>
                )}
                <span className="text-sm text-muted-foreground">
                  페이지 {currentPage} / {totalPages}
                </span>
                {currentPage < totalPages && (
                  <Link href={`/products?page=${currentPage + 1}${category ? `&category=${category}` : ""}`}>
                    <Button variant="outline">다음</Button>
                  </Link>
                )}
              </section>
            )}
          </>
        ) : (
          <section className="text-center py-16">
            <p className="text-muted-foreground">상품이 없습니다.</p>
          </section>
        )}
      </div>
    </main>
  );
}

