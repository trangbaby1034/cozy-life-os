/* ---------- 📔 Nhật ký đợt 2: ảnh, lịch tâm trạng, Ngày này năm trước, khóa PIN ---------- */

/* ===== Ảnh ===== */
let mmPhoto = null; // ảnh chờ gắn vào khoảnh khắc sắp ghi: { blob, url }
const phURL = {}; // id → object URL (bộ nhớ đệm)
/* Thu nhỏ ảnh: cạnh dài tối đa 1280px, JPEG 80% (khoảng 150–300 KB) */
async function shrinkPhoto(file) {
  const url = URL.createObjectURL(file),
    img = new Image();
  try {
    await new Promise((res, rej) => {
      img.onload = res;
      img.onerror = rej;
      img.src = url;
    });
    const r = Math.min(1, 1280 / Math.max(img.naturalWidth, img.naturalHeight)),
      c = document.createElement('canvas');
    c.width = Math.round(img.naturalWidth * r);
    c.height = Math.round(img.naturalHeight * r);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return await new Promise(res => c.toBlob(res, 'image/jpeg', 0.8));
  } finally {
    URL.revokeObjectURL(url);
  }
}
function mmPrevHtml() {
  return mmPhoto
    ? `<div class="mprev"><img src="${mmPhoto.url}" alt=""><span class="muted">Ảnh sẽ gắn vào khoảnh khắc bạn ghi tiếp theo</span><button class="xbtn" data-mmphx="1" aria-label="Bỏ ảnh">✕</button></div>`
    : '';
}
function clearMmPhoto() {
  if (mmPhoto) URL.revokeObjectURL(mmPhoto.url);
  mmPhoto = null;
  if ($('#mmPrev')) $('#mmPrev').innerHTML = '';
}
function mePhotoHtml() {
  const e = mmEdit;
  if (!e) return '';
  const src = e.newPhoto ? e.newPhoto.url : '';
  const img = e.newPhoto
    ? `<img class="mpic big" src="${src}" alt="">`
    : e.photo
      ? `<img class="mpic big" data-ph="${e.photo}" alt="">`
      : '';
  return `${img}<div class="row" style="margin-top:8px"><label class="btn ghost sm">📷 ${img ? 'Đổi ảnh' : 'Thêm ảnh'}<input type="file" accept="image/*" id="mePic" hidden></label>${img ? '<button class="btn ghost sm" data-mephx="1">🗑️ Bỏ ảnh</button>' : ''}</div>`;
}
const allPhotoIds = () => {
  const L = [];
  Object.values(S.days).forEach(d => momentsOf(d).forEach(m => m.photo && L.push(m.photo)));
  return L;
};
/* gắn ảnh vào mọi <img data-ph> mới xuất hiện */
async function hydratePhotos(root) {
  const L = (root || document).querySelectorAll('img[data-ph]:not([src])');
  for (const el of L) {
    const id = el.dataset.ph;
    if (!phURL[id]) {
      const b = await CozyDB.getPhoto(id).catch(() => null);
      if (!b) {
        el.alt = '(ảnh không còn)';
        el.classList.add('gone');
        el.src = 'data:image/gif;base64,R0lGODlhAQABAAAAACw=';
        continue;
      }
      phURL[id] = URL.createObjectURL(b);
    }
    el.src = phURL[id];
  }
}
new MutationObserver(() => hydratePhotos()).observe(document.body, { childList: true, subtree: true });
const phBox = document.createElement('div');
phBox.className = 'phbox';
phBox.innerHTML = '<img alt=""><button class="sheetx" aria-label="Đóng">✕</button>';
document.body.appendChild(phBox);
phBox.addEventListener('click', () => phBox.classList.remove('on'));

