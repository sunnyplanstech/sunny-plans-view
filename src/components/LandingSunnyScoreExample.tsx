// Landing-page SunnyScore™ example surface — see roadmap card
// p2-e1-sunnyscore-visual ("Surface-by-Surface Specs · Landing-page
// example"). Mounted on the homepage so a cold prospect sees the
// gauge + helping/hurting bars + columns idiom before signup, proving
// the score is real analysis and not a sort key.
//
// Two cards side-by-side: the top US parcel and the top IT parcel
// (first listing from each country's public list endpoint, which is
// already ordered by SunnyScore desc). Captions below each card are
// derived from the parcel's actual top helping/hurting groups, so the
// copy stays truthful regardless of which parcel the catalog surfaces.
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { publicApi } from "@/lib/apiClient";
import {
  SunnyScoreExplanation,
  buildExplanation,
  type ParcelPayload,
} from "@/components/listings/sunnyscore";
import type { USListing } from "@/countries/unitedStates";
import type { ITListing } from "@/countries/italy";
import type { BaseListing } from "@/countries/types";

// Pull a few rows per country so we can skip any that ship without
// contributions (the SHAP source is LEFT JOIN'd into the mart, so the
// top-ranked parcel may legitimately have score-but-no-contributions
// for a short window after a re-score). 10 is generous headroom.
const PROBE_LIMIT = 10;

function pickFirstWithExplanation<T extends BaseListing>(
  listings: T[] | undefined,
): T | null {
  if (!listings) return null;
  return (
    listings.find(
      (l) =>
        l.score != null &&
        l.contributions != null &&
        Object.keys(l.contributions).length > 0,
    ) ?? null
  );
}

const LandingSunnyScoreExample = () => {
  const us = useQuery({
    queryKey: ["landing-sunnyscore", "us"],
    queryFn: () =>
      publicApi<USListing[]>(`/api/listings/public/?limit=${PROBE_LIMIT}`),
    staleTime: 5 * 60 * 1000,
  });
  const it = useQuery({
    queryKey: ["landing-sunnyscore", "it"],
    queryFn: () =>
      publicApi<ITListing[]>(`/api/listings/it/public/?limit=${PROBE_LIMIT}`),
    staleTime: 5 * 60 * 1000,
  });

  const usListing = pickFirstWithExplanation(us.data);
  const itListing = pickFirstWithExplanation(it.data);

  // If both queries failed or returned no scored parcels, render nothing
  // rather than an empty section — the homepage stays readable.
  if (!usListing && !itListing && !us.isLoading && !it.isLoading) return null;

  return (
    <section className="py-20 px-4 bg-gradient-subtle">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10 max-w-2xl mx-auto">
          <div className="text-xs uppercase tracking-wider text-primary font-semibold mb-3">
            How SunnyScore™ works
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-3">
            Every score comes with its reasoning
          </h2>
          <p className="text-muted-foreground">
            Two real parcels from the catalog, with the full breakdown of what's
            helping and what's hurting. The same view ships on every listing —
            no editorial polish, just the model showing its work.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {usListing && (
            <ExampleCard
              listing={usListing}
              parcelLabel={`${usListing.county}, ${usListing.state_code}`}
              parcelMeta="United States"
            />
          )}
          {itListing && (
            <ExampleCard
              listing={itListing}
              parcelLabel={itListing.comune_name}
              parcelMeta="Italy"
            />
          )}
          {(us.isLoading || it.isLoading) && !usListing && !itListing && (
            <>
              <SkeletonCard />
              <SkeletonCard />
            </>
          )}
        </div>
      </div>
    </section>
  );
};

interface ExampleCardProps {
  listing: BaseListing;
  parcelLabel: string;
  parcelMeta: string;
}

const ExampleCard = ({ listing, parcelLabel, parcelMeta }: ExampleCardProps) => {
  const payload: ParcelPayload = {
    score: listing.score!,
    contributions: listing.contributions!,
  };
  const explanation = buildExplanation(payload);
  const topHelper = explanation.helping[0];
  const topDrag = explanation.hurting[0];

  return (
    <Card className="border-2 border-primary/20 bg-gradient-card flex flex-col">
      <CardHeader>
        <div className="text-[10px] uppercase tracking-wider text-primary font-semibold">
          Example parcel · {parcelMeta}
        </div>
        <CardTitle className="text-xl">{parcelLabel}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 flex-1 flex flex-col">
        <SunnyScoreExplanation payload={payload} size="lg" expandable />

        {(topHelper || topDrag) && (
          <div className="space-y-2 text-sm pt-3 border-t border-border/40">
            {topHelper && (
              <p className="leading-snug">
                <span className="font-semibold text-primary">
                  {topHelper.label}
                </span>{" "}
                <span className="text-muted-foreground">
                  is the strongest signal pushing this parcel's score up.
                </span>
              </p>
            )}
            {topDrag && (
              <p className="leading-snug">
                <span className="font-semibold text-negative">
                  {topDrag.label}
                </span>{" "}
                <span className="text-muted-foreground">
                  is the largest factor pulling it down.
                </span>
              </p>
            )}
          </div>
        )}

        <div className="pt-4 mt-auto border-t border-border/60">
          <Link
            to={`/listing/${listing.id}`}
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            See this parcel <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

const SkeletonCard = () => (
  <Card className="border-2 border-primary/10 bg-gradient-card">
    <CardHeader>
      <div className="h-3 w-24 bg-muted rounded animate-pulse" />
      <div className="h-6 w-48 bg-muted rounded animate-pulse mt-2" />
    </CardHeader>
    <CardContent>
      <div className="h-48 bg-muted/60 rounded animate-pulse" />
    </CardContent>
  </Card>
);

export default LandingSunnyScoreExample;
