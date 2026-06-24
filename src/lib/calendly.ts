// Calendly popup launcher. The interactive app is switched off, so every
// former auth / signup / subscribe / "enter the app" CTA on the landing
// now opens a "book a call" Calendly popup instead. The Calendly assets
// (CSS + widget.js) are loaded lazily on first use so they cost nothing
// until a visitor actually clicks a CTA.

const CALENDLY_URL = "https://calendly.com/eracle/new-meeting";
const WIDGET_CSS = "https://assets.calendly.com/assets/external/widget.css";
const WIDGET_JS = "https://assets.calendly.com/assets/external/widget.js";

declare global {
  interface Window {
    Calendly?: { initPopupWidget: (opts: { url: string }) => void };
  }
}

function ensureStylesheet() {
  if (document.querySelector(`link[href="${WIDGET_CSS}"]`)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = WIDGET_CSS;
  document.head.appendChild(link);
}

// Loads widget.js once and resolves when window.Calendly is ready. Concurrent
// callers share the single in-flight load via the cached promise.
let scriptPromise: Promise<void> | null = null;
function ensureScript(): Promise<void> {
  if (window.Calendly) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${WIDGET_JS}"]`,
    );
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject());
      return;
    }
    const script = document.createElement("script");
    script.src = WIDGET_JS;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject();
    document.head.appendChild(script);
  });
  return scriptPromise;
}

/**
 * Open the Calendly scheduling popup. Falls back to opening the booking
 * page in a new tab if the widget script can't load (e.g. blocked).
 */
export async function openCalendlyPopup(url: string = CALENDLY_URL) {
  ensureStylesheet();
  try {
    await ensureScript();
    window.Calendly?.initPopupWidget({ url });
  } catch {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}
