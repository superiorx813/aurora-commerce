import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { money } from "@/lib/utils";
import Link from "next/link";

export const dynamic = "force-dynamic";

type OrderPageProps = {
  params: Promise<{
    number: string;
  }>;
};

function getStatusInfo(status: string) {
  const normalized = String(status || "").toUpperCase();

  switch (normalized) {
    case "PENDING":
      return {
        label: "Order Placed",
        badge: "bg-warning text-dark",
        icon: "✓",
        description: "Your order has been received.",
      };

    case "CONFIRMED":
      return {
        label: "Confirmed",
        badge: "bg-primary",
        icon: "✓",
        description: "Your order has been confirmed.",
      };

    case "PROCESSING":
      return {
        label: "Processing",
        badge: "bg-info text-dark",
        icon: "⚙",
        description: "Your order is being prepared.",
      };

    case "SHIPPED":
      return {
        label: "Shipped",
        badge: "bg-primary",
        icon: "➜",
        description: "Your order is on the way.",
      };

    case "OUT_FOR_DELIVERY":
      return {
        label: "Out for Delivery",
        badge: "bg-success",
        icon: "🚚",
        description: "Your order is out for delivery.",
      };

    case "DELIVERED":
      return {
        label: "Delivered",
        badge: "bg-success",
        icon: "✓",
        description: "Your order has been delivered.",
      };

    case "CANCELLED":
      return {
        label: "Cancelled",
        badge: "bg-danger",
        icon: "×",
        description: "This order has been cancelled.",
      };

    case "RETURNED":
      return {
        label: "Returned",
        badge: "bg-secondary",
        icon: "↩",
        description: "This order has been returned.",
      };

    default:
      return {
        label: normalized.replaceAll("_", " ") || "Processing",
        badge: "bg-secondary",
        icon: "•",
        description: "Your order is being processed.",
      };
  }
}

function getTrackingSteps(status: string) {
  const normalized = String(status || "").toUpperCase();

  if (normalized === "CANCELLED") {
    return [
      {
        title: "Order Cancelled",
        description: "This order is no longer active.",
        completed: true,
      },
    ];
  }

  const steps = [
    {
      title: "Order Placed",
      description: "We received your order.",
      completed: true,
    },
    {
      title: "Confirmed",
      description: "Your order has been confirmed.",
      completed: [
        "CONFIRMED",
        "PROCESSING",
        "SHIPPED",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
      ].includes(normalized),
    },
    {
      title: "Processing",
      description: "Your items are being prepared.",
      completed: [
        "PROCESSING",
        "SHIPPED",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
      ].includes(normalized),
    },
    {
      title: "Shipped",
      description: "Your package is on the way.",
      completed: [
        "SHIPPED",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
      ].includes(normalized),
    },
    {
      title: "Delivered",
      description: "Package delivered successfully.",
      completed: normalized === "DELIVERED",
    },
  ];

  return steps;
}

