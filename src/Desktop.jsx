import { useState, useEffect, useRef } from "react";
import "./desktop.css";
import Tb from "./Taskbar.jsx";
import Window from "./Window.jsx";
import Notepad from "./Apps/Notepad.jsx";
import Settings from "./Apps/Settings.jsx";
import ThisPC from "./Apps/Explorer.jsx";
import FileDialog from "./Utility/FileDialog.jsx";
import ImageViewer from "./Apps/ImageViewer.jsx";
import Paint from "./Apps/Paint.jsx";
import Terminal from "./Apps/Terminal.jsx";
import TaskManager from "./Apps/TaskManager.jsx";
import { loadSettings, applySettings } from "./Apps/Settings.jsx";

function Desktop() {
  const [desktopApps, setDesktopApps] = useState([]);
  const [wallpaper, setWallpaper] = useState(() => loadSettings().wallpaper);
  const [activeWindowId, setActiveWindowId] = useState(null);
  const [zCounter, setZCounter] = useState(1);
  const [activeApp, setActiveApp] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);

  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    submenu: null,
  });

  const [desktopItems, setDesktopItems] = useState([]);

  const apps = {
    notepad: Notepad,
    settings: Settings,
    thispc: ThisPC,
    fileDialog: FileDialog,
    imageViewer: ImageViewer,
    paint: Paint,
    terminal: Terminal,
    taskManager: TaskManager,
  };
  const GRID_SIZE = 90; // cell size

  // ==========================
  // FETCH DESKTOP FILES
  // ==========================
  async function refreshDesktop() {
    try {
      const res = await fetch(
        "http://localhost/miniOS/backend/list.php?path=C:/Desktop",
      );
      const data = await res.json();

      const itemsWithPos = data.items.map((item, index) => ({
        ...item,
        x: 0,
        y: index * GRID_SIZE,
      }));
      setDesktopApps(itemsWithPos); // use itemsWithPos, not data.items
      // setDesktopApps(data.items); // FULL OBJECTS
    } catch (err) {
      console.error(err);
    }
  }
  useEffect(() => {
    const s = loadSettings();
    applySettings(s);
    const handler = (e) => setWallpaper(e.detail.wallpaper);
    window.addEventListener("settings:update", handler);
    return () => window.removeEventListener("settings:update", handler);
  }, []);
  function handleDragStart(e, itemName) {
    e.preventDefault();

    const item = desktopApps.find((a) => a.name === itemName);
    const startX = e.clientX - item.x;
    const startY = e.clientY - item.y;

    function onMove(e) {
      setDesktopApps((prev) =>
        prev.map((a) =>
          a.name === itemName
            ? { ...a, x: e.clientX - startX, y: e.clientY - startY }
            : a,
        ),
      );
    }

    function onUp(e) {
      const snappedX = Math.round((e.clientX - startX) / GRID_SIZE) * GRID_SIZE;
      const snappedY = Math.round((e.clientY - startY) / GRID_SIZE) * GRID_SIZE;

      setDesktopApps((prev) => {
        const others = prev.filter((a) => a.name !== itemName);
        const occupied = new Set(others.map((a) => `${a.x},${a.y}`));
        let fx = snappedX,
          fy = snappedY;
        if (occupied.has(`${fx},${fy}`)) {
          outer: for (let r = 1; r < 20; r++) {
            for (let dx = -r; dx <= r; dx++) {
              for (let dy = -r; dy <= r; dy++) {
                if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
                const cx = (Math.round(snappedX / GRID_SIZE) + dx) * GRID_SIZE;
                const cy = (Math.round(snappedY / GRID_SIZE) + dy) * GRID_SIZE;
                if (cx >= 0 && cy >= 0 && !occupied.has(`${cx},${cy}`)) {
                  fx = cx;
                  fy = cy;
                  break outer;
                }
              }
            }
          }
        }
        return prev.map((a) =>
          a.name === itemName ? { ...a, x: fx, y: fy } : a,
        );
      });

      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }
  // ==========================
  // CREATE FOLDER
  // ==========================
  async function createFolder() {
  const name = prompt("Folder name:");
  if (!name) return;

  const formData = new FormData();
  const path = "C:/miniOS_storage/C/Desktop";

  formData.append("path", path);
  formData.append("name", name);

  try {
    const res = await fetch("http://localhost/miniOS/backend/createFolder.php", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    console.log("SERVER RESPONSE:", data); // 🔥 IMPORTANT

    if (data.success) {
      refreshDesktop();
    } else {
      alert("Error: " + data.error);
    }

  } catch (err) {
    console.error(err);
  }

  setContextMenu((p) => ({ ...p, visible: false }));
}

  function getIcon(item) {
    if (item.type === "folder")
      return (
        <svg viewBox="0 0 24 24" width="48" height="48" fill="none">
          <path
            d="M2 6a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"
            fill="#ffb86c"
          />
          <path d="M2 9h20v8a2 2 0 01-2 2H4a2 2 0 01-2-2V9z" fill="#ffd09b" />
        </svg>
      );

    const ext = item.name?.split(".").pop().toLowerCase();

    if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext))
      return (
        <svg viewBox="0 0 24 24" width="48" height="48" fill="none">
          <rect
            x="2"
            y="2"
            width="20"
            height="20"
            rx="3"
            fill="#50fa7b"
            opacity="0.2"
          />
          <rect
            x="2"
            y="2"
            width="20"
            height="20"
            rx="3"
            stroke="#50fa7b"
            strokeWidth="1.5"
          />
          <circle cx="8.5" cy="8.5" r="1.5" fill="#50fa7b" />
          <path
            d="M2 15l5-5 4 4 3-3 5 5"
            stroke="#50fa7b"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      );

    if (ext === "txt")
      return (
        <svg viewBox="0 0 24 24" width="48" height="48" fill="none">
          <rect
            x="4"
            y="2"
            width="16"
            height="20"
            rx="2"
            fill="#8be9fd"
            opacity="0.2"
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
      );

    // default file
    return (
      <svg viewBox="0 0 24 24" width="48" height="48" fill="none">
        <path
          d="M4 2h10l6 6v14a2 2 0 01-2 2H4a2 2 0 01-2-2V4a2 2 0 012-2z"
          fill="#aaa"
          opacity="0.2"
        />
        <path
          d="M4 2h10l6 6v14a2 2 0 01-2 2H4a2 2 0 01-2-2V4a2 2 0 012-2z"
          stroke="#aaa"
          strokeWidth="1.5"
        />
        <path d="M14 2v6h6" stroke="#aaa" strokeWidth="1.5" />
      </svg>
    );
  }

  // ==========================
  // OPEN APP
  // ==========================

  const activeAppRef = useRef(activeApp);
  useEffect(() => {
    activeAppRef.current = activeApp;
  }, [activeApp]);

  // in autoProps inside openApp:
  const autoProps = {
    taskManager: { getApps: () => activeAppRef.current, setActiveApp },
  };
  function openApp(name, props = {}) {
    setZCounter((prevZ) => {
      const newZ = prevZ + 1;
      setActiveApp((prev) => [
        ...prev,
        {
          id: Date.now(),
          name,
          props: { ...autoProps[name], ...props },
          zIndex: newZ,
        },
      ]);
      return newZ;
    });
  }

  function bringToFront(id) {
    setZCounter((prevZ) => {
      const newZ = prevZ + 1;

      setActiveApp((prev) => {
        const updated = [...prev];
        const target = updated.find((a) => a.id === id);
        if (target) target.zIndex = newZ;
        return updated;
      });

      return newZ;
    });
  }

  useEffect(() => {
    const handleUpdate = () => {
      refreshDesktop();
    };

    window.addEventListener("fs:update", handleUpdate);

    return () => {
      window.removeEventListener("fs:update", handleUpdate);
    };
  }, []);
  // ==========================
  // CLOSE CONTEXT MENU
  // ==========================
  useEffect(() => {
    const handleClick = () => {
      setContextMenu((prev) => ({ ...prev, visible: false }));
    };

    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  // ==========================
  // INITIAL LOAD
  // ==========================
  useEffect(() => {
    refreshDesktop();
  }, []);

  return (
    <>
      <Tb
        activeApp={activeApp}
        openApp={openApp}
        bringToFront={bringToFront}
        taskbarApps={["notepad"]}
        allApps={apps}
      />

      {activeApp.map((appx) => (
        <Window
          key={appx.id}
          app={appx}
          apps={apps}
          setActiveApp={setActiveApp}
          activeApp={activeApp}
          style={{ zIndex: appx.zIndex }}
          setActiveWindowId={setActiveWindowId}
          activeWindowId={activeWindowId}
          openApp={openApp}
          bringToFront={bringToFront}
        />
      ))}

      <div className="desktop-root">
        <div
          className="main-area"
          onClick={() => setSelectedApp(null)}
          style={{
            backgroundImage: wallpaper ? `url('${wallpaper}')` : "none",
          }}
          onContextMenu={(e) => {
            e.preventDefault();

            setContextMenu({
              visible: true,
              x: e.clientX,
              y: e.clientY,
            });
          }}
        >
          <div className="icons-pack">
            {desktopApps.map((item, key) => (
              <div
                style={{
                  position: "absolute",
                  left: item.x,
                  top: item.y,
                  userSelect: "none",
                }}
                key={key}
                className={`ico-box ${selectedApp === item.name ? "selected" : ""}`}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  handleDragStart(e, item.name);
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedApp(item.name);
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();

                  // FOLDER
                  if (item.type === "folder") {
                    openApp("thispc", {
                      initialPath: item.path,
                    });
                  }

                  // FILE
                  else if (item.type === "file") {
                    const ext = item.name.split(".").pop().toLowerCase();

                    const map = {
                      txt: "notepad",
                      png: "imageViewer",
                      jpg: "imageViewer",
                      jpeg: "imageViewer",
                    };

                    const app = map[ext];

                    if (app) {
                      openApp(app, {
                        filePath: item.path,
                      });
                    }
                  }
                }}
              >
                <div className="imgBox">{getIcon(item)}</div>
                <div className="ico-txt">{item.name}</div>
              </div>
            ))}
          </div>
        </div>

        {contextMenu.visible && (
          <div
            className="context-menu"
            style={{
              top: contextMenu.y,
              left: contextMenu.x,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="context-item"
              onClick={() => {
                refreshDesktop();
                setContextMenu((p) => ({ ...p, visible: false }));
              }}
            >
              Refresh
            </div>

            <div
              className="context-item"
              onClick={(e) => {
                e.stopPropagation();
                createFolder();
              }}
            >
              New Folder
            </div>

            <div className="context-item">Personalize</div>
          </div>
        )}
      </div>
    </>
  );
}

export default Desktop;