/* ===== Lịch tâm trạng ===== */
const MCOL = { joy: '#FFD36E', calm: '#9FDFC0', meh: '#DCD6EA', stress: '#F6A97A', sad: '#8FB8EE', angry: '#F07C7C' };
const M2MM = { happy: 'joy', calm: 'meh', sleepy: 'meh', stress: 'stress', sad: 'sad' };
/* tâm trạng chủ đạo của ngày: nhiều nhất trong check-in sáng, các khoảnh khắc và cuối ngày (bằng nhau thì lấy cái sau) */
function dayMood(k) {
  const d = S.days[k];
  if (!d) return null;
  const seq = [];
  if (d.checkin && M2MM[d.checkin.mood]) seq.push(M2MM[d.checkin.mood]);
  momentsOf(d)
    .slice()
    .sort((a, b) => a.t.localeCompare(b.t))
    .forEach(m => m.mood && seq.push(m.mood));
  if (d.evening && M2MM[d.evening.mood]) seq.push(M2MM[d.evening.mood]);
  if (!seq.length) return null;
  const n = {};
  let best = null;
  seq.forEach(m => {
    n[m] = (n[m] || 0) + 1;
    if (!best || n[m] >= n[best]) best = m;
  });
  return best;
}
let calMonth = null;
function moodCal(ym) {
  if (jLocked()) return pinSheet(() => moodCal(ym));
  const now = new Date(),
    td = dk(now);
  calMonth = ym || calMonth || td.slice(0, 7);
  const [y, mo] = calMonth.split('-').map(Number),
    first = new Date(y, mo - 1, 1),
    days = new Date(y, mo, 0).getDate(),
    lead = (first.getDay() + 6) % 7,
    cnt = {};
  let cells = '<span></span>'.repeat(lead);
  for (let i = 1; i <= days; i++) {
    const k = calMonth + '-' + pad(i),
      md = dayMood(k),
      has = momentsOf(S.days[k]).length > 0,
      fut = k > td;
    if (md) cnt[md] = (cnt[md] || 0) + 1;
    cells += `<button class="mcell ${k === td ? 'now' : ''} ${has ? 'has' : ''}" ${fut ? 'disabled' : `data-jday="${k}"`} style="${md ? 'background:' + MCOL[md] : ''}" aria-label="Ngày ${i}${md ? ': ' + mmInfo(md)[2] : ''}"><b>${i}</b>${md ? `<i>${mmInfo(md)[1]}</i>` : ''}</button>`;
  }
  const pm = new Date(y, mo - 2, 1),
    nm = new Date(y, mo, 1),
    ymOf = x => x.getFullYear() + '-' + pad(x.getMonth() + 1);
  openSheet(`<i data-jsec hidden></i><div class="jhead"><button class="chip sm" data-jcal="${ymOf(pm)}" aria-label="Tháng trước">‹</button><h2>🗓️ Tháng ${mo}/${y}</h2><button class="chip sm" data-jcal="${ymOf(nm)}" ${ymOf(nm) > td.slice(0, 7) ? 'disabled' : ''} aria-label="Tháng sau">›</button></div>
  <div class="mcal">${['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(d => `<span class="mwd">${d}</span>`).join('')}${cells}</div>
  <div class="mleg">${MMOODS.map(([k, e, n]) => `<span><i style="background:${MCOL[k]}"></i>${e} ${n}${cnt[k] ? ' <b>' + cnt[k] + '</b>' : ''}</span>`).join('')}</div>
  <p class="muted" style="margin:8px 0 0">Màu của mỗi ngày là tâm trạng xuất hiện nhiều nhất (check-in sáng, khoảnh khắc, cuối ngày). Chạm vào một ngày để mở trang nhật ký.</p>`);
}

