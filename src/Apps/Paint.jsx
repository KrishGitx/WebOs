import { useEffect, useRef, useState, useCallback } from "react";

/* ─────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────── */
const PALETTE = [
  "#FFFFFF",
  "#C8C8C8",
  "#888888",
  "#3c3c3c",
  "#1a1a1a",
  "#000000",
  "#FF4136",
  "#FF851B",
  "#FFDC00",
  "#2ECC40",
  "#0074D9",
  "#7B42F5",
  "#FF69B4",
  "#FF6B6B",
  "#FFA07A",
  "#FFD700",
  "#90EE90",
  "#87CEEB",
  "#DDA0DD",
  "#F0E68C",
  "#20B2AA",
  "#4682B4",
  "#CD853F",
  "#8B4513",
];

const TOOLS = {
  BRUSH: "brush",
  ERASER: "eraser",
  RECT: "rect",
  ELLIPSE: "ellipse",
  FILL: "fill",
  EYEDROPPER: "eyedropper",
  LINE: "line",
};

const CURSOR_MAP = {
  [TOOLS.BRUSH]: "crosshair",
  [TOOLS.ERASER]: "cell",
  [TOOLS.RECT]: "crosshair",
  [TOOLS.ELLIPSE]: "crosshair",
  [TOOLS.FILL]: "cell",
  [TOOLS.EYEDROPPER]: "copy",
  [TOOLS.LINE]: "crosshair",
};

/* ─────────────────────────────────────────────
   FLOOD FILL UTILITY
───────────────────────────────────────────── */
function floodFill(ctx, startX, startY, fillColor) {
  const canvas = ctx.canvas;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const idx = (y, x) => (y * canvas.width + x) * 4;

  const sr = data[idx(startY, startX)];
  const sg = data[idx(startY, startX) + 1];
  const sb = data[idx(startY, startX) + 2];
  const sa = data[idx(startY, startX) + 3];

  const [fr, fg, fb] = fillColor.match(/\w\w/g).map((h) => parseInt(h, 16));

  if (sr === fr && sg === fg && sb === fb) return;

  const match = (i) =>
    Math.abs(data[i] - sr) < 32 &&
    Math.abs(data[i + 1] - sg) < 32 &&
    Math.abs(data[i + 2] - sb) < 32 &&
    Math.abs(data[i + 3] - sa) < 32;

  const stack = [[startX, startY]];
  const visited = new Uint8Array(canvas.width * canvas.height);

  while (stack.length) {
    const [x, y] = stack.pop();
    if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) continue;
    const vidx = y * canvas.width + x;
    if (visited[vidx]) continue;
    visited[vidx] = 1;
    const i = idx(y, x);
    if (!match(i)) continue;
    data[i] = fr;
    data[i + 1] = fg;
    data[i + 2] = fb;
    data[i + 3] = 255;
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
  ctx.putImageData(imageData, 0, 0);
}

