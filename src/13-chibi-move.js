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
