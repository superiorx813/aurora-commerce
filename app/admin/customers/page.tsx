
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

export default async function AdminCustomersPage() {
    const user = await getSession();

    if (!user) {
        redirect("/account");
    }

    if (user.role !== "ADMIN") {
        redirect("/");
    }

    const [customersResult] = await Promise.all([
        db.query(`
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
            GROUP BY
                u.id,
                u.name,
                u.email,
                u.created_at
            ORDER BY u.created_at DESC
            LIMIT 100
        `),
    ]);

    const customers = customersResult as CustomerRow[];

    const totalCustomers = customers.length;

    const activeCustomers = customers.filter(
        (customer) => Number(customer.order_count) > 0
    ).length;

    const totalCustomerRevenue = customers.reduce(
        (sum, customer) =>
            sum + Number(customer.total_spent || 0),
        0
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

                            <span className="badge rounded-pill bg-warning-subtle text-warning-emphasis px-3 py-2">
                                CUSTOMERS
                            </span>
                        </div>

                        <h1 className="display-6 fw-bold mb-1">
                            Customers
                        </h1>

                        <p className="text-secondary mb-0">
                            View and understand your customer base.
                        </p>
                    </div>

                    <Link
                        href="/admin"
                        className="btn btn-light border rounded-3 px-4"
                    >
                        ← Dashboard
                    </Link>
                </div>

                {/* Customer statistics */}

                <div className="row g-3 mb-4">

                    <div className="col-12 col-md-4">
                        <div className="card border-0 shadow-sm rounded-4 h-100">
                            <div className="card-body p-4">
                                <div className="text-secondary small text-uppercase fw-semibold mb-2">
                                    Total Customers
                                </div>

                                <div className="fs-2 fw-bold">
                                    {totalCustomers.toLocaleString(
                                        "en-IN"
                                    )}
                                </div>

                                <div className="small text-secondary mt-2">
                                    Registered non-admin users
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-12 col-md-4">
                        <div className="card border-0 shadow-sm rounded-4 h-100">
                            <div className="card-body p-4">
                                <div className="text-secondary small text-uppercase fw-semibold mb-2">
                                    Active Customers
                                </div>

                                <div className="fs-2 fw-bold text-success">
                                    {activeCustomers.toLocaleString(
                                        "en-IN"
                                    )}
                                </div>

                                <div className="small text-secondary mt-2">
                                    Customers with valid orders
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-12 col-md-4">
                        <div className="card border-0 shadow-sm rounded-4 h-100">
                            <div className="card-body p-4">
                                <div className="text-secondary small text-uppercase fw-semibold mb-2">
                                    Customer Revenue
                                </div>

                                <div className="fs-2 fw-bold">
                                    {money(totalCustomerRevenue)}
                                </div>

                                <div className="small text-secondary mt-2">
                                    Total valid order revenue
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Customer table */}

                <div className="card border-0 shadow-sm rounded-4">
                    <div className="card-body p-3 p-lg-4">

                        <div className="mb-4">
                            <h4 className="fw-bold mb-1">
                                Customer Directory
                            </h4>

                            <p className="text-secondary small mb-0">
                                Registered customers and their order
                                activity.
                            </p>
                        </div>

                        <div className="table-responsive">
                            <table className="table align-middle mb-0">
                                <thead>
                                    <tr className="text-secondary small">
                                        <th>Customer</th>
                                        <th>Joined</th>
                                        <th>Orders</th>
                                        <th>Total Spent</th>
                                        <th>Activity</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {customers.length > 0 ? (
                                        customers.map((customer) => (
                                            <tr key={customer.id}>
                                                <td>
                                                    <div className="d-flex align-items-center gap-3">
                                                        <div
                                                            className="rounded-circle bg-primary-subtle text-primary d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
                                                            style={{
                                                                width: 44,
                                                                height: 44,
                                                            }}
                                                        >
                                                            {customer.name
                                                                ?.charAt(0)
                                                                .toUpperCase() ||
                                                                "U"}
                                                        </div>

                                                        <div>
                                                            <div className="fw-semibold">
                                                                {
                                                                    customer.name
                                                                }
                                                            </div>

                                                            <div className="small text-secondary">
                                                                {
                                                                    customer.email
                                                                }
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td>
                                                    <span className="small">
                                                        {new Date(
                                                            customer.created_at
                                                        ).toLocaleDateString(
                                                            "en-IN"
                                                        )}
                                                    </span>
                                                </td>

                                                <td className="fw-semibold">
                                                    {Number(
                                                        customer.order_count
                                                    ).toLocaleString(
                                                        "en-IN"
                                                    )}
                                                </td>

                                                <td className="fw-semibold">
                                                    {money(
                                                        Number(
                                                            customer.total_spent
                                                        )
                                                    )}
                                                </td>

                                                <td>
                                                    {Number(
                                                        customer.order_count
                                                    ) > 0 ? (
                                                        <span className="badge rounded-pill bg-success-subtle text-success-emphasis px-3 py-2">
                                                            Active
                                                        </span>
                                                    ) : (
                                                        <span className="badge rounded-pill bg-secondary-subtle text-secondary-emphasis px-3 py-2">
                                                            No Orders
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan={5}
                                                className="text-center py-5 text-secondary"
                                            >
                                                No customers found.
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

