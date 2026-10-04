
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

const ALLOWED_STATUSES = [
  "PLACED",
  "CONFIRMED",
  "PACKED",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
] as const;

type OrderStatus = (typeof ALLOWED_STATUSES)[number];

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(
  request: Request,
  { params }: RouteContext
) {
  const user = await getSession();

  if (!user) {
    return NextResponse.json(
      { error: "Please sign in." },
      { status: 401 }
    );
  }

  if (user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Admin access required." },
      { status: 403 }
    );
  }

  const { id } = await params;

  if (!/^\d+$/.test(id) || Number(id) <= 0) {
    return NextResponse.json(
      { error: "Invalid order ID." },
      { status: 400 }
    );
  }

  let body: { status?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 }
    );
  }

  const nextStatus = String(body.status ?? "").toUpperCase();

  if (
    !ALLOWED_STATUSES.includes(nextStatus as OrderStatus)
  ) {
    return NextResponse.json(
      { error: "Invalid order status." },
      { status: 400 }
    );
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [orderRows]: any = await connection.execute(
      `SELECT id, status
       FROM orders
       WHERE id = ?
       FOR UPDATE`,
      [Number(id)]
    );

    if (!orderRows.length) {
      await connection.rollback();

      return NextResponse.json(
        { error: "Order not found." },
        { status: 404 }
      );
    }

    const order = orderRows[0];
    const previousStatus = String(
      order.status || "PLACED"
    ).toUpperCase();

    if (previousStatus === nextStatus) {
      await connection.commit();

      return NextResponse.json({
        success: true,
        message: "Order already has this status.",
        status: nextStatus,
        changed: false,
      });
    }

    await connection.execute(
      `UPDATE orders
       SET status = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [nextStatus, Number(id)]
    );

    const note = `Status changed from ${previousStatus} to ${nextStatus}.`;

    await connection.execute(
      `INSERT INTO order_status_history
         (order_id, status, note, changed_by)
       VALUES (?, ?, ?, ?)`,
      [Number(id), nextStatus, note, user.id]
    );

    await connection.commit();

    return NextResponse.json({
      success: true,
      message: "Order status and history updated.",
      previousStatus,
      status: nextStatus,
      changed: true,
    });
  } catch (error) {
    await connection.rollback();

    console.error("Order status update error:", error);

    return NextResponse.json(
      { error: "Unable to update order status." },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}