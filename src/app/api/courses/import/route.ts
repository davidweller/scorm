import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { parseDocx, formatDocumentForAI } from "@/lib/docx-parser";
import { analyzeCourseDocument, type ImportedCourseData } from "@/lib/ai-course-import";
import { getOpenAIClient } from "@/lib/ai";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";
    
    // Handle JSON body (when creating from preview data)
    if (contentType.includes("application/json")) {
      const body = await request.json();
      const importData = body.importData as ImportedCourseData;
      
      if (!importData) {
        return NextResponse.json({ error: "importData is required" }, { status: 400 });
      }
      
      const course = await createCourseFromImport(importData);
      return NextResponse.json({ course });
    }
    
    // Handle FormData (file upload for preview)
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const apiKey = formData.get("apiKey") as string | null;

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

    const validTypes = [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
    ];
    if (!validTypes.includes(file.type) && !file.name.endsWith(".docx")) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload a .docx file." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB." },
        { status: 400 }
      );
    }

    const client = getOpenAIClient(apiKey);
    if (!client) {
      return NextResponse.json(
        { error: "OpenAI API key not configured. Add OPENAI_API_KEY to .env or provide your own key." },
        { status: 503 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const parsedDoc = await parseDocx(arrayBuffer);
    const documentContent = formatDocumentForAI(parsedDoc);

    const importedData = await analyzeCourseDocument(client, documentContent);

    return NextResponse.json({ preview: importedData });
  } catch (e) {
    console.error("Import error:", e);
    const message = e instanceof Error ? e.message : "Import failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function createCourseFromImport(data: ImportedCourseData) {
  // Create the course first (outside transaction for speed)
  const course = await prisma.course.create({
    data: {
      title: data.title,
      overview: data.overview || null,
      audience: data.audience || null,
      tone: data.tone || null,
      ilos: data.ilos.length > 0 ? (data.ilos as Prisma.InputJsonValue) : Prisma.JsonNull,
      assessmentPlan: data.assessmentPlan ? (data.assessmentPlan as Prisma.InputJsonValue) : Prisma.JsonNull,
    },
  });

  try {
    // Create modules, lessons, pages, and blocks sequentially but without long transaction
    for (let moduleIdx = 0; moduleIdx < data.modules.length; moduleIdx++) {
      const moduleData = data.modules[moduleIdx];
      const moduleRecord = await prisma.module.create({
        data: {
          courseId: course.id,
          title: moduleData.title,
          order: moduleIdx,
        },
      });

      for (let lessonIdx = 0; lessonIdx < moduleData.lessons.length; lessonIdx++) {
        const lessonData = moduleData.lessons[lessonIdx];
        const lessonRecord = await prisma.lesson.create({
          data: {
            moduleId: moduleRecord.id,
            title: lessonData.title,
            order: lessonIdx,
          },
        });

        for (let pageIdx = 0; pageIdx < lessonData.pages.length; pageIdx++) {
          const pageData = lessonData.pages[pageIdx];
          const pageRecord = await prisma.page.create({
            data: {
              lessonId: lessonRecord.id,
              title: pageData.title,
              order: pageIdx,
            },
          });

          // Batch create blocks for each page
          if (pageData.blocks.length > 0) {
            await prisma.block.createMany({
              data: pageData.blocks.map((blockData, blockIdx) => ({
                pageId: pageRecord.id,
                category: blockData.category,
                type: blockData.type,
                data: blockData.data as Prisma.InputJsonValue,
                order: blockIdx,
              })),
            });
          }
        }
      }
    }

    return course;
  } catch (error) {
    // If something fails, clean up the partially created course
    await prisma.course.delete({ where: { id: course.id } }).catch(() => {});
    throw error;
  }
}
