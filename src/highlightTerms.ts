import type { GlossaryTerms } from "./types";

interface HighlightCallbacks {
  onHover: (term: string, x: number, y: number) => void;
  onClick: (term: string) => void;
  onLeave: () => void;
}

const EXCLUDED_TAGS = ["script", "style", "noscript", "iframe", "object", "embed", "input", "textarea"];
const CLICKABLE_CLASSES = ['btn', 'button', 'clickable'];
const LINKEDIN_SELECTORS = '[data-job-description], [data-test-job-description], .job-description, .description, .content, .text';
const BASE_SELECTORS = 'p, div, span, h1, h2, h3, h4, h5, h6, li, td, th, a, strong, em, b, i';


export function highlightTerms(
  glossary: GlossaryTerms,
  onHover: (term: string, x: number, y: number) => void,
  onClick: (term: string) => void,
  onLeave: () => void
) {
  const callbacks: HighlightCallbacks = { onHover, onClick, onLeave };
  const terms = prepareTerms(glossary);
  if (terms.length === 0) return;

  const pattern = createSearchPattern(terms);
  highlightPage(pattern, terms, glossary, callbacks);
}

function prepareTerms(glossary: GlossaryTerms): string[] {
  const terms = Object.keys(glossary);
  return terms.sort((a, b) => b.length - a.length);
}

function createSearchPattern(terms: string[]): RegExp {
  const alphanumericTerms = terms.filter(t => /^[A-Za-z0-9]+$/.test(t));
  const specialTerms = terms.filter(t => !/^[A-Za-z0-9]+$/.test(t));

  const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const alphanumericPattern = alphanumericTerms.length > 0 ? `\\b(${alphanumericTerms.map(escapeRegex).join("|")})\\b` : null;
  const specialPattern = specialTerms.length > 0 ? `(${specialTerms.map(escapeRegex).join("|")})` : null;
  const patternString = [alphanumericPattern, specialPattern].filter(Boolean).join("|");
  
  return new RegExp(patternString, "gi");
}

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

function isClickableElement(element: Element | null): boolean {
  if (!element) return false;
  
  if (element.tagName.toLowerCase() === 'button') return true;
  
  if (element.getAttribute('role')?.toLowerCase() === 'button') return true;
  
  if (element.tagName.toLowerCase() === 'a' && element.hasAttribute('href')) return true;
  
  if (element.hasAttribute('onclick')) return true;
  
  return CLICKABLE_CLASSES.some(className => element.classList.contains(className));
}

function isValidTextNode(node: Node): boolean {
  if (!node.textContent?.trim()) return false;
  
  const parentElement = node.parentElement;
  if (!parentElement) return false;
  
  if (parentElement.classList.contains('gloss-highlighted-term')) return false;
  
  let currentElement: Element | null = parentElement;
  while (currentElement) {
    if (isClickableElement(currentElement)) return false;
    currentElement = currentElement.parentElement;
  }
  
  const parentTag = parentElement.tagName.toLowerCase();
  if (EXCLUDED_TAGS.includes(parentTag)) return false;

  if (parentElement.closest('#gloss-tooltip-container')) return false;
  
  return true;
}

function createHighlightedSpan(
  matchedText: string,
  originalTerm: string | undefined,
  glossary: GlossaryTerms,
  callbacks: HighlightCallbacks
): HTMLSpanElement {
  const span = document.createElement('span');
  span.className = 'gloss-highlighted-term';
  
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
    if (originalTerm) callbacks.onHover(originalTerm, mouseEvent.pageX, mouseEvent.pageY);
  });
  
  span.addEventListener('mouseout', callbacks.onLeave);
  
  span.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (originalTerm) callbacks.onClick(originalTerm);
  });
  
  return span;
}

function processTextNode(
  textNode: Text,
  pattern: RegExp,
  terms: string[],
  glossary: GlossaryTerms,
  callbacks: HighlightCallbacks
) {
  const text = textNode.textContent!;
  pattern.lastIndex = 0;
  const matches = Array.from(text.matchAll(pattern));
  if (matches.length === 0) return;

  const fragment = document.createDocumentFragment();
  let lastIndex = 0;

  matches.forEach((match) => {
    const matchedText = match[0];
    const matchIndex = match.index!;

    if (matchIndex > lastIndex) {
      fragment.appendChild(document.createTextNode(text.slice(lastIndex, matchIndex)));
    }

    const originalTerm = terms.find(key => key.toLowerCase() === matchedText.toLowerCase());
    
    const span = createHighlightedSpan(matchedText, originalTerm, glossary, callbacks);
    fragment.appendChild(span);

    lastIndex = matchIndex + matchedText.length;
  });

  if (lastIndex < text.length) {
    fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
  }

  if (textNode.parentNode) {
    textNode.parentNode.replaceChild(fragment, textNode);
  }
}

function findTextNodesToHighlight(root: Node, pattern: RegExp): Text[] {
  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        if (!isValidTextNode(node)) return NodeFilter.FILTER_REJECT;
        return pattern.test(node.textContent!) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    }
  );

  const nodes: Text[] = [];
  let node;
  while ((node = walker.nextNode())) {
    nodes.push(node as Text);
  }
  return nodes;
}

function highlightPage(
  pattern: RegExp,
  terms: string[],
  glossary: GlossaryTerms,
  callbacks: HighlightCallbacks
) {
  addHighlightStyles();
  unwrapHighlights();

  const isLinkedIn = window.location.hostname.includes('linkedin.com');
  const selectors = isLinkedIn
    ? `${BASE_SELECTORS}, ${LINKEDIN_SELECTORS}`
    : BASE_SELECTORS;

  const elements = document.querySelectorAll(selectors);
  elements.forEach((element) => {
    const textNodes = findTextNodesToHighlight(element, pattern);
    textNodes.forEach(node => {
      processTextNode(node, pattern, terms, glossary, callbacks);
    });
  });
} 