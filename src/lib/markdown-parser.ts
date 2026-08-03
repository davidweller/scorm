/**
 * Obsidian / Markdown preprocessing for course import.
 * Produces the same hybrid string shape as formatDocumentForAI:
 * markdown headings + HTML body, ready for analyzeCourseDocument.
 */

import { Marked, Renderer } from "marked";

const DOCUMENT_PREAMBLE = `=== DOCUMENT CONTENT ===

The document below uses markdown-style headings (# H1, ## H2, ### H3) for structure.
Text content includes HTML formatting that should be preserved in the output:
- <p>...</p> for paragraphs
- <ul><li>...</li></ul> for bullet lists
- <ol><li>...</li></ol> for numbered lists
- <strong>...</strong> for bold text
- <em>...</em> for italic text
- <table>...</table> for tables
`;

const YOUTUBE_URL_RE =
  /https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?[^\s)\]"']+|youtu\.be\/[^\s)\]"']+)/gi;

export function isMarkdownFile(file: { name: string; type?: string }): boolean {
  const name = file.name.toLowerCase();
  if (name.endsWith(".md") || name.endsWith(".markdown")) return true;
  const type = (file.type || "").toLowerCase();
  return type === "text/markdown" || type === "text/x-markdown";
}

export function prepareMarkdownForImport(raw: string): string {
  let content = raw.replace(/^\uFEFF/, "");

  content = stripFrontmatter(content);
  content = stripVersionNotes(content);
  content = stripTrailingVaultLinks(content);
  content = convertObsidianCallouts(content);
  content = convertWikilinks(content);
  content = convertImages(content);
  content = convertYoutubeLinks(content);

  content = markdownBodyToHtml(content);
  content = content.replace(/\n{3,}/g, "\n\n").trim();

  return `${DOCUMENT_PREAMBLE}\n${content}`;
}

function stripFrontmatter(content: string): string {
  if (!content.startsWith("---")) return content;
  const end = content.indexOf("\n---", 3);
  if (end === -1) return content;
  const after = content.slice(end + 4);
  return after.replace(/^\r?\n/, "");
}

function stripVersionNotes(content: string): string {
  const match = content.match(/^#{1,3}\s*Version note\b.*$/im);
  if (!match || match.index == null) return content;
  return content.slice(0, match.index).trimEnd();
}

function stripTrailingVaultLinks(content: string): string {
  return content
    .replace(/\n(?:\s*\[\[[^\]]+\]\]\s*(?:\||\n|$))+\s*$/g, "\n")
    .trimEnd();
}

/** [[Note|alias]] → alias; [[Note]] → Note. Does not touch [[IMAGE …]] / [[VIDEO …]]. */
function convertWikilinks(content: string): string {
  return content.replace(/\[\[([^\]]+)\]\]/g, (full, inner: string) => {
    const trimmed = inner.trim();
    if (/^(IMAGE|VIDEO)\b/i.test(trimmed)) return full;
    if (trimmed.startsWith("!") || trimmed.includes("://")) return full;
    const pipe = trimmed.indexOf("|");
    if (pipe >= 0) return trimmed.slice(pipe + 1).trim() || trimmed.slice(0, pipe).trim();
    // Drop heading/block refs: Note#heading → Note
    const hash = trimmed.indexOf("#");
    return (hash >= 0 ? trimmed.slice(0, hash) : trimmed).trim();
  });
}

/**
 * Flatten Obsidian callouts to import cues.
 * TIP / reflection-titled → Reflection; NOTE/IMPORTANT/WARNING → Key Insight/Point.
 */
