-- ==========================================
-- 상품 상세 정보 필드 추가 마이그레이션
-- 성분(ingredients), 복용법(dosage), 주의사항(precautions) 추가
-- ==========================================

-- products 테이블에 새로운 컬럼 추가
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS ingredients TEXT,
ADD COLUMN IF NOT EXISTS dosage TEXT,
ADD COLUMN IF NOT EXISTS precautions TEXT;

-- 주석 추가 (필드 설명)
COMMENT ON COLUMN public.products.ingredients IS '상품의 주요 성분 정보';
COMMENT ON COLUMN public.products.dosage IS '복용법 및 용법용량';
COMMENT ON COLUMN public.products.precautions IS '주의사항 및 부작용 정보';

