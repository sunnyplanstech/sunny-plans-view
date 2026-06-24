import { lazy, Suspense } from "react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Closed from "./pages/Closed";
import NotFound from "./pages/NotFound";
import { GoogleMapsProvider } from "@/components/maps/GoogleMapsProvider";
import { AuthProvider } from "@/contexts/AuthContext";

// The interactive app is switched off, but the marketing site stays live.
// Public, backend-free pages (landing, contact, terms) render normally;
// the blog and pSEO surface are served as static HTML at the edge (see
// netlify.toml). Every route that needed the now-dead backend — the map,
// listing details, auth, and checkout — renders the static <Closed/> notice.
const Contact = lazy(() => import("./pages/Contact"));
const Terms = lazy(() => import("./pages/Terms"));

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
          {/* Live marketing pages */}
          <Route path="/" element={<Index />} />
          <Route path="/contact" element={<Suspense fallback={<PageLoader />}><Contact /></Suspense>} />
          <Route path="/terms" element={<Suspense fallback={<PageLoader />}><Terms /></Suspense>} />

          {/* Switched-off app — every backend-dependent route shows the
              closed notice. The interactive map (/solar/app/...), listing
              details, auth (login/register/password reset/verify), Stripe
              checkout, and the SunnyScore preview all funnel here. */}
          <Route path="/solar/app/*" element={<Closed />} />
          <Route path="/listing/:id" element={<Closed />} />
          <Route path="/preview/sunnyscore" element={<Closed />} />
          <Route path="/login" element={<Closed />} />
          <Route path="/register" element={<Closed />} />
          <Route path="/forgot-password" element={<Closed />} />
          <Route path="/reset-password/:uid/:token" element={<Closed />} />
          <Route path="/check-your-email" element={<Closed />} />
          <Route path="/verify-email/:key" element={<Closed />} />
          <Route path="/checkout/:status" element={<Closed />} />

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
