import { RegisterInput, LoginInput, UserRole } from "@/types/auth";
import type { ActiveDelivery } from "@/types/routing";
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

  tripId?: string | null;
  tripStatus?: string | null;
  eta?: number | null;
  routeGeometry?: { type: "LineString"; coordinates: number[][] } | null;
  traveledPath?: { type: "LineString"; coordinates: number[][] } | null;
  robotPosition?: { lng: number; lat: number } | null;
  mapPoints?: {
    lng: number;
    lat: number;
    label: string;
    completed: boolean;
  }[];
}

const getToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
};

const getAuthHeaders = (isFormData = false): HeadersInit => {
  const token = getToken();

  return {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
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

export const logoutUser = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }
};

export const fetchOrderDetails = async (orderId: number) => {
  const response = await fetch(`${API_BASE_URL}/orders/${orderId}`);

  if (!response.ok) {
    throw new Error("Failed to fetch order details");
  }

  return response.json();
};

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  weight: string;
  price: number;
  reorderLevel: number;
  image_url: string;
  image?: File,
  lastRestocked: string;
}

export async function fetchInventory(): Promise<InventoryItem[]> {
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

export async function createProduct(productData: FormData) {
  const res = await fetch(`${API_BASE_URL}/products`, {
    method: "POST",
    headers: getAuthHeaders(true),
    body: productData,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Failed to add product");
  }

  return data;
}

export async function updateProduct(
  productId: string,
  productData: FormData,
) {
  const res = await fetch(`${API_BASE_URL}/products/${productId}`, {
    method: "PUT",
    headers: getAuthHeaders(true),
    body: productData,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Failed to update product");
  }

  return data;
}



export async function deleteProduct(productId: string) {
  const res = await fetch(`${API_BASE_URL}/products/${productId}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Failed to delete product");
  }

  return data;
}

export interface PlaceOrderInput {
  deliveryInfo: {
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    zipCode: string;
    instructions: string;
  };
  items: {
    product: {
      id: number;
      name: string;
      price: number;
      weight: number;
    };
    quantity: number;
  }[];
  subtotal: number;
  deliveryFee: number;
  tax: number;
  total: number;
  total_weight: number;
}

export interface PlaceOrderResponse {
  message: string;
  order_id: number;
}

export async function placeOrder(
  payload: PlaceOrderInput,
): Promise<PlaceOrderResponse> {
  const response = await fetch(`${API_BASE_URL}/orders`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || "Failed to place order");
  }

  return data;
}

export interface ReportItem {
  report_id: number;
  order_id: number;
  customer_id: number;
  report_type: string;
  description: string;
  status: "open" | "in_review" | "resolved";
  created_at: string;
}

export async function fetchReports(): Promise<ReportItem[]> {
  const response = await fetch(`${API_BASE_URL}/reports`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || "Failed to fetch reports");
  }

  return data;
}

export async function updateReportStatus(
  reportId: number,
  status: "open" | "in_review" | "resolved",
): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE_URL}/reports/${reportId}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({ status }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || "Failed to update report");
  }

  return data;
}
export interface EmployeeOrderItem {
  id: number;
  label: string;
  customerId?: number;
  customerName?: string;
  weight: number;
  address: string;
  city: string;
  state: string;
  zip: string;
  price: number;
  lat: number | null;
  lng: number | null;
  status: string;
  orderedAt: string | null;
  completedAt?: string | null;
}

export async function fetchAllOrders(): Promise<EmployeeOrderItem[]> {
  const res = await fetch(`${API_BASE_URL}/orders/all`, {
    headers: getAuthHeaders(),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Failed to fetch all orders");
  }

  return data;
}

export async function cancelRoute(tripId: number) {
  const res = await fetch(`${API_BASE_URL}/cancel-route/${tripId}`, {
    method: "POST",
    headers: getAuthHeaders(),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Failed to cancel route");
  }

  return data;
}

export interface ActiveOrderItem {
  order_id: number;
  ordered_at: string | null;
  total_cost: number;
  status: string;
  item_count: number;
  delivery_address: string;
  total_weight: number;
  tripId?: string | null;
  tripStatus?: string | null;
  eta?: number | null;
  routeGeometry?: { type: "LineString"; coordinates: number[][] } | null;
  traveledPath?: { type: "LineString"; coordinates: number[][] } | null;
  robotPosition?: { lng: number; lat: number } | null;
  mapPoints?: {
    lng: number;
    lat: number;
    label: string;
    completed: boolean;
  }[];
}

export const fetchActiveOrders = async (): Promise<ActiveOrderItem[]> => {
  const response = await fetch(`${API_BASE_URL}/orders/active`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to fetch active orders");
  }

  return data;
};
