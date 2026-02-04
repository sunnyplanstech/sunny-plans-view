import { useEffect, useRef, useState } from "react";

const CalendlyEmbed = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Load Calendly script only when section becomes visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" } // Start loading 200px before visible
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Load script when visible
  useEffect(() => {
    if (!isVisible || scriptLoaded) return;

    const script = document.createElement("script");
    script.src = "https://assets.calendly.com/assets/external/widget.js";
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, [isVisible, scriptLoaded]);

  return (
    <section ref={sectionRef} className="py-20 bg-muted/30">
      <div className="container px-4">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Schedule a Demo
          </h2>
          <p className="text-lg text-muted-foreground">
            Book a call to see how SunnyPlans can accelerate your land acquisition
          </p>
        </div>
        <div className="max-w-4xl mx-auto">
          {isVisible ? (
            <div
              className="calendly-inline-widget rounded-xl overflow-hidden shadow-lg"
              data-url="https://calendly.com/eracle/new-meeting"
              style={{ minWidth: "320px", height: "700px" }}
            />
          ) : (
            <div
              className="rounded-xl bg-muted/50 flex items-center justify-center"
              style={{ minWidth: "320px", height: "700px" }}
            >
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default CalendlyEmbed;
