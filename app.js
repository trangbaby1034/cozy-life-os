/* Cozy Life OS – app chính.
   TỆP NÀY DO tools/build.mjs TẠO RA. Đừng sửa trực tiếp: hãy sửa trong src/ rồi chạy  node tools/build.mjs */
(async () => {
/* ===== src/01-core.js ===== */
const $ = s => document.querySelector(s);
const pad = n => String(n).padStart(2, '0');
const dk = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const hm = d => pad(d.getHours()) + ':' + pad(d.getMinutes());
const esc = s =>
  String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const fmtDate = iso => {
  const d = new Date(iso);
  return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear() + ' ' + hm(d);
};
const daysSince = iso => Math.floor((Date.now() - new Date(iso)) / 864e5);

const MOODS = [
  ['happy', '🥰', 'Yêu đời'],
  ['calm', '🙂', 'Bình thường'],
  ['sleepy', '😪', 'Buồn ngủ'],
  ['stress', '😵‍💫', 'Căng thẳng'],
  ['sad', '🥺', 'Buồn']
];
const WEATHER = [
  ['sun', '☀️', 'Nắng'],
  ['rain', '🌧️', 'Mưa'],
  ['cold', '🧣', 'Lạnh'],
  ['humid', '🌫️', 'Nồm ẩm'],
  ['hot', '🥵', 'Nóng']
];
const BODY = [
  ['ok', '💪', 'Khỏe'],
  ['tired', '🫠', 'Mệt'],
  ['sick', '🤒', 'Ốm'],
  ['sore', '🦵', 'Đau nhức cơ']
];
const PROMPTS = [
  'Điều gì làm bạn cười hôm nay?',
  'Hôm nay bạn tự hào về việc gì?',
  'Một điều nhỏ bạn biết ơn?',
  'Nếu được làm lại, bạn muốn đổi gì?',
  'Hôm nay ai làm bạn thấy ấm lòng?'
];
const PRAISE = [
  'Hôm nay {n} giỏi lắm đó!',
  '{n} ơi, uống ngụm nước đi nè 💧',
  'Mình luôn ở đây cổ vũ {n}!',
  'Từng bước nhỏ thôi, {n} làm được mà ✨',
  '{n} cười lên xinh lắm!'
];
const HAIRC = ['#2B2223', '#4A3530', '#6B4A3A', '#C98B6B', '#F4A7B9'];

const LOOKDEF0 = {
  face: 'auto',
  blush: 'soft',
  lip: '#E8848D',
  lash: 'natural',
  freckles: false,
  eyewear: 'none',
  head: 'none',
  ear: 'stud',
  watch: true,
  bag: true
};
const DEF = () => ({
  name: 'bạn',
  hair: 'straight',
  hairColor: '#2B2223',
  fav: 'pink',
  autoSwap: true,
  look: Object.assign({}, LOOKDEF0),
  nightWear: 'pj',
  roam: true,
  bedTarget: '23:00',
  days: {},
  sleeps: [],
  pendingBed: null,
  sample: false,
  v2: true,
  seasonWear: true,
  theme: 'auto',
  lastBackup: null,
  hideInstall: false,
  createdAt: new Date().toISOString(),
  tasks: [],
  taskGroup: 'work',
  pomo: null,
  pomoLen: 25,
  pomoSound: 'none',
  remindDefault: { task: 'cal', bed: 'chibi', bday: 'cal', bdayLead: 3, appt: 'cal' },
  people: [],
  appts: [],
  nudgeLog: {},
  nudgeSnooze: null,
  gym: { days: [], time: '18:00', goal: 'muscle', equip: 'gym', rest: 90, remind: 'cal', bell: false },
  workouts: [],
  customEx: [],
  water: { cups: 8, ml: 250, weight: '', activity: 'low', auto: true },
  cardOrder: [],
  cardHidden: [],
  lowFx: false,
  habits: [
    { id: 'water', n: 'Uống đủ nước', i: '💧', auto: 'water' },
    { id: 'move', n: 'Vận động', i: '🏃', auto: 'gym' },
    { id: 'read', n: 'Đọc sách', i: '📖' },
    { id: 'sleep', n: 'Ngủ sớm', i: '😴', auto: 'sleep' }
  ],
  routine: [],
  notes: []
});

/* ---------- Đọc dữ liệu từ máy ---------- */
let S = DEF();
function normalize() {
  if (!S.look) {
    S.look = Object.assign({}, LOOKDEF0);
    if (S.acc) {
      S.look.ear = S.acc.ear === false ? 'none' : 'stud';
      S.look.watch = S.acc.watch !== false;
      S.look.bag = S.acc.bag !== false;
    }
  }
  S.look = Object.assign({}, LOOKDEF0, S.look);
  if (!S.nightWear) S.nightWear = 'pj';
  if (S.seasonWear === undefined) S.seasonWear = true;
  if (!S.theme) S.theme = 'auto';
  if (!S.days || typeof S.days !== 'object') S.days = {};
  if (!Array.isArray(S.sleeps)) S.sleeps = [];
  if (!Array.isArray(S.tasks)) S.tasks = [];
  if (!S.taskGroup) S.taskGroup = 'work';
  if (![15, 25, 45].includes(S.pomoLen)) S.pomoLen = 25;
  if (!S.pomoSound) S.pomoSound = 'none';
  S.remindDefault = Object.assign(
    { task: 'cal', bed: 'chibi', bday: 'cal', bdayLead: 3, appt: 'cal' },
    S.remindDefault || {}
  );
  if (!Array.isArray(S.people)) S.people = [];
  if (!Array.isArray(S.appts)) S.appts = [];
  if (!S.nudgeLog || typeof S.nudgeLog !== 'object') S.nudgeLog = {};
  S.gym = Object.assign(
    { days: [], time: '18:00', goal: 'muscle', equip: 'gym', rest: 90, remind: 'cal', bell: false },
    S.gym || {}
  );
  if (!Array.isArray(S.workouts)) S.workouts = [];
  if (!Array.isArray(S.customEx)) S.customEx = [];
  S.water = Object.assign({ cups: 8, ml: 250, weight: '', activity: 'low', auto: true }, S.water || {});
  if (!Array.isArray(S.habits)) S.habits = DEF().habits;
  if (!Array.isArray(S.routine)) S.routine = [];
  if (!Array.isArray(S.notes)) S.notes = [];
  if (!S.v2) {
    const d = DEF();
    Object.assign(S, { hair: d.hair, hairColor: d.hairColor, fav: d.fav, autoSwap: true, v2: true });
  }
}
const loaded = await CozyDB.loadState();
if (loaded) S = Object.assign(S, loaded);
normalize();
let persistState = 'unknown';
CozyDB.persist().then(r => {
  persistState = r;
  if (tab === 'set') render();
});
/* Bản chụp tự động: mỗi ngày giữ lại một bản của dữ liệu (7 ngày gần nhất) */
const hasData = st =>
  Object.keys(st.days || {}).length ||
  (st.sleeps || []).length ||
  (st.tasks || []).length ||
  (st.workouts || []).length ||
  (st.people || []).length;
if (loaded && hasData(S)) {
  CozyDB.listSnapshots()
    .then(l => {
      const k = 'auto-' + dk(new Date());
      if (!l.some(s => s.key === k)) CozyDB.putSnapshot(k, S, 'Tự động');
    })
    .catch(() => {});
}

let saveT;
const save = () => {
  clearTimeout(saveT);
  saveT = setTimeout(() => CozyDB.saveState(S), 250);
};
const flush = () => {
  clearTimeout(saveT);
  return CozyDB.saveState(S);
};
addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') flush();
});
addEventListener('pagehide', flush);

let tab = 'today',
  demoNight = false;
const today = () => {
  const k = dk(new Date());
  return (
    S.days[k] ||
    (S.days[k] = {
      top3: [
        { t: '', d: false },
        { t: '', d: false },
        { t: '', d: false }
      ],
      water: 0,
      candies: [],
      checkin: null,
      evening: null
    })
  );
};

/* ===== src/02-season-chibi.js ===== */
/* 🎨 Mùa: xmas (15/11–26/12) · ny – Năm mới dương lịch (27/12–5/1) · tet – Tết Nguyên Đán (3 tuần trước → mùng 10) */
const CAN = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'],
  CHI = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];
const canChi = y => CAN[(y + 6) % 10] + ' ' + CHI[(y + 8) % 12];
/* Mùng 1 Tết (đã đối chiếu lịch). Sau 2031 cần cập nhật thêm. */
const TET = {
  2026: '2026-02-17',
  2027: '2027-02-06',
  2028: '2028-01-26',
  2029: '2029-02-13',
  2030: '2030-02-03',
  2031: '2031-01-23'
};
function nextTet() {
  const n = new Date();
  n.setHours(0, 0, 0, 0);
  for (const y of Object.keys(TET)
    .map(Number)
    .sort((a, b) => a - b)) {
    const t = new Date(TET[y] + 'T00:00:00'),
      diff = Math.round((t - n) / 864e5);
    if (diff >= -10) return { y, t, diff };
  }
  return null;
}
function season() {
  const th = S.theme || 'auto';
  if (th === 'none') return null;
  if (th !== 'auto') return th;
  const n = new Date(),
    m = n.getMonth() + 1,
    d = n.getDate(),
    T = nextTet();
  if (T && T.diff <= 21) return 'tet';
  if ((m === 12 && d >= 27) || (m === 1 && d <= 5)) return 'ny';
  if ((m === 11 && d >= 15) || (m === 12 && d <= 26)) return 'xmas';
  return null;
}
const isXmas = () => season() === 'xmas';
function seasonLabel() {
  const se = season(),
    n = new Date();
  if (se === 'xmas') return xmasLabel();
  if (se === 'ny') {
    const y = n.getMonth() === 11 ? n.getFullYear() + 1 : n.getFullYear();
    if (n.getMonth() === 11) {
      const dd = Math.round((new Date(y, 0, 1) - new Date(n.getFullYear(), 11, n.getDate())) / 864e5);
      return dd <= 1 ? '🎆 Tối nay giao thừa, đón năm ' + y + '!' : '🎆 Còn ' + dd + ' ngày đến năm ' + y;
    }
    return '🎆 Chúc mừng năm mới ' + y + '!';
  }
  if (se === 'tet') {
    const T = nextTet();
    if (!T) return '🧧 Chúc mừng năm mới';
    const cc = canChi(T.y);
    if (T.diff > 1) return '🧧 Còn ' + T.diff + ' ngày đến Tết ' + cc;
    if (T.diff === 1) return '🧧 Tối nay giao thừa, đón Tết ' + cc + '!';
    if (T.diff === 0) return '🧧 Mùng 1 Tết ' + cc + ' · An khang thịnh vượng!';
    return '🧧 Mùng ' + (1 - T.diff) + ' Tết ' + cc + ' · Vạn sự như ý!';
  }
  return '';
}
function daysToXmas() {
  const n = new Date();
  n.setHours(0, 0, 0, 0);
  let x = new Date(n.getFullYear(), 11, 25);
  if (n > x) x = new Date(n.getFullYear() + 1, 11, 25);
  return Math.round((x - n) / 864e5);
}
function xmasLabel() {
  const d = daysToXmas(),
    n = new Date();
  if (n.getMonth() === 11 && n.getDate() === 25) return '🎄 Giáng sinh an lành!';
  if (n.getMonth() === 11 && n.getDate() > 25) return '🎄 Mùa Giáng sinh vui vẻ!';
  return '🎄 Còn ' + d + ' ngày đến Giáng sinh';
}
function isNight() {
  if (demoNight) return true;
  const n = new Date(),
    [h, m] = S.bedTarget.split(':').map(Number);
  const mins = n.getHours() * 60 + n.getMinutes(),
    t = h * 60 + m;
  return mins >= t - 30 || mins < 240;
}
function state() {
  const d = today(),
    c = d.checkin || {};
  let mood = c.mood || 'calm';
  if (c.body === 'sick') mood = 'sick';
  let outfit =
    S.autoSwap && (isNight() || c.body === 'sick') ? S.nightWear : S.autoSwap && c.body === 'sore' ? 'gym' : S.fav;
  if (activeWo() || (S.autoSwap && outfit === S.fav && S.gym.days.length && planFor(new Date()))) outfit = 'gym';
  if (outfit === S.fav && S.seasonWear !== false && season() === 'tet' && !(OUTFITS[outfit] || {}).kig)
    outfit = 'aodai';
  return { mood, outfit };
}

const OUTFITS = {
  pink: { n: 'Váy hồng bí', d: 'Cổ yếm, chân váy phồng', c: '#F4B3A3', k: '#E3988A', shoe: '#FFFFFF' },
  beige: { n: 'Cúp ngực nhún be', d: 'Thân nhún bèo, tông nude', c: '#E9D5BC', k: '#D2B996', shoe: '#E9D5BC' },
  lace: { n: 'Hai dây ren trắng', d: 'Áo ren, chân váy tối màu', c: '#F7F2EB', k: '#DCCFBF', shoe: '#3B3740' },
  fluffy: { n: 'Len lông đen', d: 'Cổ yếm cao, lông xù', c: '#2B2729', k: '#45403F', shoe: '#2B2729' },
  brocade: { n: 'Gấm hoa', d: 'Cúp ngực thêu hoa nhí', c: '#ECE1CC', k: '#D8C7A8', shoe: '#F2E6D4' },
  dino: { n: 'Khủng long', d: 'Đồ bộ liền mũ có gai', c: '#A8DDB0', k: '#7CC48A', b: '#FFF3C4', kig: 1 },
  bear: { n: 'Gấu bắc cực', d: 'Đồ bộ lông trắng tai tròn', c: '#F7F9FC', k: '#D5DDE8', b: '#FFFFFF', kig: 1 },
  bunny: { n: 'Thỏ hồng', d: 'Đồ bộ tai dài', c: '#FFD9E3', k: '#F5B3C5', b: '#FFF4F7', kig: 1 },
  cat: { n: 'Mèo cam', d: 'Đồ bộ tai nhọn, có vằn', c: '#FFD8A8', k: '#F0B572', b: '#FFF4E3', kig: 1 },
  noel: { n: 'Váy Noel', d: 'Nhung đỏ viền lông trắng', c: '#D94A4F', k: '#B8353B', shoe: '#3E3233' },
  sweater: { n: 'Áo len Giáng sinh', d: 'Len xanh họa tiết, chân váy đỏ', c: '#6FAF8A', k: '#4F8E6B', shoe: '#B73C47' },
  reindeer: { n: 'Tuần lộc', d: 'Đồ bộ có gạc và mũi đỏ', c: '#C99D72', k: '#A67B52', b: '#F3E1C8', kig: 1 },
  pj: { n: 'Pijama chấm bi', d: 'Đồ ngủ cơ bản', c: '#CDBEF5', k: '#B9A6EE', shoe: '#B9A6EE' },
  gym: { n: 'Đồ tập', d: 'Tự mặc khi đau nhức cơ', c: '#8FD9B6', k: '#6FC59F', shoe: '#FFFFFF', auto: 1 },
  aodai: { n: 'Áo dài đỏ', d: 'Áo dài Tết thêu hoa mai vàng', c: '#D7263D', k: '#A81C2E', shoe: '#F4C430' }
};
const TETW = ['aodai'],
  DAY = ['pink', 'beige', 'lace', 'fluffy', 'brocade', 'noel', 'sweater', 'aodai'],
  KIG = ['dino', 'bear', 'bunny', 'cat'],
  XMAS = ['noel', 'sweater', 'reindeer'],
  NIGHT = ['pj', 'dino', 'bear', 'bunny', 'cat', 'reindeer'];
const LIPS = [
  ['#E8848D', 'Hồng nhạt'],
  ['#F08A6E', 'Cam đào'],
  ['#D9534F', 'Đỏ cam'],
  ['#B8323F', 'Đỏ ruby'],
  ['#C9897A', 'Nude']
];
const FACES = [
  ['auto', '🎭', 'Theo tâm trạng'],
  ['smile', '🙂', 'Mỉm cười'],
  ['happy', '😆', 'Cười tươi'],
  ['wink', '😉', 'Nháy mắt'],
  ['pout', '😗', 'Phồng má'],
  ['cool', '😌', 'Sang chảnh']
];
const LOOKDEF = LOOKDEF0;
let GID = 0;
function shade(h, p) {
  const n = parseInt(h.slice(1), 16);
  let r = n >> 16,
    g = (n >> 8) & 255,
    b = n & 255;
  const t = p < 0 ? 0 : 255,
    a = Math.abs(p);
  r = Math.round(r + (t - r) * a);
  g = Math.round(g + (t - g) * a);
  b = Math.round(b + (t - b) * a);
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}
function outfitSvg(k, cf) {
  const o = OUTFITS[k] || OUTFITS.pink,
    c = cf || o.c,
    dk = o.k;
  const bod = `<path d="M70 154Q100 147 130 154L128 188Q100 194 72 188Z" fill="${c}"/>`;
  const aline = f => `<path d="M72 186L128 186L138 209Q100 217 62 209Z" fill="${f}"/>`;
  if (o.kig)
    return (
      `<path d="M68 146Q100 136 132 146L140 205Q100 215 60 205Z" fill="${c}" stroke="${dk}" stroke-width="1.5"/><ellipse cx="100" cy="180" rx="21" ry="23" fill="${o.b}"/>` +
      (k === 'dino'
        ? `<path d="M84 172H116M82 182H118M86 192H114" stroke="${dk}" stroke-width="2" opacity=".5"/>`
        : k === 'cat'
          ? `<path d="M70 160l10 3M70 172l9 2M130 160l-10 3M130 172l-9 2" stroke="${dk}" stroke-width="3" stroke-linecap="round"/>`
          : '')
    );
  if (k === 'noel')
    return (
      bod +
      aline(c) +
      `<rect x="67" y="149" width="66" height="10" rx="5" fill="#fff"/><path d="M60 206Q100 215 140 206L142 213Q100 223 58 213Z" fill="#fff"/><rect x="71" y="183" width="58" height="5" fill="#3E3233"/><rect x="95.5" y="181" width="9" height="9" rx="1.5" fill="none" stroke="#E0B04A" stroke-width="2"/>`
    );
  if (k === 'sweater')
    return (
      `<path d="M68 146Q100 136 132 146L134 190Q100 196 66 190Z" fill="${c}"/><path d="M68 168l6-5 6 5 6-5 6 5 6-5 6 5 6-5 6 5 6-5 6 5 6-5" stroke="#fff" stroke-width="2.5" fill="none"/>` +
      [
        [78, 178],
        [94, 180],
        [110, 178],
        [124, 180],
        [86, 156],
        [114, 156]
      ]
        .map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="2.6" fill="${i % 2 ? '#fff' : '#E5484D'}"/>`)
        .join('') +
      `<path d="M80 145Q100 153 120 145" stroke="${dk}" stroke-width="5" fill="none" stroke-linecap="round"/>` +
      aline('#B73C47')
    );
  if (k === 'pink')
    return (
      bod +
      `<path d="M72 186Q100 194 128 186Q150 196 141 211Q100 223 59 211Q50 196 72 186Z" fill="${c}"/><path d="M81 193L79 208M93 195L92 213M107 195L108 213M119 193L121 208" stroke="${dk}" stroke-width="2" stroke-linecap="round"/><path d="M72 188Q100 194 128 188" fill="none" stroke="${dk}" stroke-width="2"/>`
    );
  if (k === 'beige')
    return (
      bod +
      [160, 168, 176, 184]
        .map(y => `<path d="M72 ${y}q7-5 14 0t14 0t14 0t14 0" fill="none" stroke="${dk}" stroke-width="2"/>`)
        .join('') +
      aline('#EFE3D1')
    );
  if (k === 'lace')
    return (
      `<path d="M70 156Q100 150 130 156L128 186Q100 190 72 186Z" fill="${c}"/>` +
      [74, 82, 90, 98, 106, 114, 122]
        .map(x => `<circle cx="${x + 2}" cy="156" r="4" fill="${c}" stroke="${dk}" stroke-width="1.2"/>`)
        .join('') +
      [
        [82, 168],
        [96, 174],
        [110, 166],
        [120, 178],
        [88, 180],
        [104, 182]
      ]
        .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.6" fill="none" stroke="${dk}" stroke-width="1.2"/>`)
        .join('') +
      aline('#3B3740')
    );
  if (k === 'fluffy')
    return (
      `<path d="M72 150Q100 140 128 150L129 188Q100 194 71 188Z" fill="${c}"/>` +
      [
        [78, 158],
        [92, 152],
        [108, 156],
        [122, 160],
        [84, 172],
        [100, 168],
        [116, 174],
        [90, 184],
        [110, 184],
        [76, 180],
        [124, 180]
      ]
        .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4.5" fill="${dk}" opacity=".8"/>`)
        .join('') +
      aline('#3E393C')
    );
  if (k === 'brocade')
    return (
      bod +
      [
        [80, 162, '#F2A7B5'],
        [96, 170, '#9CC7A0'],
        [112, 160, '#F2A7B5'],
        [122, 176, '#9CC7A0'],
        [86, 180, '#9CC7A0'],
        [104, 182, '#F2A7B5']
      ]
        .map(
          ([x, y, f]) =>
            `<circle cx="${x}" cy="${y}" r="3.2" fill="${f}"/><circle cx="${x}" cy="${y}" r="1.2" fill="#fff"/>`
        )
        .join('') +
      aline('#F7F0E4')
    );
  if (k === 'aodai')
    return (
      `<path d="M67 146Q100 136 133 146L139 214Q122 219 108 211L100 193L92 211Q78 219 61 214Z" fill="${c}"/><path d="M100 151V193" stroke="${dk}" stroke-width="1.4" opacity=".55"/><rect x="89" y="141" width="22" height="8" rx="3" fill="#F4C430"/>` +
      [
        [84, 166],
        [115, 171],
        [97, 183],
        [121, 195],
        [78, 199]
      ]
        .map(
          ([x, y]) =>
            `<g fill="#F4C430"><circle cx="${x}" cy="${y}" r="2"/><circle cx="${x - 3}" cy="${y - 2}" r="1.6"/><circle cx="${x + 3}" cy="${y - 2}" r="1.6"/><circle cx="${x - 2}" cy="${y + 2.6}" r="1.6"/><circle cx="${x + 2}" cy="${y + 2.6}" r="1.6"/></g>`
        )
        .join('')
    );
  if (k === 'gym')
    return `<path d="M72 152Q100 146 128 152L134 188L66 188Z" fill="${c}"/><rect x="66" y="184" width="68" height="22" rx="8" fill="#7C6BA8"/>`;
  return `<path d="M70 142Q100 134 130 142L146 204Q100 214 54 204Z" fill="${c}"/><circle cx="86" cy="168" r="4" fill="#fff" opacity=".8"/><circle cx="112" cy="182" r="4" fill="#fff" opacity=".8"/><circle cx="98" cy="196" r="4" fill="#fff" opacity=".8"/><circle cx="120" cy="158" r="4" fill="#fff" opacity=".8"/>`;
}
function hoodBack(k, cf) {
  const o = OUTFITS[k],
    c = cf || o.c,
    dk = o.k;
  let e = '';
  if (k === 'bear')
    e = `<circle cx="52" cy="42" r="17" fill="${c}" stroke="${dk}" stroke-width="2"/><circle cx="148" cy="42" r="17" fill="${c}" stroke="${dk}" stroke-width="2"/><circle cx="52" cy="42" r="8" fill="#FFD3DC"/><circle cx="148" cy="42" r="8" fill="#FFD3DC"/>`;
  if (k === 'bunny')
    e = `<ellipse cx="74" cy="16" rx="12" ry="32" fill="${c}" transform="rotate(-12 74 16)"/><ellipse cx="126" cy="16" rx="12" ry="32" fill="${c}" transform="rotate(12 126 16)"/><ellipse cx="74" cy="18" rx="6" ry="22" fill="#FFF4F7" transform="rotate(-12 74 18)"/><ellipse cx="126" cy="18" rx="6" ry="22" fill="#FFF4F7" transform="rotate(12 126 18)"/>`;
  if (k === 'cat')
    e = `<path d="M44 52L50 14L80 34Z M156 52L150 14L120 34Z" fill="${c}"/><path d="M52 40L54 24L68 34Z M148 40L146 24L132 34Z" fill="#FFC2C2"/>`;
  if (k === 'reindeer')
    e = `<path d="M66 44L56 12M60 28L46 22M62 36L50 38M134 44L144 12M140 28L154 22M138 36L150 38" stroke="#8B5E3C" stroke-width="5" stroke-linecap="round" fill="none"/><ellipse cx="38" cy="74" rx="8" ry="15" fill="${c}" transform="rotate(-50 38 74)"/><ellipse cx="162" cy="74" rx="8" ry="15" fill="${c}" transform="rotate(50 162 74)"/>`;
  if (k === 'dino')
    e = [
      [48, 52],
      [60, 34],
      [78, 24],
      [100, 20],
      [122, 24],
      [140, 34],
      [152, 52]
    ]
      .map(
        ([x, y], i) =>
          `<path d="M${x - 9} ${y + 8}L${x} ${y - 10}L${x + 9} ${y + 8}Z" fill="${dk}" transform="rotate(${(i - 3) * 16} ${x} ${y})"/>`
      )
      .join('');
  return (
    e +
    `<circle cx="100" cy="92" r="67" fill="${c}" stroke="${dk}" stroke-width="2"/>` +
    (k === 'dino'
      ? `<circle cx="82" cy="33" r="5" fill="#fff"/><circle cx="118" cy="33" r="5" fill="#fff"/><circle cx="83" cy="34" r="2.6" fill="#3E3233"/><circle cx="119" cy="34" r="2.6" fill="#3E3233"/>`
      : k === 'reindeer'
        ? `<circle cx="84" cy="34" r="4.5" fill="#fff"/><circle cx="116" cy="34" r="4.5" fill="#fff"/><circle cx="85" cy="35" r="2.4" fill="#3E3233"/><circle cx="117" cy="35" r="2.4" fill="#3E3233"/><circle cx="100" cy="40" r="6" fill="#E5484D"/><circle cx="98" cy="38" r="1.8" fill="#fff" opacity=".7"/>`
        : k === 'cat'
          ? `<path d="M90 28l2 10M100 26v11M110 28l-2 10" stroke="${dk}" stroke-width="3" stroke-linecap="round"/>`
          : '')
  );
}
function tail(k) {
  const o = OUTFITS[k];
  if (k === 'dino')
    return `<path d="M128 192Q160 196 176 212Q150 214 126 206Z" fill="${o.c}" stroke="${o.k}" stroke-width="1.5"/><path d="M146 194l5-7 3 9M160 200l6-6 2 9" fill="${o.k}"/>`;
  if (k === 'cat')
    return `<path d="M132 198Q166 200 160 176Q156 166 164 160" fill="none" stroke="${o.c}" stroke-width="9" stroke-linecap="round"/>`;
  if (k === 'bunny' || k === 'bear' || k === 'reindeer')
    return `<circle cx="140" cy="200" r="9" fill="${o.k === '#F5B3C5' ? '#FFF4F7' : '#fff'}" stroke="${o.k}" stroke-width="1.5"/>`;
  return '';
}
function eye(x, t, L, ef) {
  const d = x < 100 ? -1 : 1,
    ink = '#3E3233',
    fi = ef || ink,
    hl2 = ef ? `<circle cx="${x - 2.6}" cy="108.6" r="1.3" fill="#fff" opacity=".85"/>` : '';
  const lash = y =>
    `<path d="M${x - 7.5} ${y}Q${x} ${y - 5.5} ${x + 7.5} ${y - 0.5}M${x + d * 7.5} ${y - (d > 0 ? 0.5 : 0)}l${d * 3.5} -2.5" fill="none" stroke="${ink}" stroke-width="2.4" stroke-linecap="round"/>` +
    (L.lash === 'long'
      ? `<path d="M${x + d * 4.5} ${y - 3.6}l${d * 2.2} -3.4M${x + d * 0.5} ${y - 5}l${d * 0.8} -3.6" stroke="${ink}" stroke-width="1.8" stroke-linecap="round"/>`
      : '');
  if (t === 'open')
    return (
      `<ellipse cx="${x}" cy="105" rx="6.5" ry="8" fill="${fi}"/><circle cx="${x + 2.5}" cy="102" r="2.4" fill="#fff"/>${hl2}` +
      lash(101)
    );
  if (t === 'look')
    return (
      `<ellipse cx="${x}" cy="108" rx="6" ry="6" fill="${fi}"/><circle cx="${x + 2}" cy="106.5" r="1.8" fill="#fff"/>` +
      lash(103.5)
    );
  if (t === 'arc')
    return `<path d="M${x - 9} 106Q${x} 96 ${x + 9} 106" fill="none" stroke="${ink}" stroke-width="4" stroke-linecap="round"/>`;
  if (t === 'down')
    return `<path d="M${x - 8} 106Q${x} 110 ${x + 8} 106" fill="none" stroke="${ink}" stroke-width="3.5" stroke-linecap="round"/>`;
  if (t === 'cool')
    return `<ellipse cx="${x}" cy="107" rx="6.5" ry="5.5" fill="${fi}"/><circle cx="${x + 2.5}" cy="106" r="1.8" fill="#fff"/><path d="M${x - 8} 102.5H${x + 8}M${x + d * 8} 102.5l${d * 3} -2" stroke="${ink}" stroke-width="2.8" stroke-linecap="round"/>`;
  return '';
}
const POSE = {
  lixi: 'hold',
  banhchung: 'hold',
  sparkler: 'up',
  sign: 'up',
  magic: 'up',
  cocoa: 'mouth',
  gift: 'hold',
  drink: 'mouth',
  boba: 'mouth',
  yawn: 'mouth',
  tissue: 'mouth',
  read: 'hold',
  phone: 'hold',
  laptop: 'hold',
  teddy: 'hold',
  stretch: 'up',
  dance: 'up',
  wave: 'wave'
};
const ACTFACE = {
  lixi: 'happy',
  banhchung: 'happy',
  sparkler: 'happy',
  sign: 'smile',
  magic: 'happy',
  cocoa: 'happy',
  gift: 'happy',
  snowman: 'happy',
  drink: 'happy',
  boba: 'smile',
  read: 'look',
  phone: 'look',
  laptop: 'look',
  yawn: 'yawn',
  nap: 'sleepy',
  tissue: 'squeeze',
  shiver: 'sick',
  teddy: 'sad',
  dance: 'happy',
  wave: 'happy',
  stretch: 'squeeze',
  breathe: 'calmclosed'
};
function armsSvg(pose, AF, SK) {
  const arm = (cx, cy, r) =>
      `<ellipse cx="${cx}" cy="${cy}" rx="9" ry="19" fill="${AF}" transform="rotate(${r} ${cx} ${cy})"/>`,
    hand = (x, y) => `<circle cx="${x}" cy="${y}" r="8.5" fill="${SK}"/>`;
  const L = arm(62, 168, 14) + hand(57, 186),
    Rt = arm(138, 168, -14) + hand(144, 184);
  if (pose === 'hold') return arm(72, 166, -38) + arm(128, 166, 38) + hand(85, 178) + hand(115, 178);
  if (pose === 'mouth') return L + arm(123, 143, -49) + hand(111, 132);
  if (pose === 'up') return arm(58, 135, -25) + arm(142, 135, 25) + hand(50, 117) + hand(150, 117);
  if (pose === 'wave') return L + `<g class="waveArm">${arm(142, 135, 25) + hand(150, 117)}</g>`;
  return L + Rt;
}
function actItem(a) {
  switch (a) {
    case 'drink':
      return `<g class="sip"><g transform="rotate(-35 113 128)"><rect x="104" y="116" width="17" height="24" rx="4" fill="#E8F7FF" stroke="#9AD2F0" stroke-width="2"/><rect x="106" y="124" width="13" height="14" rx="3" fill="#8FD0F2"/><path d="M107 120h11" stroke="#fff" stroke-width="2" opacity=".8"/></g></g>`;
    case 'boba':
      return `<g transform="rotate(-12 116 142)"><rect x="106" y="130" width="20" height="26" rx="5" fill="#F5D7B5"/><circle cx="111" cy="150" r="2.4" fill="#5B3A29"/><circle cx="118" cy="152" r="2.4" fill="#5B3A29"/><circle cx="122" cy="147" r="2.4" fill="#5B3A29"/><rect x="105" y="128" width="22" height="4" rx="2" fill="#fff"/></g><path d="M113 130L103 126" stroke="#FF9E9E" stroke-width="3" stroke-linecap="round"/>`;
    case 'tissue':
      return `<path d="M98 120q8-12 20-2q6 10-5 15q-11 3-15-5z" fill="#fff" stroke="#E3E3EE" stroke-width="1.5"/>`;
    case 'read':
      return `<path d="M100 162L78 157V183L100 188Z" fill="#FFB3C1"/><path d="M100 162L122 157V183L100 188Z" fill="#FFC9D3"/><path d="M83 163l13 3M83 169l13 3M104 166l13-3M104 172l13-3" stroke="#fff" stroke-width="1.6"/><path d="M100 162V188" stroke="#E58FA2" stroke-width="1.5"/>`;
    case 'phone':
      return `<rect x="91" y="158" width="18" height="28" rx="4" fill="#3E3233"/><rect x="93" y="161" width="14" height="21" rx="2" fill="#CDEBFF"/><path d="M97 168c0-2 3-2 3 0c0-2 3-2 3 0c0 2-3 4-3 4s-3-2-3-4z" fill="#FF9EB5"/>`;
    case 'laptop':
      return `<rect x="76" y="160" width="48" height="27" rx="3" fill="#ECE7F2" stroke="#CFC8D8" stroke-width="1.5"/><path d="M97 172c0-2 3-2 3 0c0-2 3-2 3 0c0 2-3 4-3 4s-3-2-3-4z" fill="#FFB3C7"/><path d="M70 187H130L136 197H64Z" fill="#D6CFE0"/>`;
    case 'teddy':
      return `<circle cx="88" cy="158" r="4.5" fill="#B88C66"/><circle cx="112" cy="158" r="4.5" fill="#B88C66"/><circle cx="100" cy="166" r="11" fill="#C9A27E"/><ellipse cx="100" cy="184" rx="13" ry="11" fill="#C9A27E"/><ellipse cx="100" cy="169" rx="4.5" ry="3.2" fill="#EAD3B8"/><circle cx="96" cy="164" r="1.4" fill="#3E3233"/><circle cx="104" cy="164" r="1.4" fill="#3E3233"/>`;
    case 'shiver':
      return `<path d="M54 150Q100 132 146 150L152 207Q100 217 48 207Z" fill="#DED2F9" opacity=".96"/><path d="M54 150Q100 132 146 150" fill="none" stroke="#fff" stroke-width="5" opacity=".7"/>`;
    case 'cocoa':
      return `<g transform="rotate(-20 114 134)"><rect x="103" y="124" width="21" height="21" rx="4" fill="#E5484D"/><path d="M105 130h17M105 137h17" stroke="#fff" stroke-width="2" opacity=".85"/><path d="M124 128q8 0 8 6.5t-8 6.5" fill="none" stroke="#E5484D" stroke-width="3"/><ellipse cx="113.5" cy="125" rx="9" ry="2.5" fill="#8B5A3C"/></g><g class="steam"><path d="M110 114q-4-5 0-10t0-10M118 116q-4-5 0-10t0-10" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".85"/></g>`;
    case 'gift':
      return `<rect x="83" y="160" width="34" height="27" rx="3" fill="#E5484D"/><rect x="97" y="160" width="6" height="27" fill="#7FB89A"/><rect x="83" y="169" width="34" height="6" fill="#7FB89A"/><path d="M100 160q-12-12-14-2q2 5 14 2q12-12 14-2q-2 5-14 2" fill="#7FB89A"/>`;
    case 'snowman':
      return `<circle cx="24" cy="212" r="15" fill="#fff" stroke="#DCE6F2" stroke-width="1.5"/><circle cx="24" cy="187" r="11" fill="#fff" stroke="#DCE6F2" stroke-width="1.5"/><circle cx="20" cy="185" r="1.6" fill="#3E3233"/><circle cx="28" cy="185" r="1.6" fill="#3E3233"/><path d="M24 189l9 2-9 2z" fill="#F29A4A"/><rect x="15" y="174" width="18" height="4" rx="1" fill="#3E3233"/><rect x="18.5" y="163" width="11" height="12" rx="1" fill="#3E3233"/><path d="M14 197q10 5 20 0" stroke="#E5484D" stroke-width="4" fill="none"/><circle cx="24" cy="207" r="1.6" fill="#3E3233"/><circle cx="24" cy="214" r="1.6" fill="#3E3233"/>`;
    case 'nap':
      return `<ellipse cx="100" cy="214" rx="40" ry="9" fill="#FFE2EA"/>`;
    case 'lixi':
      return `<rect x="87" y="156" width="26" height="34" rx="3" fill="#D7263D"/><path d="M87 162L100 172L113 162" fill="none" stroke="#A81C2E" stroke-width="1.5"/><circle cx="100" cy="174" r="5" fill="#F4C430"/><text x="100" y="177" font-size="7" text-anchor="middle" fill="#A81C2E" font-weight="700">福</text>`;
    case 'banhchung':
      return `<rect x="80" y="157" width="40" height="34" rx="4" fill="#5E9C4A"/><path d="M80 168H120M80 180H120M93 157V191M107 157V191" stroke="#F2E6C8" stroke-width="2.2"/><rect x="80" y="157" width="40" height="34" rx="4" fill="none" stroke="#3F7533" stroke-width="1.5"/>`;
    case 'sparkler':
      return `<path d="M150 118L162 86" stroke="#8A7A78" stroke-width="2.4" stroke-linecap="round"/><g class="spk">${[0, 45, 90, 135, 180, 225, 270, 315].map(a => `<path d="M163 84L${(163 + 10 * Math.cos((a * Math.PI) / 180)).toFixed(1)} ${(84 + 10 * Math.sin((a * Math.PI) / 180)).toFixed(1)}" stroke="${a % 90 ? '#FF9EB5' : '#F2B544'}" stroke-width="2" stroke-linecap="round"/>`).join('')}<circle cx="163" cy="84" r="3.5" fill="#FFF3B0"/></g>`;
    default:
      return '';
  }
}
function chibi(o) {
  const hc = o.hairColor || S.hairColor,
    hair = o.hair || S.hair,
    L = Object.assign({}, LOOKDEF, S.look, o.look || {}, { seasonWear: S.seasonWear }),
    sk = '#FFE6D8';
  const k = o.outfit,
    of = OUTFITS[k] || OUTFITS.pink,
    kig = !!of.kig,
    pj = k === 'pj';
  const d25 = true,
    u = 'c' + ++GID;
  const HR = d25 ? `url(#hr${u})` : hc,
    SK = d25 ? `url(#sk${u})` : sk,
    CL = d25 ? `url(#cl${u})` : of.c,
    EF = d25 ? `url(#ey${u})` : '';
  const defs = d25
    ? `<defs><radialGradient id="sk${u}" cx="45%" cy="36%" r="72%"><stop offset="0" stop-color="#FFF4EC"/><stop offset=".62" stop-color="#FFE4D5"/><stop offset="1" stop-color="#F5C9B6"/></radialGradient><linearGradient id="hr${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(hc, 0.16)}"/><stop offset=".45" stop-color="${hc}"/><stop offset="1" stop-color="${shade(hc, -0.3)}"/></linearGradient><linearGradient id="cl${u}" x1="0" y1="0" x2=".35" y2="1"><stop offset="0" stop-color="${shade(of.c, 0.2)}"/><stop offset=".55" stop-color="${of.c}"/><stop offset="1" stop-color="${shade(of.c, -0.14)}"/></linearGradient><linearGradient id="ey${u}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1C1415"/><stop offset=".55" stop-color="#3B2A29"/><stop offset="1" stop-color="#94675A"/></linearGradient><radialGradient id="bl${u}"><stop offset="0" stop-color="#FF97A6" stop-opacity=".8"/><stop offset="1" stop-color="#FF97A6" stop-opacity="0"/></radialGradient><radialGradient id="gs${u}"><stop offset="0" stop-color="#4A3E3D" stop-opacity=".24"/><stop offset="1" stop-color="#4A3E3D" stop-opacity="0"/></radialGradient></defs>`
    : '';
  let m =
    o.act && ACTFACE[o.act]
      ? ACTFACE[o.act]
      : o.sleep
        ? 'sleep'
        : o.mood === 'sick'
          ? 'sick'
          : (o.face || L.face) !== 'auto'
            ? o.face || L.face
            : o.mood === 'calm'
              ? 'smile'
              : o.mood;
  let back = kig
    ? ''
    : hair === 'wavy'
      ? `<path d="M42 92Q40 34 100 34Q160 34 158 92Q167 118 156 140Q169 164 156 186Q163 201 146 205L138 150L62 150L54 205Q37 201 44 186Q31 164 44 140Q33 118 42 92Z" fill="${HR}"/>`
      : hair === 'bob'
        ? `<rect x="38" y="36" width="124" height="118" rx="56" fill="${HR}"/>`
        : hair === 'buns'
          ? `<circle cx="52" cy="46" r="22" fill="${HR}"/><circle cx="148" cy="46" r="22" fill="${HR}"/><rect x="42" y="40" width="116" height="96" rx="52" fill="${HR}"/>`
          : `<path d="M42 92Q40 34 100 34Q160 34 158 92L161 197Q150 207 138 199L136 150L64 150L62 199Q50 207 39 197Z" fill="${HR}"/>`;
  const front =
    hair === 'bob' || hair === 'buns'
      ? `<path d="M44 94Q44 36 100 36Q156 36 156 94Q142 72 122 68Q110 80 100 74Q90 80 78 68Q58 72 44 94Z" fill="${HR}"/>`
      : `<path d="M44.9 112A58 58 0 1 1 155.1 112Q152 90 136 80Q118 71 100 66Q82 71 64 80Q48 90 44.9 112Z" fill="${HR}"/><path d="M100 38Q98 52 100 66" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="2"/>` +
        (kig
          ? ''
          : `<g class="${d25 ? 'sway' : ''}"><path d="M45 96Q38 132 50 164Q58 152 59 128Q59 108 53 96Z" fill="${HR}"/><path d="M155 96Q162 132 150 164Q142 152 141 128Q141 108 147 96Z" fill="${HR}"/></g>`);
  const lip = L.lip;
  let eyes,
    mouth = `<path d="M94 125Q100 128 106 125Q100 132 94 125Z" fill="${lip}"/>`,
    extra = '',
    puff = false;
  if (m === 'happy') {
    eyes = eye(80, 'arc', L) + eye(120, 'arc', L);
    mouth = `<path d="M92 122Q100 133 108 122Z" fill="${lip}"/>`;
    extra = `<text x="150" y="70" font-size="18">✨</text>`;
  } else if (m === 'wink') {
    eyes = `<g class="blink">${eye(80, 'open', L, EF)}</g>` + eye(120, 'arc', L);
    extra = `<text x="140" y="92" font-size="13" fill="#FF9EB5">✦</text>`;
  } else if (m === 'pout') {
    eyes = `<g class="blink">${eye(80, 'open', L, EF) + eye(120, 'open', L, EF)}</g>`;
    mouth = `<ellipse cx="100" cy="127" rx="3.6" ry="3.2" fill="${lip}"/>`;
    puff = true;
  } else if (m === 'cool') {
    eyes = eye(80, 'cool', L, EF) + eye(120, 'cool', L, EF);
    mouth = `<path d="M94 126Q101 129 107 123" fill="none" stroke="${lip}" stroke-width="3" stroke-linecap="round"/>`;
  } else if (m === 'look') {
    eyes = eye(80, 'look', L, EF) + eye(120, 'look', L, EF);
    if (o.act === 'laptop') extra = `<path d="M150 90q6 10 0 14q-6-4 0-14z" fill="#8CCBFF"/>`;
  } else if (m === 'yawn') {
    eyes = eye(80, 'arc', L) + eye(120, 'arc', L);
    mouth = `<ellipse cx="100" cy="127" rx="6" ry="7.5" fill="#B5545F"/>`;
    extra = `<path d="M136 96q4 6 0 9q-4-3 0-9z" fill="#8CCBFF"/>`;
  } else if (m === 'squeeze') {
    eyes = `<path d="M72 102L86 106L72 110M128 102L114 106L128 110" fill="none" stroke="#3E3233" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>`;
    mouth = `<ellipse cx="100" cy="127" rx="3.6" ry="3.4" fill="${lip}"/>`;
  } else if (m === 'calmclosed') {
    eyes = eye(80, 'down', L) + eye(120, 'down', L);
  } else if (m === 'sleepy' || m === 'sleep') {
    eyes = eye(80, 'down', L) + eye(120, 'down', L);
    mouth = `<ellipse cx="100" cy="126" rx="3.5" ry="3" fill="${lip}"/>`;
    extra = `<g class="zz"><text x="146" y="60" font-size="22" fill="#9F8FE0" font-weight="700">z</text><text x="160" y="42" font-size="16" fill="#9F8FE0" font-weight="700">z</text></g>`;
  } else {
    eyes = `<g class="blink">${eye(80, 'open', L, EF) + eye(120, 'open', L, EF)}</g>`;
    if (m === 'stress') {
      extra = `<rect x="46" y="62" width="108" height="12" rx="6" fill="#FF7B7B"/><text x="100" y="72" font-size="9" text-anchor="middle" fill="#fff" font-weight="700">CỐ LÊN!</text><path d="M150 92q6 10 0 14q-6-4 0-14z" fill="#8CCBFF"/>`;
      mouth = `<path d="M93 127Q100 122 107 127" fill="none" stroke="#C9707A" stroke-width="3" stroke-linecap="round"/>`;
    }
    if (m === 'sad') {
      extra = `<path d="M124 115q4 8 0 11q-4-3 0-11z" fill="#8CCBFF"/>`;
      mouth = `<path d="M94 128Q100 123 106 128" fill="none" stroke="#C9707A" stroke-width="3" stroke-linecap="round"/>`;
    }
    if (m === 'sick') {
      extra = `<rect x="84" y="62" width="32" height="14" rx="4" fill="#fff" stroke="#BDE3F7" stroke-width="2"/><rect x="104" y="122" width="26" height="5" rx="2.5" fill="#fff" stroke="#ccc"/><circle cx="130" cy="124.5" r="3" fill="#FF7B7B"/>`;
      mouth = '';
    }
  }
  const brows = `<path d="M72 89Q80 85 87 87M128 89Q120 85 113 87" fill="none" stroke="#6B5552" stroke-width="2.2" stroke-linecap="round" opacity=".8"/>`;
  const hp = (x, y) =>
    `<path d="M${x} ${y + 5}C${x - 9} ${y - 1} ${x - 5} ${y - 8} ${x} ${y - 3}C${x + 5} ${y - 8} ${x + 9} ${y - 1} ${x} ${y + 5}Z" fill="#FF9AA8" opacity=".9"/>`;
  let blush =
    d25 && m !== 'sick' && (L.blush === 'soft' || L.blush === 'strong' || puff)
      ? `<ellipse cx="67" cy="119" rx="${L.blush === 'strong' || puff ? 16 : 13}" ry="${L.blush === 'strong' || puff ? 10 : 8}" fill="url(#bl${u})" opacity="${L.blush === 'strong' ? 1 : 0.8}"/><ellipse cx="133" cy="119" rx="${L.blush === 'strong' || puff ? 16 : 13}" ry="${L.blush === 'strong' || puff ? 10 : 8}" fill="url(#bl${u})" opacity="${L.blush === 'strong' ? 1 : 0.8}"/>`
      : m === 'sick'
        ? `<ellipse cx="67" cy="118" rx="11" ry="6" fill="#FF8A8A" opacity=".8"/><ellipse cx="133" cy="118" rx="11" ry="6" fill="#FF8A8A" opacity=".8"/>`
        : L.blush === 'heart'
          ? hp(67, 118) + hp(133, 118)
          : L.blush === 'none' && !puff
            ? ''
            : `<ellipse cx="67" cy="118" rx="${puff || L.blush === 'strong' ? 12 : 9}" ry="${puff || L.blush === 'strong' ? 7 : 5}" fill="${L.blush === 'strong' || puff ? '#FF9AA8' : '#FFB1B8'}" opacity="${L.blush === 'strong' ? 0.85 : 0.65}"/><ellipse cx="133" cy="118" rx="${puff || L.blush === 'strong' ? 12 : 9}" ry="${puff || L.blush === 'strong' ? 7 : 5}" fill="${L.blush === 'strong' || puff ? '#FF9AA8' : '#FFB1B8'}" opacity="${L.blush === 'strong' ? 0.85 : 0.65}"/>`;
  const frk = L.freckles
    ? [
        [61, 113],
        [65, 118],
        [70, 113],
        [130, 113],
        [135, 118],
        [139, 113],
        [97, 117],
        [103, 117]
      ]
        .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.2" fill="#C98F7A"/>`)
        .join('')
    : '';
  const glass = o.sleep
    ? ''
    : L.eyewear === 'round'
      ? `<g fill="rgba(255,255,255,.18)" stroke="#6B5552" stroke-width="2.2"><circle cx="80" cy="105" r="12.5"/><circle cx="120" cy="105" r="12.5"/></g><path d="M92.5 104Q100 100 107.5 104" fill="none" stroke="#6B5552" stroke-width="2.2"/>`
      : L.eyewear === 'sun'
        ? `<rect x="65" y="96" width="30" height="19" rx="8" fill="#2B2223"/><rect x="105" y="96" width="30" height="19" rx="8" fill="#2B2223"/><path d="M95 102Q100 99 105 102" fill="none" stroke="#2B2223" stroke-width="3"/><path d="M70 101l7-3M110 101l7-3" stroke="#fff" stroke-width="2" opacity=".45" stroke-linecap="round"/>`
        : L.eyewear === 'heart'
          ? `<path d="M80 117C64 108 66 94 80 101C94 94 96 108 80 117Z M120 117C104 108 106 94 120 101C134 94 136 108 120 117Z" fill="#FF7FA0" opacity=".9"/><path d="M93 103Q100 100 107 103" stroke="#FF7FA0" stroke-width="3" fill="none"/>`
          : '';
  const headAcc =
    kig || o.sleep
      ? ''
      : L.head === 'bow'
        ? `<path d="M136 58L121 47V69Z M136 58L151 47V69Z" fill="#FF9EB5"/><circle cx="136" cy="58" r="4.5" fill="#FF7FA0"/>`
        : L.head === 'band'
          ? `<path d="M47 84Q100 20 153 84" fill="none" stroke="#FFB3C7" stroke-width="7" stroke-linecap="round"/>` +
            [60, 76, 92, 108, 124, 140]
              .map((x, i) => `<circle cx="${x}" cy="${[64, 50, 43, 43, 50, 64][i]}" r="2.6" fill="#fff"/>`)
              .join('')
          : L.head === 'beanie'
            ? `<path d="M42 86Q42 24 100 24Q158 24 158 86Z" fill="#F7C9C9"/><rect x="40" y="76" width="120" height="16" rx="8" fill="#F0ABAB"/><path d="M60 80v8M76 80v8M92 80v8M108 80v8M124 80v8M140 80v8" stroke="#E79595" stroke-width="2"/><circle cx="100" cy="22" r="10" fill="#fff"/>`
            : L.head === 'pearl'
              ? [
                  [126, 62],
                  [134, 66],
                  [142, 72]
                ]
                  .map(
                    ([x, y]) => `<circle cx="${x}" cy="${y}" r="4" fill="#FFFDF8" stroke="#E6DED2" stroke-width="1"/>`
                  )
                  .join('')
              : L.head === 'flower'
                ? [0, 72, 144, 216, 288]
                    .map(
                      a =>
                        `<circle cx="${62 + 6 * Math.cos((a * Math.PI) / 180)}" cy="${68 + 6 * Math.sin((a * Math.PI) / 180)}" r="4.5" fill="#FFE08A"/>`
                    )
                    .join('') + `<circle cx="62" cy="68" r="3.5" fill="#FF9E9E"/>`
                : '';
  const ear =
    o.sleep || kig
      ? ''
      : L.ear === 'stud'
        ? `<circle cx="53" cy="121" r="2.6" fill="#fff" stroke="#E6E1EA"/><circle cx="147" cy="121" r="2.6" fill="#fff" stroke="#E6E1EA"/>`
        : L.ear === 'pearl'
          ? `<path d="M53 119v7M147 119v7" stroke="#D9B65C" stroke-width="1.4"/><circle cx="53" cy="129" r="3.6" fill="#FFFDF8" stroke="#E6DED2"/><circle cx="147" cy="129" r="3.6" fill="#FFFDF8" stroke="#E6DED2"/>`
          : L.ear === 'hoop'
            ? `<circle cx="53" cy="126" r="5.5" fill="none" stroke="#E0B04A" stroke-width="2"/><circle cx="147" cy="126" r="5.5" fill="none" stroke="#E0B04A" stroke-width="2"/>`
            : '';
  const dressy = DAY.includes(k) && !o.sleep;
  const bag =
    dressy && L.bag && o.act !== 'shiver' && o.act !== 'snowman'
      ? `<path d="M58 190Q50 192 50 198" stroke="#D9B65C" stroke-width="1.6" fill="none"/><rect x="36" y="196" width="26" height="19" rx="5" fill="#FCFAF6" stroke="#E2D8CA" stroke-width="1.5"/><path d="M40 200L58 212M48 198L60 206M36 206L46 214M58 200L40 212M48 214L60 204" stroke="#EDE4D7" stroke-width="1"/><path d="M36 203Q49 209 62 203" fill="none" stroke="#E2D8CA" stroke-width="1.5"/><circle cx="49" cy="206" r="1.6" fill="#D9B65C"/>`
      : '';
  const watch = dressy && L.watch ? `<rect x="51" y="176" width="13" height="5" rx="2.5" fill="#E0B04A"/>` : '';
  const blanket = o.sleep
    ? `<path d="M30 168Q100 140 170 168L176 232H24Z" fill="#DED2F9"/><path d="M30 168Q100 140 170 168" fill="none" stroke="#fff" stroke-width="6" opacity=".7"/>`
    : '';
  const legC = kig ? CL : k === 'aodai' ? '#FFF8F0' : SK,
    shoe = kig ? of.k : of.shoe;
  const pose = POSE[o.act] || 'side',
    AF = pj || kig || k === 'sweater' || k === 'aodai' ? CL : SK;
  const xw = (o.xw !== undefined ? o.xw : isXmas() && S.seasonWear !== false) && !kig && !o.sleep;
  const scarf =
    xw && !pj
      ? `<path d="M70 147Q100 161 130 147L132 158Q100 173 68 158Z" fill="#E5484D"/><path d="M76 153Q100 164 124 153" stroke="#fff" stroke-width="2.4" fill="none" opacity=".9"/><rect x="113" y="154" width="12" height="30" rx="4" fill="#E5484D" transform="rotate(8 119 154)"/><path d="M114 168h11M114 175h11" stroke="#fff" stroke-width="2.4" transform="rotate(8 119 154)"/>`
      : '';
  const se = o.xw === false ? null : season(),
    nyHat =
      se === 'ny' && S.seasonWear !== false && !kig && !o.sleep
        ? `<g transform="rotate(16 132 40)"><path d="M113 60L132 4L151 60Z" fill="#F2B544"/><path d="M119 44H145M116 54H148M124 30H140" stroke="#E8505B" stroke-width="3"/><circle cx="132" cy="4" r="6.5" fill="#FF9EB5"/><path d="M113 60Q132 66 151 60" stroke="#fff" stroke-width="3" fill="none"/></g>`
        : '';
  const tetFlower =
    se === 'tet' && S.seasonWear !== false && !kig && !o.sleep && L.head === 'none'
      ? [0, 72, 144, 216, 288]
          .map(
            a =>
              `<circle cx="${136 + 6.5 * Math.cos((a * Math.PI) / 180)}" cy="${60 + 6.5 * Math.sin((a * Math.PI) / 180)}" r="5" fill="#FFD24D"/>`
          )
          .join('') + `<circle cx="136" cy="60" r="3.6" fill="#E8505B"/>`
      : '';
  const party = (o.party !== undefined ? o.party : S.people && bdayToday().length > 0) && !kig && !o.sleep,
    partyHat = party
      ? `<g transform="rotate(-14 70 40)"><path d="M52 62L70 6L88 62Z" fill="#7FC8F8"/><path d="M58 46H82M55 56H85M63 32H77" stroke="#FFD24D" stroke-width="3"/><circle cx="62" cy="40" r="2.4" fill="#FF8FAB"/><circle cx="78" cy="50" r="2.4" fill="#FF8FAB"/><circle cx="70" cy="6" r="6.5" fill="#FF8FAB"/><path d="M52 62Q70 68 88 62" stroke="#fff" stroke-width="3" fill="none"/></g>`
      : '',
    balloon = party
      ? `<g class="balloon"><path d="M170 92Q164 130 160 176" stroke="#9A8A88" stroke-width="1.4" fill="none"/><ellipse cx="172" cy="68" rx="18" ry="22" fill="#FF8FAB"/><path d="M168 89l4 6 4-6Z" fill="#FF8FAB"/><ellipse cx="165" cy="60" rx="5" ry="8" fill="#fff" opacity=".45"/></g>`
      : '';
  const santa = xw
    ? `<path d="M46 80Q50 32 98 27Q138 25 156 48L174 64Q162 58 151 61Q155 71 155 80Z" fill="#E5484D"/><path d="M60 50Q90 30 130 36" stroke="#fff" stroke-width="3" opacity=".25" fill="none"/><rect x="40" y="71" width="120" height="17" rx="8.5" fill="#fff"/><circle cx="174" cy="66" r="9" fill="#fff"/>`
    : '';
  const shine =
    d25 && !kig && hair !== 'buns'
      ? `<path d="M66 64Q78 54 92 50M108 50Q122 54 134 64" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".16"/><path d="M74 60Q82 55 88 53M126 60Q118 55 112 53" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".4"/>`
      : '';
  const neck = d25 && !kig && !pj ? `<ellipse cx="100" cy="151" rx="24" ry="7" fill="#E2AC98" opacity=".55"/>` : '';
  const fold =
    d25 && !pj
      ? `<path d="M119 158Q131 174 127 192" fill="none" stroke="#000" stroke-width="9" stroke-linecap="round" opacity=".06"/><path d="M78 160Q74 174 77 188" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".35"/>`
      : '';
  const rim = d25
    ? `<circle cx="100" cy="94" r="56" fill="none" stroke="#EBB6A3" stroke-width="1.2" opacity=".6"/><ellipse cx="80" cy="76" rx="16" ry="7" fill="#fff" opacity=".18"/>`
    : '';
  return `<svg viewBox="0 0 200 240" aria-hidden="true">${defs}${d25 ? `<ellipse cx="100" cy="230" rx="62" ry="10" fill="url(#gs${u})"/>` : '<ellipse cx="100" cy="230" rx="54" ry="8" fill="rgba(74,62,61,.12)"/>'}
  ${o.act === 'nap' || o.act === 'snowman' ? actItem(o.act) : ''}<g class="${o.sleep || o.still ? '' : 'bob'}">${back}${kig ? tail(k) : ''}
  <g class="legL"><rect x="83" y="200" width="12" height="23" rx="6" fill="${legC}"/><ellipse cx="88" cy="225" rx="9.5" ry="5.5" fill="${shoe}" stroke="rgba(0,0,0,.08)"/></g><g class="legR"><rect x="105" y="200" width="12" height="23" rx="6" fill="${legC}"/><ellipse cx="112" cy="225" rx="9.5" ry="5.5" fill="${shoe}" stroke="rgba(0,0,0,.08)"/></g>
  <g class="${d25 && !o.sleep ? 'breath' : ''}">${pj || kig || k === 'sweater' || k === 'aodai' ? '' : `<path d="M68 148Q100 138 132 148L134 166L66 166Z" fill="${SK}"/>`}${neck}${outfitSvg(k, CL)}${fold}${scarf}
  ${pose === 'side' ? armsSvg('side', AF, SK) + watch + bag + (o.act === 'shiver' ? actItem('shiver') : '') : ''}</g>
  ${kig ? hoodBack(k, CL) : ''}<circle cx="100" cy="94" r="56" fill="${SK}"/>${rim}
  ${brows}${eyes}${blush}${frk}${mouth}${glass}
  ${front}${shine}${ear}${partyHat || santa || nyHat || tetFlower + headAcc}${pose !== 'side' ? actItem(o.act) + armsSvg(pose, AF, SK) : ''}${extra}${balloon}${blanket}</g></svg>`;
}

let bubT,
  bubRAF = 0;
function bubTrack() {
  const b = $('#bubble');
  if (!b.classList.contains('on')) {
    bubRAF = 0;
    return;
  }
  const r = pet.getBoundingClientRect(),
    w = b.offsetWidth,
    c = r.left + r.width / 2;
  b.classList.toggle('l', c - w / 2 < 6);
  b.classList.toggle('r', c + w / 2 > innerWidth - 6 && !(c - w / 2 < 6));
  b.classList.toggle('below', r.top < b.offsetHeight + 70);
  bubRAF = requestAnimationFrame(bubTrack);
}
function say(t, ms) {
  const b = $('#bubble');
  b.textContent = t;
  b.classList.add('on');
  if (!bubRAF) bubRAF = requestAnimationFrame(bubTrack);
  clearTimeout(bubT);
  bubT = setTimeout(() => b.classList.remove('on'), ms || 4500);
}
function drawChibi() {
  const hr = new Date().getHours();
  pet.classList.toggle('low', low());
  {
    const se = season();
    ['xmas', 'ny', 'tet'].forEach(x => document.documentElement.classList.toggle(x, se === x));
  }
  document.documentElement.classList.toggle('calm', calm());
  buildFx();
  seasonGreet();
  document.documentElement.classList.toggle('night', isNight());
  document.documentElement.classList.toggle('dusk', hr >= 18 || hr < 6);
  $('#petSvg').innerHTML = chibi(Object.assign(state(), { act: P.act || (focusing() ? 'laptop' : null) }));
}

function suggestions() {
  const d = today(),
    c = d.checkin,
    out = [];
  if (!c) return out;
  const last = S.sleeps[S.sleeps.length - 1],
    hrs = last && !last.sample ? (new Date(last.wake) - new Date(last.bed)) / 36e5 : null;
  if (c.body === 'sick' || c.energy <= 2)
    if (!d.lazy)
      out.push(
        '🛋️ Hôm nay năng lượng thấp. Nghỉ ngơi nhẹ nhàng nha, bấm "Bật Ngày Lười Biếng" bên dưới nếu muốn ẩn bớt việc.'
      );
  if (hrs !== null && hrs < 6)
    out.push('😴 Đêm qua bạn ngủ khoảng ' + hrs.toFixed(1) + ' tiếng. Nếu tập thì chọn buổi nhẹ thôi.');
  if (c.weather === 'cold' || c.weather === 'humid')
    out.push('🧣 Trời ' + (c.weather === 'cold' ? 'lạnh' : 'nồm') + ': giữ ấm cổ, rửa mũi nước muối nhé.');
  if (c.weather === 'hot') out.push('💧 Trời nóng: nhớ uống thêm nước, tránh nắng gắt buổi trưa.');
  if (c.weather === 'rain') out.push('☂️ Trời mưa: nhớ mang ô hoặc áo mưa.');
  if (c.mood === 'stress') out.push('🍅 Hơi căng thẳng? Thử một phiên tập trung 25 phút rồi hít thở sâu 5 lần.');
  if (c.mood === 'sad') out.push('🍬 Mở Lọ Kẹo đọc lại vài niềm vui cũ nhé, mình ở đây với bạn.');
  if (c.body === 'sore')
    out.push(
      '🦵 Đang đau nhức ' +
        ((c.sore || []).length ? c.sore.map(gName).join(', ') : 'cơ') +
        ': hôm nay ưu tiên giãn cơ, tránh tập nhóm cơ đang đau.'
    );
  if (!out.length) out.push('🌷 Mọi thứ ổn áp! Chọn 3 việc quan trọng nhất và bắt đầu thôi.');
  return out;
}

const label = (arr, v) => {
  const x = arr.find(a => a[0] === v);
  return x ? x[1] : '–';
};
function cupSvg(f) {
  return `<svg viewBox="0 0 30 44"><path d="M5 6H25L22 40H8Z" fill="${f ? '#BFE6FF' : 'none'}" stroke="#8CC8EA" stroke-width="2.5" stroke-linejoin="round"/>${f ? '<path d="M8 16H22" stroke="#fff" stroke-width="2" opacity=".7"/>' : ''}</svg>`;
}

/* ===== src/03-water-candy.js ===== */
/* 💧 Mục tiêu uống nước */
const fmtL = ml =>
  ml >= 1000
    ? (ml / 1000)
        .toFixed(2)
        .replace(/\.?0+$/, '')
        .replace('.', ',') + ' lít'
    : ml + ' ml';
function waterExtra() {
  const w = S.water;
  if (!w.auto) return { ml: 0, why: [] };
  let ml = 0,
    why = [];
  if (S.gym && S.gym.days.length && planFor(new Date())) {
    ml += 500;
    why.push('ngày tập');
  }
  const c = today().checkin;
  if (c && c.weather === 'hot') {
    ml += 500;
    why.push('trời nóng');
  }
  return { ml, why };
}
const waterGoal = () => Math.min(24, S.water.cups + Math.round(waterExtra().ml / S.water.ml));
const WACT = [
  ['low', 'Ít (dưới 30 phút)', 0],
  ['mid', 'Vừa (30–60 phút)', 350],
  ['high', 'Nhiều (trên 60 phút)', 700]
];
function waterRec() {
  const kg = parseFloat(S.water.weight);
  if (!(kg >= 25 && kg <= 250)) return null;
  const add = (WACT.find(x => x[0] === S.water.activity) || WACT[0])[2];
  const lo = Math.round(kg * 30 + add),
    hi = Math.round(kg * 35 + add);
  return { lo, hi, cups: Math.max(3, Math.round((lo + hi) / 2 / S.water.ml)) };
}
/* 🍬 Chibi biến kẹo và thả vào lọ */
const CANDY_COLS = ['#FF9E9E', '#A8E6CF', '#DED2F9', '#FFE9A8', '#FFC8A8'];
const candyCount = () => Object.values(S.days).reduce((a, x) => a + ((x && x.candies) || []).length, 0);
const candySvg = c =>
  `<svg viewBox="0 0 44 28" aria-hidden="true"><path d="M3 5l9 9-9 9z M41 5l-9 9 9 9z" fill="${c}" opacity=".85"/><circle cx="22" cy="14" r="10" fill="${c}"/><path d="M15 10q7-5 14 0" stroke="#fff" stroke-width="2.4" fill="none" opacity=".75" stroke-linecap="round"/></svg>`;
function sparkle(x, y, n) {
  for (let i = 0; i < (n || 5); i++) {
    const s = document.createElement('span');
    s.className = 'spark';
    s.textContent = ['✨', '⭐', '💖'][i % 3];
    s.style.left = x - 8 + 'px';
    s.style.top = y - 8 + 'px';
    document.body.appendChild(s);
    const a = Math.random() * Math.PI * 2,
      r = 26 + Math.random() * 26;
    s.animate(
      [
        { transform: 'translate(0,0) scale(.4)', opacity: 1 },
        { transform: `translate(${Math.cos(a) * r}px,${Math.sin(a) * r}px) scale(1)`, opacity: 0 }
      ],
      { duration: 800 + Math.random() * 300, easing: 'ease-out', fill: 'forwards' }
    ).onfinish = () => s.remove();
  }
}
let candyBusy = false;
function candyDrop(text) {
  today().candies.push(text);
  save();
  const jar = document.querySelector('.jar svg');
  const plain = () => {
    candyBusy = false;
    P.act = null;
    render();
    say('Thêm một viên kẹo ngọt ngào vào lọ rồi 🍬');
  };
  if (!jar || calm() || candyBusy || !Element.prototype.animate) return plain();
  candyBusy = true;
  if (document.activeElement) document.activeElement.blur();
  $('#candy').value = '';
  jar.scrollIntoView({ behavior: 'smooth', block: 'center' });
  setTimeout(() => {
    const j = document.querySelector('.jar svg');
    if (!j) return plain();
    const r = j.getBoundingClientRect(),
      b = bounds();
    clearTimeout(P.t);
    if (P.act) endAct();
    const leftSide = r.left - PW + 8 >= b.minX,
      tx = Math.min(b.maxX, Math.max(b.minX, leftSide ? r.left - PW + 8 : r.right - 6)),
      ty = Math.min(b.maxY, Math.max(b.minY, r.bottom - PH)),
      ms = Math.max(450, (Math.hypot(tx - P.x, ty - P.y) / 160) * 1000);
    pet.classList.toggle('left', tx < P.x);
    pet.classList.remove('sitting');
    pet.classList.add('walking');
    place(tx, ty, ms);
    setTimeout(() => {
      pet.classList.remove('walking');
      pet.classList.toggle('left', !leftSide);
      P.act = 'magic';
      drawChibi();
      say('Bùm! Một viên kẹo nè ✨', 2600);
      const col = CANDY_COLS[(candyCount() - 1) % 5],
        c = document.createElement('div');
      c.className = 'flycandy';
      c.innerHTML = candySvg(col);
      document.body.appendChild(c);
      const sx = P.x + PW / 2 - 16,
        sy = P.y - 14;
      c.style.left = sx + 'px';
      c.style.top = sy + 'px';
      c.animate(
        [
          { transform: 'scale(0) rotate(-120deg)', opacity: 0 },
          { transform: 'scale(1.35) rotate(15deg)', opacity: 1, offset: 0.65 },
          { transform: 'scale(1) rotate(0)', opacity: 1 }
        ],
        { duration: 650, easing: 'ease-out', fill: 'forwards' }
      );
      sparkle(sx + 16, sy + 10, 6);
      setTimeout(() => {
        const j2 = document.querySelector('.jar svg');
        if (!j2) {
          c.remove();
          return plain();
        }
        const r2 = j2.getBoundingClientRect(),
          ex = r2.left + r2.width / 2 - 16 - sx,
          ey = r2.top + r2.height * 0.08 - sy,
          my = Math.min(0, ey) - 80;
        c.animate(
          [
            { transform: 'translate(0,0) rotate(0)' },
            { transform: `translate(${ex * 0.5}px,${my}px) rotate(200deg)`, offset: 0.5 },
            { transform: `translate(${ex}px,${ey}px) rotate(360deg) scale(.85)` }
          ],
          { duration: 800, easing: 'cubic-bezier(.3,.1,.5,1)', fill: 'forwards' }
        ).onfinish = () => {
          c.animate(
            [
              { transform: `translate(${ex}px,${ey}px) scale(.85)`, opacity: 1 },
              { transform: `translate(${ex}px,${ey + r2.height * 0.55}px) scale(.6)`, opacity: 0 }
            ],
            { duration: 380, easing: 'ease-in', fill: 'forwards' }
          ).onfinish = () => {
            c.remove();
            candyBusy = false;
            P.act = null;
            pet.classList.remove('left');
            render();
            const j3 = document.querySelector('.jar svg');
            if (j3) {
              j3.classList.add('jarpop');
              const r3 = j3.getBoundingClientRect();
              sparkle(r3.left + r3.width / 2, r3.top + r3.height * 0.5, 5);
            }
            say('Thả vào lọ rồi! Ngọt ngào ghê 🍬', 3500);
            P.t = setTimeout(wander, 2600);
          };
        };
      }, 750);
    }, ms);
  }, 380);
}
function jarSvg(n) {
  let c = '';
  const cols = ['#FF9E9E', '#A8E6CF', '#DED2F9', '#FFE9A8', '#FFC8A8'];
  for (let i = 0; i < Math.min(n, 24); i++) {
    c += `<circle cx="${26 + (i % 4) * 15}" cy="${112 - Math.floor(i / 4) * 14}" r="7" fill="${cols[i % 5]}"/>`;
  }
  return `<svg viewBox="0 0 96 130" aria-hidden="true"><rect x="22" y="4" width="52" height="14" rx="5" fill="#E9C9A8"/><path d="M18 20H78Q86 20 86 30V118Q86 126 78 126H18Q10 126 10 118V30Q10 20 18 20Z" fill="rgba(255,255,255,.55)" stroke="#E6D3C0" stroke-width="3"/>${c}</svg>`;
}

/* ===== src/04-today-health.js ===== */
/* ---------- Cài lên màn hình chính & nhắc sao lưu ---------- */
const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const isIOS =
  /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
let installEvt = null;
addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  installEvt = e;
  if (tab === 'today' || tab === 'set') render();
});
function installHow() {
  return installEvt
    ? `<button class="btn" data-a="install">📲 Cài app</button>`
    : isIOS
      ? `<p class="muted" style="margin:0">Trong <b>Safari</b>: bấm nút <b>Chia sẻ</b> (ô vuông có mũi tên lên) → <b>Thêm vào MH chính</b> → <b>Thêm</b>.</p>`
      : `<p class="muted" style="margin:0">Mở menu trình duyệt → <b>Cài đặt ứng dụng</b> / <b>Thêm vào màn hình chính</b>.</p>`;
}
function backupDue() {
  const n = Object.keys(S.days).length + S.sleeps.filter(x => !x.sample).length;
  if (!n) return 0;
  if (!S.lastBackup) return n >= 3 ? -1 : 0;
  const d = daysSince(S.lastBackup);
  return d >= 7 ? d : 0;
}

/* Các thẻ của tab Hôm nay – người dùng ẩn/sắp xếp được (Cài đặt › Tab Hôm nay) */
const TCARDS = [
  ['brief', '📰', 'Bản tin đầu ngày'],
  ['checkin', '🌤️', 'Check-in & gợi ý'],
  ['top3', '⭐', '3 việc quan trọng nhất'],
  ['sched', '🕒', 'Thời gian biểu & việc cần làm'],
  ['gym', '🏋️', 'Ngày tập Gym'],
  ['people', '💌', 'Người thương sắp tới'],
  ['bells', '🔔', 'Chưa có chuông (việc, sinh nhật, hẹn)'],
  ['habits', '🌱', 'Thói quen & uống nước'],
  ['candy', '🍬', 'Lọ Kẹo Niềm Vui'],
  ['notes', '📝', 'Ghi chú nhanh']
];
function cardOrder() {
  const o = (S.cardOrder || []).filter(k => TCARDS.some(c => c[0] === k));
  TCARDS.forEach(c => {
    if (!o.includes(c[0])) o.push(c[0]);
  });
  return o;
}
const cardOn = k => !(S.cardHidden || []).includes(k);
function viewToday() {
  const d = today(),
    c = d.checkin;
  /* lưu mục tiêu nước của hôm nay để lịch sử đánh giá đúng (kể cả khi thẻ bị ẩn) */
  d.waterGoal = waterGoal();
  d.waterMl = S.water.ml;
  let h = '';
  if (!standalone() && !S.hideInstall)
    h += `<div class="card"><h2>📲 Cài Cozy Life lên điện thoại <small><button class="chip" data-a="hideInstall" style="min-height:36px;padding:4px 12px" aria-label="Ẩn">✕</button></small></h2><p class="muted" style="margin:0 0 10px">Cài lên màn hình chính để mở như app thật, dùng được khi không có mạng${isIOS ? ' và để iPhone không tự xóa dữ liệu khi lâu không mở' : ''}.</p>${installHow()}</div>`;
  const due = backupDue();
  if (due)
    h += `<div class="card"><h2>💾 ${due < 0 ? 'Chưa sao lưu lần nào' : 'Đã ' + due + ' ngày chưa sao lưu'}</h2><p class="muted" style="margin:0 0 10px">Lưu một bản ra file (iCloud Drive, Google Drive…) để lỡ mất máy hay xóa app vẫn còn.</p><button class="btn full" data-a="export">📤 Sao lưu ngay</button></div>`;
  if (d.lazy)
    h += `<div class="card lazycard"><h2>🛋️ Ngày Lười Biếng</h2><p class="muted" style="margin:0 0 8px">Hôm nay mình nghỉ ngơi là chính: tab Việc chỉ hiện việc gấp, Chibi tạm không nhắc việc, Gym gợi ý giãn cơ 10 phút. Nhớ uống đủ nước và ngủ sớm nha.</p><div class="row"><button class="btn ghost" data-a="goGym">🧘 Giãn cơ 10 phút</button><button class="btn ghost" data-a="lazyOff">Mình khỏe rồi, tắt</button></div></div>`;
  if (isNight())
    h += `<div class="card night-card"><h2>🌙 Giờ đi ngủ</h2>${d.evening ? `<p class="muted" style="margin:0">Bạn đã chúc ngủ ngon lúc ${hm(new Date(S.pendingBed || Date.now()))}. Ngủ ngon nha!</p>` : `<p class="muted" style="margin:0 0 12px">Khép lại ngày hôm nay trong 30 giây rồi đi ngủ thôi.</p><button class="btn full" data-a="evening">😴 Bắt đầu</button>`}</div>`;
  const C = {};
  C.brief = () => briefCard();
  C.checkin = () =>
    !c
      ? `<div class="card"><h2>Check-in ${new Date().getHours() < 12 ? 'buổi sáng' : 'hôm nay'}</h2><p class="muted" style="margin:0 0 12px">10 giây để Chibi biết hôm nay bạn thế nào.</p><button class="btn full" data-a="checkin">🌤️ Bắt đầu Check-in</button></div>`
      : `<div class="card"><h2>Hôm nay của bạn <small><button class="chip" data-a="checkin" style="min-height:36px;padding:4px 12px">Sửa</button></small></h2>
    <div class="sum"><div><b>${label(MOODS, c.mood)}</b>Tâm trạng</div><div><b>${label(WEATHER, c.weather)}</b>Thời tiết</div><div><b>🔋${c.energy}</b>Năng lượng</div><div><b>${label(BODY, c.body)}</b>Cơ thể</div></div>
    ${suggestions()
      .map(t => `<div class="tip">${t}</div>`)
      .join(
        ''
      )}${d.lazy ? '' : '<button class="linkbtn" data-a="lazyOn">🛋️ Hôm nay muốn nghỉ? Bật Ngày Lười Biếng</button>'}</div>`;
  C.top3 = () => {
    const T3 = d.top3.map(top3Slot);
    return `<div class="card"><h2>3 việc quan trọng nhất <small>${T3.filter(x => x.d && x.t).length}/3</small></h2>${T3.map((x, i) => `<div class="task ${x.d ? 'done' : ''}"><input type="checkbox" data-t="${i}" ${x.d ? 'checked' : ''} aria-label="Xong việc ${i + 1}">${x.tid ? `<button class="t3link" data-topen="${x.tid}">⭐ ${esc(x.t)}</button>` : `<input type="text" data-tt="${i}" value="${esc(x.t)}" placeholder="Việc số ${i + 1}…">`}</div>`).join('')}${!T3.some(x => x.tid) && S.tasks.some(t => !t.done) ? '<p class="muted" style="margin:6px 0 0">Mẹo: bấm ⭐ ở tab Việc để đưa việc lên đây.</p>' : ''}</div>`;
  };
  C.sched = () => schedCard();
  C.gym = () => {
    const awo = activeWo(),
      gk = S.gym.days.length && planFor(new Date());
    if (awo)
      return `<div class="card"><h2>🏋️ Đang tập dở: ${esc(awo.label)}</h2><button class="btn full" data-a="goGym">Tiếp tục buổi tập</button></div>`;
    if (gk && !doneWos().some(w => w.date === dk(new Date())))
      return `<div class="card"><h2>💪 Hôm nay là ngày tập <small>${S.gym.time}</small></h2><p class="muted" style="margin:0 0 10px">${d.lazy ? '🛋️ Ngày Lười Biếng: đổi sang giãn cơ 10 phút nhé.' : SPLITS[gk][0] + ': ' + SPLITS[gk][1].map(gName).join(' · ')}</p><button class="btn ghost full" data-a="goGym">Xem gợi ý bài tập</button></div>`;
    return '';
  };
  C.people = () => peopleCard();
  C.bells = () => {
    const nb = S.tasks.filter(needsBell).sort(sortTasks),
      pb = peopleBellRows();
    return nb.length || pb.n
      ? `<div class="card"><h2>🔔 Chưa có chuông <small>${nb.length + pb.n}</small></h2><p class="muted" style="margin:0 0 4px">Mấy mục này chọn nhắc bằng 📅/⏰ nhưng chưa đặt chuông trên iPhone. Chạm để đặt.</p>${nb.slice(0, 3).map(taskRow).join('')}${pb.html}</div>`
      : '';
  };
  C.habits = () => habitsCard();
  C.candy = () => {
    const nC = candyCount();
    return `<div class="card"><h2>Lọ Kẹo Niềm Vui <small>${nC} viên</small></h2><div class="jar">${jarSvg(nC)}<div class="jarside">
    <form id="candyF"><input class="inp" id="candy" placeholder="Một niềm vui nhỏ hôm nay…" maxlength="120"><button class="btn" style="margin-top:8px">+ Thả kẹo</button></form>
    ${d.candies.length ? `<p class="muted" style="margin:8px 0 0">Hôm nay: ${d.candies.map(esc).join(' · ')}</p>` : ''}</div></div></div>`;
  };
  C.notes = () => notesCard();
  h += cardOrder()
    .filter(cardOn)
    .map(k => C[k]())
    .join('');
  h += `<button class="linkbtn" data-spgo="todaycards" style="display:block;margin:16px auto 0">✏️ Sắp xếp / ẩn các thẻ</button>`;
  return h;
}

let htab = 'gym';
function viewHealth() {
  return (
    `<div class="wtabs">${[
      ['gym', '🏋️ Gym'],
      ['water', '💧 Uống nước'],
      ['sleep', '😴 Giấc ngủ']
    ]
      .map(([k, n]) => `<button data-htab="${k}" aria-pressed="${htab === k}">${n}</button>`)
      .join('')}</div>` + (htab === 'gym' ? viewGym() : htab === 'water' ? viewWater() : viewSleep())
  );
}
/* 💧 Theo dõi uống nước */
function dayWater(k) {
  const d = S.days[k] || {};
  const isT = k === dk(new Date());
  return {
    n: d.water || 0,
    goal: isT ? waterGoal() : d.waterGoal || S.water.cups,
    ml: d.waterMl || S.water.ml,
    has: !!S.days[k]
  };
}
const VNWD = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
function lastDays(n) {
  const out = [],
    t = new Date();
  t.setHours(12, 0, 0, 0);
  for (let i = n - 1; i >= 0; i--) {
    const x = new Date(t);
    x.setDate(t.getDate() - i);
    out.push(x);
  }
  return out;
}
function viewWater() {
  const td = dk(new Date()),
    D7 = lastDays(7),
    D30 = lastDays(29);
  const keys = Object.keys(S.days)
      .filter(k => (S.days[k].water || 0) > 0)
      .sort(),
    first = keys[0] || td;
  const rec7 = D7.map(x => {
      const k = dk(x);
      return Object.assign({ k, x }, dayWater(k));
    }),
    inRange = rec7.filter(r => r.k >= first);
  const avgMl = inRange.length ? Math.round(inRange.reduce((a, r) => a + r.n * r.ml, 0) / inRange.length) : 0,
    met = inRange.filter(r => r.n >= r.goal).length;
  let streak = 0;
  {
    const x = new Date();
    const tw = dayWater(td);
    if (tw.n < tw.goal) x.setDate(x.getDate() - 1);
    for (let i = 0; i < 400; i++) {
      const w = dayWater(dk(x));
      if (w.n >= w.goal && w.n > 0) {
        streak++;
        x.setDate(x.getDate() - 1);
      } else break;
    }
  }
  const T = dayWater(td),
    mx = Math.max(1.25, ...rec7.map(r => r.n / r.goal));
  const bars = rec7
    .map(r => {
      const pct = r.n / r.goal,
        h = Math.min(100, (pct / mx) * 100);
      return `<button class="wbar" data-wday="${r.k}" aria-label="${VNWD[r.x.getDay()]} ${r.x.getDate()}/${r.x.getMonth() + 1}: ${r.n}/${r.goal} ly"><span class="wv">${r.n || ''}</span><span class="wcol"><i class="wfill ${pct >= 1 ? 'ok' : ''}" style="height:${h}%"></i><i class="wgl" style="bottom:${100 / mx}%"></i></span><span class="wd2 ${r.k === td ? 'now' : ''}">${r.k === td ? 'Nay' : VNWD[r.x.getDay()]}</span></button>`;
    })
    .join('');
  const goalPos = 100 / mx;
  /* lịch 5 tuần, bắt đầu từ Thứ Hai */
  const start = new Date(D30[0]);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  const cells = [];
  for (let x = new Date(start); dk(x) <= td; x.setDate(x.getDate() + 1)) cells.push(new Date(x));
  const grid = cells
    .map(x => {
      const k = dk(x),
        w = dayWater(k),
        p = w.n / w.goal,
        lv = k < first || !w.n ? 0 : p >= 1 ? 4 : p >= 0.75 ? 3 : p >= 0.5 ? 2 : 1;
      return `<button class="wcell l${lv} ${k === td ? 'now' : ''}" data-wday="${k}" aria-label="${x.getDate()}/${x.getMonth() + 1}: ${w.n} ly">${x.getDate() === 1 ? '1/' + (x.getMonth() + 1) : x.getDate()}</button>`;
    })
    .join('');
  return `<div class="card"><h2>💧 Uống nước</h2>
  <div class="stat3"><div><b>${T.n}/${T.goal}</b>ly hôm nay</div><div><b>${avgMl ? fmtL(avgMl) : '–'}</b>TB 7 ngày</div><div><b>${met}/${inRange.length || 0}</b>ngày đạt</div></div>
  ${streak > 1 ? `<div class="okline"><span>🔥</span><span>Chuỗi <b>${streak} ngày</b> liên tiếp uống đủ nước. Giữ phong độ nha!</span></div>` : ''}
  <h3 class="wh">7 ngày gần nhất</h3>
  <div class="wchart">${bars}</div>
  <p class="muted" style="margin:6px 0 0">Số trên cột là số ly. Vạch đứt là mục tiêu, cột xanh đậm là ngày uống đủ. Chạm vào một ngày để sửa hoặc ghi bù.</p></div>
  <div class="card"><h2>📅 5 tuần gần đây</h2>
  <div class="wcal">${['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(d => `<span class="wch">${d}</span>`).join('')}${grid}</div>
  <p class="muted cap" style="text-align:left"><i class="wl l1"></i> dưới 50% <i class="wl l2"></i> 50–75% <i class="wl l3"></i> 75–99% <i class="wl l4"></i> đủ mục tiêu</p></div>
  <div class="card"><h2>⚙️ Mục tiêu</h2><p class="muted" style="margin:0 0 10px">Hiện tại: ${S.water.cups} ly × ${S.water.ml} ml = ${fmtL(S.water.cups * S.water.ml)} mỗi ngày${S.water.auto ? ', tự cộng thêm vào ngày tập và ngày nóng' : ''}.</p><button class="btn ghost" data-spgo="water">Đổi mục tiêu / tính gợi ý</button></div>`;
}
function waterDaySheet(k) {
  const d = S.days[k] || {},
    w = dayWater(k),
    x = new Date(k + 'T12:00:00');
  openSheet(`<h2>💧 ${VNWD[x.getDay()]}, ${x.getDate()}/${x.getMonth() + 1}</h2><p class="muted" style="margin:0 0 12px">Mục tiêu ngày này: ${w.goal} ly × ${w.ml} ml</p>
  <div class="stepper"><button data-wdc="-1" data-k="${k}" aria-label="Bớt 1 ly">−</button><b id="wdn">${w.n} ly</b><button data-wdc="1" data-k="${k}" aria-label="Thêm 1 ly">＋</button></div>
  <p class="muted" id="wdml" style="margin:8px 0 0">= ${fmtL(w.n * w.ml)}</p>
  <button class="btn full" style="margin-top:16px" data-a="closeSheet">Xong</button>`);
}
function viewSleep() {
  const L = S.sleeps.slice(-7);
  if (!L.length)
    return `<div class="card"><h2>😴 Giấc ngủ</h2><p class="muted">Chưa có dữ liệu. Tối nay bấm "Đi ngủ" ở tab Hôm nay nhé!</p></div>`;
  const dur = x => (new Date(x.wake) - new Date(x.bed)) / 36e5;
  const off = d => {
    let h = d.getHours() + d.getMinutes() / 60 - 20;
    if (h < 0) h += 24;
    return h;
  };
  const avg = L.reduce((a, x) => a + dur(x), 0) / L.length;
  const bo = L.map(x => off(new Date(x.bed)));
  const ab = bo.reduce((a, b) => a + b, 0) / bo.length;
  const spread = Math.sqrt(bo.reduce((a, b) => a + (b - ab) ** 2, 0) / bo.length) * 60;
  const toClock = o => {
    let t = (o + 20) % 24;
    return pad(Math.floor(t)) + ':' + pad(Math.round((t % 1) * 60) % 60);
  };
  const [gh, gm] = S.bedTarget.split(':').map(Number);
  let g = gh + gm / 60 - 20;
  if (g < 0) g += 24;
  const rows = L.map(x => {
    const b = new Date(x.bed),
      s = off(b),
      e = Math.min(16, s + dur(x));
    const nd = new Date(b.getTime() - 12 * 36e5);
    const dd = pad(nd.getDate()) + '/' + pad(nd.getMonth() + 1);
    return `<div class="sleep-row"><span>${dd}</span><div class="track"><div class="goal" style="left:${(g / 16) * 100}%"></div><div class="bar" style="left:${(s / 16) * 100}%;width:${((e - s) / 16) * 100}%"></div></div><span style="text-align:right;white-space:nowrap">${dur(x).toFixed(1)}h</span></div>`;
  }).join('');
  return `<div class="card"><h2>😴 Giấc ngủ ${L.length} đêm gần nhất</h2>
    <div class="stat3"><div><b>${avg.toFixed(1)}h</b>TB mỗi đêm</div><div><b>${toClock(ab)}</b>Giờ ngủ TB</div><div><b>±${Math.round(spread)}′</b>Độ đều đặn</div></div>
    ${rows}<div class="axis"><span></span><span><i>20h</i><i>0h</i><i>4h</i><i>8h</i><i>12h</i></span><span></span></div>
    <p class="muted" style="margin:10px 0 0">Vạch đứt màu đào là giờ đi ngủ mục tiêu (${S.bedTarget}).${L.some(x => x.sample) ? ' Một số đêm là dữ liệu mẫu, có thể xóa trong Cài đặt.' : ''}</p></div>
    <div class="card"><h2>Sắp có ở bước sau</h2><p class="muted" style="margin:0">Hồ sơ sức khỏe, tủ thuốc, nhật ký triệu chứng, nợ ngủ trong tuần.</p></div>`;
}

/* ===== src/05-tasks.js ===== */
/* ---------- 📋 Việc & Ước mơ ---------- */
const GROUPS = [
  ['work', '💼', 'Công việc chính'],
  ['family', '🏠', 'Gia đình'],
  ['me', '🌷', 'Cá nhân'],
  ['study', '📚', 'Học tập']
];
const gInfo = g => GROUPS.find(x => x[0] === g) || GROUPS[2];
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const taskById = id => S.tasks.find(t => t.id === id);
let showAllLazy = false,
  tfilter = 'all',
  editId = null;
const fmtDue = k => {
  const [y, m, d] = k.split('-');
  return d + '/' + m + (+y !== new Date().getFullYear() ? '/' + y : '');
};
function dueInfo(t) {
  if (!t.due) return null;
  const td = dk(new Date()),
    tm = new Date();
  tm.setDate(tm.getDate() + 1);
  const tail = t.dueTime ? ' ' + t.dueTime : '';
  if (t.due < td) return { cls: 'over', txt: 'Quá hạn ' + fmtDue(t.due) };
  if (t.due === td) return { cls: 'today', txt: 'Hôm nay' + tail };
  if (t.due === dk(tm)) return { cls: 'soon', txt: 'Ngày mai' + tail };
  return { cls: '', txt: fmtDue(t.due) + tail };
}
const sortTasks = (a, b) =>
  (a.due || '9999').localeCompare(b.due || '9999') ||
  (a.dueTime || '99').localeCompare(b.dueTime || '99') ||
  String(a.createdAt).localeCompare(String(b.createdAt));
function top3Slot(x) {
  if (x && x.tid) {
    const t = taskById(x.tid);
    if (t) return { t: t.title, d: !!t.done, tid: t.id };
  }
  return { t: (x && x.t) || '', d: !!(x && x.d) };
}
const inTop3 = id => today().top3.some(x => x.tid === id);
function toggleStar(id) {
  const d = today(),
    i = d.top3.findIndex(x => x.tid === id);
  if (i >= 0) {
    d.top3[i] = { t: '', d: false };
    say('Đã bỏ khỏi Top 3 hôm nay');
    return;
  }
  const j = d.top3.findIndex(x => !x.tid && !(x.t || '').trim());
  if (j < 0) {
    say('Top 3 hôm nay đầy rồi, bỏ bớt một việc nhé 🙈');
    return;
  }
  d.top3[j] = { t: '', d: false, tid: id };
  say('⭐ Đã đưa lên Top 3 hôm nay!');
}
function setDone(t, v) {
  t.done = v;
  t.doneAt = v ? new Date().toISOString() : null;
}
function delTask(id) {
  const t = taskById(id);
  if (!t) return;
  Object.values(S.days).forEach(d =>
    (d.top3 || []).forEach((x, i) => {
      if (x.tid === id) d.top3[i] = { t: t.title, d: !!t.done };
    })
  );
  S.tasks = S.tasks.filter(x => x.id !== id);
  if (S.pomo && S.pomo.taskId === id) S.pomo.taskId = null;
}
const safeUrl = u => {
  u = (u || '').trim();
  if (!u) return '';
  if (!/^[a-z][a-z0-9+.-]*:/i.test(u)) u = 'https://' + u;
  return /^(https?|mailto|tel):/i.test(u) ? u : '';
};
function taskRow(t) {
  const di = dueInfo(t),
    subs = t.subs || [],
    sd = subs.filter(s => s.d).length,
    st = inTop3(t.id);
  return `<div class="trow ${t.done ? 'done' : ''}"><input type="checkbox" data-tdone="${t.id}" ${t.done ? 'checked' : ''} aria-label="Xong: ${esc(t.title)}"><button class="tmain" data-topen="${t.id}"><span class="tt">${esc(t.title)}</span><span class="tmeta">${di && !t.done ? `<i class="due ${di.cls}">⏰ ${di.txt}</i>` : ''}${!t.done && t.due ? (lvl(t) === 'chibi' ? '<i>💬</i>' : ['cal', 'alarm'].includes(lvl(t)) ? (t.bell ? '<i>🔔</i>' : '<i class="nobell">🔕 chưa có chuông</i>') : '') : ''}${subs.length ? `<i>☑️ ${sd}/${subs.length}</i>` : ''}${t.link ? '<i>🔗 Link</i>' : ''}${t.note ? '<i>📝</i>' : ''}</span></button><button class="star ${st ? 'on' : ''}" data-tstar="${t.id}" aria-label="${st ? 'Bỏ khỏi' : 'Đưa lên'} Top 3" aria-pressed="${st}">⭐</button></div>`;
}
function viewTasks() {
  const td = dk(new Date()),
    inF = t => tfilter === 'all' || t.group === tfilter;
  const urgent = t => (t.due && t.due <= td) || inTop3(t.id),
    lazyHide = today().lazy && !showAllLazy;
  const open = S.tasks.filter(t => !t.done && inF(t) && (!lazyHide || urgent(t))),
    done = S.tasks.filter(t => t.done && inF(t)).sort((a, b) => String(b.doneAt).localeCompare(String(a.doneAt)));
  const pp = pomoState(),
    pomoTop = !!pp.endAt || pomoLeft() < pomoLen(pp.mode) || pp.mode !== 'focus';
  let h = pomoTop ? pomoCard() : '';
  h += `<div class="card"><h2>📋 Việc cần làm <small>${S.tasks.filter(t => !t.done).length} việc</small></h2>
  <form id="taskF" class="addrow"><input class="inp" id="tnew" placeholder="Thêm việc mới…" maxlength="140" autocomplete="off" enterkeyhint="done"><button class="btn" aria-label="Thêm việc">＋</button></form>
  <div class="row gpick" role="group" aria-label="Nhóm của việc mới">${GROUPS.map(([k, i, n]) => `<button class="chip sm" data-tg="${k}" aria-pressed="${S.taskGroup === k}">${i} ${n}</button>`).join('')}</div></div>`;
  if (today().lazy)
    h += `<div class="card lazycard"><p style="margin:0 0 8px">🛋️ <b>Ngày Lười Biếng</b>: ${lazyHide ? 'chỉ hiện việc đến hạn hôm nay, quá hạn hoặc ⭐. Các việc khác để mai tính nha.' : 'đang hiện tất cả việc.'}</p><button class="chip sm" data-a="lazyAll">${lazyHide ? 'Hiện tất cả việc (' + S.tasks.filter(t => !t.done && !urgent(t)).length + ' việc đang ẩn)' : 'Chỉ hiện việc gấp'}</button></div>`;
  h += `<div class="wtabs" style="margin-top:14px">${[['all', 'Tất cả']]
    .concat(GROUPS.map(([k, i, n]) => [k, i + ' ' + n]))
    .map(([k, n]) => `<button data-tf="${k}" aria-pressed="${tfilter === k}">${n}</button>`)
    .join('')}</div>`;
  const over = open.filter(t => t.due && t.due < td).sort(sortTasks),
    rest = open.filter(t => !(t.due && t.due < td)).sort(sortTasks);
  if (over.length)
    h += `<div class="card"><h2>⚠️ Quá hạn <small>${over.length}</small></h2>${over.map(taskRow).join('')}</div>`;
  let any = false;
  (tfilter === 'all' ? GROUPS : GROUPS.filter(g => g[0] === tfilter)).forEach(([k, i, n]) => {
    const L = rest.filter(t => t.group === k);
    if (!L.length) return;
    any = true;
    h += `<div class="card"><h2>${i} ${n} <small>${L.length}</small></h2>${L.map(taskRow).join('')}</div>`;
  });
  if (!any && !over.length)
    h += `<div class="card"><p class="muted" style="margin:0">${S.tasks.some(inF) ? 'Xong hết rồi! Thảnh thơi thôi 🌷' : 'Chưa có việc nào ở đây. Gõ vào ô phía trên để thêm việc nhé.'}</p></div>`;
  if (done.length)
    h += `<div class="card"><details class="more"><summary>✅ Đã xong (${done.length})</summary>${done.slice(0, 60).map(taskRow).join('')}<button class="btn ghost" style="margin-top:10px" data-a="clearDone">🧹 Dọn ${done.length} việc đã xong</button></details></div>`;
  if (!pomoTop) h += pomoCard();
  h += `<div class="card"><h2>Sắp có ở bước sau</h2><p class="muted" style="margin:0">Đặt chuông nhắc qua Lịch / Lời nhắc iPhone, Mục tiêu Năm → Quý → Tháng, Vision Board, Nhìn lại tuần.</p></div>`;
  return h;
}
function subsHtml(t) {
  return (t.subs || [])
    .map(
      s =>
        `<div class="task ${s.d ? 'done' : ''}"><input type="checkbox" data-sub="${s.id}" ${s.d ? 'checked' : ''} aria-label="Xong việc con"><input type="text" data-subt="${s.id}" value="${esc(s.t)}" aria-label="Tên việc con"><button class="xbtn" data-subdel="${s.id}" aria-label="Xóa việc con">✕</button></div>`
    )
    .join('');
}
function taskSheet(id) {
  const t = taskById(id);
  if (!t) return;
  editId = id;
  const st = inTop3(id),
    lk = safeUrl(t.link);
  openSheet(`<h2>✏️ Chi tiết việc</h2>
  <div class="q" style="margin-top:10px"><input class="inp" id="tTitle" value="${esc(t.title)}" maxlength="140" aria-label="Tên việc"></div>
  <div class="q"><h3>Nhóm</h3><div class="row">${GROUPS.map(([k, i, n]) => `<button class="chip sm" data-tsg="${k}" aria-pressed="${t.group === k}">${i} ${n}</button>`).join('')}</div></div>
  <div class="q"><h3>Hạn chót</h3><div class="row" style="flex-wrap:nowrap"><input class="inp" type="date" id="tDue" value="${t.due || ''}" aria-label="Ngày hạn"><input class="inp" type="time" id="tTime" value="${t.dueTime || ''}" style="max-width:130px" aria-label="Giờ hạn"></div>
   <div class="row" style="margin-top:8px">${[
     ['0', 'Hôm nay'],
     ['1', 'Ngày mai'],
     ['7', 'Tuần sau'],
     ['x', 'Không hạn']
   ]
     .map(([k, n]) => `<button class="chip sm" data-tquick="${k}">${n}</button>`)
     .join('')}</div></div>
  <div class="q"><h3>🔔 Nhắc nhở</h3><div id="remindBox">${remindHtml(t)}</div></div>
  <div class="q"><h3>Việc con</h3><div id="subs">${subsHtml(t)}</div><form id="subF" class="addrow" style="margin-top:6px"><input class="inp" id="subNew" placeholder="Thêm việc con…" maxlength="120" autocomplete="off" enterkeyhint="done"><button class="btn ghost" aria-label="Thêm việc con">＋</button></form></div>
  <div class="q"><h3>Link tài liệu</h3><div class="row" style="flex-wrap:nowrap"><input class="inp" type="url" id="tLink" value="${esc(t.link || '')}" placeholder="https://…" inputmode="url" autocapitalize="off">${lk ? `<a class="btn ghost" href="${esc(lk)}" target="_blank" rel="noopener">Mở</a>` : ''}</div></div>
  <div class="q"><h3>Ghi chú</h3><textarea class="inp" id="tNote" rows="3" maxlength="2000">${esc(t.note || '')}</textarea></div>
  <div class="row" style="margin-top:18px"><button class="btn" data-a="tSave">Xong</button><button class="btn ghost" data-tstar="${id}" data-insheet="1">${st ? '⭐ Bỏ khỏi Top 3' : '⭐ Đưa lên Top 3'}</button><button class="btn ghost" data-pomotask="${id}">🍅 Tập trung</button></div>
  <div class="row" style="margin-top:10px"><button class="btn ghost danger" data-a="tDel">🗑️ Xóa việc</button></div>`);
}

/* ===== src/06-reminders.js ===== */
/* ---------- 🔔 Nhắc nhở ---------- */
/* 4 mức: none 🔕 · chibi 💬 (trong app) · cal 📅 (Lịch iPhone qua file .ics) · alarm ⏰ (Báo thức – Đồng hồ) */
const LV = [
  ['none', '🔕', 'Không nhắc'],
  ['chibi', '💬', 'Chibi nhắc'],
  ['cal', '📅', 'Lịch iPhone'],
  ['alarm', '⏰', 'Báo thức']
];
const lvInfo = k => LV.find(x => x[0] === k) || LV[0];
const LEADS = [
  [0, 'Đúng hạn'],
  [60, 'Trước 1 giờ'],
  [1440, 'Trước 1 ngày']
];
const lvl = t => (t.due ? t.remind || S.remindDefault.task : 'none');
const needsBell = t => !t.done && ['cal', 'alarm'].includes(lvl(t)) && !t.bell && t.due >= dk(new Date());
/* thời điểm hạn chót (Date) – việc không có giờ coi như 9:00 sáng */
function dueAt(t) {
  if (!t.due) return null;
  const [h, m] = (t.dueTime || '09:00').split(':').map(Number);
  const d = new Date(t.due + 'T00:00:00');
  d.setHours(h, m, 0, 0);
  return d;
}
function alarmAt(t) {
  const d = dueAt(t);
  return d ? new Date(d.getTime() - (t.lead || 0) * 6e4) : null;
}
const fmtDT = d => hm(d) + ' ' + pad(d.getDate()) + '/' + pad(d.getMonth() + 1);
/* Đổi giờ/mức sau khi đã có chuông → chuông cũ trên iPhone không tự đổi */
function bellChanged(t) {
  if (t.bell) {
    t.bell = false;
    t.oldBell = true;
  }
}

/* --- File lịch .ics (RFC 5545) --- */
const icsEsc = s =>
  String(s || '')
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
function icsFold(line) {
  const enc = new TextEncoder();
  if (enc.encode(line).length <= 73) return line;
  let out = [],
    cur = '',
    n = 0;
  for (const ch of line) {
    const b = enc.encode(ch).length;
    if (n + b > 73) {
      out.push(cur);
      cur = '';
      n = 0;
    }
    cur += ch;
    n += b;
  }
  out.push(cur);
  return out.join('\r\n ');
}
const icsUTC = d =>
  d
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
/* ev có thể là 1 sự kiện hoặc mảng sự kiện (vd: sinh nhật + các ngày kỷ niệm trong cùng 1 file) */
function buildIcs(evs) {
  const L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Cozy Life OS//VI', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
  [].concat(evs).forEach(ev => {
    L.push(
      'BEGIN:VEVENT',
      'UID:' + ev.uid + '@cozy-life-os',
      'DTSTAMP:' + icsUTC(new Date()),
      'SUMMARY:' + icsEsc(ev.title)
    );
    if (ev.date) {
      const n = new Date(ev.date + 'T00:00:00');
      n.setDate(n.getDate() + 1);
      L.push('DTSTART;VALUE=DATE:' + ev.date.replace(/-/g, ''), 'DTEND;VALUE=DATE:' + dk(n).replace(/-/g, ''));
    } else
      L.push('DTSTART:' + icsUTC(ev.start), 'DTEND:' + icsUTC(new Date(ev.start.getTime() + (ev.durMin || 30) * 6e4)));
    if (ev.rrule) L.push('RRULE:' + ev.rrule);
    if (ev.loc) L.push('LOCATION:' + icsEsc(ev.loc));
    if (ev.desc) L.push('DESCRIPTION:' + icsEsc(ev.desc));
    if (ev.url) L.push('URL:' + String(ev.url).replace(/[\r\n]/g, ''));
    (ev.triggers || [ev.trigger]).forEach(tr =>
      L.push('BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + icsEsc(ev.title), 'TRIGGER:' + tr, 'END:VALARM')
    );
    L.push('END:VEVENT');
  });
  L.push('END:VCALENDAR');
  return L.map(icsFold).join('\r\n') + '\r\n';
}
function taskIcs(t) {
  const lead = t.lead || 0,
    lk = safeUrl(t.link),
    desc = ['Từ Cozy Life OS 🌷', t.note || '', lk ? 'Link: ' + lk : ''].filter(Boolean).join('\n');
  if (!t.dueTime)
    return buildIcs({
      uid: t.id,
      title: '📋 ' + t.title,
      date: t.due,
      trigger: lead === 1440 ? '-PT15H' : lead === 60 ? 'PT8H' : 'PT9H',
      desc,
      url: lk
    });
  return buildIcs({
    uid: t.id,
    title: '📋 ' + t.title,
    start: dueAt(t),
    durMin: 30,
    trigger: lead === 1440 ? '-P1D' : lead === 60 ? '-PT1H' : 'PT0S',
    desc,
    url: lk
  });
}
function bedIcs() {
  const [h, m] = S.bedTarget.split(':').map(Number),
    s = new Date();
  s.setHours(h, m, 0, 0);
  if (s < new Date()) s.setDate(s.getDate() + 1);
  return buildIcs({
    uid: 'cozy-bedtime',
    title: '🌙 Giờ đi ngủ – Cozy Life',
    start: s,
    durMin: 15,
    rrule: 'FREQ=DAILY',
    trigger: '-PT30M',
    desc: 'Mở Cozy Life để khép lại ngày hôm nay rồi bấm "Đi ngủ" nhé 😴'
  });
}
let lastIcs = null;
function deliverIcs(name, text) {
  lastIcs = { name, text };
  const blob = new Blob([text], { type: 'text/calendar;charset=utf-8' }),
    url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    a.remove();
  }, 60000);
}
async function shareIcs() {
  if (!lastIcs) return;
  const f = new File([lastIcs.text], lastIcs.name, { type: 'text/calendar' });
  if (navigator.canShare && navigator.canShare({ files: [f] })) {
    try {
      await navigator.share({ files: [f] });
    } catch (e) {}
  } else deliverIcs(lastIcs.name, lastIcs.text);
}

/* --- Phần nhắc nhở trong chi tiết việc --- */
function remindHtml(t) {
  if (!t.due) return `<p class="muted" style="margin:0">Đặt hạn chót ở trên để chọn cách nhắc.</p>`;
  const L = lvl(t);
  let h = `<div class="row">${LV.map(([k, i, n]) => `<button class="chip sm" data-tlv="${k}" aria-pressed="${L === k}">${i} ${n}</button>`).join('')}</div>`;
  if (L === 'none')
    return h + `<p class="muted" style="margin:8px 0 0">Việc chỉ nằm trong danh sách, không ai nhắc.</p>`;
  if (L === 'chibi')
    return (
      h +
      `<p class="muted" style="margin:8px 0 0">Chibi nhắc khi bạn mở app: trong ngày đến hạn${t.dueTime ? ' và trước giờ hạn 30 phút' : ''}. Không kêu, không báo khi app đang tắt.</p>`
    );
  h += `<div class="row" style="margin-top:8px">${LEADS.map(([v, n]) => `<button class="chip sm" data-tlead="${v}" aria-pressed="${(t.lead || 0) === v}">${n}</button>`).join('')}</div>`;
  if (L === 'alarm' && !t.dueTime)
    h += `<p class="muted" style="margin:8px 0 0">💡 Báo thức cần giờ cụ thể. Chưa chọn giờ thì mình tính là 9:00 sáng.</p>`;
  const at = alarmAt(t);
  h += `<div class="okline ${t.bell ? '' : 'warn'}" style="margin:10px 0 0"><span>${t.bell ? '🔔' : '🔕'}</span><span>${t.bell ? (L === 'cal' ? 'Đã thêm vào Lịch iPhone' : 'Đã đặt báo thức') + ' · báo lúc <b>' + fmtDT(at) + '</b>' : 'Chưa có chuông trên iPhone · sẽ báo lúc <b>' + fmtDT(at) + '</b>'}</span></div>`;
  if (t.oldBell)
    h += `<p class="muted" style="margin:6px 0 0">⚠️ Bạn vừa đổi giờ hoặc mức nhắc. Nhớ xóa ${L === 'alarm' ? 'báo thức' : 'sự kiện'} cũ trên iPhone rồi đặt lại nhé.</p>`;
  if (!t.bell)
    h += `<h3 style="font-size:15px;margin:14px 0 8px">Đặt chuông chưa?</h3><div class="row"><button class="btn" data-bell="set">✅ Đặt giúp tôi</button><button class="btn ghost" data-bell="done">👌 Tôi đặt rồi</button><button class="btn ghost" data-bell="later">⏰ Để sau</button></div>`;
  else
    h += `<div class="row" style="margin-top:8px"><button class="chip sm" data-bell="set">${L === 'cal' ? '📅 Thêm lại vào Lịch' : '⏰ Xem lại cách đặt'}</button><button class="chip sm" data-bell="unset">Đánh dấu chưa có chuông</button></div>`;
  return h;
}
function refreshRemind() {
  const t = taskById(editId),
    el = $('#remindBox');
  if (t && el) el.innerHTML = remindHtml(t);
}
function bellAction(kind) {
  const t = taskById(editId);
  if (!t) return;
  const L = lvl(t);
  if (kind === 'done') {
    t.bell = true;
    t.oldBell = false;
    t.bellAsk = null;
    say('Đã đánh dấu 🔔');
  } else if (kind === 'later') {
    t.bellAsk = 'later';
    say('Ok, lần sau mở app mình hỏi lại nha ⏰');
  } else if (kind === 'unset') {
    t.bell = false;
  } else if (kind === 'set') {
    if (L === 'cal') {
      deliverIcs('cozy-' + t.title.replace(/[^\p{L}\p{N}]+/gu, '-').slice(0, 40) + '.ics', taskIcs(t));
      t.bell = true;
      t.oldBell = false;
      t.bellAsk = null;
      save();
      openSheet(`<h2>📅 Thêm vào Lịch</h2><p class="muted">iPhone sẽ hiện bảng sự kiện "<b>${esc(t.title)}</b>". Bấm <b>Thêm vào Lịch</b> (hoặc <b>Thêm tất cả</b>) là xong. Lịch sẽ báo lúc <b>${fmtDT(alarmAt(t))}</b>, kể cả khi Cozy Life đang tắt.</p>
      <p class="muted">Không thấy gì hiện ra? Bấm nút dưới, chọn <b>Lưu vào Tệp</b>, rồi mở file đó trong app Tệp.</p>
      <div class="row" style="margin-top:12px"><button class="btn" data-a="backTask">Xong</button><button class="btn ghost" data-a="shareIcs">📤 Gửi file lịch</button></div>`);
      return;
    }
    if (L === 'alarm') {
      const at = alarmAt(t);
      openSheet(`<h2>⏰ Đặt báo thức</h2><p>Mở app <b>Đồng hồ</b> → <b>Báo thức</b> → <b>＋</b>, đặt lúc <b style="font-size:20px">${hm(at)}</b> ngày <b>${pad(at.getDate())}/${pad(at.getMonth() + 1)}</b>, nhãn "<b>${esc(t.title)}</b>".</p>
      <p class="muted">Báo thức của iPhone chỉ chọn giờ, không chọn ngày, nên hãy đặt vào tối hôm trước hoặc sáng hôm đó. Bước sau mình sẽ làm Phím tắt "Cozy Nhắc" để tạo báo thức chỉ với một chạm.</p>
      <div class="row" style="margin-top:12px"><a class="btn ghost" href="clock-alarm://">🕰️ Mở app Đồng hồ</a><button class="btn" data-a="alarmDone">👌 Tôi đặt rồi</button><button class="btn ghost" data-a="backTask">Để sau</button></div>`);
      return;
    }
  }
  render();
  refreshRemind();
}

/* --- Chibi nhắc trong app (💬) + thanh nhắc --- */
let nudgeCur = null;
function lazyDay() {
  return today().lazy === true;
}
function showNudge(n) {
  nudgeCur = n;
  const el = $('#nudge');
  el.innerHTML = `<div class="board"><span class="nail l"></span><span class="nail r"></span><button class="xbtn bx" data-nudge="close" aria-label="Đóng">✕</button><p class="bt">🧸 Chibi nhắc nè</p><p>${n.text}</p><div class="row">${n.btns ? n.btns.map((b, i) => `<button class="btn ${i ? 'ghost' : ''}" data-nudge="b${i}">${b}</button>`).join('') : `${n.open ? '<button class="btn" data-nudge="open">Xem</button>' : ''}<button class="btn ghost" data-nudge="snooze">Để sau</button>${n.stop ? '<button class="btn ghost" data-nudge="stop">Đừng nhắc việc này nữa</button>' : ''}`}</div></div><i class="pole a"></i><i class="pole b"></i>`;
  clearTimeout(P.t);
  if (P.act) endAct();
  const b = bounds(),
    tx = Math.round(Math.min(b.maxX, Math.max(b.minX, innerWidth / 2 - PW / 2))),
    ty = b.maxY,
    ms = calm() ? 0 : Math.max(350, (Math.hypot(tx - P.x, ty - P.y) / 170) * 1000);
  pet.classList.toggle('left', tx < P.x);
  pet.classList.remove('sitting');
  pet.classList.add('walking');
  place(tx, ty, ms);
  $('#bubble').classList.remove('on');
  setTimeout(() => {
    if (nudgeCur !== n) return;
    pet.classList.remove('walking', 'left');
    P.act = 'sign';
    drawChibi();
    layoutBoard();
    el.classList.remove('hide', 'hiding');
    void el.offsetWidth;
    el.classList.add('show');
  }, ms);
}
function hideNudge() {
  const el = $('#nudge'),
    was = nudgeCur;
  nudgeCur = null;
  el.classList.remove('show');
  if (was && !calm()) {
    el.classList.add('hiding');
    setTimeout(() => {
      if (!nudgeCur) {
        el.classList.add('hide');
        el.classList.remove('hiding');
      }
    }, 320);
  } else el.classList.add('hide');
  if (P.act === 'sign') {
    P.act = null;
    drawChibi();
    P.t = setTimeout(wander, 900);
  }
}
function nudgeAction(k) {
  const n = nudgeCur;
  if (!n) return;
  hideNudge();
  if (k[0] === 'b' && n.onBtn) return n.onBtn(+k.slice(1));
  if (k === 'open') {
    if (n.taskId) {
      tab = 'tasks';
      render();
      taskSheet(n.taskId);
    } else if (n.tab) {
      tab = n.tab;
      if (n.after) n.after();
      render();
    }
  } else if (k === 'snooze') {
    S.nudgeSnooze = Date.now() + 60 * 6e4;
    say('Ok, 1 tiếng nữa mình nhắc lại nha', 2500);
  } else if (k === 'stop') {
    if (n.taskId) {
      const t = taskById(n.taskId);
      if (t) {
        t.remind = 'none';
        bellChanged(t);
      }
    }
    if (n.kind === 'bed') S.remindDefault.bed = 'none';
    if (n.kind === 'gym') S.gym.remind = 'none';
    say('Mình sẽ không nhắc việc này nữa 🤐', 2500);
    render();
  }
  save();
}
function checkNudges() {
  if (nudgeCur || dnd() || $('#sheetbg').classList.contains('on') || $('#sleepcover').classList.contains('on')) return;
  if (S.nudgeSnooze && Date.now() < S.nudgeSnooze) return;
  const now = new Date(),
    td = dk(now),
    log = S.nudgeLog || (S.nudgeLog = {});
  /* giờ đi ngủ: trước 30 phút */
  if (S.remindDefault.bed === 'chibi' && !today().evening && log.bed !== td) {
    const [h, m] = S.bedTarget.split(':').map(Number),
      b = new Date();
    b.setHours(h, m, 0, 0);
    const diff = (b - now) / 6e4;
    if (diff <= 30 && diff > -90) {
      log.bed = td;
      save();
      return showNudge({
        kind: 'bed',
        text:
          '🌙 Còn ' +
          Math.max(0, Math.round(diff)) +
          ' phút nữa là đến giờ đi ngủ (' +
          S.bedTarget +
          '). Khép lại ngày hôm nay nhé?',
        say: 'Sắp đến giờ ngủ rồi ' + S.name + ' ơi 🥱',
        act: 'yawn',
        open: true,
        tab: 'today',
        after: () => eveningSheet(),
        stop: true
      });
    }
  }
  if (peopleNudge(now, td, log)) return;
  if (lazyDay()) return; /* Ngày Lười Biếng: tạm im lặng */
  const gk = S.gym.days.length && planFor(now);
  if (gk && S.gym.remind === 'chibi' && log.gym !== td) {
    const [h, m] = S.gym.time.split(':').map(Number),
      gt = new Date();
    gt.setHours(h, m, 0, 0);
    const diff = (gt - now) / 6e4;
    if (diff <= 60 && diff > -60) {
      log.gym = td;
      save();
      return showNudge({
        kind: 'gym',
        text: '🏋️ Hôm nay là ngày tập <b>' + SPLITS[gk][0] + '</b> lúc ' + S.gym.time + '. Xem gợi ý bài tập nhé?',
        say: 'Sắp đến giờ tập rồi ' + S.name + ' 💪',
        act: 'stretch',
        open: true,
        tab: 'health',
        after: () => {
          htab = 'gym';
          render();
        },
        stop: true
      });
    }
  }
  const L = S.tasks.filter(t => !t.done && lvl(t) === 'chibi' && t.due && t.due <= td);
  /* sắp đến giờ hạn (30 phút) */
  for (const t of L) {
    if (!t.dueTime || t.due !== td) continue;
    const d = (dueAt(t) - now) / 6e4,
      key = t.due + ' ' + t.dueTime;
    if (d <= 30 && d > -60 && (t.nudge || {}).soon !== key) {
      t.nudge = Object.assign({}, t.nudge, { soon: key, day: td });
      save();
      return showNudge({
        taskId: t.id,
        text:
          '⏰ "<b>' +
          esc(t.title) +
          '</b>" ' +
          (d > 0 ? 'còn ' + Math.round(d) + ' phút nữa đến hạn (' + t.dueTime + ')' : 'đã đến hạn lúc ' + t.dueTime),
        say: 'Việc này sắp đến hạn rồi nè!',
        act: 'laptop',
        open: true,
        stop: true
      });
    }
  }
  /* trong ngày / quá hạn: mỗi ngày 1 lần */
  const fresh = L.filter(t => (t.nudge || {}).day !== td);
  if (fresh.length && now.getHours() >= 7) {
    fresh.forEach(t => {
      t.nudge = Object.assign({}, t.nudge, { day: td });
    });
    save();
    if (fresh.length === 1) {
      const t = fresh[0];
      return showNudge({
        taskId: t.id,
        text:
          t.due < td
            ? '⚠️ "<b>' + esc(t.title) + '</b>" đã quá hạn ' + fmtDue(t.due)
            : '📋 Hôm nay đến hạn: "<b>' + esc(t.title) + '</b>"' + (t.dueTime ? ' lúc ' + t.dueTime : ''),
        say: 'Có việc cần làm nè ' + S.name + '!',
        open: true,
        stop: true
      });
    }
    return showNudge({
      text: '📋 Có <b>' + fresh.length + ' việc</b> đến hạn hoặc quá hạn. Xem qua nhé?',
      say: 'Có ' + fresh.length + ' việc đến hạn nè 📋',
      open: true,
      tab: 'tasks'
    });
  }
  /* việc 📅/⏰ chưa đặt chuông (bấm "Để sau"): hỏi lại mỗi ngày 1 lần */
  const ask = S.tasks.filter(t => needsBell(t) && t.bellAsk === 'later');
  if (ask.length && log.bellAsk !== td) {
    log.bellAsk = td;
    save();
    return showNudge({
      taskId: ask.length === 1 ? ask[0].id : null,
      tab: 'today',
      text:
        '🔔 ' +
        (ask.length === 1
          ? '"<b>' + esc(ask[0].title) + '</b>" chưa có chuông trên iPhone.'
          : ask.length + ' việc chưa có chuông trên iPhone.') +
        ' Đặt luôn nhé?',
      open: true
    });
  }
}

/* ===== src/07-pomodoro.js ===== */
/* ---------- 🍅 Pomodoro ---------- */
const PLEN = { short: 5, long: 15 };
const pomoLen = m => (m === 'focus' ? S.pomoLen : PLEN[m]) * 60;
function pomoState() {
  if (!S.pomo) S.pomo = { mode: 'focus', endAt: null, left: pomoLen('focus'), taskId: null, round: 0 };
  return S.pomo;
}
function pomoLeft() {
  const p = pomoState();
  return p.endAt ? Math.max(0, Math.ceil((p.endAt - Date.now()) / 1000)) : p.left;
}
const focusing = () => !!(S.pomo && S.pomo.endAt && S.pomo.mode === 'focus');
const mmss = s => pad(Math.floor(s / 60)) + ':' + pad(s % 60);
const RC = 2 * Math.PI * 54;
function pomoCard() {
  const p = pomoState(),
    left = pomoLeft(),
    tot = pomoLen(p.mode),
    run = !!p.endAt,
    t = p.taskId && taskById(p.taskId),
    d = today();
  return `<div class="card pomo ${p.mode}"><h2>🍅 Pomodoro <small>Hôm nay: ${d.pomos || 0} phiên · ${d.focus || 0} phút</small></h2>
  <div class="pwrap"><svg viewBox="0 0 120 120" class="ring" aria-hidden="true"><circle cx="60" cy="60" r="54" class="rbg"/><circle cx="60" cy="60" r="54" class="rfg" id="pRing" stroke-dasharray="${RC}" stroke-dashoffset="${RC * (1 - left / tot)}"/></svg>
  <div class="pmid"><div class="pmode">${p.mode === 'focus' ? 'Tập trung' : p.mode === 'short' ? 'Nghỉ ngắn ☕' : 'Nghỉ dài 🌿'}</div><div class="ptime" id="pTime" role="timer">${mmss(left)}</div><div class="pround" aria-label="Phiên ${(p.round || 0) % 4} trên 4">${'●'.repeat((p.round || 0) % 4)}${'○'.repeat(4 - ((p.round || 0) % 4))}</div></div></div>
  ${t ? `<p class="pfor">Đang làm: <b>${esc(t.title)}</b> <button class="xbtn" data-a="pomoUntask" aria-label="Bỏ chọn việc">✕</button></p>` : ''}
  <div class="row" style="justify-content:center"><button class="btn" data-a="pomoGo">${run ? '⏸️ Tạm dừng' : left < tot ? '▶️ Tiếp tục' : '▶️ Bắt đầu'}</button>${left < tot || run ? '<button class="btn ghost" data-a="pomoReset">↺ Làm lại</button>' : ''}<button class="btn ghost" data-a="pomoSkip">${p.mode === 'focus' ? '⏭️ Nghỉ luôn' : '⏭️ Bỏ nghỉ'}</button></div>
  <details class="more" style="margin-top:10px"><summary>Tùy chọn</summary>
  <div class="q" style="margin-top:6px"><h3>Thời gian tập trung</h3><div class="row">${[15, 25, 45].map(n => `<button class="chip sm" data-plen="${n}" aria-pressed="${S.pomoLen === n}">${n} phút</button>`).join('')}</div></div>
  <div class="q"><h3>Âm thanh nền khi tập trung</h3><div class="row">${[
    ['none', '🔇 Yên lặng'],
    ['rain', '🌧️ Tiếng mưa'],
    ['brown', '🌊 Rì rào']
  ]
    .map(([k, n]) => `<button class="chip sm" data-psnd="${k}" aria-pressed="${S.pomoSound === k}">${n}</button>`)
    .join('')}</div></div>
  <p class="muted" style="margin:10px 0 0">Khi đang tập trung, Chibi ngồi ở góc làm việc cùng bạn, không chạy lung tung. App giữ màn hình sáng. Nếu bạn khóa máy hoặc thoát app thì sẽ không có chuông báo, nhưng mở lại vẫn tính đúng giờ.</p></details></div>`;
}
function pomoTick() {
  const p = S.pomo;
  if (!p || !p.endAt) return;
  const left = pomoLeft();
  const el = $('#pTime');
  if (el) {
    el.textContent = mmss(left);
    const r = $('#pRing');
    if (r) r.setAttribute('stroke-dashoffset', RC * (1 - left / pomoLen(p.mode)));
  }
  if (left <= 0) pomoDone(false);
}
function pomoDone(quiet) {
  const p = pomoState(),
    d = today(),
    was = p.mode;
  if (was === 'focus') {
    d.pomos = (d.pomos || 0) + 1;
    d.focus = (d.focus || 0) + S.pomoLen;
    p.round = (p.round || 0) + 1;
    p.mode = p.round % 4 === 0 ? 'long' : 'short';
  } else p.mode = 'focus';
  p.endAt = null;
  p.left = pomoLen(p.mode);
  stopNoise();
  releaseWake();
  if (tab === 'tasks') render();
  else save();
  if (quiet) {
    if (was === 'focus') say('Phiên tập trung đã xong lúc bạn vắng mặt ✅ Giỏi lắm!', 5000);
    return;
  }
  chime();
  if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
  if (was === 'focus') {
    const t = p.taskId && taskById(p.taskId);
    startAct('dance');
    celebrate(1);
    say(
      (t ? 'Xong một phiên cho "' + t.title + '"! ' : 'Xong một phiên rồi! ') +
        'Nghỉ ' +
        (p.mode === 'long' ? '15' : '5') +
        ' phút nha ☕',
      6000
    );
  } else {
    wander();
    say('Hết giờ nghỉ rồi, mình quay lại nhé 💪', 5000);
  }
}
function pomoGo() {
  const p = pomoState();
  if (p.endAt) {
    p.left = pomoLeft();
    p.endAt = null;
    stopNoise();
    releaseWake();
    render();
    wander();
    say('Tạm dừng nha, nghỉ chút cũng được 🍵', 3000);
    return;
  }
  if (p.left <= 0) p.left = pomoLen(p.mode);
  p.endAt = Date.now() + p.left * 1000;
  if (p.mode === 'focus') {
    startNoise();
    keepAwake();
    say('Bắt đầu nào! Mình làm cùng ' + S.name + ' nhé 💻', 3500);
  }
  render();
  wander();
}
function pomoStop(mode) {
  const p = pomoState();
  p.endAt = null;
  if (mode) p.mode = mode;
  p.left = pomoLen(p.mode);
  stopNoise();
  releaseWake();
  render();
  wander();
}
let noiseNode = null,
  wakeLk = null;
function startNoise() {
  stopNoise();
  if (S.pomoSound === 'none' || !S.pomoSound) return;
  try {
    if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)();
    AC.resume();
    const rain = S.pomoSound === 'rain',
      len = AC.sampleRate * 6,
      buf = AC.createBuffer(1, len, AC.sampleRate),
      ch = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      if (rain) ch[i] = w * (Math.random() < 0.0006 ? 1 : 0.32);
      else {
        last = (last + 0.02 * w) / 1.02;
        ch[i] = last * 3.5;
      }
    }
    const dif = ch[len - 1] - ch[0];
    for (let i = 0; i < len; i++) ch[i] -= (dif * i) / (len - 1);
    const src = AC.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const f = AC.createBiquadFilter();
    f.type = rain ? 'bandpass' : 'lowpass';
    f.frequency.value = rain ? 1500 : 480;
    f.Q.value = rain ? 0.45 : 0.7;
    const g = AC.createGain();
    g.gain.setValueAtTime(0, AC.currentTime);
    g.gain.linearRampToValueAtTime(rain ? 0.45 : 0.55, AC.currentTime + 1.5);
    src.connect(f);
    f.connect(g);
    g.connect(AC.destination);
    src.start();
    noiseNode = { src, g };
  } catch (e) {}
}
function stopNoise() {
  if (!noiseNode) return;
  try {
    const { src, g } = noiseNode,
      t = AC.currentTime;
    g.gain.cancelScheduledValues(t);
    g.gain.setValueAtTime(g.gain.value, t);
    g.gain.linearRampToValueAtTime(0, t + 0.4);
    src.stop(t + 0.5);
  } catch (e) {}
  noiseNode = null;
}
function chime() {
  if (S.sound === false || !AC) return;
  try {
    const t0 = AC.currentTime;
    [
      [784, 0],
      [988, 0.18],
      [1175, 0.36]
    ].forEach(([fq, off]) => {
      const o = AC.createOscillator(),
        g = AC.createGain();
      o.type = 'triangle';
      o.frequency.value = fq;
      g.gain.setValueAtTime(0, t0 + off);
      g.gain.linearRampToValueAtTime(0.25, t0 + off + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + off + 0.9);
      o.connect(g);
      g.connect(AC.destination);
      o.start(t0 + off);
      o.stop(t0 + off + 1);
    });
  } catch (e) {}
}
async function keepAwake() {
  try {
    if ('wakeLock' in navigator && !wakeLk) {
      wakeLk = await navigator.wakeLock.request('screen');
      wakeLk.addEventListener('release', () => {
        wakeLk = null;
      });
    }
  } catch (e) {}
}
function releaseWake() {
  try {
    if (wakeLk) wakeLk.release();
  } catch (e) {}
  wakeLk = null;
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible') return;
  pomoTick();
  if (focusing()) {
    keepAwake();
    if (noiseNode && AC) AC.resume().catch(() => {});
  }
});

/* ===== src/08-gym.js ===== */
/* ---------- 🏋️ Gym & Vận động ---------- */
const EX0 = self.CozyExercises || [];
const GG = [
  ['chest', 'Ngực'],
  ['back', 'Lưng'],
  ['shoulders', 'Vai'],
  ['biceps', 'Tay trước'],
  ['triceps', 'Tay sau'],
  ['quads', 'Đùi trước'],
  ['hams', 'Đùi sau & Mông'],
  ['calves', 'Bắp chân'],
  ['core', 'Bụng & Core'],
  ['stretch', 'Giãn cơ']
];
const gName = g => (GG.find(x => x[0] === g) || ['', g])[1];
const EQ = [
  ['gym', '🏋️ Phòng gym đầy đủ'],
  ['db', '🔩 Tạ đơn tại nhà'],
  ['body', '🙆 Chỉ trọng lượng cơ thể']
];
const eqIcon = e => (e === 'gym' ? '🏋️' : e === 'db' ? '🔩' : '🙆');
const GBH = {
  chest: ['chest'],
  back: ['upper-back', 'lower-back'],
  shoulders: ['front-deltoids', 'back-deltoids'],
  biceps: ['biceps'],
  triceps: ['triceps'],
  quads: ['quadriceps'],
  hams: ['hamstring', 'gluteal'],
  calves: ['calves'],
  core: ['abs', 'obliques'],
  stretch: []
};
const thumb = e =>
  e && e.img
    ? `<img class="exthumb" src="${e.img[e.img.length - 1]}" alt="" loading="lazy" decoding="async">`
    : `<span class="exthumb none">${e ? eqIcon(e.eq) : ''}</span>`;
function drawBody(e) {
  if (!window.CozyBody || !e) return;
  const pm = e.pm && e.pm.length ? e.pm : GBH[e.g] || [],
    sm = e.sm || [];
  const data = [
    { name: 'chính', muscles: pm },
    { name: 'chính ', muscles: pm },
    { name: 'phụ', muscles: sm }
  ];
  ['anterior', 'posterior'].forEach(t => {
    const el = document.getElementById('body-' + t);
    if (!el) return;
    el.innerHTML = '';
    try {
      window.CozyBody({
        container: el,
        data,
        type: t,
        bodyColor: '#DCD3CB',
        highlightedColors: ['#FFBFB0', '#EE6A64'],
        svgStyle: { width: '100%', height: 'auto' }
      });
    } catch (err) {}
  });
}
window.addEventListener('cozybody', () => {
  const id = document.getElementById('sheet').dataset.ex;
  if (id && $('#sheetbg').classList.contains('on')) drawBody(exById(id));
});
const GOALS = [
  ['muscle', '💪 Tăng cơ', '8–12'],
  ['fat', '🔥 Giảm mỡ', '12–15'],
  ['endurance', '🏃 Sức bền', '15–20'],
  ['fit', '🌷 Giữ dáng', '10–12']
];
const WD = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
  WDORDER = [1, 2, 3, 4, 5, 6, 0];
const SPLITS = {
  fullA: ['Full Body A', ['quads', 'chest', 'back', 'core']],
  fullB: ['Full Body B', ['hams', 'shoulders', 'back', 'triceps', 'biceps']],
  push: ['Đẩy', ['chest', 'shoulders', 'triceps']],
  pull: ['Kéo', ['back', 'biceps', 'core']],
  legs: ['Chân', ['quads', 'hams', 'calves']],
  upper: ['Thân trên', ['chest', 'back', 'shoulders', 'biceps', 'triceps']],
  lower: ['Thân dưới', ['quads', 'hams', 'calves', 'core']]
};
const allEx = () => EX0.concat(S.customEx || []);
const exById = id => allEx().find(e => e.id === id);
const eqOK = e => S.gym.equip === 'gym' || e.eq === 'body' || (S.gym.equip === 'db' && e.eq === 'db');
function splitPlan() {
  const n = S.gym.days.length;
  const p =
    n <= 1
      ? ['fullA']
      : n === 2
        ? ['fullA', 'fullB']
        : n === 3
          ? ['push', 'pull', 'legs']
          : n === 4
            ? ['upper', 'lower', 'upper', 'lower']
            : n === 5
              ? ['push', 'pull', 'legs', 'upper', 'lower']
              : ['push', 'pull', 'legs', 'push', 'pull', 'legs', 'fullA'];
  const days = WDORDER.filter(d => S.gym.days.includes(d));
  return days.map((d, i) => ({ wd: d, key: p[i] }));
}
function planFor(date) {
  const wd = date.getDay(),
    x = splitPlan().find(p => p.wd === wd);
  return x ? x.key : null;
}
const doneWos = () => S.workouts.filter(w => w.end).sort((a, b) => b.start.localeCompare(a.start));
const activeWo = () => S.workouts.find(w => !w.end) || null;
function lastTrained(g) {
  for (const w of doneWos()) {
    if (
      w.items.some(it => {
        const e = exById(it.ex);
        return e && e.g === g && it.sets.some(s => s.done);
      })
    )
      return new Date(w.end || w.start);
  }
  return null;
}
function recovery(g) {
  const c = today().checkin;
  if (c && c.body === 'sore' && (c.sore || []).includes(g)) return { s: 'rest', txt: 'đang đau 🤕' };
  const t = lastTrained(g);
  if (!t) return { s: 'long', txt: 'chưa tập' };
  const h = (Date.now() - t) / 36e5;
  if (h < 48) return { s: 'rest', txt: h < 24 ? 'vừa tập hôm nay' : 'tập hôm qua' };
  if (h > 24 * 7) return { s: 'long', txt: Math.floor(h / 24) + ' ngày chưa tập' };
  return { s: 'ready', txt: 'đã hồi phục' };
}
const REC = { rest: ['🍑', 'nên nghỉ'], ready: ['🍵', 'sẵn sàng'], long: ['💜', 'ưu tiên'] };
function lastSetsOf(exId) {
  for (const w of doneWos()) {
    const it = w.items.find(i => i.ex === exId && i.sets.some(s => s.done));
    if (it) return it.sets.filter(s => s.done);
  }
  return null;
}
function prOf(exId, excludeId) {
  let m = 0;
  S.workouts.forEach(w => {
    if (!w.end || w.id === excludeId) return;
    w.items.forEach(it => {
      if (it.ex === exId)
        it.sets.forEach(s => {
          if (s.done && +s.kg > m) m = +s.kg;
        });
    });
  });
  return m;
}
function pickEx(g, n) {
  const L = allEx().filter(e => e.g === g && eqOK(e));
  const used = new Set();
  doneWos()
    .slice(0, 20)
    .forEach(w =>
      w.items.forEach(it => {
        const e = exById(it.ex);
        if (e && e.g === g && eqOK(e)) used.add(e.id);
      })
    );
  const pref = L.filter(e => used.has(e.id)).concat(L.filter(e => !used.has(e.id)));
  return pref.slice(0, n);
}
/* Gợi ý buổi tập hôm nay */
function suggest() {
  const now = new Date(),
    key = planFor(now),
    c = today().checkin || {},
    goal = GOALS.find(x => x[0] === S.gym.goal) || GOALS[0];
  const last = S.sleeps[S.sleeps.length - 1],
    slept =
      last && !last.sample && Date.now() - new Date(last.wake) < 18 * 36e5
        ? (new Date(last.wake) - new Date(last.bed)) / 36e5
        : null;
  const notes = [];
  let mode = 'normal';
  const sore = c.body === 'sore' ? c.sore || [] : [];
  if (today().lazy && c.body !== 'sick') {
    mode = 'rest';
    notes.push('🛋️ Ngày Lười Biếng: thay buổi tập bằng giãn cơ nhẹ nhàng 10 phút nhé.');
  } else if (c.body === 'sick') {
    mode = 'rest';
    notes.push('🤒 Hôm nay bạn đang ốm: nghỉ ngơi là chính. Nếu thấy ổn, đi bộ nhẹ 15–20 phút hoặc giãn cơ 10 phút.');
  } else if (c.energy && c.energy <= 2) {
    mode = 'light';
    notes.push('🔋 Năng lượng thấp: buổi nhẹ hơn (bớt 1 set), hoặc đổi sang giãn cơ 10 phút.');
  }
  if (mode !== 'rest' && slept !== null && slept < 6) {
    mode = 'light';
    notes.push('😴 Đêm qua ngủ khoảng ' + slept.toFixed(1) + ' tiếng: tập nhẹ thôi nhé.');
  }
  if (mode !== 'rest' && c.body === 'sore') {
    if (mode === 'normal') mode = 'light';
    notes.push(
      sore.length
        ? '🤕 Đang đau ' + sore.map(gName).join(', ') + ': tạm tránh nhóm này, thêm giãn cơ cuối buổi.'
        : '🦵 Đang đau nhức cơ: tránh nhóm cơ đang đau, thêm giãn cơ cuối buổi.'
    );
  }
  if (mode !== 'rest' && c.body === 'tired' && mode === 'normal') {
    mode = 'light';
    notes.push('🫠 Hơi mệt: giảm tạ một chút cũng được.');
  }
  let groups = [],
    title,
    skipped = [];
  if (mode === 'rest') {
    groups = ['stretch'];
    title = today().lazy ? 'Giãn cơ 10 phút' : 'Nghỉ / giãn cơ nhẹ';
  } else if (key) {
    const [lb, gs] = SPLITS[key];
    title = lb;
    groups = gs.filter(g => {
      if (sore.includes(g)) return false;
      const r = recovery(g);
      if (r.s === 'rest') {
        skipped.push(g);
        return false;
      }
      return true;
    });
    if (skipped.length) notes.push('🍑 ' + skipped.map(gName).join(', ') + ' vừa tập trong 48 giờ qua nên để nghỉ.');
    if (!groups.length) {
      groups = GG.slice(0, 9)
        .map(x => x[0])
        .filter(g => recovery(g).s === 'long' && !sore.includes(g))
        .slice(0, 3);
      notes.push('💜 Gợi ý thay bằng nhóm lâu chưa tập.');
    }
  } else {
    title = null;
    groups = GG.slice(0, 9)
      .map(x => x[0])
      .filter(g => recovery(g).s !== 'rest' && !sore.includes(g))
      .sort((a, b) => ({ long: 0, ready: 1 })[recovery(a).s] - { long: 0, ready: 1 }[recovery(b).s])
      .slice(0, 3);
  }
  if (c.body === 'sore' && mode !== 'rest' && !groups.includes('stretch')) groups = groups.concat('stretch');
  const sets = mode === 'light' ? 2 : 3,
    per = groups.filter(g => g !== 'stretch').length <= 3 ? 2 : 1;
  const items = [];
  groups.forEach(g =>
    pickEx(g, g === 'stretch' ? 3 : g === 'core' ? 1 : per).forEach(e =>
      items.push({ ex: e.id, sets: g === 'stretch' ? 1 : sets, reps: g === 'stretch' ? '30 giây' : goal[2] })
    )
  );
  return { key, title, mode, notes, groups, items, training: !!key };
}

let restEnd = 0,
  gymView = 'main';
function startWorkout(sg, groupsOverride) {
  if (activeWo()) return;
  const goal = GOALS.find(x => x[0] === S.gym.goal) || GOALS[0];
  let items = sg.items;
  if (groupsOverride) {
    items = [];
    groupsOverride.forEach(g =>
      pickEx(g, g === 'stretch' ? 3 : 2).forEach(e =>
        items.push({ ex: e.id, sets: sg.mode === 'light' ? 2 : 3, reps: g === 'stretch' ? '30 giây' : goal[2] })
      )
    );
  }
  const w = {
    id: uid(),
    date: dk(new Date()),
    start: new Date().toISOString(),
    end: null,
    label: groupsOverride ? groupsOverride.map(gName).join(' · ') : sg.title || sg.groups.map(gName).join(' · '),
    items: items.map(it => {
      const prev = lastSetsOf(it.ex),
        n = it.sets,
        dr = parseInt(it.reps) || 10;
      return {
        ex: it.ex,
        target: it.reps,
        sets: Array.from({ length: n }, (_, i) => {
          const p = prev && prev[Math.min(i, prev.length - 1)];
          return {
            r: p ? p.r : (exById(it.ex) || {}).g === 'stretch' ? 30 : dr,
            kg: p ? p.kg : '',
            f: '',
            done: false
          };
        })
      };
    })
  };
  S.workouts.push(w);
  hideNudge();
  render();
  wander();
  scrollTo({ top: 0, behavior: 'smooth' });
  say('Khởi động nhẹ 5 phút rồi mình bắt đầu nha 💪', 4000);
}
function finishWorkout() {
  const w = activeWo();
  if (!w) return;
  const doneSets = w.items.reduce((a, it) => a + it.sets.filter(s => s.done).length, 0);
  if (!doneSets) {
    openSheet(
      `<h2>Chưa có set nào xong</h2><p class="muted">Bạn chưa đánh dấu ✓ set nào. Hủy buổi tập này nhé?</p><div class="row" style="margin-top:12px"><button class="btn" data-a="woCancelOk">Hủy buổi tập</button><button class="btn ghost" data-a="closeSheet">Tập tiếp</button></div>`
    );
    return;
  }
  w.items = w.items.filter(it => it.sets.some(s => s.done)).map(it => ((it.sets = it.sets.filter(s => s.done)), it));
  w.end = new Date().toISOString();
  restEnd = 0;
  const prs = [];
  w.items.forEach(it => {
    const mx = Math.max(0, ...it.sets.map(s => +s.kg || 0)),
      old = prOf(it.ex, w.id);
    if (mx > 0 && mx > old && old > 0) prs.push([it.ex, mx, old]);
  });
  w.prs = prs.map(p => p[0]);
  const vol = w.items.reduce((a, it) => a + it.sets.reduce((b, s) => b + (+s.r || 0) * (+s.kg || 0), 0), 0),
    mins = Math.round((new Date(w.end) - new Date(w.start)) / 6e4);
  render();
  wander();
  celebrate(prs.length ? 2 : 1);
  startAct('dance');
  say(
    prs.length ? 'Kỷ lục mới! ' + S.name + ' mạnh quá trời 🏆' : 'Xong buổi tập rồi! Giỏi lắm ' + S.name + ' 🎉',
    6000
  );
  openSheet(`<h2>🎉 Hoàn thành buổi tập!</h2><div class="stat3" style="margin-top:12px"><div><b>${mins}′</b>Thời gian</div><div><b>${doneSets}</b>Set</div><div><b>${vol >= 1000 ? (vol / 1000).toFixed(1) + 't' : vol + 'kg'}</b>Tổng khối lượng</div></div>
  ${prs.length ? `<div class="okline"><span>🏆</span><span><b>Kỷ lục mới:</b> ${prs.map(([id, m, o]) => esc((exById(id) || {}).n || id) + ' ' + m + 'kg (trước ' + o + 'kg)').join(', ')}</span></div>` : ''}
  ${w.items.map(it => `<p style="margin:6px 0"><b>${esc((exById(it.ex) || {}).n || it.ex)}</b><br><span class="muted">${it.sets.map(s => s.r + (s.kg ? '×' + s.kg + 'kg' : '')).join(' · ')}</span></p>`).join('')}
  <button class="btn full" style="margin-top:14px" data-a="closeSheet">Tuyệt vời ✨</button>`);
}
function celebrate(power) {
  try {
    if (!window.confetti || calm()) return;
    const o = {
      disableForReducedMotion: true,
      zIndex: 40,
      colors: ['#FF9E9E', '#A8E6CF', '#DED2F9', '#FFE9A8', '#FFC8A8']
    };
    confetti(Object.assign({ particleCount: 90 * power, spread: 80, origin: { y: 0.7 } }, o));
    if (power > 1)
      (setTimeout(
        () => confetti(Object.assign({ particleCount: 60, angle: 60, spread: 60, origin: { x: 0, y: 0.8 } }, o)),
        250
      ),
        setTimeout(
          () => confetti(Object.assign({ particleCount: 60, angle: 120, spread: 60, origin: { x: 1, y: 0.8 } }, o)),
          400
        ));
  } catch (e) {}
}
function restTick() {
  if (!restEnd) return;
  const left = Math.max(0, Math.ceil((restEnd - Date.now()) / 1000)),
    el = $('#restT');
  if (el) el.textContent = mmss(left);
  if (left <= 0) {
    restEnd = 0;
    chime();
    if (navigator.vibrate) navigator.vibrate(200);
    say('Hết giờ nghỉ, set tiếp nào! 💪', 3000);
    if (tab === 'health') render();
  }
}
function woCard(w) {
  const mins = Math.round((Date.now() - new Date(w.start)) / 6e4);
  return `<div class="card wo"><h2>🏋️ Đang tập: ${esc(w.label)} <small>${mins} phút</small></h2>
  ${restEnd ? `<div class="okline restbar"><span>⏱️</span><span>Nghỉ giữa set: <b id="restT">${mmss(Math.max(0, Math.ceil((restEnd - Date.now()) / 1000)))}</b></span><button class="chip sm" data-a="restPlus">+30s</button><button class="chip sm" data-a="restSkip">Bỏ qua</button></div>` : ''}
  ${w.items
    .map((it, ii) => {
      const e = exById(it.ex) || { n: it.ex, g: '' },
        prev = lastSetsOf(it.ex),
        pr = prOf(it.ex, w.id),
        st = e.g === 'stretch';
      return `<div class="woex"><div class="woh"><button class="thumbbtn" data-exinfo="${esc(it.ex)}" aria-label="Xem hình ${esc(e.n)}">${thumb(e)}</button><button class="tmain" data-exinfo="${esc(it.ex)}"><span class="tt">${esc(e.n)}</span><span class="tmeta"><i>${gName(e.g)}</i><i>Mục tiêu ${esc(it.target || '')}${st ? '' : ' lần'}</i>${prev ? `<i>Lần trước: ${prev.map(s => s.r + (s.kg ? '×' + s.kg : '')).join(', ')}</i>` : ''}${pr ? `<i>🏆 ${pr}kg</i>` : ''}</span></button><button class="xbtn" data-wodel="${ii}" aria-label="Bỏ bài này">✕</button></div>
   ${it.sets
     .map(
       (
         s,
         si
       ) => `<div class="setrow ${s.done ? 'done' : ''}"><span class="sn">${si + 1}</span><input class="inp sm" type="number" inputmode="numeric" min="0" max="999" data-wr="${ii}:${si}" value="${s.r}" aria-label="Số ${st ? 'giây' : 'lần'}"><span class="u">${st ? 'giây' : 'lần'}</span>${st ? '' : `<input class="inp sm" type="number" inputmode="decimal" min="0" max="999" step="0.5" data-wk="${ii}:${si}" value="${s.kg}" placeholder="–" aria-label="Kg"><span class="u">kg</span>`}
   ${
     st
       ? ''
       : `<span class="feel">${[
           ['e', 'Dễ'],
           ['m', 'Vừa'],
           ['h', 'Nặng']
         ]
           .map(
             ([k, n]) => `<button class="fchip" data-wf="${ii}:${si}:${k}" aria-pressed="${s.f === k}">${n}</button>`
           )
           .join('')}</span>`
   }<button class="sdone" data-wd="${ii}:${si}" aria-pressed="${s.done}" aria-label="Xong set ${si + 1}">✓</button></div>`
     )
     .join('')}
   <button class="chip sm" data-woadd="${ii}" style="margin-top:6px">＋ Thêm set</button></div>`;
    })
    .join('')}
  <div class="row" style="margin-top:14px"><button class="btn ghost" data-a="exPick">＋ Thêm bài</button></div>
  <div class="row" style="margin-top:10px"><button class="btn" data-a="woFinish">✅ Hoàn thành buổi tập</button><button class="btn ghost danger" data-a="woCancel">Hủy buổi</button></div></div>`;
}
function gymSetupCard(first) {
  const g = S.gym,
    plan = splitPlan();
  return `<div class="card"><h2>📅 Lịch tập ${first ? '' : '<small>' + g.days.length + ' buổi/tuần</small>'}</h2>${first ? '<p class="muted" style="margin:0 0 6px">Chọn ngày bạn muốn tập, app sẽ tự chia nhóm cơ cho từng buổi.</p>' : ''}
  <div class="q" style="margin-top:6px"><h3>Ngày tập</h3><div class="row">${WDORDER.map(d => `<button class="chip sm wdchip" data-gday="${d}" aria-pressed="${g.days.includes(d)}">${WD[d]}</button>`).join('')}</div></div>
  <div class="q"><h3>Giờ tập</h3><input class="inp" type="time" id="gTime" value="${g.time}" style="max-width:160px"></div>
  <div class="q"><h3>Mục tiêu</h3><div class="row">${GOALS.map(([k, n]) => `<button class="chip sm" data-ggoal="${k}" aria-pressed="${g.goal === k}">${n}</button>`).join('')}</div></div>
  <div class="q"><h3>Dụng cụ có sẵn</h3><div class="row">${EQ.map(([k, n]) => `<button class="chip sm" data-geq="${k}" aria-pressed="${g.equip === k}">${n}</button>`).join('')}</div></div>
  <div class="q"><h3>Nghỉ giữa set</h3><div class="row">${[60, 90, 120].map(n => `<button class="chip sm" data-grest="${n}" aria-pressed="${g.rest === n}">${n} giây</button>`).join('')}</div></div>
  ${
    plan.length
      ? `<div class="q"><h3>Lịch chia nhóm cơ</h3>${plan.map(p => `<div class="planrow"><b>${WD[p.wd]}</b><span>${SPLITS[p.key][0]}</span><span class="muted">${SPLITS[p.key][1].map(gName).join(' · ')}</span></div>`).join('')}<p class="muted" style="margin:6px 0 0">Mỗi nhóm cơ nên tập khoảng 2 lần/tuần, nghỉ ít nhất 48 giờ trước khi tập lại nhóm cơ lớn.</p></div>
  <div class="q"><h3>🔔 Nhắc lịch tập</h3>${gymRemindHtml()}</div>`
      : ''
  }</div>`;
}
function gymBellAt() {
  const [h, m] = S.gym.time.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  d.setMinutes(d.getMinutes() - 30);
  return hm(d);
}
function gymRemindHtml() {
  const g = S.gym,
    L = g.remind;
  let h = `<div class="row">${LV.map(([k, i, n]) => `<button class="chip sm" data-grem="${k}" aria-pressed="${L === k}">${i} ${n}</button>`).join('')}</div>`;
  const days = WDORDER.filter(d => g.days.includes(d))
    .map(d => WD[d])
    .join(', ');
  if (L === 'none') return h;
  if (L === 'chibi')
    return h + `<p class="muted" style="margin:8px 0 0">Ngày tập, khi bạn mở app trước giờ tập, Chibi sẽ nhắc.</p>`;
  h += `<div class="okline ${g.bell ? '' : 'warn'}" style="margin:10px 0 0"><span>${g.bell ? '🔔' : '🔕'}</span><span>${g.bell ? (L === 'cal' ? 'Đã thêm vào Lịch' : 'Đã đặt báo thức') + ': ' : 'Chưa có chuông: '}${days} lúc ${gymBellAt()} (trước giờ tập 30 phút)</span></div>`;
  if (g.oldBell)
    h += `<p class="muted" style="margin:6px 0 0">⚠️ Lịch tập vừa đổi. Nhớ xóa ${L === 'alarm' ? 'báo thức' : 'sự kiện'} cũ trên iPhone rồi đặt lại nhé.</p>`;
  h += g.bell
    ? `<div class="row" style="margin-top:8px"><button class="chip sm" data-gbell="set">${L === 'cal' ? '📅 Thêm lại vào Lịch' : '⏰ Xem lại cách đặt'}</button><button class="chip sm" data-gbell="unset">Đánh dấu chưa có chuông</button></div>`
    : `<div class="row" style="margin-top:8px"><button class="btn" data-gbell="set">✅ Đặt giúp tôi</button><button class="btn ghost" data-gbell="done">👌 Tôi đặt rồi</button></div>`;
  return h;
}
const ICSDAY = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
function gymIcs() {
  const g = S.gym,
    [h, m] = g.time.split(':').map(Number),
    s = new Date();
  s.setHours(h, m, 0, 0);
  for (let i = 0; i < 8; i++) {
    if (g.days.includes(s.getDay()) && s > new Date()) break;
    s.setDate(s.getDate() + 1);
    s.setHours(h, m, 0, 0);
  }
  return buildIcs({
    uid: 'cozy-gym',
    title: '🏋️ Giờ tập – Cozy Life',
    start: s,
    durMin: 60,
    rrule:
      'FREQ=WEEKLY;BYDAY=' +
      WDORDER.filter(d => g.days.includes(d))
        .map(d => ICSDAY[d])
        .join(','),
    trigger: '-PT30M',
    desc: 'Mở Cozy Life xem gợi ý buổi tập hôm nay nhé 💪'
  });
}
function gymBellChanged() {
  if (S.gym.bell) {
    S.gym.bell = false;
    S.gym.oldBell = true;
  }
}
function viewGym() {
  const g = S.gym;
  if (!g.days.length && !activeWo())
    return (
      gymSetupCard(true) +
      gymHistoryCard() +
      `<div class="card"><h2>📚 Thư viện bài tập</h2><p class="muted" style="margin:0 0 10px">${allEx().length} bài, có mô tả và lưu ý tư thế tiếng Việt.</p><button class="btn ghost" data-a="exLib">Mở thư viện</button></div>`
    );
  const w = activeWo();
  let h = '';
  if (w) h += woCard(w);
  else {
    const sg = suggest(),
      now = new Date();
    h += `<div class="card"><h2>${sg.training ? '💪 Hôm nay: ' + esc(sg.title) : sg.mode === 'rest' ? '🌿 ' + esc(sg.title) : '🌿 Hôm nay là ngày nghỉ'} <small>${sg.training ? g.time : ''}</small></h2>
    ${sg.notes.map(n => `<div class="tip">${n}</div>`).join('')}
    ${!sg.training && sg.mode !== 'rest' ? `<p class="muted" style="margin:8px 0">Muốn vận động thêm? Gợi ý nhóm cơ đã hồi phục / lâu chưa tập:</p>` : ''}
    <div class="recrow">${(sg.groups.length ? sg.groups : [])
      .map(x => {
        const r = x === 'stretch' ? { s: 'ready', txt: 'phục hồi' } : recovery(x);
        return `<span class="rec ${r.s}">${REC[r.s][0]} ${gName(x)} <i>${r.txt}</i></span>`;
      })
      .join('')}</div>
    ${
      sg.items.length
        ? `<div class="sglist">${sg.items
            .map(it => {
              const e = exById(it.ex),
                p = lastSetsOf(it.ex);
              return `<button class="sgrow" data-exinfo="${esc(it.ex)}">${thumb(e)}<span class="grow"><b>${esc(e.n)}</b><i>${gName(e.g)} · ${eqIcon(e.eq)}</i></span><span class="muted">${it.sets}×${esc(it.reps)}${p && p[0].kg ? ' · ' + p[0].kg + 'kg' : ''}</span></button>`;
            })
            .join('')}</div>`
        : '<p class="muted">Chưa có bài phù hợp, thử đổi dụng cụ trong Lịch tập.</p>'
    }
    <div class="row" style="margin-top:12px"><button class="btn" data-a="woStart">▶️ ${sg.mode === 'rest' ? 'Bắt đầu giãn cơ' : 'Bắt đầu buổi tập'}</button><button class="btn ghost" data-a="woPickGroups">Tập nhóm khác</button></div>
    <p class="muted" style="margin:10px 0 0">Gợi ý chỉ để tham khảo, bạn luôn có thể tự chọn lại.</p></div>`;
    h += `<div class="card"><h2>🧭 Hồi phục từng nhóm cơ</h2><div class="recrow">${GG.slice(0, 9)
      .map(([k]) => {
        const r = recovery(k);
        return `<span class="rec ${r.s}">${REC[r.s][0]} ${gName(k)} <i>${r.txt}</i></span>`;
      })
      .join(
        ''
      )}</div><p class="muted" style="margin:8px 0 0">🍑 vừa tập (&lt; 48 giờ) – nên nghỉ · 🍵 đã hồi phục · 💜 hơn 7 ngày chưa tập – ưu tiên</p></div>`;
  }
  h += gymHistoryCard();
  h += `<div class="card"><h2>📚 Thư viện bài tập <small>${allEx().length} bài</small></h2><div class="row"><button class="btn ghost" data-a="exLib">Mở thư viện</button><button class="btn ghost" data-a="exNew">＋ Bài tự tạo</button></div></div>`;
  h += gymSetupCard(false);
  return h;
}
function gymHistoryCard() {
  const L = doneWos();
  if (!L.length) return '';
  const wk = new Date();
  wk.setDate(wk.getDate() - ((wk.getDay() + 6) % 7));
  wk.setHours(0, 0, 0, 0);
  const nWeek = L.filter(w => new Date(w.start) >= wk).length;
  return `<div class="card"><h2>📈 Đã tập <small>Tuần này: ${nWeek}/${S.gym.days.length || '–'} buổi</small></h2>${L.slice(
    0,
    6
  )
    .map(w => {
      const d = new Date(w.start),
        n = w.items.reduce((a, it) => a + it.sets.length, 0),
        mins = Math.round((new Date(w.end) - d) / 6e4);
      return `<button class="sgrow" data-wohist="${w.id}"><span><b>${WD[d.getDay()]} ${pad(d.getDate())}/${pad(d.getMonth() + 1)} · ${esc(w.label)}</b><i>${n} set · ${mins} phút${(w.prs || []).length ? ' · 🏆 kỷ lục' : ''}</i></span><span class="muted">›</span></button>`;
    })
    .join('')}</div>`;
}
/* Thư viện bài tập */
let lib = { g: 'all', q: '', mine: true, pick: false };
const fold = s =>
  String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
function libListHtml() {
  const q = fold(lib.q.trim());
  const L = allEx().filter(
    e =>
      (lib.g === 'all' || e.g === lib.g) &&
      (!lib.mine || eqOK(e)) &&
      (!q || fold(e.n + ' ' + e.en + ' ' + gName(e.g)).includes(q))
  );
  return (
    L.map(
      e =>
        `<button class="sgrow" data-${lib.pick ? 'expick' : 'exinfo'}="${esc(e.id)}">${thumb(e)}<span class="grow"><b>${esc(e.n)}</b><i>${gName(e.g)} · ${eqIcon(e.eq)}${e.custom ? ' · tự tạo' : ''}</i></span><span class="muted">${lib.pick ? '＋' : '›'}</span></button>`
    ).join('') || '<p class="muted">Không tìm thấy bài nào.</p>'
  );
}
function libSheet(pick) {
  if (pick !== undefined) lib.pick = pick;
  openSheet(`<h2>📚 ${lib.pick ? 'Chọn bài để thêm' : 'Thư viện bài tập'}</h2>
  <input class="inp" id="libQ" placeholder="Tìm bài… (vd: squat, vai)" value="${esc(lib.q)}" style="margin-top:10px" autocomplete="off">
  <div class="wtabs" style="margin-top:10px">${[['all', 'Tất cả']]
    .concat(GG)
    .map(([k, n]) => `<button data-libg="${k}" aria-pressed="${lib.g === k}">${n}</button>`)
    .join('')}</div>
  <div class="row"><button class="chip sm" data-a="libMine" aria-pressed="${lib.mine}">Chỉ bài hợp dụng cụ của tôi</button></div>
  <div id="libList" style="margin-top:8px">${libListHtml()}</div>
  ${lib.pick ? '' : '<button class="btn ghost" style="margin-top:12px" data-a="exNew">＋ Thêm bài tự tạo</button>'}`);
}
function exInfo(id) {
  const e = exById(id);
  if (!e) return;
  const pr = prOf(id),
    p = lastSetsOf(id),
    w = activeWo();
  openSheet(`<h2>${esc(e.n)}</h2><p class="muted" style="margin:2px 0 10px">${esc(e.en || '')} · ${gName(e.g)} · ${eqIcon(e.eq)} ${(EQ.find(x => x[0] === e.eq) || ['', ''])[1].replace(/^\S+ /, '')}</p>
  ${e.img ? `<div class="eximgs">${e.img.map(u => `<img src="${u}" alt="Tư thế ${esc(e.n)}" decoding="async">`).join('')}</div><p class="muted cap">${e.img.length > 1 ? 'Hai tư thế của động tác' : 'Tư thế của động tác'}${e.imgv ? ' · hình biến thể gần giống, xem lưu ý bên dưới' : ''} · hình: Everkinetic</p>` : ''}
  <div class="bodymap"><div><div id="body-anterior"></div><span>Mặt trước</span></div><div><div id="body-posterior"></div><span>Mặt sau</span></div></div>
  <p class="muted cap"><i class="lg main"></i> Cơ chính <i class="lg sec"></i> Cơ phụ</p>
  ${e.d ? `<p>${esc(e.d)}</p>` : ''}${e.tip ? `<div class="tip">💡 ${esc(e.tip)}</div>` : ''}
  ${e.sec && e.sec.length ? `<p class="muted" style="margin:10px 0 0">Nhóm cơ phụ: ${e.sec.map(gName).join(', ')}</p>` : ''}
  ${pr || p ? `<div class="okline" style="margin-top:10px"><span>📈</span><span>${pr ? 'Kỷ lục: <b>' + pr + 'kg</b>. ' : ''}${p ? 'Lần trước: ' + p.map(s => s.r + (s.kg ? '×' + s.kg + 'kg' : '')).join(', ') : ''}</span></div>` : ''}
  ${e.en ? `<a class="btn ghost full" style="margin-top:12px;justify-content:center" href="https://www.youtube.com/results?search_query=${encodeURIComponent(e.en + ' exercise proper form')}" target="_blank" rel="noopener noreferrer">▶️ Xem video hướng dẫn (YouTube)</a>` : ''}
  <div class="row" style="margin-top:10px">${w && !w.items.some(it => it.ex === id) ? `<button class="btn" data-expick="${esc(id)}">＋ Thêm vào buổi tập</button>` : ''}${e.custom ? `<button class="btn ghost danger" data-exdel="${esc(id)}">Xóa bài tự tạo</button>` : ''}<button class="btn ghost" data-a="closeSheet">Đóng</button></div>`);
  $('#sheet').dataset.ex = id;
  drawBody(e);
}
function exNewSheet() {
  F = { g: 'chest', eq: S.gym.equip === 'gym' ? 'gym' : S.gym.equip };
  openSheet(`<h2>＋ Bài tự tạo</h2><div class="q"><input class="inp" id="exN" maxlength="60" placeholder="Tên bài, vd: Kéo dây kháng lực"></div>
  <div class="q"><h3>Nhóm cơ chính</h3><div class="row">${GG.map(([k, n]) => `<button class="chip sm" data-f="g" data-v="${k}" aria-pressed="${F.g === k}">${n}</button>`).join('')}</div></div>
  <div class="q"><h3>Dụng cụ</h3><div class="row">${EQ.map(([k, n]) => `<button class="chip sm" data-f="eq" data-v="${k}" aria-pressed="${F.eq === k}">${n}</button>`).join('')}</div></div>
  <div class="q"><h3>Ghi chú tư thế (không bắt buộc)</h3><input class="inp" id="exTip" maxlength="160"></div>
  <button class="btn full" style="margin-top:16px" data-a="exSave">Lưu bài</button>`);
}
function groupPickSheet() {
  F = { gs: [] };
  openSheet(`<h2>Chọn nhóm cơ hôm nay</h2><p class="muted" style="margin:0 0 8px">Chọn 1–4 nhóm, app sẽ chọn bài phù hợp dụng cụ của bạn.</p>
  <div class="row">${GG.map(([k, n]) => {
    const r = k === 'stretch' ? null : recovery(k);
    return `<button class="chip sm" data-gpick="${k}" aria-pressed="false">${r ? REC[r.s][0] + ' ' : ''}${n}</button>`;
  }).join('')}</div>
  <button class="btn full" style="margin-top:16px" data-a="woStartPicked">▶️ Bắt đầu</button>`);
}
function woHistSheet(id) {
  const w = S.workouts.find(x => x.id === id);
  if (!w) return;
  const d = new Date(w.start);
  openSheet(`<h2>${WD[d.getDay()]} ${pad(d.getDate())}/${pad(d.getMonth() + 1)} · ${esc(w.label)}</h2><p class="muted">${hm(d)}–${hm(new Date(w.end))}</p>
  ${w.items.map(it => `<p style="margin:8px 0"><b>${esc((exById(it.ex) || {}).n || it.ex)}</b>${(w.prs || []).includes(it.ex) ? ' 🏆' : ''}<br><span class="muted">${it.sets.map(s => s.r + (s.kg ? '×' + s.kg + 'kg' : '') + (s.f ? ' (' + { e: 'dễ', m: 'vừa', h: 'nặng' }[s.f] + ')' : '')).join(' · ')}</span></p>`).join('')}
  <div class="row" style="margin-top:14px"><button class="btn ghost" data-a="closeSheet">Đóng</button><button class="btn ghost danger" data-wohdel="${w.id}">Xóa buổi này</button></div>`);
}
const dnd = () => focusing() || !!activeWo();

/* ===== src/09-habits-schedule-notes.js ===== */
/* ---------- 🌱 Thói quen ---------- */
const HICONS = ['📖', '🧘', '🏃', '🥗', '🧴', '✍️', '🎹', '🌿', '💊', '🦷', '🙏', '📵', '🚶', '🍎', '☀️', '🛏️'];
const HDEF = () => DEF().habits;
const HAUTO = {
  water: 'Tự tick khi uống đủ nước',
  gym: 'Tự tick khi hoàn thành buổi tập',
  sleep: 'Tự tick khi bấm "Đi ngủ" trước giờ mục tiêu'
};
function habitDone(h, k) {
  const d = S.days[k];
  if (!d) return false;
  if ((d.hb || {})[h.id]) return true;
  if (h.auto === 'water') {
    const w = dayWater(k);
    return w.n > 0 && w.n >= w.goal;
  }
  if (h.auto === 'gym') return S.workouts.some(w => w.end && w.date === k);
  if (h.auto === 'sleep') return !!d.sleptEarly;
  return false;
}
function habitStreak(h) {
  const x = new Date();
  if (!habitDone(h, dk(x))) x.setDate(x.getDate() - 1);
  let n = 0;
  for (let i = 0; i < 1000; i++) {
    if (habitDone(h, dk(x))) {
      n++;
      x.setDate(x.getDate() - 1);
    } else break;
  }
  return n;
}
function waterBlock() {
  const d = today(),
    WG = waterGoal(),
    wx = waterExtra(),
    ml = S.water.ml;
  return `<div class="wblock"><div class="wbh"><b>💧 Uống nước</b><span>${d.water}/${WG} ly · ${fmtL(d.water * ml)}/${fmtL(WG * ml)}${d.water >= WG ? ' ✓' : ''}</span><button class="chip sm gear" data-spgo="water" aria-label="Cài đặt uống nước">⚙️</button></div>
  <div class="cups" style="grid-template-columns:repeat(${Math.min(8, WG)},minmax(0,1fr))">${Array.from({ length: WG }, (_, i) => `<button class="cup" data-w="${i}" aria-label="Ly ${i + 1}">${cupSvg(i < d.water)}</button>`).join('')}</div>
  ${d.water > WG ? `<p class="muted" style="margin:6px 0 0">Đã uống thêm ${d.water - WG} ly ngoài mục tiêu 💙</p>` : ''}${wx.ml ? `<p class="muted" style="margin:6px 0 0">Hôm nay mục tiêu +${Math.round(wx.ml / ml)} ly vì ${wx.why.join(' và ')}.</p>` : ''}
  <div class="row" style="align-items:center">${d.water >= WG ? `<button class="chip sm" data-a="waterPlus">＋ Uống thêm 1 ly</button>` : ''}<button class="linkbtn" data-a="goWater">📊 Lịch sử uống nước</button></div></div>`;
}
function habitsCard() {
  const td = dk(new Date());
  const done = S.habits.filter(h => habitDone(h, td)).length;
  return `<div class="card"><h2>🌱 Thói quen <small>${done}/${S.habits.length} <button class="chip sm gear" data-spgo="habits" aria-label="Sửa thói quen">⚙️</button></small></h2>${waterBlock()}<div class="hgrid">${S.habits
    .filter(h => h.auto !== 'water')
    .map(h => {
      const on = habitDone(h, td),
        st = habitStreak(h);
      return `<button class="habit ${on ? 'on' : ''}" data-hb="${h.id}" aria-pressed="${on}"><span class="hi">${h.i}</span><span class="hn">${esc(h.n)}</span><span class="hs">${st ? '🔥 ' + st + ' ngày' : on ? 'Hôm nay ✓' : 'Chưa'}</span></button>`;
    })
    .join('')}</div></div>`;
}
function toggleHabit(id) {
  const h = S.habits.find(x => x.id === id);
  if (!h) return;
  const d = today(),
    k = dk(new Date());
  d.hb = d.hb || {};
  if (habitDone(h, k) && !d.hb[id]) {
    say(
      h.auto === 'water'
        ? 'Đã uống đủ nước nên tự tick rồi nè 💧'
        : h.auto === 'gym'
          ? 'Hôm nay tập rồi nên tự tick đó 💪'
          : 'Tối qua ngủ sớm nên tự tick rồi 😴',
      3000
    );
    return;
  }
  d.hb[id] = !d.hb[id];
  if (!d.hb[id]) delete d.hb[id];
  render();
  if (habitDone(h, k)) {
    const st = habitStreak(h);
    if (S.habits.every(x => habitDone(x, k))) celebrate(1);
    say(
      st >= 7 && st % 7 === 0
        ? 'Chuỗi ' + st + ' ngày! ' + S.name + ' kiên trì quá 🔥'
        : ['Giỏi lắm! ✅', 'Thêm một ngày giữ thói quen 🌱', 'Tuyệt vời ' + S.name + ' ✨'][
            Math.floor(Math.random() * 3)
          ],
      3000
    );
  }
}
function habitsPage() {
  return `<div class="card"><h2>🌱 Thói quen hằng ngày</h2><p class="muted" style="margin:0 0 6px">Đổi tên, xóa, hoặc thêm thói quen bạn muốn giữ. Thói quen có ✨ được app tự tick.</p>
  ${S.habits.map(h => `<div class="hedit"><span class="hi">${h.i}</span><input class="inp" data-hname="${h.id}" value="${esc(h.n)}" maxlength="30" aria-label="Tên thói quen"><button class="xbtn" data-hdel="${h.id}" aria-label="Xóa">🗑️</button></div>${h.auto ? `<p class="muted" style="margin:-2px 0 6px 52px;font-size:12px">✨ ${HAUTO[h.auto]}</p>` : ''}`).join('')}
  <h3 class="wh">Thêm thói quen</h3><div class="row">${HICONS.map(i => `<button class="chip sm" data-hicon="${i}" aria-pressed="${(F.hicon || '📖') === i}">${i}</button>`).join('')}</div>
  <form id="habitF" class="addrow" style="margin-top:8px"><input class="inp" id="hNew" placeholder="vd: Thiền 5 phút" maxlength="30" autocomplete="off"><button class="btn" aria-label="Thêm thói quen">＋</button></form>
  ${S.habits.some(h => h.auto) && HDEF().every(x => S.habits.some(h => h.id === x.id)) ? '' : '<button class="chip sm" data-a="hReset" style="margin-top:10px">Khôi phục thói quen mặc định</button>'}</div>`;
}

/* ---------- 🕒 Thời gian biểu ---------- */
const BLOCKS = [
  ['morning', '🌅 Sáng', 4, 11],
  ['noon', '☀️ Trưa', 11, 14],
  ['after', '🌤️ Chiều', 14, 18],
  ['eve', '🌙 Tối', 18, 28]
];
const blockOf = t => {
  let h = +t.split(':')[0];
  if (h < 4) h += 24;
  return (BLOCKS.find(b => h >= b[2] && h < b[3]) || BLOCKS[0])[0];
};
function schedItems() {
  const d = today(),
    td = dk(new Date()),
    L = [];
  S.routine.forEach(r =>
    L.push({ kind: 'r', id: r.id, t: r.t, title: r.title, done: !!(d.rdone || {})[r.id], rep: 1 })
  );
  (d.sched || []).forEach(s => L.push({ kind: 's', id: s.id, t: s.t, title: s.title, done: !!s.done }));
  S.tasks
    .filter(t => t.due === td && t.dueTime)
    .forEach(t => L.push({ kind: 't', id: t.id, t: t.dueTime, title: '📋 ' + t.title, done: !!t.done }));
  if (S.gym.days.length && planFor(new Date()))
    L.push({
      kind: 'g',
      id: 'gym',
      t: S.gym.time,
      title: '🏋️ Tập ' + SPLITS[planFor(new Date())][0],
      done: doneWos().some(w => w.date === td)
    });
  S.appts
    .filter(a => a.date === td && a.time)
    .forEach(a => L.push({ kind: 'a', id: a.id, t: a.time, title: '💌 ' + (a.title || 'Lịch hẹn'), done: !!a.done }));
  L.push({ kind: 'b', id: 'bed', t: S.bedTarget, title: '😴 Đi ngủ', done: !!d.evening });
  const key = t => {
    let [h, m] = t.split(':').map(Number);
    if (h < 4) h += 24;
    return h * 60 + m;
  };
  return L.sort((a, b) => key(a.t) - key(b.t));
}
function schedCard() {
  const L = schedItems(),
    now = new Date(),
    cur = blockOf(hm(now));
  const td = dk(now),
    pend = S.tasks.filter(t => !t.done && t.due && (t.due < td || (t.due === td && !t.dueTime))).sort(sortTasks);
  return `<div class="card"><h2>🕒 Thời gian biểu <small><button class="chip sm gear" data-a="schedAdd" aria-label="Thêm vào thời gian biểu">＋ Thêm</button></small></h2>
  ${pend.length ? `<div class="blk pend"><h3>📌 Cần làm hôm nay</h3>${pend.map(t => `<div class="sitem"><input type="checkbox" data-sdone="t:${t.id}" aria-label="Xong: ${esc(t.title)}"><button class="smain" data-sopen="t:${t.id}"><b>${t.due < td ? '⚠️' : '📋'}</b><span>${esc(t.title)}${t.due < td ? ' <i class="over">quá hạn ' + fmtDue(t.due) + '</i>' : ''}</span></button></div>`).join('')}</div>` : ''}
  ${BLOCKS.map(([k, n]) => {
    const I = L.filter(x => blockOf(x.t) === k);
    if (!I.length && k !== cur) return '';
    return `<div class="blk ${k === cur ? 'now' : ''}"><h3>${n}${k === cur ? ' <i>đang là buổi này</i>' : ''}</h3>${I.length ? I.map(x => `<div class="sitem ${x.done ? 'done' : ''}"><input type="checkbox" data-sdone="${x.kind}:${x.id}" ${x.done ? 'checked' : ''} aria-label="Xong: ${esc(x.title)}"><button class="smain" data-sopen="${x.kind}:${x.id}"><b>${x.t}</b><span>${esc(x.title)}</span>${x.rep ? '<i>🔁</i>' : ''}</button></div>`).join('') : '<p class="muted" style="margin:2px 0 4px">Chưa có gì. Bấm ＋ Thêm nhé.</p>'}</div>`;
  }).join('')}</div>`;
}
function schedSheet(kind, id) {
  const isR = kind === 'r',
    it = isR ? S.routine.find(r => r.id === id) : kind === 's' ? (today().sched || []).find(s => s.id === id) : null;
  F = { rep: isR };
  openSheet(`<h2>${it ? '✏️ Sửa' : '＋ Thêm vào thời gian biểu'}</h2>
  <div class="q"><h3>Giờ</h3><input class="inp" type="time" id="sT" value="${it ? it.t : hm(new Date(Math.ceil(Date.now() / 18e5) * 18e5))}" style="max-width:150px"></div>
  <div class="q"><h3>Việc gì?</h3><input class="inp" id="sTitle" value="${it ? esc(it.title) : ''}" maxlength="60" placeholder="vd: Ăn trưa, Học tiếng Anh"></div>
  <div class="q"><div class="row"><button class="chip" data-f="rep" data-v="" aria-pressed="${!F.rep}">Chỉ hôm nay</button><button class="chip" data-f="rep" data-v="1" aria-pressed="${!!F.rep}">🔁 Lặp lại mỗi ngày</button></div></div>
  <div class="row" style="margin-top:16px"><button class="btn" data-a="schedSave" data-k="${it ? kind + ':' + id : ''}">Lưu</button>${it ? `<button class="btn ghost danger" data-a="schedDel" data-k="${kind}:${id}">Xóa</button>` : ''}</div>`);
}

/* ---------- 📰 Bản tin đầu ngày ---------- */
const QUOTES = [
  'Có công mài sắt, có ngày nên kim.',
  'Kiến tha lâu cũng đầy tổ.',
  'Nước chảy đá mòn.',
  'Có chí thì nên.',
  'Chớ thấy sóng cả mà ngã tay chèo.',
  'Đi một ngày đàng, học một sàng khôn.',
  'Một cây làm chẳng nên non, ba cây chụm lại nên hòn núi cao.',
  'Thất bại là mẹ thành công.',
  'Ăn quả nhớ kẻ trồng cây.',
  'Muốn sang thì bắc cầu kiều, muốn con hay chữ thì yêu lấy thầy.',
  'Hôm nay chỉ cần tốt hơn hôm qua một chút thôi.',
  'Nghỉ ngơi cũng là một phần của cố gắng.',
  'Từng bước nhỏ vẫn là đang tiến về phía trước.',
  'Bạn không cần hoàn hảo, chỉ cần bắt đầu.',
  'Uống một ngụm nước, hít một hơi thật sâu, rồi mình làm tiếp nhé.',
  'Dịu dàng với bản thân như cách bạn dịu dàng với người khác.',
  'Một ngày bình yên cũng là một ngày tuyệt vời.',
  'Việc khó nhất là bắt đầu, phần còn lại sẽ nhẹ dần.',
  'Cảm xúc nào cũng được chào đón, kể cả những ngày không vui.',
  'Hãy tự hào vì bạn đã đi được tới đây.',
  'Làm xong một việc nhỏ còn hơn nghĩ mãi về một việc lớn.',
  'Cơ thể khỏe thì tâm trí mới vui.',
  'Hôm nay hãy cho mình một khoảnh khắc thật chậm.',
  'Không sao nếu hôm nay bạn đi chậm, miễn là đừng bỏ cuộc.',
  'Một nụ cười nhỏ cũng đủ làm sáng cả ngày.',
  'Ngủ đủ giấc là món quà bạn tặng cho chính mình ngày mai.',
  'Mỗi viên kẹo trong lọ là một niềm vui bạn đã nhận ra.',
  'Bạn đang làm tốt hơn bạn nghĩ đấy.',
  'Ưu tiên ba việc quan trọng, những việc khác để sau cũng được.',
  'Biết ơn những điều nhỏ bé, rồi điều lớn sẽ đến.'
];
function briefCard() {
  const now = new Date(),
    td = dk(now),
    day = Math.floor(now / 864e5);
  if (isNight()) return '';
  const se = season(),
    q = se === 'tet' ? TETW_Q[day % TETW_Q.length] : se === 'ny' ? NYW[day % NYW.length] : QUOTES[day % QUOTES.length],
    nT = S.tasks.filter(t => !t.done && t.due && t.due <= td).length,
    gk = S.gym.days.length && planFor(now),
    T3 = today()
      .top3.map(top3Slot)
      .filter(x => x.t).length;
  const chips = [
    nT ? `📋 ${nT} việc đến hạn` : '📋 Không có việc gấp',
    gk ? `🏋️ Tập ${SPLITS[gk][0]} lúc ${S.gym.time}` : S.gym.days.length ? '🌿 Nghỉ tập' : '',
    `💧 ${waterGoal()} ly nước`,
    T3 ? `⭐ Top 3: ${T3}/3 đã chọn` : '',
    ...upcoming(7)
      .filter(x => x.k !== 'appt')
      .slice(0, 2)
      .map(x => (x.k === 'bday' ? '🎂 ' : '💐 ') + esc(x.p.name || '') + ' ' + inDays(x.n)),
    (n => (n ? `💌 ${n} lịch hẹn hôm nay` : ''))(S.appts.filter(a => a.date === td && !a.done).length)
  ].filter(Boolean);
  return `<div class="card brief"><p class="quote">“${q}”</p><div class="bchips">${chips.map(c => `<span>${c}</span>`).join('')}</div></div>`;
}

/* ---------- 📝 Ghi chú nhanh ---------- */
function noteRow(n) {
  const d = new Date(n.at);
  return `<div class="nrow"><span class="ntext">${esc(n.t)}<i>${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${hm(d)}</i></span><button class="xbtn" data-n2t="${n.id}" aria-label="Chuyển thành việc" title="Chuyển thành việc">📋</button><button class="xbtn" data-ndel="${n.id}" aria-label="Xóa ghi chú">🗑️</button></div>`;
}
function notesCard() {
  const L = S.notes;
  return `<div class="card"><h2>📝 Ghi chú nhanh <small>${L.length ? L.length + ' ghi chú' : ''}</small></h2>
  <form id="noteF" class="addrow"><input class="inp" id="nNew" placeholder="Ý tưởng chợt nảy ra…" maxlength="300" autocomplete="off" enterkeyhint="done"><button class="btn" aria-label="Lưu ghi chú">＋</button></form>
  ${L.slice(0, 3).map(noteRow).join('')}${L.length > 3 ? `<button class="linkbtn" data-a="notesAll">Xem tất cả ${L.length} ghi chú</button>` : ''}
  ${L.length ? '<p class="muted" style="margin:6px 0 0;font-size:12px">📋 = chuyển thành việc trong tab Việc</p>' : ''}</div>`;
}

function notesAllSheet() {
  openSheet(
    `<h2>📝 Tất cả ghi chú</h2>${S.notes.map(noteRow).join('') || '<p class="muted">Chưa có ghi chú nào.</p>'}<button class="btn full" style="margin-top:14px" data-a="closeSheet">Đóng</button>`
  );
}

/* ===== src/095-people.js ===== */
/* ---------- 💌 Người thương ---------- */
/* person: { id, name, rel, bday:'YYYY-MM-DD', noYear, annis:[{id,n,date}], likes, food, allergy,
             sizes:{top,bottom,shoe}, budget, wish:[{id,t}], gifts:[{id,t,price,st}], note,
             lastMet:'YYYY-MM-DD', missOn, mute, bellSig, createdAt }
   appt:   { id, date, time, title, who:[personId], place, note, done, remind, lead, bellSig, createdAt } */
const REL = [
  ['love', '💞', 'Người yêu'],
  ['mom', '👩', 'Mẹ'],
  ['dad', '👨', 'Bố'],
  ['sib', '🧑‍🤝‍🧑', 'Anh chị em'],
  ['grand', '👵', 'Ông bà'],
  ['bff', '🫶', 'Bạn thân'],
  ['friend', '😊', 'Bạn bè'],
  ['work', '💼', 'Đồng nghiệp'],
  ['other', '🌷', 'Khác']
];
const relInfo = k => REL.find(r => r[0] === k) || REL[REL.length - 1];
const GST = [
  ['idea', '💡', 'Ý tưởng'],
  ['ordered', '🛒', 'Đã đặt'],
  ['wrapped', '🎁', 'Đã gói'],
  ['given', '💝', 'Đã tặng']
];
const gstInfo = k => GST.find(g => g[0] === k) || GST[0];
const MISS_DAYS = 60;
const BLEADS = [
  [0, 'Đúng ngày'],
  [1, 'Trước 1 ngày'],
  [3, 'Trước 3 ngày'],
  [7, 'Trước 1 tuần']
];
const ALEADS = [
  [0, 'Đúng giờ'],
  [30, 'Trước 30 phút'],
  [60, 'Trước 1 giờ'],
  [1440, 'Trước 1 ngày']
];
let pEdit = null,
  aEdit = null;
const personById = id => S.people.find(p => p.id === id);
const apptById = id => S.appts.find(a => a.id === id);
const pName = p => esc(p.name || 'Chưa đặt tên');

/* --- Tiền: "500k", "1tr2", "1.500.000" --- */
function parseMoney(s) {
  s = String(s || '')
    .toLowerCase()
    .replace(/\s/g, '');
  if (!s) return 0;
  const tr = s.match(/^(\d+)(?:tr|triệu)(\d*)$/);
  if (tr) return +tr[1] * 1e6 + (tr[2] ? +(tr[2] + '00000').slice(0, 6) : 0);
  const m = s.match(/^([\d.,]+)(k|nghìn|ngàn|tr|triệu)?$/);
  if (!m) return 0;
  let n = m[1];
  n = /[.,]\d{3}(\D|$)/.test(n) ? n.replace(/[.,]/g, '') : n.replace(',', '.');
  const v = parseFloat(n) || 0;
  return Math.round(v * (m[2] === 'k' || m[2] === 'nghìn' || m[2] === 'ngàn' ? 1e3 : m[2] ? 1e6 : 1));
}
const fmtMoney = n => (n ? Number(n).toLocaleString('vi-VN') + 'đ' : '');

/* --- Ngày --- */
function dayStart(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function daysUntil(d) {
  return Math.round((dayStart(d) - dayStart(new Date())) / 864e5);
}
/* lần tới của một ngày lặp hằng năm (date 'YYYY-MM-DD'), 29/2 → 28/2 năm không nhuận */
function nextOcc(date, from) {
  if (!date) return null;
  const [, m, d] = date.split('-').map(Number),
    f = dayStart(from || new Date());
  const mk = y => {
    const leap = new Date(y, 1, 29).getMonth() === 1;
    return new Date(y, m - 1, m === 2 && d === 29 && !leap ? 28 : d);
  };
  let o = mk(f.getFullYear());
  if (o < f) o = mk(f.getFullYear() + 1);
  return o;
}
const fmtDM = d => pad(d.getDate()) + '/' + pad(d.getMonth() + 1);
const WDS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
function inDays(n) {
  return n === 0 ? 'hôm nay' : n === 1 ? 'ngày mai' : n === 2 ? 'ngày kia' : 'còn ' + n + ' ngày';
}
const apptAt = a => {
  const [h, m] = (a.time || '09:00').split(':').map(Number),
    d = new Date(a.date + 'T00:00:00');
  d.setHours(h, m, 0, 0);
  return d;
};

/* Các dịp sắp tới trong `days` ngày (sinh nhật, kỷ niệm, lịch hẹn) */
function upcoming(days) {
  const L = [],
    now = new Date(),
    td = dk(now);
  S.people.forEach(p => {
    const b = nextOcc(p.bday);
    if (b && daysUntil(b) <= days) {
      const age = p.noYear ? 0 : b.getFullYear() - +p.bday.slice(0, 4);
      L.push({
        k: 'bday',
        d: b,
        n: daysUntil(b),
        p,
        title: '🎂 Sinh nhật ' + pName(p) + (age > 0 ? ' (' + age + ' tuổi)' : '')
      });
    }
    (p.annis || []).forEach(a => {
      const o = nextOcc(a.date);
      if (o && daysUntil(o) <= days) {
        const yrs = o.getFullYear() - +a.date.slice(0, 4);
        L.push({
          k: 'anni',
          d: o,
          n: daysUntil(o),
          p,
          a,
          title: '💐 ' + esc(a.n || 'Ngày kỷ niệm') + ' · ' + pName(p) + (yrs > 0 ? ' (' + yrs + ' năm)' : '')
        });
      }
    });
  });
  S.appts
    .filter(a => a.date >= td && !a.done)
    .forEach(a => {
      const d = apptAt(a),
        n = daysUntil(d);
      if (n <= days && (n > 0 || d > now - 2 * 36e5))
        L.push({ k: 'appt', d, n, ap: a, title: '📅 ' + esc(a.title || 'Lịch hẹn') + (a.time ? ' · ' + a.time : '') });
    });
  return L.sort((x, y) => x.d - y.d);
}
function bdayToday() {
  return S.people.filter(p => {
    const b = nextOcc(p.bday);
    return b && daysUntil(b) === 0;
  });
}
const missDays = p => daysSince((p.lastMet || p.createdAt.slice(0, 10)) + 'T00:00:00');

/* --- Chuông lịch --- */
const bdayLv = p => (p.mute ? 'none' : S.remindDefault.bday);
const aLv = a => a.remind || S.remindDefault.appt;
const pSig = p =>
  JSON.stringify([p.name, p.bday, p.noYear, (p.annis || []).map(a => [a.n, a.date]), S.remindDefault.bdayLead]);
const aSig = a => JSON.stringify([a.title, a.date, a.time, a.place, aLv(a), a.lead]);
const pHasDates = p => p.bday || (p.annis || []).some(a => a.date);
const pNeedsBell = p => bdayLv(p) === 'cal' && pHasDates(p) && p.bellSig !== pSig(p);
const aNeedsBell = a => !a.done && aLv(a) === 'cal' && a.date >= dk(new Date()) && a.bellSig !== aSig(a);
function yearlyEv(uid, title, date, desc) {
  const o = nextOcc(date),
    [, m, d] = date.split('-').map(Number),
    lead = S.remindDefault.bdayLead,
    T = ['PT9H'];
  if (lead === 1) T.push('-PT15H');
  else if (lead > 1) T.push('-P' + (lead - 1) + 'DT15H');
  return {
    uid,
    title,
    date: dk(o),
    rrule: m === 2 && d === 29 ? 'FREQ=YEARLY;BYMONTH=2;BYMONTHDAY=-1' : 'FREQ=YEARLY',
    triggers: T,
    desc
  };
}
function personIcs(p) {
  const E = [],
    gifts = (p.gifts || []).filter(g => g.st !== 'given').map(g => g.t),
    desc = [
      'Từ Cozy Life OS 💌',
      gifts.length ? 'Ý tưởng quà: ' + gifts.join(', ') : '',
      p.likes ? 'Thích: ' + p.likes : ''
    ]
      .filter(Boolean)
      .join('\n');
  if (p.bday) E.push(yearlyEv('bday-' + p.id, '🎂 Sinh nhật ' + (p.name || ''), p.bday, desc));
  (p.annis || [])
    .filter(a => a.date)
    .forEach(a =>
      E.push(yearlyEv('anni-' + a.id, '💐 ' + (a.n || 'Ngày kỷ niệm') + ' · ' + (p.name || ''), a.date, desc))
    );
  return buildIcs(E);
}
function apptIcs(a) {
  const who = (a.who || [])
      .map(personById)
      .filter(Boolean)
      .map(p => p.name),
    lead = a.lead === undefined ? 60 : a.lead;
  return buildIcs({
    uid: 'appt-' + a.id,
    title: '📅 ' + (a.title || 'Lịch hẹn') + (who.length ? ' · ' + who.join(', ') : ''),
    start: apptAt(a),
    durMin: 90,
    loc: a.place || '',
    triggers: lead ? ['-PT' + lead + 'M', 'PT0S'].filter((x, i) => i || lead) : ['PT0S'],
    desc: ['Từ Cozy Life OS 💌', a.note || ''].filter(Boolean).join('\n')
  });
}
const icsName = s =>
  'cozy-' +
  String(s || 'lich')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .slice(0, 40) +
  '.ics';
function calSheet(title, when, back) {
  openSheet(`<h2>📅 Thêm vào Lịch</h2><p class="muted">iPhone sẽ hiện bảng sự kiện "<b>${title}</b>". Bấm <b>Thêm tất cả</b> (hoặc <b>Thêm vào Lịch</b>) là xong. ${when}</p>
  <p class="muted">Không thấy gì hiện ra? Bấm nút dưới, chọn <b>Lưu vào Tệp</b>, rồi mở file đó trong app Tệp.</p>
  <div class="row" style="margin-top:12px"><button class="btn" data-p="${back}">Xong</button><button class="btn ghost" data-a="shareIcs">📤 Gửi file lịch</button></div>`);
}
function personBell(p) {
  deliverIcs(icsName(p.name), personIcs(p));
  p.bellSig = pSig(p);
  save();
  const lead = S.remindDefault.bdayLead;
  calSheet(
    pName(p),
    'Lịch sẽ báo lúc 9:00 sáng ' + (lead ? 'trước ' + lead + ' ngày và ' : '') + 'đúng ngày, năm nào cũng nhắc.',
    'back:' + p.id
  );
}
function apptBell(a) {
  deliverIcs(icsName(a.title), apptIcs(a));
  a.bellSig = aSig(a);
  save();
  const lead = a.lead === undefined ? 60 : a.lead;
  calSheet(
    esc(a.title || 'Lịch hẹn'),
    'Lịch sẽ báo ' +
      (lead
        ? (lead >= 1440 ? 'trước 1 ngày' : 'trước ' + (lead >= 60 ? lead / 60 + ' giờ' : lead + ' phút')) + ' và '
        : '') +
      'đúng giờ hẹn.',
    'aback:' + a.id
  );
}

/* --- Tab 💌 --- */
function upRow(x) {
  const when = `<i>${WDS[x.d.getDay()]} ${fmtDM(x.d)} · ${inDays(x.n)}</i>`;
  const open = x.k === 'appt' ? `data-popen="a:${x.ap.id}"` : `data-popen="p:${x.p.id}"`;
  const gi = x.p ? (x.p.gifts || []).filter(g => g.st !== 'given') : [];
  const gtag =
    x.k === 'bday' && x.n <= 14
      ? gi.length
        ? ` <span class="gtag">${gstInfo(gi.reduce((a, g) => (GST.findIndex(s => s[0] === g.st) > GST.findIndex(s => s[0] === a) ? g.st : a), 'idea'))[1]} ${gi.length} quà</span>`
        : ' <span class="gtag warn">chưa có quà</span>'
      : '';
  return `<button class="uprow ${x.n === 0 ? 'now' : ''}" ${open}><span>${x.title}${gtag}</span>${when}</button>`;
}
function personRow(p) {
  const [, ri, rn] = relInfo(p.rel),
    b = nextOcc(p.bday),
    md = missDays(p),
    bits = [rn];
  if (b) bits.push('🎂 ' + fmtDM(b) + (daysUntil(b) <= 30 ? ' (' + inDays(daysUntil(b)) + ')' : ''));
  if (p.lastMet) bits.push(md === 0 ? '👋 gặp hôm nay' : '👋 ' + md + ' ngày trước');
  const miss = !p.mute && p.missOn !== false && p.lastMet && md >= MISS_DAYS;
  return `<div class="prow"><button class="pmain" data-popen="p:${p.id}"><span class="pav">${ri}</span><span><b>${pName(p)}</b><i>${bits.join(' · ')}</i>${miss ? '<i class="over">Lâu rồi chưa gặp 🥺</i>' : ''}</span></button><button class="chip sm" data-pmet="${p.id}" aria-label="Vừa gặp ${pName(p)}" title="Vừa gặp / vừa gọi">👋</button></div>`;
}
function viewPeople() {
  const up = upcoming(30),
    G = [];
  S.people.forEach(p => (p.gifts || []).forEach(g => G.push([p, g])));
  const open = G.filter(([, g]) => g.st !== 'given'),
    spent = G.filter(([, g]) => g.st === 'given' && (g.at || '').slice(0, 4) === String(new Date().getFullYear()));
  let h = `<div class="card"><h2>💌 Người thương <small>${S.people.length}</small></h2><p class="muted" style="margin:0 0 10px">Nhớ sinh nhật, sở thích và lên kế hoạch quà cho những người bạn thương.</p><div class="row"><button class="btn" data-p="addP">＋ Thêm người</button><button class="btn ghost" data-p="addA">📅 Lịch hẹn</button></div></div>`;
  h += `<div class="card"><h2>🗓️ Sắp tới <small>30 ngày</small></h2>${up.length ? up.map(upRow).join('') : '<p class="muted" style="margin:0">Chưa có sinh nhật, ngày kỷ niệm hay lịch hẹn nào trong 30 ngày tới.</p>'}</div>`;
  if (S.people.length)
    h += `<div class="card"><h2>👥 Danh sách</h2>${S.people
      .slice()
      .sort((a, b) => {
        const x = nextOcc(a.bday),
          y = nextOcc(b.bday);
        return (
          (x ? daysUntil(x) : 999) - (y ? daysUntil(y) : 999) || String(a.name).localeCompare(String(b.name), 'vi')
        );
      })
      .map(personRow)
      .join(
        ''
      )}<p class="muted" style="margin:8px 0 0">👋 = vừa gặp hoặc vừa gọi điện. Quá ${MISS_DAYS} ngày chưa gặp, Chibi sẽ nhắc nhẹ.</p></div>`;
  if (G.length) {
    const sum = open.reduce((a, [, g]) => a + (g.price || 0), 0),
      sp = spent.reduce((a, [, g]) => a + (g.price || 0), 0);
    h += `<div class="card"><h2>🎁 Quà đang chuẩn bị <small>${open.length}</small></h2>
    <div class="gpipe">${GST.map(([k, i, n]) => `<span><b>${i} ${G.filter(([, g]) => g.st === k).length}</b>${n}</span>`).join('')}</div>
    ${open
      .slice(0, 8)
      .map(
        ([p, g]) =>
          `<button class="uprow" data-popen="p:${p.id}"><span>${gstInfo(g.st)[1]} ${esc(g.t)} <i>cho ${pName(p)}</i></span><i>${fmtMoney(g.price)}</i></button>`
      )
      .join('')}
    <p class="muted" style="margin:8px 0 0">${sum ? 'Dự kiến: <b>' + fmtMoney(sum) + '</b>' : ''}${sum && sp ? ' · ' : ''}${sp ? 'Đã tặng năm nay: <b>' + fmtMoney(sp) + '</b>' : ''}</p></div>`;
  }
  const past = S.appts
    .filter(a => a.done || a.date < dk(new Date()))
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
  if (past.length)
    h += `<div class="card"><details class="more"><summary>📖 Lịch hẹn đã qua (${past.length})</summary>${past
      .slice(0, 30)
      .map(
        a =>
          `<button class="uprow" data-popen="a:${a.id}"><span>${a.done ? '✅' : '📅'} ${esc(a.title || 'Lịch hẹn')}</span><i>${fmtDM(new Date(a.date + 'T00:00:00'))}/${a.date.slice(0, 4)}</i></button>`
      )
      .join('')}</details></div>`;
  return h;
}

/* --- Chi tiết người --- */
function pRemindHtml(p) {
  const L = bdayLv(p);
  if (!pHasDates(p)) return `<p class="muted" style="margin:0">Thêm ngày sinh nhật hoặc ngày kỷ niệm để được nhắc.</p>`;
  let h = `<p class="muted" style="margin:0 0 8px">Mức nhắc chung: <b>${lvInfo(L)[1]} ${lvInfo(L)[2]}</b>${S.remindDefault.bdayLead ? ', báo trước ' + S.remindDefault.bdayLead + ' ngày' : ''} (đổi trong Cài đặt › Nhắc nhở).</p>`;
  if (L === 'cal') {
    const ok = p.bellSig === pSig(p);
    h += `<div class="okline ${ok ? '' : 'warn'}" style="margin:0"><span>${ok ? '🔔' : '🔕'}</span><span>${ok ? 'Đã thêm vào Lịch iPhone, nhắc hằng năm' : p.bellSig ? 'Ngày đã đổi, nhớ xóa sự kiện cũ trên iPhone rồi thêm lại' : 'Chưa thêm vào Lịch iPhone'}</span></div>
    <div class="row" style="margin-top:8px"><button class="btn ${ok ? 'ghost' : ''}" data-p="bell:${p.id}">📅 ${ok ? 'Thêm lại vào Lịch' : 'Thêm vào Lịch (lặp hằng năm)'}</button>${ok ? '' : `<button class="btn ghost" data-p="belldone:${p.id}">👌 Tôi đặt rồi</button>`}</div>`;
  } else if (L === 'chibi') h += `<p class="muted" style="margin:0">Chibi nhắc khi bạn mở app.</p>`;
  h += `<div class="row" style="margin-top:10px"><button class="chip sm" data-p="mute:${p.id}" aria-pressed="${!!p.mute}">🔕 Không nhắc người này</button><button class="chip sm" data-p="miss:${p.id}" aria-pressed="${p.missOn !== false}">🥺 Nhắc khi lâu chưa gặp</button></div>`;
  return h;
}
function wishHtml(p) {
  return (p.wish || [])
    .map(
      w =>
        `<div class="task"><span class="ntext" style="flex:1">${esc(w.t)}</span><button class="xbtn" data-pw2g="${w.id}" title="Chuyển thành ý tưởng quà" aria-label="Chuyển thành quà">🎁</button><button class="xbtn" data-pwdel="${w.id}" aria-label="Xóa">✕</button></div>`
    )
    .join('');
}
function giftsHtml(p) {
  const L = p.gifts || [],
    sum = L.filter(g => g.st !== 'given').reduce((a, g) => a + (g.price || 0), 0),
    bud = p.budget || 0;
  return (
    L.map(
      g =>
        `<div class="grow ${g.st === 'given' ? 'done' : ''}"><input type="text" class="inp" data-pgt="${g.id}" value="${esc(g.t)}" aria-label="Tên quà"><input type="text" class="inp gprice" data-pgp="${g.id}" value="${g.price ? Number(g.price).toLocaleString('vi-VN') : ''}" placeholder="Giá" inputmode="text" aria-label="Giá"><button class="xbtn" data-pgdel="${g.id}" aria-label="Xóa quà">✕</button><div class="row gst">${GST.map(([k, i, n]) => `<button class="chip sm" data-pgst="${g.id}:${k}" aria-pressed="${g.st === k}">${i} ${n}</button>`).join('')}</div></div>`
    ).join('') +
    (L.length || bud
      ? `<p class="muted" style="margin:8px 0 0">Dự kiến: <b>${fmtMoney(sum) || '0đ'}</b>${bud ? ' / ngân sách ' + fmtMoney(bud) + (sum > bud ? ' · <span class="over">vượt ' + fmtMoney(sum - bud) + '</span>' : ' · còn ' + fmtMoney(bud - sum)) : ''}</p>`
      : '')
  );
}
function annisHtml(p) {
  return (p.annis || [])
    .map(
      a =>
        `<div class="row" style="flex-wrap:nowrap;margin-bottom:6px"><input class="inp" data-pan="${a.id}" value="${esc(a.n || '')}" placeholder="vd: Ngày yêu nhau" maxlength="40" aria-label="Tên ngày kỷ niệm"><input class="inp" type="date" data-pad="${a.id}" value="${a.date || ''}" style="max-width:160px" aria-label="Ngày"><button class="xbtn" data-pandel="${a.id}" aria-label="Xóa">✕</button></div>`
    )
    .join('');
}
function ageHtml(p) {
  if (!p.bday) return '';
  const b = nextOcc(p.bday),
    n = daysUntil(b);
  return `<p class="muted" style="margin:6px 0 0">${p.noYear ? 'Chọn năm bất kỳ cũng được, app chỉ dùng ngày và tháng. Sinh nhật ' : (n ? 'Lần tới tròn ' : 'Hôm nay tròn ') + (b.getFullYear() - +p.bday.slice(0, 4)) + ' tuổi, '}${n ? inDays(n) + ' (' + fmtDM(b) + ')' : 'chúc mừng sinh nhật 🎉'}.</p>`;
}
function personSheet(id) {
  const p = personById(id);
  if (!p) return;
  pEdit = id;
  const z = p.sizes || {},
    fld = (k, lab, ph, max) =>
      `<div class="q"><h3>${lab}</h3><input class="inp" data-pf="${k}" value="${esc(k.split('.').reduce((o, x) => (o || {})[x], p) || '')}" placeholder="${ph}" maxlength="${max || 200}"></div>`;
  const pa = S.appts
    .filter(a => (a.who || []).includes(id))
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
  openSheet(`<h2>${relInfo(p.rel)[1]} ${pName(p)}</h2>
  <div class="q" style="margin-top:10px"><input class="inp" data-pf="name" value="${esc(p.name || '')}" placeholder="Tên hoặc biệt danh" maxlength="60" aria-label="Tên"></div>
  <div class="q"><h3>Là gì của bạn?</h3><div class="row">${REL.map(([k, i, n]) => `<button class="chip sm" data-prel="${k}" aria-pressed="${p.rel === k}">${i} ${n}</button>`).join('')}</div></div>
  <div class="q"><h3>🎂 Sinh nhật</h3><div class="row" style="flex-wrap:nowrap"><input class="inp" type="date" data-pf="bday" value="${p.bday || ''}" style="max-width:180px" aria-label="Ngày sinh"><button class="chip sm" data-p="noyear:${id}" aria-pressed="${!!p.noYear}">Không rõ năm</button></div><div id="pAge">${ageHtml(p)}</div></div>
  <div class="q"><h3>💐 Ngày kỷ niệm</h3><div id="pAnnis">${annisHtml(p)}</div><button class="chip sm" data-p="addAnni">＋ Thêm ngày kỷ niệm</button></div>
  <div class="q"><h3>🔔 Nhắc nhở</h3><div id="pRemind">${pRemindHtml(p)}</div></div>
  ${fld('likes', '💖 Sở thích', 'vd: hoa tulip, đọc sách, mèo')}
  ${fld('food', '🍜 Gu ăn uống', 'vd: thích trà sữa ít đường, không ăn hành')}
  ${fld('allergy', '⚠️ Dị ứng', 'vd: tôm, đậu phộng')}
  <div class="q"><h3>👕 Size</h3><div class="row" style="flex-wrap:nowrap"><input class="inp" data-pf="sizes.top" value="${esc(z.top || '')}" placeholder="Áo" maxlength="20" aria-label="Size áo"><input class="inp" data-pf="sizes.bottom" value="${esc(z.bottom || '')}" placeholder="Quần" maxlength="20" aria-label="Size quần"><input class="inp" data-pf="sizes.shoe" value="${esc(z.shoe || '')}" placeholder="Giày" maxlength="20" aria-label="Size giày"></div></div>
  <div class="q"><h3>📝 Từng nhắc là thích</h3><p class="muted" style="margin:0 0 6px">Nghe họ nói thích gì thì ghi ngay, đến dịp chỉ việc chọn.</p><div id="pWish">${wishHtml(p)}</div><form id="pWishF" class="addrow" style="margin-top:6px"><input class="inp" id="pWishNew" placeholder="vd: Nến thơm mùi gỗ" maxlength="100" autocomplete="off" enterkeyhint="done"><button class="btn ghost" aria-label="Thêm">＋</button></form></div>
  <div class="q"><h3>🎁 Kế hoạch quà</h3><div id="pGifts">${giftsHtml(p)}</div><form id="pGiftF" class="addrow" style="margin-top:6px"><input class="inp" id="pGiftNew" placeholder="Món quà…" maxlength="100" autocomplete="off"><input class="inp gprice" id="pGiftPrice" placeholder="Giá" aria-label="Giá"><button class="btn ghost" aria-label="Thêm quà">＋</button></form>
   <div class="row" style="margin-top:8px;flex-wrap:nowrap;align-items:center"><span class="muted" style="white-space:nowrap">Ngân sách:</span><input class="inp" data-pbud="1" value="${p.budget ? Number(p.budget).toLocaleString('vi-VN') : ''}" placeholder="vd: 500k" style="max-width:160px" aria-label="Ngân sách"></div></div>
  <div class="q"><h3>👋 Lần gặp gần nhất</h3><div class="row" style="flex-wrap:nowrap"><input class="inp" type="date" data-pf="lastMet" value="${p.lastMet || ''}" style="max-width:180px" aria-label="Lần gặp gần nhất"><button class="chip sm" data-pmet="${id}" data-insheet="1">👋 Hôm nay</button></div></div>
  ${
    pa.length
      ? `<div class="q"><h3>📅 Lịch hẹn</h3>${pa
          .slice(0, 6)
          .map(
            a =>
              `<button class="uprow" data-popen="a:${a.id}"><span>${a.done ? '✅' : '📅'} ${esc(a.title || 'Lịch hẹn')}</span><i>${fmtDM(new Date(a.date + 'T00:00:00'))} ${a.time || ''}</i></button>`
          )
          .join('')}</div>`
      : ''
  }
  <div class="q"><h3>Ghi chú</h3><textarea class="inp" data-pf="note" rows="3" maxlength="2000">${esc(p.note || '')}</textarea></div>
  <div class="row" style="margin-top:18px"><button class="btn" data-p="close">Xong</button><button class="btn ghost" data-p="apptFor:${id}">📅 Hẹn gặp</button></div>
  <div class="row" style="margin-top:10px"><button class="btn ghost danger" data-p="delP">🗑️ Xóa người này</button></div>`);
}
const refreshP = () => {
  const p = personById(pEdit);
  if (!p) return;
  [
    ['#pRemind', pRemindHtml],
    ['#pGifts', giftsHtml],
    ['#pWish', wishHtml],
    ['#pAnnis', annisHtml],
    ['#pAge', ageHtml]
  ].forEach(([s, f]) => {
    if ($(s)) $(s).innerHTML = f(p);
  });
};

/* --- Lịch hẹn --- */
function aRemindHtml(a) {
  const L = aLv(a),
    lead = a.lead === undefined ? 60 : a.lead;
  let h = `<div class="row">${LV.slice(0, 3)
    .map(([k, i, n]) => `<button class="chip sm" data-alv="${k}" aria-pressed="${L === k}">${i} ${n}</button>`)
    .join('')}</div>`;
  if (L === 'none') return h;
  h += `<div class="row" style="margin-top:8px">${ALEADS.map(([v, n]) => `<button class="chip sm" data-alead="${v}" aria-pressed="${lead === v}">${n}</button>`).join('')}</div>`;
  if (L === 'cal' && a.date) {
    const ok = a.bellSig === aSig(a);
    h += `<div class="okline ${ok ? '' : 'warn'}" style="margin:10px 0 0"><span>${ok ? '🔔' : '🔕'}</span><span>${ok ? 'Đã thêm vào Lịch iPhone' : a.bellSig ? 'Đã đổi giờ/nơi, nhớ xóa sự kiện cũ rồi thêm lại' : 'Chưa thêm vào Lịch iPhone'}</span></div>`;
  } else if (L === 'chibi') h += `<p class="muted" style="margin:8px 0 0">Chibi nhắc khi bạn đang mở app.</p>`;
  return h;
}
function apptSheet(id, pre) {
  let a = id && apptById(id);
  if (!a) {
    const s = new Date(Math.ceil(Date.now() / 18e5) * 18e5);
    a = {
      id: uid(),
      date: dk(s),
      time: hm(s),
      title: '',
      who: pre ? [pre] : [],
      place: '',
      note: '',
      createdAt: new Date().toISOString(),
      draft: true
    };
  }
  aEdit = a;
  const maps = a.place ? 'https://maps.apple.com/?q=' + encodeURIComponent(a.place) : '';
  openSheet(`<h2>${a.draft ? '📅 Lịch hẹn mới' : '✏️ Lịch hẹn'}</h2>
  <div class="q" style="margin-top:10px"><input class="inp" id="aTitle" value="${esc(a.title)}" placeholder="vd: Ăn tối, Cà phê, Xem phim" maxlength="80" aria-label="Hẹn gì"></div>
  <div class="q"><h3>Khi nào</h3><div class="row" style="flex-wrap:nowrap"><input class="inp" type="date" id="aDate" value="${a.date}" aria-label="Ngày"><input class="inp" type="time" id="aTime" value="${a.time || ''}" style="max-width:130px" aria-label="Giờ"></div></div>
  <div class="q"><h3>Gặp ai</h3>${S.people.length ? `<div class="row">${S.people.map(p => `<button class="chip sm" data-awho="${p.id}" aria-pressed="${(a.who || []).includes(p.id)}">${relInfo(p.rel)[1]} ${pName(p)}</button>`).join('')}</div>` : '<p class="muted" style="margin:0">Chưa có ai trong danh sách Người thương.</p>'}</div>
  <div class="q"><h3>📍 Ở đâu</h3><div class="row" style="flex-wrap:nowrap"><input class="inp" id="aPlace" value="${esc(a.place || '')}" placeholder="Tên quán hoặc địa chỉ" maxlength="160">${maps ? `<a class="btn ghost" href="${esc(maps)}" target="_blank" rel="noopener">🗺️ Bản đồ</a>` : ''}</div></div>
  <div class="q"><h3>🔔 Nhắc nhở</h3><div id="aRemind">${aRemindHtml(a)}</div></div>
  <div class="q"><h3>Ghi chú</h3><textarea class="inp" id="aNote" rows="2" maxlength="1000">${esc(a.note || '')}</textarea></div>
  <div class="row" style="margin-top:18px"><button class="btn" data-p="aSave">Lưu</button>${a.draft ? '' : `<button class="btn ghost" data-p="aDone">${a.done ? '↩️ Chưa diễn ra' : '✅ Đã gặp'}</button>`}</div>
  ${a.draft ? '' : '<div class="row" style="margin-top:10px"><button class="btn ghost danger" data-p="aDel">🗑️ Xóa lịch hẹn</button></div>'}`);
}
function readAppt() {
  const a = aEdit;
  if (!a || !$('#aTitle')) return a;
  a.title = $('#aTitle').value.trim();
  a.date = $('#aDate').value || a.date;
  a.time = $('#aTime').value;
  a.place = $('#aPlace').value.trim();
  a.note = $('#aNote').value.trim();
  return a;
}
function apptDone(a, on) {
  a.done = on;
  if (on)
    (a.who || []).forEach(pid => {
      const p = personById(pid);
      if (p && (!p.lastMet || p.lastMet < a.date)) p.lastMet = a.date;
    });
}
function metToday(p) {
  p.lastMet = dk(new Date());
  delete p.missAsk;
}

/* --- Today: thẻ Người thương sắp tới + chuông --- */
function peopleCard() {
  const up = upcoming(7);
  if (!up.length) return '';
  return `<div class="card"><h2>💌 Sắp tới <small><button class="chip sm gear" data-tab="people">Xem hết</button></small></h2>${up.slice(0, 4).map(upRow).join('')}</div>`;
}
function peopleBellRows() {
  const P1 = S.people.filter(pNeedsBell),
    A1 = S.appts.filter(aNeedsBell);
  return {
    n: P1.length + A1.length,
    html:
      P1.map(
        p =>
          `<button class="uprow" data-popen="p:${p.id}"><span>🎂 ${pName(p)}</span><i>chưa thêm vào Lịch</i></button>`
      ).join('') +
      A1.map(
        a =>
          `<button class="uprow" data-popen="a:${a.id}"><span>📅 ${esc(a.title || 'Lịch hẹn')}</span><i>${fmtDM(new Date(a.date + 'T00:00:00'))} ${a.time || ''}</i></button>`
      ).join('')
  };
}

/* --- Chibi nhắc --- */
function peopleNudge(now, td, log) {
  /* sinh nhật hôm nay: nhắc 1 lần (kể cả Ngày Lười Biếng) */
  for (const p of bdayToday()) {
    if (bdayLv(p) === 'none' || log['bd-' + p.id] === td || now.getHours() < 7) continue;
    log['bd-' + p.id] = td;
    save();
    showNudge({
      text: '🎉 Hôm nay là sinh nhật <b>' + pName(p) + '</b>! Gửi một lời chúc thật dễ thương nhé 🎂',
      btns: ['🎁 Xem quà', 'Lát nữa'],
      onBtn: i => {
        if (i === 0) {
          tab = 'people';
          render();
          personSheet(p.id);
        }
      }
    });
    return true;
  }
  if (lazyDay()) return false;
  /* lịch hẹn – Chibi nhắc trước giờ */
  for (const a of S.appts) {
    if (a.done || aLv(a) !== 'chibi' || a.date !== td || !a.time) continue;
    const lead = a.lead === undefined ? 60 : a.lead,
      d = (apptAt(a) - now) / 6e4;
    if (d <= Math.max(lead, 15) && d > -30 && log['ap-' + a.id] !== td) {
      log['ap-' + a.id] = td;
      save();
      showNudge({
        text:
          '📅 ' +
          (d > 0 ? 'Còn ' + Math.round(d) + ' phút nữa' : 'Đến giờ') +
          ' hẹn "<b>' +
          esc(a.title || 'Lịch hẹn') +
          '</b>"' +
          (a.place ? ' ở ' + esc(a.place) : '') +
          '.',
        btns: a.place ? ['🗺️ Chỉ đường', 'Ok'] : ['Xem', 'Ok'],
        onBtn: i => {
          if (i) return;
          if (a.place) open('https://maps.apple.com/?q=' + encodeURIComponent(a.place), '_blank');
          else {
            tab = 'people';
            render();
            apptSheet(a.id);
          }
        }
      });
      return true;
    }
  }
  if (now.getHours() < 9) return false;
  /* trước sinh nhật / kỷ niệm (mức Chibi) */
  const lead = S.remindDefault.bdayLead;
  for (const x of upcoming(lead)) {
    if (x.k === 'appt' || x.n === 0 || bdayLv(x.p) !== 'chibi') continue;
    const key = 'up-' + (x.a ? x.a.id : x.p.id);
    if (log[key] === td) continue;
    log[key] = td;
    save();
    const gi = (x.p.gifts || []).filter(g => g.st !== 'given');
    showNudge({
      text:
        x.title +
        ' ' +
        inDays(x.n) +
        ' (' +
        fmtDM(x.d) +
        ').' +
        (x.k === 'bday'
          ? gi.length
            ? ' Đã có ' + gi.length + ' món quà trong kế hoạch.'
            : ' Chưa có quà, mình chuẩn bị nhé?'
          : ''),
      btns: ['Xem', 'Để sau'],
      onBtn: i => {
        if (i === 0) {
          tab = 'people';
          render();
          personSheet(x.p.id);
        }
      }
    });
    return true;
  }
  /* lâu rồi chưa gặp: tối đa 1 lần mỗi tuần */
  const wk = Math.floor(now / 6048e5);
  if (log.miss === wk) return false;
  const M = S.people
    .filter(
      p => !p.mute && p.missOn !== false && p.lastMet && missDays(p) >= MISS_DAYS && (p.missAsk || 0) < Date.now()
    )
    .sort((a, b) => missDays(b) - missDays(a));
  if (!M.length) return false;
  const p = M[0];
  log.miss = wk;
  save();
  showNudge({
    text:
      '🥺 Đã <b>' +
      missDays(p) +
      ' ngày</b> rồi bạn chưa gặp <b>' +
      pName(p) +
      '</b>. Nhắn hỏi thăm hay hẹn một buổi cà phê nhé?',
    btns: ['👋 Vừa gặp/gọi rồi', '📅 Hẹn gặp', 'Để sau'],
    onBtn: i => {
      if (i === 0) {
        metToday(p);
        say('Ghi nhận rồi nha 💞', 2500);
      } else if (i === 1) {
        tab = 'people';
        render();
        apptSheet(null, p.id);
      } else p.missAsk = Date.now() + 14 * 864e5;
      render();
    }
  });
  return true;
}

/* --- Sự kiện của tab 💌 (gắn riêng để không chen vào bộ xử lý chung) --- */
function newPerson() {
  const p = {
    id: uid(),
    name: '',
    rel: 'friend',
    bday: '',
    annis: [],
    sizes: {},
    wish: [],
    gifts: [],
    createdAt: new Date().toISOString()
  };
  S.people.push(p);
  return p;
}
document.addEventListener('click', e => {
  const t = e.target.closest('button');
  if (!t) return;
  const D = t.dataset;
  if (D.popen) {
    const [k, id] = D.popen.split(':');
    if (k === 'p') personSheet(id);
    else apptSheet(id);
    return;
  }
  if (D.pmet) {
    const p = personById(D.pmet);
    if (!p) return;
    metToday(p);
    render();
    if (D.insheet) personSheet(p.id);
    say('Gặp ' + (p.name || 'người thương') + ' vui không? 💞', 2500);
    return;
  }
  const p = personById(pEdit);
  if (D.prel && p) {
    p.rel = D.prel;
    t.parentNode.querySelectorAll('.chip').forEach(b => b.setAttribute('aria-pressed', b === t));
    render();
    return;
  }
  if (D.pgst && p) {
    const [gid, st] = D.pgst.split(':'),
      g = (p.gifts || []).find(x => x.id === gid);
    if (!g) return;
    g.st = st;
    if (st === 'given') g.at = new Date().toISOString();
    refreshP();
    render();
    if (st === 'given') say('Chắc ' + (p.name || 'họ') + ' vui lắm đó 💝', 2500);
    return;
  }
  if (D.pgdel && p) {
    p.gifts = p.gifts.filter(x => x.id !== D.pgdel);
    refreshP();
    render();
    return;
  }
  if (D.pwdel && p) {
    p.wish = p.wish.filter(x => x.id !== D.pwdel);
    refreshP();
    save();
    return;
  }
  if (D.pw2g && p) {
    const w = p.wish.find(x => x.id === D.pw2g);
    if (!w) return;
    p.wish = p.wish.filter(x => x !== w);
    (p.gifts = p.gifts || []).push({ id: uid(), t: w.t, price: 0, st: 'idea' });
    refreshP();
    render();
    return;
  }
  if (D.pandel && p) {
    p.annis = p.annis.filter(x => x.id !== D.pandel);
    refreshP();
    render();
    return;
  }
  if (D.awho && aEdit) {
    const W = aEdit.who || (aEdit.who = []),
      id = D.awho;
    aEdit.who = W.includes(id) ? W.filter(x => x !== id) : W.concat(id);
    t.setAttribute('aria-pressed', aEdit.who.includes(id));
    return;
  }
  if (D.alv && aEdit) {
    readAppt();
    aEdit.remind = D.alv;
    if ($('#aRemind')) $('#aRemind').innerHTML = aRemindHtml(aEdit);
    return;
  }
  if (D.alead !== undefined && aEdit) {
    readAppt();
    aEdit.lead = +D.alead;
    if ($('#aRemind')) $('#aRemind').innerHTML = aRemindHtml(aEdit);
    return;
  }
  if (D.bdlv) {
    S.remindDefault.bday = D.bdlv;
    render();
    return;
  }
  if (D.bdlead !== undefined) {
    S.remindDefault.bdayLead = +D.bdlead;
    render();
    return;
  }
  if (D.aplv) {
    S.remindDefault.appt = D.aplv;
    render();
    return;
  }
  if (!D.p) return;
  const [a, arg] = D.p.split(':');
  if (a === 'addP') {
    const np = newPerson();
    render();
    personSheet(np.id);
    setTimeout(() => {
      const el = document.querySelector('#sheet [data-pf="name"]');
      if (el) el.focus();
    }, 50);
  } else if (a === 'addA') apptSheet(null);
  else if (a === 'apptFor') apptSheet(null, arg);
  else if (a === 'close') {
    const cur = personById(pEdit);
    closeSheet();
    pEdit = null;
    if (cur && !cur.name && !cur.bday && !(cur.gifts || []).length) S.people = S.people.filter(x => x !== cur);
    render();
  } else if (a === 'back') personSheet(arg);
  else if (a === 'aback') {
    closeSheet();
    aEdit = null;
    render();
  } else if (a === 'bell') {
    const q = personById(arg);
    if (q) personBell(q);
  } else if (a === 'belldone') {
    const q = personById(arg);
    if (q) {
      q.bellSig = pSig(q);
      refreshP();
      render();
    }
  } else if (a === 'mute' && p) {
    p.mute = !p.mute;
    refreshP();
    render();
  } else if (a === 'miss' && p) {
    p.missOn = p.missOn === false;
    refreshP();
    render();
  } else if (a === 'noyear' && p) {
    p.noYear = !p.noYear;
    t.setAttribute('aria-pressed', p.noYear);
    refreshP();
    render();
  } else if (a === 'addAnni' && p) {
    (p.annis = p.annis || []).push({ id: uid(), n: '', date: '' });
    refreshP();
    const L = document.querySelectorAll('#pAnnis [data-pan]');
    if (L.length) L[L.length - 1].focus();
  } else if (a === 'delP' && p) {
    if (!t.dataset.sure) {
      t.dataset.sure = '1';
      t.textContent = 'Bấm lần nữa để xóa hẳn';
      return;
    }
    S.people = S.people.filter(x => x !== p);
    S.appts.forEach(x => {
      x.who = (x.who || []).filter(w => w !== p.id);
    });
    closeSheet();
    pEdit = null;
    render();
    say('Đã xóa');
  } else if (a === 'aSave') {
    const ap = readAppt();
    if (!ap) return;
    if (!ap.title)
      ap.title = (ap.who || []).length
        ? 'Gặp ' +
          ap.who
            .map(personById)
            .filter(Boolean)
            .map(x => x.name)
            .join(', ')
        : 'Lịch hẹn';
    const isNew = ap.draft;
    delete ap.draft;
    if (isNew) S.appts.push(ap);
    render();
    if (aLv(ap) === 'cal' && aNeedsBell(ap)) apptBell(ap);
    else {
      closeSheet();
      aEdit = null;
      say(isNew ? 'Đã lưu lịch hẹn 📅' : 'Đã lưu');
    }
  } else if (a === 'aDone' && aEdit) {
    readAppt();
    apptDone(aEdit, !aEdit.done);
    closeSheet();
    render();
    if (aEdit.done) say('Buổi gặp vui chứ? 💞', 2500);
    aEdit = null;
  } else if (a === 'aDel' && aEdit) {
    if (!t.dataset.sure) {
      t.dataset.sure = '1';
      t.textContent = 'Bấm lần nữa để xóa hẳn';
      return;
    }
    S.appts = S.appts.filter(x => x.id !== aEdit.id);
    closeSheet();
    aEdit = null;
    render();
  }
});
document.addEventListener('change', e => {
  const t = e.target,
    D = t.dataset,
    p = personById(pEdit);
  if (!p) return;
  if (D.pf) {
    const ks = D.pf.split('.'),
      v = t.value.trim();
    if (ks.length === 2) (p[ks[0]] = p[ks[0]] || {})[ks[1]] = v;
    else p[ks[0]] = v;
    if (D.pf === 'name' || D.pf === 'bday') {
      const h = $('#sheet h2');
      if (h) h.textContent = relInfo(p.rel)[1] + ' ' + (p.name || 'Chưa đặt tên');
    }
    refreshP();
    render();
  } else if (D.pgt || D.pgp) {
    const g = (p.gifts || []).find(x => x.id === (D.pgt || D.pgp));
    if (!g) return;
    if (D.pgt) g.t = t.value.trim() || g.t;
    else g.price = parseMoney(t.value);
    refreshP();
    render();
  } else if (D.pbud) {
    p.budget = parseMoney(t.value);
    t.value = p.budget ? p.budget.toLocaleString('vi-VN') : '';
    refreshP();
    save();
  } else if (D.pan || D.pad) {
    const an = (p.annis || []).find(x => x.id === (D.pan || D.pad));
    if (!an) return;
    if (D.pan) an.n = t.value.trim();
    else an.date = t.value;
    if ($('#pRemind')) $('#pRemind').innerHTML = pRemindHtml(p);
    render();
  }
});
document.addEventListener('submit', e => {
  const id = e.target.id;
  if (id !== 'pWishF' && id !== 'pGiftF') return;
  e.preventDefault();
  const p = personById(pEdit);
  if (!p) return;
  if (id === 'pWishF') {
    const v = $('#pWishNew').value.trim();
    if (!v) return;
    (p.wish = p.wish || []).push({ id: uid(), t: v });
    $('#pWishNew').value = '';
  } else {
    const v = $('#pGiftNew').value.trim();
    if (!v) return;
    (p.gifts = p.gifts || []).push({ id: uid(), t: v, price: parseMoney($('#pGiftPrice').value), st: 'idea' });
    $('#pGiftNew').value = '';
    $('#pGiftPrice').value = '';
  }
  refreshP();
  render();
});

/* ===== src/10-settings.js ===== */
/* ---------- 🪧 Chibi giơ bảng nhắc ---------- */
function layoutBoard() {
  const el = $('#nudge');
  if (!el) return;
  el.style.bottom = Math.max(90, innerHeight - (P.y + PH * 0.49) + 40) + 'px';
}

function viewSoon(t) {
  return `<div class="card"><h2>${t}</h2><p class="muted" style="margin:0">Phần này sẽ có ở bước tiếp theo.</p></div>`;
}

let wtab = 'outfit',
  snaps = null,
  setPage = null;
function dataCard() {
  const pst = CozyDB.fallback
    ? [
        '⚠️',
        'Trình duyệt này không cho lưu kiểu bền vững (có thể đang ở chế độ ẩn danh). Hãy mở bằng trình duyệt thường.'
      ]
    : persistState === 'yes'
      ? ['✅', 'Đã được bảo vệ: trình duyệt sẽ không tự dọn dữ liệu khi máy đầy bộ nhớ.']
      : [
          '💡',
          (isIOS && !standalone()
            ? 'Safari có thể xóa dữ liệu nếu 7 ngày không mở. Cài app lên màn hình chính để tránh việc này. '
            : 'Trình duyệt có thể tự dọn khi máy rất đầy bộ nhớ. ') + 'Sao lưu định kỳ cho chắc nhé.'
        ];
  const sum = CozyBackup.summary(S);
  if (snaps === null) {
    snaps = [];
    CozyDB.listSnapshots()
      .then(l => {
        snaps = l;
        if (tab === 'set') render();
      })
      .catch(() => {});
  }
  return `<div class="card" id="datacard"><h2>💾 Dữ liệu & sao lưu</h2>
  <p class="muted" style="margin:0 0 10px">Mọi thứ nằm ngay trên máy này, không gửi lên mạng. Hiện có ${sum.tasks} việc, ${sum.workouts} buổi tập, ${sum.people} người thương, ${sum.days} ngày nhật ký, ${sum.sleeps} đêm ngủ, ${sum.candies} viên kẹo.</p>
  <div class="okline ${persistState === 'yes' ? '' : 'warn'}"><span>${pst[0]}</span><span>${pst[1]}</span></div>
  <div class="okline ${backupDue() ? 'warn' : ''}"><span>📤</span><span>Lần sao lưu cuối: <b>${S.lastBackup ? fmtDate(S.lastBackup) + ' (' + (daysSince(S.lastBackup) ? daysSince(S.lastBackup) + ' ngày trước' : 'hôm nay') + ')' : 'chưa có'}</b></span></div>
  <div class="q" style="margin-top:4px"><h3>Mật khẩu cho file sao lưu <span class="muted">(không bắt buộc)</span></h3><input class="inp" type="password" id="bkpw" autocomplete="new-password" placeholder="Để trống nếu không cần"><p class="muted" style="margin:6px 0 0">Đặt mật khẩu thì người khác mở file cũng không đọc được nhật ký. Nhưng <b>quên mật khẩu là không khôi phục được</b>, nên hãy ghi lại ở nơi an toàn.</p></div>
  <div class="row" style="margin-top:12px"><button class="btn" data-a="export">📤 Sao lưu ra file</button><button class="btn ghost" data-a="import">📥 Khôi phục từ file</button></div>
  <details class="more" style="margin-top:14px"><summary>🕰️ Bản chụp tự động (${snaps.length})</summary><p class="muted" style="margin:4px 0 8px">App tự chụp lại dữ liệu mỗi ngày (giữ 7 ngày) và trước mỗi lần khôi phục hoặc xóa. Dùng khi lỡ tay làm mất gì đó.</p>
  ${snaps.length ? snaps.map(s => `<div class="snap"><span>${s.key.startsWith('auto-') ? '📅' : '🛟'} ${fmtDate(s.createdAt)}<br><span class="muted">${esc(s.label || '')} · ${s.days} ngày, ${s.sleeps} đêm</span></span><button class="chip" data-snap="${esc(s.key)}">Quay lại</button></div>`).join('') : '<p class="muted">Chưa có bản chụp nào.</p>'}</details>
  <details class="more" style="margin-top:6px"><summary>🧹 Xóa dữ liệu</summary><div class="row" style="margin-top:8px">${S.sleeps.some(x => x.sample) ? '<button class="btn ghost" data-a="clearSample">Xóa dữ liệu mẫu</button>' : ''}<button class="btn ghost" data-a="reset">Xóa hết, làm lại</button></div><p class="muted hide" id="resetQ">Bấm "Xóa hết" lần nữa để xác nhận. (App sẽ chụp lại trước khi xóa.)</p></details></div>`;
}

function viewSettings() {
  const st = state(),
    L = S.look;
  const card = (k, attr, cur) => {
    const o = OUTFITS[k];
    return `<button class="wd" data-${attr}="${k}" aria-pressed="${cur === k}">${chibi({ mood: 'calm', outfit: k, still: 1, face: 'smile' })}<b>${o.n}</b><span>${o.d}</span></button>`;
  };
  const grp = (title, key, opts) =>
    `<div class="q"><h3>${title}</h3><div class="row">${opts.map(([v, t]) => `<button class="chip" data-look="${key}" data-lv="${v}" aria-pressed="${String(key === 'seasonWear' ? S.seasonWear : L[key]) === String(v)}">${t}</button>`).join('')}</div></div>`;
  const pv =
    wtab === 'night'
      ? S.nightWear
      : wtab === 'outfit' || wtab === 'face' || wtab === 'makeup' || wtab === 'acc' || wtab === 'hair'
        ? S.fav
        : st.outfit;
  let body = '';
  if (wtab === 'outfit')
    body = `<h3 class="wh">Váy áo hằng ngày</h3><div class="wgrid">${DAY.filter(
      k => !XMAS.includes(k) && !TETW.includes(k)
    )
      .map(k => card(k, 'fav', S.fav))
      .join(
        ''
      )}</div><h3 class="wh">🧧 Tết</h3><div class="wgrid">${TETW.map(k => card(k, 'fav', S.fav)).join('')}</div><h3 class="wh">🎄 Giáng sinh</h3><div class="wgrid">${XMAS.map(k => card(k, 'fav', S.fav)).join('')}</div><h3 class="wh">Đồ bộ cute</h3><div class="wgrid">${KIG.map(k => card(k, 'fav', S.fav)).join('')}</div>`;
  if (wtab === 'night')
    body = `<p class="muted" style="margin:0 0 10px">Bộ Chibi tự mặc vào buổi tối và khi bạn ốm.</p><div class="wgrid">${NIGHT.map(k => card(k, 'nw', S.nightWear)).join('')}</div><div class="row" style="margin-top:12px"><button class="chip" data-swap="1" aria-pressed="${S.autoSwap}">Tự thay đồ ngủ buổi tối, khi ốm và đồ tập khi đau cơ</button></div>`;
  if (wtab === 'acc')
    body =
      grp('Kính', 'eyewear', [
        ['none', 'Không'],
        ['round', '👓 Gọng tròn'],
        ['sun', '🕶️ Kính râm'],
        ['heart', '💗 Kính tim']
      ]) +
      grp('Trên tóc', 'head', [
        ['none', 'Không'],
        ['bow', '🎀 Nơ'],
        ['band', 'Bờm ngọc'],
        ['pearl', 'Kẹp ngọc trai'],
        ['flower', '🌼 Kẹp hoa'],
        ['beanie', '🧶 Mũ len']
      ]) +
      grp('🎉 Đồ theo mùa', 'seasonWear', [
        [true, 'Mặc theo mùa (mũ Noel, mũ tiệc, áo dài Tết)'],
        [false, 'Không']
      ]) +
      grp('Bông tai', 'ear', [
        ['none', 'Không'],
        ['stud', 'Nụ'],
        ['pearl', 'Ngọc trai rủ'],
        ['hoop', 'Khoen vàng']
      ]) +
      grp('Đồng hồ vàng', 'watch', [
        [true, 'Đeo'],
        [false, 'Không']
      ]) +
      grp('Túi xách trắng', 'bag', [
        [true, 'Cầm túi'],
        [false, 'Không']
      ]) +
      `<p class="muted">Đồng hồ và túi chỉ hiện với váy áo đi chơi; phụ kiện trên tóc ẩn khi mặc đồ bộ có mũ.</p>`;
  if (wtab === 'makeup')
    body =
      `<div class="q" style="margin-top:0"><h3>Màu son</h3><div class="row">${LIPS.map(([c, t]) => `<button class="sw" data-look="lip" data-lv="${c}" style="background:${c}" aria-label="${t}" aria-pressed="${L.lip === c}"></button>`).join('')}</div><p class="muted" style="margin:6px 0 0">${(LIPS.find(x => x[0] === L.lip) || ['', ''])[1]}</p></div>` +
      grp('Má hồng', 'blush', [
        ['soft', 'Tự nhiên'],
        ['strong', 'Ửng đậm'],
        ['heart', '💗 Trái tim'],
        ['none', 'Không']
      ]) +
      grp('Mi mắt', 'lash', [
        ['natural', 'Tự nhiên'],
        ['long', 'Cong dài']
      ]) +
      grp('Tàn nhang', 'freckles', [
        [false, 'Không'],
        [true, 'Có']
      ]);
  if (wtab === 'face')
    body = `<p class="muted" style="margin:0 0 10px">"Theo tâm trạng" thì nét mặt đổi theo Check-in. Khi ốm hoặc buồn ngủ, Chibi vẫn tự đổi để nhắc bạn.</p><div class="row">${FACES.map(([v, i, t]) => `<button class="chip" data-look="face" data-lv="${v}" aria-pressed="${L.face === v}">${i} ${t}</button>`).join('')}</div>`;
  if (wtab === 'hair')
    body = `<div class="q" style="margin-top:0"><h3>Kiểu tóc</h3><div class="row">${[
      ['straight', 'Dài thẳng rẽ ngôi'],
      ['wavy', 'Dài xoăn sóng'],
      ['bob', 'Ngắn mái ngố'],
      ['buns', 'Búi hai bên']
    ]
      .map(([k, t]) => `<button class="chip" data-hair="${k}" aria-pressed="${S.hair === k}">${t}</button>`)
      .join(
        ''
      )}</div></div><div class="q"><h3>Màu tóc</h3><div class="row">${HAIRC.map(c => `<button class="sw" data-hc="${c}" style="background:${c}" aria-label="Màu ${c}" aria-pressed="${S.hairColor === c}"></button>`).join('')}</div></div>`;
  const WT = [
    ['outfit', '👗 Trang phục'],
    ['night', '🌙 Đồ ngủ'],
    ['acc', '🎀 Phụ kiện'],
    ['makeup', '💄 Trang điểm'],
    ['face', '😊 Nét mặt'],
    ['hair', '💇‍♀️ Tóc']
  ];
  const SEC = {
    wardrobe: () => `<div class="card"><h2>👗 Phòng thay đồ</h2>
  <div class="mirror">${chibi({ mood: 'calm', outfit: pv, face: L.face === 'auto' ? 'smile' : L.face })}</div>  <div class="wtabs scroll">${WT.map(([k, t]) => `<button data-wt="${k}" aria-pressed="${wtab === k}">${t}</button>`).join('')}</div>
  ${body}</div>
  `,
    season: () => `  <div class="card"><h2>🎨 Giao diện theo mùa</h2><div class="row">${[
      ['auto', '✨ Tự động theo ngày'],
      ['xmas', '🎄 Giáng sinh'],
      ['ny', '🎆 Năm mới'],
      ['tet', '🧧 Tết Nguyên Đán'],
      ['none', 'Tắt']
    ]
      .map(
        ([k, t]) => `<button class="chip" data-theme="${k}" aria-pressed="${(S.theme || 'auto') === k}">${t}</button>`
      )
      .join('')}</div>
  <p class="muted" style="margin:10px 0 0">✨ <b>Tự động</b>: 🎄 Giáng sinh 15/11–26/12 (tuyết rơi, mũ Noel, ca cao nóng) · 🎆 Năm mới 27/12–5/1 (pháo hoa, mũ tiệc, pháo bông, đếm ngược giao thừa) · 🧧 Tết Nguyên Đán từ 3 tuần trước Tết đến mùng 10 (hoa mai hoa đào rơi, áo dài đỏ, lì xì, bánh chưng, lời chúc Tết). Tết năm nay: ${(() => {
    const T = nextTet();
    return T ? pad(T.t.getDate()) + '/' + pad(T.t.getMonth() + 1) + '/' + T.y + ' – ' + canChi(T.y) : 'chưa có lịch';
  })()}.</p>
  <p class="muted" style="margin:6px 0 0">Muốn Chibi không đổi đồ theo mùa: Phòng thay đồ → Phụ kiện → Đồ theo mùa.</p></div>
  `,
    me: () => `  <div class="card"><h2>🧸 Bạn & Chibi</h2>
  <div class="q" style="margin-top:0"><h3>Tên Chibi gọi bạn</h3><input class="inp" id="nm" value="${esc(S.name)}" maxlength="20"></div>
  <div class="q"><h3>Chibi di chuyển</h3><div class="row"><button class="chip" data-roam="1" aria-pressed="${S.roam !== false}">🏃 Chạy lung tung</button><button class="chip" data-roam="0" aria-pressed="${S.roam === false}">🪑 Ngồi yên một góc</button></div><p class="muted" style="margin:6px 0 0">Mẹo: kéo Chibi để bế bé sang chỗ khác.</p></div>
  <div class="q"><h3>🔋 Giảm hiệu ứng (tiết kiệm pin)</h3><div class="row"><button class="chip" data-a="lowFx" aria-pressed="${!!S.lowFx}">${S.lowFx ? '✅ Đang bật' : 'Đang tắt'}</button></div><p class="muted" style="margin:6px 0 0">Tắt tuyết, pháo hoa, hoa rơi, hoa giấy và các chuyển động; Chibi ngồi yên một góc. Nên bật khi máy yếu pin hoặc thấy máy nóng.</p></div>
  <div class="q"><h3>Âm thanh Chibi</h3><div class="row"><button class="chip" data-snd="1" aria-pressed="${S.sound !== false}">🔊 Bật (tiếng ực ực khi uống nước)</button><button class="chip" data-snd="0" aria-pressed="${S.sound === false}">🔇 Tắt</button></div></div>
  <div class="q"><h3>Giờ đi ngủ mục tiêu</h3><input class="inp" type="time" id="bt" value="${S.bedTarget}"></div></div>
  `,
    remind: () => `  <div class="card"><h2>🔔 Nhắc nhở</h2>
  <p class="muted" style="margin:0 0 6px">App web trên iPhone chỉ tự nhắc được khi đang mở. Muốn được báo cả khi app tắt, chọn 📅 (thêm vào app Lịch) hoặc ⏰ (báo thức trong app Đồng hồ).</p>
  <div class="q" style="margin-top:8px"><h3>Mặc định cho việc có hạn chót</h3><div class="row">${LV.map(([k, i, n]) => `<button class="chip sm" data-rdef="${k}" aria-pressed="${S.remindDefault.task === k}">${i} ${n}</button>`).join('')}</div><p class="muted" style="margin:6px 0 0">Từng việc vẫn đổi riêng được trong phần chi tiết.</p></div>
  <div class="q"><h3>Giờ đi ngủ (${S.bedTarget})</h3><div class="row">${LV.slice(0, 3)
    .map(
      ([k, i, n]) =>
        `<button class="chip sm" data-rbed="${k}" aria-pressed="${S.remindDefault.bed === k}">${i} ${n}</button>`
    )
    .join('')}</div>
  ${S.remindDefault.bed === 'chibi' ? '<p class="muted" style="margin:6px 0 0">Trước giờ ngủ 30 phút, nếu đang mở app, Chibi sẽ nhắc bạn khép lại ngày.</p>' : S.remindDefault.bed === 'cal' ? `<div class="okline ${S.bedBell ? '' : 'warn'}" style="margin:8px 0 0"><span>${S.bedBell ? '🔔' : '🔕'}</span><span>${S.bedBell ? 'Đã thêm vào Lịch, báo trước 30 phút mỗi tối' : 'Chưa thêm vào Lịch'}</span></div><button class="btn ghost" style="margin-top:8px" data-a="bedIcs">📅 ${S.bedBell ? 'Thêm lại' : 'Thêm Giờ đi ngủ vào Lịch'} (lặp hằng ngày)</button>` : ''}</div>
  <div class="q"><h3>🎂 Sinh nhật & ngày kỷ niệm</h3><div class="row">${LV.slice(0, 3)
    .map(
      ([k, i, n]) =>
        `<button class="chip sm" data-bdlv="${k}" aria-pressed="${S.remindDefault.bday === k}">${i} ${n}</button>`
    )
    .join(
      ''
    )}</div>${S.remindDefault.bday !== 'none' ? `<div class="row" style="margin-top:8px">${BLEADS.map(([v, n]) => `<button class="chip sm" data-bdlead="${v}" aria-pressed="${S.remindDefault.bdayLead === v}">${n}</button>`).join('')}</div>` : ''}<p class="muted" style="margin:6px 0 0">${S.remindDefault.bday === 'cal' ? 'Mỗi người thêm vào Lịch một lần là năm nào iPhone cũng báo (9:00 sáng). Vào đúng ngày, Chibi vẫn chúc mừng trong app.' : S.remindDefault.bday === 'chibi' ? 'Chibi nhắc khi bạn mở app.' : 'Chibi vẫn đội mũ tiệc vào ngày sinh nhật, nhưng không nhắc.'}</p></div>
  <div class="q"><h3>💌 Lịch hẹn</h3><div class="row">${LV.slice(0, 3)
    .map(
      ([k, i, n]) =>
        `<button class="chip sm" data-aplv="${k}" aria-pressed="${S.remindDefault.appt === k}">${i} ${n}</button>`
    )
    .join(
      ''
    )}</div><p class="muted" style="margin:6px 0 0">Mặc định báo trước 1 giờ. Từng lịch hẹn vẫn đổi riêng được.</p></div>
  <p class="muted" style="margin:12px 0 0">💡 Ngày Lười Biếng (đang ốm hoặc năng lượng ≤ 2): Chibi tạm không nhắc việc. Sắp có: Trung tâm nhắc nhở, Giờ yên tĩnh, Phím tắt "Cozy Nhắc" để tạo báo thức một chạm.</p></div>
  `,
    data: () => `  ${dataCard()}
  `,
    install: () => `  ${standalone() ? '' : `<div class="card"><h2>📲 Cài lên màn hình chính</h2>${installHow()}</div>`}
  `,
    demo: () => `  <div class="card demo"><h2>🧪 Xem thử trạng thái</h2><p class="muted" style="margin:0 0 10px">Xem trước các trạng thái mà không cần đợi đến giờ.</p><div class="row"><button class="btn ghost" data-a="demoNight">${demoNight ? '☀️ Về ban ngày' : '🌙 Thử Giờ đi ngủ'}</button></div>
  <h3 style="font-size:15px;margin:14px 0 8px">Hoạt động của Chibi</h3><p class="muted" style="margin:0 0 8px">Bình thường bé tự chọn theo tâm trạng và thể trạng hôm nay. Bấm để xem trước:</p><div class="row">${Object.keys(
    ACTNAME
  )
    .map(k => `<button class="chip" data-act="${k}">${ACTNAME[k]}</button>`)
    .join('')}</div></div>
  `,
    water: () => {
      const w = S.water,
        r = waterRec();
      return `<div class="card"><h2>💧 Uống nước mỗi ngày</h2>
  <div class="q" style="margin-top:4px"><h3>Mục tiêu</h3><div class="stepper"><button data-wc="-1" aria-label="Bớt 1 ly">−</button><b>${w.cups} ly</b><button data-wc="1" aria-label="Thêm 1 ly">＋</button></div></div>
  <div class="q"><h3>Dung tích 1 ly</h3><div class="row">${[150, 200, 250, 300, 350, 500].map(n => `<button class="chip sm" data-wml="${n}" aria-pressed="${w.ml === n}">${n} ml</button>`).join('')}</div></div>
  <div class="okline" style="margin-top:12px"><span>💧</span><span>Mỗi ngày: <b>${w.cups} ly × ${w.ml} ml = ${fmtL(w.cups * w.ml)}</b></span></div>
  <button class="chip" data-a="wAuto" aria-pressed="${w.auto}">Tự cộng thêm 500 ml vào ngày tập và ngày trời nóng</button></div>
  <div class="card"><h2>🧮 Gợi ý theo cơ thể</h2>
  <p class="muted" style="margin:0 0 8px">Cách tính phổ biến: <b>30–35 ml cho mỗi kg cân nặng</b>, cộng thêm khoảng 350 ml cho mỗi 30 phút vận động. Các khuyến nghị chính thức không dùng chiều cao nên app chỉ hỏi cân nặng.</p>
  <div class="q"><h3>Cân nặng (kg)</h3><input class="inp" type="number" inputmode="decimal" id="wkg" value="${esc(w.weight)}" min="25" max="250" step="0.5" placeholder="vd: 50" style="max-width:140px"></div>
  <div class="q"><h3>Vận động mỗi ngày</h3><div class="row">${WACT.map(([k, n]) => `<button class="chip sm" data-wact="${k}" aria-pressed="${w.activity === k}">${n}</button>`).join('')}</div></div>
  ${r ? `<div class="okline" style="margin-top:12px"><span>✨</span><span>Gợi ý: khoảng <b>${fmtL(r.lo)} – ${fmtL(r.hi)}</b> mỗi ngày ≈ <b>${r.cups} ly ${w.ml} ml</b></span></div><button class="btn" data-a="wUse" ${r.cups === w.cups ? 'disabled' : ''}>${r.cups === w.cups ? 'Đang dùng mức gợi ý ✓' : 'Dùng gợi ý này'}</button>` : '<p class="muted">Nhập cân nặng để xem gợi ý.</p>'}
  <p class="muted" style="margin:12px 0 0">Tham khảo: Cơ quan An toàn Thực phẩm châu Âu (EFSA) khuyến nghị tổng lượng nước khoảng 2,0 lít/ngày cho nữ và 2,5 lít cho nam, tính cả nước từ thức ăn. Con số "8 ly mỗi ngày" không có cơ sở khoa học. Cơn khát và màu nước tiểu (vàng nhạt là ổn) cũng là cách theo dõi tốt.</p>
  <div class="tip">⚠️ Nếu bạn có bệnh tim, thận, gan, đang mang thai, hoặc được bác sĩ dặn hạn chế/tăng lượng nước, hãy theo chỉ định của bác sĩ.</div></div>`;
    },
    habits: () => habitsPage(),
    todaycards:
      () => `<div class="card"><h2>🏠 Tab Hôm nay</h2><p class="muted" style="margin:0 0 8px">Bật/tắt và sắp xếp thứ tự các thẻ. Thẻ hệ thống (cài app, nhắc sao lưu, giờ đi ngủ, Ngày Lười Biếng) vẫn tự hiện khi cần.</p>
  ${cardOrder()
    .map((k, i, a) => {
      const c = TCARDS.find(x => x[0] === k),
        on = cardOn(k);
      return `<div class="corow ${on ? '' : 'off'}"><span class="si">${c[1]}</span><span class="stx"><b>${c[2]}</b></span><button class="xbtn" data-cmove="${k}:-1" ${i ? '' : 'disabled'} aria-label="Đưa ${c[2]} lên">▲</button><button class="xbtn" data-cmove="${k}:1" ${i < a.length - 1 ? '' : 'disabled'} aria-label="Đưa ${c[2]} xuống">▼</button><button class="chip sm" data-ctog="${k}" aria-pressed="${on}">${on ? 'Hiện' : 'Ẩn'}</button></div>`;
    })
    .join('')}
  <button class="chip sm" data-a="cReset" style="margin-top:12px">Về mặc định</button></div>`,
    about:
      () => `  <div class="card"><h2>💝 Giới thiệu & Ghi công</h2><p class="muted" style="margin:6px 0">Cozy Life OS là app cá nhân, mọi dữ liệu nằm trên máy bạn. App dùng lại các thư viện mã nguồn mở sau (đã được kiểm tra không gửi dữ liệu đi đâu):</p>
  <ul class="muted credits"><li><b>canvas-confetti</b> – hiệu ứng hoa giấy · Kiril Vatev · giấy phép ISC</li><li><b>free-exercise-db</b> – dữ liệu bài tập gốc · yuhonas · Unlicense (công cộng); tên & mô tả tiếng Việt viết riêng</li><li><b>Everkinetic</b> – hình tư thế bài tập · Greg Priday & cộng đồng (github.com/everkinetic/data) · <a href="https://creativecommons.org/licenses/by-sa/4.0/deed.vi" target="_blank" rel="noopener">CC BY-SA 4.0</a> · chỉ nén dung lượng, không sửa nội dung hình</li><li><b>body-highlighter</b> – hình cơ thể tô nhóm cơ · GV79 & alahaxe · giấy phép MIT</li><li><b>Quicksand</b> & <b>Nunito</b> – phông chữ · SIL Open Font License</li></ul></div>
  <p class="muted" style="text-align:center;margin:18px 0 6px">Cozy Life OS · phiên bản <span id="ver">${APPVER}</span></p><div class="row" style="justify-content:center"><button class="chip sm" data-a="checkUpd">🔄 Kiểm tra bản mới</button></div>
  `
  };
  if (setPage && SEC[setPage])
    return `<div class="subhead"><button class="backbtn" data-sp="">‹ Cài đặt</button></div>` + SEC[setPage]();
  return settingsHub();
}
function settingsHub() {
  const bd = backupDue(),
    ds = S.lastBackup ? daysSince(S.lastBackup) : null;
  const G = [
    [
      'Chibi',
      [
        ['wardrobe', '👗', 'Phòng thay đồ', 'Trang phục, đồ ngủ, phụ kiện, trang điểm, tóc'],
        [
          'me',
          '🧸',
          'Bạn & Chibi',
          'Tên: ' +
            esc(S.name) +
            ' · ngủ lúc ' +
            S.bedTarget +
            ' · ' +
            (S.roam === false ? 'ngồi yên' : 'chạy lung tung')
        ],
        [
          'season',
          '🎨',
          'Giao diện theo mùa',
          { auto: 'Tự động', xmas: '🎄 Giáng sinh', ny: '🎆 Năm mới', tet: '🧧 Tết', none: 'Tắt' }[S.theme || 'auto'] +
            (S.theme === 'auto' || !S.theme
              ? season()
                ? ' · đang: ' + { xmas: '🎄 Giáng sinh', ny: '🎆 Năm mới', tet: '🧧 Tết' }[season()]
                : ''
              : '')
        ]
      ]
    ],
    [
      'Sức khỏe',
      [
        ['habits', '🌱', 'Thói quen', S.habits.map(h => h.i).join(' ') + ' · ' + S.habits.length + ' thói quen'],
        [
          'water',
          '💧',
          'Uống nước',
          S.water.cups + ' ly × ' + S.water.ml + ' ml = ' + fmtL(S.water.cups * S.water.ml) + ' mỗi ngày'
        ]
      ]
    ],
    [
      'Ứng dụng',
      [
        ['todaycards', '🏠', 'Tab Hôm nay', cardOrder().filter(cardOn).length + '/' + TCARDS.length + ' thẻ đang hiện'],
        [
          'remind',
          '🔔',
          'Nhắc nhở',
          'Việc có hạn: ' +
            lvInfo(S.remindDefault.task)[1] +
            ' ' +
            lvInfo(S.remindDefault.task)[2] +
            ' · Giờ ngủ: ' +
            lvInfo(S.remindDefault.bed)[1]
        ],
        [
          'data',
          '💾',
          'Dữ liệu & sao lưu',
          S.lastBackup ? 'Sao lưu lần cuối: ' + (ds ? ds + ' ngày trước' : 'hôm nay') : 'Chưa sao lưu lần nào',
          bd
        ],
        ...(standalone()
          ? []
          : [['install', '📲', 'Cài lên màn hình chính', 'Mở như app, dùng được khi không có mạng']])
      ]
    ],
    [
      'Khác',
      [
        ['demo', '🧪', 'Xem thử trạng thái', 'Giờ đi ngủ, các hoạt động của Chibi'],
        ['about', '💝', 'Giới thiệu & Ghi công', 'Thư viện mã nguồn mở và giấy phép']
      ]
    ]
  ];
  return (
    G.map(
      ([t, rows]) =>
        `<div class="card setgroup"><h3 class="sgh">${t}</h3>${rows.map(([k, i, n, sub, warn]) => `<button class="setrow2" data-sp="${k}"><span class="si">${i}</span><span class="stx"><b>${n}</b><i class="${warn ? 'warnt' : ''}">${warn ? '⚠️ ' : ''}${sub}</i></span><span class="chev">›</span></button>`).join('')}</div>`
    ).join('') +
    `<p class="muted" style="text-align:center;margin:18px 0 6px">Cozy Life OS · phiên bản <span id="ver">${APPVER}</span></p><div class="row" style="justify-content:center"><button class="chip sm" data-a="checkUpd">🔄 Kiểm tra bản mới</button></div>`
  );
}

/* ===== src/11-render-sheets-backup.js ===== */
let fxSeason = '?',
  fxTimer = 0;
function buildFx() {
  const se = calm() ? null : season();
  if (se === fxSeason) return;
  fxSeason = se;
  const box = $('#snow');
  box.innerHTML = '';
  clearInterval(fxTimer);
  if (se === 'xmas')
    for (let i = 0; i < 30; i++) {
      const f = document.createElement('i'),
        z = 3 + Math.random() * 6;
      f.className = 'flake';
      f.style.cssText = `left:${Math.random() * 100}%;width:${z}px;height:${z}px;animation-duration:${8 + Math.random() * 10}s;animation-delay:${-Math.random() * 18}s;opacity:${0.5 + Math.random() * 0.5}`;
      box.appendChild(f);
    }
  if (se === 'tet')
    for (let i = 0; i < 22; i++) {
      const f = document.createElement('i'),
        z = 8 + Math.random() * 8,
        mai = Math.random() < 0.5;
      f.className = 'petal';
      f.style.cssText = `left:${Math.random() * 100}%;width:${z}px;height:${z}px;background:${mai ? '#FFD24D' : '#FFB3C6'};animation-duration:${9 + Math.random() * 9}s;animation-delay:${-Math.random() * 18}s;opacity:${0.6 + Math.random() * 0.4}`;
      box.appendChild(f);
    }
  if (se === 'ny') {
    const burst = () => {
      if (document.hidden || !Element.prototype.animate) return;
      const x = 10 + Math.random() * 80,
        y = 6 + Math.random() * 26,
        col = ['#F2B544', '#FF9EB5', '#8FD0F2', '#A8E6CF', '#FFFFFF'][Math.floor(Math.random() * 5)];
      for (let i = 0; i < 16; i++) {
        const d = document.createElement('i');
        d.className = 'fw';
        d.style.cssText = `left:${x}%;top:${y}%;background:${col};color:${col}`;
        box.appendChild(d);
        const a = (i / 16) * Math.PI * 2,
          r = 38 + Math.random() * 26;
        d.animate(
          [
            { transform: 'translate(0,0) scale(1)', opacity: 1 },
            { transform: `translate(${Math.cos(a) * r}px,${Math.sin(a) * r + 20}px) scale(.3)`, opacity: 0 }
          ],
          { duration: 1300, easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'forwards' }
        ).onfinish = () => d.remove();
      }
    };
    setTimeout(burst, 600);
    fxTimer = setInterval(burst, 3400);
  }
}
const NYW = [
  'Năm mới bình an, vui khỏe và thật nhiều niềm vui nhỏ!',
  'Một năm mới nhẹ nhàng, đủ đầy và dịu dàng với chính mình.',
  'Chúc năm mới: ngủ đủ, uống đủ nước, cười thật nhiều.'
];
const TETW_Q = [
  'An khang thịnh vượng.',
  'Vạn sự như ý.',
  'Năm mới bình an, sức khỏe dồi dào.',
  'Tấn tài tấn lộc, phúc lộc đầy nhà.',
  'Xuân an khang, Tết đoàn viên.',
  'Cung chúc tân xuân, vạn sự cát tường.'
];
function seasonGreet() {
  const se = season();
  if (!se || se === 'xmas') return;
  const n = new Date(),
    T = nextTet();
  S.fxShown = S.fxShown || {};
  let key = null;
  if (se === 'ny' && n.getMonth() === 0 && n.getDate() === 1) key = 'ny' + n.getFullYear();
  if (se === 'tet' && T && T.diff === 0) key = 'tet' + T.y;
  if (!key || S.fxShown[key]) return;
  S.fxShown[key] = true;
  save();
  setTimeout(() => {
    celebrate(3);
    if (!dnd()) startAct(se === 'ny' ? 'sparkler' : 'lixi');
    say(
      se === 'ny'
        ? '🎆 Chúc mừng năm mới ' + n.getFullYear() + ', ' + S.name + '!'
        : '🧧 Chúc mừng năm mới! Xuân ' + canChi(T.y) + ' an khang thịnh vượng nha ' + S.name + '!',
      7000
    );
  }, 1500);
}
const APPVER = '2026.11.18-10';
const TABS = [
  ['today', '☀️', 'Hôm nay'],
  ['tasks', '📋', 'Việc'],
  ['people', '💌', 'Người thương'],
  ['health', '💪', 'Sức khỏe'],
  ['set', '⚙️', 'Cài đặt']
];
function render() {
  const n = new Date(),
    h = n.getHours();
  const keepPw = $('#bkpw') ? $('#bkpw').value : '';
  const openD = [...document.querySelectorAll('details.more')].map(d => d.open);
  $('#hello').textContent =
    (isNight()
      ? 'Chúc buổi tối'
      : h < 11
        ? 'Chào buổi sáng'
        : h < 14
          ? 'Chào buổi trưa'
          : h < 18
            ? 'Chào buổi chiều'
            : 'Chào buổi tối') +
    ', ' +
    S.name;
  $('#xpill').textContent = seasonLabel();
  $('#date').textContent = n.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' });
  $('#tabs').innerHTML = TABS.map(
    ([k, i, t]) => `<button data-tab="${k}" aria-current="${tab === k}"><span>${i}</span>${t}</button>`
  ).join('');
  const keepT = $('#tnew') ? $('#tnew').value : '';
  $('#view').innerHTML =
    tab === 'today'
      ? viewToday()
      : tab === 'health'
        ? viewHealth()
        : tab === 'set'
          ? viewSettings()
          : tab === 'tasks'
            ? viewTasks()
            : viewPeople();
  if ($('#bkpw')) $('#bkpw').value = keepPw;
  if ($('#tnew')) $('#tnew').value = keepT;
  document.querySelectorAll('details.more').forEach((d, i) => {
    if (openD[i]) d.open = true;
  });
  drawChibi();
  save();
}

/* ---------- Sheets ---------- */
let F = {};
function openSheet(html) {
  $('#sheet').innerHTML = html;
  $('#sheet').dataset.ex = '';
  $('#sheet').scrollTop = 0;
  $('#sheetbg').classList.add('on');
}
function closeSheet() {
  $('#sheetbg').classList.remove('on');
}
const chips = (name, arr, v) =>
  `<div class="row">${arr.map(([k, i, t]) => `<button class="chip" data-f="${name}" data-v="${k}" aria-pressed="${v === k}">${i} ${t}</button>`).join('')}</div>`;
function checkinSheet() {
  const c = today().checkin || {};
  F = {
    mood: c.mood,
    weather: c.weather,
    energy: c.energy || 3,
    body: c.body || 'ok',
    q: c.q || 4,
    sore: (c.sore || []).slice()
  };
  const pb = S.pendingBed ? new Date(S.pendingBed) : null;
  openSheet(`<h2>🌤️ Check-in buổi sáng</h2><p class="muted" style="margin:0">Chọn nhanh thôi, không cần nghĩ nhiều.</p>
  <div class="q"><h3>Tâm trạng</h3>${chips('mood', MOODS, F.mood)}</div>
  <div class="q"><h3>Thời tiết</h3>${chips('weather', WEATHER, F.weather)}</div>
  <div class="q"><h3>Năng lượng</h3>${chips(
    'energy',
    [1, 2, 3, 4, 5].map(n => [n, '🔋', n]),
    F.energy
  )}</div>
  <div class="q"><h3>Cơ thể</h3>${chips('body', BODY, F.body)}
   <div id="soreBox" class="${F.body === 'sore' ? '' : 'hide'}" style="margin-top:10px"><p class="muted" style="margin:0 0 6px">Đau ở đâu? (chọn được nhiều)</p><div class="row">${GG.slice(
     0,
     9
   )
     .map(([k, n]) => `<button class="chip sm" data-sore="${k}" aria-pressed="${F.sore.includes(k)}">${n}</button>`)
     .join('')}</div></div></div>
  <div class="q"><h3>Giấc ngủ đêm qua</h3>${pb ? `<p class="muted" style="margin:0 0 8px">Bạn đi ngủ lúc <b>${hm(pb)}</b>. Bạn dậy lúc mấy giờ?</p>` : `<p class="muted" style="margin:0 0 8px">Tối qua chưa bấm "Đi ngủ". Nhập bù nếu nhớ:</p><input class="inp" type="time" id="bedIn" style="margin-bottom:8px" aria-label="Giờ đi ngủ">`}
   <input class="inp" type="time" id="wakeIn" value="${hm(new Date())}" aria-label="Giờ dậy">
   <div class="stars row" style="margin-top:6px" aria-label="Chất lượng giấc ngủ">${[1, 2, 3, 4, 5].map(n => `<button data-star="${n}" class="${n <= F.q ? 'on' : ''}" aria-label="${n} sao">⭐</button>`).join('')}</div></div>
  <button class="btn full" style="margin-top:20px" data-a="saveCheckin">Xong ✨</button>`);
}
function eveningSheet() {
  F = { emood: null };
  const p = PROMPTS[new Date().getDate() % PROMPTS.length];
  openSheet(`<h2>🌙 Khép lại ngày hôm nay</h2>
  <div class="q"><h3>Tâm trạng cuối ngày</h3>${chips('emood', MOODS, null)}</div>
  <div class="q"><h3>Hôm nay thế nào?</h3><p class="muted" style="margin:0 0 8px">Gợi ý: ${p}</p><textarea class="inp" id="line" rows="3" maxlength="500" placeholder="Một dòng thôi cũng được…"></textarea></div>
  <button class="btn full" style="margin-top:20px" data-a="goSleep">😴 Đi ngủ</button>`);
}

function askLazy() {
  const c = today().checkin || {};
  showNudge({
    text:
      (c.body === 'sick' ? 'Thương ' + S.name + ' quá 🤒 ' : 'Hôm nay năng lượng hơi thấp 🔋 ') +
      'Hôm nay mình nghỉ chút nha? Mình sẽ ẩn bớt việc không gấp, tạm không nhắc việc và đổi buổi tập thành giãn cơ 10 phút.',
    btns: ['🛋️ Ừ, nghỉ chút', 'Không, mình ổn'],
    onBtn: i => setLazy(i === 0)
  });
}
function setLazy(on) {
  const d = today();
  d.lazy = on;
  render();
  say(
    on ? 'Ngày Lười Biếng bắt đầu! Nghỉ ngơi thật tốt nha ' + S.name + ' 🛋️' : 'Ok, mình cùng cố gắng nhẹ nhàng nhé 💪',
    3500
  );
}
function saveCheckin() {
  const d = today();
  const w = $('#wakeIn').value;
  d.checkin = { mood: F.mood || 'calm', weather: F.weather || 'sun', energy: +F.energy, body: F.body, q: F.q };
  if (F.body === 'sore' && F.sore.length) d.checkin.sore = F.sore.slice();
  let bed = S.pendingBed ? new Date(S.pendingBed) : null;
  const bi = $('#bedIn');
  if (!bed && bi && bi.value) {
    bed = new Date();
    const [h, m] = bi.value.split(':').map(Number);
    bed.setHours(h, m, 0, 0);
    if (h >= 12) bed.setDate(bed.getDate() - 1);
  }
  if (bed && w) {
    const wk = new Date();
    const [h, m] = w.split(':').map(Number);
    wk.setHours(h, m, 0, 0);
    if (wk <= bed) wk.setDate(wk.getDate() + 1);
    if ((wk - bed) / 36e5 < 16) {
      S.sleeps.push({ bed: bed.toISOString(), wake: wk.toISOString(), q: F.q });
    }
  }
  S.pendingBed = null;
  closeSheet();
  tab = 'today';
  render();
  const c = d.checkin;
  if ((c.body === 'sick' || c.energy <= 2) && d.lazy === undefined) return setTimeout(askLazy, 900);
  say(
    c.body === 'sick'
      ? 'Thương ' + S.name + ' quá, hôm nay nghỉ ngơi nhiều nha 🤒'
      : c.mood === 'happy'
        ? 'Yayy, một ngày tuyệt vời đang chờ ' + S.name + '!'
        : c.mood === 'stress'
          ? 'Không sao, mình cùng làm từng chút một nhé 🔥'
          : 'Cảm ơn ' + S.name + ' đã check-in 💛'
  );
}
function goSleep() {
  const d = today();
  d.evening = { mood: F.emood, line: ($('#line').value || '').trim() };
  {
    const n = new Date(),
      [bh, bm] = S.bedTarget.split(':').map(Number);
    const nm = n.getHours() * 60 + n.getMinutes();
    if (n.getHours() >= 12 && nm <= bh * 60 + bm) d.sleptEarly = true;
    else delete d.sleptEarly;
  }
  S.pendingBed = new Date().toISOString();
  closeSheet();
  flush();
  clearTimeout(P.t);
  $('#chibiSleep').innerHTML = chibi({ mood: 'sleep', outfit: 'pj', sleep: true });
  $('#gn').textContent = 'Chúc ' + S.name + ' ngủ ngon 🌙';
  $('#gnTime').textContent = 'Đã ghi giờ đi ngủ: ' + hm(new Date());
  $('#sleepcover').classList.add('on');
}

/* ---------- Sao lưu & khôi phục ---------- */
async function doExport(btn) {
  const pw = ($('#bkpw') && $('#bkpw').value) || '';
  if (btn) btn.disabled = true;
  try {
    await flush();
    const obj = await CozyBackup.build(S, pw);
    const name = 'cozy-life-os-' + dk(new Date()) + (pw ? '-khoa' : '') + '.json';
    const blob = new Blob([JSON.stringify(obj, null, pw ? 0 : 1)], { type: 'application/json' });
    let done = false;
    if (isIOS && navigator.canShare) {
      const file = new File([blob], name, { type: 'application/json' });
      if (navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: 'Sao lưu Cozy Life' });
          done = true;
        } catch (e) {
          if (e.name === 'AbortError') {
            if (btn) btn.disabled = false;
            return;
          }
        }
      }
    }
    if (!done) {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = name;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        URL.revokeObjectURL(a.href);
        a.remove();
      }, 4000);
    }
    S.lastBackup = new Date().toISOString();
    render();
    say(
      pw
        ? 'Đã sao lưu có khóa 🔐 Nhớ giữ kỹ mật khẩu nha!'
        : 'Đã sao lưu xong 💾 Cất file ở iCloud/Drive cho chắc nhé!',
      5000
    );
  } catch (e) {
    console.error(e);
    say('Ui, sao lưu chưa được 😣 Thử lại nhé', 4000);
  } finally {
    if (btn) btn.disabled = false;
  }
}

let pendingImport = null;
async function readImport(text, pw) {
  try {
    const r = await CozyBackup.parse(text, pw);
    pendingImport = r;
    confirmImportSheet(r);
  } catch (e) {
    if (e.code === 'needpw' || e.code === 'badpw') {
      pendingImport = { text };
      pwSheet(e.code === 'badpw');
    } else
      openSheet(
        `<h2>😣 Không đọc được file</h2><p class="muted">${e.code === 'newer' ? 'File này được tạo bởi phiên bản Cozy Life mới hơn. Hãy cập nhật app rồi thử lại.' : 'File này không phải file sao lưu của Cozy Life, hoặc đã bị hỏng.'}</p><button class="btn full" data-a="closeSheet">Đóng</button>`
      );
  }
}
function pwSheet(bad) {
  openSheet(
    `<h2>🔐 File có mật khẩu</h2><p class="muted" style="margin:0 0 10px">Nhập mật khẩu bạn đã đặt khi sao lưu.</p><input class="inp" type="password" id="impw" autocomplete="current-password">${bad ? '<p class="err">Mật khẩu chưa đúng, thử lại nhé.</p>' : ''}<div class="row" style="margin-top:16px"><button class="btn" data-a="impw">Mở file</button><button class="btn ghost" data-a="closeSheet">Hủy</button></div>`
  );
  setTimeout(() => $('#impw') && $('#impw').focus(), 50);
}
function confirmImportSheet(r) {
  const a = CozyBackup.summary(r.state),
    b = CozyBackup.summary(S);
  openSheet(`<h2>📥 Khôi phục dữ liệu?</h2>
  <div class="okline"><span>📄</span><span>File sao lưu${r.exportedAt ? ' ngày <b>' + fmtDate(r.exportedAt) + '</b>' : ''}: ${a.tasks} việc, ${a.workouts} buổi tập, ${a.people || 0} người thương, ${a.appts || 0} lịch hẹn, ${a.days} ngày, ${a.sleeps} đêm ngủ, ${a.candies} viên kẹo.</span></div>
  <div class="okline warn"><span>📱</span><span>Dữ liệu đang có trên máy: ${b.tasks} việc, ${b.workouts} buổi tập, ${b.people} người thương, ${b.appts} lịch hẹn, ${b.days} ngày, ${b.sleeps} đêm ngủ, ${b.candies} viên kẹo. Sẽ được <b>thay hết</b> bằng file.</span></div>
  <p class="muted">Yên tâm: app chụp lại dữ liệu hiện tại trước, nếu cần có thể "Quay lại" trong mục Bản chụp tự động.</p>
  <div class="row" style="margin-top:12px"><button class="btn" data-a="doImport">Khôi phục</button><button class="btn ghost" data-a="closeSheet">Hủy</button></div>`);
}
async function replaceState(ns, label) {
  await flush();
  if (hasData(S)) await CozyDB.putSnapshot('safe-' + Date.now(), S, label).catch(() => {});
  const keepLast = S.lastBackup;
  S = Object.assign(DEF(), ns);
  normalize();
  if (!S.lastBackup) S.lastBackup = keepLast;
  await CozyDB.replaceAll(S);
  snaps = null;
  demoNight = false;
}

/* ===== src/12-events.js ===== */
/* ---------- Events ---------- */
document.addEventListener('click', async e => {
  const t = e.target.closest('button');
  if (!t) return;
  if (t.id === 'toast') return;
  if (t.dataset.tab) {
    if (t.dataset.tab === 'set') setPage = null;
    tab = t.dataset.tab;
    render();
    scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }
  if (t.dataset.sp !== undefined) {
    setPage = t.dataset.sp || null;
    render();
    scrollTo({ top: 0 });
    return;
  }
  if (t.dataset.f) {
    e.preventDefault();
    F[t.dataset.f] = isNaN(t.dataset.v) ? t.dataset.v : +t.dataset.v;
    t.parentNode.querySelectorAll('.chip').forEach(b => b.setAttribute('aria-pressed', b === t));
    if (t.dataset.f === 'body' && $('#soreBox')) $('#soreBox').classList.toggle('hide', F.body !== 'sore');
    return;
  }
  if (t.dataset.sore) {
    const k = t.dataset.sore;
    F.sore = F.sore || [];
    F.sore = F.sore.includes(k) ? F.sore.filter(x => x !== k) : F.sore.concat(k);
    t.setAttribute('aria-pressed', F.sore.includes(k));
    return;
  }
  if (t.dataset.cmove) {
    const [k, dir] = t.dataset.cmove.split(':'),
      o = cardOrder(),
      i = o.indexOf(k),
      j = i + +dir;
    if (j < 0 || j >= o.length) return;
    [o[i], o[j]] = [o[j], o[i]];
    S.cardOrder = o;
    render();
    return;
  }
  if (t.dataset.ctog) {
    const k = t.dataset.ctog,
      H = S.cardHidden || [];
    S.cardHidden = H.includes(k) ? H.filter(x => x !== k) : H.concat(k);
    render();
    return;
  }
  if (t.dataset.star) {
    F.q = +t.dataset.star;
    t.parentNode.querySelectorAll('button').forEach(b => b.classList.toggle('on', +b.dataset.star <= F.q));
    return;
  }
  if (t.dataset.w !== undefined) {
    const d = today(),
      i = +t.dataset.w,
      G = waterGoal(),
      was = d.water;
    d.water = d.water === i + 1 ? i : i + 1;
    render();
    if (d.water >= G && was < G) celebrate(1);
    say(
      d.water >= G
        ? 'Đủ ' + G + ' ly rồi! ' + S.name + ' giỏi quá 🎉'
        : 'Thêm 1 ly nữa nè 💧 (' + d.water + '/' + G + ')'
    );
    return;
  }
  if (t.dataset.hb) {
    toggleHabit(t.dataset.hb);
    return;
  }
  if (t.dataset.hdel) {
    if (!t.dataset.sure) {
      t.dataset.sure = '1';
      t.textContent = 'Xóa?';
      return;
    }
    S.habits = S.habits.filter(h => h.id !== t.dataset.hdel);
    render();
    return;
  }
  if (t.dataset.hicon) {
    F.hicon = t.dataset.hicon;
    t.parentNode.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b === t));
    return;
  }
  if (t.dataset.sopen) {
    const [k, id] = t.dataset.sopen.split(':');
    if (k === 'r' || k === 's') schedSheet(k, id);
    else if (k === 't') taskSheet(id);
    else if (k === 'a') apptSheet(id);
    else if (k === 'g') {
      tab = 'health';
      htab = 'gym';
      render();
      scrollTo({ top: 0 });
    } else if (k === 'b') {
      if (isNight()) eveningSheet();
      else say('Đến giờ ngủ, mình sẽ nhắc ' + S.name + ' khép lại ngày nha 🌙', 3000);
    }
    return;
  }
  if (t.dataset.n2t) {
    const n = S.notes.find(x => x.id === t.dataset.n2t);
    if (!n) return;
    S.tasks.push({
      id: uid(),
      title: n.t.slice(0, 140),
      group: S.taskGroup,
      done: false,
      doneAt: null,
      createdAt: new Date().toISOString(),
      due: null,
      dueTime: '',
      link: '',
      note: n.t.length > 140 ? n.t : '',
      subs: []
    });
    S.notes = S.notes.filter(x => x.id !== n.id);
    render();
    if ($('#sheetbg').classList.contains('on')) notesAllSheet();
    say('Đã chuyển thành việc trong ' + gInfo(S.taskGroup)[2] + ' 📋', 3000);
    return;
  }
  if (t.dataset.ndel) {
    if (!t.dataset.sure) {
      t.dataset.sure = '1';
      t.textContent = 'Xóa?';
      return;
    }
    S.notes = S.notes.filter(x => x.id !== t.dataset.ndel);
    render();
    if ($('#sheetbg').classList.contains('on')) notesAllSheet();
    return;
  }
  if (t.dataset.wday) {
    waterDaySheet(t.dataset.wday);
    return;
  }
  if (t.dataset.wdc) {
    const k = t.dataset.k;
    if (k > dk(new Date())) return;
    const d =
      S.days[k] ||
      (k === dk(new Date())
        ? today()
        : (S.days[k] = {
            top3: [
              { t: '', d: false },
              { t: '', d: false },
              { t: '', d: false }
            ],
            water: 0,
            candies: [],
            checkin: null,
            evening: null
          }));
    if (!d.waterGoal && k !== dk(new Date())) {
      d.waterGoal = S.water.cups;
      d.waterMl = S.water.ml;
    }
    d.water = Math.max(0, Math.min(40, (d.water || 0) + +t.dataset.wdc));
    const w = dayWater(k);
    $('#wdn').textContent = w.n + ' ly';
    $('#wdml').textContent = '= ' + fmtL(w.n * w.ml);
    render();
    return;
  }
  if (t.dataset.spgo) {
    tab = 'set';
    setPage = t.dataset.spgo;
    render();
    scrollTo({ top: 0 });
    return;
  }
  if (t.dataset.wc) {
    S.water.cups = Math.max(3, Math.min(20, S.water.cups + +t.dataset.wc));
    render();
    return;
  }
  if (t.dataset.wml) {
    S.water.ml = +t.dataset.wml;
    render();
    return;
  }
  if (t.dataset.wact) {
    S.water.activity = t.dataset.wact;
    render();
    return;
  }
  if (t.dataset.hair) {
    S.hair = t.dataset.hair;
    render();
    return;
  }
  if (t.dataset.hc) {
    S.hairColor = t.dataset.hc;
    render();
    return;
  }
  if (t.dataset.fav) {
    S.fav = t.dataset.fav;
    render();
    say('Bộ "' + OUTFITS[S.fav].n + '" xinh quá đi! 💕');
    return;
  }
  if (t.dataset.nw) {
    S.nightWear = t.dataset.nw;
    render();
    say('Tối nay mặc ' + OUTFITS[S.nightWear].n + ' nha 🌙');
    return;
  }
  if (t.dataset.wt) {
    wtab = t.dataset.wt;
    render();
    return;
  }
  if (t.dataset.look) {
    const k = t.dataset.look;
    let v = t.dataset.lv;
    if (v === 'true') v = true;
    else if (v === 'false') v = false;
    if (k === 'seasonWear') S.seasonWear = v;
    else S.look[k] = v;
    render();
    return;
  }
  if (t.dataset.swap) {
    S.autoSwap = !S.autoSwap;
    render();
    return;
  }
  if (t.dataset.theme) {
    S.theme = t.dataset.theme;
    render();
    const se = season();
    say(
      se === 'xmas'
        ? 'Giáng sinh tới rồi! 🎄 Mình đội mũ Noel nè'
        : se === 'ny'
          ? 'Năm mới rồi! 🎆 Mình đội mũ tiệc nè'
          : se === 'tet'
            ? 'Tết đến rồi! 🧧 Mình mặc áo dài đỏ nè'
            : 'Giao diện bình thường nha 🌷'
    );
    return;
  }
  if (t.dataset.snd) {
    S.sound = t.dataset.snd === '1';
    render();
    if (S.sound) gulp();
    return;
  }
  if (t.dataset.act) {
    startAct(t.dataset.act);
    return;
  }
  if (t.dataset.roam) {
    S.roam = t.dataset.roam === '1';
    render();
    wander();
    return;
  }
  if (t.dataset.snap) {
    const key = t.dataset.snap;
    const sn = await CozyDB.getSnapshot(key);
    if (!sn) return;
    openSheet(
      `<h2>🕰️ Quay lại bản chụp?</h2><p class="muted">Dữ liệu sẽ trở về như lúc <b>${fmtDate(sn.createdAt)}</b> (${Object.keys(sn.state.days || {}).length} ngày, ${(sn.state.sleeps || []).length} đêm ngủ). Dữ liệu hiện tại được chụp lại trước.</p><div class="row" style="margin-top:12px"><button class="btn" data-a="doSnap" data-k="${esc(key)}">Quay lại</button><button class="btn ghost" data-a="closeSheet">Hủy</button></div>`
    );
    return;
  }
  if (t.dataset.topen) {
    taskSheet(t.dataset.topen);
    return;
  }
  if (t.dataset.tstar) {
    toggleStar(t.dataset.tstar);
    render();
    if (t.dataset.insheet) taskSheet(t.dataset.tstar);
    return;
  }
  if (t.dataset.tf) {
    tfilter = t.dataset.tf;
    if (tfilter !== 'all') S.taskGroup = tfilter;
    render();
    return;
  }
  if (t.dataset.tg) {
    S.taskGroup = t.dataset.tg;
    render();
    $('#tnew') && $('#tnew').focus();
    return;
  }
  if (t.dataset.tsg) {
    const tk = taskById(editId);
    if (!tk) return;
    tk.group = t.dataset.tsg;
    t.parentNode.querySelectorAll('.chip').forEach(b => b.setAttribute('aria-pressed', b === t));
    render();
    return;
  }
  if (t.dataset.tquick) {
    const tk = taskById(editId);
    if (!tk) return;
    const q = t.dataset.tquick;
    if (q === 'x') {
      tk.due = null;
      tk.dueTime = '';
    } else {
      const x = new Date();
      x.setDate(x.getDate() + +q);
      tk.due = dk(x);
    }
    $('#tDue').value = tk.due || '';
    $('#tTime').value = tk.dueTime || '';
    bellChanged(tk);
    tk.nudge = {};
    refreshRemind();
    render();
    return;
  }
  if (t.dataset.tlv) {
    const tk = taskById(editId);
    if (!tk) return;
    if (lvl(tk) !== t.dataset.tlv) {
      tk.remind = t.dataset.tlv;
      bellChanged(tk);
      tk.nudge = {};
    }
    refreshRemind();
    render();
    return;
  }
  if (t.dataset.tlead !== undefined) {
    const tk = taskById(editId);
    if (!tk) return;
    if ((tk.lead || 0) !== +t.dataset.tlead) {
      tk.lead = +t.dataset.tlead;
      bellChanged(tk);
    }
    refreshRemind();
    render();
    return;
  }
  if (t.dataset.bell) {
    bellAction(t.dataset.bell);
    return;
  }
  if (t.dataset.nudge) {
    nudgeAction(t.dataset.nudge);
    return;
  }
  if (t.dataset.rdef) {
    S.remindDefault.task = t.dataset.rdef;
    render();
    return;
  }
  if (t.dataset.rbed) {
    S.remindDefault.bed = t.dataset.rbed;
    render();
    return;
  }
  if (t.dataset.htab) {
    htab = t.dataset.htab;
    render();
    return;
  }
  if (t.dataset.gday !== undefined) {
    const d = +t.dataset.gday,
      g = S.gym;
    g.days = g.days.includes(d) ? g.days.filter(x => x !== d) : g.days.concat(d);
    gymBellChanged();
    render();
    return;
  }
  if (t.dataset.ggoal) {
    S.gym.goal = t.dataset.ggoal;
    render();
    return;
  }
  if (t.dataset.geq) {
    S.gym.equip = t.dataset.geq;
    render();
    return;
  }
  if (t.dataset.grest) {
    S.gym.rest = +t.dataset.grest;
    render();
    return;
  }
  if (t.dataset.grem) {
    if (S.gym.remind !== t.dataset.grem) {
      S.gym.remind = t.dataset.grem;
      gymBellChanged();
    }
    render();
    return;
  }
  if (t.dataset.gbell) {
    const k = t.dataset.gbell,
      g = S.gym;
    if (k === 'done') {
      g.bell = true;
      g.oldBell = false;
    } else if (k === 'unset') g.bell = false;
    else if (g.remind === 'cal') {
      deliverIcs('cozy-lich-tap.ics', gymIcs());
      g.bell = true;
      g.oldBell = false;
      save();
      openSheet(
        `<h2>📅 Thêm lịch tập vào Lịch</h2><p class="muted">iPhone sẽ hiện sự kiện "<b>Giờ tập – Cozy Life</b>" lặp lại mỗi tuần. Bấm <b>Thêm vào Lịch</b> là xong, Lịch sẽ báo trước giờ tập 30 phút.</p><p class="muted">Không thấy gì hiện ra? Bấm nút dưới, chọn <b>Lưu vào Tệp</b> rồi mở file trong app Tệp.</p><div class="row" style="margin-top:12px"><button class="btn" data-a="closeSheet">Xong</button><button class="btn ghost" data-a="shareIcs">📤 Gửi file lịch</button></div>`
      );
      render();
      return;
    } else {
      const days = WDORDER.filter(d => g.days.includes(d))
        .map(d => WD[d])
        .join(', ');
      openSheet(
        `<h2>⏰ Đặt báo thức lịch tập</h2><p>Mở app <b>Đồng hồ</b> → <b>Báo thức</b> → <b>＋</b>, đặt lúc <b style="font-size:20px">${gymBellAt()}</b>, mục <b>Lặp lại</b> chọn <b>${days}</b>, nhãn "Đi tập 💪".</p><div class="row" style="margin-top:12px"><a class="btn ghost" href="clock-alarm://">🕰️ Mở app Đồng hồ</a><button class="btn" data-a="gymAlarmDone">👌 Tôi đặt rồi</button></div>`
      );
      return;
    }
    render();
    return;
  }
  if (t.dataset.exinfo) {
    exInfo(t.dataset.exinfo);
    return;
  }
  if (t.dataset.expick) {
    const w = activeWo(),
      id = t.dataset.expick;
    if (!w) {
      exInfo(id);
      return;
    }
    if (w.items.some(it => it.ex === id)) {
      say('Bài này đã có trong buổi tập rồi nè', 2500);
      return;
    }
    {
      const e = exById(id),
        prev = lastSetsOf(id),
        goal = GOALS.find(x => x[0] === S.gym.goal) || GOALS[0];
      w.items.push({
        ex: id,
        target: e.g === 'stretch' ? '30 giây' : goal[2],
        sets: Array.from({ length: e.g === 'stretch' ? 1 : 3 }, (_, i) => {
          const p = prev && prev[Math.min(i, prev.length - 1)];
          return { r: p ? p.r : e.g === 'stretch' ? 30 : parseInt(goal[2]), kg: p ? p.kg : '', f: '', done: false };
        })
      });
    }
    closeSheet();
    render();
    say('Đã thêm ' + exById(id).n + ' 💪', 2500);
    return;
  }
  if (t.dataset.exdel) {
    const id = t.dataset.exdel;
    if (!t.dataset.sure) {
      t.dataset.sure = '1';
      t.textContent = 'Bấm lần nữa để xóa';
      return;
    }
    S.customEx = S.customEx.filter(e => e.id !== id);
    closeSheet();
    render();
    return;
  }
  if (t.dataset.libg) {
    lib.g = t.dataset.libg;
    t.parentNode.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b === t));
    $('#libList').innerHTML = libListHtml();
    return;
  }
  if (t.dataset.wodel !== undefined) {
    const w = activeWo();
    if (!w) return;
    w.items.splice(+t.dataset.wodel, 1);
    render();
    return;
  }
  if (t.dataset.woadd !== undefined) {
    const w = activeWo();
    if (!w) return;
    const it = w.items[+t.dataset.woadd],
      l = it.sets[it.sets.length - 1] || { r: 10, kg: '' };
    it.sets.push({ r: l.r, kg: l.kg, f: '', done: false });
    render();
    return;
  }
  if (t.dataset.wf) {
    const w = activeWo();
    if (!w) return;
    const [i, j, k] = t.dataset.wf.split(':'),
      st = w.items[+i].sets[+j];
    st.f = st.f === k ? '' : k;
    t.parentNode.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b === t && st.f === k));
    save();
    return;
  }
  if (t.dataset.wd) {
    const w = activeWo();
    if (!w) return;
    const [i, j] = t.dataset.wd.split(':').map(Number),
      st = w.items[i].sets[j];
    st.done = !st.done;
    if (st.done) {
      const e = exById(w.items[i].ex) || {};
      if (e.g !== 'stretch') {
        restEnd = Date.now() + S.gym.rest * 1000;
      }
      const all = w.items.every(it => it.sets.every(s => s.done));
      say(
        all
          ? 'Xong hết các set rồi! Bấm Hoàn thành nhé 🎉'
          : ['Tốt lắm! ✅', 'Đẹp! Nghỉ chút rồi tiếp nha', 'Mạnh mẽ quá 💪'][Math.floor(Math.random() * 3)],
        2500
      );
    }
    render();
    return;
  }
  if (t.dataset.wohist) {
    woHistSheet(t.dataset.wohist);
    return;
  }
  if (t.dataset.wohdel) {
    if (!t.dataset.sure) {
      t.dataset.sure = '1';
      t.textContent = 'Bấm lần nữa để xóa';
      return;
    }
    S.workouts = S.workouts.filter(w => w.id !== t.dataset.wohdel);
    closeSheet();
    render();
    return;
  }
  if (t.dataset.gpick) {
    t.setAttribute('aria-pressed', t.getAttribute('aria-pressed') !== 'true');
    return;
  }
  if (t.dataset.subdel) {
    const tk = taskById(editId);
    if (!tk) return;
    tk.subs = (tk.subs || []).filter(x => x.id !== t.dataset.subdel);
    $('#subs').innerHTML = subsHtml(tk);
    render();
    return;
  }
  if (t.dataset.plen) {
    S.pomoLen = +t.dataset.plen;
    const p = pomoState();
    if (!p.endAt && p.mode === 'focus') p.left = pomoLen('focus');
    render();
    return;
  }
  if (t.dataset.psnd) {
    S.pomoSound = t.dataset.psnd;
    if (focusing()) startNoise();
    render();
    return;
  }
  if (t.dataset.pomotask) {
    pomoState().taskId = t.dataset.pomotask;
    closeSheet();
    editId = null;
    tab = 'tasks';
    render();
    const pc = document.querySelector('.pomo');
    pc && pc.scrollIntoView({ behavior: 'smooth', block: 'center' });
    say('Chọn xong rồi, bấm Bắt đầu nhé 🍅', 3000);
    return;
  }
  const a = t.dataset.a;
  if (!a) return;
  if (a === 'lazyOn') {
    setLazy(true);
    return;
  }
  if (a === 'lazyOff') {
    setLazy(false);
    return;
  }
  if (a === 'lazyAll') {
    showAllLazy = !showAllLazy;
    render();
    return;
  }
  if (a === 'lowFx') {
    S.lowFx = !S.lowFx;
    render();
    wander();
    say(S.lowFx ? 'Mình ngồi yên một góc cho đỡ tốn pin nha 🔋' : 'Hihi, mình lại được chạy nhảy rồi 🏃', 3000);
    return;
  }
  if (a === 'cReset') {
    S.cardOrder = [];
    S.cardHidden = [];
    render();
    return;
  }
  if (a === 'hReset') {
    HDEF().forEach(x => {
      if (!S.habits.some(h => h.id === x.id)) S.habits.push(x);
    });
    render();
    return;
  }
  if (a === 'schedAdd') {
    schedSheet();
    return;
  }
  if (a === 'schedSave') {
    const ti = ($('#sTitle').value || '').trim(),
      tm = $('#sT').value;
    if (!ti || !tm) {
      (!ti ? $('#sTitle') : $('#sT')).focus();
      return;
    }
    if (t.dataset.k) {
      const [k, id] = t.dataset.k.split(':');
      if (k === 'r') S.routine = S.routine.filter(r => r.id !== id);
      else today().sched = (today().sched || []).filter(x => x.id !== id);
    }
    if (F.rep) S.routine.push({ id: uid(), t: tm, title: ti });
    else (today().sched = today().sched || []).push({ id: uid(), t: tm, title: ti, done: false });
    closeSheet();
    render();
    say('Đã thêm vào thời gian biểu 🕒', 2500);
    return;
  }
  if (a === 'schedDel') {
    const [k, id] = t.dataset.k.split(':');
    if (!t.dataset.sure) {
      t.dataset.sure = '1';
      t.textContent = k === 'r' ? 'Xóa khỏi mọi ngày?' : 'Bấm lần nữa để xóa';
      return;
    }
    if (k === 'r') S.routine = S.routine.filter(r => r.id !== id);
    else today().sched = (today().sched || []).filter(x => x.id !== id);
    closeSheet();
    render();
    return;
  }
  if (a === 'notesAll') {
    notesAllSheet();
    return;
  }
  if (a === 'goWater') {
    tab = 'health';
    htab = 'water';
    render();
    scrollTo({ top: 0 });
    return;
  }
  if (a === 'waterPlus') {
    today().water++;
    render();
    say('Thêm 1 ly 💧 (' + today().water + ' ly hôm nay)');
    return;
  }
  if (a === 'wUse') {
    const r = waterRec();
    if (r) {
      S.water.cups = Math.min(20, r.cups);
      render();
      say('Mục tiêu mới: ' + S.water.cups + ' ly mỗi ngày 💧');
    }
    return;
  }
  if (a === 'wAuto') {
    S.water.auto = !S.water.auto;
    render();
    return;
  }
  if (a === 'goGym') {
    tab = 'health';
    htab = 'gym';
    render();
    scrollTo({ top: 0 });
  } else if (a === 'woStart') startWorkout(suggest());
  else if (a === 'woPickGroups') groupPickSheet();
  else if (a === 'woStartPicked') {
    const gs = [...document.querySelectorAll('[data-gpick][aria-pressed=true]')].map(b => b.dataset.gpick);
    if (!gs.length) {
      say('Chọn ít nhất 1 nhóm cơ nhé');
      return;
    }
    closeSheet();
    startWorkout(suggest(), gs.slice(0, 4));
  } else if (a === 'woFinish') finishWorkout();
  else if (a === 'woCancel') {
    if (!t.dataset.sure) {
      t.dataset.sure = '1';
      t.textContent = 'Bấm lần nữa để hủy';
      return;
    }
    S.workouts = S.workouts.filter(w => w.end);
    restEnd = 0;
    render();
    wander();
  } else if (a === 'woCancelOk') {
    S.workouts = S.workouts.filter(w => w.end);
    restEnd = 0;
    closeSheet();
    render();
    wander();
  } else if (a === 'restPlus') {
    if (restEnd) restEnd += 30000;
    restTick();
  } else if (a === 'restSkip') {
    restEnd = 0;
    render();
  } else if (a === 'exLib') libSheet(false);
  else if (a === 'exPick') libSheet(true);
  else if (a === 'libMine') {
    lib.mine = !lib.mine;
    t.setAttribute('aria-pressed', lib.mine);
    $('#libList').innerHTML = libListHtml();
  } else if (a === 'exNew') exNewSheet();
  else if (a === 'exSave') {
    const n = ($('#exN').value || '').trim();
    if (!n) {
      $('#exN').focus();
      return;
    }
    (S.customEx = S.customEx || []).push({
      id: 'c_' + uid(),
      n,
      en: '',
      g: F.g,
      sec: [],
      eq: F.eq,
      lv: '',
      d: '',
      tip: ($('#exTip').value || '').trim(),
      custom: true
    });
    closeSheet();
    render();
    say('Đã thêm bài "' + n + '" vào thư viện 📚');
  } else if (a === 'gymAlarmDone') {
    S.gym.bell = true;
    S.gym.oldBell = false;
    closeSheet();
    render();
  } else if (a === 'backTask') {
    taskSheet(editId);
    render();
  } else if (a === 'shareIcs') shareIcs();
  else if (a === 'alarmDone') {
    const tk = taskById(editId);
    if (tk) {
      tk.bell = true;
      tk.oldBell = false;
      tk.bellAsk = null;
    }
    taskSheet(editId);
    render();
    say('Đã đánh dấu 🔔');
  } else if (a === 'bedIcs') {
    deliverIcs('cozy-gio-di-ngu.ics', bedIcs());
    S.bedBell = true;
    render();
    say('Bấm "Thêm vào Lịch" là tối nào iPhone cũng nhắc nha 🌙', 5000);
  } else if (a === 'pomoGo') pomoGo();
  else if (a === 'pomoReset') pomoStop();
  else if (a === 'pomoSkip') pomoStop(pomoState().mode === 'focus' ? 'short' : 'focus');
  else if (a === 'pomoUntask') {
    pomoState().taskId = null;
    render();
  } else if (a === 'tSave') {
    closeSheet();
    editId = null;
  } else if (a === 'tDel') {
    if (!t.dataset.sure) {
      t.dataset.sure = '1';
      t.textContent = 'Bấm lần nữa để xóa hẳn';
      return;
    }
    delTask(editId);
    closeSheet();
    editId = null;
    render();
    say('Đã xóa việc');
  } else if (a === 'clearDone') {
    const L = S.tasks.filter(x => x.done && (tfilter === 'all' || x.group === tfilter));
    if (!t.dataset.sure) {
      t.dataset.sure = '1';
      t.textContent = 'Bấm lần nữa để dọn ' + L.length + ' việc';
      return;
    }
    L.forEach(x => delTask(x.id));
    render();
    say('Dọn sạch sẽ rồi 🧹');
  } else if (a === 'checkin') checkinSheet();
  else if (a === 'saveCheckin') saveCheckin();
  else if (a === 'evening') eveningSheet();
  else if (a === 'goSleep') goSleep();
  else if (a === 'closeSheet') {
    closeSheet();
    pendingImport = null;
    editId = null;
  } else if (a === 'export') doExport(t);
  else if (a === 'import') {
    $('#impf').value = '';
    $('#impf').click();
  } else if (a === 'impw') {
    const pw = $('#impw').value;
    if (!pw || !pendingImport || !pendingImport.text) return;
    t.disabled = true;
    await readImport(pendingImport.text, pw);
  } else if (a === 'doImport') {
    if (!pendingImport || !pendingImport.state) return;
    t.disabled = true;
    await replaceState(pendingImport.state, 'Trước khi khôi phục từ file');
    pendingImport = null;
    closeSheet();
    tab = 'today';
    render();
    wander();
    say('Khôi phục xong rồi! Chào mừng ' + S.name + ' trở lại 💛', 5000);
  } else if (a === 'doSnap') {
    t.disabled = true;
    const sn = await CozyDB.getSnapshot(t.dataset.k);
    if (sn) {
      await replaceState(sn.state, 'Trước khi quay lại bản chụp');
      closeSheet();
      render();
      say('Đã quay lại bản chụp 🕰️');
    }
  } else if (a === 'install') {
    if (installEvt) {
      installEvt.prompt();
      const r = await installEvt.userChoice;
      installEvt = null;
      render();
      if (r.outcome === 'accepted') say('Yay, Cozy Life đã ở trên màn hình chính! 📲');
    }
  } else if (a === 'hideInstall') {
    S.hideInstall = true;
    render();
  } else if (a === 'checkUpd') {
    if (!window.cozyCheckUpdate) {
      say('Trình duyệt này không hỗ trợ tự cập nhật');
      return;
    }
    t.disabled = true;
    t.textContent = 'Đang kiểm tra…';
    try {
      const f = await window.cozyCheckUpdate();
      say(f ? 'Có bản mới! Đang tải về, app sẽ tự mở lại ✨' : 'Bạn đang dùng bản mới nhất rồi 🌷', 4000);
    } catch (e) {
      say('Chưa kiểm tra được, có thể đang không có mạng');
    }
    t.disabled = false;
    t.textContent = '🔄 Kiểm tra bản mới';
  } else if (a === 'demoNight') {
    demoNight = !demoNight;
    render();
    wander();
    say(demoNight ? 'Gần đến giờ ngủ rồi, mình thay pijama nè 🌙' : 'Chào buổi sáng lại nè ☀️');
  } else if (a === 'clearSample') {
    S.sleeps = S.sleeps.filter(x => !x.sample);
    S.sample = false;
    render();
  } else if (a === 'reset') {
    const q = $('#resetQ');
    if (q.classList.contains('hide')) {
      q.classList.remove('hide');
      return;
    }
    await replaceState(DEF(), 'Trước khi xóa hết');
    tab = 'today';
    render();
    say('Làm lại từ đầu nha!');
  }
});
$('#impf').addEventListener('change', async e => {
  const f = e.target.files && e.target.files[0];
  if (!f) return;
  if (f.size > 50 * 1024 * 1024) {
    say('File lớn quá, không giống file sao lưu 🤔');
    return;
  }
  readImport(await f.text());
});
document.addEventListener('change', e => {
  const t = e.target;
  if (t.dataset.t !== undefined) {
    const d = today(),
      x = d.top3[+t.dataset.t],
      tk = x.tid && taskById(x.tid);
    if (tk) setDone(tk, t.checked);
    else x.d = t.checked;
    render();
    const n = d.top3.map(top3Slot).filter(x => x.d && x.t).length;
    if (n === 3 && t.checked) celebrate(2);
    say(
      n === 3
        ? 'Xong cả 3 việc! Ăn mừng thôi 🎆'
        : t.checked
          ? 'Tuyệt vời! Xong một việc rồi ✅'
          : 'Không sao, làm lại sau nhé'
    );
    return;
  }
  if (t.dataset.tt !== undefined) {
    today().top3[+t.dataset.tt].t = t.value.trim();
    save();
    return;
  }
  if (t.dataset.tdone) {
    const tk = taskById(t.dataset.tdone);
    if (!tk) return;
    setDone(tk, t.checked);
    render();
    if (editId) taskSheet(editId);
    say(
      t.checked
        ? ['Xong rồi! Giỏi quá ✅', 'Gạch thêm một việc nè 🎉', 'Tuyệt vời, ' + S.name + '! ✨'][
            Math.floor(Math.random() * 3)
          ]
        : 'Mở lại việc này nha'
    );
    return;
  }
  if (editId && ['tTitle', 'tDue', 'tTime', 'tLink', 'tNote'].includes(t.id)) {
    const tk = taskById(editId);
    if (!tk) return;
    if (t.id === 'tTitle') {
      const v = t.value.trim();
      if (v) tk.title = v;
      else t.value = tk.title;
    }
    if (t.id === 'tDue') tk.due = t.value || null;
    if (t.id === 'tTime') tk.dueTime = t.value || '';
    if (t.id === 'tNote') tk.note = t.value;
    if (t.id === 'tDue' || t.id === 'tTime') {
      bellChanged(tk);
      tk.nudge = {};
      refreshRemind();
    }
    if (t.id === 'tLink') {
      tk.link = t.value.trim();
      render();
      taskSheet(editId);
      return;
    }
    render();
    return;
  }
  if (editId && (t.dataset.sub || t.dataset.subt)) {
    const tk = taskById(editId),
      sb = tk && (tk.subs || []).find(x => x.id === (t.dataset.sub || t.dataset.subt));
    if (!sb) return;
    if (t.dataset.sub) sb.d = t.checked;
    else {
      const v = t.value.trim();
      if (v) sb.t = v;
      else t.value = sb.t;
    }
    $('#subs').innerHTML = subsHtml(tk);
    render();
    return;
  }
  if (t.id === 'nm') {
    S.name = t.value.trim() || 'bạn';
    render();
    return;
  }
  if (t.dataset.sdone) {
    const [k, id] = t.dataset.sdone.split(':'),
      d = today();
    if (k === 'r') {
      d.rdone = d.rdone || {};
      if (t.checked) d.rdone[id] = true;
      else delete d.rdone[id];
    } else if (k === 's') {
      const x = (d.sched || []).find(z => z.id === id);
      if (x) x.done = t.checked;
    } else if (k === 't') {
      const tk = taskById(id);
      if (tk) setDone(tk, t.checked);
    } else if (k === 'a') {
      const ap = apptById(id);
      if (ap) apptDone(ap, t.checked);
    } else {
      t.checked = !t.checked;
      if (k === 'g') {
        tab = 'health';
        htab = 'gym';
        render();
        scrollTo({ top: 0 });
      } else if (isNight()) eveningSheet();
      else say('Đến giờ ngủ hãy bấm "Đi ngủ" nhé 🌙', 3000);
      return;
    }
    render();
    if (t.checked)
      say(['Xong! ✅', 'Đúng giờ ghê 🕒', 'Tuyệt vời ' + S.name + ' ✨'][Math.floor(Math.random() * 3)], 2500);
    return;
  }
  if (t.dataset.hname) {
    const h = S.habits.find(x => x.id === t.dataset.hname),
      v = t.value.trim();
    if (h) {
      if (v) h.n = v;
      else t.value = h.n;
    }
    save();
    return;
  }
  if (t.id === 'wkg') {
    S.water.weight = t.value;
    render();
    return;
  }
  if (t.id === 'gTime' && t.value) {
    S.gym.time = t.value;
    gymBellChanged();
    render();
    return;
  }
  if (t.dataset.wr || t.dataset.wk) {
    const w = activeWo();
    if (!w) return;
    const [i, j] = (t.dataset.wr || t.dataset.wk).split(':').map(Number),
      st = w.items[i] && w.items[i].sets[j];
    if (!st) return;
    const v = t.value === '' ? '' : Math.max(0, +t.value);
    if (t.dataset.wr) st.r = v;
    else st.kg = v;
    save();
    return;
  }
  if (t.id === 'bt' && t.value) {
    S.bedTarget = t.value;
    if (S.remindDefault.bed === 'cal' && S.bedBell) {
      S.bedBell = false;
      say('Nhớ xóa sự kiện Giờ đi ngủ cũ trong Lịch rồi thêm lại nhé', 5000);
    }
    render();
  }
});
document.addEventListener('input', e => {
  if (e.target.id === 'libQ') {
    lib.q = e.target.value;
    $('#libList').innerHTML = libListHtml();
  }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.target.id === 'impw') {
    e.preventDefault();
    const b = document.querySelector('[data-a=impw]');
    b && b.click();
  }
});
document.addEventListener('submit', e => {
  if (e.target.id === 'habitF') {
    e.preventDefault();
    const v = $('#hNew').value.trim();
    if (!v) return;
    S.habits.push({ id: 'h_' + uid(), n: v, i: F.hicon || '📖' });
    $('#hNew').value = '';
    render();
    say('Thêm thói quen "' + v + '" 🌱', 2500);
    return;
  }
  if (e.target.id === 'noteF') {
    e.preventDefault();
    const v = $('#nNew').value.trim();
    if (!v) return;
    S.notes.unshift({ id: uid(), t: v, at: new Date().toISOString() });
    $('#nNew').value = '';
    render();
    $('#nNew').focus();
    say('Ghi lại rồi nè 📝', 2000);
    return;
  }
  if (e.target.id === 'taskF') {
    e.preventDefault();
    const v = $('#tnew').value.trim();
    if (!v) return;
    S.tasks.push({
      id: uid(),
      title: v,
      group: S.taskGroup,
      done: false,
      doneAt: null,
      createdAt: new Date().toISOString(),
      due: null,
      dueTime: '',
      link: '',
      note: '',
      subs: []
    });
    $('#tnew').value = '';
    render();
    $('#tnew').focus();
    say('Đã thêm vào ' + gInfo(S.taskGroup)[2] + ' 📋', 2500);
    return;
  }
  if (e.target.id === 'subF') {
    e.preventDefault();
    const tk = taskById(editId),
      v = $('#subNew').value.trim();
    if (!tk || !v) return;
    (tk.subs = tk.subs || []).push({ id: uid(), t: v, d: false });
    $('#subNew').value = '';
    $('#subs').innerHTML = subsHtml(tk);
    render();
    $('#subNew').focus();
    return;
  }
  if (e.target.id !== 'candyF') return;
  e.preventDefault();
  const v = $('#candy').value.trim();
  if (!v || candyBusy) return;
  candyDrop(v);
});
const dropEmptyPerson = () => {
  const p = personById(pEdit);
  if (p && !p.name && !p.bday && !(p.gifts || []).length && !(p.wish || []).length)
    S.people = S.people.filter(x => x !== p);
  pEdit = null;
  aEdit = null;
};
$('#sheetbg').addEventListener('click', e => {
  if (e.target.id === 'sheetbg') {
    dropEmptyPerson();
    render();
    closeSheet();
    pendingImport = null;
    editId = null;
  }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    dropEmptyPerson();
    closeSheet();
    editId = null;
  }
});

/* ===== src/13-chibi-move.js ===== */
/* ---------- Chibi chạy lung tung ---------- */
const pet = $('#pet'),
  PW = 84,
  PH = 101,
  P = { x: 0, y: 0, t: 0, drag: false, down: null };
const rnd = (a, b) => a + Math.random() * (b - a);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const calm = () => reduce || !!S.lowFx; /* Giảm hiệu ứng: theo máy hoặc theo Cài đặt */
function bounds() {
  const nav = document.querySelector('nav').offsetHeight;
  return { minX: 6, maxX: Math.max(6, innerWidth - PW - 6), minY: 70, maxY: Math.max(70, innerHeight - nav - PH - 2) };
}
function place(x, y, ms) {
  pet.style.transition = ms ? `transform ${ms}ms linear` : 'none';
  pet.style.transform = `translate(${x}px,${y}px)`;
  P.x = x;
  P.y = y;
}
const IDLE = [
  'Lalala~ 🎶',
  '{n} uống nước chưa đó?',
  'Hôm nay mình đi dạo nè!',
  'Hihi 🤭',
  'Có cần mình giúp gì không?',
  'Nhớ vươn vai một chút nha 🙆'
];
function low() {
  const c = today().checkin || {};
  return (
    isNight() ||
    today().lazy === true ||
    c.mood === 'sleepy' ||
    c.body === 'sick' ||
    c.body === 'tired' ||
    (c.energy && c.energy <= 2)
  );
}
function wander() {
  clearTimeout(P.t);
  if (P.drag || nudgeCur) return;
  if (P.act) endAct();
  const b = bounds();
  if (dnd()) {
    pet.classList.remove('walking', 'left');
    pet.classList.add('sitting');
    place(b.maxX - 4, b.maxY, 700);
    drawChibi();
    return;
  }
  if (calm() || S.roam === false) {
    pet.classList.remove('walking');
    place(b.maxX - 6, b.maxY, 600);
    return;
  }
  let tx, ty;
  const lw = low();
  if (lw) {
    ty = Math.random() < 0.85 ? b.maxY : rnd(b.maxY - 160, b.maxY);
    tx = Math.min(b.maxX, Math.max(b.minX, P.x + rnd(-110, 110)));
  } else if (Math.random() < 0.55) {
    ty = b.maxY;
    tx = rnd(b.minX, b.maxX);
  } else {
    tx = rnd(b.minX, b.maxX);
    ty = rnd(b.minY, b.maxY);
  }
  const ms = Math.max(400, (Math.hypot(tx - P.x, ty - P.y) / (lw ? 22 : 75)) * 1000);
  pet.classList.toggle('left', tx < P.x);
  pet.classList.remove('sitting');
  pet.classList.add('walking');
  place(tx, ty, ms);
  P.t = setTimeout(() => {
    pet.classList.remove('walking');
    if (Math.random() < (lw ? 0.4 : 0.75)) startAct();
    else {
      if (!lw && Math.random() < 0.4) say(IDLE[Math.floor(Math.random() * IDLE.length)].replace('{n}', S.name), 3200);
      if (lw) pet.classList.add('sitting');
      P.t = setTimeout(wander, lw ? rnd(6000, 14000) : rnd(1500, 3500));
    }
  }, ms);
}
const ACTS = {
  drink: [
    'Ực ực~ 💧 Mát ghê! {n} uống nước chưa? ({w}/{g} ly) — chạm mình để cụng ly nha',
    'Ực… ực… {n} cũng làm một ngụm đi 💧 ({w}/{g} ly)'
  ],
  boba: ['Trà sữa trân châu ngon quá 🧋'],
  read: ['Đọc sách xíu nè 📖', 'Chương này hay ghê!'],
  phone: ['Lướt lướt xem có gì vui 📱'],
  laptop: ['Gõ gõ… deadline dí quá 😵‍💫', 'Cố lên, sắp xong rồi!'],
  yawn: ['Oáppp~ buồn ngủ ghê 🥱'],
  nap: ['Chợp mắt xíu thôi… 💤'],
  tissue: ['Hắt xììì! 🤧 {n} giữ ấm nha'],
  shiver: ['Lạnh run luôn… 🥶 Nhớ mặc ấm nha'],
  teddy: ['Ôm gấu một chút cho đỡ buồn 🧸', 'Không sao đâu, mình ở đây mà'],
  dance: ['Lalala~ nhảy thôi 💃', 'Hôm nay vui quá đi!'],
  wave: ['Hi {n}! 👋'],
  cocoa: ['Ca cao nóng ấm bụng ghê ☕', 'Mùa đông mà có ly ca cao là nhất!'],
  gift: ['Quà Giáng sinh nè 🎁 Không biết bên trong có gì ta?', 'Còn {x} ngày nữa là Giáng sinh rồi 🎄'],
  snowman: ['Nặn người tuyết nè ⛄', 'Bạn người tuyết này tên gì ta?'],
  stretch: ['Vươn vaiiii~ {n} cũng duỗi người chút nha 🙆'],
  breathe: ['Hít vào… thở ra… 🌬️'],
  lixi: ['Lì xì đầu năm nè 🧧 Chúc {n} an khang thịnh vượng!', 'Mở bao lì xì xem có gì nào 🧧'],
  banhchung: ['Bánh chưng xanh nè 🟩 Tết đến rồi!', 'Gói bánh chưng đón Tết nha {n}'],
  sparkler: ['Pháo bông lấp lánh ✨ Năm mới vui vẻ nha {n}!', 'Đếm ngược cùng mình nào 🎆']
};
const ACTNAME = {
  drink: '💧 Uống nước',
  cocoa: '☕ Ca cao nóng',
  gift: '🎁 Mở quà',
  snowman: '⛄ Nặn người tuyết',
  boba: '🧋 Trà sữa',
  read: '📖 Đọc sách',
  phone: '📱 Lướt điện thoại',
  laptop: '💻 Chạy deadline',
  yawn: '🥱 Ngáp',
  nap: '💤 Chợp mắt',
  tissue: '🤧 Hắt xì',
  sparkler: '🎆 Pháo bông',
  lixi: '🧧 Lì xì',
  banhchung: '🟩 Bánh chưng',
  shiver: '🥶 Run lạnh',
  teddy: '🧸 Ôm gấu',
  dance: '💃 Nhảy',
  wave: '👋 Vẫy tay',
  stretch: '🙆 Vươn vai',
  breathe: '🌬️ Hít thở'
};
let lastDrink = 0;
function pickAct() {
  const d = today(),
    c = d.checkin || {},
    w = {};
  const add = (k, n) => (w[k] = (w[k] || 0) + n);
  add('wave', 1);
  add('read', 1);
  add('phone', 1);
  if (isNight()) {
    add('yawn', 3);
    add('nap', 2);
    add('read', 2);
  }
  (
    ({
      happy: () => {
        add('dance', 3);
        add('boba', 2);
        add('wave', 2);
      },
      calm: () => {
        add('read', 2);
        add('phone', 2);
        add('stretch', 1);
        add('boba', 1);
      },
      sleepy: () => {
        add('yawn', 3);
        add('nap', 3);
        add('stretch', 1);
      },
      stress: () => {
        add('laptop', 3);
        add('breathe', 3);
        add('stretch', 1);
      },
      sad: () => {
        add('teddy', 4);
        add('breathe', 1);
      }
    })[c.mood] ||
    (() => {
      add('read', 1);
      add('stretch', 1);
    })
  )();
  if (c.body === 'sick') {
    Object.keys(w).forEach(k => (w[k] = k === 'read' ? 1 : 0));
    add('tissue', 3);
    add('shiver', 3);
    add('nap', 2);
  }
  if (c.body === 'tired') {
    add('nap', 2);
    add('yawn', 2);
  }
  if (c.body === 'sore') add('stretch', 4);
  if (c.weather === 'cold' && c.body !== 'sick') add('shiver', 1);
  if (isXmas()) {
    add('cocoa', 2);
    if (c.body !== 'sick') {
      add('gift', 1);
      add('snowman', 1);
    }
  }
  if (season() === 'tet') {
    add('lixi', 2);
    add('banhchung', 1);
  }
  if (season() === 'ny' && c.body !== 'sick') {
    add('sparkler', 3);
    add('dance', 1);
  }
  if (low()) {
    ['dance', 'laptop', 'wave', 'phone', 'gift', 'snowman'].forEach(k => {
      if (w[k]) w[k] = k === 'wave' || k === 'phone' ? 0.4 : 0;
    });
    add('nap', 2);
    add('yawn', 1);
    add('read', 1);
  }
  if (d.water < waterGoal() && !isNight() && Date.now() - lastDrink > 40000 && Math.random() < 0.35) return 'drink';
  const tot = Object.values(w).reduce((a, b) => a + b, 0);
  let r = Math.random() * tot;
  for (const k in w) {
    r -= w[k];
    if (r <= 0) return k;
  }
  return 'wave';
}
let AC = null;
document.addEventListener(
  'pointerdown',
  () => {
    try {
      if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)();
      else if (AC.state === 'suspended') AC.resume();
    } catch (e) {}
  },
  true
);
function gulp() {
  if (S.sound === false || !AC) return;
  try {
    const t0 = AC.currentTime;
    [0, 0.32, 0.64].forEach(off => {
      const o = AC.createOscillator(),
        g = AC.createGain(),
        f = AC.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = 900;
      o.type = 'sine';
      o.frequency.setValueAtTime(520, t0 + off);
      o.frequency.exponentialRampToValueAtTime(130, t0 + off + 0.13);
      g.gain.setValueAtTime(0, t0 + off);
      g.gain.linearRampToValueAtTime(0.32, t0 + off + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + off + 0.17);
      o.connect(f);
      f.connect(g);
      g.connect(AC.destination);
      o.start(t0 + off);
      o.stop(t0 + off + 0.2);
    });
  } catch (e) {}
}
function floatTxt(t, cls, n) {
  for (let i = 0; i < n; i++) {
    const h = document.createElement('span');
    h.className = 'heart ' + cls;
    h.textContent = t;
    h.style.left = (cls === 'gulp' ? 48 + i * 10 : 14 + i * 22) + 'px';
    h.style.top = (cls === 'gulp' ? 34 : 6) + 'px';
    h.style.animationDelay = i * (cls === 'gulp' ? 0.32 : 0.25) + 's';
    pet.appendChild(h);
    setTimeout(() => h.remove(), 2400);
  }
}
function endAct() {
  P.act = null;
  pet.className = pet.className
    .replace(/\bact-\S+/g, '')
    .replace('sitting', '')
    .trim();
  drawChibi();
}
function startAct(a) {
  clearTimeout(P.t);
  if (P.act) endAct();
  a = a || pickAct();
  P.act = a;
  pet.classList.remove('walking');
  pet.classList.add('act-' + a);
  if (a === 'nap') pet.classList.add('sitting');
  drawChibi();
  const lines = ACTS[a] || [''];
  say(
    lines[Math.floor(Math.random() * lines.length)]
      .replace('{n}', S.name)
      .replace('{w}', today().water)
      .replace('{g}', waterGoal())
      .replace('{x}', daysToXmas()),
    a === 'drink' ? 5200 : 4200
  );
  if (a === 'drink') {
    lastDrink = Date.now();
    gulp();
    floatTxt('ực', 'gulp', 3);
  }
  if (a === 'dance') floatTxt('♪', 'note', 3);
  if (a === 'tissue') floatTxt('💨', 'note', 1);
  if (a === 'breathe')
    setTimeout(() => {
      if (P.act === 'breathe') say('…thở ra thật chậm 🍃', 2600);
    }, 2200);
  const lw = low();
  P.t = setTimeout(
    () => {
      endAct();
      P.t = setTimeout(wander, lw ? rnd(3000, 7000) : rnd(800, 2200));
    },
    a === 'drink' ? 4200 : a === 'nap' ? (lw ? 11000 : 6500) : lw ? rnd(6000, 9000) : rnd(4000, 5600)
  );
}
function poke() {
  clearTimeout(P.t);
  pet.classList.remove('walking', 'sitting');
  const cur = getComputedStyle(pet).transform;
  if (cur && cur !== 'none') {
    const m = new DOMMatrix(cur);
    place(m.m41, m.m42, 0);
  }
  const svg = pet.querySelector('svg');
  if (svg) {
    svg.classList.remove('jump');
    void svg.offsetWidth;
    svg.classList.add('jump');
  }
  if (P.act === 'drink') {
    const d = today(),
      G = waterGoal();
    if (d.water < G) d.water++;
    save();
    if (tab === 'today') render();
    if (d.water === G) celebrate(1);
    say(
      d.water >= G
        ? 'Cụng ly! Đủ ' + G + ' ly rồi, ' + S.name + ' giỏi quá 🎉'
        : 'Cụng ly! 🥂 +1 ly (' + d.water + '/' + G + ')'
    );
    endAct();
  } else {
    if (P.act) endAct();
    say(
      activeWo()
        ? 'Cố lên ' + S.name + ', thêm một set nữa thôi 💪'
        : focusing()
          ? 'Suỵt, mình đang tập trung cùng ' + S.name + ' nè 🤫 Còn ' + mmss(pomoLeft()) + ' thôi!'
          : PRAISE[Math.floor(Math.random() * PRAISE.length)].replace('{n}', S.name)
    );
  }
  for (let i = 0; i < 3; i++) {
    const h = document.createElement('span');
    h.className = 'heart';
    h.textContent = ['💖', '💗', '✨'][i];
    h.style.left = 18 + i * 18 + 'px';
    h.style.animationDelay = i * 0.12 + 's';
    pet.appendChild(h);
    setTimeout(() => h.remove(), 1800);
  }
  P.t = setTimeout(wander, 2600);
}
pet.addEventListener('pointerdown', e => {
  P.down = { x: e.clientX, y: e.clientY, ox: e.clientX - P.x, oy: e.clientY - P.y };
  pet.setPointerCapture(e.pointerId);
});
pet.addEventListener('pointermove', e => {
  if (!P.down) return;
  if (!P.drag && Math.hypot(e.clientX - P.down.x, e.clientY - P.down.y) > 8) {
    P.drag = true;
    clearTimeout(P.t);
    pet.classList.remove('walking', 'sitting');
    pet.classList.add('held');
    say('Úi, bay lên rồi! 🙈', 2000);
  }
  if (P.drag) {
    const b = bounds();
    place(
      Math.min(b.maxX, Math.max(b.minX, e.clientX - P.down.ox)),
      Math.min(b.maxY, Math.max(0, e.clientY - P.down.oy)),
      0
    );
  }
});
pet.addEventListener('pointerup', () => {
  const was = P.drag;
  P.down = null;
  P.drag = false;
  pet.classList.remove('held');
  if (was) {
    say('Hihi, chỗ này cũng được nè!', 2500);
    P.t = setTimeout(wander, 2500);
  } else poke();
});
pet.addEventListener('pointercancel', () => {
  P.down = null;
  P.drag = false;
  pet.classList.remove('held');
  P.t = setTimeout(wander, 1500);
});
pet.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    poke();
  }
});
addEventListener('resize', () => {
  const b = bounds();
  place(Math.min(P.x, b.maxX), Math.min(P.y, b.maxY), 0);
  if (nudgeCur) layoutBoard();
});
{
  const b = bounds();
  place(b.maxX - 10, b.maxY, 0);
}
$('#wake').addEventListener('click', () => {
  $('#sleepcover').classList.remove('on');
  demoNight = false;
  render();
  wander();
  checkinSheet();
  say('Chào buổi sáng ' + S.name + '! Đêm qua ngủ ngon không?');
});

{
  const sn = $('#snow');
  if (false)
    for (let i = 0; i < 30; i++) {
      const f = document.createElement('i');
      const z = 3 + Math.random() * 6;
      f.style.cssText = `left:${Math.random() * 100}%;width:${z}px;height:${z}px;animation-duration:${8 + Math.random() * 10}s;animation-delay:${-Math.random() * 18}s;opacity:${0.5 + Math.random() * 0.5}`;
      sn.appendChild(f);
    }
}
render();
P.t = setTimeout(wander, 1200);
/* Nếu tối qua đã bấm "Đi ngủ" mà chưa bấm "Mình dậy rồi" thì hiện lại màn hình ngủ */
if (S.pendingBed && Date.now() - new Date(S.pendingBed) < 16 * 36e5 && isNight()) {
  $('#chibiSleep').innerHTML = chibi({ mood: 'sleep', outfit: 'pj', sleep: true });
  $('#gn').textContent = 'Chúc ' + S.name + ' ngủ ngon 🌙';
  $('#gnTime').textContent = 'Đã ghi giờ đi ngủ: ' + hm(new Date(S.pendingBed));
  $('#sleepcover').classList.add('on');
} else if (S.pendingBed && !today().checkin) say('Chào buổi sáng ' + S.name + '! Làm Check-in để ghi giờ dậy nhé ☀️');
else if (!today().checkin && !isNight())
  say('Chào ' + S.name + '! Mình làm Check-in ' + (new Date().getHours() < 12 ? 'buổi sáng' : 'hôm nay') + ' nhé?');
else if (isNight()) say('Sắp đến giờ ngủ rồi, ' + S.name + ' ơi 🌙');
setInterval(() => {
  if (!$('#sheetbg').classList.contains('on')) drawChibi();
}, 60000);
setInterval(pomoTick, 1000);
setInterval(restTick, 1000);
if (S.pomo && S.pomo.endAt) {
  if (pomoLeft() <= 0) pomoDone(true);
  else if (focusing()) keepAwake();
}
setTimeout(checkNudges, 6000);
setInterval(checkNudges, 30000);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') setTimeout(checkNudges, 2500);
});

/* ===== src/14-boot.js ===== */
/* ---------- Offline & cập nhật bản mới ---------- */
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  const toast = $('#toast');
  let reloading = false;
  const showUpdate = w => {
    toast.textContent = '✨ Có bản Cozy Life mới. Chạm để cập nhật';
    toast.classList.remove('hide');
    toast.onclick = async () => {
      toast.textContent = 'Đang cập nhật…';
      await flush();
      w.postMessage('skipWaiting');
    };
  };
  const reloadNow = () => {
    if (reloading) return;
    reloading = true;
    flush().finally(() => location.reload());
  };
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    const ae = document.activeElement,
      busy = $('#sheetbg').classList.contains('on') || (ae && ['INPUT', 'TEXTAREA'].includes(ae.tagName)) || focusing();
    if (!busy || document.visibilityState === 'hidden') return reloadNow();
    toast.textContent = '✨ Bản Cozy Life mới đã sẵn sàng. Chạm để tải lại';
    toast.classList.remove('hide');
    toast.onclick = reloadNow;
    document.addEventListener(
      'visibilitychange',
      () => {
        if (document.visibilityState === 'hidden') reloadNow();
      },
      { once: true }
    );
  });
  window.cozyCheckUpdate = async () => {
    const r = await navigator.serviceWorker.getRegistration();
    if (!r) return false;
    await r.update();
    return !!(r.installing || r.waiting);
  };
  navigator.serviceWorker
    .register('sw.js')
    .then(reg => {
      const chk = () => {
        if (reg.waiting && navigator.serviceWorker.controller) showUpdate(reg.waiting);
      };
      const track = w => {
        if (w) w.addEventListener('statechange', chk);
      };
      chk();
      track(reg.installing);
      reg.addEventListener('updatefound', () => track(reg.installing));
      const upd = () =>
        reg
          .update()
          .then(chk)
          .catch(() => {});
      upd();
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') upd();
      });
    })
    .catch(e => console.warn('SW', e));
}

})();
