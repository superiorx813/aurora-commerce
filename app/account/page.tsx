"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

const backgroundImage = "/uploads/account-background1.png";

const particles = [
  { top: "12%", left: "8%", size: 7, delay: 0 },
  { top: "20%", left: "88%", size: 5, delay: 1 },
  { top: "72%", left: "10%", size: 6, delay: 2 },
  { top: "82%", left: "87%", size: 8, delay: 0.7 },
  { top: "40%", left: "5%", size: 5, delay: 1.5 },
  { top: "55%", left: "94%", size: 6, delay: 2.2 },
  { top: "9%", left: "50%", size: 5, delay: 1.2 },
  { top: "91%", left: "48%", size: 7, delay: 1.8 },
];

export default function AccountPage() {
  const [mode, setMode] = useState<"login" | "register">("login");

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
        setError(data.error || "Something went wrong.");
        setBusy(false);
        return;
      }

      window.location.href = "/orders";
    } catch (error) {
      console.error("Authentication failed:", error);

      setError("Unable to connect to the server.");
      setBusy(false);
    }
  };

  const changeMode = (
    newMode: "login" | "register"
  ) => {
    setMode(newMode);
    setError("");
  };

  return (
    <main
      className="position-relative min-vh-100 overflow-hidden d-flex align-items-center justify-content-center"
      style={{
        backgroundColor: "#06172d",
      }}
    >
      {/* =========================================================
          FULL SCREEN BACKGROUND IMAGE
      ========================================================= */}
      <motion.img
        src={backgroundImage}
        alt="Aurora ecommerce background"
        className="position-absolute top-0 start-0 w-100 h-100"
        style={{
          objectFit: "cover",
          objectPosition: "center",
          zIndex: 0,
        }}
        initial={{
          scale: 1.02,
        }}
        animate={{
          scale: [1.02, 1.06, 1.02],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        onError={(e) => {
          console.error(
            "Account background image could not be loaded:",
            backgroundImage
          );
        }}
      />

      {/* =========================================================
          LIGHT BLUE OVERLAY
          Intentionally transparent so image remains visible.
      ========================================================= */}
      <div
        className="position-absolute top-0 start-0 w-100 h-100"
        style={{
          zIndex: 1,
          background:
            "linear-gradient(135deg, rgba(0,32,70,.32), rgba(0,95,180,.12), rgba(0,20,50,.38))",
        }}
      />

      {/* =========================================================
          TOP BLUE GLOW
      ========================================================= */}
      <motion.div
        className="position-absolute rounded-circle"
        style={{
          zIndex: 2,
          width: 420,
          height: 420,
          top: -220,
          left: -150,
          background:
            "radial-gradient(circle, rgba(0,174,255,.25), transparent 68%)",
          filter: "blur(20px)",
          pointerEvents: "none",
        }}
        animate={{
          scale: [1, 1.18, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 9,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* =========================================================
          BOTTOM BLUE GLOW
      ========================================================= */}
      <motion.div
        className="position-absolute rounded-circle"
        style={{
          zIndex: 2,
          width: 450,
          height: 450,
          right: -200,
          bottom: -250,
          background:
            "radial-gradient(circle, rgba(0,110,255,.25), transparent 68%)",
          filter: "blur(20px)",
          pointerEvents: "none",
        }}
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.4, 0.75, 0.4],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* =========================================================
          FLOATING PARTICLES
      ========================================================= */}
      {particles.map((particle, index) => (
        <motion.span
          key={index}
          className="position-absolute rounded-circle bg-white"
          style={{
            zIndex: 3,
            top: particle.top,
            left: particle.left,
            width: particle.size,
            height: particle.size,
            boxShadow:
              "0 0 15px rgba(255,255,255,.9)",
            pointerEvents: "none",
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.15, 0.8, 0.15],
            scale: [0.8, 1.15, 0.8],
          }}
          transition={{
            duration: 4 + index * 0.35,
            repeat: Infinity,
            delay: particle.delay,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* =========================================================
          LOGIN CONTENT
      ========================================================= */}
      <div
        className="container position-relative py-4"
        style={{
          zIndex: 10,
        }}
      >
        <div className="row justify-content-center">
          <div className="col-12 col-sm-11 col-md-9 col-lg-7 col-xl-6">

            {/* =====================================================
                TRANSPARENT LOGIN CARD
            ===================================================== */}
            <motion.div
              initial={{
                opacity: 0,
                y: 35,
                scale: 0.97,
              }}
              animate={{
                opacity: 40,
                y: 0,
                scale: 1.1,
              }}
              transition={{
                duration: 0.75,
                ease: "easeOut",
              }}
              className="rounded-4 overflow-hidden"
              style={{
                background:
                  "linear-gradient(135deg, rgba(56, 53, 112, 0.7), rgba(169, 78, 78, 0.26))",
                border:
                  "1px solid rgba(88, 212, 11, 0.72)",
                boxShadow:
                  "0 25px 70px rgba(145, 33, 33, 0.52), 0 0 35px rgba(0,132,255,.14)",
                backdropFilter: "blur(18px)",
                WebkitBackdropFilter: "blur(18px)",
              }}
            >
              <div className="p-4 p-md-5">

                <div className="row align-items-center">

                  {/* =================================================
                      LEFT BRAND AREA
                  ================================================= */}
                  <div className="col-md-5 text-center text-md-start mb-4 mb-md-0 pe-md-4">

                    <motion.div
                      initial={{
                        scale: 0.6,
                        opacity: 0,
                      }}
                      animate={{
                        scale: 1,
                        opacity: 1,
                      }}
                      transition={{
                        delay: 0.2,
                        duration: 0.5,
                      }}
                      className="mx-auto mx-md-0 mb-3 rounded-circle d-flex align-items-center justify-content-center"
                      style={{
                        width: 58,
                        height: 58,
                        background:
                          "rgba(255,255,255,.94)",
                        boxShadow:
                          "0 8px 25px rgba(0,0,0,.18)",
                      }}
                    >
                      <span
                        className="fw-bold"
                        style={{
                          fontSize: 26,
                          color: "#006dcc",
                        }}
                      >
                        A
                      </span>
                    </motion.div>

                    <div
                      className="fw-bold text-white"
                      style={{
                        letterSpacing: "4px",
                        fontSize: 13,
                      }}
                    >
                      AURORA
                    </div>

                    <h1
                      className="fw-bold text-white mt-3 mb-2"
                      style={{
                        fontSize:
                          "clamp(27px, 4vw, 34px)",
                        lineHeight: 1.1,
                      }}
                    >
                      {mode === "login"
                        ? "Welcome Back"
                        : "Join Aurora"}
                    </h1>

                    <p
                      className="text-white mb-0"
                      style={{
                        opacity: 0.82,
                        fontSize: 14,
                      }}
                    >
                      {mode === "login"
                        ? "Sign in and continue your shopping journey."
                        : "Create your account and discover something beautiful."}
                    </p>

                    <div
                      className="d-none d-md-block mt-4"
                      style={{
                        width: 55,
                        height: 3,
                        background:
                          "linear-gradient(90deg, #ffffff, #55baff)",
                        borderRadius: 20,
                      }}
                    />
                  </div>

                  {/* =================================================
                      RIGHT FORM AREA
                  ================================================= */}
                  <div className="col-md-7">

                    {/* LOGIN / REGISTER */}
                    <div
                      className="p-1 rounded-3 mb-3 d-flex"
                      style={{
                        background:
                          "rgba(0,35,75,.35)",
                        border:
                          "1px solid rgba(255,255,255,.2)",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          changeMode("login")
                        }
                        className={`btn flex-fill rounded-3 fw-semibold ${
                          mode === "login"
                            ? "text-primary"
                            : "text-white"
                        }`}
                        style={
                          mode === "login"
                            ? {
                                background:
                                  "rgba(255,255,255,.95)",
                                border: "none",
                                boxShadow:
                                  "0 4px 15px rgba(0,0,0,.12)",
                              }
                            : {
                                background:
                                  "transparent",
                                border: "none",
                              }
                        }
                      >
                        Sign In
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          changeMode("register")
                        }
                        className={`btn flex-fill rounded-3 fw-semibold ${
                          mode === "register"
                            ? "text-primary"
                            : "text-white"
                        }`}
                        style={
                          mode === "register"
                            ? {
                                background:
                                  "rgba(255,255,255,.95)",
                                border: "none",
                                boxShadow:
                                  "0 4px 15px rgba(0,0,0,.12)",
                              }
                            : {
                                background:
                                  "transparent",
                                border: "none",
                              }
                        }
                      >
                        Register
                      </button>
                    </div>

                    <form onSubmit={submit}>

                      {/* NAME */}
                      {mode === "register" && (
                        <motion.div
                          initial={{
                            opacity: 0,
                            height: 0,
                            y: -8,
                          }}
                          animate={{
                            opacity: 1,
                            height: "auto",
                            y: 0,
                          }}
                          className="mb-2"
                        >
                          <label className="form-label text-white small fw-semibold mb-1">
                            Full Name
                          </label>

                          <input
                            required
                            type="text"
                            placeholder="Enter your full name"
                            value={f.name}
                            onChange={(e) =>
                              setF({
                                ...f,
                                name: e.target.value,
                              })
                            }
                            className="form-control rounded-3"
                            style={{
                              height: 45,
                              background:
                                "rgba(255,255,255,.9)",
                              border:
                                "1px solid rgba(255,255,255,.75)",
                            }}
                          />
                        </motion.div>
                      )}

                      {/* EMAIL */}
                      <div className="mb-2">
                        <label className="form-label text-white small fw-semibold mb-1">
                          Email Address
                        </label>

                        <input
                          required
                          type="email"
                          placeholder="Enter your email"
                          value={f.email}
                          onChange={(e) =>
                            setF({
                              ...f,
                              email: e.target.value,
                            })
                          }
                          className="form-control rounded-3"
                          style={{
                            height: 45,
                            background:
                              "rgba(255,255,255,.9)",
                            border:
                              "1px solid rgba(255,255,255,.75)",
                          }}
                        />
                      </div>

                      {/* PASSWORD */}
                      <div className="mb-2">
                        <label className="form-label text-white small fw-semibold mb-1">
                          Password
                        </label>

                        <input
                          required
                          minLength={6}
                          type="password"
                          placeholder="Enter your password"
                          value={f.password}
                          onChange={(e) =>
                            setF({
                              ...f,
                              password: e.target.value,
                            })
                          }
                          className="form-control rounded-3"
                          style={{
                            height: 45,
                            background:
                              "rgba(255,255,255,.9)",
                            border:
                              "1px solid rgba(255,255,255,.75)",
                          }}
                        />
                      </div>

                      {/* ERROR */}
                      {error && (
                        <motion.div
                          initial={{
                            opacity: 0,
                            y: -5,
                          }}
                          animate={{
                            opacity: 1,
                            y: 0,
                          }}
                          className="alert alert-danger py-2 px-3 rounded-3 small mb-2"
                        >
                          {error}
                        </motion.div>
                      )}

                      {/* SUBMIT */}
                      <motion.button
                        disabled={busy}
                        type="submit"
                        whileHover={{
                          scale: busy ? 1 : 1.02,
                          y: busy ? 0 : -1,
                        }}
                        whileTap={{
                          scale: busy ? 1 : 0.98,
                        }}
                        className="btn w-100 rounded-3 fw-bold text-white border-0 mt-2"
                        style={{
                          height: 45,
                          background:
                            "linear-gradient(135deg, #005fc7, #008cff)",
                          boxShadow:
                            "0 8px 22px rgba(0,92,190,.3)",
                        }}
                      >
                        {busy
                          ? "Please wait..."
                          : mode === "login"
                          ? "Sign In"
                          : "Create Account"}
                      </motion.button>

                      {/* SWITCH */}
                      <div className="text-center mt-3">
                        <button
                          type="button"
                          onClick={() =>
                            changeMode(
                              mode === "login"
                                ? "register"
                                : "login"
                            )
                          }
                          className="btn btn-link text-white text-decoration-none p-0 small fw-semibold"
                        >
                          {mode === "login"
                            ? "New to Aurora? Create an account"
                            : "Already have an account? Sign in"}
                        </button>
                      </div>

                      {/* DEMO LOGIN */}
                      {mode === "login" && (
                        <div className="text-center mt-2">
                          <small className="text-white opacity-75">
                            Demo: user@aurora.local / User@123
                          </small>
                        </div>
                      )}

                      {/* ADMIN */}
                      <div className="text-center mt-2">
                        <Link
                          href="/admin"
                          className="small text-white text-decoration-none fw-semibold"
                        >
                          Admin dashboard →
                        </Link>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* BOTTOM TEXT */}
            <div className="text-center mt-3">
              <small className="text-white opacity-75">
                Secure & seamless shopping with Aurora
              </small>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}