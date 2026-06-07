import { Calendar, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useResultsCallPrompt } from "@/hooks/useResultsCallPrompt";
import ScheduleCallPopup from "@/components/listings/ScheduleCallPopup";

/** Founder-call CTA for the search/results page.
 *
 *  Surfaces the "schedule a call" offer at the results stage — where
 *  engaged-but-shallow visitors actually spend time — instead of relying
 *  on the listing-detail auto-modal, which session recordings show few
 *  users ever reach. Non-blocking by design: an inline, dismissible
 *  banner that opens the existing ScheduleCallPopup on click, never an
 *  auto-firing modal over the map/list.
 *
 *  Visibility (driven by useResultsCallPrompt):
 *   - hidden for paying subscribers (out of audience),
 *   - hidden once the user books (permanent),
 *   - hidden after a dismissal, then re-surfaced a few browsing actions
 *     later — `actionKey` carries the scope/constraint signature whose
 *     changes count as those actions.
 *
 *  Renders nothing when hidden, so the page can mount it unconditionally
 *  without leaving an empty slot.
 */
const ResultsCallCta = ({
  actionKey,
  className,
}: {
  actionKey: string;
  className?: string;
}) => {
  const { user } = useAuth();
  const prompt = useResultsCallPrompt({
    enabled: !user?.has_active_subscription,
    actionKey,
  });

  if (!prompt.visible) return null;

  return (
    <>
      <div
        className={cn(
          "flex items-center gap-3 rounded-lg border border-border/60 bg-gradient-card px-4 py-3 shadow-sm",
          className,
        )}
      >
        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Calendar className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">
            Not sure these parcels fit your project?
          </p>
          <p className="text-xs text-muted-foreground">
            Book a free call — we'll walk through the data with you.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          className="flex-shrink-0"
          onClick={prompt.openPopup}
        >
          Book a call
        </Button>
        <button
          type="button"
          onClick={prompt.dismiss}
          aria-label="Dismiss"
          className="flex-shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <ScheduleCallPopup
        open={prompt.open}
        onClose={prompt.close}
        onScheduled={prompt.onScheduled}
      />
    </>
  );
};

export default ResultsCallCta;
