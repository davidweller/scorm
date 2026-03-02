/**
 * Example course (W1 AI Foundations & Responsible Use) structure and excerpts
 * used to guide AI-generated blueprints and module content.
 */

export const EXAMPLE_COURSE_STRUCTURE = {
  title: "W1. AI Foundations & Responsible Use",
  audience: "All Staff (Foundation Level)",
  durationMinutes: "45–60",
  designPhilosophy: "Demystification First. Mental models over magic; safety as a habit.",
  overviewStyle:
    "2–3 sentences: practical scope, what learners will gain, and relevance to their context (e.g. higher education).",
  iloStyle:
    "Clear, actionable outcomes using verbs like Distinguish, Identify, Apply, Evaluate, Demonstrate. Each ILO maps to specific modules.",
  iloCount: 5,
  moduleCount: 6,
  moduleTimeRange: "10–20 minutes each",
  moduleTitlePattern:
    "Descriptive titles that signal content: e.g. 'AI Today - You\'re Already an AI User', 'What is AI? (Demystification)', 'The Decision Matrix (To Use or Not to Use?)'",
  sectionPattern:
    "Introduction (hook or context) → Part 1, Part 2... with clear headings → optional Scenario/Activity → Key takeaway or summary → Transition to next topic.",
  activityTypes: [
    "reflection",
    "knowledge check",
    "scenario",
    "quiz/accordion",
    "fill-in-the-blank",
    "sorting/drag-and-drop",
    "practical task with steps",
  ],
  tone:
    "Professional, direct, reassuring. Address learner concerns early (e.g. 'Will AI take my job?'). Use real-world and sector-specific examples (e.g. HE, public sector).",
  contentDepth:
    "2–4 sentences per concept; use tables for comparisons and checklists; include concrete examples and 'why it matters'.",
} as const;

/** Short excerpts from the example course for prompt injection (kept within token budget). */
export const EXAMPLE_COURSE_EXCERPTS = {
  overviewSample:
    "This course covers AI foundations and responsible use. You will work through six modules to understand key concepts, spot risks, and apply a simple decision framework and prompting basics.",
  iloSample:
    "Distinguish between key AI concepts and map them to common use cases. Apply institutional principles of responsible use to identify red flags in realistic scenarios. Evaluate whether a task is appropriate for AI using simple decision prompts.",
  moduleIntroSample:
    "Introduction: You Are Already an AI User. We often talk about AI as if it is a futuristic wave. The reality? You have probably used AI three times before your first meeting of the day.",
  sectionContentSample:
    "Content: 2–4 sentences. Use concrete examples (e.g. 'Did your email finish a sentence for you? That is Predictive Text.'). End with a clear takeaway or lead into an activity.",
  reflectionPromptSample:
    "What is one takeaway from this section? Or: Can you think of a task in your role where this would be helpful? Where would it be risky?",
  scenarioSample:
    "Scenario: Alex is a Department Administrator. They paste rough notes into an AI chatbot to get a clean summary. Your task: identify the red flags (PII, sensitive data, appropriateness).",
} as const;

/** Single formatted string of structure summary for use in prompts. */
export function getExampleCoursePromptContext(): string {
  const s = EXAMPLE_COURSE_STRUCTURE;
  return [
    `Reference course: "${s.title}". Audience: ${s.audience}. Duration: ${s.durationMinutes} minutes.`,
    `Design: ${s.designPhilosophy}`,
    `Overview style: ${s.overviewStyle}`,
    `ILOs: ${s.iloCount} outcomes, phrased with verbs like Distinguish, Identify, Apply, Evaluate, Demonstrate. ${s.iloStyle}`,
    `Modules: ${s.moduleCount} modules, ${s.moduleTimeRange}. Titles: ${s.moduleTitlePattern}`,
    `Section structure: ${s.sectionPattern}`,
    `Activity types to consider: ${s.activityTypes.join(", ")}`,
    `Tone: ${s.tone}`,
    `Content: ${s.contentDepth}`,
  ].join("\n");
}

/** Short excerpt block for module/section generation (overview + one section sample). */
export function getExampleCourseExcerptsForModules(): string {
  const e = EXAMPLE_COURSE_EXCERPTS;
  return [
    "Example style from reference course:",
    `- Overview: ${e.overviewSample}`,
    `- Module intro: ${e.moduleIntroSample}`,
    `- Section content: ${e.sectionContentSample}`,
    `- Reflection: ${e.reflectionPromptSample}`,
    `- Scenario (if used): ${e.scenarioSample}`,
  ].join("\n");
}
