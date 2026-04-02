export type Category = 'cases' | 'chargers' | 'cables';

export interface Product {
  id: string;
  name: { az: string; ru: string; en: string };
  description: { az: string; ru: string; en: string };
  price: number;
  discount_price?: number;
  category: Category;
  image_url: string;
  colors: string[];
  in_stock: boolean;
  stock: number;
  specs: { az: string[]; ru: string[]; en: string[] };
  status: string;
  created_at: string;
}
