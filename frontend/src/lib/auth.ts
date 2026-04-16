import type { UserRole } from "@/types/auth";

export interface StoredUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
}

export const getStoredUser = (): StoredUser | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const storedUser = window.localStorage.getItem("ofsUser");
    return storedUser ? (JSON.parse(storedUser) as StoredUser) : null;
  } catch {
    return null;
  }
};

export const isCustomerUser = (user: StoredUser | null) => user?.role === "customer";
