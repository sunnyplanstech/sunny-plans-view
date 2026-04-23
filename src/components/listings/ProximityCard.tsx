import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  OSM_DISTANCE_GROUPS,
  type OsmDistanceFields,
} from "@/data/osmDistanceFields";

const STRINGS = {
  en: {
    title: "Proximity",
    exact: "Exact distance to nearest feature in each category.",
    approx: "Approximate distance (~) to nearest feature in each category. Subscribe for exact values.",
    na: "—",
  },
  it: {
    title: "Vicinanza",
    exact: "Distanza esatta al punto piu vicino in ciascuna categoria.",
    approx: "Distanza approssimativa (~) al punto piu vicino in ciascuna categoria. Abbonati per valori esatti.",
    na: "—",
  },
} as const;

function formatMeters(meters: number | null, unit: "imperial" | "metric"): string {
  if (meters == null || !Number.isFinite(meters)) return "—";
  if (unit === "imperial") {
    const miles = meters * 0.000621371;
    if (miles < 0.1) return `${Math.round(meters)} m`;
    return `${miles.toFixed(miles < 10 ? 2 : 1)} mi`;
  }
  if (meters < 1000) return `${Math.round(meters)} m`;
  const km = meters / 1000;
  return `${km.toFixed(km < 10 ? 2 : 1)} km`;
}

interface ProximityCardProps {
  premium?: OsmDistanceFields | null;
  publicData: OsmDistanceFields | null;
  lang?: "en" | "it";
  /** imperial for US listings, metric for IT */
  unit?: "imperial" | "metric";
}

export function ProximityCard({
  premium,
  publicData,
  lang = "en",
  unit = "imperial",
}: ProximityCardProps) {
  const t = STRINGS[lang];
  const hasPremium = !!premium;
  const source = premium ?? publicData;

  if (!source) return null;

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>{t.title}</CardTitle>
        <p className="text-xs text-muted-foreground">
          {hasPremium ? t.exact : t.approx}
        </p>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" className="w-full">
          {OSM_DISTANCE_GROUPS.map((group) => (
            <AccordionItem value={group.label} key={group.label}>
              <AccordionTrigger>{group.label}</AccordionTrigger>
              <AccordionContent>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                  {group.fields.map(([key, label]) => {
                    const raw = source[key];
                    const formatted = formatMeters(raw, unit);
                    return (
                      <div
                        key={key}
                        className="flex justify-between gap-4 py-1 border-b border-border/40 last:border-0"
                      >
                        <dt className="text-sm text-muted-foreground">{label}</dt>
                        <dd className="text-sm font-medium tabular-nums">
                          {raw != null && !hasPremium ? "~ " : ""}
                          {formatted}
                        </dd>
                      </div>
                    );
                  })}
                </dl>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
