# ==============================================================================
# OURMAM - ENTITY RELATIONSHIP DIAGRAM (ERD) & DATA DICTIONARY SPECIFICATION
# ==============================================================================

Tài liệu thiết kế mô hình thực thể quan hệ (**Entity Relationship Diagram - ERD**) và từ điển dữ liệu chuẩn cho hệ thống **OurMam** (Chuẩn Locket: Kết bạn qua User Code + Chế độ Cặp đôi linh hoạt).

---

## 📊 1. Sơ Đồ Thực Thể Quan Hệ (Visual ERD)

```mermaid
erDiagram
    %% ==========================================
    %% SUPABASE AUTH & USER PROFILE
    %% ==========================================
    AUTH_USERS ||--|| PROFILES : "1 - 1 (Auto Trigger on Signup)"

    %% ==========================================
    %% DOMAIN ENTITIES & RELATIONSHIPS
    %% ==========================================
    PROFILES ||--o{ CONNECTIONS : "user_id / friend_id"
    PROFILES ||--o{ MEALS : "đăng bữa ăn (author)"
    PROFILES ||--o{ MESSAGES : "người gửi / người nhận"

    MEALS ||--o{ REACTIONS : "nhận cảm xúc (1..N)"
    PROFILES ||--o{ REACTIONS : "người thả cảm xúc"

    %% ==========================================
    %% TABLE ATTRIBUTE DEFINITIONS
    %% ==========================================
    AUTH_USERS {
        uuid id PK "Mã định danh Auth Supabase"
        string email UK "Email đăng nhập"
        string encrypted_password "Mật khẩu mã hóa"
        jsonb raw_user_meta_data "Metadata (tên, avatar Google)"
        timestamp created_at "Ngày tạo tài khoản"
    }

    PROFILES {
        uuid id PK,FK "Khóa chính (Khớp 1-1 với auth.users.id)"
        varchar user_code UK "Mã kết nối cá nhân 6 ký tự (VD: 'MAM852')"
        text email "Email người dùng"
        text display_name "Tên hiển thị (User tự đặt hoặc lấy từ Google)"
        text avatar_url "Link ảnh đại diện"
        text status_text "Trạng thái đói bụng (Default: 'Đang đói bụng 🤤')"
        boolean is_online "Trạng thái trực tuyến (Default: true)"
        timestamptz last_active "Lần cuối hoạt động"
        timestamptz created_at "Ngày tạo hồ sơ"
        timestamptz updated_at "Ngày cập nhật gần nhất"
    }

    CONNECTIONS {
        uuid id PK "ID kết nối (gen_random_uuid())"
        uuid user_id FK "Người kết nối"
        uuid friend_id FK "Bạn bè / Người yêu được kết nối"
        text relationship_type " 'friend' (Bạn bè) | 'couple' (Người yêu 💕)"
        date anniversary_date "Ngày kỷ niệm (Nếu là couple)"
        int streak_count "Chuỗi ngày liên tiếp chia sẻ bữa ăn"
        text status " 'accepted' | 'pending' | 'blocked' "
        timestamptz created_at "Thời điểm kết nối"
    }

    MEALS {
        uuid id PK "ID bữa ăn (gen_random_uuid())"
        uuid user_id FK "Người chụp và đăng bài"
        text user_name "Tên người đăng"
        text user_avatar "Avatar người đăng"
        text photo_url "Link ảnh món ăn nén (<150KB)"
        text dish_name "Tên món ăn (VD: 'Bún Bò Huế O Ba')"
        text caption "Lời nhắn gửi kèm ảnh"
        text meal_type "Phân loại ('breakfast', 'lunch', 'dinner', 'snack')"
        text location "Địa điểm ('Q.1, Sài Gòn')"
        text calories "Lượng calo ước tính ('~560 kcal')"
        int rating "Độ ngon (1 - 5 sao)"
        text audience "Phạm vi ('all' - Tất cả bạn bè | 'couple' - Chỉ người yêu)"
        timestamptz created_at "Thời điểm chụp bữa ăn"
    }

    REACTIONS {
        uuid id PK "ID cảm xúc (gen_random_uuid())"
        uuid meal_id FK "ID bữa ăn được thả tim"
        uuid user_id FK "ID người thả cảm xúc"
        text user_name "Tên người thả"
        text emoji "Ký tự Emoji ('💕', '🤤', '👏', '🧋')"
        text label "Nhãn cảm xúc ('Yêu quá', 'Thèm xỉu')"
        timestamptz created_at "Thời điểm thả cảm xúc"
    }

    MESSAGES {
        uuid id PK "ID tin nhắn (gen_random_uuid())"
        uuid sender_id FK "Người gửi tin nhắn"
        uuid receiver_id FK "Người nhận tin nhắn"
        text sender_name "Tên người gửi"
        text sender_avatar "Avatar người gửi"
        text text "Nội dung tin nhắn"
        text photo_url "Ảnh món ăn gửi kèm (Nullable)"
        timestamptz created_at "Thời điểm gửi"
    }
```

