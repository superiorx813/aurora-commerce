
"use client";

import Link from "next/link";
import {
  Search,
   MessageCircle,
  ShoppingBag,
  Heart,
  UserRound,
  X,
  Store,
  ClipboardList,
  UserCircle,
  LayoutDashboard,
  IndianRupee,
  Users,
  Package,
  PlusCircle,
  LogOut,
  Mail,
  ShieldCheck,
  Save,
  User,
  Camera,
  Trash2,
  Phone,
  CalendarDays,
  MapPin,
  Building2,
  Map,
  Hash,
  Send,
  Pencil,
  CircleAlert,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useStore } from "./StoreProvider";

type SessionUser = {
  id: number;
  name: string;
  email: string;
  role: "CUSTOMER" | "ADMIN";
};

type ProfileData = {
  id: number;
  name: string;
  email: string;
  phone: string;
  profileImage: string | null;
  dateOfBirth: string;
  gender: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  role: "CUSTOMER" | "ADMIN";
  createdAt?: string;
};

export default function Header() {
  const { cartCount, wishlist } = useStore();
  const pathname = usePathname();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [profileOpen, setProfileOpen] = useState(false);
  const [customerCareOpen, setCustomerCareOpen] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileDeletingImage, setProfileDeletingImage] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const [profileForm, setProfileForm] = useState({
    phone: "",
    dateOfBirth: "",
    gender: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadUser = async () => {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });

        if (!response.ok) {
          if (!cancelled) setUser(null);
          return;
        }

        const data = await response.json();
        if (!cancelled) setUser(data.user ?? null);
      } catch (error) {
        console.error("Failed to load user:", error);
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoadingUser(false);
      }
    };

    setLoadingUser(true);
    loadUser();

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const isAdmin = user?.role === "ADMIN";

  const closeMenu = () => setOpen(false);

  const openProfile = async () => {
    if (!user) {
      window.location.href = "/account";
      return;
    }

    setOpen(false);
    setProfileOpen(true);
    setIsEditingProfile(false);
    setProfileError("");
    setProfileSuccess("");
    setSelectedImage(null);
    setImagePreview(null);
    setProfileLoading(true);

    try {
      const response = await fetch("/api/profile", { cache: "no-store" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load profile.");
      }

      if (data.user) {
        const profile = data.user as ProfileData;

        setUser({
          id: profile.id,
          name: profile.name,
          email: profile.email,
          role: profile.role,
        });

        setProfileForm({
          phone: profile.phone || "",
          dateOfBirth: profile.dateOfBirth || "",
          gender: profile.gender || "",
          address: profile.address || "",
          city: profile.city || "",
          state: profile.state || "",
          pincode: profile.pincode || "",
        });

        setProfileImage(profile.profileImage || null);
      }
    } catch (error) {
      console.error("Profile loading failed:", error);
      setProfileError(
        error instanceof Error ? error.message : "Failed to load profile."
      );
    } finally {
      setProfileLoading(false);
    }
  };

  const closeProfile = () => {
    if (profileSaving || profileDeletingImage) return;

    setProfileOpen(false);
    setIsEditingProfile(false);
    setProfileError("");
    setProfileSuccess("");
    setSelectedImage(null);
    setImagePreview(null);
  };

  const startEditingProfile = () => {
    setProfileError("");
    setProfileSuccess("");
    setIsEditingProfile(true);
  };

  const handleImageButton = () => {
    if (!isEditingProfile) return;
    fileInputRef.current?.click();
  };

  const handleImageChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!isEditingProfile) {
      event.target.value = "";
      return;
    }

    const file = event.target.files?.[0];
    if (!file) return;

    setProfileError("");
    setProfileSuccess("");

    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setProfileError("Please select a JPG, JPEG, PNG or WEBP image.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setProfileError("Profile image must be smaller than 5 MB.");
      event.target.value = "";
      return;
    }

    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const deleteProfileImage = async () => {
    if (!isEditingProfile || !profileImage) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete your profile image?"
    );

    if (!confirmed) return;

    setProfileError("");
    setProfileSuccess("");
    setProfileDeletingImage(true);

    try {
      const response = await fetch("/api/profile", { method: "DELETE" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to delete profile image."
        );
      }

      setProfileImage(null);
      setImagePreview(null);
      setSelectedImage(null);

      if (fileInputRef.current) fileInputRef.current.value = "";

      setProfileSuccess("Profile image deleted successfully.");
    } catch (error) {
      console.error("Profile image deletion failed:", error);
      setProfileError(
        error instanceof Error
          ? error.message
          : "Failed to delete profile image."
      );
    } finally {
      setProfileDeletingImage(false);
    }
  };

  const saveProfile = async () => {
    if (!isEditingProfile) return;

    setProfileError("");
    setProfileSuccess("");
    setProfileSaving(true);

    try {
      const formData = new FormData();

      formData.append("phone", profileForm.phone.trim());
      formData.append("dateOfBirth", profileForm.dateOfBirth);
      formData.append("gender", profileForm.gender);
      formData.append("address", profileForm.address.trim());
      formData.append("city", profileForm.city.trim());
      formData.append("state", profileForm.state);
      formData.append("pincode", profileForm.pincode.trim());

      if (selectedImage) {
        formData.append("profileImage", selectedImage);
      }

      const response = await fetch("/api/profile", {
        method: "PATCH",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update profile.");
      }

      if (data.user) {
        const updated = data.user as ProfileData;

        setUser({
          id: updated.id,
          name: updated.name,
          email: updated.email,
          role: updated.role,
        });

        setProfileForm({
          phone: updated.phone || "",
          dateOfBirth: updated.dateOfBirth || "",
          gender: updated.gender || "",
          address: updated.address || "",
          city: updated.city || "",
          state: updated.state || "",
          pincode: updated.pincode || "",
        });

        setProfileImage(updated.profileImage || null);
      }

      setSelectedImage(null);
      setImagePreview(null);

      if (fileInputRef.current) fileInputRef.current.value = "";

      setProfileSuccess("Profile updated successfully.");
      setIsEditingProfile(false);

      window.setTimeout(() => setProfileSuccess(""), 3500);
    } catch (error) {
      console.error("Profile update failed:", error);
      setProfileError(
        error instanceof Error
          ? error.message
          : "Failed to update profile."
      );
    } finally {
      setProfileSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });

      if (!response.ok) throw new Error("Logout failed.");

      setUser(null);
      setOpen(false);
      setProfileOpen(false);
      window.location.href = "/";
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return "A";

    const parts = name.trim().split(/\s+/).filter(Boolean);

    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }

    return (
      parts[0][0] + parts[parts.length - 1][0]
    ).toUpperCase();
  };

  const currentProfileImage = imagePreview || profileImage;
  const fieldsDisabled =
    !isEditingProfile || profileLoading || profileSaving;

  return (
    <>
      <header className="site-header">
        <div className="container header-inner">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open Aurora Menu"
            className="brand"
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              padding: 0,
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <span className="brand-mark">A</span>
            <span>AURORA MENU</span>
          </button>

          <form className="search-box" action="/products">
            <Search size={19} />
            <input
              name="q"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search products, brands & collections"
            />
            <button type="submit">Search</button>
          </form>

          <nav className="header-actions">
            <Link href="/wishlist" aria-label="Wishlist">
              <Heart size={20} />
              <span className="desktop-label">Wishlist</span>
              {wishlist.length > 0 && <b>{wishlist.length}</b>}
            </Link>

            <Link href="/account" aria-label="Account">
              <UserRound size={20} />
              <span className="desktop-label">Account</span>
            </Link>

            <Link href="/cart" className="cart-link" aria-label="Cart">
              <ShoppingBag size={20} />
              <span className="desktop-label">Bag</span>
              {cartCount > 0 && <b>{cartCount}</b>}
            </Link>

          </nav>
        </div>
      </header>

      <div className="announcement">
        Free delivery above ₹999 · Easy returns · Secure checkout
      </div>

      {open && (
        <div
          onClick={closeMenu}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.55)",
            zIndex: 9998,
            backdropFilter: "blur(2px)",
          }}
        />
      )}

      <aside
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          height: "100vh",
          width: "340px",
          maxWidth: "88vw",
          background: "#eaeaf1",
          zIndex: 9999,
          boxShadow: "8px 0 35px rgba(0,0,0,0.18)",
          transform: open ? "translateX(0)" : "translateX(-105%)",
          transition: "transform 0.3s ease",
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            padding: "22px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#123b63",
            color: "#fff",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "12px",
                background: "#fff",
                color: "#312e81",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
                fontWeight: 800,
              }}
            >
              A
            </span>

            <div>
              <div
                style={{
                  fontWeight: 800,
                  letterSpacing: "1px",
                  fontSize: "16px",
                }}
              >
                AURORA MENU
              </div>
              <small style={{ opacity: 0.8 }}>Navigation</small>
            </div>
          </div>

          <button
            type="button"
            onClick={closeMenu}
            aria-label="Close menu"
            style={{
              border: "none",
              background: "rgba(255,255,255,0.15)",
              color: "#fff",
              width: "38px",
              height: "38px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div
          style={{
            padding: "18px",
            borderBottom: "1px solid #eee",
            background: "#fafafa",
            flexShrink: 0,
          }}
        >
          {loadingUser ? (
            <div style={{ fontSize: "14px", color: "#777" }}>
              Loading account...
            </div>
          ) : user ? (
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "15px",
                  padding: "2px",
                  background:
                    "linear-gradient(135deg, #312e81, #7c3aed)",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: "13px",
                    overflow: "hidden",
                    background:
                      "linear-gradient(135deg, #f5f3ff, #ede9fe)",
                    color: "#312e81",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    fontSize: "14px",
                  }}
                >
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt="Profile"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    getInitials(user.name)
                  )}
                </div>
              </div>

              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    fontWeight: 700,
                    color: "#222",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {user.name}
                </div>

                <div
                  style={{
                    fontSize: "12px",
                    color: "#777",
                    marginTop: "3px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {user.email}
                </div>

                <span
                  style={{
                    display: "inline-block",
                    marginTop: "6px",
                    padding: "3px 8px",
                    borderRadius: "20px",
                    background: isAdmin ? "#ede9fe" : "#dcfce7",
                    color: isAdmin ? "#6d28d9" : "#15803d",
                    fontSize: "10px",
                    fontWeight: 700,
                  }}
                >
                  {isAdmin ? "ADMIN" : "CUSTOMER"}
                </span>
              </div>
            </div>
          ) : (
            <Link
              href="/account"
              onClick={closeMenu}
              style={{
                textDecoration: "none",
                fontWeight: 600,
                color: "#312e81",
              }}
            >
              Sign in to your account →
            </Link>
          )}
        </div>

        <div style={{ padding: "14px" }}>
          <MenuSection title="MAIN">
            <SideLink
              href="/"
              icon={<Store size={18} />}
              label="Store Front"
              onClick={closeMenu}
            />
            <SideLink
              href="/account"
              icon={<UserRound size={18} />}
              label="Account"
              onClick={closeMenu}
            />
            <SideLink
              href="/wishlist"
              icon={<Heart size={18} />}
              label="Wishlist"
              badge={wishlist.length > 0 ? String(wishlist.length) : undefined}
              onClick={closeMenu}
            />
            <SideLink
              href="/orders"
              icon={<ClipboardList size={18} />}
              label="Orders"
              onClick={closeMenu}
            />

            <button
              type="button"
              onClick={openProfile}
              style={{
                width: "100%",
                border: "none",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px 13px",
                marginBottom: "4px",
                borderRadius: "11px",
                color: "#333",
                background: "transparent",
                fontWeight: 500,
                cursor: "pointer",
                textAlign: "left",
              }}
            >

              
              
              <span
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "9px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#f5f5f5",
                  color: "#666",
                  flexShrink: 0,
                }}
              >
                <UserCircle size={18} />
              </span>
              <span style={{ flex: 1 }}>Profile</span>
              <span style={{ fontSize: "11px", color: "#999" }}>View</span>
            </button>

            <button
              type="button"
              onClick={() => {
                closeMenu();
                setCustomerCareOpen(true);
              }}
              style={{
                width: "100%",
                border: "none",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px 13px",
                marginBottom: "4px",
                borderRadius: "11px",
                color: "#333",
                background: "transparent",
                fontWeight: 500,
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <span
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "9px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#f5f5f5",
                  color: "#666",
                  flexShrink: 0,
                }}
              >
                <MessageCircle size={18} />
              </span>
              <span style={{ flex: 1 }}>Customer Care</span>
              <span style={{ fontSize: "11px", color: "#999" }}>Help</span>
            </button>
          </MenuSection>

          {isAdmin && (
            <MenuSection title="ADMINISTRATION">
              <SideLink
                href="/admin"
                icon={<LayoutDashboard size={18} />}
                label="Admin Dashboard"
                onClick={closeMenu}
                highlighted
              />
              <SideLink
                href="/admin/orders"
                icon={<ClipboardList size={18} />}
                label="Orders"
                onClick={closeMenu}
              />
              <SideLink
                href="/admin/revenue"
                icon={<IndianRupee size={18} />}
                label="Revenue"
                onClick={closeMenu}
              />
              <SideLink
                href="/admin/customers"
                icon={<Users size={18} />}
                label="Customers"
                onClick={closeMenu}
              />
              <SideLink
                href="/admin/products"
                icon={<Package size={18} />}
                label="Products"
                onClick={closeMenu}
              />
              <SideLink
                href="/admin/products/new"
                icon={<PlusCircle size={18} />}
                label="Add Product"
                onClick={closeMenu}
              />
              <SideLink
                href="/admin/customer-care"
                icon={<MessageCircle size={18} />}
                label="Customer Care"
                onClick={closeMenu}
              />
              <SideLink
                href="/admin/order-requests"
                icon={<CircleAlert size={18} />}
                label="Order Requests"
                onClick={closeMenu}
              />
            </MenuSection>
          )}

          <MenuSection title="QUICK ACCESS">
            <SideLink
              href="/products"
              icon={<Store size={18} />}
              label="Shop All Products"
              onClick={closeMenu}
            />
            <SideLink
              href="/cart"
              icon={<ShoppingBag size={18} />}
              label="Shopping Bag"
              badge={cartCount > 0 ? String(cartCount) : undefined}
              onClick={closeMenu}
            />
          </MenuSection>

          {user && (
            <button
              type="button"
              onClick={handleLogout}
              style={{
                width: "100%",
                marginTop: "12px",
                padding: "12px 14px",
                border: "1px solid #fee2e2",
                borderRadius: "12px",
                background: "#fff",
                color: "#dc2626",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              <LogOut size={18} />
              Logout
            </button>
          )}
        </div>
      </aside>

      {customerCareOpen && (
        <CustomerCareModal onClose={() => setCustomerCareOpen(false)} />
      )}

      {profileOpen && (
        <>
          <div
            onClick={closeProfile}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15, 23, 42, 0.62)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              zIndex: 10000,
            }}
          />

          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 10001,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "14px",
              pointerEvents: "none",
              overflow: "hidden",
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="aurora-profile-title"
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%",
                maxWidth: "820px",
                height: "min(94vh, 850px)",
                background: "#f8fafc",
                borderRadius: "26px",
                boxShadow: "0 35px 100px rgba(15, 23, 42, 0.32)",
                pointerEvents: "auto",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.7)",
              }}
            >
              <div
                style={{
                  position: "relative",
                  padding: "25px 28px 24px",
                  color: "#fff",
                  flexShrink: 0,
                  overflow: "hidden",
                  background:
                    "linear-gradient(135deg, #172554 0%, #312e81 45%, #6d28d9 100%)",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    width: "180px",
                    height: "180px",
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.07)",
                    top: "-95px",
                    right: "-45px",
                  }}
                />

                <div
                  style={{
                    position: "absolute",
                    width: "110px",
                    height: "110px",
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.05)",
                    bottom: "-65px",
                    left: "32%",
                  }}
                />

                <button
                  type="button"
                  onClick={closeProfile}
                  disabled={profileSaving || profileDeletingImage}
                  aria-label="Close profile"
                  style={{
                    position: "absolute",
                    top: "16px",
                    right: "16px",
                    width: "38px",
                    height: "38px",
                    border: "1px solid rgba(255,255,255,0.18)",
                    borderRadius: "12px",
                    background: "rgba(255,255,255,0.10)",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    zIndex: 3,
                  }}
                >
                  <X size={18} />
                </button>

                <div
                  style={{
                    position: "relative",
                    zIndex: 2,
                    display: "flex",
                    alignItems: "center",
                    gap: "18px",
                    paddingRight: "48px",
                  }}
                >
                  <div
                    style={{
                      width: "92px",
                      height: "92px",
                      padding: "3px",
                      borderRadius: "27px",
                      background:
                        "linear-gradient(135deg, rgba(255,255,255,0.95), rgba(196,181,253,0.7))",
                      boxShadow: "0 14px 35px rgba(0,0,0,0.25)",
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: "24px",
                        overflow: "hidden",
                        background:
                          "linear-gradient(135deg, #f8fafc, #e0e7ff)",
                        color: "#312e81",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "25px",
                        fontWeight: 800,
                      }}
                    >
                      {currentProfileImage ? (
                        <img
                          src={currentProfileImage}
                          alt="Profile"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        getInitials(user?.name)
                      )}
                    </div>
                  </div>

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "5px 9px",
                        borderRadius: "999px",
                        background: "rgba(255,255,255,0.11)",
                        border: "1px solid rgba(255,255,255,0.16)",
                        fontSize: "9px",
                        fontWeight: 800,
                        letterSpacing: "1.5px",
                        marginBottom: "7px",
                      }}
                    >
                      <ShieldCheck size={12} />
                      AURORA PROFILE
                    </div>

                    <h2
                      id="aurora-profile-title"
                      style={{
                        margin: 0,
                        fontSize: "24px",
                        fontWeight: 800,
                        letterSpacing: "-0.3px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {user?.name || "Your Profile"}
                    </h2>

                    <div
                      style={{
                        marginTop: "5px",
                        fontSize: "12px",
                        opacity: 0.75,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {user?.email}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    position: "relative",
                    zIndex: 2,
                    display: "flex",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "8px",
                    marginTop: "20px",
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleImageChange}
                    style={{ display: "none" }}
                  />

                  <button
                    type="button"
                    onClick={handleImageButton}
                    disabled={
                      !isEditingProfile ||
                      profileSaving ||
                      profileDeletingImage
                    }
                    style={{
                      ...profileImageButtonStyle,
                      opacity: isEditingProfile ? 1 : 0.5,
                      cursor: isEditingProfile ? "pointer" : "not-allowed",
                    }}
                  >
                    <Camera size={15} />
                    {currentProfileImage
                      ? "Change Profile Image"
                      : "Upload Profile Image"}
                  </button>

                  {profileImage && (
                    <button
                      type="button"
                      onClick={deleteProfileImage}
                      disabled={
                        !isEditingProfile ||
                        profileSaving ||
                        profileDeletingImage
                      }
                      style={{
                        ...profileDeleteButtonStyle,
                        opacity: isEditingProfile ? 1 : 0.5,
                        cursor: isEditingProfile
                          ? "pointer"
                          : "not-allowed",
                      }}
                    >
                      <Trash2 size={15} />
                      {profileDeletingImage ? "Deleting..." : "Delete"}
                    </button>
                  )}

                  <span
                    style={{
                      fontSize: "10px",
                      color: "rgba(255,255,255,0.62)",
                      marginLeft: "3px",
                    }}
                  >
                    JPG · PNG · WEBP · Max 5MB
                  </span>
                </div>
              </div>

              <div
                style={{
                  flex: 1,
                  minHeight: 0,
                  overflowY: "auto",
                  overflowX: "hidden",
                  padding: "24px 28px",
                  WebkitOverflowScrolling: "touch",
                  scrollbarWidth: "thin",
                }}
              >
                {profileLoading && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "9px",
                      padding: "12px 14px",
                      marginBottom: "18px",
                      borderRadius: "13px",
                      background: "#f5f3ff",
                      border: "1px solid #e9d5ff",
                      color: "#6d28d9",
                      fontSize: "12px",
                      fontWeight: 600,
                    }}
                  >
                    <span
                      className="spinner-border spinner-border-sm"
                      role="status"
                      aria-hidden="true"
                    />
                    Loading your profile...
                  </div>
                )}

                {profileError && (
                  <div
                    style={{
                      padding: "12px 14px",
                      marginBottom: "18px",
                      borderRadius: "13px",
                      background: "#fff1f2",
                      border: "1px solid #fecdd3",
                      color: "#be123c",
                      fontSize: "12px",
                      fontWeight: 600,
                    }}
                  >
                    {profileError}
                  </div>
                )}

                {profileSuccess && (
                  <div
                    style={{
                      padding: "12px 14px",
                      marginBottom: "18px",
                      borderRadius: "13px",
                      background: "#f0fdf4",
                      border: "1px solid #bbf7d0",
                      color: "#15803d",
                      fontSize: "12px",
                      fontWeight: 600,
                    }}
                  >
                    ✓ {profileSuccess}
                  </div>
                )}

                <div style={profileCardStyle}>
                  <ProfileSectionTitle
                    icon={<ShieldCheck size={17} />}
                    title="Identity"
                    description="Your registered Aurora account identity."
                  />

                  <div className="row g-3" style={{ marginTop: "4px" }}>
                    <div className="col-12 col-md-6">
                      <ReadOnlyField
                        label="Full Name"
                        icon={<User size={15} />}
                        value={user?.name || "Not available"}
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <ReadOnlyField
                        label="Email Address"
                        icon={<Mail size={15} />}
                        value={user?.email || "Not available"}
                      />
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: "13px",
                      padding: "9px 11px",
                      borderRadius: "10px",
                      background: "#f8fafc",
                      border: "1px solid #eef2f7",
                      color: "#8b95a7",
                      fontSize: "10px",
                      display: "flex",
                      alignItems: "center",
                      gap: "7px",
                    }}
                  >
                    <ShieldCheck size={13} />
                    Full Name and Email are protected and cannot be changed.
                  </div>
                </div>

                <div style={profileCardStyle}>
                  <ProfileSectionTitle
                    icon={<User size={17} />}
                    title="Personal Details"
                    description="Manage your personal information."
                  />

                  <div className="row g-3" style={{ marginTop: "4px" }}>
                    <div className="col-12 col-md-6">
                      <EditableField
                        label="Phone Number"
                        icon={<Phone size={15} />}
                      >
                        <input
                          type="tel"
                          value={profileForm.phone}
                          onChange={(e) =>
                            setProfileForm({
                              ...profileForm,
                              phone: e.target.value,
                            })
                          }
                          placeholder="+91 XXXXX XXXXX"
                          maxLength={30}
                          disabled={fieldsDisabled}
                          style={{
                            ...modernInputStyle,
                            ...getDisabledInputStyle(fieldsDisabled),
                          }}
                        />
                      </EditableField>
                    </div>

                    <div className="col-12 col-md-6">
                      <EditableField
                        label="Date of Birth"
                        icon={<CalendarDays size={15} />}
                      >
                        <input
                          type="date"
                          value={profileForm.dateOfBirth}
                          onChange={(e) =>
                            setProfileForm({
                              ...profileForm,
                              dateOfBirth: e.target.value,
                            })
                          }
                          disabled={fieldsDisabled}
                          style={{
                            ...modernInputStyle,
                            ...getDisabledInputStyle(fieldsDisabled),
                          }}
                        />
                      </EditableField>
                    </div>

                    <div className="col-12 col-md-6">
                      <EditableField
                        label="Gender"
                        icon={<UserCircle size={15} />}
                      >
                        <select
                          value={profileForm.gender}
                          onChange={(e) =>
                            setProfileForm({
                              ...profileForm,
                              gender: e.target.value,
                            })
                          }
                          disabled={fieldsDisabled}
                          style={{
                            ...modernInputStyle,
                            ...getDisabledInputStyle(fieldsDisabled),
                          }}
                        >
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                          <option value="Prefer not to say">
                            Prefer not to say
                          </option>
                        </select>
                      </EditableField>
                    </div>
                  </div>
                </div>

                <div style={profileCardStyle}>
                  <ProfileSectionTitle
                    icon={<MapPin size={17} />}
                    title="Address"
                    description="Keep your delivery and contact address up to date."
                  />

                  <div className="row g-3" style={{ marginTop: "4px" }}>
                    <div className="col-12">
                      <EditableField
                        label="Address"
                        icon={<MapPin size={15} />}
                      >
                        <textarea
                          value={profileForm.address}
                          onChange={(e) =>
                            setProfileForm({
                              ...profileForm,
                              address: e.target.value,
                            })
                          }
                          placeholder="Enter your complete address"
                          maxLength={500}
                          rows={3}
                          disabled={fieldsDisabled}
                          style={{
                            ...modernInputStyle,
                            ...getDisabledInputStyle(fieldsDisabled),
                            resize: "vertical",
                            minHeight: "92px",
                          }}
                        />
                      </EditableField>
                    </div>

                    <div className="col-12 col-md-4">
                      <EditableField
                        label="City"
                        icon={<Building2 size={15} />}
                      >
                        <input
                          type="text"
                          value={profileForm.city}
                          onChange={(e) =>
                            setProfileForm({
                              ...profileForm,
                              city: e.target.value,
                            })
                          }
                          placeholder="Enter city"
                          maxLength={100}
                          disabled={fieldsDisabled}
                          style={{
                            ...modernInputStyle,
                            ...getDisabledInputStyle(fieldsDisabled),
                          }}
                        />
                      </EditableField>
                    </div>

                    <div className="col-12 col-md-5">
                      <EditableField
                        label="State"
                        icon={<Map size={15} />}
                      >
                        <select
                          value={profileForm.state}
                          onChange={(e) =>
                            setProfileForm({
                              ...profileForm,
                              state: e.target.value,
                            })
                          }
                          disabled={fieldsDisabled}
                          style={{
                            ...modernInputStyle,
                            ...getDisabledInputStyle(fieldsDisabled),
                          }}
                        >
                          <option value="">Select State</option>
                          <option value="Andhra Pradesh">Andhra Pradesh</option>
                          <option value="Arunachal Pradesh">
                            Arunachal Pradesh
                          </option>
                          <option value="Assam">Assam</option>
                          <option value="Bihar">Bihar</option>
                          <option value="Chhattisgarh">Chhattisgarh</option>
                          <option value="Goa">Goa</option>
                          <option value="Gujarat">Gujarat</option>
                          <option value="Haryana">Haryana</option>
                          <option value="Himachal Pradesh">
                            Himachal Pradesh
                          </option>
                          <option value="Jharkhand">Jharkhand</option>
                          <option value="Karnataka">Karnataka</option>
                          <option value="Kerala">Kerala</option>
                          <option value="Madhya Pradesh">
                            Madhya Pradesh
                          </option>
                          <option value="Maharashtra">Maharashtra</option>
                          <option value="Manipur">Manipur</option>
                          <option value="Meghalaya">Meghalaya</option>
                          <option value="Mizoram">Mizoram</option>
                          <option value="Nagaland">Nagaland</option>
                          <option value="Odisha">Odisha</option>
                          <option value="Punjab">Punjab</option>
                          <option value="Rajasthan">Rajasthan</option>
                          <option value="Sikkim">Sikkim</option>
                          <option value="Tamil Nadu">Tamil Nadu</option>
                          <option value="Telangana">Telangana</option>
                          <option value="Tripura">Tripura</option>
                          <option value="Uttar Pradesh">Uttar Pradesh</option>
                          <option value="Uttarakhand">Uttarakhand</option>
                          <option value="West Bengal">West Bengal</option>
                          <option value="Delhi">Delhi</option>
                          <option value="Jammu and Kashmir">
                            Jammu and Kashmir
                          </option>
                          <option value="Ladakh">Ladakh</option>
                        </select>
                      </EditableField>
                    </div>

                    <div className="col-12 col-md-3">
                      <EditableField
                        label="Pincode"
                        icon={<Hash size={15} />}
                      >
                        <input
                          type="text"
                          inputMode="numeric"
                          value={profileForm.pincode}
                          onChange={(e) =>
                            setProfileForm({
                              ...profileForm,
                              pincode: e.target.value,
                            })
                          }
                          placeholder="Pincode"
                          maxLength={20}
                          disabled={fieldsDisabled}
                          style={{
                            ...modernInputStyle,
                            ...getDisabledInputStyle(fieldsDisabled),
                          }}
                        />
                      </EditableField>
                    </div>
                  </div>
                </div>

                <div style={{ height: "8px" }} />
              </div>

              <div
                style={{
                  padding: "15px 28px",
                  borderTop: "1px solid #e9edf3",
                  background: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    fontSize: "10px",
                    color: "#8b95a7",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <ShieldCheck size={13} />
                  Your account identity is protected
                </div>

                <div style={{ display: "flex", gap: "9px" }}>
                  {!isEditingProfile ? (
                    <button
                      type="button"
                      onClick={startEditingProfile}
                      disabled={profileLoading}
                      style={modernPrimaryButtonStyle}
                    >
                      <Pencil size={16} />
                      Edit
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={closeProfile}
                        disabled={
                          profileSaving || profileDeletingImage
                        }
                        style={modernSecondaryButtonStyle}
                      >
                        Close
                      </button>

                      <button
                        type="button"
                        onClick={saveProfile}
                        disabled={
                          profileSaving ||
                          profileLoading ||
                          profileDeletingImage
                        }
                        style={modernPrimaryButtonStyle}
                      >
                        <Save size={16} />
                        {profileSaving ? "Saving..." : "Save Changes"}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}


function CustomerCareModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const updateField = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    if (error) setError("");
  };

  const submitMessage = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/customer-care", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to submit your message.");
      }

      setSubmitted(true);
      setForm({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to submit your message. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div
        onClick={submitting ? undefined : onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15, 23, 42, .62)",
          backdropFilter: "blur(7px)",
          WebkitBackdropFilter: "blur(7px)",
          zIndex: 11000,
        }}
      />

      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 11001,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "18px",
          pointerEvents: "none",
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="customer-care-title"
          onClick={(event) => event.stopPropagation()}
          style={{
            width: "100%",
            maxWidth: "1050px",
            maxHeight: "92vh",
            overflowY: "auto",
            background: "#f8fafc",
            borderRadius: "24px",
            boxShadow: "0 35px 100px rgba(15, 23, 42, .32)",
            pointerEvents: "auto",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "relative",
              padding: "26px 30px",
              color: "#fff",
              background:
                "linear-gradient(135deg, #173b67 0%, #2563a6 48%, #4d83c4 100%)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                width: "170px",
                height: "170px",
                borderRadius: "50%",
                right: "-55px",
                top: "-85px",
                background: "rgba(255,255,255,.08)",
              }}
            />
            <div
              style={{
                position: "absolute",
                width: "100px",
                height: "100px",
                borderRadius: "50%",
                right: "100px",
                bottom: "-65px",
                background: "rgba(255,255,255,.06)",
              }}
            />

            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              aria-label="Close Customer Care"
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                width: "38px",
                height: "38px",
                border: "1px solid rgba(255,255,255,.18)",
                borderRadius: "12px",
                background: "rgba(255,255,255,.12)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: submitting ? "not-allowed" : "pointer",
                zIndex: 2,
              }}
            >
              <X size={18} />
            </button>

            <div style={{ position: "relative", zIndex: 1, paddingRight: "48px" }}>
              <div
                style={{
                  fontSize: "10px",
                  fontWeight: 800,
                  letterSpacing: "2px",
                  opacity: .75,
                  marginBottom: "7px",
                }}
              >
                AURORA SUPPORT
              </div>
              <h2
                id="customer-care-title"
                style={{
                  margin: 0,
                  fontSize: "25px",
                  fontWeight: 800,
                }}
              >
                Customer Care
              </h2>
              <p
                style={{
                  margin: "7px 0 0",
                  fontSize: "12px",
                  opacity: .84,
                  lineHeight: 1.6,
                  maxWidth: "650px",
                }}
              >
                Have a question or need help with your order? Send us a
                message and our support team will get back to you.
              </p>
            </div>
          </div>

          <div style={{ padding: "24px" }}>
            {submitted ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "55px 20px",
                  background: "#f1f7ff",
                  borderRadius: "18px",
                  border: "1px solid #dcecff",
                }}
              >
                <div
                  style={{
                    width: "68px",
                    height: "68px",
                    margin: "0 auto 16px",
                    borderRadius: "50%",
                    background: "#dcfce7",
                    color: "#15803d",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "28px",
                    fontWeight: 800,
                  }}
                >
                  ✓
                </div>
                <h4 style={{ margin: "0 0 8px", fontWeight: 800, color: "#20242b" }}>
                  Message Sent Successfully
                </h4>
                <p
                  style={{
                    maxWidth: "520px",
                    margin: "0 auto 22px",
                    color: "#6b7280",
                    fontSize: "13px",
                    lineHeight: 1.7,
                  }}
                >
                  Your message has been received. Our support team will
                  review it shortly.
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  style={modernPrimaryButtonStyle}
                >
                  Close
                </button>
              </div>
            ) : (
              <div className="row g-4">
                <div className="col-lg-4">
                  <div
                    style={{
                      height: "100%",
                      padding: "22px",
                      background: "#f1f7ff",
                      borderRadius: "18px",
                      border: "1px solid #dcecff",
                    }}
                  >
                    <div
                      style={{
                        width: "46px",
                        height: "46px",
                        borderRadius: "12px",
                        background:
                          "linear-gradient(135deg, #2563a6, #4d83c4)",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: "14px",
                      }}
                    >
                      <MessageCircle size={22} />
                    </div>
                    <h5 style={{ margin: "0 0 8px", fontWeight: 800, color: "#20242b" }}>
                      How can we help?
                    </h5>
                    <p
                      style={{
                        margin: 0,
                        color: "#6b7280",
                        fontSize: "12px",
                        lineHeight: 1.7,
                      }}
                    >
                      Our Customer Care team can help with orders, products,
                      payments, deliveries and other questions.
                    </p>

                    <div style={{ marginTop: "24px" }}>
                      <SupportInfo icon={<Mail size={17} />} title="Email" value="support@aurora.com" />
                      <SupportInfo icon={<Phone size={17} />} title="Phone" value="+91 98765 43210" />
                      <SupportInfo icon={<MapPin size={17} />} title="Support Hours" value="Monday - Saturday, 9:00 AM - 6:00 PM" />
                    </div>
                  </div>
                </div>

                <div className="col-lg-8">
                  <div
                    style={{
                      padding: "22px",
                      background: "#fff",
                      borderRadius: "18px",
                      border: "1px solid #e9edf3",
                    }}
                  >
                    <h5 style={{ margin: "0 0 4px", fontWeight: 800, color: "#20242b" }}>
                      Send us a message
                    </h5>
                    <p style={{ margin: "0 0 18px", color: "#8b95a7", fontSize: "11px" }}>
                      Fill in the details below and we'll get back to you.
                    </p>

                    {error && (
                      <div
                        style={{
                          padding: "11px 13px",
                          marginBottom: "15px",
                          borderRadius: "11px",
                          background: "#fff1f2",
                          border: "1px solid #fecdd3",
                          color: "#be123c",
                          fontSize: "12px",
                          fontWeight: 600,
                        }}
                      >
                        {error}
                      </div>
                    )}

                    <form onSubmit={submitMessage}>
                      <div className="row g-3">
                        <CustomerCareField label="Full Name *">
                          <input
                            type="text"
                            name="name"
                            value={form.name}
                            onChange={updateField}
                            maxLength={120}
                            required
                            disabled={submitting}
                            placeholder="Enter your name"
                            style={customerCareInputStyle}
                          />
                        </CustomerCareField>

                        <CustomerCareField label="Email *">
                          <input
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={updateField}
                            maxLength={255}
                            required
                            disabled={submitting}
                            placeholder="Enter your email"
                            style={customerCareInputStyle}
                          />
                        </CustomerCareField>

                        <CustomerCareField label="Phone">
                          <input
                            type="tel"
                            name="phone"
                            value={form.phone}
                            onChange={updateField}
                            maxLength={30}
                            disabled={submitting}
                            placeholder="Enter your phone number"
                            style={customerCareInputStyle}
                          />
                        </CustomerCareField>

                        <CustomerCareField label="Subject *">
                          <input
                            type="text"
                            name="subject"
                            value={form.subject}
                            onChange={updateField}
                            maxLength={200}
                            required
                            disabled={submitting}
                            placeholder="What do you need help with?"
                            style={customerCareInputStyle}
                          />
                        </CustomerCareField>

                        <div className="col-12">
                          <CustomerCareField label="Message *">
                            <textarea
                              name="message"
                              value={form.message}
                              onChange={updateField}
                              maxLength={5000}
                              rows={5}
                              required
                              disabled={submitting}
                              placeholder="Describe your issue..."
                              style={{
                                ...customerCareInputStyle,
                                resize: "vertical",
                                minHeight: "110px",
                              }}
                            />
                          </CustomerCareField>
                        </div>

                        <div className="col-12 d-flex justify-content-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            style={modernSecondaryButtonStyle}
                          >
                            Close
                          </button>
                          <button
                            type="submit"
                            disabled={submitting}
                            style={{
                              ...modernPrimaryButtonStyle,
                              opacity: submitting ? .7 : 1,
                              cursor: submitting ? "not-allowed" : "pointer",
                            }}
                          >
                            <Send size={15} />
                            {submitting ? "Sending..." : "Send Message"}
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function SupportInfo({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
}) {
  return (
    <div style={{ display: "flex", gap: "11px", marginBottom: "17px" }}>
      <span style={{ color: "#2563a6", marginTop: "2px" }}>{icon}</span>
      <div>
        <div style={{ fontSize: "10px", fontWeight: 800, color: "#20242b" }}>
          {title}
        </div>
        <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "3px", lineHeight: 1.5 }}>
          {value}
        </div>
      </div>
    </div>
  );
}

