import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export interface VerseRef {
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl?: string;
  title: string;
  content: string;
  verses: VerseRef[];
  visibility: 'Public' | 'Group' | 'Private';
  createdAt: string;
  likes: number;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl?: string;
  content: string;
  createdAt: string;
}

interface AppState {
  isAuthenticated: boolean;
  currentUser: { id: string; name: string; avatar_url?: string; bio?: string; church_id?: string; group_id?: string; role?: string } | null;
  setAuthenticated: (status: boolean, user?: any) => void;

  likedVerses: string[]; // "book_chapter_verse"
  toggleLikeVerse: (verseId: string) => Promise<void>;
  
  likedPosts: string[]; // post id array
  toggleLikePost: (postId: string) => Promise<void>;

  bookmarkedPosts: string[]; // post id array
  toggleBookmarkPost: (postId: string) => Promise<void>;

  posts: Post[];
  addPost: (post: Omit<Post, 'id' | 'createdAt' | 'likes'>) => Promise<void>;
  updatePost: (postId: string, updates: Partial<Omit<Post, 'id' | 'createdAt' | 'authorId' | 'authorName' | 'likes'>>) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;

  comments: Comment[];
  addComment: (comment: Omit<Comment, 'id' | 'createdAt'>) => Promise<void>;

  fetchData: () => Promise<void>;

  earnedBadges: string[];
  newBadge: string | null;
  showBadgeModal: boolean;
  setShowBadgeModal: (show: boolean) => void;
  clearNewBadge: () => void;
  checkBadges: () => Promise<void>;

  // PWA 설치 상태
  pwaInstallPrompt: any;
  setPwaInstallPrompt: (prompt: any) => void;
  showPwaPrompt: boolean;
  setShowPwaPrompt: (show: boolean) => void;
  dismissPwaPrompt: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  isAuthenticated: false,
  currentUser: null,
  setAuthenticated: (status, user = null) => set({ isAuthenticated: status, currentUser: user }),

  likedVerses: [],
  likedPosts: [],
  bookmarkedPosts: [],
  posts: [],
  comments: [],

  earnedBadges: [],
  newBadge: null,
  showBadgeModal: false,
  setShowBadgeModal: (show) => set({ showBadgeModal: show }),
  clearNewBadge: () => set({ newBadge: null, showBadgeModal: false }),

  pwaInstallPrompt: null,
  setPwaInstallPrompt: (prompt) => set({ pwaInstallPrompt: prompt, showPwaPrompt: !!prompt }),
  showPwaPrompt: false,
  setShowPwaPrompt: (show) => set({ showPwaPrompt: show }),
  dismissPwaPrompt: () => set({ showPwaPrompt: false }),

  fetchData: async () => {
    const { currentUser } = get();
    if (!currentUser) return;

    try {
      // Supabase 데이터 페칭
      const [postsRes, commentsRes, versesRes, postLikesRes, bookmarksRes] = await Promise.all([
        supabase.from('posts').select('*, users!posts_author_id_fkey(avatar_url)').order('created_at', { ascending: false }),
        supabase.from('comments').select('*, users!comments_author_id_fkey(avatar_url)').order('created_at', { ascending: true }),
        supabase.from('verse_likes').select('verse_id').eq('user_id', currentUser.id),
        supabase.from('post_likes').select('post_id').eq('user_id', currentUser.id),
        supabase.from('post_bookmarks').select('post_id').eq('user_id', currentUser.id)
      ]);

      set({
        posts: (postsRes.data || []).map((p: any) => ({
          id: p.id,
          authorId: p.author_id,
          authorName: p.author_name || '사용자',
          authorAvatarUrl: p.users?.avatar_url,
          title: p.title,
          content: p.content,
          verses: p.verses || [],
          visibility: p.visibility,
          createdAt: p.created_at,
          likes: p.likes_count
        })),
        comments: (commentsRes.data || []).map((c: any) => ({
          id: c.id,
          postId: c.post_id,
          authorId: c.author_id,
          authorName: c.author_name || '사용자',
          authorAvatarUrl: c.users?.avatar_url,
          content: c.content,
          createdAt: c.created_at
        })),
        likedVerses: (versesRes.data || []).map((v: any) => v.verse_id),
        likedPosts: (postLikesRes.data || []).map((p: any) => p.post_id),
        bookmarkedPosts: (bookmarksRes.data || []).map((b: any) => b.post_id)
      });
    } catch (e) {
      console.error('Data fetch error:', e);
    }
  },

