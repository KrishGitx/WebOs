import { useState, useEffect } from "react";
import "./Css/explorer.css";

const sidebarItems = [
  { label: "This PC", path: "/", icon: "🖥" },
  { label: "Documents", path: "C:/Documents", icon: "📋" },
  { label: "Downloads", path: "C:/Downloads", icon: "⬇" },
  { label: "Pictures", path: "C:/Pictures", icon: "🖼" },
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
  const [currentPath, setCurrentPath] = useState("/");
  const [history, setHistory] = useState(["/"]);
  const [files, setFiles] = useState([]);
  const [clipboard, setClipboard] = useState(null);
  const [ctxMenu, setCtxMenu] = useState(null);

  function getExtension(name) {
    return name.split(".").pop().toLowerCase();
  }

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

  async function pasteItem() {
    if (!clipboard) return;
    const fd = new FormData();
    const BASE = "C:/miniOS_storage";
    const drive = clipboard.item.path.split(":")[0];
    const srcPath = clipboard.item.path.replace(/^[A-Z]:\//, "");
    const destPath = currentPath.replace(/^[A-Z]:\//, "");
    const src = `${BASE}/${drive}/${srcPath}`;
    const dest = `${BASE}/${drive}/${destPath}/${clipboard.item.name}`;
    fd.append("src", src.replaceAll("\\", "/"));
    fd.append("dest", dest.replaceAll("\\", "/"));
    const endpoint = clipboard.mode === "copy" ? "copy.php" : "move.php";
    try {
      const res = await fetch(`http://localhost/miniOS/backend/${endpoint}`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (clipboard.mode === "cut") setClipboard(null);
      fetchFiles(currentPath);
      window.dispatchEvent(new CustomEvent("fs:update"));
    } catch (err) {
      console.error("Paste failed:", err);
    }
  }

  async function deleteItem(item) {
    if (!confirm(`Delete ${item.name}?`)) return;
    const fd = new FormData();
    fd.append("path", item.path);
    await fetch("http://localhost/miniOS/backend/delete.php", {
      method: "POST",
      body: fd,
    });
    fetchFiles(currentPath);
    window.dispatchEvent(new CustomEvent("fs:update"));
  }

  useEffect(() => {
    const fn = () => setCtxMenu(null);
    window.addEventListener("click", fn);
    return () => window.removeEventListener("click", fn);
  }, []);

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

  const navigate = (path) => {
    setHistory((h) => [...h, path]);
    setCurrentPath(path);
    onItemClick?.(null);
    onPathChange?.(path);
  };

  useEffect(() => {
    onPathChange?.(currentPath);
  }, []);

  const goBack = () => {
    if (history.length <= 1) return;
    const prev = history[history.length - 2];
    setHistory((h) => h.slice(0, -1));
    setCurrentPath(prev);
    onPathChange?.(prev);
  };

  const handleItemClick = (item) => {
    fetch("http://localhost/miniOS/backend/recent.php", {
      method: "POST",
      body: new URLSearchParams({ path: item.path }),
    });
    if (item.type === "folder" || item.type === "drive") {
      navigate(item.path);
    } else {
      if (isDialog && onItemClick) {
        onItemClick(item);
        return;
      }
      const ext = getExtension(item.name);
      const app = fileTypeMap[ext] || "notepad";
      openApp?.(app, { filePath: item.path });
    }
  };

  const isRoot = currentPath === "/" || currentPath === "";

  // breadcrumb segments
  const pathSegments = currentPath === "/"
    ? [{ label: "This PC", path: "/" }]
    : currentPath.split("/").filter(Boolean).reduce((acc, seg, i, arr) => {
        const path = arr.slice(0, i + 1).join("/");
        acc.push({ label: seg, path: i === 0 ? "/" : path });
        return acc;
      }, [{ label: "This PC", path: "/" }]);

  return (
    <div className="explorer">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span className="sidebar-logo-icon">◈</span>
          <span className="sidebar-logo-text">Files</span>
        </div>

        <div className="sidebar-section-label">Quick Access</div>
        {sidebarItems.map((item) => (
          <button
            key={item.label}
            className={`sidebar-item ${currentPath === item.path ? "active" : ""}`}
            onClick={() => navigate(item.path)}
          >
            <span className="sidebar-item-icon">{item.icon}</span>
            <span className="sidebar-item-label">{item.label}</span>
            {currentPath === item.path && <span className="sidebar-item-dot" />}
          </button>
        ))}

        {clipboard && (
          <div className="sidebar-clipboard">
            <span className="clipboard-badge">{clipboard.mode === "copy" ? "📋" : "✂"}</span>
            <span className="clipboard-name">{clipboard.item.name}</span>
          </div>
        )}
      </aside>

      {/* ── Main ── */}
      <main className="main">
        {/* Toolbar */}
        <div className="toolbar">
          <button className="toolbar-btn icon-btn" onClick={goBack} title="Back">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          <button className="toolbar-btn icon-btn" onClick={() => navigate(currentPath)} title="Refresh">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M12 7A5 5 0 1 1 7 2c1.5 0 2.8.6 3.8 1.6L13 2v4H9l1.5-1.5A3.5 3.5 0 1 0 10.5 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* Breadcrumb */}
          <div className="breadcrumb">
            {pathSegments.map((seg, i) => (
              <span key={seg.path} className="breadcrumb-group">
                {i > 0 && <span className="breadcrumb-sep">›</span>}
                <button
                  className={`breadcrumb-seg ${i === pathSegments.length - 1 ? "current" : ""}`}
                  onClick={() => navigate(seg.path)}
                >
                  {seg.label}
                </button>
              </span>
            ))}
          </div>

          <button
            className={`toolbar-btn paste-btn ${clipboard ? "has-clip" : ""}`}
            onClick={pasteItem}
            disabled={!clipboard}
          >
            {clipboard ? `Paste ${clipboard.mode === "copy" ? "copy" : "here"}` : "Paste"}
          </button>
        </div>

        {/* Content */}
        <div className="content-area">
          {isRoot && (
            <div className="drive-section">
              <div className="section-title">Storage</div>
              <div className="drive-grid">
                {files.map((item) => (
                  <div
                    key={item.path}
                    className="drive-tile"
                    onClick={() => handleItemClick(item)}
                  >
                    <div className="drive-tile-header">
                      <div className="drive-icon">💽</div>
                      <div className="drive-title">
                        Local Disk ({item.name.replace(":/", "")})
                      </div>
                    </div>
                    <div className="drive-bar">
                      <div
                        className="drive-fill"
                        style={{
                          width: `${item.used && item.total ? (item.used / item.total) * 100 : 50}%`,
                        }}
                      />
                    </div>
                    <div className="drive-label">
                      {item.used || 50} GB free of {item.total || 100} GB
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isRoot && files.length === 0 && (
            <div className="empty">
              <div className="empty-icon">📭</div>
              <div>This folder is empty</div>
            </div>
          )}

          {!isRoot && files.length > 0 && (
            <>
              <div className="content-header">
                <span className="content-count">{files.length} items</span>
              </div>
              <div className="file-grid">
                {files.map((item) => (
                  <div
                    key={item.path}
                    className={`file-item ${item.type === "folder" ? "is-folder" : ""} ${
                      selected?.path === item.path ? "selected" : ""
                    }`}
                    onClick={() => {
                      if (item.type === "folder" || item.type === "drive") {
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
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setCtxMenu({ x: e.clientX, y: e.clientY, item });
                    }}
                  >
                    <div className="file-icon-wrap">
                      <span className="file-icon">
                        {item.type === "folder" ? "📁" : "📄"}
                      </span>
                    </div>
                    <div className="file-name">{item.name}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Status bar */}
        <div className="status-bar">
          <span>{isRoot ? "This PC" : currentPath}</span>
          {clipboard && (
            <span className="status-clip">
              {clipboard.mode === "copy" ? "Copied" : "Cut"}: {clipboard.item.name}
            </span>
          )}
        </div>
      </main>

      {/* Context Menu */}
      {ctxMenu && (
        <div
          className="ctx-menu"
          style={{ top: ctxMenu.y, left: ctxMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          {[
            { label: "Copy", icon: "📋", action: () => setClipboard({ item: ctxMenu.item, mode: "copy" }) },
            { label: "Cut",  icon: "✂",  action: () => setClipboard({ item: ctxMenu.item, mode: "cut" }) },
            { label: "Delete", icon: "🗑", action: () => deleteItem(ctxMenu.item) },
          ].map(({ label, icon, action }) => (
            <div
              key={label}
              className={`ctx-item ${label === "Delete" ? "danger" : ""}`}
              onClick={() => { action(); setCtxMenu(null); }}
            >
              <span className="ctx-icon">{icon}</span>
              {label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}