import { Order } from "@/types/delivery";
import { RegisterInput, LoginInput, UserRole } from "@/types/auth";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL; //will change later when Flask set up

// an auth response interface
export interface AuthResponse {
  message: string;
  user?: {
    id: string;
    firstName: string;
    role: UserRole;
  };
  token?: string; // add JWT logic later
}

// auth services
export const registerUser = async (data: RegisterInput) => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Registration failed");
  }

  return response.json();
};

export async function loginUser(credentials: {
  email: string;
  password: string;
}) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Login failed");
  }

  return data;
}

export async function fetchOrders() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders`);

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Failed to fetch orders");
  }

  return data;
}

export async function optimizeRoutes(orderIds: number[]) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/optimize-routes`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ orderIds }),
    },
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Failed to optimize routes");
  }

  return data;
}
