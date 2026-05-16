// SunnyScore™ explanation preview (roadmap p2-e1-sunnyscore-visual).
//
// Design sandbox kept around even after the production wiring landed —
// shows the gauge + helping/hurting idiom across the three target
// surfaces (listing card / listing detail / landing example) and three
// score scenarios (high, mid, low). Useful for visual regression and
// for explaining the design to people without booting a parcel that
// actually has populated SHAP contributions.
//
// Mounted at /preview/sunnyscore. The transform, taxonomy, and
// rendering all live in @/components/listings/sunnyscore — this file
// is just mock parcels + page composition.

import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, ChevronRight, Info } from "lucide-react";
import {
  buildExplanation,
  SunnyScoreExplanation,
  type ParcelPayload,
} from "@/components/listings/sunnyscore";

// ---------------------------------------------------------------------------
// Mock parcels — three scenarios across the score range. Hand-picked
// contributions tuned so each parcel exercises a distinct visual case
// (helpers-dominant / balanced / drags-dominant).
// ---------------------------------------------------------------------------

const PARCEL_HIGH: ParcelPayload = {
  score: 82,
  contributions: {
    baseline: -0.2,
    power_substation: 1.04,
    power_line: 0.42,
    power_tower: 0.18,
    ghi_kwh_m2_yr: 0.31,
    pv_specific_yield_kwh_kwp_yr: 0.22,
    flat_5_acres_pct: 0.27,
    military_base: 0.21,
    leisure_nature_reserve: 0.18,
    landuse_residential: -0.18,
    natural_wetland: -0.09,
    waterway_river: -0.06,
  },
};

const PARCEL_MID: ParcelPayload = {
  score: 54,
  contributions: {
    baseline: -0.2,
    power_substation: 0.18,
    power_line: 0.06,
    ghi_kwh_m2_yr: 0.22,
    flat_5_acres_pct: 0.11,
    landuse_residential: -0.14,
    building_residential: -0.05,
    natural_wetland: -0.21,
    military_base: 0.04,
    aeroway_aerodrome: -0.07,
    waterway_river: 0.03,
  },
};

const PARCEL_LOW: ParcelPayload = {
  score: 27,
  contributions: {
    baseline: -0.2,
    power_substation: -0.62,
    power_line: -0.24,
    ghi_kwh_m2_yr: 0.18,
    flat_5_acres_pct: -0.34,
    landuse_residential: -0.41,
    building_residential: -0.12,
    natural_wetland: -0.18,
    waterway_river: -0.14,
    military_base: 0.09,
    aeroway_aerodrome: -0.22,
  },
};

// ---------------------------------------------------------------------------
// Surface variants — three places the explanation appears.
// ---------------------------------------------------------------------------

interface SurfaceProps {
  payload: ParcelPayload;
  parcelLabel: string;
  parcelMeta: string;
}

const CardSurface = ({ payload, parcelLabel, parcelMeta }: SurfaceProps) => (
  <Card className="w-full max-w-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
    <div className="h-32 bg-gradient-to-br from-muted to-muted/40 border-b" />
    <CardContent className="p-4 space-y-3">
      <div>
        <div className="text-sm font-semibold truncate">{parcelLabel}</div>
        <div className="text-xs text-muted-foreground">{parcelMeta}</div>
      </div>
      <SunnyScoreExplanation
        payload={payload}
        size="sm"
        maxDrivers={4}
      />
      <div className="pt-2 mt-1 border-t border-border/50 flex items-center justify-end text-[11px] text-primary font-medium">
        <span className="flex items-center gap-0.5">
          View full breakdown <ChevronRight className="h-3 w-3" />
        </span>
      </div>
    </CardContent>
  </Card>
);

const DetailSurface = ({ payload, parcelLabel, parcelMeta }: SurfaceProps) => (
  <Card>
    <CardHeader>
      <div className="flex items-baseline justify-between">
        <CardTitle className="text-base">{parcelLabel}</CardTitle>
        <span className="text-xs text-muted-foreground">{parcelMeta}</span>
      </div>
    </CardHeader>
    <CardContent className="space-y-6">
      <SunnyScoreExplanation payload={payload} size="lg" />
      <div className="text-xs text-muted-foreground italic flex items-center gap-1.5">
        <Info className="h-3 w-3" />
        Every driver is ranked by its impact on the score; helpers extend
        right, hurters left.
      </div>
    </CardContent>
  </Card>
);