export default async function OrderDetail({
  params,
}: OrderPageProps) {
  const user = await getSession();

  if (!user) {
    return (
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-lg-6">
            <div className="card border-0 shadow-sm rounded-4">
              <div className="card-body text-center p-5">
                <div className="display-5 mb-3">🔐</div>

                <h2 className="fw-bold mb-2">
                  Please sign in
                </h2>

                <p className="text-secondary mb-4">
                  Sign in to view your order details.
                </p>

                <Link
                  href="/account"
                  className="btn btn-primary px-4 py-2 rounded-pill fw-semibold"
                >
                  Sign in
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { number } = await params;

  /*
   * IMPORTANT:
   * The delivery address is stored in the addresses table.
   * orders.address_id points to addresses.id.
   *
   * Therefore we join addresses here so that
   * order.full_name, order.line1, order.city, etc.
   * are available to the UI.
   */
  const [orders] = await db.query(
    `
    SELECT
      o.*,
      a.full_name,
      a.phone,
      a.line1,
      a.line2,
      a.city,
      a.state,
      a.postal_code
    FROM orders o
    LEFT JOIN addresses a
      ON a.id = o.address_id
    WHERE o.order_number = ?
      AND o.user_id = ?
    LIMIT 1
    `,
    [number, user.id]
  );

  const order = (orders as any[])[0];

  if (!order) {
    notFound();
  }

  const [items] = await db.query(
    `
    SELECT *
    FROM order_items
    WHERE order_id = ?
    ORDER BY id ASC
    `,
    [order.id]
  );

  const orderItems = items as any[];

  const statusInfo = getStatusInfo(order.status);
  const trackingSteps = getTrackingSteps(order.status);

  const orderDate = new Date(order.created_at);

  return (
    <div className="container py-4 py-lg-5">

      {/* =====================================================
          TOP HEADER
      ===================================================== */}

      <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-4">

        <div>
          <div className="text-uppercase small fw-bold text-primary mb-1">
            Aurora Orders
          </div>

          <h1 className="fw-bold mb-1">
            Order #{order.order_number}
          </h1>

          <div className="text-secondary small">
            Placed on{" "}
            {orderDate.toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </div>
        </div>

        <div className="d-flex gap-2 flex-wrap">

          <Link
            href="/orders"
            className="btn btn-outline-secondary rounded-pill px-3"
          >
            ← My Orders
          </Link>

          <Link
            href="/products"
            className="btn btn-primary rounded-pill px-4 fw-semibold"
          >
            Continue Shopping
          </Link>

        </div>

      </div>

      {/* =====================================================
          ORDER SUCCESS / STATUS HERO
      ===================================================== */}

      <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">

        <div className="card-body p-4 p-lg-5">

          <div className="row align-items-center g-4">

            <div className="col-lg-8">

              <div className="d-flex align-items-start gap-3">

                <div
                  className="rounded-circle bg-success-subtle text-success d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{
                    width: "58px",
                    height: "58px",
                    fontSize: "24px",
                  }}
                >
                  ✓
                </div>

                <div>

                  <div className="text-uppercase small fw-bold text-success mb-1">
                    Order Confirmed
                  </div>

                  <h2 className="fw-bold mb-2">
                    Thanks for your order, {user.name}!
                  </h2>

                  <p className="text-secondary mb-0">
                    Your order has been successfully placed and
                    we're taking care of the rest.
                  </p>

                </div>

              </div>

            </div>

            <div className="col-lg-4">

              <div className="bg-light rounded-4 p-3 text-lg-end">

                <div className="small text-secondary mb-2">
                  Current Status
                </div>

                <span
                  className={`badge ${statusInfo.badge} rounded-pill px-3 py-2`}
                >
                  {statusInfo.icon} {statusInfo.label}
                </span>

                <div className="small text-secondary mt-2">
                  {statusInfo.description}
                </div>

              </div>

            </div>

          </div>

        </div>

      </div>

      {/* =====================================================
          TRACKING
      ===================================================== */}

      <div className="card border-0 shadow-sm rounded-4 mb-4">

        <div className="card-body p-4 p-lg-5">

          <div className="mb-4">

            <div className="text-uppercase small fw-bold text-primary">
              Order Journey
            </div>

            <h3 className="fw-bold mb-1">
              Track your order
            </h3>

            <p className="text-secondary mb-0">
              Follow the progress of your Aurora order.
            </p>

          </div>

          <div className="row g-3">

            {trackingSteps.map((step, index) => (

              <div
                className="col-12 col-md"
                key={step.title}
              >

                <div
                  className={`card h-100 border rounded-4 ${
                    step.completed
                      ? "border-success-subtle bg-success-subtle"
                      : "bg-light"
                  }`}
                >

                  <div className="card-body p-3">

                    <div className="d-flex align-items-center gap-2 mb-2">

                      <span
                        className={`rounded-circle d-inline-flex align-items-center justify-content-center ${
                          step.completed
                            ? "bg-success text-white"
                            : "bg-secondary-subtle text-secondary"
                        }`}
                        style={{
                          width: "34px",
                          height: "34px",
                        }}
                      >
                        {step.completed ? "✓" : index + 1}
                      </span>

                      <span className="small fw-bold">
                        {step.title}
                      </span>

                    </div>

                    <p className="small text-secondary mb-0">
                      {step.description}
                    </p>

                  </div>

                </div>

              </div>

            ))}

          </div>

        </div>

      </div>

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <div className="row g-4">

        {/* ===================================================
            LEFT SIDE
        =================================================== */}

        <div className="col-lg-8">

          {/* PRODUCTS */}

          <div className="card border-0 shadow-sm rounded-4 mb-4">

            <div className="card-body p-4">

              <div className="d-flex justify-content-between align-items-center mb-4">

                <div>

                  <div className="text-uppercase small fw-bold text-primary">
                    Your Items
                  </div>

                  <h3 className="fw-bold mb-0">
                    Ordered Products
                  </h3>

                </div>

                <span className="badge bg-light text-dark rounded-pill px-3 py-2">
                  {orderItems.length}{" "}
                  {orderItems.length === 1 ? "Item" : "Items"}
                </span>

              </div>

              <div className="vstack gap-3">

                {orderItems.map((item) => (

                  <div
                    className="border rounded-4 p-3"
                    key={item.id}
                  >

                    <div className="row align-items-center g-3">

                      {/* IMAGE */}

                      <div className="col-auto">

                        <div
                          className="bg-light rounded-4 d-flex align-items-center justify-content-center overflow-hidden"
                          style={{
                            width: "90px",
                            height: "90px",
                          }}
                        >

                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.product_name}
                              className="img-fluid"
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "contain",
                              }}
                            />
                          ) : (
                            <span className="text-secondary">
                              No Image
                            </span>
                          )}

                        </div>

                      </div>

                      {/* PRODUCT INFO */}

                      <div className="col">

                        <h5 className="fw-semibold mb-2">
                          {item.product_name}
                        </h5>

                        <div className="d-flex flex-wrap gap-2 mb-2">

                          <span className="badge bg-primary-subtle text-primary rounded-pill">
                            Qty: {item.quantity}
                          </span>

                          <span className="badge bg-light text-dark rounded-pill">
                            Unit Price: {money(item.unit_price)}
                          </span>

                        </div>

                        <div className="small text-secondary">
                          Product successfully added to your order.
                        </div>

                      </div>

                      {/* PRICE */}

                      <div className="col-12 col-sm-auto text-sm-end">

                        <div className="small text-secondary">
                          Item Total
                        </div>

                        <div className="fw-bold fs-5">
                          {money(
                            Number(item.unit_price) *
                              Number(item.quantity)
                          )}
                        </div>

                      </div>

                    </div>

                  </div>

                ))}

              </div>

            </div>

          </div>

          {/* DELIVERY INFORMATION */}

          <div className="card border-0 shadow-sm rounded-4 mb-4">

            <div className="card-body p-4">

              <div className="d-flex align-items-center gap-3 mb-4">

                <div
                  className="rounded-circle bg-primary-subtle text-primary d-flex align-items-center justify-content-center flex-shrink-0"
                  style={{
                    width: "46px",
                    height: "46px",
                  }}
                >
                  📍
                </div>

                <div>

                  <div className="text-uppercase small fw-bold text-primary">
                    Delivery
                  </div>

                  <h4 className="fw-bold mb-0">
                    Delivery Information
                  </h4>

                </div>

              </div>

              {/* DELIVERY STATUS & SHIPPING METHOD */}

              <div className="row g-3 mb-3">

                <div className="col-md-6">

                  <div className="bg-light rounded-4 p-3 h-100">

                    <div className="small text-secondary mb-1">
                      Delivery Status
                    </div>

                    <div className="fw-semibold">
                      {statusInfo.label}
                    </div>

                  </div>

                </div>

                <div className="col-md-6">

                  <div className="bg-light rounded-4 p-3 h-100">

                    <div className="small text-secondary mb-1">
                      Shipping Method
                    </div>

                    <div className="fw-semibold">
                      Standard Delivery
                    </div>

                  </div>

                </div>

              </div>

              {/* DELIVERY ADDRESS */}

              <div className="bg-light rounded-4 p-4 mt-3">

                <div className="d-flex align-items-center gap-3 mb-3">

                  <div
                    className="bg-white rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{
                      width: "44px",
                      height: "44px",
                    }}
                  >
                    📍
                  </div>

                  <div>

                    <div className="small text-uppercase fw-semibold text-secondary">
                      Delivery Address
                    </div>

                    <div className="fw-bold">
                      Shipping Address
                    </div>

                  </div>

                </div>

                <div className="ps-0">

                  <div className="fw-semibold mb-2">
                    {order.full_name || user.name}
                  </div>

                  {order.line1 && (
                    <div className="text-secondary small lh-lg">
                      {order.line1}
                    </div>
                  )}

                  {order.line2 && (
                    <div className="text-secondary small lh-lg">
                      {order.line2}
                    </div>
                  )}

                  {(order.city || order.state) && (
                    <div className="text-secondary small lh-lg">
                      {order.city}
                      {order.city && order.state
                        ? `, ${order.state}`
                        : order.state || ""}
                    </div>
                  )}

                  {order.postal_code && (
                    <div className="text-secondary small lh-lg">
                      PIN: {order.postal_code}
                    </div>
                  )}

                  {order.phone && (
                    <div className="text-secondary small mt-2">
                      Phone: {order.phone}
                    </div>
                  )}

                </div>

              </div>

            </div>

          </div>

          {/* PAYMENT */}

          <div className="card border-0 shadow-sm rounded-4">

            <div className="card-body p-4">

              <div className="d-flex align-items-center gap-3 mb-4">

                <div
                  className="rounded-circle bg-warning-subtle text-warning-emphasis d-flex align-items-center justify-content-center"
                  style={{
                    width: "46px",
                    height: "46px",
                  }}
                >
                  💳
                </div>

                <div>

                  <div className="text-uppercase small fw-bold text-warning-emphasis">
                    Payment
                  </div>

                  <h4 className="fw-bold mb-0">
                    Payment Information
                  </h4>

                </div>

              </div>

              <div className="row g-3">

                <div className="col-md-6">

                  <div className="bg-light rounded-4 p-3">

                    <div className="small text-secondary mb-1">
                      Payment Method
                    </div>

                    <div className="fw-semibold">
                      {String(
                        order.payment_method || "N/A"
                      ).replaceAll("_", " ")}
                    </div>

                  </div>

                </div>

                <div className="col-md-6">

                  <div className="bg-light rounded-4 p-3">

                    <div className="small text-secondary mb-1">
                      Payment Status
                    </div>

                    <span
                      className={`badge rounded-pill ${
                        String(order.payment_status).toUpperCase() ===
                        "PAID"
                          ? "bg-success"
                          : "bg-warning text-dark"
                      }`}
                    >
                      {String(
                        order.payment_status || "N/A"
                      ).replaceAll("_", " ")}
                    </span>

                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>

        {/* ===================================================
            RIGHT SIDE
        =================================================== */}

        <div className="col-lg-4">

          <div
            className="card border-0 shadow-sm rounded-4 sticky-lg-top"
            style={{
              top: "20px",
            }}
          >

            <div className="card-body p-4">

              <div className="text-uppercase small fw-bold text-primary mb-1">
                Order Summary
              </div>

              <h3 className="fw-bold mb-4">
                Price Details
              </h3>

              <div className="d-flex justify-content-between mb-3">

                <span className="text-secondary">
                  Subtotal
                </span>

                <span className="fw-semibold">
                  {money(order.subtotal)}
                </span>

              </div>

              <div className="d-flex justify-content-between mb-3">

                <span className="text-secondary">
                  Shipping
                </span>

                <span className="fw-semibold text-success">
                  {Number(order.shipping) > 0
                    ? money(order.shipping)
                    : "FREE"}
                </span>

              </div>

              <hr />

              <div className="d-flex justify-content-between align-items-center mb-4">

                <span className="fw-bold fs-5">
                  Total
                </span>

                <span className="fw-bold fs-4 text-primary">
                  {money(order.total)}
                </span>

              </div>

              <div className="bg-success-subtle rounded-4 p-3 mb-4">

                <div className="d-flex gap-2">

                  <span className="text-success">
                    ✓
                  </span>

                  <div>

                    <div className="fw-semibold text-success">
                      Secure Aurora Order
                    </div>

                    <div className="small text-secondary">
                      Your order information is safely
                      stored with your account.
                    </div>

                  </div>

                </div>

              </div>

              <div className="d-grid gap-2">

                <Link
                  href="/orders"
                  className="btn btn-outline-primary rounded-pill py-2 fw-semibold"
                >
                  View All Orders
                </Link>

                <Link
                  href="/products"
                  className="btn btn-primary rounded-pill py-2 fw-semibold"
                >
                  Continue Shopping
                </Link>

              </div>

            </div>

          </div>

        </div>

      </div>

      {/* =====================================================
          BOTTOM SUPPORT MESSAGE
      ===================================================== */}

      <div className="card border-0 bg-primary-subtle rounded-4 mt-4">

        <div className="card-body p-4">

          <div className="row align-items-center g-3">

            <div className="col-auto">

              <div
                className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center"
                style={{
                  width: "48px",
                  height: "48px",
                }}
              >
                ?
              </div>

            </div>

            <div className="col">

              <h5 className="fw-bold mb-1">
                Need help with your order?
              </h5>

              <p className="text-secondary mb-0">
                If you have any questions about this order,
                please contact Aurora support.
              </p>

            </div>

            <div className="col-12 col-md-auto">

              <Link
                href="/account"
                className="btn btn-outline-primary rounded-pill px-4"
              >
                Account
              </Link>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}