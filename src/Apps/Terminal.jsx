import { useState, useEffect, useRef } from "react";

const PROMPT = (cwd) => `C:${cwd}>`;

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

  async function runCommand(raw) {
    const trimmed = raw.trim();
    if (!trimmed) return;

    // add to history
    setHistory((p) => [trimmed, ...p]);
    setHistIdx(-1);

    // echo the prompt line
    print(`${PROMPT(cwd)} ${trimmed}`, "input");

    const [cmd, ...args] = trimmed.split(" ");

    switch (cmd.toLowerCase()) {
      case "help":
        ["help", "cls", "echo", "dir", "cd", "mkdir", "type", "del", "exit"].forEach((c) =>
          print(`  ${c}`)
        );
        break;

      case "cls":
        setLines([]);
        break;

      case "echo":
        print(args.join(" "));
        break;

      case "exit":
        print("Use the X button to close.", "error");
        break;

      case "dir":
        try {
          const res = await fetch(
            `http://localhost/miniOS/backend/list.php?path=C:${cwd}`
          );
          const data = await res.json();
          print(`\n Directory of C:${cwd}\n`);
          data.items.forEach((item) =>
            print(`  ${item.type === "folder" ? "<DIR>" : "     "}\t${item.name}`)
          );
          print("");
        } catch {
          print("Failed to read directory.", "error");
        }
        break;

      case "cd":
        if (!args[0] || args[0] === ".") break;
        if (args[0] === "..") {
          const parts = cwd.split("/").filter(Boolean);
          parts.pop();
          setCwd("/" + (parts.join("/") || ""));
        } else {
          const next = cwd === "/" ? `/${args[0]}` : `${cwd}/${args[0]}`;
          setCwd(next);
        }
        break;

      case "mkdir":
        if (!args[0]) { print("Missing folder name.", "error"); break; }
        try {
          const fd = new FormData();
          fd.append("path", `C:${cwd}`);
          fd.append("name", args[0]);
          await fetch("http://localhost/miniOS/backend/createFolder.php", { method: "POST", body: fd });
          window.dispatchEvent(new Event("fs:update"));
          print(`Folder created: ${args[0]}`);
        } catch {
          print("Failed to create folder.", "error");
        }
        break;

      case "type":
        if (!args[0]) { print("Missing filename.", "error"); break; }
        try {
          const res = await fetch(
            `http://localhost/miniOS/backend/read.php?path=C:${cwd}/${args[0]}`
          );
          const text = await res.text();
          text.split("\n").forEach((l) => print(l));
        } catch {
          print("Cannot read file.", "error");
        }
        break;

      case "del":
        if (!args[0]) { print("Missing filename.", "error"); break; }
        try {
          const fd = new FormData();
          fd.append("path", `C:${cwd}/${args[0]}`);
          await fetch("http://localhost/miniOS/backend/delete.php", { method: "POST", body: fd });
           window.dispatchEvent(new Event("fs:update"));
          print(`Deleted: ${args[0]}`);
        } catch {
          print("Failed to delete.", "error");
        }
        break;

      default:
        print(`'${cmd}' is not recognized as a command.`, "error");
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
    width:"100%",
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