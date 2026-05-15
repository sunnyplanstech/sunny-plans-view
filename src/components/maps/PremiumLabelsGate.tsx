// Premium gate for the satellite-with-labels (`hybrid`) map type.
//
// Google's default mapTypeControl exposes a "Labels" checkbox in satellite
// mode; toggling it on flips mapTypeId from `satellite` to `hybrid`. Free
// users may pan/zoom freely but the labels overlay is reserved for paying
// subscribers — so we listen for the change, revert it, and surface a
// dialog pointing them to /#pricing.

import { useEffect, useRef, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

interface PremiumLabelsGateProps {
  map: google.maps.Map | null;
}

export function PremiumLabelsGate({ map }: PremiumLabelsGateProps) {
  const { user } = useAuth();
  const isPremium = user?.has_active_subscription === true;
  const [open, setOpen] = useState(false);

  // Tracks whether the next maptypeid_changed event was triggered by our
  // own revert, so we don't bounce on the rebound.
  const revertingRef = useRef(false);

  useEffect(() => {
    if (!map) return;
    if (isPremium) return;

    const listener = map.addListener("maptypeid_changed", () => {
      if (revertingRef.current) {
        revertingRef.current = false;
        return;
      }
      if (map.getMapTypeId() !== "hybrid") return;

      revertingRef.current = true;
      map.setMapTypeId("satellite");
      setOpen(true);
    });

    return () => google.maps.event.removeListener(listener);
  }, [map, isPremium]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Labels are a Premium feature</DialogTitle>
          <DialogDescription>
            Satellite imagery with place labels is available to Sunnyplans
            Premium subscribers. Upgrade to unlock labels along with exact
            coordinates and source URLs on every listing.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Not now
          </Button>
          <Button asChild>
            <a href="/#pricing">See Premium plans</a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default PremiumLabelsGate;
