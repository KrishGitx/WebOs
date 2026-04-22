import { useState, useEffect } from "react";
import "./desktop.css";
import Tb from "./Taskbar.jsx";
import Window from "./Window.jsx";
import Notepad from "./Apps/Notepad.jsx";
import Settings from "./Apps/Settings.jsx";
import ThisPC from "./Apps/Explorer.jsx";
import FileDialog from "./Utility/FileDialog.jsx";
import ImageViewer from "./Apps/ImageViewer.jsx";
import Paint from "./Apps/Paint.jsx";

function Desktop() {
  const [desktopApps, setDesktopApps] = useState([]);

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

  function handleDragStart(e, item) {
    const startX = e.clientX - item.x;
    const startY = e.clientY - item.y;

    function onMove(e) {
      const rawX = e.clientX - startX;
      const rawY = e.clientY - startY;
      setDesktopApps((prev) =>
        prev.map((a) =>
          a.name === item.name ? { ...a, x: rawX, y: rawY } : a,
        ),
      );
    }

    function onUp(e) {
  const snappedX = Math.round((e.clientX - startX) / GRID_SIZE) * GRID_SIZE;
  const snappedY = Math.round((e.clientY - startY) / GRID_SIZE) * GRID_SIZE;

  setDesktopApps(prev => {
    const others = prev.filter(a => a.name !== item.name);
    const occupied = new Set(others.map(a => `${a.x},${a.y}`));

    let fx = snappedX, fy = snappedY;
    if (occupied.has(`${fx},${fy}`)) {
      // spiral out to find nearest free cell
      outer: for (let r = 1; r < 20; r++) {
        for (let dx = -r; dx <= r; dx++) {
          for (let dy = -r; dy <= r; dy++) {
            if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
            const cx = (Math.round(snappedX / GRID_SIZE) + dx) * GRID_SIZE;
            const cy = (Math.round(snappedY / GRID_SIZE) + dy) * GRID_SIZE;
            if (cx >= 0 && cy >= 0 && !occupied.has(`${cx},${cy}`)) {
              fx = cx; fy = cy;
              break outer;
            }
          }
        }
      }
    }

    return prev.map(a => a.name === item.name ? { ...a, x: fx, y: fy } : a);
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
    formData.append("path", "C:/Desktop");
    formData.append("name", name);

    try {
      await fetch("http://localhost/miniOS/backend/createFolder.php", {
        method: "POST",
        body: formData,
      });

      refreshDesktop();
    } catch (err) {
      console.error(err);
    }

    setContextMenu((p) => ({ ...p, visible: false }));
  }

  // ==========================
  // OPEN APP
  // ==========================
  function openApp(name, props = {}) {
    setZCounter((prevZ) => {
      const newZ = prevZ + 1;

      setActiveApp((prev) => [
        ...prev,
        {
          id: Date.now(),
          name,
          props,
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
                  handleDragStart(e, item);
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
                <div className="imgBox"></div>
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
              onMouseEnter={() =>
                setContextMenu((p) => ({ ...p, submenu: "new" }))
              }
              onMouseLeave={() =>
                setContextMenu((p) => ({ ...p, submenu: null }))
              }
            >
              New ▶
              {contextMenu.submenu === "new" && (
                <div className="context-submenu">
                  <div
                    className="context-item"
                    onClick={(e) => {
                      e.stopPropagation();
                      createFolder();
                    }}
                  >
                    Folder
                  </div>
                </div>
              )}
            </div>

            <div className="context-item">Personalize</div>
          </div>
        )}
      </div>
    </>
  );
}

export default Desktop;
