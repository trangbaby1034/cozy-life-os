/* Cozy Life OS – file sao lưu
   Định dạng file (.json):
     { app:'cozy-life-os', format:1, exportedAt, data:{...toàn bộ dữ liệu...} }
   Nếu đặt mật khẩu: data được mã hóa AES-GCM 256, khóa sinh từ mật khẩu bằng PBKDF2-SHA256.
     { app:'cozy-life-os', format:1, exportedAt, encrypted:true, kdf:{...}, iv, data:'<base64>' }
   Khôi phục cũng nhận dữ liệu thô của bản thử (có days và sleeps). */
(function () {
  const APP = 'cozy-life-os', FORMAT = 1, ITER = 250000;
  const enc = new TextEncoder(), dec = new TextDecoder();
  const b64 = u8 => { let s = ''; u8.forEach(c => s += String.fromCharCode(c)); return btoa(s); };
  const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));

  async function keyFrom(pw, salt, iter) {
    const base = await crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: iter }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  }

  async function build(state, pw) {
    const out = { app: APP, format: FORMAT, exportedAt: new Date().toISOString() };
    if (!pw) { out.data = state; return out; }
    const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await keyFrom(pw, salt, ITER);
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(state)));
    return Object.assign(out, { encrypted: true, kdf: { name: 'PBKDF2', hash: 'SHA-256', iterations: ITER, salt: b64(salt) }, iv: b64(iv), data: b64(new Uint8Array(ct)) });
  }

  function err(code) { const e = new Error(code); e.code = code; return e; }

  function looksLikeState(s) { return s && typeof s === 'object' && s.days && typeof s.days === 'object' && !Array.isArray(s.days) && Array.isArray(s.sleeps || []); }

  /* Đọc file. Ném lỗi có code: 'invalid' | 'needpw' | 'badpw' | 'newer' */
  async function parse(text, pw) {
    let j; try { j = JSON.parse(text); } catch (e) { throw err('invalid'); }
    let state, exportedAt = null;
    if (j && j.app === APP) {
      if (j.format > FORMAT) throw err('newer');
      exportedAt = j.exportedAt || null;
      if (j.encrypted) {
        if (!pw) throw err('needpw');
        try {
          const key = await keyFrom(pw, unb64(j.kdf.salt), j.kdf.iterations || ITER);
          const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(j.iv) }, key, unb64(j.data));
          state = JSON.parse(dec.decode(pt));
        } catch (e) { throw err('badpw'); }
      } else state = j.data;
    } else state = j; // dữ liệu thô từ bản thử
    if (!looksLikeState(state)) throw err('invalid');
    if (!Array.isArray(state.sleeps)) state.sleeps = [];
    return { state, exportedAt, encrypted: !!(j && j.encrypted) };
  }

  function summary(state) {
    const days = Object.values(state.days || {});
    return { days: days.length, sleeps: (state.sleeps || []).filter(s => !s.sample).length, candies: days.reduce((a, d) => a + ((d && d.candies) || []).length, 0) };
  }

  self.CozyBackup = { build, parse, summary };
})();
