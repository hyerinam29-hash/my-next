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
      {/* 상품 이미지 (없을 경우 "no image" 표시) */}
      <div className="w-full aspect-square bg-muted flex items-center justify-center relative overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              // 이미지 로드 실패 시 "no image" 표시
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent && !parent.querySelector('.no-image-placeholder')) {
                const placeholder = document.createElement('div');
                placeholder.className = 'no-image-placeholder w-full h-full flex items-center justify-center';
                placeholder.innerHTML = '<div class="text-center"><svg class="w-16 h-16 mx-auto mb-2 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg><p class="text-sm text-muted-foreground">No Image</p></div>';
                parent.appendChild(placeholder);
              }
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <ImageIcon className="w-16 h-16 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No Image</p>
            </div>
          </div>
        )}
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

