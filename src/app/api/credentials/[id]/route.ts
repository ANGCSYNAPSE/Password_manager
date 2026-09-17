import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  deleteCredential,
  getCredential,
  updateCredential,
  verifyApiToken,
} from "@/lib/db";
import type { CredentialInput } from "@/lib/types";

async function authorize(request: NextRequest): Promise<boolean> {
  const session = await getSession();
  if (session) return true;

  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return verifyApiToken(authHeader.slice(7));
  }

  return false;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await authorize(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const credential = getCredential(id);

  if (!credential) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ credential });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await authorize(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = (await request.json()) as CredentialInput;
    const credential = updateCredential(id, body);

    if (!credential) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ credential });
  } catch {
    return NextResponse.json(
      { error: "Failed to update credential" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await authorize(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = getCredential(id);

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  deleteCredential(id);
  return NextResponse.json({ success: true });
}
