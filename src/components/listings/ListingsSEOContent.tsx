import { Sun, Zap, MapPin, TrendingUp } from "lucide-react";

interface ListingsSEOContentProps {
  locationName: string;
  listingsCount: number;
}

const ListingsSEOContent = ({ locationName, listingsCount }: ListingsSEOContentProps) => {
  return (
    <section className="mt-12 border-t border-border pt-12">
      {/* Main SEO Content Block */}
      <div className="prose prose-sm max-w-none text-muted-foreground">
        <h2 className="text-xl font-semibold text-foreground mb-4">
          Solar Land & BESS Opportunities in {locationName}
        </h2>
        
        <p className="mb-4">
          Discover premium <strong>solar land</strong> opportunities optimized for utility-scale photovoltaic installations 
          and battery energy storage systems. Our curated <strong>land solar</strong> listings in {locationName} are 
          pre-vetted for grid connectivity, ensuring your <strong>solar and solar</strong> development projects 
          start with the strongest foundation.
        </p>

        <p className="mb-4">
          Whether you're searching for <strong>land for solar</strong> farms or <strong>BESS solar</strong> hybrid 
          installations, our platform provides detailed technical analysis including substation proximity, 
          terrain assessment, and interconnection capacity. Each parcel is evaluated for compatibility with 
          modern <strong>450W panel</strong> arrays and beyond.
        </p>

        <div className="grid md:grid-cols-2 gap-6 my-8 not-prose">
          <div className="bg-muted/30 rounded-lg p-5 border border-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Sun className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">Solar & BESS Integration</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Our <strong>solar and BESS</strong> ready parcels are specifically selected for hybrid energy projects. 
              With <strong>sol energy</strong> demand growing, these sites offer optimal conditions for 
              combined generation and storage facilities.
            </p>
          </div>

          <div className="bg-muted/30 rounded-lg p-5 border border-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">Solar Land Acquisition</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Streamline your <strong>solar land acquisition</strong> process with our geo-analytics platform. 
              Our <strong>geo solar</strong> technology maps every parcel against critical infrastructure 
              to accelerate your <strong>solar acquisition</strong> timeline.
            </p>
          </div>

          <div className="bg-muted/30 rounded-lg p-5 border border-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">BESS in Solar Projects</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Integrating <strong>BESS in solar</strong> developments maximizes revenue potential. 
              Our listings highlight parcels ideal for <strong>solar in solar</strong> co-location strategies, 
              with capacity for both generation and storage assets.
            </p>
          </div>

          <div className="bg-muted/30 rounded-lg p-5 border border-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">European Solar Markets</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Expanding into European markets? Our platform covers key regions for 
              <strong> solary fotowoltaika</strong> and <strong>solary fotowoltaiczne</strong> development, 
              with comprehensive permitting and grid connection data.
            </p>
          </div>
        </div>

        <h3 className="text-lg font-semibold text-foreground mb-3">
          Why Choose SunnyPlans for Solar Land?
        </h3>
        
        <p className="mb-4">
          With {listingsCount > 0 ? `${listingsCount} active listings` : "opportunities"} in {locationName}, 
          SunnyPlans is your trusted partner for <strong>solar land</strong> discovery. Our proprietary 
          SunnyScore™ algorithm evaluates each parcel across 12+ technical criteria, from substation voltage 
          capacity to terrain slope analysis.
        </p>

        <ul className="list-disc pl-5 mb-4 space-y-2">
          <li>Pre-vetted <strong>solar land</strong> with confirmed grid access potential</li>
          <li>Detailed <strong>BESS solar</strong> feasibility assessments</li>
          <li>Off-market parcels not available on traditional platforms</li>
          <li>Technical reports compatible with <strong>450W panel</strong> specifications</li>
          <li>Coverage across Italy, USA, and expanding European markets</li>
        </ul>

        <p>
          Start your <strong>solar acquisition</strong> journey today with confidence. 
          Every listing includes distance to nearest substation, interconnection capacity estimates, 
          and terrain analysis optimized for modern <strong>sol energy</strong> installations.
        </p>
      </div>
    </section>
  );
};

export default ListingsSEOContent;
