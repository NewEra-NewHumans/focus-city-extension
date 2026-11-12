// Focus City Builder (offline) - background service worker.
// Jobs: open the app tab on icon click, watch tabs against the local
// blocklist during a focus session, and keep the toolbar badge countdown.
// Everything is checked locally against chrome.storage.local; nothing is
// ever sent over the network.

var STORE_KEY = "focusCityV1";

function getState(cb) {
  chrome.storage.local.get(STORE_KEY, function (res) {
    cb(res[STORE_KEY] || null);
  });
}
function setState(state, cb) {
  var obj = {};
  obj[STORE_KEY] = state;
  chrome.storage.local.set(obj, cb || function () {});
}

function openApp() {
  var url = chrome.runtime.getURL("index.html");
  chrome.tabs.query({ url: url }, function (tabs) {
    if (tabs && tabs.length > 0) {
      chrome.tabs.update(tabs[0].id, { active: true });
      chrome.windows.update(tabs[0].windowId, { focused: true });
    } else {
      chrome.tabs.create({ url: url });
    }
  });
}
chrome.action.onClicked.addListener(openApp);

function hostOf(url) {
  try {
    var h = new URL(url).hostname || "";
    return h.replace(/^www\./, "").toLowerCase();
  } catch (e) {
    return "";
  }
}
function isBlocked(url, blocklist) {
  if (!url || (url.indexOf("http://") !== 0 && url.indexOf("https://") !== 0)) return null;
  if (url.indexOf(chrome.runtime.getURL("")) === 0) return null;
  var host = hostOf(url);
  if (!host) return null;
  for (var i = 0; i < (blocklist || []).length; i++) {
    var d = String(blocklist[i]).replace(/^www\./, "").toLowerCase();
    if (d && (host === d || host.slice(-(d.length + 1)) === "." + d)) return d;
  }
  return null;
}

function clearBadge() {
  try { chrome.action.setBadgeText({ text: "" }); } catch (e) {}
}
function updateBadge(state) {
  if (!state || !state.session) { clearBadge(); return; }
  var remainMs = state.session.endTs - Date.now();
  if (remainMs <= 0) { clearBadge(); return; }
  var mins = Math.ceil(remainMs / 60000);
  try {
    chrome.action.setBadgeBackgroundColor({ color: "#d96c2c" });
    chrome.action.setBadgeText({ text: String(mins) });
  } catch (e) {}
}

function failSession(tabId, state, matchedDomain, url) {
  var failed = state.session;
  failed.status = "withered";
  failed.reason = "blocked";
  failed.blockedHost = matchedDomain;
  failed.blockedUrl = url;
  failed.failedAt = Date.now();
  state.sessionFailed = failed;
  state.session = null;
  setState(state, function () {
    clearBadge();
    try { chrome.alarms.clear("cityTick"); } catch (e) {}
    var target = chrome.runtime.getURL("blocked.html") + "?host=" + encodeURIComponent(matchedDomain);
    chrome.tabs.update(tabId, { url: target });
  });
}

function checkTab(tabId, url) {
  if (!url) return;
  getState(function (state) {
    if (!state || !state.session) return;
    if (state.blockEnabled === false) return;
    if (Date.now() > state.session.endTs) return; // session already over
    var matched = isBlocked(url, state.blocklist);
    if (matched) failSession(tabId, state, matched, url);
  });
}

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (changeInfo.url) checkTab(tabId, changeInfo.url);
  else if (changeInfo.status === "loading" && tab && tab.url) checkTab(tabId, tab.url);
});
chrome.tabs.onActivated.addListener(function (info) {
  chrome.tabs.get(info.tabId, function (tab) {
    if (tab && tab.url) checkTab(info.tabId, tab.url);
  });
});

chrome.runtime.onMessage.addListener(function (msg) {
  if (!msg) return;
  if (msg.type === "city-session-started") {
    try { chrome.alarms.create("cityTick", { periodInMinutes: 1 }); } catch (e) {}
    getState(updateBadge);
  } else if (msg.type === "city-session-ended") {
    try { chrome.alarms.clear("cityTick"); } catch (e) {}
    clearBadge();
  }
});

chrome.alarms.onAlarm.addListener(function (alarm) {
  if (alarm.name !== "cityTick") return;
  getState(function (state) {
    if (!state || !state.session) {
      clearBadge();
      try { chrome.alarms.clear("cityTick"); } catch (e) {}
      return;
    }
    updateBadge(state);
  });
});

chrome.runtime.onStartup.addListener(function () { getState(updateBadge); });
chrome.runtime.onInstalled.addListener(function () { getState(updateBadge); });
