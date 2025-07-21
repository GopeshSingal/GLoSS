const STORAGE_KEY = "gloss_bookmarks";

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

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    updateIcon(tabId, tab.url);
  }
});

// Listen for tab activation
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (tab.url) {
      updateIcon(tab.id!, tab.url);
    }
  });
});

// Update icon based on bookmark status
async function updateIcon(tabId: number, url: string) {
  const rootDomain = getRootDomain(url);
  const result = await chrome.storage.sync.get([STORAGE_KEY]);
  const bookmarks: string[] = result[STORAGE_KEY] || [];
  const isBookmarked = bookmarks.includes(rootDomain);

  chrome.action.setIcon({
    path: isBookmarked ? "glossy_green_128.png" : "glossy_blue_128.png",
    tabId
  });
}

// Listen for storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && changes[STORAGE_KEY]) {
    // Update icon for current tab when bookmarks change
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.url) {
        updateIcon(tabs[0].id!, tabs[0].url);
      }
    });
  }
}); 