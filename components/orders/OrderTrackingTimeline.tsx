
"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  Circle,
  Clock3,
  Package,
  RefreshCw,
  Truck,
  XCircle,
} from "lucide-react";

type HistoryEntry = {
  id: number;
  status: string;
  note: string | null;
  createdAt: string;
};

type TrackingResponse = {
  orderNumber: string;
  status: string;
  createdAt: string;
  history: HistoryEntry[];
  error?: string;
};

type Props = {
  orderNumber: string;
  initialStatus: string;
};

const steps = [
  {
    status: "PLACED",
    label: "Order placed",
    description: "Your order has been received.",
    icon: Package,
  },
  {
    status: "CONFIRMED",
    label: "Order confirmed",
    description: "Your order has been confirmed.",
    icon: CheckCircle2,
  },
  {
    status: "PACKED",
    label: "Packed",
    description: "Your items are being prepared for shipment.",
    icon: Package,
  },
  {
    status: "SHIPPED",
    label: "Shipped",
    description: "Your order is on its way.",
    icon: Truck,
  },
  {
    status: "OUT_FOR_DELIVERY",
    label: "Out for delivery",
    description: "Your order is on its final delivery journey.",
    icon: Truck,
  },
  {
    status: "DELIVERED",
    label: "Delivered",
    description: "Your order has been delivered.",
    icon: CheckCircle2,
  },
];

const statusLabels: Record<string, string> = {
  PLACED: "Order placed",
  PENDING: "Pending",
  CONFIRMED: "Order confirmed",
  PACKED: "Packed",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  RETURNED: "Returned",
};

