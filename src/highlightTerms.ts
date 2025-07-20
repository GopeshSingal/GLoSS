export function highlightTerms(
  glossary: Record<string, { definition: string; link: string }>,
  onHover: (term: string, x: number, y: number) => void,
  onClick: (x: number, y: number) => void,
  onLeave: () => void
) {
  const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const terms = Object.keys(glossary);
  if (terms.length === 0) return;

  const regex = new RegExp(`\\b(${terms.map(escapeRegex).join("|")})\\b`, "g");

  function walk(node: Node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.nodeValue;
      if (!text) return;
      const frag = document.createDocumentFragment();
      let lastIndex = 0;
      let match;

      while ((match = regex.exec(text)) !== null) {
        const term = match[0];
        const before = text.slice(lastIndex, match.index);
        if (before) frag.appendChild(document.createTextNode(before));

        const mark = document.createElement("mark");
        mark.className = "highlight-term";
        mark.textContent = term;

        mark.addEventListener("mouseover", (e) => onHover(term, e.pageX, e.pageY));
        mark.addEventListener("mouseout", () => onLeave());
        mark.addEventListener("click", (e) => onClick(e.pageX, e.pageY));

        frag.appendChild(mark);
        lastIndex = match.index + term.length;
      }

      if (lastIndex < text.length) {
        frag.appendChild(document.createTextNode(text.slice(lastIndex)));
      }

      if (frag.childNodes.length > 0 && node.parentNode) {
        node.parentNode.replaceChild(frag, node);
      }
    } else if (node.nodeType === Node.ELEMENT_NODE && !(node as HTMLElement).closest("#cs-glossary-tooltip")) {
      for (const child of Array.from(node.childNodes)) {
        walk(child);
      }
    }
  }

  walk(document.body);
}
