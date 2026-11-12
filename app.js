"use strict";
/* Focus City Builder (offline) - app logic.
   Focus minutes are construction progress. State lives in
   chrome.storage.local (key focusCityV1) so the background worker can
   read the live session + blocklist; plain-file fallback: localStorage. */

var STORE_KEY = "focusCityV1";
var hasExt = typeof chrome !== "undefined" && chrome.storage && chrome.storage.local;

var BUILDINGS = [
  { id: "triumph",   name: "凯旋门",       en: "Arc de Triomphe",       city: "巴黎",       country: "法国",     region: "欧洲",       tier: 1, mins: 45,  shape: "arch",       c1: "#d9c39a", c2: "#8a6d1f" },
  { id: "windmill",  name: "风车村风车",   en: "Kinderdijk Windmills",  city: "金德代克",   country: "荷兰",     region: "欧洲",       tier: 1, mins: 45,  shape: "windmill",   c1: "#8a6844", c2: "#4c7a3f" },
  { id: "pisa",      name: "比萨斜塔",     en: "Leaning Tower of Pisa", city: "比萨",       country: "意大利",   region: "欧洲",       tier: 1, mins: 60,  shape: "tower",      c1: "#e8e0cc", c2: "#b09a6a", lean: true },
  { id: "brandenburg", name: "勃兰登堡门", en: "Brandenburg Gate",      city: "柏林",       country: "德国",     region: "欧洲",       tier: 1, mins: 60,  shape: "temple",     c1: "#cfc4a5", c2: "#8a7a52" },
  { id: "pearl",     name: "东方明珠塔",   en: "Oriental Pearl Tower",  city: "上海",       country: "中国",     region: "亚洲",       tier: 1, mins: 90,  shape: "pearl",      c1: "#d96a8a", c2: "#7d5ba6" },
  { id: "grandpalace", name: "大皇宫",     en: "Grand Palace",          city: "曼谷",       country: "泰国",     region: "亚洲",       tier: 1, mins: 90,  shape: "palace",     c1: "#f0d48a", c2: "#c2571f" },
  { id: "tokyotower", name: "东京塔",      en: "Tokyo Tower",           city: "东京",       country: "日本",     region: "亚洲",       tier: 1, mins: 90,  shape: "tower",      c1: "#e2572b", c2: "#f4f1ea" },
  { id: "nseoul",    name: "N首尔塔",      en: "N Seoul Tower",         city: "首尔",       country: "韩国",     region: "亚洲",       tier: 1, mins: 60,  shape: "tower",      c1: "#8ea6b8", c2: "#4c6a7d" },
  { id: "forbidden", name: "故宫",         en: "Forbidden City",        city: "北京",       country: "中国",     region: "亚洲",       tier: 2, mins: 120, shape: "palace",     c1: "#c93a22", c2: "#e9a13b" },
  { id: "opera",     name: "悉尼歌剧院",   en: "Sydney Opera House",    city: "悉尼",       country: "澳大利亚", region: "大洋洲与非洲", tier: 2, mins: 120, shape: "sails",    c1: "#f2ede2", c2: "#90b7c9" },
  { id: "bigben",    name: "大本钟",       en: "Big Ben",               city: "伦敦",       country: "英国",     region: "欧洲",       tier: 2, mins: 90,  shape: "tower",      c1: "#d9b878", c2: "#6b5320", clock: true },
  { id: "taj",       name: "泰姬陵",       en: "Taj Mahal",             city: "阿格拉",     country: "印度",     region: "亚洲",       tier: 2, mins: 150, shape: "dome",       c1: "#f4f1ea", c2: "#b8c4c9" },
  { id: "stbasils",  name: "圣瓦西里大教堂", en: "St Basil's Cathedral", city: "莫斯科",    country: "俄罗斯",   region: "欧洲",       tier: 2, mins: 120, shape: "onion",      c1: "#c94f38", c2: "#3f7d9e" },
  { id: "goldengate", name: "金门大桥",    en: "Golden Gate Bridge",    city: "旧金山",     country: "美国",     region: "美洲",       tier: 2, mins: 150, shape: "bridge",     c1: "#d95f2b", c2: "#8a3320" },
  { id: "londoneye", name: "伦敦眼",       en: "London Eye",            city: "伦敦",       country: "英国",     region: "欧洲",       tier: 2, mins: 120, shape: "wheel",      c1: "#7fa8c9", c2: "#4c6a7d" },
  { id: "louvre",    name: "卢浮宫金字塔", en: "Louvre Pyramid",        city: "巴黎",       country: "法国",     region: "欧洲",       tier: 2, mins: 90,  shape: "pyramid",    c1: "#a8d4ea", c2: "#5b87a0" },
  { id: "eiffel",    name: "埃菲尔铁塔",   en: "Eiffel Tower",          city: "巴黎",       country: "法国",     region: "欧洲",       tier: 3, mins: 180, shape: "eiffel",     c1: "#6b4a35", c2: "#3f2a1c" },
  { id: "skytree",   name: "东京晴空塔",   en: "Tokyo Skytree",         city: "东京",       country: "日本",     region: "亚洲",       tier: 3, mins: 150, shape: "tower",      c1: "#a8c4de", c2: "#5b87a0" },
  { id: "petronas",  name: "双子塔",       en: "Petronas Towers",       city: "吉隆坡",     country: "马来西亚", region: "亚洲",       tier: 3, mins: 150, shape: "twin",       c1: "#b8c9d4", c2: "#6a8794" },
  { id: "empire",    name: "帝国大厦",     en: "Empire State Building", city: "纽约",       country: "美国",     region: "美洲",       tier: 3, mins: 180, shape: "skyscraper", c1: "#cbb59a", c2: "#7d6a4a" },
  { id: "colosseum", name: "罗马斗兽场",   en: "Colosseum",             city: "罗马",       country: "意大利",   region: "欧洲",       tier: 3, mins: 150, shape: "colosseum",  c1: "#d9b878", c2: "#a07d3f" },
  { id: "parthenon", name: "帕特农神庙",   en: "Parthenon",             city: "雅典",       country: "希腊",     region: "欧洲",       tier: 3, mins: 120, shape: "temple",     c1: "#e3d5b8", c2: "#a08c5f" },
  { id: "mbs",       name: "滨海湾金沙",   en: "Marina Bay Sands",      city: "新加坡",     country: "新加坡",   region: "亚洲",       tier: 3, mins: 120, shape: "boat",       c1: "#b8c9d4", c2: "#d96c2c" },
  { id: "christ",    name: "里约基督像",   en: "Christ the Redeemer",   city: "里约热内卢", country: "巴西",     region: "美洲",       tier: 3, mins: 120, shape: "statue",     c1: "#d8d8d2", c2: "#8a8a80" },
  { id: "greatwall", name: "长城",         en: "Great Wall",            city: "北京",       country: "中国",     region: "亚洲",       tier: 4, mins: 300, shape: "wall",       c1: "#b09a7d", c2: "#7d6248" },
  { id: "burj",      name: "哈利法塔",     en: "Burj Khalifa",          city: "迪拜",       country: "阿联酋",   region: "亚洲",       tier: 4, mins: 240, shape: "skyscraper", c1: "#a8c4de", c2: "#5b87a0" },
  { id: "liberty",   name: "自由女神像",   en: "Statue of Liberty",     city: "纽约",       country: "美国",     region: "美洲",       tier: 4, mins: 180, shape: "statue",     c1: "#5ea88a", c2: "#3f7d63" },
  { id: "giza",      name: "吉萨金字塔",   en: "Pyramids of Giza",      city: "吉萨",       country: "埃及",     region: "大洋洲与非洲", tier: 4, mins: 240, shape: "pyramid", c1: "#e0c084", c2: "#a87f3f" },
  { id: "sagrada",   name: "圣家堂",       en: "Sagrada Família",       city: "巴塞罗那",   country: "西班牙",   region: "欧洲",       tier: 4, mins: 210, shape: "spire",      c1: "#d9b48f", c2: "#8a6a45" },
  { id: "machu",     name: "马丘比丘",     en: "Machu Picchu",          city: "库斯科",     country: "秘鲁",     region: "美洲",       tier: 4, mins: 180, shape: "temple",     c1: "#9aa578", c2: "#6a7d4a" }
];
var REGIONS = ["全部", "亚洲", "欧洲", "美洲", "大洋洲与非洲"];
var TIER_NEED = { 1: 0, 2: 3, 3: 8, 4: 15 };
var LEVELS = [
  { min: 0,  name: "启程小镇" },
  { min: 3,  name: "成长城镇" },
  { min: 8,  name: "繁华城市" },
  { min: 15, name: "国际都市" },
  { min: 24, name: "世界名城" }
];
var TAGS = ["学习", "工作", "阅读", "编程", "其他"];
var DURATIONS = [10, 15, 25, 30, 45, 60, 90, 120];
var PRESETS = ["youtube.com", "x.com", "instagram.com", "facebook.com", "tiktok.com", "douyin.com", "bilibili.com", "reddit.com", "weibo.com", "twitch.tv"];
var BUILD_STAGES = ["打地基", "砌主体", "一层层往上盖", "封顶了", "装修收尾中"];

