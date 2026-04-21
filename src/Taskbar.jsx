import { useState, useEffect, useRef } from "react";
import "./Taskbar.css";

// ── Clock ────────────────────────────────────────────────────────────────────
function Clock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const hh = time.getHours().toString().padStart(2, "0");
  const mm = time.getMinutes().toString().padStart(2, "0");
  const month = time.toLocaleString("default", { month: "short" });
  const day = time.getDate();
  return (
    <div className="tb-clock">
      <span className="tb-clock-time">
        {hh}:{mm}
      </span>
      <span className="tb-clock-date">
        {month} {day}
      </span>
    </div>
  );
}

// ── Main Taskbar ─────────────────────────────────────────────────────────────
export default function Taskbar({
  activeApp = [],
  openApp,
  bringToFront,
  taskbarApps = [],
  allApps = {}, // { notepad: Component, paint: Component, ... }
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const searchRef = useRef(null);
  const tbRef = useRef(null);

  // All app names from the allApps object keys
  const allAppNames = Object.keys(allApps);

  // Running app names
  const runningNames = activeApp.map((a) => a.name);

  // Pinned + running, no duplicates
  const combined = [...new Set([...taskbarApps, ...runningNames])];

  // Topmost active window
  const topApp = activeApp.reduce(
    (top, a) => (!top || a.zIndex > top.zIndex ? a : top),
    null,
  );

  // Windows key toggle
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Meta" || e.key === "OS") {
        e.preventDefault();
        setDrawerOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Focus search when drawer opens
  useEffect(() => {
    if (drawerOpen) {
      setSearch("");
      setTimeout(() => searchRef.current?.focus(), 260);
    }
  }, [drawerOpen]);

  // Click outside → close drawer
  useEffect(() => {
    if (!drawerOpen) return;
    const handler = (e) => {
      if (tbRef.current && !tbRef.current.contains(e.target)) {
        setDrawerOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [drawerOpen]);

  function handleIconClick(name) {
    const running = activeApp.filter((a) => a.name === name);
    if (running.length === 0) {
      openApp(name);
    } else {
      const top = running.reduce(
        (t, a) => (a.zIndex > t.zIndex ? a : t),
        running[0],
      );
      bringToFront(top.id);
    }
  }

  const filtered = allAppNames.filter((name) =>
    name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    /*
      The whole taskbar is ONE element that slides left when the drawer opens.
      Normally it's 64px wide (the rail).
      When open it expands to 64px + 340px = 404px by sliding its internal
      drawer panel into view — the rail stays fixed on the right edge.
    */
    <div ref={tbRef} className={`taskbar ${drawerOpen ? "drawer-open" : ""}`}>
      {/* ── DRAWER (hidden off-right by default, slides in) ── */}
      <div className="tb-drawer">
        <div className="tb-drawer-inner">
          <div className="tb-drawer-header">
            <span className="tb-drawer-title">All Apps</span>
            <button
              className="tb-drawer-close"
              onClick={() => setDrawerOpen(false)}
            >
              ✕
            </button>
          </div>

          <div className="tb-search-wrap">
            <span className="tb-search-ico">⌕</span>
            <input
              ref={searchRef}
              className="tb-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search apps…"
            />
          </div>

          <div className="tb-app-grid">
            {filtered.map((name) => (
              <button
                key={name}
                className="tb-app-tile"
                onClick={() => {
                  openApp(name);
                  setDrawerOpen(false);
                }}
              >
                <span className="tb-app-tile-letter">
                  {name[0].toUpperCase()}
                </span>
                <span className="tb-app-tile-name">{name}</span>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="tb-no-results">No apps found</p>
            )}
          </div>
        </div>
      </div>

      {/* ── RAIL (always-visible 64px strip on the far right) ── */}
      <div className="tb-rail">
        {/* Win / Start button */}
        <button
          className={`tb-win-btn ${drawerOpen ? "active" : ""}`}
          onClick={() => setDrawerOpen((v) => !v)}
          title="Start (Win key)"
        >
          <WinLogo active={drawerOpen} />
        </button>

        <div className="tb-divider" />

        {/* Pinned + running icons */}
        <div className="tb-icons">
          {combined.map((name) => {
            const running = activeApp.filter((a) => a.name === name);
            const isRunning = running.length > 0;
            const isTop = topApp && running.some((r) => r.id === topApp.id);
            return (
              <div key={name} className="tb-icon-wrap">
                <div className="tb-tooltip">{name}</div>
                <button
                  className={`tb-icon-btn ${isTop ? "top" : isRunning ? "running" : ""}`}
                  onClick={() => handleIconClick(name)}
                >
                  <span className="tb-icon-letter">
                    {name[0].toUpperCase()}
                  </span>
                  {isRunning && <span className="tb-run-dot" />}
                </button>
              </div>
            );
          })}
        </div>

        <div className="tb-spacer" />
        <div className="tb-divider" />

        <Clock />
      </div>
    </div>
  );
}

function WinLogo({ active }) {
  const c = active ? "#fff" : "rgba(255,255,255,0.75)";
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={c}>
      <path d="M3 3l8.5 1.2V12H3V3zm0 9h8.5v7.8L3 21V12zm9.5-8.7L21 3v9h-8.5V3.3zM12.5 12H21v9l-8.5-1.2V12z" />
    </svg>
  );
}
