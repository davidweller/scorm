import { CourseEditorShell } from "@/components/course-editor/CourseEditorShell";

export default async function EditPagePage({
  params,
}: {
  params: Promise<{ courseId: string; pageId: string }>;
}) {
  const { pageId } = await params;
  return <CourseEditorShell selectedPageId={pageId} />;
}
