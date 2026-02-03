// src/data/seoPaths.ts
// Generates static SEO paths for the sitemap

import { COUNTRIES, STATE_CODE_TO_SLUG } from './locations';
import countiesByState from './counties.json';

export function generateDynamicSeoPaths(): string[] {
  const paths: string[] = [];

  // United States paths
  const us = COUNTRIES["united-states"];
  paths.push(`/${us.slug}`);

  for (const state of us.states) {
    paths.push(`/${us.slug}/${state.slug}`);
    paths.push(`/${us.slug}/${state.slug}/listings`);
  }

  // County-level paths from counties.json
  for (const [stateCode, counties] of Object.entries(countiesByState)) {
    const stateSlug = STATE_CODE_TO_SLUG[stateCode];
    if (!stateSlug) continue;

    for (const countySlug of counties) {
      paths.push(`/${us.slug}/${stateSlug}/${countySlug}`);
      paths.push(`/${us.slug}/${stateSlug}/${countySlug}/listings`);
    }
  }

  // Italy paths - nation and region level only
  const italy = COUNTRIES["italy"];
  paths.push(`/${italy.slug}`);

  for (const region of italy.regions) {
    paths.push(`/${italy.slug}/${region.slug}`);
    paths.push(`/${italy.slug}/${region.slug}/particelle`);
  }

  return paths;
}

export function getStaticSeoPaths(): string[] {
  return generateDynamicSeoPaths();
}