function convertObsidianCallouts(content: string): string {
  const lines = content.split("\n");
  const out: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const header = line.match(/^>\s*\[!([A-Za-z]+)\]\s*(.*)$/);
    if (!header) {
      out.push(line);
      i += 1;
      continue;
    }

    const type = header[1].toUpperCase();
    const titleOnHeader = header[2].trim();
    const bodyLines: string[] = [];
    i += 1;
    while (i < lines.length && /^(?:>|$)/.test(lines[i])) {
      if (lines[i].trim() === "") {
        // blank line inside callout or end — keep reading only while next is still >
        if (i + 1 < lines.length && lines[i + 1].startsWith(">")) {
          bodyLines.push("");
          i += 1;
          continue;
        }
        break;
      }
      if (!lines[i].startsWith(">")) break;
      bodyLines.push(lines[i].replace(/^>\s?/, ""));
      i += 1;
    }

    const body = bodyLines.join("\n").trim();
    const title = titleOnHeader || firstLineTitle(body);
    const isReflection =
      type === "TIP" ||
      /\breflection\b/i.test(title) ||
      /\breflection\b/i.test(body.slice(0, 80));

    if (isReflection) {
      const prompt = body || title;
      out.push(`> **Reflection: ${title || "Reflection"}**`);
      out.push(">");
      for (const bl of prompt.split("\n")) {
        out.push(`> ${bl}`);
      }
      out.push("");
      continue;
    }

    const label = type === "WARNING" || type === "IMPORTANT" ? "Key Point" : "Key Insight";
    const text = body || title;
    if (text) {
      out.push(`**${label}:** ${text.replace(/\n+/g, " ")}`);
      out.push("");
    }
  }

  return out.join("\n");
}

function firstLineTitle(body: string): string {
  const first = body.split("\n").find((l) => l.trim());
  return first ? first.replace(/^\*\*|\*\*$/g, "").trim() : "";
}

function convertImages(content: string): string {
  // Vault embeds: ![[file.png]] or ![[path/file.png|alt]]
  content = content.replace(/!\[\[([^\]]+)\]\]/g, (_m, inner: string) => {
    const parts = inner.split("|");
    const file = (parts[0] || "").trim();
    const alt = (parts[1] || "").trim() || `Vault image not imported: ${file}`;
    const safeAlt = alt.replaceAll('"', "&quot;").replaceAll("\n", " ");
    return `[[IMAGE url="" alt="${safeAlt}"]]`;
  });

  // Markdown images: ![alt](url)
  content = content.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, (_m, alt: string, url: string) => {
    const safeAlt = (alt || "Image").replaceAll('"', "&quot;").replaceAll("\n", " ");
    if (/^https?:\/\//i.test(url)) {
      return `[[IMAGE url="${url}" alt="${safeAlt}"]]`;
    }
    return `[[IMAGE url="" alt="Local image not imported: ${safeAlt}"]]`;
  });

  return content;
}

function convertYoutubeLinks(content: string): string {
  // [label](youtube-url) → VIDEO marker
  content = content.replace(
    /\[([^\]]*)\]\((https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?[^)\s]+|youtu\.be\/[^)\s]+))\)/gi,
    (_m, _label: string, url: string) => `[[VIDEO url="${url}"]]`
  );

  // Bare YouTube URLs (not already inside a VIDEO marker)
  content = content.replace(YOUTUBE_URL_RE, (url, offset: number, full: string) => {
    const before = full.slice(Math.max(0, offset - 20), offset);
    if (/\[\[VIDEO url="/i.test(before)) return url;
    return `[[VIDEO url="${url}"]]`;
  });

  return content;
}

function createImportMarked(): Marked {
  const renderer = new Renderer();
  // Keep headings as markdown (for section splitting). Use token.text so
  // characters like & are not HTML-escaped into &amp;.
  renderer.heading = function ({ text, depth }) {
    return `\n\n${"#".repeat(depth)} ${text}\n\n`;
  };

  return new Marked({
    renderer,
    gfm: true,
    breaks: false,
  });
}

const importMarked = createImportMarked();

function markdownBodyToHtml(content: string): string {
  const placeholders: string[] = [];
  const protectedContent = content.replace(/\[\[(IMAGE|VIDEO)[^\]]*\]\]/g, (marker) => {
    const idx = placeholders.length;
    placeholders.push(marker);
    return `%%IMPORT_MARKER_${idx}%%`;
  });

  let html = importMarked.parse(protectedContent, { async: false }) as string;

  html = html.replace(/%%IMPORT_MARKER_(\d+)%%/g, (_m, n: string) => {
    return placeholders[Number(n)] ?? "";
  });

  // Unwrap markers left inside a lone paragraph
  html = html.replace(/<p>\s*(\[\[(?:IMAGE|VIDEO)[^\]]*\]\])\s*<\/p>/g, "$1");

  return html;
}
