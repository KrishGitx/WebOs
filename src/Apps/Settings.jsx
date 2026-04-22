import { useEffect, useState } from "react";

const DEFAULTS = {
  wallpaper: "/src/assets/2.jpg", // ← fix this
  accent: "#2c99c4",
  fontSize: "14",
  clockFormat: "24",
};

const WALLPAPERS = [
  { label: "Default", value: "/src/assets/2.jpg" }, // ← and here
  { label: "Dark", value: "" },
  { label: "Custom URL", value: "custom" },
];

export function loadSettings() {
  const saved = JSON.parse(localStorage.getItem("osSettings") || "{}");
  return { ...DEFAULTS, ...saved };
}

export function applySettings(settings) {
  const root = document.documentElement;
  root.style.setProperty("--accent", settings.accent);
  root.style.setProperty("--font-size", `${settings.fontSize}px`);
  document.body.style.fontSize = `${settings.fontSize}px`;
  window.dispatchEvent(new CustomEvent("settings:update", { detail: settings }));
}

export default function Settings({ setHeaderContent }) {
  const [settings, setSettings] = useState(loadSettings);
  const [customUrl, setCustomUrl] = useState("");
  const [tab, setTab] = useState("wallpaper");

  useEffect(() => { setHeaderContent({}); }, []);

  function save(updated) {
    setSettings(updated);
    localStorage.setItem("osSettings", JSON.stringify(updated));
    applySettings(updated);
  }

  function set(key, val) { save({ ...settings, [key]: val }); }

  return (
    <div style={S.root}>
      {/* Sidebar */}
      <div style={S.sidebar}>
        {["wallpaper", "accent", "font", "clock"].map(t => (
          <div key={t} style={{ ...S.sideItem, ...(tab === t ? S.sideActive : {}) }}
            onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </div>
        ))}
      </div>

      {/* Content */}
      <div style={S.content}>

        {tab === "wallpaper" && (
          <div>
            <div style={S.title}>Wallpaper</div>
            <div style={S.grid}>
              {WALLPAPERS.map(w => (
                <div key={w.label}
                  style={{ ...S.wpBox, ...(settings.wallpaper === w.value ? S.wpActive : {}) }}
                  onClick={() => w.value !== "custom" && set("wallpaper", w.value)}>
                  {w.value && w.value !== "custom"
                    ? <img src={w.value} style={S.wpImg} />
                    : <div style={{ ...S.wpImg, background: w.value === "custom" ? "#333" : "#111", display:"flex", alignItems:"center", justifyContent:"center", color:"#aaa", fontSize:12 }}>{w.label}</div>
                  }
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16 }}>
              <div style={S.label}>Custom URL</div>
              <div style={{ display: "flex", gap: 8 }}>
                <input style={S.input} value={customUrl}
                  onChange={e => setCustomUrl(e.target.value)}
                  placeholder="https://..." />
                <button style={S.btn} onClick={() => customUrl && set("wallpaper", customUrl)}>
                  Apply
                </button>
              </div>
            </div>
          </div>
        )}

        {tab === "accent" && (
          <div>
            <div style={S.title}>Accent Color</div>
            <div style={S.label}>Pick a color</div>
            <input type="color" value={settings.accent}
              onChange={e => set("accent", e.target.value)}
              style={{ width: 60, height: 40, border: "none", background: "none", cursor: "pointer" }} />
            <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
              {["#2c99c4","#50fa7b","#ff5555","#ffb86c","#bd93f9","#ff79c6","#f1fa8c"].map(c => (
                <div key={c} onClick={() => set("accent", c)}
                  style={{ width: 32, height: 32, borderRadius: "50%", background: c, cursor: "pointer",
                    outline: settings.accent === c ? `3px solid #fff` : "none", outlineOffset: 2 }} />
              ))}
            </div>
          </div>
        )}

        {tab === "font" && (
          <div>
            <div style={S.title}>Font Size</div>
            <div style={S.label}>Size: {settings.fontSize}px</div>
            <input type="range" min="11" max="20" value={settings.fontSize}
              onChange={e => set("fontSize", e.target.value)}
              style={{ width: "100%", accentColor: settings.accent }} />
            <div style={{ display: "flex", justifyContent: "space-between", color: "#666", fontSize: 11 }}>
              <span>Small</span><span>Large</span>
            </div>
            <div style={{ marginTop: 20, fontSize: `${settings.fontSize}px`, color: "#aaa" }}>
              Preview text — The quick brown fox
            </div>
          </div>
        )}

        {tab === "clock" && (
          <div>
            <div style={S.title}>Clock Format</div>
            {["12", "24"].map(f => (
              <div key={f} style={{ ...S.radioRow, ...(settings.clockFormat === f ? S.radioActive : {}) }}
                onClick={() => set("clockFormat", f)}>
                <div style={{ ...S.radio, ...(settings.clockFormat === f ? { background: settings.accent } : {}) }} />
                {f === "12" ? "12-hour (3:45 PM)" : "24-hour (15:45)"}
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

const S = {
  root: { width:"100%",display: "flex", height: "100%", background: "#111", color: "#f8f8f2", fontFamily: "'Segoe UI', sans-serif" },
  sidebar: { width: 140, background: "#0c0c0c", borderRight: "1px solid #222", padding: "8px 0" },
  sideItem: { padding: "10px 16px", cursor: "pointer", fontSize: 13, color: "#aaa" },
  sideActive: { background: "#1e1e1e", color: "#fff", borderLeft: "2px solid var(--accent, #2c99c4)" },
  content: { flex: 1, padding: 24, overflowY: "auto" },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 16 },
  label: { color: "#aaa", fontSize: 12, marginBottom: 8 },
  grid: { display: "flex", gap: 12, flexWrap: "wrap" },
  wpBox: { width: 120, height: 80, borderRadius: 6, overflow: "hidden", cursor: "pointer", border: "2px solid transparent" },
  wpActive: { border: "2px solid var(--accent, #2c99c4)" },
  wpImg: { width: "100%", height: "100%", objectFit: "cover" },
  input: { flex: 1, background: "#1e1e1e", border: "1px solid #333", borderRadius: 4, padding: "6px 10px", color: "#fff", fontSize: 13 },
  btn: { background: "var(--accent, #2c99c4)", border: "none", borderRadius: 4, padding: "6px 14px", color: "#fff", cursor: "pointer", fontSize: 13 },
  radioRow: { display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 6, cursor: "pointer", marginBottom: 8, background: "#1a1a1a" },
  radioActive: { background: "#1e1e1e", outline: "1px solid var(--accent, #2c99c4)" },
  radio: { width: 14, height: 14, borderRadius: "50%", border: "2px solid #555" },
};