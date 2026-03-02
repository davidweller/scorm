import type { Course } from "@/types/course";
import type { Branding } from "@/types/branding";
import type { Module } from "@/types/module";
import type { Activity } from "@/types/activity";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function embedYoutube(url: string): string {
  const id =
    url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/)?.[1] ?? "";
  if (!id) return `<p class="video-placeholder">Video: ${escapeHtml(url)}</p>`;
  return `
    <div class="video-wrapper">
      <iframe
        src="https://www.youtube.com/embed/${escapeHtml(id)}"
        title="YouTube video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen
      ></iframe>
    </div>`;
}

export function renderCourseHtml(
  course: Course,
  branding: Branding,
  modules: Module[],
  activities: Activity[]
): string {
  const modulesHtml = modules
    .sort((a, b) => a.order - b.order)
    .map((mod) => {
      const sectionsHtml = mod.sections
        .map(
          (sec) => `
          <section class="content-section">
            <h3>${escapeHtml(sec.heading)}</h3>
            <div class="content">${sec.content ? sec.content.split(/\n/).filter(Boolean).map((p) => `<p>${escapeHtml(p)}</p>`).join("") : ""}</div>
            ${sec.scenario ? `<div class="scenario"><strong>Scenario:</strong> ${escapeHtml(sec.scenario)}</div>` : ""}
            ${sec.reflectionPrompt ? `<div class="reflection"><strong>Reflection:</strong> ${escapeHtml(sec.reflectionPrompt)}</div>` : ""}
            ${sec.knowledgeChecks?.length ? `<ul class="knowledge-checks">${sec.knowledgeChecks.map((k) => `<li>${escapeHtml(k)}</li>`).join("")}</ul>` : ""}
          </section>`
        )
        .join("");
      const videosHtml = mod.youtubeUrls.map(embedYoutube).join("");
      const moduleActivities = activities.filter((a) => a.moduleId === mod.id);
      const activitiesHtml =
        moduleActivities.length > 0
          ? `<div class="activities">
              ${moduleActivities
                .map(
                  (a) =>
                    `<div class="activity-placeholder" data-activity-type="${escapeHtml(a.type)}">Activity: ${escapeHtml(a.type.replace("_", " "))}</div>`
                )
                .join("")}
            </div>`
          : "";
      return `
        <article class="module" data-module-id="${escapeHtml(mod.id)}">
          <h2>${escapeHtml(mod.title)}</h2>
          ${mod.heroImageUrl ? `<img src="${escapeHtml(mod.heroImageUrl)}" alt="" class="hero-image" />` : ""}
          ${sectionsHtml}
          ${videosHtml}
          ${activitiesHtml}
        </article>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(course.title)}</title>
  <style>
    :root {
      --color-primary: ${branding.primaryColor};
      --color-secondary: ${branding.secondaryColor};
      --color-accent: ${branding.accentColor};
      --color-background: ${branding.backgroundColor};
      --font-heading: ${branding.headingFont};
      --font-body: ${branding.bodyFont};
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: var(--font-body);
      background: var(--color-background);
      color: #1a1a1a;
      line-height: 1.6;
    }
    .container { max-width: 800px; margin: 0 auto; padding: 1.5rem; }
    h1, h2, h3 { font-family: var(--font-heading); color: var(--color-primary); }
    h1 { font-size: 1.75rem; margin-bottom: 0.5rem; }
    h2 { font-size: 1.35rem; margin-top: 2rem; border-bottom: 2px solid var(--color-accent); padding-bottom: 0.25rem; }
    h3 { font-size: 1.1rem; margin-top: 1.25rem; }
    .content-section { margin-bottom: 1.5rem; }
    .content p { margin: 0.5rem 0; }
    .scenario, .reflection { margin: 0.75rem 0; padding: 0.75rem; background: #f0f4f8; border-radius: 6px; }
    .video-wrapper { position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; margin: 1rem 0; }
    .video-wrapper iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0; }
    .activity-placeholder { margin: 1rem 0; padding: 1rem; border: 2px dashed var(--color-secondary); border-radius: 6px; color: var(--color-secondary); }
    .hero-image { max-width: 100%; height: auto; border-radius: 6px; margin: 0.5rem 0; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>${escapeHtml(course.title)}</h1>
      <p class="course-meta">${escapeHtml(course.topic)} · ${escapeHtml(course.length)}</p>
    </header>
    <main>
      ${modulesHtml}
    </main>
  </div>
</body>
</html>`;
}
