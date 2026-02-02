import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import ListingsSearch from "./pages/ListingsSearch";
import ListingDetail from "./pages/ListingDetail";
import NotFound from "./pages/NotFound";
import { GoogleMapsProvider } from "@/components/maps/GoogleMapsProvider";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <GoogleMapsProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          
          {/* Country-level pages */}
          <Route path="/:country" element={<ListingsSearch />} />
          
          {/* Region/State-level pages */}
          <Route path="/:country/:region" element={<ListingsSearch />} />
          
          {/* Province/County-level pages */}
          <Route path="/:country/:region/:province" element={<ListingsSearch />} />
          
          {/* Listings pages (with /listings/ or /particelle/ suffix) */}
          <Route path="/:country/:region/:province/listings" element={<ListingsSearch />} />
          <Route path="/:country/:region/:province/particelle" element={<ListingsSearch />} />
          
          {/* Municipality/Comuni-level pages */}
          <Route path="/:country/:region/:province/:municipality" element={<ListingsSearch />} />
          <Route path="/:country/:region/:province/:municipality/listings" element={<ListingsSearch />} />
          <Route path="/:country/:region/:province/:municipality/particelle" element={<ListingsSearch />} />
          
          {/* Individual listing detail */}
          <Route path="/:country/:region/:province/listing/:id" element={<ListingDetail />} />
          <Route path="/:country/:region/:province/:municipality/listing/:id" element={<ListingDetail />} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      </TooltipProvider>
    </GoogleMapsProvider>
  </QueryClientProvider>
);

export default App;
