"use client";

import Link from "next/link";

import {
  Search,
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
  Pencil,
  Mail,
  ShieldCheck,
  Save,
  User,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import {
  usePathname,
} from "next/navigation";

import { useStore } from "./StoreProvider";

type SessionUser = {
  id: number;
  name: string;
  email: string;
  role: "CUSTOMER" | "ADMIN";
};

export default function Header() {
  const {
    cartCount,
    wishlist,
  } = useStore();

  const pathname = usePathname();

  const [open, setOpen] =
    useState(false);

  const [q, setQ] =
    useState("");

  const [user, setUser] =
    useState<SessionUser | null>(null);

  const [loadingUser, setLoadingUser] =
    useState(true);

  /* =========================
     PROFILE STATE
  ========================= */

  const [profileOpen, setProfileOpen] =
    useState(false);

  const [profileEditing, setProfileEditing] =
    useState(false);

  const [profileLoading, setProfileLoading] =
    useState(false);

  const [profileSaving, setProfileSaving] =
    useState(false);

  const [profileError, setProfileError] =
    useState("");

  const [profileSuccess, setProfileSuccess] =
    useState("");

  const [profileForm, setProfileForm] =
    useState({
      name: "",
      email: "",
    });

  /* =========================
     LOAD USER
  ========================= */

  useEffect(() => {
    let cancelled = false;

    const loadUser = async () => {
      try {
        const response = await fetch(
          "/api/auth/me",
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          if (!cancelled) {
            setUser(null);
          }

          return;
        }

        const data =
          await response.json();

        if (!cancelled) {
          setUser(
            data.user ?? null
          );
        }
      } catch (error) {
        console.error(
          "Failed to load user:",
          error
        );

        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setLoadingUser(false);
        }
      }
    };

    setLoadingUser(true);

    loadUser();

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const isAdmin =
    user?.role === "ADMIN";

  /* =========================
     MENU
  ========================= */

  const closeMenu = () => {
    setOpen(false);
  };

  /* =========================
     PROFILE OPEN
  ========================= */

  const openProfile = async () => {
    if (!user) {
      window.location.href =
        "/account";

      return;
    }

    setOpen(false);

    setProfileOpen(true);
    setProfileEditing(false);
    setProfileError("");
    setProfileSuccess("");

    setProfileForm({
      name: user.name,
      email: user.email,
    });

    setProfileLoading(true);

    try {
      const response = await fetch(
        "/api/profile",
        {
          cache: "no-store",
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to load profile."
        );
      }

      if (data.user) {
        setProfileForm({
          name: data.user.name,
          email: data.user.email,
        });

        setUser(data.user);
      }
    } catch (error) {
      console.error(
        "Profile loading failed:",
        error
      );

      setProfileError(
        error instanceof Error
          ? error.message
          : "Failed to load profile."
      );
    } finally {
      setProfileLoading(false);
    }
  };

  /* =========================
     CLOSE PROFILE
  ========================= */

  const closeProfile = () => {
    if (profileSaving) {
      return;
    }

    setProfileOpen(false);
    setProfileEditing(false);
    setProfileError("");
    setProfileSuccess("");
  };

  /* =========================
     SAVE PROFILE
  ========================= */

  const saveProfile = async () => {
    setProfileError("");
    setProfileSuccess("");

    const name =
      profileForm.name.trim();

    const email =
      profileForm.email
        .trim()
        .toLowerCase();

    if (!name) {
      setProfileError(
        "Please enter your name."
      );

      return;
    }

    if (!email) {
      setProfileError(
        "Please enter your email."
      );

      return;
    }

    setProfileSaving(true);

    try {
      const response =
        await fetch(
          "/api/profile",
          {
            method: "PATCH",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              name,
              email,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to update profile."
        );
      }

      if (data.user) {
        setUser(data.user);

        setProfileForm({
          name: data.user.name,
          email: data.user.email,
        });
      }

      setProfileEditing(false);

      setProfileSuccess(
        "Profile updated successfully."
      );

      window.setTimeout(() => {
        setProfileSuccess("");
      }, 3000);
    } catch (error) {
      console.error(
        "Profile update failed:",
        error
      );

      setProfileError(
        error instanceof Error
          ? error.message
          : "Failed to update profile."
      );
    } finally {
      setProfileSaving(false);
    }
  };

  /* =========================
     CANCEL EDIT
  ========================= */

  const cancelProfileEdit = () => {
    if (!user) {
      return;
    }

    setProfileForm({
      name: user.name,
      email: user.email,
    });

    setProfileEditing(false);
    setProfileError("");
    setProfileSuccess("");
  };

  /* =========================
     LOGOUT
  ========================= */

  const handleLogout = async () => {
    try {
      const response =
        await fetch(
          "/api/auth/logout",
          {
            method: "POST",
          }
        );

      if (!response.ok) {
        throw new Error(
          "Logout failed."
        );
      }

      setUser(null);
      setOpen(false);
      setProfileOpen(false);

      window.location.href = "/";
    } catch (error) {
      console.error(
        "Logout failed:",
        error
      );
    }
  };

  /* =========================
     INITIALS
  ========================= */

  const getInitials = (
    name?: string
  ) => {
    if (!name) {
      return "A";
    }

    const parts =
      name
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (parts.length === 1) {
      return parts[0]
        .substring(0, 2)
        .toUpperCase();
    }

    return (
      parts[0][0] +
      parts[parts.length - 1][0]
    ).toUpperCase();
  };

  return (
    <>
      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="site-header">
        <div className="container header-inner">

          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open Aurora Menu"
            className="brand"
            style={{
              border: "none",
              background:
                "transparent",
              cursor: "pointer",
              padding: 0,
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <span className="brand-mark">
              A
            </span>

            <span>
              AURORA MENU
            </span>
          </button>

          <form
            className="search-box"
            action="/products"
          >
            <Search size={19} />

            <input
              name="q"
              value={q}
              onChange={(e) =>
                setQ(e.target.value)
              }
              placeholder="Search products, brands & collections"
            />

            <button type="submit">
              Search
            </button>
          </form>

          <nav className="header-actions">

            <Link
              href="/wishlist"
              aria-label="Wishlist"
            >
              <Heart size={20} />

              <span className="desktop-label">
                Wishlist
              </span>

              {wishlist.length > 0 && (
                <b>
                  {wishlist.length}
                </b>
              )}
            </Link>

            <Link
              href="/account"
              aria-label="Account"
            >
              <UserRound size={20} />

              <span className="desktop-label">
                Account
              </span>
            </Link>

            <Link
              href="/cart"
              className="cart-link"
              aria-label="Cart"
            >
              <ShoppingBag size={20} />

              <span className="desktop-label">
                Bag
              </span>

              {cartCount > 0 && (
                <b>
                  {cartCount}
                </b>
              )}
            </Link>

          </nav>
        </div>
      </header>

      <div className="announcement">
        Free delivery above ₹999 · Easy returns ·
        Secure checkout
      </div>

      {/* =====================================================
          SIDE MENU OVERLAY
      ===================================================== */}

      {open && (
        <div
          onClick={closeMenu}
          style={{
            position: "fixed",
            inset: 0,
            background:
              "rgba(0, 0, 0, 0.55)",
            zIndex: 9998,
            backdropFilter:
              "blur(3px)",
          }}
        />
      )}

      {/* =====================================================
          SIDE MENU
      ===================================================== */}

      <aside
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          height: "100vh",
          width: "340px",
          maxWidth: "88vw",
          background: "#ffffff",
          zIndex: 9999,
          boxShadow:
            "8px 0 35px rgba(0,0,0,0.18)",
          transform: open
            ? "translateX(0)"
            : "translateX(-105%)",
          transition:
            "transform 0.3s ease",
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
        }}
      >

        {/* MENU HEADER */}

        <div
          style={{
            padding:
              "22px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent:
              "space-between",
            background:
              "linear-gradient(135deg, #172554, #312e81, #6d28d9)",
            color: "#fff",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
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
                  letterSpacing:
                    "1px",
                  fontSize: "16px",
                }}
              >
                AURORA MENU
              </div>

              <small
                style={{
                  opacity: 0.8,
                }}
              >
                Navigation
              </small>
            </div>
          </div>

          <button
            type="button"
            onClick={closeMenu}
            aria-label="Close menu"
            style={{
              border: "none",
              background:
                "rgba(255,255,255,0.15)",
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

        {/* ACCOUNT SUMMARY */}

        <div
          style={{
            padding: "18px",
            borderBottom:
              "1px solid #eee",
            background: "#fafafa",
            flexShrink: 0,
          }}
        >
          {loadingUser ? (
            <div
              style={{
                fontSize: "14px",
                color: "#777",
              }}
            >
              Loading account...
            </div>
          ) : user ? (
            <div
              style={{
                display: "flex",
                alignItems:
                  "center",
                gap: "12px",
              }}
            >
              <div
                style={{
                  width: "46px",
                  height: "46px",
                  borderRadius:
                    "14px",
                  background:
                    "linear-gradient(135deg, #312e81, #7c3aed)",
                  color: "#fff",
                  display: "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "center",
                  fontWeight: 800,
                  fontSize: "14px",
                  flexShrink: 0,
                }}
              >
                {getInitials(
                  user.name
                )}
              </div>

              <div
                style={{
                  minWidth: 0,
                  flex: 1,
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    color: "#222",
                    overflow: "hidden",
                    textOverflow:
                      "ellipsis",
                    whiteSpace:
                      "nowrap",
                  }}
                >
                  {user.name}
                </div>

                <div
                  style={{
                    fontSize: "12px",
                    color: "#777",
                    marginTop:
                      "3px",
                    overflow:
                      "hidden",
                    textOverflow:
                      "ellipsis",
                    whiteSpace:
                      "nowrap",
                  }}
                >
                  {user.email}
                </div>

                <span
                  style={{
                    display:
                      "inline-block",
                    marginTop:
                      "6px",
                    padding:
                      "3px 8px",
                    borderRadius:
                      "20px",
                    background:
                      isAdmin
                        ? "#ede9fe"
                        : "#dcfce7",
                    color:
                      isAdmin
                        ? "#6d28d9"
                        : "#15803d",
                    fontSize:
                      "10px",
                    fontWeight: 700,
                  }}
                >
                  {isAdmin
                    ? "ADMIN"
                    : "CUSTOMER"}
                </span>
              </div>
            </div>
          ) : (
            <Link
              href="/account"
              onClick={closeMenu}
              style={{
                textDecoration:
                  "none",
                fontWeight: 600,
                color: "#312e81",
              }}
            >
              Sign in to your account →
            </Link>
          )}
        </div>

        {/* MENU CONTENT */}

        <div
          style={{
            padding: "14px",
          }}
        >
          <MenuSection title="MAIN">

            <SideLink
              href="/"
              icon={
                <Store size={18} />
              }
              label="Store Front"
              onClick={closeMenu}
            />

            <SideLink
              href="/account"
              icon={
                <UserRound size={18} />
              }
              label="Account"
              onClick={closeMenu}
            />

            <SideLink
              href="/wishlist"
              icon={
                <Heart size={18} />
              }
              label="Wishlist"
              badge={
                wishlist.length > 0
                  ? String(
                      wishlist.length
                    )
                  : undefined
              }
              onClick={closeMenu}
            />

            <SideLink
              href="/orders"
              icon={
                <ClipboardList
                  size={18}
                />
              }
              label="Orders"
              onClick={closeMenu}
            />

            {/* PROFILE */}

            <button
              type="button"
              onClick={openProfile}
              style={{
                width: "100%",
                border: "none",
                display: "flex",
                alignItems:
                  "center",
                gap: "12px",
                padding:
                  "12px 13px",
                marginBottom:
                  "4px",
                borderRadius:
                  "11px",
                color: "#333",
                background:
                  "transparent",
                fontWeight: 500,
                cursor:
                  "pointer",
                textAlign:
                  "left",
              }}
            >
              <span
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius:
                    "9px",
                  display: "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "center",
                  background:
                    "#f5f5f5",
                  color: "#666",
                  flexShrink: 0,
                }}
              >
                <UserCircle
                  size={18}
                />
              </span>

              <span
                style={{
                  flex: 1,
                }}
              >
                Profile
              </span>

              <span
                style={{
                  fontSize: "11px",
                  color: "#999",
                }}
              >
                View
              </span>
            </button>

          </MenuSection>

          {/* ADMIN */}

          {isAdmin && (
            <MenuSection
              title="ADMINISTRATION"
            >

              <SideLink
                href="/admin"
                icon={
                  <LayoutDashboard
                    size={18}
                  />
                }
                label="Admin Dashboard"
                onClick={closeMenu}
                highlighted
              />

              <SideLink
                href="/admin/orders"
                icon={
                  <ClipboardList
                    size={18}
                  />
                }
                label="Orders"
                onClick={closeMenu}
              />

              <SideLink
                href="/admin/revenue"
                icon={
                  <IndianRupee
                    size={18}
                  />
                }
                label="Revenue"
                onClick={closeMenu}
              />

              <SideLink
                href="/admin/customers"
                icon={
                  <Users size={18} />
                }
                label="Customers"
                onClick={closeMenu}
              />

              <SideLink
                href="/admin/products"
                icon={
                  <Package size={18} />
                }
                   label="Products"
                     onClick={closeMenu}
                    />

              <SideLink
                href="/admin/products/new"
                icon={
                  <PlusCircle
                    size={18}
                  />
                }
                label="Add Product"
                onClick={closeMenu}
              />

            </MenuSection>
          )}

          {/* QUICK ACCESS */}

          <MenuSection
            title="QUICK ACCESS"
          >
            <SideLink
              href="/products"
              icon={
                <Store size={18} />
              }
              label="Shop All Products"
              onClick={closeMenu}
            />

            <SideLink
              href="/cart"
              icon={
                <ShoppingBag
                  size={18}
                />
              }
              label="Shopping Bag"
              badge={
                cartCount > 0
                  ? String(
                      cartCount
                    )
                  : undefined
              }
              onClick={closeMenu}
            />
          </MenuSection>

          {/* LOGOUT */}

          {user && (
            <button
              type="button"
              onClick={handleLogout}
              style={{
                width: "100%",
                marginTop: "12px",
                padding:
                  "12px 14px",
                border:
                  "1px solid #fee2e2",
                borderRadius:
                  "12px",
                background:
                  "#fff",
                color:
                  "#dc2626",
                display:
                  "flex",
                alignItems:
                  "center",
                gap: "12px",
                cursor:
                  "pointer",
                fontWeight: 600,
              }}
            >
              <LogOut size={18} />
              Logout
            </button>
          )}
        </div>
      </aside>

      {/* =====================================================
          PROFILE MODAL
      ===================================================== */}

      {profileOpen && (
        <>
          {/* BACKDROP */}

          <div
            onClick={closeProfile}
            style={{
              position: "fixed",
              inset: 0,
              background:
                "rgba(15, 23, 42, 0.65)",
              backdropFilter:
                "blur(5px)",
              zIndex: 10000,
            }}
          />

          {/* MODAL POSITIONER */}

          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 10001,
              display: "flex",
              alignItems:
                "center",
              justifyContent:
                "center",
              padding: "16px",
              pointerEvents:
                "none",
              overflow: "hidden",
            }}
          >

            {/* MODAL */}

            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="aurora-profile-title"
              style={{
                width: "100%",
                maxWidth:
                  "720px",
                height:
                  "min(90vh, 760px)",
                background:
                  "#ffffff",
                borderRadius:
                  "24px",
                boxShadow:
                  "0 30px 80px rgba(0,0,0,0.28)",
                pointerEvents:
                  "auto",
                display:
                  "flex",
                flexDirection:
                  "column",
                overflow:
                  "hidden",
              }}
              onClick={(e) =>
                e.stopPropagation()
              }
            >

              {/* =================================================
                  MODAL HEADER
              ================================================= */}

              <div
                style={{
                  padding:
                    "26px 30px",
                  background:
                    "linear-gradient(135deg, #172554 0%, #312e81 50%, #7c3aed 100%)",
                  color: "#fff",
                  position:
                    "relative",
                  flexShrink: 0,
                }}
              >
                <button
                  type="button"
                  onClick={
                    closeProfile
                  }
                  disabled={
                    profileSaving
                  }
                  aria-label="Close profile"
                  style={{
                    position:
                      "absolute",
                    top: "18px",
                    right: "18px",
                    width: "38px",
                    height: "38px",
                    border: "none",
                    borderRadius:
                      "50%",
                    background:
                      "rgba(255,255,255,0.14)",
                    color: "#fff",
                    display:
                      "flex",
                    alignItems:
                      "center",
                    justifyContent:
                      "center",
                    cursor:
                      "pointer",
                  }}
                >
                  <X size={19} />
                </button>

                <div
                  style={{
                    display:
                      "flex",
                    alignItems:
                      "center",
                    gap: "18px",
                    paddingRight:
                      "45px",
                  }}
                >
                  <div
                    style={{
                      width: "70px",
                      height: "70px",
                      borderRadius:
                        "20px",
                      background:
                        "rgba(255,255,255,0.95)",
                      color:
                        "#312e81",
                      display:
                        "flex",
                      alignItems:
                        "center",
                      justifyContent:
                        "center",
                      fontSize:
                        "23px",
                      fontWeight:
                        800,
                      flexShrink: 0,
                      boxShadow:
                        "0 10px 30px rgba(0,0,0,0.18)",
                    }}
                  >
                    {getInitials(
                      user?.name
                    )}
                  </div>

                  <div>
                    <div
                      style={{
                        fontSize:
                          "11px",
                        letterSpacing:
                          "1.5px",
                        fontWeight:
                          700,
                        opacity:
                          0.75,
                        marginBottom:
                          "5px",
                      }}
                    >
                      AURORA PROFILE
                    </div>

                    <h2
                      id="aurora-profile-title"
                      style={{
                        margin: 0,
                        fontSize:
                          "23px",
                        fontWeight:
                          800,
                      }}
                    >
                      {user?.name ||
                        "Your Profile"}
                    </h2>

                    <div
                      style={{
                        marginTop:
                          "5px",
                        fontSize:
                          "13px",
                        opacity:
                          0.8,
                      }}
                    >
                      {user?.email}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display:
                      "inline-flex",
                    alignItems:
                      "center",
                    gap: "6px",
                    marginTop:
                      "17px",
                    padding:
                      "6px 11px",
                    borderRadius:
                      "999px",
                    background:
                      "rgba(255,255,255,0.14)",
                    border:
                      "1px solid rgba(255,255,255,0.18)",
                    fontSize:
                      "10px",
                    fontWeight:
                      800,
                  }}
                >
                  <ShieldCheck
                    size={13}
                  />

                  {isAdmin
                    ? "ADMIN ACCOUNT"
                    : "CUSTOMER ACCOUNT"}
                </div>
              </div>

              {/* =================================================
                  SCROLLABLE MODAL BODY
              ================================================= */}

              <div
                style={{
                  flex: 1,
                  minHeight: 0,
                  overflowY: "auto",
                  overflowX: "hidden",
                  padding:
                    "28px 30px",
                  WebkitOverflowScrolling:
                    "touch",
                  scrollbarWidth:
                    "thin",
                }}
              >

                {/* LOADING */}

                {profileLoading && (
                  <div
                    style={{
                      padding:
                        "0 0 18px",
                      fontSize:
                        "13px",
                      color:
                        "#777",
                    }}
                  >
                    Loading latest profile information...
                  </div>
                )}

                {/* ERROR */}

                {profileError && (
                  <div
                    style={{
                      padding:
                        "12px 14px",
                      marginBottom:
                        "20px",
                      borderRadius:
                        "12px",
                      background:
                        "#fef2f2",
                      border:
                        "1px solid #fecaca",
                      color:
                        "#b91c1c",
                      fontSize:
                        "13px",
                      fontWeight:
                        600,
                    }}
                  >
                    {profileError}
                  </div>
                )}

                {/* SUCCESS */}

                {profileSuccess && (
                  <div
                    style={{
                      padding:
                        "12px 14px",
                      marginBottom:
                        "20px",
                      borderRadius:
                        "12px",
                      background:
                        "#f0fdf4",
                      border:
                        "1px solid #bbf7d0",
                      color:
                        "#15803d",
                      fontSize:
                        "13px",
                      fontWeight:
                        600,
                    }}
                  >
                    {profileSuccess}
                  </div>
                )}

                {/* PERSONAL INFORMATION */}

                <ProfileSectionTitle
                  icon={
                    <User size={17} />
                  }
                  title="Personal Information"
                  description="Manage your basic account details."
                />

                <div
                  style={{
                    display:
                      "grid",
                    gridTemplateColumns:
                      "repeat(2, minmax(0, 1fr))",
                    gap: "18px",
                    marginTop:
                      "18px",
                  }}
                >
                  <ProfileField
                    label="Full Name"
                    icon={
                      <User size={16} />
                    }
                  >
                    {profileEditing ? (
                      <input
                        type="text"
                        value={
                          profileForm.name
                        }
                        onChange={(e) =>
                          setProfileForm(
                            {
                              ...profileForm,
                              name: e.target
                                .value,
                            }
                          )
                        }
                        placeholder="Enter your full name"
                        style={
                          inputStyle
                        }
                      />
                    ) : (
                      <div
                        style={
                          valueStyle
                        }
                      >
                        {user?.name ||
                          "Not available"}
                      </div>
                    )}
                  </ProfileField>

                  <ProfileField
                    label="Email Address"
                    icon={
                      <Mail size={16} />
                    }
                  >
                    {profileEditing ? (
                      <input
                        type="email"
                        value={
                          profileForm.email
                        }
                        onChange={(e) =>
                          setProfileForm(
                            {
                              ...profileForm,
                              email: e.target
                                .value,
                            }
                          )
                        }
                        placeholder="Enter your email"
                        style={
                          inputStyle
                        }
                      />
                    ) : (
                      <div
                        style={
                          valueStyle
                        }
                      >
                        {user?.email ||
                          "Not available"}
                      </div>
                    )}
                  </ProfileField>
                </div>

                {/* ACCOUNT INFORMATION */}

                <div
                  style={{
                    marginTop:
                      "30px",
                    paddingTop:
                      "26px",
                    borderTop:
                      "1px solid #eee",
                  }}
                >
                  <ProfileSectionTitle
                    icon={
                      <ShieldCheck
                        size={17}
                      />
                    }
                    title="Account Information"
                    description="Your Aurora account access details."
                  />

                  <div
                    style={{
                      display:
                        "grid",
                      gridTemplateColumns:
                        "repeat(2, minmax(0, 1fr))",
                      gap: "18px",
                      marginTop:
                        "18px",
                    }}
                  >
                    <ProfileField
                      label="Account Type"
                      icon={
                        <ShieldCheck
                          size={16}
                        />
                      }
                    >
                      <div
                        style={
                          valueStyle
                        }
                      >
                        <span
                          style={{
                            display:
                              "inline-flex",
                            alignItems:
                              "center",
                            padding:
                              "5px 10px",
                            borderRadius:
                              "999px",
                            background:
                              isAdmin
                                ? "#ede9fe"
                                : "#dcfce7",
                            color:
                              isAdmin
                                ? "#6d28d9"
                                : "#15803d",
                            fontSize:
                              "11px",
                            fontWeight:
                              800,
                          }}
                        >
                          {isAdmin
                            ? "ADMIN"
                            : "CUSTOMER"}
                        </span>
                      </div>
                    </ProfileField>

                    <ProfileField
                      label="User ID"
                      icon={
                        <UserCircle
                          size={16}
                        />
                      }
                    >
                      <div
                        style={
                          valueStyle
                        }
                      >
                        #{user?.id}
                      </div>
                    </ProfileField>
                  </div>
                </div>

                {/* QUICK ACCESS */}

                <div
                  style={{
                    marginTop:
                      "30px",
                    paddingTop:
                      "26px",
                    borderTop:
                      "1px solid #eee",
                  }}
                >
                  <ProfileSectionTitle
                    icon={
                      <Store size={17} />
                    }
                    title="Quick Access"
                    description="Jump directly to your Aurora account areas."
                  />

                  <div
                    style={{
                      display:
                        "grid",
                      gridTemplateColumns:
                        "repeat(2, minmax(0, 1fr))",
                      gap: "12px",
                      marginTop:
                        "18px",
                      paddingBottom:
                        "10px",
                    }}
                  >
                    <QuickProfileLink
                      href="/orders"
                      icon={
                        <ClipboardList
                          size={17}
                        />
                      }
                      label="My Orders"
                      onClick={
                        closeProfile
                      }
                    />

                    <QuickProfileLink
                      href="/wishlist"
                      icon={
                        <Heart size={17} />
                      }
                      label="My Wishlist"
                      onClick={
                        closeProfile
                      }
                    />
                  </div>
                </div>

                {/* EXTRA SPACE AT BOTTOM */}

                <div
                  style={{
                    height: "20px",
                  }}
                />

              </div>

              {/* =================================================
                  FIXED MODAL FOOTER
              ================================================= */}

              <div
                style={{
                  padding:
                    "16px 30px",
                  borderTop:
                    "1px solid #eee",
                  background:
                    "#fafafa",
                  display:
                    "flex",
                  justifyContent:
                    "flex-end",
                  gap: "10px",
                  flexShrink: 0,
                }}
              >
                {profileEditing ? (
                  <>
                    <button
                      type="button"
                      onClick={
                        cancelProfileEdit
                      }
                      disabled={
                        profileSaving
                      }
                      style={
                        secondaryButtonStyle
                      }
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={
                        saveProfile
                      }
                      disabled={
                        profileSaving
                      }
                      style={
                        primaryButtonStyle
                      }
                    >
                      <Save size={16} />

                      {profileSaving
                        ? "Saving..."
                        : "Save Changes"}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={
                        closeProfile
                      }
                      style={
                        secondaryButtonStyle
                      }
                    >
                      Close
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setProfileEditing(
                          true
                        );

                        setProfileError(
                          ""
                        );

                        setProfileSuccess(
                          ""
                        );
                      }}
                      style={
                        primaryButtonStyle
                      }
                    >
                      <Pencil size={16} />

                      Edit Profile
                    </button>
                  </>
                )}
              </div>

            </div>
          </div>
        </>
      )}
    </>
  );
}

