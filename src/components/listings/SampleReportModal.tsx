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
import { MapPin, Zap, Mountain, Ruler, FileText, CheckCircle } from "lucide-react";
import SunnyScoreBar from "./SunnyScoreBar";

interface SampleReportModalProps {
  children: React.ReactNode;
}

const SampleReportModal = ({ children }: SampleReportModalProps) => {
  // Dummy listing data for the sample report
  const sampleListing = {
    sunnyScore: 94,
    scoreBreakdown: { grid: 40, solar: 28, terrain: 20, other: 6 },
    region: "Lazio",
    province: "Viterbo",
    municipality: "Tuscania",
    size: 5.2,
    terrain: "Flat",
    slopePercentage: 3,
    distanceToSubstation: "420m",
    substationName: "Terna - Viterbo North",
    landType: "Agricultural",
    coordinates: { lat: 42.4186, lng: 11.8678 },
    cadastralId: "Foglio 4, Particella 22",
    imageUrl: "/1.png",
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
          {/* Full resolution image */}
          <div className="relative rounded-lg overflow-hidden">
            <img
              src={sampleListing.imageUrl}
              alt="Sample parcel satellite view"
              className="w-full h-64 object-cover"
            />
            <div className="absolute top-3 left-3 flex gap-2">
              <Badge className="bg-primary">{sampleListing.sunnyScore}/100</Badge>
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
                  {sampleListing.coordinates.lat}°N, {sampleListing.coordinates.lng}°E
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Cadastral ID</p>
                <p className="font-medium">{sampleListing.cadastralId}</p>
              </div>
              <div className="col-span-2">
                <p className="text-muted-foreground">Full Location</p>
                <p className="font-medium">
                  {sampleListing.municipality}, {sampleListing.province}, {sampleListing.region}
                </p>
              </div>
            </div>
          </div>

          {/* SunnyScore breakdown */}
          <div>
            <h4 className="font-semibold mb-3">SunnyScore™ Analysis</h4>
            <SunnyScoreBar 
              score={sampleListing.sunnyScore} 
              breakdown={sampleListing.scoreBreakdown} 
            />
          </div>

          {/* Technical specs */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <Ruler className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Size</p>
                <p className="font-medium">{sampleListing.size} Hectares</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <Mountain className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Terrain</p>
                <p className="font-medium">{sampleListing.terrain} ({sampleListing.slopePercentage}% slope)</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg col-span-2">
              <Zap className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Grid Connection</p>
                <p className="font-medium">
                  {sampleListing.distanceToSubstation} to {sampleListing.substationName}
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-3">
              Get access to all parcels in {sampleListing.region} with a subscription
            </p>
            <Button size="lg">
              Subscribe to {sampleListing.region}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SampleReportModal;
