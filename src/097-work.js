/* ---------- 💼 Check-in công việc ---------- */
/* S.work   : cài đặt { goal: 8 (giờ/ngày), stretch: true, over: true }
   S.workNow: ca đang làm { start, brk (ms nghỉ đã tính), brkAt (đang nghỉ từ lúc), lastStretch }
   day.work : [{ id, s, e, brk }] – ca làm lưu theo ngày bắt đầu */
function workCfg() {
  return (S.work = Object.assign({ goal: 8, stretch: true, over: true }, S.work || {}));
}
const working = () => !!(S.workNow && S.workNow.start);
const onBreak = () => working() && !!S.workNow.brkAt;
const worksOf = d => (d && d.work) || [];
const sessMs = w => Math.max(0, new Date(w.e) - new Date(w.s) - (w.brk || 0));
function liveMs() {
  const w = S.workNow;
  if (!w) return 0;
  const now = Date.now();
  return Math.max(0, now - new Date(w.start) - (w.brk || 0) - (w.brkAt ? now - w.brkAt : 0));
}
function dayWorkMs(k) {
  let t = worksOf(S.days[k]).reduce((a, w) => a + sessMs(w), 0);
  if (working() && dk(new Date(S.workNow.start)) === k) t += liveMs();
  return t;
}
function fmtDur(ms) {
  const m = Math.round(ms / 6e4);
  if (m < 60) return m + ' phút';
  return Math.floor(m / 60) + 'g' + (m % 60 ? pad(m % 60) : '');
}
const fmtH = ms => (ms / 36e5).toFixed(1).replace('.0', '').replace('.', ',') + 'g';

function workStart() {
  if (working()) return;
  S.workNow = { start: new Date().toISOString(), brk: 0, lastStretch: Date.now() };
  flush();
  render();
  say('Bắt đầu làm việc thôi! Cố lên ' + S.name + ' 💪', 2500);
}
function workBreak() {
  const w = S.workNow;
  if (!w) return;
  if (w.brkAt) {
    w.brk = (w.brk || 0) + (Date.now() - w.brkAt);
    delete w.brkAt;
    w.lastStretch = Date.now();
    say('Làm tiếp nào ✨', 2000);
  } else {
    w.brkAt = Date.now();
    say('Nghỉ chút cho khỏe, uống ngụm nước nha ☕', 2500);
  }
  save();
  render();
}
/* kết thúc ca; end = Date (mặc định bây giờ) */
function workEnd(end) {
  const w = S.workNow;
  if (!w) return;
  end = end || new Date();
  const s = new Date(w.start);
  if (end < s) end = new Date(s);
  let brk = w.brk || 0;
  if (w.brkAt) brk += Math.max(0, end - w.brkAt);
  const k = dk(s),
    d = S.days[k] || (S.days[k] = {});
  const sess = { id: uid(), s: w.start, e: end.toISOString(), brk };
  if (sessMs(sess) >= 6e4) d.work = worksOf(d).concat(sess);
  S.workNow = null;
  flush();
  render();
  return sess;
}

/* --- Thẻ ở tab Hôm nay --- */
function workCard() {
  const c = workCfg(),
    td = dk(new Date()),
    tot = dayWorkMs(td),
    pct = Math.min(100, (tot / (c.goal * 36e5)) * 100);
  const bar = `<div class="wkbar"><i style="width:${pct}%"></i></div>`;
  if (working()) {
    const w = S.workNow,
      br = !!w.brkAt;
    return `<div class="card workcard ${br ? 'brk' : 'on'}"><h2>${br ? '☕ Đang nghỉ giải lao' : '💼 Đang làm việc'} <small>từ ${hm(new Date(w.start))}</small></h2>
    <p class="wklive"><b id="workLive">${fmtDur(liveMs())}</b> <span class="muted">ca này · hôm nay ${fmtDur(tot)} / ${c.goal}g</span></p>${bar}
    <div class="row" style="margin-top:10px"><button class="btn ghost" data-work="brk">${br ? '▶️ Làm tiếp' : '☕ Nghỉ giải lao'}</button><button class="btn" data-work="end">🏁 Kết thúc</button></div>
    <button class="linkbtn" data-work="stats">📊 Xem giờ làm tuần này</button></div>`;
  }
  return `<div class="card workcard"><h2>💼 Làm việc <small>${tot ? fmtDur(tot) + ' hôm nay' : 'mục tiêu ' + c.goal + 'g'}</small></h2>${tot ? bar : '<p class="muted" style="margin:0 0 4px">Bấm khi bắt đầu và kết thúc, app tự tính giờ làm mỗi ngày.</p>'}
  <div class="row" style="margin-top:10px"><button class="btn" data-work="start">▶️ ${tot ? 'Làm tiếp' : 'Bắt đầu làm việc'}</button><button class="btn ghost" data-work="stats">📊 Thống kê</button></div></div>`;
}

