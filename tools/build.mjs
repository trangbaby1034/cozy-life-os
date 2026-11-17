// Ghép src/*.js thành app.js (không cần cài gì thêm): node tools/build.mjs
// Các file trong src/ dùng chung một phạm vi, chạy theo thứ tự tên file.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
const dir = new URL('../src/', import.meta.url);
const files = readdirSync(dir).filter(f => f.endsWith('.js')).sort();
const body = files.map(f => `/* ===== src/${f} ===== */\n` + readFileSync(new URL(f, dir), 'utf8')).join('\n');
const out = `/* Cozy Life OS – app chính.\n   TỆP NÀY DO tools/build.mjs TẠO RA. Đừng sửa trực tiếp: hãy sửa trong src/ rồi chạy  node tools/build.mjs */\n(async () => {\n${body}\n})();\n`;
writeFileSync(new URL('../app.js', import.meta.url), out);
console.log('app.js ←', files.length, 'tệp,', out.length, 'ký tự');
