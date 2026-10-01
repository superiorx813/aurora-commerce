import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  const user = await getSession();

  if (!user) {
    return NextResponse.json(
      {
        error: "Please sign in before submitting a request.",
      },
      {
        status: 401,
      }
    );
  }

  try {
    const body = await req.json();

    const {
      orderId,
      requestType,
      reason,
      details,
      refundAmount,
      replacementDetails,
    } = body;

    if (!orderId) {
      return NextResponse.json(
        {
          error: "Order is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      ![
        "CANCELLATION",
        "REFUND",
        "REPLACEMENT",
      ].includes(requestType)
    ) {
      return NextResponse.json(
        {
          error: "Invalid request type.",
        },
        {
          status: 400,
        }
      );
    }

    if (!reason?.trim()) {
      return NextResponse.json(
        {
          error: "Please provide a reason.",
        },
        {
          status: 400,
        }
      );
    }

    /* -----------------------------------------------
       Verify order belongs to logged-in customer
    ------------------------------------------------ */

    const [orderRows] = await db.query(
      `
      SELECT
        id,
        order_number,
        total,
        status,
        payment_status
      FROM orders
      WHERE id=?
        AND user_id=?
      LIMIT 1
      `,
      [
        orderId,
        user.id,
      ]
    );

    const order = (orderRows as any[])[0];

    if (!order) {
      return NextResponse.json(
        {
          error: "Order not found.",
        },
        {
          status: 404,
        }
      );
    }

    /* -----------------------------------------------
       Prevent requests on cancelled orders
    ------------------------------------------------ */

    if (order.status === "CANCELLED") {
      return NextResponse.json(
        {
          error:
            "A request cannot be submitted for a cancelled order.",
        },
        {
          status: 400,
        }
      );
    }

    /* -----------------------------------------------
       Check existing pending request
    ------------------------------------------------ */

    const [existingRows] = await db.query(
      `
      SELECT id
      FROM order_requests
      WHERE order_id=?
        AND user_id=?
        AND status='PENDING'
      LIMIT 1
      `,
      [
        order.id,
        user.id,
      ]
    );

    if ((existingRows as any[]).length) {
      return NextResponse.json(
        {
          error:
            "You already have a pending request for this order.",
        },
        {
          status: 400,
        }
      );
    }

    /* -----------------------------------------------
       Validate request-specific fields
    ------------------------------------------------ */

    let finalRefundAmount = null;
    let finalReplacementDetails = null;

    if (requestType === "REFUND") {
      finalRefundAmount =
        refundAmount !== undefined &&
        refundAmount !== null &&
        refundAmount !== ""
          ? Number(refundAmount)
          : Number(order.total);

      if (
        Number.isNaN(finalRefundAmount) ||
        finalRefundAmount <= 0
      ) {
        return NextResponse.json(
          {
            error: "Invalid refund amount.",
          },
          {
            status: 400,
          }
        );
      }

      if (finalRefundAmount > Number(order.total)) {
        return NextResponse.json(
          {
            error:
              "Refund amount cannot exceed the order total.",
          },
          {
            status: 400,
          }
        );
      }
    }

    if (requestType === "REPLACEMENT") {
      if (!replacementDetails?.trim()) {
        return NextResponse.json(
          {
            error:
              "Please provide replacement details.",
          },
          {
            status: 400,
          }
        );
      }

      finalReplacementDetails =
        replacementDetails.trim();
    }

    /* -----------------------------------------------
       Create request
    ------------------------------------------------ */

    await db.execute(
      `
      INSERT INTO order_requests
      (
        order_id,
        user_id,
        request_type,
        reason,
        details,
        refund_amount,
        replacement_details
      )
      VALUES (?,?,?,?,?,?,?)
      `,
      [
        order.id,
        user.id,
        requestType,
        reason.trim(),
        details?.trim() || null,
        finalRefundAmount,
        finalReplacementDetails,
      ]
    );

    return NextResponse.json({
      success: true,
      message:
        "Your request has been submitted successfully. Please wait for approval.",
    });
  } catch (error: any) {
    console.error(
      "Order request error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error.message ||
          "Could not submit your request.",
      },
      {
        status: 500,
      }
    );
  }
}