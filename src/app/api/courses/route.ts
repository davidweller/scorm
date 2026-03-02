import { NextResponse } from "next/server";
import { getAllCourses, createCourse } from "@/lib/db/store";
import type { CreateCourseInput } from "@/types";

export async function GET() {
  try {
    const courses = await getAllCourses();
    return NextResponse.json(courses);
  } catch (e) {
    console.error("GET /api/courses", e);
    return NextResponse.json(
      { error: "Failed to list courses" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateCourseInput;
    const { title, topic, length } = body;
    if (!title?.trim() || !topic?.trim() || !length?.trim()) {
      return NextResponse.json(
        { error: "title, topic, and length are required" },
        { status: 400 }
      );
    }
    const course = await createCourse({ title: title.trim(), topic: topic.trim(), length: length.trim() });
    return NextResponse.json(course);
  } catch (e) {
    console.error("POST /api/courses", e);
    return NextResponse.json(
      { error: "Failed to create course" },
      { status: 500 }
    );
  }
}
