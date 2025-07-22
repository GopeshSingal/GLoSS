import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { getRootDomain } from "./utils";
import { STORAGE_KEY, PRIMARY_COLOR, ACCENT_COLOR, BG_COLOR, BORDER_RADIUS, FONT_FAMILY } from "./constants";

const Popup: React.FC = () => {
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [currentRoot, setCurrentRoot] = useState<string>("");
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const url = tabs[0]?.url || "";
      const root = getRootDomain(url);
      setCurrentRoot(root);
    });
  }, []);

  useEffect(() => {
    chrome.storage.sync.get([STORAGE_KEY], (result) => {
      const list: string[] = result[STORAGE_KEY] || [];
      setBookmarks(list);
    });
  }, []);

  useEffect(() => {
    setIsBookmarked(bookmarks.includes(currentRoot));
  }, [bookmarks, currentRoot]);

  const toggleBookmark = () => {
    const updated = isBookmarked
      ? bookmarks.filter((b) => b !== currentRoot)
      : [...bookmarks, currentRoot];
    chrome.storage.sync.set({ [STORAGE_KEY]: updated }, () => {
      setBookmarks(updated);
    });
  };

  return (
    <div
      style={{
        background: BG_COLOR,
        borderRadius: BORDER_RADIUS,
        boxShadow: "0 4px 24px 0 rgba(0,0,0,0.10)",
        padding: 24,
        minWidth: 280,
        fontFamily: FONT_FAMILY,
        color: "#222",
        maxWidth: 340,
      }}
    >
      <h2
        style={{
          margin: "0 0 18px 0",
          fontSize: 20,
          fontWeight: 700,
          letterSpacing: "-0.5px",
          color: PRIMARY_COLOR,
          fontFamily: FONT_FAMILY,
        }}
      >
        GLoSS
      </h2>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 15, marginBottom: 6 }}>
          <strong>Current site:</strong>
        </div>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: 16,
          fontWeight: 500,
        }}>
          <span>{currentRoot || "(unknown)"}</span>
          {currentRoot && (
            <span
              style={{
                display: "inline-block",
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: isBookmarked ? ACCENT_COLOR : "#e5e7eb", // gray-200
                border: isBookmarked ? `2px solid ${ACCENT_COLOR}` : "2px solid #e5e7eb",
                marginLeft: 4,
                transition: "background 0.2s, border 0.2s",
              }}
              title={isBookmarked ? "Bookmarked" : "Not bookmarked"}
            />
          )}
        </div>
      </div>
      <button
        style={{
          width: "100%",
          padding: "10px 0",
          fontSize: 15,
          fontWeight: 600,
          borderRadius: "8px",
          border: "none",
          background: isBookmarked ? ACCENT_COLOR : PRIMARY_COLOR,
          color: "#fff",
          cursor: currentRoot ? "pointer" : "not-allowed",
          boxShadow: isBookmarked
            ? "0 2px 8px 0 rgba(34,197,94,0.10)"
            : "0 2px 8px 0 rgba(37,99,235,0.10)",
          transition: "background 0.2s, box-shadow 0.2s",
          outline: "none",
        }}
        onClick={toggleBookmark}
        disabled={!currentRoot}
      >
        {isBookmarked ? "Remove Bookmark" : "Bookmark This Site"}
      </button>
      <div style={{ marginTop: 18, fontSize: 12, color: "#888", textAlign: "center" }}>
        {isBookmarked
          ? "This site is bookmarked."
          : "This site is not bookmarked."}
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById("root")!);
root.render(<Popup />); 