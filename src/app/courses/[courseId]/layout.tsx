import { CourseSidebar } from "@/components/course/CourseSidebar";

export default async function CourseLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;

  return (
    <div className="min-h-screen flex">
      <CourseSidebar courseId={courseId} />
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
