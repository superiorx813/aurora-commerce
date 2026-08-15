import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth";

export async function POST(req:Request){
  try{
    const {email,password}=await req.json();
    const [rows]=await db.query("SELECT id,name,email,password_hash,role FROM users WHERE email=? LIMIT 1",[email?.toLowerCase()]);
    const user=(rows as any[])[0];
    if(!user || !(await bcrypt.compare(password,user.password_hash))) return NextResponse.json({error:"Invalid email or password."},{status:401});
    await createSession({id:Number(user.id),name:user.name,email:user.email,role:user.role});
    return NextResponse.json({user:{id:user.id,name:user.name,email:user.email,role:user.role}});
  }catch{return NextResponse.json({error:"Login failed."},{status:500});}
}
