# SCORM Builder (Web App)

## Product Requirements Document (PRD)

------------------------------------------------------------------------

# 1. Product Overview

A web-based application that enables users to:

-   Define a course blueprint (topic, audience, length, ILOs, tone)
-   Automatically generate full modules section-by-section
-   Create structured H5P interactive activities
-   Insert YouTube videos
-   Generate branded images using OpenAI
-   Render polished responsive HTML
-   Export as SCORM 1.2 for LMS upload
-   Use Bring Your Own API Keys (OpenAI)

Primary users: - L&D teams - Universities - Consultants - Independent
course creators

------------------------------------------------------------------------

# 2. Core Value Proposition

Turn minimal input (topic + length) into a fully structured,
interactive, SCORM-ready course --- branded and LMS-compatible --- in
minutes.

------------------------------------------------------------------------

# 3. Target User Workflow

1.  Create Course\
2.  Define Branding\
3.  Generate Blueprint\
4.  Approve Structure\
5.  Generate Modules\
6.  Approve/Refine Sections\
7.  Generate H5P Interactives\
8.  Insert YouTube Links\
9.  Generate Images\
10. Preview Responsive HTML\
11. Export SCORM 1.2

------------------------------------------------------------------------

# 4. Functional Requirements

------------------------------------------------------------------------

## 4.1 Course Blueprint Engine

### Minimum Required Inputs

-   Course topic (required)\
-   Total course length (required)

### Optional User Inputs

Users may also provide:

-   Intended Learning Outcomes (ILOs)
-   Course overview
-   Module summaries
-   Existing notes (free text)
-   Assessment description
-   Target audience description
-   Tone preferences
-   Level
-   Delivery mode

### System Behaviour

#### Scenario A --- Minimal Input

System generates:

-   Course overview
-   Draft ILOs
-   Module breakdown
-   Suggested module titles
-   Suggested time allocation
-   Suggested activity types

#### Scenario B --- User Provides ILOs / Overview

System must:

1.  Preserve user-provided ILOs unless "optimise" is selected.
2.  Map ILOs to modules.
3.  Generate aligned knowledge checks.
4.  Suggest aligned assessments.
5.  Maintain tone and phrasing where appropriate.

### Alignment Logic

System performs:

-   ILO-to-module mapping
-   ILO-to-assessment mapping
-   Coverage check (all ILOs addressed)
-   Optional Bloom's verb consistency check (Phase 2)

### Approval Flow

1.  User reviews blueprint\
2.  User edits\
3.  User approves blueprint\
4.  Blueprint locks for generation

------------------------------------------------------------------------

## 4.2 Module Content Generator

For each module:

-   Introduction
-   Section headings
-   Explanatory content
-   Scenario (optional)
-   Reflection prompt
-   Knowledge checks
-   Resource suggestions (optional)

User can:

-   Regenerate sections
-   Edit manually
-   Lock module
-   Approve before SCORM export

Voiceover scripts: Not included.\
YouTube links can be embedded responsively.

------------------------------------------------------------------------

## 4.3 Interactive Activity Engine (H5P)

Supported Types (MVP):

1.  Multiple Choice\
2.  True/False\
3.  Fill in the Blanks\
4.  Drag and Drop\
5.  Flashcards\
6.  Branching Scenario (Phase 2)

Workflow:

-   User selects activity type
-   System generates H5P-compatible JSON
-   User edits / approves
-   Activity embedded in preview and SCORM export

------------------------------------------------------------------------

## 4.4 Branding & Design System

Users can define:

-   Primary colour
-   Secondary colour
-   Accent colour
-   Background colour
-   Heading font
-   Body font
-   Logo upload

Branding applies to:

-   HTML templates
-   H5P styling overrides (where possible)
-   Generated images

------------------------------------------------------------------------

## 4.5 Image Generation Engine

Uses OpenAI Image API.

User selects:

-   Image style preset
-   Or custom style prompt

System:

-   Injects brand colours into prompt
-   Generates module hero image
-   Allows regeneration and approval

------------------------------------------------------------------------

## 4.6 Bring Your Own API Keys (BYOK)

Users provide:

-   OpenAI API key

Requirements:

-   Encrypted storage
-   Per-user isolation
-   No logging of keys
-   Disable generation if no key provided

------------------------------------------------------------------------

## 4.7 HTML Rendering Engine

System renders:

-   Responsive HTML5
-   Mobile-friendly layout
-   Themed design
-   Embedded H5P
-   Embedded YouTube

Preview modes:

-   Desktop
-   Tablet
-   Mobile

------------------------------------------------------------------------

## 4.8 SCORM 1.2 Export

System generates:

-   imsmanifest.xml
-   SCORM API wrapper
-   Completion tracking
-   Score tracking
-   Bookmarking support
-   Packaged zip file

Must work with major LMS platforms.

------------------------------------------------------------------------

# 5. Non-Functional Requirements

-   Responsive UI
-   Fast generation times
-   Secure key handling
-   Reliable export packaging
-   Multi-course dashboard

------------------------------------------------------------------------

# 6. Suggested Technical Architecture

Frontend:

-   React / Next.js
-   Tailwind (dynamic theming)
-   H5P JS integration

Backend:

-   Node.js or FastAPI
-   Background job queue
-   SCORM packaging service
-   Encrypted API key storage

Storage:

-   Object storage for images, H5P JSON, SCORM packages

------------------------------------------------------------------------

# 7. MVP Scope

Include:

-   Blueprint generation
-   Module content generation
-   Multiple choice + flashcards (H5P)
-   Branding controls
-   Image generation
-   SCORM export
-   BYOK OpenAI key

Exclude:

-   Branching scenarios
-   Collaboration features
-   Advanced analytics
-   Multi-language support

------------------------------------------------------------------------

# 8. Future Enhancements

-   Adaptive AI feedback
-   Native interaction engine
-   xAPI export
-   Direct LMS publish
-   Institutional admin accounts
-   Instructional design critique engine

------------------------------------------------------------------------

# 9. Risks & Mitigation

  Risk                           Mitigation
  ------------------------------ ----------------------
  SCORM compatibility variance   LMS testing matrix
  H5P styling limits             Custom CSS overrides
  API cost unpredictability      Usage estimator
  Image variability              Locked style presets

------------------------------------------------------------------------

# 10. Success Metrics

-   Time to first SCORM export \< 15 minutes\
-   \< 3 regeneration cycles per module\
-   90% export success rate\
-   User satisfaction score \> 8
