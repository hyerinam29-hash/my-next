import Link from "next/link";

/**
 * @file Footer.tsx
 * @description 사이트 푸터 컴포넌트
 *
 * 전체 사이트의 하단 푸터 영역을 담당하는 컴포넌트입니다.
 * 저작권 정보, 링크 등을 표시합니다.
 */
export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* 브랜드 섹션 */}
          <div className="flex flex-col gap-4">
            <h3 className="text-xl font-bold">SaaS Template</h3>
            <p className="text-sm text-muted-foreground">
              Next.js, Clerk, Supabase로 구동되는 쇼핑몰 템플릿입니다.
            </p>
          </div>

          {/* 링크 섹션 */}
          <div className="flex flex-col gap-4">
            <h4 className="font-semibold">링크</h4>
            <ul className="flex flex-col gap-2 text-sm">
              <li>
                <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
                  홈
                </Link>
              </li>
              <li>
                <Link href="/auth-test" className="text-muted-foreground hover:text-foreground transition-colors">
                  인증 테스트
                </Link>
              </li>
              <li>
                <Link href="/storage-test" className="text-muted-foreground hover:text-foreground transition-colors">
                  스토리지 테스트
                </Link>
              </li>
            </ul>
          </div>

          {/* 정보 섹션 */}
          <div className="flex flex-col gap-4">
            <h4 className="font-semibold">정보</h4>
            <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
              <li>© {currentYear} SaaS Template</li>
              <li>All rights reserved</li>
            </ul>
          </div>
        </div>

        {/* 하단 저작권 */}
        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>Built with Next.js, Clerk, and Supabase</p>
        </div>
      </div>
    </footer>
  );
}

