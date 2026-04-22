import { useState, useEffect, useRef } from "react";
import "./Taskbar.css";

function Clock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const hh  = time.getHours().toString().padStart(2, "0");
  const mm  = time.getMinutes().toString().padStart(2, "0");
  const mon = time.toLocaleString("default", { month: "short" });
  const day = time.getDate();
  return (
    <div className="tb-clock">
      <span className="tb-clock-time">{hh}:{mm}</span>
      <span className="tb-clock-date">{mon} {day}</span>
    </div>
  );
}

export default function Taskbar({
  activeApp   = [],
  openApp,
  bringToFront,
  taskbarApps = [],
  allApps     = {},
}) {
  const [open, setOpen]     = useState(false);
  const [search, setSearch] = useState("");
  const tbRef     = useRef(null);
  const searchRef = useRef(null);

  const allAppNames  = Object.keys(allApps);
  const runningNames = activeApp.map((a) => a.name);
  const combined     = [...new Set([...taskbarApps, ...runningNames])];
  const topApp       = activeApp.reduce(
    (top, a) => (!top || a.zIndex > top.zIndex ? a : top), null
  );

  // Win key toggle
  useEffect(() => {
    const fn = (e) => {
      if (e.key === "Meta" || e.key === "OS") { e.preventDefault(); setOpen((v) => !v); }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);

  // Focus search on open
  useEffect(() => {
    if (open) { setSearch(""); setTimeout(() => searchRef.current?.focus(), 220); }
  }, [open]);

  // Click outside → close
  useEffect(() => {
    if (!open) return;
    const fn = (e) => { if (tbRef.current && !tbRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [open]);

  function handleIconClick(name) {
    const running = activeApp.filter((a) => a.name === name);
    if (!running.length) { openApp(name); return; }
    const top = running.reduce((t, a) => (a.zIndex > t.zIndex ? a : t), running[0]);
    bringToFront(top.id);
  }

  const filtered = allAppNames.filter((n) =>
    n.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div ref={tbRef} className={`taskbar ${open ? "open" : ""}`}>

      {/* ── RAIL — slim left strip ── */}
      <div className="tb-rail">
        <button
          className={`tb-win ${open ? "active" : ""}`}
          onClick={() => setOpen((v) => !v)}
          title="Start"
        >
          <WinLogo active={open} />
        </button>

        <div className="tb-sep" />

        <div className="tb-icons">
          {combined.map((name) => {
            const running   = activeApp.filter((a) => a.name === name);
            const isRunning = running.length > 0;
            const isTop     = topApp && running.some((r) => r.id === topApp.id);
            return (
              <div key={name} className="tb-ico-wrap">
                <span className="tb-tip">{name}</span>
                <button
                  className={`tb-ico ${isTop ? "top" : isRunning ? "running" : ""}`}
                  onClick={() => handleIconClick(name)}
                >
                  {name[0].toUpperCase()}
                  {isRunning && <span className="tb-dot" />}
                </button>
              </div>
            );
          })}
        </div>

        <div className="tb-flex" />
        <div className="tb-sep" />
        <Clock />
      </div>

      {/* ── DRAWER — slides out to the right of the rail ── */}
      <div className="tb-drawer">
        <div className="tb-drawer-head">
          <span className="tb-drawer-title">Apps</span>
          <button className="tb-drawer-close" onClick={() => setOpen(false)}>✕</button>
        </div>

        <div className="tb-search-wrap">
          <span className="tb-search-ico">⌕</span>
          <input
            ref={searchRef}
            className="tb-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search…"
          />
        </div>

        <div className="tb-grid">
          {filtered.map((name) => (
            <button
              key={name}
              className="tb-tile"
              onClick={() => { openApp(name); setOpen(false); }}
            >
              <span className="tb-tile-letter">{name[0].toUpperCase()}</span>
              <span className="tb-tile-name">{name}</span>
            </button>
          ))}
          {!filtered.length && <p className="tb-empty">No results</p>}
        </div>
      </div>

    </div>
  );
}

function WinLogo({ active }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24"
      fill={active ? "#fff" : "rgba(255,255,255,0.7)"}>
      <path d="M3 3l8.5 1.2V12H3V3zm0 9h8.5v7.8L3 21V12zm9.5-8.7L21 3v9h-8.5V3.3zM12.5 12H21v9l-8.5-1.2V12z" />
    </svg>
  );
}