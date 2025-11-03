-- ==========================================
-- 시니어 영양제 쇼핑몰 MVP 스키마
-- Clerk + Supabase 연동
-- RLS 없이 애플리케이션 레벨에서 clerk_id로 필터링
-- ==========================================

-- RLS 비활성화 (개발용)
ALTER TABLE IF EXISTS public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.cart_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.inquiries DISABLE ROW LEVEL SECURITY;

-- 1. ENUM 타입 생성
---------------------------------------------------------------------------------------------------

-- 상품 카테고리
CREATE TYPE public.product_category AS ENUM (
    'Joint & Bone Health',
    'Immune Support',
    'Multivitamin & Mineral',
    'Cognitive & Memory',
    'Heart Health',
    'Digestive Health',
    'Eye Health',
    'Sleep & Stress',
    'Energy & Vitality'
);

-- 주문 상태
CREATE TYPE public.order_status AS ENUM (
    'Pending',
    'Processing',
    'Shipped',
    'Delivered',
    'Cancelled',
    'Refunded'
);

-- 문의 상태
CREATE TYPE public.inquiry_status AS ENUM (
    'Pending',
    'Answered',
    'Closed'
);

-- 2. 테이블 생성
---------------------------------------------------------------------------------------------------

-- 상품 테이블
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL CHECK (price > 0),
    stock_quantity INTEGER NOT NULL CHECK (stock_quantity >= 0),
    image_url TEXT,
    category product_category NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 장바구니 테이블
CREATE TABLE public.cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_id TEXT NOT NULL, -- Clerk User ID
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (clerk_id, product_id)
);

-- 주문 테이블
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_id TEXT NOT NULL, -- Clerk User ID
    order_date TIMESTAMPTZ DEFAULT NOW(),
    total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
    status order_status DEFAULT 'Pending',
    shipping_address TEXT NOT NULL,
    recipient_name VARCHAR(255) NOT NULL,
    recipient_phone VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 주문 상세 테이블
CREATE TABLE public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price_at_purchase NUMERIC(10, 2) NOT NULL CHECK (price_at_purchase > 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (order_id, product_id)
);

-- 1:1 문의 테이블
CREATE TABLE public.inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_id TEXT NOT NULL, -- Clerk User ID
    subject VARCHAR(255) NOT NULL,
    question TEXT NOT NULL,
    answer TEXT, -- NULL 가능 (관리자 답변 전)
    status inquiry_status DEFAULT 'Pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 트리거 및 함수 생성 (updated_at 자동 갱신)
---------------------------------------------------------------------------------------------------

-- updated_at 갱신 함수
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 각 테이블에 트리거 등록
CREATE TRIGGER set_products_timestamp BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER set_cart_items_timestamp BEFORE UPDATE ON public.cart_items FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER set_orders_timestamp BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER set_order_items_timestamp BEFORE UPDATE ON public.order_items FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER set_inquiries_timestamp BEFORE UPDATE ON public.inquiries FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- 4. 인덱스 생성 (성능 최적화)
---------------------------------------------------------------------------------------------------

