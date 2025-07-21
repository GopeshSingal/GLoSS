export function highlightTerms(
  glossary: Record<string, { definition: string; link: string }>,
  onHover: (term: string, x: number, y: number) => void,
  onClick: (term: string) => void,
  onLeave: () => void
) {
  const terms = Object.keys(glossary);
  if (terms.length === 0) return;

  // Escape special regex characters
  const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`\\b(${terms.map(escapeRegex).join("|")})\\b`, "gi");

  // Add CSS styles for highlighting
  function addHighlightStyles() {
    if (document.getElementById('gloss-styles')) return;
    const style = document.createElement('style');
    style.id = 'gloss-styles';
    style.textContent = `
      .gloss-highlighted-term {
        background-color: #fff3cd !important;
        border-bottom: 2px solid #ffc107 !important;
        cursor: pointer !important;
        padding: 1px 2px !important;
        border-radius: 2px !important;
        transition: background-color 0.2s !important;
        position: relative !important;
        z-index: 1 !important;
      }
      .gloss-highlighted-term:hover {
        background-color: #ffeaa7 !important;
      }
    `;
    document.head.appendChild(style);
  }

  // Unwrap all previous highlights
  function unwrapHighlights() {
    const highlights = document.querySelectorAll('.gloss-highlighted-term');
    highlights.forEach(span => {
      const parent = span.parentNode;
      if (!parent) return;
      while (span.firstChild) {
        parent.insertBefore(span.firstChild, span);
      }
      parent.removeChild(span);
    });
  }

  // Only process text nodes, never innerHTML
  function highlightTextNodes(root: Node) {
    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          // Skip empty text
          if (!node.textContent || !node.textContent.trim()) return NodeFilter.FILTER_REJECT;
          // Skip if parent is already a highlight
          if ((node.parentElement && node.parentElement.classList.contains('gloss-highlighted-term'))) return NodeFilter.FILTER_REJECT;
          // Skip if parent is script/style/etc
          const parentTag = node.parentElement?.tagName.toLowerCase();
          if (parentTag && ["script", "style", "noscript", "iframe", "object", "embed", "input", "textarea"].includes(parentTag)) return NodeFilter.FILTER_REJECT;
          // Skip if inside the tooltip container
          if (node.parentElement && node.parentElement.closest('#gloss-tooltip-container')) return NodeFilter.FILTER_REJECT;
          // Only accept if it matches a term
          return pattern.test(node.textContent) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        }
      }
    );
    const nodes: Text[] = [];
    let n;
    while ((n = walker.nextNode())) nodes.push(n as Text);
    nodes.forEach(textNode => {
      const text = textNode.textContent!;
      let lastIndex = 0;
      pattern.lastIndex = 0; // Reset regex state
      const matches = Array.from(text.matchAll(pattern));
      if (matches.length === 0) return;
      const fragment = document.createDocumentFragment();
      matches.forEach((match) => {
        const matchedText = match[0];
        const matchIndex = match.index!;
        // Add text before
        if (matchIndex > lastIndex) {
          fragment.appendChild(document.createTextNode(text.slice(lastIndex, matchIndex)));
        }
        // Find original glossary key (case-insensitive)
        const originalTerm = terms.find(key => key.toLowerCase() === matchedText.toLowerCase());
        const span = document.createElement('span');
        span.className = 'gloss-highlighted-term';
        span.textContent = matchedText;
        if (originalTerm) span.dataset.glossTerm = originalTerm;
        span.addEventListener('mouseover', (e) => {
          const mouseEvent = e as MouseEvent;
          if (originalTerm) onHover(originalTerm, mouseEvent.pageX, mouseEvent.pageY);
        });
        span.addEventListener('mouseout', () => {
          onLeave();
        });
        span.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (originalTerm) onClick(originalTerm);
        });
        fragment.appendChild(span);
        lastIndex = matchIndex + matchedText.length;
      });
      // Add remaining text
      if (lastIndex < text.length) {
        fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
      }
      // Replace the text node
      if (textNode.parentNode) {
        textNode.parentNode.replaceChild(fragment, textNode);
      }
    });
  }

  function highlightPage() {
    addHighlightStyles();
    unwrapHighlights();
    // LinkedIn-specific selectors for job descriptions and content
    const isLinkedIn = window.location.hostname.includes('linkedin.com');
    const selectors = isLinkedIn
      ? 'p, div, span, h1, h2, h3, h4, h5, h6, li, td, th, a, strong, em, b, i, [data-job-description], [data-test-job-description], .job-description, .description, .content, .text'
      : 'p, div, span, h1, h2, h3, h4, h5, h6, li, td, th, a, strong, em, b, i';
    const elements = document.querySelectorAll(selectors);
    elements.forEach((element) => {
      highlightTextNodes(element);
    });
  }

  highlightPage();
} 