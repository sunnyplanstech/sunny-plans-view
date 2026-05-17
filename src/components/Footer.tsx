import { Link } from "react-router-dom";
import { Sun } from "lucide-react";
import { COUNTRIES } from "@/data/locations";

const TOP_US_STATES = ["california", "texas", "florida", "arizona", "north-carolina", "colorado", "georgia", "new-york"];
const TOP_IT_REGIONS = ["lombardia", "toscana", "lazio", "sicilia", "puglia", "piemonte", "veneto", "emiliaromagna"];

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const usStates = COUNTRIES["united-states"].states;
  const itRegions = COUNTRIES["italy"].regions;

  const featuredUS = usStates.filter((s) => TOP_US_STATES.includes(s.slug));
  const featuredIT = itRegions.filter((r) => TOP_IT_REGIONS.includes(r.slug));

  return (
    <footer className="border-t border-border bg-background">
      <div className="container px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
          {/* United States */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">
              United States
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {featuredUS.map((state) => (
                <li key={state.slug}>
                  <Link
                    to={`/solar/app/united-states/${state.slug}`}
                    className="hover:text-primary transition-colors"
                  >
                    {state.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  to="/solar/app/united-states"
                  className="hover:text-primary transition-colors font-medium"
                >
                  View all states &rarr;
                </Link>
              </li>
            </ul>
          </div>

          {/* Italy */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">
              Italy
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {featuredIT.map((region) => (
                <li key={region.slug}>
                  <Link
                    to={`/solar/app/italy/${region.slug}`}
                    className="hover:text-primary transition-colors"
                  >
                    {region.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  to="/solar/app/italy"
                  className="hover:text-primary transition-colors font-medium"
                >
                  View all regions &rarr;
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">
              Resources
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/blog" className="hover:text-primary transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <a href="/#pricing" className="hover:text-primary transition-colors">
                  Pricing
                </a>
              </li>
              <li>
                <a href="/#faq" className="hover:text-primary transition-colors">
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">
              Company
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/about" className="hover:text-primary transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-primary transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-primary transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sun className="w-6 h-6 text-primary" />
            <span className="text-lg font-bold">SunnyPlans</span>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; {currentYear} SunnyPlans. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