const LandingSurface = ({ payload, parcelLabel, parcelMeta }: SurfaceProps) => {
  // Hand-written captions tied to the largest helper / largest drag.
  // The only surface where editorial prose appears — see the design
  // doc's "Surface-by-Surface Specs" section.
  const explanation = buildExplanation(payload);
  const topHelper = explanation.helping[0];
  const topDrag = explanation.hurting[0];

  return (
    <Card className="border-2 border-primary/20 bg-gradient-card">
      <CardHeader>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-primary font-semibold">
            Example parcel
          </div>
          <CardTitle className="text-xl">{parcelLabel}</CardTitle>
          <div className="text-xs text-muted-foreground">{parcelMeta}</div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <SunnyScoreExplanation payload={payload} size="lg" />
        {(topHelper || topDrag) && (
          <div className="space-y-2 text-sm pt-2 border-t border-border/40">
            {topHelper && (
              <p className="leading-snug">
                <span className="font-semibold text-primary">
                  {topHelper.label}
                </span>{" "}
                <span className="text-muted-foreground">
                  is the largest helper — closest substation sits 1.2 km away,
                  well inside the cost-effective interconnect range for this
                  state.
                </span>
              </p>
            )}
            {topDrag && (
              <p className="leading-snug">
                <span className="font-semibold text-negative">
                  {topDrag.label}
                </span>{" "}
                <span className="text-muted-foreground">
                  is the only meaningful drag — slope tops 18% on the north
                  edge, pushing some grading work into the development cost.
                </span>
              </p>
            )}
          </div>
        )}
        <div className="pt-4 border-t border-border/60 text-sm text-muted-foreground">
          Every parcel ships with the same breakdown — no editorial copy, no
          marketing-driven sort key. Just the model showing its work.
        </div>
      </CardContent>
    </Card>
  );
};

// ---------------------------------------------------------------------------
// Page composition.
// ---------------------------------------------------------------------------

interface ParcelChoice {
  key: string;
  label: string;
  meta: string;
  payload: ParcelPayload;
  pitch: string;
}

const PARCELS: ParcelChoice[] = [
  {
    key: "high",
    label: "Pecos County, TX · 217 ac",
    meta: "Texas · semi-arid · grid-adjacent",
    payload: PARCEL_HIGH,
    pitch: "Top-decile candidate — helpers heavily outweigh drags.",
  },
  {
    key: "mid",
    label: "Custer County, OK · 142 ac",
    meta: "Oklahoma · mixed agricultural · moderate slope",
    payload: PARCEL_MID,
    pitch: "Middle-of-the-pack — small helpers and drags roughly balance.",
  },
  {
    key: "low",
    label: "Boone County, WV · 96 ac",
    meta: "West Virginia · ridge terrain · far from substation",
    payload: PARCEL_LOW,
    pitch: "Below-average — drags dominate; explanation tells the user why fast.",
  },
];

const SectionHeader = ({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body: string;
}) => (
  <div className="space-y-2 max-w-3xl">
    <div className="text-[11px] uppercase tracking-wider text-primary font-semibold">
      {eyebrow}
    </div>
    <h2 className="text-2xl font-bold">{title}</h2>
    <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
  </div>
);

