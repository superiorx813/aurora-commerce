import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { money } from "@/lib/utils";

export const dynamic = "force-dynamic";

/*
 * =========================================================
 * TYPES
 * =========================================================
 */

type OrderPageProps = {
    params: Promise<{
        id: string;
    }>;
};

type OrderRow = {
    id: number;
    order_number: string | null;
    total: number | string | null;
    subtotal: number | string | null;
    shipping: number | string | null;

    status: string | null;
    payment_method: string | null;
    payment_status: string | null;

    created_at: string | Date;

    user_id: number | null;
    customer_name: string | null;
    customer_email: string | null;

    full_name: string | null;
    phone: string | null;
    line1: string | null;
    line2: string | null;
    city: string | null;
    state: string | null;
    postal_code: string | null;
};

type OrderItem = {
    id: number;
    order_id: number;
    product_id: number | null;

    product_name: string | null;
    image_url: string | null;

    quantity: number | string;
    unit_price: number | string;
};


/*
 * =========================================================
 * STATUS HELPERS
 * =========================================================
 */

function normalizeStatus(status?: string | null) {
    return String(status ?? "")
        .trim()
        .toUpperCase();
}


/*
 * PLACED is treated as PENDING throughout
 * the admin dashboard.
 */
function getDisplayStatus(status?: string | null) {
    const normalized = normalizeStatus(status);

    if (normalized === "PLACED") {
        return "PENDING";
    }

    return normalized;
}


/*
 * =========================================================
 * STATUS INFORMATION
 * =========================================================
 */

function getStatusInfo(status?: string | null) {
    const normalized = getDisplayStatus(status);

    switch (normalized) {
        case "PENDING":
            return {
                label: "Pending",
                badge: "bg-warning text-dark",
                icon: "✓",
                description:
                    "Your order has been received and is waiting to be processed.",
            };

        case "CONFIRMED":
            return {
                label: "Confirmed",
                badge: "bg-primary",
                icon: "✓",
                description:
                    "The order has been confirmed successfully.",
            };

        case "PROCESSING":
            return {
                label: "Processing",
                badge: "bg-info text-dark",
                icon: "⚙",
                description:
                    "Your order is currently being prepared.",
            };

        case "SHIPPED":
            return {
                label: "Shipped",
                badge: "bg-primary",
                icon: "➜",
                description:
                    "Your package is currently on the way.",
            };

        case "OUT_FOR_DELIVERY":
            return {
                label: "Out for Delivery",
                badge: "bg-success",
                icon: "🚚",
                description:
                    "Your package is out for delivery.",
            };

        case "DELIVERED":
            return {
                label: "Delivered",
                badge: "bg-success",
                icon: "✓",
                description:
                    "The order has been delivered successfully.",
            };

        case "CANCELLED":
            return {
                label: "Cancelled",
                badge: "bg-danger",
                icon: "×",
                description:
                    "This order has been cancelled.",
            };

        case "RETURNED":
            return {
                label: "Returned",
                badge: "bg-secondary",
                icon: "↩",
                description:
                    "This order has been returned.",
            };

        default:
            return {
                label:
                    normalized.replaceAll("_", " ") ||
                    "Processing",
                badge: "bg-secondary",
                icon: "•",
                description:
                    "Your order is currently being processed.",
            };
    }
}


/*
 * =========================================================
 * TRACKING STEPS
 * =========================================================
 */

function getTrackingSteps(status?: string | null) {
    const normalized = getDisplayStatus(status);

    /*
     * Cancelled orders have a separate tracking state.
     */
    if (normalized === "CANCELLED") {
        return [
            {
                title: "Order Cancelled",
                description:
                    "This order is no longer active.",
                completed: true,
            },
        ];
    }

    /*
     * Returned orders.
     */
    if (normalized === "RETURNED") {
        return [
            {
                title: "Order Placed",
                description:
                    "We received your order.",
                completed: true,
            },
            {
                title: "Returned",
                description:
                    "This order has been returned.",
                completed: true,
            },
        ];
    }

    return [
        {
            title: "Order Placed",
            description:
                "We received your order.",
            completed: true,
        },

        {
            title: "Confirmed",
            description:
                "Your order has been confirmed.",
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
            description:
                "Your items are being prepared.",
            completed: [
                "PROCESSING",
                "SHIPPED",
                "OUT_FOR_DELIVERY",
                "DELIVERED",
            ].includes(normalized),
        },

        {
            title: "Shipped",
            description:
                "Your package is on the way.",
            completed: [
                "SHIPPED",
                "OUT_FOR_DELIVERY",
                "DELIVERED",
            ].includes(normalized),
        },

        {
            title: "Delivered",
            description:
                "Package delivered successfully.",
            completed:
                normalized === "DELIVERED",
        },
    ];
}


