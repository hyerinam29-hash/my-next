"use client";

import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

/**
 * @file components/home-product-filter.tsx
 * @description 홈페이지 상품 필터링 컴포넌트
 *
 * 홈페이지에서 카테고리별로 상품을 필터링하는 버튼 그룹입니다.
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

// 표시할 카테고리 목록
const displayCategories: DisplayCategory[] = ["all", "multivitamin", "immune", "joint", "others"];

export default function HomeProductFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentCategory = (searchParams.get("category") || "all") as DisplayCategory;

  const handleFilterClick = useCallback(
    (category: DisplayCategory) => {
      const params = new URLSearchParams(searchParams.toString());
      if (category === "all") {
        params.delete("category");
      } else {
        params.set("category", category);
      }
      router.push(`/?${params.toString()}`);
      // 스크롤을 필터 위치로 이동
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [router, searchParams]
  );

  return (
    <div className="flex flex-wrap gap-3 mb-6">
      {displayCategories.map((category) => (
        <Button
          key={category}
          onClick={() => handleFilterClick(category)}
          variant={currentCategory === category ? "default" : "outline"}
          className="rounded-full"
        >
          {displayCategoryMap[category]}
        </Button>
      ))}
    </div>
  );
}

