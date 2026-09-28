import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    const subject = String(body.subject ?? "").trim();
    const message = String(body.message ?? "").trim();

    if (!name) {
      return NextResponse.json(
        { success: false, message: "Name is required." },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email is required." },
        { status: 400 }
      );
    }

    if (!subject) {
      return NextResponse.json(
        { success: false, message: "Subject is required." },
        { status: 400 }
      );
    }

    if (!message) {
      return NextResponse.json(
        { success: false, message: "Message is required." },
        { status: 400 }
      );
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      return NextResponse.json(
        { success: false, message: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    if (name.length > 120) {
      return NextResponse.json(
        { success: false, message: "Name is too long." },
        { status: 400 }
      );
    }

    if (subject.length > 200) {
      return NextResponse.json(
        { success: false, message: "Subject is too long." },
        { status: 400 }
      );
    }

    if (message.length > 5000) {
      return NextResponse.json(
        { success: false, message: "Message is too long." },
        { status: 400 }
      );
    }

    await db.execute(
      `
        INSERT INTO customer_messages
          (name, email, phone, subject, message)
        VALUES
          (?, ?, ?, ?, ?)
      `,
      [name, email, phone || null, subject, message]
    );

    return NextResponse.json(
      {
        success: true,
        message: "Your message has been submitted successfully.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Customer Care API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to submit your message. Please try again.",
      },
      { status: 500 }
    );
  }
}