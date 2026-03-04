import { prisma } from "@/lib/db";
import type { CourseForExport } from "@/lib/scorm/build-package";

/**
 * Load course with all modules, lessons, pages, and blocks for export or preview.
 */
export async function getCourseForExport(courseId: string): Promise<CourseForExport | null> {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: {
          lessons: {
            orderBy: { order: "asc" },
            include: {
              pages: {
                orderBy: { order: "asc" },
                include: {
                  blocks: { orderBy: { order: "asc" } },
                },
              },
            },
          },
        },
      },
    },
  });
  return course as CourseForExport | null;
}
