import { ImageIcon } from "lucide-react";
import type { Product } from "@/types/product";
import { cn } from "@/lib/utils";
import Link from "next/link";

/**
 * @file components/product-card.tsx
 * @description 상품 카드 컴포넌트
 *
 * 상품 정보를 카드 형태로 표시하는 재사용 가능한 컴포넌트입니다.
 * Placeholder 이미지, 상품명, 가격, 카테고리를 표시합니다.
 */
interface ProductCardProps {
  product: Product;
  className?: string;
}

export default function ProductCard({ product, className }: ProductCardProps) {
  // 가격을 한국 원화 형식으로 포맷팅
  const formattedPrice = new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
  }).format(Number(product.price));

  return (
    <Link href={`/products/${product.id}`} className={cn(
      "group flex flex-col bg-card border rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer block",
      className
    )}>
      {/* Unsplash 이미지 */}
      <div className="w-full aspect-square bg-muted flex items-center justify-center relative overflow-hidden">
        <img
          src={`https://source.unsplash.com/400x400/?supplement,${encodeURIComponent(product.category.toLowerCase().replace(' & ', ' '))},health`}
          alt={product.name}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => {
            // Fallback to placeholder if image fails to load
            const target = e.target as HTMLImageElement;
            target.src = `https://via.placeholder.com/400x400/6366f1/ffffff?text=${encodeURIComponent(product.name)}`;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* 상품 정보 */}
      <div className="p-4 flex flex-col gap-2">
        {/* 카테고리 */}
        {product.category && (
          <span className="text-xs text-muted-foreground uppercase tracking-wide">
            {product.category}
          </span>
        )}

        {/* 상품명 */}
        <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
          {product.name}
        </h3>

        {/* 상품 설명 (선택적) */}
        {product.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {product.description}
          </p>
        )}

        {/* 가격 및 재고 정보 */}
        <div className="flex items-center justify-between mt-auto pt-2">
          <span className="text-xl font-bold text-primary">{formattedPrice}</span>
          {product.stock_quantity > 0 ? (
            <span className="text-xs text-muted-foreground">
              재고 {product.stock_quantity}개
            </span>
          ) : (
            <span className="text-xs text-destructive">품절</span>
          )}
        </div>
      </div>
    </Link>
  );
}

