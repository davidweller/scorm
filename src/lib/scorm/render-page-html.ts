/**
 * Render course page and blocks to static HTML for SCORM export.
 */

import type { BrandConfig } from "@/types/branding";
import { DEFAULT_BRAND_CONFIG } from "@/types/branding";

interface ContentBlock {
  id: string;
  type: string;
  content: Record<string, unknown>;
  order: number;
}

interface InteractionBlock {
  id: string;
  type: string;
  config: Record<string, unknown>;
  order: number;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function nl2br(s: string): string {
  return escapeHtml(s).replace(/\n/g, "<br />");
}

export function renderContentBlock(block: ContentBlock): string {
  const c = block.content || {};
  if (block.type === "text") {
    const text = typeof c.text === "string" ? c.text : "";
    return `<div class="content-text reveal">${nl2br(text)}</div>`;
  }
  if (block.type === "heading") {
    const level = Math.min(6, Math.max(1, Number(c.level) || 2));
    const text = typeof c.text === "string" ? c.text : "";
    return `<h${level} class="content-heading reveal">${escapeHtml(text)}</h${level}>`;
  }
  if (block.type === "image") {
    const url = typeof c.url === "string" ? c.url : "";
    const alt = typeof c.alt === "string" ? c.alt : "";
    if (!url) return "";
    return `<figure class="content-image reveal"><img src="${escapeHtml(url)}" alt="${escapeHtml(alt)}" /></figure>`;
  }
  if (block.type === "video_embed") {
    const url = typeof c.url === "string" ? c.url : "";
    if (!url) return "";
    const embed = url.includes("youtube") || url.includes("youtu.be")
      ? url.replace(/youtu\.be\/([^?]+)/, "youtube.com/embed/$1").replace(/watch\?v=([^&]+)/, "embed/$1")
      : url;
    return `<div class="content-video reveal"><iframe src="${escapeHtml(embed)}" allowfullscreen></iframe></div>`;
  }
  if (block.type === "key_insight") {
    const text = typeof c.text === "string" ? c.text : "";
    return `<div class="key-insight reveal"><p>${nl2br(text)}</p></div>`;
  }
  if (block.type === "key_point") {
    const text = typeof c.text === "string" ? c.text : "";
    const title = typeof c.title === "string" ? c.title : "";
    const titleHtml = title ? `<p class="content-card-title">${escapeHtml(title)}</p>` : "";
    return `<div class="content-card reveal">${titleHtml}<div class="content-card-body">${nl2br(text)}</div></div>`;
  }
  return "";
}

/** Grading key for one block: used by runtime script to compute score. */
export interface GradingKey {
  blockId: string;
  type: "multiple_choice" | "true_false";
  correctIndex?: number;
  correct?: boolean;
}

export function renderInteractionBlock(
  block: InteractionBlock,
  gradingKey?: GradingKey | null
): string {
  const cfg = block.config || {};
  const dataAttrs =
    gradingKey && (gradingKey.type === "multiple_choice" || gradingKey.type === "true_false")
      ? gradingKey.type === "multiple_choice"
        ? ` data-scorm-graded="true" data-block-id="${escapeHtml(block.id)}" data-correct-index="${Number(gradingKey.correctIndex ?? 0)}"`
        : ` data-scorm-graded="true" data-block-id="${escapeHtml(block.id)}" data-correct="${gradingKey.correct === true ? "true" : "false"}"`
      : "";
  if (block.type === "reflection") {
    const prompt = typeof cfg.prompt === "string" ? cfg.prompt : "";
    return `<div class="interaction reflection reveal"><p class="prompt">${nl2br(prompt)}</p><textarea class="reflection-input" rows="4" placeholder="Your response..."></textarea></div>`;
  }
  if (block.type === "multiple_choice") {
    const question = typeof cfg.question === "string" ? cfg.question : "";
    const options = Array.isArray(cfg.options) ? cfg.options : [];
    const opts = options.map((o, i) => `<li class="option-item"><label><input type="radio" name="mc-${block.id}" value="${i}" /> ${escapeHtml(String(o))}</label></li>`).join("");
    return `<div class="interaction multiple-choice reveal"${dataAttrs}><p class="question">${nl2br(question)}</p><ul class="options">${opts}</ul></div>`;
  }
  if (block.type === "true_false") {
    const question = typeof cfg.question === "string" ? cfg.question : "";
    return `<div class="interaction true-false reveal"${dataAttrs}><p class="question">${nl2br(question)}</p><ul class="options"><li class="option-item"><label><input type="radio" name="tf-${block.id}" value="true" /> True</label></li><li class="option-item"><label><input type="radio" name="tf-${block.id}" value="false" /> False</label></li></ul></div>`;
  }
  return "";
}

function mergeWithDefaults(config?: BrandConfig | null): BrandConfig {
  if (!config) return DEFAULT_BRAND_CONFIG;
  return { ...DEFAULT_BRAND_CONFIG, ...config };
}

function buildBrandCss(brandConfig?: BrandConfig | null, logoPath?: string): string {
  const c = mergeWithDefaults(brandConfig);
  const vars: string[] = [];
  if (c.primary) vars.push(`--brand-primary: ${c.primary}`);
  if (c.primaryButtonFill) vars.push(`--brand-primary-fill: ${c.primaryButtonFill}`);
  if (c.primaryButtonText) vars.push(`--brand-primary-text: ${c.primaryButtonText}`);
  if (c.primaryButtonHover) vars.push(`--brand-primary-hover: ${c.primaryButtonHover}`);
  if (c.secondary) vars.push(`--brand-secondary: ${c.secondary}`);
  if (c.secondaryButtonColor) vars.push(`--brand-secondary-color: ${c.secondaryButtonColor}`);
  if (c.secondaryButtonBg) vars.push(`--brand-secondary-bg: ${c.secondaryButtonBg}`);
  if (c.accent) vars.push(`--brand-accent: ${c.accent}`);
  if (c.ctaFill) vars.push(`--brand-cta-fill: ${c.ctaFill}`);
  if (c.ctaText) vars.push(`--brand-cta-text: ${c.ctaText}`);
  if (c.background) vars.push(`--brand-background: ${c.background}`);
  if (c.cardBg) vars.push(`--brand-card-bg: ${c.cardBg}`);
  if (c.linkColor) vars.push(`--brand-link: ${c.linkColor}`);
  if (vars.length === 0 && !logoPath) return "";
  let css = ":root { " + vars.join("; ") + " }\n";
  if (c.background) css += "body { background: var(--brand-background); }\n";
  if (c.linkColor) css += "a { color: var(--brand-link); }\n";
  if (c.linkColor) css += "a:hover { color: var(--brand-primary-hover, var(--brand-primary)); text-decoration: underline; }\n";
  if (c.cardBg) css += ".interaction { background: var(--brand-card-bg); }\n";
  css += ".page-nav a { text-decoration: none; padding: 0.5rem 1rem; border-radius: 6px; font-weight: 600; }\n";
  if (c.primaryButtonFill) css += ".page-nav a[href]:not(.secondary) { background: var(--brand-primary-fill); color: var(--brand-primary-text); }\n";
  if (c.primaryButtonHover) css += ".page-nav a[href]:not(.secondary):hover { background: var(--brand-primary-hover); color: var(--brand-primary-text); }\n";
  if (c.secondaryButtonColor) css += ".page-nav a.secondary { background: var(--brand-secondary-bg); color: var(--brand-secondary-color); border: 2px solid var(--brand-secondary-color); }\n";
  if (c.secondaryButtonColor) css += ".page-nav a.secondary:hover { filter: brightness(0.96); }\n";
  return css;
}

function buildFontLinks(brandConfig?: BrandConfig | null): string {
  const c = mergeWithDefaults(brandConfig);
  const heading = (c.headingFont || c.font || "").trim();
  const body = (c.bodyFont || c.font || "").trim();
  const families: string[] = [];
  if (heading) families.push(`family=${heading.replace(/\s+/g, "+")}:wght@400;600;700`);
  if (body && body !== heading) families.push(`family=${body.replace(/\s+/g, "+")}:wght@400;600;700`);
  if (families.length === 0) return "";
  return `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?${families.join("&")}&display=swap" />`;
}

export interface ScormRuntimeOptions {
  pageIndex: number;
  totalPages: number;
  totalScoreMax: number;
  gradingKeysByBlockId: Record<string, GradingKey>;
}

export function renderPageHtml(options: {
  pageTitle: string;
  contentBlocks: ContentBlock[];
  interactionBlocks: InteractionBlock[];
  courseTitle: string;
  prevHref?: string;
  nextHref?: string;
  scormApiPath?: string;
  brandConfig?: BrandConfig | null;
  logoPath?: string;
  scormRuntime?: ScormRuntimeOptions;
  moduleIndex?: number;
  moduleTitle?: string;
  lessonIndex?: number;
  lessonTitle?: string;
}): string {
  const {
    pageTitle,
    contentBlocks,
    interactionBlocks,
    courseTitle,
    prevHref,
    nextHref,
    scormApiPath = "scorm-api.js",
    brandConfig,
    logoPath,
    scormRuntime,
    moduleIndex,
    moduleTitle,
    lessonIndex,
    lessonTitle,
  } = options;
  const contentHtml = [...contentBlocks]
    .sort((a, b) => a.order - b.order)
    .map(renderContentBlock)
    .filter(Boolean)
    .join("\n");
  const sortedBlocks = [...interactionBlocks].sort((a, b) => a.order - b.order);
  const interactionHtml = sortedBlocks
    .map((block) => renderInteractionBlock(block, scormRuntime?.gradingKeysByBlockId[block.id]))
    .filter(Boolean)
    .join("\n");
  const nav =
    prevHref || nextHref
      ? `<nav class="page-nav"><div>${prevHref ? `<a href="${escapeHtml(prevHref)}" class="secondary">← Previous</a>` : ""}</div><div>${nextHref ? `<a href="${escapeHtml(nextHref)}">Next →</a>` : ""}</div></nav>`
      : "";
  const fontLink = buildFontLinks(brandConfig);
  const brandCss = buildBrandCss(brandConfig, logoPath);
  const c = mergeWithDefaults(brandConfig);
  const bodyFont = (c.bodyFont || c.font || "").trim();
  const headingFont = (c.headingFont || c.font || "").trim();
  const bodyFontFamily = bodyFont ? `'${String(bodyFont).replace(/'/g, "\\'")}', system-ui, sans-serif` : "system-ui, sans-serif";
  const headingFontFamily = headingFont ? `'${String(headingFont).replace(/'/g, "\\'")}', system-ui, sans-serif` : "inherit";
  const logoHtml =
    logoPath ?
      `<header class="course-header"><img src="${escapeHtml(logoPath)}" alt="Logo" class="course-logo" /></header>`
    : "";
  const bodyDataAttrs = buildScormBodyDataAttrs(scormRuntime);

  const progressPercent =
    scormRuntime && scormRuntime.totalPages > 0
      ? Math.round(((scormRuntime.pageIndex + 1) / scormRuntime.totalPages) * 100)
      : 100;
  const progressBarHtml =
    scormRuntime && scormRuntime.totalPages > 0
      ? `<div class="progress-bar" role="presentation"><div class="progress-bar-fill" style="width: ${progressPercent}%;"></div></div>`
      : "";

  const microLabelHtml =
    moduleIndex !== undefined && moduleTitle
      ? `<p class="micro-label">MODULE ${moduleIndex + 1}${lessonIndex !== undefined && lessonTitle ? ` · ${lessonTitle}` : ""}</p>`
      : "";

  const pageIndex = scormRuntime?.pageIndex ?? 0;
  const sectionNumber = String(pageIndex + 1).padStart(2, "0");
  const sectionAnchorHtml = `<span class="section-number" aria-hidden="true">${sectionNumber}</span>`;

  const bodyContent = `
  ${progressBarHtml}
  <div class="course-wrapper">
    ${logoHtml}
    <main class="course-main">
      ${microLabelHtml}
      <div class="section-heading-wrap">
        ${sectionAnchorHtml}
        <h1>${escapeHtml(pageTitle)}</h1>
      </div>
      <div class="content">${contentHtml}</div>
      <div class="interactions">${interactionHtml}</div>
      ${nav}
    </main>
  </div>
  <script src="${escapeHtml(scormApiPath)}"></script>
  <script>
${buildScormRuntimeScript(scormRuntime)}
  </script>
  <script>
(function() {
  var reveals = document.querySelectorAll('.reveal');
  if (!reveals.length) return;
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) entry.target.classList.add('visible');
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
  reveals.forEach(function(el) { observer.observe(el); });
})();
  </script>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(pageTitle)} - ${escapeHtml(courseTitle)}</title>
  ${fontLink}
  <style>
    :root { --muted: #6b7280; }
    body { font-family: ${bodyFontFamily}; font-size: 1.05rem; line-height: 1.65; margin: 0; padding: 0; color: #1a1a1a; }
    .course-wrapper { max-width: 780px; margin: 0 auto; padding: 2rem 1.5rem 4rem; }
    .course-main { background: #f7f8fa; border-top: 4px solid var(--brand-accent, #ff7700); padding: 3rem 2rem; margin-top: 0; border-radius: 0 0 12px 12px; }
    .progress-bar { position: sticky; top: 0; left: 0; right: 0; height: 3px; background: rgba(0,0,0,0.06); z-index: 100; }
    .progress-bar-fill { height: 100%; background: var(--brand-accent, #ff7700); transition: width 0.2s ease; }
    .course-header { margin-bottom: 2rem; }
    .course-logo { max-height: 48px; width: auto; }
    .micro-label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.04em; color: var(--muted); margin: 0 0 0.25rem 0; }
    .section-heading-wrap { position: relative; margin-bottom: 3rem; }
    .section-number { position: absolute; left: 0; top: -0.2em; font-size: 4rem; font-weight: 700; opacity: 0.03; line-height: 1; pointer-events: none; }
    h1, h2, h3, h4, h5, h6, .content-heading { font-family: ${headingFontFamily}; }
    h1 { font-size: 2.25rem; font-weight: 700; margin: 0 0 0.5em 0; }
    h2 { font-size: 1.65rem; font-weight: 600; margin: 2rem 0 0.5em 0; }
    h3 { font-size: 1.2rem; font-weight: 500; margin: 1.5rem 0 0.35em 0; }
    .content-text { margin: 1.2em 0; }
    .content-text p { margin: 0 0 1.2em 0; }
    .content-text p:last-child { margin-bottom: 0; }
    .content-heading { margin: 2rem 0 0.5em 0; }
    .content-heading:first-of-type { margin-top: 0; }
    .content-image { margin: 3rem 0; }
    .content-image img { max-width: 100%; height: auto; border-radius: 8px; }
    .content-video { margin: 3rem 0; }
    .content-video iframe { width: 100%; aspect-ratio: 16/9; border-radius: 8px; }
    .key-insight { margin: 3rem 0; padding: 1.5rem 1.5rem 1.5rem 1.75rem; border-left: 4px solid var(--brand-accent, #ff7700); background: rgba(0,0,0,0.02); font-size: 1.1rem; line-height: 1.65; border-radius: 0 8px 8px 0; }
    .key-insight p { margin: 0; }
    .content-card { margin: 3rem 0; padding: 24px 32px; background: #ffffff; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.04); }
    .content-card-title { font-weight: 600; font-size: 1.1rem; margin: 0 0 0.75em 0; }
    .content-card-body { margin: 0; }
    .interaction { margin: 4rem 0; padding: 24px 32px; background: #ffffff; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.04); }
    .interaction .question, .interaction .prompt { margin: 0 0 1rem 0; font-weight: 500; }
    .interaction .options { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.5rem; }
    .interaction .option-item { margin: 0; }
    .interaction .option-item label { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1rem; border-radius: 8px; border: 2px solid #e5e7eb; cursor: pointer; transition: border-color 0.15s ease, background-color 0.15s ease; }
    .interaction .option-item label:hover { border-color: var(--brand-accent, #ff7700); background: rgba(255,119,0,0.04); }
    .interaction .option-item:has(input:checked) label { border-color: var(--brand-accent, #ff7700); background: rgba(255,119,0,0.08); }
    .interaction .option-item label:focus-within { border-color: var(--brand-accent, #ff7700); }
    .interaction .reflection-input { width: 100%; padding: 0.75rem; border-radius: 8px; border: 2px solid #e5e7eb; font-family: inherit; font-size: 1rem; resize: vertical; transition: border-color 0.15s ease; }
    .interaction .reflection-input:focus { outline: none; border-color: var(--brand-accent, #ff7700); }
    .page-nav { display: flex; justify-content: space-between; margin-top: 4rem; padding-top: 2rem; border-top: 1px solid rgba(0,0,0,0.08); }
    .page-nav a { text-decoration: none; padding: 0.5rem 1rem; border-radius: 8px; font-weight: 600; transition: background-color 0.15s ease, color 0.15s ease; }
    .reveal { opacity: 0; transition: opacity 0.25s ease; }
    .reveal.visible { opacity: 1; }
    ${brandCss}
    .page-nav a { border-radius: 8px; }
  </style>
</head>
<body${bodyDataAttrs}>${bodyContent}
</body>
</html>`;
}

function buildScormBodyDataAttrs(runtime?: ScormRuntimeOptions): string {
  if (!runtime || runtime.totalPages <= 0) return "";
  return ` data-scorm-page-index="${runtime.pageIndex}" data-scorm-total-pages="${runtime.totalPages}" data-scorm-total-max="${Math.max(1, runtime.totalScoreMax)}"`;
}

function buildScormRuntimeScript(runtime?: ScormRuntimeOptions): string {
  if (!runtime || runtime.totalPages <= 0) {
    return `if (typeof SCORM !== 'undefined') { SCORM.init(); SCORM.setLessonStatus('incomplete'); }
    window.addEventListener('beforeunload', function() { if (typeof SCORM !== 'undefined') SCORM.setLessonStatus('completed'); });`;
  }
  return `(function() {
  var body = document.body;
  var pageIndex = parseInt(body.getAttribute('data-scorm-page-index') || '0', 10);
  var totalPages = parseInt(body.getAttribute('data-scorm-total-pages') || '1', 10);
  var totalScoreMax = Math.max(1, parseInt(body.getAttribute('data-scorm-total-max') || '1', 10));
  function initScorm() {
    if (typeof SCORM === 'undefined') return;
    SCORM.init();
    SCORM.setLessonStatus('incomplete');
    var sd = SCORM.getSuspendData();
    var state = { viewed: [], score: 0, answers: {} };
    try { if (sd) state = JSON.parse(sd); } catch (e) {}
    if (!state.viewed) state.viewed = [];
    if (state.viewed.indexOf(pageIndex) === -1) state.viewed.push(pageIndex);
    state.viewed = state.viewed.filter(function(v, i, a) { return a.indexOf(v) === i; });
    if (!state.answers) state.answers = {};
    SCORM.setSuspendData(JSON.stringify(state));
    SCORM.setScore(state.score || 0, 0, totalScoreMax);
    var graded = document.querySelectorAll('[data-scorm-graded="true"]');
    [].forEach.call(graded, function(el) {
      var inputs = el.querySelectorAll('input[type="radio"]');
      var correctVal = el.getAttribute('data-correct');
      var correctIdx = el.getAttribute('data-correct-index');
      var isCorrect = correctVal !== null && correctVal !== ''
        ? function(v) { return v === correctVal; }
        : function(v) { return parseInt(v, 10) === parseInt(correctIdx, 10); };
      [].forEach.call(inputs, function(inp) {
        inp.addEventListener('change', function() {
          if (typeof SCORM === 'undefined') return;
          var sd2 = SCORM.getSuspendData();
          var s2 = { viewed: state.viewed, score: 0, answers: state.answers || {} };
          try { if (sd2) s2 = JSON.parse(sd2); } catch (e) {}
          var key = el.getAttribute('data-block-id');
          s2.answers[key] = isCorrect(this.value);
          var n = 0;
          for (var k in s2.answers) if (s2.answers[k]) n++;
          s2.score = n;
          state.score = n;
          state.answers = s2.answers;
          SCORM.setSuspendData(JSON.stringify(s2));
          SCORM.setScore(n, 0, totalScoreMax);
        });
      });
    });
    window.addEventListener('beforeunload', function() { SCORM.setLessonStatus('completed'); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initScorm);
  else initScorm();
})();`;
}
