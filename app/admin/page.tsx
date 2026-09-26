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

type ProductCountRow = {
    products_count: number;
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
    image_url?: string | null;
    total_sold: number;
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

    const [
        [statsRows],
        [customerRows],
        [productCountRows],
        [productRows],
        [salesRows],
        [topProductRows],
        [orderStatusRows],
    ] = await Promise.all([
        db.query(`
            SELECT
                COUNT(*) AS orders_count,
                COALESCE(SUM(total), 0) AS revenue
            FROM orders
            WHERE status <> 'CANCELLED'
        `),

        db.query(`
            SELECT COUNT(*) AS customers_count
            FROM users
            WHERE role = 'CUSTOMER'
        `),

        db.query(`
            SELECT COUNT(*) AS products_count
            FROM products
        `),

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

        db.query(`
            SELECT
                p.id,
                p.name,
                p.image_url,
                COALESCE(
                    SUM(
                        CASE
                            WHEN o.status <> 'CANCELLED'
                            THEN oi.quantity
                            ELSE 0
                        END
                    ),
                    0
                ) AS total_sold
            FROM products p
            LEFT JOIN order_items oi
                ON oi.product_id = p.id
            LEFT JOIN orders o
                ON o.id = oi.order_id
            GROUP BY
                p.id,
                p.name,
                p.image_url
            ORDER BY total_sold DESC
            LIMIT 5
        `),

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

    const productCount = (productCountRows as ProductCountRow[])[0] ?? {
        products_count: 0,
    };

    const products = productRows as ProductRow[];
    const sales = salesRows as SalesRow[];
    const topProducts = topProductRows as TopProductRow[];
    const orderStatuses = orderStatusRows as StatusRow[];

    const salesMap = new Map(
        sales.map((item) => [
            String(item.sales_date).slice(0, 10),
            Number(item.revenue),
        ])
    );

    const chartData = Array.from({ length: 30 }, (_, index) => {
        const date = new Date();

        date.setHours(12, 0, 0, 0);
        date.setDate(date.getDate() - (29 - index));

        const key = [
            date.getFullYear(),
            String(date.getMonth() + 1).padStart(2, "0"),
            String(date.getDate()).padStart(2, "0"),
        ].join("-");

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
        ...chartData.map((item) => Number(item.revenue)),
        1
    );

    const total30DayRevenue = chartData.reduce(
        (sum, item) => sum + Number(item.revenue),
        0
    );

    const getStatusCount = (status: string) =>
        Number(
            orderStatuses.find(
                (item) =>
                    String(item.status).trim().toUpperCase() ===
                    status.toUpperCase()
            )?.count ?? 0
        );

    const pendingCount = getStatusCount("PENDING");
    const processingCount = getStatusCount("PROCESSING");
    const shippedCount = getStatusCount("SHIPPED");
    const deliveredCount = getStatusCount("DELIVERED");

    const statusTotal =
        pendingCount +
        processingCount +
        shippedCount +
        deliveredCount;

    const getPercentage = (count: number) =>
        statusTotal
            ? Math.round((count / statusTotal) * 100)
            : 0;

    const highestSales = Math.max(
        Number(topProducts[0]?.total_sold ?? 1),
        1
    );

    return (
        <>
            <style>{`
                * {
                    box-sizing: border-box;
                }

                .aurora-dashboard {
                    min-height: 100vh;
                    padding: 30px;
                    background:
                        radial-gradient(
                            circle at 10% 0%,
                            rgba(124, 58, 237, 0.08),
                            transparent 28%
                        ),
                        radial-gradient(
                            circle at 90% 10%,
                            rgba(14, 165, 233, 0.07),
                            transparent 25%
                        ),
                        #f6f7fb;
                }

                .aurora-container {
                    width: 100%;
                    max-width: 1580px;
                    margin: 0 auto;
                }

                /* =========================
                   HEADER
                ========================= */

                .aurora-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 20px;
                    margin-bottom: 24px;
                }

                .aurora-header-left {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                }

                .aurora-logo {
                    width: 52px;
                    height: 52px;
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(
                        135deg,
                        #4c1d95,
                        #7c3aed
                    );
                    color: #fff;
                    font-size: 24px;
                    font-weight: 800;
                    box-shadow:
                        0 10px 25px rgba(124, 58, 237, 0.25);
                }

                .aurora-brand-small {
                    color: #7c3aed;
                    font-size: 11px;
                    font-weight: 800;
                    letter-spacing: 2px;
                    text-transform: uppercase;
                    margin-bottom: 2px;
                }

                .aurora-title {
                    margin: 0;
                    font-size: 25px;
                    font-weight: 800;
                    color: #172033;
                }

                .aurora-subtitle {
                    margin: 3px 0 0;
                    color: #7a8497;
                    font-size: 13px;
                }

                .aurora-header-right {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .aurora-admin-pill {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 8px 13px;
                    border-radius: 14px;
                    background: #fff;
                    border: 1px solid #e8eaf0;
                    box-shadow: 0 8px 20px rgba(20, 25, 40, 0.05);
                }

                .aurora-admin-avatar {
                    width: 38px;
                    height: 38px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(
                        135deg,
                        #7c3aed,
                        #a855f7
                    );
                    color: #fff;
                    font-weight: 800;
                }

                .aurora-admin-name {
                    color: #20283a;
                    font-size: 13px;
                    font-weight: 800;
                }

                .aurora-admin-role {
                    color: #8992a5;
                    font-size: 11px;
                    margin-top: 2px;
                }

                .aurora-time-box {
                    min-width: 145px;
                    padding: 9px 14px;
                    border-radius: 14px;
                    background: #fff;
                    border: 1px solid #e8eaf0;
                    text-align: right;
                    box-shadow: 0 8px 20px rgba(20, 25, 40, 0.05);
                }

                .aurora-date {
                    color: #8992a5;
                    font-size: 10px;
                    margin-bottom: 2px;
                }

                .aurora-clock {
                    color: #252d40;
                    font-size: 14px;
                    font-weight: 800;
                }

                /* =========================
                   HERO
                ========================= */

                .aurora-hero {
                    position: relative;
                    overflow: hidden;
                    border-radius: 28px;
                    padding: 30px;
                    margin-bottom: 18px;
                    color: #fff;
                    background:
                        radial-gradient(
                            circle at 85% 15%,
                            rgba(255,255,255,.16),
                            transparent 25%
                        ),
                        linear-gradient(
                            135deg,
                            #17122e,
                            #3b1b69 48%,
                            #5b21b6
                        );
                    box-shadow:
                        0 18px 40px rgba(76, 29, 149, 0.18);
                }

                .aurora-hero::before {
                    content: "";
                    position: absolute;
                    width: 260px;
                    height: 260px;
                    border-radius: 50%;
                    right: -90px;
                    top: -130px;
                    background: rgba(255,255,255,.07);
                }

                .aurora-hero::after {
                    content: "";
                    position: absolute;
                    width: 180px;
                    height: 180px;
                    border-radius: 50%;
                    left: 42%;
                    bottom: -120px;
                    background: rgba(255,255,255,.05);
                }

                .aurora-hero-content {
                    position: relative;
                    z-index: 2;
                }

                .aurora-live-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 7px;
                    padding: 7px 11px;
                    border-radius: 999px;
                    background: rgba(255,255,255,.11);
                    border: 1px solid rgba(255,255,255,.16);
                    font-size: 11px;
                    font-weight: 700;
                    margin-bottom: 16px;
                }

                .aurora-live-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: #4ade80;
                }

                .aurora-revenue-label {
                    color: rgba(255,255,255,.72);
                    font-size: 12px;
                    margin-bottom: 4px;
                }

                .aurora-revenue {
                    font-size: 36px;
                    font-weight: 900;
                    letter-spacing: -1px;
                }

                .aurora-revenue-info {
                    color: rgba(255,255,255,.72);
                    font-size: 12px;
                    margin-top: 4px;
                }

                .aurora-revenue-chip {
                    display: inline-flex;
                    margin-top: 14px;
                    padding: 6px 10px;
                    border-radius: 999px;
                    background: rgba(34,197,94,.16);
                    color: #bbf7d0;
                    font-size: 11px;
                    font-weight: 800;
                }

                /* =========================
                   CHART
                ========================= */

                .aurora-chart {
                    background: #fff;
                    border: 1px solid #e8eaf0;
                    border-radius: 23px;
                    padding: 21px;
                    margin-bottom: 18px;
                    box-shadow: 0 10px 25px rgba(20,25,40,.05);
                }

                .aurora-chart-head {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    gap: 15px;
                    margin-bottom: 18px;
                }

                .aurora-chart-title {
                    color: #20283a;
                    font-size: 16px;
                    font-weight: 800;
                }

                .aurora-chart-total {
                    color: #7c3aed;
                    font-size: 17px;
                    font-weight: 900;
                }

                .aurora-bars {
                    height: 210px;
                    display: flex;
                    align-items: flex-end;
                    gap: 5px;
                    padding: 10px 0 0;
                }

                .aurora-bar-holder {
                    flex: 1;
                    height: 100%;
                    display: flex;
                    align-items: flex-end;
                    min-width: 0;
                }

                .aurora-bar {
                    width: 100%;
                    min-height: 3px;
                    border-radius: 8px 8px 2px 2px;
                    background: linear-gradient(
                        180deg,
                        #8b5cf6,
                        #4c1d95
                    );
                    transition: height .35s ease;
                }

                .aurora-chart-bottom {
                    display: flex;
                    justify-content: space-between;
                    color: #9aa2b2;
                    font-size: 10px;
                    margin-top: 8px;
                }

                /* =========================
                   STAT CARDS
                ========================= */

                .aurora-stat {
                    position: relative;
                    overflow: hidden;
                    display: block;
                    height: 100%;
                    min-height: 155px;
                    padding: 21px;
                    color: #fff !important;
                    text-decoration: none;
                    border: 1px solid transparent !important;
                    border-radius: 23px;
                    isolation: isolate;
                    box-shadow: 0 10px 25px rgba(20,25,40,.08);
                    transition:
                        box-shadow .25s ease,
                        border-color .25s ease;
                }

                .aurora-stat::before {
                    content: "";
                    position: absolute;
                    width: 150px;
                    height: 150px;
                    border-radius: 50%;
                    right: -70px;
                    top: -80px;
                    background: rgba(255,255,255,.08);
                    z-index: -1;
                }

                .aurora-stat::after {
                    content: "";
                    position: absolute;
                    width: 110px;
                    height: 110px;
                    border-radius: 50%;
                    left: -65px;
                    bottom: -70px;
                    background: rgba(255,255,255,.06);
                    z-index: -1;
                }

                .aurora-stat-orders {
                    background: linear-gradient(
                        135deg,
                        #5b21b6 0%,
                        #6d28d9 45%,
                        #7c3aed 100%
                    );
                    border-color: rgba(124,58,237,.35) !important;
                }

                .aurora-stat-orders:hover {
                    box-shadow:
                        0 22px 50px rgba(124,58,237,.42),
                        0 0 35px rgba(139,92,246,.18);
                    border-color: rgba(139,92,246,.75) !important;
                }

                .aurora-stat-revenue {
                    background: linear-gradient(
                        135deg,
                        #075985 0%,
                        #0369a1 45%,
                        #0284c7 100%
                    );
                    border-color: rgba(2,132,199,.35) !important;
                }

                .aurora-stat-revenue:hover {
                    box-shadow:
                        0 22px 50px rgba(2,132,199,.42),
                        0 0 35px rgba(14,165,233,.18);
                    border-color: rgba(14,165,233,.75) !important;
                }

                .aurora-stat-customers {
                    background: linear-gradient(
                        135deg,
                        #047857 0%,
                        #059669 45%,
                        #10b981 100%
                    );
                    border-color: rgba(16,185,129,.35) !important;
                }

                .aurora-stat-customers:hover {
                    box-shadow:
                        0 22px 50px rgba(5,150,105,.42),
                        0 0 35px rgba(16,185,129,.18);
                    border-color: rgba(52,211,153,.75) !important;
                }

                .aurora-stat-products {
                    background: linear-gradient(
                        135deg,
                        #c2410c 0%,
                        #ea580c 45%,
                        #f97316 100%
                    );
                    border-color: rgba(249,115,22,.35) !important;
                }

                .aurora-stat-products:hover {
                    box-shadow:
                        0 22px 50px rgba(234,88,12,.42),
                        0 0 35px rgba(249,115,22,.20);
                    border-color: rgba(251,146,60,.80) !important;
                }

                .aurora-stat-head {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 12px;
                }

                .aurora-stat-label {
                    font-size: 12px;
                    font-weight: 700;
                    color: rgba(255,255,255,.78);
                }

                .aurora-stat-icon {
                    width: 40px;
                    height: 40px;
                    border-radius: 13px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(255,255,255,.15);
                    border: 1px solid rgba(255,255,255,.16);
                    color: #fff;
                    font-size: 18px;
                    font-weight: 900;
                }

                .aurora-stat-value {
                    margin-top: 13px;
                    font-size: 29px;
                    line-height: 1;
                    font-weight: 900;
                    letter-spacing: -0.7px;
                }

                .aurora-stat-footer {
                    margin-top: 17px;
                    font-size: 11px;
                    color: rgba(255,255,255,.72);
                    font-weight: 700;
                }

                /* =========================
                   GENERAL CARDS
                ========================= */

                .aurora-card {
                    background: #fff;
                    border: 1px solid #e8eaf0;
                    border-radius: 23px;
                    padding: 21px;
                    height: 100%;
                    box-shadow: 0 10px 25px rgba(20,25,40,.05);
                    transition:
                        box-shadow .25s ease,
                        border-color .25s ease;
                }

                .aurora-card:hover {
                    box-shadow: 0 18px 38px rgba(20,25,40,.08);
                    border-color: #dddfea;
                }

                .aurora-card-head {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    gap: 12px;
                    margin-bottom: 20px;
                }

                .aurora-card-title {
                    color: #20283a;
                    font-size: 16px;
                    font-weight: 800;
                }

                .aurora-card-desc {
                    color: #929aab;
                    font-size: 11px;
                    margin-top: 4px;
                }

                .aurora-view-link {
                    color: #7c3aed;
                    text-decoration: none;
                    font-size: 11px;
                    font-weight: 800;
                }

                .aurora-view-link:hover {
                    color: #5b21b6;
                }

                /* =========================
                   STORE PULSE
                ========================= */

                .aurora-pulse {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                .aurora-status-row {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .aurora-status-head {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }

                .aurora-status-name {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    color: #424b5f;
                    font-size: 12px;
                    font-weight: 700;
                }

                .aurora-status-count {
                    color: #20283a;
                    font-size: 12px;
                    font-weight: 900;
                }

                .aurora-status-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                }

                .status-pending {
                    background: #f59e0b;
                }

                .status-processing {
                    background: #0ea5e9;
                }

                .status-shipped {
                    background: #8b5cf6;
                }

                .status-delivered {
                    background: #10b981;
                }

                .aurora-progress {
                    width: 100%;
                    height: 7px;
                    overflow: hidden;
                    border-radius: 999px;
                    background: #f0f1f5;
                }

                .aurora-progress-fill {
                    height: 100%;
                    border-radius: inherit;
                    transition: width .4s ease;
                }

                .fill-pending {
                    background: #f59e0b;
                }

                .fill-processing {
                    background: #0ea5e9;
                }

                .fill-shipped {
                    background: #8b5cf6;
                }

                .fill-delivered {
                    background: #10b981;
                }

                /* =========================
                   TOP PRODUCTS
                ========================= */

                .aurora-top-row {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 11px 0;
                    border-bottom: 1px solid #f0f1f5;
                }

                .aurora-top-row:last-child {
                    border-bottom: none;
                }

                .aurora-rank {
                    width: 24px;
                    color: #929aab;
                    font-size: 11px;
                    font-weight: 900;
                    text-align: center;
                }

                .aurora-top-img {
                    width: 48px;
                    height: 48px;
                    flex: 0 0 48px;
                    border-radius: 13px;
                    overflow: hidden;
                    background: #f4f5f8;
                }

                .aurora-top-img img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .aurora-top-info {
                    flex: 1;
                    min-width: 0;
                }

                .aurora-top-name {
                    color: #30394b;
                    font-size: 12px;
                    font-weight: 800;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    margin-bottom: 7px;
                }

                .aurora-top-progress {
                    height: 5px;
                    overflow: hidden;
                    border-radius: 999px;
                    background: #f0f1f5;
                }

                .aurora-top-progress-fill {
                    height: 100%;
                    border-radius: inherit;
                    background: linear-gradient(
                        90deg,
                        #7c3aed,
                        #a855f7
                    );
                }

                .aurora-top-number {
                    min-width: 52px;
                    text-align: right;
                    color: #929aab;
                    font-size: 10px;
                }

                .aurora-top-number strong {
                    display: block;
                    color: #30394b;
                    font-size: 12px;
                    font-weight: 900;
                }

                .aurora-top-number span {
                    font-size: 9px;
                }

                /* =========================
                   QUICK ACTIONS
                ========================= */

                .aurora-action {
                    position: relative;
                    overflow: hidden;
                    display: flex;
                    align-items: center;
                    gap: 14px;
                    min-height: 92px;
                    padding: 17px;
                    border-radius: 20px;
                    text-decoration: none;
                    color: #fff !important;
                    border: 1px solid transparent;
                    transition:
                        box-shadow .25s ease,
                        border-color .25s ease,
                        background .25s ease;
                }

                .aurora-action::before {
                    content: "";
                    position: absolute;
                    width: 130px;
                    height: 130px;
                    border-radius: 50%;
                    right: -75px;
                    top: -70px;
                    background: rgba(255,255,255,.08);
                    pointer-events: none;
                }

                .aurora-action-products {
                    background: linear-gradient(
                        135deg,
                        #4338ca,
                        #6366f1
                    );
                    border-color: rgba(99,102,241,.35);
                }

                .aurora-action-products:hover {
                    background: linear-gradient(
                        135deg,
                        #3730a3,
                        #4f46e5
                    );
                    border-color: rgba(129,140,248,.75);
                    box-shadow:
                        0 18px 38px rgba(79,70,229,.30),
                        0 0 25px rgba(99,102,241,.14);
                }

                .aurora-action-add {
                    background: linear-gradient(
                        135deg,
                        #047857,
                        #10b981
                    );
                    border-color: rgba(16,185,129,.35);
                }

                .aurora-action-add:hover {
                    background: linear-gradient(
                        135deg,
                        #065f46,
                        #059669
                    );
                    border-color: rgba(52,211,153,.75);
                    box-shadow:
                        0 18px 38px rgba(5,150,105,.30),
                        0 0 25px rgba(16,185,129,.14);
                }

                .aurora-action-store {
                    background: linear-gradient(
                        135deg,
                        #c2410c,
                        #f97316
                    );
                    border-color: rgba(249,115,22,.35);
                }

                .aurora-action-store:hover {
                    background: linear-gradient(
                        135deg,
                        #9a3412,
                        #ea580c
                    );
                    border-color: rgba(251,146,60,.75);
                    box-shadow:
                        0 18px 38px rgba(234,88,12,.30),
                        0 0 25px rgba(249,115,22,.14);
                }

                .aurora-action-icon {
                    position: relative;
                    z-index: 2;
                    width: 48px;
                    height: 48px;
                    flex: 0 0 48px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 15px;
                    background: rgba(255,255,255,.15);
                    border: 1px solid rgba(255,255,255,.16);
                    font-size: 20px;
                }

                .aurora-action-content {
                    position: relative;
                    z-index: 2;
                    flex: 1;
                    min-width: 0;
                }

                .aurora-action-title {
                    color: #fff;
                    font-size: 13px;
                    font-weight: 900;
                }

                .aurora-action-desc {
                    color: rgba(255,255,255,.72);
                    font-size: 10px;
                    margin-top: 3px;
                }

                .aurora-action-arrow {
                    position: relative;
                    z-index: 2;
                    color: rgba(255,255,255,.75);
                    font-size: 18px;
                    font-weight: 800;
                }

                /* =========================
                   RESPONSIVE
                ========================= */

                @media (max-width: 1100px) {
                    .aurora-dashboard {
                        padding: 22px;
                    }

                    .aurora-header-right {
                        gap: 8px;
                    }

                    .aurora-time-box {
                        display: none;
                    }
                }

                @media (max-width: 991px) {
                    .aurora-header {
                        align-items: flex-start;
                    }

                    .aurora-header-right {
                        flex-direction: column;
                        align-items: flex-end;
                    }

                    .aurora-hero {
                        padding: 25px;
                    }
                }

                @media (max-width: 700px) {
                    .aurora-dashboard {
                        padding: 15px;
                    }

                    .aurora-header {
                        flex-direction: column;
                    }

                    .aurora-header-right {
                        width: 100%;
                        align-items: stretch;
                    }

                    .aurora-admin-pill {
                        width: 100%;
                    }

                    .aurora-title {
                        font-size: 21px;
                    }

                    .aurora-hero {
                        border-radius: 21px;
                    }

                    .aurora-revenue {
                        font-size: 30px;
                    }

                    .aurora-bars {
                        height: 160px;
                    }
                }

                @media (max-width: 450px) {
                    .aurora-dashboard {
                        padding: 10px;
                    }

                    .aurora-logo {
                        width: 45px;
                        height: 45px;
                    }

                    .aurora-title {
                        font-size: 19px;
                    }

                    .aurora-stat {
                        min-height: 140px;
                        padding: 17px;
                    }

                    .aurora-stat-value {
                        font-size: 24px;
                    }

                    .aurora-action {
                        min-height: 82px;
                    }
                }
            `}</style>

            <script
                dangerouslySetInnerHTML={{
                    __html: `
                        (() => {
                            const updateAuroraDashboard = () => {
                                const clock =
                                    document.getElementById(
                                        "aurora-live-clock"
                                    );

                                const date =
                                    document.getElementById(
                                        "aurora-live-date"
                                    );

                                const greeting =
                                    document.getElementById(
                                        "aurora-time-greeting"
                                    );

                                if (!clock || !date) return;

                                const now = new Date();

                                clock.textContent =
                                    now.toLocaleTimeString(
                                        "en-IN",
                                        {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                            second: "2-digit",
                                            hour12: true
                                        }
                                    );

                                date.textContent =
                                    now.toLocaleDateString(
                                        "en-IN",
                                        {
                                            weekday: "long",
                                            day: "2-digit",
                                            month: "long",
                                            year: "numeric"
                                        }
                                    );

                                if (greeting) {
                                    const hour = now.getHours();

                                    let message = "Good Evening";

                                    if (hour >= 5 && hour < 12) {
                                        message = "Good Morning";
                                    } else if (
                                        hour >= 12 &&
                                        hour < 17
                                    ) {
                                        message = "Good Afternoon";
                                    } else if (
                                        hour >= 17 &&
                                        hour < 21
                                    ) {
                                        message = "Good Evening";
                                    } else {
                                        message = "Good Night";
                                    }

                                    greeting.textContent =
                                        message + ", ${user.name} 👋";
                                }
                            };

                            updateAuroraDashboard();

                            if (
                                !window.__auroraDashboardStarted
                            ) {
                                window.__auroraDashboardStarted = true;

                                setInterval(
                                    updateAuroraDashboard,
                                    1000
                                );
                            }
                        })();
                    `,
                }}
            />

            <main className="aurora-dashboard">
                <div className="aurora-container">

                    {/* =========================
                        HEADER
                    ========================= */}

                    <header className="aurora-header">
                        <div className="aurora-header-left">
                            <div className="aurora-logo">
                                A
                            </div>

                            <div>
                                <div
                                    id="aurora-time-greeting"
                                    className="aurora-title"
                                    style={{
                                        color: "#172033",
                                        fontSize: "25px",
                                        fontWeight: 800,
                                        marginBottom: "4px",
                                    }}
                                >
                                    Good Evening, {user.name} 👋
                                </div>

                                <p className="aurora-subtitle">
                                    Monitor your store performance and operations.
                                </p>
                            </div>
                        </div>

                        <div className="aurora-header-right">
                            <div className="aurora-admin-pill">
                                <div className="aurora-admin-avatar">
                                    {user.name?.charAt(0).toUpperCase() || "A"}
                                </div>

                                <div>
                                    <div className="aurora-admin-name">
                                        {user.name}
                                    </div>

                                    <div className="aurora-admin-role">
                                        Administrator
                                    </div>
                                </div>
                            </div>

                            <div className="aurora-time-box">
                                <div
                                    className="aurora-date"
                                    id="aurora-live-date"
                                >
                                    Loading...
                                </div>

                                <div
                                    className="aurora-clock"
                                    id="aurora-live-clock"
                                >
                                    --:--:--
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* =========================
                        HERO
                    ========================= */}

                    <section className="aurora-hero">
                        <div className="aurora-hero-content">

                            <div className="aurora-live-badge">
                                <span className="aurora-live-dot" />
                                Store is live
                            </div>

                            <div className="aurora-revenue-label">
                                Total Store Revenue
                            </div>

                            <div className="aurora-revenue">
                                {money(Number(stats.revenue))}
                            </div>

                            <div className="aurora-revenue-info">
                                Revenue from all non-cancelled orders
                            </div>

                            <div className="aurora-revenue-chip">
                                30 Day Revenue: {money(total30DayRevenue)}
                            </div>

                        </div>
                    </section>

                    {/* =========================
                        SALES CHART
                    ========================= */}

                    <section className="aurora-chart">
                        <div className="aurora-chart-head">
                            <div>
                                <div className="aurora-chart-title">
                                    Sales Overview
                                </div>

                                <div className="aurora-card-desc">
                                    Revenue performance over the last 30 days
                                </div>
                            </div>

                            <div className="aurora-chart-total">
                                {money(total30DayRevenue)}
                            </div>
                        </div>

                        <div className="aurora-bars">
                            {chartData.map((item) => (
                                <div
                                    className="aurora-bar-holder"
                                    key={item.date}
                                    title={`${item.label}: ${money(
                                        Number(item.revenue)
                                    )}`}
                                >
                                    <div
                                        className="aurora-bar"
                                        style={{
                                            height: `${Math.max(
                                                (Number(item.revenue) /
                                                    maxRevenue) *
                                                    100,
                                                Number(item.revenue) > 0
                                                    ? 4
                                                    : 1
                                            )}%`,
                                        }}
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="aurora-chart-bottom">
                            <span>
                                {chartData[0]?.label}
                            </span>

                            <span>
                                Last 30 Days
                            </span>

                            <span>
                                {chartData[chartData.length - 1]?.label}
                            </span>
                        </div>
                    </section>

                    {/* =========================
                        STAT CARDS
                    ========================= */}

                    <div className="row g-3 mb-4">

                        <div className="col-6 col-xl-3">
                            <Link
                                href="/admin/orders"
                                className="aurora-stat aurora-stat-orders"
                            >
                                <div className="aurora-stat-head">
                                    <span className="aurora-stat-label">
                                        Orders
                                    </span>

                                    <div className="aurora-stat-icon">
                                        🛍
                                    </div>
                                </div>

                                <div className="aurora-stat-value">
                                    {Number(
                                        stats.orders_count
                                    ).toLocaleString("en-IN")}
                                </div>

                                <div className="aurora-stat-footer">
                                    View all orders →
                                </div>
                            </Link>
                        </div>

                        <div className="col-6 col-xl-3">
                            <Link
                                href="/admin/revenue"
                                className="aurora-stat aurora-stat-revenue"
                            >
                                <div className="aurora-stat-head">
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

                                <div className="aurora-stat-footer">
                                    Revenue analytics →
                                </div>
                            </Link>
                        </div>

                        <div className="col-6 col-xl-3">
                            <Link
                                href="/admin/customers"
                                className="aurora-stat aurora-stat-customers"
                            >
                                <div className="aurora-stat-head">
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

                                <div className="aurora-stat-footer">
                                    Customer directory →
                                </div>
                            </Link>
                        </div>

                        <div className="col-6 col-xl-3">
                            <Link
                                href="/admin/products"
                                className="aurora-stat aurora-stat-products"
                            >
                                <div className="aurora-stat-head">
                                    <span className="aurora-stat-label">
                                        Products
                                    </span>

                                    <div className="aurora-stat-icon">
                                        📦
                                    </div>
                                </div>

                                <div className="aurora-stat-value">
                                    {Number(
                                        productCount.products_count
                                    ).toLocaleString("en-IN")}
                                </div>

                                <div className="aurora-stat-footer">
                                    Manage products →
                                </div>
                            </Link>
                        </div>

                    </div>

                    {/* =========================
                        ORDER STATUS + TOP PRODUCTS
                    ========================= */}

                    <div className="row g-3 mb-4">

                        <div className="col-lg-6">
                            <section className="aurora-card">

                                <div className="aurora-card-head">
                                    <div>
                                        <div className="aurora-card-title">
                                            Order Status
                                        </div>

                                        <div className="aurora-card-desc">
                                            Current order distribution
                                        </div>
                                    </div>

                                    <Link
                                        href="/admin/orders"
                                        className="aurora-view-link"
                                    >
                                        View Orders →
                                    </Link>
                                </div>

                                <div className="aurora-pulse">

                                    <div className="aurora-status-row">
                                        <div className="aurora-status-head">
                                            <div className="aurora-status-name">
                                                <span className="aurora-status-dot status-pending" />
                                                Pending
                                            </div>

                                            <div className="aurora-status-count">
                                                {pendingCount}
                                            </div>
                                        </div>

                                        <div className="aurora-progress">
                                            <div
                                                className="aurora-progress-fill fill-pending"
                                                style={{
                                                    width: `${getPercentage(
                                                        pendingCount
                                                    )}%`,
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div className="aurora-status-row">
                                        <div className="aurora-status-head">
                                            <div className="aurora-status-name">
                                                <span className="aurora-status-dot status-processing" />
                                                Processing
                                            </div>

                                            <div className="aurora-status-count">
                                                {processingCount}
                                            </div>
                                        </div>

                                        <div className="aurora-progress">
                                            <div
                                                className="aurora-progress-fill fill-processing"
                                                style={{
                                                    width: `${getPercentage(
                                                        processingCount
                                                    )}%`,
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div className="aurora-status-row">
                                        <div className="aurora-status-head">
                                            <div className="aurora-status-name">
                                                <span className="aurora-status-dot status-shipped" />
                                                Shipped
                                            </div>

                                            <div className="aurora-status-count">
                                                {shippedCount}
                                            </div>
                                        </div>

                                        <div className="aurora-progress">
                                            <div
                                                className="aurora-progress-fill fill-shipped"
                                                style={{
                                                    width: `${getPercentage(
                                                        shippedCount
                                                    )}%`,
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div className="aurora-status-row">
                                        <div className="aurora-status-head">
                                            <div className="aurora-status-name">
                                                <span className="aurora-status-dot status-delivered" />
                                                Delivered
                                            </div>

                                            <div className="aurora-status-count">
                                                {deliveredCount}
                                            </div>
                                        </div>

                                        <div className="aurora-progress">
                                            <div
                                                className="aurora-progress-fill fill-delivered"
                                                style={{
                                                    width: `${getPercentage(
                                                        deliveredCount
                                                    )}%`,
                                                }}
                                            />
                                        </div>
                                    </div>

                                </div>
                            </section>
                        </div>

                        <div className="col-lg-6">
                            <section className="aurora-card">

                                <div className="aurora-card-head">
                                    <div>
                                        <div className="aurora-card-title">
                                            Top Products
                                        </div>

                                        <div className="aurora-card-desc">
                                            Best performing products
                                        </div>
                                    </div>

                                    <Link
                                        href="/admin/products"
                                        className="aurora-view-link"
                                    >
                                        View Products →
                                    </Link>
                                </div>

                                {topProducts.length === 0 ? (
                                    <div className="text-muted small">
                                        No product sales data available.
                                    </div>
                                ) : (
                                    topProducts.map(
                                        (product, index) => (
                                            <div
                                                className="aurora-top-row"
                                                key={product.id}
                                            >
                                                <div className="aurora-rank">
                                                    #{index + 1}
                                                </div>

                                                <div className="aurora-top-img">
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
                                                        <div
                                                            style={{
                                                                width: "100%",
                                                                height: "100%",
                                                                display:
                                                                    "flex",
                                                                alignItems:
                                                                    "center",
                                                                justifyContent:
                                                                    "center",
                                                                fontSize:
                                                                    "18px",
                                                            }}
                                                        >
                                                            📦
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="aurora-top-info">
                                                    <div className="aurora-top-name">
                                                        {product.name}
                                                    </div>

                                                    <div className="aurora-top-progress">
                                                        <div
                                                            className="aurora-top-progress-fill"
                                                            style={{
                                                                width: `${Math.max(
                                                                    (Number(
                                                                        product.total_sold
                                                                    ) /
                                                                        highestSales) *
                                                                        100,
                                                                    Number(
                                                                        product.total_sold
                                                                    ) > 0
                                                                        ? 5
                                                                        : 0
                                                                )}%`,
                                                            }}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="aurora-top-number">
                                                    <strong>
                                                        {Number(
                                                            product.total_sold
                                                        )}
                                                    </strong>

                                                    <span>
                                                        sold
                                                    </span>
                                                </div>
                                            </div>
                                        )
                                    )
                                )}

                            </section>
                        </div>

                    </div>

                    {/* =========================
                        QUICK ACTIONS
                    ========================= */}

                    <section className="aurora-card">

                        <div className="aurora-card-head">
                            <div>
                                <div className="aurora-card-title">
                                    Quick Actions
                                </div>

                                <div className="aurora-card-desc">
                                    Frequently used store management actions
                                </div>
                            </div>
                        </div>

                        <div className="row g-3">

                            <div className="col-md-4">
                                <Link
                                    href="/admin/products"
                                    className="aurora-action aurora-action-products"
                                >
                                    <div className="aurora-action-icon">
                                        📦
                                    </div>

                                    <div className="aurora-action-content">
                                        <div className="aurora-action-title">
                                            Products
                                        </div>

                                        <div className="aurora-action-desc">
                                            Manage your complete product catalog
                                        </div>
                                    </div>

                                    <div className="aurora-action-arrow">
                                        →
                                    </div>
                                </Link>
                            </div>

                            <div className="col-md-4">
                                <Link
                                    href="/admin/products/new"
                                    className="aurora-action aurora-action-add"
                                >
                                    <div className="aurora-action-icon">
                                        ＋
                                    </div>

                                    <div className="aurora-action-content">
                                        <div className="aurora-action-title">
                                            Add Product
                                        </div>

                                        <div className="aurora-action-desc">
                                            Create and publish a new product
                                        </div>
                                    </div>

                                    <div className="aurora-action-arrow">
                                        →
                                    </div>
                                </Link>
                            </div>

                            <div className="col-md-4">
                                <Link
                                    href="/"
                                    className="aurora-action aurora-action-store"
                                >
                                    <div className="aurora-action-icon">
                                        🏪
                                    </div>

                                    <div className="aurora-action-content">
                                        <div className="aurora-action-title">
                                            Store Front
                                        </div>

                                        <div className="aurora-action-desc">
                                            Open and preview your customer store
                                        </div>
                                    </div>

                                    <div className="aurora-action-arrow">
                                        →
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