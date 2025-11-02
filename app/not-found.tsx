import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-4">페이지를 찾을 수 없습니다</h2>
        <p className="text-muted-foreground mb-8">
          요청하신 페이지가 존재하지 않습니다.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/">
            <Button>홈으로 가기</Button>
          </Link>
          <Link href="/products">
            <Button variant="outline">상품 보기</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}

