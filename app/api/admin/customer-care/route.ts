import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const allowedStatuses = ["NEW", "READ", "RESOLVED"] as const;

type CustomerMessageStatus = (typeof allowedStatuses)[number];

function isValidStatus(value: string): value is CustomerMessageStatus {
  return allowedStatuses.includes(value as CustomerMessageStatus);
}

export async function GET(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    if (session.role !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden.",
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search")?.trim() || "";
    const status = searchParams.get("status")?.trim().toUpperCase() || "ALL";

    let query = `
      SELECT
        id,
        name,
        email,
        phone,
        subject,
        message,
        status,
        created_at,
        updated_at
      FROM customer_messages
    `;

    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (search) {
      conditions.push(`
        (
          name LIKE ?
          OR email LIKE ?
          OR phone LIKE ?
          OR subject LIKE ?
          OR message LIKE ?
        )
      `);

      const searchValue = `%${search}%`;

      params.push(
        searchValue,
        searchValue,
        searchValue,
        searchValue,
        searchValue
      );
    }

    if (status !== "ALL") {
      if (!isValidStatus(status)) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid status.",
          },
          { status: 400 }
        );
      }

      conditions.push("status = ?");
      params.push(status);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(" AND ")}`;
    }

    query += `
      ORDER BY
        CASE status
          WHEN 'NEW' THEN 1
          WHEN 'READ' THEN 2
          WHEN 'RESOLVED' THEN 3
          ELSE 4
        END,
        created_at DESC
    `;

    const [rows] = await db.execute(query, params);

    const [statsRows] = await db.execute(`
      SELECT
        COUNT(*) AS total,
        SUM(status = 'NEW') AS new_count,
        SUM(status = 'READ') AS read_count,
        SUM(status = 'RESOLVED') AS resolved_count
      FROM customer_messages
    `);

    const stats = (statsRows as Array<{
      total: number | string;
      new_count: number | string;
      read_count: number | string;
      resolved_count: number | string;
    }>)[0];

    return NextResponse.json({
      success: true,
      messages: rows,
      stats: {
        total: Number(stats?.total || 0),
        new: Number(stats?.new_count || 0),
        read: Number(stats?.read_count || 0),
        resolved: Number(stats?.resolved_count || 0),
      },
    });
  } catch (error) {
    console.error("Admin Customer Care GET error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load customer messages.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status: 401 }
      );
    }

    if (session.role !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          message: "Forbidden.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    const id = Number(body.id);
    const status = String(body.status ?? "")
      .trim()
      .toUpperCase();

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Valid message ID is required.",
        },
        { status: 400 }
      );
    }

    if (!isValidStatus(status)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid status.",
        },
        { status: 400 }
      );
    }

    const [result] = await db.execute(
      `
        UPDATE customer_messages
        SET status = ?
        WHERE id = ?
      `,
      [status, id]
    );

    const affectedRows = Number(
      (result as { affectedRows?: number }).affectedRows || 0
    );

    if (affectedRows === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Customer message not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Message status updated successfully.",
      status,
    });
  } catch (error) {
    console.error("Admin Customer Care PATCH error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to update message status.",
      },
      { status: 500 }
    );
  }
}