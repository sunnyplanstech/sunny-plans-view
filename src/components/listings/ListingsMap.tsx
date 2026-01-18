import { useState } from "react";
import { Lock, ZoomIn, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ListingsMapProps {
  country?: string;
  region?: string;
  province?: string;
  listingCount: number;
  isUnlocked?: boolean;
}

const ListingsMap = ({ 
  country = "italy", 
  region, 
  province,
  listingCount,
  isUnlocked = false 
}: ListingsMapProps) => {
  const [zoomAttempted, setZoomAttempted] = useState(false);

  // Generate heatmap-like circles for visualization
  const heatmapPoints = [
    { x: 35, y: 30, size: 60, count: Math.ceil(listingCount * 0.4) },
    { x: 60, y: 55, size: 45, count: Math.ceil(listingCount * 0.35) },
    { x: 25, y: 65, size: 35, count: Math.ceil(listingCount * 0.25) },
  ];

  const handleZoomClick = () => {
    if (!isUnlocked) {
      setZoomAttempted(true);
    }
  };

  return (
    <div className="relative w-full h-full min-h-[400px] bg-muted/30 rounded-lg overflow-hidden">
      {/* Simulated map background */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            linear-gradient(135deg, hsl(var(--muted)) 0%, hsl(var(--background)) 50%, hsl(var(--muted)) 100%),
            url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")
          `
        }}
      />

      {/* Heatmap circles */}
      {heatmapPoints.map((point, index) => (
        <div
          key={index}
          className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all hover:scale-110"
          style={{
            left: `${point.x}%`,
            top: `${point.y}%`,
          }}
          onClick={handleZoomClick}
        >
          {/* Outer glow */}
          <div
            className="absolute rounded-full bg-primary/20 animate-pulse"
            style={{
              width: point.size * 1.5,
              height: point.size * 1.5,
              left: -(point.size * 0.25),
              top: -(point.size * 0.25),
            }}
          />
          {/* Main circle */}
          <div
            className="rounded-full bg-primary/40 border-2 border-primary/60 flex items-center justify-center text-primary-foreground font-bold text-sm"
            style={{
              width: point.size,
              height: point.size,
            }}
          >
            {point.count > 0 && (
              <span className="bg-primary rounded-full px-2 py-0.5 text-xs">
                {point.count}
              </span>
            )}
          </div>
        </div>
      ))}

      {/* Location label */}
      <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md">
        <p className="text-sm font-medium text-foreground">
          {province || region || (country === "italy" ? "Italy" : "USA")}
        </p>
        <p className="text-xs text-muted-foreground">
          {listingCount} parcels found
        </p>
      </div>

      {/* Zoom controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <Button 
          size="icon" 
          variant="secondary" 
          className="h-8 w-8"
          onClick={handleZoomClick}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
      </div>

      {/* Unlock overlay when zoom attempted */}
      {zoomAttempted && !isUnlocked && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
          <div className="text-center p-6 max-w-sm">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">
              Subscribe to Unlock Precision Mapping
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Get access to exact parcel boundaries, coordinates, and street-level views for{" "}
              <strong>{region || (country === "italy" ? "Italy" : "USA")}</strong>.
            </p>
            <Button onClick={() => setZoomAttempted(false)} variant="outline" className="mr-2">
              Close
            </Button>
            <Button>
              Subscribe Now
            </Button>
          </div>
        </div>
      )}

      {/* Map legend */}
      <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <AlertCircle className="w-3 h-3" />
          <span>Zoom locked at municipality level</span>
        </div>
      </div>
    </div>
  );
};

export default ListingsMap;
