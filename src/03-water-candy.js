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
