# Copilot Workspace Instructions

## Project Overview
- **Framework:** Next.js (App Router)
- **Backend:** Convex (see `convex/` directory)
- **Styling/UI:** Tailwind CSS, shadcn/ui
- **Auth:** Convex Auth middleware in `src/middleware.ts`
- **Import Aliases:** Defined in `components.json`


## Build & Run Commands
- **Development:** `npm run dev` or `bun dev`
- **Build:** `npm run build` or `bun run build`
- **Start:** `npm run start` or `bun run start`
- **Lint:** `npm run lint` or `bun run lint`

> **Note:** Bun is supported for all scripts. Use `bun` in place of `npm` for faster installs and script execution.

## Key Conventions
- Use import aliases for `@/components`, `@/lib`, `@/hooks`, etc.
- UI components are in `src/components/ui/` (shadcn/ui pattern)
- Convex functions and schema in `convex/`
- App routes/pages in `src/app/`
- Auth pages in `src/app/auth/`
- Workspace and channel logic in `src/app/workspace/`

## Pitfalls & Notes
- Convex-generated files are in `convex/_generated/` (do not edit manually)
- Middleware enforces authentication for most routes
- Tailwind config is in `tailwind.config.ts`, global styles in `src/app/globals.css`

## Example Prompts
- "How do I add a new Convex function?"
- "Where do I put a new UI component?"
- "How do I update authentication logic?"
- "What command runs the linter?"

---

For agent customization, see the [init.prompt.md](../.vscode/extensions/github.copilot-chat-0.39.0/assets/prompts/init.prompt.md) for workflow and anti-patterns.
