// src/data/seoPaths.ts
// Generates static SEO paths for the sitemap

import { COUNTRIES, STATE_CODE_TO_SLUG } from './locations';
import countiesByState from './counties.json';
import comuniByRegion from './comuni.json';
import fs from 'fs';
import path from 'path';

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

  // Italy paths
  const it = COUNTRIES["italy"];
  paths.push(`/${it.slug}`);

  for (const region of it.regions) {
    paths.push(`/${it.slug}/${region.slug}`);
  }

  // Comune-level paths from comuni.json
  for (const [regionSlug, comuni] of Object.entries(comuniByRegion)) {
    for (const comuneSlug of comuni) {
      paths.push(`/${it.slug}/${regionSlug}/${comuneSlug}`);
    }
  }

  // Blog paths
  paths.push('/blog');
  const articlesDir = path.resolve(__dirname, '../../articles');
  if (fs.existsSync(articlesDir)) {
    for (const file of fs.readdirSync(articlesDir)) {
      if (file.endsWith('.md')) {
        paths.push(`/blog/${file.replace('.md', '')}`);
      }
    }
  }

  return paths;
}

export function getStaticSeoPaths(): string[] {
  return generateDynamicSeoPaths();
}
