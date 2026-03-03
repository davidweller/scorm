# SCORM Course Builder SaaS -- Product Requirements Document (PRD)

## 1. Product Overview

**Working Name:** TBD\
**Category:** B2B SaaS -- E-learning Authoring & SCORM Export\
**Primary Output:** SCORM 1.2 / SCORM 2004 compliant `.zip` packages

### Core Value Proposition

Enable instructional designers, universities, and training teams to
rapidly generate interactive, brand-aligned SCORM courses using
AI-assisted content creation and structured templates.

------------------------------------------------------------------------

## 2. Problem Statement

Current SCORM authoring tools:

-   Are expensive and desktop-bound\
-   Have steep learning curves\
-   Are slow for structured academic content\
-   Do not integrate well with AI workflows\
-   Are difficult to brand at scale

Institutions need:

-   Faster course production\
-   LMS-ready exports\
-   AI-assisted content drafting\
-   Brand consistency\
-   SCORM compliance without technical complexity

------------------------------------------------------------------------

## 3. Target Users

### Primary

-   Higher education professional services teams\
-   Academic developers\
-   Corporate L&D teams\
-   Independent course creators

### Secondary

-   Agencies building compliance courses\
-   EdTech startups

------------------------------------------------------------------------

## 4. Core Features (MVP)

### 4.1 Course Creation Engine

-   Course title and overview\
-   Learning outcomes (ILOs) input\
-   Module and lesson builder\
-   Page-based structure (screen-level authoring)

### 4.2 AI Content Generation

Generate: - Lesson outlines\
- Slide content\
- Knowledge checks\
- Case studies\
- Scenario branches

Features: - Regenerate/edit per block\
- Tone selection\
- Length control

### 4.3 Interactive Components Library

Supported interactions (MVP): - Multiple choice\
- True/false\
- Drag-and-drop\
- Matching\
- Basic scenario branching\
- Reflection text input (non-graded)

### 4.4 Brand Customisation

-   Primary colour\
-   Secondary colour\
-   Accent colour\
-   Background colour\
-   Logo upload\
-   Font selection (Google Fonts)\
-   Global design tokens\
-   Live preview mode

### 4.5 Media Integration

-   Image upload\
-   AI image generation (style presets)\
-   Embed YouTube/Vimeo links\
-   Icon library\
-   Basic animations and transitions

### 4.6 SCORM Export Engine (Critical)

Export options: - SCORM 1.2\
- SCORM 2004 (3rd edition)\
- Completion criteria: - Percentage of pages viewed\
- Quiz pass percentage\
- Pass/fail or complete/incomplete

Includes: - Bookmarking support\
- Score reporting\
- Time tracking

Output: - LMS-ready `.zip` file\
- Valid `imsmanifest.xml`\
- JavaScript SCORM API wrapper\
- Responsive HTML5 package

### 4.7 Testing & Validation

-   Built-in "Preview as LMS" mode\
-   Debug log viewer\
-   SCORM validation check

------------------------------------------------------------------------

## 5. Advanced Features (Phase 2)

-   xAPI export\
-   Multi-language generation\
-   Accessibility checker (WCAG 2.2)\
-   Version control\
-   Collaboration (comments + roles)\
-   Template marketplace\
-   LMS analytics connector\
-   Bulk course duplication\
-   Cross-institution cloning

------------------------------------------------------------------------

## 6. Technical Architecture

### Frontend

-   React + TypeScript\
-   Modular block-based editor\
-   Drag-and-drop builder\
-   Centralised state management

### Backend

-   Node.js API\
-   Course JSON schema\
-   SCORM packaging microservice\
-   AI service abstraction layer

### Storage

-   Cloud object storage (S3-compatible)\
-   PostgreSQL for structured course data

### SCORM Engine Layer

-   SCORM API wrapper (JavaScript)\
-   Runtime event tracking\
-   Automatic manifest generator\
-   Course-to-SCO mapping logic

------------------------------------------------------------------------

## 7. Data Model (High-Level)

### Course

-   Metadata\
-   Brand configuration\
-   Modules\[\]

### Module

-   Lessons\[\]

### Lesson

-   Pages\[\]

### Page

-   Content blocks\[\]\
-   Interaction blocks\[\]\
-   Completion rules

