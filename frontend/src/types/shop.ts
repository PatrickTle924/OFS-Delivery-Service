export type Category = "Fruits" | "Vegetables" | "Meats" | "Dairy" | "Bakery" | "Pantry";

export interface Product {
  id: number;
  name: string;
  category: Category;
  price: number;
  weight: number; // lbs
  stock: number;
  description: string;
  imageUrl: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export const DELIVERY_THRESHOLD = 20; // lbs
export const DELIVERY_FEE = 10;       // dollars

export const CATEGORY_STYLES: Record<Category, { bg: string; text: string; dot: string }> = {
  Fruits:     { bg: "bg-[#fef3e8]", text: "text-clay",        dot: "bg-clay" },
  Vegetables: { bg: "bg-[#edf7f0]", text: "text-sage",        dot: "bg-sage" },
  Meats:      { bg: "bg-[#fdeaea]", text: "text-[#b94040]",   dot: "bg-[#b94040]" },
  Dairy:      { bg: "bg-[#eef4fb]", text: "text-[#3a6fa8]",   dot: "bg-[#3a6fa8]" },
  Bakery:     { bg: "bg-[#fdf6e8]", text: "text-[#a0782a]",   dot: "bg-[#a0782a]" },
  Pantry:     { bg: "bg-[#f0ede8]", text: "text-forest",      dot: "bg-forest" },
};