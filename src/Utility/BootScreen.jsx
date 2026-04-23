import { useEffect, useState } from "react";
import "./boot.css";

export default function BootScreen({ onFinish }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
  console.log("Boot started");

  const interval = setInterval(() => {
    setProgress((p) => {
      if (p >= 100) {
        clearInterval(interval);
        console.log("Boot finished");
        setTimeout(onFinish, 400);
        return 100;
      }
      return p + 5;
    });
  }, 80);

  return () => clearInterval(interval);
}, []);

  return (
    <div className="boot-screen">
      
      {/* SVG LOGO */}
      <div className="boot-logo">
        <svg width="80" height="80" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" stroke="white" strokeWidth="4" fill="none" />
          <text x="50%" y="55%" textAnchor="middle" fill="white" fontSize="20" fontFamily="sans-serif">
            OS
          </text>
        </svg>
      </div>

      {/* LOADING BAR */}
      <div className="boot-bar">
        <div className="boot-progress" style={{ width: `${progress}%` }} />
      </div>

    </div>
  );
}