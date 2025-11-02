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

-- 5. 실제 상품 데이터 삽입 (시니어 영양제 5개)
---------------------------------------------------------------------------------------------------

INSERT INTO public.products (name, description, price, stock_quantity, image_url, category) VALUES
('센트룸 실버 포 맨&우먼', '시니어 종합비타민 대표, 남녀 50대 이상 맞춤 포뮬러', 35000, 200, 'https://ucarecdn.com/6b8afb41-ab8d-4c74-8e6b-5048db17ac7b/centrum_silver.jpg', 'Multivitamin & Mineral'),
('뉴트리라이트 더블엑스', '비타민, 미네랄, 식물영양소까지 종합적으로 보충', 45000, 150, 'https://ucarecdn.com/16cdedb8-a151-41ce-912d-29484e4521a6/double_x.jpg', 'Multivitamin & Mineral'),
('솔가 프리미엄 오메가3', '심혈관·뇌 건강과 혈행 개선을 위한 고함량 오메가3', 52000, 120, 'https://ucarecdn.com/4e6d8396-2e11-4030-b284-c4fa68c94774/solgar_omega3.jpg', 'Heart Health'),
('바이탈뷰티 메타그린 슬림', '소화·체지방 관리에 좋은 녹차/식물추출 성분 영양제', 28000, 180, 'https://ucarecdn.com/1b7e2990-cd5c-4fc3-bb83-786bb3d1ef81/meta_green.jpg', 'Digestive Health'),
('종근당 프리미엄 MSM', '관절 건강, 연골 관리에 특화된 MSM 복합 영양제', 32000, 160, 'https://ucarecdn.com/566d8f2b-9d09-4e3b-940e-3311ad3f6c3d/kdpharma_msm.jpg', 'Joint & Bone Health');

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
