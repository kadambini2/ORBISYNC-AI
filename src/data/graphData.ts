export interface GraphNode {
  id: string;
  label: "Satellite" | "Observation" | "HazardEvent" | "GeographicEntity" | "Infrastructure" | "VulnerablePopulation" | "SafeZone";
  name: string;
  properties: Record<string, any>;
  timeStep?: number; // 0 = Baseline, 1 = Overpass, 2 = Hazard Detected, 3 = Threatening Infrastructure, 4 = Peak Cascade
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
  vx?: number;
  vy?: number;
}

export interface GraphRelationship {
  id: string;
  source: string;
  target: string;
  type: "CAPTURED" | "DETECTS" | "IMPACTS" | "CONTAINS" | "FEEDS_POWER_TO" | "SUPPLIES_WATER_TO" | "SERVES" | "EVACUATION_ROUTE_TO";
  properties: Record<string, any>;
  timeStep?: number;
}

export interface TimelineStep {
  step: number;
  label: string;
  utcTime: string;
  eventDescription: string;
  satelliteAction: string;
}

export const TIMELINE_STEPS: TimelineStep[] = [
  {
    step: 0,
    label: "T-18h",
    utcTime: "00:00 UTC",
    eventDescription: "Pre-disaster orbital baseline. Municipal utilities nominal.",
    satelliteAction: "LEO Constellations in routine orbital sweep",
  },
  {
    step: 1,
    label: "T-12h",
    utcTime: "04:30 UTC",
    eventDescription: "First satellite radar overpass. Anomaly detected in swath.",
    satelliteAction: "Sentinel-1C SAR synthetic aperture pass completes",
  },
  {
    step: 2,
    label: "T-6h",
    utcTime: "08:00 UTC",
    eventDescription: "Knowledge Graph connects multi-spectral observation to active Hazard Event.",
    satelliteAction: "Optical NDWI & SAR Coherence loss verified by AI",
  },
  {
    step: 3,
    label: "T-3h",
    utcTime: "11:30 UTC",
    eventDescription: "Hazard surges into geographic perimeter. Critical utility berm threatened.",
    satelliteAction: "Tasked high-cadence PlanetScope follow-up pass",
  },
  {
    step: 4,
    label: "T-0h Live",
    utcTime: "14:00 UTC",
    eventDescription: "Peak hazard inundation. Cascading power loss to trauma hospitals.",
    satelliteAction: "Full tactical sitrep telemetry active",
  },
];

export interface DisasterScenario {
  id: string;
  name: string;
  type: "Flood" | "Wildfire" | "Typhoon";
  location: string;
  coordinates: string;
  description: string;
  imageryUrl: string;
  satelliteCovered: string;
  nodes: GraphNode[];
  relationships: GraphRelationship[];
  stats: {
    totalAreaSqKm: number;
    popAtRisk: number;
    infraAtRisk: number;
    satelliteConfidence: string;
  };
}

