import { NextResponse } from "next/server";
import { getCourseById } from "@/lib/db/store";
import { getActivityById, updateActivity, getModuleById } from "@/lib/db/course-data";
import { getOpenAIKey } from "@/lib/db/settings";
import { generateMultipleChoiceWithAI, generateFlashcardsWithAI } from "@/lib/openai/activity";

function generateMultipleChoiceJson(): Record<string, unknown> {
  return {
    question: "What is the main purpose of this module?",
    answers: [
      { text: "To introduce key concepts", correct: true },
      { text: "To summarize only", correct: false },
      { text: "To replace reading", correct: false },
      { text: "To test prior knowledge", correct: false },
    ],
  };
}

function generateFlashcardsJson(): Record<string, unknown> {
  return {
    cards: [
      { front: "Key term 1", back: "Definition or explanation for term 1." },
      { front: "Key term 2", back: "Definition or explanation for term 2." },
      { front: "Key term 3", back: "Definition or explanation for term 3." },
    ],
  };
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ courseId: string; activityId: string }> }
) {
  const { courseId, activityId } = await params;
  const course = await getCourseById(courseId);
  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }
  if (course.status === "ready_for_export") {
    return NextResponse.json(
      { error: "Course is approved and locked" },
      { status: 400 }
    );
  }
  const activity = await getActivityById(courseId, activityId);
  if (!activity) {
    return NextResponse.json({ error: "Activity not found" }, { status: 404 });
  }
  const apiKey = await getOpenAIKey();
  let h5pJson: Record<string, unknown>;
  const moduleTitle = activity.moduleId ? (await getModuleById(courseId, activity.moduleId))?.title : undefined;
  if (apiKey) {
    try {
      if (activity.type === "multiple_choice") {
        h5pJson = await generateMultipleChoiceWithAI(apiKey, { topic: course.topic, moduleTitle });
      } else if (activity.type === "flashcards") {
        h5pJson = await generateFlashcardsWithAI(apiKey, { topic: course.topic, moduleTitle });
      } else {
        h5pJson = activity.type === "multiple_choice" ? generateMultipleChoiceJson() : generateFlashcardsJson();
      }
    } catch (aiError) {
      console.error("Activity OpenAI error", aiError);
      h5pJson = activity.type === "multiple_choice" ? generateMultipleChoiceJson() : generateFlashcardsJson();
    }
  } else {
    h5pJson =
      activity.type === "multiple_choice"
        ? generateMultipleChoiceJson()
        : activity.type === "flashcards"
          ? generateFlashcardsJson()
          : {};
  }
  const updated = await updateActivity(courseId, activityId, { h5pJson });
  return NextResponse.json(updated);
}
