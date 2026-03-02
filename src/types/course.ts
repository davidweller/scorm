/** Course status in the workflow */
export type CourseStatus =
  | "draft"
  | "blueprint_locked"
  | "generating"
  | "ready_for_export";

export interface Course {
  id: string;
  title: string;
  topic: string;
  length: string;
  status: CourseStatus;
  userId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCourseInput {
  title: string;
  topic: string;
  length: string;
}
