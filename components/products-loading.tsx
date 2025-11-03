/**
 * @file components/products-loading.tsx
 * @description 상품 목록 로딩 스켈레톤 컴포넌트
 *
 * Suspense fallback으로 사용되는 로딩 상태 UI입니다.
 */

export default function ProductsLoading() {
  return (
    <div className="min-h-[calc(100vh-80px)] px-4 py-8 lg:py-12">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 스켈레톤 */}
        <div className="mb-8">
          <div className="h-10 w-48 bg-muted rounded animate-pulse mb-4" />
          <div className="h-6 w-32 bg-muted rounded animate-pulse" />
        </div>

        {/* 카테고리 필터 스켈레톤 */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-9 w-24 bg-muted rounded-full animate-pulse"
              />
            ))}
          </div>
        </div>

        {/* 상품 그리드 스켈레톤 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="flex flex-col bg-card border rounded-lg overflow-hidden"
            >
              {/* 이미지 스켈레톤 */}
              <div className="w-full aspect-square bg-muted animate-pulse" />
              {/* 정보 스켈레톤 */}
              <div className="p-4 flex flex-col gap-2">
                <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                <div className="h-6 w-full bg-muted rounded animate-pulse" />
                <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
                <div className="h-8 w-32 bg-muted rounded animate-pulse mt-2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

