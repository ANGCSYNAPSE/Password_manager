import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/auth";
import { verifyAdmin } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const username = String(body.username || "").trim();
    const password = String(body.password || "");

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 },
      );
    }

    const isValid = await verifyAdmin(username, password);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    await createSession(username);
    return NextResponse.json({ success: true, username });
  } catch {
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
