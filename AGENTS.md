# Repository Instructions

## Superpowers Workflow (Auto-enabled)

- The `using-superpowers` skill is **automatically active** for every task in this repository — agents must follow it without being explicitly asked.
- Whenever a task involves planning, designing, refactoring, or building features (anything more than a trivial one-liner), the agent must:
  1. Invoke `brainstorming` skill before any implementation.
  2. Invoke `writing-plans` skill after a spec is approved.
  3. Save specs to `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`.
  4. Save plans to `docs/superpowers/plans/YYYY-MM-DD-<feature>.md`.
- These paths are mandatory; do not place specs/plans elsewhere (no `docs/plans/`, no session workspace markdown).

## General Rules

- Do not push to any remote unless the user explicitly asks for a `git push`.
- Default to keeping work on the current branch unless the user explicitly asks to create or switch branches.
- When creating or refactoring pages under `src/pages`, follow the history-style module structure with `components/`, `hooks/`, `const.ts`, `index.tsx`, `store.ts`, `types.ts`, and `utils.ts`; use kebab-case naming, folder-based component `index.tsx` exports, and avoid multi-level prop drilling by promoting shared page state/actions into the page store.

## State Management Guidelines

- **Zustand**: Use for global application state, cross-page shared data, and complex domain state (e.g., resume form, ATS config, template workbench). Stores live in `src/store/` (app-level) or `src/pages/<page>/store/` (page-level). Split large stores into slice files with a barrel `index.ts`.
- **React Context**: Use only for UI sub-tree state scoped to a component tree (e.g., DragContext, SidebarContext, DropzoneContext). Never for global data that multiple pages need.
- **Local state (`useState`)**: Use for ephemeral UI state confined to a single component (dialogs, form inputs, toggles).