  checkBadges: async () => {
    const { posts, likedPosts, currentUser } = get();
    if (!currentUser) return;

    try {
      const savedBadges = await import('@react-native-async-storage/async-storage').then(a => a.default.getItem('earnedBadges'));
      const earnedBadges = savedBadges ? JSON.parse(savedBadges) : [];
      const bibleProgress = await import('@react-native-async-storage/async-storage').then(a => a.default.getItem('bibleBookProgress'));
      const bookProgress = bibleProgress ? JSON.parse(bibleProgress) : {};

      const bibleData = (await import('../data/bible.json')).default as any;
      const myPostsCount = posts.filter(p => p.authorId === currentUser.id).length;
      
      const calculateProgress = (testaments: string[]) => {
        let total = 0, read = 0;
        testaments.forEach(t => {
          Object.keys(bibleData[t]).forEach(book => {
            total += bibleData[t][book].length;
            read += bookProgress[book] || 0;
          });
        });
        return Math.floor((read / total) * 100);
      };

      const criteria = [
        { id: 'post_1', label: '묵상 [첫 묵상]', count: 1, current: myPostsCount },
        { id: 'post_10', label: '묵상 [묵상의 시작]', count: 10, current: myPostsCount },
        { id: 'post_100', label: '묵상 [묵상 우등생]', count: 100, current: myPostsCount },
        { id: 'post_1000', label: '묵상 [묵상의 대가]', count: 1000, current: myPostsCount },

        { id: 'like_1', label: '좋아요 [첫 좋아요]', count: 1, current: likedPosts.length },
        { id: 'like_10', label: '좋아요 [은혜의 통로]', count: 10, current: likedPosts.length },
        { id: 'like_100', label: '좋아요 [좋아요 수호자]', count: 100, current: likedPosts.length },
        { id: 'like_1000', label: '좋아요 [좋아요 전도사]', count: 1000, current: likedPosts.length },

        { id: 'progress_old_1', label: '진행률 [구약의 시작]', count: 1, current: calculateProgress(['old_testament']) },
        { id: 'progress_old_10', label: '진행률 [구약 탐험가]', count: 10, current: calculateProgress(['old_testament']) },
        { id: 'progress_old_100', label: '진행률 [구약 완독]', count: 100, current: calculateProgress(['old_testament']) },

        { id: 'progress_new_1', label: '진행률 [신약의 시작]', count: 1, current: calculateProgress(['new_testament']) },
        { id: 'progress_new_10', label: '진행률 [신약 탐험가]', count: 10, current: calculateProgress(['new_testament']) },
        { id: 'progress_new_100', label: '진행률 [신약 완독]', count: 100, current: calculateProgress(['new_testament']) },

        { id: 'progress_all_1', label: '진행률 [성경의 시작]', count: 1, current: calculateProgress(['old_testament', 'new_testament']) },
        { id: 'progress_all_10', label: '진행률 [성경 탐험가]', count: 10, current: calculateProgress(['old_testament', 'new_testament']) },
        { id: 'progress_all_100', label: '진행률 [성경 일독]', count: 100, current: calculateProgress(['old_testament', 'new_testament']) },
      ];

      for (const badge of criteria) {
        if (badge.current >= badge.count && !earnedBadges.includes(badge.id)) {
          earnedBadges.push(badge.id);
          await (await import('@react-native-async-storage/async-storage')).default.setItem('earnedBadges', JSON.stringify(earnedBadges));
          set({ earnedBadges, newBadge: badge.label, showBadgeModal: true });
          break; 
        }
      }
    } catch (e) { console.error(e); }
  },

