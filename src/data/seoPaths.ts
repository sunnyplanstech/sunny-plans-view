// src/data/seoPaths.ts
import { COUNTRIES } from './locations';

export function generateDynamicSeoPaths(): string[] {
  const paths: string[] = [];

  // United States paths
  const us = COUNTRIES["united-states"];
  paths.push(`/${us.slug}/`);
  
  for (const state of us.states) {
    const statePath = `/${us.slug}/${state.slug}/`;
    paths.push(statePath);
    
    // Add mock county-level paths
    const mockCounties = ['example-county', 'north-county', 'south-county'];
    for (const county of mockCounties) {
      const countyPath = `${statePath}${county}/`;
      paths.push(countyPath);
      paths.push(`${countyPath}listings/`);
    }
  }

  // Italy paths
  const italy = COUNTRIES["italy"];
  paths.push(`/${italy.slug}/`);
  
  for (const region of italy.regions) {
    const regionPath = `/${italy.slug}/${region.slug}/`;
    paths.push(regionPath);
    
    // Add mock province-level paths
    const mockProvinces = ['roma', 'milano', 'napoli', 'torino', 'bari', 'palermo'];
    for (const province of mockProvinces) {
      const provincePath = `${regionPath}${province}/`;
      paths.push(provincePath);
      
      // Add mock comuni
      const mockComuni = ['centro', 'nord', 'sud'];
      for (const comune of mockComuni) {
        const comunePath = `${provincePath}${comune}/`;
        paths.push(comunePath);
        paths.push(`${comunePath}particelle/`);
      }
    }
  }

  return paths;
}
