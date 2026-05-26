import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ = () => {
  return (
    <section id="faq" className="py-24 bg-muted/50">
      <div className="container px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-muted-foreground text-center mb-12">
            Common questions about Sunnyplans, our services, and our platform
          </p>

          <Accordion type="single" collapsible className="space-y-4">
            {/* General */}
            <AccordionItem value="what-is" className="bg-background rounded-lg px-6 border">
              <AccordionTrigger className="text-left hover:no-underline">
                What is Sunnyplans?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Sunnyplans is a geo-analytics platform that helps renewable energy developers find suitable land for small to medium-sized Battery Energy Storage Systems (BESS) and solar projects. We index real estate data and use a proprietary machine learning model—SunnyScore™—to rank every parcel based on grid proximity, constraint risk, and solar potential.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="who-for" className="bg-background rounded-lg px-6 border">
              <AccordionTrigger className="text-left hover:no-underline">
                Who is Sunnyplans for?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Our primary audience is small to medium-sized renewable energy developers in the U.S. and Italy. We cater to operators focused on modest BESS or solar projects, not large utility-scale entities. Expansion to Spain and Portugal is on the roadmap.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="unique" className="bg-background rounded-lg px-6 border">
              <AccordionTrigger className="text-left hover:no-underline">
                What makes Sunnyplans unique?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Unlike traditional methods of scouting for land, Sunnyplans automates the process by indexing land data first and then filtering based on substation viability and other constraints. Every parcel is then scored by SunnyScore™, our proprietary machine learning model, so you can instantly compare opportunities. This provides pre-vetted, sale-ready parcels ranked by real development potential.
              </AccordionContent>
            </AccordionItem>

            {/* Product & Services */}
            <AccordionItem value="services" className="bg-background rounded-lg px-6 border">
              <AccordionTrigger className="text-left hover:no-underline">
                What services does Sunnyplans offer?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                <p className="mb-2">We offer four ways to access the data:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Free Tier:</strong> Browse every parcel across all 50 US states and 20 Italian regions with obfuscated coordinates and price bands — no card required.</li>
                  <li><strong>Single Parcel ($49 one-time):</strong> Found one listing worth a deeper look? Pay once and unlock that parcel permanently — exact coordinates and the direct source link — without a subscription.</li>
                  <li><strong>Premium ($299/month):</strong> Full access to every parcel across the US and Italy — exact coordinates, source-listing links, sun exposure and PV yield, flat-acreage, distance to 53 infrastructure feature types, and the full SunnyScore breakdown for every parcel.</li>
                  <li><strong>Enterprise:</strong> Custom plan for teams that need API integrations or bulk exports on top of the Premium dataset.</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="data" className="bg-background rounded-lg px-6 border">
              <AccordionTrigger className="text-left hover:no-underline">
                What kind of data does Sunnyplans provide?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                <p className="mb-2">For every parcel we surface:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Location, lot size, list price, and the direct source listing link</li>
                  <li>SunnyScore™ (0–100) with the helping and hurting factors broken out per parcel</li>
                  <li>Distance to 53 OSM feature types — substations, transformers, roads, railways, industrial zones, water, and more</li>
                  <li>Annual sun exposure (GHI, DNI) and fixed-tilt PV specific yield from the Global Solar Atlas</li>
                  <li>Sub-5% slope flat-land acreage from the Copernicus 30 m DEM</li>
                  <li>Constraint screening against PAD-US, NWI wetlands, Natura 2000, and Italian vincolistica</li>
                </ul>
                <p className="mt-3 text-sm">
                  We do not provide owner names or agent/broker contact details — for legal reasons, contact happens through the source listing.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="countries" className="bg-background rounded-lg px-6 border">
              <AccordionTrigger className="text-left hover:no-underline">
                In which countries does Sunnyplans operate?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                We currently cover the United States and Italy. Expansion to Spain and Portugal is on the roadmap.
              </AccordionContent>
            </AccordionItem>

            {/* Technical */}
            <AccordionItem value="identify" className="bg-background rounded-lg px-6 border">
              <AccordionTrigger className="text-left hover:no-underline">
                How does Sunnyplans identify suitable land?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                <p className="mb-2">Our pipeline:</p>
                <ol className="list-decimal pl-5 space-y-2">
                  <li><strong>Indexing real estate data:</strong> We aggregate listings and cadastral parcels from across the U.S. and Italy.</li>
                  <li><strong>Constraint screening:</strong> Parcels are filtered against PAD-US and NWI wetlands in the U.S., Natura 2000 and Italian vincolistica in Italy, plus existing solar installations (OSM and USPVDB).</li>
                  <li><strong>Per-parcel signals:</strong> We compute distance to 53 OSM feature types, annual sun exposure and PV yield from the Global Solar Atlas, and sub-5% slope acreage from the Copernicus 30 m DEM.</li>
                  <li><strong>ML scoring:</strong> Our proprietary SunnyScore™ model ranks each parcel from 0 to 100 and surfaces the helping and hurting factors that drove the score.</li>
                  <li><strong>Delivery:</strong> Top-ranked parcels are browsable on the interactive map; you can drill from country to state to county and share the exact viewport.</li>
                </ol>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="constraints" className="bg-background rounded-lg px-6 border">
              <AccordionTrigger className="text-left hover:no-underline">
                What are the key constraints you filter for?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                <p className="mb-2">Today we screen and overlay these constraints:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Protected areas (U.S.):</strong> The Protected Areas Database of the United States (PAD-US) — parcels overlapping protected land are filtered out by default and the layer is toggleable on the map.</li>
                  <li><strong>Wetlands (U.S.):</strong> The National Wetlands Inventory (NWI) — same screening + overlay treatment as protected areas.</li>
                  <li><strong>Natura 2000 (Italy &amp; EU):</strong> Parcels falling inside Natura 2000 sites are filtered out.</li>
                  <li><strong>Italian vincolistica:</strong> National and regional regulatory constraints applied server-side.</li>
                  <li><strong>Existing solar installations:</strong> OSM and the NREL USPVDB — so you can spot a parcel that's already neighbouring a PV plant.</li>
                  <li><strong>Topography:</strong> Sub-5% slope acreage is precomputed per parcel from the Copernicus 30 m DEM.</li>
                </ul>
                <p className="mt-3 text-sm">
                  On the roadmap: FEMA flood zones, NREL enhanced grid modeling, zoning, and substation hosting-capacity.
                  Today we surface <em>distance</em> to substations and grid infrastructure, not headroom or capacity.
                </p>
              </AccordionContent>
            </AccordionItem>

            {/* For Developers */}
            <AccordionItem value="help" className="bg-background rounded-lg px-6 border">
              <AccordionTrigger className="text-left hover:no-underline">
                How can Sunnyplans help me with my solar/BESS project?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                <p className="mb-2">Sunnyplans can help you:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Save time and money:</strong> By providing pre-vetted land parcels, we reduce the time and cost of land scouting and due diligence.</li>
                  <li><strong>De-risk your projects:</strong> Our constraint analysis helps you avoid sites with potential permitting or construction issues.</li>
                  <li><strong>Find hidden opportunities:</strong> We identify smaller, substation-proximate parcels that are often overlooked by traditional scouting methods.</li>
                  <li><strong>Streamline your workflow:</strong> Our platform provides all the data you need to make informed decisions about land acquisition.</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="refund" className="bg-background rounded-lg px-6 border">
              <AccordionTrigger className="text-left hover:no-underline">
                What if I'm not happy with my purchase?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Every paid purchase — Premium subscription or one-off parcel unlock — comes with a 30-day money-back guarantee, no questions asked. If it doesn't fit your workflow within the first 30 days, reach out and we'll refund you in full.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="get-started" className="bg-background rounded-lg px-6 border">
              <AccordionTrigger className="text-left hover:no-underline">
                How do I get started with Sunnyplans?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Sign up free — no card required — and browse every parcel across the U.S. and Italy with obfuscated coordinates and the full SunnyScore breakdown.
                When you find a parcel you want to act on, either unlock just that one for $49, or go Premium for full access across the platform.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
