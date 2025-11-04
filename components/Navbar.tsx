"use client";

import { SignedOut, SignInButton, SignedIn, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { getCartItems } from "@/actions/cart";

/**
 * @file components/Navbar.tsx
 * @description 헤더 네비게이션 바 컴포넌트
 *
 * 주요 기능:
 * 1. 메인 네비게이션 링크 제공
 * 2. 장바구니 수량 표시 (배지)
 * 3. 로그인 상태에 따른 UI 분기
 * 4. 장바구니 변경 시 실시간 수량 갱신
 *
 * @dependencies
 * - @clerk/nextjs: Clerk 인증
 * - @/actions/cart: 장바구니 Server Actions
 * - next/navigation: 경로 변경 감지
 */

const Navbar = () => {
  const { isSignedIn } = useAuth();
  const pathname = usePathname();
  const [cartItemCount, setCartItemCount] = useState(0);

  // 장바구니 수량 조회 함수 (useCallback으로 메모이제이션)
  const loadCartCount = useCallback(async () => {
    try {
      const result = await getCartItems();
      if (result.success && result.data) {
        // 아이템 개수로 계산 (각 아이템의 수량이 아닌 서로 다른 상품의 개수)
        const itemCount = result.data.length;
        setCartItemCount(itemCount);
        console.log("🛒 장바구니 아이템 개수:", itemCount);
      } else {
        setCartItemCount(0);
      }
    } catch (error) {
      console.error("❌ 장바구니 수량 조회 실패:", error);
      setCartItemCount(0);
    }
  }, []);

  useEffect(() => {
    if (isSignedIn) {
      loadCartCount();
    } else {
      setCartItemCount(0);
    }
  }, [isSignedIn, loadCartCount]);

  // 경로 변경 시마다 수량 갱신 (페이지 이동 감지)
  useEffect(() => {
    if (isSignedIn) {
      loadCartCount();
    }
  }, [pathname, isSignedIn, loadCartCount]);

  // 장바구니 변경 이벤트 리스너 (실시간 갱신)
  useEffect(() => {
    if (!isSignedIn) return;

    const handleCartUpdate = () => {
      console.log("🔄 장바구니 변경 이벤트 감지 - 수량 갱신 중...");
      loadCartCount();
    };

    // 커스텀 이벤트 리스너 추가
    window.addEventListener("cart-updated", handleCartUpdate);
    
    // 페이지 포커스 시에도 갱신
    const handleFocus = () => {
      loadCartCount();
    };
    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("cart-updated", handleCartUpdate);
      window.removeEventListener("focus", handleFocus);
    };
  }, [isSignedIn, loadCartCount]);

  return (
    <header className="flex justify-between items-center p-4 gap-4 h-16 max-w-7xl mx-auto">
      <Link href="/" className="text-2xl font-bold">
        시니어 영양제 쇼핑몰
      </Link>
      <nav className="flex gap-4 items-center">
        <Link href="/products">
          <Button variant="ghost">상품</Button>
        </Link>
        <Link href="/best">
          <Button variant="ghost">베스트 상품</Button>
        </Link>
        <SignedIn>
          <Link href="/cart" className="relative">
            <Button variant="ghost">장바구니</Button>
            {cartItemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center min-w-[20px]">
                {cartItemCount > 99 ? "99+" : cartItemCount}
              </span>
            )}
          </Link>
          <Link href="/orders">
            <Button variant="ghost">주문내역</Button>
          </Link>
          <Link href="/mypage">
            <Button variant="ghost">마이페이지</Button>
          </Link>
        </SignedIn>
        <SignedOut>
          <SignInButton mode="modal">
            <Button>로그인</Button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <UserButton />
        </SignedIn>
      </nav>
    </header>
  );
};

export default Navbar;
