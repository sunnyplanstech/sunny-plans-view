import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sun, ChevronDown, Menu, X, LogIn } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import UserMenu from "@/components/auth/UserMenu";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [listingsOpen, setListingsOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, openAuthModal } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setMobileOpen(false);
    setListingsOpen(false);
    if (location.pathname === "/") {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate(`/#${id}`);
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/95 backdrop-blur-md border-b border-border shadow-sm"
          : "bg-white/90 backdrop-blur-sm border-b border-border/40 shadow-sm"
      }`}
    >
      <div className="container px-4 mx-auto">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2.5 font-bold text-2xl text-foreground"
          >
            <Sun className="w-6 h-6 text-primary" />
            Sunnyplans
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-2">
            {/* Listings dropdown */}
            <div className="relative">
              <button
                onClick={() => setListingsOpen((o) => !o)}
                onBlur={() => setTimeout(() => setListingsOpen(false), 150)}
                className="flex items-center gap-1.5 px-4 py-2.5 text-base font-medium text-foreground/80 hover:text-foreground rounded-md hover:bg-muted transition-colors"
              >
                Listings
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${listingsOpen ? "rotate-180" : ""}`}
                />
              </button>
              {listingsOpen && (
                <div
                  className="absolute top-full left-0 mt-1 w-44 bg-background border border-border rounded-lg shadow-lg py-1 z-10"
                  onMouseDown={(e) => e.preventDefault()}
                >
                  <Link
                    to="/united-states"
                    onClick={() => setListingsOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  >
                    🇺🇸 United States
                  </Link>
                  <Link
                    to="/italy"
                    onClick={() => setListingsOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  >
                    🇮🇹 Italy
                  </Link>
                </div>
              )}
            </div>

            <button
              onClick={() => scrollToSection("pricing")}
              className="px-4 py-2.5 text-base font-medium text-foreground/80 hover:text-foreground rounded-md hover:bg-muted transition-colors"
            >
              Pricing
            </button>

            <a
              href="/blog"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 text-base font-medium text-foreground/80 hover:text-foreground rounded-md hover:bg-muted transition-colors"
            >
              Blog
            </a>

            {isAuthenticated ? (
              <div className="ml-3">
                <UserMenu />
              </div>
            ) : (
              <Button
                size="lg"
                className="ml-3 text-base px-6"
                onClick={() => openAuthModal("login")}
              >
                <LogIn className="mr-2 h-4 w-4" />
                Sign In
              </Button>
            )}
          </nav>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 text-muted-foreground hover:text-foreground"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-background/95 backdrop-blur-md border-b border-border">
          <nav className="container px-4 mx-auto py-4 flex flex-col gap-1">
            <p className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Listings
            </p>
            <Link
              to="/united-states"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
            >
              🇺🇸 United States
            </Link>
            <Link
              to="/italy"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
            >
              🇮🇹 Italy
            </Link>
            <button
              onClick={() => scrollToSection("pricing")}
              className="text-left px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
            >
              Pricing
            </button>
            <a
              href="/blog"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMobileOpen(false)}
              className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
            >
              Blog
            </a>
            {isAuthenticated ? (
              <div className="mt-2 flex items-center gap-2 px-3 py-2">
                <UserMenu />
              </div>
            ) : (
              <Button
                className="mt-2 w-full"
                onClick={() => { setMobileOpen(false); openAuthModal("login"); }}
              >
                <LogIn className="mr-2 h-4 w-4" />
                Sign In
              </Button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;
