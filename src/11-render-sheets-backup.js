let fxSeason = '?',
  fxTimer = 0;
function buildFx() {
  const se = calm() ? null : season();
  if (se === fxSeason) return;
  fxSeason = se;
  const box = $('#snow');
  box.innerHTML = '';
  clearInterval(fxTimer);
  if (se === 'xmas')
    for (let i = 0; i < 30; i++) {
      const f = document.createElement('i'),
        z = 3 + Math.random() * 6;
      f.className = 'flake';
      f.style.cssText = `left:${Math.random() * 100}%;width:${z}px;height:${z}px;animation-duration:${8 + Math.random() * 10}s;animation-delay:${-Math.random() * 18}s;opacity:${0.5 + Math.random() * 0.5}`;
      box.appendChild(f);
    }
  if (se === 'tet')
    for (let i = 0; i < 22; i++) {
      const f = document.createElement('i'),
        z = 8 + Math.random() * 8,
        mai = Math.random() < 0.5;
      f.className = 'petal';
      f.style.cssText = `left:${Math.random() * 100}%;width:${z}px;height:${z}px;background:${mai ? '#FFD24D' : '#FFB3C6'};animation-duration:${9 + Math.random() * 9}s;animation-delay:${-Math.random() * 18}s;opacity:${0.6 + Math.random() * 0.4}`;
      box.appendChild(f);
    }
  if (se === 'ny') {
    const burst = () => {
      if (document.hidden || !Element.prototype.animate) return;
      const x = 10 + Math.random() * 80,
        y = 6 + Math.random() * 26,
        col = ['#F2B544', '#FF9EB5', '#8FD0F2', '#A8E6CF', '#FFFFFF'][Math.floor(Math.random() * 5)];
      for (let i = 0; i < 16; i++) {
        const d = document.createElement('i');
        d.className = 'fw';
        d.style.cssText = `left:${x}%;top:${y}%;background:${col};color:${col}`;
        box.appendChild(d);
        const a = (i / 16) * Math.PI * 2,
          r = 38 + Math.random() * 26;
        d.animate(
          [
            { transform: 'translate(0,0) scale(1)', opacity: 1 },
            { transform: `translate(${Math.cos(a) * r}px,${Math.sin(a) * r + 20}px) scale(.3)`, opacity: 0 }
          ],
          { duration: 1300, easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'forwards' }
        ).onfinish = () => d.remove();
      }
    };
    setTimeout(burst, 600);
    fxTimer = setInterval(burst, 3400);
  }
}
const NYW = [
  'Năm mới bình an, vui khỏe và thật nhiều niềm vui nhỏ!',
  'Một năm mới nhẹ nhàng, đủ đầy và dịu dàng với chính mình.',
  'Chúc năm mới: ngủ đủ, uống đủ nước, cười thật nhiều.'
];
const TETW_Q = [
  'An khang thịnh vượng.',
  'Vạn sự như ý.',
  'Năm mới bình an, sức khỏe dồi dào.',
  'Tấn tài tấn lộc, phúc lộc đầy nhà.',
  'Xuân an khang, Tết đoàn viên.',
  'Cung chúc tân xuân, vạn sự cát tường.'
];
function seasonGreet() {
  const se = season();
  if (!se || se === 'xmas') return;
  const n = new Date(),
    T = nextTet();
  S.fxShown = S.fxShown || {};
  let key = null;
  if (se === 'ny' && n.getMonth() === 0 && n.getDate() === 1) key = 'ny' + n.getFullYear();
  if (se === 'tet' && T && T.diff === 0) key = 'tet' + T.y;
  if (!key || S.fxShown[key]) return;
  S.fxShown[key] = true;
  save();
  setTimeout(() => {
    celebrate(3);
    if (!dnd()) startAct(se === 'ny' ? 'sparkler' : 'lixi');
    say(
      se === 'ny'
        ? '🎆 Chúc mừng năm mới ' + n.getFullYear() + ', ' + S.name + '!'
        : '🧧 Chúc mừng năm mới! Xuân ' + canChi(T.y) + ' an khang thịnh vượng nha ' + S.name + '!',
      7000
    );
  }, 1500);
}
const APPVER = '2026.11.18-16';
const TABS = [
  ['today', '☀️', 'Hôm nay'],
  ['tasks', '📋', 'Việc'],
  ['people', '💌', 'Người thương'],
  ['health', '💪', 'Sức khỏe'],
  ['set', '⚙️', 'Cài đặt']
];
function render() {
  const n = new Date(),
    h = n.getHours();
  const keepPw = $('#bkpw') ? $('#bkpw').value : '';
  const openD = [...document.querySelectorAll('details.more')].map(d => d.open);
  $('#hello').textContent =
    (isNight()
      ? 'Chúc buổi tối'
      : h < 11
        ? 'Chào buổi sáng'
        : h < 14
          ? 'Chào buổi trưa'
          : h < 18
            ? 'Chào buổi chiều'
            : 'Chào buổi tối') +
    ', ' +
    S.name;
  $('#xpill').textContent = seasonLabel();
  $('#date').textContent = n.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' });
  $('#tabs').innerHTML = TABS.map(
    ([k, i, t]) => `<button data-tab="${k}" aria-current="${tab === k}"><span>${i}</span>${t}</button>`
  ).join('');
  const keepT = $('#tnew') ? $('#tnew').value : '';
  $('#view').innerHTML =
    tab === 'today'
      ? viewToday()
      : tab === 'health'
        ? viewHealth()
        : tab === 'set'
          ? viewSettings()
          : tab === 'tasks'
            ? viewTasks()
            : viewPeople();
  if ($('#bkpw')) $('#bkpw').value = keepPw;
  if ($('#tnew')) $('#tnew').value = keepT;
  document.querySelectorAll('details.more').forEach((d, i) => {
    if (openD[i]) d.open = true;
  });
  drawChibi();
  save();
}

