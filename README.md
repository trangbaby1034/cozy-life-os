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
| File | Vai trò |
|---|---|
| `index.html` | Khung trang + toàn bộ CSS |
| `app.js` | Giao diện, Chibi, check-in, giấc ngủ, sao lưu |
| `db.js` | Lưu trữ IndexedDB (settings / days / sleeps / snapshots) |
| `backup.js` | Tạo và đọc file sao lưu (.json, tùy chọn mã hóa) |
| `sw.js` | Service worker: chạy offline |
| `manifest.webmanifest`, `icons/` | Thông tin cài đặt PWA |
| `fonts/` | Quicksand & Nunito tự lưu (giấy phép SIL OFL) |

Không cần build. **Mỗi lần sửa app:** tăng `VERSION` trong `sw.js` (và `APPVER` trong `app.js`) để điện thoại nhận bản mới — app sẽ hiện thông báo "Có bản Cozy Life mới".

Trang được phục vụ từ nhánh `gh-pages` (bản sao của `main`): `git push origin main && git push origin main:gh-pages`.
