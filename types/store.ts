export type Product = {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  mrp: number;
  stock: number;
  rating: number;
  review_count: number;
  brand: string;
  image_url: string;
  category_name?: string;
  category_slug?: string;
  featured?: number;
};

export type CartItem = Product & { quantity: number };
