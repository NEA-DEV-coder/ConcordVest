-- ============================================================================
-- ConcordVest Supabase Storage Configuration for Articles
-- ============================================================================
-- Bucket: articles (public)
-- Permissions:
--   - Public (Anonymous & Authenticated): SELECT
--   - Admin / Editor: INSERT, UPDATE, DELETE
--   - Staff / User / Anonymous: No write/delete access
-- 
-- Notes:
--   1. storage.objects already has RLS enabled by default in Supabase.
--      Do NOT run 'ALTER TABLE storage.objects' as it requires the internal
--      owner role.
--   2. Uses public.get_user_role() SECURITY DEFINER helper to prevent RLS recursion.
-- ============================================================================

-- 1. Ensure the 'articles' storage bucket exists with proper constraints
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'articles',
    'articles',
    TRUE,
    5242880, -- 5 MB max file size
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    public = TRUE,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

-- 2. Clean up existing / legacy policies on storage.objects for articles bucket
DROP POLICY IF EXISTS "Public Access Articles Images" ON storage.objects;
DROP POLICY IF EXISTS "Admin Editor Upload Articles Images" ON storage.objects;
DROP POLICY IF EXISTS "Admin Editor Update Articles Images" ON storage.objects;
DROP POLICY IF EXISTS "Admin Editor Delete Articles Images" ON storage.objects;

-- 3. Policy 1: Public SELECT (Anyone can view article images)
CREATE POLICY "Public Access Articles Images"
ON storage.objects FOR SELECT
USING (bucket_id = 'articles');

-- 4. Policy 2: Admin/Editor INSERT (Only Admin & Editor roles can upload article images)
CREATE POLICY "Admin Editor Upload Articles Images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'articles'
    AND public.get_user_role() IN ('admin'::public.user_role, 'editor'::public.user_role)
);

-- 5. Policy 3: Admin/Editor UPDATE (Only Admin & Editor roles can edit/replace article images)
CREATE POLICY "Admin Editor Update Articles Images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'articles'
    AND public.get_user_role() IN ('admin'::public.user_role, 'editor'::public.user_role)
)
WITH CHECK (
    bucket_id = 'articles'
    AND public.get_user_role() IN ('admin'::public.user_role, 'editor'::public.user_role)
);

-- 6. Policy 4: Admin/Editor DELETE (Only Admin & Editor roles can delete article images)
CREATE POLICY "Admin Editor Delete Articles Images"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'articles'
    AND public.get_user_role() IN ('admin'::public.user_role, 'editor'::public.user_role)
);

