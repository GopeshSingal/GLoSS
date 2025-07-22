import { getRootDomain } from "./utils";
import { STORAGE_KEY } from "./constants";

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    updateIcon(tabId, tab.url);
  }
});

chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (tab.url) {
      updateIcon(tab.id!, tab.url);
    }
  });
});

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

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && changes[STORAGE_KEY]) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.url) {
        updateIcon(tabs[0].id!, tabs[0].url);
      }
    });
  }
}); 