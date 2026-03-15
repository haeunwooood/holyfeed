-- ==========================================
-- Supabase SQL Editor에 복사해서 실행하세요.
-- (대시보드 좌측 SQL Editor 탭 -> New Query)
-- ==========================================

-- 1. Users 테이블 (Auth 확장)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT DEFAULT '성경을 사랑하는 제자',
  church_id UUID,
  group_id UUID,
  role TEXT DEFAULT 'user' -- 'user' 또는 'admin'
);

-- 2. Churches (교회)
CREATE TABLE public.churches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  rep_name TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Church Groups (목장)
CREATE TABLE public.church_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  church_id UUID REFERENCES public.churches(id) ON DELETE CASCADE,
  leader_id UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Posts (묵상 게시글)
CREATE TABLE public.posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  author_name TEXT,
  title TEXT,
  content TEXT,
  verses JSONB,
  visibility TEXT DEFAULT 'Public',
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Comments (댓글)
CREATE TABLE public.comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  author_name TEXT,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Verse Likes (저장한 말씀)
CREATE TABLE public.verse_likes (
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  verse_id TEXT,
  PRIMARY KEY (user_id, verse_id)
);

-- 7. Post Bookmarks (저장한 묵상)
CREATE TABLE public.post_bookmarks (
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, post_id)
);

-- RLS (Row Level Security) 설정 (MVP 테스트용으로 일단 모두 접근 허용)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.churches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.church_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verse_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all actions" ON public.users FOR ALL USING (true);
CREATE POLICY "Allow all actions" ON public.churches FOR ALL USING (true);
CREATE POLICY "Allow all actions" ON public.church_groups FOR ALL USING (true);
CREATE POLICY "Allow all actions" ON public.posts FOR ALL USING (true);
CREATE POLICY "Allow all actions" ON public.comments FOR ALL USING (true);
CREATE POLICY "Allow all actions" ON public.verse_likes FOR ALL USING (true);
CREATE POLICY "Allow all actions" ON public.post_bookmarks FOR ALL USING (true);
