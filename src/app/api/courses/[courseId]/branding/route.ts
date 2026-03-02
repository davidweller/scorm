import { NextResponse } from "next/server";
import { getCourseById } from "@/lib/db/store";
import { getBranding, setBranding } from "@/lib/db/course-data";
import type { Branding } from "@/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params;
  const course = await getCourseById(courseId);
  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }
  const branding = await getBranding(courseId);
  return NextResponse.json(branding);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params;
  const course = await getCourseById(courseId);
  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }
  try {
    const body = (await request.json()) as Partial<Branding>;
    const current = await getBranding(courseId);
    const branding: Branding = {
      primaryColor: body.primaryColor ?? current.primaryColor,
      secondaryColor: body.secondaryColor ?? current.secondaryColor,
      accentColor: body.accentColor ?? current.accentColor,
      backgroundColor: body.backgroundColor ?? current.backgroundColor,
      headingFont: body.headingFont ?? current.headingFont,
      bodyFont: body.bodyFont ?? current.bodyFont,
      logoUrl: body.logoUrl !== undefined ? body.logoUrl : current.logoUrl,
    };
    await setBranding(courseId, branding);
    return NextResponse.json(branding);
  } catch (e) {
    console.error("PATCH /api/courses/[courseId]/branding", e);
    return NextResponse.json(
      { error: "Failed to update branding" },
      { status: 500 }
    );
  }
}
