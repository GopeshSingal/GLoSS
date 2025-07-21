export function highlightTerms(
  glossary: Record<string, { definition: string; link: string; category?: string }>,
  onHover: (term: string, x: number, y: number) => void,
  onClick: (term: string) => void,
  onLeave: () => void
) {
  // Sort terms by length descending to prioritize longer matches (e.g., 'NoSQL' before 'SQL')
  const terms = Object.keys(glossary).sort((a, b) => b.length - a.length);
  if (terms.length === 0) return;

  // Split terms into alphanumeric and non-alphanumeric
  const alphanumericTerms = terms.filter(t => /^[A-Za-z0-9]+$/.test(t));
  const specialTerms = terms.filter(t => !/^[A-Za-z0-9]+$/.test(t));

  const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const alphanumericPattern = alphanumericTerms.length > 0 ? `\\b(${alphanumericTerms.map(escapeRegex).join("|")})\\b` : null;
  const specialPattern = specialTerms.length > 0 ? `(${specialTerms.map(escapeRegex).join("|")})` : null;
  const patternString = [alphanumericPattern, specialPattern].filter(Boolean).join("|");
  const pattern = new RegExp(patternString, "gi");

  function addHighlightStyles() {
    if (document.getElementById('gloss-styles')) return;
    const style = document.createElement('style');
    style.id = 'gloss-styles';
    style.textContent = `
      .gloss-highlighted-term {
        background-color: #b3e5fc !important;
        border-bottom: 2px solid #0288d1 !important;
        color: #222 !important;
        cursor: pointer !important;
        padding: 1px 2px !important;
        border-radius: 2px !important;
        transition: background-color 0.2s !important;
        position: relative !important;
        z-index: 1 !important;
      }
      .gloss-highlighted-term:hover {
        filter: brightness(1.1);
      }
    `;
    document.head.appendChild(style);
  }

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

  function highlightTextNodes(root: Node) {
    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          if (!node.textContent || !node.textContent.trim()) return NodeFilter.FILTER_REJECT;
          if ((node.parentElement && node.parentElement.classList.contains('gloss-highlighted-term'))) return NodeFilter.FILTER_REJECT;
          const parentTag = node.parentElement?.tagName.toLowerCase();
          if (parentTag && ["script", "style", "noscript", "iframe", "object", "embed", "input", "textarea"].includes(parentTag)) return NodeFilter.FILTER_REJECT;
          if (node.parentElement && node.parentElement.closest('#gloss-tooltip-container')) return NodeFilter.FILTER_REJECT;
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
      pattern.lastIndex = 0; 
      const matches = Array.from(text.matchAll(pattern));
      if (matches.length === 0) return;
      const fragment = document.createDocumentFragment();
      matches.forEach((match) => {
        const matchedText = match[0];
        const matchIndex = match.index!;
        if (matchIndex > lastIndex) {
          fragment.appendChild(document.createTextNode(text.slice(lastIndex, matchIndex)));
        }
        const originalTerm = terms.find(key => key.toLowerCase() === matchedText.toLowerCase());
        const span = document.createElement('span');
        span.className = 'gloss-highlighted-term';
        // Add category-based class
        if (originalTerm) {
          span.dataset.glossTerm = originalTerm;
          const category = glossary[originalTerm]?.category;
          if (category) {
            const catClass = 'gloss-highlighted-term--' + category.replace(/\s+/g, '-').toLowerCase();
            span.classList.add(catClass);
          }
        }
        span.textContent = matchedText;
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
      if (lastIndex < text.length) {
        fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
      }
      if (textNode.parentNode) {
        textNode.parentNode.replaceChild(fragment, textNode);
      }
    });
  }

  function highlightPage() {
    addHighlightStyles();
    unwrapHighlights();
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