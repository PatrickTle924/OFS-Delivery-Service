export type OrderStatus = 'pending' | 'in-transit' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  customerName: string;
  items: string[];
  totalPrice: number;
  status: OrderStatus;
  createdAt: string;
}