import React from "react";
import { createRoot } from "react-dom/client";
import { Tooltip } from "./Tooltip";
import { useTooltip } from "./useTooltip";
import { highlightTerms } from "./highlightTerms";

(async function main() {
  try {
    // Load the glossary
    const response = await fetch(chrome.runtime.getURL("glossary.json"));
    const glossary = await response.json();
    
    // Check if we're on LinkedIn
    const isLinkedIn = window.location.hostname.includes('linkedin.com');
    if (isLinkedIn) {
      console.log('GLoSS: Detected LinkedIn, using enhanced highlighting');
    }

    // Create container for the tooltip
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
        // Initial highlighting with delay to ensure page is loaded
        setTimeout(() => {
          highlightTerms(glossary, handleHover, handleClick, handleLeave);
        }, 1000);

        let highlightTimeout: ReturnType<typeof setTimeout> | null = null;

        // Set up mutation observer for dynamic content
        const observer = new MutationObserver((mutations) => {
          let shouldRehighlight = false;
          
          for (const mutation of mutations) {
            // Skip mutations in our tooltip container
            if (mutation.target && (mutation.target as Node).nodeType === Node.ELEMENT_NODE) {
              const element = mutation.target as HTMLElement;
              if (element.closest("#gloss-tooltip-container")) {
                continue;
              }
            }
            
            // Check if new nodes were added
            if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
              shouldRehighlight = true;
              break;
            }
            
            // Also rehighlight on text changes (for content updates)
            if (mutation.type === "characterData") {
              shouldRehighlight = true;
              break;
            }
          }
          
          if (shouldRehighlight) {
            if (highlightTimeout) clearTimeout(highlightTimeout);
            highlightTimeout = setTimeout(() => {
              console.log("GLoSS: Re-highlighting due to DOM changes (debounced)");
              highlightTerms(glossary, handleHover, handleClick, handleLeave);
            }, 500); // Only run once after 500ms of no new changes
          }
        });

        // Start observing with more comprehensive options
        observer.observe(document.body, {
          childList: true,
          subtree: true,
          characterData: true,
          attributes: false,
        });

        // Also set up periodic re-highlighting for sites with complex dynamic content
        const periodicHighlight = setInterval(() => {
          // Only re-highlight if there are new unprocessed elements
          const unprocessedElements = document.querySelectorAll('p, div, span, h1, h2, h3, h4, h5, h6, li, td, th, a, strong, em, b, i');
          const hasUnprocessed = Array.from(unprocessedElements).some(el => !(el as HTMLElement).dataset.glossProcessed);
          
          if (hasUnprocessed) {
            console.log("GLoSS: Periodic re-highlighting (found unprocessed elements)");
            highlightTerms(glossary, handleHover, handleClick, handleLeave);
          }
        }, 5000); // Every 5 seconds, but only if needed

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

    // Render the app
    const root = createRoot(container);
    root.render(<TooltipApp />);

  } catch (error) {
    console.error("Failed to initialize GLoSS extension:", error);
  }
})(); 