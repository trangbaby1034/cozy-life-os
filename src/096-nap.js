/* ---------- ☀️😴 Ngủ trưa ---------- */
/* S.nap   : cài đặt { time:'12:30', len:20, remind:'chibi', sched:true, sound:'none' }
   S.napNow: giấc đang ngủ { start, endAt, len, sound, ring }
   day.naps: [{ s, e, len, feel }] – lưu theo ngày bắt đầu ngủ */
const NAPLENS = [
  [10, '10′', 'Chợp mắt nhanh'],
  [20, '20′', 'Nạp năng lượng'],
  [30, '30′', 'Lâu hơn chút'],
  [90, '90′', 'Trọn 1 chu kỳ']
];
const NAPFEEL = [
  ['fresh', '😊', 'Tỉnh táo'],
  ['ok', '🙂', 'Bình thường'],
  ['groggy', '😵‍💫', 'Lừ đừ']
];
const NAPSND = [
  ['none', '🔇 Yên lặng'],
  ['rain', '🌧️ Tiếng mưa'],
  ['brown', '🌊 Rì rào']
];
function napCfg() {
  return (S.nap = Object.assign({ time: '12:30', len: 20, remind: 'chibi', sched: true, sound: 'none' }, S.nap || {}));
}
function napping() {
  return !!(S.napNow && S.napNow.start);
}
const napsOf = d => (d && d.naps) || [];
const napMin = n => Math.max(1, Math.round((new Date(n.e) - new Date(n.s)) / 6e4));
const fmtMin = m => (m >= 60 ? Math.floor(m / 60) + 'g' + (m % 60 ? pad(m % 60) : '') : m + ' phút');
function napHint(len) {
  return len <= 20
    ? 'Ngủ 10–20 phút giúp tỉnh táo ngay, dậy ít bị lừ đừ.'
    : len < 90
      ? 'Ngủ quá 30 phút dễ rơi vào giấc sâu, lúc dậy có thể lừ đừ một lúc.'
      : '90 phút là trọn một chu kỳ ngủ, thường dậy nhẹ nhàng hơn 30–60 phút. Nên ngủ sớm trong buổi chiều.';
}

