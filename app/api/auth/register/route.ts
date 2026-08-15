import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const {name,email,password}=await req.json();
    if(!name||!email||!password||password.length<6) return NextResponse.json({error:"Name, email and 6+ character password are required."},{status:400});
    const [existing]=await db.query("SELECT id FROM users WHERE email=? LIMIT 1",[email.toLowerCase()]);
    if((existing as any[]).length) return NextResponse.json({error:"Email already registered."},{status:409});
    const hash=await bcrypt.hash(password,12);
    const [r]=await db.execute("INSERT INTO users(name,email,password_hash) VALUES(?,?,?)",[name,email.toLowerCase(),hash]);
    const user={id:Number((r as any).insertId),name,email:email.toLowerCase(),role:"CUSTOMER" as const};
    await createSession(user); return NextResponse.json({user});
  } catch { return NextResponse.json({error:"Registration failed."},{status:500});}
}
