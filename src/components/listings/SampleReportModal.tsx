import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, Ruler, FileText, CheckCircle, Sun, CreditCard, Calendar, ExternalLink, DollarSign, Trophy } from "lucide-react";
import { MiniParcelMap } from "@/components/maps/MiniParcelMap";

const STRIPE_LINK = "https://buy.stripe.com/4gM14pb5r7Wx4g1aOGaR200";
const CALENDLY_LINK = "https://calendly.com/eracle/new-meeting";

interface SampleReportModalProps {
  children: React.ReactNode;
}

const SampleReportModal = ({ children }: SampleReportModalProps) => {
  // Sample US listing data for the report - West Texas Solar Belt
  const sampleListing = {
    probSolar: 92,
    county: "Ector",
    stateCode: "TX",
    stateName: "Texas",
    lotAcres: 85.3,
    listPrice: 298000,
    pricePerAcre: 3494,
    powerSubstation: 0.8,
    rankInState: 5,
    coordinates: { lat: 31.7619, lng: -102.4892 },
    parcelId: "ECTOR-2024-01293",
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Sample Unlocked Report
          </DialogTitle>
          <DialogDescription>
            This is exactly what you'll see after subscribing. Full transparency, no surprises.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Satellite map view */}
          <div className="relative rounded-lg overflow-hidden h-64">
            <MiniParcelMap
              lat={sampleListing.coordinates.lat}
              lon={sampleListing.coordinates.lng}
              className="h-full"
            />
            <div className="absolute top-3 left-3 flex gap-2">
              <Badge className="bg-primary">
                <Sun className="w-3 h-3 mr-1" />
                {sampleListing.probSolar}%
              </Badge>
              <Badge variant="outline" className="bg-amber-50/90 border-amber-300 text-amber-700">
                <Trophy className="w-3 h-3 mr-1" />
                #{sampleListing.rankInState} in {sampleListing.stateCode}
              </Badge>
              <Badge variant="outline" className="bg-background/80 border-primary text-primary">
                Sample
              </Badge>
            </div>
          </div>

          {/* Unlocked location data */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <h4 className="font-semibold flex items-center gap-2 mb-3 text-primary">
              <CheckCircle className="w-4 h-4" />
              Unlocked Location Data
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Exact Coordinates</p>
                <p className="font-mono font-medium">
                  {sampleListing.coordinates.lat}°N, {Math.abs(sampleListing.coordinates.lng)}°W
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Parcel ID</p>
                <p className="font-medium">{sampleListing.parcelId}</p>
              </div>
              <div className="col-span-2">
                <p className="text-muted-foreground">Full Location</p>
                <p className="font-medium">
                  {sampleListing.county} County, {sampleListing.stateName}
                </p>
              </div>
            </div>
          </div>

          {/* Solar Probability */}
          <div>
            <h4 className="font-semibold mb-3">Solar Probability Analysis</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Solar Development Probability</span>
                <span className="font-bold text-primary">{sampleListing.probSolar}%</span>
              </div>
              <div className="h-4 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary/80 to-primary rounded-full transition-all"
                  style={{ width: `${sampleListing.probSolar}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Based on terrain analysis, grid proximity, zoning, and environmental factors.
              </p>
            </div>
          </div>

          {/* Technical specs */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <Ruler className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Size</p>
                <p className="font-medium">{sampleListing.lotAcres} Acres</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <Zap className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Substation Distance</p>
                <p className="font-medium">{sampleListing.powerSubstation} miles</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <DollarSign className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">List Price</p>
                <p className="font-medium">{formatPrice(sampleListing.listPrice)}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <DollarSign className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Price per Acre</p>
                <p className="font-medium">{formatPrice(sampleListing.pricePerAcre)}/ac</p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="pt-4 border-t space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Get full access to our US solar land database
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild className="flex-1" size="lg">
                <a href={STRIPE_LINK} target="_blank" rel="noopener noreferrer">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Subscribe Now
                  <ExternalLink className="w-3 h-3 ml-2" />
                </a>
              </Button>
              <Button asChild variant="outline" className="flex-1" size="lg">
                <a href={CALENDLY_LINK} target="_blank" rel="noopener noreferrer">
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule a Call
                  <ExternalLink className="w-3 h-3 ml-2" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SampleReportModal;
