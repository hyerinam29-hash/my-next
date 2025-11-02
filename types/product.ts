/**
 * @file types/product.ts
 * @description 상품 관련 TypeScript 타입 정의
 */

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
  stock_quantity: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

