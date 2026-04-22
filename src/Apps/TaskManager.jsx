import { useState, useEffect } from "react";

function TaskManager({ setHeaderContent, getApps, setActiveApp }) {
  const [cpu, setCpu] = useState(0);
  const [ram, setRam] = useState(0);
    const [apps, setApps] = useState(getApps());

  useEffect(() => {
    setHeaderContent({});
    const id = setInterval(() => setApps(getApps()), 500);
    return () => clearInterval(id);
  }, []);

  // fake cpu/ram fluctuation
  useEffect(() => {
    const id = setInterval(() => {
      setCpu((p) => Math.min(100, Math.max(2, p + (Math.random() - 0.5) * 15)));
      setRam((p) => Math.min(100, Math.max(20, p + (Math.random() - 0.5) * 5)));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  function killApp(id) {
    setActiveApp((prev) => prev.filter((a) => a.id !== id));
  }

  const bar = (val, color) => (
    <div style={styles.barBg}>
      <div style={{ ...styles.barFill, width: `${val}%`, background: color }} />
      <span style={styles.barLabel}>{Math.round(val)}%</span>
    </div>
  );

  return (
    <div style={styles.root}>
      {/* PERF SECTION */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Performance</div>
        <div style={styles.perfRow}>
          <span style={styles.perfLabel}>CPU</span>
          {bar(cpu, "#50fa7b")}
        </div>
        <div style={styles.perfRow}>
          <span style={styles.perfLabel}>RAM</span>
          {bar(ram, "#8be9fd")}
        </div>
      </div>

      {/* PROCESSES SECTION */}
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Processes</div>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>PID</th>
              <th style={styles.th}>Action</th>
            </tr>
          </thead>
          <tbody>
            {apps.filter(a => a.name !== "taskManager").map((app) => (
              <tr key={app.id} style={styles.tr}>
                <td style={styles.td}>{app.name}</td>
                <td style={styles.td}>{app.id}</td>
                <td style={styles.td}>
                  <button style={styles.killBtn} onClick={() => killApp(app.id)}>
                    End Task
                  </button>
                </td>
              </tr>
            ))}
            {apps.filter(a => a.name !== "taskManager").length === 0 && (
              <tr><td colSpan={3} style={{ ...styles.td, color: "#666", textAlign: "center" }}>No running processes</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const styles = {
  root: { width:"100%",background: "#111", color: "#f8f8f2", fontFamily: "'Courier New', monospace", fontSize: "13px", height: "100%", padding: "12px", boxSizing: "border-box", overflowY: "auto" },
  section: { marginBottom: "20px" },
  sectionTitle: { color: "#50fa7b", fontWeight: "bold", marginBottom: "8px", borderBottom: "1px solid #333", paddingBottom: "4px" },
  perfRow: { display: "flex", alignItems: "center", marginBottom: "6px" },
  perfLabel: { width: "40px", color: "#aaa" },
  barBg: { flex: 1, height: "16px", background: "#222", borderRadius: "3px", overflow: "hidden", position: "relative" },
  barFill: { height: "100%", transition: "width 0.8s ease", borderRadius: "3px" },
  barLabel: { position: "absolute", right: "6px", top: "0", lineHeight: "16px", fontSize: "11px", color: "#fff" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", color: "#aaa", borderBottom: "1px solid #333", padding: "4px 8px" },
  tr: { borderBottom: "1px solid #1a1a1a" },
  td: { padding: "5px 8px" },
  killBtn: { background: "#ff5555", color: "#fff", border: "none", borderRadius: "3px", padding: "2px 8px", cursor: "pointer", fontFamily: "inherit", fontSize: "12px" },
};

export default TaskManager;