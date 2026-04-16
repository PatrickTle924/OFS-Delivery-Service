"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function CustomerRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/login-register");
      return;
    }

    if (user.role !== "customer") {
      router.replace("/");
    }
  }, [user, loading, router]);

  if (loading) return null;
  if (!user || user.role !== "customer") return null;

  return <>{children}</>;
}