function formatDate(value: string) {
  if (!value) return "Time unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Time unavailable";
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizeStatus(status: string) {
  return status === "PENDING" ? "PLACED" : status;
}

export default function OrderTrackingTimeline({
  orderNumber,
  initialStatus,
}: Props) {
  const [tracking, setTracking] = useState<TrackingResponse | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadTracking = useCallback(async (manual = false) => {
    if (manual) {
      setRefreshing(true);
    }

    try {
      const response = await fetch(
        `/api/orders/${encodeURIComponent(orderNumber)}/tracking`,
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to load tracking.");
      }

      setTracking(data);
      setError("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load order tracking."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [orderNumber]);

  useEffect(() => {
    void loadTracking();

    const interval = window.setInterval(() => {
      void loadTracking();
    }, 15000);

    return () => window.clearInterval(interval);
  }, [loadTracking]);

  const currentStatus = normalizeStatus(
    tracking?.status || initialStatus || "PLACED"
  );

  const isCancelled = currentStatus === "CANCELLED";
  const isReturned = currentStatus === "RETURNED";

  const currentStepIndex = steps.findIndex(
    (step) => step.status === currentStatus
  );

  const history = tracking?.history || [];

  return (
    <section className="card border-0 shadow-sm rounded-4 overflow-hidden">
      <div className="card-body p-3 p-md-4">
        <div className="d-flex align-items-start justify-content-between gap-3 mb-4">
          <div>
            <div className="small text-uppercase fw-semibold text-secondary mb-1">
              Order tracking
            </div>

            <h5 className="fw-bold mb-1">
              {isCancelled
                ? "This order was cancelled"
                : isReturned
                  ? "This order was returned"
                  : "Your order journey"}
            </h5>

            <div className="small text-secondary">
              Order #{orderNumber}
            </div>
          </div>

          <button
            type="button"
            className="btn btn-outline-secondary btn-sm rounded-pill"
            onClick={() => void loadTracking(true)}
            disabled={refreshing}
            aria-label="Refresh order tracking"
          >
            <RefreshCw
              size={14}
              className={refreshing ? "me-1" : "me-1"}
            />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {error && (
          <div className="alert alert-warning py-2 small" role="alert">
            {error}
          </div>
        )}

        {loading && !tracking && (
          <div className="d-flex align-items-center gap-2 text-secondary py-3">
            <span
              className="spinner-border spinner-border-sm"
              aria-hidden="true"
            />
            Loading the latest tracking information...
          </div>
        )}

        {!isCancelled && !isReturned && (
          <div className="position-relative mb-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isComplete =
                currentStepIndex >= 0 && index < currentStepIndex;
              const isCurrent = index === currentStepIndex;
              const isFuture =
                currentStepIndex < 0 || index > currentStepIndex;

              const historyEntry = history.find(
                (entry) =>
                  normalizeStatus(entry.status) === step.status
              );

              return (
                <div
                  key={step.status}
                  className="d-flex gap-3 position-relative"
                >
                  <div
                    className="d-flex flex-column align-items-center"
                    style={{ width: 34, flexShrink: 0 }}
                  >
                    <div
                      className={`rounded-circle d-flex align-items-center justify-content-center ${
                        isComplete
                          ? "bg-success text-white"
                          : isCurrent
                            ? "bg-primary text-white"
                            : "bg-light text-secondary border"
                      }`}
                      style={{ width: 34, height: 34 }}
                    >
                      {isFuture ? (
                        <Circle size={17} />
                      ) : (
                        <Icon size={17} />
                      )}
                    </div>

                    {index < steps.length - 1 && (
                      <div
                        className={`flex-grow-1 ${
                          isComplete ? "bg-success" : "bg-light"
                        }`}
                        style={{ width: 2, minHeight: 34 }}
                      />
                    )}
                  </div>

                  <div className="pb-4 flex-grow-1">
                    <div className="d-flex flex-wrap justify-content-between align-items-center gap-1">
                      <span
                        className={`fw-semibold ${
                          isFuture ? "text-secondary" : "text-dark"
                        }`}
                      >
                        {step.label}
                      </span>

                      {historyEntry && (
                        <span className="small text-secondary">
                          {formatDate(historyEntry.createdAt)}
                        </span>
                      )}
                    </div>

                    <div className="small text-secondary mt-1">
                      {step.description}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {(isCancelled || isReturned) && (
          <div
            className={`alert ${
              isCancelled ? "alert-danger" : "alert-info"
            } d-flex gap-2 align-items-start`}
          >
            <XCircle size={20} className="flex-shrink-0 mt-1" />
            <div>
              <div className="fw-semibold">
                {statusLabels[currentStatus] || currentStatus}
              </div>
              <div className="small">
                {isCancelled
                  ? "This order is no longer progressing through delivery."
                  : "This order has been marked as returned."}
              </div>
            </div>
          </div>
        )}

        <hr className="my-4" />

        <div className="d-flex align-items-center gap-2 mb-3">
          <Clock3 size={18} className="text-primary" />
          <h6 className="fw-bold mb-0">Status history</h6>
        </div>

        {history.length > 0 ? (
          <div className="d-flex flex-column gap-3">
            {history.map((entry) => (
              <div
                key={entry.id}
                className="d-flex gap-3 align-items-start"
              >
                <div
                  className="rounded-circle bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center"
                  style={{
                    width: 34,
                    height: 34,
                    flexShrink: 0,
                  }}
                >
                  <Clock3 size={16} />
                </div>

                <div className="flex-grow-1">
                  <div className="fw-semibold">
                    {statusLabels[entry.status] || entry.status}
                  </div>

                  {entry.note && (
                    <div className="small text-secondary mt-1">
                      {entry.note}
                    </div>
                  )}

                  <div className="small text-secondary mt-1">
                    {formatDate(entry.createdAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="small text-secondary">
            No recorded status changes yet. New changes will appear here
            as the order progresses.
          </div>
        )}

        <div className="small text-secondary mt-3">
          <Clock3 size={13} className="me-1" />
          Tracking refreshes automatically every 15 seconds.
        </div>
      </div>
    </section>
  );
}