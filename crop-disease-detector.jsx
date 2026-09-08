import { useState, useRef, useCallback } from "react";

const SYSTEM_PROMPT = `You are an expert agricultural plant pathologist AI. A farmer has uploaded a crop image.

Analyze the image carefully and respond ONLY with a valid JSON object (no markdown, no backticks, no extra text):

{
  "crop_name": "name of the crop plant",
  "plant_part": "which part is affected (leaf/stem/root/fruit/flower/whole plant)",
  "disease_name": "exact disease name",
  "severity": "Mild | Moderate | Severe",
  "confidence": "High | Medium | Low",
  "explanation": "2-3 simple sentences explaining what the disease is and what it does to the plant. Use simple farmer-friendly language.",
  "causes": ["cause 1", "cause 2", "cause 3"],
  "organic_treatment": [
    {"step": "short title", "detail": "simple instruction for farmer"}
  ],
  "chemical_treatment": [
    {"step": "short title", "detail": "product name and how to apply"}
  ],
  "prevention": ["tip 1", "tip 2", "tip 3"]
}

If no disease is detected, set disease_name to "Healthy Plant" and explain the plant looks healthy.
If image is not a plant, set disease_name to "Not a Plant Image" and explain accordingly.
Always respond in simple, farmer-friendly language.`;

const severityColor = {
  Mild: "#7bc67e",
  Moderate: "#f0c040",
  Severe: "#ff6b6b",
};

const confidenceColor = {
  High: "#86ca58",
  Medium: "#f0c040",
  Low: "#ff9f7b",
};

function UploadIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  );
}

function ScanIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/>
      <rect x="7" y="7" width="10" height="10" rx="1"/>
    </svg>
  );
}