/* ---------- Sheets ---------- */
let F = {};
function openSheet(html) {
  $('#sheet').innerHTML =
    '<div class="sheetbar"><button class="sheetx" data-sheetx="1" aria-label="Đóng" title="Đóng">✕</button></div>' +
    html;
  $('#sheet').dataset.ex = '';
  $('#sheet').scrollTop = 0;
  $('#sheetbg').classList.add('on');
}
function closeSheet() {
  $('#sheetbg').classList.remove('on');
}
const chips = (name, arr, v) =>
  `<div class="row">${arr.map(([k, i, t]) => `<button class="chip" data-f="${name}" data-v="${k}" aria-pressed="${v === k}">${i} ${t}</button>`).join('')}</div>`;
function checkinSheet() {
  const c = today().checkin || {};
  F = {
    mood: c.mood,
    weather: c.weather,
    energy: c.energy || 3,
    body: c.body || 'ok',
    q: c.q || 4,
    sore: (c.sore || []).slice()
  };
  const pb = S.pendingBed ? new Date(S.pendingBed) : null;
  openSheet(`<h2>🌤️ Check-in buổi sáng</h2><p class="muted" style="margin:0">Chọn nhanh thôi, không cần nghĩ nhiều.</p>
  <div class="q"><h3>Tâm trạng</h3>${chips('mood', MOODS, F.mood)}</div>
  <div class="q"><h3>Thời tiết</h3>${chips('weather', WEATHER, F.weather)}</div>
  <div class="q"><h3>Năng lượng</h3>${chips(
    'energy',
    [1, 2, 3, 4, 5].map(n => [n, '🔋', n]),
    F.energy
  )}</div>
  <div class="q"><h3>Cơ thể</h3>${chips('body', BODY, F.body)}
   <div id="soreBox" class="${F.body === 'sore' ? '' : 'hide'}" style="margin-top:10px"><p class="muted" style="margin:0 0 6px">Đau ở đâu? (chọn được nhiều)</p><div class="row">${GG.slice(
     0,
     9
   )
     .map(([k, n]) => `<button class="chip sm" data-sore="${k}" aria-pressed="${F.sore.includes(k)}">${n}</button>`)
     .join('')}</div></div></div>
  <div class="q"><h3>Giấc ngủ đêm qua</h3>${pb ? `<p class="muted" style="margin:0 0 8px">Bạn đi ngủ lúc <b>${hm(pb)}</b>. Bạn dậy lúc mấy giờ?</p>` : `<p class="muted" style="margin:0 0 8px">Tối qua chưa bấm "Đi ngủ". Nhập bù nếu nhớ:</p><input class="inp" type="time" id="bedIn" style="margin-bottom:8px" aria-label="Giờ đi ngủ">`}
   <input class="inp" type="time" id="wakeIn" value="${hm(new Date())}" aria-label="Giờ dậy">
   <div class="stars row" style="margin-top:6px" aria-label="Chất lượng giấc ngủ">${[1, 2, 3, 4, 5].map(n => `<button data-star="${n}" class="${n <= F.q ? 'on' : ''}" aria-label="${n} sao">⭐</button>`).join('')}</div></div>
  <button class="btn full" style="margin-top:20px" data-a="saveCheckin">Xong ✨</button>`);
}
function eveningSheet() {
  F = { emood: null };
  const p = PROMPTS[new Date().getDate() % PROMPTS.length];
  openSheet(`<h2>🌙 Khép lại ngày hôm nay</h2>
  <div class="q"><h3>Tâm trạng cuối ngày</h3>${chips('emood', MOODS, null)}</div>
  <div class="q"><h3>Hôm nay thế nào?</h3><p class="muted" style="margin:0 0 8px">Gợi ý: ${p}</p><textarea class="inp" id="line" rows="3" maxlength="500" placeholder="Một dòng thôi cũng được…"></textarea></div>
  <button class="btn full" style="margin-top:20px" data-a="goSleep">😴 Đi ngủ</button>`);
}