/*
 * =========================================================
 * PAGE
 * =========================================================
 */

export default async function AdminOrderDetail({
    params,
}: OrderPageProps) {

    /*
     * =====================================================
     * ADMIN AUTHENTICATION
     * =====================================================
     */

    const user = await getSession();

    if (!user) {
        redirect("/account");
    }

    if (user.role !== "ADMIN") {
        redirect("/");
    }


    /*
     * =====================================================
     * GET ORDER ID FROM URL
     * =====================================================
     */

    const { id } = await params;

    const orderId = Number(id);

    /*
     * Invalid URL ID.
     */
    if (!Number.isInteger(orderId) || orderId <= 0) {
        notFound();
    }


    /*
     * =====================================================
     * GET ORDER
     * =====================================================
     *
     * IMPORTANT:
     *
     * Admin searches by orders.id.
     *
     * There is NO user_id restriction here because
     * administrators can view orders belonging to
     * any customer.
     */

    const [ordersResult] = await db.query(
        `
        SELECT
            o.id,
            o.order_number,
            o.total,
            o.subtotal,
            o.shipping,
            o.status,
            o.payment_method,
            o.payment_status,
            o.created_at,
            o.user_id,

            u.name AS customer_name,
            u.email AS customer_email,

            a.full_name,
            a.phone,
            a.line1,
            a.line2,
            a.city,
            a.state,
            a.postal_code

        FROM orders o

        LEFT JOIN users u
            ON u.id = o.user_id

        LEFT JOIN addresses a
            ON a.id = o.address_id

        WHERE o.id = ?

        LIMIT 1
        `,
        [orderId]
    );


    const order = (ordersResult as OrderRow[])[0];


    /*
     * Order does not exist.
     */
    if (!order) {
        notFound();
    }


    /*
     * =====================================================
     * GET ORDER ITEMS
     * =====================================================
     */

    const [itemsResult] = await db.query(
        `
        SELECT
            id,
            order_id,
            product_id,
            product_name,
            image_url,
            quantity,
            unit_price

        FROM order_items

        WHERE order_id = ?

        ORDER BY id ASC
        `,
        [order.id]
    );


    const orderItems =
        itemsResult as OrderItem[];


    /*
     * =====================================================
     * STATUS / TRACKING
     * =====================================================
     */

    const displayStatus =
        getDisplayStatus(order.status);

    const statusInfo =
        getStatusInfo(order.status);

    const trackingSteps =
        getTrackingSteps(order.status);


    /*
     * =====================================================
     * DATE
     * =====================================================
     */

    const orderDate =
        new Date(order.created_at);


    /*
     * =====================================================
     * SAFE CUSTOMER NAME
     * =====================================================
     */

    const customerName =
        order.customer_name ||
        order.full_name ||
        "Unknown Customer";


    /*
     * =====================================================
     * SAFE PAYMENT STATUS
     * =====================================================
     */

    const paymentStatus =
        String(
            order.payment_status || "N/A"
        )
            .replaceAll("_", " ")
            .toUpperCase();


    /*
     * =====================================================
     * SAFE PAYMENT METHOD
     * =====================================================
     */

    const paymentMethod =
        String(
            order.payment_method || "N/A"
        )
            .replaceAll("_", " ")
            .toUpperCase();


    /*
     * =====================================================
     * RENDER
     * =====================================================
     */

    return (
        <main
            className="min-vh-100 py-4 py-lg-5"
            style={{
                background:
                    "linear-gradient(135deg, #f8f9ff 0%, #eef4ff 50%, #fdf8ff 100%)",
            }}
        >

            <div className="container-fluid px-3 px-lg-5">

                {/* =================================================
                    HEADER
                ================================================= */}

                <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-4">

                    <div>

                        <div className="d-flex align-items-center gap-2 mb-2">

                            <span
                                className="badge rounded-pill px-3 py-2 text-white"
                                style={{
                                    background:
                                        "linear-gradient(135deg, #111827, #374151)",
                                }}
                            >
                                AURORA CONTROL
                            </span>

                            <span
                                className="badge rounded-pill px-3 py-2 text-white"
                                style={{
                                    background:
                                        "linear-gradient(135deg, #4f46e5, #7c3aed)",
                                }}
                            >
                                ORDER DETAILS
                            </span>

                        </div>


                        <div className="text-uppercase small fw-bold text-primary mb-1">
                            Customer Order
                        </div>


                        <h1 className="display-6 fw-bold mb-1">
                            Order #
                            {order.order_number ||
                                order.id}
                        </h1>


                        <div className="text-secondary small">
                            Placed on{" "}
                            {orderDate.toLocaleDateString(
                                "en-IN",
                                {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                }
                            )}

                            {" • "}

                            Customer:{" "}
                            <span className="fw-semibold">
                                {customerName}
                            </span>
                        </div>

                    </div>


                    <div className="d-flex gap-2 flex-wrap">

                        <Link
                            href="/admin/orders"
                            className="btn btn-light border rounded-pill px-4 py-2 shadow-sm"
                        >
                            ← All Orders
                        </Link>

                        <Link
                            href="/admin"
                            className="btn btn-dark rounded-pill px-4 py-2 fw-semibold"
                        >
                            Dashboard
                        </Link>

                    </div>

                </div>


                {/* =================================================
                    STATUS HERO
                ================================================= */}

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
                                            Order Status
                                        </div>


                                        <h2 className="fw-bold mb-2">
                                            {customerName}'s Order
                                        </h2>


                                        <p className="text-secondary mb-0">
                                            Order{" "}
                                            <span className="fw-semibold">
                                                #
                                                {order.order_number ||
                                                    order.id}
                                            </span>{" "}
                                            is currently{" "}
                                            <span className="fw-semibold">
                                                {displayStatus
                                                    .replaceAll(
                                                        "_",
                                                        " "
                                                    )}
                                            </span>
                                            .
                                        </p>

                                    </div>

                                </div>

                            </div>


                            <div className="col-lg-4">

                                <div className="bg-light rounded-4 p-4 text-lg-end">

                                    <div className="small text-secondary mb-2">
                                        Current Status
                                    </div>


                                    <span
                                        className={`badge ${statusInfo.badge} rounded-pill px-3 py-2`}
                                    >
                                        {statusInfo.icon}{" "}
                                        {statusInfo.label}
                                    </span>


                                    <div className="small text-secondary mt-2">
                                        {statusInfo.description}
                                    </div>

                                </div>

                            </div>

                        </div>

                    </div>

                </div>


                {/* =================================================
                    ORDER JOURNEY
                ================================================= */}

                <div className="card border-0 shadow-sm rounded-4 mb-4">

                    <div className="card-body p-4 p-lg-5">

                        <div className="mb-4">

                            <div className="text-uppercase small fw-bold text-primary">
                                Order Journey
                            </div>

                            <h3 className="fw-bold mb-1">
                                Track Order
                            </h3>

                            <p className="text-secondary mb-0">
                                Follow the progress of this customer order.
                            </p>

                        </div>


                        <div className="row g-3">

                            {trackingSteps.map(
                                (step, index) => (

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
                                                        {step.completed
                                                            ? "✓"
                                                            : index + 1}
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

                                )
                            )}

                        </div>

                    </div>

                </div>


                {/* =================================================
                    MAIN CONTENT
                ================================================= */}

                <div className="row g-4">


                    {/* =============================================
                        LEFT SIDE
                    ============================================= */}

                    <div className="col-lg-8">


                        {/* =========================================
                            CUSTOMER INFORMATION
                        ========================================= */}

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
                                        👤
                                    </div>

                                    <div>

                                        <div className="text-uppercase small fw-bold text-primary">
                                            Customer
                                        </div>

                                        <h4 className="fw-bold mb-0">
                                            Customer Information
                                        </h4>

                                    </div>

                                </div>


                                <div className="row g-3">

                                    <div className="col-md-6">

                                        <div className="bg-light rounded-4 p-3 h-100">

                                            <div className="small text-secondary mb-1">
                                                Customer Name
                                            </div>

                                            <div className="fw-semibold">
                                                {customerName}
                                            </div>

                                        </div>

                                    </div>


                                    <div className="col-md-6">

                                        <div className="bg-light rounded-4 p-3 h-100">

                                            <div className="small text-secondary mb-1">
                                                Email
                                            </div>

                                            <div className="fw-semibold text-break">
                                                {order.customer_email ||
                                                    "No email available"}
                                            </div>

                                        </div>

                                    </div>


                                    <div className="col-md-6">

                                        <div className="bg-light rounded-4 p-3 h-100">

                                            <div className="small text-secondary mb-1">
                                                Customer ID
                                            </div>

                                            <div className="fw-semibold">
                                                {order.user_id
                                                    ? `#${order.user_id}`
                                                    : "N/A"}
                                            </div>

                                        </div>

                                    </div>


                                    <div className="col-md-6">

                                        <div className="bg-light rounded-4 p-3 h-100">

                                            <div className="small text-secondary mb-1">
                                                Order ID
                                            </div>

                                            <div className="fw-semibold">
                                                #{order.id}
                                            </div>

                                        </div>

                                    </div>

                                </div>

                            </div>

                        </div>


                        {/* =========================================
                            ORDERED PRODUCTS
                        ========================================= */}

                        <div className="card border-0 shadow-sm rounded-4 mb-4">

                            <div className="card-body p-4">

                                <div className="d-flex justify-content-between align-items-center mb-4">

                                    <div>

                                        <div className="text-uppercase small fw-bold text-primary">
                                            Ordered Items
                                        </div>

                                        <h3 className="fw-bold mb-0">
                                            Products
                                        </h3>

                                    </div>


                                    <span className="badge bg-light text-dark rounded-pill px-3 py-2">
                                        {orderItems.length}{" "}
                                        {orderItems.length === 1
                                            ? "Item"
                                            : "Items"}
                                    </span>

                                </div>


                                <div className="vstack gap-3">

                                    {orderItems.length > 0 ? (

                                        orderItems.map(
                                            (item) => {

                                                const quantity =
                                                    Number(
                                                        item.quantity
                                                    );

                                                const unitPrice =
                                                    Number(
                                                        item.unit_price
                                                    );

                                                const itemTotal =
                                                    unitPrice *
                                                    quantity;


                                                return (
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
                                                                            src={
                                                                                item.image_url
                                                                            }
                                                                            alt={
                                                                                item.product_name ||
                                                                                "Product"
                                                                            }
                                                                            className="img-fluid"
                                                                            style={{
                                                                                width: "100%",
                                                                                height: "100%",
                                                                                objectFit:
                                                                                    "contain",
                                                                            }}
                                                                        />

                                                                    ) : (

                                                                        <span className="text-secondary small">
                                                                            No Image
                                                                        </span>

                                                                    )}

                                                                </div>

                                                            </div>


                                                            {/* PRODUCT INFO */}

                                                            <div className="col">

                                                                <h5 className="fw-semibold mb-2">
                                                                    {item.product_name ||
                                                                        "Unnamed Product"}
                                                                </h5>


                                                                <div className="d-flex flex-wrap gap-2 mb-2">

                                                                    <span className="badge bg-primary-subtle text-primary rounded-pill">
                                                                        Qty:{" "}
                                                                        {
                                                                            quantity
                                                                        }
                                                                    </span>


                                                                    <span className="badge bg-light text-dark rounded-pill">
                                                                        Unit Price:{" "}
                                                                        {money(
                                                                            unitPrice
                                                                        )}
                                                                    </span>

                                                                </div>


                                                                {item.product_id && (

                                                                    <div className="small text-secondary">
                                                                        Product ID:{" "}
                                                                        #
                                                                        {
                                                                            item.product_id
                                                                        }
                                                                    </div>

                                                                )}

                                                            </div>


                                                            {/* ITEM TOTAL */}

                                                            <div className="col-12 col-sm-auto text-sm-end">

                                                                <div className="small text-secondary">
                                                                    Item Total
                                                                </div>

                                                                <div className="fw-bold fs-5">
                                                                    {money(
                                                                        itemTotal
                                                                    )}
                                                                </div>

                                                            </div>

                                                        </div>

                                                    </div>
                                                );
                                            }
                                        )

                                    ) : (

                                        <div className="bg-light rounded-4 p-5 text-center">

                                            <div className="display-6 mb-3">
                                                📦
                                            </div>

                                            <h5 className="fw-bold">
                                                No products found
                                            </h5>

                                            <p className="text-secondary mb-0">
                                                No order items are associated with this order.
                                            </p>

                                        </div>

                                    )}

                                </div>

                            </div>

                        </div>


                        {/* =========================================
                            DELIVERY INFORMATION
                        ========================================= */}

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


                                {/* STATUS + SHIPPING METHOD */}

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


                                {/* ADDRESS */}

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


                                    <div>

                                        <div className="fw-semibold mb-2">
                                            {order.full_name ||
                                                customerName}
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


                                        {(order.city ||
                                            order.state) && (

                                            <div className="text-secondary small lh-lg">

                                                {order.city}

                                                {order.city &&
                                                order.state
                                                    ? `, ${order.state}`
                                                    : order.state ||
                                                      ""}

                                            </div>
                                        )}


                                        {order.postal_code && (

                                            <div className="text-secondary small lh-lg">
                                                PIN:{" "}
                                                {
                                                    order.postal_code
                                                }
                                            </div>

                                        )}


                                        {order.phone && (

                                            <div className="text-secondary small mt-2">
                                                Phone:{" "}
                                                {order.phone}
                                            </div>

                                        )}


                                        {!order.line1 &&
                                            !order.line2 &&
                                            !order.city &&
                                            !order.state &&
                                            !order.postal_code && (

                                                <div className="text-secondary small">
                                                    No shipping address available.
                                                </div>

                                            )}

                                    </div>

                                </div>

                            </div>

                        </div>


                        {/* =========================================
                            PAYMENT INFORMATION
                        ========================================= */}

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
                                                {paymentMethod}
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
                                                    paymentStatus ===
                                                    "PAID"
                                                        ? "bg-success"
                                                        : paymentStatus ===
                                                            "FAILED"
                                                          ? "bg-danger"
                                                          : "bg-warning text-dark"
                                                }`}
                                            >
                                                {paymentStatus}
                                            </span>

                                        </div>

                                    </div>

                                </div>

                            </div>

                        </div>

                    </div>


                    {/* =============================================
                        RIGHT SIDE
                    ============================================= */}

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
                                        {money(
                                            Number(
                                                order.subtotal ?? 0
                                            )
                                        )}
                                    </span>

                                </div>


                                <div className="d-flex justify-content-between mb-3">

                                    <span className="text-secondary">
                                        Shipping
                                    </span>

                                    <span className="fw-semibold text-success">

                                        {Number(
                                            order.shipping ?? 0
                                        ) > 0
                                            ? money(
                                                  Number(
                                                      order.shipping
                                                  )
                                              )
                                            : "FREE"}

                                    </span>

                                </div>


                                <hr />


                                <div className="d-flex justify-content-between align-items-center mb-4">

                                    <span className="fw-bold fs-5">
                                        Total
                                    </span>

                                    <span className="fw-bold fs-4 text-primary">
                                        {money(
                                            Number(
                                                order.total ?? 0
                                            )
                                        )}
                                    </span>

                                </div>


                                {/* CUSTOMER */}

                                <div className="bg-primary-subtle rounded-4 p-3 mb-3">

                                    <div className="d-flex gap-2">

                                        <span className="text-primary">
                                            👤
                                        </span>

                                        <div>

                                            <div className="fw-semibold text-primary">
                                                Customer
                                            </div>

                                            <div className="small text-secondary">
                                                {customerName}
                                            </div>

                                            <div className="small text-secondary text-break">
                                                {order.customer_email ||
                                                    "No email"}
                                            </div>

                                        </div>

                                    </div>

                                </div>


                                {/* SECURE ORDER */}

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
                                                Order information is safely stored in the Aurora system.
                                            </div>

                                        </div>

                                    </div>

                                </div>


                                <div className="d-grid gap-2">

                                    <Link
                                        href="/admin/orders"
                                        className="btn btn-outline-primary rounded-pill py-2 fw-semibold"
                                    >
                                        View All Orders
                                    </Link>


                                    <Link
                                        href="/admin"
                                        className="btn btn-dark rounded-pill py-2 fw-semibold"
                                    >
                                        Back to Dashboard
                                    </Link>

                                </div>

                            </div>

                        </div>

                    </div>

                </div>


                {/* =================================================
                    ADMIN SUPPORT / INFORMATION
                ================================================= */}

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
                                    !
                                </div>

                            </div>


                            <div className="col">

                                <h5 className="fw-bold mb-1">
                                    Order Management
                                </h5>

                                <p className="text-secondary mb-0">
                                    You are viewing this order as an Aurora administrator. All information above belongs to the selected customer order.
                                </p>

                            </div>


                            <div className="col-12 col-md-auto">

                                <Link
                                    href="/admin/orders"
                                    className="btn btn-outline-primary rounded-pill px-4"
                                >
                                    Back to Orders
                                </Link>

                            </div>

                        </div>

                    </div>

                </div>

            </div>

        </main>
    );
}