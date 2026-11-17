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
function buildIcs(ev) {
  const L = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Cozy Life OS//VI',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    'UID:' + ev.uid + '@cozy-life-os',
    'DTSTAMP:' + icsUTC(new Date()),
    'SUMMARY:' + icsEsc(ev.title)
  ];
  if (ev.date) {
    const n = new Date(ev.date + 'T00:00:00');
    n.setDate(n.getDate() + 1);
    L.push('DTSTART;VALUE=DATE:' + ev.date.replace(/-/g, ''), 'DTEND;VALUE=DATE:' + dk(n).replace(/-/g, ''));
  } else
    L.push('DTSTART:' + icsUTC(ev.start), 'DTEND:' + icsUTC(new Date(ev.start.getTime() + (ev.durMin || 30) * 6e4)));
  if (ev.rrule) L.push('RRULE:' + ev.rrule);
  if (ev.desc) L.push('DESCRIPTION:' + icsEsc(ev.desc));
  if (ev.url) L.push('URL:' + String(ev.url).replace(/[\r\n]/g, ''));
  L.push(
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'DESCRIPTION:' + icsEsc(ev.title),
    'TRIGGER:' + ev.trigger,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  );
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
  const c = today().checkin;
  return !!c && (c.body === 'sick' || c.energy <= 2);
}
function showNudge(n) {
  nudgeCur = n;
  const el = $('#nudge');
  el.innerHTML = `<div class="board"><span class="nail l"></span><span class="nail r"></span><button class="xbtn bx" data-nudge="close" aria-label="Đóng">✕</button><p class="bt">🧸 Chibi nhắc nè</p><p>${n.text}</p><div class="row">${n.open ? '<button class="btn" data-nudge="open">Xem</button>' : ''}<button class="btn ghost" data-nudge="snooze">Để sau</button>${n.stop ? '<button class="btn ghost" data-nudge="stop">Đừng nhắc việc này nữa</button>' : ''}</div></div><i class="pole a"></i><i class="pole b"></i>`;
  clearTimeout(P.t);
  if (P.act) endAct();
  const b = bounds(),
    tx = Math.round(Math.min(b.maxX, Math.max(b.minX, innerWidth / 2 - PW / 2))),
    ty = b.maxY,
    ms = reduce ? 0 : Math.max(350, (Math.hypot(tx - P.x, ty - P.y) / 170) * 1000);
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
  if (was && !reduce) {
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
