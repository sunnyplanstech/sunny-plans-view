import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import ListingsSearch from "./pages/ListingsSearch";
import ListingDetail from "./pages/ListingDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          {/* Listings routes - Programmatic SEO pages */}
          <Route path="/listings" element={<ListingsSearch />} />
          <Route path="/listings/:country" element={<ListingsSearch />} />
          <Route path="/listings/:country/:region" element={<ListingsSearch />} />
          <Route path="/listings/:country/:region/:province" element={<ListingsSearch />} />
          <Route path="/listings/:country/:region/:province/:municipality" element={<ListingsSearch />} />
          <Route path="/listings/:id" element={<ListingDetail />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
