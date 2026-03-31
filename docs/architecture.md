# Resume Studio Architecture

Resume Studio is a local-first Next.js App Router application for writing, tailoring, previewing, and exporting resumes.

## System map

- Entry: `/`, `/templates`, `/import`, `/resumes`
  Creates drafts, recovers drafts, and converts imported material into `ResumeDocument`
- Editor: `/studio/[id]`
  Handles structured editing, Markdown editing, autosave, workbench guidance, and editing history
- Targeting and variants: `/studio/[id]`, `/api/resumes/[id]/generate-tailored-variant`
  Collects targeting inputs, analyzes keyword coverage, and creates tailored variants with lineage
- Preview and export: `/studio/[id]/preview`, `/api/resumes/[id]/export-pdf`
  Validates readiness, renders preview HTML, and exports PDF
- Library: `/resumes`
  Groups drafts by lineage and surfaces readiness plus next actions

## Runtime

- Framework: Next.js 16 App Router
- Runtime model: Node.js route handlers
- Storage: local filesystem under `data/resumes/<id>`
- Export: HTML preview rendered to PDF through Playwright Chromium

## Data model

Canonical source of truth: `data/resumes/<id>/document.json`

Key fields:

- `meta`: id, writer profile, workflow state, timestamps, source refs
- `targeting`: role, company, posting URL, JD, keywords, notes
- `layout`: template and typography settings
- `sections`: structured resume content used by editing, preview, and export

`RESUME_STUDIO_DATA_DIR` can redirect storage to another writable directory.

## Quality system

Shared rules in `src/lib/resume-quality.ts` drive:

- blocking issues
- warnings
- workbench scores
- export checklist
- preview readiness
- export validation

## Scope rule

Architecture work should strengthen draft creation, editing, targeting, preview, export, or lineage management. By default, it should not expand into application tracking or CRM-like systems.

## Release gate

```bash
npm run lint
npm run typecheck
npm run test:unit
npm run test:e2e
npm run build
```