/* --- Thống kê --- */
function weekStart(x) {
  const d = new Date(x.getFullYear(), x.getMonth(), x.getDate());
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}
function workStats(off) {
  off = off || 0;
  const c = workCfg(),
    td = dk(new Date()),
    ws = weekStart(new Date());
  ws.setDate(ws.getDate() + off * 7);
  const R = [];
  for (let i = 0; i < 7; i++) {
    const x = new Date(ws);
    x.setDate(ws.getDate() + i);
    R.push({ x, k: dk(x), ms: dayWorkMs(dk(x)) });
  }
  const goal = c.goal * 36e5,
    mx = Math.max(goal * 1.25, ...R.map(r => r.ms)),
    tot = R.reduce((a, r) => a + r.ms, 0),
    days = R.filter(r => r.ms > 0).length;
  const bars = R.map(r => {
    const h = (r.ms / mx) * 100,
      fut = r.k > td;
    return `<button class="wbar" data-wkday="${r.k}" ${fut ? 'disabled' : ''} aria-label="${VNWD[r.x.getDay()]} ${r.x.getDate()}/${r.x.getMonth() + 1}: ${fmtDur(r.ms)}"><span class="wv">${r.ms ? fmtH(r.ms) : ''}</span><span class="wcol"><i class="wfill ${r.ms >= goal ? 'ok' : ''}" style="height:${h}%"></i><i class="wgl" style="bottom:${(goal / mx) * 100}%"></i></span><span class="wd2 ${r.k === td ? 'now' : ''}">${r.k === td ? 'Nay' : VNWD[r.x.getDay()]}</span></button>`;
  }).join('');
  /* tháng này */
  const now = new Date(),
    m0 = new Date(now.getFullYear(), now.getMonth(), 1);
  let mt = 0,
    md = 0;
  for (const x = new Date(m0); dk(x) <= td; x.setDate(x.getDate() + 1)) {
    const v = dayWorkMs(dk(x));
    mt += v;
    if (v) md++;
  }
  const we = new Date(ws);
  we.setDate(ws.getDate() + 6);
  openSheet(`<h2>📊 Giờ làm việc</h2>
  <div class="row" style="justify-content:space-between;align-items:center;flex-wrap:nowrap;margin:6px 0"><button class="chip sm" data-wkweek="${off - 1}" aria-label="Tuần trước">‹</button><b>${off === 0 ? 'Tuần này' : off === -1 ? 'Tuần trước' : fmtDM(ws) + ' – ' + fmtDM(we)}</b><button class="chip sm" data-wkweek="${off + 1}" ${off >= 0 ? 'disabled' : ''} aria-label="Tuần sau">›</button></div>
  <div class="stat3"><div><b>${fmtH(tot)}</b>Tổng tuần</div><div><b>${days ? fmtH(tot / days) : '–'}</b>TB ngày làm</div><div><b>${R.filter(r => r.ms >= goal).length}</b>Ngày đủ ${c.goal}g</div></div>
  <div class="wchart">${bars}</div>
  <p class="muted" style="margin:6px 0 0">Vạch ngang là mục tiêu ${c.goal} giờ. Chạm vào một ngày để xem hoặc sửa giờ.</p>
  <p class="muted" style="margin:6px 0 0">Tháng ${now.getMonth() + 1}: <b>${fmtH(mt)}</b> trong ${md} ngày${md ? ', trung bình ' + fmtH(mt / md) + '/ngày' : ''}.</p>
  <details class="more" style="margin-top:12px"><summary>⚙️ Cài đặt giờ làm</summary>
  <div class="q"><h3>Mục tiêu mỗi ngày</h3><div class="row">${[4, 6, 7, 8, 9, 10].map(h => `<button class="chip sm" data-wkgoal="${h}" aria-pressed="${c.goal === h}">${h} giờ</button>`).join('')}</div></div>
  <div class="q"><div class="row"><button class="chip sm" data-wkopt="stretch" aria-pressed="${!!c.stretch}">🧘 Chibi nhắc vươn vai mỗi 60 phút</button><button class="chip sm" data-wkopt="over" aria-pressed="${!!c.over}">🌙 Nhắc khi làm quá giờ</button></div></div></details>
  <button class="btn ghost full" style="margin-top:12px" data-wkday="${td}">✏️ Thêm / sửa giờ hôm nay</button>`);
}
function workDaySheet(k) {
  const d = S.days[k] || {},
    L = worksOf(d),
    x = new Date(k + 'T00:00:00'),
    t = s => hm(new Date(s));
  const live = working() && dk(new Date(S.workNow.start)) === k;
  openSheet(`<h2>💼 ${VNWD[x.getDay()]} ${fmtDM(x)}</h2><p class="muted" style="margin:0 0 8px">Tổng: <b>${fmtDur(dayWorkMs(k))}</b>${live ? ' (đang làm)' : ''}</p>
  ${L.map(
    w =>
      `<div class="wkrow"><input class="inp" type="time" data-wks="${w.id}" value="${t(w.s)}" aria-label="Bắt đầu"><span>→</span><input class="inp" type="time" data-wke="${w.id}" value="${t(w.e)}" aria-label="Kết thúc"><label class="muted">Nghỉ trưa/giải lao <input class="inp" type="number" min="0" max="600" data-wkb="${w.id}" value="${Math.round((w.brk || 0) / 6e4)}" aria-label="Phút nghỉ"> phút</label><button class="xbtn" data-wkdel="${k}:${w.id}" aria-label="Xóa ca">✕</button></div>`
  ).join('')}
  ${L.length ? '' : '<p class="muted">Chưa có ca làm nào.</p>'}
  <h3 style="margin:14px 0 6px">＋ Thêm ca làm bù</h3>
  <div class="wkrow"><input class="inp" type="time" id="wkNs" value="08:00" aria-label="Bắt đầu"><span>→</span><input class="inp" type="time" id="wkNe" value="17:00" aria-label="Kết thúc"><label class="muted">Nghỉ trưa/giải lao <input class="inp" type="number" min="0" max="600" id="wkNb" value="60" aria-label="Phút nghỉ"> phút</label><button class="btn ghost sm" data-wkadd="${k}">Thêm</button></div>
  <div class="row" style="margin-top:16px"><button class="btn" data-work="stats">‹ Thống kê</button></div>`);
}
/* sửa giờ ca: giữ ngày, đổi giờ; giờ kết thúc nhỏ hơn giờ bắt đầu → qua đêm */
function setHM(base, v) {
  const [h, m] = v.split(':').map(Number),
    x = new Date(base);
  x.setHours(h, m, 0, 0);
  return x;
}
function fixSess(w) {
  const s = new Date(w.s),
    e = setHM(s, hm(new Date(w.e)));
  if (e <= s) e.setDate(e.getDate() + 1);
  w.e = e.toISOString();
}