function ResultSection({ icon, title, color, children }) {
  return (
    <div style={{
      background: `linear-gradient(135deg, ${color}0d, ${color}05)`,
      border: `1px solid ${color}30`,
      borderRadius: "14px",
      padding: "18px 20px",
      marginBottom: "14px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
        <span style={{ fontSize: "20px" }}>{icon}</span>
        <span style={{ color, fontFamily: "'Bitter', serif", fontWeight: 700, fontSize: "15px" }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

function TreatmentStep({ step, detail, color, index }) {
  return (
    <div style={{ display: "flex", gap: "12px", marginBottom: "10px", alignItems: "flex-start" }}>
      <div style={{
        minWidth: "26px", height: "26px",
        background: `${color}20`,
        border: `1px solid ${color}40`,
        borderRadius: "50%",
        display: "flex", alignItems: "center", justifyContent: "center",
        color, fontSize: "12px", fontWeight: 700, flexShrink: 0,
      }}>{index + 1}</div>
      <div>
        <div style={{ color: "#e8f0e2", fontSize: "13.5px", fontWeight: 600, marginBottom: "2px" }}>{step}</div>
        <div style={{ color: "#8aaa80", fontSize: "13px", lineHeight: 1.6 }}>{detail}</div>
      </div>
    </div>
  );
}

export default function CropDiseaseDetector() {
  const [image, setImage] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [scanLine, setScanLine] = useState(false);
  const fileRef = useRef();

  const processFile = useCallback((file) => {
    if (!file || !file.type.startsWith("image/")) {
      setError("Please upload a valid image file (JPG, PNG, WEBP).");
      return;
    }
    setError("");
    setResult(null);
    const url = URL.createObjectURL(file);
    setImage(url);

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target.result.split(",")[1];
      setImageBase64({ data: base64, type: file.type });
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    processFile(e.dataTransfer.files[0]);
  }, [processFile]);

  const handleAnalyze = async () => {
    if (!imageBase64) return;
    setLoading(true);
    setError("");
    setResult(null);
    setScanLine(true);

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: [{
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: imageBase64.type,
                  data: imageBase64.data,
                },
              },
              { type: "text", text: "Please analyze this crop image and detect any disease. Provide complete diagnosis and treatment." }
            ],
          }],
        }),
      });

      const data = await response.json();
      const text = data.content?.map(b => b.text || "").join("") || "";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setResult(parsed);
    } catch (err) {
      setError("Could not analyze the image. Please try again with a clearer photo.");
    } finally {
      setLoading(false);
      setScanLine(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse at 20% 20%, #0e2210 0%, #060f07 60%, #040c05 100%)",
      fontFamily: "'DM Sans', sans-serif",
      padding: "36px 20px 60px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
    }}>
      <style>{`
        @keyframes scanAnim {
          0% { top: 0%; opacity: 1; }
          100% { top: 100%; opacity: 0.3; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        input[type=file] { display: none; }
      `}</style>

      <link href="https://fonts.googleapis.com/css2?family=Bitter:wght@700;900&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "32px" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "8px",
          background: "rgba(134,202,88,0.08)",
          border: "1px solid rgba(134,202,88,0.2)",
          borderRadius: "100px", padding: "5px 14px",
          color: "#86ca58", fontSize: "11px", fontWeight: 700,
          letterSpacing: "2px", textTransform: "uppercase", marginBottom: "14px",
        }}>
          🔬 AI Vision · Crop Analysis
        </div>
        <h1 style={{
          fontFamily: "'Bitter', serif",
          fontSize: "clamp(26px, 5vw, 40px)",
          color: "#e4f0dc", margin: "0 0 8px", lineHeight: 1.1, fontWeight: 900,
        }}>
          Upload. Detect.<br />
          <span style={{ color: "#86ca58" }}>Heal Your Crop.</span>
        </h1>
        <p style={{ color: "#5a8050", fontSize: "13.5px", maxWidth: "340px", margin: "0 auto" }}>
          AI automatically detects the disease from your crop photo and gives treatment advice.
        </p>
      </div>

      <div style={{ width: "100%", maxWidth: "540px" }}>

        {/* Upload Zone */}
        <div
          onClick={() => fileRef.current.click()}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          style={{
            border: `2px dashed ${dragOver ? "#86ca58" : "rgba(134,202,88,0.25)"}`,
            borderRadius: "18px",
            padding: image ? "0" : "48px 20px",
            textAlign: "center",
            cursor: "pointer",
            background: dragOver ? "rgba(134,202,88,0.06)" : "rgba(255,255,255,0.02)",
            transition: "all 0.25s",
            marginBottom: "16px",
            overflow: "hidden",
            position: "relative",
            minHeight: image ? "280px" : "auto",
          }}
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={e => processFile(e.target.files[0])}
          />

          {image ? (
            <>
              <img
                src={image}
                alt="Uploaded crop"
                style={{ width: "100%", height: "280px", objectFit: "cover", display: "block" }}
              />
              {/* Scan line animation */}
              {scanLine && (
                <div style={{
                  position: "absolute", left: 0, right: 0, height: "3px",
                  background: "linear-gradient(90deg, transparent, #86ca58, transparent)",
                  animation: "scanAnim 1.5s linear infinite",
                  boxShadow: "0 0 20px #86ca58",
                }} />
              )}
              {/* Overlay on hover */}
              <div style={{
                position: "absolute", inset: 0,
                background: "rgba(0,0,0,0.35)",
                display: "flex", alignItems: "center", justifyContent: "center",
                opacity: 0,
                transition: "opacity 0.2s",
                fontSize: "13px", color: "#86ca58", fontWeight: 600,
              }}
                onMouseEnter={e => e.currentTarget.style.opacity = 1}
                onMouseLeave={e => e.currentTarget.style.opacity = 0}
              >
                🔄 Click to change image
              </div>
            </>
          ) : (
            <>
              <div style={{ color: "rgba(134,202,88,0.4)", marginBottom: "14px" }}>
                <UploadIcon />
              </div>
              <div style={{ color: "#86ca58", fontWeight: 700, fontSize: "15px", marginBottom: "6px", fontFamily: "'Bitter', serif" }}>
                Drop your crop photo here
              </div>
              <div style={{ color: "#4a6a42", fontSize: "13px" }}>
                or click to browse · JPG, PNG, WEBP
              </div>
            </>
          )}
        </div>

        {/* Analyze Button */}
        {image && (
          <button
            onClick={handleAnalyze}
            disabled={loading}
            style={{
              width: "100%",
              padding: "15px",
              background: loading
                ? "rgba(134,202,88,0.15)"
                : "linear-gradient(135deg, #5aad28, #86ca58)",
              color: loading ? "#4a7a38" : "#071a04",
              border: "none",
              borderRadius: "13px",
              fontSize: "15px",
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "'Bitter', serif",
              letterSpacing: "0.5px",
              marginBottom: "20px",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
              transition: "all 0.2s",
              boxShadow: loading ? "none" : "0 8px 30px rgba(134,202,88,0.25)",
            }}
          >
            {loading ? (
              <>
                <div style={{
                  width: "18px", height: "18px",
                  border: "2px solid #4a7a38",
                  borderTopColor: "#86ca58",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                }} />
                AI is analyzing your crop...
              </>
            ) : (
              <><ScanIcon /> Detect Disease & Get Treatment</>
            )}
          </button>
        )}

        {error && (
          <div style={{
            background: "rgba(255,107,107,0.08)",
            border: "1px solid rgba(255,107,107,0.25)",
            borderRadius: "10px", padding: "12px 16px",
            color: "#ff9a9a", fontSize: "13.5px", marginBottom: "16px", textAlign: "center",
          }}>{error}</div>
        )}

        {/* Results */}
        {result && (
          <div style={{ animation: "fadeUp 0.5s ease" }}>

            {/* Disease Banner */}
            <div style={{
              background: result.disease_name === "Healthy Plant"
                ? "linear-gradient(135deg, rgba(134,202,88,0.15), rgba(90,173,40,0.08))"
                : "linear-gradient(135deg, rgba(255,107,107,0.12), rgba(240,100,80,0.06))",
              border: `1px solid ${result.disease_name === "Healthy Plant" ? "rgba(134,202,88,0.35)" : "rgba(255,107,107,0.3)"}`,
              borderRadius: "16px",
              padding: "20px 22px",
              marginBottom: "16px",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
                <div>
                  <div style={{ color: "#6a8a60", fontSize: "11px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "4px" }}>
                    Detected Disease
                  </div>
                  <div style={{
                    fontFamily: "'Bitter', serif", fontWeight: 900,
                    fontSize: "20px", color: result.disease_name === "Healthy Plant" ? "#86ca58" : "#ff8a8a",
                    marginBottom: "4px",
                  }}>
                    {result.disease_name}
                  </div>
                  <div style={{ color: "#7a9a70", fontSize: "13px" }}>
                    🌾 {result.crop_name} &nbsp;·&nbsp; 🍃 {result.plant_part}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "flex-end" }}>
                  {result.severity && result.disease_name !== "Healthy Plant" && (
                    <span style={{
                      background: `${severityColor[result.severity]}18`,
                      border: `1px solid ${severityColor[result.severity]}40`,
                      color: severityColor[result.severity],
                      borderRadius: "100px", padding: "4px 12px",
                      fontSize: "12px", fontWeight: 700,
                    }}>
                      ⚡ {result.severity} Severity
                    </span>
                  )}
                  <span style={{
                    background: `${confidenceColor[result.confidence]}15`,
                    border: `1px solid ${confidenceColor[result.confidence]}35`,
                    color: confidenceColor[result.confidence],
                    borderRadius: "100px", padding: "4px 12px",
                    fontSize: "12px", fontWeight: 700,
                  }}>
                    🎯 {result.confidence} Confidence
                  </span>
                </div>
              </div>
              <p style={{ color: "#b0d0a8", fontSize: "13.5px", lineHeight: 1.7, margin: "14px 0 0" }}>
                {result.explanation}
              </p>
            </div>

            {/* Causes */}
            {result.disease_name !== "Healthy Plant" && (
              <ResultSection icon="⚠️" title="What Caused This?" color="#f0c040">
                <ul style={{ margin: 0, paddingLeft: "18px" }}>
                  {result.causes.map((c, i) => (
                    <li key={i} style={{ color: "#c8b870", fontSize: "13.5px", lineHeight: 1.7, marginBottom: "3px" }}>{c}</li>
                  ))}
                </ul>
              </ResultSection>
            )}

            {/* Organic Treatment */}
            {result.disease_name !== "Healthy Plant" && result.organic_treatment?.length > 0 && (
              <ResultSection icon="🌿" title="Organic Treatment" color="#86ca58">
                {result.organic_treatment.map((t, i) => (
                  <TreatmentStep key={i} index={i} step={t.step} detail={t.detail} color="#86ca58" />
                ))}
              </ResultSection>
            )}

            {/* Chemical Treatment */}
            {result.disease_name !== "Healthy Plant" && result.chemical_treatment?.length > 0 && (
              <ResultSection icon="🧪" title="Chemical Treatment" color="#60b4f0">
                {result.chemical_treatment.map((t, i) => (
                  <TreatmentStep key={i} index={i} step={t.step} detail={t.detail} color="#60b4f0" />
                ))}
              </ResultSection>
            )}

            {/* Prevention */}
            {result.prevention?.length > 0 && (
              <ResultSection icon="🛡️" title="Prevention Tips" color="#c090f0">
                <ul style={{ margin: 0, paddingLeft: "18px" }}>
                  {result.prevention.map((p, i) => (
                    <li key={i} style={{ color: "#b8a0d8", fontSize: "13.5px", lineHeight: 1.7, marginBottom: "3px" }}>{p}</li>
                  ))}
                </ul>
              </ResultSection>
            )}

            {/* Re-scan button */}
            <button
              onClick={() => { setImage(null); setImageBase64(null); setResult(null); }}
              style={{
                width: "100%", padding: "12px",
                background: "transparent",
                border: "1px solid rgba(134,202,88,0.2)",
                borderRadius: "12px", color: "#5a8050",
                fontSize: "13.5px", fontWeight: 600, cursor: "pointer",
                marginTop: "6px", transition: "all 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(134,202,88,0.5)"; e.currentTarget.style.color = "#86ca58"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(134,202,88,0.2)"; e.currentTarget.style.color = "#5a8050"; }}
            >
              📷 Scan Another Crop
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
