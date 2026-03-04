import JSZip from "jszip";
import { buildManifest12, type PageEntry } from "./manifest";
import { SCORM_API_JS } from "./scorm-api-js";
import {
  renderPageHtml,
  type ScormRuntimeOptions,
  type GradingKey,
} from "./render-page-html";
import type { BrandConfig } from "@/types/branding";

interface ImageMapping {
  originalUrl: string;
  localPath: string;
}

async function fetchAndBundleImage(
  url: string,
  index: number,
  contentFolder: JSZip
): Promise<ImageMapping | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return null;

    const buf = Buffer.from(await res.arrayBuffer());
    const contentType = res.headers.get("content-type") || "";
    let ext = "png";
    if (contentType.includes("jpeg") || contentType.includes("jpg") || url.match(/\.jpe?g/i)) {
      ext = "jpg";
    } else if (contentType.includes("gif") || url.match(/\.gif/i)) {
      ext = "gif";
    } else if (contentType.includes("webp") || url.match(/\.webp/i)) {
      ext = "webp";
    } else if (contentType.includes("svg") || url.match(/\.svg/i)) {
      ext = "svg";
    }

    const filename = `img_${index}.${ext}`;
    contentFolder.file(filename, buf);

    return { originalUrl: url, localPath: filename };
  } catch {
    return null;
  }
}

function collectImageUrls(course: CourseForExport): string[] {
  const urls = new Set<string>();

  for (const mod of course.modules ?? []) {
    for (const lesson of mod.lessons ?? []) {
      for (const page of lesson.pages ?? []) {
        for (const block of page.contentBlocks ?? []) {
          if (block.type === "image") {
            const url = block.content?.url;
            if (typeof url === "string" && url.trim()) {
              urls.add(url.trim());
            }
          }
        }
      }
    }
  }

  return Array.from(urls);
}

function rewriteImageUrls(
  contentBlocks: { id: string; type: string; content: Record<string, unknown>; order: number }[],
  urlMap: Map<string, string>
): { id: string; type: string; content: Record<string, unknown>; order: number }[] {
  return contentBlocks.map((block) => {
    if (block.type === "image" && typeof block.content?.url === "string") {
      const localPath = urlMap.get(block.content.url);
      if (localPath) {
        return {
          ...block,
          content: { ...block.content, url: localPath },
        };
      }
    }
    return block;
  });
}

function getGradingKey(block: { id: string; type: string; config: Record<string, unknown> }): GradingKey | null {
  if (block.type === "multiple_choice") {
    const correctIndex = Number((block.config as { correctIndex?: number }).correctIndex ?? 0);
    return { blockId: block.id, type: "multiple_choice", correctIndex };
  }
  if (block.type === "true_false") {
    const correct = (block.config as { correct?: boolean }).correct !== false;
    return { blockId: block.id, type: "true_false", correct };
  }
  if (block.type === "drag_and_drop") {
    const correctOrder = (block.config as { correctOrder?: number[] }).correctOrder ?? [];
    return { blockId: block.id, type: "drag_and_drop", correctOrder };
  }
  if (block.type === "matching") {
    const pairs = (block.config as { pairs?: { left: string; right: string }[] }).pairs ?? [];
    return { blockId: block.id, type: "matching", pairCount: pairs.length };
  }
  return null;
}

export interface CourseForExport {
  id: string;
  title: string;
  brandConfig?: BrandConfig | null;
  modules: {
    id: string;
    title: string;
    lessons: {
      id: string;
      title: string;
      pages: {
        id: string;
        title: string;
        contentBlocks: { id: string; type: string; content: Record<string, unknown>; order: number }[];
        interactionBlocks: { id: string; type: string; config: Record<string, unknown>; order: number }[];
      }[];
    }[];
  }[];
}

