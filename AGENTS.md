<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes. Read the relevant guide in `node_modules/next/dist/docs/` before writing code and heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Frontend Skill Routing

For frontend product work, use skills in this order when they match:

1. `ui-ux-pro-max`
2. `frontend-design`
3. `tailwind-design-system`
4. `web-design-guidelines`
5. `fixing-accessibility`
6. `vercel-react-best-practices`

## Product Guardrails

Resume Studio follows the product definition in [`README.md`](./README.md).

Default development direction:

1. Build or recover a draft
2. Turn it into a stable source resume
3. Add targeting inputs and generate tailored variants
4. Review readiness in Preview
5. Export PDF
6. Return to `/resumes` to manage lineage and next actions

When proposing or implementing work:

- Prefer changes that strengthen one step in the core chain above
- Preserve the distinction between source drafts, tailored variants, and final preview/export
- Keep `/resumes` focused on lineage, readiness, and next actions
- Prefer editing quality, targeting clarity, export confidence, and editing history over adjacent ideas

Unless the user explicitly asks otherwise, do not steer the product toward:

- application tracking
- follow-up reminders
- interview CRM
- recruiting pipeline management

## Product UI Constraints

- Start with information architecture and page decomposition before visual polish
- Avoid putting multiple unrelated jobs into one screen
- Prefer multi-page flows, tabs, drawers, secondary panels, step flows, or master-detail layouts when needed
- Keep each screen focused on one dominant task
- Treat repeated card stacking as a sign the information architecture should be split instead
