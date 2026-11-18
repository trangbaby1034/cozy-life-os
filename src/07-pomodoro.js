/* ---------- 🍅 Pomodoro ---------- */
const PLEN = { short: 5, long: 15 };
const pomoLen = m => (m === 'focus' ? S.pomoLen : PLEN[m]) * 60;
function pomoState() {
  if (!S.pomo) S.pomo = { mode: 'focus', endAt: null, left: pomoLen('focus'), taskId: null, round: 0 };
  return S.pomo;
}
function pomoLeft() {
  const p = pomoState();
  return p.endAt ? Math.max(0, Math.ceil((p.endAt - Date.now()) / 1000)) : p.left;
}
const focusing = () => !!(S.pomo && S.pomo.endAt && S.pomo.mode === 'focus');
const mmss = s => pad(Math.floor(s / 60)) + ':' + pad(s % 60);
const RC = 2 * Math.PI * 54;
function pomoCard() {
  const p = pomoState(),
    left = pomoLeft(),
    tot = pomoLen(p.mode),
    run = !!p.endAt,
    t = p.taskId && taskById(p.taskId),
    d = today();
  return `<div class="card pomo ${p.mode}"><h2>🍅 Pomodoro <small>Hôm nay: ${d.pomos || 0} phiên · ${d.focus || 0} phút</small></h2>
  <div class="pwrap"><svg viewBox="0 0 120 120" class="ring" aria-hidden="true"><circle cx="60" cy="60" r="54" class="rbg"/><circle cx="60" cy="60" r="54" class="rfg" id="pRing" stroke-dasharray="${RC}" stroke-dashoffset="${RC * (1 - left / tot)}"/></svg>
  <div class="pmid"><div class="pmode">${p.mode === 'focus' ? 'Tập trung' : p.mode === 'short' ? 'Nghỉ ngắn ☕' : 'Nghỉ dài 🌿'}</div><div class="ptime" id="pTime" role="timer">${mmss(left)}</div><div class="pround" aria-label="Phiên ${(p.round || 0) % 4} trên 4">${'●'.repeat((p.round || 0) % 4)}${'○'.repeat(4 - ((p.round || 0) % 4))}</div></div></div>
  ${t ? `<p class="pfor">Đang làm: <b>${esc(t.title)}</b> <button class="xbtn" data-a="pomoUntask" aria-label="Bỏ chọn việc">✕</button></p>` : ''}
  <div class="row" style="justify-content:center"><button class="btn" data-a="pomoGo">${run ? '⏸️ Tạm dừng' : left < tot ? '▶️ Tiếp tục' : '▶️ Bắt đầu'}</button>${left < tot || run ? '<button class="btn ghost" data-a="pomoReset">↺ Làm lại</button>' : ''}<button class="btn ghost" data-a="pomoSkip">${p.mode === 'focus' ? '⏭️ Nghỉ luôn' : '⏭️ Bỏ nghỉ'}</button></div>
  <details class="more" style="margin-top:10px"><summary>Tùy chọn</summary>
  <div class="q" style="margin-top:6px"><h3>Thời gian tập trung</h3><div class="row">${[15, 25, 45].map(n => `<button class="chip sm" data-plen="${n}" aria-pressed="${S.pomoLen === n}">${n} phút</button>`).join('')}</div></div>
  <div class="q"><h3>Âm thanh nền khi tập trung</h3><div class="row">${[
    ['none', '🔇 Yên lặng'],
    ['rain', '🌧️ Tiếng mưa'],
    ['brown', '🌊 Rì rào']
  ]
    .map(([k, n]) => `<button class="chip sm" data-psnd="${k}" aria-pressed="${S.pomoSound === k}">${n}</button>`)
    .join('')}</div></div>
  <p class="muted" style="margin:10px 0 0">Khi đang tập trung, Chibi ngồi ở góc làm việc cùng bạn, không chạy lung tung. App giữ màn hình sáng. Nếu bạn khóa máy hoặc thoát app thì sẽ không có chuông báo, nhưng mở lại vẫn tính đúng giờ.</p></details></div>`;
}
function pomoTick() {
  const p = S.pomo;
  if (!p || !p.endAt) return;
  const left = pomoLeft();
  const el = $('#pTime');
  if (el) {
    el.textContent = mmss(left);
    const r = $('#pRing');
    if (r) r.setAttribute('stroke-dashoffset', RC * (1 - left / pomoLen(p.mode)));
  }
  if (left <= 0) pomoDone(false);
}
function pomoDone(quiet) {
  const p = pomoState(),
    d = today(),
    was = p.mode;
  if (was === 'focus') {
    d.pomos = (d.pomos || 0) + 1;
    d.focus = (d.focus || 0) + S.pomoLen;
    p.round = (p.round || 0) + 1;
    p.mode = p.round % 4 === 0 ? 'long' : 'short';
  } else p.mode = 'focus';
  p.endAt = null;
  p.left = pomoLen(p.mode);
  stopNoise();
  releaseWake();
  if (tab === 'tasks') render();
  else save();
  if (quiet) {
    if (was === 'focus') say('Phiên tập trung đã xong lúc bạn vắng mặt ✅ Giỏi lắm!', 5000);
    return;
  }
  chime();
  if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
  if (was === 'focus') {
    const t = p.taskId && taskById(p.taskId);
    startAct('dance');
    celebrate(1);
    say(
      (t ? 'Xong một phiên cho "' + t.title + '"! ' : 'Xong một phiên rồi! ') +
        'Nghỉ ' +
        (p.mode === 'long' ? '15' : '5') +
        ' phút nha ☕',
      6000
    );
  } else {
    wander();
    say('Hết giờ nghỉ rồi, mình quay lại nhé 💪', 5000);
  }
}
function pomoGo() {
  const p = pomoState();
  if (p.endAt) {
    p.left = pomoLeft();
    p.endAt = null;
    stopNoise();
    releaseWake();
    render();
    wander();
    say('Tạm dừng nha, nghỉ chút cũng được 🍵', 3000);
    return;
  }
  if (p.left <= 0) p.left = pomoLen(p.mode);
  p.endAt = Date.now() + p.left * 1000;
  if (p.mode === 'focus') {
    startNoise();
    keepAwake();
    say('Bắt đầu nào! Mình làm cùng ' + S.name + ' nhé 💻', 3500);
  }
  render();
  wander();
}
function pomoStop(mode) {
  const p = pomoState();
  p.endAt = null;
  if (mode) p.mode = mode;
  p.left = pomoLen(p.mode);
  stopNoise();
  releaseWake();
  render();
  wander();
}
let noiseNode = null,
  wakeLk = null;
