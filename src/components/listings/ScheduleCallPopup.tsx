import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Calendar } from "lucide-react";

const CALENDLY_URL = "https://calendly.com/eracle/new-meeting";

interface ScheduleCallPopupProps {
  open: boolean;
  onClose: () => void;
}

const ScheduleCallPopup = ({ open, onClose }: ScheduleCallPopupProps) => {
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    if (!open) return;

    // Check if the Calendly script is already loaded
    if (document.querySelector('script[src*="calendly"]')) {
      setScriptLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://assets.calendly.com/assets/external/widget.js";
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    document.head.appendChild(script);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Calendar className="w-5 h-5 text-primary" />
            Schedule a Call With Us
          </DialogTitle>
          <DialogDescription>
            Book a free consultation to learn how SunnyPlans can help you find
            the best solar land opportunities.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2">
          {open && (scriptLoaded || document.querySelector('script[src*="calendly"]')) ? (
            <div
              className="calendly-inline-widget rounded-lg overflow-hidden"
              data-url={CALENDLY_URL}
              style={{ minWidth: "280px", height: "600px" }}
            />
          ) : (
            <div
              className="rounded-lg bg-muted/50 flex items-center justify-center"
              style={{ minWidth: "280px", height: "600px" }}
            >
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleCallPopup;
