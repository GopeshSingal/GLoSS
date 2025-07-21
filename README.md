# GLoSS - Glossary Lookup of Software & Systems

A Chrome extension that highlights technical terms on web pages and provides definitions with links to learn more.

## Features

- **Automatic Highlighting**: Automatically highlights terms from the glossary on any webpage
- **Hover Tooltips**: Shows definitions when hovering over highlighted terms
- **Click to Open Link**: Click on a highlighted term to open the associated link in a new tab
- **Dynamic Content**: Automatically highlights new content as it's added to the page
- **Clean Design**: Minimal, non-intrusive highlighting that doesn't interfere with page content

## Installation

1. **Build the Extension**:
   ```bash
   npm install
   npm run build
   ```

2. **Load in Chrome**:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `dist` folder from this project

3. **Test the Extension**:
   - Open the `test.html` file in your browser
   - You should see "TypeScript" and "React" highlighted in yellow
   - Hover over the highlighted terms to see tooltips
   - Click on highlighted terms to open the links in new tabs

## Usage

### Hover Behavior
- Hover over any highlighted term to see its definition
- The tooltip will appear near your cursor
- Move your mouse away to dismiss the tooltip

### Click to Open Link
- Click on any highlighted term to open the associated link in a new tab
- The link will open in a new browser tab/window
- This is especially useful for learning more about technical terms

### Adding Terms
To add new terms to the glossary, edit `public/glossary.json`:

```json
{
  "TermName": {
    "definition": "Definition of the term",
    "link": "https://example.com/learn-more"
  }
}
```

## Technical Details

### Architecture
- **Content Script**: Runs on every webpage to highlight terms
- **React Components**: Manages tooltip state and rendering
- **MutationObserver**: Watches for dynamic content changes
- **Event Handling**: Manages hover, click, and document click events

### Files Structure
```
src/
├── content.tsx      # Main content script
├── useTooltip.ts    # React hook for tooltip state
├── Tooltip.tsx      # Tooltip component
└── highlightTerms.ts # DOM manipulation and highlighting
public/
├── manifest.json    # Chrome extension manifest
└── glossary.json    # Terms and definitions
```

### Styling
- Highlighted terms have a light yellow background with an orange underline
- Tooltips have a clean white background with subtle shadows
- All styling is designed to be non-intrusive

## Development

### Building
```bash
npm run build
```

### Development Mode
```bash
npm run dev
```

### Linting
```bash
npm run lint
```

## Browser Compatibility

- Chrome 88+ (Manifest V3)
- Should work on other Chromium-based browsers (Edge, Brave, etc.)

## License

MIT License - feel free to use and modify as needed.
