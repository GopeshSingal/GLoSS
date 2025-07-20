import React from "react";

interface TooltipProps {
    x: number;
    y: number;
    content: string;
    visible: boolean;
    locked: boolean;
    onClose: () => void;
}


export const Tooltip: React.FC<TooltipProps> = ({ x, y, content, visible, locked, onClose }) => {
  if (!visible) return null;

  const style: React.CSSProperties = {
    position: "absolute",
    top: y + 10,
    left: x + 10,
    backgroundColor: "#fff",
    border: "1px solid #ccc",
    padding: "8px",
    boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
    zIndex: 10000,
    maxWidth: "300px",
    fontSize: "14px",
    borderRadius: "4px",
  };

    return (
        <div style={style} onClick={locked ? onClose : undefined}>
        {content}
        </div>
  );
};