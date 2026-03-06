/**
 * DOCX parsing utilities using mammoth.js
 * Extracts text content, document structure, and images from Word documents.
 */

import mammoth from "mammoth";

export interface ParsedHeading {
  level: number;
  text: string;
  index: number;
}

export interface ParsedListItem {
  text: string;
  isNumbered: boolean;
}

export interface ExtractedImage {
  id: string;
  base64: string;
  contentType: string;
}

export interface ParsedDocument {
  rawText: string;
  html: string;
  headings: ParsedHeading[];
  paragraphs: string[];
  lists: ParsedListItem[];
  images: ExtractedImage[];
}

interface MammothImageElement {
  read(encoding: "base64"): Promise<string>;
  contentType: string;
}

export async function parseDocx(buffer: ArrayBuffer): Promise<ParsedDocument> {
  const nodeBuffer = Buffer.from(buffer);
  
  // Extract images with custom converter that captures base64 data
  let imageIndex = 0;
  const images: ExtractedImage[] = [];
  
  // Mammoth doesn't have TypeScript definitions for images.inline
  const mammothAny = mammoth as unknown as {
    convertToHtml: (
      input: { buffer: Buffer },
      options?: { convertImage?: unknown }
    ) => Promise<{ value: string }>;
    images: {
      inline: (fn: (element: MammothImageElement) => Promise<{ src: string }>) => unknown;
    };
  };
  
  const result = await mammothAny.convertToHtml(
    { buffer: nodeBuffer },
    {
      convertImage: mammothAny.images.inline((element: MammothImageElement) => {
        const id = `img_${imageIndex++}`;
        return element.read("base64").then((base64Data: string) => {
          images.push({
            id,
            base64: base64Data,
            contentType: element.contentType,
          });
          // Replace image with placeholder marker
          return { src: `[IMAGE:${id}]` };
        });
      }),
    }
  );
  const html = result.value as string;

  const textResult = await mammoth.extractRawText({ buffer: nodeBuffer });
  const rawText = textResult.value;

  const headings = extractHeadings(html);
  const paragraphs = extractParagraphs(html);
  const lists = extractLists(html);

  return {
    rawText,
    html,
    headings,
    paragraphs,
    lists,
    images,
  };
}

function extractHeadings(html: string): ParsedHeading[] {
  const headings: ParsedHeading[] = [];
  const headingRegex = /<h([1-6])[^>]*>(.*?)<\/h[1-6]>/gi;
  let match;
  let index = 0;

  while ((match = headingRegex.exec(html)) !== null) {
    headings.push({
      level: parseInt(match[1], 10),
      text: stripHtmlTags(match[2]).trim(),
      index: index++,
    });
  }

  return headings;
}

function extractParagraphs(html: string): string[] {
  const paragraphs: string[] = [];
  const paragraphRegex = /<p[^>]*>(.*?)<\/p>/gi;
  let match;

  while ((match = paragraphRegex.exec(html)) !== null) {
    const text = stripHtmlTags(match[1]).trim();
    if (text) {
      paragraphs.push(text);
    }
  }

  return paragraphs;
}

function extractLists(html: string): ParsedListItem[] {
  const items: ParsedListItem[] = [];

  const orderedListRegex = /<ol[^>]*>(.*?)<\/ol>/gis;
  let olMatch;
  while ((olMatch = orderedListRegex.exec(html)) !== null) {
    const liRegex = /<li[^>]*>(.*?)<\/li>/gi;
    let liMatch;
    while ((liMatch = liRegex.exec(olMatch[1])) !== null) {
      const text = stripHtmlTags(liMatch[1]).trim();
      if (text) {
        items.push({ text, isNumbered: true });
      }
    }
  }

  const unorderedListRegex = /<ul[^>]*>(.*?)<\/ul>/gis;
  let ulMatch;
  while ((ulMatch = unorderedListRegex.exec(html)) !== null) {
    const liRegex = /<li[^>]*>(.*?)<\/li>/gi;
    let liMatch;
    while ((liMatch = liRegex.exec(ulMatch[1])) !== null) {
      const text = stripHtmlTags(liMatch[1]).trim();
      if (text) {
        items.push({ text, isNumbered: false });
      }
    }
  }

  return items;
}

function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, "");
}

