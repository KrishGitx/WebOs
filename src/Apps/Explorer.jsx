import { useState, useEffect } from "react";
import "./Css/explorer.css";

const sidebarItems = [
  { label: "This PC", path: "/" },
  { label: "Documents", path: "C:/Documents" },
  { label: "Downloads", path: "C:/Downloads" },
  { label: "Pictures", path: "C:/Pictures" },
];

export default function Explorer({
  isDialog = false,
  onItemClick,
  onItemDoubleClick,
  openApp,
  selected,
  onPathChange,
  initialPath,
}) {
  async function fetchFiles(path) {
    try {
      const res = await fetch(
        `http://localhost/miniOS/backend/list.php?path=${path}`,
      );
      const data = await res.json();

      setFiles(data.items || []);
    } catch (err) {
      console.error(err);
    }
  }

  const [currentPath, setCurrentPath] = useState("/");
  const [history, setHistory] = useState(["/"]);
  const [files, setFiles] = useState([]);

  function getExtension(name) {
    return name.split(".").pop().toLowerCase();
  }
// add state at top of Explorer:
const [clipboard, setClipboard] = useState(null); // { item, mode: 'copy'|'cut' }
const [ctxMenu, setCtxMenu] = useState(null); // { x, y, item }

// close ctx menu on click
useEffect(() => {
  const fn = () => setCtxMenu(null);
  window.addEventListener("click", fn);
  return () => window.removeEventListener("click", fn);
}, []);

async function pasteItem() {
  if (!clipboard) return;
  const fd = new FormData();
  fd.append("src", clipboard.item.path);
  fd.append("dest", currentPath + "/" + clipboard.item.name);
  const endpoint = clipboard.mode === "copy" ? "copy.php" : "move.php";
  await fetch(`http://localhost/miniOS/backend/${endpoint}`, { method: "POST", body: fd });
  if (clipboard.mode === "cut") setClipboard(null);
  fetchFiles(currentPath);
  window.dispatchEvent(new CustomEvent("fs:update"));
}

async function deleteItem(item) {
  if (!confirm(`Delete ${item.name}?`)) return;
  const fd = new FormData();
  fd.append("path", item.path);
  await fetch("http://localhost/miniOS/backend/delete.php", { method: "POST", body: fd });
  fetchFiles(currentPath);
  window.dispatchEvent(new CustomEvent("fs:update"));
}
  useEffect(() => {
    if (initialPath) {
      setCurrentPath(initialPath);
      fetchFiles(initialPath);
    }
  }, [initialPath]);
  const fileTypeMap = {
    txt: "notepad",
    md: "notepad",

    png: "imageViewer",
    jpg: "imageViewer",
    jpeg: "imageViewer",
    webp: "imageViewer",

    pdf: "pdfViewer",
  };

  // 🔥 FETCH FILES
  useEffect(() => {
    fetch(`http://localhost/miniOS/backend/list.php?path=${currentPath}`)
      .then((res) => res.json())
      .then((data) => {
        const list = data.items || data.drives || [];
        setFiles(list);
      })
      .catch((err) => {
        console.error(err);
        setFiles([]);
      });
  }, [currentPath]);

  // 🔥 NAVIGATION
  const navigate = (path) => {
    setHistory((h) => [...h, path]);
    setCurrentPath(path);
    onItemClick?.(null);

    onPathChange?.(path); // 🔥 notify parent
  };

  useEffect(() => {
    onPathChange?.(currentPath);
  }, []);

  const goBack = () => {
    if (history.length <= 1) return;
    const prev = history[history.length - 2];
    setHistory((h) => h.slice(0, -1));
    setCurrentPath(prev);

    onPathChange?.(prev); // 🔥 ADD THIS
  };

  // 🔥 CLICK HANDLER
  const handleItemClick = (item) => {
    if (item.type === "folder" || item.type === "drive") {
      navigate(item.path);
    } else {
      if (isDialog && onItemClick) {
        onItemClick(item);
        return;
      }

      const ext = getExtension(item.name);

      const app = fileTypeMap[ext] || "notepad"; // fallback

      openApp?.(app, { filePath: item.path });
    }
  };

  const isRoot = currentPath === "/" || currentPath === "";

  return (
    <div className="explorer">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-title">⊞ Quick Access</div>
        {sidebarItems.map((item) => (
          <button
            key={item.label}
            className={`sidebar-item ${
              currentPath === item.path ? "active" : ""
            }`}
            onClick={() => navigate(item.path)}
          >
            {item.label}
          </button>
        ))}
      </aside>

      {/* MAIN */}
      <main className="main">
        {/* TOOLBAR */}
        <div className="toolbar">
          <button onClick={goBack}>← Back</button>
          <span>{currentPath}</span>
        </div>

        <div className="content-area">
          {/* 🟦 ROOT → DRIVES */}
          {isRoot && (
            <div className="drive-section">
              <div className="section-title">Devices and drives</div>

              <div className="drive-grid">
                {files.map((item) => (
                  <div
                    key={item.path}
                    className="drive-tile"
                    onClick={() => handleItemClick(item)}
                  >
                    <div className="drive-icon">💽</div>

                    <div className="drive-content">
                      <div className="drive-title">
                        Local Disk ({item.name.replace(":/", "")})
                      </div>

                      <div className="drive-bar">
                        <div
                          className="drive-fill"
                          style={{
                            width: `${
                              item.used && item.total
                                ? (item.used / item.total) * 100
                                : 50
                            }%`,
                          }}
                        />
                      </div>

                      <div className="drive-label">
                        {item.used || 50} GB free of {item.total || 100} GB
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 🟨 EMPTY */}
          {!isRoot && files.length === 0 && (
            <div className="empty">This folder is empty.</div>
          )}

          {/* 🟩 FILES / FOLDERS */}
          {!isRoot && files.length > 0 && (
            <div className="file-grid">
              {files.map((item) => (
                <div
                  key={item.path}
                  className={`file-item ${
                    item.type === "folder" ? "is-folder" : ""
                  } ${selected?.path === item.path ? "selected" : ""}`}
                  onClick={() => {
                    if (item.type === "folder" || item.type === "drive") {
                      // handleItemClick(item); // navigation is fine on single click
                    } else if (isDialog) {
                      if (selected?.path === item.path) {
                        onItemClick?.(null);
                      } else {
                        onItemClick?.(item);
                      }
                    }
                  }}
                  onDoubleClick={() => {
                    if (isDialog) {
                      onItemDoubleClick?.(item);
                    } else {
                      handleItemClick(item);
                    }
                  }}
                >
                  <div className="file-icon">
                    {item.type === "folder" ? "📁" : "📄"}
                  </div>
                  <div className="file-name">{item.name}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
