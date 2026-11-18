/* ---------- 🌱 Thói quen ---------- */
const HICONS = ['📖', '🧘', '🏃', '🥗', '🧴', '✍️', '🎹', '🌿', '💊', '🦷', '🙏', '📵', '🚶', '🍎', '☀️', '🛏️'];
const HDEF = () => DEF().habits;
const HAUTO = {
  water: 'Tự tick khi uống đủ nước',
  gym: 'Tự tick khi hoàn thành buổi tập',
  sleep: 'Tự tick khi bấm "Đi ngủ" trước giờ mục tiêu'
};
function habitDone(h, k) {
  const d = S.days[k];
  if (!d) return false;
  if ((d.hb || {})[h.id]) return true;
  if (h.auto === 'water') {
    const w = dayWater(k);
    return w.n > 0 && w.n >= w.goal;
  }
  if (h.auto === 'gym') return S.workouts.some(w => w.end && w.date === k);
  if (h.auto === 'sleep') return !!d.sleptEarly;
  return false;
}
function habitStreak(h) {
  const x = new Date();
  if (!habitDone(h, dk(x))) x.setDate(x.getDate() - 1);
  let n = 0;
  for (let i = 0; i < 1000; i++) {
    if (habitDone(h, dk(x))) {
      n++;
      x.setDate(x.getDate() - 1);
    } else break;
  }
  return n;
}
function waterBlock() {
  const d = today(),
    WG = waterGoal(),
    wx = waterExtra(),
    ml = S.water.ml;
  return `<div class="wblock"><div class="wbh"><b>💧 Uống nước</b><span>${d.water}/${WG} ly · ${fmtL(d.water * ml)}/${fmtL(WG * ml)}${d.water >= WG ? ' ✓' : ''}</span><button class="chip sm gear" data-spgo="water" aria-label="Cài đặt uống nước">⚙️</button></div>
  <div class="cups" style="grid-template-columns:repeat(${Math.min(8, WG)},minmax(0,1fr))">${Array.from({ length: WG }, (_, i) => `<button class="cup" data-w="${i}" aria-label="Ly ${i + 1}">${cupSvg(i < d.water)}</button>`).join('')}</div>
  ${d.water > WG ? `<p class="muted" style="margin:6px 0 0">Đã uống thêm ${d.water - WG} ly ngoài mục tiêu 💙</p>` : ''}${wx.ml ? `<p class="muted" style="margin:6px 0 0">Hôm nay mục tiêu +${Math.round(wx.ml / ml)} ly vì ${wx.why.join(' và ')}.</p>` : ''}
  <div class="row" style="align-items:center">${d.water >= WG ? `<button class="chip sm" data-a="waterPlus">＋ Uống thêm 1 ly</button>` : ''}<button class="linkbtn" data-a="goWater">📊 Lịch sử uống nước</button></div></div>`;
}
function habitsCard() {
  const td = dk(new Date());
  const done = S.habits.filter(h => habitDone(h, td)).length;
  return `<div class="card"><h2>🌱 Thói quen <small>${done}/${S.habits.length} <button class="chip sm gear" data-spgo="habits" aria-label="Sửa thói quen">⚙️</button></small></h2>${waterBlock()}<div class="hgrid">${S.habits
    .filter(h => h.auto !== 'water')
    .map(h => {
      const on = habitDone(h, td),
        st = habitStreak(h);
      return `<button class="habit ${on ? 'on' : ''}" data-hb="${h.id}" aria-pressed="${on}"><span class="hi">${h.i}</span><span class="hn">${esc(h.n)}</span><span class="hs">${st ? '🔥 ' + st + ' ngày' : on ? 'Hôm nay ✓' : 'Chưa'}</span></button>`;
    })
    .join('')}</div></div>`;
}
function toggleHabit(id) {
  const h = S.habits.find(x => x.id === id);
  if (!h) return;
  const d = today(),
    k = dk(new Date());
  d.hb = d.hb || {};
  if (habitDone(h, k) && !d.hb[id]) {
    say(
      h.auto === 'water'
        ? 'Đã uống đủ nước nên tự tick rồi nè 💧'
        : h.auto === 'gym'
          ? 'Hôm nay tập rồi nên tự tick đó 💪'
          : 'Tối qua ngủ sớm nên tự tick rồi 😴',
      3000
    );
    return;
  }
  d.hb[id] = !d.hb[id];
  if (!d.hb[id]) delete d.hb[id];
  render();
  if (habitDone(h, k)) {
    const st = habitStreak(h);
    if (S.habits.every(x => habitDone(x, k))) celebrate(1);
    say(
      st >= 7 && st % 7 === 0
        ? 'Chuỗi ' + st + ' ngày! ' + S.name + ' kiên trì quá 🔥'
        : ['Giỏi lắm! ✅', 'Thêm một ngày giữ thói quen 🌱', 'Tuyệt vời ' + S.name + ' ✨'][
            Math.floor(Math.random() * 3)
          ],
      3000
    );
  }
}
function habitsPage() {
  return `<div class="card"><h2>🌱 Thói quen hằng ngày</h2><p class="muted" style="margin:0 0 6px">Đổi tên, xóa, hoặc thêm thói quen bạn muốn giữ. Thói quen có ✨ được app tự tick.</p>
  ${S.habits.map(h => `<div class="hedit"><span class="hi">${h.i}</span><input class="inp" data-hname="${h.id}" value="${esc(h.n)}" maxlength="30" aria-label="Tên thói quen"><button class="xbtn" data-hdel="${h.id}" aria-label="Xóa">🗑️</button></div>${h.auto ? `<p class="muted" style="margin:-2px 0 6px 52px;font-size:12px">✨ ${HAUTO[h.auto]}</p>` : ''}`).join('')}
  <h3 class="wh">Thêm thói quen</h3><div class="row">${HICONS.map(i => `<button class="chip sm" data-hicon="${i}" aria-pressed="${(F.hicon || '📖') === i}">${i}</button>`).join('')}</div>
  <form id="habitF" class="addrow" style="margin-top:8px"><input class="inp" id="hNew" placeholder="vd: Thiền 5 phút" maxlength="30" autocomplete="off"><button class="btn" aria-label="Thêm thói quen">＋</button></form>
  ${S.habits.some(h => h.auto) && HDEF().every(x => S.habits.some(h => h.id === x.id)) ? '' : '<button class="chip sm" data-a="hReset" style="margin-top:10px">Khôi phục thói quen mặc định</button>'}</div>`;
}