CREATE INDEX idx_products_category ON public.products(category);
CREATE INDEX idx_products_name ON public.products USING GIN (to_tsvector('english', name));
CREATE INDEX idx_cart_items_clerk_id ON public.cart_items(clerk_id);
CREATE INDEX idx_cart_items_product_id ON public.cart_items(product_id);
CREATE INDEX idx_orders_clerk_id ON public.orders(clerk_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX idx_order_items_product_id ON public.order_items(product_id);
CREATE INDEX idx_inquiries_clerk_id ON public.inquiries(clerk_id);
CREATE INDEX idx_inquiries_status ON public.inquiries(status);

-- 5. 샘플 데이터 삽입 (시니어 영양제 20개)
---------------------------------------------------------------------------------------------------

INSERT INTO public.products (name, description, price, stock_quantity, image_url, category) VALUES
-- 관절/뼈 건강 (5개)
('Premium Joint Flex', '관절 유연성과 편안함을 위한 고급 포뮬러. 글루코사민, 콘드로이틴, MSM 함유.', 45900, 100, 'https://example.com/images/joint_flex.jpg', 'Joint & Bone Health'),
('Calcium & Vitamin D3', '강한 뼈와 치아 건강에 필수적. 비타민 D3가 흡수를 돕습니다.', 25000, 160, 'https://example.com/images/calcium_d3.jpg', 'Joint & Bone Health'),
('Turmeric Curcumin Complex', '관절 건강과 전반적인 웰빙을 위한 천연 항염증제.', 36500, 105, 'https://example.com/images/turmeric.jpg', 'Joint & Bone Health'),
('Collagen Peptides', '피부, 관절, 뼈 건강을 위한 고품질 콜라겐 펩타이드.', 52000, 85, 'https://example.com/images/collagen.jpg', 'Joint & Bone Health'),
('Magnesium Glycinate', '근육 이완과 뼈 건강 지원. 흡수율이 높은 글리시네이트 형태.', 32000, 125, 'https://example.com/images/magnesium.jpg', 'Joint & Bone Health'),

-- 면역 지원 (4개)
('Immune Boost Pro', '비타민 C, D, 아연, 에키나시아로 건강한 면역 체계 지원.', 32500, 150, 'https://example.com/images/immune_boost.jpg', 'Immune Support'),
('Elderberry Immune Syrup', '항산화 성분이 풍부한 엘더베리로 자연 면역 지원.', 27500, 110, 'https://example.com/images/elderberry.jpg', 'Immune Support'),
('Vitamin C 1000mg', '면역 방어와 피부 건강을 위한 강력한 항산화제.', 18000, 190, 'https://example.com/images/vitaminc.jpg', 'Immune Support'),
('Zinc Immune Complex', '면역 기능과 세포 건강을 위한 아연 복합체.', 28000, 140, 'https://example.com/images/zinc.jpg', 'Immune Support'),

-- 종합 비타민 및 미네랄 (3개)
('Senior Daily Multivitamin', '시니어를 위한 종합 비타민과 미네랄. 전반적인 건강 지원.', 28900, 200, 'https://example.com/images/multivitamin.jpg', 'Multivitamin & Mineral'),
('B-Complex for Seniors', '에너지 대사와 신경계 건강 지원.', 20000, 140, 'https://example.com/images/bcomplex.jpg', 'Multivitamin & Mineral'),
('Hair, Skin & Nails Formula', '바이오틴과 콜라겐으로 건강한 모발, 피부, 손톱 지원.', 29900, 135, 'https://example.com/images/hsn.jpg', 'Multivitamin & Mineral'),

-- 인지 및 기억력 (2개)
('Brain Power Nootropic', '인지 기능, 기억력, 집중력 향상. 은행나무, 바코파 모니에라 함유.', 55000, 80, 'https://example.com/images/brain_power.jpg', 'Cognitive & Memory'),
('Lion''s Mane Mushroom Extract', '뇌 건강, 기억력, 신경 성장 인자 지원.', 41000, 95, 'https://example.com/images/lions_mane.jpg', 'Cognitive & Memory'),

-- 심장 건강 (2개)
('Omega-3 Heart Health', '심혈관 지원을 위한 고함량 생선 오일. EPA와 DHA 풍부.', 40000, 120, 'https://example.com/images/omega3.jpg', 'Heart Health'),
('CoQ10 Energy Complex', '세포 에너지 생산 촉진과 심장 건강 지원.', 49900, 75, 'https://example.com/images/coq10.jpg', 'Heart Health'),

-- 소화 건강 (1개)
('Probiotic Gut Restore', '건강한 소화와 장내 세균총 균형을 위한 100억 CFUs 프로바이오틱스.', 29900, 130, 'https://example.com/images/probiotic.jpg', 'Digestive Health'),

-- 눈 건강 (1개)
('Lutein & Zeaxanthin Eye Care', '블루라이트와 시력 저하로부터 눈 보호. 시니어 시력 지원.', 48200, 90, 'https://example.com/images/eye_care.jpg', 'Eye Health'),

-- 수면 및 스트레스 (1개)
('Sleep Well Melatonin Gummies', '수면 주기 조절과 휴식 취진. 베리 맛 젤리.', 22000, 180, 'https://example.com/images/sleep_gummies.jpg', 'Sleep & Stress'),

-- 에너지 및 활력 (1개)
('Ginseng Energy Booster', '지속적인 에너지와 스트레스 감소를 위한 자연 아답토젠.', 33000, 115, 'https://example.com/images/ginseng.jpg', 'Energy & Vitality');

-- 샘플 장바구니 데이터
INSERT INTO public.cart_items (clerk_id, product_id, quantity) VALUES
('user_clerk_id_1', (SELECT id FROM public.products WHERE name = 'Premium Joint Flex'), 1),
('user_clerk_id_1', (SELECT id FROM public.products WHERE name = 'Immune Boost Pro'), 2),
('user_clerk_id_2', (SELECT id FROM public.products WHERE name = 'Senior Daily Multivitamin'), 1),
('user_clerk_id_2', (SELECT id FROM public.products WHERE name = 'Omega-3 Heart Health'), 1);

-- 샘플 주문 데이터
INSERT INTO public.orders (clerk_id, total_amount, status, shipping_address, recipient_name, recipient_phone) VALUES
('user_clerk_id_1', 78400, 'Delivered', '서울시 강남구 테헤란로 123, 아파트 101동 1001호', '김철수', '010-1234-5678'),
('user_clerk_id_2', 68900, 'Shipped', '부산시 해운대구 센텀중앙로 456, 빌라 5층', '이영희', '010-9876-5432'),
('user_clerk_id_3', 55000, 'Processing', '대구시 중구 동성로 789, 오피스텔 302호', '박민수', '010-5555-6666');

-- 샘플 주문 아이템 데이터
INSERT INTO public.order_items (order_id, product_id, quantity, price_at_purchase) VALUES
((SELECT id FROM public.orders WHERE clerk_id = 'user_clerk_id_1' AND total_amount = 78400 LIMIT 1), (SELECT id FROM public.products WHERE name = 'Premium Joint Flex'), 1, 45900),
((SELECT id FROM public.orders WHERE clerk_id = 'user_clerk_id_1' AND total_amount = 78400 LIMIT 1), (SELECT id FROM public.products WHERE name = 'Immune Boost Pro'), 1, 32500),
((SELECT id FROM public.orders WHERE clerk_id = 'user_clerk_id_2' AND total_amount = 68900 LIMIT 1), (SELECT id FROM public.products WHERE name = 'Senior Daily Multivitamin'), 1, 28900),
((SELECT id FROM public.orders WHERE clerk_id = 'user_clerk_id_2' AND total_amount = 68900 LIMIT 1), (SELECT id FROM public.products WHERE name = 'Omega-3 Heart Health'), 1, 40000),
((SELECT id FROM public.orders WHERE clerk_id = 'user_clerk_id_3' AND total_amount = 55000 LIMIT 1), (SELECT id FROM public.products WHERE name = 'Brain Power Nootropic'), 1, 55000);

-- 샘플 문의 데이터
INSERT INTO public.inquiries (clerk_id, subject, question, answer, status) VALUES
('user_clerk_id_1', '배송 문의', '주문한 상품 언제 도착하나요?', '귀하의 주문(주문번호: ORD001)은 3-5 영업일 내에 도착 예정입니다.', 'Answered'),
('user_clerk_id_2', '상품 성분 문의', 'Senior Daily Multivitamin의 전체 성분 목록을 알 수 있을까요?', 'FAQ 페이지나 고객센터로 연락주시면 상세한 성분 정보를 제공해드리겠습니다.', 'Answered'),
('user_clerk_id_3', '반품 정책 문의', '개봉한 상품도 반품 가능한가요?', '현재는 미개봉 상품만 반품 가능합니다. 개봉 상품은 교환이나 환불이 제한될 수 있습니다.', 'Answered');

-- 6. 권한 설정
---------------------------------------------------------------------------------------------------

-- 모든 테이블에 대한 권한 부여
GRANT ALL ON TABLE public.products TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.cart_items TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.orders TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.order_items TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.inquiries TO anon, authenticated, service_role;

-- 시퀀스 권한 (필요시)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
