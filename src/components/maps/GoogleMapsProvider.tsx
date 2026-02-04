import { useJsApiLoader } from "@react-google-maps/api";
import { ReactNode, createContext, useContext, useState, useCallback } from "react";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

const libraries: ("places" | "geometry" | "drawing" | "visualization")[] = ["geometry"];

// Context to check if Google Maps is available
const GoogleMapsContext = createContext<{
  isLoaded: boolean;
  hasApiKey: boolean;
  requestLoad: () => void;
}>({
  isLoaded: false,
  hasApiKey: false,
  requestLoad: () => {},
});

export function useGoogleMaps() {
  return useContext(GoogleMapsContext);
}

interface GoogleMapsProviderProps {
  children: ReactNode;
}

// Inner component that actually loads the API
function GoogleMapsLoaderInner({ children, shouldLoad }: GoogleMapsProviderProps & { shouldLoad: boolean }) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries,
    // Only load when explicitly requested
    ...(shouldLoad ? {} : { preventGoogleFontsLoading: true }),
  });

  // If not requested to load yet, return false for isLoaded
  const effectiveIsLoaded = shouldLoad ? isLoaded : false;

  return (
    <GoogleMapsContext.Provider value={{ isLoaded: effectiveIsLoaded, hasApiKey: true, requestLoad: () => {} }}>
      {children}
    </GoogleMapsContext.Provider>
  );
}

export function GoogleMapsProvider({ children }: GoogleMapsProviderProps) {
  const [shouldLoad, setShouldLoad] = useState(false);

  const requestLoad = useCallback(() => {
    setShouldLoad(true);
  }, []);

  if (!GOOGLE_MAPS_API_KEY) {
    console.warn("Google Maps API key not found. Set VITE_GOOGLE_MAPS_API_KEY in your environment.");
    return (
      <GoogleMapsContext.Provider value={{ isLoaded: false, hasApiKey: false, requestLoad }}>
        {children}
      </GoogleMapsContext.Provider>
    );
  }

  // Deferred loading: only load Google Maps when requested
  if (!shouldLoad) {
    return (
      <GoogleMapsContext.Provider value={{ isLoaded: false, hasApiKey: true, requestLoad }}>
        {children}
      </GoogleMapsContext.Provider>
    );
  }

  return <GoogleMapsLoaderInner shouldLoad={shouldLoad}>{children}</GoogleMapsLoaderInner>;
}

export default GoogleMapsProvider;
