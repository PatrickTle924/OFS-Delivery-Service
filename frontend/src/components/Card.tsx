"use client";

import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
  onClick?: () => void;
}

export function Card({
  children,
  className = "",
  interactive = false,
  onClick,
}: CardProps) {
  const base =
    "rounded-2xl bg-white overflow-hidden border border-[var(--color-warm)]";
  const shadow = "[box-shadow:var(--card-shadow)]";
  const hover = interactive
    ? "cursor-pointer hover:[box-shadow:var(--card-shadow-hover)] hover:border-[var(--color-mint)] transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-sage)]"
    : "";

  if (interactive) {
    return (
      <button
        onClick={onClick}
        className={`${base} ${shadow} ${hover} w-full text-left ${className}`}
      >
        {children}
      </button>
    );
  }

  return <div className={`${base} ${shadow} ${className}`}>{children}</div>;
}

export function CardBody({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`p-5 ${className}`}>{children}</div>;
}

export function CardLabel({ children }: { children: ReactNode }) {
  return (
    <p
      className="text-[11px] font-medium uppercase tracking-widest mb-0.5"
      style={{ color: "var(--color-sage)" }}
    >
      {children}
    </p>
  );
}

export function CardTitle({ children }: { children: ReactNode }) {
  return (
    <h3
      style={{
        fontFamily: "'Playfair Display', serif",
        fontWeight: 600,
        fontSize: "1.15rem",
        color: "var(--color-forest)",
        lineHeight: 1.3,
      }}
    >
      {children}
    </h3>
  );
}

export function CardDivider() {
  return <hr style={{ borderColor: "var(--color-warm)" }} />;
}
