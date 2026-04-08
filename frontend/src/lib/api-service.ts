import { Order } from "@/types/delivery";
import { RegisterInput, LoginInput, UserRole } from "@/types/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export interface AuthResponse {
  message: string;
  user?: {
    id: string;
    firstName: string;
    role: UserRole;
  };
  token?: string;
}

export const registerUser = async (data: RegisterInput) => {
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

export async function loginUser(credentials: LoginInput) {
  const res = await fetch(`${API_BASE_URL}/login`, {
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
  const res = await fetch(`${API_BASE_URL}/orders`);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Failed to fetch orders");
  }

  return data;
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
