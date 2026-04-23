// Canonical list of the 53 OSM distance columns produced by feat_*_osm_dist.
// Mirrors pipelines/dbt/macros/all_distance_tag_columns.sql — keep in sync.

export const OSM_DISTANCE_KEYS = [
  "power_line", "power_minor_line", "power_pole", "power_tower",
  "power_substation", "power_transformer",
  "highway_motorway", "highway_trunk", "highway_primary",
  "highway_secondary", "highway_tertiary",
  "railway_rail", "railway_station",
  "landuse_residential", "landuse_commercial", "landuse_industrial",
  "landuse_retail", "landuse_military", "landuse_reservoir",
  "landuse_brownfield", "landuse_landfill", "landuse_quarry",
  "landuse_railway",
  "natural_wood", "natural_wetland", "natural_water",
  "natural_cliff", "natural_peak", "natural_ridge",
  "waterway_river", "waterway_stream", "waterway_canal", "waterway_dam",
  "building_residential", "building_commercial", "building_industrial",
  "building_school", "building_hospital", "building_university",
  "amenity_hospital", "amenity_school", "amenity_university",
  "aeroway_aerodrome", "aeroway_heliport",
  "leisure_nature_reserve", "leisure_park",
  "military_base", "military_airfield", "military_danger_area",
  "military_training_area",
  "tourism_attraction", "tourism_museum", "tourism_zoo",
] as const;

export type OsmDistanceKey = (typeof OSM_DISTANCE_KEYS)[number];
export type OsmDistanceFields = Record<OsmDistanceKey, number | null>;

// Display groups for the Proximity section on ListingDetail.
export const OSM_DISTANCE_GROUPS: ReadonlyArray<{
  label: string;
  fields: ReadonlyArray<readonly [OsmDistanceKey, string]>;
}> = [
  {
    label: "Power grid",
    fields: [
      ["power_line", "Transmission line"],
      ["power_minor_line", "Minor power line"],
      ["power_pole", "Power pole"],
      ["power_tower", "Pylon / tower"],
      ["power_substation", "Substation"],
      ["power_transformer", "Transformer"],
    ],
  },
  {
    label: "Roads",
    fields: [
      ["highway_motorway", "Motorway"],
      ["highway_trunk", "Trunk road"],
      ["highway_primary", "Primary road"],
      ["highway_secondary", "Secondary road"],
      ["highway_tertiary", "Tertiary road"],
    ],
  },
  {
    label: "Railways",
    fields: [
      ["railway_rail", "Rail line"],
      ["railway_station", "Railway station"],
    ],
  },
  {
    label: "Land use",
    fields: [
      ["landuse_residential", "Residential"],
      ["landuse_commercial", "Commercial"],
      ["landuse_industrial", "Industrial"],
      ["landuse_retail", "Retail"],
      ["landuse_military", "Military"],
      ["landuse_reservoir", "Reservoir"],
      ["landuse_brownfield", "Brownfield"],
      ["landuse_landfill", "Landfill"],
      ["landuse_quarry", "Quarry"],
      ["landuse_railway", "Railway land"],
    ],
  },
  {
    label: "Natural",
    fields: [
      ["natural_wood", "Woodland"],
      ["natural_wetland", "Wetland"],
      ["natural_water", "Water body"],
      ["natural_cliff", "Cliff"],
      ["natural_peak", "Peak"],
      ["natural_ridge", "Ridge"],
    ],
  },
  {
    label: "Waterways",
    fields: [
      ["waterway_river", "River"],
      ["waterway_stream", "Stream"],
      ["waterway_canal", "Canal"],
      ["waterway_dam", "Dam"],
    ],
  },
  {
    label: "Buildings",
    fields: [
      ["building_residential", "Residential building"],
      ["building_commercial", "Commercial building"],
      ["building_industrial", "Industrial building"],
      ["building_school", "School building"],
      ["building_hospital", "Hospital building"],
      ["building_university", "University building"],
    ],
  },
  {
    label: "Amenities",
    fields: [
      ["amenity_hospital", "Hospital"],
      ["amenity_school", "School"],
      ["amenity_university", "University"],
    ],
  },
  {
    label: "Aviation",
    fields: [
      ["aeroway_aerodrome", "Aerodrome"],
      ["aeroway_heliport", "Heliport"],
    ],
  },
  {
    label: "Recreation",
    fields: [
      ["leisure_nature_reserve", "Nature reserve"],
      ["leisure_park", "Park"],
    ],
  },
  {
    label: "Military",
    fields: [
      ["military_base", "Military base"],
      ["military_airfield", "Military airfield"],
      ["military_danger_area", "Danger area"],
      ["military_training_area", "Training area"],
    ],
  },
  {
    label: "Tourism",
    fields: [
      ["tourism_attraction", "Attraction"],
      ["tourism_museum", "Museum"],
      ["tourism_zoo", "Zoo"],
    ],
  },
];
