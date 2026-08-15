import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req:Request){
 const {searchParams}=new URL(req.url); const ids=searchParams.get("ids");
 if(!ids) return NextResponse.json({products:[]});
 const clean=ids.split(",").map(Number).filter(Boolean);
 if(!clean.length) return NextResponse.json({products:[]});
 const placeholders=clean.map(()=>"?").join(",");
 const [rows]=await db.query(`SELECT p.*,c.name category_name,c.slug category_slug FROM products p LEFT JOIN categories c ON c.id=p.category_id WHERE p.id IN (${placeholders})`,clean);
 return NextResponse.json({products:rows});
}
