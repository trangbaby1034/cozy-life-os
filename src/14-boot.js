/* ---------- Offline & cập nhật bản mới ---------- */
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  const toast = $('#toast');
  let reloading = false;
  const showUpdate = w => {
    toast.textContent = '✨ Có bản Cozy Life mới. Chạm để cập nhật';
    toast.classList.remove('hide');
    toast.onclick = async () => {
      toast.textContent = 'Đang cập nhật…';
      await flush();
      w.postMessage('skipWaiting');
    };
  };
  const reloadNow = () => {
    if (reloading) return;
    reloading = true;
    flush().finally(() => location.reload());
  };
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    const ae = document.activeElement,
      busy = $('#sheetbg').classList.contains('on') || (ae && ['INPUT', 'TEXTAREA'].includes(ae.tagName)) || focusing();
    if (!busy || document.visibilityState === 'hidden') return reloadNow();
    toast.textContent = '✨ Bản Cozy Life mới đã sẵn sàng. Chạm để tải lại';
    toast.classList.remove('hide');
    toast.onclick = reloadNow;
    document.addEventListener(
      'visibilitychange',
      () => {
        if (document.visibilityState === 'hidden') reloadNow();
      },
      { once: true }
    );
  });
  window.cozyCheckUpdate = async () => {
    const r = await navigator.serviceWorker.getRegistration();
    if (!r) return false;
    await r.update();
    return !!(r.installing || r.waiting);
  };
  navigator.serviceWorker
    .register('sw.js')
    .then(reg => {
      const chk = () => {
        if (reg.waiting && navigator.serviceWorker.controller) showUpdate(reg.waiting);
      };
      const track = w => {
        if (w) w.addEventListener('statechange', chk);
      };
      chk();
      track(reg.installing);
      reg.addEventListener('updatefound', () => track(reg.installing));
      const upd = () =>
        reg
          .update()
          .then(chk)
          .catch(() => {});
      upd();
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') upd();
      });
    })
    .catch(e => console.warn('SW', e));
}
