import { Link } from "react-router-dom";
import SEOHead from "@/components/listings/SEOHead";
import Footer from "@/components/Footer";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Terms of Service - Sunnyplans"
        description="Sunnyplans terms of service and data disclaimer."
        canonicalUrl="https://sunnyplans.com/terms"
      />
      <div className="container max-w-3xl py-16 px-4">
        <Link to="/" className="text-primary hover:underline text-sm">&larr; Back to home</Link>
        <article className="prose prose-neutral dark:prose-invert max-w-none mt-4">
          <h1>Terms of Service</h1>

          <p>
            The land and property data provided herein is for <strong>informational purposes only</strong> and
            does not constitute legal, financial, real estate, or investment advice.
          </p>

          <p>
            Sunnyplans is a <strong>data and analytics service</strong>. We do not act as a real estate broker,
            agent, or intermediary in any transaction. We do not facilitate, negotiate, or participate in the
            purchase, sale, or lease of any property. Any links to third-party listings (e.g., realtor.com) are
            provided solely for your convenience and reference — any engagement with agents, brokers, or sellers
            through those platforms is entirely between you and the respective parties.
          </p>

          <p>
            While we strive to provide accurate and up-to-date information, Sunnyplans makes{" "}
            <strong>no warranties or representations</strong>, express or implied, regarding the accuracy,
            completeness, reliability, or suitability of the data for any particular purpose.
          </p>

          <h2>Your Responsibilities</h2>

          <p>
            <strong>Before taking any action</strong> based on this data — including but not limited to
            purchasing, leasing, or developing land — you are solely responsible for conducting your own
            independent due diligence, which may include:
          </p>

          <ul>
            <li>Title search and verification of ownership</li>
            <li>Zoning and land-use compliance review</li>
            <li>Environmental and geological assessments</li>
            <li>Survey and boundary verification</li>
            <li>Consultation with qualified legal, financial, and real estate professionals</li>
          </ul>

          <h2>Limitation of Liability</h2>

          <p>
            Sunnyplans, its owners, and its affiliates <strong>shall not be held liable</strong> for any loss,
            damage, or expense arising from the use of or reliance on the data provided.
          </p>

          <p>By using this service, you acknowledge and agree to the terms outlined above.</p>
        </article>
      </div>
      <Footer />
    </div>
  );
};

export default Terms;
