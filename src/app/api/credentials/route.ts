import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createCredential, listCredentials, verifyApiToken } from "@/lib/db";
import type { CredentialInput } from "@/lib/types";

async function authorize(request: NextRequest): Promise<boolean> {
  const session = await getSession();
  if (session) return true;

  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    return await verifyApiToken(token);
  }

  return false;
}

export async function GET(request: NextRequest) {
  if (!(await authorize(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const credentials = await listCredentials({
    platform: searchParams.get("platform") || undefined,
    credential_type: searchParams.get("type") || undefined,
    search: searchParams.get("search") || undefined,
  });

  return NextResponse.json({ credentials });
}

export async function POST(request: NextRequest) {
  if (!(await authorize(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as CredentialInput;

    if (!body.platform || !body.credential_type || !body.password) {
      return NextResponse.json(
        { error: "Platform, type, and password are required" },
        { status: 400 },
      );
    }

    const credential = await createCredential(body);
    return NextResponse.json({ credential }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create credential" },
      { status: 500 },
    );
  }
}
