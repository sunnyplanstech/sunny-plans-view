import { lazy, Suspense } from "react";
import SEOHead from "@/components/listings/SEOHead";
import Footer from "@/components/Footer";
import { Link } from "react-router-dom";

const CalendlyEmbed = lazy(() => import("@/components/CalendlyEmbed"));

const Contact = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Contact Us - Sunnyplans"
        description="Get in touch with the Sunnyplans team. Schedule a demo to see how we can help with your renewable energy land acquisition."
        canonicalUrl="https://sunnyplans.com/contact"
      />
      <div className="container max-w-4xl py-16 px-4">
        <Link to="/" className="text-primary hover:underline text-sm">&larr; Back to home</Link>
        <h1 className="text-4xl font-bold mt-4 mb-4">Contact Us</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Have questions about SunnyPlans? Book a call and we'll walk you through the platform.
        </p>
      </div>
      <Suspense
        fallback={
          <div className="flex items-center justify-center" style={{ height: "700px" }}>
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <CalendlyEmbed />
      </Suspense>
      <Footer />
    </div>
  );
};

export default Contact;
