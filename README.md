# OurMam 🍱❤️ — Food Locket Cho Cặp Đôi & Bạn Bè

<p align="center">
  <img src="https://ui-avatars.com/api/?name=OurMam&background=FF6433&color=fff&size=180&bold=true&rounded=true" width="100" height="100" alt="OurMam Logo" style="border-radius: 50%;">
</p>

<p align="center">
  <b>Không gian ẩm thực đôi — Nơi từng bữa ăn trở thành lời yêu thương mỗi ngày!</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Version-1.0.0-orange?style=flat-square" alt="Version">
  <img src="https://img.shields.io/badge/Platform-PWA%20%7C%20iOS%20%7C%20Android-blue?style=flat-square" alt="Platform">
  <img src="https://img.shields.io/badge/Stack-Vanilla%20JS%20%7C%20TailwindCSS%20%7C%20Supabase-emerald?style=flat-square" alt="Stack">
  <img src="https://img.shields.io/badge/Realtime-WebSocket%20%3C50ms-rose?style=flat-square" alt="Realtime">
</p>

---

## 🌟 Giới Thiệu (About OurMam)

**OurMam** là ứng dụng chia sẻ khoảnh khắc ăn uống hàng ngày được lấy cảm hứng từ cơ chế **Locket Widget**, được thiết kế chuyên biệt cho các cặp đôi và bạn thân:
- Chụp ảnh bữa ăn tức thì và gửi thẳng lên bàn ăn / widget của người thương.
- Nhắc nhở ăn cơm đúng bữa, giữ lửa chuỗi ngày măm măm (**Streak**).
- Nhắn tin trò chuyện thời gian thực, đặt biệt danh ngộ nghĩnh và lưu giữ từng kỷ niệm ẩm thực qua lịch ảnh trực quan.

---

## ✨ Tính Năng Nổi Bật (Key Features)

### 📸 1. Camera Locket Bữa Ăn Siêu Tốc
- **Chụp ảnh trực tiếp**: Tích hợp điều khiển camera WebRTC mượt mà, hỗ trợ chuyển đổi camera trước/sau và bật/tắt flash.
- **Phân loại bữa ăn**: Chọn nhanh thẻ *Bữa Sáng 🥐*, *Bữa Trưa 🍱*, *Bữa Tối 🍲*, hoặc *Ăn Vặt 🧋*.
- **Nén ảnh thông minh Client-side**: Tự động nén ảnh qua Canvas chuẩn HD với dung lượng siêu nhẹ (<150KB), đăng tải tức thì ngay cả khi mạng 3G/4G yếu.

### 🍱 2. Locket Feed — Lướt Ảnh Phong Cách Widget
- Lướt xem ảnh món ăn của đối phương theo thứ tự thời gian.
- **Bộ lọc linh hoạt**: Lọc xem ảnh của *Tất cả*, *Người thương*, hoặc của *Chính mình*.
- **Tương tác ngọt ngào**: Thả tim ❤️ trực tiếp vào ảnh và gửi tin nhắn phản hồi nhanh chỉ với một chạm.
- Không calo ảo, không rating giả — mọi thông tin đều chân thực và gần gũi.

### 💬 3. Trò Chuyện Realtime & Đặt Biệt Danh (Instant Chat)
- **Giao diện thời gian thực**: Kết hợp Optimistic UI (hiển thị ngay 0ms) và Supabase Realtime WebSocket (<50ms).
- **Đặt biệt danh dễ thương**: Tự do đặt biệt danh riêng cho người trò chuyện (*💕 Em Bé*, *🐻 Gấu Béo*, *💖 Cục Cưng*, *👑 Nóc Nhà*, *🥑 Bạn Thân*).
- **Chuông nhắc ăn cơm 🔔**: Gửi thông báo nhắc người ấy không được bỏ bữa.

### 📅 4. Lịch Ăn Uống & Kỷ Niệm (Food Calendar)
- Lưới lịch tháng trực quan gắn ảnh đại diện cho từng ngày có bữa ăn.
- Xem lại lịch sử các bữa ăn trong ngày theo dòng thời gian.
- Đếm tổng số bữa ăn mà hai bạn đã cùng nhau sẻ chia.

