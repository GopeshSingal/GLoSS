import { useState, useCallback } from "react";

interface TooltipState {
  visible: boolean;
  position: { x: number; y: number };
  content: string;
}

export function useTooltip() {
  const [state, setState] = useState<TooltipState>({
    visible: false,
    position: { x: 0, y: 0 },
    content: "",
  });

  const showTooltip = useCallback((x: number, y: number, content: string) => {
    setState({
      visible: true,
      position: { x, y },
      content,
    });
  }, []);

  const hideTooltip = useCallback(() => {
    setState(prev => ({
      ...prev,
      visible: false,
    }));
  }, []);

  return {
    visible: state.visible,
    position: state.position,
    content: state.content,
    showTooltip,
    hideTooltip,
  };
} 