// Scenario 1: River Delta & Industrial Zone Catastrophic Flood (SAR Coherence Loss)
const deltaFloodNodes: GraphNode[] = [
  // Satellites (Baseline Orbit T-18h)
  {
    id: "sat-s1c",
    label: "Satellite",
    name: "Sentinel-1C SAR",
    timeStep: 0,
    properties: {
      sensor: "C-Band Synthetic Aperture Radar",
      orbit: "Sun-synchronous, 693 km",
      resolution: "10m Stripmap",
      revisitHours: 12,
      cloudPenetration: "100% All-Weather",
      status: "Active Tracking"
    }
  },
  {
    id: "sat-s2b",
    label: "Satellite",
    name: "Sentinel-2B Optical",
    timeStep: 0,
    properties: {
      sensor: "Multispectral MSI (13 bands)",
      orbit: "Polar LEO, 786 km",
      resolution: "10m RGB/NIR",
      cloudCoverPct: 42,
      status: "Degraded by Heavy Cloud"
    }
  },
  {
    id: "sat-planet",
    label: "Satellite",
    name: "PlanetScope Constellation",
    timeStep: 0,
    properties: {
      sensor: "High-cadence PlanetScope 3U",
      orbit: "SSO 475 km",
      resolution: "3.7m Optical",
      status: "On-demand Tasked"
    }
  },

  // Observations (Overpass T-12h)
  {
    id: "obs-sar-flood",
    label: "Observation",
    name: "SAR Delta Coherence Depletion Swath",
    timeStep: 1,
    properties: {
      band: "Interferometric VV/VH",
      confidence: 0.94,
      waterExtentSqKm: 142.6,
      deltaCoherence: "-8.4 dB",
      detectionTime: "06:14 UTC"
    }
  },
  {
    id: "obs-opt-ndwi",
    label: "Observation",
    name: "MSI Normalized Difference Water Index",
    timeStep: 1,
    properties: {
      band: "B03 (Green) / B08 (NIR)",
      confidence: 0.81,
      surfaceTurbidity: "High Suspended Sediment",
      detectionTime: "05:48 UTC"
    }
  },

  // Hazard Event (Detection T-6h)
  {
    id: "haz-flood-delta",
    label: "HazardEvent",
    name: "Catastrophic Delta Inundation Surge",
    timeStep: 2,
    properties: {
      type: "Compound Riverine/Tidal Surge",
      severity: "Level 4 - Extreme",
      rateOfRiseCmHr: 18.5,
      etaPeakHours: 3.5,
      status: "Active Rapid Surge"
    }
  },

  // Geographic Entities (Static Ground Truth T-18h)
  {
    id: "geo-delta-basin",
    label: "GeographicEntity",
    name: "Lower River Delta & Estuary",
    timeStep: 0,
    properties: {
      terrain: "Alluvial Lowland (0-4m ASL)",
      coordinates: "16°45'N, 96°12'E",
      population: 320000,
      soilSaturation: "98.2%"
    }
  },
  {
    id: "geo-industrial-hub",
    label: "GeographicEntity",
    name: "North Channel Industrial Sector",
    timeStep: 0,
    properties: {
      terrain: "Reclaimed Estuary Lowland",
      coordinates: "16°48'N, 96°15'E",
      population: 48000,
      hazardousChemicalSites: 6
    }
  },

  // Infrastructure Nodes (Threatened at T-3h & Cascaded at T-0h)
  {
    id: "inf-sub-delta",
    label: "Infrastructure",
    name: "Estuary Primary Substation Beta",
    timeStep: 3,
    properties: {
      category: "Power",
      criticality: "Tier-1 Critical",
      capacityMva: 240,
      floodBarrierHeightM: 1.8,
      currentWaterLevelM: 1.65,
      status: "Imminent Breach (<45m)",
      backupPower: false
    }
  },
  {
    id: "inf-hosp-regional",
    label: "Infrastructure",
    name: "St. Jude Trauma & Regional Medical Center",
    timeStep: 4,
    properties: {
      category: "Healthcare",
      criticality: "Tier-1 Critical",
      bedCapacity: 650,
      icuPatients: 42,
      backupFuelHours: 14,
      status: "Operational on Grid",
      dependentOn: "Estuary Primary Substation Beta"
    }
  },
  {
    id: "inf-water-plant",
    label: "Infrastructure",
    name: "Delta Aqueduct Clean Water Filtration Plant",
    timeStep: 4,
    properties: {
      category: "Water Utility",
      criticality: "Tier-1 Critical",
      supplyRateMld: 180,
      pumpingPurityStatus: "Nominal",
      status: "Operational on Grid",
      dependentOn: "Estuary Primary Substation Beta"
    }
  },
  {
    id: "inf-bridge-north",
    label: "Infrastructure",
    name: "North Delta Causeway Bridge",
    timeStep: 3,
    properties: {
      category: "Transportation",
      criticality: "Evacuation Lifeline",
      structuralClearanceM: 0.4,
      flowRateCubicMPerSec: 4200,
      status: "At Risk of Overtopping",
      trafficFlow: "One-Way Evac (High Congestion)"
    }
  },
  {
    id: "inf-port-terminal",
    label: "Infrastructure",
    name: "Delta Deepwater Chemical Freight Port",
    timeStep: 3,
    properties: {
      category: "Industrial Port",
      criticality: "Hazmat Hazard",
      status: "Partially Inundated",
      hazmatContainment: "Vulnerable to Tank Leaks"
    }
  },

  // Vulnerable Populations
  {
    id: "pop-elderly-home",
    label: "VulnerablePopulation",
    name: "Riverside Convalescent Care Home",
    timeStep: 4,
    properties: {
      size: 320,
      type: "Elderly & Non-ambulatory",
      mobilityAssistanceRequired: "100%",
      currentEvacuationProgress: "18%"
    }
  },
  {
    id: "pop-settlement-east",
    label: "VulnerablePopulation",
    name: "East Riverfront Informal Community",
    timeStep: 2,
    properties: {
      size: 14500,
      type: "High-density Low Elevation",
      pavedRoadAccess: "Very Limited"
    }
  },

  // Safe Zones
  {
    id: "safe-highland-arena",
    label: "SafeZone",
    name: "Highland Sports Complex & Relief Hub",
    timeStep: 0,
    properties: {
      elevationM: 38,
      capacity: 25000,
      currentOccupancy: 4200,
      medicalTriage: true,
      helipad: true,
      status: "Fully Operational"
    }
  },
  {
    id: "safe-university-campus",
    label: "SafeZone",
    name: "Northern Polytech Campus Safe Center",
    timeStep: 0,
    properties: {
      elevationM: 42,
      capacity: 18000,
      currentOccupancy: 3100,
      foodSupplyDays: 8,
      status: "Fully Operational"
    }
  }
];