/* ===== Ngày này năm trước ===== */
const hasPage = k => {
  const d = S.days[k];
  return !!d && (momentsOf(d).length > 0 || (d.evening && d.evening.line) || (d.candies || []).length > 0);
};
function agoKeys(k) {
  const x = new Date(k + 'T00:00:00'),
    L = [];
  for (let n = 1; n <= 10; n++) {
    const y = new Date(x);
    y.setFullYear(x.getFullYear() - n);
    if (y.getDate() === x.getDate() && hasPage(dk(y))) L.push([dk(y), n + ' năm trước']);
  }
  if (!L.length) {
    const y = new Date(x);
    y.setMonth(x.getMonth() - 1);
    if (y.getDate() === x.getDate() && hasPage(dk(y))) L.push([dk(y), '1 tháng trước']);
  }
  return L;
}
function onThisDay(k) {
  const L = agoKeys(k);
  if (!L.length) return '';
  return `<div class="jsec otd"><h3>🕰️ Ngày này ${L[0][1].includes('năm') ? 'năm' : 'tháng'} trước</h3>${L.map(
    ([pk, lab]) => {
      const d = S.days[pk],
        m = momentsOf(d)[0];
      const peek = m
        ? (mmInfo(m.mood) ? mmInfo(m.mood)[1] + ' ' : '') + esc(m.text || '📷')
        : d.evening && d.evening.line
          ? '“' + esc(d.evening.line) + '”'
          : '🍬 ' + esc((d.candies || [])[0] || '');
      return `<button class="uprow" data-jday="${pk}"><span>${peek.length > 90 ? peek.slice(0, 90) + '…' : peek}</span><i>${lab}</i></button>`;
    }
  ).join('')}</div>`;
}
function journalNudge(now, td, log) {
  if (now.getHours() < 19 || log.otd === td) return false;
  const L = agoKeys(td).filter(([, l]) => l.includes('năm'));
  if (!L.length) return false;
  log.otd = td;
  save();
  const [pk, lab] = L[0],
    m = momentsOf(S.days[pk])[0];
  showNudge({
    text:
      '🕰️ Ngày này ' +
      lab +
      ', bạn đã ghi: ' +
      (jLocked() || !m ? 'một trang nhật ký 📔' : '“' + esc((m.text || '📷').slice(0, 80)) + '”') +
      '. Mở ra xem lại không?',
    btns: ['📖 Xem', 'Để sau'],
    onBtn: i => {
      if (i === 0) journalDay(pk);
    }
  });
  return true;
}

/* ===== Khóa PIN ===== */
let jOpen = false,
  pinTries = 0,
  pinWait = 0,
  pinNext = null,
  hiddenAt = 0;
