import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ScoreBreakdown {
  grid: number;
  solar: number;
  terrain: number;
  other: number;
}

interface SunnyScoreBarProps {
  score: number;
  breakdown: ScoreBreakdown;
  compact?: boolean;
}

const SunnyScoreBar = ({ score, breakdown, compact = false }: SunnyScoreBarProps) => {
  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-primary";
    if (score >= 80) return "text-primary/80";
    if (score >= 60) return "text-secondary";
    return "text-destructive";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return "Excellent";
    if (score >= 80) return "Very Good";
    if (score >= 60) return "Good";
    return "Fair";
  };

  const segments = [
    { key: "grid", value: breakdown.grid, color: "bg-primary", label: "Grid Proximity" },
    { key: "solar", value: breakdown.solar, color: "bg-secondary", label: "Solar Irradiance" },
    { key: "terrain", value: breakdown.terrain, color: "bg-accent", label: "Terrain" },
    { key: "other", value: breakdown.other, color: "bg-muted-foreground/40", label: "Other Factors" },
  ];

  if (compact) {
    return (
      <TooltipProvider>
        <div className="flex items-center gap-3">
          <span className={`text-lg font-bold tabular-nums ${getScoreColor(score)}`}>
            {score}
          </span>
          <div className="flex-1 h-2 bg-muted/50 rounded-full overflow-hidden flex">
            {segments.map((segment) => (
              <Tooltip key={segment.key}>
                <TooltipTrigger asChild>
                  <div
                    className={`${segment.color} h-full transition-all duration-300 hover:opacity-80 first:rounded-l-full last:rounded-r-full`}
                    style={{ width: `${segment.value}%` }}
                  />
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  <p className="font-medium">{segment.label}</p>
                  <p className="text-muted-foreground">+{segment.value} pts</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-3">
        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-bold tabular-nums ${getScoreColor(score)}`}>
              {score}
            </span>
            <span className="text-sm text-muted-foreground">/100</span>
          </div>
          <span className={`text-sm font-medium ${getScoreColor(score)}`}>
            {getScoreLabel(score)}
          </span>
        </div>

        <div className="h-3 bg-muted/50 rounded-full overflow-hidden flex shadow-inner">
          {segments.map((segment) => (
            <Tooltip key={segment.key}>
              <TooltipTrigger asChild>
                <div
                  className={`${segment.color} h-full transition-all duration-300 hover:brightness-110 cursor-help first:rounded-l-full last:rounded-r-full`}
                  style={{ width: `${segment.value}%` }}
                />
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="font-semibold">{segment.label}</p>
                <p className="text-muted-foreground">Contributes {segment.value} points</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
          {segments.map((segment) => (
            <div key={segment.key} className="flex items-center gap-1.5">
              <div className={`w-2.5 h-2.5 rounded-full ${segment.color}`} />
              <span className="text-muted-foreground">{segment.label}</span>
              <span className="font-medium text-foreground">{segment.value}</span>
            </div>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
};

export default SunnyScoreBar;
