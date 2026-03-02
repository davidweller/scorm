import { NextResponse } from "next/server";
import { hasOpenAIKey, setOpenAIKey } from "@/lib/db/settings";

export async function GET() {
  try {
    const hasKey = await hasOpenAIKey();
    return NextResponse.json({ hasOpenAI: hasKey });
  } catch (e) {
    console.error("GET /api/settings/keys", e);
    return NextResponse.json(
      { error: "Failed to read settings" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const key = typeof body.openaiKey === "string" ? body.openaiKey : null;
    await setOpenAIKey(key === "" ? null : key);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("POST /api/settings/keys", e);
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 }
    );
  }
}
