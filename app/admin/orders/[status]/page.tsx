import Link from "next/link";
import { notFound, redirect } from "next/navigation";

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

const statusConfig = {
    pending: {
        title: "Pending Orders",
        description: "Orders that are waiting to be processed.",
        gradient: "linear-gradient(135deg, #f59e0b, #f97316)",
        icon: "⏳",
    },

    processing: {
        title: "Processing Orders",
        description: "Orders currently being prepared.",
        gradient: "linear-gradient(135deg, #06b6d4, #2563eb)",
        icon: "⚙️",
    },

    delivered: {
        title: "Delivered Orders",
        description: "Orders successfully delivered to customers.",
        gradient: "linear-gradient(135deg, #10b981, #059669)",
        icon: "✓",
    },
} as const;

const normalizeStatus = (status?: string | null) => {
    return String(status ?? "")
        .trim()
        .toUpperCase();
};

const getDisplayStatus = (status?: string | null) => {
    const normalized = normalizeStatus(status);

    /*
     * Your database stores new orders as PLACED.
     * Dashboard treats PLACED as PENDING.
     */
    if (normalized === "PLACED") {
        return "PENDING";
    }

    return normalized;
};

const statusClass = (status?: string | null) => {
    switch (getDisplayStatus(status)) {
        case "PENDING":
            return "bg-warning-subtle text-warning-emphasis";

        case "PROCESSING":
            return "bg-info-subtle text-info-emphasis";

        case "DELIVERED":
            return "bg-success-subtle text-success-emphasis";

        default:
            return "bg-secondary-subtle text-secondary-emphasis";
    }
};

export default async function OrderStatusPage({
    params,
}: {
    params: Promise<{ status: string }>;
}) {
    const user = await getSession();

    if (!user) {
        redirect("/account");
    }

    if (user.role !== "ADMIN") {
        redirect("/");
    }

    const { status } = await params;

    const requestedStatus = status
        .trim()
        .toLowerCase();

    /*
     * Check whether the URL is valid.
     */
    if (
        requestedStatus !== "pending" &&
        requestedStatus !== "processing" &&
        requestedStatus !== "delivered"
    ) {
        notFound();
    }

    const config = statusConfig[requestedStatus];

    /*
     * =========================================================
     * GET ORDERS FOR THIS STATUS
     * =========================================================
     *
     * Pending:
     *     PLACED + PENDING
     *
     * Processing:
     *     PROCESSING
     *
     * Delivered:
     *     DELIVERED
     *
     * All users are included.
     */

    let statusCondition = "";

    let queryParams: string[] = [];

    if (requestedStatus === "pending") {
        statusCondition = `
            UPPER(TRIM(COALESCE(o.status, '')))
            IN ('PLACED', 'PENDING')
        `;
    } else {
        statusCondition = `
            UPPER(TRIM(COALESCE(o.status, ''))) = ?
        `;

        queryParams = [
            requestedStatus.toUpperCase(),
        ];
    }

    const [ordersResult] = await db.query(
        `
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
        WHERE ${statusCondition}
        ORDER BY o.created_at DESC
        LIMIT 1000
        `,
        queryParams
    );

    const orders = ordersResult as OrderRow[];

    /*
     * Convert PLACED to PENDING for display.
     */
    const normalizedOrders = orders.map((order) => ({
        ...order,
        status: getDisplayStatus(order.status),
    }));

    return (
        <main
            className="min-vh-100 py-4"
            style={{
                background:
                    "linear-gradient(135deg, #f8f9ff 0%, #eef4ff 50%, #fdf8ff 100%)",
            }}
        >
            <div className="container-fluid px-3 px-lg-5">

                {/* HEADER */}

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
                                    background: config.gradient,
                                }}
                            >
                                {config.icon}{" "}
                                {requestedStatus.toUpperCase()}
                            </span>

                        </div>

                        <h1 className="display-6 fw-bold mb-1">
                            {config.title}
                        </h1>

                        <p className="text-secondary mb-0">
                            {config.description}
                        </p>

                    </div>

                    <Link
                        href="/admin/orders"
                        className="btn btn-light border rounded-4 px-4 py-2 shadow-sm"
                    >
                        ← All Orders
                    </Link>

                </div>


                {/* SUMMARY CARD */}

                <div
                    className="card border-0 rounded-4 shadow-sm mb-4 overflow-hidden"
                    style={{
                        background: config.gradient,
                    }}
                >

                    <div className="card-body p-4 text-white">

                        <div className="d-flex justify-content-between align-items-center">

                            <div>

                                <div className="small text-uppercase fw-semibold opacity-75">
                                    {config.title}
                                </div>

                                <div className="display-5 fw-bold mt-2">
                                    {normalizedOrders.length.toLocaleString(
                                        "en-IN"
                                    )}
                                </div>

                                <div className="small opacity-75 mt-1">
                                    Orders from all users
                                </div>

                            </div>

                            <div
                                className="rounded-circle d-flex align-items-center justify-content-center"
                                style={{
                                    width: 70,
                                    height: 70,
                                    background:
                                        "rgba(255,255,255,.2)",
                                    fontSize: 30,
                                }}
                            >
                                {config.icon}
                            </div>

                        </div>

                    </div>

                </div>


                {/* ORDERS TABLE */}

                <div className="card border-0 shadow-sm rounded-4 overflow-hidden">

                    <div className="card-body p-3 p-lg-4">

                        <div className="mb-4">

                            <h4 className="fw-bold mb-1">
                                {config.title}
                            </h4>

                            <p className="text-secondary small mb-0">
                                Showing all user orders with this status.
                            </p>

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

                                                <td>

                                                    <div className="fw-semibold">
                                                        {order.order_number ||
                                                            `Order #${order.id}`}
                                                    </div>

                                                    <div className="small text-secondary">
                                                        ID #{order.id}
                                                    </div>

                                                </td>


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


                                                <td className="fw-bold">

                                                    {Number.isFinite(
                                                        Number(order.total)
                                                    )
                                                        ? money(
                                                              Number(
                                                                  order.total
                                                              )
                                                          )
                                                        : "₹0"}

                                                </td>


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
                                                className="text-center py-5"
                                            >

                                                <div className="display-6 mb-3">
                                                    {config.icon}
                                                </div>

                                                <h5 className="fw-bold">
                                                    No {requestedStatus} orders
                                                </h5>

                                                <p className="text-secondary mb-0">
                                                    There are currently no
                                                    orders with this status.
                                                </p>

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