export async function buildScorm12Zip(course: CourseForExport): Promise<Buffer> {
  const zip = new JSZip();
  const pages: { page: CourseForExport["modules"][0]["lessons"][0]["pages"][0]; index: number }[] = [];
  let index = 0;
  for (const mod of course.modules ?? []) {
    for (const lesson of mod.lessons ?? []) {
      for (const page of lesson.pages ?? []) {
        pages.push({ page, index: index++ });
      }
    }
  }

  const pageEntries: PageEntry[] = pages.map(({ page, index }) => ({
    id: page.id,
    identifier: String(index),
    title: page.title,
    href: `content/page_${index}.html`,
  }));

  const manifestXml = buildManifest12({
    courseId: course.id,
    courseTitle: course.title,
    pages: pageEntries,
  });
  zip.file("imsmanifest.xml", manifestXml);
  zip.file("scorm-api.js", SCORM_API_JS);

  const contentFolder = zip.folder("content");
  if (!contentFolder) throw new Error("Failed to create content folder");

  const brandConfig = course.brandConfig ?? undefined;
  let logoPath: string | undefined;
  const logoUrl =
    brandConfig?.logoUrl && typeof brandConfig.logoUrl === "string" ? brandConfig.logoUrl : null;
  if (logoUrl) {
    try {
      const res = await fetch(logoUrl, { signal: AbortSignal.timeout(10000) });
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        const ext = logoUrl.includes(".png") ? "png" : logoUrl.includes(".svg") ? "svg" : "png";
        contentFolder.file(`logo.${ext}`, buf);
        logoPath = `logo.${ext}`;
      }
    } catch {
      // Skip logo if fetch fails
    }
  }

  const imageUrls = collectImageUrls(course);
  const imageUrlMap = new Map<string, string>();

  const imageResults = await Promise.all(
    imageUrls.map((url, idx) => fetchAndBundleImage(url, idx, contentFolder))
  );

  for (const result of imageResults) {
    if (result) {
      imageUrlMap.set(result.originalUrl, result.localPath);
    }
  }

  let totalScoreMax = 0;
  for (const { page } of pages) {
    for (const block of page.interactionBlocks ?? []) {
      if (
        block.type === "multiple_choice" ||
        block.type === "true_false" ||
        block.type === "drag_and_drop" ||
        block.type === "matching"
      ) {
        totalScoreMax += 1;
      }
    }
  }

  let pageIdx = 0;
  for (const mod of course.modules ?? []) {
    const moduleIndex = course.modules!.indexOf(mod);
    for (const lesson of mod.lessons ?? []) {
      const lessonIndex = mod.lessons!.indexOf(lesson);
      for (const page of lesson.pages ?? []) {
        const i = pageIdx++;
        const prevHref = i > 0 ? `page_${i - 1}.html` : undefined;
        const nextHref = i < pages.length - 1 ? `page_${i + 1}.html` : undefined;
        const gradingKeysByBlockId: Record<string, GradingKey> = {};
        for (const block of page.interactionBlocks ?? []) {
          const key = getGradingKey({ id: block.id, type: block.type, config: block.config ?? {} });
          if (key) gradingKeysByBlockId[block.id] = key;
        }
        const scormRuntime: ScormRuntimeOptions = {
          pageIndex: i,
          totalPages: pages.length,
          totalScoreMax: Math.max(1, totalScoreMax),
          gradingKeysByBlockId,
        };
        const rewrittenContentBlocks = rewriteImageUrls(page.contentBlocks, imageUrlMap);
        const html = renderPageHtml({
          pageTitle: page.title,
          contentBlocks: rewrittenContentBlocks,
          interactionBlocks: page.interactionBlocks,
          courseTitle: course.title,
          prevHref,
          nextHref,
          scormApiPath: "../scorm-api.js",
          brandConfig: brandConfig ?? undefined,
          logoPath,
          scormRuntime,
          moduleIndex,
          moduleTitle: mod.title,
          lessonIndex,
          lessonTitle: lesson.title,
        });
        contentFolder.file(`page_${i}.html`, html);
      }
    }
  }

  const blob = await zip.generateAsync({ type: "nodebuffer" });
  return Buffer.from(blob);
}
