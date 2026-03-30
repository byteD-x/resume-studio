<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Frontend Skill Routing

For frontend product work, do not jump straight into page code. Choose the relevant skills first and use them in this order when the task matches:

1. Use `ui-ux-pro-max` when the user asks to design, redesign, optimize, or professionalize a product UI, dashboard, workspace, studio, or app shell, especially if the goal is to make the interface more focused, more product-grade, or less crowded.
2. Use `frontend-design` when implementing or reworking product-facing pages, dashboards, workspaces, multi-step flows, or multi-panel interfaces where content should be split across routes, tabs, panels, or steps instead of crammed into one screen.
3. Use `tailwind-design-system` when standardizing design tokens, component variants, layout primitives, page shells, section hierarchy, tabs, split panels, settings surfaces, or reusable composition patterns.
4. Use `web-design-guidelines` when reviewing UI quality, information architecture, screen density, hierarchy, accessibility, or whether the result feels product-grade.
5. Use `fixing-accessibility` for forms, dialogs, menus, icon buttons, keyboard flows, focus states, and other interactive controls.
6. Use `vercel-react-best-practices` for React or Next.js implementation and refactoring work once the product surface model is clear.

## Product UI Constraints

When doing frontend design or implementation in this repository:

- Start with information architecture and page/surface decomposition before visual polish.
- Do not put all content, actions, settings, analytics, and help into one interface unless the hierarchy is explicit and justified.
- Prefer multi-page flows, tabs, drawers, secondary panels, step flows, or master-detail layouts when one screen starts carrying multiple jobs.
- Keep each screen focused on one dominant task, then use progressive disclosure for advanced, low-frequency, or destructive actions.
- Treat repeated card stacking as a smell that the information architecture needs to be split rather than further decorated.