/* ---------- 🕒 Thời gian biểu ---------- */
const BLOCKS = [
  ['morning', '🌅 Sáng', 4, 11],
  ['noon', '☀️ Trưa', 11, 14],
  ['after', '🌤️ Chiều', 14, 18],
  ['eve', '🌙 Tối', 18, 28]
];
const blockOf = t => {
  let h = +t.split(':')[0];
  if (h < 4) h += 24;
  return (BLOCKS.find(b => h >= b[2] && h < b[3]) || BLOCKS[0])[0];
};
function schedItems() {
  const d = today(),
    td = dk(new Date()),
    L = [];
  S.routine.forEach(r =>
    L.push({ kind: 'r', id: r.id, t: r.t, title: r.title, done: !!(d.rdone || {})[r.id], rep: 1 })
  );
  (d.sched || []).forEach(s => L.push({ kind: 's', id: s.id, t: s.t, title: s.title, done: !!s.done }));
  S.tasks
    .filter(t => t.due === td && t.dueTime)
    .forEach(t => L.push({ kind: 't', id: t.id, t: t.dueTime, title: '📋 ' + t.title, done: !!t.done }));
  if (S.gym.days.length && planFor(new Date()))
    L.push({
      kind: 'g',
      id: 'gym',
      t: S.gym.time,
      title: '🏋️ Tập ' + SPLITS[planFor(new Date())][0],
      done: doneWos().some(w => w.date === td)
    });
  S.appts
    .filter(a => a.date === td && a.time)
    .forEach(a => L.push({ kind: 'a', id: a.id, t: a.time, title: '💌 ' + (a.title || 'Lịch hẹn'), done: !!a.done }));
  if (napCfg().sched)
    L.push({ kind: 'n', id: 'nap', t: S.nap.time, title: '☀️ Ngủ trưa', done: napsOf(d).length > 0, rep: 1 });
  L.push({ kind: 'b', id: 'bed', t: S.bedTarget, title: '😴 Đi ngủ', done: !!d.evening });
  const key = t => {
    let [h, m] = t.split(':').map(Number);
    if (h < 4) h += 24;
    return h * 60 + m;
  };
  return L.sort((a, b) => key(a.t) - key(b.t));
}
function schedCard() {
  const L = schedItems(),
    now = new Date(),
    cur = blockOf(hm(now));
  const td = dk(now),
    pend = S.tasks.filter(t => !t.done && t.due && (t.due < td || (t.due === td && !t.dueTime))).sort(sortTasks);
  return `<div class="card"><h2>🕒 Thời gian biểu <small><button class="chip sm gear" data-a="schedAdd" aria-label="Thêm vào thời gian biểu">＋ Thêm</button></small></h2>
  ${pend.length ? `<div class="blk pend"><h3>📌 Cần làm hôm nay</h3>${pend.map(t => `<div class="sitem"><input type="checkbox" data-sdone="t:${t.id}" aria-label="Xong: ${esc(t.title)}"><button class="smain" data-sopen="t:${t.id}"><b>${t.due < td ? '⚠️' : '📋'}</b><span>${esc(t.title)}${t.due < td ? ' <i class="over">quá hạn ' + fmtDue(t.due) + '</i>' : ''}</span></button></div>`).join('')}</div>` : ''}
  ${BLOCKS.map(([k, n]) => {
    const I = L.filter(x => blockOf(x.t) === k);
    if (!I.length && k !== cur) return '';
    return `<div class="blk ${k === cur ? 'now' : ''}"><h3>${n}${k === cur ? ' <i>đang là buổi này</i>' : ''}</h3>${I.length ? I.map(x => `<div class="sitem ${x.done ? 'done' : ''}"><input type="checkbox" data-sdone="${x.kind}:${x.id}" ${x.done ? 'checked' : ''} aria-label="Xong: ${esc(x.title)}"><button class="smain" data-sopen="${x.kind}:${x.id}"><b>${x.t}</b><span>${esc(x.title)}</span>${x.rep ? '<i>🔁</i>' : ''}</button></div>`).join('') : '<p class="muted" style="margin:2px 0 4px">Chưa có gì. Bấm ＋ Thêm nhé.</p>'}</div>`;
  }).join('')}</div>`;
}
function schedSheet(kind, id) {
  const isR = kind === 'r',
    it = isR ? S.routine.find(r => r.id === id) : kind === 's' ? (today().sched || []).find(s => s.id === id) : null;
  F = { rep: isR };
  openSheet(`<h2>${it ? '✏️ Sửa' : '＋ Thêm vào thời gian biểu'}</h2>
  <div class="q"><h3>Giờ</h3><input class="inp" type="time" id="sT" value="${it ? it.t : hm(new Date(Math.ceil(Date.now() / 18e5) * 18e5))}" style="max-width:150px"></div>
  <div class="q"><h3>Việc gì?</h3><input class="inp" id="sTitle" value="${it ? esc(it.title) : ''}" maxlength="60" placeholder="vd: Ăn trưa, Học tiếng Anh"></div>
  <div class="q"><div class="row"><button class="chip" data-f="rep" data-v="" aria-pressed="${!F.rep}">Chỉ hôm nay</button><button class="chip" data-f="rep" data-v="1" aria-pressed="${!!F.rep}">🔁 Lặp lại mỗi ngày</button></div></div>
  <div class="row" style="margin-top:16px"><button class="btn" data-a="schedSave" data-k="${it ? kind + ':' + id : ''}">Lưu</button>${it ? `<button class="btn ghost danger" data-a="schedDel" data-k="${kind}:${id}">Xóa</button>` : ''}</div>`);
}

