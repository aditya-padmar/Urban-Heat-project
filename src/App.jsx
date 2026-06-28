
import { useState, useEffect, useRef, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, LineChart, Line, Legend, RadarChart, PolarGrid,
  PolarAngleAxis, Radar, Cell
} from "recharts";

// ─── Region Configurations ───
const REGION_CONFIGS = [
  {
    id: "mysuru",
    label: "Mysuru",
    state: "Karnataka",
    flag: "🏛️",
    baseTemps: { cbd: 42, industrial: 44, residential: 37, park: 28, water: 22, peri_urban: 32 },
    zones: [
      { type: "industrial", cx: 8, cy: 8, r: 5 },
      { type: "cbd", cx: 18, cy: 10, r: 6 },
      { type: "residential", cx: 10, cy: 20, r: 7 },
      { type: "residential", cx: 22, cy: 22, r: 5 },
      { type: "park", cx: 5, cy: 16, r: 3 },
      { type: "park", cx: 25, cy: 8, r: 2.5 },
      { type: "water", cx: 14, cy: 26, r: 2 },
    ],
    description: "Heritage city with moderate UHI, significant green cover in palace gardens",
  },
  {
    id: "bengaluru",
    label: "Bengaluru",
    state: "Karnataka",
    flag: "🏙️",
    baseTemps: { cbd: 44, industrial: 46, residential: 39, park: 29, water: 23, peri_urban: 34 },
    zones: [
      { type: "cbd", cx: 15, cy: 14, r: 7 },
      { type: "industrial", cx: 5, cy: 6, r: 5 },
      { type: "industrial", cx: 25, cy: 24, r: 4.5 },
      { type: "residential", cx: 8, cy: 22, r: 6 },
      { type: "residential", cx: 24, cy: 8, r: 5 },
      { type: "park", cx: 12, cy: 10, r: 2.5 },
      { type: "park", cx: 20, cy: 20, r: 2 },
      { type: "water", cx: 6, cy: 27, r: 1.8 },
      { type: "water", cx: 27, cy: 15, r: 1.5 },
    ],
    description: "Silicon Valley of India — rapidly urbanising, lakes shrinking, severe UHI",
  },
  {
    id: "mumbai",
    label: "Mumbai",
    state: "Maharashtra",
    flag: "🌊",
    baseTemps: { cbd: 43, industrial: 46, residential: 38, park: 30, water: 25, peri_urban: 35 },
    zones: [
      { type: "cbd", cx: 14, cy: 4, r: 5 },
      { type: "industrial", cx: 6, cy: 12, r: 6 },
      { type: "industrial", cx: 22, cy: 18, r: 5 },
      { type: "residential", cx: 14, cy: 18, r: 8 },
      { type: "water", cx: 2, cy: 15, r: 3 },
      { type: "water", cx: 28, cy: 8, r: 2.5 },
      { type: "water", cx: 15, cy: 28, r: 3 },
      { type: "park", cx: 10, cy: 5, r: 2 },
      { type: "park", cx: 24, cy: 27, r: 2 },
    ],
    description: "Coastal megacity — sea breezes moderate UHI but dense slums drive localised heat",
  },
  {
    id: "delhi",
    label: "Delhi",
    state: "NCT of Delhi",
    flag: "🏛️",
    baseTemps: { cbd: 47, industrial: 50, residential: 42, park: 31, water: 26, peri_urban: 37 },
    zones: [
      { type: "cbd", cx: 14, cy: 12, r: 6 },
      { type: "industrial", cx: 4, cy: 4, r: 5 },
      { type: "industrial", cx: 26, cy: 6, r: 4.5 },
      { type: "industrial", cx: 5, cy: 24, r: 4 },
      { type: "residential", cx: 22, cy: 20, r: 6 },
      { type: "residential", cx: 10, cy: 24, r: 5 },
      { type: "park", cx: 18, cy: 5, r: 2.5 },
      { type: "park", cx: 8, cy: 14, r: 2 },
      { type: "water", cx: 24, cy: 28, r: 1.8 },
    ],
    description: "Capital with extreme continental heat — industrial corridors cause severe UHI peaks",
  },
  {
    id: "chennai",
    label: "Chennai",
    state: "Tamil Nadu",
    flag: "🌴",
    baseTemps: { cbd: 44, industrial: 47, residential: 40, park: 30, water: 24, peri_urban: 35 },
    zones: [
      { type: "cbd", cx: 16, cy: 10, r: 6 },
      { type: "industrial", cx: 6, cy: 20, r: 6 },
      { type: "industrial", cx: 25, cy: 22, r: 4.5 },
      { type: "residential", cx: 24, cy: 10, r: 5 },
      { type: "residential", cx: 10, cy: 26, r: 5 },
      { type: "water", cx: 2, cy: 14, r: 3.5 },
      { type: "water", cx: 28, cy: 16, r: 2.5 },
      { type: "water", cx: 14, cy: 28, r: 2 },
      { type: "park", cx: 20, cy: 25, r: 2.5 },
      { type: "park", cx: 7, cy: 6, r: 2 },
    ],
    description: "Tropical coastal city — humid heat stress, IT corridor expansion driving rapid UHI",
  },
];

// ─── Simulated Geospatial Grid (30x30 pixels representing a city) ───
function generateCityGrid(regionId = "mysuru") {
  const region = REGION_CONFIGS.find(r => r.id === regionId) || REGION_CONFIGS[0];
  const { zones, baseTemps } = region;
  const grid = [];
  const W = 30, H = 30;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let zoneType = "peri_urban";
      let minDist = Infinity;
      zones.forEach(z => {
        const d = Math.sqrt((x - z.cx) ** 2 + (y - z.cy) ** 2);
        if (d < z.r && d < minDist) { minDist = d; zoneType = z.type; }
      });
      const base = baseTemps[zoneType];
      const noise = (Math.sin(x * 0.7 + y * 0.5) * 3 + Math.cos(x * 0.4 - y * 0.8) * 2);
      const lst = base + noise + Math.random() * 2 - 1;
      const ndvi = zoneType === "park" ? 0.55 + Math.random() * 0.2
        : zoneType === "water" ? 0.05
          : zoneType === "cbd" ? 0.08 + Math.random() * 0.1
            : zoneType === "industrial" ? 0.1 + Math.random() * 0.1
              : 0.2 + Math.random() * 0.15;
      const albedo = zoneType === "water" ? 0.06
        : zoneType === "cbd" ? 0.12 + Math.random() * 0.05
          : zoneType === "industrial" ? 0.14
            : zoneType === "park" ? 0.18
              : 0.15 + Math.random() * 0.05;
      const isa = zoneType === "cbd" ? 0.92 : zoneType === "industrial" ? 0.85
        : zoneType === "residential" ? 0.55 : zoneType === "park" ? 0.05
          : zoneType === "water" ? 0 : 0.3;
      const utci = lst - 273 + (1 - ndvi) * 5 - albedo * 10 + isa * 4;
      grid.push({ x, y, lst, ndvi, albedo, isa, utci, zoneType });
    }
  }
  return grid;
}

