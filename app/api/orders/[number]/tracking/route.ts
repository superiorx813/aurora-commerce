
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

type RouteContext = {
  params: Promise<{ number: string }>;
};

export async function GET(
  _request: Request,
  { params }: RouteContext
) {
  const user = await getSession();

  if (!user) {
    return NextResponse.json(
      { error: "Please sign in to track your order." },
      { status: 401 }
    );
  }

  const { number } = await params;

  try {
    const [orderRows]: any = await db.execute(
      `SELECT
         id,
         order_number,
         status,
         created_at
       FROM orders
       WHERE order_number = ?
         AND user_id = ?
       LIMIT 1`,
      [number, user.id]
    );

    if (!orderRows.length) {
      return NextResponse.json(
        { error: "Order not found." },
        { status: 404 }
      );
    }

    const order = orderRows[0];

    const [historyRows]: any = await db.execute(
      `SELECT
         id,
         status,
         note,
         created_at
       FROM order_status_history
       WHERE order_id = ?
       ORDER BY created_at DESC, id DESC`,
      [order.id]
    );

    return NextResponse.json(
      {
        orderNumber: order.order_number,
        status: order.status || "PLACED",
        createdAt: order.created_at,
        history: historyRows.map((entry: any) => ({
          id: entry.id,
          status: entry.status,
          note: entry.note,
          createdAt: entry.created_at,
        })),
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Order tracking error:", error);

    return NextResponse.json(
      { error: "Unable to load order tracking." },
      { status: 500 }
    );
  }
}