/* --- Màn hình ngủ trưa --- */
const napEl = document.createElement('div');
napEl.className = 'napcover';
napEl.id = 'napcover';
document.body.appendChild(napEl);
function napScreen() {
  const n = S.napNow;
  if (!n) return;
  const ring = Date.now() >= n.endAt;
  napEl.classList.toggle('waking', ring);
  napEl.innerHTML = `<div class="bigchibi">${chibi(Object.assign(state(), { mood: ring ? 'happy' : 'sleep', sleep: !ring, xw: false }))}</div>
  <h2>${ring ? 'Dậy thôi nào ' + esc(S.name) + ' ☀️' : 'Ngủ trưa ngon nha 😴'}</h2>
  <p class="napclock" id="napLeft"></p>
  <p class="napsub">${ring ? 'Vươn vai, uống ngụm nước rồi mình làm tiếp nhé.' : 'Gọi dậy lúc <b>' + hm(new Date(n.endAt)) + '</b>'}</p>
  <div class="row" style="justify-content:center">${ring ? `<button class="btn" data-nap="wake">☀️ Mình dậy rồi</button><button class="btn ghost" data-nap="more">😪 Thêm 5 phút</button>` : `<button class="btn ghost" data-nap="more">＋5 phút</button><button class="btn" data-nap="wake">☀️ Dậy rồi</button>`}</div>
  ${ring ? '' : `<p class="napnote">Để màn hình sáng, mình sẽ gọi bằng chuông nhỏ. Khóa máy thì app không gọi được, nên muốn chắc chắn hãy đặt thêm báo thức lúc <b>${hm(new Date(n.endAt))}</b>.<br><a class="btn ghost sm" href="clock-alarm://">⏰ Mở Đồng hồ</a></p>`}`;
  napTick();
}
let napRang = 0;
function napTick() {
  const n = S.napNow;
  if (!n) return;
  const left = Math.ceil((n.endAt - Date.now()) / 1000),
    el = $('#napLeft');
  if (left <= 0 && !napEl.classList.contains('waking')) {
    stopNoise();
    return napScreen();
  }
  if (el) el.textContent = left > 0 ? mmss(left) : '⏰';
  if (left <= 0) {
    const since = -left;
    /* chuông nhỏ mỗi 8 giây, tối đa 10 phút */
    if (since < 600 && Date.now() - napRang > 8000) {
      napRang = Date.now();
      chime();
      try {
        navigator.vibrate && navigator.vibrate([200, 100, 200]);
      } catch (e) {}
    }
  }
}
function startNap(len) {
  const c = napCfg();
  len = len || c.len;
  if (focusing()) pomoStop();
  if (working() && !onBreak()) workBreak();
  try {
    if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)();
    AC.resume();
  } catch (e) {}
  S.napNow = { start: new Date().toISOString(), endAt: Date.now() + len * 6e4, len, sound: c.sound };
  closeSheet();
  if (nudgeCur) hideNudge();
  flush();
  startNoise(c.sound);
  keepAwake();
  napScreen();
  napEl.classList.add('on');
}
function napMore() {
  const n = S.napNow;
  n.endAt = Math.max(n.endAt, Date.now()) + 5 * 6e4;
  n.len += 5;
  napRang = 0;
  save();
  if (n.sound && n.sound !== 'none') startNoise(n.sound);
  napScreen();
}
function napWake() {
  const n = S.napNow;
  if (!n) return;
  const s = new Date(n.start),
    e = new Date(Math.min(Date.now(), n.endAt + 15 * 6e4)),
    d = S.days[dk(s)] || today();
  d.naps = napsOf(d).concat({ s: n.start, e: e.toISOString(), len: n.len });
  S.napNow = null;
  stopNoise();
  releaseWake();
  napEl.classList.remove('on', 'waking');
  render();
  wander();
  const nap = d.naps[d.naps.length - 1];
  if (napMin(nap) < 3) {
    d.naps.pop();
    save();
    return say('Không ngủ được cũng không sao, nghỉ mắt chút là tốt rồi 🙂', 3000);
  }
  openSheet(`<h2>☀️ Dậy rồi!</h2><p class="muted" style="margin:0">Đã ngủ trưa <b>${fmtMin(napMin(nap))}</b> (${hm(s)} – ${hm(e)}). Dậy thấy thế nào?</p>
  <div class="row" style="margin-top:12px">${NAPFEEL.map(([k, i, t]) => `<button class="chip" data-napfeel="${k}">${i} ${t}</button>`).join('')}</div>`);
}
function napSheet() {
  const c = napCfg(),
    h = new Date().getHours();
  F = { napLen: c.len, napSnd: c.sound };
  const wakeAt = m => hm(new Date(Date.now() + m * 6e4));
  openSheet(`<h2>😴 Ngủ trưa</h2>
  <div class="q"><h3>Ngủ bao lâu?</h3><div class="napgrid">${NAPLENS.map(([m, l, t]) => `<button class="chip" data-napl="${m}" aria-pressed="${F.napLen === m}"><b>${l}</b><i>${t}</i></button>`).join('')}</div>
  <p class="muted" id="napHint" style="margin:8px 0 0">${napHint(F.napLen)} Gọi dậy lúc <b id="napWakeAt">${wakeAt(F.napLen)}</b>.</p></div>
  <div class="q"><h3>Âm thanh ru ngủ</h3><div class="row">${NAPSND.map(([k, n]) => `<button class="chip sm" data-napsnd="${k}" aria-pressed="${F.napSnd === k}">${n}</button>`).join('')}</div></div>
  ${h >= 15 ? '<p class="muted" style="margin:10px 0 0">💡 Đã sau 3 giờ chiều, ngủ lâu có thể khó ngủ buổi tối. Chợp mắt 10–20 phút thôi nhé.</p>' : ''}
  <button class="btn full" style="margin-top:16px" data-nap="go">😴 Bắt đầu ngủ</button>`);
}

