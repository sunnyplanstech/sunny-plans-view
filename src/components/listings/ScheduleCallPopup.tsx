import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Calendar } from "lucide-react";

const CALENDLY_URL = "https://calendly.com/eracle/new-meeting";

declare global {
  interface Window {
    Calendly?: {
      initInlineWidget(opts: { url: string; parentElement: HTMLElement }): void;
    };
  }
}

interface ScheduleCallPopupProps {
  open: boolean;
  onClose: () => void;
}

const ScheduleCallPopup = ({ open, onClose }: ScheduleCallPopupProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  // Load the Calendly script once when the popup opens
  useEffect(() => {
    if (!open) return;

    if (window.Calendly) {
      setReady(true);
      return;
    }

    if (document.querySelector('script[src*="calendly"]')) {
      const check = setInterval(() => {
        if (window.Calendly) {
          setReady(true);
          clearInterval(check);
        }
      }, 100);
      return () => clearInterval(check);
    }

    const script = document.createElement("script");
    script.src = "https://assets.calendly.com/assets/external/widget.js";
    script.async = true;
    script.onload = () => setReady(true);
    document.head.appendChild(script);
  }, [open]);

  // Initialize the widget once the script is ready and the container is mounted
  useEffect(() => {
    if (!open || !ready || !containerRef.current) return;

    // Clear any previous widget content
    containerRef.current.innerHTML = "";

    window.Calendly?.initInlineWidget({
      url: CALENDLY_URL,
      parentElement: containerRef.current,
    });
  }, [open, ready]);

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
          {!ready ? (
            <div
              className="rounded-lg bg-muted/50 flex items-center justify-center"
              style={{ minWidth: "280px", height: "600px" }}
            >
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div
              ref={containerRef}
              className="rounded-lg overflow-hidden"
              style={{ minWidth: "280px", height: "600px" }}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleCallPopup;
