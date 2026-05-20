import { lazy, Suspense } from "react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { GoogleMapsProvider } from "@/components/maps/GoogleMapsProvider";
import { AuthProvider } from "@/contexts/AuthContext";

// Lazy load heavy route components
const ListingsSearch = lazy(() => import("./pages/ListingsSearch"));
const SunnyScorePreview = lazy(() => import("./pages/SunnyScorePreview"));
const ListingDetail = lazy(() => import("./pages/ListingDetail"));
const Contact = lazy(() => import("./pages/Contact"));
const Terms = lazy(() => import("./pages/Terms"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const CheckYourEmail = lazy(() => import("./pages/CheckYourEmail"));
const Checkout = lazy(() => import("./pages/Checkout"));

// Loading fallback for lazy routes
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <AuthProvider>
    <GoogleMapsProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />

          {/* SunnyScore™ explanation preview (roadmap p2-e1-sunnyscore-visual).
              Visual sandbox — gauge + helping/hurting bars across surfaces. */}
          <Route path="/preview/sunnyscore" element={<Suspense fallback={<PageLoader />}><SunnyScorePreview /></Suspense>} />

          {/* Solar-vertical SPA map — hierarchical scope under /solar/app.
              The bare /<country> shape was retired by the p1-e3 pSEO
              migration (netlify.toml 301s those paths to the static
              /solar surface), so the interactive map lives under
              /solar/app/... — sibling to the static /solar/<state>/<county>
              pSEO pages, both namespaced to the solar vertical
              (sunnyplans-docs/03_marketing/00_positioning.md). Future
              verticals (van life, etc.) will live under /<vertical>/app/.
              Bare /solar/app defaults to the US country scope; a country
              picker would belong here once a second country needs equal
              billing on the entry. */}
          <Route path="/solar/app" element={<Navigate to="/solar/app/united-states" replace />} />
          <Route path="/solar/app/:country" element={<Suspense fallback={<PageLoader />}><ListingsSearch /></Suspense>} />
          <Route path="/solar/app/:country/:region" element={<Suspense fallback={<PageLoader />}><ListingsSearch /></Suspense>} />
          <Route path="/solar/app/:country/:region/:province" element={<Suspense fallback={<PageLoader />}><ListingsSearch /></Suspense>} />
          <Route path="/solar/app/:country/:region/:province/listings" element={<Suspense fallback={<PageLoader />}><ListingsSearch /></Suspense>} />
          <Route path="/solar/app/:country/:region/:province/particelle" element={<Suspense fallback={<PageLoader />}><ListingsSearch /></Suspense>} />
          <Route path="/solar/app/:country/:region/:province/:municipality" element={<Suspense fallback={<PageLoader />}><ListingsSearch /></Suspense>} />
          <Route path="/solar/app/:country/:region/:province/:municipality/listings" element={<Suspense fallback={<PageLoader />}><ListingsSearch /></Suspense>} />
          <Route path="/solar/app/:country/:region/:province/:municipality/particelle" element={<Suspense fallback={<PageLoader />}><ListingsSearch /></Suspense>} />

          {/* Individual listing detail — id is globally unique across US/IT marts */}
          <Route path="/listing/:id" element={<Suspense fallback={<PageLoader />}><ListingDetail /></Suspense>} />

          {/* Blog — served as static HTML from the Netlify deploy under
              /<vertical>/blog/... (see scripts/build-blog.mjs and
              netlify.toml). Not a SPA route. The legacy /blog and
              /blog/:slug paths are 301'd to /solar/blog/... at the edge. */}

          {/* Static pages */}
          <Route path="/contact" element={<Suspense fallback={<PageLoader />}><Contact /></Suspense>} />
          <Route path="/terms" element={<Suspense fallback={<PageLoader />}><Terms /></Suspense>} />
          <Route path="/verify-email/:key" element={<Suspense fallback={<PageLoader />}><VerifyEmail /></Suspense>} />

          {/* Auth */}
          <Route path="/login" element={<Suspense fallback={<PageLoader />}><Login /></Suspense>} />
          <Route path="/register" element={<Suspense fallback={<PageLoader />}><Register /></Suspense>} />
          <Route path="/forgot-password" element={<Suspense fallback={<PageLoader />}><ForgotPassword /></Suspense>} />
          <Route path="/reset-password/:uid/:token" element={<Suspense fallback={<PageLoader />}><ResetPassword /></Suspense>} />
          <Route path="/check-your-email" element={<Suspense fallback={<PageLoader />}><CheckYourEmail /></Suspense>} />

          {/* Stripe checkout return URLs (defined in api/config/settings/base.py STRIPE_*_URL) */}
          <Route path="/checkout/:status" element={<Suspense fallback={<PageLoader />}><Checkout /></Suspense>} />

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      </TooltipProvider>
    </GoogleMapsProvider>
    </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
