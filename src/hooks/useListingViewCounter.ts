import { useState, useEffect, useCallback, useRef } from "react";

const STORAGE_KEY = "sp_listing_view_count";
const TRIGGER_EVERY = 5;

export function useListingViewCounter() {
  const [shouldShowPopup, setShouldShowPopup] = useState(false);
  const hasIncremented = useRef(false);

  useEffect(() => {
    // Guard against React StrictMode double-firing effects
    if (hasIncremented.current) return;
    hasIncremented.current = true;

    const raw = localStorage.getItem(STORAGE_KEY);
    const count = (raw ? parseInt(raw, 10) : 0) + 1;

    if (count >= TRIGGER_EVERY) {
      setShouldShowPopup(true);
      localStorage.setItem(STORAGE_KEY, "0");
    } else {
      localStorage.setItem(STORAGE_KEY, String(count));
    }
  }, []);

  const closePopup = useCallback(() => {
    setShouldShowPopup(false);
  }, []);

  return { shouldShowPopup, closePopup };
}
