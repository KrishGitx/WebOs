import { useState, useEffect, useRef } from "react";

const PROMPT = (cwd) => `C:${cwd}>`;
const BASE = "http://localhost/miniOS/backend";

function Terminal({ setHeaderContent }) {
  const [cwd, setCwd] = useState("/Desktop");
  const [lines, setLines] = useState([
    { type: "system", text: "miniOS Terminal [Version 1.0.0]" },
    { type: "system", text: 'Type "help" for available commands.' },
    { type: "system", text: "" },
  ]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState([]);
  const [histIdx, setHistIdx] = useState(-1);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    setHeaderContent({});
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  function print(text, type = "output") {
    setLines((p) => [...p, { type, text }]);
  }

  async function postForm(endpoint, fields) {
    const fd = new FormData();
    Object.entries(fields).forEach(([k, v]) => fd.append(k, v));
    return fetch(`${BASE}/${endpoint}`, { method: "POST", body: fd });
  }

  const BASE = "http://localhost/miniOS/backend";
  const BASE_STORAGE = "C:/miniOS_storage";

  // converts a terminal path to physical storage path
  function resolvePath(p) {
    if (!p) return null;
    const drive = "C";
    if (p.startsWith("C:/")) {
      const rest = p.replace(/^[A-Z]:\//, "");
      return `${BASE_STORAGE}/${drive}/${rest}`.replaceAll("\\", "/");
    }
    const cwdRel = cwd.replace(/^\//, ""); // strip leading /
    const rel = p === "." ? cwdRel : `${cwdRel}/${p}`;
    return `${BASE_STORAGE}/${drive}/${rel}`.replaceAll("\\", "/");
  }

  async function runCommand(raw) {
    const trimmed = raw.trim();
    if (!trimmed) return;

    setHistory((p) => [trimmed, ...p]);
    setHistIdx(-1);
    print(`${PROMPT(cwd)} ${trimmed}`, "input");

    // smart split: respects "quoted paths"
    const parts = trimmed.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1).map((a) => a.replace(/^"|"$/g, ""));

    switch (cmd) {
      // ── HELP ────────────────────────────────────────────────────────────
      case "help":
        [
          "",
          "  cls                      Clear the screen",
          "  dir                      List files in current directory",
          "  cd <folder>              Change directory  (cd .. to go up)",
          "  mkdir <name>             Create a new folder",
          "  type <file>              Print contents of a file",
          "  del <file>               Delete a file or folder",
          "  copy <src> <dest>        Copy a file",
          "  move <src> <dest>        Move a file",
          "  rename <src> <dest>      Rename a file",
          "  save <file> <content>    Write text content to a file",
          "  find <name>              Search for file in current directory",
          "  pwd                      Print current directory",
          "  date                     Show current date",
          "  time                     Show current time",
          "  echo <text>              Print text",
          "  cls                      Clear screen",
          "",
        ].forEach((l) => print(l));
        break;

      // ── CLS ─────────────────────────────────────────────────────────────
      case "cls":
        setLines([]);
        break;

      // ── ECHO ────────────────────────────────────────────────────────────
      case "echo":
        print(args.join(" "));
        break;

      // ── EXIT ────────────────────────────────────────────────────────────
      case "exit":
        print("Use the X button to close.", "error");
        break;

      // ── DIR ─────────────────────────────────────────────────────────────
      case "dir":
        try {
          const res = await fetch(`${BASE}/list.php?path=C:${cwd}`);
          const data = await res.json();
          print(`\n Directory of C:${cwd}\n`);
          data.items.forEach((item) =>
            print(
              `  ${item.type === "folder" ? "<DIR>  " : "       "}\t${item.name}`,
            ),
          );
          print(`\n  ${data.items.length} item(s)\n`);
        } catch {
          print("Failed to read directory.", "error");
        }
        break;

      // ── CD ──────────────────────────────────────────────────────────────
      case "cd":
        if (!args[0] || args[0] === ".") break;
        if (args[0] === "..") {
          const p = cwd.split("/").filter(Boolean);
          p.pop();
          setCwd("/" + (p.join("/") || ""));
        } else {
          setCwd(cwd === "/" ? `/${args[0]}` : `${cwd}/${args[0]}`);
        }
        break;

      // ── MKDIR ───────────────────────────────────────────────────────────
      case "mkdir":
        if (!args[0]) {
          print("Usage: mkdir <folder name>", "error");
          break;
        }
        try {
          const drive = "C";
          const cwdRel = cwd.replace(/^\//, ""); // "Desktop"
          const physicalPath = `${BASE_STORAGE}/${drive}/${cwdRel}`;
          await postForm("createFolder.php", {
            path: physicalPath,
            name: args[0],
          });
          window.dispatchEvent(new Event("fs:update"));
          print(`Folder created: ${args[0]}`);
        } catch {
          print("Failed to create folder.", "error");
        }
        break;
      // ── TYPE ────────────────────────────────────────────────────────────
      case "type":
        if (!args[0]) {
          print("Usage: type <filename>", "error");
          break;
        }
        try {
          const res = await fetch(
            `${BASE}/read.php?path=${resolvePath(args[0])}`,
          );
          const text = await res.text();
          print("");
          text.split("\n").forEach((l) => print(l));
          print("");
        } catch {
          print("Cannot read file.", "error");
        }
        break;

      // ── DEL ─────────────────────────────────────────────────────────────
      case "del":
        if (!args[0]) {
          print("Usage: del <filename>", "error");
          break;
        }
        try {
          await postForm("delete.php", { path: resolvePath(args[0]) });
          window.dispatchEvent(new Event("fs:update"));
          print(`Deleted: ${args[0]}`);
        } catch {
          print("Failed to delete.", "error");
        }
        break;

      // ── COPY ────────────────────────────────────────────────────────────
      case "copy":
        if (!args[0] || !args[1]) {
          print("Usage: copy <source> <destination>", "error");
          break;
        }
        try {
          await postForm("copy.php", {
            src: resolvePath(args[0]),
            dest: resolvePath(args[1]),
          });
          window.dispatchEvent(new Event("fs:update"));
          print(`        1 file(s) copied.`);
        } catch {
          print("Failed to copy.", "error");
        }
        break;
      // ── MOVE ────────────────────────────────────────────────────────────
      case "move":
        if (!args[0] || !args[1]) {
          print("Usage: move <source> <destination>", "error");
          break;
        }
        try {
          await postForm("move.php", {
            src: resolvePath(args[0]),
            dest: resolvePath(args[1]),
          });
          window.dispatchEvent(new Event("fs:update"));
          print(`        1 file(s) moved.`);
        } catch {
          print("Failed to move.", "error");
        }
        break;

      case "rename":
        if (!args[0] || !args[1]) {
          print("Usage: rename <source> <newname>", "error");
          break;
        }
        try {
          const srcPath = resolvePath(args[0]);
          const dir = srcPath.substring(0, srcPath.lastIndexOf("/"));
          await postForm("move.php", {
            src: srcPath,
            dest: `${dir}/${args[1]}`,
          });
          window.dispatchEvent(new Event("fs:update"));
          print(`Renamed: ${args[0]} → ${args[1]}`);
        } catch {
          print("Failed to rename.", "error");
        }
        break;

        // ── SAVE ────────────────────────────────────────────────────────────
        c; // ── SAVE ────────────────────────────────────────────────────────────────
      case "save":
        if (!args[0] || args.length < 2) {
          print("Usage: save <filename> <content>", "error");
          break;
        }
        try {
          // save.php prepends baseDir itself, just send "C/Desktop/file.txt"
          const cwdRel = cwd.replace(/^\//, ""); // "Desktop"
          const filePath = `C/${cwdRel}/${args[0]}`;
          await postForm("save.php", {
            path: filePath,
            content: args.slice(1).join(" "),
          });
          window.dispatchEvent(new Event("fs:update"));
          print(`Saved: ${args[0]}`);
        } catch {
          print("Failed to save file.", "error");
        }
        break;

      // ── PWD ─────────────────────────────────────────────────────────────────
      case "pwd":
        print(`C:${cwd}`);
        break;

      // ── DATE ────────────────────────────────────────────────────────────────
      case "date":
        print(
          `The current date is: ${new Date().toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "2-digit", day: "2-digit" })}`,
        );
        break;

      // ── TIME ────────────────────────────────────────────────────────────────
      case "time":
        print(
          `The current time is: ${new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`,
        );
        break;

      // ── FIND ────────────────────────────────────────────────────────────────
      case "find":
        if (!args[0]) {
          print("Usage: find <filename>", "error");
          break;
        }
        try {
          const res = await fetch(`${BASE}/list.php?path=C:${cwd}`);
          const data = await res.json();
          const query = args[0].toLowerCase();
          const matches = data.items.filter((item) =>
            item.name.toLowerCase().includes(query),
          );
          if (matches.length === 0) {
            print(`No files matching "${args[0]}" found in C:${cwd}`);
          } else {
            print("");
            matches.forEach((item) =>
              print(
                `  ${item.type === "folder" ? "<DIR>  " : "       "}\t${item.name}`,
              ),
            );
            print(`\n  ${matches.length} match(es) found.\n`);
          }
        } catch {
          print("Failed to search.", "error");
        }
        break;
      default:
        print(
          `'${cmd}' is not recognized as an internal or external command.`,
          "error",
        );
    }
  }

  function onKeyDown(e) {
    if (e.key === "Enter") {
      runCommand(input);
      setInput("");
    } else if (e.key === "ArrowUp") {
      const idx = Math.min(histIdx + 1, history.length - 1);
      setHistIdx(idx);
      setInput(history[idx] ?? "");
    } else if (e.key === "ArrowDown") {
      const idx = Math.max(histIdx - 1, -1);
      setHistIdx(idx);
      setInput(idx === -1 ? "" : history[idx]);
    }
  }

  return (
    <div style={styles.root} onClick={() => inputRef.current?.focus()}>
      <div style={styles.output}>
        {lines.map((l, i) => (
          <div key={i} style={{ ...styles.line, ...lineStyle(l.type) }}>
            {l.text}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div style={styles.inputRow}>
        <span style={styles.prompt}>{PROMPT(cwd)}&nbsp;</span>
        <input
          ref={inputRef}
          style={styles.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          spellCheck={false}
          autoComplete="off"
        />
      </div>
    </div>
  );
}

function lineStyle(type) {
  if (type === "input") return { color: "#aaa" };
  if (type === "error") return { color: "#ff5555" };
  if (type === "system") return { color: "#50fa7b" };
  return {};
}

const styles = {
  root: {
    width: "100%",
    background: "#0c0c0c",
    color: "#f8f8f2",
    fontFamily: "'Courier New', monospace",
    fontSize: "13px",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    padding: "8px",
    boxSizing: "border-box",
    cursor: "text",
  },
  output: {
    flex: 1,
    overflowY: "auto",
    whiteSpace: "pre-wrap",
    wordBreak: "break-all",
  },
  line: { lineHeight: "1.5", minHeight: "1.5em" },
  inputRow: { display: "flex", alignItems: "center", marginTop: "4px" },
  prompt: { color: "#50fa7b", whiteSpace: "nowrap" },
  input: {
    flex: 1,
    background: "transparent",
    border: "none",
    outline: "none",
    color: "#f8f8f2",
    fontFamily: "inherit",
    fontSize: "inherit",
    caretColor: "#50fa7b",
  },
};

export default Terminal;
