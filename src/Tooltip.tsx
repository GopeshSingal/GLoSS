import React from "react";

interface TooltipProps {
  x: number;
  y: number;
  content: string;
  visible: boolean;
}

export const Tooltip: React.FC<TooltipProps> = ({ x, y, content, visible }) => {
  if (!visible) return null;

  const style: React.CSSProperties = {
    position: "fixed",
    top: y + 10,
    left: x + 10,
    backgroundColor: "#ffffff",
    border: "1px solid #cccccc",
    borderRadius: "4px",
    padding: "8px 12px",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
    zIndex: 10000,
    maxWidth: "300px",
    fontSize: "14px",
    lineHeight: "1.4",
    color: "#333333",
    pointerEvents: "none", // Prevent tooltip from interfering with clicks
  };

  return (
    <div style={style} dangerouslySetInnerHTML={{ __html: content }} />
  );
}; 