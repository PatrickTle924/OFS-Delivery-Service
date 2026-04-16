"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { changePassword, fetchUserProfile } from "@/lib/api-service";
import { getStoredUser, isCustomerUser } from "@/lib/auth";

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  createdAt: string;
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const EMPTY_PROFILE: UserProfile = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  address: "",
  createdAt: "",
};

const EMPTY_PASSWORD_FORM: PasswordForm = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
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
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [profile, setProfile] = useState<UserProfile>(EMPTY_PROFILE);
  const [draft, setDraft] = useState<UserProfile>(EMPTY_PROFILE);
  const [passwordForm, setPasswordForm] = useState<PasswordForm>(EMPTY_PASSWORD_FORM);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordSaving, setPasswordSaving] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const storedUser = getStoredUser();

        if (!storedUser || !isCustomerUser(storedUser)) {
          throw new Error("Please sign in to view your profile.");
        }

        const userProfile = await fetchUserProfile(storedUser.email);
        const formattedProfile = {
          firstName: userProfile.firstName,
          lastName: userProfile.lastName,
          email: userProfile.email,
          phone: userProfile.phone,
          address: userProfile.address,
          createdAt: userProfile.createdAt
            ? new Date(userProfile.createdAt).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })
            : "",
        };

        setProfile(formattedProfile);
        setDraft(formattedProfile);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDraft((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setPasswordError(null);
    setPasswordSuccess(null);
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

  const handlePasswordCancel = () => {
    setChangingPassword(false);
    setPasswordForm(EMPTY_PASSWORD_FORM);
    setPasswordError(null);
    setPasswordSuccess(null);
  };

  const handlePasswordSave = async () => {
    try {
      setPasswordError(null);
      setPasswordSuccess(null);

      if (!profile.email) {
        throw new Error("We couldn't determine which account to update.");
      }

      if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
        throw new Error("Please fill out all password fields.");
      }

      if (passwordForm.newPassword.length < 8) {
        throw new Error("New password must be at least 8 characters.");
      }

      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        throw new Error("New passwords do not match.");
      }

      if (passwordForm.currentPassword === passwordForm.newPassword) {
        throw new Error("Choose a new password different from your current password.");
      }

      setPasswordSaving(true);
      const response = await changePassword({
        email: profile.email,
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      setPasswordSuccess(response.message);
      setChangingPassword(false);
      setPasswordForm(EMPTY_PASSWORD_FORM);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Failed to change password.");
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleSignOut = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("ofsUser");
      window.dispatchEvent(new Event("ofs-auth-changed"));
    }

    router.push("/login-register");
  };

  const initials = `${profile.firstName[0] ?? ""}${profile.lastName[0] ?? ""}`.toUpperCase() || "U";

  return (
    <div className="min-h-screen bg-cream font-dm relative">

      <div className="pointer-events-none fixed top-[-10%] left-[-10%] w-150 h-150 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(168,213,181,0.18)_0%,transparent_65%)] -z-10" />
      <div className="pointer-events-none fixed bottom-[-10%] right-[-10%] w-150 h-150 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(196,133,90,0.10)_0%,transparent_65%)] -z-10" />
      <div className="pointer-events-none fixed top-[40%] right-[20%] w-100 h-100 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(74,124,89,0.06)_0%,transparent_65%)] -z-10" />

      <Navbar alwaysFrosted />

      <div className="max-w-4xl mx-auto px-8 pt-28 pb-16">

        <div className="relative bg-forest rounded-3xl px-8 py-10 mb-8 overflow-hidden">
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

        {loading && (
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl border border-white/80 shadow-sm p-8 text-sm text-forest/60">
            Loading your profile...
          </div>
        )}

        {!loading && error && (
          <div className="bg-[#fdeaea] rounded-3xl border border-[#f5c0c0] p-6 text-sm text-[#b94040]">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
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
              {changingPassword && (
                <div className="mb-5 rounded-2xl border border-warm bg-warm/20 p-5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <EditField
                      label="Current Password"
                      name="currentPassword"
                      type="password"
                      value={passwordForm.currentPassword}
                      icon={<IconX />}
                      editing
                      onChange={handlePasswordChange}
                    />
                    <EditField
                      label="New Password"
                      name="newPassword"
                      type="password"
                      value={passwordForm.newPassword}
                      icon={<IconSave />}
                      editing
                      onChange={handlePasswordChange}
                    />
                    <EditField
                      label="Confirm New Password"
                      name="confirmPassword"
                      type="password"
                      value={passwordForm.confirmPassword}
                      icon={<IconSave />}
                      editing
                      onChange={handlePasswordChange}
                    />
                  </div>

                  {passwordError && (
                    <p className="mt-3 text-sm text-[#b94040]">{passwordError}</p>
                  )}

                  {passwordSuccess && (
                    <p className="mt-3 text-sm text-sage">{passwordSuccess}</p>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={handlePasswordCancel}
                      className="text-xs font-medium text-forest/60 bg-white px-4 py-2 rounded-xl border border-warm hover:border-forest/20 transition-all duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handlePasswordSave}
                      disabled={passwordSaving}
                      className="text-xs font-medium text-cream bg-forest px-4 py-2 rounded-xl hover:bg-sage transition-all duration-200 disabled:opacity-60"
                    >
                      {passwordSaving ? "Updating..." : "Update Password"}
                    </button>
                  </div>
                </div>
              )}

              {!changingPassword && passwordSuccess && (
                <p className="mb-4 text-sm text-sage">{passwordSuccess}</p>
              )}

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => {
                    setChangingPassword(true);
                    setPasswordError(null);
                    setPasswordSuccess(null);
                  }}
                  className="text-xs font-medium text-forest/50 hover:text-forest border border-warm hover:border-forest/20 px-4 py-2 rounded-xl transition-all duration-200"
                >
                  Change Password
                </button>
                <button
                  onClick={handleSignOut}
                  className="text-xs font-medium text-[#b94040] border border-[#f5c0c0] hover:bg-[#fdeaea] px-4 py-2 rounded-xl transition-all duration-200"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
          </>
        )}
      </div>
    </div>
  );
}
