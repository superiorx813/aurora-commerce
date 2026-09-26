import Link from "next/link";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { money } from "@/lib/utils";
import OrderStatusSelect from "@/components/admin/OrderStatusSelect";

export const dynamic = "force-dynamic";

type OrderRow = {
    id: number;
    order_number: string;
    total: number;
    status: string | null;
    created_at: string | Date;
    customer_name: string | null;
    customer_email: string | null;
};

/*
 * Normalize status values.
 */
const normalizeStatus = (status?: string | null) => {
    return String(status ?? "")
        .trim()
        .toUpperCase();
};

/*
 * Convert database status into dashboard display status.
 *
 * Database:
 * PLACED
 *
 * Dashboard:
 * PENDING
 */
const dashboardStatus = (status?: string | null) => {
    const normalized = normalizeStatus(status);

    if (normalized === "PLACED") {
        return "PENDING";
    }

    return normalized;
};

/*
 * Human-readable status labels.
 */
const statusLabel = (status?: string | null) => {
    switch (dashboardStatus(status)) {
        case "PENDING":
            return "Pending";

        case "CONFIRMED":
            return "Confirmed";

        case "PACKED":
            return "Packed";

        case "SHIPPED":
            return "Shipped";

        case "OUT_FOR_DELIVERY":
            return "Out for Delivery";

        case "DELIVERED":
            return "Delivered";

        case "CANCELLED":
            return "Cancelled";

        default:
            return "Unknown";
    }
};

/*
 * Status badge styling.
 */
const statusClass = (status?: string | null) => {
    switch (dashboardStatus(status)) {
        case "PENDING":
            return "bg-warning-subtle text-warning-emphasis";

        case "CONFIRMED":
            return "bg-info-subtle text-info-emphasis";

        case "PACKED":
            return "bg-primary-subtle text-primary-emphasis";

        case "SHIPPED":
            return "bg-primary-subtle text-primary-emphasis";

        case "OUT_FOR_DELIVERY":
            return "bg-info-subtle text-info-emphasis";

        case "DELIVERED":
            return "bg-success-subtle text-success-emphasis";

        case "CANCELLED":
            return "bg-danger-subtle text-danger-emphasis";

        default:
            return "bg-secondary-subtle text-secondary-emphasis";
    }
};

