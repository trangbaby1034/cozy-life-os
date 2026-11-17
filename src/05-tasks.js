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
let tfilter = 'all',
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
  const open = S.tasks.filter(t => !t.done && inF(t)),
    done = S.tasks.filter(t => t.done && inF(t)).sort((a, b) => String(b.doneAt).localeCompare(String(a.doneAt)));
  const pp = pomoState(),
    pomoTop = !!pp.endAt || pomoLeft() < pomoLen(pp.mode) || pp.mode !== 'focus';
  let h = pomoTop ? pomoCard() : '';
  h += `<div class="card"><h2>📋 Việc cần làm <small>${S.tasks.filter(t => !t.done).length} việc</small></h2>
  <form id="taskF" class="addrow"><input class="inp" id="tnew" placeholder="Thêm việc mới…" maxlength="140" autocomplete="off" enterkeyhint="done"><button class="btn" aria-label="Thêm việc">＋</button></form>
  <div class="row gpick" role="group" aria-label="Nhóm của việc mới">${GROUPS.map(([k, i, n]) => `<button class="chip sm" data-tg="${k}" aria-pressed="${S.taskGroup === k}">${i} ${n}</button>`).join('')}</div></div>`;
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
