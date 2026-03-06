import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { uploadBlob, deleteBlob, isBlobConfigured } from "@/lib/blob";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const source = searchParams.get("source");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { filename: { contains: search, mode: "insensitive" } },
        { alt: { contains: search, mode: "insensitive" } },
        { prompt: { contains: search, mode: "insensitive" } },
      ];
    }
    if (source && (source === "upload" || source === "ai_generated")) {
      where.source = source;
    }

    const [media, total] = await Promise.all([
      prisma.media.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.media.count({ where }),
    ]);

    return NextResponse.json({
      media,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (e) {
    console.error("Failed to fetch media:", e);
    return NextResponse.json({ error: "Failed to fetch media" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!isBlobConfigured()) {
    return NextResponse.json(
      { error: "Upload not configured. Set BLOB_READ_WRITE_TOKEN." },
      { status: 503 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const alt = (formData.get("alt") as string) || "";

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
    }

    const maxSize = 4.5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File too large. Maximum size is 4.5MB, got ${(file.size / 1024 / 1024).toFixed(2)}MB` },
        { status: 400 }
      );
    }

    const ext = file.name.split(".").pop() || "png";
    const pathname = `media/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;

    console.log(`Uploading file: ${file.name}, size: ${file.size}, type: ${file.type}`);
    
    const { url } = await uploadBlob(pathname, file, {
      contentType: file.type,
    });

    console.log(`Upload successful: ${url}`);

    const media = await prisma.media.create({
      data: {
        url,
        filename: file.name,
        mimeType: file.type,
        size: file.size,
        alt: alt || null,
        source: "upload",
      },
    });

    return NextResponse.json({ media });
  } catch (e) {
    console.error("Failed to upload media:", e);
    const errorMessage = e instanceof Error ? e.message : "Upload failed";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const media = await prisma.media.findUnique({ where: { id } });
    if (!media) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    await deleteBlob(media.url);
    await prisma.media.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Failed to delete media:", e);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