const deltaFloodRelationships: GraphRelationship[] = [
  { id: "r1", source: "sat-s1c", target: "obs-sar-flood", type: "CAPTURED", timeStep: 1, properties: { latencyMinutes: 8, swathKm: 250 } },
  { id: "r2", source: "sat-s2b", target: "obs-opt-ndwi", type: "CAPTURED", timeStep: 1, properties: { latencyMinutes: 15, band: "Green/NIR" } },
  { id: "r3", source: "obs-sar-flood", target: "haz-flood-delta", type: "DETECTS", timeStep: 2, properties: { confidence: 0.94, method: "SAR Speckle Coherence Diff" } },
  { id: "r4", source: "obs-opt-ndwi", target: "haz-flood-delta", type: "DETECTS", timeStep: 2, properties: { confidence: 0.81, method: "Multispectral Thresholding" } },
  { id: "r5", source: "haz-flood-delta", target: "geo-delta-basin", type: "IMPACTS", timeStep: 2, properties: { depthM: 2.4, coveragePct: 78 } },
  { id: "r6", source: "haz-flood-delta", target: "geo-industrial-hub", type: "IMPACTS", timeStep: 2, properties: { depthM: 1.6, toxicDispersionRisk: "High" } },
  { id: "r7", source: "geo-delta-basin", target: "inf-sub-delta", type: "CONTAINS", timeStep: 0, properties: { distanceToWaterM: 45 } },
  { id: "r8", source: "geo-delta-basin", target: "inf-bridge-north", type: "CONTAINS", timeStep: 0, properties: { spansWaterway: true } },
  { id: "r9", source: "geo-delta-basin", target: "pop-settlement-east", type: "CONTAINS", timeStep: 0, properties: { floodZoneRisk: "Immediate" } },
  { id: "r10", source: "geo-industrial-hub", target: "inf-port-terminal", type: "CONTAINS", timeStep: 0, properties: { shorelinePier: true } },
  { id: "r11", source: "inf-sub-delta", target: "inf-hosp-regional", type: "FEEDS_POWER_TO", timeStep: 4, properties: { feederLine: "132kV Line A", singlePointOfFailure: true } },
  { id: "r12", source: "inf-sub-delta", target: "inf-water-plant", type: "FEEDS_POWER_TO", timeStep: 4, properties: { feederLine: "33kV Industrial", singlePointOfFailure: true } },
  { id: "r13", source: "inf-water-plant", target: "inf-hosp-regional", type: "SUPPLIES_WATER_TO", timeStep: 4, properties: { pipelinePressurePsi: 65, sterilizerDependency: true } },
  { id: "r14", source: "inf-hosp-regional", target: "pop-elderly-home", type: "SERVES", timeStep: 4, properties: { emergencyResponseMinutes: 8 } },
  { id: "r15", source: "inf-bridge-north", target: "safe-highland-arena", type: "EVACUATION_ROUTE_TO", timeStep: 3, properties: { distanceKm: 8.4, estimatedTravelMins: 45, clearanceStatus: "Critical" } },
  { id: "r16", source: "pop-settlement-east", target: "safe-university-campus", type: "EVACUATION_ROUTE_TO", timeStep: 3, properties: { distanceKm: 6.2, estimatedTravelMins: 35, clearanceStatus: "Open" } }
];

