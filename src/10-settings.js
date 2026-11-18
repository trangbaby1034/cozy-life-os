/* ---------- 🪧 Chibi giơ bảng nhắc ---------- */
function layoutBoard() {
  const el = $('#nudge');
  if (!el) return;
  el.style.bottom = Math.max(90, innerHeight - (P.y + PH * 0.49) + 40) + 'px';
}

function viewSoon(t) {
  return `<div class="card"><h2>${t}</h2><p class="muted" style="margin:0">Phần này sẽ có ở bước tiếp theo.</p></div>`;
}

let wtab = 'outfit',
  snaps = null,
  setPage = null;
function dataCard() {
  const pst = CozyDB.fallback
    ? [
        '⚠️',
        'Trình duyệt này không cho lưu kiểu bền vững (có thể đang ở chế độ ẩn danh). Hãy mở bằng trình duyệt thường.'
      ]
    : persistState === 'yes'
      ? ['✅', 'Đã được bảo vệ: trình duyệt sẽ không tự dọn dữ liệu khi máy đầy bộ nhớ.']
      : [
          '💡',
          (isIOS && !standalone()
            ? 'Safari có thể xóa dữ liệu nếu 7 ngày không mở. Cài app lên màn hình chính để tránh việc này. '
            : 'Trình duyệt có thể tự dọn khi máy rất đầy bộ nhớ. ') + 'Sao lưu định kỳ cho chắc nhé.'
        ];
  const sum = CozyBackup.summary(S);
  if (snaps === null) {
    snaps = [];
    CozyDB.listSnapshots()
      .then(l => {
        snaps = l;
        if (tab === 'set') render();
      })
      .catch(() => {});
  }
  return `<div class="card" id="datacard"><h2>💾 Dữ liệu & sao lưu</h2>
  <p class="muted" style="margin:0 0 10px">Mọi thứ nằm ngay trên máy này, không gửi lên mạng. Hiện có ${sum.tasks} việc, ${sum.workouts} buổi tập, ${sum.people} người thương, ${sum.days} ngày nhật ký, ${sum.sleeps} đêm ngủ, ${sum.candies} viên kẹo.</p>
  <div class="okline ${persistState === 'yes' ? '' : 'warn'}"><span>${pst[0]}</span><span>${pst[1]}</span></div>
  <div class="okline ${backupDue() ? 'warn' : ''}"><span>📤</span><span>Lần sao lưu cuối: <b>${S.lastBackup ? fmtDate(S.lastBackup) + ' (' + (daysSince(S.lastBackup) ? daysSince(S.lastBackup) + ' ngày trước' : 'hôm nay') + ')' : 'chưa có'}</b></span></div>
  <div class="q" style="margin-top:4px"><h3>Mật khẩu cho file sao lưu <span class="muted">(không bắt buộc)</span></h3><input class="inp" type="password" id="bkpw" autocomplete="new-password" placeholder="Để trống nếu không cần"><p class="muted" style="margin:6px 0 0">Đặt mật khẩu thì người khác mở file cũng không đọc được nhật ký. Nhưng <b>quên mật khẩu là không khôi phục được</b>, nên hãy ghi lại ở nơi an toàn.</p></div>
  <div class="row" style="margin-top:12px"><button class="btn" data-a="export">📤 Sao lưu ra file</button><button class="btn ghost" data-a="import">📥 Khôi phục từ file</button></div>
  <details class="more" style="margin-top:14px"><summary>🕰️ Bản chụp tự động (${snaps.length})</summary><p class="muted" style="margin:4px 0 8px">App tự chụp lại dữ liệu mỗi ngày (giữ 7 ngày) và trước mỗi lần khôi phục hoặc xóa. Dùng khi lỡ tay làm mất gì đó.</p>
  ${snaps.length ? snaps.map(s => `<div class="snap"><span>${s.key.startsWith('auto-') ? '📅' : '🛟'} ${fmtDate(s.createdAt)}<br><span class="muted">${esc(s.label || '')} · ${s.days} ngày, ${s.sleeps} đêm</span></span><button class="chip" data-snap="${esc(s.key)}">Quay lại</button></div>`).join('') : '<p class="muted">Chưa có bản chụp nào.</p>'}</details>
  <details class="more" style="margin-top:6px"><summary>🧹 Xóa dữ liệu</summary><div class="row" style="margin-top:8px">${S.sleeps.some(x => x.sample) ? '<button class="btn ghost" data-a="clearSample">Xóa dữ liệu mẫu</button>' : ''}<button class="btn ghost" data-a="reset">Xóa hết, làm lại</button></div><p class="muted hide" id="resetQ">Bấm "Xóa hết" lần nữa để xác nhận. (App sẽ chụp lại trước khi xóa.)</p></details></div>`;
}

