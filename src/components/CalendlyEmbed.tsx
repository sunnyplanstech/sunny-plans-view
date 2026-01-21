import { useEffect } from "react";

const CalendlyEmbed = () => {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://assets.calendly.com/assets/external/widget.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <section className="py-20 bg-muted/30">
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
          <div
            className="calendly-inline-widget rounded-xl overflow-hidden shadow-lg"
            data-url="https://calendly.com/eracle/new-meeting"
            style={{ minWidth: "320px", height: "700px" }}
          />
        </div>
      </div>
    </section>
  );
};

export default CalendlyEmbed;
