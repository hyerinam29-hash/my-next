/**
 * @file types/product.ts
 * @description 상품 관련 TypeScript 타입 정의
 */

// 시니어 영양제 카테고리 타입
export type ProductCategory =
  | 'Joint & Bone Health'
  | 'Immune Support'
  | 'Multivitamin & Mineral'
  | 'Cognitive & Memory'
  | 'Heart Health'
  | 'Digestive Health'
  | 'Eye Health'
  | 'Sleep & Stress'
  | 'Energy & Vitality';

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock_quantity: number;
  image_url: string | null;
  category: ProductCategory;
  created_at: string;
  updated_at: string;
}

