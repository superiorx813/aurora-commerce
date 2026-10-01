
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";


/* =========================================================
   GET ADMIN ORDER REQUESTS
   ========================================================= */

export async function GET() {
  try {
    const user = await getSession();

    /* -------------------------------------------------------
       ADMIN AUTHENTICATION
       ------------------------------------------------------- */

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

    if (user.role !== "ADMIN") {
      return NextResponse.json(
        {
          error: "Admin access required."
        },
        {
          status: 403
        }
      );
    }


    /* -------------------------------------------------------
       GET ORDER REQUESTS
       ------------------------------------------------------- */

    const [rows] = await db.query(
      `
      SELECT
        r.id,
        r.order_id,
        r.user_id,
        r.request_type,
        r.reason,
        r.details,
        r.refund_amount,
        r.replacement_details,
        r.status,
        r.admin_note,
        r.created_at,
        r.updated_at,

        o.order_number,
        o.total AS order_total,
        o.status AS order_status,
        o.payment_status,
        o.payment_method,

        u.name AS customer_name,
        u.email AS customer_email

      FROM order_requests r

      INNER JOIN orders o
        ON o.id = r.order_id

      INNER JOIN users u
        ON u.id = r.user_id

      ORDER BY
        CASE
          WHEN r.status = 'PENDING' THEN 0
          WHEN r.status = 'APPROVED' THEN 1
          WHEN r.status = 'COMPLETED' THEN 2
          WHEN r.status = 'REJECTED' THEN 3
          ELSE 4
        END,
        r.created_at DESC
      `
    );

    return NextResponse.json({
      requests: rows
    });

  } catch (error: any) {
    console.error(
      "Admin order requests error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error.message ||
          "Could not load order requests."
      },
      {
        status: 500
      }
    );
  }
}
