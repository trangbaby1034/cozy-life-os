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
  ${front}${shine}${ear}${santa || nyHat || tetFlower + headAcc}${pose !== 'side' ? actItem(o.act) + armsSvg(pose, AF, SK) : ''}${extra}${blanket}</g></svg>`;
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
    if (!d.lazy) out.push('🛋️ Hôm nay năng lượng thấp. Nghỉ ngơi nhẹ nhàng nha, bấm "Bật Ngày Lười Biếng" bên dưới nếu muốn ẩn bớt việc.');
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
