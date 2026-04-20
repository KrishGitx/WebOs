import { useEffect, useState } from "react";
import Explorer from "../Apps/Explorer";
import "./filedialog.css";

export default function FileDialog({ mode, onSelect, closeWindow }) {
  const [selected, setSelected] = useState(null);
  const [fileName, setFileName] = useState();
  const [currentPath, setCurrentPath] = useState("C:/");
    useEffect(()=>{
        console.log("pathfsdfsd:", currentPath);
    },[currentPath]);
  return (
    <div className="dialog-wrapper">
      {/* Explorer reused */}
      <Explorer
        isDialog={true}
        selected={selected}
        onPathChange={(path) => setCurrentPath(path)}
        onItemClick={(item) => {
          setSelected(item);
        }}
        onItemDoubleClick={(item) => {
          if (item.type === "folder" || item.type === "drive") return;

          if (mode === "open") {
            onSelect(item.path);
            closeWindow();
          }
        }}
      />

      {/* 🔥 FOOTER */}
      <div className="dialog-footer">
        <div className="dialog-info">
          {mode === "save"
            ? selected
              ? `Save in: ${selected.name}`
              : "Choose a folder to save"
            : selected
              ? selected.name
              : "No file selected"}
        </div>

        <div className="dialog-actions">
          <button onClick={closeWindow}>Cancel</button>

          {mode === "open" && (
            <button
              disabled={!selected}
              onClick={() => {
                if (!selected) return;
                onSelect(selected.path);
                closeWindow();
              }}
            >
              Open
            </button>
          )}
          {mode === "save" && (
            <>
              <input
                placeholder="Enter file name"
                value={fileName || ""}
                onChange={(e) => setFileName(e.target.value)}
              />

              <button
                onClick={() => {
                  // 🔥 base path logic
                  let basePath;

                  // selected takes priority
                  if (selected) {
                    if (
                      selected.type === "folder" ||
                      selected.type === "drive"
                    ) {
                      basePath = selected.path;
                    } else {
                      basePath = selected.path.substring(
                        0,
                        selected.path.lastIndexOf("/"),
                      );
                    }
                  } else {
                    basePath = currentPath;
                  }

                  // 🔥 FIX ROOT CASE
                  if (!basePath || basePath === "/") {
                    basePath = "C:/";
                  }

                  let name = fileName || "newfile";

                  if (!name.endsWith(".txt")) {
                    name += ".txt";
                  }

                  const fullPath = `${basePath}/${name}`;

                  console.log("Saving to:", fullPath);

                  onSelect(fullPath);
                  closeWindow();
                }}
              >
                Save
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
