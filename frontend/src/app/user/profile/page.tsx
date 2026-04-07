"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

// ── Types ──────────────────────────────────────────────────────────
type OrderStatus = "pending" | "out_for_delivery" | "delivered" | "cancelled";

interface Order {
  id: string;
  placedAt: string;
  status: OrderStatus;
  items: { name: string; quantity: number; price: number }[];
  totalPrice: number;
  totalWeight: number;
  deliveryFee: number;
}

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  createdAt: string;
}

type ActiveTab = "profile" | "orders";

// ── Mock data (replace with GET /api/profile and GET /api/orders) ──
const MOCK_USER: UserProfile = {
  firstName: "Sukhjot",
  lastName: "Singh",
  email: "sukhjot@example.com",
  phone: "+1 (408) 555-0192",
  address: "123 Main St, San Jose, CA 95101",
  createdAt: "January 2025",
};

const MOCK_ORDERS: Order[] = [
  {
    id: "ORD-0041",
    placedAt: "March 14, 2025",
    status: "delivered",
    items: [
      { name: "Organic Fuji Apples", quantity: 2, price: 4.99 },
      { name: "Baby Spinach", quantity: 1, price: 2.99 },
      { name: "Sourdough Loaf", quantity: 1, price: 7.49 },
    ],
    totalPrice: 20.46,
    totalWeight: 6.25,
    deliveryFee: 0,
  },
  {
    id: "ORD-0038",
    placedAt: "March 9, 2025",
    status: "delivered",
    items: [
      { name: "Grass-Fed Ground Beef", quantity: 1, price: 13.49 },
      { name: "Organic Whole Milk", quantity: 1, price: 5.29 },
      { name: "Aged Cheddar", quantity: 2, price: 6.99 },
    ],
    totalPrice: 32.76,
    totalWeight: 13.6,
    deliveryFee: 0,
  },
  {
    id: "ORD-0031",
    placedAt: "February 28, 2025",
    status: "delivered",
    items: [
      { name: "Wild Salmon Fillet", quantity: 2, price: 16.99 },
      { name: "Extra Virgin Olive Oil", quantity: 1, price: 12.99 },
      { name: "Organic Brown Rice", quantity: 2, price: 3.99 },
    ],
    totalPrice: 54.95,
    totalWeight: 13.5,
    deliveryFee: 0,
  },
  {
    id: "ORD-0028",
    placedAt: "February 20, 2025",
    status: "out_for_delivery",
    items: [
      { name: "Greek Yogurt", quantity: 3, price: 4.49 },
      { name: "Fresh Blueberries", quantity: 2, price: 5.49 },
    ],
    totalPrice: 24.45,
    totalWeight: 7.5,
    deliveryFee: 0,
  },
];

// ── Status config ──────────────────────────────────────────────────
const STATUS_CONFIG: Record<OrderStatus, { label: string; bg: string; text: string; dot: string }> = {
  pending:          { label: "Processing",       bg: "bg-[#fdf6e8]", text: "text-[#a0782a]", dot: "bg-[#a0782a]" },
  out_for_delivery: { label: "Out for Delivery", bg: "bg-[#eef4fb]", text: "text-[#3a6fa8]", dot: "bg-[#3a6fa8]" },
  delivered:        { label: "Delivered",        bg: "bg-[#edf7f0]", text: "text-sage",       dot: "bg-sage" },
  cancelled:        { label: "Cancelled",        bg: "bg-[#fdeaea]", text: "text-[#b94040]",  dot: "bg-[#b94040]" },
};

// ── Icons ──────────────────────────────────────────────────────────
const IconEdit = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const IconSave = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
    <polyline points="17 21 17 13 7 13 7 21"/>
    <polyline points="7 3 7 8 15 8"/>
  </svg>
);

const IconX = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const IconUser = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const IconOrders = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <polyline points="21 8 21 21 3 21 3 8"/>
    <rect x="1" y="3" width="22" height="5" rx="1"/>
    <line x1="10" y1="12" x2="14" y2="12"/>
  </svg>
);

const IconLocation = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
    <circle cx="12" cy="9" r="2.5"/>
  </svg>
);

const IconPhone = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.62 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 5.5 5.5l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);

const IconMail = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);

const IconCalendar = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const IconTrack = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);

