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
  }

  // County-level paths from counties.json
  for (const [stateCode, counties] of Object.entries(countiesByState)) {
    const stateSlug = STATE_CODE_TO_SLUG[stateCode];
    if (!stateSlug) continue;

    for (const countySlug of counties) {
      paths.push(`/${us.slug}/${stateSlug}/${countySlug}`);
    }
  }

  return paths;
}

export function getStaticSeoPaths(): string[] {
  return generateDynamicSeoPaths();
}
