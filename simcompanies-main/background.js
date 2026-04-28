// Varsayılan mod: bağımsız pencere
let openMode = 'window'; // 'popup', 'sidebar', veya 'window'

// Extension yüklendiğinde context menu oluştur
chrome.runtime.onInstalled.addListener(() => {
  // Kullanıcı tercihini yükle
  chrome.storage.local.get(['openMode'], (result) => {
    if (result.openMode) {
      openMode = result.openMode;
    } else {
      // İlk kurulumda varsayılan olarak 'window' modunu kaydet
      chrome.storage.local.set({ openMode: 'window' });
    }
  });

  // Context menu oluştur
  chrome.contextMenus.create({
    id: 'openAsPopup',
    title: 'Open as Popup Window',
    contexts: ['action']
  });

  chrome.contextMenus.create({
    id: 'openAsSidebar',
    title: 'Open as Sidebar',
    contexts: ['action']
  });

  chrome.contextMenus.create({
    id: 'openAsNewWindow',
    title: 'Open in New Window (Default)',
    contexts: ['action']
  });
});

// Context menu tıklamalarını dinle
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'openAsPopup') {
    openMode = 'popup';
    chrome.storage.local.set({ openMode: 'popup' });
    // Popup açmak için yeni bir action gerekiyor
    chrome.action.setPopup({ popup: 'popup.html' });
  } else if (info.menuItemId === 'openAsSidebar') {
    openMode = 'sidebar';
    chrome.storage.local.set({ openMode: 'sidebar' });
    chrome.sidePanel.open({ windowId: tab.windowId });
  } else if (info.menuItemId === 'openAsNewWindow') {
    openMode = 'window';
    chrome.storage.local.set({ openMode: 'window' });
    chrome.windows.create({
      url: chrome.runtime.getURL('popup.html'),
      type: 'popup',
      width: 1200,
      height: 800
    });
  }
});

// Icon tıklaması - varsayılan olarak bağımsız pencere aç
chrome.action.onClicked.addListener((tab) => {
  chrome.storage.local.get(['openMode'], (result) => {
    const mode = result.openMode || 'window'; // Varsayılan: window
    
    if (mode === 'sidebar') {
      chrome.sidePanel.open({ windowId: tab.windowId });
    } else if (mode === 'popup') {
      // Popup için setPopup kullan
      chrome.action.setPopup({ popup: 'popup.html' });
      chrome.action.openPopup();
    } else {
      // Varsayılan: Bağımsız pencere
      chrome.windows.create({
        url: chrome.runtime.getURL('popup.html'),
        type: 'popup',
        width: 1200,
        height: 800
      });
    }
  });
});

// Sim Companies sayfasında otomatik sidebar seçeneği (opsiyonel)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url?.includes('simcompanies.com')) {
    chrome.sidePanel.setOptions({
      tabId,
      path: 'popup.html',
      enabled: true
    });
  }
});

// Chatroom mesajlarını çek (API'den)
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "FETCH_CHATROOM_MESSAGES") {
    console.log("🔍 Fetching chatroom API:", msg.url);
    
    fetch(msg.url, {
      method: "GET",
      credentials: "include",
    })
      .then(res => {
        console.log("📡 Response status:", res.status);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        console.log("📊 API Response:", data);
        
        // API'den gelen mesajları formatla
        const messages = Array.isArray(data) ? data : [];
        console.log(`✅ Found ${messages.length} messages`);
        
        sendResponse({ success: true, messages });
      })
      .catch(err => {
        console.error("❌ Error:", err);
        sendResponse({ success: false, error: err.message });
      });

    return true; // Async response
  }
});
