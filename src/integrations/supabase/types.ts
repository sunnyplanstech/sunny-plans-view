export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      mart_us_listings_public: {
        Row: {
          id: string
          state_code: string
          county: string
          city: string | null
          zip_code: string | null
          prob_solar: number | null
          rank_global: number | null
          rank_in_state: number | null
          rank_in_county: number | null
          power_line: number | null
          power_minor_line: number | null
          power_pole: number | null
          power_tower: number | null
          power_substation: number | null
          power_transformer: number | null
          highway_motorway: number | null
          highway_trunk: number | null
          highway_primary: number | null
          highway_secondary: number | null
          highway_tertiary: number | null
          railway_rail: number | null
          railway_station: number | null
          landuse_residential: number | null
          landuse_commercial: number | null
          landuse_industrial: number | null
          landuse_retail: number | null
          landuse_military: number | null
          landuse_reservoir: number | null
          landuse_brownfield: number | null
          landuse_landfill: number | null
          landuse_quarry: number | null
          landuse_railway: number | null
          natural_wood: number | null
          natural_wetland: number | null
          natural_water: number | null
          natural_cliff: number | null
          natural_peak: number | null
          natural_ridge: number | null
          waterway_river: number | null
          waterway_stream: number | null
          waterway_canal: number | null
          waterway_dam: number | null
          building_residential: number | null
          building_commercial: number | null
          building_industrial: number | null
          building_school: number | null
          building_hospital: number | null
          building_university: number | null
          amenity_hospital: number | null
          amenity_school: number | null
          amenity_university: number | null
          aeroway_aerodrome: number | null
          aeroway_heliport: number | null
          leisure_nature_reserve: number | null
          leisure_park: number | null
          military_base: number | null
          military_airfield: number | null
          military_danger_area: number | null
          military_training_area: number | null
          tourism_attraction: number | null
          tourism_museum: number | null
          tourism_zoo: number | null
          list_price: number | null
          lot_acres: number | null
          lot_sqft: number | null
          price_per_acre: number | null
          price_per_sqft: number | null
          sqft: number | null
          year_built: number | null
          lat: number | null
          lon: number | null
          geom_json: Json | null
        }
        Insert: {
          id: string
          state_code: string
          county: string
          city?: string | null
          zip_code?: string | null
          prob_solar?: number | null
          rank_global?: number | null
          rank_in_state?: number | null
          rank_in_county?: number | null
          power_line?: number | null
          power_minor_line?: number | null
          power_pole?: number | null
          power_tower?: number | null
          power_substation?: number | null
          power_transformer?: number | null
          highway_motorway?: number | null
          highway_trunk?: number | null
          highway_primary?: number | null
          highway_secondary?: number | null
          highway_tertiary?: number | null
          railway_rail?: number | null
          railway_station?: number | null
          landuse_residential?: number | null
          landuse_commercial?: number | null
          landuse_industrial?: number | null
          landuse_retail?: number | null
          landuse_military?: number | null
          landuse_reservoir?: number | null
          landuse_brownfield?: number | null
          landuse_landfill?: number | null
          landuse_quarry?: number | null
          landuse_railway?: number | null
          natural_wood?: number | null
          natural_wetland?: number | null
          natural_water?: number | null
          natural_cliff?: number | null
          natural_peak?: number | null
          natural_ridge?: number | null
          waterway_river?: number | null
          waterway_stream?: number | null
          waterway_canal?: number | null
          waterway_dam?: number | null
          building_residential?: number | null
          building_commercial?: number | null
          building_industrial?: number | null
          building_school?: number | null
          building_hospital?: number | null
          building_university?: number | null
          amenity_hospital?: number | null
          amenity_school?: number | null
          amenity_university?: number | null
          aeroway_aerodrome?: number | null
          aeroway_heliport?: number | null
          leisure_nature_reserve?: number | null
          leisure_park?: number | null
          military_base?: number | null
          military_airfield?: number | null
          military_danger_area?: number | null
          military_training_area?: number | null
          tourism_attraction?: number | null
          tourism_museum?: number | null
          tourism_zoo?: number | null
          list_price?: number | null
          lot_acres?: number | null
          lot_sqft?: number | null
          price_per_acre?: number | null
          price_per_sqft?: number | null
          sqft?: number | null
          year_built?: number | null
          lat?: number | null
          lon?: number | null
          geom_json?: Json | null
        }
        Update: {
          id?: string
          state_code?: string
          county?: string
          city?: string | null
          zip_code?: string | null
          prob_solar?: number | null
          rank_global?: number | null
          rank_in_state?: number | null
          rank_in_county?: number | null
          power_line?: number | null
          power_minor_line?: number | null
          power_pole?: number | null
          power_tower?: number | null
          power_substation?: number | null
          power_transformer?: number | null
          highway_motorway?: number | null
          highway_trunk?: number | null
          highway_primary?: number | null
          highway_secondary?: number | null
          highway_tertiary?: number | null
          railway_rail?: number | null
          railway_station?: number | null
          landuse_residential?: number | null
          landuse_commercial?: number | null
          landuse_industrial?: number | null
          landuse_retail?: number | null
          landuse_military?: number | null
          landuse_reservoir?: number | null
          landuse_brownfield?: number | null
          landuse_landfill?: number | null
          landuse_quarry?: number | null
          landuse_railway?: number | null
          natural_wood?: number | null
          natural_wetland?: number | null
          natural_water?: number | null
          natural_cliff?: number | null
          natural_peak?: number | null
          natural_ridge?: number | null
          waterway_river?: number | null
          waterway_stream?: number | null
          waterway_canal?: number | null
          waterway_dam?: number | null
          building_residential?: number | null
          building_commercial?: number | null
          building_industrial?: number | null
          building_school?: number | null
          building_hospital?: number | null
          building_university?: number | null
          amenity_hospital?: number | null
          amenity_school?: number | null
          amenity_university?: number | null
          aeroway_aerodrome?: number | null
          aeroway_heliport?: number | null
          leisure_nature_reserve?: number | null
          leisure_park?: number | null
          military_base?: number | null
          military_airfield?: number | null
          military_danger_area?: number | null
          military_training_area?: number | null
          tourism_attraction?: number | null
          tourism_museum?: number | null
          tourism_zoo?: number | null
          list_price?: number | null
          lot_acres?: number | null
          lot_sqft?: number | null
          price_per_acre?: number | null
          price_per_sqft?: number | null
          sqft?: number | null
          year_built?: number | null
          lat?: number | null
          lon?: number | null
          geom_json?: Json | null
        }
        Relationships: []
      }
      demo_properties: {
        Row: {
          created_at: string
          distance_to_substation: number
          id: number
          image: string
          listing_price: number
          price_per_sqft: number
          substation_max_voltage: number
        }
        Insert: {
          created_at?: string
          distance_to_substation: number
          id?: number
          image: string
          listing_price: number
          price_per_sqft: number
          substation_max_voltage: number
        }
        Update: {
          created_at?: string
          distance_to_substation?: number
          id?: number
          image?: string
          listing_price?: number
          price_per_sqft?: number
          substation_max_voltage?: number
        }
        Relationships: []
      }
      italian_comuni: {
        Row: {
          created_at: string
          id: string
          name: string
          province_slug: string
          region_slug: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          province_slug: string
          region_slug: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          province_slug?: string
          region_slug?: string
          slug?: string
        }
        Relationships: []
      }
      italian_provinces: {
        Row: {
          created_at: string
          id: string
          name: string
          region_slug: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          region_slug: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          region_slug?: string
          slug?: string
        }
        Relationships: []
      }
      mart_it_parcels_public: {
        Row: {
          id: string
          comune_code: string
          comune_name: string
          comune_slug: string
          region_slug: string
          prob_solar: number | null
          rank_global: number | null
          rank_in_comune: number | null
          power_line: number | null
          power_minor_line: number | null
          power_pole: number | null
          power_tower: number | null
          power_substation: number | null
          power_transformer: number | null
          highway_motorway: number | null
          highway_trunk: number | null
          highway_primary: number | null
          highway_secondary: number | null
          highway_tertiary: number | null
          railway_rail: number | null
          railway_station: number | null
          landuse_residential: number | null
          landuse_commercial: number | null
          landuse_industrial: number | null
          landuse_retail: number | null
          landuse_military: number | null
          landuse_reservoir: number | null
          landuse_brownfield: number | null
          landuse_landfill: number | null
          landuse_quarry: number | null
          landuse_railway: number | null
          natural_wood: number | null
          natural_wetland: number | null
          natural_water: number | null
          natural_cliff: number | null
          natural_peak: number | null
          natural_ridge: number | null
          waterway_river: number | null
          waterway_stream: number | null
          waterway_canal: number | null
          waterway_dam: number | null
          building_residential: number | null
          building_commercial: number | null
          building_industrial: number | null
          building_school: number | null
          building_hospital: number | null
          building_university: number | null
          amenity_hospital: number | null
          amenity_school: number | null
          amenity_university: number | null
          aeroway_aerodrome: number | null
          aeroway_heliport: number | null
          leisure_nature_reserve: number | null
          leisure_park: number | null
          military_base: number | null
          military_airfield: number | null
          military_danger_area: number | null
          military_training_area: number | null
          tourism_attraction: number | null
          tourism_museum: number | null
          tourism_zoo: number | null
          area_ha: number | null
          area_m2: number | null
          lat: number | null
          lon: number | null
          geom_json: Json | null
        }
        Insert: {
          id: string
          comune_code: string
          comune_name: string
          comune_slug: string
          region_slug: string
          prob_solar?: number | null
          rank_global?: number | null
          rank_in_comune?: number | null
          power_line?: number | null
          power_minor_line?: number | null
          power_pole?: number | null
          power_tower?: number | null
          power_substation?: number | null
          power_transformer?: number | null
          highway_motorway?: number | null
          highway_trunk?: number | null
          highway_primary?: number | null
          highway_secondary?: number | null
          highway_tertiary?: number | null
          railway_rail?: number | null
          railway_station?: number | null
          landuse_residential?: number | null
          landuse_commercial?: number | null
          landuse_industrial?: number | null
          landuse_retail?: number | null
          landuse_military?: number | null
          landuse_reservoir?: number | null
          landuse_brownfield?: number | null
          landuse_landfill?: number | null
          landuse_quarry?: number | null
          landuse_railway?: number | null
          natural_wood?: number | null
          natural_wetland?: number | null
          natural_water?: number | null
          natural_cliff?: number | null
          natural_peak?: number | null
          natural_ridge?: number | null
          waterway_river?: number | null
          waterway_stream?: number | null
          waterway_canal?: number | null
          waterway_dam?: number | null
          building_residential?: number | null
          building_commercial?: number | null
          building_industrial?: number | null
          building_school?: number | null
          building_hospital?: number | null
          building_university?: number | null
          amenity_hospital?: number | null
          amenity_school?: number | null
          amenity_university?: number | null
          aeroway_aerodrome?: number | null
          aeroway_heliport?: number | null
          leisure_nature_reserve?: number | null
          leisure_park?: number | null
          military_base?: number | null
          military_airfield?: number | null
          military_danger_area?: number | null
          military_training_area?: number | null
          tourism_attraction?: number | null
          tourism_museum?: number | null
          tourism_zoo?: number | null
          area_ha?: number | null
          area_m2?: number | null
          lat?: number | null
          lon?: number | null
          geom_json?: Json | null
        }
        Update: {
          id?: string
          comune_code?: string
          comune_name?: string
          comune_slug?: string
          region_slug?: string
          prob_solar?: number | null
          rank_global?: number | null
          rank_in_comune?: number | null
          power_line?: number | null
          power_minor_line?: number | null
          power_pole?: number | null
          power_tower?: number | null
          power_substation?: number | null
          power_transformer?: number | null
          highway_motorway?: number | null
          highway_trunk?: number | null
          highway_primary?: number | null
          highway_secondary?: number | null
          highway_tertiary?: number | null
          railway_rail?: number | null
          railway_station?: number | null
          landuse_residential?: number | null
          landuse_commercial?: number | null
          landuse_industrial?: number | null
          landuse_retail?: number | null
          landuse_military?: number | null
          landuse_reservoir?: number | null
          landuse_brownfield?: number | null
          landuse_landfill?: number | null
          landuse_quarry?: number | null
          landuse_railway?: number | null
          natural_wood?: number | null
          natural_wetland?: number | null
          natural_water?: number | null
          natural_cliff?: number | null
          natural_peak?: number | null
          natural_ridge?: number | null
          waterway_river?: number | null
          waterway_stream?: number | null
          waterway_canal?: number | null
          waterway_dam?: number | null
          building_residential?: number | null
          building_commercial?: number | null
          building_industrial?: number | null
          building_school?: number | null
          building_hospital?: number | null
          building_university?: number | null
          amenity_hospital?: number | null
          amenity_school?: number | null
          amenity_university?: number | null
          aeroway_aerodrome?: number | null
          aeroway_heliport?: number | null
          leisure_nature_reserve?: number | null
          leisure_park?: number | null
          military_base?: number | null
          military_airfield?: number | null
          military_danger_area?: number | null
          military_training_area?: number | null
          tourism_attraction?: number | null
          tourism_museum?: number | null
          tourism_zoo?: number | null
          area_ha?: number | null
          area_m2?: number | null
          lat?: number | null
          lon?: number | null
          geom_json?: Json | null
        }
        Relationships: []
      }
      mart_us_hex_heatmap: {
        Row: {
          id: number
          point_count: number
          avg_prob_solar: number | null
          avg_price_per_acre: number | null
          geom_json: Json | null
        }
        Insert: {
          id?: number
          point_count: number
          avg_prob_solar?: number | null
          avg_price_per_acre?: number | null
          geom_json?: Json | null
        }
        Update: {
          id?: number
          point_count?: number
          avg_prob_solar?: number | null
          avg_price_per_acre?: number | null
          geom_json?: Json | null
        }
        Relationships: []
      }
      mart_it_hex_heatmap: {
        Row: {
          id: number
          point_count: number
          avg_prob_solar: number | null
          geom_json: Json | null
        }
        Insert: {
          id?: number
          point_count: number
          avg_prob_solar?: number | null
          geom_json?: Json | null
        }
        Update: {
          id?: number
          point_count?: number
          avg_prob_solar?: number | null
          geom_json?: Json | null
        }
        Relationships: []
      }
      mart_us_seo_pages: {
        Row: {
          path: string
          area_name: string
          page_title: string
          meta_description: string
          listing_count: number
          avg_prob_solar: number | null
          state_code: string | null
          county_slug: string | null
          county_name: string | null
        }
        Insert: {
          path: string
          area_name: string
          page_title: string
          meta_description: string
          listing_count: number
          avg_prob_solar?: number | null
          state_code?: string | null
          county_slug?: string | null
          county_name?: string | null
        }
        Update: {
          path?: string
          area_name?: string
          page_title?: string
          meta_description?: string
          listing_count?: number
          avg_prob_solar?: number | null
          state_code?: string | null
          county_slug?: string | null
          county_name?: string | null
        }
        Relationships: []
      }
      mart_it_seo_pages: {
        Row: {
          path: string
          area_name: string
          page_title: string
          meta_description: string
          listing_count: number
          avg_prob_solar: number | null
          region_slug: string | null
          region_name: string | null
          comune_slug: string | null
          comune_name: string | null
        }
        Insert: {
          path: string
          area_name: string
          page_title: string
          meta_description: string
          listing_count: number
          avg_prob_solar?: number | null
          region_slug?: string | null
          region_name?: string | null
          comune_slug?: string | null
          comune_name?: string | null
        }
        Update: {
          path?: string
          area_name?: string
          page_title?: string
          meta_description?: string
          listing_count?: number
          avg_prob_solar?: number | null
          region_slug?: string | null
          region_name?: string | null
          comune_slug?: string | null
          comune_name?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
