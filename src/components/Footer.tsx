import { Link } from "react-router-dom";
import { Sun } from "lucide-react";
import { COUNTRIES } from "@/data/locations";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const usStates = COUNTRIES["united-states"].states;

  return (
    <footer className="border-t border-border bg-background">
      <div className="container px-4 py-12">
        {/* Explore by State */}
        <div className="mb-10">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-6">
            Explore Solar Land by State
          </h3>
          <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-2">
            {usStates.map((state) => (
              <li key={state.slug}>
                <Link
                  to={`/united-states/${state.slug}`}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {state.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="pt-8 border-t border-border grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Sun className="w-8 h-8 text-primary" />
              <span className="text-xl font-bold">SunnyPlans</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Geo-analytics for smarter renewable energy land acquisition.
            </p>
          </div>

          {/* Navigation */}
          <div className="space-y-4">
            <h3 className="font-semibold">Explore</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#features" className="hover:text-primary transition-colors">Features</a></li>
              <li><a href="#how-it-works" className="hover:text-primary transition-colors">How It Works</a></li>
              <li><a href="#testimonial" className="hover:text-primary transition-colors">Testimonial</a></li>
              <li><a href="#pricing" className="hover:text-primary transition-colors">Pricing</a></li>
              <li><a href="#faq" className="hover:text-primary transition-colors">FAQ</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <p>© {currentYear} SunnyPlans. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
