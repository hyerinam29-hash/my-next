-- ==========================================
-- 상품 샘플 데이터 삽입
-- 이미지 없음 (NULL), 금액 설정 포함
-- ==========================================

-- 기존 샘플 데이터 삭제 (이미 있다면)
DELETE FROM public.products;

-- 시니어 영양제 샘플 데이터 삽입 (이미지 없음, 금액 설정)
INSERT INTO public.products (name, description, price, stock_quantity, image_url, category) VALUES
-- 관절/뼈 건강 (5개)
('Premium Joint Flex', '관절 유연성과 편안함을 위한 고급 포뮬러. 글루코사민, 콘드로이틴, MSM 함유.', 45900, 100, NULL, 'Joint & Bone Health'),
('Calcium & Vitamin D3', '강한 뼈와 치아 건강에 필수적. 비타민 D3가 흡수를 돕습니다.', 25000, 160, NULL, 'Joint & Bone Health'),
('Turmeric Curcumin Complex', '관절 건강과 전반적인 웰빙을 위한 천연 항염증제.', 36500, 105, NULL, 'Joint & Bone Health'),
('Collagen Peptides', '피부, 관절, 뼈 건강을 위한 고품질 콜라겐 펩타이드.', 52000, 85, NULL, 'Joint & Bone Health'),
('Magnesium Glycinate', '근육 이완과 뼈 건강 지원. 흡수율이 높은 글리시네이트 형태.', 32000, 125, NULL, 'Joint & Bone Health'),

-- 면역 지원 (4개)
('Immune Boost Pro', '비타민 C, D, 아연, 에키나시아로 건강한 면역 체계 지원.', 32500, 150, NULL, 'Immune Support'),
('Elderberry Immune Syrup', '항산화 성분이 풍부한 엘더베리로 자연 면역 지원.', 27500, 110, NULL, 'Immune Support'),
('Vitamin C 1000mg', '면역 방어와 피부 건강을 위한 강력한 항산화제.', 18000, 190, NULL, 'Immune Support'),
('Zinc Immune Complex', '면역 기능과 세포 건강을 위한 아연 복합체.', 28000, 140, NULL, 'Immune Support'),

-- 종합 비타민 및 미네랄 (3개)
('Senior Daily Multivitamin', '시니어를 위한 종합 비타민과 미네랄. 전반적인 건강 지원.', 28900, 200, NULL, 'Multivitamin & Mineral'),
('B-Complex for Seniors', '에너지 대사와 신경계 건강 지원.', 20000, 140, NULL, 'Multivitamin & Mineral'),
('Hair, Skin & Nails Formula', '바이오틴과 콜라겐으로 건강한 모발, 피부, 손톱 지원.', 29900, 135, NULL, 'Multivitamin & Mineral'),

-- 인지 및 기억력 (2개)
('Brain Power Nootropic', '인지 기능, 기억력, 집중력 향상. 은행나무, 바코파 모니에라 함유.', 55000, 80, NULL, 'Cognitive & Memory'),
('Lion''s Mane Mushroom Extract', '뇌 건강, 기억력, 신경 성장 인자 지원.', 41000, 95, NULL, 'Cognitive & Memory'),

-- 심장 건강 (2개)
('Omega-3 Heart Health', '심혈관 지원을 위한 고함량 생선 오일. EPA와 DHA 풍부.', 40000, 120, NULL, 'Heart Health'),
('CoQ10 Energy Complex', '세포 에너지 생산 촉진과 심장 건강 지원.', 49900, 75, NULL, 'Heart Health'),

-- 소화 건강 (1개)
('Probiotic Gut Restore', '건강한 소화와 장내 세균총 균형을 위한 100억 CFUs 프로바이오틱스.', 29900, 130, NULL, 'Digestive Health'),

-- 눈 건강 (1개)
('Lutein & Zeaxanthin Eye Care', '블루라이트와 시력 저하로부터 눈 보호. 시니어 시력 지원.', 48200, 90, NULL, 'Eye Health'),

-- 수면 및 스트레스 (1개)
('Sleep Well Melatonin Gummies', '수면 주기 조절과 휴식 취진. 베리 맛 젤리.', 22000, 180, NULL, 'Sleep & Stress'),

-- 에너지 및 활력 (1개)
('Ginseng Energy Booster', '지속적인 에너지와 스트레스 감소를 위한 자연 아답토젠.', 33000, 115, NULL, 'Energy & Vitality');

