import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getSession();

    return NextResponse.json(
      {
        user,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("Failed to get session:", error);

    return NextResponse.json(
      {
        user: null,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  }
}