# Cozy Life OS 🌷

Trợ lý cuộc sống nhỏ xinh cùng Bé Chibi — app cá nhân, chạy ngay trên trình duyệt và cài được lên màn hình chính điện thoại (PWA).

**Mở app:** https://trangbaby1034.github.io/cozy-life-os/

## Cài lên iPhone
1. Mở link trên bằng **Safari**.
2. Bấm nút **Chia sẻ** (ô vuông có mũi tên lên) → **Thêm vào MH chính** → **Thêm**.
3. Từ giờ mở Cozy Life từ biểu tượng trên màn hình chính. Không có mạng vẫn dùng được.

## Dữ liệu nằm ở đâu?
- Mọi thứ lưu **ngay trên máy** (IndexedDB của trình duyệt), không gửi lên mạng, không có tài khoản.
- Mỗi điện thoại/trình duyệt có kho dữ liệu riêng. Muốn chuyển máy: **Cài đặt → Dữ liệu & sao lưu → Sao lưu ra file**, rồi **Khôi phục từ file** ở máy mới.
- File sao lưu có thể đặt mật khẩu (mã hóa AES-256). Quên mật khẩu là không mở được file.
- App tự chụp lại dữ liệu mỗi ngày (giữ 7 ngày) và trước mỗi lần khôi phục/xóa — xem ở mục **Bản chụp tự động**.
- App nhắc sao lưu nếu quá 7 ngày chưa làm.

## Cấu trúc (dành cho người sửa code)
| Đường dẫn | Vai trò |
|---|---|
| `index.html` | Khung trang + toàn bộ CSS |
| `src/*.js` | **Mã nguồn app**, chia theo phần (core, Chibi, Việc, Nhắc nhở, Pomodoro, Gym, Thói quen, Cài đặt…) |
| `app.js` | Tệp ghép từ `src/` – **không sửa trực tiếp** |
| `tools/build.mjs` | Ghép `src/` → `app.js`: `node tools/build.mjs` |
| `tests/smoke.py` | Bộ kiểm thử tự động (Chrome + Playwright): `python3 tests/smoke.py` |
| `db.js` | Lưu trữ IndexedDB (settings / days / sleeps / tasks / workouts / people / appts / photos / snapshots) |
| `backup.js` | Tạo và đọc file sao lưu (.json, tùy chọn mã hóa) |
| `exercises.js` | Thư viện 71 bài tập tiếng Việt (dữ liệu gốc free-exercise-db, Unlicense) |
| `img/ex/` | Hình tư thế 46 bài (Everkinetic, CC BY-SA 4.0 – chỉ nén dung lượng) |
| `vendor/` | canvas-confetti (ISC), body-highlighter (MIT) – đã kiểm tra không gọi mạng |
| `sw.js` | Service worker: chạy offline, tự kích hoạt bản mới |
| `manifest.webmanifest`, `icons/`, `fonts/` | Thông tin cài đặt PWA, biểu tượng, phông chữ (SIL OFL) |

**Quy trình sửa:** sửa trong `src/` → `node tools/build.mjs` → `python3 tests/smoke.py` → tăng `VERSION` trong `sw.js` và `APPVER` trong `src/11-render-sheets-backup.js` → đẩy lên `main` và `gh-pages`:
`git push origin main && git push origin main:gh-pages`.
