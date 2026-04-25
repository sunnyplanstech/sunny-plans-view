import { Calendar, CreditCard, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

const CALENDLY_LINK = "https://calendly.com/eracle/new-meeting";

const CTA_STRINGS = {
  en: {
    heading: "Interested in this property?",
    description: "Subscribe to unlock exact coordinates, source URL, and full property data.",
    subscribe: "Subscribe Now",
    or: "or",
    schedule: "Schedule a Call",
    footer: "Get personalized guidance on solar land opportunities.",
  },
  it: {
    heading: "Interessato a questa particella?",
    description: "Abbonati per vedere coordinate esatte e dati completi.",
    subscribe: "Abbonati Ora",
    or: "oppure",
    schedule: "Prenota una Chiamata",
    footer: "Ricevi consulenza personalizzata sulle opportunita fotovoltaiche.",
  },
} as const;

export type CTALang = keyof typeof CTA_STRINGS;

interface SubscribeCTAProps {
  openAuthModal: (mode: "signup") => void;
  lang?: CTALang;
}

export function SubscribeCTA({ openAuthModal, lang = "en" }: SubscribeCTAProps) {
  const t = CTA_STRINGS[lang];
  return (
    <>
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold mb-2">{t.heading}</h3>
        <p className="text-sm text-muted-foreground">{t.description}</p>
      </div>

      <Button className="w-full" size="lg" onClick={() => openAuthModal("signup")}>
        <CreditCard className="w-4 h-4 mr-2" />
        {t.subscribe}
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">{t.or}</span>
        </div>
      </div>

      <Button asChild variant="outline" className="w-full" size="lg">
        <a href={CALENDLY_LINK} target="_blank" rel="noopener noreferrer">
          <Calendar className="w-4 h-4 mr-2" />
          {t.schedule}
          <ExternalLink className="w-3 h-3 ml-2" />
        </a>
      </Button>

      <p className="text-xs text-center text-muted-foreground pt-2">{t.footer}</p>
    </>
  );
}

export function FullAccessBadge() {
  return (
    <div className="text-center">
      <h3 className="text-lg font-semibold mb-2">Full access active</h3>
      <p className="text-sm text-muted-foreground">
        You have access to all data for this property.
      </p>
    </div>
  );
}