const WHY = {
  fav: () => 'đây là bộ yêu thích của bạn',
  night: () => 'đã đến giờ đi ngủ',
  sick: () => 'hôm nay bạn không khỏe',
  wo: () => 'bạn đang tập',
  sore: () => 'bạn đang đau nhức cơ',
  gymday: () => 'hôm nay là ngày tập',
  work: () => 'bạn đang làm việc',
  season: () => (season() === 'tet' ? 'đang Tết (set theo mùa)' : 'đang mùa Giáng sinh (set theo mùa)')
};
function viewSettings() {
  const st = state(),
    L = S.look;
  const card = (k, attr, cur) => {
    const o = OUTFITS[k];
    return `<button class="wd" data-${attr}="${k}" aria-pressed="${cur === k}">${chibi({ mood: 'calm', outfit: k, still: 1, face: 'smile' })}<b>${o.n}</b><span>${o.d}</span></button>`;
  };
  const grp = (title, key, opts) =>
    `<div class="q"><h3>${title}</h3><div class="row">${opts.map(([v, t]) => `<button class="chip" data-look="${key}" data-lv="${v}" aria-pressed="${String(L[key] || 'none') === String(v)}">${t}</button>`).join('')}</div></div>`;
  const pv =
    wtab === 'night'
      ? S.nightWear
      : wtab === 'outfit' || wtab === 'face' || wtab === 'makeup' || wtab === 'acc' || wtab === 'hair'
        ? S.fav
        : st.outfit;
  let body = '';
  if (wtab === 'outfit')
    body = `<h3 class="wh" style="margin-top:0">🎉 Mặc theo mùa</h3><div class="row">${[
      ['set', '🎁 Tự mặc set theo mùa'],
      ['acc', '✨ Chỉ thêm phụ kiện mùa'],
      ['off', '👗 Không theo mùa']
    ]
      .map(([v, t]) => `<button class="chip sm" data-smode="${v}" aria-pressed="${S.seasonMode === v}">${t}</button>`)
      .join('')}</div><p class="muted" style="margin:6px 0 0">${
      S.seasonMode === 'set'
        ? 'Giáng sinh mặc trọn set (váy, mũ Noel, khăn), Năm mới đội mũ tiệc, Tết mặc áo dài cài hoa mai. Hết mùa về đồ bạn chọn.'
        : S.seasonMode === 'acc'
          ? 'Giữ đồ đang mặc, chỉ đội thêm mũ Noel, khăn, mũ tiệc hoặc hoa mai theo mùa.'
          : 'Chibi mặc đúng đồ bạn chọn. Đồ và phụ kiện mùa vẫn mặc được quanh năm như đồ thường.'
    }</p>${
      S.seasonMode === 'set'
        ? `<div class="q" style="margin-top:8px"><h3>Set Giáng sinh</h3><div class="row">${[...XMASFITS.map(k => [k, OUTFITS[k].n]), ['rand', '🎲 Mỗi ngày một bộ']].map(([k, n]) => `<button class="chip sm" data-sfit="${k}" aria-pressed="${(S.seasonFit.xmas || 'noel') === k}">${n}</button>`).join('')}</div></div>`
        : ''
    }<h3 class="wh">Váy áo hằng ngày</h3><div class="wgrid">${DAY.filter(
      k => !XMAS.includes(k) && !TETW.includes(k) && !WORK.includes(k)
    )
      .map(k => card(k, 'fav', S.fav))
      .join(
        ''
      )}</div><h3 class="wh">💼 Công sở</h3><p class="muted" style="margin:0 0 8px">Chạm một lần để mặc hằng ngày. Bộ có dấu 💼 là bộ Chibi tự thay khi bạn bấm "Bắt đầu làm việc".</p><div class="wgrid">${WORK.map(k => card(k, 'fav', S.fav).replace('<b>', (OUTFITS[S.workFit] ? S.workFit : 'office') === k ? '<b>💼 ' : '<b>')).join('')}</div><div class="row" style="margin-top:10px"><button class="chip sm" data-workwear="1" aria-pressed="${S.workWear !== false}">💼 Tự mặc đồ công sở khi đang làm việc</button></div><div class="row" style="margin-top:8px">${WORK.map(k => `<button class="chip sm" data-workfit="${k}" aria-pressed="${(OUTFITS[S.workFit] ? S.workFit : 'office') === k}">${OUTFITS[k].n}</button>`).join('')}</div><h3 class="wh">🧧 Tết</h3><div class="wgrid">${TETW.map(k => card(k, 'fav', S.fav)).join('')}</div><h3 class="wh">🎄 Giáng sinh</h3><div class="wgrid">${XMAS.map(k => card(k, 'fav', S.fav)).join('')}</div><h3 class="wh">Đồ bộ cute</h3><div class="wgrid">${KIG.map(k => card(k, 'fav', S.fav)).join('')}</div>`;
  if (wtab === 'night')
    body = `<p class="muted" style="margin:0 0 10px">Bộ Chibi tự mặc vào buổi tối và khi bạn ốm.</p><div class="wgrid">${NIGHT.map(k => card(k, 'nw', S.nightWear)).join('')}</div><div class="row" style="margin-top:12px"><button class="chip" data-swap="1" aria-pressed="${S.autoSwap}">Tự thay đồ ngủ buổi tối, khi ốm và đồ tập khi đau cơ</button></div>`;
  if (wtab === 'acc')
    body =
      grp('Kính', 'eyewear', [
        ['none', 'Không'],
        ['round', '👓 Gọng tròn'],
        ['sun', '🕶️ Kính râm'],
        ['heart', '💗 Kính tim']
      ]) +
      grp('Trên tóc', 'head', [
        ['none', 'Không'],
        ['bow', '🎀 Nơ'],
        ['band', 'Bờm ngọc'],
        ['pearl', 'Kẹp ngọc trai'],
        ['flower', '🌼 Kẹp hoa'],
        ['beanie', '🧶 Mũ len'],
        ['santa', '🎅 Mũ Noel'],
        ['nyhat', '🎉 Mũ tiệc'],
        ['mai', '🌼 Hoa mai']
      ]) +
      grp('Khăn quàng', 'scarf', [
        ['none', 'Không'],
        ['red', '🧣 Khăn len đỏ']
      ]) +
      grp('Bông tai', 'ear', [
        ['none', 'Không'],
        ['stud', 'Nụ'],
        ['pearl', 'Ngọc trai rủ'],
        ['hoop', 'Khoen vàng']
      ]) +
      grp('Đồng hồ vàng', 'watch', [
        [true, 'Đeo'],
        [false, 'Không']
      ]) +
      grp('Túi xách trắng', 'bag', [
        [true, 'Cầm túi'],
        [false, 'Không']
      ]) +
      `<p class="muted">Đồng hồ và túi chỉ hiện với váy áo đi chơi; phụ kiện trên tóc ẩn khi mặc đồ bộ có mũ.</p>`;
  if (wtab === 'makeup')
    body =
      `<div class="q" style="margin-top:0"><h3>Màu son</h3><div class="row">${LIPS.map(([c, t]) => `<button class="sw" data-look="lip" data-lv="${c}" style="background:${c}" aria-label="${t}" aria-pressed="${L.lip === c}"></button>`).join('')}</div><p class="muted" style="margin:6px 0 0">${(LIPS.find(x => x[0] === L.lip) || ['', ''])[1]}</p></div>` +
      grp('Má hồng', 'blush', [
        ['soft', 'Tự nhiên'],
        ['strong', 'Ửng đậm'],
        ['heart', '💗 Trái tim'],
        ['none', 'Không']
      ]) +
      grp('Mi mắt', 'lash', [
        ['natural', 'Tự nhiên'],
        ['long', 'Cong dài']
      ]) +
      grp('Tàn nhang', 'freckles', [
        [false, 'Không'],
        [true, 'Có']
      ]);
  if (wtab === 'face')
    body = `<p class="muted" style="margin:0 0 10px">"Theo tâm trạng" thì nét mặt đổi theo Check-in. Khi ốm hoặc buồn ngủ, Chibi vẫn tự đổi để nhắc bạn.</p><div class="row">${FACES.map(([v, i, t]) => `<button class="chip" data-look="face" data-lv="${v}" aria-pressed="${L.face === v}">${i} ${t}</button>`).join('')}</div>`;
  if (wtab === 'hair')
    body = `<div class="q" style="margin-top:0"><h3>Kiểu tóc</h3><div class="row">${[
      ['straight', 'Dài thẳng rẽ ngôi'],
      ['wavy', 'Dài xoăn sóng'],
      ['bob', 'Ngắn mái ngố'],
      ['buns', 'Búi hai bên']
    ]
      .map(([k, t]) => `<button class="chip" data-hair="${k}" aria-pressed="${S.hair === k}">${t}</button>`)
      .join(
        ''
      )}</div></div><div class="q"><h3>Màu tóc</h3><div class="row">${HAIRC.map(c => `<button class="sw" data-hc="${c}" style="background:${c}" aria-label="Màu ${c}" aria-pressed="${S.hairColor === c}"></button>`).join('')}</div></div>`;
  const WT = [
    ['outfit', '👗 Trang phục'],
    ['night', '🌙 Đồ ngủ'],
    ['acc', '🎀 Phụ kiện'],
    ['makeup', '💄 Trang điểm'],
    ['face', '😊 Nét mặt'],
    ['hair', '💇‍♀️ Tóc']
  ];
  const SEC = {
    jlock: () => jlockPage(),
    wardrobe: () => `<div class="card"><h2>👗 Phòng thay đồ</h2>
  <div class="mirror">${chibi({ mood: 'calm', outfit: pv, face: L.face === 'auto' ? 'smile' : L.face })}</div>
  <p class="muted whyline">Hôm nay Chibi mặc <b>${OUTFITS[st.outfit] ? OUTFITS[st.outfit].n : ''}</b> vì ${WHY[st.why] ? WHY[st.why]() : 'đây là bộ yêu thích của bạn'}.</p>  <div class="wtabs scroll">${WT.map(([k, t]) => `<button data-wt="${k}" aria-pressed="${wtab === k}">${t}</button>`).join('')}</div>
  ${body}</div>
  `,
    season: () => `  <div class="card"><h2>🎨 Giao diện theo mùa</h2><div class="row">${[
      ['auto', '✨ Tự động theo ngày'],
      ['xmas', '🎄 Giáng sinh'],
      ['ny', '🎆 Năm mới'],
      ['tet', '🧧 Tết Nguyên Đán'],
      ['none', 'Tắt']
    ]
      .map(
        ([k, t]) => `<button class="chip" data-theme="${k}" aria-pressed="${(S.theme || 'auto') === k}">${t}</button>`
      )
      .join('')}</div>
  <p class="muted" style="margin:10px 0 0">✨ <b>Tự động</b>: 🎄 Giáng sinh 15/11–26/12 (tuyết rơi, mũ Noel, ca cao nóng) · 🎆 Năm mới 27/12–5/1 (pháo hoa, mũ tiệc, pháo bông, đếm ngược giao thừa) · 🧧 Tết Nguyên Đán từ 3 tuần trước Tết đến mùng 10 (hoa mai hoa đào rơi, áo dài đỏ, lì xì, bánh chưng, lời chúc Tết). Tết năm nay: ${(() => {
    const T = nextTet();
    return T ? pad(T.t.getDate()) + '/' + pad(T.t.getMonth() + 1) + '/' + T.y + ' – ' + canChi(T.y) : 'chưa có lịch';
  })()}.</p>
  <p class="muted" style="margin:6px 0 0">Muốn Chibi không đổi đồ theo mùa: Phòng thay đồ → Phụ kiện → Đồ theo mùa.</p></div>
  `,
    me: () => `  <div class="card"><h2>🧸 Bạn & Chibi</h2>
  <div class="q" style="margin-top:0"><h3>Tên Chibi gọi bạn</h3><input class="inp" id="nm" value="${esc(S.name)}" maxlength="20"></div>
  <div class="q"><h3>Chibi di chuyển</h3><div class="row"><button class="chip" data-roam="1" aria-pressed="${S.roam !== false}">🏃 Chạy lung tung</button><button class="chip" data-roam="0" aria-pressed="${S.roam === false}">🪑 Ngồi yên một góc</button></div><p class="muted" style="margin:6px 0 0">Mẹo: kéo Chibi để bế bé sang chỗ khác.</p></div>
  <div class="q"><h3>🔋 Giảm hiệu ứng (tiết kiệm pin)</h3><div class="row"><button class="chip" data-a="lowFx" aria-pressed="${!!S.lowFx}">${S.lowFx ? '✅ Đang bật' : 'Đang tắt'}</button></div><p class="muted" style="margin:6px 0 0">Tắt tuyết, pháo hoa, hoa rơi, hoa giấy và các chuyển động; Chibi ngồi yên một góc. Nên bật khi máy yếu pin hoặc thấy máy nóng.</p></div>
  <div class="q"><h3>Âm thanh Chibi</h3><div class="row"><button class="chip" data-snd="1" aria-pressed="${S.sound !== false}">🔊 Bật (tiếng ực ực khi uống nước)</button><button class="chip" data-snd="0" aria-pressed="${S.sound === false}">🔇 Tắt</button></div></div>
  <div class="q"><h3>Giờ đi ngủ mục tiêu</h3><input class="inp" type="time" id="bt" value="${S.bedTarget}"></div></div>
  `,
    remind: () => `  <div class="card"><h2>🔔 Nhắc nhở</h2>
  <p class="muted" style="margin:0 0 6px">App web trên iPhone chỉ tự nhắc được khi đang mở. Muốn được báo cả khi app tắt, chọn 📅 (thêm vào app Lịch) hoặc ⏰ (báo thức trong app Đồng hồ).</p>
  <div class="q" style="margin-top:8px"><h3>Mặc định cho việc có hạn chót</h3><div class="row">${LV.map(([k, i, n]) => `<button class="chip sm" data-rdef="${k}" aria-pressed="${S.remindDefault.task === k}">${i} ${n}</button>`).join('')}</div><p class="muted" style="margin:6px 0 0">Từng việc vẫn đổi riêng được trong phần chi tiết.</p></div>
  <div class="q"><h3>Giờ đi ngủ (${S.bedTarget})</h3><div class="row">${LV.slice(0, 3)
    .map(
      ([k, i, n]) =>
        `<button class="chip sm" data-rbed="${k}" aria-pressed="${S.remindDefault.bed === k}">${i} ${n}</button>`
    )
    .join('')}</div>
  ${S.remindDefault.bed === 'chibi' ? '<p class="muted" style="margin:6px 0 0">Trước giờ ngủ 30 phút, nếu đang mở app, Chibi sẽ nhắc bạn khép lại ngày.</p>' : S.remindDefault.bed === 'cal' ? `<div class="okline ${S.bedBell ? '' : 'warn'}" style="margin:8px 0 0"><span>${S.bedBell ? '🔔' : '🔕'}</span><span>${S.bedBell ? 'Đã thêm vào Lịch, báo trước 30 phút mỗi tối' : 'Chưa thêm vào Lịch'}</span></div><button class="btn ghost" style="margin-top:8px" data-a="bedIcs">📅 ${S.bedBell ? 'Thêm lại' : 'Thêm Giờ đi ngủ vào Lịch'} (lặp hằng ngày)</button>` : ''}</div>
  <div class="q"><h3>🎂 Sinh nhật & ngày kỷ niệm</h3><div class="row">${LV.slice(0, 3)
    .map(
      ([k, i, n]) =>
        `<button class="chip sm" data-bdlv="${k}" aria-pressed="${S.remindDefault.bday === k}">${i} ${n}</button>`
    )
    .join(
      ''
    )}</div>${S.remindDefault.bday !== 'none' ? `<div class="row" style="margin-top:8px">${BLEADS.map(([v, n]) => `<button class="chip sm" data-bdlead="${v}" aria-pressed="${S.remindDefault.bdayLead === v}">${n}</button>`).join('')}</div>` : ''}<p class="muted" style="margin:6px 0 0">${S.remindDefault.bday === 'cal' ? 'Mỗi người thêm vào Lịch một lần là năm nào iPhone cũng báo (9:00 sáng). Vào đúng ngày, Chibi vẫn chúc mừng trong app.' : S.remindDefault.bday === 'chibi' ? 'Chibi nhắc khi bạn mở app.' : 'Chibi vẫn đội mũ tiệc vào ngày sinh nhật, nhưng không nhắc.'}</p></div>
  <div class="q"><h3>💌 Lịch hẹn</h3><div class="row">${LV.slice(0, 3)
    .map(
      ([k, i, n]) =>
        `<button class="chip sm" data-aplv="${k}" aria-pressed="${S.remindDefault.appt === k}">${i} ${n}</button>`
    )
    .join(
      ''
    )}</div><p class="muted" style="margin:6px 0 0">Mặc định báo trước 1 giờ. Từng lịch hẹn vẫn đổi riêng được.</p></div>
  <p class="muted" style="margin:12px 0 0">💡 Ngày Lười Biếng (đang ốm hoặc năng lượng ≤ 2): Chibi tạm không nhắc việc. Sắp có: Trung tâm nhắc nhở, Giờ yên tĩnh, Phím tắt "Cozy Nhắc" để tạo báo thức một chạm.</p></div>
  `,
    data: () => `  ${dataCard()}
  `,
    install: () => `  ${standalone() ? '' : `<div class="card"><h2>📲 Cài lên màn hình chính</h2>${installHow()}</div>`}
  `,
    demo: () => `  <div class="card demo"><h2>🧪 Xem thử trạng thái</h2><p class="muted" style="margin:0 0 10px">Xem trước các trạng thái mà không cần đợi đến giờ.</p><div class="row"><button class="btn ghost" data-a="demoNight">${demoNight ? '☀️ Về ban ngày' : '🌙 Thử Giờ đi ngủ'}</button></div>
  <h3 style="font-size:15px;margin:14px 0 8px">Hoạt động của Chibi</h3><p class="muted" style="margin:0 0 8px">Bình thường bé tự chọn theo tâm trạng và thể trạng hôm nay. Bấm để xem trước:</p><div class="row">${Object.keys(
    ACTNAME
  )
    .map(k => `<button class="chip" data-act="${k}">${ACTNAME[k]}</button>`)
    .join('')}</div></div>
  `,
    water: () => {
      const w = S.water,
        r = waterRec();
      return `<div class="card"><h2>💧 Uống nước mỗi ngày</h2>
  <div class="q" style="margin-top:4px"><h3>Mục tiêu</h3><div class="stepper"><button data-wc="-1" aria-label="Bớt 1 ly">−</button><b>${w.cups} ly</b><button data-wc="1" aria-label="Thêm 1 ly">＋</button></div></div>
  <div class="q"><h3>Dung tích 1 ly</h3><div class="row">${[150, 200, 250, 300, 350, 500].map(n => `<button class="chip sm" data-wml="${n}" aria-pressed="${w.ml === n}">${n} ml</button>`).join('')}</div></div>
  <div class="okline" style="margin-top:12px"><span>💧</span><span>Mỗi ngày: <b>${w.cups} ly × ${w.ml} ml = ${fmtL(w.cups * w.ml)}</b></span></div>
  <button class="chip" data-a="wAuto" aria-pressed="${w.auto}">Tự cộng thêm 500 ml vào ngày tập và ngày trời nóng</button></div>
  <div class="card"><h2>🧮 Gợi ý theo cơ thể</h2>
  <p class="muted" style="margin:0 0 8px">Cách tính phổ biến: <b>30–35 ml cho mỗi kg cân nặng</b>, cộng thêm khoảng 350 ml cho mỗi 30 phút vận động. Các khuyến nghị chính thức không dùng chiều cao nên app chỉ hỏi cân nặng.</p>
  <div class="q"><h3>Cân nặng (kg)</h3><input class="inp" type="number" inputmode="decimal" id="wkg" value="${esc(w.weight)}" min="25" max="250" step="0.5" placeholder="vd: 50" style="max-width:140px"></div>
  <div class="q"><h3>Vận động mỗi ngày</h3><div class="row">${WACT.map(([k, n]) => `<button class="chip sm" data-wact="${k}" aria-pressed="${w.activity === k}">${n}</button>`).join('')}</div></div>
  ${r ? `<div class="okline" style="margin-top:12px"><span>✨</span><span>Gợi ý: khoảng <b>${fmtL(r.lo)} – ${fmtL(r.hi)}</b> mỗi ngày ≈ <b>${r.cups} ly ${w.ml} ml</b></span></div><button class="btn" data-a="wUse" ${r.cups === w.cups ? 'disabled' : ''}>${r.cups === w.cups ? 'Đang dùng mức gợi ý ✓' : 'Dùng gợi ý này'}</button>` : '<p class="muted">Nhập cân nặng để xem gợi ý.</p>'}
  <p class="muted" style="margin:12px 0 0">Tham khảo: Cơ quan An toàn Thực phẩm châu Âu (EFSA) khuyến nghị tổng lượng nước khoảng 2,0 lít/ngày cho nữ và 2,5 lít cho nam, tính cả nước từ thức ăn. Con số "8 ly mỗi ngày" không có cơ sở khoa học. Cơn khát và màu nước tiểu (vàng nhạt là ổn) cũng là cách theo dõi tốt.</p>
  <div class="tip">⚠️ Nếu bạn có bệnh tim, thận, gan, đang mang thai, hoặc được bác sĩ dặn hạn chế/tăng lượng nước, hãy theo chỉ định của bác sĩ.</div></div>`;
    },
    habits: () => habitsPage(),
    todaycards:
      () => `<div class="card"><h2>🏠 Tab Hôm nay</h2><p class="muted" style="margin:0 0 8px">Bật/tắt và sắp xếp thứ tự các thẻ. Thẻ hệ thống (cài app, nhắc sao lưu, giờ đi ngủ, Ngày Lười Biếng) vẫn tự hiện khi cần.</p>
  ${cardOrder()
    .map((k, i, a) => {
      const c = TCARDS.find(x => x[0] === k),
        on = cardOn(k);
      return `<div class="corow ${on ? '' : 'off'}"><span class="si">${c[1]}</span><span class="stx"><b>${c[2]}</b></span><button class="xbtn" data-cmove="${k}:-1" ${i ? '' : 'disabled'} aria-label="Đưa ${c[2]} lên">▲</button><button class="xbtn" data-cmove="${k}:1" ${i < a.length - 1 ? '' : 'disabled'} aria-label="Đưa ${c[2]} xuống">▼</button><button class="chip sm" data-ctog="${k}" aria-pressed="${on}">${on ? 'Hiện' : 'Ẩn'}</button></div>`;
    })
    .join('')}
  <button class="chip sm" data-a="cReset" style="margin-top:12px">Về mặc định</button></div>`,
    about:
      () => `  <div class="card"><h2>💝 Giới thiệu & Ghi công</h2><p class="muted" style="margin:6px 0">Cozy Life OS là app cá nhân, mọi dữ liệu nằm trên máy bạn. App dùng lại các thư viện mã nguồn mở sau (đã được kiểm tra không gửi dữ liệu đi đâu):</p>
  <ul class="muted credits"><li><b>canvas-confetti</b> – hiệu ứng hoa giấy · Kiril Vatev · giấy phép ISC</li><li><b>free-exercise-db</b> – dữ liệu bài tập gốc · yuhonas · Unlicense (công cộng); tên & mô tả tiếng Việt viết riêng</li><li><b>Everkinetic</b> – hình tư thế bài tập · Greg Priday & cộng đồng (github.com/everkinetic/data) · <a href="https://creativecommons.org/licenses/by-sa/4.0/deed.vi" target="_blank" rel="noopener">CC BY-SA 4.0</a> · chỉ nén dung lượng, không sửa nội dung hình</li><li><b>body-highlighter</b> – hình cơ thể tô nhóm cơ · GV79 & alahaxe · giấy phép MIT</li><li><b>Quicksand</b> & <b>Nunito</b> – phông chữ · SIL Open Font License</li></ul></div>
  <p class="muted" style="text-align:center;margin:18px 0 6px">Cozy Life OS · phiên bản <span id="ver">${APPVER}</span></p><div class="row" style="justify-content:center"><button class="chip sm" data-a="checkUpd">🔄 Kiểm tra bản mới</button></div>
  `
  };
  if (setPage && SEC[setPage])
    return `<div class="subhead"><button class="backbtn" data-sp="">‹ Cài đặt</button></div>` + SEC[setPage]();
  return settingsHub();
}
function settingsHub() {
  const bd = backupDue(),
    ds = S.lastBackup ? daysSince(S.lastBackup) : null;
  const G = [
    [
      'Chibi',
      [
        ['wardrobe', '👗', 'Phòng thay đồ', 'Trang phục, đồ ngủ, phụ kiện, trang điểm, tóc'],
        [
          'me',
          '🧸',
          'Bạn & Chibi',
          'Tên: ' +
            esc(S.name) +
            ' · ngủ lúc ' +
            S.bedTarget +
            ' · ' +
            (S.roam === false ? 'ngồi yên' : 'chạy lung tung')
        ],
        [
          'season',
          '🎨',
          'Giao diện theo mùa',
          { auto: 'Tự động', xmas: '🎄 Giáng sinh', ny: '🎆 Năm mới', tet: '🧧 Tết', none: 'Tắt' }[S.theme || 'auto'] +
            (S.theme === 'auto' || !S.theme
              ? season()
                ? ' · đang: ' + { xmas: '🎄 Giáng sinh', ny: '🎆 Năm mới', tet: '🧧 Tết' }[season()]
                : ''
              : '')
        ]
      ]
    ],
    [
      'Sức khỏe',
      [
        ['habits', '🌱', 'Thói quen', S.habits.map(h => h.i).join(' ') + ' · ' + S.habits.length + ' thói quen'],
        [
          'water',
          '💧',
          'Uống nước',
          S.water.cups + ' ly × ' + S.water.ml + ' ml = ' + fmtL(S.water.cups * S.water.ml) + ' mỗi ngày'
        ]
      ]
    ],
    [
      'Ứng dụng',
      [
        ['todaycards', '🏠', 'Tab Hôm nay', cardOrder().filter(cardOn).length + '/' + TCARDS.length + ' thẻ đang hiện'],
        [
          'remind',
          '🔔',
          'Nhắc nhở',
          'Việc có hạn: ' +
            lvInfo(S.remindDefault.task)[1] +
            ' ' +
            lvInfo(S.remindDefault.task)[2] +
            ' · Giờ ngủ: ' +
            lvInfo(S.remindDefault.bed)[1]
        ],
        ['jlock', '🔒', 'Khóa nhật ký', S.jlock && S.jlock.hash ? 'Đang bật mã PIN' : 'Chưa bật'],
        [
          'data',
          '💾',
          'Dữ liệu & sao lưu',
          S.lastBackup ? 'Sao lưu lần cuối: ' + (ds ? ds + ' ngày trước' : 'hôm nay') : 'Chưa sao lưu lần nào',
          bd
        ],
        ...(standalone()
          ? []
          : [['install', '📲', 'Cài lên màn hình chính', 'Mở như app, dùng được khi không có mạng']])
      ]
    ],
    [
      'Khác',
      [
        ['demo', '🧪', 'Xem thử trạng thái', 'Giờ đi ngủ, các hoạt động của Chibi'],
        ['about', '💝', 'Giới thiệu & Ghi công', 'Thư viện mã nguồn mở và giấy phép']
      ]
    ]
  ];
  return (
    G.map(
      ([t, rows]) =>
        `<div class="card setgroup"><h3 class="sgh">${t}</h3>${rows.map(([k, i, n, sub, warn]) => `<button class="setrow2" data-sp="${k}"><span class="si">${i}</span><span class="stx"><b>${n}</b><i class="${warn ? 'warnt' : ''}">${warn ? '⚠️ ' : ''}${sub}</i></span><span class="chev">›</span></button>`).join('')}</div>`
    ).join('') +
    `<p class="muted" style="text-align:center;margin:18px 0 6px">Cozy Life OS · phiên bản <span id="ver">${APPVER}</span></p><div class="row" style="justify-content:center"><button class="chip sm" data-a="checkUpd">🔄 Kiểm tra bản mới</button></div>`
  );
}
