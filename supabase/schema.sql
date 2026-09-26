-- ==============================================================================
-- OURMAM - SUPABASE DATABASE SCHEMA (CLEAN DDL)
-- Chỉ tạo bảng, quan hệ, triggers, thủ tục và chính sách bảo mật (RLS)
-- Không chèn dữ liệu mẫu / giá trị ban đầu
-- ==============================================================================

-- 1. BẢNG HỒ SƠ NGƯỜI DÙNG (PROFILES)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    user_code VARCHAR(10) UNIQUE NOT NULL,
    email TEXT,
    display_name TEXT NOT NULL DEFAULT 'Thành viên mới',
    avatar_url TEXT,
    status_text TEXT DEFAULT 'Sẵn sàng chia sẻ bữa ăn 🍽️',
    is_online BOOLEAN DEFAULT true,
    last_active TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 2. BẢNG KẾT NỐI BẠN BÈ & CẶP ĐÔI (CONNECTIONS)
CREATE TABLE IF NOT EXISTS public.connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    friend_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    relationship_type TEXT DEFAULT 'friend', -- 'friend' (Bạn bè) | 'couple' (Người yêu)
    nickname TEXT DEFAULT NULL, -- Biệt danh tùy chỉnh do người dùng đặt cho bạn bè / người yêu
    anniversary_date DATE DEFAULT CURRENT_DATE,
    streak_count INT DEFAULT 1,
    status TEXT DEFAULT 'accepted', -- 'pending' | 'accepted' | 'blocked'
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_user_friend_connection UNIQUE (user_id, friend_id)
);

-- Hỗ trợ nâng cấp cho database đã tạo trước đó
ALTER TABLE public.connections ADD COLUMN IF NOT EXISTS nickname TEXT;


-- 3. BẢNG KHOẢNH KHẮC BỮA ĂN (MEALS)
CREATE TABLE IF NOT EXISTS public.meals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    user_avatar TEXT,
    photo_url TEXT NOT NULL,
    dish_name TEXT DEFAULT 'Món ngon mỗi ngày',
    caption TEXT,
    meal_type TEXT DEFAULT 'lunch', -- 'breakfast' | 'lunch' | 'dinner' | 'snack'
    location TEXT DEFAULT 'Sài Gòn',
    calories TEXT DEFAULT NULL,
    rating INT DEFAULT NULL,
    audience TEXT DEFAULT 'all', -- 'all' | 'couple'
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 4. BẢNG CẢM XÚC BỮA ĂN (REACTIONS)
CREATE TABLE IF NOT EXISTS public.reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meal_id UUID REFERENCES public.meals(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    emoji TEXT NOT NULL,
    label TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 5. BẢNG TRÒ CHUYỆN TRỰC TIẾP (MESSAGES)
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    sender_name TEXT NOT NULL,
    sender_avatar TEXT,
    text TEXT NOT NULL,
    photo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- ⚡ AUTOMATION TRIGGERS (Tự động cấp User Code & Hồ Sơ khi Đăng Ký)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_user_code TEXT;
    user_display_name TEXT;
    user_avatar TEXT;
BEGIN
    user_display_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        split_part(NEW.email, '@', 1)
    );
    
    user_avatar := COALESCE(
        NEW.raw_user_meta_data->>'avatar_url',
        NEW.raw_user_meta_data->>'picture',
        'https://ui-avatars.com/api/?name=' || replace(user_display_name, ' ', '+') || '&background=FF7A53&color=fff&bold=true&size=300'
    );

    new_user_code := 'MAM' || floor(100 + random() * 899)::text;

    WHILE EXISTS (SELECT 1 FROM public.profiles WHERE user_code = new_user_code) LOOP
        new_user_code := 'MAM' || floor(100 + random() * 899)::text;
    END LOOP;

    INSERT INTO public.profiles (id, user_code, email, display_name, avatar_url)
    VALUES (NEW.id, new_user_code, NEW.email, user_display_name, user_avatar)
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 🤝 THỦ TỤC KẾT NỐI 2 CHIỀU (ADD_CONNECTION RPC)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.add_connection(
    target_code TEXT, 
    rel_type TEXT DEFAULT 'friend'
)
RETURNS JSONB AS $$
DECLARE
    target_user RECORD;
    current_uid UUID := auth.uid();
