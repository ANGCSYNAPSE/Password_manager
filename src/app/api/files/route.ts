import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createVaultFile, getCredentialCounts, listVaultFiles } from "@/lib/db";
import type { VaultFileInput } from "@/lib/types";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [files, counts] = await Promise.all([listVaultFiles(), getCredentialCounts()]);
  return NextResponse.json({ files, ...counts });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as VaultFileInput;

    if (!body.name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const file = await createVaultFile(body);
    return NextResponse.json({ file }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create file" }, { status: 500 });
  }
}
