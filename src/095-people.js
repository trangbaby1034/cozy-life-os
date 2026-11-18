/* ---------- 💌 Người thương ---------- */
/* person: { id, name, rel, bday:'YYYY-MM-DD', noYear, annis:[{id,n,date}], likes, food, allergy,
             sizes:{top,bottom,shoe}, budget, wish:[{id,t}], gifts:[{id,t,price,st}], note,
             lastMet:'YYYY-MM-DD', missOn, mute, bellSig, createdAt }
   appt:   { id, date, time, title, who:[personId], place, note, done, remind, lead, bellSig, createdAt } */
const REL = [
  ['love', '💞', 'Người yêu'],
  ['mom', '👩', 'Mẹ'],
  ['dad', '👨', 'Bố'],
  ['sib', '🧑‍🤝‍🧑', 'Anh chị em'],
  ['grand', '👵', 'Ông bà'],
  ['bff', '🫶', 'Bạn thân'],
  ['friend', '😊', 'Bạn bè'],
  ['work', '💼', 'Đồng nghiệp'],
  ['other', '🌷', 'Khác']
];
const relInfo = k => REL.find(r => r[0] === k) || REL[REL.length - 1];
const GST = [
  ['idea', '💡', 'Ý tưởng'],
  ['ordered', '🛒', 'Đã đặt'],
  ['wrapped', '🎁', 'Đã gói'],
  ['given', '💝', 'Đã tặng']
];
const gstInfo = k => GST.find(g => g[0] === k) || GST[0];
const MISS_DAYS = 60;
const BLEADS = [
  [0, 'Đúng ngày'],
  [1, 'Trước 1 ngày'],
  [3, 'Trước 3 ngày'],
  [7, 'Trước 1 tuần']
];
const ALEADS = [
  [0, 'Đúng giờ'],
  [30, 'Trước 30 phút'],
  [60, 'Trước 1 giờ'],
  [1440, 'Trước 1 ngày']
];
let pEdit = null,
  aEdit = null;
const personById = id => S.people.find(p => p.id === id);
const apptById = id => S.appts.find(a => a.id === id);
const pName = p => esc(p.name || 'Chưa đặt tên');

/* --- Tiền: "500k", "1tr2", "1.500.000" --- */
function parseMoney(s) {
  s = String(s || '')
    .toLowerCase()
    .replace(/\s/g, '');
  if (!s) return 0;
  const tr = s.match(/^(\d+)(?:tr|triệu)(\d*)$/);
  if (tr) return +tr[1] * 1e6 + (tr[2] ? +(tr[2] + '00000').slice(0, 6) : 0);
  const m = s.match(/^([\d.,]+)(k|nghìn|ngàn|tr|triệu)?$/);
  if (!m) return 0;
  let n = m[1];
  n = /[.,]\d{3}(\D|$)/.test(n) ? n.replace(/[.,]/g, '') : n.replace(',', '.');
  const v = parseFloat(n) || 0;
  return Math.round(v * (m[2] === 'k' || m[2] === 'nghìn' || m[2] === 'ngàn' ? 1e3 : m[2] ? 1e6 : 1));
}
const fmtMoney = n => (n ? Number(n).toLocaleString('vi-VN') + 'đ' : '');

