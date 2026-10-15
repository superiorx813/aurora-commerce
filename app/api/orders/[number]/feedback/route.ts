
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

type RouteContext = {
  params: Promise<{ number: string }>;
};

const answers = {
  overallExperience: [
    "Excellent",
    "Good",
    "Average",
    "Poor",
    "Very Poor",
  ],
  productQuality: [
    "Very Satisfied",
    "Satisfied",
    "Neutral",
    "Dissatisfied",
    "Very Dissatisfied",
  ],
  deliveryExperience: [
    "Very Satisfied",
    "Satisfied",
    "Neutral",
    "Dissatisfied",
    "Very Dissatisfied",
  ],
  packagingQuality: [
    "Excellent",
    "Good",
    "Average",
    "Poor",
    "Very Poor",
  ],
  valueForMoney: [
    "Excellent",
    "Good",
    "Average",
    "Poor",
    "Very Poor",
  ],
};

function normalizeStatus(status: unknown) {
  return String(status ?? "")
    .trim()
    .toUpperCase()
    .replaceAll(" ", "_");
}

async function getOwnedOrder(number: string, userId: string) {
  const [rows] = await db.query(
    `SELECT id, order_number, status
     FROM orders
     WHERE order_number = ? AND user_id = ?
     LIMIT 1`,
    [number, userId]
  );

  return (rows as any[])[0] ?? null;
}

export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const user = await getSession();

    if (!user) {
      return NextResponse.json(
        { message: "Please sign in to continue." },
        { status: 401 }
      );
    }

    const { number } = await context.params;
    const order = await getOwnedOrder(number, String(user.id));

    if (!order) {
      return NextResponse.json(
        { message: "Order not found." },
        { status: 404 }
      );
    }

    const [rows] = await db.query(
      `SELECT id
       FROM order_feedback
       WHERE order_id = ? AND user_id = ?
       LIMIT 1`,
      [String(order.id), String(user.id)]
    );

    return NextResponse.json({
      delivered: normalizeStatus(order.status) === "DELIVERED",
      submitted: (rows as any[]).length > 0,
    });
  } catch (error) {
    console.error("Feedback status error:", error);

    return NextResponse.json(
      { message: "Unable to check feedback status." },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const user = await getSession();

    if (!user) {
      return NextResponse.json(
        { message: "Please sign in to submit feedback." },
        { status: 401 }
      );
    }

    const { number } = await context.params;
    const order = await getOwnedOrder(number, String(user.id));

    if (!order) {
      return NextResponse.json(
        { message: "Order not found." },
        { status: 404 }
      );
    }

    if (normalizeStatus(order.status) !== "DELIVERED") {
      return NextResponse.json(
        { message: "Feedback is available only for delivered orders." },
        { status: 400 }
      );
    }

    const body = await request.json();

    for (const [field, allowedValues] of Object.entries(answers)) {
      if (
        typeof body[field] !== "string" ||
        !(allowedValues as readonly string[]).includes(body[field])
      ) {
        return NextResponse.json(
          { message: "Please answer all five questions using the available options." },
          { status: 400 }
        );
      }
    }

    await db.query(
      `INSERT INTO order_feedback (
        order_id,
        order_number,
        user_id,
        overall_experience,
        product_quality,
        delivery_experience,
        packaging_quality,
        value_for_money
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        String(order.id),
        String(order.order_number),
        String(user.id),
        body.overallExperience,
        body.productQuality,
        body.deliveryExperience,
        body.packagingQuality,
        body.valueForMoney,
      ]
    );

    return NextResponse.json(
      { message: "Thank you! Your feedback has been submitted." },
      { status: 201 }
    );
  } catch (error) {
    const dbError = error as { code?: string };

    if (dbError.code === "ER_DUP_ENTRY") {
      return NextResponse.json(
        { message: "Feedback has already been submitted for this order." },
        { status: 409 }
      );
    }

    console.error("Feedback submission error:", error);

    return NextResponse.json(
      { message: "Unable to submit feedback right now. Please try again." },
      { status: 500 }
    );
  }
}
