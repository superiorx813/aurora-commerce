
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { generateInvoice } from "@/lib/invoice/generateInvoice";

export async function GET(
  _req: Request,
  context: { params: Promise<{ orderNumber: string }> }
) {
  const user = await getSession();

  if (!user) {
    return NextResponse.json(
      { error: "Please sign in to download your invoice." },
      { status: 401 }
    );
  }

  const { orderNumber } = await context.params;

  try {
    const [rows] = await db.query(
      `
      SELECT
        o.id,
        o.order_number,
        o.subtotal,
        o.shipping,
        o.discount,
        o.total,
        o.payment_method,
        o.payment_status,
        o.created_at,
        u.name AS customer_name,
        u.email AS customer_email,
        a.full_name AS address_name,
        a.phone AS address_phone,
        a.line1,
        a.line2,
        a.city,
        a.state,
        a.postal_code
      FROM orders o
      INNER JOIN users u ON u.id = o.user_id
      LEFT JOIN addresses a ON a.id = o.address_id
      WHERE o.order_number = ? AND o.user_id = ?
      LIMIT 1
      `,
      [orderNumber, user.id]
    );

    const order = (rows as any[])[0];

    if (!order) {
      return NextResponse.json(
        { error: "Order not found." },
        { status: 404 }
      );
    }

    const [itemRows] = await db.query(
      `
      SELECT product_name, quantity, unit_price
      FROM order_items
      WHERE order_id = ?
      ORDER BY id ASC
      `,
      [order.id]
    );

    const pdf = await generateInvoice({
      orderNumber: order.order_number,
      orderDate: order.created_at,
      customerName: order.customer_name || order.address_name || "Customer",
      customerEmail: order.customer_email,
      phone: order.address_phone,
      address: {
        line1: order.line1 || "",
        line2: order.line2,
        city: order.city || "",
        state: order.state || "",
        postalCode: order.postal_code || "",
      },
      items: itemRows as any[],
      subtotal: order.subtotal,
      shipping: order.shipping,
      discount: order.discount || 0,
      total: order.total,
      paymentMethod: order.payment_method,
      paymentStatus: order.payment_status,
    });

    return new Response(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Aurora-Invoice-${order.order_number}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("Invoice download error:", error);

    return NextResponse.json(
      { error: "Could not generate the invoice PDF." },
      { status: 500 }
    );
  }
}