/* --- Quên bấm kết thúc --- */
function askForgotEnd() {
  const w = S.workNow,
    s = new Date(w.start);
  openSheet(`<h2>💼 Quên bấm kết thúc?</h2><p class="muted">Ca làm bắt đầu lúc <b>${hm(s)} ${dk(s) === dk(new Date()) ? 'hôm nay' : 'ngày ' + fmtDM(s)}</b> vẫn đang chạy (${fmtDur(liveMs())}). Bạn nghỉ làm lúc mấy giờ?</p>
  <div class="row" style="flex-wrap:nowrap"><input class="inp" type="time" id="wkForgot" value="${hm(new Date(Math.min(Date.now(), s.getTime() + workCfg().goal * 36e5 + 36e5)))}" style="max-width:150px" aria-label="Giờ kết thúc"><button class="btn" data-work="forgot">Lưu</button></div>
  <button class="btn ghost full" style="margin-top:10px" data-work="still">Mình vẫn đang làm</button>`);
}

/* --- Chibi nhắc --- */
function workNudge(now, td, log) {
  if (!working()) return false;
  const c = workCfg(),
    w = S.workNow;
  if (w.brkAt) return false;
  const tot = dayWorkMs(td);
  if (c.over && tot > (c.goal + 1) * 36e5 && log.wkOver !== td) {
    log.wkOver = td;
    save();
    showNudge({
      text: '🌙 Hôm nay bạn làm ' + fmtDur(tot) + ' rồi, quá mục tiêu ' + c.goal + ' giờ. Nghỉ ngơi thôi nhé?',
      btns: ['🏁 Kết thúc ca', 'Làm thêm chút'],
      onBtn: i => {
        if (i === 0) workEnd();
      }
    });
    return true;
  }
  if (c.stretch && !lazyDay() && Date.now() - (w.lastStretch || new Date(w.start)) > 60 * 6e4) {
    w.lastStretch = Date.now();
    save();
    showNudge({
      text: '🧘 Ngồi 1 tiếng rồi đó. Đứng dậy vươn vai, xoay cổ vai gáy, uống ngụm nước nha!',
      btns: ['Xong rồi ✨', '☕ Nghỉ giải lao'],
      onBtn: i => {
        if (i === 1) workBreak();
      }
    });
    return true;
  }
  return false;
}