const SunnyScorePreview = () => {
  const [activeParcelKey, setActiveParcelKey] = useState<string>("high");
  const activeParcel =
    PARCELS.find((p) => p.key === activeParcelKey) ?? PARCELS[0];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-8">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to homepage
          </Link>
          <div className="text-[11px] uppercase tracking-wider text-primary font-semibold">
            Roadmap preview · p2-e1-sunnyscore-visual
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mt-2">
            SunnyScore™ — gauge and helping/hurting columns
          </h1>
          <p className="text-base text-muted-foreground mt-3 max-w-3xl leading-relaxed">
            Design sandbox for the explanation idiom. Three sample parcels,
            three surfaces (listing card, listing detail, landing-page example),
            wired against the same shared component the production listing card
            and detail page now consume. Numbers here are mocked from the spec;
            the production cards render against the live Django payload.
          </p>
        </div>
      </header>

      <section className="border-b bg-card/60 sticky top-0 z-10 backdrop-blur">
        <div className="container mx-auto px-4 py-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground mr-2">Sample parcel:</span>
          {PARCELS.map((p) => (
            <Button
              key={p.key}
              size="sm"
              variant={p.key === activeParcelKey ? "default" : "outline"}
              onClick={() => setActiveParcelKey(p.key)}
              className="gap-2"
            >
              <span className="tabular-nums font-semibold">{p.payload.score}</span>
              <span className="text-xs opacity-80">· {p.label.split("·")[0].trim()}</span>
            </Button>
          ))}
          <span className="text-xs text-muted-foreground ml-auto italic">
            {activeParcel.pitch}
          </span>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12 space-y-6">
        <SectionHeader
          eyebrow="Surface 1 · Landing page"
          title="The explanation as a trust object"
          body="A cold prospect lands on the marketing page with no other evidence the product is doing real analysis. The fully-expanded explanation, plus two hand-written captions tied to the largest helper and the largest drag, is what proves the score is more than a sort key."
        />
        <LandingSurface
          payload={activeParcel.payload}
          parcelLabel={activeParcel.label}
          parcelMeta={activeParcel.meta}
        />
      </section>

      <section className="container mx-auto px-4 py-12 space-y-6">
        <SectionHeader
          eyebrow="Surface 2 · Listing detail"
          title="Default state, then drill-down"
          body="All groups visible, click any group to expand into its explainable features. Opaque features collapse into a single residual labelled in plain language — they never break out. Bar length is share within the side; the score on the gauge is the only cross-parcel comparable quantity."
        />
        <DetailSurface
          payload={activeParcel.payload}
          parcelLabel={activeParcel.label}
          parcelMeta={activeParcel.meta}
        />
      </section>

      <section className="container mx-auto px-4 py-12 space-y-6">
        <SectionHeader
          eyebrow="Surface 3 · Listing card"
          title="Glanceable in the densest surface"
          body="The card is the constraint. Two-second glance gives the user the score, the dominant helper, and the dominant drag — enough to decide whether to open the detail page."
        />
        <div className="flex flex-wrap gap-6">
          <CardSurface
            payload={activeParcel.payload}
            parcelLabel={activeParcel.label}
            parcelMeta={activeParcel.meta}
          />
          <div className="text-xs text-muted-foreground max-w-xs space-y-2">
            <p>
              The card&apos;s only job is to answer{" "}
              <em>should I look at this parcel at all?</em>
            </p>
            <p>
              Tapping the card opens the listing detail page — no drill-down on
              the card itself.
            </p>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12 space-y-6">
        <SectionHeader
          eyebrow="Stress test · Across the score range"
          title="The same idiom holds at 27, 54, and 82"
          body="A user shown two parcels with the same score but different drivers can identify how they differ without opening either detail page. The bar columns adapt their amplitude to the parcel."
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PARCELS.map((p) => (
            <CardSurface
              key={p.key}
              payload={p.payload}
              parcelLabel={p.label}
              parcelMeta={p.meta}
            />
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 py-12 space-y-6 max-w-4xl">
        <SectionHeader
          eyebrow="Data contract"
          title="What the model side ships"
          body="A single JSON object per parcel. Grouping, sign-splitting, normalisation, residual collapse, and labelling all happen in the shared FE component."
        />
        <Card>
          <CardContent className="p-6">
            <pre className="text-xs overflow-x-auto bg-muted/50 p-4 rounded-md">
              <code>{JSON.stringify(activeParcel.payload, null, 2)}</code>
            </pre>
            <div className="mt-4 text-xs text-muted-foreground space-y-1">
              <div>
                <strong className="text-foreground">score</strong> = round(predict_proba × 100)
              </div>
              <div>
                <strong className="text-foreground">contributions</strong> = raw TreeSHAP
                output, logit units, no scaling.
              </div>
              <div className="pt-2 border-t border-border/60 mt-2">
                <strong className="text-foreground">contributions.baseline</strong>{" "}
                = reserved key the pipeline emits on every scored row.
                Drives the reference-strip avg tick directly — no FE
                fallback, since the pipeline contract guarantees its
                presence.
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <footer className="border-t bg-card mt-8">
        <div className="container mx-auto px-4 py-6 text-xs text-muted-foreground">
          Design sandbox · The shared component lives at{" "}
          <code>src/components/listings/sunnyscore/</code> and is consumed by
          the production listing card and detail page.
        </div>
      </footer>

      <section className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="flex justify-end">
          <Button variant="outline" size="sm" asChild>
            <Link to="/" className="inline-flex items-center gap-1.5">
              Done
              <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default SunnyScorePreview;
