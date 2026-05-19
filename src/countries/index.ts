import type { CountryAdapter } from "./types";
import { unitedStates } from "./unitedStates";
import { italy } from "./italy";

export type { CountryAdapter, Scope, BaseListing, SeoCopy, MapRenderProps } from "./types";
export { unitedStates, italy };

const REGISTRY: Record<string, CountryAdapter> = {
  [unitedStates.slug]: unitedStates,
  [italy.slug]: italy,
};

export function getCountryAdapter(slug: string | undefined): CountryAdapter | undefined {
  if (!slug) return undefined;
  return REGISTRY[slug];
}