function jLocked() {
  return !!(S.jlock && S.jlock.hash) && !jOpen;
}
async function pinHash(pin, salt) {
  const e = new TextEncoder(),
    base = await crypto.subtle.importKey('raw', e.encode(pin), 'PBKDF2', false, ['deriveBits']),
    bits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', hash: 'SHA-256', salt: e.encode(salt), iterations: 120000 },
      base,
      256
    );
  return btoa(String.fromCharCode(...new Uint8Array(bits)));
}
function pinSheet(next) {
  pinNext = next || null;
  const wait = Math.ceil((pinWait - Date.now()) / 1000);
  openSheet(`<div class="pinbox"><div class="pinlock">🔒</div><h2>Nhật ký đang khóa</h2><p class="muted" style="margin:0 0 12px">Nhập mã PIN để mở.</p>
  <input class="inp pininp" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="6" id="pinIn" autocomplete="off" aria-label="Mã PIN" ${wait > 0 ? 'disabled' : ''}>
  <p class="err" id="pinErr">${wait > 0 ? 'Sai nhiều lần, đợi ' + wait + ' giây rồi thử lại.' : ''}</p>
  <button class="btn full" data-pinok="1" ${wait > 0 ? 'disabled' : ''}>Mở khóa</button>
  <button class="linkbtn" data-pinforgot="1">Quên mã PIN?</button></div>`);
  setTimeout(() => $('#pinIn') && !$('#pinIn').disabled && $('#pinIn').focus(), 60);
}
async function tryPin() {
  const v = ($('#pinIn') || {}).value || '';
  if (Date.now() < pinWait || !v) return;
  if ((await pinHash(v, S.jlock.salt)) === S.jlock.hash) {
    jOpen = true;
    pinTries = 0;
    const n = pinNext;
    pinNext = null;
    closeSheet();
    render();
    if (n) n();
    return;
  }
  pinTries++;
  if (pinTries >= 5) {
    pinWait = Date.now() + 30000;
    pinTries = 0;
    return pinSheet(pinNext);
  }
  $('#pinErr').textContent = 'Mã chưa đúng, thử lại nhé.';
  $('#pinIn').value = '';
  $('#pinIn').classList.add('shake');
  setTimeout(() => $('#pinIn') && $('#pinIn').classList.remove('shake'), 400);
}
function relock() {
  if (!S.jlock || !jOpen) return;
  jOpen = false;
  if ($('#sheetbg').classList.contains('on') && $('#sheet [data-jsec]')) closeSheet();
  render();
}
/* Trang Cài đặt › Khóa nhật ký */
let jlStep = null; // null | 'forgot'
function jlockPage() {
  const on = !!(S.jlock && S.jlock.hash);
  const intro =
    '<p class="muted" style="margin:0 0 10px">Khóa giúp người khác cầm máy không đọc được nhật ký và khoảnh khắc. Bạn vẫn ghi nhanh được khi đang khóa. App tự khóa lại khi bạn thoát app quá 1 phút. Lưu ý: đây là lớp khóa màn hình, dữ liệu vẫn nằm trên máy và trong file sao lưu, nên hãy đặt mật khẩu cho file sao lưu.</p>';
  if (jlStep === 'forgot')
    return `<div class="card"><h2>🔒 Quên mã PIN?</h2><p class="muted">Mã PIN không lấy lại được. Bạn có thể tắt khóa để đặt mã mới; <b>nhật ký vẫn giữ nguyên</b>. App sẽ hiện một dòng báo "mã PIN đã được đặt lại" ở thẻ Khoảnh khắc, để nếu không phải bạn làm thì bạn biết.</p>
    <p class="muted">Gõ chữ <b>XOA</b> để xác nhận:</p><input class="inp" id="jlForgot" autocomplete="off" style="max-width:160px">
    <div class="row" style="margin-top:12px"><button class="btn" data-jlreset="1">Tắt khóa</button><button class="btn ghost" data-jlcancel="1">Hủy</button></div></div>`;
  if (!on)
    return `<div class="card"><h2>🔒 Khóa nhật ký</h2>${intro}
    <div class="q"><h3>Mã PIN mới (4–6 số)</h3><input class="inp pininp" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="6" id="jlNew1" autocomplete="off" aria-label="Mã PIN mới"></div>
    <div class="q"><h3>Nhập lại</h3><input class="inp pininp" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="6" id="jlNew2" autocomplete="off" aria-label="Nhập lại mã PIN"></div>
    <p class="err" id="jlErr"></p><button class="btn full" data-jlset="1">🔒 Bật khóa</button></div>`;
  return `<div class="card"><h2>🔒 Khóa nhật ký <small>đang bật</small></h2>${intro}
  <div class="q"><h3>Mã PIN hiện tại</h3><input class="inp pininp" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="6" id="jlCur" autocomplete="off" aria-label="Mã PIN hiện tại"></div>
  <div class="q"><h3>Mã PIN mới <span class="muted">(chỉ cần khi đổi mã)</span></h3><input class="inp pininp" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="6" id="jlNew1" autocomplete="off" aria-label="Mã PIN mới"></div>
  <p class="err" id="jlErr"></p>
  <div class="row"><button class="btn" data-jlchange="1">Đổi mã</button><button class="btn ghost" data-jloff="1">Tắt khóa</button><button class="btn ghost" data-jlocknow="1">Khóa ngay</button></div>
  <button class="linkbtn" data-jlforgot="1">Quên mã PIN?</button></div>`;
}
const pinOk = v => /^\d{4,6}$/.test(v);
async function setPin(v) {
  const salt = uid() + uid();
  S.jlock = { salt, hash: await pinHash(v, salt) };
  jOpen = true;
  save();
}

