# Foundation

A scalable web application foundation built with **Next.js (App Router) + TypeScript + Tailwind CSS**, featuring a persistent left-sidebar / top-bar shell and a **provider-agnostic AI layer** that works out of the box.

## Layout

```
┌──────────────────────────────────────────┐
│  TopBar  (search · theme · user)          │
├───────────┬──────────────────────────────┤
│ Sidebar   │                              │
│ (all nav) │   Main content (per route)   │
└───────────┴──────────────────────────────┘
```

The shell lives in `app/(app)/layout.tsx` and renders once; only the page in the
right-hand main area changes between routes.

## Getting started

```bash
npm install
cp .env.example .env.local   # optional; defaults work with no keys
npm run dev
```

Open http://localhost:3000 — `/` redirects to `/dashboard`.

### Scripts

| Script              | Description                       |
| ------------------- | --------------------------------- |
| `npm run dev`       | Start the dev server              |
| `npm run build`     | Production build                  |
| `npm run start`     | Run the production build          |
| `npm run lint`      | ESLint                            |
| `npm run typecheck` | TypeScript, no emit               |
| `npm run format`    | Prettier write                    |

## Project structure

```
app/
  (app)/            # the shared shell + all in-app pages
    dashboard/  assistant/  analytics/  settings/
  api/ai/chat/      # streaming AI endpoint (keys stay server-side)
components/
  layout/           # Sidebar, TopBar, AppShell, theme toggle
  ui/               # Button, Card, Input, Avatar primitives
  assistant/        # Chat UI
lib/
  ai/               # provider-agnostic AI layer (see below)
config/
  nav.ts            # single source of truth for sidebar links
  site.ts           # site name / metadata
```

## Adding a new page ("avenue")

1. Create `app/(app)/<route>/page.tsx`.
2. Add an entry to `config/nav.ts` (label, href, icon, section).

The sidebar renders itself from that array — no other wiring needed.

## The AI layer

Everything depends only on the `AIProvider` interface in `lib/ai/types.ts`, so
swapping models is a one-file change in `lib/ai/providers/`.

- **`mock`** (default) — streams a canned reply, zero config. Lets the whole
  pipeline (UI → `/api/ai/chat` → provider) work with no API key.

No external provider is wired in — the choice is left entirely open.

### Adding your own provider

1. Implement the `AIProvider` interface in a new file under `lib/ai/providers/`.
2. Register it in `lib/ai/provider.ts`.
3. Set `AI_PROVIDER=<your-provider-name>` in `.env.local` and restart.

Because the UI and the `/api/ai/chat` route depend only on the `AIProvider`
interface, nothing else needs to change.

## Theming

Dark/light via `next-themes` with CSS variables in `app/globals.css`
(`darkMode: "class"`). Tweak the color tokens there.
