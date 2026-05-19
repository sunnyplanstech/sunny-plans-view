# CLAUDE.md

## Project Overview

Frontend for Sunnyplans — a real estate listing platform for solar & BESS (Battery Energy Storage Systems) land opportunities with proprietary SunnyScore™ ratings. Part of a monorepo; backend pipelines live in the parent repo.

**Live:** https://sunnyplans.com

## Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server at localhost:8080
npm run build        # Production build
npm run build:dev    # Development mode build
npm run lint         # Run ESLint
npm run preview      # Preview production build locally
```

## Technology Stack

- React 18 + TypeScript + Vite (with SWC)
- shadcn-ui components (Radix UI based)
- Tailwind CSS with custom theme
- React Router DOM for routing
- React Query for data fetching
- React Hook Form + Zod for forms
- Django REST API for backend (`api/` in the parent repo)

## Architecture

### URL-Driven Hierarchical Routing

The interactive map is namespaced under the vertical it belongs to so
new verticals (van life, etc.) can ship side-by-side without URL
collisions. Today only solar is shipped, so all routes live under
`/solar/app/...`. The static pSEO surface for the same vertical sits
at `/solar/<state>/<county>/...` (see `netlify.toml`, proxied from
`gs://sunnyplans-seo-eu`); both are sunnyplans-docs/03_marketing/00_positioning.md
verticals.

All scope levels are handled by `ListingsSearch.tsx`:

```
/                                                         → Homepage (Index.tsx)
/solar/app                                                → Solar map, US default
/solar/app/:country                                       → Country scope
/solar/app/:country/:region                               → State/region scope
/solar/app/:country/:region/:province                     → Province/county scope
/solar/app/:country/:region/:province/:municipality       → Municipality scope
/listing/:id                                              → Individual listing (ListingDetail.tsx)
```

URL variants — the `/listings` (US) and `/particelle` (IT) suffix is only
valid at the **province** and **municipality** levels, not at country or
state. So `/solar/app/united-states/california/` is correct but
`/solar/app/united-states/california/listings` is a 404. See `App.tsx`
for the exact routes.

Legacy bare `/united-states`, `/italy`, and `/united-states/<state>/...`
shapes are intercepted by Netlify 301s in `netlify.toml` (the country
roots go to `/`; deeper paths go to the static `/solar/...` SEO pages).
The interactive map is only reachable at `/solar/app/...` — there is no
SPA route at the bare country path.

### Key Data Files

- `src/data/locations.ts` - Static location data (US states, Italian regions) with slug mappings
- `src/data/mockListings.ts` - Mock listing data, SEO utilities, and `Listing` interface
- `src/data/seoPaths.ts` - Dynamic SEO path generation for sitemap

### Component Organization

- `src/components/ui/` - shadcn-ui primitives (45+ components)
- `src/components/listings/` - Listing-specific components (ListingCard, ListingsMap, SEOHead, etc.)
- `src/components/` - Landing page sections (Hero, Features, Pricing, FAQ, etc.)

### Path Alias

Use `@/` to import from `src/`:
```typescript
import { Button } from "@/components/ui/button";
```

## Domain Concepts

- **SunnyScore™** - Proprietary 0-100 rating for land quality based on grid proximity, solar potential, terrain, and other factors
- **Substation-ready** - Land near electrical substations for grid connection
- **BESS** - Battery Energy Storage Systems

## Data Sources

- **Live data** comes from the Django API (`/api/listings/...`). See `src/hooks/useUSListings.ts`, `src/hooks/useITListings.ts`, `src/hooks/useHexHeatmap.ts`, and `src/hooks/usePremiumListing.ts`.
- **Static structural data** (`src/data/counties.json`, `src/data/comuni.json`) lists the available counties/comuni and is baked from the marts; refresh by re-running the bake script in the parent repo.
- **Mock data** in `src/data/mockListings.ts` is only used by demo/landing components.

## Styling

Custom Tailwind theme in `tailwind.config.ts` with CSS variables (HSL) in `src/index.css`. Custom utilities: `gradient-hero`, `gradient-subtle`, `gradient-card`, `shadow-glow`.

## Blog Articles

Articles live in `articles/*.md` with frontmatter (title, description, date, author, tags).

### Writing rules

**CTA (closing paragraph)**: Every article ends with an italicised Sunnyplans plug, but the wording must be specific to that article's angle — what Sunnyplans data is directly relevant to what the reader just learned. Never reuse the same sentence structure across articles.

**Article ending structure** — articles must follow this exact order at the bottom:

```
---

*CTA italic text linking to Sunnyplans.*

---

**Sources**
- Source name, *Report title* — description — url
```

The CTA button is injected by `BlogPost.tsx` between the CTA paragraph and the Sources section. For this to work, the `**Sources**` heading must be present and spelled exactly as shown — the renderer splits on `\n**Sources**` to place the button correctly. Never put the Sources block before the CTA paragraph.

**Keyword cannibalization**: Before writing a new article, identify its primary target query and confirm it doesn't overlap with existing articles. Each article should own a distinct query. Add a `target_query` field in the frontmatter (e.g. `target_query: "solar land lease rates landowners"`) so future articles can check before drifting into the same territory. Never use an HTML comment for this — it will render as visible text.

## Env Vars (`VITE_*` is public, by definition)

Vite inlines `import.meta.env.VITE_*` as **string literals** into the
client bundle at build time. Every `VITE_*` value ships to every visitor
and lives in CDN-cached JS. There is no such thing as a "secret VITE_
var" — if it needs to be secret, route it through the Django API.

**Netlify rule:** every `VITE_*` env var must have `is_secret=false`
with the scope `builds,functions,post_processing,runtime`. Marking a
`VITE_*` var as secret strips the `post_processing` scope, which causes
Netlify to substitute its masked placeholder (`****…last4`) into the
bundle — silent failure that breaks the app at user runtime, not at
build time.

Two guardrails enforce this:

- `vite.config.ts` runs `assertPublicEnv()` in production builds; missing
  or mask-prefixed required vars throw and abort the build.
- `src/env.ts` is the single typed source of truth (Zod-validated). Never
  read `import.meta.env.VITE_*` directly from a component — always
  `import { env } from "@/env"`.

To add a new public var: add it to `.env.example`, declare it in
`src/env.ts` (mark required vars with `.min(1)` / domain rules), and if
it's required for the build to be valid, add it to `REQUIRED_PUBLIC_ENV`
in `vite.config.ts`.

## Commit Style

One-liner commit messages, no co-authored-by lines.
