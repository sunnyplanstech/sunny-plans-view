// src/data/seoPaths.ts
// This file generates static SEO paths for the sitemap
// Nation + first level (states/regions) are hardcoded
// Lower levels (counties/provinces/comuni) come from database - add them here as needed

import { COUNTRIES } from './locations';

export function generateDynamicSeoPaths(): string[] {
  const paths: string[] = [];

  // United States paths - nation and state level only (hardcoded)
  const us = COUNTRIES["united-states"];
  paths.push(`/${us.slug}/`);
  
  for (const state of us.states) {
    const statePath = `/${us.slug}/${state.slug}/`;
    paths.push(statePath);
    paths.push(`${statePath}listings/`);
    // County-level paths will be added dynamically when you populate the us_counties table
  }

  // Italy paths - nation and region level only (hardcoded)
  const italy = COUNTRIES["italy"];
  paths.push(`/${italy.slug}/`);
  
  for (const region of italy.regions) {
    const regionPath = `/${italy.slug}/${region.slug}/`;
    paths.push(regionPath);
    paths.push(`${regionPath}particelle/`);
    // Province and comuni paths will be added dynamically when you populate the tables
  }

  return paths;
}

// Helper to generate paths from database data (call this server-side or at build time)
// You can extend this to fetch from Supabase and generate additional paths
export function getStaticSeoPaths(): string[] {
  return generateDynamicSeoPaths();
}
