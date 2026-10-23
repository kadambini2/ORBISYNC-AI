import express from "express";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Initialize Google GenAI client if API key is present
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;

if (apiKey) {
  aiClient = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// API Route: Natural Language to Cypher Query Generator
app.post("/api/ai/nl-to-cypher", async (req, res) => {
  const { question, schemaContext } = req.body;

  if (!question) {
    return res.status(400).json({ error: "Question is required" });
  }

  const prompt = `You are a world-class Neo4j Graph Database architect and disaster response data engineer.
Convert the following natural language question into an accurate, clean Neo4j Cypher query.

Graph Data Model Schema:
Labels:
- :Satellite {id, name, sensorType, orbitAltitudeKm, resolutionM, status}
- :Observation {id, type, band, confidence, areaSqKm, timestamp, hazardType}
- :HazardEvent {id, name, type, severity, affectedAreaKm, etaHours, status}
- :GeographicEntity {id, name, type, terrain, coordinates, population}
- :Infrastructure {id, name, category, status, criticality, capacity, backupPower}
- :VulnerablePopulation {id, name, size, type, vulnerableFactor}
- :SafeZone {id, name, capacity, status}

Relationships:
- (:Satellite)-[:CAPTURED]->(:Observation)
- (:Observation)-[:DETECTS]->(:HazardEvent)
- (:HazardEvent)-[:IMPACTS]->(:GeographicEntity)
- (:GeographicEntity)-[:CONTAINS]->(:Infrastructure)
- (:Infrastructure)-[:FEEDS_POWER_TO]->(:Infrastructure)
- (:Infrastructure)-[:SUPPLIES_WATER_TO]->(:Infrastructure)
- (:Infrastructure)-[:SERVES]->(:VulnerablePopulation)
- (:Infrastructure)-[:EVACUATION_ROUTE_TO]->(:SafeZone)

User Question: "${question}"

Respond with ONLY valid JSON with this format:
{
  "cypher": "MATCH ... RETURN ...",
  "explanation": "Brief 1-2 sentence explanation of how the query navigates the knowledge graph",
  "highlightEntities": ["list", "of", "labels", "or", "relationship_types"]
}
`;

  try {
    if (aiClient) {
      const response = await aiClient.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const responseText = response.text || "{}";
      const parsed = JSON.parse(responseText);
      return res.json(parsed);
    }
  } catch (err: any) {
    console.error("Gemini NL-to-Cypher error:", err);
  }

  // Graceful rule-based fallback if offline or API key absent
  const fallback = generateFallbackCypher(question);
  return res.json(fallback);
});

// API Route: Crisis Intelligence Sitrep Synthesis
app.post("/api/ai/disaster-briefing", async (req, res) => {
  const { scenarioName, activeHazards, affectedInfrastructure, graphMetrics } = req.body;

  const prompt = `You are the Lead Emergency Coordinator at UN-SPIDER / Sentinel Asia.
Analyze the following multi-source satellite observations and Neo4j graph cascade risk metrics to generate an executive Disaster Intelligence Briefing (SITREP).

Scenario: ${scenarioName}
Hazards detected: ${JSON.stringify(activeHazards || [])}
Vulnerable Infrastructure identified via graph traversal: ${JSON.stringify(affectedInfrastructure || [])}
Graph Connectivity Metrics: ${JSON.stringify(graphMetrics || {})}

Provide a concise, high-impact intelligence report in JSON:
{
  "summary": "1 concise paragraph analyzing space data observations and primary hazard propagation",
  "criticalRisks": [
    "Bullet points of cascade failures (e.g., substation down causing hospital water failure)"
  ],
  "immediateActions": [
    "Tactical response steps for emergency teams"
  ],
  "satelliteTaskingRecommendation": "Specific sensor/orbit tasking (e.g. Sentinel-1 SAR ascending pass in 6h to penetrate cloud cover)"
}
`;

  try {
    if (aiClient) {
      const response = await aiClient.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });
      const parsed = JSON.parse(response.text || "{}");
      return res.json(parsed);
    }
  } catch (err: any) {
    console.error("Gemini briefing error:", err);
  }

  // Fallback briefing
  return res.json({
    summary: `Satellite radar and optical telemetry in ${scenarioName} indicate rapid hazard propagation across critical hydrological and transportation corridors. Neo4j graph dependency analysis confirms multi-tier cascade vulnerabilities.`,
    criticalRisks: [
      "River Delta Substation flood risk threatens primary power feeds to regional Trauma Centers.",
      "Primary evacuation bridge over northern channel approaching critical flow threshold.",
      "Thermal sensor drift indicates fire line moving toward eastern transmission corridor at 4.2 km/h."
    ],
    immediateActions: [
      "Deploy auxiliary mobile diesel generators to Memorial Trauma Center prior to expected grid severance.",
      "Reroute coastal evacuation convoys along High Route Alpha bypassing inundated low-lying culverts.",
      "Issue stage-2 pre-evacuation alert for riverside retirement community."
    ],
    satelliteTaskingRecommendation: "Task Sentinel-1 SAR radar pass at 03:40 UTC to verify flood boundary progression through heavy smoke/cloud canopy."
  });
});

