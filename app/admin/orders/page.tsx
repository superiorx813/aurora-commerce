import Link from "next/link";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { money } from "@/lib/utils";

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
 * Converts all status variations into one standard format.
 *
 * PENDING
 * Pending
 * pending
 *  pending
 * PENDING
 *
 * all become:
 *
 * PENDING
 */
const normalizeStatus = (status?: string | null) => {
    return String(status ?? "")
        .trim()
        .toUpperCase();
};

/*
 * Status badge styling.
 */
const statusClass = (status?: string | null) => {
    switch (normalizeStatus(status)) {
        case "PENDING":
            return "bg-warning-subtle text-warning-emphasis";

        case "PROCESSING":
            return "bg-info-subtle text-info-emphasis";

        case "SHIPPED":
            return "bg-primary-subtle text-primary-emphasis";

        case "DELIVERED":
            return "bg-success-subtle text-success-emphasis";

        case "CANCELLED":
            return "bg-danger-subtle text-danger-emphasis";

        case "PAID":
            return "bg-success-subtle text-success-emphasis";

        default:
            return "bg-secondary-subtle text-secondary-emphasis";
    }
};

export default async function AdminOrdersPage() {
    const user = await getSession();

    /*
     * Check login.
     */
    if (!user) {
        redirect("/account");
    }

    /*
     * Only ADMIN can access this page.
     */
    if (user.role !== "ADMIN") {
        redirect("/");
    }

    /*
     * Get ALL orders.
     *
     * IMPORTANT:
     * There is NO user-role filter here.
     *
     * Therefore:
     * - Admin orders
     * - Customer orders
     * - Orders from every user
     *
     * are included.
     *
     * LEFT JOIN is used so the order still appears
     * even if its user record does not exist.
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

    /*
     * ordersResult contains the actual rows.
     */
    const orders = ordersResult as OrderRow[];

/*
 * Normalize the status coming from the database.
 *
 * Examples:
 *
 * PENDING  -> PENDING
 * Pending  -> PENDING
 * pending  -> PENDING
 * PLACED   -> PENDING
 * Placed   -> PENDING
 * placed   -> PENDING
 */
const normalizedOrders = orders.map((order) => {
    const databaseStatus = String(order.status ?? "")
        .trim()
        .toUpperCase();

    let dashboardStatus = databaseStatus;

    /*
     * Your database currently uses PLACED
     * for newly created orders.
     *
     * We treat PLACED as PENDING.
     */
    if (databaseStatus === "PLACED") {
        dashboardStatus = "PENDING";
    }

    return {
        ...order,
        status: dashboardStatus,
    };
});

/*
 * TOTAL ORDERS
 *
 * All orders from the orders table.
 */
const totalOrders = normalizedOrders.length;

/*
 * PENDING ORDERS
 *
 * Both PLACED and PENDING are treated as PENDING.
 *
 * Since normalizedOrders already converts PLACED
 * into PENDING, we only need to check PENDING here.
 */
const pendingOrders = normalizedOrders.filter(
    (order) => order.status === "PENDING"
).length;

/*
 * PROCESSING ORDERS
 */
const processingOrders = normalizedOrders.filter(
    (order) => order.status === "PROCESSING"
).length;

/*
 * DELIVERED ORDERS
 */
const deliveredOrders = normalizedOrders.filter(
    (order) => order.status === "DELIVERED"
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

                {/* =========================
                    HEADER
                ========================== */}

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
                            Monitor all orders and track their current status.
                        </p>

                    </div>

                    <Link
                        href="/admin"
                        className="btn btn-light border rounded-4 px-4 py-2 shadow-sm"
                    >
                        ← Dashboard
                    </Link>

                </div>


                {/* =========================
                    STATISTICS CARDS
                ========================== */}

                <div className="row g-4 mb-4">

                    {/* TOTAL ORDERS */}

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
                                                {totalOrders.toLocaleString("en-IN")}
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
                                        All users orders →
                                    </div>

                                </div>

                            </div>

                        </Link>

                    </div>


                    {/* PENDING */}

                    <div className="col-12 col-sm-6 col-xl-3">

                        <Link
                            href="/admin/orders/pending"
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
                                                {pendingOrders.toLocaleString("en-IN")}
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


                    {/* PROCESSING */}

                    <div className="col-12 col-sm-6 col-xl-3">

                        <Link
                            href="/admin/orders/processing"
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
                                                Processing
                                            </div>

                                            <div className="display-6 fw-bold text-info mt-2">
                                                {processingOrders.toLocaleString("en-IN")}
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


                    {/* DELIVERED */}

                    <div className="col-12 col-sm-6 col-xl-3">

                        <Link
                            href="/admin/orders/delivered"
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
                                                {deliveredOrders.toLocaleString("en-IN")}
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

                </div>


                {/* =========================
                    ALL ORDERS TABLE
                ========================== */}

                <div className="card border-0 shadow-sm rounded-4 overflow-hidden">

                    <div className="card-body p-3 p-lg-4">

                        <div className="d-flex justify-content-between align-items-center mb-4">

                            <div>

                                <h4 className="fw-bold mb-1">
                                    All Customer Orders
                                </h4>

                                <p className="text-secondary small mb-0">
                                    Showing orders from all users.
                                </p>

                            </div>

                            <div
                                className="badge rounded-pill px-3 py-2"
                                style={{
                                    background: "#eef2ff",
                                    color: "#4f46e5",
                                }}
                            >
                                {totalOrders} Orders
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

                                    </tr>

                                </thead>


                                <tbody>

                                    {normalizedOrders.length > 0 ? (

                                        normalizedOrders.map((order) => (

                                            <tr key={order.id}>

                                                {/* ORDER */}

                                                <td>

                                                    <div className="fw-semibold">
                                                        {order.order_number || `Order #${order.id}`}
                                                    </div>

                                                    <div className="small text-secondary">
                                                        ID #{order.id}
                                                    </div>

                                                </td>


                                                {/* CUSTOMER */}

                                                <td>

                                                    <div className="fw-semibold">

                                                        {order.customer_name ||
                                                            "Unknown Customer"}

                                                    </div>

                                                    <div className="small text-secondary">

                                                        {order.customer_email ||
                                                            "No email"}

                                                    </div>

                                                </td>


                                                {/* DATE */}

                                                <td>

                                                    <span className="small">

                                                        {order.created_at
                                                            ? new Date(
                                                                  order.created_at
                                                              ).toLocaleDateString(
                                                                  "en-IN"
                                                              )
                                                            : "No date"}

                                                    </span>

                                                </td>


                                                {/* TOTAL */}

                                                <td className="fw-bold">

                                                    {Number.isFinite(
                                                        Number(order.total)
                                                    )
                                                        ? money(
                                                              Number(order.total)
                                                          )
                                                        : "₹0"}

                                                </td>


                                                {/* STATUS */}

                                                <td>

                                                    <span
                                                        className={`badge rounded-pill px-3 py-2 ${statusClass(
                                                            order.status
                                                        )}`}
                                                    >
                                                        {order.status ||
                                                            "UNKNOWN"}
                                                    </span>

                                                </td>

                                            </tr>

                                        ))

                                    ) : (

                                        <tr>

                                            <td
                                                colSpan={5}
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