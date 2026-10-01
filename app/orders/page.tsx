
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { money } from "@/lib/utils";
import OrderRequestModal from "@/components/OrderRequestModal";

type OrderItem = {
  id: number;
  order_id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number | string;
  image_url?: string | null;
};

type Order = {
  id: number;
  order_number: string;
  subtotal: number | string;
  shipping: number | string;
  total: number | string;
  payment_method?: string;
  payment_status?: string;
  status: string;
  created_at: string;
  items: OrderItem[];

  request?: {
    id: number;
    order_id: number;
    request_type:
      | "CANCELLATION"
      | "REFUND"
      | "REPLACEMENT";
    reason: string;
    details?: string | null;
    refund_amount?: number | string | null;
    replacement_details?: string | null;
    status:
      | "PENDING"
      | "APPROVED"
      | "REJECTED"
      | "COMPLETED";
    admin_note?: string | null;
    created_at: string;
    updated_at: string;
  } | null;
};


/* =========================================================
   STATUS BADGE
   ========================================================= */

function StatusBadge({
  status
}: {
  status: string;
}) {
  const normalized = status
    .toUpperCase()
    .replaceAll("_", " ");

  let classes =
    "badge rounded-pill px-3 py-2 fw-semibold border";

  if (
    normalized === "DELIVERED" ||
    normalized === "COMPLETED"
  ) {
    classes +=
      " bg-success-subtle text-success-emphasis border-success-subtle";
  } else if (
    normalized === "CANCELLED" ||
    normalized === "CANCELED"
  ) {
    classes +=
      " bg-danger-subtle text-danger-emphasis border-danger-subtle";
  } else if (
    normalized === "SHIPPED" ||
    normalized === "OUT FOR DELIVERY"
  ) {
    classes +=
      " bg-primary-subtle text-primary-emphasis border-primary-subtle";
  } else if (
    normalized === "PROCESSING" ||
    normalized === "PACKED"
  ) {
    classes +=
      " bg-warning-subtle text-warning-emphasis border-warning-subtle";
  } else {
    classes +=
      " bg-light text-dark border-secondary-subtle";
  }

  return (
    <span className={classes}>
      {normalized}
    </span>
  );
}


/* =========================================================
   ORDERS PAGE
   ========================================================= */

