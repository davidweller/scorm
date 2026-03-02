import { promises as fs } from "fs";
import path from "path";
import type { Course } from "@/types";

const DATA_DIR = path.join(process.cwd(), ".data");
const COURSES_FILE = path.join(DATA_DIR, "courses.json");

export type CourseRecord = Course;

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readCourses(): Promise<CourseRecord[]> {
  await ensureDataDir();
  try {
    const raw = await fs.readFile(COURSES_FILE, "utf-8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function writeCourses(courses: CourseRecord[]) {
  await ensureDataDir();
  await fs.writeFile(COURSES_FILE, JSON.stringify(courses, null, 2), "utf-8");
}

export async function getAllCourses(): Promise<CourseRecord[]> {
  const courses = await readCourses();
  return courses.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export async function getCourseById(id: string): Promise<CourseRecord | null> {
  const courses = await readCourses();
  return courses.find((c) => c.id === id) ?? null;
}

export async function createCourse(
  input: Pick<Course, "title" | "topic" | "length">
): Promise<CourseRecord> {
  const courses = await readCourses();
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const course: CourseRecord = {
    id,
    title: input.title,
    topic: input.topic,
    length: input.length,
    status: "draft",
    createdAt: now,
    updatedAt: now,
  };
  courses.push(course);
  await writeCourses(courses);
  return course;
}

export async function updateCourse(
  id: string,
  updates: Partial<Pick<Course, "title" | "topic" | "length" | "status">>
): Promise<CourseRecord | null> {
  const courses = await readCourses();
  const index = courses.findIndex((c) => c.id === id);
  if (index === -1) return null;
  courses[index] = {
    ...courses[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  await writeCourses(courses);
  return courses[index];
}

export async function deleteCourse(id: string): Promise<boolean> {
  const courses = await readCourses();
  const filtered = courses.filter((c) => c.id !== id);
  if (filtered.length === courses.length) return false;
  await writeCourses(filtered);
  return true;
}