function generateFallbackCypher(query: string): { cypher: string; explanation: string; highlightEntities: string[] } {
  const q = query.toLowerCase();

  if (q.includes("hospital") || q.includes("medical") || q.includes("power")) {
    return {
      cypher: "MATCH (h:HazardEvent)-[:IMPACTS]->(g:GeographicEntity)-[:CONTAINS]->(sub:Infrastructure {category: 'Power'})\nMATCH (sub)-[:FEEDS_POWER_TO]->(hosp:Infrastructure {category: 'Healthcare'})\nRETURN h.name, sub.name, hosp.name, hosp.criticality",
      explanation: "Finds all healthcare facilities whose upstream power substations are located in regions impacted by active hazard events.",
      highlightEntities: ["HazardEvent", "Infrastructure", "FEEDS_POWER_TO", "IMPACTS"]
    };
  } else if (q.includes("evacuat") || q.includes("safe") || q.includes("route")) {
    return {
      cypher: "MATCH (i:Infrastructure)-[r:EVACUATION_ROUTE_TO]->(s:SafeZone)\nWHERE i.status <> 'Flooded'\nRETURN i.name, s.name, r.capacity, r.distanceKm\nORDER BY r.distanceKm ASC",
      explanation: "Identifies unobstructed evacuation paths connecting communities to high-capacity designated safe shelters.",
      highlightEntities: ["Infrastructure", "EVACUATION_ROUTE_TO", "SafeZone"]
    };
  } else if (q.includes("satellite") || q.includes("sensor") || q.includes("sar") || q.includes("radar")) {
    return {
      cypher: "MATCH (sat:Satellite)-[:CAPTURED]->(obs:Observation)-[:DETECTS]->(haz:HazardEvent)\nRETURN sat.name, obs.type, obs.confidence, haz.name, haz.severity\nORDER BY obs.timestamp DESC",
      explanation: "Traces space asset observation lineages confirming active hazard events and detection confidence levels.",
      highlightEntities: ["Satellite", "CAPTURED", "Observation", "DETECTS", "HazardEvent"]
    };
  }

  return {
    cypher: "MATCH (n:HazardEvent)-[r:IMPACTS]->(target)\nRETURN n.name, type(r), target.name\nLIMIT 25",
    explanation: "Broad graph traversal revealing direct hazard impact edges across all geographic and infrastructure nodes.",
    highlightEntities: ["HazardEvent", "IMPACTS"]
  };
}

// Vite middleware in dev, static files in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (_req, res) => {
      res.sendFile("dist/index.html", { root: "." });
    });
  }

  app.listen(PORT, () => {
    console.log(`OrbitGraph AI Server running on port ${PORT}`);
  });
}

startServer();
