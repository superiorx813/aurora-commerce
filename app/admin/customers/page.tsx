import Link from "next/link";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { money } from "@/lib/utils";

export const dynamic = "force-dynamic";

type CustomerRow = {
    id: number;
    name: string;
    email: string;
    created_at: string;
    order_count: number;
    total_spent: number;
};

type SearchParams = {
    q?: string;
    activity?: string;
};

type AdminCustomersPageProps = {
    searchParams: Promise<SearchParams>;
};

export default async function AdminCustomersPage({
    searchParams,
}: AdminCustomersPageProps) {
    const user = await getSession();

    if (!user) {
        redirect("/account");
    }

    if (user.role !== "ADMIN") {
        redirect("/");
    }

    const params = await searchParams;

    const search = String(params.q ?? "").trim();
    const activity = String(params.activity ?? "all").toLowerCase();

    /*
     * ---------------------------------------------------------
     * CUSTOMER FILTERS
     * ---------------------------------------------------------
     */

    const whereParams: string[] = [];

    let customerSearchCondition = "";

    if (search) {
        customerSearchCondition = `
            AND (
                u.name LIKE ?
                OR u.email LIKE ?
            )
        `;

        const searchValue = `%${search}%`;

        whereParams.push(searchValue, searchValue);
    }

    /*
     * ---------------------------------------------------------
     * ACTIVITY FILTER
     * ---------------------------------------------------------
     */

    let activityCondition = "";

    if (activity === "active") {
        activityCondition = `
            AND EXISTS (
                SELECT 1
                FROM orders active_orders
                WHERE active_orders.user_id = u.id
                AND active_orders.status <> 'CANCELLED'
            )
        `;
    }

    if (activity === "inactive") {
        activityCondition = `
            AND NOT EXISTS (
                SELECT 1
                FROM orders inactive_orders
                WHERE inactive_orders.user_id = u.id
                AND inactive_orders.status <> 'CANCELLED'
            )
        `;
    }

    /*
     * ---------------------------------------------------------
     * DASHBOARD STATISTICS
     * ---------------------------------------------------------
     *
     * These are calculated independently from the 100-row
     * directory limit so the numbers remain accurate.
     */

    const [
        [customerStatsResult],
        [revenueStatsResult],
        [newCustomersResult],
        [customersResult],
    ] = await Promise.all([
        db.query(`
            SELECT
                COUNT(*) AS total_customers,

                COUNT(
                    CASE
                        WHEN EXISTS (
                            SELECT 1
                            FROM orders o2
                            WHERE o2.user_id = u.id
                            AND o2.status <> 'CANCELLED'
                        )
                        THEN 1
                    END
                ) AS active_customers,

                COUNT(
                    CASE
                        WHEN NOT EXISTS (
                            SELECT 1
                            FROM orders o3
                            WHERE o3.user_id = u.id
                            AND o3.status <> 'CANCELLED'
                        )
                        THEN 1
                    END
                ) AS inactive_customers

            FROM users u
            WHERE u.role <> 'ADMIN'
        `),

        db.query(`
            SELECT
                COALESCE(
                    SUM(
                        CASE
                            WHEN o.status <> 'CANCELLED'
                            THEN o.total
                            ELSE 0
                        END
                    ),
                    0
                ) AS total_revenue,

                COUNT(
                    CASE
                        WHEN o.status <> 'CANCELLED'
                        THEN o.id
                    END
                ) AS total_orders

            FROM users u

            LEFT JOIN orders o
                ON o.user_id = u.id

            WHERE u.role <> 'ADMIN'
        `),

        db.query(`
            SELECT
                COUNT(*) AS new_customers
            FROM users u
            WHERE u.role <> 'ADMIN'
            AND u.created_at >= DATE_FORMAT(
                CURRENT_DATE,
                '%Y-%m-01'
            )
        `),

        db.query(
            `
            SELECT
                u.id,
                u.name,
                u.email,
                u.created_at,

                COUNT(
                    CASE
                        WHEN o.status <> 'CANCELLED'
                        THEN o.id
                    END
                ) AS order_count,

                COALESCE(
                    SUM(
                        CASE
                            WHEN o.status <> 'CANCELLED'
                            THEN o.total
                            ELSE 0
                        END
                    ),
                    0
                ) AS total_spent

            FROM users u

            LEFT JOIN orders o
                ON o.user_id = u.id

            WHERE u.role <> 'ADMIN'

            ${customerSearchCondition}
            ${activityCondition}

            GROUP BY
                u.id,
                u.name,
                u.email,
                u.created_at

            ORDER BY
                u.created_at DESC

            LIMIT 100
            `,
            whereParams
        ),
    ]);

    const customerStats = customerStatsResult as {
        total_customers: number;
        active_customers: number;
        inactive_customers: number;
    }[];

    const revenueStats = revenueStatsResult as {
        total_revenue: number;
        total_orders: number;
    }[];

    const newCustomersStats = newCustomersResult as {
        new_customers: number;
    }[];

    const customers = customersResult as CustomerRow[];

    /*
     * ---------------------------------------------------------
     * NORMALIZED STATISTICS
     * ---------------------------------------------------------
     */

    const totalCustomers = Number(
        customerStats[0]?.total_customers ?? 0
    );

    const activeCustomers = Number(
        customerStats[0]?.active_customers ?? 0
    );

    const inactiveCustomers = Number(
        customerStats[0]?.inactive_customers ?? 0
    );

    const newCustomers = Number(
        newCustomersStats[0]?.new_customers ?? 0
    );

    const totalCustomerRevenue = Number(
        revenueStats[0]?.total_revenue ?? 0
    );

    const totalOrders = Number(
        revenueStats[0]?.total_orders ?? 0
    );

    const activeRate =
        totalCustomers > 0
            ? Math.round(
                  (activeCustomers / totalCustomers) * 100
              )
            : 0;

    const averageCustomerValue =
        totalCustomers > 0
            ? totalCustomerRevenue / totalCustomers
            : 0;

    /*
     * ---------------------------------------------------------
     * CUSTOMER SEGMENT
     * ---------------------------------------------------------
     */

    function getCustomerSegment(customer: CustomerRow) {
        const orders = Number(customer.order_count || 0);
        const spent = Number(customer.total_spent || 0);

        if (orders === 0) {
            return {
                label: "No Orders",
                className:
                    "bg-secondary-subtle text-secondary-emphasis",
            };
        }

        if (spent >= 10000) {
            return {
                label: "High Value",
                className:
                    "bg-success-subtle text-success-emphasis",
            };
        }

        if (orders >= 5) {
            return {
                label: "Regular",
                className:
                    "bg-primary-subtle text-primary-emphasis",
            };
        }

        return {
            label: "New",
            className:
                "bg-warning-subtle text-warning-emphasis",
        };
    }

    /*
     * ---------------------------------------------------------
     * FILTER URL HELPERS
     * ---------------------------------------------------------
     */

    const clearFiltersHref = "/admin/customers";

    const hasFilters =
        search.length > 0 || activity !== "all";

    /*
     * ---------------------------------------------------------
     * PAGE
     * ---------------------------------------------------------
     */

    return (
        <main className="container-fluid bg-body-tertiary min-vh-100 py-4">
            <div className="container-fluid px-3 px-lg-4">

                {/* =====================================================
                    HEADER
                ====================================================== */}

                <div className="d-flex flex-column flex-xl-row justify-content-between align-items-xl-end gap-3 mb-4">

                    <div>
                        <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                            <span className="badge rounded-pill text-bg-dark px-3 py-2">
                                AURORA CONTROL
                            </span>

                            <span className="badge rounded-pill bg-warning-subtle text-warning-emphasis px-3 py-2">
                                CRM
                            </span>

                            <span className="badge rounded-pill bg-primary-subtle text-primary-emphasis px-3 py-2">
                                CUSTOMER MANAGEMENT
                            </span>
                        </div>

                        <h1 className="display-6 fw-bold mb-1">
                            Customers
                        </h1>

                        <p className="text-secondary mb-0">
                            Understand customer activity, spending,
                            engagement and growth.
                        </p>
                    </div>

                    <div className="d-flex flex-wrap gap-2">

                        <Link
                            href="/admin"
                            className="btn btn-light border rounded-3 px-4"
                        >
                            ← Dashboard
                        </Link>

                    </div>
                </div>

                {/* =====================================================
                    KPI CARDS
                ====================================================== */}

                <div className="row g-3 mb-4">

                    {/* Total Customers */}

                    <div className="col-12 col-sm-6 col-xl-3">
                        <div className="card border-0 shadow-sm rounded-4 h-100">
                            <div className="card-body p-4">

                                <div className="d-flex justify-content-between align-items-start mb-3">

                                    <div>
                                        <div className="small text-secondary text-uppercase fw-semibold">
                                            Total Customers
                                        </div>

                                        <div className="fs-2 fw-bold mt-1">
                                            {totalCustomers.toLocaleString(
                                                "en-IN"
                                            )}
                                        </div>
                                    </div>

                                    <div
                                        className="rounded-3 bg-primary-subtle text-primary d-flex align-items-center justify-content-center"
                                        style={{
                                            width: 46,
                                            height: 46,
                                        }}
                                    >
                                        👥
                                    </div>

                                </div>

                                <div className="small text-secondary">
                                    Registered non-admin users
                                </div>

                            </div>
                        </div>
                    </div>

                    {/* Active Customers */}

                    <div className="col-12 col-sm-6 col-xl-3">
                        <div className="card border-0 shadow-sm rounded-4 h-100">
                            <div className="card-body p-4">

                                <div className="d-flex justify-content-between align-items-start mb-3">

                                    <div>
                                        <div className="small text-secondary text-uppercase fw-semibold">
                                            Active Customers
                                        </div>

                                        <div className="fs-2 fw-bold text-success mt-1">
                                            {activeCustomers.toLocaleString(
                                                "en-IN"
                                            )}
                                        </div>
                                    </div>

                                    <div
                                        className="rounded-3 bg-success-subtle text-success d-flex align-items-center justify-content-center"
                                        style={{
                                            width: 46,
                                            height: 46,
                                        }}
                                    >
                                        ✓
                                    </div>

                                </div>

                                <div className="d-flex align-items-center gap-2">

                                    <div
                                        className="progress flex-grow-1"
                                        style={{
                                            height: 7,
                                        }}
                                    >
                                        <div
                                            className="progress-bar bg-success"
                                            style={{
                                                width: `${activeRate}%`,
                                            }}
                                        />
                                    </div>

                                    <span className="small fw-semibold">
                                        {activeRate}%
                                    </span>

                                </div>

                            </div>
                        </div>
                    </div>

                    {/* New Customers */}

                    <div className="col-12 col-sm-6 col-xl-3">
                        <div className="card border-0 shadow-sm rounded-4 h-100">
                            <div className="card-body p-4">

                                <div className="d-flex justify-content-between align-items-start mb-3">

                                    <div>
                                        <div className="small text-secondary text-uppercase fw-semibold">
                                            New This Month
                                        </div>

                                        <div className="fs-2 fw-bold text-warning mt-1">
                                            {newCustomers.toLocaleString(
                                                "en-IN"
                                            )}
                                        </div>
                                    </div>

                                    <div
                                        className="rounded-3 bg-warning-subtle text-warning-emphasis d-flex align-items-center justify-content-center"
                                        style={{
                                            width: 46,
                                            height: 46,
                                        }}
                                    >
                                        ✨
                                    </div>

                                </div>

                                <div className="small text-secondary">
                                    Customers registered this month
                                </div>

                            </div>
                        </div>
                    </div>

                    {/* Revenue */}

                    <div className="col-12 col-sm-6 col-xl-3">
                        <div className="card border-0 shadow-sm rounded-4 h-100">
                            <div className="card-body p-4">

                                <div className="d-flex justify-content-between align-items-start mb-3">

                                    <div>
                                        <div className="small text-secondary text-uppercase fw-semibold">
                                            Customer Revenue
                                        </div>

                                        <div className="fs-2 fw-bold mt-1">
                                            {money(
                                                totalCustomerRevenue
                                            )}
                                        </div>
                                    </div>

                                    <div
                                        className="rounded-3 bg-info-subtle text-info-emphasis d-flex align-items-center justify-content-center"
                                        style={{
                                            width: 46,
                                            height: 46,
                                        }}
                                    >
                                        ₹
                                    </div>

                                </div>

                                <div className="small text-secondary">
                                    {totalOrders.toLocaleString(
                                        "en-IN"
                                    )}{" "}
                                    valid orders
                                </div>

                            </div>
                        </div>
                    </div>

                </div>

                {/* =====================================================
                    CRM INSIGHTS
                ====================================================== */}

                <div className="row g-3 mb-4">

                    <div className="col-12 col-lg-8">

                        <div className="card border-0 shadow-sm rounded-4 h-100">
                            <div className="card-body p-4">

                                <div className="d-flex justify-content-between align-items-start mb-4">

                                    <div>
                                        <h5 className="fw-bold mb-1">
                                            Customer Intelligence
                                        </h5>

                                        <p className="small text-secondary mb-0">
                                            A quick overview of your
                                            customer relationship health.
                                        </p>
                                    </div>

                                    <span className="badge rounded-pill bg-primary-subtle text-primary-emphasis px-3 py-2">
                                        CRM Overview
                                    </span>

                                </div>

                                <div className="row g-3">

                                    <div className="col-12 col-md-4">
                                        <div className="bg-body-tertiary rounded-4 p-3 h-100">

                                            <div className="small text-secondary mb-2">
                                                Active Rate
                                            </div>

                                            <div className="fs-3 fw-bold">
                                                {activeRate}%
                                            </div>

                                            <div className="small text-secondary mt-1">
                                                Customers with valid
                                                orders
                                            </div>

                                        </div>
                                    </div>

                                    <div className="col-12 col-md-4">
                                        <div className="bg-body-tertiary rounded-4 p-3 h-100">

                                            <div className="small text-secondary mb-2">
                                                Average Customer Value
                                            </div>

                                            <div className="fs-3 fw-bold">
                                                {money(
                                                    averageCustomerValue
                                                )}
                                            </div>

                                            <div className="small text-secondary mt-1">
                                                Revenue per registered
                                                customer
                                            </div>

                                        </div>
                                    </div>

                                    <div className="col-12 col-md-4">
                                        <div className="bg-body-tertiary rounded-4 p-3 h-100">

                                            <div className="small text-secondary mb-2">
                                                Customers Without Orders
                                            </div>

                                            <div className="fs-3 fw-bold text-secondary">
                                                {inactiveCustomers.toLocaleString(
                                                    "en-IN"
                                                )}
                                            </div>

                                            <div className="small text-secondary mt-1">
                                                Potential customers to
                                                re-engage
                                            </div>

                                        </div>
                                    </div>

                                </div>

                            </div>
                        </div>

                    </div>

                    <div className="col-12 col-lg-4">

                        <div className="card border-0 shadow-sm rounded-4 h-100">
                            <div className="card-body p-4">

                                <div className="small text-secondary text-uppercase fw-semibold mb-2">
                                    Customer Segments
                                </div>

                                <h5 className="fw-bold mb-4">
                                    Quick Overview
                                </h5>

                                <div className="d-flex flex-column gap-3">

                                    <div className="d-flex justify-content-between align-items-center">
                                        <span className="d-flex align-items-center gap-2">
                                            <span className="badge rounded-pill bg-success-subtle text-success-emphasis">
                                                High Value
                                            </span>
                                        </span>

                                        <span className="small text-secondary">
                                            ₹10K+ spending
                                        </span>
                                    </div>

                                    <div className="d-flex justify-content-between align-items-center">
                                        <span className="badge rounded-pill bg-primary-subtle text-primary-emphasis">
                                            Regular
                                        </span>

                                        <span className="small text-secondary">
                                            5+ orders
                                        </span>
                                    </div>

                                    <div className="d-flex justify-content-between align-items-center">
                                        <span className="badge rounded-pill bg-warning-subtle text-warning-emphasis">
                                            New
                                        </span>

                                        <span className="small text-secondary">
                                            Early activity
                                        </span>
                                    </div>

                                    <div className="d-flex justify-content-between align-items-center">
                                        <span className="badge rounded-pill bg-secondary-subtle text-secondary-emphasis">
                                            No Orders
                                        </span>

                                        <span className="small text-secondary">
                                            Re-engage
                                        </span>
                                    </div>

                                </div>

                            </div>
                        </div>

                    </div>

                </div>

                {/* =====================================================
                    CUSTOMER DIRECTORY
                ====================================================== */}

                <div className="card border-0 shadow-sm rounded-4">

                    <div className="card-body p-3 p-lg-4">

                        {/* Directory Header */}

                        <div className="d-flex flex-column flex-xl-row justify-content-between gap-3 mb-4">

                            <div>
                                <div className="d-flex align-items-center gap-2 mb-1">

                                    <h4 className="fw-bold mb-0">
                                        Customer Directory
                                    </h4>

                                    <span className="badge rounded-pill bg-light text-dark border">
                                        {customers.length}
                                    </span>

                                </div>

                                <p className="text-secondary small mb-0">
                                    Search and monitor customer
                                    relationships and purchasing
                                    activity.
                                </p>
                            </div>

                            <div className="small text-secondary">
                                Showing up to 100 customers
                            </div>

                        </div>

                        {/* =================================================
                            SEARCH + FILTERS
                        ================================================== */}

                        <form
                            method="GET"
                            className="row g-2 mb-4"
                        >

                            <div className="col-12 col-lg-6">

                                <div className="input-group">

                                    <span className="input-group-text bg-white">
                                        🔎
                                    </span>

                                    <input
                                        type="text"
                                        name="q"
                                        defaultValue={search}
                                        className="form-control"
                                        placeholder="Search by customer name or email..."
                                    />

                                </div>

                            </div>

                            <div className="col-12 col-sm-6 col-lg-3">

                                <select
                                    name="activity"
                                    defaultValue={activity}
                                    className="form-select"
                                >
                                    <option value="all">
                                        All Customers
                                    </option>

                                    <option value="active">
                                        Active Customers
                                    </option>

                                    <option value="inactive">
                                        No Orders
                                    </option>
                                </select>

                            </div>

                            <div className="col-12 col-sm-6 col-lg-3">

                                <div className="d-flex gap-2">

                                    <button
                                        type="submit"
                                        className="btn btn-dark flex-grow-1"
                                    >
                                        Apply Filters
                                    </button>

                                    {hasFilters && (
                                        <Link
                                            href={clearFiltersHref}
                                            className="btn btn-light border"
                                        >
                                            Clear
                                        </Link>
                                    )}

                                </div>

                            </div>

                        </form>

                        {/* =================================================
                            RESULT INFORMATION
                        ================================================== */}

                        {hasFilters && (
                            <div className="alert alert-primary border-0 rounded-3 d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mb-4">

                                <div className="small">
                                    Showing filtered customers
                                    {search && (
                                        <>
                                            {" "}
                                            matching{" "}
                                            <strong>
                                                "{search}"
                                            </strong>
                                        </>
                                    )}
                                    .
                                </div>

                                <Link
                                    href={clearFiltersHref}
                                    className="small fw-semibold text-decoration-none"
                                >
                                    Reset customer filters →
                                </Link>

                            </div>
                        )}

                        {/* =================================================
                            TABLE
                        ================================================== */}

                        <div className="table-responsive">

                            <table className="table table-hover align-middle mb-0">

                                <thead>
                                    <tr className="text-secondary small">

                                        <th className="border-0">
                                            Customer
                                        </th>

                                        <th className="border-0">
                                            Joined
                                        </th>

                                        <th className="border-0 text-center">
                                            Orders
                                        </th>

                                        <th className="border-0">
                                            Total Spent
                                        </th>

                                        <th className="border-0">
                                            Segment
                                        </th>

                                        <th className="border-0">
                                            Activity
                                        </th>

                                    </tr>
                                </thead>

                                <tbody>

                                    {customers.length > 0 ? (
                                        customers.map(
                                            (customer) => {
                                                const segment =
                                                    getCustomerSegment(
                                                        customer
                                                    );

                                                const customerName =
                                                    customer.name?.trim() ||
                                                    "Unknown Customer";

                                                const customerEmail =
                                                    customer.email?.trim() ||
                                                    "No email available";

                                                const initials =
                                                    customerName
                                                        .split(" ")
                                                        .filter(Boolean)
                                                        .slice(0, 2)
                                                        .map(
                                                            (part) =>
                                                                part.charAt(
                                                                    0
                                                                )
                                                        )
                                                        .join("")
                                                        .toUpperCase() ||
                                                    "U";

                                                const orderCount =
                                                    Number(
                                                        customer.order_count ||
                                                            0
                                                    );

                                                const totalSpent =
                                                    Number(
                                                        customer.total_spent ||
                                                            0
                                                    );

                                                return (
                                                    <tr
                                                        key={
                                                            customer.id
                                                        }
                                                    >

                                                        {/* Customer */}

                                                        <td className="py-3">

                                                            <div className="d-flex align-items-center gap-3">

                                                                <div
                                                                    className="rounded-circle bg-primary-subtle text-primary d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
                                                                    style={{
                                                                        width: 46,
                                                                        height: 46,
                                                                    }}
                                                                >
                                                                    {
                                                                        initials
                                                                    }
                                                                </div>

                                                                <div className="min-w-0">

                                                                    <div className="fw-semibold text-truncate">
                                                                        {
                                                                            customerName
                                                                        }
                                                                    </div>

                                                                    <div className="small text-secondary text-truncate">
                                                                        {
                                                                            customerEmail
                                                                        }
                                                                    </div>

                                                                </div>

                                                            </div>

                                                        </td>

                                                        {/* Joined */}

                                                        <td>

                                                            <div className="small fw-semibold">
                                                                {new Date(
                                                                    customer.created_at
                                                                ).toLocaleDateString(
                                                                    "en-IN"
                                                                )}
                                                            </div>

                                                            <div className="small text-secondary">
                                                                Joined
                                                            </div>

                                                        </td>

                                                        {/* Orders */}

                                                        <td className="text-center">

                                                            <span className="fw-bold">
                                                                {orderCount.toLocaleString(
                                                                    "en-IN"
                                                                )}
                                                            </span>

                                                        </td>

                                                        {/* Spending */}

                                                        <td>

                                                            <div className="fw-bold">
                                                                {money(
                                                                    totalSpent
                                                                )}
                                                            </div>

                                                            {orderCount >
                                                                0 && (
                                                                <div className="small text-secondary">
                                                                    Avg.{" "}
                                                                    {money(
                                                                        totalSpent /
                                                                            orderCount
                                                                    )}
                                                                    / order
                                                                </div>
                                                            )}

                                                        </td>

                                                        {/* Segment */}

                                                        <td>

                                                            <span
                                                                className={`badge rounded-pill px-3 py-2 ${segment.className}`}
                                                            >
                                                                {
                                                                    segment.label
                                                                }
                                                            </span>

                                                        </td>

                                                        {/* Activity */}

                                                        <td>

                                                            {orderCount >
                                                            0 ? (
                                                                <div className="d-flex align-items-center gap-2">

                                                                    <span
                                                                        className="rounded-circle bg-success"
                                                                        style={{
                                                                            width: 8,
                                                                            height: 8,
                                                                        }}
                                                                    />

                                                                    <span className="small fw-semibold text-success">
                                                                        Active
                                                                    </span>

                                                                </div>
                                                            ) : (
                                                                <div className="d-flex align-items-center gap-2">

                                                                    <span
                                                                        className="rounded-circle bg-secondary"
                                                                        style={{
                                                                            width: 8,
                                                                            height: 8,
                                                                        }}
                                                                    />

                                                                    <span className="small text-secondary">
                                                                        No Orders
                                                                    </span>

                                                                </div>
                                                            )}

                                                        </td>

                                                    </tr>
                                                );
                                            }
                                        )
                                    ) : (
                                        <tr>

                                            <td
                                                colSpan={6}
                                                className="text-center py-5"
                                            >

                                                <div className="mb-3 fs-1">
                                                    🔎
                                                </div>

                                                <h5 className="fw-bold">
                                                    No customers found
                                                </h5>

                                                <p className="text-secondary small mb-3">
                                                    Try changing your
                                                    search or customer
                                                    activity filter.
                                                </p>

                                                <Link
                                                    href="/admin/customers"
                                                    className="btn btn-dark btn-sm px-4"
                                                >
                                                    Clear Filters
                                                </Link>

                                            </td>

                                        </tr>
                                    )}

                                </tbody>

                            </table>

                        </div>

                    </div>
                </div>

                {/* =====================================================
                    FOOTER INFORMATION
                ====================================================== */}

                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 mt-3 px-1">

                    <div className="small text-secondary">
                        Aurora Customer Management
                    </div>

                    <div className="small text-secondary">
                        {totalCustomers.toLocaleString(
                            "en-IN"
                        )}{" "}
                        registered customers
                    </div>

                </div>

            </div>
        </main>
    );
}