// ── Field component ────────────────────────────────────────────────
interface EditFieldProps {
  label: string;
  value: string;
  name: string;
  type?: string;
  icon: React.ReactNode;
  editing: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function EditField({ label, value, name, type = "text", icon, editing, onChange }: EditFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-forest/50 tracking-wide flex items-center gap-1.5">
        <span className="text-forest/40">{icon}</span>
        {label}
      </label>
      {editing ? (
        <input
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          className="px-4 py-2.5 rounded-xl border-[1.5px] border-sage/40 bg-white text-sm text-forest outline-none focus:border-sage focus:ring-2 focus:ring-sage/10 transition-all duration-200"
        />
      ) : (
        <p className="text-sm text-forest font-light px-1">{value}</p>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────
export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("profile");
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState<UserProfile>(MOCK_USER);
  const [draft, setDraft] = useState<UserProfile>(MOCK_USER);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDraft((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = () => {
    // TODO: PATCH /api/profile
    setProfile(draft);
    setEditing(false);
  };

  const handleCancel = () => {
    setDraft(profile);
    setEditing(false);
  };

  const initials = `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase();

  return (
    <div className="min-h-screen bg-cream font-dm relative">

      {/* Background gradients */}
      <div className="pointer-events-none fixed top-[-10%] left-[-10%] w-150 h-150 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(168,213,181,0.18)_0%,transparent_65%)] -z-10" />
      <div className="pointer-events-none fixed bottom-[-10%] right-[-10%] w-150 h-150 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(196,133,90,0.10)_0%,transparent_65%)] -z-10" />
      <div className="pointer-events-none fixed top-[40%] right-[20%] w-100 h-100 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(74,124,89,0.06)_0%,transparent_65%)] -z-10" />

      <Navbar alwaysFrosted />

      <div className="max-w-4xl mx-auto px-8 pt-28 pb-16">

        {/* ── Profile hero card ── */}
        <div className="relative bg-forest rounded-3xl px-8 py-10 mb-8 overflow-hidden">
          {/* Gradients inside card */}
          <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-[radial-gradient(ellipse_at_top_right,rgba(168,213,181,0.18)_0%,transparent_65%)] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-60 h-60 rounded-full bg-[radial-gradient(ellipse_at_bottom_left,rgba(196,133,90,0.12)_0%,transparent_65%)] pointer-events-none" />

          <div className="relative z-10 flex items-center gap-6">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-2xl bg-sage/40 border-2 border-mint/30 flex items-center justify-center shrink-0">
              <span className="font-playfair text-3xl text-cream">{initials}</span>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-mint/70 text-xs font-medium tracking-[0.12em] uppercase mb-1">OFS Customer</p>
              <h1 className="font-playfair text-3xl text-cream mb-1">
                {profile.firstName} {profile.lastName}
              </h1>
              <p className="text-cream/50 text-sm font-light flex items-center gap-1.5">
                <IconCalendar />
                Member since {profile.createdAt}
              </p>
            </div>

            <Link
              href="/user/browse"
              className="hidden md:inline-flex items-center gap-2 bg-cream/10 hover:bg-cream/20 text-cream text-sm font-medium px-5 py-2.5 rounded-full border border-cream/20 transition-all duration-200"
            >
              Shop Now →
            </Link>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-2 mb-8">
          {([
            { key: "profile" as ActiveTab, label: "My Profile", icon: <IconUser /> },
            { key: "orders"  as ActiveTab, label: "Order History", icon: <IconOrders /> },
          ]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border-[1.5px] ${
                activeTab === tab.key
                  ? "bg-forest text-cream border-forest shadow-md shadow-forest/20"
                  : "bg-white/70 text-forest/60 border-warm hover:border-sage/40 hover:text-forest"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* ════════════════════════════
            PROFILE TAB
        ════════════════════════════ */}
        {activeTab === "profile" && (
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl border border-white/80 shadow-sm p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="font-playfair text-2xl text-forest">Personal Information</h2>
                <p className="text-xs text-forest/45 font-light mt-1">
                  Manage your account details and delivery address.
                </p>
              </div>

              {!editing ? (
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-2 bg-warm/60 hover:bg-warm text-forest text-sm font-medium px-4 py-2.5 rounded-xl transition-all duration-200 border border-warm"
                >
                  <IconEdit />
                  Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleCancel}
                    className="flex items-center gap-2 bg-white text-forest/60 text-sm font-medium px-4 py-2.5 rounded-xl transition-all duration-200 border border-warm hover:border-forest/20"
                  >
                    <IconX />
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-2 bg-forest text-cream text-sm font-medium px-4 py-2.5 rounded-xl transition-all duration-200 hover:bg-sage shadow-sm shadow-forest/20"
                  >
                    <IconSave />
                    Save
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <EditField
                label="First Name"
                name="firstName"
                value={editing ? draft.firstName : profile.firstName}
                icon={<IconUser />}
                editing={editing}
                onChange={handleChange}
              />
              <EditField
                label="Last Name"
                name="lastName"
                value={editing ? draft.lastName : profile.lastName}
                icon={<IconUser />}
                editing={editing}
                onChange={handleChange}
              />
              <EditField
                label="Email Address"
                name="email"
                type="email"
                value={editing ? draft.email : profile.email}
                icon={<IconMail />}
                editing={editing}
                onChange={handleChange}
              />
              <EditField
                label="Phone Number"
                name="phone"
                type="tel"
                value={editing ? draft.phone : profile.phone}
                icon={<IconPhone />}
                editing={editing}
                onChange={handleChange}
              />
              <div className="sm:col-span-2">
                <EditField
                  label="Delivery Address"
                  name="address"
                  value={editing ? draft.address : profile.address}
                  icon={<IconLocation />}
                  editing={editing}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-warm/80 my-8" />

            {/* Danger zone */}
            <div>
              <h3 className="text-sm font-medium text-forest/60 mb-4">Account</h3>
              <div className="flex flex-wrap gap-3">
                <button className="text-xs font-medium text-forest/50 hover:text-forest border border-warm hover:border-forest/20 px-4 py-2 rounded-xl transition-all duration-200">
                  Change Password
                </button>
                <button className="text-xs font-medium text-[#b94040] border border-[#f5c0c0] hover:bg-[#fdeaea] px-4 py-2 rounded-xl transition-all duration-200">
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════
            ORDER HISTORY TAB
        ════════════════════════════ */}
        {activeTab === "orders" && (
          <div className="flex flex-col gap-4">
            {MOCK_ORDERS.length === 0 ? (
              <div className="bg-white/70 rounded-3xl border border-white/80 p-16 text-center">
                <p className="font-playfair text-2xl text-forest/40 mb-2">No orders yet</p>
                <p className="text-sm text-forest/30 font-light mb-6">
                  Your order history will appear here once you&apos;ve placed your first order.
                </p>
                <Link
                  href="/user/browse"
                  className="inline-block bg-forest text-cream text-sm font-medium px-6 py-3 rounded-full hover:bg-sage transition-colors duration-200"
                >
                  Start Shopping →
                </Link>
              </div>
            ) : (
              MOCK_ORDERS.map((order) => {
                const status = STATUS_CONFIG[order.status];
                return (
                  <div
                    key={order.id}
                    className="bg-white/70 backdrop-blur-sm rounded-3xl border border-white/80 shadow-sm p-6 hover:shadow-md transition-shadow duration-200"
                  >
                    {/* Order header */}
                    <div className="flex items-start justify-between gap-4 mb-5">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-playfair text-lg text-forest">{order.id}</span>
                          <span className={`inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-widest px-2.5 py-1 rounded-full ${status.bg} ${status.text}`}>
                            <span className={`w-1 h-1 rounded-full ${status.dot} ${order.status === "out_for_delivery" ? "animate-pulse" : ""}`} />
                            {status.label}
                          </span>
                        </div>
                        <p className="text-xs text-forest/45 font-light flex items-center gap-1.5">
                          <IconCalendar />
                          {order.placedAt}
                        </p>
                      </div>

                      {order.status === "out_for_delivery" && (
                        <Link
                          href={`/user/track?order=${order.id}`}
                          className="flex items-center gap-1.5 text-xs font-medium text-[#3a6fa8] bg-[#eef4fb] hover:bg-[#ddeaf7] px-3.5 py-2 rounded-xl transition-colors duration-200 shrink-0"
                        >
                          <IconTrack />
                          Track Order
                        </Link>
                      )}
                    </div>

                    {/* Order items */}
                    <div className="flex flex-col gap-1.5 mb-5">
                      {order.items.map((item, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span className="text-forest/70 font-light">
                            {item.name}
                            <span className="text-forest/35 ml-1.5">× {item.quantity}</span>
                          </span>
                          <span className="text-forest/60 font-medium text-xs">
                            ${(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Order footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-warm/60">
                      <div className="flex items-center gap-4 text-xs text-forest/40 font-light">
                        <span>{order.totalWeight.toFixed(1)} lbs</span>
                        <span>
                          Delivery:{" "}
                          <span className={order.deliveryFee === 0 ? "text-sage font-medium" : "text-forest"}>
                            {order.deliveryFee === 0 ? "Free" : `$${order.deliveryFee.toFixed(2)}`}
                          </span>
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-forest/35 font-light uppercase tracking-wide">Total</p>
                        <p className="font-playfair text-xl text-forest">
                          ${(order.totalPrice + order.deliveryFee).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}