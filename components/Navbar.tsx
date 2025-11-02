import { SignedOut, SignInButton, SignedIn, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import React from "react";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  return (
    <header className="flex justify-between items-center p-4 gap-4 h-16 max-w-7xl mx-auto">
      <Link href="/" className="text-2xl font-bold">
        쇼핑몰
      </Link>
      <nav className="flex gap-4 items-center">
        <Link href="/products">
          <Button variant="ghost">상품</Button>
        </Link>
        <SignedIn>
          <Link href="/cart">
            <Button variant="ghost">장바구니</Button>
          </Link>
          <Link href="/orders">
            <Button variant="ghost">주문내역</Button>
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
