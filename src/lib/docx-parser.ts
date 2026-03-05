/**
 * DOCX parsing utilities using mammoth.js
 * Extracts text content and document structure from Word documents.
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

export interface ParsedDocument {
  rawText: string;
  html: string;
  headings: ParsedHeading[];
  paragraphs: string[];
  lists: ParsedListItem[];
}

export async function parseDocx(buffer: ArrayBuffer): Promise<ParsedDocument> {
  const nodeBuffer = Buffer.from(buffer);
  const result = await mammoth.convertToHtml({ buffer: nodeBuffer });
  const html = result.value;

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

export function formatDocumentForAI(doc: ParsedDocument): string {
  // Convert HTML to markdown-like format that preserves structure
  // This keeps headings inline with their content so AI understands the hierarchy
  
  let markdown = doc.html;
  
  // Convert headings to markdown format
  markdown = markdown.replace(/<h1[^>]*>(.*?)<\/h1>/gi, "\n\n# $1\n\n");
  markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/gi, "\n\n## $1\n\n");
  markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/gi, "\n\n### $1\n\n");
  markdown = markdown.replace(/<h4[^>]*>(.*?)<\/h4>/gi, "\n\n#### $1\n\n");
  markdown = markdown.replace(/<h5[^>]*>(.*?)<\/h5>/gi, "\n\n##### $1\n\n");
  markdown = markdown.replace(/<h6[^>]*>(.*?)<\/h6>/gi, "\n\n###### $1\n\n");
  
  // Convert paragraphs
  markdown = markdown.replace(/<p[^>]*>(.*?)<\/p>/gi, "\n$1\n");
  
  // Convert lists
  markdown = markdown.replace(/<ul[^>]*>/gi, "\n");
  markdown = markdown.replace(/<\/ul>/gi, "\n");
  markdown = markdown.replace(/<ol[^>]*>/gi, "\n");
  markdown = markdown.replace(/<\/ol>/gi, "\n");
  markdown = markdown.replace(/<li[^>]*>(.*?)<\/li>/gi, "• $1\n");
  
  // Convert bold and italic
  markdown = markdown.replace(/<strong[^>]*>(.*?)<\/strong>/gi, "**$1**");
  markdown = markdown.replace(/<b[^>]*>(.*?)<\/b>/gi, "**$1**");
  markdown = markdown.replace(/<em[^>]*>(.*?)<\/em>/gi, "*$1*");
  markdown = markdown.replace(/<i[^>]*>(.*?)<\/i>/gi, "*$1*");
  
  // Remove any remaining HTML tags
  markdown = markdown.replace(/<[^>]*>/g, "");
  
  // Clean up excessive whitespace
  markdown = markdown.replace(/\n{3,}/g, "\n\n");
  markdown = markdown.trim();
  
  return `=== DOCUMENT CONTENT (Structured) ===

${markdown}`;
}
