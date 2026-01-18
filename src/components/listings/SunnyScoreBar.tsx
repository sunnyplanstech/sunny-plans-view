import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
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
    if (score >= 80) return "text-primary";
    if (score >= 50) return "text-yellow-600";
    return "text-destructive";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return "Excellent";
    if (score >= 80) return "Very Good";
    if (score >= 50) return "Good";
    return "Fair";
  };

  const total = breakdown.grid + breakdown.solar + breakdown.terrain + breakdown.other;
  const segments = [
    { key: "grid", label: "Grid Proximity", value: breakdown.grid, color: "bg-blue-500" },
    { key: "solar", label: "Solar Irradiance", value: breakdown.solar, color: "bg-orange-500" },
    { key: "terrain", label: "Terrain Flatness", value: breakdown.terrain, color: "bg-primary" },
    { key: "other", label: "Other Factors", value: breakdown.other, color: "bg-muted-foreground" },
  ];

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span className={cn("font-bold text-lg", getScoreColor(score))}>{score}</span>
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden flex">
          {segments.map((segment) => (
            <Tooltip key={segment.key}>
              <TooltipTrigger asChild>
                <div
                  className={cn("h-full", segment.color)}
                  style={{ width: `${(segment.value / total) * 100}%` }}
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>{segment.label}: {segment.value} pts</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-baseline gap-2">
        <span className={cn("text-3xl font-bold", getScoreColor(score))}>{score}</span>
        <span className="text-muted-foreground">/100</span>
        <span className={cn("text-sm font-medium", getScoreColor(score))}>
          ({getScoreLabel(score)})
        </span>
      </div>
      
      <div className="h-3 bg-muted rounded-full overflow-hidden flex">
        {segments.map((segment) => (
          <Tooltip key={segment.key}>
            <TooltipTrigger asChild>
              <div
                className={cn("h-full transition-all", segment.color)}
                style={{ width: `${(segment.value / total) * 100}%` }}
              />
            </TooltipTrigger>
            <TooltipContent>
              <p>{segment.label}: {segment.value} pts</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 text-xs">
        {segments.map((segment) => (
          <div key={segment.key} className="flex items-center gap-1">
            <div className={cn("w-2 h-2 rounded-full", segment.color)} />
            <span className="text-muted-foreground">{segment.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SunnyScoreBar;
