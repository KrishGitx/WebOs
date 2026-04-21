import { useState, useEffect, useRef } from "react";
import "./Window.css";

function Window({ app, apps, setActiveApp, openApp, bringToFront }) {
  const ActiveApp = apps[app.name];

  const windowRef = useRef(null);
  const headerRef = useRef(null);

  // 🪟 Size & Position
  const [size, setSize] = useState({
    width: "700px",
    height: "700px",
  });

  const [pos, setPos] = useState({
    top: "100px",
    left: "100px",
  });

  const [isMaximized, setIsMaximized] = useState(false);

  // 🔁 Header
  const [headerContent, setHeaderContent] = useState({});
  const [headerOption, setHeaderOption] = useState(null);
  const [dropdownActive, setDropdownActive] = useState(false);

  // 🖱️ Drag
  const isDraggingRef = useRef(false);
  const offsetRef = useRef({ x: 0, y: 0 });

  // 🔧 Resize
  const isResizingRef = useRef(false);
  const resizeDirRef = useRef(null);

  // =========================
  // 🟢 DRAG SYSTEM
  // =========================
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!windowRef.current || !isDraggingRef.current) return;

      let newX = e.clientX - offsetRef.current.x;
      let newY = e.clientY - offsetRef.current.y;

      const maxX = window.innerWidth - windowRef.current.offsetWidth - 50;
      const maxY = window.innerHeight - windowRef.current.offsetHeight;

      newX = Math.max(0, Math.min(newX, maxX));
      newY = Math.max(0, Math.min(newY, maxY));

      windowRef.current.style.left = `${newX}px`;
      windowRef.current.style.top = `${newY}px`;
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    const header = headerRef.current;

    const handleMouseDown = (e) => {
      if (!windowRef.current) return;

      isDraggingRef.current = true;

      offsetRef.current = {
        x: e.clientX - windowRef.current.offsetLeft,
        y: e.clientY - windowRef.current.offsetTop,
      };
    };

    header?.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      header?.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  // =========================
  // 🟢 RESIZE SYSTEM
  // =========================
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!windowRef.current || isMaximized) return;

      if (isResizingRef.current) {
        const rect = windowRef.current.getBoundingClientRect();

        let newWidth = rect.width;
        let newHeight = rect.height;

        if (resizeDirRef.current === "right") {
          newWidth = e.clientX - rect.left;
        }

        if (resizeDirRef.current === "bottom") {
          newHeight = e.clientY - rect.top;
        }

        if (resizeDirRef.current === "corner") {
          newWidth = e.clientX - rect.left;
          newHeight = e.clientY - rect.top;
        }

        // min
        newWidth = Math.max(300, newWidth);
        newHeight = Math.max(200, newHeight);

        // max (prevent taskbar overflow)
        const maxWidth = window.innerWidth - rect.left - 50;
        const maxHeight = window.innerHeight - rect.top;

        newWidth = Math.min(newWidth, maxWidth);
        newHeight = Math.min(newHeight, maxHeight);

        setSize({
          width: `${newWidth}px`,
          height: `${newHeight}px`,
        });
      }
    };

    const handleMouseUp = () => {
      isResizingRef.current = false;
      resizeDirRef.current = null;
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isMaximized]);

  // =========================
  // 🟢 MAXIMIZE / RESTORE
  // =========================
  const toggleMaximize = () => {
    if (!isMaximized) {
      setSize({
        width: "calc(100vw - 50px)",
        height: "100vh",
      });
      setPos({ top: "0px", left: "0px" });
      setIsMaximized(true);
    } else {
      setSize({
        width: "600px",
        height: "600px",
      });
      setPos({ top: "100px", left: "100px" });
      setIsMaximized(false);
    }
  };

  return (
    <div
      ref={windowRef}
      className="root-win"
      onMouseDown={() => bringToFront(app.id)}
      style={{
        position: "absolute",
        top: pos.top,
        left: pos.left,
        width: size.width,
        height: size.height,
        zIndex: app.zIndex,
      }}
    >
      {/* HEADER */}{" "}
      <div
        ref={headerRef}
        className="win-header"
        onDoubleClick={toggleMaximize}
      >
        {" "}
        <div className="header-content">
          {" "}
          <div className="win-ico" />{" "}
          <div className="h-cont">
            {Object.entries(headerContent).map(([key, value]) => (
              <div
                key={key}
                className="h-cont-btn"
                onMouseDown={() => setDropdownActive(key)}
              >
                {key}
                ```
                <div
                  className="h-cont-dropdown"
                  style={{
                    display: dropdownActive === key ? "block" : "none",
                  }}
                >
                  {value.map((opt) => (
                    <span
                      key={opt}
                      onClick={() => {
                        setHeaderOption(opt);
                        setDropdownActive(false);
                      }}
                    >
                      {opt}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="win-opts">
          <div
            className="win-close"
            onClick={() =>
              setActiveApp((prev) => prev.filter((a) => a.id !== app.id))
            }
          >
            X
          </div>

          <div className="win-close" onClick={toggleMaximize}>
            B
          </div>

          <div className="win-close">M</div>
        </div>
      </div>
      {/* CONTENT */}
      <div className="win-content" onClick={() => setDropdownActive(false)}>
        {ActiveApp && (
          <ActiveApp
            {...app.props}
            setHeaderContent={setHeaderContent}
            headerOption={headerOption}
            openApp={openApp}
            closeWindow={() =>
              setActiveApp((prev) => prev.filter((a) => a.id !== app.id))
            }
          />
        )}
      </div>
      {/* RESIZE HANDLES */}
      <div
        className="resize-handle right"
        onMouseDown={() => {
          isResizingRef.current = true;
          resizeDirRef.current = "right";
        }}
      />
      <div
        className="resize-handle bottom"
        onMouseDown={() => {
          isResizingRef.current = true;
          resizeDirRef.current = "bottom";
        }}
      />
      <div
        className="resize-handle corner"
        onMouseDown={() => {
          isResizingRef.current = true;
          resizeDirRef.current = "corner";
        }}
      />
    </div>
  );
}

export default Window;