function buildingById(id) {
  for (var i = 0; i < BUILDINGS.length; i++) if (BUILDINGS[i].id === id) return BUILDINGS[i];
  return null;
}
function defaultState() {
  return {
    records: [],
    blocklist: ["youtube.com", "x.com", "instagram.com", "tiktok.com"],
    blockEnabled: true,
    sound: true,
    session: null,
    sessionFailed: null,
    projectId: null,
    progress: {},
    built: {}
  };
}

var S = defaultState();
var selMinutes = 25;
var selTag = "学习";
var selRegion = "全部";
var tickTimer = null;
var abandonArmed = false;
var abandonTimer = null;
var isSaving = false;
var svgSeq = 0;

function storeLoad() {
  return new Promise(function (resolve) {
    if (hasExt) {
      chrome.storage.local.get(STORE_KEY, function (res) { resolve(res[STORE_KEY] || null); });
    } else {
      try {
        var raw = localStorage.getItem(STORE_KEY);
        resolve(raw ? JSON.parse(raw) : null);
      } catch (e) { resolve(null); }
    }
  });
}
function storeSave() {
  isSaving = true;
  return new Promise(function (resolve) {
    if (hasExt) {
      var obj = {};
      obj[STORE_KEY] = S;
      chrome.storage.local.set(obj, function () { isSaving = false; resolve(); });
    } else {
      try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); } catch (e) {}
      isSaving = false;
      resolve();
    }
  });
}
function notifyBg(type) {
  if (typeof chrome === "undefined" || !chrome.runtime || !chrome.runtime.sendMessage) return;
  try { chrome.runtime.sendMessage({ type: type }, function () { void chrome.runtime.lastError; }); } catch (e) {}
}

function pad(n) { return (n < 10 ? "0" : "") + n; }
function dateStr(ts) {
  var d = new Date(ts);
  return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
}
function todayStr() { return dateStr(Date.now()); }
function mondayTs() {
  var d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime() - ((d.getDay() + 6) % 7) * 86400000;
}
function fmtClock(sec) {
  sec = Math.max(0, Math.ceil(sec));
  var m = Math.floor(sec / 60), s = sec % 60;
  if (m >= 60) return Math.floor(m / 60) + ":" + pad(m % 60) + ":" + pad(s);
  return pad(m) + ":" + pad(s);
}
function fmtTime(ts) { var d = new Date(ts); return pad(d.getHours()) + ":" + pad(d.getMinutes()); }
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function $(id) { return document.getElementById(id); }

var toastTimer = null;
function toast(msg) {
  var t = $("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () { t.classList.remove("show"); }, 2800);
}
function banner(html) {
  var b = $("doneBanner");
  if (!html) { b.className = ""; b.innerHTML = ""; return; }
  b.innerHTML = html;
  b.className = "show";
}
function playDoneSound() {
  if (!S.sound) return;
  try {
    var Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    var ctx = new Ctx();
    [392, 523.25, 659.25, 783.99].forEach(function (f, i) {
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "triangle"; o.frequency.value = f;
      var t0 = ctx.currentTime + i * 0.13;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.2, t0 + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.45);
      o.connect(g); g.connect(ctx.destination);
      o.start(t0); o.stop(t0 + 0.5);
    });
  } catch (e) {}
}
function builtCount() { return Object.keys(S.built).length; }
function cityLevel() {
  var n = builtCount(), lv = LEVELS[0], idx = 0;
  LEVELS.forEach(function (l, i) { if (n >= l.min) { lv = l; idx = i; } });
  return { level: lv, index: idx, next: LEVELS[idx + 1] || null };
}
function totalFocusMinutes() {
  return S.records.filter(function (r) { return r.result !== "failed"; })
    .reduce(function (a, r) { return a + r.minutes; }, 0);
}

