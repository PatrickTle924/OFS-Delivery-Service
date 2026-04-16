import { RegisterInput, LoginInput, UserRole } from "@/types/auth";
import type { ActiveDelivery } from "@/types/routing";
import { Product } from "@/types/shop";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL; //will change later when Flask set up

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

export async function optimizeRoutes(orderIds: number[]) {
  const res = await fetch(`${API_BASE_URL}/optimize-routes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ orderIds }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Failed to optimize routes");
  }

  return data;
}

export async function approveRoute(payload: {
  routeData: {
    orderIds: number[];
    estimatedTime: number;
    totalDistance: number;
    totalWeight: number;
    routeGeometry?: { type: "LineString"; coordinates: number[][] } | null;
  };
  orderIds: number[];
}) {
  const res = await fetch(`${API_BASE_URL}/approve-route`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Failed to approve route");
  }

  return data;
}

export async function fetchActiveDelivery() {
  const res = await fetch(`${API_BASE_URL}/active-delivery`);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Failed to fetch active delivery");
  }

  return data;
}

export async function startTrip(tripId: number) {
  const res = await fetch(`${API_BASE_URL}/start-trip/${tripId}`, {
    method: "POST",
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Failed to start trip");
  }

  return data;
}

export async function advanceTrip(tripId: number) {
  const res = await fetch(`${API_BASE_URL}/trip-progress/${tripId}`, {
    method: "POST",
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Failed to advance trip");
  }

  return data;
}

export function startSimulation(
  tripId: number,
  onUpdate: (activeDelivery: ActiveDelivery | null) => void,
  onComplete?: () => void,
  intervalMs: number = 1000,
) {
  const interval = setInterval(async () => {
    try {
      const progress = await advanceTrip(tripId);

      onUpdate(progress.activeDelivery ?? null);

      if (progress.completed) {
        clearInterval(interval);
        onComplete?.();
      }
    } catch (err) {
      console.error("Simulation error:", err);
      clearInterval(interval);
    }
  }, intervalMs);

  return interval;
}

export async function fetchOrders() {
  const res = await fetch(`${API_BASE_URL}/orders`);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Failed to fetch orders");
  }

  return data;
}

export const fetchProducts = async (): Promise<Product[]> => {
  const response = await fetch(`${API_BASE_URL}/products`);
  if (!response.ok) throw new Error("Failed to fetch products");
  return response.json();
};

// auth services
export const registerUser = async (
  data: RegisterInput,
): Promise<{ message: string }> => {
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

//new func to allow users to log in
export const loginUser = async (
  credentials: LoginInput,
): Promise<AuthResponse> => {
  const res = await fetch(`${API_BASE_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
  if (!res.ok) throw new Error("Invalid credentials");
  return res.json();
};

export const fetchUserProfile = async (
  email: string,
): Promise<ProfileResponse> => {
  const response = await fetch(
    `${API_BASE_URL}/profile?email=${encodeURIComponent(email)}`,
  );

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.error || "Failed to fetch profile");
  }

  return response.json();
};

export const changePassword = async (
  data: ChangePasswordInput,
): Promise<{ message: string }> => {
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

export const fetchOrderDetails = async (orderId: number) => {
  const response = await fetch(`${API_BASE_URL}/orders/${orderId}`);

  if (!response.ok) {
    throw new Error("Failed to fetch order details");
  }

  return response.json();
};
