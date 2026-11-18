/* ---------- 📔 Nhật ký: Khoảnh khắc + trang ngày tự ghép ---------- */
/* day.moments: [{ id, t (ISO), text, mood, who:[personId] }]  – #tag lấy thẳng từ chữ */
const MMOODS = [
  ['joy', '😊', 'Vui'],
  ['calm', '😌', 'Bình yên'],
  ['meh', '😐', 'Bình thường'],
  ['stress', '😣', 'Căng thẳng'],
  ['sad', '😢', 'Buồn'],
  ['angry', '😡', 'Bực']
];
const mmInfo = k => MMOODS.find(m => m[0] === k);
const COMFORT = [
  'Ôm một cái nè 🫂 Viết ra được là nhẹ lòng hơn rồi.',
  'Không sao đâu, mình ở đây với bạn 🌷',
  'Hít thở sâu một chút nha. Chuyện này rồi cũng qua.',
  'Bạn đã cố gắng nhiều rồi. Cho mình xin một ly nước ấm cho bạn nhé ☕',
  'Buồn một chút cũng được mà. Mai lại là một ngày mới 🌙'
];
let mmMood = null,
  jDay = null,
  mmEdit = null;
const momentsOf = d => (d && d.moments) || [];
const tagsOf = s => (String(s).match(/#[\p{L}\p{N}_]+/gu) || []).map(t => t.toLowerCase());
/* fold(): bỏ dấu tiếng Việt, chữ thường – dùng chung với thư viện bài tập (08-gym) */
/* người thương được nhắc tên trong câu (so khớp nguyên từ, không phân biệt dấu/hoa thường) */
function peopleIn(text) {
  const t = ' ' + fold(text).replace(/[^\p{L}\p{N}]+/gu, ' ') + ' ';
  return S.people.filter(p => {
    const n = fold(p.name)
      .replace(/[^\p{L}\p{N}]+/gu, ' ')
      .trim();
    return n && t.includes(' ' + n + ' ');
  });
}
function mmTextHtml(s) {
  return esc(s).replace(/#[\p{L}\p{N}_]+/gu, m => `<button class="mtag" data-mtag="${m.toLowerCase()}">${m}</button>`);
}
function momentRow(m, k, opts) {
  const mi = mmInfo(m.mood),
    who = (m.who || []).map(personById).filter(Boolean),
    td = dk(new Date());
  const meet = who.filter(p => p.lastMet !== k && k === td);
  return `<div class="mrow"><button class="mtime" data-medit="${k}:${m.id}" aria-label="Sửa">${hm(new Date(m.t))}</button><div class="mbody">${mi ? `<span class="mmood" title="${mi[2]}">${mi[1]}</span> ` : ''}${mmTextHtml(m.text)}${m.photo ? `<button class="mpicb" data-phview="${m.photo}" aria-label="Xem ảnh"><img class="mpic" data-ph="${m.photo}" alt=""></button>` : ''}${who.length ? `<div class="mwho">${who.map(p => `<button class="chip sm" data-popen="p:${p.id}">${relInfo(p.rel)[1]} ${pName(p)}</button>`).join('')}${meet.map(p => `<button class="chip sm" data-pmet="${p.id}" title="Ghi nhận đã gặp hoặc đã gọi">👋 Đã gặp/gọi ${pName(p)}</button>`).join('')}</div>` : ''}${opts && opts.date ? `<button class="mdate" data-jday="${k}">${fmtDM(new Date(k + 'T00:00:00'))}/${k.slice(0, 4)}</button>` : ''}</div></div>`;
}

/* --- Thẻ ở tab Hôm nay --- */
function momentsCard() {
  const k = dk(new Date()),
    L = momentsOf(S.days[k]);
  return `<div class="card mcard"><h2>📔 Khoảnh khắc <small>${L.length ? L.length + ' hôm nay' : ''}</small></h2>
  <form id="mmF" class="addrow"><input class="inp" id="mmNew" placeholder="Chuyện gì vừa xảy ra, bạn thấy sao?" maxlength="1000" autocomplete="off" enterkeyhint="done"><label class="btn ghost mcam" aria-label="Thêm ảnh">📷<input type="file" accept="image/*" id="mmPic" hidden></label><button class="btn" aria-label="Lưu khoảnh khắc">＋</button></form>
  <div id="mmPrev">${mmPrevHtml()}</div>
  <div class="row mmoods">${MMOODS.map(([v, e, n]) => `<button class="chip sm" data-mm="${v}" aria-pressed="${mmMood === v}" aria-label="${n}" title="${n}">${e}</button>`).join('')}</div>
  ${
    jLocked()
      ? `<button class="jlockrow" data-junlock="1">🔒 Nhật ký đang khóa · chạm để mở</button>`
      : L.slice(-3)
          .reverse()
          .map(m => momentRow(m, k))
          .join('')
  }${S.jlockReset ? `<p class="muted jwarn">⚠️ Mã PIN nhật ký đã được đặt lại lúc ${fmtDate(S.jlockReset)}. <button class="linkbtn" data-jresetok="1">Đã biết</button></p>` : ''}
  <div class="row jlinks"><button class="linkbtn" data-jday="${k}">📖 Trang hôm nay</button><button class="linkbtn" data-jcal="1">🗓️ Lịch tâm trạng</button></div></div>`;
}
async function addMoment(text) {
  const now = new Date(),
    d = today(),
    m = { id: uid(), t: now.toISOString(), text, mood: mmMood || null, who: peopleIn(text).map(p => p.id) };
  if (mmPhoto) {
    const pid = 'ph-' + uid();
    try {
      await CozyDB.putPhoto(pid, mmPhoto.blob);
      m.photo = pid;
    } catch (e) {
      say('Không lưu được ảnh, máy có thể đã đầy bộ nhớ 😣', 3500);
    }
    clearMmPhoto();
  }
  d.moments = momentsOf(d).concat(m);
  mmMood = null;
  save();
  render();
  if (jLocked()) return say('Đã ghi vào nhật ký 🔒', 2000);
  const el = $('#mmNew');
  if (el) el.focus();
  if (m.mood === 'joy' || m.mood === 'calm')
    showNudge({
      text: 'Nghe vui ghê 🥰 Thả khoảnh khắc này vào <b>Lọ Kẹo Niềm Vui</b> không?',
      btns: ['🍬 Thả kẹo', 'Thôi'],
      onBtn: i => {
        if (i === 0) candyDrop(text.slice(0, 120));
      }
    });
  else if (m.mood === 'sad' || m.mood === 'stress' || m.mood === 'angry')
    say(COMFORT[Math.floor(Math.random() * COMFORT.length)], 4000);
  else say('Đã ghi lại 📔', 1500);
}

/* --- Trang nhật ký một ngày (tự ghép) --- */
function dayBits(k) {
  const d = S.days[k] || {},
    B = [],
    c = d.checkin,
    x = new Date(k + 'T00:00:00');
  const sl = S.sleeps.find(s => dk(new Date(s.wake)) === k);
  if (sl) {
    const h = (new Date(sl.wake) - new Date(sl.bed)) / 36e5;
    B.push(
      `😴 Ngủ ${fmtHM2(h)} (${hm(new Date(sl.bed))} – ${hm(new Date(sl.wake))})${sl.q ? ' · ' + '⭐'.repeat(sl.q) : ''}`
    );
  }
  napsOf(d).forEach(n => B.push(`☀️ Ngủ trưa ${fmtMin(napMin(n))}`));
  const w = dayWater(k);
  if (w.n) B.push(`💧 ${w.n}/${w.goal} ly nước`);
  const wk = dayWorkMs(k);
  if (wk >= 6e4) B.push(`💼 Làm việc ${fmtDur(wk)}`);
  S.workouts.filter(o => o.end && dk(new Date(o.start)) === k).forEach(o => B.push(`🏋️ ${esc(o.label || 'Buổi tập')}`));
  const done = S.tasks.filter(t => t.done && t.doneAt && dk(new Date(t.doneAt)) === k);
  if (done.length)
    B.push(
      `✅ Xong ${done.length} việc: ${done
        .slice(0, 4)
        .map(t => esc(t.title))
        .join(', ')}${done.length > 4 ? '…' : ''}`
    );
  const met = S.people.filter(p => p.lastMet === k);
  S.appts
    .filter(a => a.done && a.date === k)
    .forEach(a =>
      (a.who || []).forEach(id => {
        const p = personById(id);
        if (p && !met.includes(p)) met.push(p);
      })
    );
  if (met.length) B.push(`💌 Gặp ${met.map(pName).join(', ')}`);
  (d.candies || []).forEach(t => B.push(`🍬 ${esc(t)}`));
  return { c, B, ev: d.evening, x };
}
const fmtHM2 = h => Math.floor(h) + 'g' + (Math.round((h % 1) * 60) ? pad(Math.round((h % 1) * 60)) : '');
function journalDay(k) {
  if (jLocked()) return pinSheet(() => journalDay(k));
  jDay = k;
  const td = dk(new Date()),
    { c, B, ev, x } = dayBits(k),
    L = momentsOf(S.days[k])
      .slice()
      .sort((a, b) => a.t.localeCompare(b.t));
  const prev = new Date(x),
    next = new Date(x);
  prev.setDate(x.getDate() - 1);
  next.setDate(x.getDate() + 1);
  const lab = (arr, v) => {
    const f = arr.find(a => a[0] === v);
    return f ? f[1] + ' ' + f[2] : '';
  };
  const morning = c
    ? `<div class="jsec"><h3>🌤️ Buổi sáng</h3><div class="jchips">${[
        lab(MOODS, c.mood),
        lab(WEATHER, c.weather),
        c.energy ? '🔋 ' + c.energy + '/5' : '',
        lab(BODY, c.body)
      ]
        .filter(Boolean)
        .map(s => `<span>${s}</span>`)
        .join('')}</div></div>`
    : '';
  const evening =
    ev && (ev.mood || ev.line)
      ? `<div class="jsec"><h3>🌙 Cuối ngày</h3>${ev.mood ? `<div class="jchips"><span>${lab(MOODS, ev.mood)}</span></div>` : ''}${ev.line ? `<p class="jline">“${esc(ev.line)}”</p>` : ''}</div>`
      : '';
  openSheet(`<i data-jsec hidden></i><div class="jhead"><button class="chip sm" data-jday="${dk(prev)}" aria-label="Ngày trước">‹</button><h2>📔 ${VNWD[x.getDay()]} ${fmtDM(x)}${x.getFullYear() !== new Date().getFullYear() ? '/' + x.getFullYear() : ''}${k === td ? ' <small>hôm nay</small>' : ''}</h2><button class="chip sm" data-jday="${dk(next)}" ${k >= td ? 'disabled' : ''} aria-label="Ngày sau">›</button></div>
  ${morning}
  <div class="jsec"><h3>✨ Khoảnh khắc</h3>${L.length ? L.map(m => momentRow(m, k)).join('') : '<p class="muted" style="margin:0">Chưa có khoảnh khắc nào.</p>'}
  <form id="mmF2" class="addrow" style="margin-top:8px"><input class="inp" id="mmNew2" placeholder="${k === td ? 'Ghi thêm…' : 'Ghi bù cho ngày này…'}" maxlength="1000" autocomplete="off" enterkeyhint="done"><button class="btn ghost" aria-label="Thêm">＋</button></form></div>
  ${B.length ? `<div class="jsec"><h3>📋 Ngày hôm đó</h3>${B.map(b => `<div class="jbit">${b}</div>`).join('')}</div>` : ''}
  ${evening}
  ${onThisDay(k)}
  <div class="row" style="margin-top:16px"><button class="btn ghost" data-jall="1">🔎 Tìm</button><button class="btn ghost" data-jcal="${k.slice(0, 7)}">🗓️ Lịch tâm trạng</button>${S.jlock ? '<button class="btn ghost" data-jlocknow="1">🔒 Khóa</button>' : ''}</div>`);
}
function journalAll(q, tag) {
  if (jLocked()) return pinSheet(() => journalAll(q, tag));
  const R = [];
  Object.keys(S.days)
    .sort()
    .reverse()
    .forEach(k =>
      momentsOf(S.days[k])
        .slice()
        .reverse()
        .forEach(m => R.push([k, m]))
    );
  const fq = fold(q || '').trim(),
    F = R.filter(([, m]) => (!fq || fold(m.text).includes(fq)) && (!tag || tagsOf(m.text).includes(tag)));
  const tags = {};
  R.forEach(([, m]) => tagsOf(m.text).forEach(t => (tags[t] = (tags[t] || 0) + 1)));
  const T = Object.entries(tags)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12);
  const html = `<i data-jsec hidden></i><h2>🔎 Tất cả nhật ký <small>${R.length} khoảnh khắc</small></h2>
  <input class="inp" id="jq" type="search" placeholder="Tìm chữ trong nhật ký…" value="${esc(q || '')}" autocomplete="off">
  ${T.length ? `<div class="row" style="margin-top:8px">${T.map(([t, n]) => `<button class="chip sm" data-mtag="${esc(t)}" aria-pressed="${tag === t}">${esc(t)} <i class="muted">${n}</i></button>`).join('')}</div>` : ''}
  <div id="jres">${
    F.slice(0, 80)
      .map(([k, m]) => momentRow(m, k, { date: 1 }))
      .join('') || '<p class="muted">Không tìm thấy khoảnh khắc nào.</p>'
  }${F.length > 80 ? `<p class="muted">Còn ${F.length - 80} khoảnh khắc nữa, gõ thêm chữ để lọc.</p>` : ''}</div>
  <button class="btn full" style="margin-top:14px" data-a="closeSheet">Đóng</button>`;
  if ($('#jq') && document.activeElement === $('#jq')) {
    /* đang gõ tìm kiếm: chỉ thay kết quả để không mất bàn phím */
    const box = document.createElement('div');
    box.innerHTML = html;
    $('#jres').replaceWith(box.querySelector('#jres'));
  } else {
    openSheet(html);
    jAllTag = tag || null;
  }
}
let jAllTag = null;
function momentSheet(k, id) {
  if (jLocked()) return pinSheet(() => momentSheet(k, id));
  const m = momentsOf(S.days[k]).find(x => x.id === id);
  if (!m) return;
  mmEdit = { k, id, mood: m.mood, who: (m.who || []).slice(), photo: m.photo || null, newPhoto: null };
  openSheet(`<i data-jsec hidden></i><h2>✏️ Khoảnh khắc</h2>
  <div class="q"><textarea class="inp" id="meText" rows="4" maxlength="1000">${esc(m.text)}</textarea></div>
  <div class="q"><h3>📷 Ảnh</h3><div id="mePhoto">${mePhotoHtml()}</div></div>
  <div class="q"><h3>Lúc</h3><input class="inp" type="time" id="meTime" value="${hm(new Date(m.t))}" style="max-width:140px"></div>
  <div class="q"><h3>Tâm trạng</h3><div class="row">${MMOODS.map(([v, e, n]) => `<button class="chip sm" data-mem="${v}" aria-pressed="${m.mood === v}">${e} ${n}</button>`).join('')}</div></div>
  ${S.people.length ? `<div class="q"><h3>Liên quan đến ai</h3><div class="row">${S.people.map(p => `<button class="chip sm" data-mew="${p.id}" aria-pressed="${mmEdit.who.includes(p.id)}">${relInfo(p.rel)[1]} ${pName(p)}</button>`).join('')}</div></div>` : ''}
  <div class="row" style="margin-top:16px"><button class="btn" data-mesave="1">Lưu</button><button class="btn ghost" data-jday="${k}">📖 Trang ngày này</button></div>
  <div class="row" style="margin-top:10px"><button class="btn ghost danger" data-medel="1">🗑️ Xóa</button></div>`);
}

/* --- Sự kiện --- */
document.addEventListener('submit', e => {
  const id = e.target.id;
  if (id !== 'mmF' && id !== 'mmF2') return;
  e.preventDefault();
  const inp = $(id === 'mmF' ? '#mmNew' : '#mmNew2'),
    v = inp.value.trim();
  if (!v && !(id === 'mmF' && mmPhoto)) return;
  if (id === 'mmF') return addMoment(v);
  /* ghi thêm / ghi bù trong trang ngày */
  const k = jDay,
    td = dk(new Date()),
    t = k === td ? new Date() : new Date(k + 'T21:00:00'),
    d = S.days[k] || (S.days[k] = {});
  d.moments = momentsOf(d).concat({
    id: uid(),
    t: t.toISOString(),
    text: v,
    mood: null,
    who: peopleIn(v).map(p => p.id)
  });
  save();
  render();
  journalDay(k);
});
document.addEventListener('input', e => {
  if (e.target.id === 'jq') journalAll(e.target.value, jAllTag);
});
document.addEventListener('click', e => {
  const t = e.target.closest('button');
  if (!t) return;
  const D = t.dataset;
  if (D.mm) {
    mmMood = mmMood === D.mm ? null : D.mm;
    t.parentNode.querySelectorAll('.chip').forEach(b => b.setAttribute('aria-pressed', b.dataset.mm === mmMood));
    const v = $('#mmNew') && $('#mmNew').value.trim();
    if (v) addMoment(v);
    return;
  }
  if (D.jday) return journalDay(D.jday);
  if (D.jall) return journalAll('', null);
  if (D.mtag) {
    const tag = jAllTag === D.mtag && $('#jq') ? null : D.mtag;
    if ($('#jq')) $('#jq').blur();
    return journalAll($('#jq') ? $('#jq').value : '', tag);
  }
  if (D.medit) {
    const [k, id] = D.medit.split(':');
    return momentSheet(k, id);
  }
  if (!mmEdit) return;
  if (D.mem) {
    mmEdit.mood = mmEdit.mood === D.mem ? null : D.mem;
    t.parentNode.querySelectorAll('.chip').forEach(b => b.setAttribute('aria-pressed', b.dataset.mem === mmEdit.mood));
  } else if (D.mew) {
    const W = mmEdit.who;
    mmEdit.who = W.includes(D.mew) ? W.filter(x => x !== D.mew) : W.concat(D.mew);
    t.setAttribute('aria-pressed', mmEdit.who.includes(D.mew));
  } else if (D.mesave) {
    const { k, id } = mmEdit,
      m = momentsOf(S.days[k]).find(x => x.id === id);
    if (!m) return;
    m.text = $('#meText').value.trim() || (mmEdit.photo || mmEdit.newPhoto ? '' : m.text);
    if ($('#meTime').value) m.t = setHM(k + 'T00:00:00', $('#meTime').value).toISOString();
    m.mood = mmEdit.mood;
    m.who = mmEdit.who;
    const old = m.photo || null;
    if (mmEdit.newPhoto) {
      const pid = 'ph-' + uid();
      CozyDB.putPhoto(pid, mmEdit.newPhoto.blob)
        .then(() => {
          m.photo = pid;
          if (old) CozyDB.delPhoto(old);
          save();
          render();
          if (jDay === k && $('[data-jsec]')) journalDay(k);
        })
        .catch(() => say('Không lưu được ảnh 😣'));
    } else if (!mmEdit.photo && old) {
      delete m.photo;
      CozyDB.delPhoto(old);
    }
    mmEdit = null;
    render();
    journalDay(k);
  } else if (D.medel) {
    if (!t.dataset.sure) {
      t.dataset.sure = '1';
      t.textContent = 'Bấm lần nữa để xóa hẳn';
      return;
    }
    const { k, id } = mmEdit,
      d = S.days[k],
      gone = momentsOf(d).find(x => x.id === id);
    if (gone && gone.photo) CozyDB.delPhoto(gone.photo);
    d.moments = momentsOf(d).filter(x => x.id !== id);
    mmEdit = null;
    render();
    journalDay(k);
  }
});
