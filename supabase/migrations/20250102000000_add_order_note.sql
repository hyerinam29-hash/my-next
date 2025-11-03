-- 주문 테이블에 order_note 필드 추가
-- 주문 시 배송 요청사항이나 메모를 저장하기 위한 필드

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS order_note TEXT;

