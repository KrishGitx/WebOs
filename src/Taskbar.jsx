import { useState, useEffect, useRef } from "react";
import "./Taskbar.css";

// Change Clock to accept format prop:
function Clock({ format = "24" }) {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const h24 = time.getHours();
  const mm = time.getMinutes().toString().padStart(2, "0");
  const mon = time.toLocaleString("default", { month: "short" });
  const day = time.getDate();

  let timeStr;
  if (format === "12") {
    const h = h24 % 12 || 12;
    const ampm = h24 >= 12 ? "PM" : "AM";
    timeStr = `${h}:${mm} ${ampm}`;
  } else {
    timeStr = `${h24.toString().padStart(2, "0")}:${mm}`;
  }

  return (
    <div className="tb-clock">
      <span className="tb-clock-time">{timeStr}</span>
      <span className="tb-clock-date">
        {mon} {day}
      </span>
    </div>
  );
}

export default function Taskbar({
  activeApp = [],
  openApp,
  bringToFront,
  taskbarApps = [],
  allApps = {},
}) {
  const [clockFormat, setClockFormat] = useState(
    JSON.parse(localStorage.getItem("osSettings") || "{}").clockFormat || "24",
  );

  useEffect(() => {
    const fn = (e) => setClockFormat(e.detail.clockFormat);
    window.addEventListener("settings:update", fn);
    return () => window.removeEventListener("settings:update", fn);
  }, []);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const tbRef = useRef(null);
  const searchRef = useRef(null);

  const allAppNames = Object.keys(allApps);
  const runningNames = activeApp.map((a) => a.name);
  const combined = [...new Set([...taskbarApps, ...runningNames])];
  const topApp = activeApp.reduce(
    (top, a) => (!top || a.zIndex > top.zIndex ? a : top),
    null,
  );

  // Win key toggle
  useEffect(() => {
    const fn = (e) => {
      if (e.key === "Meta" || e.key === "OS") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);

  // Focus search on open
  useEffect(() => {
    if (open) {
      setSearch("");
      setTimeout(() => searchRef.current?.focus(), 220);
    }
  }, [open]);

  // Click outside → close
  useEffect(() => {
    if (!open) return;
    const fn = (e) => {
      if (tbRef.current && !tbRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [open]);
  function handleIconClick(name) {
    const running = activeApp.filter((a) => a.name === name);

    // not running → open new
    if (!running.length) {
      openApp(name);
      return;
    }

    // get top window
    const top = running.reduce(
      (t, a) => (a.zIndex > t.zIndex ? a : t),
      running[0],
    );

    // 🔥 RESTORE IF MINIMIZED
    window.dispatchEvent(
      new CustomEvent("restoreWindow", {
        detail: top.id,
      }),
    );

    // bring to front
    bringToFront(top.id);
  }

  const filtered = allAppNames.filter((n) =>
    n.toLowerCase().includes(search.toLowerCase()),
  );

  function getAppIcon(name) {
    const icons = {
      notepad: (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
          <rect
            x="4"
            y="2"
            width="16"
            height="20"
            rx="2"
            fill="#8be9fd"
            opacity="0.3"
          />
          <rect
            x="4"
            y="2"
            width="16"
            height="20"
            rx="2"
            stroke="#8be9fd"
            strokeWidth="1.5"
          />
          <path
            d="M7 7h10M7 11h10M7 15h6"
            stroke="#8be9fd"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      ),
      settings: (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
          <circle cx="12" cy="12" r="3" stroke="#bd93f9" strokeWidth="1.5" />
          <path
            d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
            stroke="#bd93f9"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      ),
      thispc: (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
          <rect
            x="2"
            y="4"
            width="20"
            height="14"
            rx="2"
            stroke="#50fa7b"
            strokeWidth="1.5"
          />
          <path
            d="M8 20h8M12 18v2"
            stroke="#50fa7b"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path d="M2 14h20" stroke="#50fa7b" strokeWidth="1.5" />
        </svg>
      ),
      terminal: (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
          <rect
            x="2"
            y="4"
            width="20"
            height="16"
            rx="2"
            fill="#50fa7b"
            opacity="0.1"
          />
          <rect
            x="2"
            y="4"
            width="20"
            height="16"
            rx="2"
            stroke="#50fa7b"
            strokeWidth="1.5"
          />
          <path
            d="M6 9l4 3-4 3M12 15h6"
            stroke="#50fa7b"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
      taskManager: (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
          <rect
            x="2"
            y="2"
            width="20"
            height="20"
            rx="2"
            stroke="#ffb86c"
            strokeWidth="1.5"
          />
          <path
            d="M6 16l3-4 3 3 2-5 3 6"
            stroke="#ffb86c"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
      imageViewer: (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
          <rect
            x="2"
            y="2"
            width="20"
            height="20"
            rx="3"
            stroke="#ff79c6"
            strokeWidth="1.5"
          />
          <circle cx="8.5" cy="8.5" r="1.5" fill="#ff79c6" />
          <path
            d="M2 15l5-5 4 4 3-3 5 5"
            stroke="#ff79c6"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      ),
      paint: (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
          <path
            d="M12 19c0 1.1.9 2 2 2a2 2 0 002-2c0-1.1-2-4-2-4s-2 2.9-2 4z"
            fill="#ff5555"
            opacity="0.7"
          />
          <path
            d="M5 3l14 9-7 2-2 7L5 3z"
            stroke="#f1fa8c"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      ),
      fileDialog: (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
          <path
            d="M2 6a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"
            fill="#ffb86c"
            opacity="0.5"
          />
          <path d="M2 9h20" stroke="#ffb86c" strokeWidth="1.5" />
        </svg>
      ),
    };
    return (
      icons[name] ?? (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
          <rect
            x="3"
            y="3"
            width="18"
            height="18"
            rx="3"
            stroke="#aaa"
            strokeWidth="1.5"
          />
          <path
            d="M8 12h8M12 8v8"
            stroke="#aaa"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      )
    );
  }

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
            const running = activeApp.filter((a) => a.name === name);
            const isRunning = running.length > 0;
            const isTop = topApp && running.some((r) => r.id === topApp.id);
            console.log("rail icon name:", name);
            return (
              <div key={name} className="tb-ico-wrap">
                <span className="tb-tip">{name}</span>
                <button
                  className={`tb-ico ${isTop ? "top" : isRunning ? "running" : ""}`}
                  onClick={() => handleIconClick(name)}
                >
                  
                  {getAppIcon(name)}
                  {isRunning && <span className="tb-dot" />}
                </button>
              </div>
            );
          })}
        </div>

        <div className="tb-flex" />
        <div className="tb-sep" />
        <Clock format={clockFormat} />
      </div>

      {/* ── DRAWER — slides out to the right of the rail ── */}
      <div className="tb-drawer">
        <div className="tb-drawer-head">
          <span className="tb-drawer-title">Apps</span>
          <button className="tb-drawer-close" onClick={() => setOpen(false)}>
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
            placeholder="Search…"
          />
        </div>

        <div className="tb-grid">
          {filtered.map((name) => (
            <button
              key={name}
              className="tb-tile"
              onClick={() => {
                openApp(name);
                setOpen(false);
              }}
            >
              <span className="tb-tile-letter">{getAppIcon(name)}</span>
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
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill={active ? "#fff" : "rgba(255,255,255,0.7)"}
    >
      <path d="M3 3l8.5 1.2V12H3V3zm0 9h8.5v7.8L3 21V12zm9.5-8.7L21 3v9h-8.5V3.3zM12.5 12H21v9l-8.5-1.2V12z" />
    </svg>
  );
}