/* --- Ngày --- */
function dayStart(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function daysUntil(d) {
  return Math.round((dayStart(d) - dayStart(new Date())) / 864e5);
}
/* lần tới của một ngày lặp hằng năm (date 'YYYY-MM-DD'), 29/2 → 28/2 năm không nhuận */
function nextOcc(date, from) {
  if (!date) return null;
  const [, m, d] = date.split('-').map(Number),
    f = dayStart(from || new Date());
  const mk = y => {
    const leap = new Date(y, 1, 29).getMonth() === 1;
    return new Date(y, m - 1, m === 2 && d === 29 && !leap ? 28 : d);
  };
  let o = mk(f.getFullYear());
  if (o < f) o = mk(f.getFullYear() + 1);
  return o;
}
const fmtDM = d => pad(d.getDate()) + '/' + pad(d.getMonth() + 1);
const WDS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
function inDays(n) {
  return n === 0 ? 'hôm nay' : n === 1 ? 'ngày mai' : n === 2 ? 'ngày kia' : 'còn ' + n + ' ngày';
}
const apptAt = a => {
  const [h, m] = (a.time || '09:00').split(':').map(Number),
    d = new Date(a.date + 'T00:00:00');
  d.setHours(h, m, 0, 0);
  return d;
};

/* Các dịp sắp tới trong `days` ngày (sinh nhật, kỷ niệm, lịch hẹn) */
function upcoming(days) {
  const L = [],
    now = new Date(),
    td = dk(now);
  S.people.forEach(p => {
    const b = nextOcc(p.bday);
    if (b && daysUntil(b) <= days) {
      const age = p.noYear ? 0 : b.getFullYear() - +p.bday.slice(0, 4);
      L.push({
        k: 'bday',
        d: b,
        n: daysUntil(b),
        p,
        title: '🎂 Sinh nhật ' + pName(p) + (age > 0 ? ' (' + age + ' tuổi)' : '')
      });
    }
    (p.annis || []).forEach(a => {
      const o = nextOcc(a.date);
      if (o && daysUntil(o) <= days) {
        const yrs = o.getFullYear() - +a.date.slice(0, 4);
        L.push({
          k: 'anni',
          d: o,
          n: daysUntil(o),
          p,
          a,
          title: '💐 ' + esc(a.n || 'Ngày kỷ niệm') + ' · ' + pName(p) + (yrs > 0 ? ' (' + yrs + ' năm)' : '')
        });
      }
    });
  });
  S.appts
    .filter(a => a.date >= td && !a.done)
    .forEach(a => {
      const d = apptAt(a),
        n = daysUntil(d);
      if (n <= days && (n > 0 || d > now - 2 * 36e5))
        L.push({ k: 'appt', d, n, ap: a, title: '📅 ' + esc(a.title || 'Lịch hẹn') + (a.time ? ' · ' + a.time : '') });
    });
  return L.sort((x, y) => x.d - y.d);
}
function bdayToday() {
  return S.people.filter(p => {
    const b = nextOcc(p.bday);
    return b && daysUntil(b) === 0;
  });
}
const missDays = p => daysSince((p.lastMet || p.createdAt.slice(0, 10)) + 'T00:00:00');

/* --- Chuông lịch --- */
const bdayLv = p => (p.mute ? 'none' : S.remindDefault.bday);
const aLv = a => a.remind || S.remindDefault.appt;
const pSig = p =>
  JSON.stringify([p.name, p.bday, p.noYear, (p.annis || []).map(a => [a.n, a.date]), S.remindDefault.bdayLead]);
const aSig = a => JSON.stringify([a.title, a.date, a.time, a.place, aLv(a), a.lead]);
const pHasDates = p => p.bday || (p.annis || []).some(a => a.date);
const pNeedsBell = p => bdayLv(p) === 'cal' && pHasDates(p) && p.bellSig !== pSig(p);
const aNeedsBell = a => !a.done && aLv(a) === 'cal' && a.date >= dk(new Date()) && a.bellSig !== aSig(a);
function yearlyEv(uid, title, date, desc) {
  const o = nextOcc(date),
    [, m, d] = date.split('-').map(Number),
    lead = S.remindDefault.bdayLead,
    T = ['PT9H'];
  if (lead === 1) T.push('-PT15H');
  else if (lead > 1) T.push('-P' + (lead - 1) + 'DT15H');
  return {
    uid,
    title,
    date: dk(o),
    rrule: m === 2 && d === 29 ? 'FREQ=YEARLY;BYMONTH=2;BYMONTHDAY=-1' : 'FREQ=YEARLY',
    triggers: T,
    desc
  };
}
function personIcs(p) {
  const E = [],
    gifts = (p.gifts || []).filter(g => g.st !== 'given').map(g => g.t),
    desc = [
      'Từ Cozy Life OS 💌',
      gifts.length ? 'Ý tưởng quà: ' + gifts.join(', ') : '',
      p.likes ? 'Thích: ' + p.likes : ''
    ]
      .filter(Boolean)
      .join('\n');
  if (p.bday) E.push(yearlyEv('bday-' + p.id, '🎂 Sinh nhật ' + (p.name || ''), p.bday, desc));
  (p.annis || [])
    .filter(a => a.date)
    .forEach(a =>
      E.push(yearlyEv('anni-' + a.id, '💐 ' + (a.n || 'Ngày kỷ niệm') + ' · ' + (p.name || ''), a.date, desc))
    );
  return buildIcs(E);
}
function apptIcs(a) {
  const who = (a.who || [])
      .map(personById)
      .filter(Boolean)
      .map(p => p.name),
    lead = a.lead === undefined ? 60 : a.lead;
  return buildIcs({
    uid: 'appt-' + a.id,
    title: '📅 ' + (a.title || 'Lịch hẹn') + (who.length ? ' · ' + who.join(', ') : ''),
    start: apptAt(a),
    durMin: 90,
    loc: a.place || '',
    triggers: lead ? ['-PT' + lead + 'M', 'PT0S'].filter((x, i) => i || lead) : ['PT0S'],
    desc: ['Từ Cozy Life OS 💌', a.note || ''].filter(Boolean).join('\n')
  });
}
const icsName = s =>
  'cozy-' +
  String(s || 'lich')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .slice(0, 40) +
  '.ics';
function calSheet(title, when, back) {
  openSheet(`<h2>📅 Thêm vào Lịch</h2><p class="muted">iPhone sẽ hiện bảng sự kiện "<b>${title}</b>". Bấm <b>Thêm tất cả</b> (hoặc <b>Thêm vào Lịch</b>) là xong. ${when}</p>
  <p class="muted">Không thấy gì hiện ra? Bấm nút dưới, chọn <b>Lưu vào Tệp</b>, rồi mở file đó trong app Tệp.</p>
  <div class="row" style="margin-top:12px"><button class="btn" data-p="${back}">Xong</button><button class="btn ghost" data-a="shareIcs">📤 Gửi file lịch</button></div>`);
}
function personBell(p) {
  deliverIcs(icsName(p.name), personIcs(p));
  p.bellSig = pSig(p);
  save();
  const lead = S.remindDefault.bdayLead;
  calSheet(
    pName(p),
    'Lịch sẽ báo lúc 9:00 sáng ' + (lead ? 'trước ' + lead + ' ngày và ' : '') + 'đúng ngày, năm nào cũng nhắc.',
    'back:' + p.id
  );
}
function apptBell(a) {
  deliverIcs(icsName(a.title), apptIcs(a));
  a.bellSig = aSig(a);
  save();
  const lead = a.lead === undefined ? 60 : a.lead;
  calSheet(
    esc(a.title || 'Lịch hẹn'),
    'Lịch sẽ báo ' +
      (lead
        ? (lead >= 1440 ? 'trước 1 ngày' : 'trước ' + (lead >= 60 ? lead / 60 + ' giờ' : lead + ' phút')) + ' và '
        : '') +
      'đúng giờ hẹn.',
    'aback:' + a.id
  );
}

/* --- Tab 💌 --- */
function upRow(x) {
  const when = `<i>${WDS[x.d.getDay()]} ${fmtDM(x.d)} · ${inDays(x.n)}</i>`;
  const open = x.k === 'appt' ? `data-popen="a:${x.ap.id}"` : `data-popen="p:${x.p.id}"`;
  const gi = x.p ? (x.p.gifts || []).filter(g => g.st !== 'given') : [];
  const gtag =
    x.k === 'bday' && x.n <= 14
      ? gi.length
        ? ` <span class="gtag">${gstInfo(gi.reduce((a, g) => (GST.findIndex(s => s[0] === g.st) > GST.findIndex(s => s[0] === a) ? g.st : a), 'idea'))[1]} ${gi.length} quà</span>`
        : ' <span class="gtag warn">chưa có quà</span>'
      : '';
  return `<button class="uprow ${x.n === 0 ? 'now' : ''}" ${open}><span>${x.title}${gtag}</span>${when}</button>`;
}
function personRow(p) {
  const [, ri, rn] = relInfo(p.rel),
    b = nextOcc(p.bday),
    md = missDays(p),
    bits = [rn];
  if (b) bits.push('🎂 ' + fmtDM(b) + (daysUntil(b) <= 30 ? ' (' + inDays(daysUntil(b)) + ')' : ''));
  if (p.lastMet) bits.push(md === 0 ? '👋 gặp hôm nay' : '👋 ' + md + ' ngày trước');
  const miss = !p.mute && p.missOn !== false && p.lastMet && md >= MISS_DAYS;
  return `<div class="prow"><button class="pmain" data-popen="p:${p.id}"><span class="pav">${ri}</span><span><b>${pName(p)}</b><i>${bits.join(' · ')}</i>${miss ? '<i class="over">Lâu rồi chưa gặp 🥺</i>' : ''}</span></button><button class="chip sm" data-pmet="${p.id}" aria-label="Vừa gặp ${pName(p)}" title="Vừa gặp / vừa gọi">👋</button></div>`;
}
function viewPeople() {
  const up = upcoming(30),
    G = [];
  S.people.forEach(p => (p.gifts || []).forEach(g => G.push([p, g])));
  const open = G.filter(([, g]) => g.st !== 'given'),
    spent = G.filter(([, g]) => g.st === 'given' && (g.at || '').slice(0, 4) === String(new Date().getFullYear()));
  let h = `<div class="card"><h2>💌 Người thương <small>${S.people.length}</small></h2><p class="muted" style="margin:0 0 10px">Nhớ sinh nhật, sở thích và lên kế hoạch quà cho những người bạn thương.</p><div class="row"><button class="btn" data-p="addP">＋ Thêm người</button><button class="btn ghost" data-p="addA">📅 Lịch hẹn</button></div></div>`;
  h += `<div class="card"><h2>🗓️ Sắp tới <small>30 ngày</small></h2>${up.length ? up.map(upRow).join('') : '<p class="muted" style="margin:0">Chưa có sinh nhật, ngày kỷ niệm hay lịch hẹn nào trong 30 ngày tới.</p>'}</div>`;
  if (S.people.length)
    h += `<div class="card"><h2>👥 Danh sách</h2>${S.people
      .slice()
      .sort((a, b) => {
        const x = nextOcc(a.bday),
          y = nextOcc(b.bday);
        return (
          (x ? daysUntil(x) : 999) - (y ? daysUntil(y) : 999) || String(a.name).localeCompare(String(b.name), 'vi')
        );
      })
      .map(personRow)
      .join(
        ''
      )}<p class="muted" style="margin:8px 0 0">👋 = vừa gặp hoặc vừa gọi điện. Quá ${MISS_DAYS} ngày chưa gặp, Chibi sẽ nhắc nhẹ.</p></div>`;
  if (G.length) {
    const sum = open.reduce((a, [, g]) => a + (g.price || 0), 0),
      sp = spent.reduce((a, [, g]) => a + (g.price || 0), 0);
    h += `<div class="card"><h2>🎁 Quà đang chuẩn bị <small>${open.length}</small></h2>
    <div class="gpipe">${GST.map(([k, i, n]) => `<span><b>${i} ${G.filter(([, g]) => g.st === k).length}</b>${n}</span>`).join('')}</div>
    ${open
      .slice(0, 8)
      .map(
        ([p, g]) =>
          `<button class="uprow" data-popen="p:${p.id}"><span>${gstInfo(g.st)[1]} ${esc(g.t)} <i>cho ${pName(p)}</i></span><i>${fmtMoney(g.price)}</i></button>`
      )
      .join('')}
    <p class="muted" style="margin:8px 0 0">${sum ? 'Dự kiến: <b>' + fmtMoney(sum) + '</b>' : ''}${sum && sp ? ' · ' : ''}${sp ? 'Đã tặng năm nay: <b>' + fmtMoney(sp) + '</b>' : ''}</p></div>`;
  }
  const past = S.appts
    .filter(a => a.done || a.date < dk(new Date()))
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
  if (past.length)
    h += `<div class="card"><details class="more"><summary>📖 Lịch hẹn đã qua (${past.length})</summary>${past
      .slice(0, 30)
      .map(
        a =>
          `<button class="uprow" data-popen="a:${a.id}"><span>${a.done ? '✅' : '📅'} ${esc(a.title || 'Lịch hẹn')}</span><i>${fmtDM(new Date(a.date + 'T00:00:00'))}/${a.date.slice(0, 4)}</i></button>`
      )
      .join('')}</details></div>`;
  return h;
}

/* --- Chi tiết người --- */
function pRemindHtml(p) {
  const L = bdayLv(p);
  if (!pHasDates(p)) return `<p class="muted" style="margin:0">Thêm ngày sinh nhật hoặc ngày kỷ niệm để được nhắc.</p>`;
  let h = `<p class="muted" style="margin:0 0 8px">Mức nhắc chung: <b>${lvInfo(L)[1]} ${lvInfo(L)[2]}</b>${S.remindDefault.bdayLead ? ', báo trước ' + S.remindDefault.bdayLead + ' ngày' : ''} (đổi trong Cài đặt › Nhắc nhở).</p>`;
  if (L === 'cal') {
    const ok = p.bellSig === pSig(p);
    h += `<div class="okline ${ok ? '' : 'warn'}" style="margin:0"><span>${ok ? '🔔' : '🔕'}</span><span>${ok ? 'Đã thêm vào Lịch iPhone, nhắc hằng năm' : p.bellSig ? 'Ngày đã đổi, nhớ xóa sự kiện cũ trên iPhone rồi thêm lại' : 'Chưa thêm vào Lịch iPhone'}</span></div>
    <div class="row" style="margin-top:8px"><button class="btn ${ok ? 'ghost' : ''}" data-p="bell:${p.id}">📅 ${ok ? 'Thêm lại vào Lịch' : 'Thêm vào Lịch (lặp hằng năm)'}</button>${ok ? '' : `<button class="btn ghost" data-p="belldone:${p.id}">👌 Tôi đặt rồi</button>`}</div>`;
  } else if (L === 'chibi') h += `<p class="muted" style="margin:0">Chibi nhắc khi bạn mở app.</p>`;
  h += `<div class="row" style="margin-top:10px"><button class="chip sm" data-p="mute:${p.id}" aria-pressed="${!!p.mute}">🔕 Không nhắc người này</button><button class="chip sm" data-p="miss:${p.id}" aria-pressed="${p.missOn !== false}">🥺 Nhắc khi lâu chưa gặp</button></div>`;
  return h;
}
function wishHtml(p) {
  return (p.wish || [])
    .map(
      w =>
        `<div class="task"><span class="ntext" style="flex:1">${esc(w.t)}</span><button class="xbtn" data-pw2g="${w.id}" title="Chuyển thành ý tưởng quà" aria-label="Chuyển thành quà">🎁</button><button class="xbtn" data-pwdel="${w.id}" aria-label="Xóa">✕</button></div>`
    )
    .join('');
}
function giftsHtml(p) {
  const L = p.gifts || [],
    sum = L.filter(g => g.st !== 'given').reduce((a, g) => a + (g.price || 0), 0),
    bud = p.budget || 0;
  return (
    L.map(
      g =>
        `<div class="grow ${g.st === 'given' ? 'done' : ''}"><input type="text" class="inp" data-pgt="${g.id}" value="${esc(g.t)}" aria-label="Tên quà"><input type="text" class="inp gprice" data-pgp="${g.id}" value="${g.price ? Number(g.price).toLocaleString('vi-VN') : ''}" placeholder="Giá" inputmode="text" aria-label="Giá"><button class="xbtn" data-pgdel="${g.id}" aria-label="Xóa quà">✕</button><div class="row gst">${GST.map(([k, i, n]) => `<button class="chip sm" data-pgst="${g.id}:${k}" aria-pressed="${g.st === k}">${i} ${n}</button>`).join('')}</div></div>`
    ).join('') +
    (L.length || bud
      ? `<p class="muted" style="margin:8px 0 0">Dự kiến: <b>${fmtMoney(sum) || '0đ'}</b>${bud ? ' / ngân sách ' + fmtMoney(bud) + (sum > bud ? ' · <span class="over">vượt ' + fmtMoney(sum - bud) + '</span>' : ' · còn ' + fmtMoney(bud - sum)) : ''}</p>`
      : '')
  );
}
function annisHtml(p) {
  return (p.annis || [])
    .map(
      a =>
        `<div class="row" style="flex-wrap:nowrap;margin-bottom:6px"><input class="inp" data-pan="${a.id}" value="${esc(a.n || '')}" placeholder="vd: Ngày yêu nhau" maxlength="40" aria-label="Tên ngày kỷ niệm"><input class="inp" type="date" data-pad="${a.id}" value="${a.date || ''}" style="max-width:160px" aria-label="Ngày"><button class="xbtn" data-pandel="${a.id}" aria-label="Xóa">✕</button></div>`
    )
    .join('');
}
function ageHtml(p) {
  if (!p.bday) return '';
  const b = nextOcc(p.bday),
    n = daysUntil(b);
  return `<p class="muted" style="margin:6px 0 0">${p.noYear ? 'Chọn năm bất kỳ cũng được, app chỉ dùng ngày và tháng. Sinh nhật ' : (n ? 'Lần tới tròn ' : 'Hôm nay tròn ') + (b.getFullYear() - +p.bday.slice(0, 4)) + ' tuổi, '}${n ? inDays(n) + ' (' + fmtDM(b) + ')' : 'chúc mừng sinh nhật 🎉'}.</p>`;
}
function personSheet(id) {
  const p = personById(id);
  if (!p) return;
  pEdit = id;
  const z = p.sizes || {},
    fld = (k, lab, ph, max) =>
      `<div class="q"><h3>${lab}</h3><input class="inp" data-pf="${k}" value="${esc(k.split('.').reduce((o, x) => (o || {})[x], p) || '')}" placeholder="${ph}" maxlength="${max || 200}"></div>`;
  const pa = S.appts
    .filter(a => (a.who || []).includes(id))
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
  openSheet(`<h2>${relInfo(p.rel)[1]} ${pName(p)}</h2>
  <div class="q" style="margin-top:10px"><input class="inp" data-pf="name" value="${esc(p.name || '')}" placeholder="Tên hoặc biệt danh" maxlength="60" aria-label="Tên"></div>
  <div class="q"><h3>Là gì của bạn?</h3><div class="row">${REL.map(([k, i, n]) => `<button class="chip sm" data-prel="${k}" aria-pressed="${p.rel === k}">${i} ${n}</button>`).join('')}</div></div>
  <div class="q"><h3>🎂 Sinh nhật</h3><div class="row" style="flex-wrap:nowrap"><input class="inp" type="date" data-pf="bday" value="${p.bday || ''}" style="max-width:180px" aria-label="Ngày sinh"><button class="chip sm" data-p="noyear:${id}" aria-pressed="${!!p.noYear}">Không rõ năm</button></div><div id="pAge">${ageHtml(p)}</div></div>
  <div class="q"><h3>💐 Ngày kỷ niệm</h3><div id="pAnnis">${annisHtml(p)}</div><button class="chip sm" data-p="addAnni">＋ Thêm ngày kỷ niệm</button></div>
  <div class="q"><h3>🔔 Nhắc nhở</h3><div id="pRemind">${pRemindHtml(p)}</div></div>
  ${fld('likes', '💖 Sở thích', 'vd: hoa tulip, đọc sách, mèo')}
  ${fld('food', '🍜 Gu ăn uống', 'vd: thích trà sữa ít đường, không ăn hành')}
  ${fld('allergy', '⚠️ Dị ứng', 'vd: tôm, đậu phộng')}
  <div class="q"><h3>👕 Size</h3><div class="row" style="flex-wrap:nowrap"><input class="inp" data-pf="sizes.top" value="${esc(z.top || '')}" placeholder="Áo" maxlength="20" aria-label="Size áo"><input class="inp" data-pf="sizes.bottom" value="${esc(z.bottom || '')}" placeholder="Quần" maxlength="20" aria-label="Size quần"><input class="inp" data-pf="sizes.shoe" value="${esc(z.shoe || '')}" placeholder="Giày" maxlength="20" aria-label="Size giày"></div></div>
  <div class="q"><h3>📝 Từng nhắc là thích</h3><p class="muted" style="margin:0 0 6px">Nghe họ nói thích gì thì ghi ngay, đến dịp chỉ việc chọn.</p><div id="pWish">${wishHtml(p)}</div><form id="pWishF" class="addrow" style="margin-top:6px"><input class="inp" id="pWishNew" placeholder="vd: Nến thơm mùi gỗ" maxlength="100" autocomplete="off" enterkeyhint="done"><button class="btn ghost" aria-label="Thêm">＋</button></form></div>
  <div class="q"><h3>🎁 Kế hoạch quà</h3><div id="pGifts">${giftsHtml(p)}</div><form id="pGiftF" class="addrow" style="margin-top:6px"><input class="inp" id="pGiftNew" placeholder="Món quà…" maxlength="100" autocomplete="off"><input class="inp gprice" id="pGiftPrice" placeholder="Giá" aria-label="Giá"><button class="btn ghost" aria-label="Thêm quà">＋</button></form>
   <div class="row" style="margin-top:8px;flex-wrap:nowrap;align-items:center"><span class="muted" style="white-space:nowrap">Ngân sách:</span><input class="inp" data-pbud="1" value="${p.budget ? Number(p.budget).toLocaleString('vi-VN') : ''}" placeholder="vd: 500k" style="max-width:160px" aria-label="Ngân sách"></div></div>
  <div class="q"><h3>👋 Lần gặp gần nhất</h3><div class="row" style="flex-wrap:nowrap"><input class="inp" type="date" data-pf="lastMet" value="${p.lastMet || ''}" style="max-width:180px" aria-label="Lần gặp gần nhất"><button class="chip sm" data-pmet="${id}" data-insheet="1">👋 Hôm nay</button></div></div>
  ${
    pa.length
      ? `<div class="q"><h3>📅 Lịch hẹn</h3>${pa
          .slice(0, 6)
          .map(
            a =>
              `<button class="uprow" data-popen="a:${a.id}"><span>${a.done ? '✅' : '📅'} ${esc(a.title || 'Lịch hẹn')}</span><i>${fmtDM(new Date(a.date + 'T00:00:00'))} ${a.time || ''}</i></button>`
          )
          .join('')}</div>`
      : ''
  }
  <div class="q"><h3>Ghi chú</h3><textarea class="inp" data-pf="note" rows="3" maxlength="2000">${esc(p.note || '')}</textarea></div>
  <div class="row" style="margin-top:18px"><button class="btn" data-p="close">Xong</button><button class="btn ghost" data-p="apptFor:${id}">📅 Hẹn gặp</button></div>
  <div class="row" style="margin-top:10px"><button class="btn ghost danger" data-p="delP">🗑️ Xóa người này</button></div>`);
}
const refreshP = () => {
  const p = personById(pEdit);
  if (!p) return;
  [
    ['#pRemind', pRemindHtml],
    ['#pGifts', giftsHtml],
    ['#pWish', wishHtml],
    ['#pAnnis', annisHtml],
    ['#pAge', ageHtml]
  ].forEach(([s, f]) => {
    if ($(s)) $(s).innerHTML = f(p);
  });
};

/* --- Lịch hẹn --- */
function aRemindHtml(a) {
  const L = aLv(a),
    lead = a.lead === undefined ? 60 : a.lead;
  let h = `<div class="row">${LV.slice(0, 3)
    .map(([k, i, n]) => `<button class="chip sm" data-alv="${k}" aria-pressed="${L === k}">${i} ${n}</button>`)
    .join('')}</div>`;
  if (L === 'none') return h;
  h += `<div class="row" style="margin-top:8px">${ALEADS.map(([v, n]) => `<button class="chip sm" data-alead="${v}" aria-pressed="${lead === v}">${n}</button>`).join('')}</div>`;
  if (L === 'cal' && a.date) {
    const ok = a.bellSig === aSig(a);
    h += `<div class="okline ${ok ? '' : 'warn'}" style="margin:10px 0 0"><span>${ok ? '🔔' : '🔕'}</span><span>${ok ? 'Đã thêm vào Lịch iPhone' : a.bellSig ? 'Đã đổi giờ/nơi, nhớ xóa sự kiện cũ rồi thêm lại' : 'Chưa thêm vào Lịch iPhone'}</span></div>`;
  } else if (L === 'chibi') h += `<p class="muted" style="margin:8px 0 0">Chibi nhắc khi bạn đang mở app.</p>`;
  return h;
}
function apptSheet(id, pre) {
  let a = id && apptById(id);
  if (!a) {
    const s = new Date(Math.ceil(Date.now() / 18e5) * 18e5);
    a = {
      id: uid(),
      date: dk(s),
      time: hm(s),
      title: '',
      who: pre ? [pre] : [],
      place: '',
      note: '',
      createdAt: new Date().toISOString(),
      draft: true
    };
  }
  aEdit = a;
  const maps = a.place ? 'https://maps.apple.com/?q=' + encodeURIComponent(a.place) : '';
  openSheet(`<h2>${a.draft ? '📅 Lịch hẹn mới' : '✏️ Lịch hẹn'}</h2>
  <div class="q" style="margin-top:10px"><input class="inp" id="aTitle" value="${esc(a.title)}" placeholder="vd: Ăn tối, Cà phê, Xem phim" maxlength="80" aria-label="Hẹn gì"></div>
  <div class="q"><h3>Khi nào</h3><div class="row" style="flex-wrap:nowrap"><input class="inp" type="date" id="aDate" value="${a.date}" aria-label="Ngày"><input class="inp" type="time" id="aTime" value="${a.time || ''}" style="max-width:130px" aria-label="Giờ"></div></div>
  <div class="q"><h3>Gặp ai</h3>${S.people.length ? `<div class="row">${S.people.map(p => `<button class="chip sm" data-awho="${p.id}" aria-pressed="${(a.who || []).includes(p.id)}">${relInfo(p.rel)[1]} ${pName(p)}</button>`).join('')}</div>` : '<p class="muted" style="margin:0">Chưa có ai trong danh sách Người thương.</p>'}</div>
  <div class="q"><h3>📍 Ở đâu</h3><div class="row" style="flex-wrap:nowrap"><input class="inp" id="aPlace" value="${esc(a.place || '')}" placeholder="Tên quán hoặc địa chỉ" maxlength="160">${maps ? `<a class="btn ghost" href="${esc(maps)}" target="_blank" rel="noopener">🗺️ Bản đồ</a>` : ''}</div></div>
  <div class="q"><h3>🔔 Nhắc nhở</h3><div id="aRemind">${aRemindHtml(a)}</div></div>
  <div class="q"><h3>Ghi chú</h3><textarea class="inp" id="aNote" rows="2" maxlength="1000">${esc(a.note || '')}</textarea></div>
  <div class="row" style="margin-top:18px"><button class="btn" data-p="aSave">Lưu</button>${a.draft ? '' : `<button class="btn ghost" data-p="aDone">${a.done ? '↩️ Chưa diễn ra' : '✅ Đã gặp'}</button>`}</div>
  ${a.draft ? '' : '<div class="row" style="margin-top:10px"><button class="btn ghost danger" data-p="aDel">🗑️ Xóa lịch hẹn</button></div>'}`);
}
function readAppt() {
  const a = aEdit;
  if (!a || !$('#aTitle')) return a;
  a.title = $('#aTitle').value.trim();
  a.date = $('#aDate').value || a.date;
  a.time = $('#aTime').value;
  a.place = $('#aPlace').value.trim();
  a.note = $('#aNote').value.trim();
  return a;
}
function apptDone(a, on) {
  a.done = on;
  if (on)
    (a.who || []).forEach(pid => {
      const p = personById(pid);
      if (p && (!p.lastMet || p.lastMet < a.date)) p.lastMet = a.date;
    });
}
function metToday(p) {
  p.lastMet = dk(new Date());
  delete p.missAsk;
}

/* --- Today: thẻ Người thương sắp tới + chuông --- */
function peopleCard() {
  const up = upcoming(7);
  if (!up.length) return '';
  return `<div class="card"><h2>💌 Sắp tới <small><button class="chip sm gear" data-tab="people">Xem hết</button></small></h2>${up.slice(0, 4).map(upRow).join('')}</div>`;
}
function peopleBellRows() {
  const P1 = S.people.filter(pNeedsBell),
    A1 = S.appts.filter(aNeedsBell);
  return {
    n: P1.length + A1.length,
    html:
      P1.map(
        p =>
          `<button class="uprow" data-popen="p:${p.id}"><span>🎂 ${pName(p)}</span><i>chưa thêm vào Lịch</i></button>`
      ).join('') +
      A1.map(
        a =>
          `<button class="uprow" data-popen="a:${a.id}"><span>📅 ${esc(a.title || 'Lịch hẹn')}</span><i>${fmtDM(new Date(a.date + 'T00:00:00'))} ${a.time || ''}</i></button>`
      ).join('')
  };
}

/* --- Chibi nhắc --- */
function peopleNudge(now, td, log) {
  /* sinh nhật hôm nay: nhắc 1 lần (kể cả Ngày Lười Biếng) */
  for (const p of bdayToday()) {
    if (bdayLv(p) === 'none' || log['bd-' + p.id] === td || now.getHours() < 7) continue;
    log['bd-' + p.id] = td;
    save();
    showNudge({
      text: '🎉 Hôm nay là sinh nhật <b>' + pName(p) + '</b>! Gửi một lời chúc thật dễ thương nhé 🎂',
      btns: ['🎁 Xem quà', 'Lát nữa'],
      onBtn: i => {
        if (i === 0) {
          tab = 'people';
          render();
          personSheet(p.id);
        }
      }
    });
    return true;
  }
  if (lazyDay()) return false;
  /* lịch hẹn – Chibi nhắc trước giờ */
  for (const a of S.appts) {
    if (a.done || aLv(a) !== 'chibi' || a.date !== td || !a.time) continue;
    const lead = a.lead === undefined ? 60 : a.lead,
      d = (apptAt(a) - now) / 6e4;
    if (d <= Math.max(lead, 15) && d > -30 && log['ap-' + a.id] !== td) {
      log['ap-' + a.id] = td;
      save();
      showNudge({
        text:
          '📅 ' +
          (d > 0 ? 'Còn ' + Math.round(d) + ' phút nữa' : 'Đến giờ') +
          ' hẹn "<b>' +
          esc(a.title || 'Lịch hẹn') +
          '</b>"' +
          (a.place ? ' ở ' + esc(a.place) : '') +
          '.',
        btns: a.place ? ['🗺️ Chỉ đường', 'Ok'] : ['Xem', 'Ok'],
        onBtn: i => {
          if (i) return;
          if (a.place) open('https://maps.apple.com/?q=' + encodeURIComponent(a.place), '_blank');
          else {
            tab = 'people';
            render();
            apptSheet(a.id);
          }
        }
      });
      return true;
    }
  }
  if (now.getHours() < 9) return false;
  /* trước sinh nhật / kỷ niệm (mức Chibi) */
  const lead = S.remindDefault.bdayLead;
  for (const x of upcoming(lead)) {
    if (x.k === 'appt' || x.n === 0 || bdayLv(x.p) !== 'chibi') continue;
    const key = 'up-' + (x.a ? x.a.id : x.p.id);
    if (log[key] === td) continue;
    log[key] = td;
    save();
    const gi = (x.p.gifts || []).filter(g => g.st !== 'given');
    showNudge({
      text:
        x.title +
        ' ' +
        inDays(x.n) +
        ' (' +
        fmtDM(x.d) +
        ').' +
        (x.k === 'bday'
          ? gi.length
            ? ' Đã có ' + gi.length + ' món quà trong kế hoạch.'
            : ' Chưa có quà, mình chuẩn bị nhé?'
          : ''),
      btns: ['Xem', 'Để sau'],
      onBtn: i => {
        if (i === 0) {
          tab = 'people';
          render();
          personSheet(x.p.id);
        }
      }
    });
    return true;
  }
  /* lâu rồi chưa gặp: tối đa 1 lần mỗi tuần */
  const wk = Math.floor(now / 6048e5);
  if (log.miss === wk) return false;
  const M = S.people
    .filter(
      p => !p.mute && p.missOn !== false && p.lastMet && missDays(p) >= MISS_DAYS && (p.missAsk || 0) < Date.now()
    )
    .sort((a, b) => missDays(b) - missDays(a));
  if (!M.length) return false;
  const p = M[0];
  log.miss = wk;
  save();
  showNudge({
    text:
      '🥺 Đã <b>' +
      missDays(p) +
      ' ngày</b> rồi bạn chưa gặp <b>' +
      pName(p) +
      '</b>. Nhắn hỏi thăm hay hẹn một buổi cà phê nhé?',
    btns: ['👋 Vừa gặp/gọi rồi', '📅 Hẹn gặp', 'Để sau'],
    onBtn: i => {
      if (i === 0) {
        metToday(p);
        say('Ghi nhận rồi nha 💞', 2500);
      } else if (i === 1) {
        tab = 'people';
        render();
        apptSheet(null, p.id);
      } else p.missAsk = Date.now() + 14 * 864e5;
      render();
    }
  });
  return true;
}

/* --- Sự kiện của tab 💌 (gắn riêng để không chen vào bộ xử lý chung) --- */
function newPerson() {
  const p = {
    id: uid(),
    name: '',
    rel: 'friend',
    bday: '',
    annis: [],
    sizes: {},
    wish: [],
    gifts: [],
    createdAt: new Date().toISOString()
  };
  S.people.push(p);
  return p;
}
document.addEventListener('click', e => {
  const t = e.target.closest('button');
  if (!t) return;
  const D = t.dataset;
  if (D.popen) {
    const [k, id] = D.popen.split(':');
    if (k === 'p') personSheet(id);
    else apptSheet(id);
    return;
  }
  if (D.pmet) {
    const p = personById(D.pmet);
    if (!p) return;
    metToday(p);
    render();
    if (D.insheet) personSheet(p.id);
    say('Gặp ' + (p.name || 'người thương') + ' vui không? 💞', 2500);
    return;
  }
  const p = personById(pEdit);
  if (D.prel && p) {
    p.rel = D.prel;
    t.parentNode.querySelectorAll('.chip').forEach(b => b.setAttribute('aria-pressed', b === t));
    render();
    return;
  }
  if (D.pgst && p) {
    const [gid, st] = D.pgst.split(':'),
      g = (p.gifts || []).find(x => x.id === gid);
    if (!g) return;
    g.st = st;
    if (st === 'given') g.at = new Date().toISOString();
    refreshP();
    render();
    if (st === 'given') say('Chắc ' + (p.name || 'họ') + ' vui lắm đó 💝', 2500);
    return;
  }
  if (D.pgdel && p) {
    p.gifts = p.gifts.filter(x => x.id !== D.pgdel);
    refreshP();
    render();
    return;
  }
  if (D.pwdel && p) {
    p.wish = p.wish.filter(x => x.id !== D.pwdel);
    refreshP();
    save();
    return;
  }
  if (D.pw2g && p) {
    const w = p.wish.find(x => x.id === D.pw2g);
    if (!w) return;
    p.wish = p.wish.filter(x => x !== w);
    (p.gifts = p.gifts || []).push({ id: uid(), t: w.t, price: 0, st: 'idea' });
    refreshP();
    render();
    return;
  }
  if (D.pandel && p) {
    p.annis = p.annis.filter(x => x.id !== D.pandel);
    refreshP();
    render();
    return;
  }
  if (D.awho && aEdit) {
    const W = aEdit.who || (aEdit.who = []),
      id = D.awho;
    aEdit.who = W.includes(id) ? W.filter(x => x !== id) : W.concat(id);
    t.setAttribute('aria-pressed', aEdit.who.includes(id));
    return;
  }
  if (D.alv && aEdit) {
    readAppt();
    aEdit.remind = D.alv;
    if ($('#aRemind')) $('#aRemind').innerHTML = aRemindHtml(aEdit);
    return;
  }
  if (D.alead !== undefined && aEdit) {
    readAppt();
    aEdit.lead = +D.alead;
    if ($('#aRemind')) $('#aRemind').innerHTML = aRemindHtml(aEdit);
    return;
  }
  if (D.bdlv) {
    S.remindDefault.bday = D.bdlv;
    render();
    return;
  }
  if (D.bdlead !== undefined) {
    S.remindDefault.bdayLead = +D.bdlead;
    render();
    return;
  }
  if (D.aplv) {
    S.remindDefault.appt = D.aplv;
    render();
    return;
  }
  if (!D.p) return;
  const [a, arg] = D.p.split(':');
  if (a === 'addP') {
    const np = newPerson();
    render();
    personSheet(np.id);
    setTimeout(() => {
      const el = document.querySelector('#sheet [data-pf="name"]');
      if (el) el.focus();
    }, 50);
  } else if (a === 'addA') apptSheet(null);
  else if (a === 'apptFor') apptSheet(null, arg);
  else if (a === 'close') {
    const cur = personById(pEdit);
    closeSheet();
    pEdit = null;
    if (cur && !cur.name && !cur.bday && !(cur.gifts || []).length) S.people = S.people.filter(x => x !== cur);
    render();
  } else if (a === 'back') personSheet(arg);
  else if (a === 'aback') {
    closeSheet();
    aEdit = null;
    render();
  } else if (a === 'bell') {
    const q = personById(arg);
    if (q) personBell(q);
  } else if (a === 'belldone') {
    const q = personById(arg);
    if (q) {
      q.bellSig = pSig(q);
      refreshP();
      render();
    }
  } else if (a === 'mute' && p) {
    p.mute = !p.mute;
    refreshP();
    render();
  } else if (a === 'miss' && p) {
    p.missOn = p.missOn === false;
    refreshP();
    render();
  } else if (a === 'noyear' && p) {
    p.noYear = !p.noYear;
    t.setAttribute('aria-pressed', p.noYear);
    refreshP();
    render();
  } else if (a === 'addAnni' && p) {
    (p.annis = p.annis || []).push({ id: uid(), n: '', date: '' });
    refreshP();
    const L = document.querySelectorAll('#pAnnis [data-pan]');
    if (L.length) L[L.length - 1].focus();
  } else if (a === 'delP' && p) {
    if (!t.dataset.sure) {
      t.dataset.sure = '1';
      t.textContent = 'Bấm lần nữa để xóa hẳn';
      return;
    }
    S.people = S.people.filter(x => x !== p);
    S.appts.forEach(x => {
      x.who = (x.who || []).filter(w => w !== p.id);
    });
    closeSheet();
    pEdit = null;
    render();
    say('Đã xóa');
  } else if (a === 'aSave') {
    const ap = readAppt();
    if (!ap) return;
    if (!ap.title)
      ap.title = (ap.who || []).length
        ? 'Gặp ' +
          ap.who
            .map(personById)
            .filter(Boolean)
            .map(x => x.name)
            .join(', ')
        : 'Lịch hẹn';
    const isNew = ap.draft;
    delete ap.draft;
    if (isNew) S.appts.push(ap);
    render();
    if (aLv(ap) === 'cal' && aNeedsBell(ap)) apptBell(ap);
    else {
      closeSheet();
      aEdit = null;
      say(isNew ? 'Đã lưu lịch hẹn 📅' : 'Đã lưu');
    }
  } else if (a === 'aDone' && aEdit) {
    readAppt();
    apptDone(aEdit, !aEdit.done);
    closeSheet();
    render();
    if (aEdit.done) say('Buổi gặp vui chứ? 💞', 2500);
    aEdit = null;
  } else if (a === 'aDel' && aEdit) {
    if (!t.dataset.sure) {
      t.dataset.sure = '1';
      t.textContent = 'Bấm lần nữa để xóa hẳn';
      return;
    }
    S.appts = S.appts.filter(x => x.id !== aEdit.id);
    closeSheet();
    aEdit = null;
    render();
  }
});
document.addEventListener('change', e => {
  const t = e.target,
    D = t.dataset,
    p = personById(pEdit);
  if (!p) return;
  if (D.pf) {
    const ks = D.pf.split('.'),
      v = t.value.trim();
    if (ks.length === 2) (p[ks[0]] = p[ks[0]] || {})[ks[1]] = v;
    else p[ks[0]] = v;
    if (D.pf === 'name' || D.pf === 'bday') {
      const h = $('#sheet h2');
      if (h) h.textContent = relInfo(p.rel)[1] + ' ' + (p.name || 'Chưa đặt tên');
    }
    refreshP();
    render();
  } else if (D.pgt || D.pgp) {
    const g = (p.gifts || []).find(x => x.id === (D.pgt || D.pgp));
    if (!g) return;
    if (D.pgt) g.t = t.value.trim() || g.t;
    else g.price = parseMoney(t.value);
    refreshP();
    render();
  } else if (D.pbud) {
    p.budget = parseMoney(t.value);
    t.value = p.budget ? p.budget.toLocaleString('vi-VN') : '';
    refreshP();
    save();
  } else if (D.pan || D.pad) {
    const an = (p.annis || []).find(x => x.id === (D.pan || D.pad));
    if (!an) return;
    if (D.pan) an.n = t.value.trim();
    else an.date = t.value;
    if ($('#pRemind')) $('#pRemind').innerHTML = pRemindHtml(p);
    render();
  }
});
document.addEventListener('submit', e => {
  const id = e.target.id;
  if (id !== 'pWishF' && id !== 'pGiftF') return;
  e.preventDefault();
  const p = personById(pEdit);
  if (!p) return;
  if (id === 'pWishF') {
    const v = $('#pWishNew').value.trim();
    if (!v) return;
    (p.wish = p.wish || []).push({ id: uid(), t: v });
    $('#pWishNew').value = '';
  } else {
    const v = $('#pGiftNew').value.trim();
    if (!v) return;
    (p.gifts = p.gifts || []).push({ id: uid(), t: v, price: parseMoney($('#pGiftPrice').value), st: 'idea' });
    $('#pGiftNew').value = '';
    $('#pGiftPrice').value = '';
  }
  refreshP();
  render();
});
