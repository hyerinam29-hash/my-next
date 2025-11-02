## 쇼핑몰 MVP 개발 Todo 리스트 (PRD.md 기반)

### Phase 1: 기본 인프라 (1주)
- [x] Next.js 프로젝트 셋업
- [x] Supabase 프로젝트 생성 및 테이블 스키마 작성 (update_shopping_mall_schema.sql)
- [x] Clerk 연동 (회원가입/로그인)
  - [x] Clerk 환경 변수 설정 (.env.example 생성)
  - [x] Clerk Provider 설정
  - [x] SyncUserProvider 구현
  - [x] 미들웨어 설정
- [x] 기본 레이아웃 및 라우팅
  - [x] Root Layout 컴포넌트
  - [x] 헤더 컴포넌트
  - [x] 푸터 컴포넌트
  - [x] 기본 페이지 구조

### Phase 2: 상품 기능 (1주)
- [ ] 홈페이지
  - [ ] 메인 배너
  - [ ] 인기 상품 섹션
  - [ ] 카테고리 네비게이션
- [ ] 상품 목록 페이지
  - [ ] 상품 그리드 레이아웃
  - [ ] 상품 카드 컴포넌트
  - [ ] 페이지네이션
- [ ] 카테고리 필터링
  - [ ] 사이드바 필터
  - [ ] 카테고리별 필터링 로직
- [ ] 상품 상세 페이지
  - [ ] 상품 정보 표시
  - [ ] 수량 선택기
  - [ ] 장바구니 담기 버튼
- [ ] 어드민 상품 등록 (Supabase 직접)

### Phase 3: 장바구니 & 주문 (1주)
- [ ] 장바구니 기능
  - [ ] 장바구니 테이블 연동 (cart_items)
  - [ ] 상품 추가/삭제 API
  - [ ] 수량 변경 기능
  - [ ] 장바구니 페이지
- [ ] 주문 프로세스 구현
  - [ ] 주문 폼 컴포넌트
  - [ ] 배송 정보 입력
  - [ ] 주문 검증 로직

### Phase 4: 결제 통합 (1주)
- [ ] Toss Payments MCP 연동
  - [ ] Toss Payments 설정
  - [ ] 결제 위젯 구현
- [ ] 테스트 결제 구현
  - [ ] 결제 요청 로직
  - [ ] 결제 성공/실패 처리
- [ ] 결제 완료 후 주문 저장
  - [ ] 주문 데이터베이스 저장
  - [ ] 주문 아이템 저장

### Phase 5: 마이페이지 (0.5주)
- [ ] 주문 내역 조회
  - [ ] 주문 목록 페이지
  - [ ] 주문 상태 표시
- [ ] 주문 상세 보기
  - [ ] 주문 상세 정보
  - [ ] 주문 아이템 목록

### Phase 6: 테스트 & 배포 (0.5주)
- [ ] 전체 플로우 테스트
  - [ ] 회원가입 → 상품보기 → 장바구니 → 결제 → 주문완료
  - [ ] 에러 케이스 테스트
- [ ] 버그 수정
- [ ] Vercel 배포
  - [ ] 환경 변수 설정
  - [ ] 빌드 확인

### 추가 설정 파일들
- [ ] `.cursor/` 디렉토리
  - [ ] `rules/` 커서룰
  - [ ] `mcp.json` MCP 서버 설정
  - [ ] `dir.md` 프로젝트 디렉토리 구조
- [ ] `.github/` 디렉토리
- [ ] `.husky/` 디렉토리
- [ ] `app/` 디렉토리
  - [ ] `favicon.ico` 파일
  - [ ] `not-found.tsx` 파일
  - [ ] `robots.ts` 파일
  - [ ] `sitemap.ts` 파일
  - [ ] `manifest.ts` 파일
- [ ] `supabase/` 디렉토리 (완료)
- [ ] `public/` 디렉토리
  - [ ] `icons/` 디렉토리
  - [ ] `logo.png` 파일
  - [ ] `og-image.png` 파일
- [ ] `tsconfig.json` 파일
- [ ] `.cursorignore` 파일
- [ ] `.gitignore` 파일
- [ ] `.prettierignore` 파일
- [ ] `.prettierrc` 파일
- [ ] `eslint.config.mjs` 파일
- [ ] `AGENTS.md` 파일
