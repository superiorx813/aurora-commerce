"use client";

import { useEffect, useState } from "react";

type RequestType =
  | "CANCELLATION"
  | "REFUND"
  | "REPLACEMENT";

type OrderRequestModalProps = {
  order: {
    id: number;
    order_number: string;
    total: number | string;
  } | null;

  onClose: () => void;

  onSubmitted?: () => void;
};

export default function OrderRequestModal({
  order,
  onClose,
  onSubmitted
}: OrderRequestModalProps) {
  const [requestType, setRequestType] =
    useState<RequestType>("CANCELLATION");

  const [reason, setReason] =
    useState("");

  const [details, setDetails] =
    useState("");

  const [refundAmount, setRefundAmount] =
    useState("");

  const [replacementDetails, setReplacementDetails] =
    useState("");

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  /* -------------------------------------------------------
     Reset form when order changes
  ------------------------------------------------------- */

  useEffect(() => {
    if (order) {
      setRequestType("CANCELLATION");
      setReason("");
      setDetails("");
      setRefundAmount(String(order.total));
      setReplacementDetails("");
      setError("");
      setSuccess(false);
    }
  }, [order]);

  if (!order) {
    return null;
  }

  const submitRequest = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setError("");
    setSubmitting(true);

    try {
      const response = await fetch(
        "/api/orders/request",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            orderId: order.id,
            requestType,
            reason,
            details,
            refundAmount:
              requestType === "REFUND"
                ? refundAmount
                : null,
            replacementDetails:
              requestType === "REPLACEMENT"
                ? replacementDetails
                : null
          })
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            "Could not submit your request."
        );

        setSubmitting(false);
        return;
      }

      setSuccess(true);
      setSubmitting(false);

      if (onSubmitted) {
        onSubmitted();
      }
    } catch (error) {
      console.error(
        "Request submission error:",
        error
      );

      setError(
        "Unable to connect to the server."
      );

      setSubmitting(false);
    }
  };

  return (
    <div
      className="modal d-block"
      tabIndex={-1}
      role="dialog"
      style={{
        backgroundColor:
          "rgba(0,0,0,.55)"
      }}
    >
      <div
        className="modal-dialog modal-dialog-centered modal-lg"
        role="document"
      >
        <div className="modal-content border-0 rounded-4 shadow-lg overflow-hidden">

          {/* =========================================
              HEADER
          ========================================= */}

          <div className="modal-header bg-primary text-white border-0 px-4 py-3">

            <div>
              <h5 className="modal-title fw-bold mb-1">
                Cancellation / Refund / Replacement
              </h5>

              <div className="small opacity-75">
                Order #{order.order_number}
              </div>
            </div>

            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
              aria-label="Close"
            />

          </div>

          {/* =========================================
              SUCCESS
          ========================================= */}

          {success ? (

            <div className="modal-body text-center px-4 py-5">

              <div
                className="rounded-circle bg-success-subtle text-success d-inline-flex align-items-center justify-content-center mb-4"
                style={{
                  width: "72px",
                  height: "72px",
                  fontSize: "30px"
                }}
              >
                ✓
              </div>

              <h4 className="fw-bold mb-2">
                Request Submitted
              </h4>

              <p className="text-secondary mb-4">
                Your request has been submitted
                successfully. Please wait for approval.
              </p>

              <button
                type="button"
                className="btn btn-primary rounded-3 px-4 fw-semibold"
                onClick={onClose}
              >
                Done
              </button>

            </div>

          ) : (

            <form onSubmit={submitRequest}>

              <div className="modal-body p-4">

                {/* ===================================
                    REQUEST TYPE
                =================================== */}

                <label className="form-label fw-semibold">
                  Select request type
                </label>

                <div className="row g-3 mb-4">

                  {[
                    {
                      value: "CANCELLATION",
                      label: "Cancellation",
                      icon: "✕"
                    },
                    {
                      value: "REFUND",
                      label: "Refund",
                      icon: "₹"
                    },
                    {
                      value: "REPLACEMENT",
                      label: "Replacement",
                      icon: "↻"
                    }
                  ].map((option) => (

                    <div
                      className="col-12 col-md-4"
                      key={option.value}
                    >

                      <button
                        type="button"
                        className={`btn w-100 text-start border rounded-4 p-3 ${
                          requestType === option.value
                            ? "border-primary bg-primary-subtle"
                            : "bg-light"
                        }`}
                        onClick={() =>
                          setRequestType(
                            option.value as RequestType
                          )
                        }
                      >

                        <div className="d-flex align-items-center gap-3">

                          <span
                            className={`rounded-circle d-flex align-items-center justify-content-center ${
                              requestType === option.value
                                ? "bg-primary text-white"
                                : "bg-white text-primary"
                            }`}
                            style={{
                              width: "38px",
                              height: "38px"
                            }}
                          >
                            {option.icon}
                          </span>

                          <span className="fw-semibold">
                            {option.label}
                          </span>

                        </div>

                      </button>

                    </div>

                  ))}

                </div>

                {/* ===================================
                    REASON
                =================================== */}

                <div className="mb-3">

                  <label className="form-label fw-semibold">
                    Reason
                  </label>

                  <select
                    className="form-select rounded-3"
                    value={reason}
                    onChange={(e) =>
                      setReason(e.target.value)
                    }
                    required
                  >
                    <option value="">
                      Select a reason
                    </option>

                    {requestType === "CANCELLATION" && (
                      <>
                        <option>
                          Changed my mind
                        </option>

                        <option>
                          Ordered by mistake
                        </option>

                        <option>
                          Found a better price
                        </option>

                        <option>
                          Delivery taking too long
                        </option>
                      </>
                    )}

                    {requestType === "REFUND" && (
                      <>
                        <option>
                          Product damaged
                        </option>

                        <option>
                          Product defective
                        </option>

                        <option>
                          Wrong product received
                        </option>

                        <option>
                          Product not as expected
                        </option>
                      </>
                    )}

                    {requestType === "REPLACEMENT" && (
                      <>
                        <option>
                          Wrong size
                        </option>

                        <option>
                          Damaged product
                        </option>

                        <option>
                          Defective product
                        </option>

                        <option>
                          Wrong product received
                        </option>
                      </>
                    )}

                  </select>

                </div>

                {/* ===================================
                    REFUND
                =================================== */}

                {requestType === "REFUND" && (

                  <div className="mb-3">

                    <label className="form-label fw-semibold">
                      Refund amount
                    </label>

                    <div className="input-group">

                      <span className="input-group-text">
                        ₹
                      </span>

                      <input
                        type="number"
                        className="form-control"
                        value={refundAmount}
                        max={Number(order.total)}
                        min="1"
                        step="0.01"
                        onChange={(e) =>
                          setRefundAmount(
                            e.target.value
                          )
                        }
                        required
                      />

                    </div>

                    <div className="form-text">
                      Maximum refund:
                      {" "}
                      ₹{Number(order.total).toFixed(2)}
                    </div>

                  </div>

                )}

                {/* ===================================
                    REPLACEMENT
                =================================== */}

                {requestType === "REPLACEMENT" && (

                  <div className="mb-3">

                    <label className="form-label fw-semibold">
                      Replacement details
                    </label>

                    <textarea
                      className="form-control rounded-3"
                      rows={3}
                      placeholder="Tell us what you would like to replace..."
                      value={replacementDetails}
                      onChange={(e) =>
                        setReplacementDetails(
                          e.target.value
                        )
                      }
                      required
                    />

                  </div>

                )}

                {/* ===================================
                    DETAILS
                =================================== */}

                <div className="mb-2">

                  <label className="form-label fw-semibold">
                    Additional details
                  </label>

                  <textarea
                    className="form-control rounded-3"
                    rows={4}
                    placeholder="Provide any additional information..."
                    value={details}
                    onChange={(e) =>
                      setDetails(e.target.value)
                    }
                  />

                </div>

                {/* ===================================
                    ERROR
                =================================== */}

                {error && (

                  <div className="alert alert-danger mt-3 mb-0 rounded-3">
                    {error}
                  </div>

                )}

              </div>

              {/* =====================================
                  FOOTER
              ===================================== */}

              <div className="modal-footer border-top px-4 py-3">

                <button
                  type="button"
                  className="btn btn-light rounded-3 px-4"
                  onClick={onClose}
                  disabled={submitting}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn btn-primary rounded-3 px-4 fw-semibold"
                  disabled={submitting}
                >
                  {submitting
                    ? "Submitting..."
                    : "Submit Request"}
                </button>

              </div>

            </form>

          )}

        </div>
      </div>
    </div>
  );
}