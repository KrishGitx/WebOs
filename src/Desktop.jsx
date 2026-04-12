import { useState } from "react";
import "./desktop.css";
import wallpaper from "./assets/1.jpg";
import Tb from "./Taskbar.jsx";
import Window from "./Window.jsx";
import Notepad from "./Apps/Notepad.jsx";
import Settings from "./Apps/Settings.jsx";

function Desktop() {
  const [activeWindowId, setActiveWindowId] = useState(null);

  function onIconClick(app) {
    setActiveApp((prevApps) => [
      ...prevApps,
      { id: Date.now(), name: app}, // 👈 example structure
    ]);
  }

  let isOpened = true;

  const [activeApp, setActiveApp] = useState([]);

  const apps = {
    notepad: Notepad,
    settings: Settings,
  };

  let desktopApps = ["notepad", "settings"];

  return (
    <>
      <Tb />

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
          />
        ))}
      <div className="desktop-root">
        <div className="main-area">
          <div className="icons-pack">
            {desktopApps.map((app,key) =>(

              <div className="ico-box" key={key}>
                <div className="imgBox" onClick={() => onIconClick(app)}>
                  ,
                </div>
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
