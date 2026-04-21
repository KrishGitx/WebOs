import { useState, useEffect, useRef } from "react";
import "./Css/imageViewer.css";

function ImageViewer({
  filePath,
  setHeaderContent,
  headerOption,
  closeWindow,
}) {
  const [zoom, setZoom] = useState(1);
  const [imgSrc, setImgSrc] = useState("");
  const startPosRef = useRef({ x: 0, y: 0 });

  const [pos, setPos] = useState({ x: 0, y: 0 });

  const imgRef = useRef(null);
  const isDraggingRef = useRef(false);
  const offsetRef = useRef({ x: 0, y: 0 });

  // 🔥 TEMP IMAGE
  useEffect(() => {
    setImgSrc("/test.jpg");
  }, []);

  // 🧠 Header
  useEffect(() => {
    setHeaderContent({
      File: ["Close"],
      View: ["Zoom In", "Zoom Out", "Reset Zoom"],
    });
  }, []);

  // 🎮 Menu actions
  useEffect(() => {
    if (!headerOption) return;

    switch (headerOption) {
      case "Zoom In":
        setZoom((z) => Math.min(z + 0.2, 5));
        break;

      case "Zoom Out":
        setZoom((z) => Math.max(z - 0.2, 0.2));
        break;

      case "Reset Zoom":
        setZoom(1);
        setPos({ x: 0, y: 0 });
        break;

      case "Close":
        closeWindow?.();
        break;
    }
  }, [headerOption]);

  // 🖱️ Ctrl + Scroll Zoom
  useEffect(() => {
    const handleWheel = (e) => {
      if (!e.ctrlKey) return;

      e.preventDefault();

      if (e.deltaY < 0) {
        setZoom((z) => Math.min(z + 0.1, 5));
      } else {
        setZoom((z) => Math.max(z - 0.1, 0.2));
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      window.removeEventListener("wheel", handleWheel);
    };
  }, []);

  // 🖐️ DRAG
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDraggingRef.current) return;

      const dx = e.clientX - offsetRef.current.x;
      const dy = e.clientY - offsetRef.current.y;

      setPos({
        x: startPosRef.current.x + dx,
        y: startPosRef.current.y + dy,
      });
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const handleMouseDown = (e) => {
    e.preventDefault();
    if (zoom <= 1) return;

    isDraggingRef.current = true;

    startPosRef.current = { ...pos };

    offsetRef.current = {
      x: e.clientX,
      y: e.clientY,
    };
  };

  return (
    <div className="img-viewer-root">
      {" "}
      <div className="img-container">
        <img
          ref={imgRef}
          src={imgSrc}
          alt="preview"
          onMouseDown={handleMouseDown}
          style={{
            transform: `translate(-50%, -50%) translate(${pos.x}px, ${pos.y}px) scale(${zoom})`,
            cursor: zoom > 1 ? "grab" : "default",
          }}
          draggable={false}
        />{" "}
      </div>{" "}
    </div>
  );
}

export default ImageViewer;
