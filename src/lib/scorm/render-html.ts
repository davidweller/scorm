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

function renderActivityHtml(activity: Activity): string {
  const json = activity.h5pJson as Record<string, unknown> | undefined;
  if (activity.type === "multiple_choice" && json?.question && Array.isArray(json.answers)) {
    const question = String(json.question);
    const answers = json.answers as { text: string; correct?: boolean }[];
    const name = `mc-${activity.id}`;
    let out = `<div class="activity activity-mc" data-activity-id="${escapeHtml(activity.id)}">
      <p class="activity-question">${escapeHtml(question)}</p>
      <ul class="activity-options">`;
    answers.forEach((ans, i) => {
      const correct = Boolean(ans.correct);
      out += `<li><label class="activity-option"><input type="radio" name="${escapeHtml(name)}" value="${i}" data-correct="${correct ? "1" : "0"}"> ${escapeHtml(ans.text)}</label></li>`;
    });
    out += `</ul><p class="activity-feedback" aria-live="polite"></p></div>`;
    return out;
  }
  if (activity.type === "flashcards" && Array.isArray(json?.cards)) {
    const cards = json.cards as { front: string; back: string }[];
    let out = `<div class="activity activity-flashcards" data-activity-id="${escapeHtml(activity.id)}">
      <div class="flashcards-grid">`;
    cards.forEach((card, i) => {
      out += `<div class="flashcard" tabindex="0" role="button">
        <div class="flashcard-inner"><div class="flashcard-front">${escapeHtml(card.front)}</div><div class="flashcard-back">${escapeHtml(card.back)}</div></div></div>`;
    });
    out += `</div></div>`;
    return out;
  }
  return `<div class="activity-placeholder" data-activity-type="${escapeHtml(activity.type)}">Activity: ${escapeHtml(activity.type.replace("_", " "))}</div>`;
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
      const moduleActivities = activities.filter((a) => a.moduleId === mod.id);
      const referencedActivityIds = new Set<string>();
      const sectionsHtml = mod.sections
        .map(
          (sec) => {
            const sectionActivities =
              sec.activityIds
                ?.map((id) => {
                  referencedActivityIds.add(id);
                  return moduleActivities.find((a) => a.id === id);
                })
                .filter((a): a is Activity => Boolean(a)) ?? [];
            const sectionActivitiesHtml =
              sectionActivities.length > 0
                ? `<div class="activities">
                    ${sectionActivities.map((a) => renderActivityHtml(a)).join("")}
                  </div>`
                : "";
            return `
          <section class="content-section">
            <h3>${escapeHtml(sec.heading)}</h3>
            <div class="content">${sec.content ? sec.content.split(/\n/).filter(Boolean).map((p) => `<p>${escapeHtml(p)}</p>`).join("") : ""}</div>
            ${sec.scenario ? `<div class="scenario"><strong>Scenario:</strong> ${escapeHtml(sec.scenario)}</div>` : ""}
            ${sec.reflectionPrompt ? `<div class="reflection"><strong>Reflection:</strong> ${escapeHtml(sec.reflectionPrompt)}</div>` : ""}
            ${sec.knowledgeChecks?.length ? `<ul class="knowledge-checks">${sec.knowledgeChecks.map((k) => `<li>${escapeHtml(k)}</li>`).join("")}</ul>` : ""}
            ${sec.resourceSuggestions?.length ? `<div class="resource-suggestions"><strong>Further reading:</strong><ul>${sec.resourceSuggestions.map((r) => `<li>${escapeHtml(r)}</li>`).join("")}</ul></div>` : ""}
            ${sectionActivitiesHtml}
          </section>`
          }
        )
        .join("");
      const videosHtml = mod.youtubeUrls.map(embedYoutube).join("");
      const unplacedActivities = moduleActivities.filter((a) => !referencedActivityIds.has(a.id));
      const activitiesHtml =
        unplacedActivities.length > 0
          ? `<div class="activities">
              ${unplacedActivities.map((a) => renderActivityHtml(a)).join("")}
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

  const textColor = branding.textColor ?? "#1b0101";
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(course.title)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Work+Sans:wght@400;500;600;700&family=Ubuntu:wght@400;500;700&display=swap" rel="stylesheet" />
  <style>
    :root {
      --color-primary: ${branding.primaryColor};
      --color-secondary: ${branding.secondaryColor};
      --color-accent: ${branding.accentColor};
      --color-background: ${branding.backgroundColor};
      --color-text: ${textColor};
      --font-heading: ${branding.headingFont};
      --font-body: ${branding.bodyFont};
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: var(--font-body);
      background: var(--color-background);
      color: var(--color-text);
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
    .resource-suggestions { margin: 0.75rem 0; font-size: 0.95rem; }
    .resource-suggestions ul { margin: 0.25rem 0 0 1rem; padding: 0; }
    .video-wrapper { position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; margin: 1rem 0; }
    .video-wrapper iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0; }
    .activity-placeholder { margin: 1rem 0; padding: 1rem; border: 2px dashed var(--color-secondary); border-radius: 6px; color: var(--color-secondary); }
    .hero-image { max-width: 100%; height: auto; border-radius: 6px; margin: 0.5rem 0; }
    .activity { margin: 1rem 0; padding: 1rem; border: 1px solid var(--color-secondary); border-radius: 8px; }
    .activity-question { font-weight: 600; margin-bottom: 0.5rem; }
    .activity-options { list-style: none; padding: 0; margin: 0; }
    .activity-option { display: block; padding: 0.4rem 0; cursor: pointer; }
    .activity-option input { margin-right: 0.5rem; }
    .activity-feedback { margin-top: 0.5rem; font-weight: 600; }
    .flashcards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 0.75rem; }
    .flashcard { perspective: 600px; cursor: pointer; min-height: 100px; }
    .flashcard-inner { position: relative; width: 100%; height: 100%; min-height: 80px; transition: transform 0.5s; transform-style: preserve-3d; }
    .flashcard.flipped .flashcard-inner { transform: rotateY(180deg); }
    .flashcard-front, .flashcard-back { position: absolute; width: 100%; height: 100%; backface-visibility: hidden; padding: 0.75rem; border-radius: 6px; background: #f0f4f8; display: flex; align-items: center; justify-content: center; text-align: center; }
    .flashcard-back { transform: rotateY(180deg); background: var(--color-primary); color: #fff; }
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
  <script>
    (function() {
      document.querySelectorAll(".activity-mc input[type=radio]").forEach(function(radio) {
        radio.addEventListener("change", function() {
          var wrap = this.closest(".activity-mc");
          var fb = wrap ? wrap.querySelector(".activity-feedback") : null;
          if (fb) fb.textContent = this.getAttribute("data-correct") === "1" ? "Correct!" : "Not quite. Try again.";
        });
      });
      document.querySelectorAll(".flashcard").forEach(function(card) {
        card.addEventListener("click", function() { this.classList.toggle("flipped"); });
        card.addEventListener("keydown", function(e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); this.classList.toggle("flipped"); } });
      });
    })();
  </script>
</body>
</html>`;
}
