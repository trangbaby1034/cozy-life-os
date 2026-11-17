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
  if (c.body === 'sick') {
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
    notes.push('🦵 Đang đau nhức cơ: tránh nhóm cơ đang đau, thêm giãn cơ cuối buổi.');
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
    title = 'Nghỉ / giãn cơ nhẹ';
  } else if (key) {
    const [lb, gs] = SPLITS[key];
    title = lb;
    groups = gs.filter(g => {
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
        .filter(g => recovery(g).s === 'long')
        .slice(0, 3);
      notes.push('💜 Gợi ý thay bằng nhóm lâu chưa tập.');
    }
  } else {
    title = null;
    groups = GG.slice(0, 9)
      .map(x => x[0])
      .filter(g => recovery(g).s !== 'rest')
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
    if (!window.confetti || reduce) return;
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
