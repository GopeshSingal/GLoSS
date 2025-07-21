import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

function getRootDomain(url: string): string {
  try {
    const u = new URL(url);
    // Remove subdomains, keep only the root domain
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

const Popup: React.FC = () => {
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [currentRoot, setCurrentRoot] = useState<string>("");
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Get current tab's root domain
  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const url = tabs[0]?.url || "";
      const root = getRootDomain(url);
      setCurrentRoot(root);
    });
  }, []);

  // Load bookmarks
  useEffect(() => {
    chrome.storage.sync.get([STORAGE_KEY], (result) => {
      const list: string[] = result[STORAGE_KEY] || [];
      setBookmarks(list);
    });
  }, []);

  // Update isBookmarked when bookmarks or currentRoot changes
  useEffect(() => {
    setIsBookmarked(bookmarks.includes(currentRoot));
  }, [bookmarks, currentRoot]);

  // Add or remove bookmark
  const toggleBookmark = () => {
    const updated = isBookmarked
      ? bookmarks.filter((b) => b !== currentRoot)
      : [...bookmarks, currentRoot];
    chrome.storage.sync.set({ [STORAGE_KEY]: updated }, () => {
      setBookmarks(updated);
    });
  };

  // Remove a bookmark from the list
  const removeBookmark = (domain: string) => {
    const updated = bookmarks.filter((b) => b !== domain);
    chrome.storage.sync.set({ [STORAGE_KEY]: updated }, () => {
      setBookmarks(updated);
    });
  };

  return (
    <div>
      <h2 style={{ margin: "0 0 12px 0", fontSize: 18 }}>GLoSS Bookmarks</h2>
      <div style={{ marginBottom: 16 }}>
        <strong>Current site:</strong> {currentRoot || "(unknown)"}
        <br />
        <button
          style={{ marginTop: 8, padding: "6px 12px", fontSize: 14 }}
          onClick={toggleBookmark}
          disabled={!currentRoot}
        >
          {isBookmarked ? "Remove Bookmark" : "Bookmark This Site"}
        </button>
      </div>
      <div>
        <strong>Bookmarked Sites:</strong>
        <ul style={{ paddingLeft: 18, margin: 0 }}>
          {bookmarks.length === 0 && <li style={{ color: "#888" }}>(none)</li>}
          {bookmarks.map((domain) => (
            <li key={domain} style={{ marginBottom: 4 }}>
              {domain}
              <button
                style={{ marginLeft: 8, fontSize: 12, padding: "2px 6px" }}
                onClick={() => removeBookmark(domain)}
                aria-label={`Remove ${domain}`}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById("root")!);
root.render(<Popup />); 