---

## 📖 2. Từ Điển Dữ Liệu Chi Tiết (Data Dictionary)

### Bảng 1: `public.profiles` (Hồ Sơ Cá Nhân & Mã Mời)
| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Giá Trị Mặc Định | Mô Tả |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | **PK**, **FK** -> `auth.users(id)` ON DELETE CASCADE | | Khóa chính, liên kết 1-1 với Supabase Auth |
| `user_code` | `VARCHAR(10)`| **UK**, **NOT NULL** | | Mã cá nhân chia sẻ kết nối (VD: `MAM852`) |
| `email` | `TEXT` | Nullable | `NULL` | Email đăng ký |
| `display_name` | `TEXT` | **NOT NULL** | `'Thành viên mới 🌸'` | Tên hiển thị người dùng |
| `avatar_url` | `TEXT` | Nullable | Link avatar mặc định | Ảnh đại diện |
| `status_text` | `TEXT` | Nullable | `'Đang đói bụng 🤤'` | Trạng thái ăn uống hiện tại |
| `is_online` | `BOOLEAN` | Nullable | `true` | Đang trực tuyến |
| `last_active` | `TIMESTAMPTZ`| Nullable | `NOW()` | Thời gian mở app gần nhất |
| `created_at` | `TIMESTAMPTZ`| Nullable | `NOW()` | Thời gian tạo tài khoản |
| `updated_at` | `TIMESTAMPTZ`| Nullable | `NOW()` | Thời gian cập nhật gần nhất |

---

### Bảng 2: `public.connections` (Quan Hệ Bạn Bè & Cặp Đôi)
| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Giá Trị Mặc Định | Mô Tả |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | **PK** | `gen_random_uuid()` | Khóa chính liên kết |
| `user_id` | `UUID` | **FK** -> `profiles(id)` | | ID người kết nối |
| `friend_id` | `UUID` | **FK** -> `profiles(id)` | | ID bạn bè / người yêu |
| `relationship_type`| `TEXT` | CHECK (`friend`, `couple`) | `'friend'` | Loại quan hệ (`friend`: bạn bè, `couple`: người yêu 💕) |
| `anniversary_date`| `DATE` | Nullable | `CURRENT_DATE` | Ngày kỷ niệm tình yêu (khi là couple) |
| `streak_count` | `INT` | Nullable | `1` | Số ngày chuỗi cùng chia sẻ bữa ăn |
| `status` | `TEXT` | Nullable | `'accepted'` | Trạng thái kết nối |
| `created_at` | `TIMESTAMPTZ`| Nullable | `NOW()` | Ngày bắt đầu kết nối |

---

