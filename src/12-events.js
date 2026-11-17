/* ---------- Events ---------- */
document.addEventListener('click', async e => {
  const t = e.target.closest('button');
  if (!t) return;
  if (t.id === 'toast') return;
  if (t.dataset.tab) {
    if (t.dataset.tab === 'set') setPage = null;
    tab = t.dataset.tab;
    render();
    scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }
  if (t.dataset.sp !== undefined) {
    setPage = t.dataset.sp || null;
    render();
    scrollTo({ top: 0 });
    return;
  }
  if (t.dataset.f) {
    e.preventDefault();
    F[t.dataset.f] = isNaN(t.dataset.v) ? t.dataset.v : +t.dataset.v;
    t.parentNode.querySelectorAll('.chip').forEach(b => b.setAttribute('aria-pressed', b === t));
    return;
  }
  if (t.dataset.star) {
    F.q = +t.dataset.star;
    t.parentNode.querySelectorAll('button').forEach(b => b.classList.toggle('on', +b.dataset.star <= F.q));
    return;
  }
  if (t.dataset.w !== undefined) {
    const d = today(),
      i = +t.dataset.w,
      G = waterGoal(),
      was = d.water;
    d.water = d.water === i + 1 ? i : i + 1;
    render();
    if (d.water >= G && was < G) celebrate(1);
    say(
      d.water >= G
        ? 'Đủ ' + G + ' ly rồi! ' + S.name + ' giỏi quá 🎉'
        : 'Thêm 1 ly nữa nè 💧 (' + d.water + '/' + G + ')'
    );
    return;
  }
  if (t.dataset.hb) {
    toggleHabit(t.dataset.hb);
    return;
  }
  if (t.dataset.hdel) {
    if (!t.dataset.sure) {
      t.dataset.sure = '1';
      t.textContent = 'Xóa?';
      return;
    }
    S.habits = S.habits.filter(h => h.id !== t.dataset.hdel);
    render();
    return;
  }
  if (t.dataset.hicon) {
    F.hicon = t.dataset.hicon;
    t.parentNode.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b === t));
    return;
  }
  if (t.dataset.sopen) {
    const [k, id] = t.dataset.sopen.split(':');
    if (k === 'r' || k === 's') schedSheet(k, id);
    else if (k === 't') taskSheet(id);
    else if (k === 'g') {
      tab = 'health';
      htab = 'gym';
      render();
      scrollTo({ top: 0 });
    } else if (k === 'b') {
      if (isNight()) eveningSheet();
      else say('Đến giờ ngủ, mình sẽ nhắc ' + S.name + ' khép lại ngày nha 🌙', 3000);
    }
    return;
  }
  if (t.dataset.n2t) {
    const n = S.notes.find(x => x.id === t.dataset.n2t);
    if (!n) return;
    S.tasks.push({
      id: uid(),
      title: n.t.slice(0, 140),
      group: S.taskGroup,
      done: false,
      doneAt: null,
      createdAt: new Date().toISOString(),
      due: null,
      dueTime: '',
      link: '',
      note: n.t.length > 140 ? n.t : '',
      subs: []
    });
    S.notes = S.notes.filter(x => x.id !== n.id);
    render();
    if ($('#sheetbg').classList.contains('on')) notesAllSheet();
    say('Đã chuyển thành việc trong ' + gInfo(S.taskGroup)[2] + ' 📋', 3000);
    return;
  }
  if (t.dataset.ndel) {
    if (!t.dataset.sure) {
      t.dataset.sure = '1';
      t.textContent = 'Xóa?';
      return;
    }
    S.notes = S.notes.filter(x => x.id !== t.dataset.ndel);
    render();
    if ($('#sheetbg').classList.contains('on')) notesAllSheet();
    return;
  }
  if (t.dataset.wday) {
    waterDaySheet(t.dataset.wday);
    return;
  }
  if (t.dataset.wdc) {
    const k = t.dataset.k;
    if (k > dk(new Date())) return;
    const d =
      S.days[k] ||
      (k === dk(new Date())
        ? today()
        : (S.days[k] = {
            top3: [
              { t: '', d: false },
              { t: '', d: false },
              { t: '', d: false }
            ],
            water: 0,
            candies: [],
            checkin: null,
            evening: null
          }));
    if (!d.waterGoal && k !== dk(new Date())) {
      d.waterGoal = S.water.cups;
      d.waterMl = S.water.ml;
    }
    d.water = Math.max(0, Math.min(40, (d.water || 0) + +t.dataset.wdc));
    const w = dayWater(k);
    $('#wdn').textContent = w.n + ' ly';
    $('#wdml').textContent = '= ' + fmtL(w.n * w.ml);
    render();
    return;
  }
  if (t.dataset.spgo) {
    tab = 'set';
    setPage = t.dataset.spgo;
    render();
    scrollTo({ top: 0 });
    return;
  }
  if (t.dataset.wc) {
    S.water.cups = Math.max(3, Math.min(20, S.water.cups + +t.dataset.wc));
    render();
    return;
  }
  if (t.dataset.wml) {
    S.water.ml = +t.dataset.wml;
    render();
    return;
  }
  if (t.dataset.wact) {
    S.water.activity = t.dataset.wact;
    render();
    return;
  }
  if (t.dataset.hair) {
    S.hair = t.dataset.hair;
    render();
    return;
  }
  if (t.dataset.hc) {
    S.hairColor = t.dataset.hc;
    render();
    return;
  }
  if (t.dataset.fav) {
    S.fav = t.dataset.fav;
    render();
    say('Bộ "' + OUTFITS[S.fav].n + '" xinh quá đi! 💕');
    return;
  }
  if (t.dataset.nw) {
    S.nightWear = t.dataset.nw;
    render();
    say('Tối nay mặc ' + OUTFITS[S.nightWear].n + ' nha 🌙');
    return;
  }
  if (t.dataset.wt) {
    wtab = t.dataset.wt;
    render();
    return;
  }
  if (t.dataset.look) {
    const k = t.dataset.look;
    let v = t.dataset.lv;
    if (v === 'true') v = true;
    else if (v === 'false') v = false;
    if (k === 'seasonWear') S.seasonWear = v;
    else S.look[k] = v;
    render();
    return;
  }
  if (t.dataset.swap) {
    S.autoSwap = !S.autoSwap;
    render();
    return;
  }
  if (t.dataset.theme) {
    S.theme = t.dataset.theme;
    render();
    const se = season();
    say(
      se === 'xmas'
        ? 'Giáng sinh tới rồi! 🎄 Mình đội mũ Noel nè'
        : se === 'ny'
          ? 'Năm mới rồi! 🎆 Mình đội mũ tiệc nè'
          : se === 'tet'
            ? 'Tết đến rồi! 🧧 Mình mặc áo dài đỏ nè'
            : 'Giao diện bình thường nha 🌷'
    );
    return;
  }
  if (t.dataset.snd) {
    S.sound = t.dataset.snd === '1';
    render();
    if (S.sound) gulp();
    return;
  }
  if (t.dataset.act) {
    startAct(t.dataset.act);
    return;
  }
  if (t.dataset.roam) {
    S.roam = t.dataset.roam === '1';
    render();
    wander();
    return;
  }
  if (t.dataset.snap) {
    const key = t.dataset.snap;
    const sn = await CozyDB.getSnapshot(key);
    if (!sn) return;
    openSheet(
      `<h2>🕰️ Quay lại bản chụp?</h2><p class="muted">Dữ liệu sẽ trở về như lúc <b>${fmtDate(sn.createdAt)}</b> (${Object.keys(sn.state.days || {}).length} ngày, ${(sn.state.sleeps || []).length} đêm ngủ). Dữ liệu hiện tại được chụp lại trước.</p><div class="row" style="margin-top:12px"><button class="btn" data-a="doSnap" data-k="${esc(key)}">Quay lại</button><button class="btn ghost" data-a="closeSheet">Hủy</button></div>`
    );
    return;
  }
  if (t.dataset.topen) {
    taskSheet(t.dataset.topen);
    return;
  }
  if (t.dataset.tstar) {
    toggleStar(t.dataset.tstar);
    render();
    if (t.dataset.insheet) taskSheet(t.dataset.tstar);
    return;
  }
  if (t.dataset.tf) {
    tfilter = t.dataset.tf;
    if (tfilter !== 'all') S.taskGroup = tfilter;
    render();
    return;
  }
  if (t.dataset.tg) {
    S.taskGroup = t.dataset.tg;
    render();
    $('#tnew') && $('#tnew').focus();
    return;
  }
  if (t.dataset.tsg) {
    const tk = taskById(editId);
    if (!tk) return;
    tk.group = t.dataset.tsg;
    t.parentNode.querySelectorAll('.chip').forEach(b => b.setAttribute('aria-pressed', b === t));
    render();
    return;
  }
  if (t.dataset.tquick) {
    const tk = taskById(editId);
    if (!tk) return;
    const q = t.dataset.tquick;
    if (q === 'x') {
      tk.due = null;
      tk.dueTime = '';
    } else {
      const x = new Date();
      x.setDate(x.getDate() + +q);
      tk.due = dk(x);
    }
    $('#tDue').value = tk.due || '';
    $('#tTime').value = tk.dueTime || '';
    bellChanged(tk);
    tk.nudge = {};
    refreshRemind();
    render();
    return;
  }
  if (t.dataset.tlv) {
    const tk = taskById(editId);
    if (!tk) return;
    if (lvl(tk) !== t.dataset.tlv) {
      tk.remind = t.dataset.tlv;
      bellChanged(tk);
      tk.nudge = {};
    }
    refreshRemind();
    render();
    return;
  }
  if (t.dataset.tlead !== undefined) {
    const tk = taskById(editId);
    if (!tk) return;
    if ((tk.lead || 0) !== +t.dataset.tlead) {
      tk.lead = +t.dataset.tlead;
      bellChanged(tk);
    }
    refreshRemind();
    render();
    return;
  }
  if (t.dataset.bell) {
    bellAction(t.dataset.bell);
    return;
  }
  if (t.dataset.nudge) {
    nudgeAction(t.dataset.nudge);
    return;
  }
  if (t.dataset.rdef) {
    S.remindDefault.task = t.dataset.rdef;
    render();
    return;
  }
  if (t.dataset.rbed) {
    S.remindDefault.bed = t.dataset.rbed;
    render();
    return;
  }
  if (t.dataset.htab) {
    htab = t.dataset.htab;
    render();
    return;
  }
  if (t.dataset.gday !== undefined) {
    const d = +t.dataset.gday,
      g = S.gym;
    g.days = g.days.includes(d) ? g.days.filter(x => x !== d) : g.days.concat(d);
    gymBellChanged();
    render();
    return;
  }
  if (t.dataset.ggoal) {
    S.gym.goal = t.dataset.ggoal;
    render();
    return;
  }
  if (t.dataset.geq) {
    S.gym.equip = t.dataset.geq;
    render();
    return;
  }
  if (t.dataset.grest) {
    S.gym.rest = +t.dataset.grest;
    render();
    return;
  }
  if (t.dataset.grem) {
    if (S.gym.remind !== t.dataset.grem) {
      S.gym.remind = t.dataset.grem;
      gymBellChanged();
    }
    render();
    return;
  }
  if (t.dataset.gbell) {
    const k = t.dataset.gbell,
      g = S.gym;
    if (k === 'done') {
      g.bell = true;
      g.oldBell = false;
    } else if (k === 'unset') g.bell = false;
    else if (g.remind === 'cal') {
      deliverIcs('cozy-lich-tap.ics', gymIcs());
      g.bell = true;
      g.oldBell = false;
      save();
      openSheet(
        `<h2>📅 Thêm lịch tập vào Lịch</h2><p class="muted">iPhone sẽ hiện sự kiện "<b>Giờ tập – Cozy Life</b>" lặp lại mỗi tuần. Bấm <b>Thêm vào Lịch</b> là xong, Lịch sẽ báo trước giờ tập 30 phút.</p><p class="muted">Không thấy gì hiện ra? Bấm nút dưới, chọn <b>Lưu vào Tệp</b> rồi mở file trong app Tệp.</p><div class="row" style="margin-top:12px"><button class="btn" data-a="closeSheet">Xong</button><button class="btn ghost" data-a="shareIcs">📤 Gửi file lịch</button></div>`
      );
      render();
      return;
    } else {
      const days = WDORDER.filter(d => g.days.includes(d))
        .map(d => WD[d])
        .join(', ');
      openSheet(
        `<h2>⏰ Đặt báo thức lịch tập</h2><p>Mở app <b>Đồng hồ</b> → <b>Báo thức</b> → <b>＋</b>, đặt lúc <b style="font-size:20px">${gymBellAt()}</b>, mục <b>Lặp lại</b> chọn <b>${days}</b>, nhãn "Đi tập 💪".</p><div class="row" style="margin-top:12px"><a class="btn ghost" href="clock-alarm://">🕰️ Mở app Đồng hồ</a><button class="btn" data-a="gymAlarmDone">👌 Tôi đặt rồi</button></div>`
      );
      return;
    }
    render();
    return;
  }
  if (t.dataset.exinfo) {
    exInfo(t.dataset.exinfo);
    return;
  }
  if (t.dataset.expick) {
    const w = activeWo(),
      id = t.dataset.expick;
    if (!w) {
      exInfo(id);
      return;
    }
    if (w.items.some(it => it.ex === id)) {
      say('Bài này đã có trong buổi tập rồi nè', 2500);
      return;
    }
    {
      const e = exById(id),
        prev = lastSetsOf(id),
        goal = GOALS.find(x => x[0] === S.gym.goal) || GOALS[0];
      w.items.push({
        ex: id,
        target: e.g === 'stretch' ? '30 giây' : goal[2],
        sets: Array.from({ length: e.g === 'stretch' ? 1 : 3 }, (_, i) => {
          const p = prev && prev[Math.min(i, prev.length - 1)];
          return { r: p ? p.r : e.g === 'stretch' ? 30 : parseInt(goal[2]), kg: p ? p.kg : '', f: '', done: false };
        })
      });
    }
    closeSheet();
    render();
    say('Đã thêm ' + exById(id).n + ' 💪', 2500);
    return;
  }
  if (t.dataset.exdel) {
    const id = t.dataset.exdel;
    if (!t.dataset.sure) {
      t.dataset.sure = '1';
      t.textContent = 'Bấm lần nữa để xóa';
      return;
    }
    S.customEx = S.customEx.filter(e => e.id !== id);
    closeSheet();
    render();
    return;
  }
  if (t.dataset.libg) {
    lib.g = t.dataset.libg;
    t.parentNode.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b === t));
    $('#libList').innerHTML = libListHtml();
    return;
  }
  if (t.dataset.wodel !== undefined) {
    const w = activeWo();
    if (!w) return;
    w.items.splice(+t.dataset.wodel, 1);
    render();
    return;
  }
  if (t.dataset.woadd !== undefined) {
    const w = activeWo();
    if (!w) return;
    const it = w.items[+t.dataset.woadd],
      l = it.sets[it.sets.length - 1] || { r: 10, kg: '' };
    it.sets.push({ r: l.r, kg: l.kg, f: '', done: false });
    render();
    return;
  }
  if (t.dataset.wf) {
    const w = activeWo();
    if (!w) return;
    const [i, j, k] = t.dataset.wf.split(':'),
      st = w.items[+i].sets[+j];
    st.f = st.f === k ? '' : k;
    t.parentNode.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b === t && st.f === k));
    save();
    return;
  }
  if (t.dataset.wd) {
    const w = activeWo();
    if (!w) return;
    const [i, j] = t.dataset.wd.split(':').map(Number),
      st = w.items[i].sets[j];
    st.done = !st.done;
    if (st.done) {
      const e = exById(w.items[i].ex) || {};
      if (e.g !== 'stretch') {
        restEnd = Date.now() + S.gym.rest * 1000;
      }
      const all = w.items.every(it => it.sets.every(s => s.done));
      say(
        all
          ? 'Xong hết các set rồi! Bấm Hoàn thành nhé 🎉'
          : ['Tốt lắm! ✅', 'Đẹp! Nghỉ chút rồi tiếp nha', 'Mạnh mẽ quá 💪'][Math.floor(Math.random() * 3)],
        2500
      );
    }
    render();
    return;
  }
  if (t.dataset.wohist) {
    woHistSheet(t.dataset.wohist);
    return;
  }
  if (t.dataset.wohdel) {
    if (!t.dataset.sure) {
      t.dataset.sure = '1';
      t.textContent = 'Bấm lần nữa để xóa';
      return;
    }
    S.workouts = S.workouts.filter(w => w.id !== t.dataset.wohdel);
    closeSheet();
    render();
    return;
  }
  if (t.dataset.gpick) {
    t.setAttribute('aria-pressed', t.getAttribute('aria-pressed') !== 'true');
    return;
  }
  if (t.dataset.subdel) {
    const tk = taskById(editId);
    if (!tk) return;
    tk.subs = (tk.subs || []).filter(x => x.id !== t.dataset.subdel);
    $('#subs').innerHTML = subsHtml(tk);
    render();
    return;
  }
  if (t.dataset.plen) {
    S.pomoLen = +t.dataset.plen;
    const p = pomoState();
    if (!p.endAt && p.mode === 'focus') p.left = pomoLen('focus');
    render();
    return;
  }
  if (t.dataset.psnd) {
    S.pomoSound = t.dataset.psnd;
    if (focusing()) startNoise();
    render();
    return;
  }
  if (t.dataset.pomotask) {
    pomoState().taskId = t.dataset.pomotask;
    closeSheet();
    editId = null;
    tab = 'tasks';
    render();
    const pc = document.querySelector('.pomo');
    pc && pc.scrollIntoView({ behavior: 'smooth', block: 'center' });
    say('Chọn xong rồi, bấm Bắt đầu nhé 🍅', 3000);
    return;
  }
  const a = t.dataset.a;
  if (!a) return;
  if (a === 'hReset') {
    HDEF().forEach(x => {
      if (!S.habits.some(h => h.id === x.id)) S.habits.push(x);
    });
    render();
    return;
  }
  if (a === 'schedAdd') {
    schedSheet();
    return;
  }
  if (a === 'schedSave') {
    const ti = ($('#sTitle').value || '').trim(),
      tm = $('#sT').value;
    if (!ti || !tm) {
      (!ti ? $('#sTitle') : $('#sT')).focus();
      return;
    }
    if (t.dataset.k) {
      const [k, id] = t.dataset.k.split(':');
      if (k === 'r') S.routine = S.routine.filter(r => r.id !== id);
      else today().sched = (today().sched || []).filter(x => x.id !== id);
    }
    if (F.rep) S.routine.push({ id: uid(), t: tm, title: ti });
    else (today().sched = today().sched || []).push({ id: uid(), t: tm, title: ti, done: false });
    closeSheet();
    render();
    say('Đã thêm vào thời gian biểu 🕒', 2500);
    return;
  }
  if (a === 'schedDel') {
    const [k, id] = t.dataset.k.split(':');
    if (!t.dataset.sure) {
      t.dataset.sure = '1';
      t.textContent = k === 'r' ? 'Xóa khỏi mọi ngày?' : 'Bấm lần nữa để xóa';
      return;
    }
    if (k === 'r') S.routine = S.routine.filter(r => r.id !== id);
    else today().sched = (today().sched || []).filter(x => x.id !== id);
    closeSheet();
    render();
    return;
  }
  if (a === 'notesAll') {
    notesAllSheet();
    return;
  }
  if (a === 'goWater') {
    tab = 'health';
    htab = 'water';
    render();
    scrollTo({ top: 0 });
    return;
  }
  if (a === 'waterPlus') {
    today().water++;
    render();
    say('Thêm 1 ly 💧 (' + today().water + ' ly hôm nay)');
    return;
  }
  if (a === 'wUse') {
    const r = waterRec();
    if (r) {
      S.water.cups = Math.min(20, r.cups);
      render();
      say('Mục tiêu mới: ' + S.water.cups + ' ly mỗi ngày 💧');
    }
    return;
  }
  if (a === 'wAuto') {
    S.water.auto = !S.water.auto;
    render();
    return;
  }
  if (a === 'goGym') {
    tab = 'health';
    htab = 'gym';
    render();
    scrollTo({ top: 0 });
  } else if (a === 'woStart') startWorkout(suggest());
  else if (a === 'woPickGroups') groupPickSheet();
  else if (a === 'woStartPicked') {
    const gs = [...document.querySelectorAll('[data-gpick][aria-pressed=true]')].map(b => b.dataset.gpick);
    if (!gs.length) {
      say('Chọn ít nhất 1 nhóm cơ nhé');
      return;
    }
    closeSheet();
    startWorkout(suggest(), gs.slice(0, 4));
  } else if (a === 'woFinish') finishWorkout();
  else if (a === 'woCancel') {
    if (!t.dataset.sure) {
      t.dataset.sure = '1';
      t.textContent = 'Bấm lần nữa để hủy';
      return;
    }
    S.workouts = S.workouts.filter(w => w.end);
    restEnd = 0;
    render();
    wander();
  } else if (a === 'woCancelOk') {
    S.workouts = S.workouts.filter(w => w.end);
    restEnd = 0;
    closeSheet();
    render();
    wander();
  } else if (a === 'restPlus') {
    if (restEnd) restEnd += 30000;
    restTick();
  } else if (a === 'restSkip') {
    restEnd = 0;
    render();
  } else if (a === 'exLib') libSheet(false);
  else if (a === 'exPick') libSheet(true);
  else if (a === 'libMine') {
    lib.mine = !lib.mine;
    t.setAttribute('aria-pressed', lib.mine);
    $('#libList').innerHTML = libListHtml();
  } else if (a === 'exNew') exNewSheet();
  else if (a === 'exSave') {
    const n = ($('#exN').value || '').trim();
    if (!n) {
      $('#exN').focus();
      return;
    }
    (S.customEx = S.customEx || []).push({
      id: 'c_' + uid(),
      n,
      en: '',
      g: F.g,
      sec: [],
      eq: F.eq,
      lv: '',
      d: '',
      tip: ($('#exTip').value || '').trim(),
      custom: true
    });
    closeSheet();
    render();
    say('Đã thêm bài "' + n + '" vào thư viện 📚');
  } else if (a === 'gymAlarmDone') {
    S.gym.bell = true;
    S.gym.oldBell = false;
    closeSheet();
    render();
  } else if (a === 'backTask') {
    taskSheet(editId);
    render();
  } else if (a === 'shareIcs') shareIcs();
  else if (a === 'alarmDone') {
    const tk = taskById(editId);
    if (tk) {
      tk.bell = true;
      tk.oldBell = false;
      tk.bellAsk = null;
    }
    taskSheet(editId);
    render();
    say('Đã đánh dấu 🔔');
  } else if (a === 'bedIcs') {
    deliverIcs('cozy-gio-di-ngu.ics', bedIcs());
    S.bedBell = true;
    render();
    say('Bấm "Thêm vào Lịch" là tối nào iPhone cũng nhắc nha 🌙', 5000);
  } else if (a === 'pomoGo') pomoGo();
  else if (a === 'pomoReset') pomoStop();
  else if (a === 'pomoSkip') pomoStop(pomoState().mode === 'focus' ? 'short' : 'focus');
  else if (a === 'pomoUntask') {
    pomoState().taskId = null;
    render();
  } else if (a === 'tSave') {
    closeSheet();
    editId = null;
  } else if (a === 'tDel') {
    if (!t.dataset.sure) {
      t.dataset.sure = '1';
      t.textContent = 'Bấm lần nữa để xóa hẳn';
      return;
    }
    delTask(editId);
    closeSheet();
    editId = null;
    render();
    say('Đã xóa việc');
  } else if (a === 'clearDone') {
    const L = S.tasks.filter(x => x.done && (tfilter === 'all' || x.group === tfilter));
    if (!t.dataset.sure) {
      t.dataset.sure = '1';
      t.textContent = 'Bấm lần nữa để dọn ' + L.length + ' việc';
      return;
    }
    L.forEach(x => delTask(x.id));
    render();
    say('Dọn sạch sẽ rồi 🧹');
  } else if (a === 'checkin') checkinSheet();
  else if (a === 'saveCheckin') saveCheckin();
  else if (a === 'evening') eveningSheet();
  else if (a === 'goSleep') goSleep();
  else if (a === 'closeSheet') {
    closeSheet();
    pendingImport = null;
    editId = null;
  } else if (a === 'export') doExport(t);
  else if (a === 'import') {
    $('#impf').value = '';
    $('#impf').click();
  } else if (a === 'impw') {
    const pw = $('#impw').value;
    if (!pw || !pendingImport || !pendingImport.text) return;
    t.disabled = true;
    await readImport(pendingImport.text, pw);
  } else if (a === 'doImport') {
    if (!pendingImport || !pendingImport.state) return;
    t.disabled = true;
    await replaceState(pendingImport.state, 'Trước khi khôi phục từ file');
    pendingImport = null;
    closeSheet();
    tab = 'today';
    render();
    wander();
    say('Khôi phục xong rồi! Chào mừng ' + S.name + ' trở lại 💛', 5000);
  } else if (a === 'doSnap') {
    t.disabled = true;
    const sn = await CozyDB.getSnapshot(t.dataset.k);
    if (sn) {
      await replaceState(sn.state, 'Trước khi quay lại bản chụp');
      closeSheet();
      render();
      say('Đã quay lại bản chụp 🕰️');
    }
  } else if (a === 'install') {
    if (installEvt) {
      installEvt.prompt();
      const r = await installEvt.userChoice;
      installEvt = null;
      render();
      if (r.outcome === 'accepted') say('Yay, Cozy Life đã ở trên màn hình chính! 📲');
    }
  } else if (a === 'hideInstall') {
    S.hideInstall = true;
    render();
  } else if (a === 'checkUpd') {
    if (!window.cozyCheckUpdate) {
      say('Trình duyệt này không hỗ trợ tự cập nhật');
      return;
    }
    t.disabled = true;
    t.textContent = 'Đang kiểm tra…';
    try {
      const f = await window.cozyCheckUpdate();
      say(f ? 'Có bản mới! Đang tải về, app sẽ tự mở lại ✨' : 'Bạn đang dùng bản mới nhất rồi 🌷', 4000);
    } catch (e) {
      say('Chưa kiểm tra được, có thể đang không có mạng');
    }
    t.disabled = false;
    t.textContent = '🔄 Kiểm tra bản mới';
  } else if (a === 'demoNight') {
    demoNight = !demoNight;
    render();
    wander();
    say(demoNight ? 'Gần đến giờ ngủ rồi, mình thay pijama nè 🌙' : 'Chào buổi sáng lại nè ☀️');
  } else if (a === 'clearSample') {
    S.sleeps = S.sleeps.filter(x => !x.sample);
    S.sample = false;
    render();
  } else if (a === 'reset') {
    const q = $('#resetQ');
    if (q.classList.contains('hide')) {
      q.classList.remove('hide');
      return;
    }
    await replaceState(DEF(), 'Trước khi xóa hết');
    tab = 'today';
    render();
    say('Làm lại từ đầu nha!');
  }
});
$('#impf').addEventListener('change', async e => {
  const f = e.target.files && e.target.files[0];
  if (!f) return;
  if (f.size > 50 * 1024 * 1024) {
    say('File lớn quá, không giống file sao lưu 🤔');
    return;
  }
  readImport(await f.text());
});
document.addEventListener('change', e => {
  const t = e.target;
  if (t.dataset.t !== undefined) {
    const d = today(),
      x = d.top3[+t.dataset.t],
      tk = x.tid && taskById(x.tid);
    if (tk) setDone(tk, t.checked);
    else x.d = t.checked;
    render();
    const n = d.top3.map(top3Slot).filter(x => x.d && x.t).length;
    if (n === 3 && t.checked) celebrate(2);
    say(
      n === 3
        ? 'Xong cả 3 việc! Ăn mừng thôi 🎆'
        : t.checked
          ? 'Tuyệt vời! Xong một việc rồi ✅'
          : 'Không sao, làm lại sau nhé'
    );
    return;
  }
  if (t.dataset.tt !== undefined) {
    today().top3[+t.dataset.tt].t = t.value.trim();
    save();
    return;
  }
  if (t.dataset.tdone) {
    const tk = taskById(t.dataset.tdone);
    if (!tk) return;
    setDone(tk, t.checked);
    render();
    if (editId) taskSheet(editId);
    say(
      t.checked
        ? ['Xong rồi! Giỏi quá ✅', 'Gạch thêm một việc nè 🎉', 'Tuyệt vời, ' + S.name + '! ✨'][
            Math.floor(Math.random() * 3)
          ]
        : 'Mở lại việc này nha'
    );
    return;
  }
  if (editId && ['tTitle', 'tDue', 'tTime', 'tLink', 'tNote'].includes(t.id)) {
    const tk = taskById(editId);
    if (!tk) return;
    if (t.id === 'tTitle') {
      const v = t.value.trim();
      if (v) tk.title = v;
      else t.value = tk.title;
    }
    if (t.id === 'tDue') tk.due = t.value || null;
    if (t.id === 'tTime') tk.dueTime = t.value || '';
    if (t.id === 'tNote') tk.note = t.value;
    if (t.id === 'tDue' || t.id === 'tTime') {
      bellChanged(tk);
      tk.nudge = {};
      refreshRemind();
    }
    if (t.id === 'tLink') {
      tk.link = t.value.trim();
      render();
      taskSheet(editId);
      return;
    }
    render();
    return;
  }
  if (editId && (t.dataset.sub || t.dataset.subt)) {
    const tk = taskById(editId),
      sb = tk && (tk.subs || []).find(x => x.id === (t.dataset.sub || t.dataset.subt));
    if (!sb) return;
    if (t.dataset.sub) sb.d = t.checked;
    else {
      const v = t.value.trim();
      if (v) sb.t = v;
      else t.value = sb.t;
    }
    $('#subs').innerHTML = subsHtml(tk);
    render();
    return;
  }
  if (t.id === 'nm') {
    S.name = t.value.trim() || 'bạn';
    render();
    return;
  }
  if (t.dataset.sdone) {
    const [k, id] = t.dataset.sdone.split(':'),
      d = today();
    if (k === 'r') {
      d.rdone = d.rdone || {};
      if (t.checked) d.rdone[id] = true;
      else delete d.rdone[id];
    } else if (k === 's') {
      const x = (d.sched || []).find(z => z.id === id);
      if (x) x.done = t.checked;
    } else if (k === 't') {
      const tk = taskById(id);
      if (tk) setDone(tk, t.checked);
    } else {
      t.checked = !t.checked;
      if (k === 'g') {
        tab = 'health';
        htab = 'gym';
        render();
        scrollTo({ top: 0 });
      } else if (isNight()) eveningSheet();
      else say('Đến giờ ngủ hãy bấm "Đi ngủ" nhé 🌙', 3000);
      return;
    }
    render();
    if (t.checked)
      say(['Xong! ✅', 'Đúng giờ ghê 🕒', 'Tuyệt vời ' + S.name + ' ✨'][Math.floor(Math.random() * 3)], 2500);
    return;
  }
  if (t.dataset.hname) {
    const h = S.habits.find(x => x.id === t.dataset.hname),
      v = t.value.trim();
    if (h) {
      if (v) h.n = v;
      else t.value = h.n;
    }
    save();
    return;
  }
  if (t.id === 'wkg') {
    S.water.weight = t.value;
    render();
    return;
  }
  if (t.id === 'gTime' && t.value) {
    S.gym.time = t.value;
    gymBellChanged();
    render();
    return;
  }
  if (t.dataset.wr || t.dataset.wk) {
    const w = activeWo();
    if (!w) return;
    const [i, j] = (t.dataset.wr || t.dataset.wk).split(':').map(Number),
      st = w.items[i] && w.items[i].sets[j];
    if (!st) return;
    const v = t.value === '' ? '' : Math.max(0, +t.value);
    if (t.dataset.wr) st.r = v;
    else st.kg = v;
    save();
    return;
  }
  if (t.id === 'bt' && t.value) {
    S.bedTarget = t.value;
    if (S.remindDefault.bed === 'cal' && S.bedBell) {
      S.bedBell = false;
      say('Nhớ xóa sự kiện Giờ đi ngủ cũ trong Lịch rồi thêm lại nhé', 5000);
    }
    render();
  }
});
document.addEventListener('input', e => {
  if (e.target.id === 'libQ') {
    lib.q = e.target.value;
    $('#libList').innerHTML = libListHtml();
  }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.target.id === 'impw') {
    e.preventDefault();
    const b = document.querySelector('[data-a=impw]');
    b && b.click();
  }
});
document.addEventListener('submit', e => {
  if (e.target.id === 'habitF') {
    e.preventDefault();
    const v = $('#hNew').value.trim();
    if (!v) return;
    S.habits.push({ id: 'h_' + uid(), n: v, i: F.hicon || '📖' });
    $('#hNew').value = '';
    render();
    say('Thêm thói quen "' + v + '" 🌱', 2500);
    return;
  }
  if (e.target.id === 'noteF') {
    e.preventDefault();
    const v = $('#nNew').value.trim();
    if (!v) return;
    S.notes.unshift({ id: uid(), t: v, at: new Date().toISOString() });
    $('#nNew').value = '';
    render();
    $('#nNew').focus();
    say('Ghi lại rồi nè 📝', 2000);
    return;
  }
  if (e.target.id === 'taskF') {
    e.preventDefault();
    const v = $('#tnew').value.trim();
    if (!v) return;
    S.tasks.push({
      id: uid(),
      title: v,
      group: S.taskGroup,
      done: false,
      doneAt: null,
      createdAt: new Date().toISOString(),
      due: null,
      dueTime: '',
      link: '',
      note: '',
      subs: []
    });
    $('#tnew').value = '';
    render();
    $('#tnew').focus();
    say('Đã thêm vào ' + gInfo(S.taskGroup)[2] + ' 📋', 2500);
    return;
  }
  if (e.target.id === 'subF') {
    e.preventDefault();
    const tk = taskById(editId),
      v = $('#subNew').value.trim();
    if (!tk || !v) return;
    (tk.subs = tk.subs || []).push({ id: uid(), t: v, d: false });
    $('#subNew').value = '';
    $('#subs').innerHTML = subsHtml(tk);
    render();
    $('#subNew').focus();
    return;
  }
  if (e.target.id !== 'candyF') return;
  e.preventDefault();
  const v = $('#candy').value.trim();
  if (!v || candyBusy) return;
  candyDrop(v);
});
$('#sheetbg').addEventListener('click', e => {
  if (e.target.id === 'sheetbg') {
    closeSheet();
    pendingImport = null;
    editId = null;
  }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeSheet();
    editId = null;
  }
});
