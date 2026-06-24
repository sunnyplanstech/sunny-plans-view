import { Button } from "@/components/ui/button";
import { ArrowLeft, CalendarDays } from "lucide-react";
import { openCalendlyPopup } from "@/lib/calendly";

// Shown for every route that depended on the (now switched-off) backend —
// the interactive map, listing details, auth, and checkout. The marketing
// site (landing, blog, pSEO) stays live; from here a visitor can head back
// home or book a call.
const Closed = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-subtle px-4 py-16">
    <main className="max-w-xl text-center">
      <h1 className="text-3xl font-bold mb-6">The SunnyPlans app is switched off</h1>
      <p className="text-muted-foreground mb-4">
        SunnyPlans scored parcels for solar and battery-storage (BESS) projects
        by grid proximity, solar potential, and terrain. The interactive search
        and the underlying data are no longer available.
      </p>
      <p className="text-muted-foreground mb-8">
        The site is still here — read the blog or book a call if you&apos;d like
        to talk.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Button variant="hero" size="lg" onClick={() => openCalendlyPopup()}>
          <CalendarDays className="mr-2 h-4 w-4" />
          Book a Call
        </Button>
        <Button asChild variant="outline" size="lg">
          <a href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </a>
        </Button>
      </div>
    </main>
  </div>
);

export default Closed;
