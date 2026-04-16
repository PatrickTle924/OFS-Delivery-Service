import { RegisterInput, LoginInput, UserRole } from "@/types/auth";
import { Product } from "@/types/shop";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export interface AuthResponse {
  message: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: UserRole;
  };
  token?: string;
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
  currentPassword: string;
  newPassword: string;
}

export interface OrderHistoryItem {
  order_id: number;
  ordered_at: string | null;
  total_cost: number;
  status: string;
  item_count: number;
  delivery_address: string;
  total_weight: number;
}

const getToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
};

const getAuthHeaders = (): HeadersInit => {
  const token = getToken();

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export async function optimizeRoutes(orderIds: number[]) {
  const res = await fetch(`${API_BASE_URL}/optimize-routes`, {
    method: "POST",
    headers: getAuthHeaders(),
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
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Failed to approve route");
  }

  return data;
}

export async function fetchActiveDelivery() {
  const res = await fetch(`${API_BASE_URL}/active-delivery`, {
    headers: getAuthHeaders(),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Failed to fetch active delivery");
  }

  return data;
}

export async function startTrip(tripId: number) {
  const res = await fetch(`${API_BASE_URL}/start-trip/${tripId}`, {
    method: "POST",
    headers: getAuthHeaders(),
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
    headers: getAuthHeaders(),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Failed to advance trip");
  }

  return data;
}

export function startSimulation(
  tripId: number,
  onUpdate: (activeDelivery: any) => void,
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
  const res = await fetch(`${API_BASE_URL}/orders`, {
    headers: getAuthHeaders(),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Failed to fetch orders");
  }

  return data;
}

export const fetchProducts = async (): Promise<Product[]> => {
  const response = await fetch(`${API_BASE_URL}/products`, {
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to fetch products");
  }

  return data;
};

export const registerUser = async (
  data: RegisterInput,
): Promise<{ message: string }> => {
  const response = await fetch(`${API_BASE_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || "Registration failed");
  }

  return result;
};

export const loginUser = async (
  credentials: LoginInput,
): Promise<AuthResponse> => {
  const res = await fetch(`${API_BASE_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Invalid credentials");
  }

  if (typeof window !== "undefined") {
    if (data.token) {
      localStorage.setItem("token", data.token);
    }

    if (data.user) {
      localStorage.setItem("user", JSON.stringify(data.user));
    }
  }

  return data;
};

export const fetchUserProfile = async (): Promise<ProfileResponse> => {
  const response = await fetch(`${API_BASE_URL}/profile`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to fetch profile");
  }

  return data;
};

export const fetchOrderHistory = async (): Promise<OrderHistoryItem[]> => {
  const response = await fetch(`${API_BASE_URL}/orders/history`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to fetch order history");
  }

  return data;
};

export const changePassword = async (
  data: ChangePasswordInput,
): Promise<{ message: string }> => {
  const response = await fetch(`${API_BASE_URL}/change-password`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || "Failed to change password");
  }

  return result;
};

export async function fetchInventory() {
  const res = await fetch(`${API_BASE_URL}/inventory`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Failed to fetch inventory");
  }

  return data;
}

export const logoutUser = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }
};
