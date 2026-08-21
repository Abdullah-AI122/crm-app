# skills
Framework: verify Next 16 API in node_modules/next/dist/docs/ before use. Never assume pre-15 conventions.
Server/client: default Server Component; add "use client" only for state/effect/browser API/handlers.
Data: call backend via apiRequest from lib/api.ts. Do not add a second HTTP client; fix lib/api.ts base URL rather than bypassing it.
URLs: read base from config/env.js. No hardcoded hosts/ports in components.
Auth: token/user via lib/auth.ts only. Never touch localStorage directly.
Styling: Tailwind v4 utilities + HeroUI primitives. No new CSS files; globals.css only for tokens.
Structure: page = composition only; logic to components/, shared logic to lib/.
Components: reuse components/ui/{modals,menu,buttons,cards,helpers} before creating new ones.
Types: no `any` in new code; type API payloads at the boundary.
Mock data: data/*.data.js is placeholder — replace with API calls, do not extend.
Verify: npm run lint + npm run build after edits.
Schema: request -> minimal diff -> lint/build -> report file:line.
