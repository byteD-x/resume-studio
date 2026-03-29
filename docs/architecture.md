# Resume Studio Architecture

## Overview

Resume Studio is a local-first Next.js App Router application for writing, refining, tailoring, and exporting resumes.

- Runtime: Next.js 16 App Router with Node.js route handlers
- Storage: local filesystem under `data/resumes/<id>`
- Editing model: one `document.json` per resume draft
- Export: HTML preview rendered to PDF through Playwright Chromium

## Core flow

1. Dashboard creates or lists resume drafts.
2. Studio edits a single `ResumeDocument`.
3. Autosave persists the document through `/api/resumes/[id]`.
4. Import routes rebuild structured drafts from portfolio or PDF inputs.
5. Targeting and tailoring derive role-specific variants from the current draft.
6. Export route validates the draft, renders preview HTML, and writes a PDF archive.

## Data model

The canonical source of truth is `data/resumes/<id>/document.json`.

Key fields:

- `meta.schemaVersion`: compatibility version for future evolution
- `meta.writerProfile`: `campus | experienced | career-switch`
- `meta.workflowState`: `drafting | tailoring | ready`
- `targeting`: role, company, JD, keywords, notes
- `layout`: template, typography, margins, spacing
- `sections`: structured resume content used by editing, preview, and export

Old documents remain compatible because the schema supplies defaults for new fields.

## Quality system

The writing quality layer is built from shared rules in `src/lib/resume-quality.ts`.

- `blockingIssues`: hard problems that should stop export
- `warnings`: quality or layout risks
- `suggestions`: non-blocking improvements
- `buildResumeExportChecklist()`: shared checklist for Studio and export gating

The same rules drive:

- Studio diagnostics
- workbench scores and next-step tasks
- export checklist
- export route validation

## Testing and release gates

Required checks:

- `npm run lint`
- `npm run test:unit`
- `npm run test:e2e`
- `npm run build`

CI mirrors the same gate so local validation and automated validation stay aligned.