// Scenario 2: Mountain Ridge Wildfire Front & Transmission Grid (Thermal Radiance VIIRS/Landsat)
const wildfireNodes: GraphNode[] = [
  {
    id: "sat-landsat9",
    label: "Satellite",
    name: "Landsat-9 TIRS-2",
    timeStep: 0,
    properties: {
      sensor: "Thermal Infrared Sensor (TIRS-2)",
      resolution: "100m Thermal / 30m Optical",
      band: "Band 10 (10.60 - 11.19 µm)",
      orbit: "705 km Polar",
      status: "Active Scanning"
    }
  },
  {
    id: "sat-viirs",
    label: "Satellite",
    name: "Suomi NPP / VIIRS",
    timeStep: 0,
    properties: {
      sensor: "Visible Infrared Imaging Radiometer",
      resolution: "375m Active Fire",
      radianceDetection: "I-Band 3.74 µm",
      status: "Rapid Hotspot Refresh"
    }
  },
  {
    id: "obs-fire-perimeter",
    label: "Observation",
    name: "Thermal Hotspot Radiance Perimeter",
    timeStep: 1,
    properties: {
      fireRadiativePowerMw: 1420,
      activeAreaHectares: 45000,
      smokePlumeDirection: "Eastward (285° Azimuth)",
      spreadSpeedKmH: 4.2,
      confidence: 0.97
    }
  },
  {
    id: "haz-wildfire-ridge",
    label: "HazardEvent",
    name: "Blackwood Ridge Extreme Conflagration",
    timeStep: 2,
    properties: {
      type: "Crown Wildfire with Extreme Spotting",
      severity: "Level 5 - Catastrophic",
      fuelDrynessIndex: "Extreme (99th percentile)",
      windSpeedKmh: 58,
      status: "Rapid Uncontained Spread"
    }
  },
  {
    id: "geo-pine-valley",
    label: "GeographicEntity",
    name: "Pine Valley Timber Watershed",
    timeStep: 0,
    properties: {
      terrain: "Steep Canyon Slopes (28-45°)",
      elevationM: "850 - 2100m",
      coordinates: "39°42'N, 121°36'W",
      canopyFuelDensityKgM3: 0.28
    }
  },
  {
    id: "inf-grid-transmission",
    label: "Infrastructure",
    name: "High-Voltage Corridor 500kV Path 66",
    timeStep: 3,
    properties: {
      category: "Power Grid Backbone",
      criticality: "State Intertie Grid",
      flameDistanceM: 420,
      conductorTempC: 84,
      status: "Emergency Arc Trip Risk",
      servesCustomers: 850000
    }
  },
  {
    id: "inf-highway-pass",
    label: "Infrastructure",
    name: "Interstate 80 Mountain Pass Corridor",
    timeStep: 3,
    properties: {
      category: "Transportation",
      criticality: "Primary Mountain Evacuation Arterial",
      smokeVisibilityM: 35,
      status: "Impaired Visibility",
      bottleneckLanes: 2
    }
  },
  {
    id: "inf-comms-tower",
    label: "Infrastructure",
    name: "Ridge Peak Emergency Repeater Mast",
    timeStep: 4,
    properties: {
      category: "Communications",
      criticality: "First Responder Radio Mesh",
      batteryBackupHours: 8,
      status: "Surrounded by Spot Fires"
    }
  },
  {
    id: "pop-timber-town",
    label: "VulnerablePopulation",
    name: "Pine Valley Mountain Township",
    timeStep: 3,
    properties: {
      size: 6800,
      type: "Wildland-Urban Interface (WUI)",
      evacuationNotice: "Mandatory Immediate",
      structureIgnitionRisk: "Very High"
    }
  },
  {
    id: "safe-valley-fairgrounds",
    label: "SafeZone",
    name: "Foothill Valley Regional Fairgrounds",
    timeStep: 0,
    properties: {
      capacity: 12000,
      distanceFromFireKm: 28,
      airQualityIndex: "Moderate (HEPA Sheltered)",
      status: "Accepting Evacuees"
    }
  }
];