function CustomerCareField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="col-md-6">
      <label
        style={{
          display: "block",
          marginBottom: "7px",
          fontSize: "10px",
          fontWeight: 800,
          color: "#7b8494",
          textTransform: "uppercase",
          letterSpacing: ".7px",
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

const customerCareInputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid #dfe4ea",
  borderRadius: "11px",
  padding: "10px 12px",
  outline: "none",
  fontSize: "12px",
  color: "#1f2937",
  background: "#fff",
  boxSizing: "border-box",
};

function ProfileSection({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        marginTop: "30px",
        paddingTop: "26px",
        borderTop: "1px solid #eee",
      }}
    >
      <ProfileSectionTitle
        icon={icon}
        title={title}
        description={description}
      />
      <div style={{ marginTop: "18px" }}>{children}</div>
    </div>
  );
}

function ProfileSectionTitle({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
      <div
        style={{
          width: "36px",
          height: "36px",
          borderRadius: "11px",
          background: "linear-gradient(135deg, #f0edff, #ede9fe)",
          color: "#6d28d9",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          boxShadow: "0 4px 10px rgba(109,40,217,0.06)",
        }}
      >
        {icon}
      </div>

      <div>
        <div
          style={{
            fontSize: "15px",
            fontWeight: 800,
            color: "#20242b",
            letterSpacing: "-0.1px",
          }}
        >
          {title}
        </div>

        <div
          style={{
            marginTop: "3px",
            fontSize: "11px",
            color: "#8b95a7",
          }}
        >
          {description}
        </div>
      </div>
    </div>
  );
}

