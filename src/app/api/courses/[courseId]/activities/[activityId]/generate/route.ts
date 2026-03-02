import { NextResponse } from "next/server";
import { getCourseById } from "@/lib/db/store";
import { getActivityById, updateActivity } from "@/lib/db/course-data";

/** Mock H5P-style content. Replace with OpenAI when BYOK is wired. */
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
  const activity = await getActivityById(courseId, activityId);
  if (!activity) {
    return NextResponse.json({ error: "Activity not found" }, { status: 404 });
  }
  const h5pJson =
    activity.type === "multiple_choice"
      ? generateMultipleChoiceJson()
      : activity.type === "flashcards"
        ? generateFlashcardsJson()
        : {};
  const updated = await updateActivity(courseId, activityId, { h5pJson });
  return NextResponse.json(updated);
}
