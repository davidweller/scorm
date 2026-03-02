import { promises as fs } from "fs";
import path from "path";
import type { Activity, Branding, Blueprint, Module } from "@/types";
import { DEFAULT_BRANDING } from "@/types";

const DATA_DIR = path.join(process.cwd(), ".data");
const COURSE_DATA_FILE = path.join(DATA_DIR, "course-data.json");

export interface CourseDataRecord {
  branding?: Branding;
  blueprint?: Blueprint;
  modules?: Module[];
  activities?: Activity[];
}

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readCourseData(): Promise<Record<string, CourseDataRecord>> {
  await ensureDataDir();
  try {
    const raw = await fs.readFile(COURSE_DATA_FILE, "utf-8");
    const data = JSON.parse(raw);
    return typeof data === "object" && data !== null ? data : {};
  } catch {
    return {};
  }
}

async function writeCourseData(data: Record<string, CourseDataRecord>) {
  await ensureDataDir();
  await fs.writeFile(COURSE_DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

export async function getBranding(courseId: string): Promise<Branding> {
  const data = await readCourseData();
  return data[courseId]?.branding ?? { ...DEFAULT_BRANDING };
}

export async function setBranding(courseId: string, branding: Branding): Promise<void> {
  const data = await readCourseData();
  data[courseId] = { ...data[courseId], branding };
  await writeCourseData(data);
}

export async function getBlueprint(courseId: string): Promise<Blueprint | null> {
  const data = await readCourseData();
  return data[courseId]?.blueprint ?? null;
}

export async function setBlueprint(courseId: string, blueprint: Blueprint): Promise<void> {
  const data = await readCourseData();
  data[courseId] = { ...data[courseId], blueprint };
  await writeCourseData(data);
}

export async function getModules(courseId: string): Promise<Module[]> {
  const data = await readCourseData();
  const list = data[courseId]?.modules ?? [];
  return list.slice().sort((a, b) => a.order - b.order);
}

export async function setModules(courseId: string, modules: Module[]): Promise<void> {
  const data = await readCourseData();
  data[courseId] = { ...data[courseId], modules };
  await writeCourseData(data);
}

export async function getModuleById(courseId: string, moduleId: string): Promise<Module | null> {
  const modules = await getModules(courseId);
  return modules.find((m) => m.id === moduleId) ?? null;
}

export async function updateModule(
  courseId: string,
  moduleId: string,
  updates: Partial<Omit<Module, "id" | "courseId">>
): Promise<Module | null> {
  const modules = await getModules(courseId);
  const index = modules.findIndex((m) => m.id === moduleId);
  if (index === -1) return null;
  modules[index] = { ...modules[index], ...updates };
  await setModules(courseId, modules);
  return modules[index];
}

export async function getActivities(courseId: string): Promise<Activity[]> {
  const data = await readCourseData();
  const list = data[courseId]?.activities ?? [];
  return list.slice().sort((a, b) => a.order - b.order);
}

export async function setActivities(courseId: string, activities: Activity[]): Promise<void> {
  const data = await readCourseData();
  data[courseId] = { ...data[courseId], activities };
  await writeCourseData(data);
}

export async function getActivityById(courseId: string, activityId: string): Promise<Activity | null> {
  const activities = await getActivities(courseId);
  return activities.find((a) => a.id === activityId) ?? null;
}

export async function addActivity(
  courseId: string,
  input: Pick<Activity, "type" | "moduleId"> & { h5pJson?: Record<string, unknown> }
): Promise<Activity> {
  const activities = await getActivities(courseId);
  const order = activities.length > 0 ? Math.max(...activities.map((a) => a.order)) + 1 : 1;
  const activity: Activity = {
    id: crypto.randomUUID(),
    courseId,
    type: input.type,
    moduleId: input.moduleId,
    h5pJson: input.h5pJson ?? {},
    order,
  };
  activities.push(activity);
  await setActivities(courseId, activities);
  return activity;
}

export async function updateActivity(
  courseId: string,
  activityId: string,
  updates: Partial<Omit<Activity, "id" | "courseId">>
): Promise<Activity | null> {
  const activities = await getActivities(courseId);
  const index = activities.findIndex((a) => a.id === activityId);
  if (index === -1) return null;
  activities[index] = { ...activities[index], ...updates };
  await setActivities(courseId, activities);
  return activities[index];
}

export async function deleteActivity(courseId: string, activityId: string): Promise<boolean> {
  const activities = await getActivities(courseId);
  const filtered = activities.filter((a) => a.id !== activityId);
  if (filtered.length === activities.length) return false;
  await setActivities(courseId, filtered);
  return true;
}
