# SCORM Builder

A web-based application that enables users to define a course blueprint, generate full modules section-by-section, create H5P-style activities (multiple choice, flashcards), insert YouTube videos, generate branded images with OpenAI, and export as SCORM 1.2 for LMS upload. Uses Bring Your Own API Keys (OpenAI).

## Tech stack

- **Next.js 14** (App Router) + **React 18** + **TypeScript**
- **Tailwind CSS** (dynamic theming via CSS variables)
- **OpenAI** (GPT-4o-mini for blueprint/module/activity generation; DALL·E 2 for images)
- **JSZip** (SCORM package)
- File-based storage (`.data/`) for courses, branding, blueprint, modules, activities, settings, uploads

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ENCRYPTION_KEY` | No (dev default) | Secret used to encrypt stored OpenAI API keys. Set a strong value in production (e.g. 32+ character random string). |

Without `ENCRYPTION_KEY` set, a default dev key is used; do not rely on it in production.

## Example course (generation style)

Blueprint and module generation are guided by a reference course (**W1. AI Foundations & Responsible Use**). New courses follow its structure (overview, ILOs, module/section pattern, tone). The extracted text lives in `docs/example-course-w1-ai-foundations.md`; prompts use the summary and excerpts in `src/lib/openai/example-course.ts`. To re-extract after editing the Word source, put the `.docx` in the project root and run `npm run extract-example-course`. See [docs/README.md](./docs/README.md) for details.

## Project structure

- `src/app/` – App Router pages (dashboard, courses, settings)
- `src/components/` – UI and feature components
- `src/lib/` – OpenAI prompts, SCORM packaging, file store, crypto, example-course asset
- `src/types/` – TypeScript types (course, blueprint, module, branding, activity)

## LMS testing

Export produces a SCORM 1.2 zip (imsmanifest.xml, index.html, API wrapper, completion script). Test the zip in your target LMS and document results. See [LMS_TESTING.md](./LMS_TESTING.md) for a testing checklist.

## Product requirements

See [SCORM_PRD.md](./SCORM_PRD.md) for full product requirements and workflow.

## License

Private.