/* --- Sự kiện --- */
document.addEventListener('click', e => {
  const t = e.target.closest('button');
  if (!t) return;
  const D = t.dataset,
    c = workCfg();
  if (D.work) {
    const a = D.work;
    if (a === 'start') workStart();
    else if (a === 'brk') workBreak();
    else if (a === 'end') {
      const s = workEnd();
      if (s)
        say('Xong ca ' + fmtDur(sessMs(s)) + '. Hôm nay tổng ' + fmtDur(dayWorkMs(dk(new Date(s.s)))) + ' 🎉', 3500);
    } else if (a === 'stats') workStats(0);
    else if (a === 'forgot') {
      const v = $('#wkForgot').value;
      if (!v) return;
      let end = setHM(S.workNow.start, v);
      if (end <= new Date(S.workNow.start)) end.setDate(end.getDate() + 1);
      if (end > new Date()) end = new Date();
      closeSheet();
      workEnd(end);
      say('Đã lưu ca làm 👌');
    } else if (a === 'still') closeSheet();
    return;
  }
  if (D.wkweek !== undefined) return workStats(+D.wkweek);
  if (D.wkday) return workDaySheet(D.wkday);
  if (D.wkgoal) {
    c.goal = +D.wkgoal;
    render();
    return workStats(0);
  }
  if (D.wkopt) {
    c[D.wkopt] = !c[D.wkopt];
    t.setAttribute('aria-pressed', !!c[D.wkopt]);
    save();
    return;
  }
  if (D.wkdel) {
    const [k, id] = D.wkdel.split(':'),
      d = S.days[k];
    if (d) d.work = worksOf(d).filter(w => w.id !== id);
    render();
    return workDaySheet(k);
  }
  if (D.wkadd) {
    const k = D.wkadd,
      s = $('#wkNs').value,
      en = $('#wkNe').value;
    if (!s || !en) return;
    const base = k + 'T00:00:00',
      w = {
        id: uid(),
        s: setHM(base, s).toISOString(),
        e: setHM(base, en).toISOString(),
        brk: Math.max(0, +$('#wkNb').value || 0) * 6e4
      };
    fixSess(w);
    const d = S.days[k] || (S.days[k] = {});
    d.work = worksOf(d)
      .concat(w)
      .sort((a, b) => a.s.localeCompare(b.s));
    render();
    return workDaySheet(k);
  }
});
document.addEventListener('change', e => {
  const t = e.target,
    D = t.dataset,
    id = D.wks || D.wke || D.wkb;
  if (!id) return;
  let k = null,
    w = null;
  for (const [dk2, d] of Object.entries(S.days))
    for (const x of worksOf(d))
      if (x.id === id) {
        k = dk2;
        w = x;
      }
  if (!w) return;
  if (D.wks && t.value) w.s = setHM(w.s, t.value).toISOString();
  if (D.wke && t.value) w.e = setHM(w.s, t.value).toISOString();
  if (D.wkb !== undefined) w.brk = Math.max(0, +t.value || 0) * 6e4;
  fixSess(w);
  render();
  workDaySheet(k);
});
/* cập nhật số giờ đang chạy */
setInterval(() => {
  const el = $('#workLive');
  if (el && working()) el.textContent = fmtDur(liveMs());
}, 15000);
/* ca chạy quá 14 tiếng → hỏi có quên bấm kết thúc không (1 lần mỗi ca), kiểm tra khi mở app */
function checkForgot() {
  if (!working() || liveMs() < 14 * 36e5 || $('#sheetbg').classList.contains('on')) return;
  const log = S.nudgeLog || (S.nudgeLog = {});
  if (log.wkForgot === S.workNow.start) return;
  log.wkForgot = S.workNow.start;
  save();
  askForgotEnd();
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') setTimeout(checkForgot, 800);
});
setInterval(checkForgot, 60000);
setTimeout(checkForgot, 1200);
