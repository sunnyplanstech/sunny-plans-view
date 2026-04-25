import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import ListingsBreadcrumb from "./ListingsBreadcrumb";

interface DetailShellProps {
  country: string;
  region?: string;
  province?: string;
  backUrl: string;
  backLabel: string;
  children: React.ReactNode;
}

export function DetailShell({ country, region, province, backUrl, backLabel, children }: DetailShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to={backUrl}>
                <ArrowLeft className="w-4 h-4 mr-1" /> {backLabel}
              </Link>
            </Button>
          </div>
          <ListingsBreadcrumb country={country} region={region} province={province} />
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <article className="max-w-4xl mx-auto">{children}</article>
      </main>
    </div>
  );
}

export function DetailLoading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Loading listing details...</p>
      </div>
    </div>
  );
}

export function DetailNotFound({ country }: { country?: string }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">Listing Not Found</h1>
        <p className="text-muted-foreground mb-4">The listing you're looking for doesn't exist.</p>
        <Button asChild>
          <Link to={country ? `/${country}` : "/"}>Browse All Listings</Link>
        </Button>
      </div>
    </div>
  );
}