/* ---------- building SVG factory (viewBox 0 0 120 112, ground y=104) ---------- */
function winGrid(x, y, cols, rows, dx, dy) {
  var s = "";
  for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
    s += '<rect x="' + (x + c * dx) + '" y="' + (y + r * dy) + '" width="4.5" height="6" rx="1" fill="#fff3c4" opacity=".85"/>';
  }
  return s;
}
function shapeInner(b) {
  var c1 = b.c1, c2 = b.c2, s = "";
  switch (b.shape) {
    case "tower": {
      var inner = '<path d="M52 104 L56 34 L64 34 L68 104 Z" fill="' + c1 + '"/>' +
        '<rect x="57" y="22" width="6" height="13" fill="' + c1 + '"/>' +
        '<line x1="60" y1="22" x2="60" y2="8" stroke="' + c2 + '" stroke-width="2.5"/>' +
        '<circle cx="60" cy="30" r="8" fill="' + c2 + '"/>' + winGrid(57.5, 52, 1, 4, 0, 12);
      if (b.clock) {
        inner += '<circle cx="60" cy="46" r="7.5" fill="#fffdf2" stroke="' + c2 + '" stroke-width="2"/>' +
          '<line x1="60" y1="46" x2="60" y2="41" stroke="#333" stroke-width="1.6"/>' +
          '<line x1="60" y1="46" x2="64" y2="48" stroke="#333" stroke-width="1.6"/>';
      }
      s = b.lean ? '<g transform="rotate(4 60 104)">' + inner + "</g>" : inner;
      break;
    }
    case "eiffel":
      s = '<path d="M33 104 C46 72 53 48 56.5 20 L63.5 20 C67 48 74 72 87 104 L75 104 C69 86 66 74 65 64 L55 64 C54 74 51 86 45 104 Z" fill="' + c1 + '"/>' +
        '<rect x="57.5" y="8" width="5" height="13" fill="' + c1 + '"/>' +
        '<line x1="50" y1="76" x2="70" y2="76" stroke="' + c2 + '" stroke-width="3"/>' +
        '<line x1="54" y1="50" x2="66" y2="50" stroke="' + c2 + '" stroke-width="3"/>' +
        '<line x1="46" y1="90" x2="74" y2="90" stroke="' + c2 + '" stroke-width="2.4"/>';
      break;
    case "skyscraper":
      s = '<rect x="51" y="6" width="18" height="14" fill="' + c1 + '"/>' +
        '<line x1="60" y1="6" x2="60" y2="1" stroke="' + c2 + '" stroke-width="2"/>' +
        '<rect x="45" y="20" width="30" height="84" fill="' + c1 + '"/>' +
        '<rect x="45" y="20" width="30" height="6" fill="' + c2 + '"/>' + winGrid(49, 32, 3, 6, 8, 11);
      break;
    case "twin":
      s = '<rect x="31" y="24" width="17" height="80" fill="' + c1 + '"/><rect x="72" y="24" width="17" height="80" fill="' + c1 + '"/>' +
        '<path d="M39.5 24 L39.5 10" stroke="' + c2 + '" stroke-width="3"/><path d="M80.5 24 L80.5 10" stroke="' + c2 + '" stroke-width="3"/>' +
        '<rect x="48" y="56" width="24" height="6" fill="' + c2 + '"/>' + winGrid(34, 32, 2, 6, 7, 11) + winGrid(75, 32, 2, 6, 7, 11);
      break;
    case "pyramid":
      s = '<polygon points="60,20 102,104 18,104" fill="' + c1 + '"/>' +
        '<polygon points="60,20 102,104 60,104" fill="' + c2 + '" opacity=".38"/>' +
        '<line x1="42" y1="62" x2="78" y2="62" stroke="' + c2 + '" stroke-width="1.6" opacity=".6"/>' +
        '<line x1="34" y1="82" x2="86" y2="82" stroke="' + c2 + '" stroke-width="1.6" opacity=".6"/>';
      break;
    case "dome":
      s = '<rect x="26" y="80" width="68" height="24" fill="' + c1 + '"/>' +
        '<path d="M34 80 A26 27 0 0 1 86 80 Z" fill="' + c1 + '" stroke="' + c2 + '" stroke-width="2"/>' +
        '<rect x="57" y="38" width="6" height="12" fill="' + c2 + '"/><circle cx="60" cy="35" r="3.4" fill="' + c2 + '"/>' +
        '<path d="M16 104 v-12 a7 8 0 0 1 14 0 v12 Z" fill="' + c1 + '"/><path d="M90 104 v-12 a7 8 0 0 1 14 0 v12 Z" fill="' + c1 + '"/>' +
        winGrid(34, 86, 6, 1, 9, 0);
      break;
    case "onion":
      s = '<rect x="47" y="54" width="26" height="50" fill="' + c1 + '"/>' +
        '<path d="M60 10 C73 27 75 37 71 52 L49 52 C45 37 47 27 60 10 Z" fill="' + c2 + '"/>' +
        '<circle cx="60" cy="8" r="3" fill="' + c2 + '"/>' +
        '<rect x="24" y="70" width="16" height="34" fill="' + c1 + '"/>' +
        '<path d="M32 48 C41 59 42 65 39.5 72 L24.5 72 C22 65 23 59 32 48 Z" fill="' + c1 + '"/>' +
        '<rect x="80" y="70" width="16" height="34" fill="' + c1 + '"/>' +
        '<path d="M88 48 C97 59 98 65 95.5 72 L80.5 72 C78 65 79 59 88 48 Z" fill="' + c1 + '"/>' +
        winGrid(52, 62, 2, 3, 8, 13);
      break;
    case "bridge":
      s = '<rect x="5" y="82" width="110" height="6" fill="' + c1 + '"/>' +
        '<rect x="33" y="34" width="7" height="54" fill="' + c1 + '"/><rect x="80" y="34" width="7" height="54" fill="' + c1 + '"/>' +
        '<path d="M6 82 Q36 44 60 44 Q84 44 114 82" stroke="' + c2 + '" stroke-width="2.4" fill="none"/>' +
        '<path d="M36.5 34 L36.5 82 M83.5 34 L83.5 82" stroke="' + c2 + '" stroke-width="2"/>' +
        '<path d="M20 96 q6 -5 12 0 q6 5 12 0 q6 -5 12 0 q6 5 12 0 q6 -5 12 0 q6 5 12 0" stroke="#7fb3c8" stroke-width="2.4" fill="none"/>';
      break;
    case "arch":
      s = '<path d="M28 104 L28 34 L92 34 L92 104 L77 104 L77 64 A17 15 0 0 0 43 64 L43 104 Z" fill="' + c1 + '"/>' +
        '<rect x="24" y="26" width="72" height="9" fill="' + c2 + '"/>' + winGrid(34, 42, 6, 1, 10, 0);
      break;
    case "temple": {
      var cols = "";
      for (var i = 0; i < 5; i++) cols += '<rect x="' + (30 + i * 14) + '" y="42" width="6.5" height="44" fill="' + c1 + '"/>';
      s = '<polygon points="18,36 102,36 60,15" fill="' + c2 + '"/>' + cols +
        '<rect x="22" y="86" width="76" height="7" fill="' + c1 + '"/><rect x="18" y="95" width="84" height="9" fill="' + c2 + '"/>';
      break;
    }
    case "palace": {
      s = '<path d="M22 40 L98 40 L90 28 L30 28 Z" fill="' + c2 + '"/><rect x="34" y="40" width="52" height="13" fill="' + c1 + '"/>' +
        '<path d="M28 66 L92 66 L85 55 L35 55 Z" fill="' + c2 + '"/><rect x="38" y="66" width="44" height="12" fill="' + c1 + '"/>' +
        '<path d="M34 90 L86 90 L80 79 L40 79 Z" fill="' + c2 + '"/><rect x="44" y="90" width="32" height="14" fill="' + c1 + '"/>' +
        '<rect x="56" y="16" width="8" height="10" fill="' + c2 + '"/>' + winGrid(40, 43, 5, 1, 9, 0) + winGrid(48, 93, 3, 1, 9, 0);
      break;
    }
    case "sails":
      s = '<path d="M24 104 C26 62 38 38 56 24 C54 56 52 82 56 104 Z" fill="' + c1 + '" stroke="' + c2 + '" stroke-width="1.6"/>' +
        '<path d="M48 104 C52 68 62 50 76 40 C74 66 74 86 78 104 Z" fill="' + c1 + '" stroke="' + c2 + '" stroke-width="1.6" opacity=".92"/>' +
        '<path d="M70 104 C74 78 82 64 92 56 C91 76 92 90 95 104 Z" fill="' + c1 + '" stroke="' + c2 + '" stroke-width="1.6" opacity=".85"/>' +
        '<rect x="16" y="100" width="88" height="5" fill="' + c2 + '"/>';
      break;
    case "wheel": {
      var spokes = "";
      for (var k = 0; k < 4; k++) {
        var a = k * Math.PI / 4, x2 = 60 + 27 * Math.cos(a), y2 = 50 + 27 * Math.sin(a);
        var x1 = 60 - 27 * Math.cos(a), y1 = 50 - 27 * Math.sin(a);
        spokes += '<line x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '" stroke="' + c1 + '" stroke-width="1.6"/>';
      }
      s = '<path d="M60 56 L42 104 M60 56 L78 104" stroke="' + c2 + '" stroke-width="4" fill="none"/>' +
        '<circle cx="60" cy="50" r="29" fill="none" stroke="' + c1 + '" stroke-width="4.5"/>' + spokes +
        '<circle cx="60" cy="50" r="4.5" fill="' + c2 + '"/>';
      break;
    }
    case "pearl":
      s = '<path d="M44 104 L57 62 L63 62 L76 104 L66 104 L60 84 L54 104 Z" fill="' + c2 + '"/>' +
        '<circle cx="60" cy="44" r="14" fill="' + c1 + '"/><circle cx="55" cy="39" r="4.5" fill="#ffffff" opacity=".55"/>' +
        '<circle cx="60" cy="70" r="8.5" fill="' + c1 + '"/>' +
        '<line x1="60" y1="30" x2="60" y2="14" stroke="' + c2 + '" stroke-width="2.5"/>' +
        '<rect x="36" y="100" width="48" height="5" fill="' + c2 + '"/>';
      break;
    case "colosseum": {
      var archRows = "";
      [44, 64, 84].forEach(function (yy) {
        for (var j = 0; j < 5; j++) {
          archRows += '<path d="M' + (36 + j * 12) + ' ' + (yy + 10) + ' v-6 a3.4 4.4 0 0 1 6.8 0 v6 Z" fill="' + c2 + '" opacity=".6"/>';
        }
      });
      s = '<path d="M26 104 L26 40 Q26 30 38 29 L82 29 Q94 30 94 40 L94 104 Z" fill="' + c1 + '"/>' +
        '<rect x="26" y="54" width="68" height="4" fill="' + c2 + '" opacity=".7"/><rect x="26" y="74" width="68" height="4" fill="' + c2 + '" opacity=".7"/>' + archRows;
      break;
    }
    case "boat":
      s = '<rect x="33" y="48" width="11" height="56" fill="' + c1 + '"/><rect x="54.5" y="48" width="11" height="56" fill="' + c1 + '"/><rect x="76" y="48" width="11" height="56" fill="' + c1 + '"/>' +
        '<path d="M20 48 L100 48 L90 33 L30 33 Z" fill="' + c2 + '"/><rect x="57" y="22" width="6" height="11" fill="' + c2 + '"/>' +
        winGrid(35.5, 56, 1, 4, 0, 11) + winGrid(57, 56, 1, 4, 0, 11) + winGrid(78.5, 56, 1, 4, 0, 11);
      break;
    case "statue": {
      if (b.id === "christ") {
        s = '<path d="M52 104 L54 62 L66 62 L68 104 Z" fill="' + c2 + '"/>' +
          '<rect x="30" y="34" width="60" height="8" rx="4" fill="' + c1 + '"/>' +
          '<path d="M53 40 L67 40 L70 64 L50 64 Z" fill="' + c1 + '"/><circle cx="60" cy="27" r="6" fill="' + c1 + '"/>' +
          '<rect x="40" y="100" width="40" height="5" fill="' + c2 + '"/>';
      } else {
        s = '<rect x="46" y="84" width="28" height="20" fill="' + c2 + '"/>' +
          '<path d="M53 84 L55 44 L65 44 L67 84 Z" fill="' + c1 + '"/>' +
          '<circle cx="60" cy="36" r="5.5" fill="' + c1 + '"/>' +
          '<path d="M54 32 l3 -6 M60 30 v-7 M66 32 l-3 -6" stroke="' + c1 + '" stroke-width="2.2"/>' +
          '<path d="M65 46 L76 30" stroke="' + c1 + '" stroke-width="4.5"/>' +
          '<circle cx="78" cy="27" r="3.6" fill="#f7b731"/>' +
          '<path d="M55 48 L46 60" stroke="' + c1 + '" stroke-width="4.5"/>';
      }
      break;
    }
    case "wall": {
      var teeth = "";
      for (var t = 0; t < 9; t++) teeth += '<rect x="' + (12 + t * 11) + '" y="76" width="6" height="6" fill="' + c1 + '"/>';
      s = '<path d="M4 104 L4 88 Q30 74 56 82 Q86 70 116 86 L116 104 Z" fill="' + c2 + '" opacity=".45"/>' +
        '<rect x="8" y="82" width="104" height="13" fill="' + c1 + '"/>' + teeth +
        '<rect x="18" y="60" width="15" height="30" fill="' + c1 + '"/><path d="M15 60 L36 60 L32 52 L19 52 Z" fill="' + c2 + '"/>' +
        '<rect x="86" y="58" width="15" height="32" fill="' + c1 + '"/><path d="M83 58 L104 58 L100 50 L87 50 Z" fill="' + c2 + '"/>';
      break;
    }
    case "windmill":
      s = '<g stroke="' + c2 + '" stroke-width="4" stroke-linecap="round">' +
        '<line x1="60" y1="36" x2="60" y2="10"/><line x1="60" y1="36" x2="86" y2="36"/>' +
        '<line x1="60" y1="36" x2="60" y2="62"/><line x1="60" y1="36" x2="34" y2="36"/></g>' +
        '<polygon points="60,36 84,14 88,18 64,40" fill="' + c2 + '" opacity=".55"/>' +
        '<polygon points="60,36 38,58 34,54 56,32" fill="' + c2 + '" opacity=".55"/>' +
        '<path d="M48 104 L53 48 L67 48 L72 104 Z" fill="' + c1 + '"/>' +
        '<polygon points="50,50 70,50 60,38" fill="' + c2 + '"/><circle cx="60" cy="36" r="4" fill="' + c1 + '"/>' +
        '<rect x="56.5" y="82" width="7" height="12" fill="' + c2 + '"/>';
      break;
    case "spire": {
      var spires = "";
      [[34, 62], [48, 44], [62, 38], [76, 50]].forEach(function (p) {
        spires += '<path d="M' + (p[0] - 6) + ' 104 L' + p[0] + ' ' + p[1] + ' L' + (p[0] + 6) + ' 104 Z" fill="' + c1 + '"/>' +
          '<circle cx="' + p[0] + '" cy="' + (p[1] - 3) + '" r="2.4" fill="' + c2 + '"/>';
      });
      s = spires + '<rect x="28" y="88" width="64" height="16" fill="' + c1 + '"/>' + winGrid(36, 92, 6, 1, 9, 0);
      break;
    }
    default:
      s = '<rect x="40" y="30" width="40" height="74" fill="' + c1 + '"/>';
  }
  return s;
}
function buildingSVG(b, progress) {
  svgSeq++;
  var inner = shapeInner(b);
  if (progress === null || progress === undefined || progress >= 1) {
    return '<svg viewBox="0 0 120 112" xmlns="http://www.w3.org/2000/svg">' + inner + "</svg>";
  }
  var p = Math.max(0, Math.min(1, progress));
  var frontierY = 104 - p * 98;
  var clipId = "bclip" + svgSeq, filtId = "bgray" + svgSeq;
  return '<svg viewBox="0 0 120 112" xmlns="http://www.w3.org/2000/svg">' +
    '<defs><clipPath id="' + clipId + '"><rect x="0" y="' + frontierY.toFixed(1) + '" width="120" height="' + (112 - frontierY).toFixed(1) + '"/></clipPath>' +
    '<filter id="' + filtId + '"><feColorMatrix type="saturate" values="0.12"/></filter></defs>' +
    '<g filter="url(#' + filtId + ')" opacity=".35">' + inner + "</g>" +
    '<g clip-path="url(#' + clipId + ')">' + inner + "</g>" +
    (p > 0 ? '<line x1="6" y1="' + frontierY.toFixed(1) + '" x2="114" y2="' + frontierY.toFixed(1) + '" stroke="#d96c2c" stroke-width="1.6" stroke-dasharray="4 3"/>' : "") +
    '<text x="97" y="' + Math.max(14, frontierY - 4).toFixed(1) + '" font-size="15">🏗️</text></svg>';
}

