// src/utils/seoPaths.ts
import { countries, CountryConfig } from '@/data/locations';

type PathPart = string | { [key: string]: any }; // placeholder for future dynamic parts

export function generateDynamicSeoPaths(): string[] {
  const paths: string[] = [];

  for (const country of countries) {
    // Country landing page
    paths.push(`/${country.slug}/`);

    for (const state of country.statesOrRegions) {
      // /united-states/california/
      // /italy/toscana/
      const statePath = `/${country.slug}/${state.code}/`;
      paths.push(statePath);

      // For now we add mock second-level pages (county/province)
      // Later replace with real data
      const mockSecondLevel = getMockSecondLevel(country.code);

      for (const second of mockSecondLevel) {
        const secondPath = `${statePath}${second}/`;
        paths.push(secondPath);

        // For US → listings
        if (country.code === 'us') {
          paths.push(`${secondPath}listings/`);
        }

        // For IT → comune → particelle
        if (country.code === 'it') {
          // mock comuni
          const mockComuni = ['roma', 'milano', 'napoli', 'torino', 'palermo'];
          for (const comune of mockComuni) {
            const comunePath = `${secondPath}${comune}/`;
            paths.push(comunePath);
            paths.push(`${comunePath}particelle/`);
          }
        }
      }
    }
  }

  return paths;
}

// Just for mocking – replace later with real data
function getMockSecondLevel(countryCode: 'us' | 'it'): string[] {
  if (countryCode === 'us') {
    return ['example-county', 'north-county', 'south-county'];
  }
  // italy → province
  return ['roma', 'milano', 'napoli', 'torino', 'bari', 'palermo'];
}