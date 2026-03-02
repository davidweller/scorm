import JSZip from "jszip";
import type { Course } from "@/types/course";
import type { Branding } from "@/types/branding";
import type { Module } from "@/types/module";
import type { Activity } from "@/types/activity";
import { renderCourseHtml } from "./render-html";
import { buildImsManifest } from "./manifest";
import { getScorm12ApiWrapper } from "./api-wrapper";

export async function buildScormPackage(
  course: Course,
  branding: Branding,
  modules: Module[],
  activities: Activity[]
): Promise<Buffer> {
  const zip = new JSZip();
  let html = renderCourseHtml(course, branding, modules, activities);
  html = html.replace("</body>", '<script src="scorm-api-wrapper.js"></script></body>');
  zip.file("index.html", html);
  zip.file(
    "imsmanifest.xml",
    buildImsManifest(course.id, course.title)
  );
  zip.file("scorm-api-wrapper.js", getScorm12ApiWrapper());
  const blob = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
  return Buffer.from(blob);
}