### ⚙️ 5. Quản Lý Tài Khoản & Bảo Mật
- **Ghép đôi bảo mật**: Kết nối an toàn bằng **Mã Ghép Đôi cá nhân** (`MAM...`). Chỉ những người ghép đôi mới thấy được ảnh và tin nhắn của nhau.
- **Đổi tên hiển thị tiện lợi**: Popup modal riêng biệt, rộng rãi, thao tác dễ dàng trên mọi thiết bị.
- **Tùy chỉnh thông báo**: Cần gạt bật/tắt nhắc giờ ăn, lưu GPS quán ăn, và tự lưu ảnh về album.

---

## 📱 Cài Đặt Lên Điện Thoại (PWA & Widget)

### 📲 Cài đặt App PWA toàn màn hình (Không cần App Store)
1. Truy cập liên kết ứng dụng trên trình duyệt điện thoại (**Safari** trên iPhone hoặc **Chrome** trên Android).
2. Bấm nút **Chia sẻ (Share)** -> Chọn **"Thêm vào Màn hình chính" (Add to Home Screen)**.
3. Ứng dụng sẽ xuất hiện trên màn hình chính với icon OurMam riêng biệt, mở ra toàn màn hình (Standalone) không có thanh URL.

### 🖼️ Cài Widget màn hình chính iPhone (Scriptable)
1. Cài đặt ứng dụng miễn phí **Scriptable** từ App Store.
2. Mở Scriptable -> Bấm dấu **(+)** -> Dán mã nguồn trong [`widgets/ios/scriptable_widget.js`](file:///Users/baobungbu/OurMam/widgets/ios/scriptable_widget.js) -> Đặt tên `OurMam Widget`.
3. Ra màn hình chính iPhone -> Nhấn giữ màn hình -> Chọn **(+)** -> Thêm widget **Scriptable**.

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)

| Lớp (Layer) | Công nghệ / Thư viện |
| :--- | :--- |
| **Core** | HTML5 Semantic, Modern Vanilla JavaScript (ES Modules) |
| **Styling** | TailwindCSS + Material 3 Design Tokens (Màu Warm Peach & Hearth Honey) |
| **PWA** | Web App Manifest (`manifest.json`) + Service Worker (`sw.js`) |
| **Backend & BaaS** | Supabase (PostgreSQL, Row Level Security, Realtime WebSocket Channels) |
| **Camera & Media** | WebRTC MediaDevices API, HTML5 Canvas Image Compression |

---

## 📂 Cấu Trúc Thư Mục Dự Án (Project Structure)

