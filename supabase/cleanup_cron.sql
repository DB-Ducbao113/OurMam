-- ==============================================================================
-- OURMAM - AUTOMATIC 180-DAY STORAGE RETENTION & CLEANUP (6 MONTHS)
-- ==============================================================================

-- 1. Hàm xóa các bài đăng và tin nhắn cũ hơn 180 ngày
CREATE OR REPLACE FUNCTION delete_old_meal_records()
RETURNS void AS $$
BEGIN
    DELETE FROM public.meals WHERE created_at < NOW() - INTERVAL '180 days';
    DELETE FROM public.messages WHERE created_at < NOW() - INTERVAL '180 days';
    DELETE FROM public.reactions WHERE created_at < NOW() - INTERVAL '180 days';
END;
$$ LANGUAGE plpgsql;

-- 2. Tự động kích hoạt thông qua pg_cron (nếu extension pg_cron được bật trong Supabase)
-- SELECT cron.schedule('daily-meal-cleanup', '0 3 * * *', 'SELECT delete_old_meal_records();');
