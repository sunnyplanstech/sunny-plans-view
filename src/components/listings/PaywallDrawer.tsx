import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Calendar, Check, CreditCard, ExternalLink, Lock, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import {
  resendVerificationEmail,
  startParcelPurchase,
  startSubscription,
} from "@/lib/subscriptions";

const CALENDLY_LINK = "https://calendly.com/eracle/new-meeting";

const STRINGS = {
  en: {
    title: "Unlock this parcel",
    description: "Choose how you want to access full data for this listing.",
    subscribePrice: "$299/month",
    subscribeBlurb: "Full access to every parcel across the US and Italy.",
    subscribeHeading: "Premium",
    subscribeCta: "Go Premium",
    unlockPrice: "$49 one-time",
    unlockBlurb: "Just this listing — exact coordinates, source URL, full data. Permanent access.",
    unlockCta: "Unlock this parcel",
    or: "or",
    schedule: "Schedule a call",
    signUpFirst: "Sign up to continue",
    verifyHeading: "Verify your email",
    verifyDescription: "Open the verification link we sent to your inbox before paying.",
    resend: "Resend verification email",
    redirecting: "Opening secure checkout…",
    success: "Payment confirmed",
    successHint: "Refreshing your data…",
    back: "Back",
    intentFailed: "Could not start checkout. Please try again.",
    duplicate: "You already have access to this listing.",
  },
  it: {
    title: "Sblocca questa particella",
    description: "Scegli come accedere ai dati completi di questa particella.",
    subscribePrice: "$299/mese",
    subscribeBlurb: "Accesso completo a tutte le particelle in USA e Italia.",
    subscribeHeading: "Premium",
    subscribeCta: "Passa a Premium",
    unlockPrice: "$49 una tantum",
    unlockBlurb: "Solo questa particella — coordinate esatte, URL sorgente, dati completi. Accesso permanente.",
    unlockCta: "Sblocca questa particella",
    or: "oppure",
    schedule: "Prenota una chiamata",
    signUpFirst: "Registrati per continuare",
    verifyHeading: "Verifica la tua email",
    verifyDescription: "Apri il link di verifica che ti abbiamo inviato prima di pagare.",
    resend: "Invia di nuovo l'email di verifica",
    redirecting: "Apertura del checkout sicuro…",
    success: "Pagamento confermato",
    successHint: "Aggiornamento dati in corso…",
    back: "Indietro",
    intentFailed: "Impossibile avviare il pagamento. Riprova.",
    duplicate: "Hai già accesso a questa particella.",
  },
} as const;

type Lang = keyof typeof STRINGS;

type DrawerState =
  | { kind: "choice" }
  | { kind: "redirecting" }
  | { kind: "verify" }
  | { kind: "success" };

interface PaywallDrawerProps {
  listingId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called only on the staff-comp shortcut path; the regular flow leaves the
   *  app to Stripe Checkout and returns via /checkout/success. */
  onPaymentSuccess: () => void;
  lang?: Lang;
}