function askLazy() {
  const c = today().checkin || {};
  showNudge({
    text:
      (c.body === 'sick' ? 'Thương ' + S.name + ' quá 🤒 ' : 'Hôm nay năng lượng hơi thấp 🔋 ') +
      'Hôm nay mình nghỉ chút nha? Mình sẽ ẩn bớt việc không gấp, tạm không nhắc việc và đổi buổi tập thành giãn cơ 10 phút.',
    btns: ['🛋️ Ừ, nghỉ chút', 'Không, mình ổn'],
    onBtn: i => setLazy(i === 0)
  });
}
function setLazy(on) {
  const d = today();
  d.lazy = on;
  render();
  say(
    on ? 'Ngày Lười Biếng bắt đầu! Nghỉ ngơi thật tốt nha ' + S.name + ' 🛋️' : 'Ok, mình cùng cố gắng nhẹ nhàng nhé 💪',
    3500
  );
}
function saveCheckin() {
  const d = today();
  const w = $('#wakeIn').value;
  d.checkin = { mood: F.mood || 'calm', weather: F.weather || 'sun', energy: +F.energy, body: F.body, q: F.q };
  if (F.body === 'sore' && F.sore.length) d.checkin.sore = F.sore.slice();
  let bed = S.pendingBed ? new Date(S.pendingBed) : null;
  const bi = $('#bedIn');
  if (!bed && bi && bi.value) {
    bed = new Date();
    const [h, m] = bi.value.split(':').map(Number);
    bed.setHours(h, m, 0, 0);
    if (h >= 12) bed.setDate(bed.getDate() - 1);
  }
  if (bed && w) {
    const wk = new Date();
    const [h, m] = w.split(':').map(Number);
    wk.setHours(h, m, 0, 0);
    if (wk <= bed) wk.setDate(wk.getDate() + 1);
    if ((wk - bed) / 36e5 < 16) {
      S.sleeps.push({ bed: bed.toISOString(), wake: wk.toISOString(), q: F.q });
    }
  }
  S.pendingBed = null;
  closeSheet();
  tab = 'today';
  render();
  const c = d.checkin;
  if ((c.body === 'sick' || c.energy <= 2) && d.lazy === undefined) return setTimeout(askLazy, 900);
  say(
    c.body === 'sick'
      ? 'Thương ' + S.name + ' quá, hôm nay nghỉ ngơi nhiều nha 🤒'
      : c.mood === 'happy'
        ? 'Yayy, một ngày tuyệt vời đang chờ ' + S.name + '!'
        : c.mood === 'stress'
          ? 'Không sao, mình cùng làm từng chút một nhé 🔥'
          : 'Cảm ơn ' + S.name + ' đã check-in 💛'
  );
}
function goSleep() {
  const d = today();
  d.evening = { mood: F.emood, line: ($('#line').value || '').trim() };
  {
    const n = new Date(),
      [bh, bm] = S.bedTarget.split(':').map(Number);
    const nm = n.getHours() * 60 + n.getMinutes();
    if (n.getHours() >= 12 && nm <= bh * 60 + bm) d.sleptEarly = true;
    else delete d.sleptEarly;
  }
  S.pendingBed = new Date().toISOString();
  if (working()) workEnd(); /* quên kết thúc ca → tự kết thúc lúc đi ngủ */
  closeSheet();
  flush();
  clearTimeout(P.t);
  $('#chibiSleep').innerHTML = chibi({ mood: 'sleep', outfit: 'pj', sleep: true });
  $('#gn').textContent = 'Chúc ' + S.name + ' ngủ ngon 🌙';
  $('#gnTime').textContent = 'Đã ghi giờ đi ngủ: ' + hm(new Date());
  $('#sleepcover').classList.add('on');
}

