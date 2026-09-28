"use client";

import { FormEvent, useState } from "react";
import {
  CheckCircle2,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
  X,
} from "lucide-react";

type FormData = {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
};

export default function CustomerCareModal() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (submitting) return;

    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/customer-care", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to submit your message."
        );
      }

      setSubmitted(true);

      setForm({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      });
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to submit your message. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const closeModal = () => {
    if (submitting) return;

    window.history.back();
  };

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{
        zIndex: 2000,
        background: "rgba(15, 23, 42, .62)",
        backdropFilter: "blur(6px)",
        padding: "20px",
      }}
    >
      <div
        className="bg-white w-100 overflow-hidden"
        style={{
          maxWidth: "1100px",
          maxHeight: "92vh",
          borderRadius: "24px",
          boxShadow: "0 30px 80px rgba(15, 23, 42, .28)",
          overflowY: "auto",
        }}
      >
        <div
          className="position-relative text-white"
          style={{
            background:
              "linear-gradient(135deg, #173b67 0%, #2563a6 48%, #4d83c4 100%)",
            padding: "28px 32px",
          }}
        >
          <div
            className="position-absolute rounded-circle"
            style={{
              width: "150px",
              height: "150px",
              right: "-50px",
              top: "-80px",
              background: "rgba(255,255,255,.08)",
            }}
          />

          <div
            className="position-absolute rounded-circle"
            style={{
              width: "100px",
              height: "100px",
              right: "100px",
              bottom: "-65px",
              background: "rgba(255,255,255,.06)",
            }}
          />

          <button
            type="button"
            onClick={closeModal}
            disabled={submitting}
            className="btn btn-light position-absolute top-0 end-0 m-3 d-flex align-items-center justify-content-center"
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "12px",
              opacity: submitting ? 0.5 : 1,
            }}
          >
            <X size={19} />
          </button>

          <div
            className="text-uppercase fw-semibold mb-2"
            style={{
              fontSize: "12px",
              letterSpacing: "2px",
              opacity: 0.75,
            }}
          >
            AURORA SUPPORT
          </div>

          <h2 className="fw-bold mb-2">Customer Care</h2>

          <p
            className="mb-0"
            style={{
              maxWidth: "650px",
              opacity: 0.88,
              lineHeight: 1.6,
            }}
          >
            Have a question or need help with your order? Send us a
            message and our support team will get back to you.
          </p>
        </div>

        <div className="p-4 p-lg-5">
          {submitted ? (
            <div
              className="text-center py-5 px-3"
              style={{
                background: "#f4f9ff",
                borderRadius: "20px",
              }}
            >
              <div
                className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                style={{
                  width: "72px",
                  height: "72px",
                  background: "#e2f7eb",
                  color: "#198754",
                }}
              >
                <CheckCircle2 size={38} />
              </div>

              <h4 className="fw-bold text-dark mb-2">
                Message Sent Successfully
              </h4>

              <p
                className="text-secondary mx-auto mb-4"
                style={{ maxWidth: "520px" }}
              >
                Thank you for contacting Aurora Customer Care. Your
                message has been received and our support team will
                review it shortly.
              </p>

              <button
                type="button"
                onClick={closeModal}
                className="btn text-white px-4 py-2"
                style={{
                  border: 0,
                  borderRadius: "12px",
                  background:
                    "linear-gradient(135deg, #2563a6, #4d83c4)",
                }}
              >
                Close
              </button>
            </div>
          ) : (
            <div className="row g-4">
              <div className="col-lg-4">
                <div
                  className="h-100 p-4"
                  style={{
                    background: "#f1f7ff",
                    borderRadius: "20px",
                    border: "1px solid #dcecff",
                  }}
                >
                  <div
                    className="d-flex align-items-center justify-content-center rounded-3 mb-3"
                    style={{
                      width: "48px",
                      height: "48px",
                      background:
                        "linear-gradient(135deg, #2563a6, #4d83c4)",
                      color: "#fff",
                    }}
                  >
                    <MessageCircle size={23} />
                  </div>

                  <h5 className="fw-bold text-dark">
                    How can we help?
                  </h5>

                  <p
                    className="text-secondary small"
                    style={{ lineHeight: 1.7 }}
                  >
                    Our Customer Care team is here to help with orders,
                    products, payments, deliveries and other questions.
                  </p>

                  <div className="mt-4">
                    <div className="d-flex gap-3 mb-3">
                      <Mail
                        size={19}
                        className="text-primary flex-shrink-0 mt-1"
                      />
                      <div>
                        <div className="fw-semibold text-dark small">
                          Email
                        </div>
                        <div className="text-secondary small">
                          support@aurora.com
                        </div>
                      </div>
                    </div>

                    <div className="d-flex gap-3 mb-3">
                      <Phone
                        size={19}
                        className="text-primary flex-shrink-0 mt-1"
                      />
                      <div>
                        <div className="fw-semibold text-dark small">
                          Phone
                        </div>
                        <div className="text-secondary small">
                          +91 98765 43210
                        </div>
                      </div>
                    </div>

                    <div className="d-flex gap-3">
                      <MapPin
                        size={19}
                        className="text-primary flex-shrink-0 mt-1"
                      />
                      <div>
                        <div className="fw-semibold text-dark small">
                          Support Hours
                        </div>
                        <div className="text-secondary small">
                          Monday - Saturday
                          <br />
                          9:00 AM - 6:00 PM
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-lg-8">
                <div
                  className="p-4"
                  style={{
                    borderRadius: "20px",
                    border: "1px solid #e9eef5",
                  }}
                >
                  <h5 className="fw-bold text-dark mb-1">
                    Send us a message
                  </h5>

                  <p className="text-secondary small mb-4">
                    Fill in the details below and we'll get back to you.
                  </p>

                  {error && (
                    <div
                      className="alert alert-danger d-flex align-items-center"
                      role="alert"
                      style={{ borderRadius: "12px" }}
                    >
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleSubmit}>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label fw-semibold small">
                          Full Name *
                        </label>

                        <input
                          type="text"
                          name="name"
                          value={form.name}
                          onChange={handleChange}
                          className="form-control"
                          placeholder="Enter your name"
                          maxLength={120}
                          required
                          disabled={submitting}
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-semibold small">
                          Email *
                        </label>

                        <input
                          type="email"
                          name="email"
                          value={form.email}
                          onChange={handleChange}
                          className="form-control"
                          placeholder="Enter your email"
                          maxLength={255}
                          required
                          disabled={submitting}
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-semibold small">
                          Phone
                        </label>

                        <input
                          type="tel"
                          name="phone"
                          value={form.phone}
                          onChange={handleChange}
                          className="form-control"
                          placeholder="Enter your phone number"
                          maxLength={30}
                          disabled={submitting}
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-semibold small">
                          Subject *
                        </label>

                        <input
                          type="text"
                          name="subject"
                          value={form.subject}
                          onChange={handleChange}
                          className="form-control"
                          placeholder="What do you need help with?"
                          maxLength={200}
                          required
                          disabled={submitting}
                        />
                      </div>

                      <div className="col-12">
                        <label className="form-label fw-semibold small">
                          Message *
                        </label>

                        <textarea
                          name="message"
                          value={form.message}
                          onChange={handleChange}
                          className="form-control"
                          placeholder="Describe your issue..."
                          rows={5}
                          maxLength={5000}
                          required
                          disabled={submitting}
                        />
                      </div>

                      <div className="col-12 d-flex justify-content-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={closeModal}
                          disabled={submitting}
                          className="btn btn-light px-4"
                          style={{
                            borderRadius: "12px",
                            border: "1px solid #dfe6ef",
                          }}
                        >
                          Close
                        </button>

                        <button
                          type="submit"
                          disabled={submitting}
                          className="btn text-white px-4 d-flex align-items-center gap-2"
                          style={{
                            border: 0,
                            borderRadius: "12px",
                            background:
                              "linear-gradient(135deg, #2563a6, #4d83c4)",
                          }}
                        >
                          {submitting ? (
                            <>
                              <Loader2
                                size={18}
                                className="spinner-border"
                              />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Send size={17} />
                              Send Message
                            </>
                          )}
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
  );
}