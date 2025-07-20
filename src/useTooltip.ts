import { useState, useCallback } from "react";

export function useTooltip() {
  const [visible, setVisible] = useState(false);
  const [locked, setLocked] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [content, setContent] = useState("");

  const showTooltip = useCallback((x: number, y: number, html: string) => {
    if (!locked) {
      setPosition({ x, y });
      setContent(html);
      setVisible(true);
    }
  }, [locked]);

  const hideTooltip = useCallback(() => {
    if (!locked) setVisible(false);
  }, [locked]);

  const lockTooltip = useCallback((x: number, y: number) => {
    setLocked(true);
    setPosition({ x, y });
  }, []);

  const unlockTooltip = useCallback(() => {
    setLocked(false);
    setVisible(false);
  }, []);

  return {
    visible,
    locked,
    position,
    content,
    showTooltip,
    hideTooltip,
    lockTooltip,
    unlockTooltip,
  };
}
