
import Link from "next/link";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { money } from "@/lib/utils";

export const dynamic = "force-dynamic";

type RevenueSummary = {
    total_revenue: number;
    total_orders: number;
    average_order_value: number;
};

type DailyRevenue = {
    revenue_date: string;
    revenue: number;
};

type RevenueOrder = {
    order_number: string;
    total: number;
    status: string;
    created_at: string;
};

export default async function AdminRevenuePage() {
    const user = await getSession();

    if (!user) {
        redirect("/account");
    }

    if (user.role !== "ADMIN") {
        redirect("/");
    }

    const [
        [summaryResult],
        [dailyResult],
        [ordersResult],
    ] = await Promise.all([
        db.query(`
            SELECT
                COALESCE(SUM(total), 0) AS total_revenue,
                COUNT(*) AS total_orders,
                COALESCE(AVG(total), 0) AS average_order_value
            FROM orders
            WHERE status <> 'CANCELLED'
        `),

        db.query(`
            SELECT
                DATE(created_at) AS revenue_date,
                COALESCE(SUM(total), 0) AS revenue
            FROM orders
            WHERE
                status <> 'CANCELLED'
                AND created_at >= DATE_SUB(CURDATE(), INTERVAL 29 DAY)
            GROUP BY DATE(created_at)
            ORDER BY revenue_date ASC
        `),

        db.query(`
            SELECT
                order_number,
                total,
                status,
                created_at
            FROM orders
            WHERE status <> 'CANCELLED'
            ORDER BY created_at DESC
            LIMIT 20
        `),
    ]);

    const summary = (
        summaryResult as RevenueSummary[]
    )[0];

    const dailyRevenue = dailyResult as DailyRevenue[];

    const recentOrders = ordersResult as RevenueOrder[];

    const revenueValues = dailyRevenue.map(
        (item) => Number(item.revenue) || 0
    );

    const highestDailyRevenue = Math.max(
        ...revenueValues,
        1
    );

    return (
        <main className="container-fluid bg-body-tertiary min-vh-100 py-4">
            <div className="container-fluid px-3 px-lg-4">

                {/* Header */}

                <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-end gap-3 mb-4">
                    <div>
                        <div className="d-flex align-items-center gap-2 mb-2">
                            <span className="badge rounded-pill text-bg-dark px-3 py-2">
                                AURORA CONTROL
                            </span>

                            <span className="badge rounded-pill bg-success-subtle text-success-emphasis px-3 py-2">
                                REVENUE
                            </span>
                        </div>

                        <h1 className="display-6 fw-bold mb-1">
                            Revenue
                        </h1>

                        <p className="text-secondary mb-0">
                            Track your store revenue and sales performance.
                        </p>
                    </div>

                    <Link
                        href="/admin"
                        className="btn btn-light border rounded-3 px-4"
                    >
                        ← Dashboard
                    </Link>
                </div>

                {/* Revenue statistics */}

                <div className="row g-3 mb-4">

                    <div className="col-12 col-md-4">
                        <div className="card border-0 shadow-sm rounded-4 h-100">
                            <div className="card-body p-4">
                                <div className="text-secondary small text-uppercase fw-semibold mb-2">
                                    Total Revenue
                                </div>

                                <div className="fs-2 fw-bold">
                                    {money(
                                        Number(
                                            summary?.total_revenue ?? 0
                                        )
                                    )}
                                </div>

                                <div className="small text-success mt-2">
                                    Excluding cancelled orders
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-12 col-md-4">
                        <div className="card border-0 shadow-sm rounded-4 h-100">
                            <div className="card-body p-4">
                                <div className="text-secondary small text-uppercase fw-semibold mb-2">
                                    Revenue Orders
                                </div>

                                <div className="fs-2 fw-bold">
                                    {Number(
                                        summary?.total_orders ?? 0
                                    ).toLocaleString("en-IN")}
                                </div>

                                <div className="small text-secondary mt-2">
                                    Valid orders contributing to revenue
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-12 col-md-4">
                        <div className="card border-0 shadow-sm rounded-4 h-100">
                            <div className="card-body p-4">
                                <div className="text-secondary small text-uppercase fw-semibold mb-2">
                                    Average Order Value
                                </div>

                                <div className="fs-2 fw-bold">
                                    {money(
                                        Number(
                                            summary?.average_order_value ?? 0
                                        )
                                    )}
                                </div>

                                <div className="small text-secondary mt-2">
                                    Average revenue per order
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Daily Revenue */}

                <div className="card border-0 shadow-sm rounded-4 mb-4">
                    <div className="card-body p-3 p-lg-4">

                        <div className="mb-4">
                            <h4 className="fw-bold mb-1">
                                Revenue Overview
                            </h4>

                            <p className="text-secondary small mb-0">
                                Daily revenue for the last 30 days.
                            </p>
                        </div>

                        {dailyRevenue.length > 0 ? (
                            <div className="d-flex flex-column gap-3">
                                {dailyRevenue.map((item) => {
                                    const revenue =
                                        Number(item.revenue) || 0;

                                    const percentage =
                                        (revenue /
                                            highestDailyRevenue) *
                                        100;

                                    return (
                                        <div key={item.revenue_date}>
                                            <div className="d-flex justify-content-between align-items-center mb-1">
                                                <span className="small text-secondary">
                                                    {new Date(
                                                        item.revenue_date
                                                    ).toLocaleDateString(
                                                        "en-IN",
                                                        {
                                                            day: "2-digit",
                                                            month: "short",
                                                        }
                                                    )}
                                                </span>

                                                <span className="small fw-semibold">
                                                    {money(revenue)}
                                                </span>
                                            </div>

                                            <div
                                                className="progress"
                                                style={{
                                                    height: "9px",
                                                }}
                                            >
                                                <div
                                                    className="progress-bar bg-primary"
                                                    role="progressbar"
                                                    style={{
                                                        width: `${percentage}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-5 text-secondary">
                                No revenue data available.
                            </div>
                        )}
                    </div>
                </div>

                {/* Revenue Orders */}

                <div className="card border-0 shadow-sm rounded-4">
                    <div className="card-body p-3 p-lg-4">

                        <div className="mb-4">
                            <h4 className="fw-bold mb-1">
                                Recent Revenue
                            </h4>

                            <p className="text-secondary small mb-0">
                                Latest orders contributing to revenue.
                            </p>
                        </div>

                        <div className="table-responsive">
                            <table className="table align-middle mb-0">
                                <thead>
                                    <tr className="text-secondary small">
                                        <th>Order</th>
                                        <th>Date</th>
                                        <th>Status</th>
                                        <th className="text-end">
                                            Revenue
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {recentOrders.map((order) => (
                                        <tr key={order.order_number}>
                                            <td className="fw-semibold">
                                                {order.order_number}
                                            </td>

                                            <td>
                                                <span className="small">
                                                    {new Date(
                                                        order.created_at
                                                    ).toLocaleDateString(
                                                        "en-IN"
                                                    )}
                                                </span>
                                            </td>

                                            <td>
                                                <span className="badge rounded-pill bg-success-subtle text-success-emphasis px-3 py-2">
                                                    {order.status}
                                                </span>
                                            </td>

                                            <td className="text-end fw-semibold">
                                                {money(
                                                    Number(order.total)
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                    </div>
                </div>

            </div>
        </main>
    );
}

