import { MapPin } from "lucide-react";

interface MapLoadingFallbackProps {
  className?: string;
  hasApiKey: boolean;
  listingCount: number;
}

/**
 * Placeholder shown while Google Maps is still loading, or when the
 * API key is missing entirely. Mirrors the map's outer sizing so the
 * surrounding layout doesn't shift on load.
 */
export function MapLoadingFallback({
  className,
  hasApiKey,
  listingCount,
}: MapLoadingFallbackProps) {
  return (
    <div
      className={`bg-muted/30 flex flex-col items-center justify-center ${className ?? ""}`}
    >
      <MapPin className="w-12 h-12 text-muted-foreground mb-4" />
      {hasApiKey ? (
        <p className="text-muted-foreground">Loading map...</p>
      ) : (
        <>
          <p className="text-muted-foreground text-center">
            Google Maps API key not configured
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Set VITE_GOOGLE_MAPS_API_KEY in .env
          </p>
        </>
      )}
      {listingCount > 0 && (
        <p className="text-sm text-muted-foreground mt-4">
          {listingCount} listings available
        </p>
      )}
    </div>
  );
}
