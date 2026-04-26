import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

const LOCKED_PLACEHOLDER = "****";

export function isLocked(value: string | null | undefined): boolean {
  return value === LOCKED_PLACEHOLDER;
}

interface LockedFieldProps {
  value: string | null | undefined;
  /** Click handler when the value is locked. Phase 5 wires this to the Paywall drawer. */
  onUnlock?: () => void;
  className?: string;
  /** Render a lock icon next to the value when locked. Default true. */
  showIcon?: boolean;
}

/**
 * Renders a value as-is. When the value is the backend's "****" placeholder,
 * adds a lock icon, pointer cursor, and click handler that opens the Paywall.
 * For unlocked values, renders the value verbatim with no chrome.
 */
export function LockedField({
  value,
  onUnlock,
  className,
  showIcon = true,
}: LockedFieldProps) {
  if (!isLocked(value)) {
    return <>{value || ""}</>;
  }
  return (
    <button
      type="button"
      onClick={onUnlock}
      className={cn(
        "inline-flex items-center gap-1 text-muted-foreground hover:text-primary cursor-pointer transition-colors",
        className,
      )}
    >
      <span className="font-mono">{LOCKED_PLACEHOLDER}</span>
      {showIcon && <Lock className="w-3 h-3" />}
    </button>
  );
}

interface MapLockedOverlayProps {
  onUnlock?: () => void;
  lang?: "en" | "it";
}

const MAP_OVERLAY_STRINGS = {
  en: "View exact location",
  it: "Vedi posizione esatta",
} as const;

/**
 * Pill rendered over the parcel map when the user can't see the exact
 * polygon. Clicking it opens the Paywall drawer (phase 5).
 */
export function MapLockedOverlay({ onUnlock, lang = "en" }: MapLockedOverlayProps) {
  return (
    <button
      type="button"
      onClick={onUnlock}
      className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-full bg-background/95 backdrop-blur px-4 py-2 shadow-lg border border-border hover:bg-background transition-colors text-sm font-medium"
    >
      <Lock className="w-4 h-4" />
      <span>{MAP_OVERLAY_STRINGS[lang]}</span>
    </button>
  );
}
