import React from "react";
import { createRoot } from "react-dom/client";
import { Tooltip } from "./Tooltip";
import { useTooltip } from "./useTooltip";
import { highlightTerms } from "./highlightTerms";

(async function main() {
  const response = await fetch(chrome.runtime.getURL("glossary.json"));
  const glossary = await response.json();

  const container = document.createElement("div");
  container.id = "gloss-tooltip-container";
  document.body.appendChild(container);

  const TooltipWrapper: React.FC = () => {
    const tooltip = useTooltip();

    React.useEffect(() => {
      highlightTerms(
        glossary,
        (term, x, y) => {
          const html = `${glossary[term].definition} <br/><a href='${glossary[term].link}' target='_blank'>Learn more</a>`;
          tooltip.showTooltip(x, y, html);
        },
        (x, y) => {
          tooltip.lockTooltip(x, y);
        },
        () => tooltip.hideTooltip()
      );
    }, []);

    return (
      <Tooltip
        x={tooltip.position.x}
        y={tooltip.position.y}
        content={tooltip.content}
        visible={tooltip.visible}
        locked={tooltip.locked}
        onClose={tooltip.unlockTooltip}
      />
    );
  };

  const root = createRoot(container);
  root.render(<TooltipWrapper />);
})();