/* ---------- Sao lưu & khôi phục ---------- */
async function doExport(btn) {
  const pw = ($('#bkpw') && $('#bkpw').value) || '';
  if (btn) btn.disabled = true;
  try {
    await flush();
    const ph = await CozyDB.exportPhotos(allPhotoIds()).catch(() => ({})),
      obj = await CozyBackup.build(Object.keys(ph).length ? Object.assign({}, S, { photos: ph }) : S, pw);
    const name = 'cozy-life-os-' + dk(new Date()) + (pw ? '-khoa' : '') + '.json';
    const blob = new Blob([JSON.stringify(obj, null, pw ? 0 : 1)], { type: 'application/json' });
    let done = false;
    if (isIOS && navigator.canShare) {
      const file = new File([blob], name, { type: 'application/json' });
      if (navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: 'Sao lưu Cozy Life' });
          done = true;
        } catch (e) {
          if (e.name === 'AbortError') {
            if (btn) btn.disabled = false;
            return;
          }
        }
      }
    }
    if (!done) {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = name;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        URL.revokeObjectURL(a.href);
        a.remove();
      }, 4000);
    }
    S.lastBackup = new Date().toISOString();
    render();
    say(
      pw
        ? 'Đã sao lưu có khóa 🔐 Nhớ giữ kỹ mật khẩu nha!'
        : 'Đã sao lưu xong 💾 Cất file ở iCloud/Drive cho chắc nhé!',
      5000
    );
  } catch (e) {
    console.error(e);
    say('Ui, sao lưu chưa được 😣 Thử lại nhé', 4000);
  } finally {
    if (btn) btn.disabled = false;
  }
}

let pendingImport = null;
async function readImport(text, pw) {
  try {
    const r = await CozyBackup.parse(text, pw);
    pendingImport = r;
    confirmImportSheet(r);
  } catch (e) {
    if (e.code === 'needpw' || e.code === 'badpw') {
      pendingImport = { text };
      pwSheet(e.code === 'badpw');
    } else
      openSheet(
        `<h2>😣 Không đọc được file</h2><p class="muted">${e.code === 'newer' ? 'File này được tạo bởi phiên bản Cozy Life mới hơn. Hãy cập nhật app rồi thử lại.' : 'File này không phải file sao lưu của Cozy Life, hoặc đã bị hỏng.'}</p><button class="btn full" data-a="closeSheet">Đóng</button>`
      );
  }
}
function pwSheet(bad) {
  openSheet(
    `<h2>🔐 File có mật khẩu</h2><p class="muted" style="margin:0 0 10px">Nhập mật khẩu bạn đã đặt khi sao lưu.</p><input class="inp" type="password" id="impw" autocomplete="current-password">${bad ? '<p class="err">Mật khẩu chưa đúng, thử lại nhé.</p>' : ''}<div class="row" style="margin-top:16px"><button class="btn" data-a="impw">Mở file</button><button class="btn ghost" data-a="closeSheet">Hủy</button></div>`
  );
  setTimeout(() => $('#impw') && $('#impw').focus(), 50);
}
function confirmImportSheet(r) {
  const a = CozyBackup.summary(r.state),
    b = CozyBackup.summary(S);
  openSheet(`<h2>📥 Khôi phục dữ liệu?</h2>
  <div class="okline"><span>📄</span><span>File sao lưu${r.exportedAt ? ' ngày <b>' + fmtDate(r.exportedAt) + '</b>' : ''}: ${a.tasks} việc, ${a.workouts} buổi tập, ${a.people || 0} người thương, ${a.appts || 0} lịch hẹn, ${a.days} ngày, ${a.sleeps} đêm ngủ, ${a.candies} viên kẹo.</span></div>
  <div class="okline warn"><span>📱</span><span>Dữ liệu đang có trên máy: ${b.tasks} việc, ${b.workouts} buổi tập, ${b.people} người thương, ${b.appts} lịch hẹn, ${b.days} ngày, ${b.sleeps} đêm ngủ, ${b.candies} viên kẹo. Sẽ được <b>thay hết</b> bằng file.</span></div>
  <p class="muted">Yên tâm: app chụp lại dữ liệu hiện tại trước, nếu cần có thể "Quay lại" trong mục Bản chụp tự động.</p>
  <div class="row" style="margin-top:12px"><button class="btn" data-a="doImport">Khôi phục</button><button class="btn ghost" data-a="closeSheet">Hủy</button></div>`);
}
async function replaceState(ns, label) {
  await flush();
  if (ns && ns.photos) {
    await CozyDB.importPhotos(ns.photos).catch(() => {});
    ns = Object.assign({}, ns);
    delete ns.photos;
  }
  if (hasData(S)) await CozyDB.putSnapshot('safe-' + Date.now(), S, label).catch(() => {});
  const keepLast = S.lastBackup;
  S = Object.assign(DEF(), ns);
  normalize();
  if (!S.lastBackup) S.lastBackup = keepLast;
  await CozyDB.replaceAll(S);
  snaps = null;
  demoNight = false;
}
