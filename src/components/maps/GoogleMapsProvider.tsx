import { LoadScript } from "@react-google-maps/api";
import { ReactNode } from "react";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

const libraries: ("places" | "geometry" | "drawing" | "visualization")[] = ["geometry"];

interface GoogleMapsProviderProps {
  children: ReactNode;
}

export function GoogleMapsProvider({ children }: GoogleMapsProviderProps) {
  if (!GOOGLE_MAPS_API_KEY) {
    console.warn("Google Maps API key not found. Set VITE_GOOGLE_MAPS_API_KEY in your environment.");
    return <>{children}</>;
  }

  return (
    <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY} libraries={libraries}>
      {children}
    </LoadScript>
  );
}

export default GoogleMapsProvider;
