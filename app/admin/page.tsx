
import Link from "next/link";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { money } from "@/lib/utils";

export const dynamic = "force-dynamic";

type StatRow = {
    orders_count: number;
    revenue: number;
};

type CustomerRow = {
    customers_count: number;
};

type ProductRow = {
    id: number;
    name: string;
    price: number;
    stock: number;
    image_url?: string | null;
};

type SalesRow = {
    sales_date: string;
    orders_count: number;
    revenue: number;
};

type TopProductRow = {
    id: number;
    name: string;
    total_sold: number;
    revenue: number;
};

type StatusRow = {
    status: string;
    count: number;
};

export default async function AdminPage() {
    const user = await getSession();

    if (!user) {
        redirect("/account");
    }

    if (user.role !== "ADMIN") {
        redirect("/");
    }

    /*
     * ---------------------------------------------------------
     * DASHBOARD DATA
     * ---------------------------------------------------------
     */

    const [
        [statsRows],
        [customerRows],
        [productRows],
        [salesRows],
        [topProductRows],
        [orderStatusRows],
    ] = await Promise.all([
        /*
         * Orders + Revenue
         */
        db.query(`
            SELECT
                COUNT(*) AS orders_count,
                COALESCE(SUM(total), 0) AS revenue
            FROM orders
            WHERE status <> 'CANCELLED'
        `),

        /*
         * Customers
         */
        db.query(`
            SELECT COUNT(*) AS customers_count
            FROM users
            WHERE role = 'CUSTOMER'
        `),

        /*
         * Products
         */
        db.query(`
            SELECT
                id,
                name,
                price,
                stock,
                image_url
            FROM products
            ORDER BY id DESC
            LIMIT 6
        `),

        /*
         * Sales Overview - Last 30 Days
         */
        db.query(`
            SELECT
                DATE(created_at) AS sales_date,
                COUNT(*) AS orders_count,
                COALESCE(SUM(total), 0) AS revenue
            FROM orders
            WHERE
                status <> 'CANCELLED'
                AND created_at >= DATE_SUB(CURDATE(), INTERVAL 29 DAY)
            GROUP BY DATE(created_at)
            ORDER BY sales_date ASC
        `),

        
/*
 * Top Products
 *
 * Uses the quantity from order_items.
 * Cancelled orders are excluded.
 */
db.query(`
    SELECT
        p.id,
        p.name,
        p.image_url,
        COALESCE(SUM(
            CASE
                WHEN o.status <> 'CANCELLED'
                THEN oi.quantity
                ELSE 0
            END
        ), 0) AS sold
    FROM products p
    LEFT JOIN order_items oi
        ON oi.product_id = p.id
    LEFT JOIN orders o
        ON o.id = oi.order_id
    GROUP BY
        p.id,
        p.name,
        p.image_url
    ORDER BY sold DESC
    LIMIT 5
`),



        /*
         * Order Status
         */
        db.query(`
            SELECT
                status,
                COUNT(*) AS count
            FROM orders
            GROUP BY status
        `),
    ]);

    const stats = (statsRows as StatRow[])[0] ?? {
        orders_count: 0,
        revenue: 0,
    };

    const customers = (customerRows as CustomerRow[])[0] ?? {
        customers_count: 0,
    };

    const products = productRows as ProductRow[];
    const sales = salesRows as SalesRow[];
    const topProducts = topProductRows as TopProductRow[];
    const orderStatuses = orderStatusRows as StatusRow[];

    /*
     * ---------------------------------------------------------
     * SALES CHART DATA
     * ---------------------------------------------------------
     */

    const salesMap = new Map(
        sales.map((item) => [
            String(item.sales_date).slice(0, 10),
            Number(item.revenue),
        ])
    );

    const chartData = Array.from({ length: 30 }, (_, index) => {
        const date = new Date();

        date.setDate(date.getDate() - (29 - index));

        const key = date.toISOString().slice(0, 10);

        return {
            date: key,
            label: date.toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
            }),
            revenue: salesMap.get(key) ?? 0,
        };
    });

    const maxRevenue = Math.max(
        ...chartData.map((item) => item.revenue),
        1
    );

    /*
     * ---------------------------------------------------------
     * ORDER STATUS HELPERS
     * ---------------------------------------------------------
     */

    const getStatusCount = (status: string) => {
        return (
            orderStatuses.find(
                (item) =>
                    String(item.status).toUpperCase() === status
            )?.count ?? 0
        );
    };

    const pendingCount = getStatusCount("PENDING");
    const processingCount = getStatusCount("PROCESSING");
    const shippedCount = getStatusCount("SHIPPED");
    const deliveredCount = getStatusCount("DELIVERED");

    /*
     * ---------------------------------------------------------
     * UI
     * ---------------------------------------------------------
     */

    return (
        <>
            <style>{`
                .aurora-dashboard {
                    --aurora-bg: #f5f7fb;
                    --aurora-card: #ffffff;
                    --aurora-dark: #172033;
                    --aurora-muted: #7c879b;
                    --aurora-border: #e8ecf3;
                    --aurora-purple: #7057d9;
                    --aurora-purple-dark: #5842bd;
                    --aurora-blue: #3b82f6;
                    --aurora-green: #16a34a;
                    --aurora-orange: #f59e0b;
                    --aurora-red: #ef4444;

                    min-height: 100vh;
                    background:
                        radial-gradient(
                            circle at 0% 0%,
                            rgba(112, 87, 217, 0.08),
                            transparent 28%
                        ),
                        radial-gradient(
                            circle at 100% 10%,
                            rgba(59, 130, 246, 0.06),
                            transparent 25%
                        ),
                        var(--aurora-bg);
                    padding: 30px;
                }

                .aurora-container {
                    max-width: 1500px;
                    margin: 0 auto;
                }

                .aurora-header {
                    margin-bottom: 28px;
                }

                .aurora-brand {
                    display: inline-flex;
                    align-items: center;
                    gap: 9px;
                    font-size: 12px;
                    font-weight: 800;
                    letter-spacing: 2.5px;
                    color: var(--aurora-purple);
                    text-transform: uppercase;
                    margin-bottom: 9px;
                }

                .aurora-brand-dot {
                    width: 9px;
                    height: 9px;
                    border-radius: 50%;
                    background: var(--aurora-purple);
                    box-shadow: 0 0 0 5px rgba(112, 87, 217, 0.10);
                }

                .aurora-title {
                    font-size: clamp(28px, 3vw, 40px);
                    line-height: 1.1;
                    font-weight: 800;
                    color: var(--aurora-dark);
                    margin: 0;
                    letter-spacing: -1.2px;
                }

                .aurora-subtitle {
                    color: var(--aurora-muted);
                    margin: 9px 0 0;
                    font-size: 15px;
                }

                .aurora-stat-card {
                    position: relative;
                    overflow: hidden;
                    background: var(--aurora-card);
                    border: 1px solid var(--aurora-border);
                    border-radius: 20px;
                    padding: 23px;
                    height: 100%;
                    box-shadow: 0 8px 30px rgba(30, 41, 59, 0.045);
                    transition:
                        transform 0.25s ease,
                        box-shadow 0.25s ease,
                        border-color 0.25s ease;
                }

                .aurora-stat-card:hover {
                    transform: translateY(-5px);
                    border-color: rgba(112, 87, 217, 0.20);
                    box-shadow: 0 16px 38px rgba(30, 41, 59, 0.09);
                }

                .aurora-stat-card::after {
                    content: "";
                    position: absolute;
                    width: 100px;
                    height: 100px;
                    border-radius: 50%;
                    right: -45px;
                    top: -45px;
                    background: rgba(112, 87, 217, 0.055);
                }

                .aurora-stat-top {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 12px;
                    margin-bottom: 18px;
                }

                .aurora-stat-label {
                    color: var(--aurora-muted);
                    font-size: 13px;
                    font-weight: 700;
                }

                .aurora-stat-icon {
                    width: 42px;
                    height: 42px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 13px;
                    font-size: 18px;
                    background: rgba(112, 87, 217, 0.10);
                }

                .aurora-stat-value {
                    color: var(--aurora-dark);
                    font-size: 28px;
                    font-weight: 800;
                    line-height: 1;
                    letter-spacing: -0.7px;
                }

                .aurora-section-card {
                    background: var(--aurora-card);
                    border: 1px solid var(--aurora-border);
                    border-radius: 22px;
                    box-shadow: 0 8px 30px rgba(30, 41, 59, 0.045);
                    overflow: hidden;
                }

                .aurora-section-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 15px;
                    padding: 22px 24px;
                    border-bottom: 1px solid var(--aurora-border);
                }

                .aurora-section-title {
                    color: var(--aurora-dark);
                    font-size: 16px;
                    font-weight: 800;
                    margin: 0;
                }

                .aurora-section-description {
                    color: var(--aurora-muted);
                    font-size: 12px;
                    margin: 4px 0 0;
                }

                .aurora-range {
                    border: 1px solid var(--aurora-border);
                    background: #f8f9fc;
                    color: #5d687d;
                    border-radius: 10px;
                    padding: 8px 12px;
                    font-size: 12px;
                    font-weight: 700;
                }

                .aurora-chart {
                    padding: 25px 24px 20px;
                }

                .aurora-chart-area {
                    height: 285px;
                    position: relative;
                    display: flex;
                    align-items: end;
                    gap: 5px;
                    border-bottom: 1px solid var(--aurora-border);
                    background:
                        repeating-linear-gradient(
                            to bottom,
                            transparent 0,
                            transparent 55px,
                            rgba(226, 232, 240, 0.55) 56px
                        );
                    padding: 15px 5px 0;
                }

                .aurora-chart-bar-wrap {
                    height: 100%;
                    flex: 1;
                    min-width: 5px;
                    display: flex;
                    align-items: end;
                    justify-content: center;
                }

                .aurora-chart-bar {
                    width: 65%;
                    min-height: 3px;
                    border-radius: 7px 7px 2px 2px;
                    background: linear-gradient(
                        180deg,
                        #8069e5 0%,
                        #6650ca 100%
                    );
                    box-shadow: 0 5px 12px rgba(112, 87, 217, 0.16);
                    transition:
                        height 0.35s ease,
                        opacity 0.2s ease;
                }

                .aurora-chart-bar:hover {
                    opacity: 0.72;
                }

                .aurora-chart-labels {
                    display: flex;
                    justify-content: space-between;
                    color: #9aa4b5;
                    font-size: 10px;
                    padding: 9px 5px 0;
                }

                .aurora-product-grid {
                    padding: 20px;
                }

                .aurora-product-box {
                    display: flex;
                    align-items: center;
                    gap: 13px;
                    text-decoration: none;
                    color: inherit;
                    min-height: 78px;
                    padding: 12px;
                    background: #f8f9fc;
                    border: 1px solid #edf0f5;
                    border-radius: 15px;
                    transition:
                        transform 0.22s ease,
                        background 0.22s ease,
                        border-color 0.22s ease,
                        box-shadow 0.22s ease;
                }

                .aurora-product-box:hover {
                    color: inherit;
                    background: #ffffff;
                    border-color: rgba(112, 87, 217, 0.24);
                    transform: translateY(-3px);
                    box-shadow: 0 10px 25px rgba(30, 41, 59, 0.07);
                }

                .aurora-product-image {
                    width: 52px;
                    height: 52px;
                    flex: 0 0 52px;
                    border-radius: 13px;
                    background: #ffffff;
                    border: 1px solid #e9edf4;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                }

                .aurora-product-image img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .aurora-product-placeholder {
                    font-size: 21px;
                }

                .aurora-product-name {
                    font-size: 13px;
                    font-weight: 800;
                    color: var(--aurora-dark);
                    margin-bottom: 4px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    max-width: 170px;
                }

                .aurora-product-meta {
                    font-size: 11px;
                    color: var(--aurora-muted);
                }

                .aurora-product-arrow {
                    margin-left: auto;
                    color: var(--aurora-purple);
                    font-size: 17px;
                    font-weight: 700;
                }

                .aurora-top-product {
                    display: flex;
                    align-items: center;
                    gap: 13px;
                    padding: 15px 20px;
                    border-bottom: 1px solid #f0f2f6;
                    transition: background 0.2s ease;
                }

                .aurora-top-product:last-child {
                    border-bottom: 0;
                }

                .aurora-top-product:hover {
                    background: #fafbfe;
                }

                .aurora-rank {
                    width: 31px;
                    height: 31px;
                    border-radius: 10px;
                    background: rgba(112, 87, 217, 0.10);
                    color: var(--aurora-purple);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 12px;
                    font-weight: 800;
                }

                .aurora-top-name {
                    flex: 1;
                    min-width: 0;
                    font-size: 13px;
                    font-weight: 750;
                    color: var(--aurora-dark);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .aurora-top-sales {
                    text-align: right;
                    font-size: 12px;
                    color: var(--aurora-muted);
                    white-space: nowrap;
                }

                .aurora-top-sales strong {
                    display: block;
                    color: var(--aurora-dark);
                    font-size: 13px;
                }

                .aurora-status-list {
                    padding: 10px 20px 16px;
                }

                .aurora-status-row {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 13px 0;
                    border-bottom: 1px solid #f0f2f6;
                }

                .aurora-status-row:last-child {
                    border-bottom: 0;
                }

                .aurora-status-dot {
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    flex: 0 0 10px;
                }

                .aurora-status-name {
                    flex: 1;
                    color: #566176;
                    font-size: 13px;
                    font-weight: 650;
                    text-transform: capitalize;
                }

                .aurora-status-count {
                    min-width: 42px;
                    padding: 5px 9px;
                    border-radius: 9px;
                    background: #f4f6fa;
                    color: var(--aurora-dark);
                    text-align: center;
                    font-size: 12px;
                    font-weight: 800;
                }

                .status-pending {
                    background: #f59e0b;
                }

                .status-processing {
                    background: #3b82f6;
                }

                .status-shipped {
                    background: #8b5cf6;
                }

                .status-delivered {
                    background: #16a34a;
                }

                .aurora-action-box {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    min-height: 72px;
                    padding: 14px 16px;
                    border-radius: 15px;
                    border: 1px solid var(--aurora-border);
                    background: #ffffff;
                    color: var(--aurora-dark);
                    text-decoration: none;
                    transition:
                        transform 0.22s ease,
                        box-shadow 0.22s ease,
                        border-color 0.22s ease;
                }

                .aurora-action-box:hover {
                    color: var(--aurora-dark);
                    transform: translateY(-3px);
                    border-color: rgba(112, 87, 217, 0.25);
                    box-shadow: 0 10px 25px rgba(30, 41, 59, 0.07);
                }

                .aurora-action-icon {
                    width: 42px;
                    height: 42px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(112, 87, 217, 0.10);
                    font-size: 18px;
                }

                .aurora-action-title {
                    font-size: 13px;
                    font-weight: 800;
                }

                .aurora-action-subtitle {
                    color: var(--aurora-muted);
                    font-size: 10px;
                    margin-top: 2px;
                }

                @media (max-width: 991.98px) {
                    .aurora-dashboard {
                        padding: 22px;
                    }

                    .aurora-chart-area {
                        height: 240px;
                    }
                }

                @media (max-width: 575.98px) {
                    .aurora-dashboard {
                        padding: 15px;
                    }

                    .aurora-title {
                        font-size: 29px;
                    }

                    .aurora-section-header {
                        padding: 18px;
                    }

                    .aurora-chart {
                        padding: 20px 15px 17px;
                    }

                    .aurora-chart-area {
                        height: 210px;
                    }

                    .aurora-range {
                        display: none;
                    }

                    .aurora-product-grid {
                        padding: 15px;
                    }
                }
            `}</style>

            <main className="aurora-dashboard">
                <div className="aurora-container">

                    {/* =====================================================
                        HEADER
                    ====================================================== */}

                    <header className="aurora-header">
                        <div className="aurora-brand">
                            <span className="aurora-brand-dot" />
                            AURORA CONTROL
                        </div>

                        <h1 className="aurora-title">
                            Admin Dashboard
                        </h1>

                        <p className="aurora-subtitle">
                            Manage your storefront from one clean workspace.
                        </p>
                    </header>


                    {/* =====================================================
                        TOP STAT CARDS
                    ====================================================== */}

                    
<div className="row g-3 mb-4">

    {/* Orders */}
    <div className="col-12 col-sm-6 col-xl-3">
        <Link
            href="/admin/orders"
            className="text-decoration-none d-block h-100"
        >
            <div className="aurora-stat-card h-100">
                <div className="aurora-stat-top">
                    <span className="aurora-stat-label">
                        Orders
                    </span>

                    <div className="aurora-stat-icon">
                        🛍️
                    </div>
                </div>

                <div className="aurora-stat-value">
                    {Number(
                        stats.orders_count
                    ).toLocaleString("en-IN")}
                </div>
            </div>
        </Link>
    </div>


    {/* Revenue */}
    <div className="col-12 col-sm-6 col-xl-3">
        <Link
            href="/admin/revenue"
            className="text-decoration-none d-block h-100"
        >
            <div className="aurora-stat-card h-100">
                <div className="aurora-stat-top">
                    <span className="aurora-stat-label">
                        Revenue
                    </span>

                    <div className="aurora-stat-icon">
                        ₹
                    </div>
                </div>

                <div className="aurora-stat-value">
                    {money(Number(stats.revenue))}
                </div>
            </div>
        </Link>
    </div>


    {/* Customers */}
    <div className="col-12 col-sm-6 col-xl-3">
        <Link
            href="/admin/customers"
            className="text-decoration-none d-block h-100"
        >
            <div className="aurora-stat-card h-100">
                <div className="aurora-stat-top">
                    <span className="aurora-stat-label">
                        Customers
                    </span>

                    <div className="aurora-stat-icon">
                        👥
                    </div>
                </div>

                <div className="aurora-stat-value">
                    {Number(
                        customers.customers_count
                    ).toLocaleString("en-IN")}
                </div>
            </div>
        </Link>
    </div>





                        {/* Products */}
                        <div className="col-12 col-sm-6 col-xl-3">
                            <Link
                                href="/admin/products"
                                className="aurora-stat-card d-block text-decoration-none"
                            >
                                <div className="aurora-stat-top">
                                    <span className="aurora-stat-label">
                                        Products
                                    </span>

                                    <div className="aurora-stat-icon">
                                        📦
                                    </div>
                                </div>

                                <div className="aurora-stat-value">
                                    {products.length > 0
                                        ? "View"
                                        : "Products"}
                                </div>
                            </Link>
                        </div>
                    </div>


                    {/* =====================================================
                        SALES OVERVIEW
                    ====================================================== */}

                    <section className="aurora-section-card mb-4">

                        <div className="aurora-section-header">
                            <div>
                                <h2 className="aurora-section-title">
                                    Sales Overview
                                </h2>

                                <p className="aurora-section-description">
                                    Store revenue performance for the last
                                    30 days
                                </p>
                            </div>

                            <div className="aurora-range">
                                Last 30 Days
                            </div>
                        </div>

                        <div className="aurora-chart">

                            <div className="aurora-chart-area">
                                {chartData.map((item) => {
                                    const height =
                                        item.revenue === 0
                                            ? 3
                                            : Math.max(
                                                  (item.revenue /
                                                      maxRevenue) *
                                                      100,
                                                  5
                                              );

                                    return (
                                        <div
                                            key={item.date}
                                            className="aurora-chart-bar-wrap"
                                            title={`${item.label}: ${money(
                                                item.revenue
                                            )}`}
                                        >
                                            <div
                                                className="aurora-chart-bar"
                                                style={{
                                                    height: `${height}%`,
                                                }}
                                            />
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="aurora-chart-labels">
                                <span>
                                    {chartData[0]?.label}
                                </span>

                                <span>
                                    {chartData[14]?.label}
                                </span>

                                <span>
                                    {chartData[29]?.label}
                                </span>
                            </div>
                        </div>
                    </section>


                    {/* =====================================================
                        PRODUCTS + ORDER STATUS
                    ====================================================== */}

                    <div className="row g-4 mb-4">

                        {/* Products */}
                        <div className="col-12 col-lg-7">
                            <section className="aurora-section-card h-100">

                                <div className="aurora-section-header">
                                    <div>
                                        <h2 className="aurora-section-title">
                                            Products
                                        </h2>

                                        <p className="aurora-section-description">
                                            Quick access to your product
                                            management
                                        </p>
                                    </div>

                                    <Link
                                        href="/admin/products"
                                        className="btn btn-sm btn-outline-secondary rounded-pill px-3"
                                    >
                                        View All
                                    </Link>
                                </div>

                                <div className="aurora-product-grid">
                                    <div className="row g-3">

                                        {products.map((product) => (
                                            <div
                                                key={product.id}
                                                className="col-12 col-sm-6"
                                            >
                                                <Link
                                                    href="/admin/products"
                                                    className="aurora-product-box"
                                                >
                                                    <div className="aurora-product-image">
                                                        {product.image_url ? (
                                                            <img
                                                                src={
                                                                    product.image_url
                                                                }
                                                                alt={
                                                                    product.name
                                                                }
                                                            />
                                                        ) : (
                                                            <span className="aurora-product-placeholder">
                                                                📦
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="min-w-0">
                                                        <div className="aurora-product-name">
                                                            {product.name}
                                                        </div>

                                                        <div className="aurora-product-meta">
                                                            {money(
                                                                Number(
                                                                    product.price
                                                                )
                                                            )}{" "}
                                                            ·{" "}
                                                            {Number(
                                                                product.stock
                                                            ).toLocaleString(
                                                                "en-IN"
                                                            )}{" "}
                                                            in stock
                                                        </div>
                                                    </div>

                                                    <span className="aurora-product-arrow">
                                                        →
                                                    </span>
                                                </Link>
                                            </div>
                                        ))}

                                        {products.length === 0 && (
                                            <div className="col-12">
                                                <div className="text-center text-secondary py-4">
                                                    No products available.
                                                </div>
                                            </div>
                                        )}

                                    </div>
                                </div>
                            </section>
                        </div>


                        {/* Order Status */}
                        <div className="col-12 col-lg-5">
                            <section className="aurora-section-card h-100">

                                <div className="aurora-section-header">
                                    <div>
                                        <h2 className="aurora-section-title">
                                            Order Status
                                        </h2>

                                        <p className="aurora-section-description">
                                            Current order distribution
                                        </p>
                                    </div>
                                </div>

                                <div className="aurora-status-list">

                                    <div className="aurora-status-row">
                                        <span className="aurora-status-dot status-pending" />

                                        <span className="aurora-status-name">
                                            Pending
                                        </span>

                                        <span className="aurora-status-count">
                                            {pendingCount}
                                        </span>
                                    </div>

                                    <div className="aurora-status-row">
                                        <span className="aurora-status-dot status-processing" />

                                        <span className="aurora-status-name">
                                            Processing
                                        </span>

                                        <span className="aurora-status-count">
                                            {processingCount}
                                        </span>
                                    </div>

                                    <div className="aurora-status-row">
                                        <span className="aurora-status-dot status-shipped" />

                                        <span className="aurora-status-name">
                                            Shipped
                                        </span>

                                        <span className="aurora-status-count">
                                            {shippedCount}
                                        </span>
                                    </div>

                                    <div className="aurora-status-row">
                                        <span className="aurora-status-dot status-delivered" />

                                        <span className="aurora-status-name">
                                            Delivered
                                        </span>

                                        <span className="aurora-status-count">
                                            {deliveredCount}
                                        </span>
                                    </div>

                                </div>
                            </section>
                        </div>
                    </div>


                    {/* =====================================================
                        TOP PRODUCTS
                    ====================================================== */}

                    <section className="aurora-section-card mb-4">

                        <div className="aurora-section-header">
                            <div>
                                <h2 className="aurora-section-title">
                                    Top Products
                                </h2>

                                <p className="aurora-section-description">
                                    Best-selling products across your store
                                </p>
                            </div>

                            <Link
                                href="/admin/products"
                                className="btn btn-sm btn-outline-secondary rounded-pill px-3"
                            >
                                Manage Products
                            </Link>
                        </div>

                        <div>
                            {topProducts.length > 0 ? (
                                topProducts.map((product, index) => (
                                    <div
                                        key={product.id}
                                        className="aurora-top-product"
                                    >
                                        <div className="aurora-rank">
                                            {index + 1}
                                        </div>

                                        <div className="aurora-top-name">
                                            {product.name}
                                        </div>

                                        <div className="aurora-top-sales">
                                            <strong>
                                                {Number(
                                                    product.total_sold
                                                ).toLocaleString("en-IN")}
                                            </strong>

                                            sold
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center text-secondary py-5">
                                    No sales data available yet.
                                </div>
                            )}
                        </div>
                    </section>


                    {/* =====================================================
                        QUICK ACTIONS
                    ====================================================== */}

                    <section>
                        <div className="d-flex align-items-center justify-content-between mb-3">
                            <div>
                                <h2
                                    className="aurora-section-title mb-1"
                                    style={{ fontSize: "18px" }}
                                >
                                    Quick Actions
                                </h2>

                                <p className="aurora-section-description mb-0">
                                    Frequently used admin shortcuts
                                </p>
                            </div>
                        </div>

                        <div className="row g-3">

                            {/* Add Product */}
                            <div className="col-12 col-sm-6 col-lg-3">
                                <Link
                                    href="/admin/products/new"
                                    className="aurora-action-box"
                                >
                                    <div className="aurora-action-icon">
                                        +
                                    </div>

                                    <div>
                                        <div className="aurora-action-title">
                                            Add Product
                                        </div>

                                        <div className="aurora-action-subtitle">
                                            Create a new product
                                        </div>
                                    </div>
                                </Link>
                            </div>


                            {/* Products */}
                            <div className="col-12 col-sm-6 col-lg-3">
                                <Link
                                    href="/admin/products"
                                    className="aurora-action-box"
                                >
                                    <div className="aurora-action-icon">
                                        📦
                                    </div>

                                    <div>
                                        <div className="aurora-action-title">
                                            Products
                                        </div>

                                        <div className="aurora-action-subtitle">
                                            Manage your products
                                        </div>
                                    </div>
                                </Link>
                            </div>


                            {/* Orders */}
                            <div className="col-12 col-sm-6 col-lg-3">
                                <Link
                                    href="/admin/orders"
                                    className="aurora-action-box"
                                >
                                    <div className="aurora-action-icon">
                                        🛒
                                    </div>

                                    <div>
                                        <div className="aurora-action-title">
                                            View Orders
                                        </div>

                                        <div className="aurora-action-subtitle">
                                            Manage customer orders
                                        </div>
                                    </div>
                                </Link>
                            </div>


                            {/* Storefront */}
                            <div className="col-12 col-sm-6 col-lg-3">
                                <Link
                                    href="/"
                                    className="aurora-action-box"
                                >
                                    <div className="aurora-action-icon">
                                        ↗
                                    </div>

                                    <div>
                                        <div className="aurora-action-title">
                                            View Storefront
                                        </div>

                                        <div className="aurora-action-subtitle">
                                            Open your online store
                                        </div>
                                    </div>
                                </Link>
                            </div>

                        </div>
                    </section>

                </div>
            </main>
        </>
    );
}

