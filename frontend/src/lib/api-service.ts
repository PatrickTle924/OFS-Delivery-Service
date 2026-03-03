import { Order } from "@/types/delivery";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL; //will change later when Flask set up

export const fetchOrders = async (): Promise<Order[]> => {
  const response = await fetch(`${API_BASE_URL}/orders`);
  if (!response.ok) throw new Error('Failed to fetch orders');
  return response.json();
};