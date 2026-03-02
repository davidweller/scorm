import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const UPLOADS_DIR = path.join(process.cwd(), ".data", "uploads");

const SAFE_FILE = /^[a-zA-Z0-9._-]+\.(png|jpg|jpeg|webp)$/;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ file: string }> }
) {
  const { file } = await params;
  if (!SAFE_FILE.test(file)) {
    return NextResponse.json({ error: "Invalid file" }, { status: 400 });
  }
  const filePath = path.join(UPLOADS_DIR, file);
  try {
    const buf = await fs.readFile(filePath);
    const ext = path.extname(file).toLowerCase();
    const mime = ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";
    return new NextResponse(buf, {
      headers: { "Content-Type": mime },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