### Bảng 3: `public.meals` (Khoảnh Khắc Bữa Ăn)
| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Giá Trị Mặc Định | Mô Tả |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | **PK** | `gen_random_uuid()` | Khóa chính bài đăng |
| `user_id` | `UUID` | **FK** -> `profiles(id)` ON DELETE CASCADE | | ID người chụp và đăng bài |
| `user_name` | `TEXT` | **NOT NULL** | | Tên người chụp |
| `user_avatar` | `TEXT` | Nullable | | Avatar người chụp |
| `photo_url` | `TEXT` | **NOT NULL** | | Link ảnh món ăn đã nén WebP/JPEG (< 150KB) |
| `dish_name` | `TEXT` | Nullable | `'Món ngon mỗi ngày'` | Tên món ăn |
| `caption` | `TEXT` | Nullable | | Lời nhắn kèm ảnh |
| `meal_type` | `TEXT` | CHECK (`breakfast`, `lunch`, `dinner`, `snack`) | `'lunch'` | Bữa sáng / trưa / tối / ăn vặt |
| `location` | `TEXT` | Nullable | `'Sài Gòn'` | Địa điểm quán ăn |
| `calories` | `TEXT` | Nullable | `'~500 kcal'` | Ước tính calo |
| `rating` | `INT` | CHECK (1 <= rating <= 5) | `5` | Điểm đánh giá (1-5 sao) |
| `audience` | `TEXT` | CHECK (`all`, `couple`) | `'all'` | `'all'`: Share cho tất cả bạn bè, `'couple'`: Share riêng người yêu |
| `created_at` | `TIMESTAMPTZ`| Nullable | `NOW()` | Thời gian chụp ảnh |

---

### Bảng 4: `public.reactions` (Cảm Xúc Bữa Ăn)
| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Giá Trị Mặc Định | Mô Tả |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | **PK** | `gen_random_uuid()` | Khóa chính cảm xúc |
| `meal_id` | `UUID` | **FK** -> `meals(id)` ON DELETE CASCADE | | Bữa ăn được thả tim |
| `user_id` | `UUID` | **FK** -> `profiles(id)` ON DELETE CASCADE | | Người thả reaction |
| `user_name` | `TEXT` | **NOT NULL** | | Tên người thả |
| `emoji` | `TEXT` | **NOT NULL** | | Ký tự biểu cảm: 💕, 🤤, 👏, 🧋 |
| `label` | `TEXT` | Nullable | | Nhãn cảm xúc |
| `created_at` | `TIMESTAMPTZ`| Nullable | `NOW()` | Thời gian thả |

---

### Bảng 5: `public.messages` (Trò Chuyện & Nhắn Tin Trực Tiếp)
| Tên Cột | Kiểu Dữ Liệu | Ràng Buộc | Giá Trị Mặc Định | Mô Tả |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `UUID` | **PK** | `gen_random_uuid()` | Khóa chính tin nhắn |
| `sender_id` | `UUID` | **FK** -> `profiles(id)` ON DELETE CASCADE | | ID người gửi |
| `receiver_id`| `UUID` | **FK** -> `profiles(id)` ON DELETE CASCADE | | ID người nhận |
| `sender_name`| `TEXT` | **NOT NULL** | | Tên người gửi |
| `sender_avatar`| `TEXT`| Nullable | | Avatar người gửi |
| `text` | `TEXT` | **NOT NULL** | | Nội dung tin nhắn |
| `photo_url` | `TEXT` | Nullable | `NULL` | Ảnh gửi kèm (nếu có) |
| `created_at` | `TIMESTAMPTZ`| Nullable | `NOW()` | Thời gian gửi |

---

## ⚡ 3. Các Hàm Tự Động Hóa & Thủ Tục (Triggers & Stored Procedures)

1. **`handle_new_user`**: Tự động sinh `user_code` cá nhân 6 ký tự (VD: `MAM852`) và chèn hồ sơ vào `public.profiles` khi có tài khoản mới đăng ký.
2. **`add_connection(target_code, rel_type)`**: 
   - Nhập `user_code` của người khác để kết bạn (`rel_type = 'friend'`) hoặc ghép đôi (`rel_type = 'couple'`).
   - Tự động tạo kết nối 2 chiều giữa 2 tài khoản.
