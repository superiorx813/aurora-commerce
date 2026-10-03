import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { generateInvoice } from "@/lib/invoice/generateInvoice";
import { sendInvoiceEmail } from "@/lib/mail/sendInvoiceEmail";

export async function POST(req: Request) {
  const user = await getSession();

  if (!user) {
    return NextResponse.json(
      { error: "Please sign in before checkout." },
      { status: 401 }
    );
  }

  const body = await req.json();
  const { items, address, paymentMethod = "DEMO" } = body;

  if (!Array.isArray(items) || !items.length) {
    return NextResponse.json(
      { error: "Cart is empty." },
      { status: 400 }
    );
  }

  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    const [existing] = await conn.query(
      `
      SELECT id
      FROM addresses
      WHERE user_id=?
        AND full_name=?
        AND line1=?
        AND postal_code=?
      LIMIT 1
      `,
      [
        user.id,
        address.fullName,
        address.line1,
        address.postalCode
      ]
    );

    let addressId = (existing as any[])[0]?.id;

    if (!addressId) {
      const [a] = await conn.execute(
        `
        INSERT INTO addresses
        (
          user_id,
          full_name,
          phone,
          line1,
          line2,
          city,
          state,
          postal_code
        )
        VALUES (?,?,?,?,?,?,?,?)
        `,
        [
          user.id,
          address.fullName,
          address.phone,
          address.line1,
          address.line2 || null,
          address.city,
          address.state,
          address.postalCode
        ]
      );

      addressId = (a as any).insertId;
    }

    let subtotal = 0;
    const verified: any[] = [];

    for (const item of items) {
      const [rows] = await conn.query(
        `
        SELECT
          id,
          name,
          price,
          stock,
          image_url
        FROM products
        WHERE id=?
        FOR UPDATE
        `,
        [item.id]
      );

      const p = (rows as any[])[0];

      if (!p) {
        throw new Error("Product not found");
      }

      if (p.stock < item.quantity) {
        throw new Error(`${p.name} is out of stock`);
      }

      subtotal +=
        Number(p.price) * Number(item.quantity);

      verified.push({
        ...p,
        quantity: Number(item.quantity)
      });
    }

    const shipping = subtotal >= 999 ? 0 : 99;
    const total = subtotal + shipping;

    const orderNumber =
      "AUR-" +
      Date.now().toString(36).toUpperCase();

    const [o] = await conn.execute(
      `
      INSERT INTO orders
      (
        user_id,
        address_id,
        order_number,
        subtotal,
        shipping,
        total,
        payment_method,
        payment_status
      )
      VALUES (?,?,?,?,?,?,?,?)
      `,
      [
        user.id,
        addressId,
        orderNumber,
        subtotal,
        shipping,
        total,
        paymentMethod,
        paymentMethod === "DEMO" || paymentMethod === "COD"
          ? "PAID"
          : "PENDING"
      ]
    );

    const orderId = (o as any).insertId;

    for (const p of verified) {
      await conn.execute(
        `
        INSERT INTO order_items
        (
          order_id,
          product_id,
          product_name,
          quantity,
          unit_price,
          image_url
        )
        VALUES (?,?,?,?,?,?)
        `,
        [
          orderId,
          p.id,
          p.name,
          p.quantity,
          p.price,
          p.image_url
        ]
      );

      await conn.execute(
        "UPDATE products SET stock=stock-? WHERE id=?",
        [
          p.quantity,
          p.id
        ]
      );
    }

    
await conn.commit();

// The order is now safely committed. Release the connection
// before generating the PDF or communicating with Gmail.


try {
  const [invoiceRows] = await db.query(
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

    WHERE o.id = ? AND o.user_id = ?
    LIMIT 1
    `,
    [orderId, user.id]
  );

  const invoiceOrder = (invoiceRows as any[])[0];

  if (!invoiceOrder?.customer_email) {
    throw new Error("Customer email was not found for this order.");
  }

  const [invoiceItemRows] = await db.query(
    `
    SELECT product_name, quantity, unit_price
    FROM order_items
    WHERE order_id = ?
    ORDER BY id ASC
    `,
    [orderId]
  );

  const invoiceItems = invoiceItemRows as any[];

  const pdf = await generateInvoice({
    orderNumber: invoiceOrder.order_number,
    orderDate: invoiceOrder.created_at,
    customerName:
      invoiceOrder.customer_name ||
      invoiceOrder.address_name ||
      "Customer",
    customerEmail: invoiceOrder.customer_email,
    phone: invoiceOrder.address_phone,
    address: {
      line1: invoiceOrder.line1 || "",
      line2: invoiceOrder.line2,
      city: invoiceOrder.city || "",
      state: invoiceOrder.state || "",
      postalCode: invoiceOrder.postal_code || "",
    },
    items: invoiceItems,
    subtotal: invoiceOrder.subtotal,
    shipping: invoiceOrder.shipping,
    discount: invoiceOrder.discount || 0,
    total: invoiceOrder.total,
    paymentMethod: invoiceOrder.payment_method,
    paymentStatus: invoiceOrder.payment_status,
  });

  await sendInvoiceEmail({
    to: invoiceOrder.customer_email,
    customerName:
      invoiceOrder.customer_name ||
      invoiceOrder.address_name ||
      "Customer",
    orderNumber: invoiceOrder.order_number,
    pdf,
  });

  console.info(`Invoice emailed for order ${orderNumber}`);
} catch (emailError) {
  // Never undo a successfully placed order because of an email failure.
  console.error(
    `Order ${orderNumber} was placed, but invoice email failed:`,
    emailError
  );
}

return NextResponse.json({
  orderNumber,
  message: "Order placed successfully. Invoice email processing completed.",
});

  } catch (e: any) {
    await conn.rollback();

    return NextResponse.json(
      {
        error:
          e.message ||
          "Could not place order."
      },
      {
        status: 400
      }
    );
  } finally {
    conn.release();
  }
}


/* =========================================================
   GET CUSTOMER ORDERS
   ========================================================= */

export async function GET() {
  const user = await getSession();

  if (!user) {
    return NextResponse.json(
      {
        error: "Unauthorized"
      },
      {
        status: 401
      }
    );
  }

  /* -------------------------------------------------------
     Get orders
     ------------------------------------------------------- */

  const [orderRows] = await db.query(
    `
    SELECT
      id,
      order_number,
      subtotal,
      shipping,
      total,
      payment_method,
      payment_status,
      status,
      created_at
    FROM orders
    WHERE user_id=?
    ORDER BY created_at DESC
    `,
    [user.id]
  );

  const orders = orderRows as any[];

  if (!orders.length) {
    return NextResponse.json({
      orders: []
    });
  }

  /* -------------------------------------------------------
     Get order items
     ------------------------------------------------------- */

  const orderIds = orders.map(
    (order) => order.id
  );

  const placeholders = orderIds
    .map(() => "?")
    .join(",");

  const [itemRows] = await db.query(
    `
    SELECT
      id,
      order_id,
      product_id,
      product_name,
      quantity,
      unit_price,
      image_url
    FROM order_items
    WHERE order_id IN (${placeholders})
    ORDER BY id ASC
    `,
    orderIds
  );

  const items = itemRows as any[];

  /* -------------------------------------------------------
     Attach items to their orders
     ------------------------------------------------------- */

  const itemsByOrder = new Map<number, any[]>();

  for (const item of items) {
    const existing =
      itemsByOrder.get(item.order_id) || [];

    existing.push(item);

    itemsByOrder.set(
      item.order_id,
      existing
    );
  }

  /* -------------------------------------------------------
   Get customer order requests
------------------------------------------------------- */

const requestOrderIds = orders.map(
  (order) => order.id
);

let requestRows: any[] = [];

if (requestOrderIds.length) {
  const requestPlaceholders =
    requestOrderIds.map(() => "?").join(",");

  const [rows] = await db.query(
    `
    SELECT
      id,
      order_id,
      request_type,
      reason,
      details,
      refund_amount,
      replacement_details,
      status,
      admin_note,
      created_at,
      updated_at
    FROM order_requests
    WHERE user_id=?
      AND order_id IN (${requestPlaceholders})
    ORDER BY created_at DESC
    `,
    [
      user.id,
      ...requestOrderIds
    ]
  );

  requestRows = rows as any[];
}

/* -------------------------------------------------------
   Map requests to orders
------------------------------------------------------- */

const requestsByOrder = new Map<
  number,
  any
>();

for (const request of requestRows) {
  if (!requestsByOrder.has(request.order_id)) {
    requestsByOrder.set(
      request.order_id,
      request
    );
  }
}

/* -------------------------------------------------------
   Final response
------------------------------------------------------- */

const result = orders.map((order) => ({
  ...order,

  items:
    itemsByOrder.get(order.id) || [],

  request:
    requestsByOrder.get(order.id) || null
}));

return NextResponse.json({
  orders: result
});}