export default async function AdminOrdersPage() {
    const user = await getSession();

    /*
     * Authentication
     */
    if (!user) {
        redirect("/account");
    }

    /*
     * Only administrators can access this page.
     */
    if (user.role !== "ADMIN") {
        redirect("/");
    }

    /*
     * Get all customer orders.
     */
    const [ordersResult] = await db.query(`
        SELECT
            o.id,
            o.order_number,
            o.total,
            o.status,
            o.created_at,
            u.name AS customer_name,
            u.email AS customer_email
        FROM orders o
        LEFT JOIN users u
            ON u.id = o.user_id
        ORDER BY o.created_at DESC
    `);

    const orders = ordersResult as OrderRow[];

    /*
     * Normalize database statuses for dashboard display.
     *
     * PLACED -> PENDING
     *
     * Important:
     * This is only for displaying the dashboard.
     * The database value remains PLACED.
     */
    const normalizedOrders = orders.map((order) => ({
        ...order,
        status: dashboardStatus(order.status),
    }));

    /*
     * =========================================================
     * ORDER COUNTS
     * =========================================================
     */

    /*
     * Total
     */
    const totalOrders = normalizedOrders.length;

    /*
     * Pending
     *
     * Database PLACED is displayed as Pending.
     */
    const pendingOrders = normalizedOrders.filter(
        (order) => order.status === "PENDING"
    ).length;

    /*
     * Confirmed
     */
    const confirmedOrders = normalizedOrders.filter(
        (order) => order.status === "CONFIRMED"
    ).length;

    /*
     * Packed
     */
    const packedOrders = normalizedOrders.filter(
        (order) => order.status === "PACKED"
    ).length;

    /*
     * Processing
     *
     * There is NO PROCESSING value in your database enum.
     *
     * Processing is therefore represented by the active
     * fulfillment stages:
     *
     * CONFIRMED
     * PACKED
     * SHIPPED
     * OUT_FOR_DELIVERY
     */
    const processingOrders = normalizedOrders.filter(
        (order) =>
            order.status === "CONFIRMED" ||
            order.status === "PACKED" ||
            order.status === "SHIPPED" ||
            order.status === "OUT_FOR_DELIVERY"
    ).length;

    /*
     * Shipped
     */
    const shippedOrders = normalizedOrders.filter(
        (order) => order.status === "SHIPPED"
    ).length;

    /*
     * Out for Delivery
     */
    const outForDeliveryOrders = normalizedOrders.filter(
        (order) => order.status === "OUT_FOR_DELIVERY"
    ).length;

    /*
     * Delivered
     */
    const deliveredOrders = normalizedOrders.filter(
        (order) => order.status === "DELIVERED"
    ).length;

    /*
     * Cancelled
     */
    const cancelledOrders = normalizedOrders.filter(
        (order) => order.status === "CANCELLED"
    ).length;

    return (
        <main
            className="min-vh-100 py-4"
            style={{
                background:
                    "linear-gradient(135deg, #f8f9ff 0%, #eef4ff 50%, #fdf8ff 100%)",
            }}
        >
            <div className="container-fluid px-3 px-lg-5">

                {/* =====================================================
                    HEADER
                ====================================================== */}

                <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-end gap-3 mb-4">

                    <div>

                        <div className="d-flex align-items-center gap-2 mb-3">

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
                                        "linear-gradient(135deg, #6366f1, #8b5cf6)",
                                }}
                            >
                                ORDERS
                            </span>

                        </div>

                        <h1 className="display-6 fw-bold mb-1">
                            Order Management
                        </h1>

                        <p className="text-secondary mb-0">
                            Monitor all customer orders and track their current
                            fulfillment status.
                        </p>

                    </div>

                    <Link
                        href="/admin"
                        className="btn btn-light border rounded-4 px-4 py-2 shadow-sm"
                    >
                        ← Dashboard
                    </Link>

                </div>

                {/* =====================================================
                    STATISTICS CARDS
                ====================================================== */}

                <div className="row g-4 mb-4">

                    {/* =================================================
                        TOTAL ORDERS
                    ================================================== */}

                    <div className="col-12 col-sm-6 col-xl-3">

                        <Link
                            href="/admin/orders"
                            className="text-decoration-none"
                        >

                            <div
                                className="card border-0 rounded-4 h-100 shadow-sm text-white"
                                style={{
                                    background:
                                        "linear-gradient(135deg, #4f46e5, #7c3aed)",
                                }}
                            >

                                <div className="card-body p-4">

                                    <div className="d-flex justify-content-between align-items-start">

                                        <div>

                                            <div className="small text-uppercase fw-semibold opacity-75">
                                                Total Orders
                                            </div>

                                            <div className="display-6 fw-bold mt-2">
                                                {totalOrders.toLocaleString(
                                                    "en-IN"
                                                )}
                                            </div>

                                        </div>

                                        <div
                                            className="rounded-circle d-flex align-items-center justify-content-center"
                                            style={{
                                                width: 50,
                                                height: 50,
                                                background:
                                                    "rgba(255,255,255,.18)",
                                                fontSize: 22,
                                            }}
                                        >
                                            🛍️
                                        </div>

                                    </div>

                                    <div className="small mt-3 opacity-75">
                                        All orders →
                                    </div>

                                </div>

                            </div>

                        </Link>

                    </div>

                    {/* =================================================
                        PENDING
                    ================================================== */}

                    <div className="col-12 col-sm-6 col-xl-3">

                        <Link
                            href="/admin/orders/status/pending"
                            className="text-decoration-none"
                        >

                            <div
                                className="card border-0 rounded-4 h-100 shadow-sm"
                                style={{
                                    background:
                                        "linear-gradient(135deg, #fff7ed, #ffedd5)",
                                }}
                            >

                                <div className="card-body p-4">

                                    <div className="d-flex justify-content-between align-items-start">

                                        <div>

                                            <div className="small text-uppercase fw-semibold text-warning-emphasis">
                                                Pending
                                            </div>

                                            <div className="display-6 fw-bold text-warning mt-2">
                                                {pendingOrders.toLocaleString(
                                                    "en-IN"
                                                )}
                                            </div>

                                        </div>

                                        <div
                                            className="rounded-circle bg-warning text-white d-flex align-items-center justify-content-center"
                                            style={{
                                                width: 50,
                                                height: 50,
                                                fontSize: 22,
                                            }}
                                        >
                                            ⏳
                                        </div>

                                    </div>

                                    <div className="small text-secondary mt-3">
                                        View pending orders →
                                    </div>

                                </div>

                            </div>

                        </Link>

                    </div>

                    {/* =================================================
                        CONFIRMED
                    ================================================== */}

                    <div className="col-12 col-sm-6 col-xl-3">

                        <Link
                            href="/admin/orders/status/confirmed"
                            className="text-decoration-none"
                        >

                            <div
                                className="card border-0 rounded-4 h-100 shadow-sm"
                                style={{
                                    background:
                                        "linear-gradient(135deg, #ecfeff, #cffafe)",
                                }}
                            >

                                <div className="card-body p-4">

                                    <div className="d-flex justify-content-between align-items-start">

                                        <div>

                                            <div className="small text-uppercase fw-semibold text-info-emphasis">
                                                Confirmed
                                            </div>

                                            <div className="display-6 fw-bold text-info mt-2">
                                                {confirmedOrders.toLocaleString(
                                                    "en-IN"
                                                )}
                                            </div>

                                        </div>

                                        <div
                                            className="rounded-circle bg-info text-white d-flex align-items-center justify-content-center"
                                            style={{
                                                width: 50,
                                                height: 50,
                                                fontSize: 22,
                                            }}
                                        >
                                            ✓
                                        </div>

                                    </div>

                                    <div className="small text-secondary mt-3">
                                        View confirmed orders →
                                    </div>

                                </div>

                            </div>

                        </Link>

                    </div>

                    {/* =================================================
                        PACKED
                    ================================================== */}

                    <div className="col-12 col-sm-6 col-xl-3">

                        <Link
                            href="/admin/orders/status/packed"
                            className="text-decoration-none"
                        >

                            <div
                                className="card border-0 rounded-4 h-100 shadow-sm"
                                style={{
                                    background:
                                        "linear-gradient(135deg, #eef2ff, #ddd6fe)",
                                }}
                            >

                                <div className="card-body p-4">

                                    <div className="d-flex justify-content-between align-items-start">

                                        <div>

                                            <div className="small text-uppercase fw-semibold text-primary-emphasis">
                                                Packed
                                            </div>

                                            <div className="display-6 fw-bold text-primary mt-2">
                                                {packedOrders.toLocaleString(
                                                    "en-IN"
                                                )}
                                            </div>

                                        </div>

                                        <div
                                            className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center"
                                            style={{
                                                width: 50,
                                                height: 50,
                                                fontSize: 22,
                                            }}
                                        >
                                            📦
                                        </div>

                                    </div>

                                    <div className="small text-secondary mt-3">
                                        View packed orders →
                                    </div>

                                </div>

                            </div>

                        </Link>

                    </div>

                    {/* =================================================
                        PROCESSING
                    ================================================== */}

                    <div className="col-12 col-sm-6 col-xl-3">

                        <Link
                            href="/admin/orders/status/processing"
                            className="text-decoration-none"
                        >

                            <div
                                className="card border-0 rounded-4 h-100 shadow-sm"
                                style={{
                                    background:
                                        "linear-gradient(135deg, #e0f2fe, #dbeafe)",
                                }}
                            >

                                <div className="card-body p-4">

                                    <div className="d-flex justify-content-between align-items-start">

                                        <div>

                                            <div className="small text-uppercase fw-semibold text-info-emphasis">
                                                Processing
                                            </div>

                                            <div className="display-6 fw-bold text-info mt-2">
                                                {processingOrders.toLocaleString(
                                                    "en-IN"
                                                )}
                                            </div>

                                        </div>

                                        <div
                                            className="rounded-circle bg-info text-white d-flex align-items-center justify-content-center"
                                            style={{
                                                width: 50,
                                                height: 50,
                                                fontSize: 22,
                                            }}
                                        >
                                            ⚙️
                                        </div>

                                    </div>

                                    <div className="small text-secondary mt-3">
                                        View processing orders →
                                    </div>

                                </div>

                            </div>

                        </Link>

                    </div>

                    {/* =================================================
                        SHIPPED
                    ================================================== */}

                    <div className="col-12 col-sm-6 col-xl-3">

                        <Link
                            href="/admin/orders/status/shipped"
                            className="text-decoration-none"
                        >

                            <div
                                className="card border-0 rounded-4 h-100 shadow-sm"
                                style={{
                                    background:
                                        "linear-gradient(135deg, #dbeafe, #e0e7ff)",
                                }}
                            >

                                <div className="card-body p-4">

                                    <div className="d-flex justify-content-between align-items-start">

                                        <div>

                                            <div className="small text-uppercase fw-semibold text-primary-emphasis">
                                                Shipped
                                            </div>

                                            <div className="display-6 fw-bold text-primary mt-2">
                                                {shippedOrders.toLocaleString(
                                                    "en-IN"
                                                )}
                                            </div>

                                        </div>

                                        <div
                                            className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center"
                                            style={{
                                                width: 50,
                                                height: 50,
                                                fontSize: 22,
                                            }}
                                        >
                                            🚚
                                        </div>

                                    </div>

                                    <div className="small text-secondary mt-3">
                                        View shipped orders →
                                    </div>

                                </div>

                            </div>

                        </Link>

                    </div>

                    {/* =================================================
                        OUT FOR DELIVERY
                    ================================================== */}

                    <div className="col-12 col-sm-6 col-xl-3">

                        <Link
                            href="/admin/orders/status/out-for-delivery"
                            className="text-decoration-none"
                        >

                            <div
                                className="card border-0 rounded-4 h-100 shadow-sm"
                                style={{
                                    background:
                                        "linear-gradient(135deg, #fce7f3, #f3e8ff)",
                                }}
                            >

                                <div className="card-body p-4">

                                    <div className="d-flex justify-content-between align-items-start">

                                        <div>

                                            <div className="small text-uppercase fw-semibold text-danger-emphasis">
                                                Out for Delivery
                                            </div>

                                            <div className="display-6 fw-bold text-danger mt-2">
                                                {outForDeliveryOrders.toLocaleString(
                                                    "en-IN"
                                                )}
                                            </div>

                                        </div>

                                        <div
                                            className="rounded-circle bg-danger text-white d-flex align-items-center justify-content-center"
                                            style={{
                                                width: 50,
                                                height: 50,
                                                fontSize: 22,
                                            }}
                                        >
                                            🛵
                                        </div>

                                    </div>

                                    <div className="small text-secondary mt-3">
                                        View delivery orders →
                                    </div>

                                </div>

                            </div>

                        </Link>

                    </div>

                    {/* =================================================
                        DELIVERED
                    ================================================== */}

                    <div className="col-12 col-sm-6 col-xl-3">

                        <Link
                            href="/admin/orders/status/delivered"
                            className="text-decoration-none"
                        >

                            <div
                                className="card border-0 rounded-4 h-100 shadow-sm"
                                style={{
                                    background:
                                        "linear-gradient(135deg, #ecfdf5, #d1fae5)",
                                }}
                            >

                                <div className="card-body p-4">

                                    <div className="d-flex justify-content-between align-items-start">

                                        <div>

                                            <div className="small text-uppercase fw-semibold text-success-emphasis">
                                                Delivered
                                            </div>

                                            <div className="display-6 fw-bold text-success mt-2">
                                                {deliveredOrders.toLocaleString(
                                                    "en-IN"
                                                )}
                                            </div>

                                        </div>

                                        <div
                                            className="rounded-circle bg-success text-white d-flex align-items-center justify-content-center"
                                            style={{
                                                width: 50,
                                                height: 50,
                                                fontSize: 22,
                                            }}
                                        >
                                            ✓
                                        </div>

                                    </div>

                                    <div className="small text-secondary mt-3">
                                        View delivered orders →
                                    </div>

                                </div>

                            </div>

                        </Link>

                    </div>

                    {/* =================================================
                        CANCELLED
                    ================================================== */}

                    <div className="col-12 col-sm-6 col-xl-3">

                        <Link
                            href="/admin/orders/status/cancelled"
                            className="text-decoration-none"
                        >

                            <div
                                className="card border-0 rounded-4 h-100 shadow-sm"
                                style={{
                                    background:
                                        "linear-gradient(135deg, #fef2f2, #fee2e2)",
                                }}
                            >

                                <div className="card-body p-4">

                                    <div className="d-flex justify-content-between align-items-start">

                                        <div>

                                            <div className="small text-uppercase fw-semibold text-danger-emphasis">
                                                Cancelled
                                            </div>

                                            <div className="display-6 fw-bold text-danger mt-2">
                                                {cancelledOrders.toLocaleString(
                                                    "en-IN"
                                                )}
                                            </div>

                                        </div>

                                        <div
                                            className="rounded-circle bg-danger text-white d-flex align-items-center justify-content-center"
                                            style={{
                                                width: 50,
                                                height: 50,
                                                fontSize: 22,
                                            }}
                                        >
                                            ✕
                                        </div>

                                    </div>

                                    <div className="small text-secondary mt-3">
                                        View cancelled orders →
                                    </div>

                                </div>

                            </div>

                        </Link>

                    </div>

                </div>

                {/* =====================================================
                    ALL ORDERS TABLE
                ====================================================== */}

                <div className="card border-0 shadow-sm rounded-4 overflow-hidden">

                    <div className="card-body p-3 p-lg-4">

                        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">

                            <div>

                                <h4 className="fw-bold mb-1">
                                    All Customer Orders
                                </h4>

                                <p className="text-secondary small mb-0">
                                    Showing orders from all customers.
                                </p>

                            </div>

                            <div
                                className="badge rounded-pill px-3 py-2"
                                style={{
                                    background: "#eef2ff",
                                    color: "#4f46e5",
                                }}
                            >
                                {totalOrders.toLocaleString("en-IN")} Orders
                            </div>

                        </div>

                        <div className="table-responsive">

                            <table className="table align-middle mb-0">

                                <thead>

                                    <tr className="text-secondary small">

                                        <th className="border-0">
                                            Order
                                        </th>

                                        <th className="border-0">
                                            Customer
                                        </th>

                                        <th className="border-0">
                                            Date
                                        </th>

                                        <th className="border-0">
                                            Total
                                        </th>

                                        <th className="border-0">
                                            Status
                                        </th>

                                        <th className="border-0 text-end">
                                            Update Status
                                        </th>

                                    </tr>

                                </thead>

                                <tbody>

                                    {normalizedOrders.length > 0 ? (

                                        normalizedOrders.map((order) => (

                                            <tr
                                                key={order.id}
                                                style={{
                                                    cursor: "pointer",
                                                }}
                                            >

                                                {/* ORDER */}

                                                <td>

                                                    <Link
                                                        href={`/admin/orders/${order.id}`}
                                                        className="text-decoration-none text-dark d-block"
                                                    >

                                                        <div className="fw-semibold">
                                                            {order.order_number ||
                                                                `Order #${order.id}`}
                                                        </div>

                                                        <div className="small text-secondary">
                                                            ID #{order.id}
                                                        </div>

                                                    </Link>

                                                </td>

                                                {/* CUSTOMER */}

                                                <td>

                                                    <Link
                                                        href={`/admin/orders/${order.id}`}
                                                        className="text-decoration-none text-dark d-block"
                                                    >

                                                        <div className="fw-semibold">
                                                            {order.customer_name ||
                                                                "Unknown Customer"}
                                                        </div>

                                                        <div className="small text-secondary">
                                                            {order.customer_email ||
                                                                "No email"}
                                                        </div>

                                                    </Link>

                                                </td>

                                                {/* DATE */}

                                                <td>

                                                    <Link
                                                        href={`/admin/orders/${order.id}`}
                                                        className="text-decoration-none text-dark d-block"
                                                    >

                                                        <span className="small">

                                                            {order.created_at
                                                                ? new Date(
                                                                      order.created_at
                                                                  ).toLocaleDateString(
                                                                      "en-IN"
                                                                  )
                                                                : "No date"}

                                                        </span>

                                                    </Link>

                                                </td>

                                                {/* TOTAL */}

                                                <td>

                                                    <Link
                                                        href={`/admin/orders/${order.id}`}
                                                        className="text-decoration-none text-dark d-block"
                                                    >

                                                        <span className="fw-bold">

                                                            {Number.isFinite(
                                                                Number(order.total)
                                                            )
                                                                ? money(
                                                                      Number(
                                                                          order.total
                                                                      )
                                                                  )
                                                                : "₹0"}

                                                        </span>

                                                    </Link>

                                                </td>

                                                {/* STATUS */}

                                                <td>

                                                    <Link
                                                        href={`/admin/orders/${order.id}`}
                                                        className="text-decoration-none d-block"
                                                    >

                                                        <span
                                                            className={`badge rounded-pill px-3 py-2 ${statusClass(
                                                                order.status
                                                            )}`}
                                                        >
                                                            {statusLabel(
                                                                order.status
                                                            )}
                                                        </span>

                                                    </Link>

                                                </td>

                                                {/* UPDATE STATUS */}

                                                <td className="text-end">

                                                    <OrderStatusSelect
                                                        orderId={order.id}
                                                        status={
                                                            order.status ===
                                                            "PENDING"
                                                                ? "PLACED"
                                                                : order.status
                                                        }
                                                    />

                                                </td>

                                            </tr>

                                        ))

                                    ) : (

                                        <tr>

                                            <td
                                                colSpan={6}
                                                className="text-center py-5 text-secondary"
                                            >
                                                No orders found.
                                            </td>

                                        </tr>

                                    )}

                                </tbody>

                            </table>

                        </div>

                    </div>

                </div>

            </div>
        </main>
    );
}

