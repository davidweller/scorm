# SCORM Builder

A web-based application that enables users to define a course blueprint, generate full modules section-by-section, create H5P interactives, insert YouTube videos, generate branded images with OpenAI, and export as SCORM 1.2 for LMS upload. Uses Bring Your Own API Keys (OpenAI).

## Tech stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS** (dynamic theming via CSS variables)
- Planned: PostgreSQL, encrypted key storage, object storage, H5P integration

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project structure

- `src/app/` – App Router pages (dashboard, courses, settings)
- `src/components/` – UI and feature components
- `src/lib/` – OpenAI, SCORM packaging, storage, crypto
- `src/types/` – TypeScript types (course, blueprint, module, branding, activity)

## Product requirements

See [SCORM_PRD.md](./SCORM_PRD.md) for full product requirements and workflow.

## License

Private.
