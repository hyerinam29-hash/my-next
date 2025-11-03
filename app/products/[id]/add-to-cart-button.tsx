"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Product } from "@/types/product";
import { useRouter } from "next/navigation";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { addToCart } from "@/actions/cart";

/**
 * @file app/products/[id]/add-to-cart-button.tsx
 * @description 상품 장바구니 담기 컴포넌트 - 수량 선택기 및 장바구니 추가 버튼
 *
 * 주요 기능:
 * 1. 수량 선택 (증가/감소 버튼 및 직접 입력)
 * 2. 재고 확인 및 제한
 * 3. 장바구니 추가 (Server Action 사용)
 * 4. 로그인 상태 확인
 *
 * @dependencies
 * - @clerk/nextjs: Clerk 인증
 * - @/actions/cart: 장바구니 Server Actions
 * - @/components/ui/button, input, label: shadcn/ui 컴포넌트
 */

interface AddToCartButtonProps {
  product: Product;
}

export default function AddToCartButton({ product }: AddToCartButtonProps) {
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);

  // 수량 증가
  const handleIncrease = () => {
    if (quantity < product.stock_quantity) {
      setQuantity(quantity + 1);
    }
  };

  // 수량 감소
  const handleDecrease = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  // 수량 직접 입력 처리
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (isNaN(value) || value < 1) {
      setQuantity(1);
    } else if (value > product.stock_quantity) {
      setQuantity(product.stock_quantity);
    } else {
      setQuantity(value);
    }
  };

  // 장바구니 추가 핸들러
  const handleAddToCart = async () => {
    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }

    if (quantity < 1) {
      alert("수량은 1개 이상이어야 합니다.");
      return;
    }

    setLoading(true);
    console.group("🛒 장바구니 추가");
    console.log("📦 상품 ID:", product.id);
    console.log("🔢 수량:", quantity);

    try {
      const result = await addToCart(product.id, quantity);

      if (result.success) {
        console.log("✅ 장바구니 추가 성공:", result.message);
        console.groupEnd();
        
        // Navbar에 장바구니 변경 알림 (실시간 갱신)
        window.dispatchEvent(new CustomEvent("cart-updated"));
        
        alert(result.message || "장바구니에 추가되었습니다!");
        router.push("/cart");
      } else {
        const errorMessage = "error" in result ? result.error : "장바구니 추가에 실패했습니다. 다시 시도해주세요.";
        console.error("❌ 장바구니 추가 실패:", errorMessage);
        console.groupEnd();
        alert(errorMessage);
      }
    } catch (error) {
      console.error("❌ 장바구니 추가 중 오류 발생:", error);
      console.groupEnd();
      alert("장바구니 추가에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  // 품절 상태
  if (product.stock_quantity === 0) {
    return (
      <div className="flex flex-col gap-4">
        <div className="border rounded-lg p-4 bg-muted">
          <p className="text-center text-muted-foreground font-semibold">
            품절된 상품입니다
          </p>
        </div>
        <Button disabled className="w-full" size="lg">
          품절
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* 수량 선택기 */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="quantity" className="text-base font-semibold">
          수량
        </Label>
        <div className="flex items-center gap-2">
          {/* 감소 버튼 */}
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleDecrease}
            disabled={quantity <= 1 || loading}
            className="h-10 w-10"
            aria-label="수량 감소"
          >
            <Minus className="h-4 w-4" />
          </Button>

          {/* 수량 입력 */}
          <Input
            id="quantity"
            type="number"
            min="1"
            max={product.stock_quantity}
            value={quantity}
            onChange={handleQuantityChange}
            className="w-20 text-center font-semibold"
            disabled={loading}
            aria-label="수량"
          />

          {/* 증가 버튼 */}
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleIncrease}
            disabled={quantity >= product.stock_quantity || loading}
            className="h-10 w-10"
            aria-label="수량 증가"
          >
            <Plus className="h-4 w-4" />
          </Button>

          {/* 최대 재고 표시 */}
          <span className="text-sm text-muted-foreground ml-auto">
            (최대 {product.stock_quantity}개)
          </span>
        </div>
      </div>

      {/* 장바구니 담기 버튼 */}
      <Button
        onClick={handleAddToCart}
        disabled={loading || !isSignedIn || quantity < 1}
        className="w-full"
        size="lg"
      >
        {loading ? (
          <>
            <span className="mr-2">추가 중...</span>
          </>
        ) : !isSignedIn ? (
          "로그인 후 이용 가능"
        ) : (
          <>
            <ShoppingCart className="mr-2 h-5 w-5" />
            장바구니 담기
          </>
        )}
      </Button>

      {/* 로그인 안내 */}
      {!isSignedIn && (
        <p className="text-sm text-muted-foreground text-center">
          장바구니 기능은 로그인이 필요합니다.
        </p>
      )}
    </div>
  );
}

