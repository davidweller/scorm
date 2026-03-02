import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { getCourseById } from "@/lib/db/store";
import { getModuleById, updateModule } from "@/lib/db/course-data";
import { getBranding } from "@/lib/db/course-data";
import { getOpenAIKey } from "@/lib/db/settings";
import OpenAI from "openai";

const UPLOADS_DIR = path.join(process.cwd(), ".data", "uploads");

const STYLE_PRESETS: Record<string, string> = {
  professional: "professional corporate style, clean and modern",
  illustration: "friendly illustration style, flat design",
  photo: "realistic photograph style, high quality",
  minimal: "minimalist, simple shapes and colours",
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ courseId: string; moduleId: string }> }
) {
  const { courseId, moduleId } = await params;
  const course = await getCourseById(courseId);
  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }
  const mod = await getModuleById(courseId, moduleId);
  if (!mod) {
    return NextResponse.json({ error: "Module not found" }, { status: 404 });
  }
  const apiKey = await getOpenAIKey();
  if (!apiKey) {
    return NextResponse.json(
      { error: "OpenAI API key not set. Add one in Settings." },
      { status: 400 }
    );
  }
  try {
    const body = await request.json().catch(() => ({}));
    const stylePreset = (body.stylePreset as string) || "professional";
    const customPrompt = (body.customPrompt as string) || "";
    const branding = await getBranding(courseId);
    const styleDesc = STYLE_PRESETS[stylePreset] || STYLE_PRESETS.professional;
    const prompt = customPrompt.trim()
      ? `${customPrompt} Use brand colours: primary ${branding.primaryColor}, accent ${branding.accentColor}. ${styleDesc}.`
      : `Module hero image for "${mod.title}" in a course about ${course.topic}. ${styleDesc}. Use colours: primary ${branding.primaryColor}, accent ${branding.accentColor}. No text in the image.`;

    const openai = new OpenAI({ apiKey });
    const resp = await openai.images.generate({
      model: "dall-e-2",
      prompt,
      n: 1,
      size: "1024x1024",
      response_format: "url",
    });
    const imageUrl = resp.data?.[0]?.url;
    if (!imageUrl) {
      return NextResponse.json(
        { error: "No image returned from OpenAI" },
        { status: 502 }
      );
    }

    const imageRes = await fetch(imageUrl);
    if (!imageRes.ok) {
      return NextResponse.json(
        { error: "Failed to fetch generated image" },
        { status: 502 }
      );
    }
    const buffer = Buffer.from(await imageRes.arrayBuffer());
    const ext = imageUrl.includes("png") ? "png" : "jpg";
    const safeName = `${courseId}-${moduleId}-${Date.now()}.${ext}`.replace(/[^a-zA-Z0-9._-]/g, "_");
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
    const filePath = path.join(UPLOADS_DIR, safeName);
    await fs.writeFile(filePath, buffer);

    const url = `/api/uploads/${safeName}`;
    await updateModule(courseId, moduleId, { heroImageUrl: url });
    return NextResponse.json({ url });
  } catch (e) {
    console.error("Image generate", e);
    const message = e instanceof Error ? e.message : "Image generation failed";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
