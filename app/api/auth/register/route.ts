import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

function normalizeMobileNumber(value: unknown) {
  return String(value ?? "")
    .trim()
    .replace(/[\s()-]/g, "");
}

function isValidMobileNumber(value: string) {
  return /^\+?[1-9]\d{9,14}$/.test(value);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    const mobileNumber = normalizeMobileNumber(
      body.mobileNumber
    );

    const whatsappOptIn = Boolean(body.whatsappOptIn);
    const smsOptIn = Boolean(body.smsOptIn);

    if (!name) {
      return NextResponse.json(
        { error: "Name is required." },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { error: "Email is required." },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        {
          error:
            "Password must be at least 6 characters.",
        },
        { status: 400 }
      );
    }

    if (!mobileNumber) {
      return NextResponse.json(
        { error: "Mobile number is required." },
        { status: 400 }
      );
    }

    if (!isValidMobileNumber(mobileNumber)) {
      return NextResponse.json(
        { error: "Please enter a valid mobile number." },
        { status: 400 }
      );
    }

    const [existingRows]: any = await db.execute(
      `SELECT id, email, mobile_number
       FROM users
       WHERE email = ?
          OR mobile_number = ?
       LIMIT 1`,
      [email, mobileNumber]
    );

    if (existingRows.length > 0) {
      const existing = existingRows[0];

      if (
        String(existing.email).toLowerCase() === email
      ) {
        return NextResponse.json(
          { error: "An account with this email already exists." },
          { status: 409 }
        );
      }

      return NextResponse.json(
        {
          error:
            "An account with this mobile number already exists.",
        },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [result]: any = await db.execute(
      `INSERT INTO users (
         name,
         email,
         mobile_number,
         whatsapp_opt_in,
         sms_opt_in,
         password_hash,
         role
       )
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        email,
        mobileNumber,
        whatsappOptIn ? 1 : 0,
        smsOptIn ? 1 : 0,
        passwordHash,
        "CUSTOMER",
      ]
    );

    return NextResponse.json(
      {
        success: true,
        message: "Registration successful.",
        userId: result.insertId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);

    return NextResponse.json(
      {
        error: "Unable to create your account.",
      },
      { status: 500 }
    );
  }
}