/* =========================================================
   PROFILE SECTION TITLE
========================================================= */

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
    <div
      style={{
        display: "flex",
        alignItems:
          "flex-start",
        gap: "10px",
      }}
    >
      <div
        style={{
          width: "34px",
          height: "34px",
          borderRadius: "10px",
          background: "#f0edff",
          color: "#6d28d9",
          display: "flex",
          alignItems:
            "center",
          justifyContent:
            "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </div>

      <div>
        <div
          style={{
            fontSize: "15px",
            fontWeight: 800,
            color: "#222",
          }}
        >
          {title}
        </div>

        <div
          style={{
            marginTop: "3px",
            fontSize: "12px",
            color: "#888",
          }}
        >
          {description}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   PROFILE FIELD
========================================================= */

function ProfileField({
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
          alignItems:
            "center",
          gap: "6px",
          marginBottom:
            "8px",
          fontSize: "11px",
          fontWeight: 800,
          color: "#888",
          textTransform:
            "uppercase",
          letterSpacing:
            "0.7px",
        }}
      >
        {icon}

        {label}
      </div>

      {children}
    </div>
  );
}

/* =========================================================
   QUICK PROFILE LINK
========================================================= */

function QuickProfileLink({
  href,
  icon,
  label,
  onClick,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      style={{
        display: "flex",
        alignItems:
          "center",
        gap: "10px",
        padding:
          "12px 14px",
        borderRadius:
          "12px",
        border:
          "1px solid #eee",
        background:
          "#fff",
        color: "#333",
        textDecoration:
          "none",
        fontSize: "13px",
        fontWeight: 600,
      }}
    >
      <span
        style={{
          width: "32px",
          height: "32px",
          borderRadius: "9px",
          background:
            "#f5f3ff",
          color: "#6d28d9",
          display: "flex",
          alignItems:
            "center",
          justifyContent:
            "center",
        }}
      >
        {icon}
      </span>

      {label}
    </Link>
  );
}