------------------------------------------------------------------------

## 8. Compliance & Accessibility

-   WCAG AA minimum\
-   Full keyboard navigation\
-   ARIA labels\
-   Caption support for embedded media\
-   Automated colour contrast checking

------------------------------------------------------------------------

## 9. Monetisation Model

### Tier 1 -- Starter

-   Limited exports per month\
-   SCORM 1.2 only\
-   Basic branding

### Tier 2 -- Pro

-   Unlimited exports\
-   SCORM 2004\
-   Advanced interactions\
-   AI generation credits

### Tier 3 -- Enterprise

-   Team accounts\
-   White-label export\
-   Custom branding defaults\
-   LMS integration support\
-   Priority compliance validation

Optional: - Bring-your-own API keys\
- Per-export pricing\
- Template marketplace revenue share

------------------------------------------------------------------------

## 10. Success Metrics

-   Time to first SCORM export\
-   Course build completion rate\
-   Export-to-LMS success rate\
-   AI generation usage percentage\
-   Monthly exports per user\
-   90-day retention rate

------------------------------------------------------------------------

## 11. Competitive Positioning

Competes with: - Articulate Storyline\
- Adobe Captivate\
- iSpring Suite

Differentiation: - AI-native workflow\
- Fully web-based\
- Faster structured academic builds\
- Transparent pricing\
- Brand automation\
- Developer-friendly export logic

------------------------------------------------------------------------

## 12. Risks

-   SCORM edge-case compatibility\
-   LMS inconsistencies\
-   AI hallucination in assessments\
-   Accessibility compliance complexity\
-   Scope creep toward full LMS functionality

------------------------------------------------------------------------

## 13. MVP Definition (Strict Scope)

The MVP must: - Create structured courses\
- Include three interaction types\
- Export valid SCORM 1.2\
- Track completion and score\
- Support branding\
- Pass SCORM Cloud validation

Anything beyond this is excluded from MVP.

------------------------------------------------------------------------

## 14. MVP User Flow

The primary path through the product is a five-step flow from course creation to SCORM export.

### Step 1 — Create course

**Inputs:** Title/topic, audience, duration, tone, compliance level, branding (optional), and optional "bring-your-own" API key setup for AI generation.

**Output:** A new course record; user is directed to the blueprint step.

### Step 2 — Generate course blueprint

**Inputs:** Course context from Step 1 (title, audience, duration, tone, compliance).

**AI proposes:** Course description, modules (titles), lessons per module (titles), ILOs (learning outcomes), and an assessment plan (where/how to assess).

**User actions:** Edit any section inline; use "Regenerate" per section to get a new AI proposal.

**Output:** Persisted blueprint (real modules/lessons plus ILOs and assessment plan); user continues to generate lesson pages.

### Step 3 — Generate lesson pages

**Inputs:** Course and blueprint (modules, lessons, ILOs, assessment plan, tone).

**For each lesson:** AI generates content blocks (intro, core content, knowledge checks, summary) and optional H5P activity suggestions.

**User actions:** Select lesson(s) or "all", trigger generation, then refine in the editor.

**Output:** Pages and content/interaction blocks created or updated; user proceeds to review.

### Step 4 — Review

**Built-in validator runs:** Reading time (estimated from content), coverage vs ILOs, accessibility checks (e.g. alt text, headings, contrast), and link checks (e.g. video embeds, URLs in text).

**User actions:** Review issues by category, fix manually in the editor via "Go to page" where needed.

**Output:** Validation report; user proceeds to export when ready.

### Step 5 — Export

**Inputs:** User chooses SCORM version (1.2 or 2004), completion rules (e.g. % pages viewed, quiz pass %, pass/fail), scoring options, and LMS settings (e.g. launch options).

**Output:** LMS-ready `.zip` package with valid `imsmanifest.xml`, SCORM API wrapper, and responsive HTML5 content; user downloads the package.

------------------------------------------------------------------------

## 15. Roadmap Phases

**Phase 1:** Core Builder + SCORM 1.2\
**Phase 2:** Collaboration + Templates\
**Phase 3:** xAPI + Enterprise Controls\
**Phase 4:** Marketplace + API Ecosystem