export default function OrdersPage() {
  const [orders, setOrders] =
    useState<Order[] | null>(null);

  /* =======================================================
     SELECTED ORDER FOR REQUEST MODAL
     ======================================================= */

  const [requestOrder, setRequestOrder] =
    useState<Order | null>(null);


  /* =======================================================
     LOAD ORDERS
     ======================================================= */

  useEffect(() => {
    fetch("/api/orders")
      .then((response) => response.json())
      .then((data) => {
        setOrders(data.orders || []);
      })
      .catch(() => {
        setOrders([]);
      });
  }, []);


  /* =======================================================
     REFRESH ORDERS
     ======================================================= */

  const refreshOrders = () => {
    fetch("/api/orders")
      .then((response) => response.json())
      .then((data) => {
        setOrders(data.orders || []);
      })
      .catch(() => {
        setOrders([]);
      });
  };


  /* =======================================================
     LOADING
     ======================================================= */

  if (orders === null) {
    return (
      <main className="container py-5 min-vh-100">
        <div className="py-5">

          <div className="placeholder-glow">
            <span className="placeholder col-2 mb-3"></span>

            <span className="placeholder col-4 d-block mb-5"></span>
          </div>

          <div className="card border-0 shadow-sm rounded-4">

            <div className="card-body p-4 p-lg-5">

              <div className="placeholder-glow">

                <span className="placeholder col-4 mb-3"></span>

                <span className="placeholder col-6 d-block"></span>

              </div>

            </div>

          </div>

        </div>
      </main>
    );
  }


  /* =======================================================
     EMPTY STATE
     ======================================================= */

  if (!orders.length) {
    return (
      <main className="container py-5 min-vh-100">

        <div className="py-5">

          <div className="mb-5">

            <div className="text-uppercase small fw-bold text-secondary mb-2">
              Account
            </div>

            <h1 className="display-4 fw-semibold mb-3">
              Your orders
            </h1>

            <p className="text-secondary fs-5 mb-0">
              Everything you've purchased from Aurora.
            </p>

          </div>


          <div className="card border-0 shadow-sm rounded-4">

            <div className="card-body text-center py-5 px-4">

              <div
                className="rounded-circle bg-light d-inline-flex align-items-center justify-content-center mb-4"
                style={{
                  width: "72px",
                  height: "72px"
                }}
              >
                <span className="fs-3">
                  🛍
                </span>
              </div>

              <h3 className="fw-semibold mb-2">
                No orders yet
              </h3>

              <p className="text-secondary mb-4">
                Your Aurora purchases will appear here.
              </p>

              <Link
                href="/products"
                className="btn btn-dark rounded-3 px-4 py-2 fw-semibold"
              >
                Start shopping
              </Link>

            </div>

          </div>

        </div>

      </main>
    );
  }


  /* =======================================================
     ORDERS
     ======================================================= */

  return (
    <main className="container py-5 min-vh-100">

      <div className="py-4 py-lg-5">

        {/* =================================================
            HEADER
            ================================================= */}

        <div className="mb-4 mb-lg-5">

          <div className="text-uppercase small fw-bold text-secondary mb-2">
            Account
          </div>

          <h1 className="display-4 fw-semibold mb-3">
            Your orders
          </h1>

          <p className="text-secondary fs-5 mb-0">
            Everything you've purchased from Aurora,
            in one place.
          </p>

        </div>


        {/* =================================================
            ORDER COUNT
            ================================================= */}

        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">

          <div className="text-secondary">

            <span className="fw-semibold text-dark">
              {orders.length}
            </span>{" "}

            {orders.length === 1
              ? "order"
              : "orders"}

          </div>

        </div>


        {/* =================================================
            ORDER LIST
            ================================================= */}

        <div className="d-flex flex-column gap-4">

          {orders.map((order) => {

            const firstItem =
              order.items?.[0];

            const additionalItems =
              Math.max(
                0,
                (order.items?.length || 0) - 1
              );

            return (
              <div
                className="card border rounded-4 shadow-sm overflow-hidden"
                key={order.id}
              >

                {/* =========================================
                    ORDER HEADER
                    ========================================= */}

                <div className="card-body p-4 p-lg-4">

                  <div className="row align-items-start g-3">

                    <div className="col-12 col-md">

                      <div className="text-uppercase small fw-semibold text-secondary mb-2">
                        Order
                      </div>

                      <div className="fw-bold fs-5 mb-1">
                        {order.order_number}
                      </div>

                      <div className="text-secondary small">
                        {new Date(
                          order.created_at
                        ).toLocaleDateString(
                          undefined,
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric"
                          }
                        )}
                      </div>

                    </div>


                    <div className="col-12 col-md-auto">

                      <div className="d-flex flex-wrap align-items-center gap-3">

                        <div className="fw-bold fs-5">
                          {money(order.total)}
                        </div>

                        <StatusBadge
                          status={order.status}
                        />

                      </div>

                    </div>

                  </div>


                  {/* =======================================
                      PRODUCTS
                      ======================================= */}

                  <div className="border-top mt-4 pt-4">

                    {firstItem ? (

                      <div className="row align-items-center g-3">

                        {/* PRODUCT IMAGE */}

                        <div className="col-auto">

                          {firstItem.image_url ? (

                            <div
                              className="border rounded-3 overflow-hidden bg-light"
                              style={{
                                width: "88px",
                                height: "88px"
                              }}
                            >

                              <img
                                src={
                                  firstItem.image_url
                                }
                                alt={
                                  firstItem.product_name
                                }
                                className="w-100 h-100 object-fit-cover"
                              />

                            </div>

                          ) : (

                            <div
                              className="border rounded-3 bg-light d-flex align-items-center justify-content-center"
                              style={{
                                width: "88px",
                                height: "88px"
                              }}
                            >

                              <span className="text-secondary small">
                                No image
                              </span>

                            </div>

                          )}

                        </div>


                        {/* PRODUCT DETAILS */}

                        <div className="col">

                          <div className="fw-semibold mb-1">
                            {firstItem.product_name}
                          </div>

                          <div className="text-secondary small mb-1">
                            Qty:{" "}
                            {firstItem.quantity}
                          </div>

                          <div className="fw-semibold">
                            {money(
                              firstItem.unit_price
                            )}
                          </div>

                          {additionalItems > 0 && (
                            <div className="text-secondary small mt-2">
                              + {additionalItems}{" "}
                              {additionalItems === 1
                                ? "more item"
                                : "more items"}
                            </div>
                          )}

                        </div>


                        {/* ACTION BUTTONS */}

                        <div className="col-12 col-md-auto">

                          <div className="d-flex flex-wrap justify-content-end gap-2">

                            {/* VIEW ORDER */}

                            <Link
                              href={`/orders/${order.order_number}`}
                              className="btn btn-dark rounded-3 px-4 py-2 fw-semibold"
                            >
                              View order
                            </Link>


                            {/* CANCELLATION / REFUND / REPLACEMENT */}

                            {!order.request &&
                              order.status !== "CANCELLED" && (
                                <button
                                  type="button"
                                  className="btn btn-outline-primary rounded-3 px-4 py-2 fw-semibold"
                                  onClick={() =>
                                    setRequestOrder(order)
                                  }
                                >
                                  Cancellation / Refund / Replacement
                                </button>
                              )}

                          </div>

                        </div>

                      </div>

                    ) : (

                      <div className="text-secondary">
                        No products found for this order.
                      </div>

                    )}

                  </div>


                  {/* =======================================
                      SERVICE REQUEST STATUS
                      ======================================= */}

                  {order.request && (

                    <div className="border-top mt-4 pt-4">

                      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">

                        <div>

                          <div className="small text-uppercase fw-bold text-secondary mb-1">
                            Service Request
                          </div>

                          <div className="fw-semibold">
                            {order.request.request_type.replaceAll(
                              "_",
                              " "
                            )}
                          </div>

                          <div className="small text-secondary">
                            {order.request.reason}
                          </div>

                        </div>


                        <span
                          className={`badge rounded-pill px-3 py-2 ${
                            order.request.status === "PENDING"
                              ? "bg-warning-subtle text-warning-emphasis"
                              : order.request.status === "APPROVED"
                              ? "bg-success-subtle text-success-emphasis"
                              : order.request.status === "REJECTED"
                              ? "bg-danger-subtle text-danger-emphasis"
                              : "bg-primary-subtle text-primary-emphasis"
                          }`}
                        >
                          {order.request.status}
                        </span>

                      </div>

                    </div>

                  )}

                </div>

              </div>
            );
          })}

        </div>

      </div>


      {/* =====================================================
          ORDER REQUEST MODAL
          ===================================================== */}

      <OrderRequestModal
        order={requestOrder}
        onClose={() => setRequestOrder(null)}
        onSubmitted={refreshOrders}
      />

    </main>
  );
}

