import { Order } from "@/types/delivery";
import { RegisterInput, LoginInput, UserRole } from "@/types/auth";
import { Product } from "@/types/shop";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL; //will change later when Flask set up

// an auth response interface
export interface AuthResponse {
  message: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: UserRole;
  };
  token?: string; // add JWT logic later
}

export interface ProfileResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  createdAt: string | null;
  role: UserRole;
}

export interface ChangePasswordInput {
  email: string;
  currentPassword: string;
  newPassword: string;
}

//order services
export const fetchOrders = async (): Promise<Order[]> => {
  const response = await fetch(`${API_BASE_URL}/orders`);
  if (!response.ok) throw new Error('Failed to fetch orders');
  return response.json();
};

export const fetchProducts = async (): Promise<Product[]> => {
  const response = await fetch(`${API_BASE_URL}/products`);
  if (!response.ok) throw new Error('Failed to fetch products');
  return response.json();
};

// auth services
export const registerUser = async (data: RegisterInput): Promise<{ message: string }> => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Registration failed');
  }

  return response.json();
};

//new func to allow users to log in
export const loginUser = async (credentials: LoginInput): Promise<AuthResponse> => {
  const res = await fetch(`${API_BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  if (!res.ok) throw new Error("Invalid credentials");
  return res.json();
};

export const fetchUserProfile = async (email: string): Promise<ProfileResponse> => {
  const response = await fetch(`${API_BASE_URL}/profile?email=${encodeURIComponent(email)}`);

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error || 'Failed to fetch profile');
  }

  return response.json();
};

export const changePassword = async (data: ChangePasswordInput): Promise<{ message: string }> => {
  const response = await fetch(`${API_BASE_URL}/change-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error || "Failed to change password");
  }

  return response.json();
};
