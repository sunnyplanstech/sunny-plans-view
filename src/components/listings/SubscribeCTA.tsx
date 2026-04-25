import { Calendar, CreditCard, ExternalLink, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { CheckoutError, createCheckoutSession, resendVerificationEmail } from "@/lib/subscriptions";
import { toast } from "@/hooks/use-toast";

const CALENDLY_LINK = "https://calendly.com/eracle/new-meeting";

const CTA_STRINGS = {
  en: {
    heading: "Interested in this property?",
    description: "Subscribe to unlock exact coordinates, source URL, and full property data.",
    subscribe: "Subscribe Now",
    or: "or",
    schedule: "Schedule a Call",
    footer: "Get personalized guidance on solar land opportunities.",
    verifyHeading: "Verify your email",
    verifyDescription: "Open the verification link we sent to your inbox before subscribing.",
    resend: "Resend verification email",
    signUpFirst: "Sign Up to Subscribe",
  },
  it: {
    heading: "Interessato a questa particella?",
    description: "Abbonati per vedere coordinate esatte e dati completi.",
    subscribe: "Abbonati Ora",
    or: "oppure",
    schedule: "Prenota una Chiamata",
    footer: "Ricevi consulenza personalizzata sulle opportunita fotovoltaiche.",
    verifyHeading: "Verifica la tua email",
    verifyDescription: "Apri il link di verifica che ti abbiamo inviato per email prima di abbonarti.",
    resend: "Invia di nuovo l'email di verifica",
    signUpFirst: "Registrati per Abbonarti",
  },
} as const;

export type CTALang = keyof typeof CTA_STRINGS;

interface SubscribeCTAProps {
  openAuthModal: (mode: "signup") => void;
  lang?: CTALang;
}

export function SubscribeCTA({ openAuthModal, lang = "en" }: SubscribeCTAProps) {
  const t = CTA_STRINGS[lang];
  const { user } = useAuth();

  const handleSubscribe = async () => {
    if (!user) {
      openAuthModal("signup");
      return;
    }
    try {
      const url = await createCheckoutSession();
      window.location.href = url;
    } catch (err) {
      const reason = err instanceof CheckoutError ? err.reason : "server";
      toast({
        title: reason === "unverified" ? t.verifyHeading : "Checkout failed",
        description:
          err instanceof Error ? err.message : "Could not start checkout.",
        variant: "destructive",
      });
    }
  };

  const handleResend = async () => {
    if (!user) return;
    try {
      await resendVerificationEmail(user.email);
      toast({ title: t.verifyHeading, description: `Sent to ${user.email}.` });
    } catch {
      toast({ title: "Could not resend email", variant: "destructive" });
    }
  };

  const showVerifyBranch = user && !user.email_verified;

  return (
    <>
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold mb-2">
          {showVerifyBranch ? t.verifyHeading : t.heading}
        </h3>
        <p className="text-sm text-muted-foreground">
          {showVerifyBranch ? t.verifyDescription : t.description}
        </p>
      </div>

      {showVerifyBranch ? (
        <Button className="w-full" size="lg" onClick={handleResend}>
          <Mail className="w-4 h-4 mr-2" />
          {t.resend}
        </Button>
      ) : (
        <Button className="w-full" size="lg" onClick={handleSubscribe}>
          <CreditCard className="w-4 h-4 mr-2" />
          {user ? t.subscribe : t.signUpFirst}
        </Button>
      )}

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
