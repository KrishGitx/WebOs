import { useState, useEffect, useRef } from "react";
import "./Window.css";
import { flushSync } from "react-dom";

function Window({
  app,
  apps,
  setActiveApp,
  activeApp,
  setActiveWindowId,
  activeWindowId,
}) {
  const ActiveApp = apps[app.name];

  console.log("APPSS:", activeApp);

  const bringToFront = (id) => {
    setActiveWindowId(id);
  };

  const [size, setSize] = useState({
    width: "300px",
    height: "200px",
  });
  const [Pos, setPos] = useState({
    top: "100px",
    left: "100px",
    right: "0px",
    bottom: "0px",
  });

  let [headerContent, setHeaderContent] = useState({});
  useEffect(() => {
    console.log("dsfdsf", headerContent);
  }, [headerContent]);
  const windowRef = useRef(null);
  const headerRef = useRef(null);

  const [isDragging, setIsDragging] = useState(false);
  const offsetRef = useRef({ x: 0, y: 0 });
  const [dropdownActive, setDropdownActive] = useState(false);

  useEffect(() => {
    const handleMouseDown = (e) => {
      if (!windowRef.current) return;

      setIsDragging(true);

      offsetRef.current = {
        x: e.clientX - windowRef.current.offsetLeft,
        y: e.clientY - windowRef.current.offsetTop,
      };
    };

    const handleMouseMove = (e) => {
      if (!isDragging || !windowRef.current) return;

      let newX = e.clientX - offsetRef.current.x;
      let newY = e.clientY - offsetRef.current.y;

      // 🔥 LIMITS
      const minX = 0; // taskbar width (left side)
      const maxX = window.innerWidth - windowRef.current.offsetWidth - 50;

      const minY = 0;
      const maxY = window.innerHeight - windowRef.current.offsetHeight;

      // ✅ Clamp
      newX = Math.max(minX, Math.min(newX, maxX));
      newY = Math.max(minY, Math.min(newY, maxY));

      // ✅ Apply
      windowRef.current.style.left = `${newX}px`;
      windowRef.current.style.top = `${newY}px`;
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    const header = headerRef.current;

    if (header) {
      header.addEventListener("mousedown", handleMouseDown);
    }

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      if (header) {
        header.removeEventListener("mousedown", handleMouseDown);
      }
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);
  const [headerOption, setHeaderOption] = useState(null);

  return (
    <div
      ref={windowRef}
      className="root-win"
      onMouseDown={() => bringToFront(app.id)}
      style={{
        position: "absolute",
        top: Pos.top,
        left: Pos.left,
        right: Pos.right,
        bottom: Pos.bottom,
        width: size.width,
        height: size.height,
        zIndex: app.id === activeWindowId ? 10 : 1,
      }}
    >
      <div
        ref={headerRef}
        className="win-header"
        onDoubleClick={() => {
          setSize({
            width: "400px",
            height: "400px",
          });
        }}
      >
        <div className="header-content">
          <div className="win-ico"> </div>
          <div className="h-cont">
            {Object.entries(headerContent).map(([key, value]) => (
              <div
                className="h-cont-btn"
                key={key}
                onMouseDown={() => setDropdownActive(key)}
              >
                {key}

                <div
                  className="h-cont-dropdown"
                  style={{
                    display: dropdownActive === key ? "block" : "none",
                  }}
                >
                  {value.map((drp) => (
                    <span
                      key={drp}
                      onClick={() => {
                        setHeaderOption(drp);
                      }}
                    >
                      {drp}
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
            onClick={() => {
              setActiveApp((prev) => prev.filter((a) => a.id !== app.id));
            }}
          >
            X
          </div>
          <div
            className="win-close"
            onClick={() => {
              setSize({
                width: "calc(100vw - 50px)", // 👈 leave space for right taskbar
                height: "100vh",
              });
              setPos({
                top: "0px",
                left: "0px",
                right: "0px",
                bottom: "0px",
              });
            }}
          >
            B
          </div>
          <div className="win-close">M</div>
        </div>
      </div>

      <div
        className="win-content"
        onClick={() => {
          setDropdownActive(false);
        }}
      >
        {ActiveApp && (
          <ActiveApp
            key={app.id}
            setHeaderContent={setHeaderContent}
            headerOption={headerOption}
          />
        )}
      </div>
    </div>
  );
}

export default Window;