export function PaywallDrawer({
  listingId,
  open,
  onOpenChange,
  onPaymentSuccess,
  lang = "en",
}: PaywallDrawerProps) {
  const t = STRINGS[lang];
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [state, setState] = useState<DrawerState>({ kind: "choice" });

  // Reset to the choice screen each time the drawer reopens.
  useEffect(() => {
    if (open) setState({ kind: "choice" });
  }, [open]);

  const sendToRegister = (action: "subscribe" | "unlock") => {
    // Bake action= into the *next* URL so it survives register → verify →
    // listing redirects. The DetailPage's auto-open hook reads it back.
    const params = new URLSearchParams(location.search);
    params.set("action", action);
    const nextUrl = `${location.pathname}?${params.toString()}`;
    navigate(`/register?next=${encodeURIComponent(nextUrl)}`);
    onOpenChange(false);
  };

  const handleSubscribe = async () => {
    const outcome = await startSubscription(user);
    switch (outcome.kind) {
      case "needs_register":
        sendToRegister("subscribe");
        return;
      case "needs_verify":
        setState({ kind: "verify" });
        return;
      case "ok":
        window.location.href = outcome.checkoutUrl;
        return;
      case "error":
        toast({
          title: "Checkout failed",
          description: outcome.message,
          variant: "destructive",
        });
    }
  };

  const handleUnlock = async () => {
    setState({ kind: "redirecting" });
    const outcome = await startParcelPurchase(user, listingId);
    switch (outcome.kind) {
      case "needs_register":
        sendToRegister("unlock");
        return;
      case "needs_verify":
        setState({ kind: "verify" });
        return;
      case "duplicate":
        toast({ title: t.duplicate });
        onPaymentSuccess();
        onOpenChange(false);
        return;
      case "ok":
        // Empty checkoutUrl = staff comp; backend already created the
        // ParcelPurchase row, no Stripe interaction needed.
        if (!outcome.checkoutUrl) {
          handlePaymentSucceeded();
          return;
        }
        window.location.href = outcome.checkoutUrl;
        return;
      case "error":
        toast({
          title: t.intentFailed,
          description: outcome.message,
          variant: "destructive",
        });
        setState({ kind: "choice" });
    }
  };

  const handleResendVerification = async () => {
    if (!user) return;
    try {
      await resendVerificationEmail(user.email);
      toast({ title: t.verifyHeading, description: `Sent to ${user.email}.` });
    } catch {
      toast({ title: "Could not resend email", variant: "destructive" });
    }
  };

  const handlePaymentSucceeded = () => {
    // Staff-comp path only; regular Stripe flow leaves the app and
    // returns through /checkout/success.
    setState({ kind: "success" });
    setTimeout(() => {
      onPaymentSuccess();
      onOpenChange(false);
    }, 1500);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md md:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t.title}</SheetTitle>
          <SheetDescription>{t.description}</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {state.kind === "choice" && (
            <ChoiceScreen
              t={t}
              onSubscribe={handleSubscribe}
              onUnlock={handleUnlock}
              userKnown={!!user}
            />
          )}

          {state.kind === "redirecting" && (
            <div className="text-center py-12 text-muted-foreground">{t.redirecting}</div>
          )}

          {state.kind === "verify" && (
            <VerifyScreen t={t} onResend={handleResendVerification} onBack={() => setState({ kind: "choice" })} />
          )}

          {state.kind === "success" && (
            <div className="text-center py-12 space-y-3">
              <div className="inline-flex w-12 h-12 rounded-full bg-primary/10 items-center justify-center">
                <Check className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">{t.success}</h3>
              <p className="text-sm text-muted-foreground">{t.successHint}</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

interface ChoiceScreenProps {
  t: (typeof STRINGS)[Lang];
  onSubscribe: () => void;
  onUnlock: () => void;
  userKnown: boolean;
}

function ChoiceScreen({ t, onSubscribe, onUnlock, userKnown }: ChoiceScreenProps) {
  return (
    <>
      <div className="border rounded-lg p-4 space-y-3">
        <div className="flex items-baseline justify-between">
          <h3 className="font-semibold">{t.subscribeHeading}</h3>
          <span className="text-lg font-bold">{t.subscribePrice}</span>
        </div>
        <p className="text-sm text-muted-foreground">{t.subscribeBlurb}</p>
        <Button className="w-full" onClick={onSubscribe}>
          <CreditCard className="w-4 h-4 mr-2" />
          {userKnown ? t.subscribeCta : t.signUpFirst}
        </Button>
      </div>

      <div className="border-2 border-primary rounded-lg p-4 space-y-3 bg-primary/5">
        <div className="flex items-baseline justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <Lock className="w-4 h-4" />
            {t.unlockCta}
          </h3>
          <span className="text-lg font-bold">{t.unlockPrice}</span>
        </div>
        <p className="text-sm text-muted-foreground">{t.unlockBlurb}</p>
        <Button className="w-full" variant="default" onClick={onUnlock}>
          {userKnown ? t.unlockCta : t.signUpFirst}
        </Button>
      </div>

      <div className="relative pt-2">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">{t.or}</span>
        </div>
      </div>

      <Button asChild variant="outline" className="w-full">
        <a href={CALENDLY_LINK} target="_blank" rel="noopener noreferrer">
          <Calendar className="w-4 h-4 mr-2" />
          {t.schedule}
          <ExternalLink className="w-3 h-3 ml-2" />
        </a>
      </Button>
    </>
  );
}

interface VerifyScreenProps {
  t: (typeof STRINGS)[Lang];
  onResend: () => void;
  onBack: () => void;
}

function VerifyScreen({ t, onResend, onBack }: VerifyScreenProps) {
  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <h3 className="font-semibold">{t.verifyHeading}</h3>
        <p className="text-sm text-muted-foreground">{t.verifyDescription}</p>
      </div>
      <Button className="w-full" onClick={onResend}>
        <Mail className="w-4 h-4 mr-2" />
        {t.resend}
      </Button>
      <Button variant="ghost" className="w-full" onClick={onBack}>
        {t.back}
      </Button>
    </div>
  );
}