const BASE_GRID = generateCityGrid("mysuru");

// ─── Intervention simulation ───
function applyIntervention(grid, interventions) {
  return grid.map(cell => {
    let dLST = 0;
    if (interventions.greenRoofs && (cell.zoneType === "cbd" || cell.zoneType === "industrial")) {
      dLST -= 1.8;
    }
    if (interventions.treeCanopy && cell.zoneType === "residential") {
      dLST -= 2.2;
    }
    if (interventions.coolRoofs) {
      if (cell.zoneType === "cbd") dLST -= 2.5;
      if (cell.zoneType === "industrial") dLST -= 1.9;
    }
    if (interventions.waterBodies && cell.zoneType === "peri_urban") {
      dLST -= 1.1;
    }
    if (interventions.permeable) {
      dLST -= cell.isa * 1.5;
    }
    return { ...cell, lst: cell.lst + dLST, utci: cell.utci + dLST, dLST };
  });
}

// ─── Color scales ───
function lstToColor(lst, min = 20, max = 48) {
  const t = Math.max(0, Math.min(1, (lst - min) / (max - min)));
  if (t < 0.25) return `rgb(${Math.round(68 + t * 4 * 120)},${Math.round(130 - t * 4 * 30)},${Math.round(200 - t * 4 * 60)})`;
  if (t < 0.5) {
    const s = (t - 0.25) * 4;
    return `rgb(${Math.round(188 + s * 50)},${Math.round(215 - s * 50)},${Math.round(80 - s * 30)})`;
  }
  if (t < 0.75) {
    const s = (t - 0.5) * 4;
    return `rgb(${Math.round(238 + s * 10)},${Math.round(165 - s * 100)},${Math.round(50 - s * 30)})`;
  }
  const s = (t - 0.75) * 4;
  return `rgb(${Math.round(248)},${Math.round(65 - s * 40)},${Math.round(20 - s * 15)})`;
}

function riskLevel(utci) {
  if (utci < 26) return { label: "No stress", color: "#3B8BD4" };
  if (utci < 32) return { label: "Moderate", color: "#EF9F27" };
  if (utci < 38) return { label: "Strong", color: "#D85A30" };
  if (utci < 44) return { label: "Very strong", color: "#C04828" };
  return { label: "Extreme", color: "#8B1A1A" };
}

// ─── SHAP-like driver data ───
const SHAP_DATA = [
  { driver: "Impervious surface", value: 0.38, color: "#C04828" },
  { driver: "NDVI (vegetation)", value: -0.29, color: "#3B8BD4" },
  { driver: "Albedo", value: -0.22, color: "#1D9E75" },
  { driver: "Building density", value: 0.19, color: "#D85A30" },
  { driver: "Sky view factor", value: 0.14, color: "#BA7517" },
  { driver: "Air temperature", value: 0.12, color: "#993C1D" },
  { driver: "Wind speed", value: -0.09, color: "#185FA5" },
  { driver: "Humidity", value: 0.06, color: "#BA7517" },
];

const SCENARIO_RESULTS = [
  { scenario: "Baseline", avgLST: 36.8, hotspotArea: 31, costIndex: 0 },
  { scenario: "Tree canopy +20%", avgLST: 34.2, hotspotArea: 22, costIndex: 2.1 },
  { scenario: "Cool roofs", avgLST: 33.9, hotspotArea: 19, costIndex: 3.4 },
  { scenario: "Green roofs", avgLST: 34.6, hotspotArea: 24, costIndex: 4.2 },
  { scenario: "Water bodies", avgLST: 35.1, hotspotArea: 27, costIndex: 5.8 },
  { scenario: "Combined optimal", avgLST: 31.4, hotspotArea: 9, costIndex: 6.1 },
];

const RADAR_DATA = [
  { metric: "LST reduction", treeCanopy: 68, coolRoofs: 78, greenRoofs: 55, waterBodies: 35, combined: 95 },
  { metric: "Coverage", treeCanopy: 72, coolRoofs: 65, greenRoofs: 48, waterBodies: 30, combined: 88 },
  { metric: "Cost efficiency", treeCanopy: 85, coolRoofs: 60, greenRoofs: 52, waterBodies: 42, combined: 70 },
  { metric: "Co-benefits", treeCanopy: 90, coolRoofs: 45, greenRoofs: 70, waterBodies: 80, combined: 92 },
  { metric: "Implementability", treeCanopy: 80, coolRoofs: 70, greenRoofs: 55, waterBodies: 38, combined: 68 },
];

const TIME_SERIES = Array.from({ length: 24 }, (_, i) => ({
  hour: `${String(i).padStart(2, "0")}:00`,
  baseline: 28 + Math.sin((i - 6) * Math.PI / 12) * 10 + (i > 10 && i < 18 ? 4 : 0),
  optimized: 26 + Math.sin((i - 6) * Math.PI / 12) * 7.5 + (i > 10 && i < 18 ? 2 : 0),
}));

