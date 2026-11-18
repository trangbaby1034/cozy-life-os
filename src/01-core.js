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
