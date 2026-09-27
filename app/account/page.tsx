"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AccountPage() {
  const router = useRouter();

  const [mode, setMode] = useState<"login" | "register">(
    "login"
  );

  const [f, setF] = useState({
    name: "",
    email: "user@aurora.local",
    password: "User@123",
  });

  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    setBusy(true);
    setError("");

    try {
      const endpoint =
        mode === "login"
          ? "/api/auth/login"
          : "/api/auth/register";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(f),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error || "Something went wrong."
        );
        setBusy(false);
        return;
      }

      /*
       * The authentication cookie has now been created.
       *
       * Full navigation makes Header.tsx load the
       * latest authenticated session and role.
       */
      window.location.href = "/orders";
    } catch (error) {
      console.error(
        "Authentication failed:",
        error
      );

      setError(
        "Unable to connect to the server."
      );

      setBusy(false);
    }
  };

  return (
    <div className="container page-shell auth-shell">
      <div className="auth-card">
        <span className="eyebrow">
          AURORA ACCOUNT
        </span>

        <h1>
          {mode === "login"
            ? "Welcome back."
            : "Create your account."}
        </h1>

        <p>
          Save your wishlist, track orders and
          checkout faster.
        </p>

        <form onSubmit={submit}>
          {mode === "register" && (
            <input
              required
              placeholder="Full name"
              value={f.name}
              onChange={(e) =>
                setF({
                  ...f,
                  name: e.target.value,
                })
              }
            />
          )}

          <input
            required
            type="email"
            placeholder="Email"
            value={f.email}
            onChange={(e) =>
              setF({
                ...f,
                email: e.target.value,
              })
            }
          />

          <input
            required
            minLength={6}
            type="password"
            placeholder="Password"
            value={f.password}
            onChange={(e) =>
              setF({
                ...f,
                password: e.target.value,
              })
            }
          />

          {error && (
            <div className="error">
              {error}
            </div>
          )}

          <button
            disabled={busy}
            className="btn-primary wide"
            type="submit"
          >
            {busy
              ? "Please wait…"
              : mode === "login"
              ? "Sign in"
              : "Create account"}
          </button>
        </form>

        <button
          className="text-button"
          type="button"
          onClick={() =>
            setMode(
              mode === "login"
                ? "register"
                : "login"
            )
          }
        >
          {mode === "login"
            ? "New here? Create an account"
            : "Already have an account? Sign in"}
        </button>

        <small className="demo-note">
          Demo login: user@aurora.local / User@123
        </small>

        <Link
          href="/admin"
          className="admin-link"
        >
          Admin dashboard →
        </Link>
      </div>
    </div>
  );
}