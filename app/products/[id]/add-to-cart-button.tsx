"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useClerkSupabaseClient } from "@/lib/supabase/clerk-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Product } from "@/types/product";
import { useRouter } from "next/navigation";

interface AddToCartButtonProps {
  product: Product;
}

export default function AddToCartButton({ product }: AddToCartButtonProps) {
  const { userId, isSignedIn } = useAuth();
  const supabase = useClerkSupabaseClient();
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);

  const handleAddToCart = async () => {
    if (!isSignedIn || !userId) {
      router.push("/sign-in");
      return;
    }

    if (product.stock_quantity < quantity) {
      alert("재고가 부족합니다.");
      return;
    }

    setLoading(true);
    console.log("🛒 장바구니 추가 시작:", { productId: product.id, quantity });

    try {
      // 기존 장바구니 아이템 확인
      const { data: existingItem } = await supabase
        .from("cart_items")
        .select("*")
        .eq("clerk_id", userId)
        .eq("product_id", product.id)
        .single();

      if (existingItem) {
        // 기존 아이템이 있으면 수량 업데이트
        const newQuantity = existingItem.quantity + quantity;
        const { error } = await supabase
          .from("cart_items")
          .update({ quantity: newQuantity })
          .eq("id", existingItem.id);

        if (error) throw error;
        console.log("✅ 장바구니 수량 업데이트 성공");
      } else {
        // 새 아이템 추가
        const { error } = await supabase.from("cart_items").insert({
          clerk_id: userId,
          product_id: product.id,
          quantity,
        });

        if (error) throw error;
        console.log("✅ 장바구니 추가 성공");
      }

      alert("장바구니에 추가되었습니다!");
      router.push("/cart");
    } catch (error) {
      console.error("❌ 장바구니 추가 실패:", error);
      alert("장바구니 추가에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (product.stock_quantity === 0) {
    return (
      <Button disabled className="w-full" size="lg">
        품절
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <Label htmlFor="quantity">수량</Label>
        <Input
          id="quantity"
          type="number"
          min="1"
          max={product.stock_quantity}
          value={quantity}
          onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
          className="w-20"
        />
      </div>
      <Button
        onClick={handleAddToCart}
        disabled={loading || !isSignedIn}
        className="w-full"
        size="lg"
      >
        {loading ? "추가 중..." : isSignedIn ? "장바구니 담기" : "로그인 후 이용 가능"}
      </Button>
    </div>
  );
}