/* --- Thẻ ở tab Hôm nay --- */
function napCard() {
  const h = new Date().getHours(),
    N = napsOf(today());
  if (N.length) {
    const last = N[N.length - 1],
      f = NAPFEEL.find(x => x[0] === last.feel);
    return h >= 11 && h < 18
      ? `<div class="card napcard"><h2>☀️ Đã ngủ trưa <small>${fmtMin(N.reduce((a, n) => a + napMin(n), 0))}</small></h2><p class="muted" style="margin:0">${hm(new Date(last.s))} – ${hm(new Date(last.e))}${f ? ' · ' + f[1] + ' ' + f[2] : ''}</p></div>`
      : '';
  }
  if (h < 11 || h >= 16) return '';
  const c = napCfg();
  return `<div class="card napcard"><h2>😴 Ngủ trưa <small>${c.time}</small></h2><p class="muted" style="margin:0 0 10px">Chợp mắt một chút cho buổi chiều tỉnh táo hơn.</p><div class="row"><button class="btn" data-nap="quick">😴 Ngủ ${c.len} phút</button><button class="btn ghost" data-nap="sheet">Chọn thời gian</button></div></div>`;
}

/* --- Phần ngủ trưa trong Sức khỏe › Giấc ngủ --- */
function napHealth() {
  const c = napCfg(),
    L = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    napsOf(S.days[dk(d)]).forEach(n => L.push(n));
  }
  const tot = L.reduce((a, n) => a + napMin(n), 0),
    gr = L.filter(n => n.feel === 'groggy'),
    tip =
      gr.length >= 2 && gr.filter(n => napMin(n) >= 30).length >= gr.length / 2
        ? '<p class="muted" style="margin:8px 0 0">💡 Mấy lần ngủ lâu bạn hay dậy lừ đừ. Thử 20 phút xem sao nhé.</p>'
        : '';
  return `<div class="card"><h2>☀️ Ngủ trưa <small>7 ngày</small></h2>
  ${
    L.length
      ? `<div class="stat3"><div><b>${L.length}</b>Lần</div><div><b>${Math.round(tot / L.length)}′</b>TB mỗi lần</div><div><b>${L.filter(n => n.feel === 'fresh').length}</b>Lần tỉnh táo</div></div>${L.slice(
          0,
          7
        )
          .map(n => {
            const s = new Date(n.s),
              f = NAPFEEL.find(x => x[0] === n.feel);
            return `<div class="okline"><span>${f ? f[1] : '😴'}</span><span>${VNWD[s.getDay()]} ${pad(s.getDate())}/${pad(s.getMonth() + 1)} · ${hm(s)} · <b>${fmtMin(napMin(n))}</b></span></div>`;
          })
          .join('')}${tip}`
      : '<p class="muted" style="margin:0 0 6px">Chưa có giấc ngủ trưa nào trong 7 ngày qua.</p>'
  }
  <button class="btn ghost full" style="margin-top:10px" data-nap="sheet">😴 Ngủ trưa ngay</button>
  <details class="more" style="margin-top:12px"><summary>⚙️ Cài đặt ngủ trưa</summary>
  <div class="q"><h3>Giờ ngủ trưa</h3><input class="inp" type="time" id="napTime" value="${c.time}" style="max-width:150px"></div>
  <div class="q"><h3>Thời gian mặc định</h3><div class="row">${NAPLENS.map(([m, l]) => `<button class="chip sm" data-napdef="${m}" aria-pressed="${c.len === m}">${l}</button>`).join('')}</div></div>
  <div class="q"><div class="row"><button class="chip sm" data-napopt="remind" aria-pressed="${c.remind === 'chibi'}">💬 Chibi rủ ngủ trưa</button><button class="chip sm" data-napopt="sched" aria-pressed="${!!c.sched}">🕒 Hiện trong Thời gian biểu</button></div></div>
  </details></div>`;
}

