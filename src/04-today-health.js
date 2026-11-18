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
  ['nap', '😴', 'Ngủ trưa'],
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
  C.nap = () => napCard();
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
    return (
      `<div class="card"><h2>😴 Giấc ngủ</h2><p class="muted">Chưa có dữ liệu. Tối nay bấm "Đi ngủ" ở tab Hôm nay nhé!</p></div>` +
      napHealth()
    );
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
    ${napHealth()}
    <div class="card"><h2>Sắp có ở bước sau</h2><p class="muted" style="margin:0">Hồ sơ sức khỏe, tủ thuốc, nhật ký triệu chứng, nợ ngủ trong tuần.</p></div>`;
}
