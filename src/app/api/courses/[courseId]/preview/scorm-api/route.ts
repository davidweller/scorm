import { NextResponse } from "next/server";
import { SCORM_API_JS } from "@/lib/scorm/scorm-api-js";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  await params; // ensure route is bound
  return new NextResponse(SCORM_API_JS, {
    status: 200,
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