/* --- Chibi rủ ngủ trưa --- */
function napNudge(now, td, log) {
  const c = napCfg();
  if (c.remind !== 'chibi' || log.nap === td || napsOf(today()).length || napping() || now.getHours() >= 16)
    return false;
  const [h, m] = c.time.split(':').map(Number),
    t = new Date(now);
  t.setHours(h, m, 0, 0);
  const diff = (now - t) / 6e4;
  if (diff < -5 || diff > 60) return false;
  log.nap = td;
  save();
  showNudge({
    text: '😴 Đến giờ ngủ trưa rồi ' + esc(S.name) + '. Chợp mắt ' + c.len + ' phút cho buổi chiều tỉnh táo nhé?',
    btns: ['😴 Ngủ ' + c.len + ' phút', 'Hôm nay không ngủ', 'Đừng rủ nữa'],
    onBtn: i => {
      if (i === 0) startNap(c.len);
      else if (i === 2) {
        c.remind = 'none';
        say('Ok, mình không rủ ngủ trưa nữa. Bật lại trong Sức khỏe › Giấc ngủ nha', 3500);
        save();
      }
    }
  });
  return true;
}

/* --- Sự kiện --- */
napEl.addEventListener('click', e => {
  const b = e.target.closest('[data-nap]');
  if (!b) return;
  if (b.dataset.nap === 'wake') napWake();
  else if (b.dataset.nap === 'more') napMore();
});
document.addEventListener('click', e => {
  const t = e.target.closest('button');
  if (!t || napEl.contains(t)) return;
  const D = t.dataset,
    c = napCfg();
  if (D.nap === 'quick') startNap(c.len);
  else if (D.nap === 'sheet') napSheet();
  else if (D.nap === 'go') {
    c.len = F.napLen || c.len;
    c.sound = F.napSnd || 'none';
    startNap(c.len);
  } else if (D.napl) {
    F.napLen = +D.napl;
    t.parentNode.querySelectorAll('.chip').forEach(b => b.setAttribute('aria-pressed', b === t));
    $('#napHint').innerHTML =
      napHint(F.napLen) + ' Gọi dậy lúc <b id="napWakeAt">' + hm(new Date(Date.now() + F.napLen * 6e4)) + '</b>.';
  } else if (D.napsnd) {
    F.napSnd = D.napsnd;
    t.parentNode.querySelectorAll('.chip').forEach(b => b.setAttribute('aria-pressed', b === t));
  } else if (D.napfeel) {
    const L = [];
    Object.values(S.days).forEach(d => napsOf(d).forEach(n => L.push(n)));
    const last = L.sort((a, b) => a.s.localeCompare(b.s)).pop();
    if (last) last.feel = D.napfeel;
    closeSheet();
    render();
    say(
      D.napfeel === 'groggy'
        ? last && napMin(last) >= 30
          ? 'Lần sau thử ngủ 20 phút xem có đỡ lừ đừ không nha 😵‍💫'
          : 'Rửa mặt nước mát với uống ngụm nước là tỉnh liền 💧'
        : 'Nạp đầy năng lượng rồi, chiến tiếp thôi ✨',
      3500
    );
  } else if (D.napdef) {
    c.len = +D.napdef;
    render();
  } else if (D.napopt) {
    if (D.napopt === 'remind') c.remind = c.remind === 'chibi' ? 'none' : 'chibi';
    else c.sched = !c.sched;
    render();
  }
});
document.addEventListener('change', e => {
  if (e.target.id !== 'napTime' || !e.target.value) return;
  napCfg().time = e.target.value;
  render();
});
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible' || !napping()) return;
  keepAwake();
  if (AC) AC.resume().catch(() => {});
  napTick();
});
setInterval(napTick, 1000);
/* Mở lại app giữa giấc ngủ trưa → hiện lại màn hình ngủ (quá 3 tiếng thì tự ghi nhận) */
setTimeout(() => {
  if (!napping()) return;
  if (Date.now() - S.napNow.endAt > 3 * 36e5) return napWake();
  napScreen();
  napEl.classList.add('on');
}, 0);