const wildfireRelationships: GraphRelationship[] = [
  { id: "wr1", source: "sat-landsat9", target: "obs-fire-perimeter", type: "CAPTURED", timeStep: 1, properties: { calibration: "Kelvin Ground Temp" } },
  { id: "wr2", source: "sat-viirs", target: "obs-fire-perimeter", type: "CAPTURED", timeStep: 1, properties: { scanRate: "Every 12h" } },
  { id: "wr3", source: "obs-fire-perimeter", target: "haz-wildfire-ridge", type: "DETECTS", timeStep: 2, properties: { confidence: 0.97 } },
  { id: "wr4", source: "haz-wildfire-ridge", target: "geo-pine-valley", type: "IMPACTS", timeStep: 2, properties: { activeFrontKm: 18.2 } },
  { id: "wr5", source: "geo-pine-valley", target: "inf-grid-transmission", type: "CONTAINS", timeStep: 0, properties: { spanKm: 34 } },
  { id: "wr6", source: "geo-pine-valley", target: "inf-highway-pass", type: "CONTAINS", timeStep: 0, properties: { smokeInversion: true } },
  { id: "wr7", source: "geo-pine-valley", target: "inf-comms-tower", type: "CONTAINS", timeStep: 0, properties: { ridgeAltitudeM: 1950 } },
  { id: "wr8", source: "geo-pine-valley", target: "pop-timber-town", type: "CONTAINS", timeStep: 0, properties: { oneWayExitRoute: true } },
  { id: "wr9", source: "inf-grid-transmission", target: "inf-comms-tower", type: "FEEDS_POWER_TO", timeStep: 4, properties: { auxiliaryFeed: false } },
  { id: "wr10", source: "inf-highway-pass", target: "safe-valley-fairgrounds", type: "EVACUATION_ROUTE_TO", timeStep: 3, properties: { distanceKm: 28, travelMins: 75 } }
];

export const DISASTER_SCENARIOS: DisasterScenario[] = [
  {
    id: "scenario-delta-flood",
    name: "River Delta Flash Flood & Industrial Cascade",
    type: "Flood",
    location: "Ayeyarwady Delta & Coastal District",
    coordinates: "16°45'N, 96°12'E",
    description: "Sentinel-1 SAR interferometric coherence loss and Sentinel-2 NDWI indicate sudden monsoon storm surge breaching coastal levees. Primary substation beta flooding directly jeopardizes regional trauma hospital and clean water pumping supplies.",
    imageryUrl: "/src/assets/images/orbitgraph_sar_flood_radar_1792728326921.jpg",
    satelliteCovered: "Sentinel-1C SAR + Sentinel-2B Optical",
    nodes: deltaFloodNodes,
    relationships: deltaFloodRelationships,
    stats: {
      totalAreaSqKm: 142.6,
      popAtRisk: 368000,
      infraAtRisk: 5,
      satelliteConfidence: "94.2%"
    }
  },
  {
    id: "scenario-wildfire-ridge",
    name: "Mountain Ridge Conflagration & Grid Trip",
    type: "Wildfire",
    location: "Blackwood Ridge & Pine Valley Corridor",
    coordinates: "39°42'N, 121°36'W",
    description: "Landsat-9 TIRS and VIIRS thermal radiance show rapid fire perimeter expansion at 4.2 km/h propelled by 58 km/h gusts. Imminent flame contact with 500kV Path 66 transmission backbone risks regional blackout and cuts mountain pass evacuation visibility.",
    imageryUrl: "/src/assets/images/orbitgraph_wildfire_thermal_1792728326398.jpg",
    satelliteCovered: "Landsat-9 TIRS-2 + Suomi VIIRS",
    nodes: wildfireNodes,
    relationships: wildfireRelationships,
    stats: {
      totalAreaSqKm: 450.0,
      popAtRisk: 6800,
      infraAtRisk: 3,
      satelliteConfidence: "97.0%"
    }
  }
];

