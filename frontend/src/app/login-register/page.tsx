"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { registerUser, loginUser } from "@/lib/api-service";
import type { RegisterInput } from "@/types/auth";

type Mode = "login" | "register";
type Role = "customer" | "employee";

interface FormState {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  employeeId: string;
}

const INITIAL_FORM: FormState = {
  email: "",
  password: "",
  confirmPassword: "",
  firstName: "",
  lastName: "",
  phone: "",
  address: "",
  employeeId: "",
};

const PERKS: string[] = [
  "Free delivery on orders under 20 lbs",
  "Real-time order tracking",
  "Secure Stripe-powered checkout",
  "Smart route optimization",
];

// ── Reusable field component ───────────────────────────────────────
interface FieldProps {
  label: string;
  name: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function Field({
  label,
  name,
  type,
  placeholder,
  value,
  onChange,
}: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={name}
        className="text-xs font-medium text-[#444] tracking-wide"
      >
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="px-4 py-3 rounded-xl border-[1.5px] border-[#ddd] bg-white/80 text-sm text-[#1a1a14] placeholder:text-[#bbb] outline-none focus:border-sage focus:ring-2 focus:ring-sage/10 transition-all duration-200 backdrop-blur-sm"
      />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────
export default function LoginRegisterPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [role, setRole] = useState<Role>("customer");
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "register") {
        if (form.password !== form.confirmPassword) {
          throw new Error("Passwords do not match.");
        }
        const registrationPayload: RegisterInput =
          role === "customer"
            ? {
                firstName: form.firstName,
                lastName: form.lastName,
                email: form.email,
                phone: form.phone,
                password: form.password,
                role: "customer",
                deliveryAddress: form.address,
              }
            : {
                firstName: form.firstName,
                lastName: form.lastName,
                email: form.email,
                phone: form.phone,
                password: form.password,
                role: "employee",
                employeeId: form.employeeId,
              };

        await registerUser(registrationPayload);

        setMode("login");
        setForm(INITIAL_FORM);
        setError("Registration successful! Please sign in.");
      } else {
        const response = await loginUser({
          email: form.email,
          password: form.password,
        });
        if (typeof window !== "undefined" && response.user) {
          localStorage.setItem("ofsUser", JSON.stringify(response.user));
          window.dispatchEvent(new Event("ofs-auth-changed"));
        }
        router.push("/user/browse");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (next: Mode): void => {
    setMode(next);
    setForm(INITIAL_FORM);
    setError(null);
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 font-dm">
      {/* ══════════════════════════════
          LEFT PANEL
      ══════════════════════════════ */}
      <div className="hidden md:flex flex-col justify-between px-12 py-10 relative overflow-hidden bg-forest">
        {/* Layered radial gradients */}
        <div className="absolute top-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(168,213,181,0.22)_0%,transparent_65%)] pointer-events-none" />
        <div className="absolute top-[35%] left-[-20%] w-[400px] h-[400px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(74,124,89,0.30)_0%,transparent_65%)] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[10%] w-[350px] h-[350px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(196,133,90,0.14)_0%,transparent_65%)] pointer-events-none" />
        <div className="absolute bottom-[-5%] left-[-5%] w-[300px] h-[300px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(168,213,181,0.12)_0%,transparent_65%)] pointer-events-none" />

        {/* Logo */}
        <Link
          href="/"
          className="font-playfair text-2xl text-cream tracking-tight relative z-10"
        >
          OFS<span className="text-mint italic">.</span>
        </Link>

        {/* Body */}
        <div className="relative z-10">
          <h2 className="font-playfair text-5xl text-cream leading-[1.15] mb-5">
            Eat <em className="text-mint not-italic italic">fresh</em>,
            <br />
            live better.
          </h2>
          <p className="text-cream/55 font-light leading-relaxed max-w-xs mb-10 text-base">
            Order organic groceries from San Jose&apos;s favourite local food
            retailer — and get them delivered straight to your door.
          </p>
          <ul className="flex flex-col gap-3.5">
            {PERKS.map((perk) => (
              <li
                key={perk}
                className="flex items-center gap-3 text-cream/75 text-sm font-light"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-mint flex-shrink-0" />
                {perk}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-cream/25 text-xs relative z-10">
          © 2025 OFS — San Jose, CA
        </p>
      </div>

      {/* ══════════════════════════════
          RIGHT PANEL
      ══════════════════════════════ */}
      <div className="flex items-center justify-center px-6 py-12 md:px-12 bg-cream relative overflow-hidden">
        {/* Right-panel radial gradients */}
        <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(168,213,181,0.25)_0%,transparent_65%)] pointer-events-none" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[450px] h-[450px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(196,133,90,0.12)_0%,transparent_65%)] pointer-events-none" />
        <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(74,124,89,0.06)_0%,transparent_70%)] pointer-events-none" />

        <div className="w-full max-w-[400px] relative z-10">
          {/* Header */}
          <div className="mb-8">
            <h3 className="font-playfair text-3xl text-forest mb-1.5">
              {mode === "login" ? "Welcome back" : "Create account"}
            </h3>
            <p className="text-sm text-[#666] font-light">
              {mode === "login"
                ? "Sign in to your OFS account"
                : "Join OFS and start ordering today"}
            </p>
          </div>

          {/* Mode toggle */}
          <div className="flex bg-warm/80 backdrop-blur-sm rounded-xl p-1 mb-6 gap-1 border border-warm">
            {(["login", "register"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={`flex-1 py-2.5 rounded-[10px] text-sm font-medium transition-all duration-200 ${
                  mode === m
                    ? "bg-white text-forest shadow-sm"
                    : "text-[#888] hover:text-forest"
                }`}
              >
                {m === "login" ? "Sign In" : "Register"}
              </button>
            ))}
          </div>

          {/* Role selector — register only */}
          {mode === "register" && (
            <div className="flex gap-3 mb-6">
              {[
                { value: "customer" as Role, label: "Customer" },
                { value: "employee" as Role, label: "Employee" },
              ].map((r) => (
                <button
                  key={r.value}
                  onClick={() => setRole(r.value)}
                  className={`flex-1 flex items-center justify-center py-2.5 px-4 rounded-xl border-[1.5px] text-sm font-medium transition-all duration-200 ${
                    role === r.value
                      ? "border-sage text-forest bg-gradient-to-br from-mint/20 to-sage/10 shadow-sm"
                      : "border-[#ddd] text-[#777] bg-white/70 hover:border-sage/40"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          )}

          {/* Error / success message */}
          {error && (
            <div
              className={`text-xs px-4 py-3 rounded-xl mb-5 font-medium ${
                error.startsWith("Registration successful")
                  ? "bg-mint/20 text-sage border border-mint/40"
                  : "bg-[#fdeaea] text-[#b94040] border border-[#f5c0c0]"
              }`}
            >
              {error}
            </div>
          )}

          {/* Fields */}
          <div className="flex flex-col gap-4 mb-5">
            {mode === "register" && (
              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="First Name"
                  name="firstName"
                  type="text"
                  placeholder="Jane"
                  value={form.firstName}
                  onChange={handleChange}
                />
                <Field
                  label="Last Name"
                  name="lastName"
                  type="text"
                  placeholder="Doe"
                  value={form.lastName}
                  onChange={handleChange}
                />
              </div>
            )}

            <Field
              label="Email Address"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
            />

            {mode === "register" && (
              <Field
                label="Phone Number"
                name="phone"
                type="tel"
                placeholder="+1 (408) 555-0100"
                value={form.phone}
                onChange={handleChange}
              />
            )}

            {mode === "register" && role === "customer" && (
              <Field
                label="Delivery Address"
                name="address"
                type="text"
                placeholder="123 Main St, San Jose, CA"
                value={form.address}
                onChange={handleChange}
              />
            )}

            {mode === "register" && role === "employee" && (
              <Field
                label="Employee ID"
                name="employeeId"
                type="text"
                placeholder="EMP-12345"
                value={form.employeeId}
                onChange={handleChange}
              />
            )}

            <Field
              label="Password"
              name="password"
              type="password"
              placeholder={
                mode === "register"
                  ? "Min. 10 characters"
                  : "Enter your password"
              }
              value={form.password}
              onChange={handleChange}
            />

            {mode === "register" && (
              <Field
                label="Confirm Password"
                name="confirmPassword"
                type="password"
                placeholder="Repeat password"
                value={form.confirmPassword}
                onChange={handleChange}
              />
            )}
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-forest text-cream font-medium py-3.5 rounded-xl hover:bg-sage disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-base mb-5 shadow-lg shadow-forest/20"
          >
            {loading
              ? "Processing..."
              : mode === "login"
                ? "Sign In →"
                : "Create Account →"}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-warm to-transparent" />
            <span className="text-xs text-[#aaa]">or</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-warm to-transparent" />
          </div>

          {/* Switch mode */}
          <p className="text-center text-sm text-[#777]">
            {mode === "login" ? (
              <>
                Don&apos;t have an account?{" "}
                <button
                  onClick={() => switchMode("register")}
                  className="text-sage font-medium underline underline-offset-2 hover:text-forest transition-colors"
                >
                  Register now
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  onClick={() => switchMode("login")}
                  className="text-sage font-medium underline underline-offset-2 hover:text-forest transition-colors"
                >
                  Sign in
                </button>
              </>
            )}
          </p>

          <p className="text-center mt-5">
            <Link
              href="/"
              className="text-xs text-[#aaa] hover:text-sage transition-colors"
            >
              ← Back to homepage
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
