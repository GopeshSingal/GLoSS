import React from "react";
import { createRoot } from "react-dom/client";
import { Tooltip } from "./Tooltip";
import { useTooltip } from "./useTooltip";
import { highlightTerms } from "./highlightTerms";

function getRootDomain(url: string): string {
  try {
    const u = new URL(url);
    const parts = u.hostname.split(".");
    if (parts.length > 2) {
      return parts.slice(parts.length - 2).join(".");
    }
    return u.hostname;
  } catch {
    return url;
  }
}

const STORAGE_KEY = "gloss_bookmarks";

(async function main() {
  try {
    const response = await fetch(chrome.runtime.getURL("glossary.json"));
    const glossary = await response.json();
    
    const rootDomain = getRootDomain(window.location.href);
    chrome.storage.sync.get([STORAGE_KEY], (result) => {
      const bookmarks: string[] = result[STORAGE_KEY] || [];
      if (!bookmarks.includes(rootDomain)) {
        return;
      }

      const container = document.createElement("div");
      container.id = "gloss-tooltip-container";
      document.body.appendChild(container);
      const TooltipApp: React.FC = () => {
        const tooltip = useTooltip();

        const handleHover = React.useCallback((term: string, x: number, y: number) => {
          const glossaryEntry = glossary[term];
          if (!glossaryEntry) {
            console.warn(`Term "${term}" not found in glossary`);
            return;
          }
          
          const definition = glossaryEntry.definition;
          const content = `${definition}`;
          tooltip.showTooltip(x, y, content);
        }, [tooltip.showTooltip]);

        const handleClick = React.useCallback((term: string) => {
          const glossaryEntry = glossary[term];
          if (!glossaryEntry) {
            console.warn(`Term "${term}" not found in glossary`);
            return;
          }
          
          const link = glossaryEntry.link;
          if (link) {
            window.open(link, '_blank');
          }
        }, []);

        const handleLeave = React.useCallback(() => {
          tooltip.hideTooltip();
        }, [tooltip.hideTooltip]);

        React.useEffect(() => {
          setTimeout(() => {
            highlightTerms(glossary, handleHover, handleClick, handleLeave);
          }, 1000);

          let highlightTimeout: ReturnType<typeof setTimeout> | null = null;

          const observer = new MutationObserver((mutations) => {
            let shouldRehighlight = false;
            
            for (const mutation of mutations) {
              if (mutation.target && (mutation.target as Node).nodeType === Node.ELEMENT_NODE) {
                const element = mutation.target as HTMLElement;
                if (element.closest("#gloss-tooltip-container")) {
                  continue;
                }
              }
              if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
                shouldRehighlight = true;
                break;
              }
              if (mutation.type === "characterData") {
                shouldRehighlight = true;
                break;
              }
            }
            
            if (shouldRehighlight) {
              if (highlightTimeout) clearTimeout(highlightTimeout);
              highlightTimeout = setTimeout(() => {
                highlightTerms(glossary, handleHover, handleClick, handleLeave);
              }, 500);
            }
          });

          observer.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true,
            attributes: false,
          });

          const periodicHighlight = setInterval(() => {
            const unprocessedElements = document.querySelectorAll('p, div, span, h1, h2, h3, h4, h5, h6, li, td, th, a, strong, em, b, i');
            const hasUnprocessed = Array.from(unprocessedElements).some(el => !(el as HTMLElement).dataset.glossProcessed);
          
            if (hasUnprocessed) {
              highlightTerms(glossary, handleHover, handleClick, handleLeave);
            }
          }, 5000);

          return () => {
            observer.disconnect();
            clearInterval(periodicHighlight);
            if (highlightTimeout) clearTimeout(highlightTimeout);
          };
        }, [handleHover, handleClick, handleLeave]);

        return (
          <Tooltip
            x={tooltip.position.x}
            y={tooltip.position.y}
            content={tooltip.content}
            visible={tooltip.visible}
          />
        );
      };

      const root = createRoot(container);
      root.render(<TooltipApp />);
    });
  } catch (error) {
    console.error("Failed to initialize GLoSS extension:", error);
  }
})(); 