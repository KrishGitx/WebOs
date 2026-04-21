import { useState } from "react";
import "./desktop.css";
import wallpaper from "./assets/1.jpg";
import Tb from "./Taskbar.jsx";
import Window from "./Window.jsx";
import Notepad from "./Apps/Notepad.jsx";
import Settings from "./Apps/Settings.jsx";
import ThisPC from "./Apps/Explorer.jsx";
import FileDialog from "./Utility/FileDialog.jsx";
import ImageViewer from "./Apps/ImageViewer.jsx";
import Paint from "./Apps/Paint.jsx";

function Desktop() {
  const [activeWindowId, setActiveWindowId] = useState(null);

  let isOpened = true;

  const [zCounter, setZCounter] = useState(1);
  const [activeApp, setActiveApp] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);

  const apps = {
    notepad: Notepad,
    settings: Settings,
    thispc: ThisPC,
    fileDialog: FileDialog,
    imageViewer: ImageViewer,
    paint: Paint,
  };

  function openApp(name, props = {}) {
    setZCounter((prevZ) => prevZ + 1);
    setActiveApp((prev) => [
      ...prev,
      {
        id: Date.now(),
        name,
        props,
        zIndex: zCounter + 1,
      },
    ]);
  }

  function bringToFront(id) {
    setZCounter((prevZ) => {
      const newZ = prevZ + 1;

      setActiveApp((prev) => {
        const updated = [...prev];
        const target = updated.find((a) => a.id === id);

        if (target) {
          target.zIndex = newZ;
        }

        return updated;
      });

      return newZ;
    });
  }

  let desktopApps = ["notepad", "settings", "thispc", "paint"]; //Fetch From backend

  return (
    <>
      <Tb
        activeApp={activeApp}
        openApp={openApp}
        bringToFront={bringToFront}
        taskbarApps={desktopApps}
        allApps={apps}
      />

      {activeApp &&
        activeApp.map((appx) => (
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
        <div className="main-area" onClick={() => setSelectedApp(null)}>
          <div className="icons-pack">
            {desktopApps.map((app, key) => (
              <div
                className={`ico-box ${selectedApp === app ? "selected" : ""}`}
                key={key}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedApp(app);
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  openApp(app);
                  setSelectedApp(null);
                }}
              >
                <div className="imgBox"></div>
                <div className="ico-txt">{app}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
export default Desktop;