function startNoise(kind) {
  kind = kind || S.pomoSound;
  stopNoise();
  if (kind === 'none' || !kind) return;
  try {
    if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)();
    AC.resume();
    const rain = kind === 'rain',
      len = AC.sampleRate * 6,
      buf = AC.createBuffer(1, len, AC.sampleRate),
      ch = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      if (rain) ch[i] = w * (Math.random() < 0.0006 ? 1 : 0.32);
      else {
        last = (last + 0.02 * w) / 1.02;
        ch[i] = last * 3.5;
      }
    }
    const dif = ch[len - 1] - ch[0];
    for (let i = 0; i < len; i++) ch[i] -= (dif * i) / (len - 1);
    const src = AC.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const f = AC.createBiquadFilter();
    f.type = rain ? 'bandpass' : 'lowpass';
    f.frequency.value = rain ? 1500 : 480;
    f.Q.value = rain ? 0.45 : 0.7;
    const g = AC.createGain();
    g.gain.setValueAtTime(0, AC.currentTime);
    g.gain.linearRampToValueAtTime(rain ? 0.45 : 0.55, AC.currentTime + 1.5);
    src.connect(f);
    f.connect(g);
    g.connect(AC.destination);
    src.start();
    noiseNode = { src, g };
  } catch (e) {}
}
function stopNoise() {
  if (!noiseNode) return;
  try {
    const { src, g } = noiseNode,
      t = AC.currentTime;
    g.gain.cancelScheduledValues(t);
    g.gain.setValueAtTime(g.gain.value, t);
    g.gain.linearRampToValueAtTime(0, t + 0.4);
    src.stop(t + 0.5);
  } catch (e) {}
  noiseNode = null;
}
function chime() {
  if (S.sound === false || !AC) return;
  try {
    const t0 = AC.currentTime;
    [
      [784, 0],
      [988, 0.18],
      [1175, 0.36]
    ].forEach(([fq, off]) => {
      const o = AC.createOscillator(),
        g = AC.createGain();
      o.type = 'triangle';
      o.frequency.value = fq;
      g.gain.setValueAtTime(0, t0 + off);
      g.gain.linearRampToValueAtTime(0.25, t0 + off + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + off + 0.9);
      o.connect(g);
      g.connect(AC.destination);
      o.start(t0 + off);
      o.stop(t0 + off + 1);
    });
  } catch (e) {}
}
async function keepAwake() {
  try {
    if ('wakeLock' in navigator && !wakeLk) {
      wakeLk = await navigator.wakeLock.request('screen');
      wakeLk.addEventListener('release', () => {
        wakeLk = null;
      });
    }
  } catch (e) {}
}
function releaseWake() {
  try {
    if (wakeLk) wakeLk.release();
  } catch (e) {}
  wakeLk = null;
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible') return;
  pomoTick();
  if (focusing()) {
    keepAwake();
    if (noiseNode && AC) AC.resume().catch(() => {});
  }
});