export const PRESET_CYPHER_QUERIES = [
  {
    id: "query-cascade-power",
    title: "1. Cascade Power Failure Traversal",
    description: "Trace 2-hop graph paths where flooded substations cut power to critical healthcare & life-support facilities.",
    cypher: `MATCH path = (h:HazardEvent)-[:IMPACTS]->(g:GeographicEntity)-[:CONTAINS]->(sub:Infrastructure {category: 'Power'})
MATCH (sub)-[:FEEDS_POWER_TO]->(target:Infrastructure)
RETURN h.name AS Hazard, sub.name AS Substation, target.name AS AffectedFacility, target.criticality AS Priority, target.backupFuelHours AS BackupHours
ORDER BY target.backupFuelHours ASC`,
    expectedHighlights: ["HazardEvent", "Infrastructure", "FEEDS_POWER_TO", "IMPACTS"]
  },
  {
    id: "query-evac-lifeline",
    title: "2. Optimal Evacuation Corridor Path",
    description: "Calculate shortest evacuation routes from high-density populations to designated safe hubs bypassing blocked infrastructure.",
    cypher: `MATCH (pop:VulnerablePopulation)-[:CONTAINS]-(geo:GeographicEntity)
MATCH (inf:Infrastructure)-[r:EVACUATION_ROUTE_TO]->(safe:SafeZone)
WHERE inf.status <> 'Flooded' AND safe.currentOccupancy < safe.capacity
RETURN pop.name AS Community, inf.name AS RouteVia, safe.name AS Destination, r.distanceKm AS DistanceKm, safe.capacity - safe.currentOccupancy AS RemainingSlots
ORDER BY r.distanceKm ASC`,
    expectedHighlights: ["VulnerablePopulation", "Infrastructure", "EVACUATION_ROUTE_TO", "SafeZone"]
  },
  {
    id: "query-sensor-lineage",
    title: "3. Space Observation Lineage & Sensor Grounding",
    description: "Verify satellite sensor provenance, acquisition band, and radar/optical confidence detecting active hazard perimeters.",
    cypher: `MATCH (sat:Satellite)-[:CAPTURED]->(obs:Observation)-[:DETECTS]->(haz:HazardEvent)
RETURN sat.name AS SpaceAsset, sat.sensor AS SensorPayload, obs.band AS BandMode, obs.confidence AS ConfidenceScore, haz.name AS GroundTruthHazard
ORDER BY obs.confidence DESC`,
    expectedHighlights: ["Satellite", "CAPTURED", "Observation", "DETECTS", "HazardEvent"]
  },
  {
    id: "query-vulnerable-density",
    title: "4. Multi-Sector Vulnerable Facility Audit",
    description: "Audit healthcare and elderly care centers with single-point-of-failure utility dependencies in direct flood terrain.",
    cypher: `MATCH (hosp:Infrastructure)-[:SERVES]->(pop:VulnerablePopulation)
MATCH (geo:GeographicEntity)-[:CONTAINS]->(hosp)
RETURN hosp.name AS Hospital, pop.name AS DependentGroup, pop.size AS ResidentsCount, geo.terrain AS SoilCondition
ORDER BY pop.size DESC`,
    expectedHighlights: ["Infrastructure", "SERVES", "VulnerablePopulation", "GeographicEntity"]
  }
];
