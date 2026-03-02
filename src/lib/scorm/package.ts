import { promises as fs } from "fs";
import path from "path";
import JSZip from "jszip";
import type { Course } from "@/types/course";
import type { Branding } from "@/types/branding";
import type { Module } from "@/types/module";
import type { Activity } from "@/types/activity";
import { renderCourseHtml } from "./render-html";
import { buildImsManifest } from "./manifest";
import { getScorm12ApiWrapper, getScormCompletionScript } from "./api-wrapper";

const UPLOADS_DIR = path.join(process.cwd(), ".data", "uploads");
const SAFE_FILE = /^[a-zA-Z0-9._-]+\.(png|jpg|jpeg|webp)$/;

export async function buildScormPackage(
  course: Course,
  branding: Branding,
  modules: Module[],
  activities: Activity[]
): Promise<Buffer> {
  const zip = new JSZip();
  const imagesFolder = zip.folder("images");
  const modulesForHtml: Module[] = await Promise.all(
    modules.map(async (mod) => {
      const url = mod.heroImageUrl;
      if (!url || !url.startsWith("/api/uploads/")) {
        return mod;
      }
      const filename = url.replace("/api/uploads/", "").split("?")[0];
      if (!SAFE_FILE.test(filename)) return mod;
      const filePath = path.join(UPLOADS_DIR, filename);
      try {
        const buf = await fs.readFile(filePath);
        const ext = path.extname(filename);
        const zipName = `${mod.id}${ext}`;
        imagesFolder?.file(zipName, buf);
        return { ...mod, heroImageUrl: `images/${zipName}` };
      } catch {
        return mod;
      }
    })
  );

  let html = renderCourseHtml(course, branding, modulesForHtml, activities);
  html = html.replace(
    "</body>",
    '<script src="scorm-api-wrapper.js"></script><script src="scorm-completion.js"></script></body>'
  );
  zip.file("index.html", html);
  zip.file("imsmanifest.xml", buildImsManifest(course.id, course.title));
  zip.file("scorm-api-wrapper.js", getScorm12ApiWrapper());
  zip.file("scorm-completion.js", getScormCompletionScript());
  const blob = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
  return Buffer.from(blob);
}