export function formatDocumentForAI(
  doc: ParsedDocument,
  imageUrlMap?: Map<string, string>
): string {
  // Convert HTML to a format that preserves structure for AI
  // Headings become markdown-style markers so AI understands hierarchy
  // Lists and inline formatting are preserved as clean HTML for direct output
  
  let content = doc.html;
  
  // Convert headings to markdown format (for structure recognition)
  content = content.replace(/<h1[^>]*>(.*?)<\/h1>/gi, "\n\n# $1\n\n");
  content = content.replace(/<h2[^>]*>(.*?)<\/h2>/gi, "\n\n## $1\n\n");
  content = content.replace(/<h3[^>]*>(.*?)<\/h3>/gi, "\n\n### $1\n\n");
  content = content.replace(/<h4[^>]*>(.*?)<\/h4>/gi, "\n\n#### $1\n\n");
  content = content.replace(/<h5[^>]*>(.*?)<\/h5>/gi, "\n\n##### $1\n\n");
  content = content.replace(/<h6[^>]*>(.*?)<\/h6>/gi, "\n\n###### $1\n\n");
  
  // Keep paragraphs as HTML tags (strip attributes)
  content = content.replace(/<p[^>]*>/gi, "<p>");
  
  // Keep lists as clean HTML (strip attributes)
  content = content.replace(/<ul[^>]*>/gi, "<ul>");
  content = content.replace(/<ol[^>]*>/gi, "<ol>");
  content = content.replace(/<li[^>]*>/gi, "<li>");
  
  // Keep inline formatting as clean HTML (strip attributes)
  content = content.replace(/<strong[^>]*>/gi, "<strong>");
  content = content.replace(/<b[^>]*>/gi, "<strong>");
  content = content.replace(/<\/b>/gi, "</strong>");
  content = content.replace(/<em[^>]*>/gi, "<em>");
  content = content.replace(/<i[^>]*>/gi, "<em>");
  content = content.replace(/<\/i>/gi, "</em>");
  
  // Replace image placeholders with actual URLs if provided
  if (imageUrlMap && imageUrlMap.size > 0) {
    content = content.replace(
      /<img[^>]*src="\[IMAGE:(img_\d+)\]"[^>]*>/gi,
      (_, imgId) => {
        const url = imageUrlMap.get(imgId);
        return url ? `[IMAGE:${imgId}:${url}]` : "";
      }
    );
  }
  
  // Preserve table tags (strip attributes for security)
  content = content.replace(/<table[^>]*>/gi, "<table>");
  content = content.replace(/<thead[^>]*>/gi, "<thead>");
  content = content.replace(/<tbody[^>]*>/gi, "<tbody>");
  content = content.replace(/<tr[^>]*>/gi, "<tr>");
  content = content.replace(/<th[^>]*>/gi, "<th>");
  content = content.replace(/<td[^>]*>/gi, "<td>");
  
  // Remove other HTML tags (spans, divs, etc.) but keep their content
  // Also preserve image markers [IMAGE:...] 
  content = content.replace(/<(?!\/?(p|ul|ol|li|strong|em|table|thead|tbody|tr|th|td)(?:>|\s))[^>]*>/gi, "");
  
  // Clean up excessive whitespace
  content = content.replace(/\n{3,}/g, "\n\n");
  content = content.trim();
  
  // Build the header with image instructions if images are present
  const hasImages = imageUrlMap && imageUrlMap.size > 0;
  const imageInstructions = hasImages
    ? `
- Images are marked as [IMAGE:id:url] - create image blocks at these positions
  Example: [IMAGE:img_0:https://...] becomes { "category": "content", "type": "image", "data": { "url": "https://...", "alt": "descriptive alt text" } }
- Generate descriptive alt text for each image based on its context in the document`
    : "";
  
  return `=== DOCUMENT CONTENT (Structured with HTML formatting) ===

The document below uses markdown-style headings (# H1, ## H2, ### H3) for structure.
Text content includes HTML formatting that should be preserved in the output:
- <p>...</p> for paragraphs
- <ul><li>...</li></ul> for bullet lists
- <ol><li>...</li></ol> for numbered lists
- <strong>...</strong> for bold text
- <em>...</em> for italic text
- <table><thead><tr><th>...</th></tr></thead><tbody><tr><td>...</td></tr></tbody></table> for tables${imageInstructions}

${content}`;
}