```text
OurMam/
├── index.html                    # Single Page Application HTML shell
├── package.json                  # Cấu hình dự án, npm scripts (dev, test, check)
├── vercel.json                   # Cấu hình triển khai Vercel (Cache-Control headers)
├── manifest.json                 # Cấu hình PWA Progressive Web App
├── sw.js                         # PWA Service Worker
├── privacy.html                  # Chính sách bảo mật & quyền riêng tư
├── .editorconfig                 # Chuẩn hóa format code giữa các IDE
├── .gitignore                    # Bộ lọc git thông minh cho source & docs
├── AGENTS.md                     # Hướng dẫn quy chuẩn cho AI Coding Agents
├── README.md                     # Tài liệu tổng quan dự án
│
├── docs/                         # 📖 Tài liệu kiến trúc & đặc tả kỹ thuật
│   ├── architecture/             # Kiến trúc hệ thống & ERD
│   │   ├── ARCHITECTURE.md
│   │   └── ERD.md
│   ├── api/                      # Đặc tả API contracts
│   │   └── API_CONTRACT.md
│   └── setup/                    # Hướng dẫn thiết lập hệ thống
│       └── TASK1_SETUP.md
│
├── src/                          # 💻 Mã nguồn ứng dụng Frontend
│   ├── assets/                   # Tài nguyên đồ họa, hình ảnh tĩnh
│   │   └── login-bg.png
│   ├── components/               # Các View Controller & UI Components
│   │   ├── authView.js           # Màn hình đăng nhập / đăng ký
│   │   ├── calendarView.js       # Màn hình Lịch sử bữa ăn
│   │   ├── cameraView.js         # Khung ngắm camera & chụp ảnh bữa ăn
│   │   ├── chatView.js           # Phòng trò chuyện & tin nhắn tức thì
│   │   ├── header.js             # Thanh tiêu đề, thông báo & profile switcher
│   │   ├── locketFeed.js         # Lướt khoảnh khắc phong cách Locket
│   │   ├── modals.js             # Toàn bộ modal hộp thoại (xem ảnh, profile, kết bạn)
│   │   └── navigation.js         # Thanh điều hướng chuyển tab dưới cùng
│   ├── config/                   # Cấu hình môi trường & Supabase keys
│   │   └── env.js
│   ├── constants/                # Hằng số, mock data & bảng màu theme
│   │   ├── mockData.js
│   │   └── theme.js
│   ├── services/                 # Tầng giao tiếp dữ liệu & Supabase BaaS
│   │   ├── api.js                # Supabase client wrapper & local storage
│   │   ├── chatService.js        # Dịch vụ tin nhắn & realtime broadcast
│   │   ├── mealService.js        # Dịch vụ quản lý bữa ăn & upload ảnh
│   │   └── profileService.js     # Dịch vụ kết nối bạn bè & profile
│   ├── styles/                   # Stylesheet & CSS tokens
│   │   ├── animations.css
│   │   ├── components.css
│   │   └── main.css
│   ├── utils/                    # Các module tiện ích dùng chung
│   │   ├── avatarHelper.js       # Xử lý avatar dự phòng & màu sắc
│   │   ├── cameraHelper.js       # Quản lý luồng WebRTC camera & flash
│   │   ├── dateHelper.js         # Định dạng thời gian & bữa ăn
│   │   ├── imageCompressor.js    # Nén ảnh canvas trước khi tải lên
│   │   ├── locationHelper.js     # Định vị địa chỉ GPS tự động
│   │   ├── scriptableWidgetCode.js
│   │   ├── soundHelper.js        # Bộ tổng hợp âm thanh Web Audio API
│   │   └── streakHelper.js       # Thuật toán tính chuỗi ngày ăn cùng nhau
│   └── main.js                   # Điểm khởi chạy chính của ứng dụng
│
├── supabase/                     # 🗄️ Cấu hình Supabase & Cơ sở dữ liệu PostgreSQL
│   ├── config.toml               # Cấu hình Supabase CLI
│   ├── schema.sql                # DDL Database Schema & RLS Policies chuẩn
│   ├── cleanup_cron.sql          # Tự động hóa dọn dẹp ảnh cũ theo lịch
│   ├── migrations/               # Các bản migration dữ liệu theo phiên bản
│   │   ├── 202609230001_task1_account_and_couple_constraints.sql
│   │   ├── 202609230002_task2_connection_approval.sql
│   │   └── 202609240001_task2_chat_and_task3_edit_meals.sql
│   └── functions/                # Supabase Edge Functions (Deno / TypeScript)
│       └── delete-account/
│
└── widgets/                      # 📱 Widget iOS Scriptable (Hiển thị Home Screen)
    └── ios/
        └── scriptable_widget.js
```

---

## 🚀 Hướng Dẫn Khởi Chạy Local (Quick Start)

1. **Clone repository về máy:**
   ```bash
   git clone https://github.com/DB-Ducbao113/OurMam.git
   cd OurMam
   ```

2. **Chạy server phát triển (Development Server):**
   * Sử dụng npm (Khuyến nghị):
     ```bash
     npm run dev
     ```
   * Hoặc sử dụng Python:
     ```bash
     python3 -m http.server 3000
     ```

3. **Kiểm tra cú pháp code (Syntax Validation):**
   ```bash
   npm test
   ```

4. **Mở trình duyệt:**
   Truy cập địa chỉ: `http://localhost:3000`

---

## 📄 Bản Quyền & Giấy Phép (License)

Dự án được phát triển với tình yêu thương dành cho những bữa cơm gia đình và lứa đôi. ❤️  
Mọi đóng góp và ý kiến đóng góp vui lòng tạo Pull Request hoặc Issue trên repository.
