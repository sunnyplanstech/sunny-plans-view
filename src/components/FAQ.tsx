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
                Sunnyplans is a geo-analytics platform that helps renewable energy developers find suitable land for small to medium-sized Battery Energy Storage Systems (BESS) and solar projects. We index real estate data and use advanced filtering to identify high-potential, substation-proximate land parcels.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="who-for" className="bg-background rounded-lg px-6 border">
              <AccordionTrigger className="text-left hover:no-underline">
                Who is Sunnyplans for?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Our primary audience is small to medium-sized renewable energy developers in the U.S. and the EU (specifically Italy, Spain, and Portugal). We cater to operators focused on modest BESS or solar projects, not large utility-scale entities.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="unique" className="bg-background rounded-lg px-6 border">
              <AccordionTrigger className="text-left hover:no-underline">
                What makes Sunnyplans unique?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Unlike traditional methods of scouting for land, Sunnyplans automates the process by indexing land data first and then filtering based on substation viability and other constraints. This provides our users with pre-vetted, sale-ready parcels, saving them time and money on interconnection fees and development timelines.
              </AccordionContent>
            </AccordionItem>

            {/* Product & Services */}
            <AccordionItem value="services" className="bg-background rounded-lg px-6 border">
              <AccordionTrigger className="text-left hover:no-underline">
                What services does Sunnyplans offer?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                <p className="mb-2">We offer a tiered subscription service:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Free Tier:</strong> Provides monthly insights into land opportunities in a single US state, with a limited number of listings.</li>
                  <li><strong>Premium Tier:</strong> Offers curated data for active developers, including detailed parcel listings, full substation proximity analysis, and advanced risk mapping for a single US state.</li>
                  <li><strong>Enterprise Tier:</strong> A custom solution for portfolio growth, featuring an interactive map-based discovery tool, multi-state or custom coverage, and dedicated support.</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="data" className="bg-background rounded-lg px-6 border">
              <AccordionTrigger className="text-left hover:no-underline">
                What kind of data does Sunnyplans provide?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                <p className="mb-2">We provide detailed information on land parcels, including:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Location and size</li>
                  <li>Proximity to substations</li>
                  <li>Grid connection viability</li>
                  <li>Constraint filtering (flood, natural, historical, geotechnical risks)</li>
                  <li>Direct links to real estate listings</li>
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="countries" className="bg-background rounded-lg px-6 border">
              <AccordionTrigger className="text-left hover:no-underline">
                In which countries does Sunnyplans operate?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                We are currently focused on the United States, with plans to re-enter the EU market, starting with Italy, Spain, and Portugal.
              </AccordionContent>
            </AccordionItem>

            {/* Technical */}
            <AccordionItem value="identify" className="bg-background rounded-lg px-6 border">
              <AccordionTrigger className="text-left hover:no-underline">
                How does Sunnyplans identify suitable land?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                <p className="mb-2">We use a proprietary process that involves:</p>
                <ol className="list-decimal pl-5 space-y-2">
                  <li><strong>Indexing real estate data:</strong> We aggregate land listings from various sources.</li>
                  <li><strong>Geo-analytics and filtering:</strong> We apply a series of filters to identify parcels that meet our criteria, such as proximity to substations, land size, and absence of constraints.</li>
                  <li><strong>Constraint analysis:</strong> We screen for flood risks, natural and historical constraints, grid capacity, and geotechnical issues.</li>
                </ol>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="constraints" className="bg-background rounded-lg px-6 border">
              <AccordionTrigger className="text-left hover:no-underline">
                What are the key constraints you filter for?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                <p className="mb-2">We filter for a variety of constraints to de-risk projects, including:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Flood Risks:</strong> Using data from sources like the FEMA National Flood Hazard Layer.</li>
                  <li><strong>Natural/Naturalistic Constraints:</strong> Identifying protected areas, wetlands, and wildlife habitats using data from the Protected Areas Database of the United States (PAD-US), National Wetlands Inventory (NWI), and the Natura 2000 network in the EU.</li>
                  <li><strong>Historical Constraints:</strong> Avoiding sites with cultural or archaeological significance.</li>
                  <li><strong>Grid Constraints:</strong> Assessing grid capacity and interconnection viability using data from grid operators and models from NREL.</li>
                  <li><strong>Geotechnical Constraints:</strong> Evaluating soil stability and topography.</li>
                </ul>
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

            <AccordionItem value="get-started" className="bg-background rounded-lg px-6 border">
              <AccordionTrigger className="text-left hover:no-underline">
                How do I get started with Sunnyplans?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                You can start with our Free Tier to get a feel for our platform. Simply sign up on our website and select your state of interest. If you need more detailed data and features, you can upgrade to our Premium or Enterprise tiers.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
