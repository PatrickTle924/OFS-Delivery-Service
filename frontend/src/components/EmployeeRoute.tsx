"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function EmployeeRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.replace("/login-register");
      return;
    }

    if (user.role !== "employee") {
      router.replace("/");
    }
  }, [user, router]);

  if (!user || user.role !== "employee") return null;

  return <>{children}</>;
}
