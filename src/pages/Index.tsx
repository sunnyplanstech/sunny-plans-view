import Hero from "@/components/Hero";
import DemoSection from "@/components/DemoSection";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import Testimonial from "@/components/Testimonial";
import Pricing from "@/components/Pricing";
import FAQ from "@/components/FAQ";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";
import CalendlyEmbed from "@/components/CalendlyEmbed";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Hero />
      <DemoSection />
      <Features />
      <HowItWorks />
      <Testimonial />
      <Pricing />
      <CalendlyEmbed />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
};

export default Index;
