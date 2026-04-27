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

// Representative composites, audited 2026-04-27 against the
// mart_us_listings / mart_it_parcels rank_global=top rows. Numbers are
// plausible for a top-ranked parcel in each country and mutually
// consistent (US: list_price / lot_acres = price_per_acre). Format
// strings mirror api/api/listings/serializers.py PREMIUM_FIELDS
// (_fmt_currency, _fmt_decimal2, _fmt_coord) so the popup looks
// identical to what an unlocked subscriber sees.
const US_SAMPLE = {
  county: "Ector",
  state_code: "TX",
  state_name: "Texas",
  prob_solar_pct: 92,
  rank_in_state: 5,
  lot_acres: "85.30",
  list_price: "$298,000",
  price_per_acre: "$3,494",
  power_substation_m: 1287,
  lat: 31.7619,
  lon: -102.4892,
};

const IT_SAMPLE = {
  comune: "Foggia",
  region: "Puglia",
  prob_solar_pct: 89,
  rank_global: 12,
  area_ha: "12.45",
  power_substation_m: 540,
  lat: 41.4622,
  lon: 15.5447,
};

const formatLatLon = (lat: number, lon: number) =>
  `${lat.toFixed(5)}°, ${lon.toFixed(5)}°`;

const formatSubstationImperial = (m: number) =>
  `${m} m (${(m * 0.000621371).toFixed(1)} mi)`;

interface SampleReportModalProps {
  children: React.ReactNode;
  country: "us" | "it";
}

const SampleReportModal = ({ children, country }: SampleReportModalProps) => {
  const isIT = country === "it";

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            {isIT ? "Esempio Report Sbloccato" : "Sample Unlocked Report"}
          </DialogTitle>
          <DialogDescription>
            {isIT
              ? "Esattamente ciò che vedrai dopo l'abbonamento."
              : "This is exactly what you'll see after subscribing. Full transparency, no surprises."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {isIT ? <ITBody /> : <USBody />}
          <CTA isIT={isIT} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

const USBody = () => {
  const s = US_SAMPLE;
  return (
    <>
      <div className="relative rounded-lg overflow-hidden h-64">
        <MiniParcelMap
          geomJson={{ type: "Point", coordinates: [s.lon, s.lat] }}
          className="h-full"
        />
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge className="bg-primary">
            <Sun className="w-3 h-3 mr-1" />
            {s.prob_solar_pct}%
          </Badge>
          <Badge variant="outline" className="bg-amber-50/90 border-amber-300 text-amber-700">
            <Trophy className="w-3 h-3 mr-1" />
            #{s.rank_in_state} in {s.state_code}
          </Badge>
          <Badge variant="outline" className="bg-background/80 border-primary text-primary">
            Sample
          </Badge>
        </div>
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
        <h4 className="font-semibold flex items-center gap-2 mb-3 text-primary">
          <CheckCircle className="w-4 h-4" />
          Unlocked Location Data
        </h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Exact Coordinates</p>
            <p className="font-mono font-medium">{formatLatLon(s.lat, s.lon)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Full Location</p>
            <p className="font-medium">{s.county} County, {s.state_name}</p>
          </div>
        </div>
      </div>

      <SolarBar pct={s.prob_solar_pct} title="Solar Probability Analysis" label="Solar Development Probability" />

      <div className="grid grid-cols-2 gap-4">
        <Spec icon={Ruler} label="Size" value={`${s.lot_acres} Acres`} />
        <Spec icon={Zap} label="Substation Distance" value={formatSubstationImperial(s.power_substation_m)} />
        <Spec icon={DollarSign} label="List Price" value={s.list_price} />
        <Spec icon={DollarSign} label="Price per Acre" value={`${s.price_per_acre}/ac`} />
      </div>
    </>
  );
};

const ITBody = () => {
  const s = IT_SAMPLE;
  return (
    <>
      <div className="relative rounded-lg overflow-hidden h-64">
        <MiniParcelMap
          geomJson={{ type: "Point", coordinates: [s.lon, s.lat] }}
          className="h-full"
        />
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge className="bg-primary">
            <Sun className="w-3 h-3 mr-1" />
            {s.prob_solar_pct}%
          </Badge>
          <Badge variant="outline" className="bg-amber-50/90 border-amber-300 text-amber-700">
            <Trophy className="w-3 h-3 mr-1" />
            #{s.rank_global} in IT
          </Badge>
          <Badge variant="outline" className="bg-background/80 border-primary text-primary">
            Esempio
          </Badge>
        </div>
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
        <h4 className="font-semibold flex items-center gap-2 mb-3 text-primary">
          <CheckCircle className="w-4 h-4" />
          Dati Posizione Sbloccati
        </h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Coordinate Esatte</p>
            <p className="font-mono font-medium">{formatLatLon(s.lat, s.lon)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Località</p>
            <p className="font-medium">{s.comune}, {s.region}</p>
          </div>
          {/* p1-e2-it-cadastral-id: once foglio + particella reach the
              IT detail page, surface them here as "Identificativo
              Catastale" — the unlocked report doesn't include them
              today either, so omitting matches reality. */}
        </div>
      </div>

      <SolarBar pct={s.prob_solar_pct} title="Probabilità Solare" label="Probabilità Sviluppo Solare" />

      <div className="grid grid-cols-2 gap-4">
        <Spec icon={Ruler} label="Area" value={`${s.area_ha} ha`} />
        <Spec icon={Zap} label="Distanza Sottostazione" value={`${s.power_substation_m} m`} />
      </div>
    </>
  );
};

const SolarBar = ({ pct, title, label }: { pct: number; title: string; label: string }) => (
  <div>
    <h4 className="font-semibold mb-3">{title}</h4>
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-bold text-primary">{pct}%</span>
      </div>
      <div className="h-4 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary/80 to-primary rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  </div>
);

const Spec = ({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) => (
  <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
    <Icon className="w-5 h-5 text-muted-foreground mt-0.5" />
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  </div>
);

const CTA = ({ isIT }: { isIT: boolean }) => (
  <div className="pt-4 border-t space-y-4">
    <p className="text-sm text-muted-foreground text-center">
      {isIT ? "Accesso completo al database delle particelle italiane" : "Get full access to our US solar land database"}
    </p>
    <div className="flex flex-col sm:flex-row gap-3">
      <Button asChild className="flex-1" size="lg">
        <a href={STRIPE_LINK} target="_blank" rel="noopener noreferrer">
          <CreditCard className="w-4 h-4 mr-2" />
          {isIT ? "Abbonati Ora" : "Subscribe Now"}
          <ExternalLink className="w-3 h-3 ml-2" />
        </a>
      </Button>
      <Button asChild variant="outline" className="flex-1" size="lg">
        <a href={CALENDLY_LINK} target="_blank" rel="noopener noreferrer">
          <Calendar className="w-4 h-4 mr-2" />
          {isIT ? "Prenota una Call" : "Schedule a Call"}
          <ExternalLink className="w-3 h-3 ml-2" />
        </a>
      </Button>
    </div>
  </div>
);

export default SampleReportModal;