/* =========================================================
   MENU SECTION
========================================================= */

function MenuSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        marginBottom:
          "20px",
      }}
    >
      <div
        style={{
          fontSize: "10px",
          fontWeight: 800,
          letterSpacing:
            "1.4px",
          color: "#999",
          padding:
            "5px 10px 8px",
        }}
      >
        {title}
      </div>

      {children}
    </div>
  );
}

/* =========================================================
   SIDE LINK
========================================================= */

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
        alignItems:
          "center",
        gap: "12px",
        padding:
          "12px 13px",
        marginBottom:
          "4px",
        borderRadius:
          "11px",
        textDecoration:
          "none",
        color: highlighted
          ? "#312e81"
          : "#333",
        background:
          highlighted
            ? "#f0edff"
            : "transparent",
        fontWeight:
          highlighted
            ? 700
            : 500,
        transition:
          "all 0.2s ease",
      }}
    >
      <span
        style={{
          width: "34px",
          height: "34px",
          borderRadius: "9px",
          display: "flex",
          alignItems:
            "center",
          justifyContent:
            "center",
          background:
            highlighted
              ? "#ddd6fe"
              : "#f5f5f5",
          color:
            highlighted
              ? "#6d28d9"
              : "#666",
          flexShrink: 0,
        }}
      >
        {icon}
      </span>

      <span
        style={{
          flex: 1,
        }}
      >
        {label}
      </span>

      {badge && (
        <span
          style={{
            fontSize: "10px",
            padding:
              "3px 7px",
            borderRadius:
              "20px",
            background:
              "#f1f1f1",
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

/* =========================================================
   STYLES
========================================================= */

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid #ddd",
  borderRadius: "11px",
  padding: "11px 13px",
  outline: "none",
  fontSize: "13px",
  color: "#222",
  background: "#fff",
  boxSizing: "border-box",
};

const valueStyle: React.CSSProperties = {
  minHeight: "20px",
  padding: "11px 13px",
  borderRadius: "11px",
  background: "#f8f8fa",
  border: "1px solid #eee",
  color: "#333",
  fontSize: "13px",
  fontWeight: 600,
  overflowWrap: "anywhere",
};

const secondaryButtonStyle: React.CSSProperties = {
  border: "1px solid #ddd",
  background: "#fff",
  color: "#444",
  padding: "10px 16px",
  borderRadius: "10px",
  fontSize: "13px",
  fontWeight: 700,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: "7px",
};

const primaryButtonStyle: React.CSSProperties = {
  border: "none",
  background:
    "linear-gradient(135deg, #312e81, #7c3aed)",
  color: "#fff",
  padding: "10px 17px",
  borderRadius: "10px",
  fontSize: "13px",
  fontWeight: 700,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: "7px",
};