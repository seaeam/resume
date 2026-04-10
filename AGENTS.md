# Repository Instructions

- Do not push to any remote unless the user explicitly asks for a `git push`.
- Default to keeping work on the current branch unless the user explicitly asks to create or switch branches.
- When creating or refactoring pages under `src/pages`, follow the history-style module structure with `components/`, `hooks/`, `const.ts`, `index.tsx`, `store.ts`, `types.ts`, and `utils.ts`; use kebab-case naming, folder-based component `index.tsx` exports, and avoid multi-level prop drilling by promoting shared page state/actions into the page store.
