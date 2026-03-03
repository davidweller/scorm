import { CourseFlowStepper } from "@/components/course/CourseFlowStepper";
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
        <header className="sticky top-0 z-10 border-b border-gray-200 bg-white shadow-sm">
          <div className="px-4 py-3 lg:px-8">
            <CourseFlowStepper courseId={courseId} />
          </div>
        </header>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