  toggleLikeVerse: async (verseId) => {
    const { currentUser, likedVerses } = get();
    if (!currentUser) return;

    const isLiked = likedVerses.includes(verseId);
    
    // Optimistic UI Update
    if (isLiked) {
      set({ likedVerses: likedVerses.filter((v) => v !== verseId) });
      await supabase.from('verse_likes').delete().match({ user_id: currentUser.id, verse_id: verseId });
    } else {
      set({ likedVerses: [...likedVerses, verseId] });
      await supabase.from('verse_likes').insert([{ user_id: currentUser.id, verse_id: verseId }]);
    }
  },
    
  addPost: async (newPost) => {
    const { currentUser } = get();
    if (!currentUser) return;

    await supabase.from('posts').insert([{
      author_id: currentUser.id,
      author_name: currentUser.name,
      title: newPost.title,
      content: newPost.content,
      verses: newPost.verses,
      visibility: newPost.visibility
    }]);

    await get().fetchData(); 
    await get().checkBadges(); // 뱃지 체크
  },

  updatePost: async (postId, updates) => {
    const { currentUser } = get();
    if (!currentUser) return;

    // 낙관적 업데이트
    set((state) => ({
      posts: state.posts.map((p) => p.id === postId ? { ...p, ...updates } : p)
    }));

    await supabase.from('posts').update({
      title: updates.title,
      content: updates.content,
      visibility: updates.visibility
    }).match({ id: postId, author_id: currentUser.id });
    
    await get().fetchData();
  },

  deletePost: async (postId) => {
    const { currentUser } = get();
    if (!currentUser) return;

    // 낙관적 업데이트
    set((state) => ({
      posts: state.posts.filter((p) => p.id !== postId)
    }));

    await supabase.from('posts').delete().match({ id: postId, author_id: currentUser.id });
  },

  toggleLikePost: async (postId) => {
    const { currentUser, posts, likedPosts } = get();
    if (!currentUser) return;

    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const isLiked = likedPosts.includes(postId);

    if (isLiked) {
      // Optimistic Update: Remove like
      set((state) => ({
        likedPosts: state.likedPosts.filter((id) => id !== postId),
        posts: state.posts.map((p) => p.id === postId ? { ...p, likes: p.likes - 1 } : p),
      }));

      await Promise.all([
        supabase.from('post_likes').delete().match({ user_id: currentUser.id, post_id: postId }),
        supabase.from('posts').update({ likes_count: post.likes - 1 }).eq('id', postId)
      ]);
    } else {
      // Optimistic Update: Add like
      set((state) => ({
        likedPosts: [...state.likedPosts, postId],
        posts: state.posts.map((p) => p.id === postId ? { ...p, likes: p.likes + 1 } : p),
      }));

      await Promise.all([
        supabase.from('post_likes').insert([{ user_id: currentUser.id, post_id: postId }]),
        supabase.from('posts').update({ likes_count: post.likes + 1 }).eq('id', postId)
      ]);
    }
  },

  toggleBookmarkPost: async (postId) => {
    const { currentUser, bookmarkedPosts } = get();
    if (!currentUser) return;

    const isBookmarked = bookmarkedPosts.includes(postId);

    if (isBookmarked) {
      // 낙관적 업데이트: 제거
      set({ bookmarkedPosts: bookmarkedPosts.filter((id) => id !== postId) });
      await supabase.from('post_bookmarks').delete().match({ user_id: currentUser.id, post_id: postId });
    } else {
      // 낙관적 업데이트: 추가
      set({ bookmarkedPosts: [...bookmarkedPosts, postId] });
      await supabase.from('post_bookmarks').insert([{ user_id: currentUser.id, post_id: postId }]);
    }
  },

  addComment: async (newComment) => {
    const { currentUser } = get();
    if (!currentUser) return;

    await supabase.from('comments').insert([{
      post_id: newComment.postId,
      author_id: currentUser.id,
      author_name: currentUser.name,
      content: newComment.content
    }]);

    await get().fetchData(); // 갱신
  },
}));