/* ---------- 📰 Bản tin đầu ngày ---------- */
const QUOTES = [
  'Có công mài sắt, có ngày nên kim.',
  'Kiến tha lâu cũng đầy tổ.',
  'Nước chảy đá mòn.',
  'Có chí thì nên.',
  'Chớ thấy sóng cả mà ngã tay chèo.',
  'Đi một ngày đàng, học một sàng khôn.',
  'Một cây làm chẳng nên non, ba cây chụm lại nên hòn núi cao.',
  'Thất bại là mẹ thành công.',
  'Ăn quả nhớ kẻ trồng cây.',
  'Muốn sang thì bắc cầu kiều, muốn con hay chữ thì yêu lấy thầy.',
  'Hôm nay chỉ cần tốt hơn hôm qua một chút thôi.',
  'Nghỉ ngơi cũng là một phần của cố gắng.',
  'Từng bước nhỏ vẫn là đang tiến về phía trước.',
  'Bạn không cần hoàn hảo, chỉ cần bắt đầu.',
  'Uống một ngụm nước, hít một hơi thật sâu, rồi mình làm tiếp nhé.',
  'Dịu dàng với bản thân như cách bạn dịu dàng với người khác.',
  'Một ngày bình yên cũng là một ngày tuyệt vời.',
  'Việc khó nhất là bắt đầu, phần còn lại sẽ nhẹ dần.',
  'Cảm xúc nào cũng được chào đón, kể cả những ngày không vui.',
  'Hãy tự hào vì bạn đã đi được tới đây.',
  'Làm xong một việc nhỏ còn hơn nghĩ mãi về một việc lớn.',
  'Cơ thể khỏe thì tâm trí mới vui.',
  'Hôm nay hãy cho mình một khoảnh khắc thật chậm.',
  'Không sao nếu hôm nay bạn đi chậm, miễn là đừng bỏ cuộc.',
  'Một nụ cười nhỏ cũng đủ làm sáng cả ngày.',
  'Ngủ đủ giấc là món quà bạn tặng cho chính mình ngày mai.',
  'Mỗi viên kẹo trong lọ là một niềm vui bạn đã nhận ra.',
  'Bạn đang làm tốt hơn bạn nghĩ đấy.',
  'Ưu tiên ba việc quan trọng, những việc khác để sau cũng được.',
  'Biết ơn những điều nhỏ bé, rồi điều lớn sẽ đến.'
];
function briefCard() {
  const now = new Date(),
    td = dk(now),
    day = Math.floor(now / 864e5);
  if (isNight()) return '';
  const se = season(),
    q = se === 'tet' ? TETW_Q[day % TETW_Q.length] : se === 'ny' ? NYW[day % NYW.length] : QUOTES[day % QUOTES.length],
    nT = S.tasks.filter(t => !t.done && t.due && t.due <= td).length,
    gk = S.gym.days.length && planFor(now),
    T3 = today()
      .top3.map(top3Slot)
      .filter(x => x.t).length;
  const chips = [
    nT ? `📋 ${nT} việc đến hạn` : '📋 Không có việc gấp',
    gk ? `🏋️ Tập ${SPLITS[gk][0]} lúc ${S.gym.time}` : S.gym.days.length ? '🌿 Nghỉ tập' : '',
    `💧 ${waterGoal()} ly nước`,
    T3 ? `⭐ Top 3: ${T3}/3 đã chọn` : '',
    ...upcoming(7)
      .filter(x => x.k !== 'appt')
      .slice(0, 2)
      .map(x => (x.k === 'bday' ? '🎂 ' : '💐 ') + esc(x.p.name || '') + ' ' + inDays(x.n)),
    (n => (n ? `💌 ${n} lịch hẹn hôm nay` : ''))(S.appts.filter(a => a.date === td && !a.done).length)
  ].filter(Boolean);
  return `<div class="card brief"><p class="quote">“${q}”</p><div class="bchips">${chips.map(c => `<span>${c}</span>`).join('')}</div></div>`;
}

