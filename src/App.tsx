import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { GoogleMapsProvider } from "@/components/maps/GoogleMapsProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import AuthModal from "@/components/auth/AuthModal";

// Lazy load heavy route components
const ListingsSearch = lazy(() => import("./pages/ListingsSearch"));
const ListingDetail = lazy(() => import("./pages/ListingDetail"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const Contact = lazy(() => import("./pages/Contact"));
const Terms = lazy(() => import("./pages/Terms"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));

// Loading fallback for lazy routes
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
    <GoogleMapsProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthModal />
        <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />

          {/* Country-level pages */}
          <Route path="/:country" element={<Suspense fallback={<PageLoader />}><ListingsSearch /></Suspense>} />

          {/* Region/State-level pages */}
          <Route path="/:country/:region" element={<Suspense fallback={<PageLoader />}><ListingsSearch /></Suspense>} />

          {/* Province/County-level pages */}
          <Route path="/:country/:region/:province" element={<Suspense fallback={<PageLoader />}><ListingsSearch /></Suspense>} />

          {/* Listings pages (with /listings/ or /particelle/ suffix) */}
          <Route path="/:country/:region/:province/listings" element={<Suspense fallback={<PageLoader />}><ListingsSearch /></Suspense>} />
          <Route path="/:country/:region/:province/particelle" element={<Suspense fallback={<PageLoader />}><ListingsSearch /></Suspense>} />

          {/* Municipality/Comuni-level pages */}
          <Route path="/:country/:region/:province/:municipality" element={<Suspense fallback={<PageLoader />}><ListingsSearch /></Suspense>} />
          <Route path="/:country/:region/:province/:municipality/listings" element={<Suspense fallback={<PageLoader />}><ListingsSearch /></Suspense>} />
          <Route path="/:country/:region/:province/:municipality/particelle" element={<Suspense fallback={<PageLoader />}><ListingsSearch /></Suspense>} />

          {/* Individual listing detail */}
          <Route path="/:country/:region/:province/listing/:id" element={<Suspense fallback={<PageLoader />}><ListingDetail /></Suspense>} />
          <Route path="/:country/:region/:province/:municipality/listing/:id" element={<Suspense fallback={<PageLoader />}><ListingDetail /></Suspense>} />

          {/* Blog */}
          <Route path="/blog" element={<Suspense fallback={<PageLoader />}><Blog /></Suspense>} />
          <Route path="/blog/:slug" element={<Suspense fallback={<PageLoader />}><BlogPost /></Suspense>} />

          {/* Static pages */}
          <Route path="/contact" element={<Suspense fallback={<PageLoader />}><Contact /></Suspense>} />
          <Route path="/terms" element={<Suspense fallback={<PageLoader />}><Terms /></Suspense>} />
          <Route path="/verify-email/:key" element={<Suspense fallback={<PageLoader />}><VerifyEmail /></Suspense>} />

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      </TooltipProvider>
    </GoogleMapsProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
