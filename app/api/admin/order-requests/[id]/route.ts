import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

type Action = "APPROVE" | "REJECT";

export async function PATCH(
  req: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  const user = await getSession();

  /* =========================================================
     ADMIN AUTHENTICATION
  ========================================================= */

  if (!user) {
    return NextResponse.json(
      {
        error: "Unauthorized",
      },
      {
        status: 401,
      }
    );
  }

  if (user.role !== "ADMIN") {
    return NextResponse.json(
      {
        error: "Admin access required.",
      },
      {
        status: 403,
      }
    );
  }

  /* =========================================================
     REQUEST ID
  ========================================================= */

  const { id } = await context.params;

  const requestId = Number(id);

  if (!Number.isInteger(requestId) || requestId <= 0) {
    return NextResponse.json(
      {
        error: "Invalid request ID.",
      },
      {
        status: 400,
      }
    );
  }

  /* =========================================================
     REQUEST BODY
  ========================================================= */

  let body: {
    action?: Action;
    adminNote?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      {
        error: "Invalid request body.",
      },
      {
        status: 400,
      }
    );
  }

  const action = body.action;
  const adminNote =
    typeof body.adminNote === "string"
      ? body.adminNote.trim()
      : "";

  if (action !== "APPROVE" && action !== "REJECT") {
    return NextResponse.json(
      {
        error: "Invalid action.",
      },
      {
        status: 400,
      }
    );
  }

  /* =========================================================
     DATABASE TRANSACTION
  ========================================================= */

  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    /* -------------------------------------------------------
       Get request + order
    ------------------------------------------------------- */

    const [rows] = await conn.query(
      `
      SELECT
        r.id,
        r.order_id,
        r.request_type,
        r.reason,
        r.details,
        r.refund_amount,
        r.replacement_details,
        r.status AS request_status,

        o.order_number,
        o.total,
        o.status AS order_status,
        o.payment_status

      FROM order_requests r

      INNER JOIN orders o
        ON o.id = r.order_id

      WHERE r.id=?

      LIMIT 1
      `,
      [requestId]
    );

    const request = (rows as any[])[0];

    if (!request) {
      await conn.rollback();

      return NextResponse.json(
        {
          error: "Order request not found.",
        },
        {
          status: 404,
        }
      );
    }

    /* -------------------------------------------------------
       Prevent duplicate processing
    ------------------------------------------------------- */

    if (request.request_status !== "PENDING") {
      await conn.rollback();

      return NextResponse.json(
        {
          error: `This request has already been ${request.request_status.toLowerCase()}.`,
        },
        {
          status: 400,
        }
      );
    }

    /* =======================================================
       REJECT
    ======================================================= */

    if (action === "REJECT") {
      await conn.execute(
        `
        UPDATE order_requests
        SET
          status='REJECTED',
          admin_note=?
        WHERE id=?
        `,
        [
          adminNote || null,
          requestId,
        ]
      );

      await conn.commit();

      return NextResponse.json({
        success: true,
        message:
          "The customer request has been rejected.",
        requestStatus: "REJECTED",
      });
    }

    /* =======================================================
       APPROVE
    ======================================================= */

    /* -------------------------------------------------------
       CANCELLATION
    ------------------------------------------------------- */

    if (request.request_type === "CANCELLATION") {
      if (request.order_status === "CANCELLED") {
        await conn.rollback();

        return NextResponse.json(
          {
            error: "This order is already cancelled.",
          },
          {
            status: 400,
          }
        );
      }

      if (request.order_status === "DELIVERED") {
        await conn.rollback();

        return NextResponse.json(
          {
            error:
              "A delivered order cannot be cancelled.",
          },
          {
            status: 400,
          }
        );
      }

      await conn.execute(
        `
        UPDATE orders
        SET
          status='CANCELLED'
        WHERE id=?
        `,
        [request.order_id]
      );

      await conn.execute(
        `
        UPDATE order_requests
        SET
          status='APPROVED',
          admin_note=?
        WHERE id=?
        `,
        [
          adminNote || null,
          requestId,
        ]
      );
    }

    /* -------------------------------------------------------
       REFUND
    ------------------------------------------------------- */

    else if (request.request_type === "REFUND") {
      const refundAmount =
        request.refund_amount !== null
          ? Number(request.refund_amount)
          : Number(request.total);

      if (
        !Number.isFinite(refundAmount) ||
        refundAmount <= 0
      ) {
        await conn.rollback();

        return NextResponse.json(
          {
            error: "Invalid refund amount.",
          },
          {
            status: 400,
          }
        );
      }

      if (refundAmount > Number(request.total)) {
        await conn.rollback();

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

      await conn.execute(
        `
        UPDATE orders
        SET
          payment_status='REFUNDED'
        WHERE id=?
        `,
        [request.order_id]
      );

      await conn.execute(
        `
        UPDATE order_requests
        SET
          status='APPROVED',
          refund_amount=?,
          admin_note=?
        WHERE id=?
        `,
        [
          refundAmount,
          adminNote || null,
          requestId,
        ]
      );
    }

    /* -------------------------------------------------------
       REPLACEMENT
    ------------------------------------------------------- */

    else if (request.request_type === "REPLACEMENT") {
      await conn.execute(
        `
        UPDATE order_requests
        SET
          status='APPROVED',
          admin_note=?
        WHERE id=?
        `,
        [
          adminNote || null,
          requestId,
        ]
      );
    }

    /* -------------------------------------------------------
       Unknown request type
    ------------------------------------------------------- */

    else {
      await conn.rollback();

      return NextResponse.json(
        {
          error: "Unsupported request type.",
        },
        {
          status: 400,
        }
      );
    }

    await conn.commit();

    return NextResponse.json({
      success: true,
      message:
        "The customer request has been approved successfully.",
      requestStatus: "APPROVED",
      requestType: request.request_type,
      orderNumber: request.order_number,
    });
  } catch (error: any) {
    await conn.rollback();

    console.error(
      "Admin order request action error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Could not process the request.",
      },
      {
        status: 500,
      }
    );
  } finally {
    conn.release();
  }
}