/* ---------- 📝 Ghi chú nhanh ---------- */
function noteRow(n) {
  const d = new Date(n.at);
  return `<div class="nrow"><span class="ntext">${esc(n.t)}<i>${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${hm(d)}</i></span><button class="xbtn" data-n2t="${n.id}" aria-label="Chuyển thành việc" title="Chuyển thành việc">📋</button><button class="xbtn" data-ndel="${n.id}" aria-label="Xóa ghi chú">🗑️</button></div>`;
}
function notesCard() {
  const L = S.notes;
  return `<div class="card"><h2>📝 Ghi chú nhanh <small>${L.length ? L.length + ' ghi chú' : ''}</small></h2>
  <form id="noteF" class="addrow"><input class="inp" id="nNew" placeholder="Ý tưởng chợt nảy ra…" maxlength="300" autocomplete="off" enterkeyhint="done"><button class="btn" aria-label="Lưu ghi chú">＋</button></form>
  ${L.slice(0, 3).map(noteRow).join('')}${L.length > 3 ? `<button class="linkbtn" data-a="notesAll">Xem tất cả ${L.length} ghi chú</button>` : ''}
  ${L.length ? '<p class="muted" style="margin:6px 0 0;font-size:12px">📋 = chuyển thành việc trong tab Việc</p>' : ''}</div>`;
}

function notesAllSheet() {
  openSheet(
    `<h2>📝 Tất cả ghi chú</h2>${S.notes.map(noteRow).join('') || '<p class="muted">Chưa có ghi chú nào.</p>'}<button class="btn full" style="margin-top:14px" data-a="closeSheet">Đóng</button>`
  );
}