/* ===== Sự kiện ===== */
document.addEventListener('change', async e => {
  const t = e.target;
  if (t.id !== 'mmPic' && t.id !== 'mePic') return;
  const f = t.files && t.files[0];
  t.value = '';
  if (!f) return;
  let blob;
  try {
    blob = await shrinkPhoto(f);
  } catch (err) {
    return say('Không đọc được ảnh này 😣', 3000);
  }
  if (!blob) return;
  const p = { blob, url: URL.createObjectURL(blob) };
  if (t.id === 'mmPic') {
    clearMmPhoto();
    mmPhoto = p;
    if ($('#mmPrev')) $('#mmPrev').innerHTML = mmPrevHtml();
    say('Gõ vài chữ rồi bấm ＋ (hoặc bấm ＋ luôn) để lưu ảnh 📷', 3000);
  } else if (mmEdit) {
    if (mmEdit.newPhoto) URL.revokeObjectURL(mmEdit.newPhoto.url);
    mmEdit.newPhoto = p;
    $('#mePhoto').innerHTML = mePhotoHtml();
  }
});
document.addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  if (e.target.id === 'pinIn') tryPin();
});
document.addEventListener('click', async e => {
  const t = e.target.closest('button');
  if (!t) return;
  const D = t.dataset;
  if (D.phview) {
    const src = phURL[D.phview];
    if (!src) return;
    phBox.querySelector('img').src = src;
    phBox.classList.add('on');
    return;
  }
  if (D.mmphx) return clearMmPhoto();
  if (D.mephx && mmEdit) {
    if (mmEdit.newPhoto) URL.revokeObjectURL(mmEdit.newPhoto.url);
    mmEdit.newPhoto = null;
    mmEdit.photo = null;
    $('#mePhoto').innerHTML = mePhotoHtml();
    return;
  }
  if (D.jcal) return moodCal(D.jcal === '1' ? null : D.jcal);
  if (D.junlock) return pinSheet(null);
  if (D.pinok) return tryPin();
  if (D.pinforgot) {
    jlStep = 'forgot';
    tab = 'set';
    setPage = 'jlock';
    closeSheet();
    return render();
  }
  if (D.jresetok) {
    delete S.jlockReset;
    return render();
  }
  if (D.jlocknow) {
    if (!S.jlock) return;
    jOpen = true;
    relock();
    return say('Đã khóa nhật ký 🔒', 2000);
  }
  if (D.jlforgot) {
    jlStep = 'forgot';
    return render();
  }
  if (D.jlcancel) {
    jlStep = null;
    return render();
  }
  if (D.jlreset) {
    if (($('#jlForgot').value || '').trim().toUpperCase() !== 'XOA') return;
    S.jlock = null;
    S.jlockReset = new Date().toISOString();
    jlStep = null;
    jOpen = false;
    save();
    render();
    return say('Đã tắt khóa. Bạn có thể đặt mã mới 🔓', 3000);
  }
  if (D.jlset) {
    const a = $('#jlNew1').value,
      b = $('#jlNew2').value;
    if (!pinOk(a)) return ($('#jlErr').textContent = 'Mã PIN gồm 4–6 chữ số.');
    if (a !== b) return ($('#jlErr').textContent = 'Hai lần nhập chưa giống nhau.');
    await setPin(a);
    delete S.jlockReset;
    render();
    return say('Đã bật khóa nhật ký 🔒', 2500);
  }
  if (D.jlchange || D.jloff) {
    const cur = $('#jlCur').value;
    if (!cur || (await pinHash(cur, S.jlock.salt)) !== S.jlock.hash)
      return ($('#jlErr').textContent = 'Mã PIN hiện tại chưa đúng.');
    if (D.jloff) {
      S.jlock = null;
      save();
      render();
      return say('Đã tắt khóa nhật ký 🔓', 2500);
    }
    const n = $('#jlNew1').value;
    if (!pinOk(n)) return ($('#jlErr').textContent = 'Mã PIN mới gồm 4–6 chữ số.');
    await setPin(n);
    render();
    return say('Đã đổi mã PIN ✨', 2500);
  }
});
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    hiddenAt = Date.now();
    if (S.jlock) document.body.classList.add('privacy');
  } else {
    document.body.classList.remove('privacy');
    if (hiddenAt && Date.now() - hiddenAt > 60000) relock();
  }
});