function ReadOnlyField({
  label,
  icon,
  value,
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
}) {
  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          marginBottom: "8px",
          fontSize: "10px",
          fontWeight: 800,
          color: "#7b8494",
          textTransform: "uppercase",
          letterSpacing: "0.8px",
        }}
      >
        {icon}
        {label}
      </div>

      <div
        style={{
          minHeight: "44px",
          padding: "10px 12px",
          borderRadius: "12px",
          background: "linear-gradient(135deg, #f8fafc, #f3f4f6)",
          border: "1px solid #e5e7eb",
          color: "#4b5563",
          fontSize: "13px",
          fontWeight: 600,
          overflowWrap: "anywhere",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "10px",
        }}
      >
        <span>{value}</span>

        <span
          style={{
            width: "25px",
            height: "25px",
            borderRadius: "8px",
            background: "#e9edf3",
            color: "#8b95a7",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            fontSize: "11px",
          }}
        >
          🔒
        </span>
      </div>
    </div>
  );
}

function EditableField({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          marginBottom: "8px",
          fontSize: "10px",
          fontWeight: 800,
          color: "#7b8494",
          textTransform: "uppercase",
          letterSpacing: "0.8px",
        }}
      >
        <span style={{ color: "#6d28d9" }}>{icon}</span>
        {label}
      </div>
      {children}
    </div>
  );
}

function MenuSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: "20px" }}>
      <div
        style={{
          fontSize: "10px",
          fontWeight: 800,
          letterSpacing: "1.4px",
          color: "#999",
          padding: "5px 10px 8px",
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function SideLink({
  href,
  icon,
  label,
  badge,
  onClick,
  highlighted = false,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  badge?: string;
  onClick: () => void;
  highlighted?: boolean;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "12px 13px",
        marginBottom: "4px",
        borderRadius: "11px",
        textDecoration: "none",
        color: highlighted ? "#312e81" : "#333",
        background: highlighted ? "#f0edff" : "transparent",
        fontWeight: highlighted ? 700 : 500,
        transition: "all 0.2s ease",
      }}
    >
      <span
        style={{
          width: "34px",
          height: "34px",
          borderRadius: "9px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: highlighted ? "#ddd6fe" : "#f5f5f5",
          color: highlighted ? "#6d28d9" : "#666",
          flexShrink: 0,
        }}
      >
        {icon}
      </span>

      <span style={{ flex: 1 }}>{label}</span>

      {badge && (
        <span
          style={{
            fontSize: "10px",
            padding: "3px 7px",
            borderRadius: "20px",
            background: "#f1f1f1",
            color: "#777",
            fontWeight: 700,
          }}
        >
          {badge}
        </span>
      )}
    </Link>
  );
}

