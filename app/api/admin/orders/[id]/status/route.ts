import { NextRequest, NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

const allowedStatuses = [
    "PLACED",
    "CONFIRMED",
    "PACKED",
    "SHIPPED",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "CANCELLED",
];

export async function PATCH(
    request: NextRequest,
    context: {
        params: Promise<{
            id: string;
        }>;
    }
) {
    try {

        /*
         * Check login.
         */
        const user = await getSession();

        if (!user) {
            return NextResponse.json(
                {
                    message: "Unauthorized",
                },
                {
                    status: 401,
                }
            );
        }

        /*
         * Only ADMIN can update orders.
         */
        if (user.role !== "ADMIN") {
            return NextResponse.json(
                {
                    message: "Forbidden",
                },
                {
                    status: 403,
                }
            );
        }

        /*
         * Get order ID.
         */
        const { id } = await context.params;

        const orderId = Number(id);

        if (
            !Number.isInteger(orderId) ||
            orderId <= 0
        ) {
            return NextResponse.json(
                {
                    message: "Invalid order ID.",
                },
                {
                    status: 400,
                }
            );
        }

        /*
         * Get request body.
         */
        const body = await request.json();

        const status = String(
            body.status ?? ""
        )
            .trim()
            .toUpperCase();

        /*
         * Validate status against the
         * actual orders.status ENUM.
         */
        if (!allowedStatuses.includes(status)) {
            return NextResponse.json(
                {
                    message:
                        "Invalid order status.",
                },
                {
                    status: 400,
                }
            );
        }

        /*
         * Check whether the order exists.
         */
        const [orderResult] = await db.query(
            `
            SELECT
                id,
                status
            FROM orders
            WHERE id = ?
            LIMIT 1
            `,
            [orderId]
        );

        const existingOrders =
            orderResult as Array<{
                id: number;
                status: string | null;
            }>;

        if (existingOrders.length === 0) {
            return NextResponse.json(
                {
                    message:
                        "Order not found.",
                },
                {
                    status: 404,
                }
            );
        }

        /*
         * Update order status.
         */
        await db.query(
            `
            UPDATE orders
            SET status = ?
            WHERE id = ?
            `,
            [
                status,
                orderId,
            ]
        );

        /*
         * Return updated status.
         */
        return NextResponse.json({
            success: true,
            message:
                "Order status updated successfully.",
            status,
        });

    } catch (error) {

        console.error(
            "ADMIN ORDER STATUS UPDATE ERROR:",
            error
        );

        return NextResponse.json(
            {
                success: false,
                message:
                    error instanceof Error
                        ? error.message
                        : "Failed to update order status.",
            },
            {
                status: 500,
            }
        );
    }
}