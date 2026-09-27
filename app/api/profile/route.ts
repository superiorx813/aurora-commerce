import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

/*
 * GET PROFILE
 *
 * Returns the currently logged-in user's profile.
 */
export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        {
          error: "You are not logged in.",
        },
        {
          status: 401,
        }
      );
    }

    const [rows] = await db.query(
      `
        SELECT
          id,
          name,
          email,
          role
        FROM users
        WHERE id = ?
        LIMIT 1
      `,
      [session.id]
    );

    const user = (rows as any[])[0];

    if (!user) {
      return NextResponse.json(
        {
          error: "User profile not found.",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json(
      {
        user: {
          id: Number(user.id),
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error(
      "Profile GET error:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to load profile.",
      },
      {
        status: 500,
      }
    );
  }
}

/*
 * UPDATE PROFILE
 *
 * Currently allows changing:
 * - Name
 * - Email
 *
 * Role/password are intentionally NOT editable
 * from this endpoint.
 */
export async function PATCH(req: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        {
          error: "You are not logged in.",
        },
        {
          status: 401,
        }
      );
    }

    const body = await req.json();

    const name = String(
      body.name ?? ""
    ).trim();

    const email = String(
      body.email ?? ""
    )
      .trim()
      .toLowerCase();

    if (!name) {
      return NextResponse.json(
        {
          error: "Name is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!email) {
      return NextResponse.json(
        {
          error: "Email is required.",
        },
        {
          status: 400,
        }
      );
    }

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      return NextResponse.json(
        {
          error: "Please enter a valid email address.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Check whether another account already
     * uses this email address.
     */
    const [existingRows] =
      await db.query(
        `
          SELECT id
          FROM users
          WHERE email = ?
            AND id <> ?
          LIMIT 1
        `,
        [
          email,
          session.id,
        ]
      );

    const existingUser =
      (existingRows as any[])[0];

    if (existingUser) {
      return NextResponse.json(
        {
          error:
            "This email address is already in use.",
        },
        {
          status: 409,
        }
      );
    }

    await db.query(
      `
        UPDATE users
        SET
          name = ?,
          email = ?
        WHERE id = ?
      `,
      [
        name,
        email,
        session.id,
      ]
    );

    /*
     * Update the session as well, so the
     * Header immediately uses the new
     * name/email.
     *
     * Importing createSession here would
     * require replacing the old session.
     */
    const { createSession } =
      await import("@/lib/auth");

    await createSession({
      id: session.id,
      name,
      email,
      role: session.role,
    });

    return NextResponse.json(
      {
        ok: true,
        user: {
          id: session.id,
          name,
          email,
          role: session.role,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Profile PATCH error:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to update profile.",
      },
      {
        status: 500,
      }
    );
  }
}