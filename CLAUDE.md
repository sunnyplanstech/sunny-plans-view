# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sunny Plans View is a real estate listing platform for solar & BESS (Battery Energy Storage Systems) land opportunities. It helps users find substation-ready land parcels with proprietary SunnyScore™ ratings.

**Live site:** https://sunnyplans.com
**Lovable project:** https://lovable.dev/projects/cd4cb17f-800f-45c8-958d-068841465624

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
- Supabase for backend (currently using mock data)

## Architecture

### URL-Driven Hierarchical Routing

The app uses geographic URL hierarchy for SEO. All listing pages are handled by `ListingsSearch.tsx`:

```
/                                           → Homepage (Index.tsx)
/:country                                   → Country listings
/:country/:region                           → State/region listings
/:country/:region/:province                 → Province/county listings
/:country/:region/:province/:municipality   → Municipality listings
/:country/:region/:province/listing/:id     → Individual listing (ListingDetail.tsx)
```

URL variants: `/listings` suffix for US, `/particelle` suffix for Italy.

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

## Mock Data Pattern

Currently uses mock data in `src/data/mockListings.ts`. The `getListingsByLocation()` function filters listings by geographic hierarchy. Ready to swap with Supabase queries when Cloud mode is enabled.

## Git Conventions

- Commit messages must be one-liners (no multi-line body)
- Do not include Co-Authored-By lines

## Styling

Custom Tailwind theme in `tailwind.config.ts`:
- CSS variables for colors (HSL format) in `src/index.css`
- Custom gradients: `gradient-hero`, `gradient-subtle`, `gradient-card`
- Custom shadows: `shadow-glow` for accent elements