BEGIN
    IF current_uid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Chưa đăng nhập');
    END IF;

    SELECT * INTO target_user FROM public.profiles 
    WHERE UPPER(user_code) = UPPER(TRIM(target_code))
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Không tìm thấy mã người dùng này');
    END IF;

    IF target_user.id = current_uid THEN
        RETURN jsonb_build_object('success', false, 'message', 'Bạn không thể tự kết nối với chính mình');
    END IF;

    -- Tạo kết nối 2 chiều
    INSERT INTO public.connections (user_id, friend_id, relationship_type, status)
    VALUES (current_uid, target_user.id, rel_type, 'accepted')
    ON CONFLICT (user_id, friend_id) 
    DO UPDATE SET relationship_type = EXCLUDED.relationship_type, status = 'accepted';

    INSERT INTO public.connections (user_id, friend_id, relationship_type, status)
    VALUES (target_user.id, current_uid, rel_type, 'accepted')
    ON CONFLICT (user_id, friend_id) 
    DO UPDATE SET relationship_type = EXCLUDED.relationship_type, status = 'accepted';

    RETURN jsonb_build_object(
        'success', true, 
        'friend_id', target_user.id,
        'friend_name', target_user.display_name,
        'relationship_type', rel_type,
        'message', CASE 
            WHEN rel_type = 'couple' THEN 'Đã kết nối cặp đôi thành công! 💕'
            ELSE 'Đã thêm bạn bè thành công! 🥑'
        END
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 🔒 BẢO MẬT ROW LEVEL SECURITY (RLS) & STORAGE
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 1. Profiles
DROP POLICY IF EXISTS "Profiles truy cập chung" ON public.profiles;
DROP POLICY IF EXISTS "Allow public read of profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow public update of own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow public insert of own profile" ON public.profiles;

CREATE POLICY "Allow public read of profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow public insert of own profile" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update of own profile" ON public.profiles FOR UPDATE USING (true);

-- 2. Connections
DROP POLICY IF EXISTS "Connections truy cập chung" ON public.connections;
CREATE POLICY "Connections truy cập chung" ON public.connections FOR ALL USING (true) WITH CHECK (true);

-- 3. Meals
DROP POLICY IF EXISTS "Meals truy cập chung" ON public.meals;
CREATE POLICY "Meals truy cập chung" ON public.meals FOR ALL USING (true) WITH CHECK (true);

-- 4. Reactions
DROP POLICY IF EXISTS "Reactions truy cập chung" ON public.reactions;
CREATE POLICY "Reactions truy cập chung" ON public.reactions FOR ALL USING (true) WITH CHECK (true);

-- 5. Messages
DROP POLICY IF EXISTS "Messages truy cập chung" ON public.messages;
CREATE POLICY "Messages truy cập chung" ON public.messages FOR ALL USING (true) WITH CHECK (true);

-- 6. Storage Bucket meal-photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('meal-photos', 'meal-photos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Xem ảnh meal-photos công khai" ON storage.objects;
CREATE POLICY "Xem ảnh meal-photos công khai" ON storage.objects 
FOR SELECT USING (bucket_id = 'meal-photos');

DROP POLICY IF EXISTS "Tải ảnh meal-photos" ON storage.objects;
CREATE POLICY "Tải ảnh meal-photos" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'meal-photos');

-- ==============================================================================
-- 7. KÍCH HOẠT SUPABASE REALTIME (Websocket trực tiếp cho Messages, Meals, Connections)
-- ==============================================================================
DO $$
BEGIN
    -- Thêm bảng messages vào supabase_realtime nếu chưa có
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    END IF;

    -- Thêm bảng meals vào supabase_realtime nếu chưa có
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'meals'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.meals;
    END IF;

    -- Thêm bảng connections vào supabase_realtime nếu chưa có
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'connections'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.connections;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        NULL; -- Bỏ qua nếu publication không khả dụng trong môi trường dev
END $$;
