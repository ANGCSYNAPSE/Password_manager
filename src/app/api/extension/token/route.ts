import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createApiToken } from "@/lib/db";
import { randomBytes } from "crypto";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const name = String(body.name || "Browser Extension").trim();
    const rawToken = randomBytes(32).toString("hex");
    const record = await createApiToken(name, rawToken);

    return NextResponse.json({
      token: rawToken,
      id: record.id,
      name: record.name,
      message: "Save this token now — it won't be shown again.",
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to create token" },
      { status: 500 },
    );
  }
}