const profileCardStyle: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid #e9edf3",
  borderRadius: "18px",
  padding: "19px",
  marginBottom: "16px",
  boxShadow: "0 5px 18px rgba(15, 23, 42, 0.035)",
};

const modernInputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid #dfe4ea",
  borderRadius: "12px",
  padding: "11px 13px",
  outline: "none",
  fontSize: "13px",
  color: "#1f2937",
  background: "#ffffff",
  boxSizing: "border-box",
  transition: "border-color 0.2s ease, box-shadow 0.2s ease",
};

const getDisabledInputStyle = (
  disabled: boolean
): React.CSSProperties => ({
  ...(disabled
    ? {
        background: "#f3f4f6",
        color: "#7b8494",
        cursor: "not-allowed",
        opacity: 0.9,
      }
    : {}),
});

const profileImageButtonStyle: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.20)",
  background: "rgba(255,255,255,0.13)",
  color: "#fff",
  padding: "9px 14px",
  borderRadius: "11px",
  fontSize: "12px",
  fontWeight: 700,
  display: "inline-flex",
  alignItems: "center",
  gap: "7px",
};

const profileDeleteButtonStyle: React.CSSProperties = {
  border: "1px solid rgba(248,113,113,0.30)",
  background: "rgba(220,38,38,0.18)",
  color: "#fff",
  padding: "9px 14px",
  borderRadius: "11px",
  fontSize: "12px",
  fontWeight: 700,
  display: "inline-flex",
  alignItems: "center",
  gap: "7px",
};

const modernSecondaryButtonStyle: React.CSSProperties = {
  border: "1px solid #dfe3e8",
  background: "#ffffff",
  color: "#4b5563",
  padding: "10px 16px",
  borderRadius: "11px",
  fontSize: "12px",
  fontWeight: 700,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: "7px",
  transition: "all 0.2s ease",
};

const modernPrimaryButtonStyle: React.CSSProperties = {
  border: "none",
  background: "linear-gradient(135deg, #312e81, #6d28d9, #7c3aed)",
  color: "#ffffff",
  padding: "10px 17px",
  borderRadius: "11px",
  fontSize: "12px",
  fontWeight: 700,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: "7px",
  boxShadow: "0 7px 18px rgba(109, 40, 217, 0.20)",
  transition: "all 0.2s ease",
};