/* ─────────────────────────────────────────────
   HEX → RGB STRING
───────────────────────────────────────────── */
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${r},${g},${b})`;
}

/* ─────────────────────────────────────────────
   TOOL ICONS (inline SVG strings)
───────────────────────────────────────────── */
const Icons = {
  brush: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h3.5" />
      <path d="M10.5 21H14c.75 0 1.5-.5 1.5-1.5v-4c0-1-.5-1.5-1.5-1.5h-3.5" />
      <circle cx="20" cy="4" r="2" />
      <path d="M15 9l5-5" />
    </svg>
  ),
  eraser: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" />
      <path d="M22 21H7" />
      <path d="m5 11 9 9" />
    </svg>
  ),
  rect: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
    </svg>
  ),
  ellipse: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <ellipse cx="12" cy="12" rx="10" ry="6" />
    </svg>
  ),
  fill: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="m19 11-8-8-8.5 8.5a5.5 5.5 0 0 0 7.78 7.78L19 11Z" />
      <path d="m19 11 2 2a2.83 2.83 0 0 1 0 4h0a2.83 2.83 0 0 1-4 0l-2-2" />
    </svg>
  ),
  eyedropper: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="m2 22 1-1h3l9-9" />
      <path d="M3 21v-3l9-9" />
      <path d="m15 6 3.4-3.4a2.1 2.1 0 1 1 3 3L18 9l.4.4a2.1 2.1 0 1 1-3 3l-3.8-3.8Z" />
    </svg>
  ),
  line: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <line x1="5" y1="19" x2="19" y2="5" />
    </svg>
  ),
  undo: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M3 7v6h6" />
      <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
    </svg>
  ),
  redo: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M21 7v6h-6" />
      <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13" />
    </svg>
  ),
  trash: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <polyline points="3,6 5,6 21,6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  ),
  zoomin: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="11" y1="8" x2="11" y2="14" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  ),
  zoomout: (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  ),
};

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
export default function Paint({ setHeaderContent, headerOption, openApp }) {
  const canvasRef = useRef(null);
  const overlayRef = useRef(null);
  const containerRef = useRef(null);

  const [tool, setTool] = useState(TOOLS.BRUSH);
  const [color, setColor] = useState("#FFFFFF");
  const [brushSize, setBrushSize] = useState(6);
  const [opacity, setOpacity] = useState(100);
  const [zoom, setZoom] = useState(1);
  const [canvasSize] = useState({ w: 1200, h: 800 });

  const undoStack = useRef([]);
  const redoStack = useRef([]);
  const isDrawing = useRef(false);
  const lastPos = useRef(null);
  const shapeStart = useRef(null);
  const currentPath = useRef([]);

  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [showCursorPreview, setShowCursorPreview] = useState(false);
  const [statusText, setStatusText] = useState("Ready");
  const [currentFilePath, setCurrentFilePath] = useState(null);

  /* ── canvas context helper ── */
  const getCtx = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");
    ctx.globalAlpha = opacity / 100;
    return ctx;
  }, [opacity]);

  /* ── init canvas ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = canvasSize.w;
    canvas.height = canvasSize.h;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#1e1e1e";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveSnapshot();
  }, []);

  /* ── header menu ── */
  useEffect(() => {
    if (!setHeaderContent) return;
    setHeaderContent({
      File: ["New", "Open", "Save", "Save As", "---", "Exit"],
      Edit: ["Undo", "Redo", "---", "Clear Canvas"],
      Tools: [
        "Brush",
        "Eraser",
        "Rectangle",
        "Ellipse",
        "Fill",
        "Eyedropper",
        "Line",
      ],
      View: ["Zoom In", "Zoom Out", "Reset Zoom"],
    });
  }, [setHeaderContent]);

  /* ── handle header option ── */
  useEffect(() => {
    if (!headerOption) return;
    const opt = headerOption.trim().toLowerCase();
    if (opt === "new") newCanvas();
    else if (opt === "save") handleSave(false);
    else if (opt === "save as") handleSave(true);
    else if (opt === "undo") undo();
    else if (opt === "redo") redo();
    else if (opt === "clear canvas") clearCanvas();
    else if (opt === "brush") setTool(TOOLS.BRUSH);
    else if (opt === "eraser") setTool(TOOLS.ERASER);
    else if (opt === "rectangle") setTool(TOOLS.RECT);
    else if (opt === "ellipse") setTool(TOOLS.ELLIPSE);
    else if (opt === "fill") setTool(TOOLS.FILL);
    else if (opt === "eyedropper") setTool(TOOLS.EYEDROPPER);
    else if (opt === "line") setTool(TOOLS.LINE);
    else if (opt === "zoom in") setZoom((z) => Math.min(z + 0.25, 4));
    else if (opt === "zoom out") setZoom((z) => Math.max(z - 0.25, 0.25));
    else if (opt === "reset zoom") setZoom(1);
  }, [headerOption]);

  /* ── keyboard shortcuts ── */
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "y") {
        e.preventDefault();
        redo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave(false);
      }
      if (e.key === "b") setTool(TOOLS.BRUSH);
      if (e.key === "e") setTool(TOOLS.ERASER);
      if (e.key === "r") setTool(TOOLS.RECT);
      if (e.key === "o") setTool(TOOLS.ELLIPSE);
      if (e.key === "f") setTool(TOOLS.FILL);
      if (e.key === "i") setTool(TOOLS.EYEDROPPER);
      if (e.key === "l") setTool(TOOLS.LINE);
      if (e.key === "[") setBrushSize((s) => Math.max(1, s - 2));
      if (e.key === "]") setBrushSize((s) => Math.min(100, s + 2));
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  /* ── snapshot management ── */
  const saveSnapshot = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    undoStack.current.push(canvas.toDataURL());
    if (undoStack.current.length > 50) undoStack.current.shift();
    redoStack.current = [];
  }, []);

  const restoreSnapshot = useCallback((dataUrl) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      ctx.globalAlpha = 1;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
    img.src = dataUrl;
  }, []);

  const undo = useCallback(() => {
    if (undoStack.current.length <= 1) return;
    const current = undoStack.current.pop();
    redoStack.current.push(current);
    restoreSnapshot(undoStack.current[undoStack.current.length - 1]);
    setStatusText("Undo");
  }, [restoreSnapshot]);

  const redo = useCallback(() => {
    if (!redoStack.current.length) return;
    const snap = redoStack.current.pop();
    undoStack.current.push(snap);
    restoreSnapshot(snap);
    setStatusText("Redo");
  }, [restoreSnapshot]);

  /* ── canvas actions ── */
  const newCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#1e1e1e";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveSnapshot();
    setCurrentFilePath(null);
    setStatusText("New canvas");
  };

  const clearCanvas = () => {
    saveSnapshot();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#1e1e1e";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveSnapshot();
    setStatusText("Cleared");
  };

  /* ── save ── */
  const handleSave = (saveAs = false) => {
    if (!saveAs && currentFilePath) {
      doSave(currentFilePath);
    } else {
      if (openApp) {
        openApp("fileDialog", {
          mode: "save",
          defaultExt: ".png",
          onSelect: (path) => {
            const finalPath = path.replace(/\.[^/.]+$/, "") + ".png";
            doSave(finalPath);
            setCurrentFilePath(finalPath);
          },
        });
      } else {
        // fallback: download
        const link = document.createElement("a");
        link.download = "painting.png";
        link.href = canvasRef.current.toDataURL("image/png");
        link.click();
        setStatusText("Downloaded");
      }
    }
  };

  const doSave = async (path) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setStatusText("Saving…");
    try {
      const blob = await new Promise((res) => canvas.toBlob(res, "image/png"));
      const fd = new FormData();
      fd.append("path", path);
      fd.append("content", blob, "painting.png");
      const res = await fetch("http://localhost/miniOS/backend/saveImage.php", {
        method: "POST",
        body: fd,
      });
      if (res.ok) {
        setCurrentFilePath(path);
        setStatusText(`Saved: ${path}`);
      } else {
        setStatusText("Save failed");
      }
    } catch {
      setStatusText("Save error");
    }
  };

  /* ── coordinate helper ── */
  const getCanvasPos = useCallback(
    (e) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      return {
        x: (e.clientX - rect.left) / zoom,
        y: (e.clientY - rect.top) / zoom,
      };
    },
    [zoom],
  );

  /* ── drawing helpers ── */
  const setupCtx = (ctx) => {
    if (tool === TOOLS.ERASER) {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = "#1e1e1e";
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = color;
    }
    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.globalAlpha = opacity / 100;
  };

  /* ── mouse events ── */
  const onMouseDown = useCallback(
    (e) => {
      if (e.button !== 0) return;
      const pos = getCanvasPos(e);
      isDrawing.current = true;
      lastPos.current = pos;
      shapeStart.current = pos;
      currentPath.current = [pos];

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      if (tool === TOOLS.FILL) {
        saveSnapshot();
        const hex = color.replace("#", "");
        floodFill(ctx, Math.floor(pos.x), Math.floor(pos.y), hex);
        saveSnapshot();
        isDrawing.current = false;
        return;
      }

      if (tool === TOOLS.EYEDROPPER) {
        const pixel = ctx.getImageData(
          Math.floor(pos.x),
          Math.floor(pos.y),
          1,
          1,
        ).data;
        const hex =
          "#" +
          [pixel[0], pixel[1], pixel[2]]
            .map((v) => v.toString(16).padStart(2, "0"))
            .join("");
        setColor(hex);
        setTool(TOOLS.BRUSH);
        isDrawing.current = false;
        setStatusText(`Color picked: ${hex}`);
        return;
      }

      if (tool === TOOLS.BRUSH || tool === TOOLS.ERASER) {
        saveSnapshot();
        setupCtx(ctx);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
      }

      if (
        tool === TOOLS.RECT ||
        tool === TOOLS.ELLIPSE ||
        tool === TOOLS.LINE
      ) {
        saveSnapshot();
      }
    },
    [tool, color, brushSize, opacity, getCanvasPos, saveSnapshot],
  );

  const onMouseMove = useCallback(
    (e) => {
      const pos = getCanvasPos(e);
      setCursorPos({ x: Math.floor(pos.x), y: Math.floor(pos.y) });

      if (!isDrawing.current) return;

      const canvas = canvasRef.current;
      const overlay = overlayRef.current;
      const ctx = canvas.getContext("2d");

      if (tool === TOOLS.BRUSH || tool === TOOLS.ERASER) {
        setupCtx(ctx);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        lastPos.current = pos;
        return;
      }

      if (
        tool === TOOLS.RECT ||
        tool === TOOLS.ELLIPSE ||
        tool === TOOLS.LINE
      ) {
        const ov = overlay.getContext("2d");
        ov.clearRect(0, 0, overlay.width, overlay.height);
        ov.globalAlpha = opacity / 100;
        ov.strokeStyle = color;
        ov.lineWidth = brushSize;
        ov.lineCap = "round";
        ov.lineJoin = "round";
        const sx = shapeStart.current.x;
        const sy = shapeStart.current.y;
        const w = pos.x - sx;
        const h = pos.y - sy;

        if (tool === TOOLS.RECT) {
          ov.beginPath();
          ov.strokeRect(sx, sy, w, h);
        } else if (tool === TOOLS.ELLIPSE) {
          ov.beginPath();
          ov.ellipse(
            sx + w / 2,
            sy + h / 2,
            Math.abs(w / 2),
            Math.abs(h / 2),
            0,
            0,
            2 * Math.PI,
          );
          ov.stroke();
        } else if (tool === TOOLS.LINE) {
          ov.beginPath();
          ov.moveTo(sx, sy);
          ov.lineTo(pos.x, pos.y);
          ov.stroke();
        }
      }
    },
    [tool, color, brushSize, opacity, getCanvasPos],
  );

  const onMouseUp = useCallback(
    (e) => {
      if (!isDrawing.current) return;
      isDrawing.current = false;

      const canvas = canvasRef.current;
      const overlay = overlayRef.current;
      const ctx = canvas.getContext("2d");
      const ov = overlay.getContext("2d");

      if (
        tool === TOOLS.RECT ||
        tool === TOOLS.ELLIPSE ||
        tool === TOOLS.LINE
      ) {
        ctx.drawImage(overlay, 0, 0);
        ov.clearRect(0, 0, overlay.width, overlay.height);
        saveSnapshot();
      } else if (tool === TOOLS.BRUSH || tool === TOOLS.ERASER) {
        ctx.globalAlpha = 1;
      }
      setStatusText(`${cursorPos.x}, ${cursorPos.y}px`);
    },
    [tool, saveSnapshot, cursorPos],
  );

  /* ─────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────── */
  return (
    <div style={styles.root}>
      {/* ── SIDEBAR ── */}
      <aside style={styles.sidebar}>
        {/* Tool buttons */}
        <div style={styles.toolSection}>
          <span style={styles.sectionLabel}>TOOLS</span>
          <div style={styles.toolGrid}>
            {[
              { id: TOOLS.BRUSH, icon: Icons.brush, label: "Brush (B)" },
              { id: TOOLS.ERASER, icon: Icons.eraser, label: "Eraser (E)" },
              { id: TOOLS.LINE, icon: Icons.line, label: "Line (L)" },
              { id: TOOLS.RECT, icon: Icons.rect, label: "Rectangle (R)" },
              { id: TOOLS.ELLIPSE, icon: Icons.ellipse, label: "Ellipse (O)" },
              { id: TOOLS.FILL, icon: Icons.fill, label: "Fill (F)" },
              {
                id: TOOLS.EYEDROPPER,
                icon: Icons.eyedropper,
                label: "Eyedropper (I)",
              },
            ].map(({ id, icon, label }) => (
              <button
                key={id}
                title={label}
                onClick={() => setTool(id)}
                style={{
                  ...styles.toolBtn,
                  ...(tool === id ? styles.toolBtnActive : {}),
                }}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>

        <div style={styles.divider} />

        {/* Brush size */}
        <div style={styles.toolSection}>
          <span style={styles.sectionLabel}>
            SIZE <span style={styles.valLabel}>{brushSize}px</span>
          </span>
          <input
            type="range"
            min="1"
            max="100"
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            style={styles.slider}
          />
          {/* Preview dot */}
          <div style={styles.brushPreviewWrap}>
            <div
              style={{
                ...styles.brushPreview,
                width: Math.min(brushSize, 60),
                height: Math.min(brushSize, 60),
                background: tool === TOOLS.ERASER ? "#333" : color,
                borderRadius: "50%",
              }}
            />
          </div>
        </div>

        <div style={styles.divider} />

        {/* Opacity */}
        <div style={styles.toolSection}>
          <span style={styles.sectionLabel}>
            OPACITY <span style={styles.valLabel}>{opacity}%</span>
          </span>
          <input
            type="range"
            min="1"
            max="100"
            value={opacity}
            onChange={(e) => setOpacity(Number(e.target.value))}
            style={styles.slider}
          />
        </div>

        <div style={styles.divider} />

        {/* Color picker */}
        <div style={styles.toolSection}>
          <span style={styles.sectionLabel}>COLOR</span>
          <div style={styles.colorPickerRow}>
            <div style={{ ...styles.activeColorSwatch, background: color }} />
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              style={styles.nativeColorPicker}
              title="Custom color"
            />
          </div>
          <div style={styles.palette}>
            {PALETTE.map((c) => (
              <button
                key={c}
                title={c}
                onClick={() => setColor(c)}
                style={{
                  ...styles.swatchBtn,
                  background: c,
                  outline: color === c ? "2px solid #6c8fff" : "none",
                }}
              />
            ))}
          </div>
        </div>

        <div style={styles.divider} />

        {/* Quick actions */}
        <div style={styles.toolSection}>
          <span style={styles.sectionLabel}>ACTIONS</span>
          <div style={styles.actionRow}>
            <button
              onClick={undo}
              title="Undo (Ctrl+Z)"
              style={styles.actionBtn}
            >
              {Icons.undo}
            </button>
            <button
              onClick={redo}
              title="Redo (Ctrl+Y)"
              style={styles.actionBtn}
            >
              {Icons.redo}
            </button>
            <button
              onClick={clearCanvas}
              title="Clear"
              style={styles.actionBtn}
            >
              {Icons.trash}
            </button>
          </div>
          <div style={styles.actionRow}>
            <button
              onClick={() => setZoom((z) => Math.min(z + 0.25, 4))}
              title="Zoom In"
              style={styles.actionBtn}
            >
              {Icons.zoomin}
            </button>
            <button
              onClick={() => setZoom((z) => Math.max(z - 0.25, 0.25))}
              title="Zoom Out"
              style={styles.actionBtn}
            >
              {Icons.zoomout}
            </button>
            <button
              onClick={() => setZoom(1)}
              title="Reset Zoom"
              style={{
                ...styles.actionBtn,
                fontSize: 10,
                color: "#aaa",
                minWidth: 32,
              }}
            >
              {Math.round(zoom * 100)}%
            </button>
          </div>
          <button onClick={() => handleSave(false)} style={styles.saveBtn}>
            💾 Save
          </button>
        </div>
      </aside>

      {/* ── CANVAS AREA ── */}
      <div
        ref={containerRef}
        style={styles.canvasArea}
        onMouseEnter={() => setShowCursorPreview(true)}
        onMouseLeave={() => {
          setShowCursorPreview(false);
          isDrawing.current = false;
        }}
      >
        {/* Checkerboard background for canvas */}
        <div
          style={{
            ...styles.canvasWrapper,
            width: canvasSize.w * zoom,
            height: canvasSize.h * zoom,
          }}
        >
          <div style={styles.checkerboard} />
          {/* Main canvas */}
          <canvas
            ref={canvasRef}
            style={{
              ...styles.canvas,
              width: canvasSize.w * zoom,
              height: canvasSize.h * zoom,
              cursor: CURSOR_MAP[tool] || "crosshair",
            }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={() => {
              isDrawing.current = false;
            }}
          />
          {/* Overlay for shape preview */}
          <canvas
            ref={overlayRef}
            width={canvasSize.w}
            height={canvasSize.h}
            style={{
              ...styles.canvas,
              ...styles.overlayCanvas,
              width: canvasSize.w * zoom,
              height: canvasSize.h * zoom,
              pointerEvents: "none",
            }}
          />
          {/* Cursor brush preview ring */}
          {showCursorPreview &&
            (tool === TOOLS.BRUSH || tool === TOOLS.ERASER) && (
              <div
                style={{
                  position: "absolute",
                  left: cursorPos.x * zoom - (brushSize * zoom) / 2,
                  top: cursorPos.y * zoom - (brushSize * zoom) / 2,
                  width: brushSize * zoom,
                  height: brushSize * zoom,
                  border: `1.5px solid ${tool === TOOLS.ERASER ? "#888" : color}`,
                  borderRadius: "50%",
                  pointerEvents: "none",
                  boxSizing: "border-box",
                  opacity: 0.8,
                }}
              />
            )}
        </div>
      </div>

      {/* ── STATUS BAR ── */}
      <div style={styles.statusBar}>
        <span style={styles.statusItem}>{statusText}</span>
        <span style={styles.statusItem}>
          {cursorPos.x}, {cursorPos.y}
        </span>
        <span style={styles.statusItem}>
          {canvasSize.w} × {canvasSize.h}px
        </span>
        <span style={styles.statusItem}>Zoom: {Math.round(zoom * 100)}%</span>
        <span style={styles.statusItem}>
          Tool: {Object.keys(TOOLS).find((k) => TOOLS[k] === tool)}
        </span>
        {currentFilePath && (
          <span style={{ ...styles.statusItem, color: "#6c8fff" }}>
            {currentFilePath}
          </span>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   STYLES
───────────────────────────────────────────── */
const styles = {
  root: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    height: "100%",
    background: "#141414",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    color: "#d0d0d0",
    overflow: "hidden",
    position: "relative",
  },
  sidebar: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 28,
    width: 180,
    background: "#1c1c1c",
    borderRight: "1px solid #2a2a2a",
    overflowY: "auto",
    overflowX: "hidden",
    zIndex: 10,
    display: "flex",
    flexDirection: "column",
    gap: 0,
    scrollbarWidth: "thin",
    scrollbarColor: "#333 transparent",
  },
  toolSection: {
    padding: "10px 12px",
  },
  sectionLabel: {
    display: "block",
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: "0.12em",
    color: "#555",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  valLabel: {
    color: "#6c8fff",
    fontVariantNumeric: "tabular-nums",
  },
  divider: {
    height: 1,
    background: "#252525",
    margin: "0 8px",
  },
  toolGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 4,
  },
  toolBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: 34,
    borderRadius: 6,
    border: "1px solid #2e2e2e",
    background: "#242424",
    color: "#888",
    cursor: "pointer",
    transition: "all 0.15s",
  },
  toolBtnActive: {
    background: "#1a2a4a",
    border: "1px solid #6c8fff",
    color: "#6c8fff",
    boxShadow: "0 0 0 1px #6c8fff33 inset",
  },
  slider: {
    width: "100%",
    accentColor: "#6c8fff",
    cursor: "pointer",
    height: 4,
  },
  brushPreviewWrap: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: 48,
    marginTop: 6,
    background: "#111",
    borderRadius: 8,
    border: "1px solid #222",
  },
  brushPreview: {
    transition: "all 0.1s",
    flexShrink: 0,
  },
  colorPickerRow: {
    display: "flex",
    gap: 8,
    alignItems: "center",
    marginBottom: 8,
  },
  activeColorSwatch: {
    width: 36,
    height: 36,
    borderRadius: 8,
    border: "2px solid #333",
    flexShrink: 0,
    boxShadow: "0 2px 8px #0005",
  },
  nativeColorPicker: {
    flex: 1,
    height: 36,
    borderRadius: 6,
    border: "none",
    background: "none",
    cursor: "pointer",
    padding: 0,
  },
  palette: {
    display: "grid",
    gridTemplateColumns: "repeat(6, 1fr)",
    gap: 3,
  },
  swatchBtn: {
    width: "100%",
    aspectRatio: "1",
    borderRadius: 4,
    border: "none",
    cursor: "pointer",
    outlineOffset: 2,
    transition: "outline 0.1s",
  },
  actionRow: {
    display: "flex",
    gap: 4,
    marginBottom: 4,
  },
  actionBtn: {
    flex: 1,
    height: 30,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
    border: "1px solid #2e2e2e",
    background: "#242424",
    color: "#888",
    cursor: "pointer",
    fontSize: 11,
    transition: "all 0.15s",
  },
  saveBtn: {
    width: "100%",
    height: 32,
    marginTop: 4,
    borderRadius: 7,
    border: "none",
    background: "linear-gradient(135deg, #2a4a9a, #6c8fff)",
    color: "#fff",
    fontWeight: 600,
    fontSize: 12,
    cursor: "pointer",
    letterSpacing: "0.03em",
    transition: "opacity 0.15s",
  },
  canvasArea: {
    position: "absolute",
    top: 0,
    left: 180,
    right: 0,
    bottom: 28,
    overflow: "auto",
    background: "#141414",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "flex-start",
    padding: 24,
    scrollbarWidth: "thin",
    scrollbarColor: "#333 transparent",
  },
  canvasWrapper: {
    position: "relative",
    flexShrink: 0,
    boxShadow: "0 8px 48px #000a, 0 2px 8px #0006",
    borderRadius: 2,
    overflow: "hidden",
  },
  checkerboard: {
    position: "absolute",
    inset: 0,
    backgroundImage: `
      linear-gradient(45deg, #1a1a1a 25%, transparent 25%),
      linear-gradient(-45deg, #1a1a1a 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, #1a1a1a 75%),
      linear-gradient(-45deg, transparent 75%, #1a1a1a 75%)
    `,
    backgroundSize: "12px 12px",
    backgroundPosition: "0 0, 0 6px, 6px -6px, -6px 0",
    background: "#111",
    zIndex: 0,
  },
  canvas: {
    position: "absolute",
    top: 0,
    left: 0,
    display: "block",
    imageRendering: "pixelated",
    zIndex: 1,
  },
  overlayCanvas: {
    zIndex: 2,
    pointerEvents: "none",
  },
  statusBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 28,
    background: "#181818",
    borderTop: "1px solid #252525",
    display: "flex",
    alignItems: "center",
    gap: 0,
    zIndex: 20,
    overflow: "hidden",
  },
  statusItem: {
    fontSize: 11,
    color: "#555",
    padding: "0 12px",
    borderRight: "1px solid #252525",
    whiteSpace: "nowrap",
    height: "100%",
    display: "flex",
    alignItems: "center",
    fontVariantNumeric: "tabular-nums",
  },
};
