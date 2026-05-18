import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { AuthError } from "@/lib/auth";
import { env } from "@/env";

const GOOGLE_CLIENT_ID = env.VITE_GOOGLE_CLIENT_ID;
const GSI_SRC = "https://accounts.google.com/gsi/client";
const GOOGLE_SCOPE = "openid email profile";

interface CodeResponse {
  code?: string;
  scope?: string;
  authuser?: string;
  prompt?: string;
  error?: string;
}

interface CodeClient {
  requestCode: () => void;
}

interface GsiOAuth2 {
  initCodeClient: (config: {
    client_id: string;
    scope: string;
    ux_mode: "popup" | "redirect";
    callback: (response: CodeResponse) => void;
    error_callback?: (err: { type: string; message?: string }) => void;
  }) => CodeClient;
}

declare global {
  interface Window {
    google?: { accounts: { oauth2: GsiOAuth2 } };
  }
}

let gsiPromise: Promise<void> | null = null;

function loadGsi(): Promise<void> {
  if (gsiPromise) return gsiPromise;
  gsiPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GSI_SRC}"]`);
    if (existing) {
      if (window.google?.accounts?.oauth2) {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("GSI failed to load")), {
        once: true,
      });
      return;
    }
    const script = document.createElement("script");
    script.src = GSI_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("GSI failed to load"));
    document.head.appendChild(script);
  });
  return gsiPromise;
}

const LABELS: Record<NonNullable<GoogleButtonProps["text"]>, string> = {
  signin_with: "Sign in with Google",
  signup_with: "Sign up with Google",
  continue_with: "Continue with Google",
};

interface GoogleButtonProps {
  /** Label variant. */
  text?: "signin_with" | "signup_with" | "continue_with";
  /** Path to navigate to after successful auth (read from `?next=` upstream). */
  next?: string;
  /** Called when the credential exchange fails. */
  onError?: (message: string) => void;
}

export default function GoogleButton({
  text = "continue_with",
  next = "/",
  onError,
}: GoogleButtonProps) {
  const navigate = useNavigate();
  const { loginWithGoogle } = useAuth();
  const [client, setClient] = useState<CodeClient | null>(null);
  const [busy, setBusy] = useState(false);

  // Track mount state so the GSI callback (which can fire after the
  // user has already navigated away on success) doesn't setState on an
  // unmounted component.
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Latest-value refs for the callback-shaped props/values. The GSI
  // CodeClient is created once and captures whatever's in scope at
  // creation time, so if we put `next`/`onError`/`loginWithGoogle` in
  // the effect deps we re-init the client on every prop change and
  // orphan the previous CodeClient in closure. Refs let the effect run
  // once while still reading the current callback at fire time.
  const loginWithGoogleRef = useRef(loginWithGoogle);
  const navigateRef = useRef(navigate);
  const nextRef = useRef(next);
  const onErrorRef = useRef(onError);
  useEffect(() => {
    loginWithGoogleRef.current = loginWithGoogle;
    navigateRef.current = navigate;
    nextRef.current = next;
    onErrorRef.current = onError;
  });

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    let cancelled = false;
    void loadGsi()
      .then(() => {
        if (cancelled || !window.google?.accounts?.oauth2) return;
        const c = window.google.accounts.oauth2.initCodeClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: GOOGLE_SCOPE,
          ux_mode: "popup",
          callback: async (response) => {
            if (!response.code) {
              if (mountedRef.current) setBusy(false);
              return;
            }
            try {
              await loginWithGoogleRef.current(response.code);
              navigateRef.current(nextRef.current, { replace: true });
              // Skip `setBusy(false)` here — navigate has unmounted us
              // on the success path. The mountedRef guard in `finally`
              // would catch it, but returning makes intent explicit.
              return;
            } catch (err) {
              const message =
                err instanceof AuthError ? err.message : "Google sign-in failed.";
              onErrorRef.current?.(message);
            } finally {
              if (mountedRef.current) setBusy(false);
            }
          },
          error_callback: () => {
            if (mountedRef.current) setBusy(false);
          },
        });
        if (!cancelled) setClient(c);
      })
      .catch(() => onErrorRef.current?.("Could not load Google sign-in."));
    return () => {
      cancelled = true;
    };
  }, []);

  if (!GOOGLE_CLIENT_ID) return null;

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      disabled={!client || busy}
      onClick={() => {
        if (!client) return;
        setBusy(true);
        client.requestCode();
      }}
    >
      <GoogleLogo className="mr-2 h-4 w-4" />
      {busy ? "Connecting…" : LABELS[text]}
    </Button>
  );
}

function GoogleLogo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 18 18"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        fill="#4285F4"
        d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.717v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.616z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
      />
    </svg>
  );
}
