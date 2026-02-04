import { lazy, Suspense } from "react";
import Hero from "@/components/Hero";
import SEOHead from "@/components/listings/SEOHead";

// Lazy load below-fold components
const DemoSection = lazy(() => import("@/components/DemoSection"));
const Features = lazy(() => import("@/components/Features"));
const HowItWorks = lazy(() => import("@/components/HowItWorks"));
const Testimonial = lazy(() => import("@/components/Testimonial"));
const Pricing = lazy(() => import("@/components/Pricing"));
const FAQ = lazy(() => import("@/components/FAQ"));
const CTA = lazy(() => import("@/components/CTA"));
const Footer = lazy(() => import("@/components/Footer"));
const CalendlyEmbed = lazy(() => import("@/components/CalendlyEmbed"));

const SectionFallback = () => (
  <div className="py-20 flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const Index = () => {
  return (
    <div className="min-h-screen">
      <SEOHead
        title="Sunnyplans - Find Substation-Ready Land for Solar & BESS Projects"
        description="Discover premium land parcels near electrical substations with our proprietary SunnyScore™ ratings. Find the perfect site for your solar or battery storage project."
        canonicalUrl="https://sunnyplans.com/"
        keywords="solar land, BESS land, substation-ready land, renewable energy land, solar farm sites"
      />
      <Hero />
      <Suspense fallback={<SectionFallback />}>
        <DemoSection />
      </Suspense>
      <Suspense fallback={<SectionFallback />}>
        <Features />
      </Suspense>
      <Suspense fallback={<SectionFallback />}>
        <HowItWorks />
      </Suspense>
      <Suspense fallback={<SectionFallback />}>
        <Testimonial />
      </Suspense>
      <Suspense fallback={<SectionFallback />}>
        <Pricing />
      </Suspense>
      <Suspense fallback={<SectionFallback />}>
        <CalendlyEmbed />
      </Suspense>
      <Suspense fallback={<SectionFallback />}>
        <FAQ />
      </Suspense>
      <Suspense fallback={<SectionFallback />}>
        <CTA />
      </Suspense>
      <Suspense fallback={<SectionFallback />}>
        <Footer />
      </Suspense>
    </div>
  );
};

export default Index;
