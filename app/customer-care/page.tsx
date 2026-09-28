"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
  X,
} from "lucide-react";

export default function CustomerCarePage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setForm({
      name: "",
      email: "",
      phone: "",
      subject: "",
      message: "",
    });
    setTimeout(() => setSubmitted(false), 5000);
  };

  return (
    <div
      className="modal fade show d-block"
      tabIndex={-1}
      role="dialog"
      style={{
        background: "rgba(15, 23, 42, .62)",
        backdropFilter: "blur(6px)",
      }}
    >
      <div
        className="modal-dialog modal-dialog-centered modal-xl modal-dialog-scrollable"
        role="document"
      >
        <div
          className="modal-content border-0 overflow-hidden"
          style={{
            borderRadius: 24,
            background: "#f7faff",
            boxShadow: "0 30px 90px rgba(15, 23, 42, .28)",
          }}
        >
          {/* Header */}
          <div
            className="position-relative overflow-hidden px-4 px-md-5 py-4"
            style={{
              background:
                "linear-gradient(135deg, #173b67 0%, #2563a6 48%, #4d83c4 100%)",
              color: "#fff",
            }}
          >
            <div
              className="position-absolute rounded-circle"
              style={{
                width: 180,
                height: 180,
                right: -55,
                top: -100,
                background: "rgba(255,255,255,.08)",
              }}
            />

            <div
              className="position-absolute rounded-circle"
              style={{
                width: 110,
                height: 110,
                right: 100,
                bottom: -75,
                background: "rgba(255,255,255,.06)",
              }}
            />

            <div className="position-relative d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-3">
                <div
                  className="d-flex align-items-center justify-content-center rounded-4"
                  style={{
                    width: 52,
                    height: 52,
                    background: "rgba(255,255,255,.14)",
                    border: "1px solid rgba(255,255,255,.18)",
                    boxShadow: "0 8px 20px rgba(0,0,0,.12)",
                  }}
                >
                  <MessageCircle size={25} />
                </div>

                <div>
                  <div
                    className="small fw-semibold mb-1"
                    style={{ color: "rgba(255,255,255,.7)" }}
                  >
                    AURORA SUPPORT
                  </div>
                  <h4 className="fw-bold mb-0">Customer Care</h4>
                  <div
                    className="small mt-1"
                    style={{ color: "rgba(255,255,255,.75)" }}
                  >
                    We're here to help you
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => window.history.back()}
                className="btn p-0 border-0 d-flex align-items-center justify-content-center"
                aria-label="Close"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  color: "#fff",
                  background: "rgba(255,255,255,.12)",
                }}
              >
                <X size={21} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="modal-body p-4 p-md-5">
            {submitted && (
              <div
                className="d-flex align-items-center gap-3 rounded-4 p-3 mb-4"
                style={{
                  background: "#ecfdf5",
                  color: "#16734b",
                  border: "1px solid #b7efd3",
                }}
              >
                <CheckCircle2 size={21} />
                <div>
                  <div className="fw-semibold">Message sent successfully</div>
                  <div className="small">
                    Our customer care team will get back to you.
                  </div>
                </div>
              </div>
            )}

            <div className="row g-4">
              {/* Support Information */}
              <div className="col-lg-4">
                <div
                  className="h-100 rounded-4 p-4"
                  style={{
                    background:
                      "linear-gradient(145deg, #eaf3ff 0%, #f4f8ff 100%)",
                    border: "1px solid #dbe9f8",
                  }}
                >
                  <div
                    className="d-inline-flex align-items-center justify-content-center rounded-3 mb-3"
                    style={{
                      width: 46,
                      height: 46,
                      background:
                        "linear-gradient(135deg, #2563a6, #5b8fca)",
                      color: "#fff",
                      boxShadow: "0 8px 18px rgba(37,99,166,.2)",
                    }}
                  >
                    <MessageCircle size={21} />
                  </div>

                  <h5 className="fw-bold mb-2" style={{ color: "#183b63" }}>
                    We're here to help
                  </h5>

                  <p
                    className="small mb-4"
                    style={{
                      color: "#68788d",
                      lineHeight: 1.7,
                    }}
                  >
                    Have a question about your order, product, payment,
                    delivery, or account? Send us a message and our team will
                    assist you.
                  </p>

                  <div className="d-flex flex-column gap-3">
                    <div
                      className="d-flex align-items-center gap-3 p-3 rounded-3"
                      style={{
                        background: "#fff",
                        border: "1px solid #e4edf7",
                      }}
                    >
                      <div
                        className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
                        style={{
                          width: 40,
                          height: 40,
                          background: "#eaf3ff",
                          color: "#2563a6",
                        }}
                      >
                        <Mail size={18} />
                      </div>

                      <div>
                        <div
                          className="small"
                          style={{ color: "#7a8798" }}
                        >
                          Email
                        </div>
                        <div
                          className="small fw-semibold"
                          style={{ color: "#263b54" }}
                        >
                          support@aurora.com
                        </div>
                      </div>
                    </div>

                    <div
                      className="d-flex align-items-center gap-3 p-3 rounded-3"
                      style={{
                        background: "#fff",
                        border: "1px solid #e4edf7",
                      }}
                    >
                      <div
                        className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
                        style={{
                          width: 40,
                          height: 40,
                          background: "#eaf3ff",
                          color: "#2563a6",
                        }}
                      >
                        <Phone size={18} />
                      </div>

                      <div>
                        <div
                          className="small"
                          style={{ color: "#7a8798" }}
                        >
                          Phone
                        </div>
                        <div
                          className="small fw-semibold"
                          style={{ color: "#263b54" }}
                        >
                          +91 98765 43210
                        </div>
                      </div>
                    </div>

                    <div
                      className="d-flex align-items-center gap-3 p-3 rounded-3"
                      style={{
                        background: "#fff",
                        border: "1px solid #e4edf7",
                      }}
                    >
                      <div
                        className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
                        style={{
                          width: 40,
                          height: 40,
                          background: "#eaf3ff",
                          color: "#2563a6",
                        }}
                      >
                        <MapPin size={18} />
                      </div>

                      <div>
                        <div
                          className="small"
                          style={{ color: "#7a8798" }}
                        >
                          Location
                        </div>
                        <div
                          className="small fw-semibold"
                          style={{ color: "#263b54" }}
                        >
                          Andhra Pradesh, India
                        </div>
                      </div>
                    </div>
                  </div>

                  <div
                    className="mt-4 p-3 rounded-3"
                    style={{
                      background: "#fff",
                      border: "1px solid #e4edf7",
                    }}
                  >
                    <div
                      className="small fw-bold mb-1"
                      style={{ color: "#263b54" }}
                    >
                      Support Hours
                    </div>

                    <div
                      className="small"
                      style={{ color: "#718096" }}
                    >
                      Monday – Saturday · 9:00 AM – 6:00 PM
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Form */}
              <div className="col-lg-8">
                <div
                  className="rounded-4 p-4 p-md-4"
                  style={{
                    background: "#fff",
                    border: "1px solid #e3ebf5",
                    boxShadow: "0 8px 30px rgba(40,70,100,.05)",
                  }}
                >
                  <div className="mb-4">
                    <div
                      className="small fw-semibold mb-1"
                      style={{ color: "#4c82bd" }}
                    >
                      CONTACT SUPPORT
                    </div>

                    <h5
                      className="fw-bold mb-1"
                      style={{ color: "#203a59" }}
                    >
                      Send us a message
                    </h5>

                    <p className="text-secondary small mb-0">
                      Fill in the details below and our team will get back to
                      you.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit}>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold">
                          Full Name
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={form.name}
                          onChange={handleChange}
                          className="form-control"
                          placeholder="Enter your name"
                          required
                          style={{
                            borderRadius: 10,
                            padding: "11px 13px",
                            borderColor: "#dbe4ee",
                          }}
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label small fw-semibold">
                          Email Address
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={form.email}
                          onChange={handleChange}
                          className="form-control"
                          placeholder="Enter your email"
                          required
                          style={{
                            borderRadius: 10,
                            padding: "11px 13px",
                            borderColor: "#dbe4ee",
                          }}
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label small fw-semibold">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={form.phone}
                          onChange={handleChange}
                          className="form-control"
                          placeholder="Enter your phone number"
                          style={{
                            borderRadius: 10,
                            padding: "11px 13px",
                            borderColor: "#dbe4ee",
                          }}
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label small fw-semibold">
                          Subject
                        </label>
                        <input
                          type="text"
                          name="subject"
                          value={form.subject}
                          onChange={handleChange}
                          className="form-control"
                          placeholder="How can we help?"
                          required
                          style={{
                            borderRadius: 10,
                            padding: "11px 13px",
                            borderColor: "#dbe4ee",
                          }}
                        />
                      </div>

                      <div className="col-12">
                        <label className="form-label small fw-semibold">
                          Message
                        </label>
                        <textarea
                          name="message"
                          value={form.message}
                          onChange={handleChange}
                          className="form-control"
                          rows={5}
                          placeholder="Write your message here..."
                          required
                          style={{
                            resize: "vertical",
                            borderRadius: 10,
                            padding: "11px 13px",
                            borderColor: "#dbe4ee",
                          }}
                        />
                      </div>

                      <div className="col-12 pt-2">
                        <button
                          type="submit"
                          className="btn d-inline-flex align-items-center gap-2 px-4 py-2"
                          style={{
                            background:
                              "linear-gradient(135deg, #2563a6, #4d83c4)",
                            color: "#fff",
                            border: "none",
                            borderRadius: 10,
                            boxShadow: "0 7px 18px rgba(37,99,166,.2)",
                          }}
                        >
                          <Send size={17} />
                          Send Message
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            className="px-4 px-md-5 py-3 d-flex justify-content-end"
            style={{
              background: "#f8fafc",
              borderTop: "1px solid #e5edf5",
            }}
          >
            <button
              type="button"
              onClick={() => window.history.back()}
              className="btn btn-sm px-4"
              style={{
                border: "1px solid #d5dfeb",
                background: "#fff",
                color: "#526070",
                borderRadius: 9,
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}