/* ---------- derived state ---------- */
function progressOf(b) { return Math.min(b.mins, S.progress[b.id] || 0); }
function isBuilt(b) { return !!S.built[b.id]; }
function isUnlocked(b) { return builtCount() >= (TIER_NEED[b.tier] || 0); }
function currentProject() { return S.projectId ? buildingById(S.projectId) : null; }

/* ---------- render ---------- */
function renderHeader() {
  var lv = cityLevel();
  $("chipLevel").textContent = lv.level.name;
  $("chipBuilt").textContent = builtCount();
  $("chipHours").textContent = (totalFocusMinutes() / 60).toFixed(1);
}
function renderSite() {
  var b = currentProject();
  var inSession = !!S.session;
  $("idlePanel").classList.toggle("hidden", inSession);
  $("sessionPanel").classList.toggle("hidden", !inSession);
  if (!b) {
    $("siteView").innerHTML = '<div style="text-align:center;padding:56px 10px 30px;color:#5d7d88;font-size:34px">🏙️<div style="font-size:14px;margin-top:6px">一片空地，等你选第一座建筑</div></div>';
    $("projName").textContent = "还没有选工地";
    $("projLoc").textContent = "去下面的「世界地标图鉴」里，点一座建筑开工。";
    $("projBar").style.width = "0%";
    $("projTxt").innerHTML = "";
    $("buildBtn").disabled = true;
    $("buildBtn").textContent = "先在图鉴里选一座建筑 👇";
    return;
  }
  var done = progressOf(b), pct = done / b.mins;
  $("buildBtn").disabled = false;
  $("buildBtn").textContent = "开始专注施工 🏗️";
  if (inSession) {
    updateSessionUI();
  } else {
    $("siteView").innerHTML = buildingSVG(b, pct);
  }
  $("projName").textContent = b.name + (isBuilt(b) ? "（已建成）" : "");
  $("projLoc").textContent = b.en + " · " + b.country + " " + b.city + " · 共需专注 " + b.mins + " 分钟建成";
  $("projBar").style.width = (pct * 100).toFixed(1) + "%";
  $("projTxt").innerHTML = isBuilt(b)
    ? "这座建筑已经在你的城市里了，换一座继续盖吧。"
    : "已施工 <b>" + done + "</b> / " + b.mins + " 分钟（" + Math.floor(pct * 100) + "%），还差 <b>" + (b.mins - done) + "</b> 分钟建成";
}
function renderDurations() {
  var box = $("durChips");
  box.innerHTML = "";
  DURATIONS.forEach(function (m) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "dur" + (selMinutes === m ? " sel" : "");
    btn.textContent = m + " 分钟";
    btn.addEventListener("click", function () {
      selMinutes = m;
      $("durRange").value = m;
      $("durVal").textContent = m + " 分钟";
      renderDurations();
    });
    box.appendChild(btn);
  });
}
function renderTags() {
  var box = $("tagChips");
  box.innerHTML = "";
  TAGS.forEach(function (t) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "tag" + (selTag === t ? " sel" : "");
    btn.textContent = t;
    btn.addEventListener("click", function () { selTag = t; renderTags(); });
    box.appendChild(btn);
  });
}
function renderBlocklist() {
  var box = $("blockList");
  box.innerHTML = "";
  if (!S.blocklist.length) box.innerHTML = '<span style="color:var(--ink2);font-size:13.5px">黑名单是空的，去下面添加想戒掉的网站。</span>';
  S.blocklist.forEach(function (d) {
    var chip = document.createElement("span");
    chip.className = "site";
    var label = document.createElement("span");
    label.textContent = d;
    chip.appendChild(label);
    var x = document.createElement("button");
    x.type = "button"; x.textContent = "×"; x.title = "移除";
    x.addEventListener("click", function () {
      S.blocklist = S.blocklist.filter(function (v) { return v !== d; });
      storeSave().then(renderBlocklist);
    });
    chip.appendChild(x);
    box.appendChild(chip);
  });
  var preset = $("presetRow");
  preset.innerHTML = "";
  PRESETS.filter(function (d) { return S.blocklist.indexOf(d) < 0; }).forEach(function (d) {
    var btn = document.createElement("button");
    btn.type = "button"; btn.textContent = "+ " + d;
    btn.addEventListener("click", function () { addDomain(d); });
    preset.appendChild(btn);
  });
  $("blockToggle").checked = S.blockEnabled !== false;
}
function normalizeDomain(raw) {
  var d = String(raw || "").trim().toLowerCase();
  d = d.replace(/^https?:\/\//, "").replace(/^www\./, "");
  d = d.split("/")[0].split("?")[0].split(":")[0];
  if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(d)) return null;
  return d;
}
function addDomain(raw) {
  var d = normalizeDomain(raw);
  if (!d) { toast("域名格式不对，请输入类似 douyin.com 的域名"); return; }
  if (S.blocklist.indexOf(d) >= 0) { toast(d + " 已经在黑名单里了"); return; }
  S.blocklist.push(d);
  storeSave().then(function () { toast("已把 " + d + " 加入黑名单"); renderBlocklist(); });
}
function renderSkyline() {
  var row = $("skylineRow");
  row.innerHTML = "";
  var builtList = BUILDINGS.filter(function (b) { return isBuilt(b); })
    .sort(function (a, b2) { return (S.built[a.id] || 0) - (S.built[b2.id] || 0); });
  if (!builtList.length) {
    row.innerHTML = '<div class="skyline-empty">你的城市还是一张白纸 🏜️<br />完成第一座建筑后，它会出现在这里。</div>';
  } else {
    builtList.forEach(function (b) {
      var unit = document.createElement("div");
      unit.className = "unit";
      unit.title = b.name + " · " + b.country + " " + b.city;
      unit.innerHTML = buildingSVG(b, 1) + '<div class="nm"></div>';
      unit.querySelector(".nm").textContent = b.name;
      row.appendChild(unit);
    });
  }
  var lv = cityLevel();
  $("levelText").textContent = "Lv." + (lv.index + 1) + " " + lv.level.name;
  var cur = lv.level.min, nextMin = lv.next ? lv.next.min : builtCount();
  var pct = lv.next ? Math.min(100, (builtCount() - cur) / (nextMin - cur) * 100) : 100;
  $("levelBar").style.width = pct + "%";
  $("levelNext").textContent = lv.next ? "再建 " + (nextMin - builtCount()) + " 座升级为「" + lv.next.name + "」" : "已经是最高等级 🎉";
}
function renderStats() {
  var t = todayStr();
  var todays = S.records.filter(function (r) { return r.date === t; });
  $("stTodayMin").textContent = todays.filter(function (r) { return r.result !== "failed"; })
    .reduce(function (a, r) { return a + r.minutes; }, 0);
  $("stTodayBuilt").textContent = todays.filter(function (r) { return r.result === "completed"; }).length;
  var wk = mondayTs();
  $("stWeekMin").textContent = S.records.filter(function (r) { return r.startTs >= wk && r.result !== "failed"; })
    .reduce(function (a, r) { return a + r.minutes; }, 0);
  $("stFailed").textContent = S.records.filter(function (r) { return r.result === "failed"; }).length;
}
function renderHistory() {
  var ul = $("historyList");
  ul.innerHTML = "";
  var list = S.records.slice().sort(function (a, b) { return b.startTs - a.startTs; }).slice(0, 10);
  if (!list.length) {
    ul.innerHTML = '<li style="color:var(--ink2)">还没有施工记录，先选一座建筑开工吧。</li>';
    return;
  }
  list.forEach(function (r) {
    var b = buildingById(r.buildingId);
    var li = document.createElement("li");
    li.innerHTML = '<div class="main"><div class="t"></div><div class="s"></div></div>';
    li.querySelector(".t").textContent = (b ? b.name : "建筑") + (r.note ? " · " + r.note : " · " + (r.tag || "专注"));
    li.querySelector(".s").textContent = r.date + " " + fmtTime(r.startTs) + " · " +
      (r.result === "failed" ? "坚持了 " + r.minutes + " 分钟后倒塌" : "施工 " + r.minutes + " 分钟") +
      (r.reason === "blocked" && r.blockedHost ? " · 打开了 " + r.blockedHost : r.reason === "manual" ? " · 主动放弃" : "");
    var badge = document.createElement("span");
    if (r.result === "completed") { badge.className = "badge done"; badge.textContent = "🎉 建成"; }
    else if (r.result === "progress") { badge.className = "badge prog"; badge.textContent = "🧱 已施工"; }
    else { badge.className = "badge fail"; badge.textContent = "🏚️ 倒塌"; }
    li.appendChild(badge);
    ul.appendChild(li);
  });
}
function renderAtlas() {
  var tabs = $("atlasTabs");
  tabs.innerHTML = "";
  REGIONS.forEach(function (rg) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = selRegion === rg ? "sel" : "";
    btn.textContent = rg;
    btn.addEventListener("click", function () { selRegion = rg; renderAtlas(); });
    tabs.appendChild(btn);
  });
  var grid = $("atlasGrid");
  grid.innerHTML = "";
  BUILDINGS.filter(function (b) { return selRegion === "全部" || b.region === selRegion; }).forEach(function (b) {
    var built = isBuilt(b), unlocked = isUnlocked(b), current = S.projectId === b.id && !built;
    var done = progressOf(b), pct = Math.round(done / b.mins * 100);
    var card = document.createElement("button");
    card.type = "button";
    card.className = "bcard" + (current ? " current" : "") + (!unlocked ? " locked" : "") + (built ? " built-card" : "");
    var statusHtml;
    if (built) statusHtml = '<div class="st built">✓ 已建成 · 在你的城市里</div>';
    else if (!unlocked) statusHtml = '<div class="st lock">🔒 建成 ' + (TIER_NEED[b.tier]) + " 座建筑后解锁</div>";
    else if (current) statusHtml = '<div class="st" style="color:var(--orange2)">🏗️ 正在施工 · ' + pct + "%</div>";
    else if (done > 0) statusHtml = '<div class="st" style="color:var(--teal)">🧱 已施工 ' + pct + "% · 点我继续盖</div>";
    else statusHtml = '<div class="st" style="color:var(--teal)">点我开工 →</div>';
    card.innerHTML = '<span class="tier-tag">第' + b.tier + " 阶</span>" +
      '<div class="draw">' + buildingSVG(b, built ? 1 : (unlocked ? Math.max(0.02, done / b.mins) : 0)) + "</div>" +
      '<div class="nm"></div><div class="en">' + b.en + '</div><div class="loc">📍 ' + b.country + " · " + b.city + "</div>" +
      '<div class="req">⏱️ 需专注 ' + b.mins + " 分钟</div>" +
      (done > 0 && !built ? '<div class="mini-progress"><div style="width:' + pct + '%"></div></div>' : "") +
      statusHtml;
    card.querySelector(".nm").textContent = b.name;
    card.addEventListener("click", function () { pickProject(b); });
    grid.appendChild(card);
  });
}
function pickProject(b) {
  if (S.session) { toast("正在施工中，先完成这一轮再换工地"); return; }
  if (isBuilt(b)) { toast("「" + b.name + "」已经在你的城市里了 🏛️"); return; }
  if (!isUnlocked(b)) {
    toast("还没解锁：先建成 " + TIER_NEED[b.tier] + " 座建筑（你现在建成了 " + builtCount() + " 座），城市升级后就能盖它");
    return;
  }
  S.projectId = b.id;
  storeSave().then(function () {
    toast("工地选好了：" + b.name + "（" + b.country + " " + b.city + "），开始专注施工吧 🏗️");
    renderAll();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}
function renderAll() {
  renderHeader(); renderSite(); renderDurations(); renderTags();
  renderBlocklist(); renderSkyline(); renderStats(); renderHistory(); renderAtlas();
  $("soundToggle").checked = S.sound !== false;
}

/* ---------- session ---------- */
function combinedProgress(sess) {
  var b = buildingById(sess.buildingId);
  if (!b) return 0;
  var before = S.progress[b.id] || 0;
  var elapsedMin = Math.min(sess.planned, (Date.now() - sess.startTs) / 60000);
  return Math.min(1, (before + elapsedMin) / b.mins);
}
function updateSessionUI() {
  var sess = S.session;
  if (!sess) return;
  var b = buildingById(sess.buildingId);
  var remain = Math.max(0, sess.endTs - Date.now());
  var cp = combinedProgress(sess);
  if (b) $("siteView").innerHTML = buildingSVG(b, Math.max(0.02, cp));
  $("countText").textContent = fmtClock(remain / 1000);
  var stageIdx = Math.min(BUILD_STAGES.length - 1, Math.floor(cp * BUILD_STAGES.length));
  $("stageText").textContent = "🏗️ " + BUILD_STAGES[stageIdx] + " · " + (b ? b.name : "") + " 已建成 " + Math.floor(cp * 100) + "%";
  $("sessMeta").textContent = (sess.tag || "") + (sess.note ? " · " + sess.note : "") +
    " · 本轮 " + sess.planned + " 分钟 · " + fmtTime(sess.endTs) + " 收工";
  var total = sess.endTs - sess.startTs;
  $("sessBar").style.width = Math.min(100, (Date.now() - sess.startTs) / total * 100).toFixed(1) + "%";
  document.title = "🏗️ " + fmtClock(remain / 1000) + " · " + (b ? b.name : "施工中");
}
function startTicking() {
  stopTicking();
  tickTimer = setInterval(function () {
    if (!S.session) { stopTicking(); return; }
    if (Date.now() >= S.session.endTs) { completeSession(); return; }
    updateSessionUI();
  }, 500);
}
function stopTicking() { if (tickTimer) { clearInterval(tickTimer); tickTimer = null; } }

function completeSession() {
  var sess = S.session;
  if (!sess) return;
  var b = buildingById(sess.buildingId);
  S.session = null;
  stopTicking();
  if (!b) { storeSave().then(renderAll); return; }
  var before = S.progress[b.id] || 0;
  var after = Math.min(b.mins, before + sess.planned);
  S.progress[b.id] = after;
  var finished = after >= b.mins && !S.built[b.id];
  if (finished) S.built[b.id] = Date.now();
  S.records.push({
    id: uid(), buildingId: b.id, tag: sess.tag, note: sess.note || "",
    planned: sess.planned, minutes: sess.planned,
    result: finished ? "completed" : "progress",
    startTs: sess.startTs, endTs: sess.endTs, date: dateStr(sess.startTs)
  });
  if (finished && S.projectId === b.id) S.projectId = null;
  storeSave().then(function () {
    notifyBg("city-session-ended");
    playDoneSound();
    var lv = cityLevel();
    if (finished) {
      banner("🎉 <b>" + b.name + "建成啦！</b>" + b.country + " " + b.city + "的地标已经立在你的城市里（现在共 " +
        builtCount() + " 座，城市等级：Lv." + (lv.index + 1) + " " + lv.level.name + "）。去图鉴里选下一座吧！");
    } else {
      banner("🧱 <b>这一轮施工完成了。</b>" + b.name + "进度 " + Math.floor(after / b.mins * 100) + "%（" + after + " / " + b.mins + " 分钟），还差 " + (b.mins - after) + " 分钟建成。再接再厉！");
    }
    document.title = "专注城市建造（离线版）";
    renderAll();
  });
}
function failSession(sess, reason, extra) {
  var elapsedMin = Math.max(0, Math.floor(((extra && extra.failedAt ? extra.failedAt : Date.now()) - sess.startTs) / 60000));
  S.records.push({
    id: uid(), buildingId: sess.buildingId, tag: sess.tag, note: sess.note || "",
    planned: sess.planned, minutes: elapsedMin, result: "failed", reason: reason,
    blockedHost: extra && extra.blockedHost ? extra.blockedHost : "",
    startTs: sess.startTs, endTs: Date.now(), date: dateStr(sess.startTs)
  });
}
function handleFailedFlag() {
  var f = S.sessionFailed;
  if (!f) return false;
  S.sessionFailed = null;
  if (S.session && S.session.startTs === f.startTs) S.session = null;
  stopTicking();
  failSession(f, "blocked", f);
  var b = buildingById(f.buildingId);
  banner("🏚️ <b>这一轮施工倒塌了。</b>专注期间打开了黑名单网站 <b>" + (f.blockedHost || "") + "</b>，本轮不计进度；" +
    (b ? b.name + "之前累积的进度还在（" + (S.progress[b.id] || 0) + " / " + b.mins + " 分钟），重新专注一轮接着盖。" : ""));
  document.title = "专注城市建造（离线版）";
  return true;
}
function abandonSession() {
  var sess = S.session;
  if (!sess) return;
  S.session = null;
  stopTicking();
  failSession(sess, "manual", null);
  storeSave().then(function () {
    notifyBg("city-session-ended");
    banner("🏚️ <b>你放弃了这一轮</b>，本次施工作废。已累积的进度还在，休息一下再接着盖。");
    document.title = "专注城市建造（离线版）";
    renderAll();
  });
}

/* ---------- events ---------- */
function bindEvents() {
  $("durRange").addEventListener("input", function () {
    selMinutes = parseInt(this.value, 10);
    $("durVal").textContent = selMinutes + " 分钟";
    renderDurations();
  });
  $("buildBtn").addEventListener("click", function () {
    var b = currentProject();
    if (!b || S.session) return;
    var now = Date.now();
    S.session = {
      buildingId: b.id, tag: selTag, note: $("noteInput").value.trim(),
      planned: selMinutes, startTs: now, endTs: now + selMinutes * 60000
    };
    banner("");
    storeSave().then(function () {
      notifyBg("city-session-started");
      toast("开工！专心盖「" + b.name + "」🏗️");
      renderAll();
      startTicking();
    });
  });
  $("abandonBtn").addEventListener("click", function () {
    if (!abandonArmed) {
      abandonArmed = true;
      this.textContent = "再点一次确认放弃 — 本轮施工作废 🏚️";
      this.classList.add("confirm");
      var btn = this;
      clearTimeout(abandonTimer);
      abandonTimer = setTimeout(function () {
        abandonArmed = false;
        btn.textContent = "放弃这一轮（本次施工作废）";
        btn.classList.remove("confirm");
      }, 3200);
      return;
    }
    abandonArmed = false;
    this.textContent = "放弃这一轮（本次施工作废）";
    this.classList.remove("confirm");
    abandonSession();
  });
  $("soundToggle").addEventListener("change", function () { S.sound = this.checked; storeSave(); });
  $("blockToggle").addEventListener("change", function () {
    S.blockEnabled = this.checked;
    var on = this.checked;
    storeSave().then(function () {
      toast(on ? "深度专注已开启：施工时打开黑名单网站，本轮作废" : "深度专注已关闭：施工时不再拦截黑名单网站");
    });
  });
  $("blockAddBtn").addEventListener("click", function () {
    addDomain($("blockInput").value);
    $("blockInput").value = "";
  });
  $("blockInput").addEventListener("keydown", function (e) {
    if (e.key === "Enter") { addDomain(this.value); this.value = ""; }
  });
  $("exportBtn").addEventListener("click", function () {
    var blob = new Blob([JSON.stringify(S, null, 2)], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "专注城市备份-" + todayStr() + ".json";
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
    toast("备份已导出，收好这个 JSON 文件");
  });
  $("importBtn").addEventListener("click", function () { $("importFile").click(); });
  $("importFile").addEventListener("change", function () {
    var file = this.files && this.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var data = JSON.parse(String(reader.result));
        if (!data || !Array.isArray(data.records) || typeof data.progress !== "object" || typeof data.built !== "object") throw new Error("bad");
        if (!window.confirm("导入会覆盖现在的城市、进度和黑名单，确定继续吗？")) return;
        var fresh = defaultState();
        Object.keys(fresh).forEach(function (k) { if (data[k] !== undefined) fresh[k] = data[k]; });
        fresh.session = null; fresh.sessionFailed = null;
        S = fresh;
        storeSave().then(function () { toast("导入成功"); renderAll(); });
      } catch (e) { toast("导入失败：这不是有效的专注城市备份文件"); }
    };
    reader.readAsText(file);
    this.value = "";
  });
  $("clearBtn").addEventListener("click", function () {
    if (!window.confirm("清空全部数据？城市、建筑进度、黑名单和记录都会被删除且无法恢复。建议先导出一份备份。")) return;
    S = defaultState();
    stopTicking();
    storeSave().then(function () {
      notifyBg("city-session-ended");
      toast("已清空全部数据");
      document.title = "专注城市建造（离线版）";
      renderAll();
    });
  });
  document.addEventListener("visibilitychange", function () { if (!document.hidden) syncFromStore(); });
  window.addEventListener("focus", syncFromStore);
  if (hasExt && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener(function (changes, area) {
      if (area !== "local" || !changes[STORE_KEY] || isSaving) return;
      var nv = changes[STORE_KEY].newValue;
      if (nv && nv.sessionFailed) {
        S = Object.assign(defaultState(), nv);
        if (handleFailedFlag()) storeSave().then(renderAll);
      }
    });
  }
}
function syncFromStore() {
  storeLoad().then(function (data) {
    if (!data) return;
    S = Object.assign(defaultState(), data);
    if (handleFailedFlag()) { storeSave().then(renderAll); return; }
    if (S.session && Date.now() >= S.session.endTs) { renderAll(); completeSession(); return; }
    renderAll();
    if (S.session) startTicking();
  });
}

/* ---------- init ---------- */
storeLoad().then(function (data) {
  if (data) S = Object.assign(defaultState(), data);
  bindEvents();
  var changed = handleFailedFlag();
  if (S.session && Date.now() >= S.session.endTs) {
    renderAll();
    completeSession();
    return;
  }
  if (changed) storeSave();
  renderAll();
  if (S.session) startTicking();
});
