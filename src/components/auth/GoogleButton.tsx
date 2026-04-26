import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AuthError } from "@/lib/auth";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";
const GSI_SRC = "https://accounts.google.com/gsi/client";

interface GsiCredentialResponse {
  credential: string;
}

interface GsiAccountsId {
  initialize: (config: {
    client_id: string;
    callback: (response: GsiCredentialResponse) => void;
  }) => void;
  renderButton: (
    parent: HTMLElement,
    options: {
      type?: "standard";
      theme?: "outline" | "filled_blue" | "filled_black";
      size?: "large" | "medium" | "small";
      text?: "signin_with" | "signup_with" | "continue_with";
      shape?: "rectangular" | "pill";
      width?: number;
    },
  ) => void;
}

declare global {
  interface Window {
    google?: { accounts: { id: GsiAccountsId } };
  }
}

let gsiPromise: Promise<void> | null = null;

function loadGsi(): Promise<void> {
  if (gsiPromise) return gsiPromise;
  gsiPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GSI_SRC}"]`);
    if (existing) {
      if (window.google?.accounts?.id) {
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

interface GoogleButtonProps {
  /** Suggested label for the rendered Google button. */
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
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { loginWithGoogle } = useAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    let cancelled = false;
    void loadGsi()
      .then(() => {
        if (cancelled || !window.google?.accounts?.id || !containerRef.current) return;
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: async (response) => {
            try {
              await loginWithGoogle(response.credential);
              navigate(next, { replace: true });
            } catch (err) {
              const message =
                err instanceof AuthError ? err.message : "Google sign-in failed.";
              onError?.(message);
            }
          },
        });
        window.google.accounts.id.renderButton(containerRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text,
          shape: "rectangular",
          width: 320,
        });
        setReady(true);
      })
      .catch(() => onError?.("Could not load Google sign-in."));
    return () => {
      cancelled = true;
    };
  }, [loginWithGoogle, navigate, next, text, onError]);

  if (!GOOGLE_CLIENT_ID) return null;

  return (
    <div className="flex justify-center">
      <div ref={containerRef} className={ready ? "" : "h-10"} />
    </div>
  );
}
