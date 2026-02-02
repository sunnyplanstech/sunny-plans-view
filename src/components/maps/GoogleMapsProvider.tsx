import { LoadScript, useJsApiLoader } from "@react-google-maps/api";
import { ReactNode, createContext, useContext } from "react";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

const libraries: ("places" | "geometry" | "drawing" | "visualization")[] = ["geometry"];

// Context to check if Google Maps is available
const GoogleMapsContext = createContext<{ isLoaded: boolean; hasApiKey: boolean }>({
  isLoaded: false,
  hasApiKey: false,
});

export function useGoogleMaps() {
  return useContext(GoogleMapsContext);
}

interface GoogleMapsProviderProps {
  children: ReactNode;
}

function GoogleMapsLoaderInner({ children }: GoogleMapsProviderProps) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries,
  });

  return (
    <GoogleMapsContext.Provider value={{ isLoaded, hasApiKey: true }}>
      {children}
    </GoogleMapsContext.Provider>
  );
}

export function GoogleMapsProvider({ children }: GoogleMapsProviderProps) {
  if (!GOOGLE_MAPS_API_KEY) {
    console.warn("Google Maps API key not found. Set VITE_GOOGLE_MAPS_API_KEY in your environment.");
    return (
      <GoogleMapsContext.Provider value={{ isLoaded: false, hasApiKey: false }}>
        {children}
      </GoogleMapsContext.Provider>
    );
  }

  return <GoogleMapsLoaderInner>{children}</GoogleMapsLoaderInner>;
}

export default GoogleMapsProvider;
