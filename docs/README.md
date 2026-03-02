# Example course (W1 AI Foundations & Responsible Use)

The app uses **W1. AI Foundations & Responsible Use** as a reference when generating new course blueprints and module content. Generated courses follow its structure, tone, and section patterns.

## Contents

- **`example-course-w1-ai-foundations.md`** – Plain-text extraction of the example course (overview, ILOs, modules, sections). Used as the source for the structure and excerpts in code.
- **`src/lib/openai/example-course.ts`** (in project root) – Exports the structure summary and short excerpts injected into AI prompts.

## Re-extracting from the Word document

If you edit the original Word file (`W1 AI Foundations & Responsible Use.docx`), regenerate the markdown:

1. Place the `.docx` in the project root (same folder as `package.json`).
2. Run:
   ```bash
   npm run extract-example-course
   ```
3. The script overwrites `docs/example-course-w1-ai-foundations.md` with the extracted text.

After that, you may want to update `src/lib/openai/example-course.ts` so the structure summary and excerpts still match the new content (e.g. ILO count, module titles, tone).

## Reference course at a glance

- **Audience:** All staff (foundation level)
- **Duration:** ~45–60 minutes
- **Modules:** 6 (e.g. AI Today, What is AI?, Hands-On with Copilot, Responsible Use, Decision Matrix, Prompting Basics)
- **Section pattern:** Introduction → Parts with headings → Activity/Scenario → Takeaway → Transition
- **Tone:** Professional, direct, reassuring; real-world and sector-specific examples