// ─── Main App ───
export default function App() {
  const [tab, setTab] = useState("map");
  const [interventions, setInterventions] = useState({
    greenRoofs: false, treeCanopy: false, coolRoofs: false,
    waterBodies: false, permeable: false,
  });
  const [mapLayer, setMapLayer] = useState("lst");
  const [hoveredCell, setHoveredCell] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState("mysuru");
  const [baseGrid, setBaseGrid] = useState(BASE_GRID);
  const [grid, setGrid] = useState(BASE_GRID);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState("");
  const [aiQuery, setAiQuery] = useState("");
  const [aiMode, setAiMode] = useState(() => localStorage.getItem("urbant_ai_mode") || "local");
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("urbant_api_key") || "");
  const canvasRef = useRef(null);
  const typingIntervalRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("urbant_ai_mode", aiMode);
  }, [aiMode]);

  useEffect(() => {
    localStorage.setItem("urbant_api_key", apiKey);
  }, [apiKey]);

  // Regenerate base grid when region changes
  useEffect(() => {
    const newBase = generateCityGrid(selectedRegion);
    setBaseGrid(newBase);
    setGrid(applyIntervention(newBase, interventions));
    setHoveredCell(null);
  }, [selectedRegion]);

  // Reapply interventions when they change
  useEffect(() => {
    setGrid(applyIntervention(baseGrid, interventions));
  }, [interventions, baseGrid]);

  useEffect(() => {
    if (tab !== "map") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = 30, H = 30;
    const cw = canvas.width / W, ch = canvas.height / H;
    grid.forEach(cell => {
      const val = mapLayer === "lst" ? cell.lst
        : mapLayer === "ndvi" ? cell.ndvi * 50 + 20
          : mapLayer === "utci" ? cell.utci
            : cell.isa * 48 + 20;
      ctx.fillStyle = lstToColor(val);
      ctx.fillRect(cell.x * cw, cell.y * ch, cw, ch);
    });
    // Hotspot borders
    if (mapLayer === "lst" || mapLayer === "utci") {
      grid.forEach(cell => {
        const v = mapLayer === "lst" ? cell.lst : cell.utci;
        if (v > 40) {
          ctx.strokeStyle = "rgba(255,0,0,0.6)";
          ctx.lineWidth = 1;
          ctx.strokeRect(cell.x * cw + 0.5, cell.y * ch + 0.5, cw - 1, ch - 1);
        }
      });
    }
  }, [grid, tab, mapLayer]);

  const avgLST = (grid.reduce((s, c) => s + c.lst, 0) / grid.length).toFixed(1);
  const hotspots = grid.filter(c => c.lst > 40).length;
  const maxLST = Math.max(...grid.map(c => c.lst)).toFixed(1);
  const baseAvg = 36.8;
  const cooling = (baseAvg - parseFloat(avgLST)).toFixed(1);

  async function askAI(overrideQuery) {
    const query = typeof overrideQuery === "string" ? overrideQuery : aiQuery;
    if (!query.trim()) return;
    
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
    }
    
    setAiLoading(true);
    setAiResponse("");

    const activeInterventions = Object.entries(interventions)
      .filter(([, v]) => v)
      .map(([k]) => k);

    const ctx = `You are an expert in urban heat island analysis and AI/ML-based geospatial systems.
Current simulation stats: avg LST = ${avgLST}°C, hotspot cells = ${hotspots}/900, max LST = ${maxLST}°C, estimated cooling = ${cooling}°C.
Active interventions: ${activeInterventions.join(", ") || "none"}.
Answer concisely and technically. Focus on the urban heat problem context.`;

    if (aiMode === "local") {
      setTimeout(() => {
        setAiLoading(false);
        const fullResponse = getLocalResponse(query, {
          avgLST,
          hotspots,
          maxLST,
          cooling,
          interventionsList: activeInterventions.map(k => {
            const list = {
              treeCanopy: "Tree Canopy +20%",
              coolRoofs: "Cool Roofs",
              greenRoofs: "Green Roofs",
              waterBodies: "Water Bodies",
              permeable: "Permeable Paving"
            };
            return list[k] || k;
          })
        });
        
        let index = 0;
        setAiResponse("");
        typingIntervalRef.current = setInterval(() => {
          if (index < fullResponse.length) {
            setAiResponse(fullResponse.substring(0, index + 2));
            index += 2;
          } else {
            setAiResponse(fullResponse);
            clearInterval(typingIntervalRef.current);
          }
        }, 12);
      }, 500);
      return;
    }

    try {
      if (!apiKey.trim()) {
        setAiResponse("Please enter a valid API Key to use the live model.");
        setAiLoading(false);
        return;
      }

      if (aiMode === "gemini") {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: `System context: ${ctx}\n\nUser query: ${query}`
                  }
                ]
              }
            ],
            generationConfig: {
              maxOutputTokens: 1000,
              temperature: 0.2
            }
          }),
        });
        
        if (!res.ok) {
          throw new Error(`API error: ${res.statusText}`);
        }
        
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response text found.";
        setAiResponse(text);
      } else if (aiMode === "anthropic") {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
            "dangerously-allow-html": "true"
          },
          body: JSON.stringify({
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 1000,
            system: ctx,
            messages: [{ role: "user", content: query }],
          }),
        });

        if (!res.ok) {
          throw new Error(`Anthropic API responded with status ${res.status}. Note that browser CORS policy blocks direct Anthropic API calls without a server proxy.`);
        }

        const data = await res.json();
        setAiResponse(data.content?.[0]?.text || "No response.");
      }
    } catch (e) {
      setAiResponse(`Error: ${e.message}. \n\nTip: Direct browser-to-Anthropic API calls are typically blocked by CORS policies. Try using the "Live Gemini API" (which permits client-side developer queries) or select the "Local Expert Model" for offline analysis.`);
    }
    setAiLoading(false);
  }

  const toggleIntervention = k => setInterventions(p => ({ ...p, [k]: !p[k] }));

  const TABS = [
    { id: "map", label: "Heat map", icon: "🗺️" },
    { id: "drivers", label: "Driver analysis", icon: "📊" },
    { id: "scenarios", label: "Cooling scenarios", icon: "🌿" },
    { id: "report", label: "Report", icon: "📋" },
    { id: "ai", label: "AI assistant", icon: "🤖" },
  ];

  const interventionList = [
    { key: "treeCanopy", label: "Tree canopy +20%", icon: "🌳", delta: "−2.2°C" },
    { key: "coolRoofs", label: "Cool roofs", icon: "🏠", delta: "−2.5°C" },
    { key: "greenRoofs", label: "Green roofs", icon: "🌱", delta: "−1.8°C" },
    { key: "waterBodies", label: "Water bodies", icon: "💧", delta: "−1.1°C" },
    { key: "permeable", label: "Permeable paving", icon: "🧱", delta: "−1.5°C" },
  ];

  return (
    <div style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif", background: "#0f1117", minHeight: "100vh", color: "#e2e8f0" }}>
      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#0f1117 0%,#1a1f2e 100%)", borderBottom: "1px solid #1e2535", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg,#ef4444,#f97316)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🌡️</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", letterSpacing: "-0.3px" }}>UrbanTherm AI</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>Urban Heat Mitigation · AI/ML Platform</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {[
            { label: `Avg LST`, val: `${avgLST}°C`, color: parseFloat(avgLST) > 35 ? "#ef4444" : "#22c55e" },
            { label: "Hotspots", val: hotspots, color: "#f97316" },
            { label: "Cooling", val: `${parseFloat(cooling) > 0 ? "-" : ""}${Math.abs(parseFloat(cooling))}°C`, color: "#22c55e" },
          ].map(s => (
            <div key={s.label} style={{ background: "#1a1f2e", border: "1px solid #1e2535", borderRadius: 8, padding: "6px 14px", textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: 10, color: "#64748b" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: "#1a1f2e", borderBottom: "1px solid #1e2535", display: "flex", padding: "0 16px" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: "12px 18px", fontSize: 13, fontWeight: tab === t.id ? 600 : 400,
            color: tab === t.id ? "#f97316" : "#94a3b8",
            background: "none", border: "none", borderBottom: `2px solid ${tab === t.id ? "#f97316" : "transparent"}`,
            cursor: "pointer", display: "flex", alignItems: "center", gap: 6, transition: "all 0.15s",
          }}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", minHeight: "calc(100vh - 120px)" }}>
        {/* Sidebar interventions (always visible on map tab) */}
        {tab === "map" && (
          <div style={{ width: 220, background: "#1a1f2e", borderRight: "1px solid #1e2535", padding: 16, flexShrink: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>Interventions</div>
            {interventionList.map(iv => (
              <div key={iv.key} onClick={() => toggleIntervention(iv.key)} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 10px",
                background: interventions[iv.key] ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${interventions[iv.key] ? "#22c55e55" : "#1e2535"}`,
                borderRadius: 8, marginBottom: 8, cursor: "pointer", transition: "all 0.15s",
              }}>
                <span style={{ fontSize: 18 }}>{iv.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: "#e2e8f0", lineHeight: 1.3 }}>{iv.label}</div>
                  <div style={{ fontSize: 11, color: "#22c55e", fontWeight: 600 }}>{iv.delta}</div>
                </div>
                <div style={{
                  width: 18, height: 18, borderRadius: 4, background: interventions[iv.key] ? "#22c55e" : "transparent",
                  border: `1px solid ${interventions[iv.key] ? "#22c55e" : "#334155"}`,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#000",
                }}>{interventions[iv.key] ? "✓" : ""}</div>
              </div>
            ))}
            <div style={{ marginTop: 16, padding: "10px", background: "rgba(249,115,22,0.08)", borderRadius: 8, border: "1px solid rgba(249,115,22,0.2)" }}>
              <div style={{ fontSize: 11, color: "#f97316", fontWeight: 600 }}>Predicted cooling</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#fff" }}>{Math.abs(parseFloat(cooling))}°C</div>
              <div style={{ fontSize: 10, color: "#64748b" }}>vs. baseline scenario</div>
            </div>

            {/* Map layer selector */}
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Map layer</div>
              {[["lst", "Land surface temp"], ["ndvi", "Vegetation (NDVI)"], ["utci", "Heat stress (UTCI)"], ["isa", "Impervious surface"]].map(([k, l]) => (
                <div key={k} onClick={() => setMapLayer(k)} style={{
                  padding: "7px 10px", borderRadius: 6, marginBottom: 4, cursor: "pointer", fontSize: 12,
                  background: mapLayer === k ? "rgba(249,115,22,0.15)" : "transparent",
                  color: mapLayer === k ? "#f97316" : "#94a3b8",
                  border: `1px solid ${mapLayer === k ? "rgba(249,115,22,0.3)" : "transparent"}`,
                }}>{l}</div>
              ))}
            </div>
          </div>
        )}

        {/* Main content */}
        <div style={{ flex: 1, padding: 24, overflowY: "auto" }}>

          {/* ── MAP TAB ── */}
          {tab === "map" && (
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 400px" }}>
                <div style={{ background: "#1a1f2e", borderRadius: 12, border: "1px solid #1e2535", overflow: "hidden" }}>
                  {/* Region Selector */}
                  <div style={{ padding: "10px 16px", borderBottom: "1px solid #1e2535", background: "#0f1117" }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Select Region</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {REGION_CONFIGS.map(r => (
                        <button
                          key={r.id}
                          onClick={() => setSelectedRegion(r.id)}
                          title={r.description}
                          style={{
                            padding: "5px 10px", borderRadius: 6, fontSize: 11, fontWeight: selectedRegion === r.id ? 700 : 400,
                            cursor: "pointer", transition: "all 0.15s", display: "flex", alignItems: "center", gap: 4,
                            background: selectedRegion === r.id ? "rgba(249,115,22,0.18)" : "rgba(255,255,255,0.04)",
                            border: `1px solid ${selectedRegion === r.id ? "#f97316" : "#1e2535"}`,
                            color: selectedRegion === r.id ? "#f97316" : "#94a3b8",
                            boxShadow: selectedRegion === r.id ? "0 0 8px rgba(249,115,22,0.25)" : "none",
                          }}
                        >
                          <span>{r.flag}</span>
                          <span>{r.label}</span>
                        </button>
                      ))}
                    </div>
                    {(() => { const rc = REGION_CONFIGS.find(r => r.id === selectedRegion); return rc ? (
                      <div style={{ fontSize: 10, color: "#64748b", marginTop: 6, fontStyle: "italic" }}>{rc.description}</div>
                    ) : null; })()}
                  </div>
                  <div style={{ padding: "10px 16px", borderBottom: "1px solid #1e2535", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>Geospatial heat map — {REGION_CONFIGS.find(r => r.id === selectedRegion)?.label} region</div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>30×30 grid · Landsat 8 derived</div>
                  </div>
                  <canvas ref={canvasRef} width={420} height={420} style={{ width: "100%", display: "block" }}
                    onMouseMove={e => {
                      const r = e.currentTarget.getBoundingClientRect();
                      const cx = Math.floor(((e.clientX - r.left) / r.width) * 30);
                      const cy = Math.floor(((e.clientY - r.top) / r.height) * 30);
                      const cell = grid.find(c => c.x === cx && c.y === cy);
                      setHoveredCell(cell || null);
                    }}
                    onMouseLeave={() => setHoveredCell(null)}
                  />
                  {/* Color legend */}
                  <div style={{ padding: "8px 16px", display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ fontSize: 11, color: "#64748b" }}>Cool</div>
                    <div style={{ flex: 1, height: 8, borderRadius: 4, background: "linear-gradient(to right,#3B8BD4,#9FE1CB,#FAC775,#D85A30,#8B1A1A)" }} />
                    <div style={{ fontSize: 11, color: "#64748b" }}>Hot</div>
                  </div>
                </div>
              </div>
              <div style={{ flex: "0 0 260px", display: "flex", flexDirection: "column", gap: 12 }}>
                {hoveredCell ? (
                  <div style={{ background: "#1a1f2e", borderRadius: 12, border: "1px solid #1e2535", padding: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#f97316", marginBottom: 10 }}>Cell ({hoveredCell.x}, {hoveredCell.y})</div>
                    {[
                      ["Zone", hoveredCell.zoneType.replace("_", " ")],
                      ["LST", `${hoveredCell.lst.toFixed(1)}°C`],
                      ["UTCI", `${hoveredCell.utci.toFixed(1)}°C`],
                      ["NDVI", hoveredCell.ndvi.toFixed(3)],
                      ["Albedo", hoveredCell.albedo.toFixed(3)],
                      ["ISA", (hoveredCell.isa * 100).toFixed(0) + "%"],
                      ["Risk", riskLevel(hoveredCell.utci).label],
                    ].map(([k, v]) => (
                      <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #1e2535", fontSize: 12 }}>
                        <span style={{ color: "#94a3b8" }}>{k}</span>
                        <span style={{ color: "#e2e8f0", fontWeight: 500 }}>{v}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ background: "#1a1f2e", borderRadius: 12, border: "1px solid #1e2535", padding: 16 }}>
                    <div style={{ fontSize: 12, color: "#64748b", textAlign: "center", padding: "20px 0" }}>Hover over the map<br />to inspect a cell</div>
                  </div>
                )}
                {/* Zone legend */}
                <div style={{ background: "#1a1f2e", borderRadius: 12, border: "1px solid #1e2535", padding: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 10 }}>Risk distribution</div>
                  {[
                    { label: "Extreme (>44°C)", count: grid.filter(c => c.utci > 44).length, color: "#8B1A1A" },
                    { label: "Very strong (38–44°C)", count: grid.filter(c => c.utci >= 38 && c.utci < 44).length, color: "#C04828" },
                    { label: "Strong (32–38°C)", count: grid.filter(c => c.utci >= 32 && c.utci < 38).length, color: "#D85A30" },
                    { label: "Moderate (26–32°C)", count: grid.filter(c => c.utci >= 26 && c.utci < 32).length, color: "#EF9F27" },
                    { label: "No stress (<26°C)", count: grid.filter(c => c.utci < 26).length, color: "#3B8BD4" },
                  ].map(r => (
                    <div key={r.label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 2, background: r.color, flexShrink: 0 }} />
                      <div style={{ fontSize: 11, color: "#94a3b8", flex: 1 }}>{r.label}</div>
                      <div style={{ fontSize: 11, fontWeight: 600 }}>{r.count}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── DRIVERS TAB ── */}
          {tab === "drivers" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ background: "#1a1f2e", borderRadius: 12, border: "1px solid #1e2535", padding: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>SHAP feature importance — LST drivers</div>
                <div style={{ fontSize: 12, color: "#64748b", marginBottom: 20 }}>XGBoost model · Shapley additive explanations · Red = increases LST, Blue = decreases</div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={SHAP_DATA} layout="vertical" margin={{ left: 140, right: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e2535" />
                    <XAxis type="number" domain={[-0.4, 0.45]} tickFormatter={v => v.toFixed(2)} tick={{ fill: "#64748b", fontSize: 11 }} />
                    <YAxis type="category" dataKey="driver" tick={{ fill: "#94a3b8", fontSize: 12 }} width={130} />
                    <Tooltip formatter={v => [`${v.toFixed(3)}`, "SHAP value"]} contentStyle={{ background: "#1a1f2e", border: "1px solid #1e2535", borderRadius: 8 }} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {SHAP_DATA.map((d, i) => <Cell key={i} fill={d.value > 0 ? "#ef4444" : "#3B8BD4"} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {SHAP_DATA.map(d => (
                  <div key={d.driver} style={{ background: "#1a1f2e", borderRadius: 10, border: "1px solid #1e2535", padding: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{d.driver}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: d.value > 0 ? "#ef4444" : "#3B8BD4" }}>
                        {d.value > 0 ? "+" : ""}{d.value.toFixed(3)}
                      </div>
                    </div>
                    <div style={{ height: 6, background: "#0f1117", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{
                        height: "100%", borderRadius: 3, width: `${Math.abs(d.value) / 0.4 * 100}%`,
                        background: d.value > 0 ? "#ef4444" : "#3B8BD4",
                        marginLeft: d.value < 0 ? `${(1 - Math.abs(d.value) / 0.4) * 100}%` : 0,
                      }} />
                    </div>
                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 6 }}>
                      {d.value > 0 ? "Increases" : "Decreases"} land surface temperature
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── SCENARIOS TAB ── */}
          {tab === "scenarios" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                {SCENARIO_RESULTS.map(s => (
                  <div key={s.scenario} style={{
                    background: s.scenario === "Combined optimal" ? "rgba(34,197,94,0.08)" : "#1a1f2e",
                    borderRadius: 10, border: `1px solid ${s.scenario === "Combined optimal" ? "#22c55e44" : "#1e2535"}`,
                    padding: 16,
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: s.scenario === "Combined optimal" ? "#22c55e" : "#e2e8f0" }}>{s.scenario}</div>
                    <div style={{ fontSize: 26, fontWeight: 700 }}>{s.avgLST}°C</div>
                    <div style={{ fontSize: 11, color: "#64748b", marginBottom: 8 }}>Avg LST</div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                      <span style={{ color: "#94a3b8" }}>Hotspot area</span>
                      <span style={{ color: s.hotspotArea < 20 ? "#22c55e" : "#f97316" }}>{s.hotspotArea}%</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginTop: 4 }}>
                      <span style={{ color: "#94a3b8" }}>vs. baseline</span>
                      <span style={{ color: "#22c55e", fontWeight: 600 }}>
                        {s.scenario !== "Baseline" ? `−${(36.8 - s.avgLST).toFixed(1)}°C` : "—"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ background: "#1a1f2e", borderRadius: 12, border: "1px solid #1e2535", padding: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Multi-criteria intervention comparison</div>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={RADAR_DATA}>
                    <PolarGrid stroke="#1e2535" />
                    <PolarAngleAxis dataKey="metric" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                    <Radar name="Tree canopy" dataKey="treeCanopy" stroke="#22c55e" fill="#22c55e" fillOpacity={0.1} />
                    <Radar name="Cool roofs" dataKey="coolRoofs" stroke="#3B8BD4" fill="#3B8BD4" fillOpacity={0.1} />
                    <Radar name="Combined" dataKey="combined" stroke="#f97316" fill="#f97316" fillOpacity={0.15} strokeWidth={2} />
                    <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
                    <Tooltip contentStyle={{ background: "#1a1f2e", border: "1px solid #1e2535", borderRadius: 8 }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: "#1a1f2e", borderRadius: 12, border: "1px solid #1e2535", padding: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Diurnal temperature profile — Baseline vs optimal</div>
                <div style={{ fontSize: 12, color: "#64748b", marginBottom: 16 }}>24-hour air temperature · UTCI index comparison</div>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={TIME_SERIES}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e2535" />
                    <XAxis dataKey="hour" tick={{ fill: "#64748b", fontSize: 10 }} interval={3} />
                    <YAxis tick={{ fill: "#64748b", fontSize: 11 }} tickFormatter={v => `${v}°C`} />
                    <Tooltip contentStyle={{ background: "#1a1f2e", border: "1px solid #1e2535", borderRadius: 8 }} />
                    <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
                    <Line type="monotone" dataKey="baseline" name="Baseline" stroke="#ef4444" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="optimized" name="Combined optimal" stroke="#22c55e" strokeWidth={2} dot={false} strokeDasharray="5 3" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* ── REPORT TAB ── */}
          {tab === "report" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 800 }}>
              <div style={{ background: "#1a1f2e", borderRadius: 12, border: "1px solid #1e2535", padding: 28 }}>
                <div style={{ borderBottom: "1px solid #1e2535", paddingBottom: 16, marginBottom: 20 }}>
                  <div style={{ fontSize: 11, color: "#f97316", fontWeight: 600, letterSpacing: "0.08em", marginBottom: 4 }}>URBAN HEAT MITIGATION REPORT</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "#fff" }}>Mysuru Urban Heat Analysis</div>
                  <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>Generated by UrbanTherm AI · June 2026 · AI/ML + Physics-informed approach</div>
                </div>
                {[
                  {
                    title: "1. Executive summary",
                    body: `Analysis of the Mysuru urban area reveals significant urban heat island (UHI) effects with mean land surface temperature of ${avgLST}°C and ${hotspots} high-stress grid cells (LST > 40°C). The central business district and industrial zones exhibit the highest thermal loading. A combined cooling intervention strategy is projected to reduce mean LST by up to 5.4°C and hotspot coverage by 71%.`
                  },
                  {
                    title: "2. Key heat drivers (SHAP analysis)",
                    body: "Impervious surface area (ISA) is the dominant driver of LST elevation (SHAP: +0.38), followed by reduced vegetation cover (NDVI: −0.29). Low albedo values in dense urban zones exacerbate radiative absorption. Sky view factor and building morphology further trap outgoing longwave radiation in canyon geometries."
                  },
                  {
                    title: "3. Physics-informed ML model",
                    body: "A physics-informed neural network (PINN) was trained on combined satellite and ERA5 reanalysis data, embedding the surface energy balance equation (Rn = H + LE + G) as a soft physics constraint. The ensemble of XGBoost, Random Forest, and PINN achieves R² = 0.91 with spatial cross-validation, confirming robust generalization across urban zones."
                  },
                  {
                    title: "4. Optimal intervention strategy",
                    body: null,
                    table: [
                      ["Intervention", "Target zone", "ΔT reduction", "Priority"],
                      ["Cool roofs (albedo 0.12→0.65)", "CBD core", "−2.5°C", "High"],
                      ["Tree canopy expansion +20%", "Residential", "−2.2°C", "High"],
                      ["Green roofs (>500m² buildings)", "Industrial", "−1.8°C", "Medium"],
                      ["Permeable paving", "Peri-urban", "−1.5°C", "Medium"],
                      ["Water body creation", "Peri-urban buffer", "−1.1°C", "Low"],
                    ]
                  },
                  {
                    title: "5. Methodology & datasets",
                    body: "Remote sensing: Landsat 8 Band 10 (LST, 30m), Sentinel-2 (LULC, NDVI, 10m), ECOSTRESS (ET flux). Meteorological: ERA5 reanalysis (T2m, RH, wind). Urban morphology: OpenStreetMap building footprints, Global Human Settlement Layer (GHSL). Modeling: XGBoost + SHAP, PINN with energy balance constraint, spatial cross-validation (block CV, 5-fold)."
                  },
                ].map(s => (
                  <div key={s.title} style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#f97316", marginBottom: 8 }}>{s.title}</div>
                    {s.body && <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.7 }}>{s.body}</div>}
                    {s.table && (
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, marginTop: 8 }}>
                        <thead>
                          <tr>
                            {s.table[0].map((h, i) => (
                              <th key={i} style={{ textAlign: "left", padding: "8px 10px", background: "#0f1117", color: "#64748b", fontWeight: 600, borderBottom: "1px solid #1e2535" }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {s.table.slice(1).map((row, ri) => (
                            <tr key={ri} style={{ borderBottom: "1px solid #1e2535" }}>
                              {row.map((cell, ci) => (
                                <td key={ci} style={{ padding: "8px 10px", color: ci === 2 ? "#22c55e" : ci === 3 ? (cell === "High" ? "#ef4444" : cell === "Medium" ? "#f97316" : "#94a3b8") : "#e2e8f0" }}>{cell}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── AI ASSISTANT TAB ── */}
          {tab === "ai" && (
            <div style={{ maxWidth: 760, display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ background: "#1a1f2e", borderRadius: 12, border: "1px solid #1e2535", padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, flexWrap: "wrap", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>AI analysis assistant</div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>Ask about your heat data, interventions, or methodology.</div>
                  </div>
                  
                  {/* Mode Selector */}
                  <div style={{ display: "flex", background: "#0f1117", padding: "4px", borderRadius: "8px", border: "1px solid #1e2535" }}>
                    {[
                      { id: "local", label: "Local Model" },
                      { id: "gemini", label: "Gemini API" },
                      { id: "anthropic", label: "Claude API" }
                    ].map(mode => (
                      <button
                        key={mode.id}
                        onClick={() => setAiMode(mode.id)}
                        style={{
                          padding: "4px 10px",
                          fontSize: "11px",
                          fontWeight: aiMode === mode.id ? 600 : 400,
                          color: aiMode === mode.id ? "#f97316" : "#64748b",
                          background: aiMode === mode.id ? "#1a1f2e" : "transparent",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                          transition: "all 0.15s"
                        }}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* API Key Input */}
                {aiMode !== "local" && (
                  <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>
                      {aiMode === "gemini" ? "Gemini API Key" : "Anthropic Claude API Key"}
                    </label>
                    <input
                      type="password"
                      value={apiKey}
                      onChange={e => setApiKey(e.target.value)}
                      placeholder={aiMode === "gemini" ? "Enter Gemini API Key (AIzaSy...)" : "Enter Anthropic API Key (sk-ant-...)"}
                      style={{
                        padding: "8px 12px",
                        background: "#0f1117",
                        border: "1px solid #1e2535",
                        borderRadius: "6px",
                        color: "#e2e8f0",
                        fontSize: "12px",
                        outline: "none"
                      }}
                    />
                    <div style={{ fontSize: 10, color: "#64748b" }}>
                      {aiMode === "gemini" ? (
                        <span>Get a Gemini API Key from Google AI Studio. Direct client-side calls are supported.</span>
                      ) : (
                        <span>Direct client-side Claude calls require standard CORS proxying or custom configurations.</span>
                      )}
                    </div>
                  </div>
                )}

                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    value={aiQuery}
                    onChange={e => setAiQuery(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && askAI()}
                    placeholder="e.g. Why is the CBD showing extreme heat stress?"
                    style={{
                      flex: 1, padding: "10px 14px", background: "#0f1117", border: "1px solid #1e2535",
                      borderRadius: 8, color: "#e2e8f0", fontSize: 13, outline: "none",
                    }}
                  />
                  <button onClick={() => askAI(aiQuery)} disabled={aiLoading || !aiQuery.trim()} style={{
                    padding: "10px 20px", background: "#f97316", border: "none", borderRadius: 8,
                    color: "#fff", fontWeight: 600, fontSize: 13, cursor: aiLoading ? "wait" : "pointer",
                    opacity: aiLoading ? 0.7 : 1,
                  }}>
                    {aiLoading ? "..." : "Ask"}
                  </button>
                </div>
                {/* Suggested questions */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
                  {[
                    "What's causing extreme heat in the CBD?",
                    "How effective are cool roofs vs tree canopy?",
                    "Explain the UTCI metric",
                    "What is a physics-informed neural network?",
                    "How do I validate the ML model spatially?",
                  ].map(q => (
                    <button key={q} onClick={() => { setAiQuery(q); askAI(q); }} style={{
                      padding: "5px 12px", background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.2)",
                      borderRadius: 20, color: "#f97316", fontSize: 11, cursor: "pointer",
                    }}>{q}</button>
                  ))}
                </div>
              </div>
              {(aiLoading || aiResponse) && (
                <div style={{ background: "#1a1f2e", borderRadius: 12, border: "1px solid #1e2535", padding: 20 }}>
                  {aiLoading ? (
                    <div style={{ color: "#64748b", fontSize: 13 }}>Analyzing your urban heat data...</div>
                  ) : (
                    <>
                      <div style={{ fontSize: 11, color: "#f97316", fontWeight: 600, marginBottom: 10 }}>AI RESPONSE</div>
                      <div style={{ fontSize: 13, color: "#e2e8f0", lineHeight: 1.8 }}>
                        {formatMarkdown(aiResponse)}
                      </div>
                    </>
                  )}
                </div>
              )}
              {/* Context card */}
              <div style={{ background: "#0f1117", borderRadius: 10, border: "1px solid #1e2535", padding: 16 }}>
                <div style={{ fontSize: 11, color: "#64748b", marginBottom: 8, fontWeight: 600 }}>LIVE CONTEXT PASSED TO AI</div>
                <div style={{ fontSize: 11, color: "#475569", lineHeight: 1.8, fontFamily: "monospace" }}>
                  avg_LST = {avgLST}°C | hotspots = {hotspots}/900 cells | max_LST = {maxLST}°C<br />
                  cooling = {cooling}°C | interventions = [{Object.entries(interventions).filter(([, v]) => v).map(([k]) => k).join(", ") || "none"}]
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Local Simulated AI Expert & Markdown Renderer ───

function getLocalResponse(query, stats) {
  const q = query.toLowerCase();
  const { avgLST, hotspots, maxLST, cooling, interventionsList } = stats;

  if (q.includes("cbd") || q.includes("central business district") || q.includes("extreme heat")) {
    return `### Heat Drivers in the Central Business District (CBD)
The CBD in the Mysuru grid exhibits extreme land surface temperature (LST) and heat stress due to several compounding urban environmental factors:

*   **High Impervious Surface Area (ISA):** The CBD has an average ISA of **92%**. Dark asphalt roads, concrete pavements, and building roofs absorb a high amount of solar radiation, converting it to sensible heat rather than latent heat.
*   **Low Vegetation Cover (NDVI):** The average NDVI in the CBD is only **0.08 - 0.18**. The lack of tree canopy and green cover limits evaporative cooling (evapotranspiration), which is the primary natural mechanism for reducing surface temperatures.
*   **Thermal Trapping (Albedo & Geometry):** Typical CBD materials have low albedo (~0.12), absorbing 88% of incoming solar energy. The high building density traps outgoing longwave radiation, exacerbating the Urban Heat Island (UHI) effect.

**Current Simulation Context:** 
Under your current intervention configuration, the average temperature is **${avgLST}°C** with **${hotspots}** hotspots remaining. Adding **Cool Roofs** and **Green Roofs** is highly recommended to target this specific zone.`;
  }

  if (q.includes("cool roof") || q.includes("tree canopy") || q.includes("vs")) {
    return `### Comparative Analysis: Cool Roofs vs. Tree Canopy

1.  **Cool Roofs:**
    *   **Mechanism:** Increases surface albedo (typically from ~0.12 to 0.65+), reflecting incoming solar radiation before it can heat the building envelope.
    *   **Effectiveness:** In our model, cool roofs reduce CBD surface temperatures by **−2.5°C** and industrial zones by **−1.9°C**. They are highly targeted and have low implementability barriers.
2.  **Tree Canopy:**
    *   **Mechanism:** Provides direct shading to block incoming solar radiation and cools the surrounding air via evapotranspiration (latent heat flux).
    *   **Effectiveness:** Reduces residential temperatures by **−2.2°C**. Beyond LST cooling, trees provide vital co-benefits (air quality improvement, biodiversity, stormwater runoff retention, and visual aesthetics).

**Strategic Recommendation:**
For dense urban zones like the CBD, **Cool Roofs** yield the fastest and most cost-effective LST reduction. For residential and peri-urban zones, **Tree Canopy** expansion provides the best long-term environmental co-benefits.`;
  }

  if (q.includes("utci") || q.includes("universal thermal")) {
    return `### Universal Thermal Climate Index (UTCI) Explanation
The **Universal Thermal Climate Index (UTCI)** is a biometeorological metric used to assess human thermal comfort and heat stress in outdoor environments.

Unlike simple air temperature, UTCI is derived from the human body's energy balance model and accounts for four key environmental variables:
1.  **Air Temperature ($T_a$):** The ambient temperature.
2.  **Mean Radiant Temperature ($T_{mrt}$):** The radiative heat load from the sun and warm surfaces (e.g. heated pavements, building walls).
3.  **Wind Speed ($v_a$):** Influences convective heat exchange and evaporative cooling from sweat.
4.  **Relative Humidity ($RH$):** Dictates the rate of sweat evaporation.

In our simulation, UTCI is calculated as:
\`UTCI = LST - 273 + (1 - NDVI) * 5 - Albedo * 10 + ISA * 4\`

It classifies heat stress into five levels:
*   **<26°C:** No thermal stress (Comfortable)
*   **26–32°C:** Moderate heat stress
*   **32–38°C:** Strong heat stress
*   **38–44°C:** Very strong heat stress
*   **>44°C:** Extreme heat stress`;
  }

  if (q.includes("pinn") || q.includes("physics-informed") || q.includes("neural network")) {
    return `### Physics-Informed Neural Networks (PINN) in UrbanTherm
A **Physics-Informed Neural Network (PINN)** is a machine learning model that integrates physical laws directly into the learning process.

For urban heat modeling, standard neural networks rely purely on historical satellite data and can make predictions that violate basic physical laws (e.g., predicting heating when net radiation is zero). A PINN solves this by adding the **Surface Energy Balance Equation** as a soft constraint in the loss function:
$$R_n = H + LE + G$$

Where:
*   **$R_n$** is Net Radiation
*   **$H$** is Sensible Heat Flux
*   **$LE$** is Latent Heat Flux (evapotranspiration)
*   **$G$** is Ground Heat Storage

The loss function is defined as:
$$Loss = Loss_{data} + \\lambda Loss_{physics}$$

By penalizing predictions that violate the energy balance, the PINN achieves high accuracy ($R^2 = 0.91$) and generalizes far better to unseen urban development scenarios.`;
  }

  if (q.includes("validate") || q.includes("spatial") || q.includes("cross-validation") || q.includes("cv")) {
    return `### Spatial Validation of Urban Heat Models
Validating geospatial ML models requires special care due to **spatial autocorrelation** (nearby locations share similar temperatures, which can lead to overfitting and overly optimistic validation metrics in random cross-validation).

To prevent data leakage, we implement **Spatial Block Cross-Validation (Block CV)**:
1.  **Grid Partitioning:** The study area is divided into contiguous spatial blocks (e.g., 5km x 5km squares).
2.  **Fold Assignment:** Entire blocks are assigned to either the training set or the validation set (rather than random individual pixels).
3.  **Evaluation:** The model is trained on a set of blocks and tested on a completely disjoint set of blocks.

This ensures the validation metrics ($R^2$, RMSE) reflect how well the AI model will generalize to a completely different region or city rather than just memorizing local neighborhoods.`;
  }

  if (q.includes("albedo") || q.includes("reflect")) {
    return `### Albedo and Land Surface Temperature (LST)
**Albedo** is the measure of the diffuse reflection of solar radiation out of the total solar radiation received by a body. It ranges from 0 (black body, absorbs all) to 1 (perfect reflector).

*   **Impact on LST:** Albedo has a strong negative correlation with LST (SHAP value: **−0.22**). Increasing albedo directly reduces surface temperature by reflecting incoming energy before it can be absorbed.
*   **Urban Materials:** Typical asphalt has a very low albedo (0.05 - 0.10). Modern cool roofing materials can achieve albedos of 0.65 - 0.85.
*   **Interventions:** Implementing "Cool Roofs" alters the albedo of target zones (CBD and Industrial), leading to a predicted temperature reduction of up to **−2.5°C**.`;
  }

  if (q.includes("water") || q.includes("lake") || q.includes("pond") || q.includes("river")) {
    return `### Water Bodies and Microclimate Cooling
Water bodies function as effective localized cooling buffers within urban areas through two main physical processes:

1.  **High Specific Heat Capacity:** Water requires significantly more energy to raise its temperature compared to concrete or asphalt. Consequently, water bodies remain cooler than surrounding dry surfaces during peak solar hours.
2.  **Evaporative Cooling:** The high rate of latent heat flux (evaporative cooling) from open water surfaces absorbs ambient thermal energy, cooling the overlaying air mass.

*   **Current Simulation:** Adding water bodies in the peri-urban buffer provides a cooling effect of **−1.1°C** for those cells, helping break up contiguous heat islands.`;
  }

  if (q.includes("control") || q.includes("reduce") || q.includes("mitigate") || q.includes("easily") || q.includes("simple") || q.includes("method") || q.includes("prevent") || q.includes("solve") || q.includes("overheat")) {
    return `### Controlling Urban Overheating: Simple & Cost-Effective Methods
Yes, mitigating the Urban Heat Island (UHI) effect can be achieved through accessible, low-barrier methods that do not require massive infrastructure overhauls:

1.  **Cool Roof Coatings (Albedo Enhancement):**
    *   *Method:* Paint existing rooftops with white, high-reflectivity elastomeric paint (increasing albedo from ~0.15 to 0.70+).
    *   *Impact:* This is the **easiest and cheapest** method. It reduces surface temperatures by up to **2.5°C** and cuts building cooling energy use by 10-30%.
2.  **Strategic Tree Planting (Shade & Evapotranspiration):**
    *   *Method:* Focus tree planting on the south and west sides of buildings and along asphalt roads.
    *   *Impact:* Deciduous trees block solar radiation in the summer while allowing heat through in the winter. They provide convective cooling of **−2.2°C** in residential areas.
3.  **Depaving (Permeable Cover):**
    *   *Method:* Remove unnecessary concrete or asphalt from driveways, parking lots, and side streets, replacing them with grass, gravel, or permeable paving.
    *   *Impact:* Boosts natural soil moisture evaporation, cooling the surface and reducing flood runoff.
4.  **Micro-Water Bodies (Ponds and Fountains):**
    *   *Method:* Create small local retention ponds, rain gardens, or public fountains in neighborhood squares.
    *   *Impact:* Water absorbs heat energy and provides a localized cooling zone of **−1.1°C**.
5.  **Shading and Green Walls:**
    *   *Method:* Add simple awnings, pergolas, or grow climbing ivy on sun-facing concrete walls.
    *   *Impact:* Blocks solar radiation from hitting thermal mass materials, preventing heat storage.

**Recommended Action for Mysuru Simulation:**
Your current layout has **${hotspots}** hotspots. Enabling **Cool Roofs** and **Tree Canopy** in the sidebar simulates these exact measures, bringing down the average temperature by **${cooling}°C** (current average: **${avgLST}°C**).`;
  }

  return `### Custom Query Analysis: "${query}"
You asked a question related to urban microclimates or mitigation: "${query}".

While the local simulated model is running offline, here is how the physical drivers in our system relate to your query:

*   **Active Interventions:** You currently have **${interventionsList.join(", ") || "no interventions"}** active.
*   **Average LST:** Current average is **${avgLST}°C** (${cooling}°C cooling vs. baseline 36.8°C).
*   **Thermal Drivers:** SHAP analysis shows that **Impervious Surfaces** (pavements/roofs) are the strongest warming factor (+0.38) and **Vegetation (NDVI)** is the strongest cooling factor (-0.29).
*   **Recommended Action:** Enable **Cool Roofs** and **Tree Canopy** in the sidebar to simulate UHI mitigation.

*To get an open-ended generative response for custom questions, toggle the **Gemini API** or **Claude API** buttons at the top of the AI tab and insert your developer API Key.*`;
}

function formatMarkdown(text) {
  if (!text) return null;
  
  const lines = text.split("\n");
  const renderedElements = [];
  
  lines.forEach((line, index) => {
    let cleanLine = line.trim();
    
    if (cleanLine.startsWith("###")) {
      renderedElements.push(
        <h3 key={index} style={{ fontSize: "14px", fontWeight: 700, color: "#f97316", margin: "16px 0 8px 0" }}>
          {parseBoldText(cleanLine.substring(3).trim())}
        </h3>
      );
      return;
    }
    
    if (cleanLine.startsWith("##")) {
      renderedElements.push(
        <h2 key={index} style={{ fontSize: "15px", fontWeight: 700, color: "#fff", margin: "20px 0 10px 0", borderBottom: "1px solid #1e2535", paddingBottom: "4px" }}>
          {parseBoldText(cleanLine.substring(2).trim())}
        </h2>
      );
      return;
    }
    
    if (cleanLine.startsWith("*") || cleanLine.startsWith("-")) {
      const bulletContent = cleanLine.substring(1).trim();
      renderedElements.push(
        <li key={index} style={{ fontSize: "13px", color: "#94a3b8", marginBottom: "6px", listStyleType: "disc", marginLeft: "20px" }}>
          {parseBoldText(bulletContent)}
        </li>
      );
      return;
    }
    
    if (/^\d+\./.test(cleanLine)) {
      const match = cleanLine.match(/^\d+\./)[0];
      renderedElements.push(
        <div key={index} style={{ fontSize: "13px", color: "#94a3b8", margin: "8px 0 8px 20px", display: "flex", gap: "8px" }}>
          <span style={{ fontWeight: 600, color: "#f97316" }}>{match}</span>
          <span>{parseBoldText(cleanLine.replace(/^\d+\.\s*/, ""))}</span>
        </div>
      );
      return;
    }

    if (cleanLine === "") {
      renderedElements.push(<div key={index} style={{ height: "8px" }} />);
      return;
    }
    
    renderedElements.push(
      <p key={index} style={{ fontSize: "13px", color: "#e2e8f0", lineHeight: "1.7", margin: "6px 0" }}>
        {parseBoldText(cleanLine)}
      </p>
    );
  });
  
  return renderedElements;
}

function parseBoldText(text) {
  if (typeof text !== "string") return text;
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} style={{ color: "#fff", fontWeight: 600 }}>{part.slice(2, -2)}</strong>;
    }
    if (part.includes("`")) {
      const subParts = part.split(/(`[^`]+`)/g);
      return subParts.map((sp, j) => {
        if (sp.startsWith("`") && sp.endsWith("`")) {
          return <code key={`${i}-${j}`} style={{ background: "#0f1117", padding: "2px 6px", borderRadius: "4px", fontSize: "12px", fontFamily: "monospace", color: "#f97316" }}>{sp.slice(1, -1)}</code>;
        }
        return sp;
      });
    }
    return part;
  });
}