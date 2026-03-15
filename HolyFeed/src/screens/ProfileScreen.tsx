import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, Image, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useStore, Post } from '../store/useStore';
import Icon from 'react-native-vector-icons/Ionicons';
import { supabase } from '../lib/supabase';
import bibleData from '../data/bible.json';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BIBLE: any = bibleData;

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { posts, likedVerses, likedPosts, bookmarkedPosts, currentUser, setAuthenticated, earnedBadges } = useStore();
  const [activeTab, setActiveTab] = useState<'MyPosts' | 'SavedPosts' | 'SavedVerses' | 'Badges'>('MyPosts');
  const [bookProgress, setBookProgress] = useState<Record<string, number>>({});
  
  useEffect(() => {
    const loadProgress = async () => {
      const saved = await AsyncStorage.getItem('bibleBookProgress');
      if (saved) setBookProgress(JSON.parse(saved));
    };
    loadProgress();
  }, []);

  const calculateTotalProgress = (type: 'old' | 'new' | 'all') => {
    let total = 0;
    let read = 0;

    const count = (testament: string) => {
      Object.keys(BIBLE[testament]).forEach(book => {
        total += BIBLE[testament][book].length;
        read += bookProgress[book] || 0;
      });
    };

    if (type === 'old' || type === 'all') count('old_testament');
    if (type === 'new' || type === 'all') count('new_testament');

    return Math.floor((read / total) * 100);
  };

  const myPosts = posts.filter(p => p.authorId === currentUser?.id);
  const savedPosts = posts.filter(p => bookmarkedPosts.includes(p.id));

  const handleLogout = () => {
    supabase.auth.signOut();
    setAuthenticated(false);
  };

  const renderPost = ({ item }: { item: Post }) => (
    <TouchableOpacity 
      style={styles.postCard} 
      activeOpacity={0.8}
      onPress={() => navigation.navigate('PostDetail', { postId: item.id })}
    >
      <Text style={styles.postTitle} numberOfLines={1}>{item.title}</Text>
      <Text style={styles.postContent} numberOfLines={2}>{item.content}</Text>
      <Text style={styles.postDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
    </TouchableOpacity>
  );

  const renderVerse = ({ item }: { item: string }) => {
    // verseId: "마태복음_1_1"
    const [book, chapter, verse] = item.split('_');
    return (
      <View style={styles.verseCard}>
        <Icon name="heart" size={16} color="#FF3040" style={styles.verseIcon} />
        <View>
          <Text style={styles.verseRef}>{book} {chapter}장 {verse}절</Text>
        </View>
      </View>
    );
  };

  const badgeCriteria = [
    { id: 'post_1', category: '묵상', label: '첫 묵상', count: 1, current: myPosts.length },
    { id: 'post_10', category: '묵상', label: '묵상의 시작', count: 10, current: myPosts.length },
    { id: 'post_100', category: '묵상', label: '묵상 우등생', count: 100, current: myPosts.length },
    { id: 'post_1000', category: '묵상', label: '묵상의 대가', count: 1000, current: myPosts.length },
    
    { id: 'like_1', category: '좋아요', label: '첫 좋아요', count: 1, current: likedPosts.length },
    { id: 'like_10', category: '좋아요', label: '은혜의 통로', count: 10, current: likedPosts.length },
    { id: 'like_100', category: '좋아요', label: '좋아요 수호자', count: 100, current: likedPosts.length },
    { id: 'like_1000', category: '좋아요', label: '좋아요 전도사', count: 1000, current: likedPosts.length },

    { id: 'progress_old_1', category: '진행률', label: '구약의 시작', count: 1, current: calculateTotalProgress('old') },
    { id: 'progress_old_10', category: '진행률', label: '구약 탐험가', count: 10, current: calculateTotalProgress('old') },
    { id: 'progress_old_100', category: '진행률', label: '구약 완독', count: 100, current: calculateTotalProgress('old') },

    { id: 'progress_new_1', category: '진행률', label: '신약의 시작', count: 1, current: calculateTotalProgress('new') },
    { id: 'progress_new_10', category: '진행률', label: '신약 탐험가', count: 10, current: calculateTotalProgress('new') },
    { id: 'progress_new_100', category: '진행률', label: '신약 완독', count: 100, current: calculateTotalProgress('new') },

    { id: 'progress_all_1', category: '진행률', label: '성경의 시작', count: 1, current: calculateTotalProgress('all') },
    { id: 'progress_all_10', category: '진행률', label: '성경 탐험가', count: 10, current: calculateTotalProgress('all') },
    { id: 'progress_all_100', category: '진행률', label: '성경 일독', count: 100, current: calculateTotalProgress('all') },
  ];

  const renderBadge = ({ item }: { item: any }) => {
    const isEarned = earnedBadges.includes(item.id) || item.current >= item.count;
    return (
      <View style={[styles.badgeCard, !isEarned && styles.badgeLocked]}>
        <View style={[styles.badgeIconBox, isEarned ? styles.badgeActive : styles.badgeInactive]}>
          <Icon name={isEarned ? "ribbon" : "lock-closed"} size={32} color={isEarned ? "#FFD700" : "#CCC"} />
        </View>
        <Text style={styles.badgeLabel}>{item.label}</Text>
        <Text style={styles.badgeProgress}>{Math.min(item.current, item.count)} / {item.count}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.userInfo}>
          {currentUser?.avatar_url ? (
            <Image source={{ uri: currentUser.avatar_url }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{currentUser?.name?.[0] || 'U'}</Text>
            </View>
          )}
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.userName}>{currentUser?.name || '사용자'}</Text>
              <TouchableOpacity onPress={() => navigation.navigate('ProfileSetup')} style={styles.editButton}>
                <Icon name="pencil" size={14} color="#666" />
              </TouchableOpacity>
            </View>
            <Text style={styles.userDesc}>{currentUser?.bio || (currentUser?.role === 'admin' ? '운영 관리자' : '성경을 사랑하는 제자')}</Text>
          </View>
        </View>
        
        <View style={{ flexDirection: 'row' }}>
          {currentUser?.role === 'admin' && (
            <TouchableOpacity style={[styles.logoutBtn, { marginRight: 8 }]} onPress={() => navigation.navigate('Admin')}>
              <Icon name="settings-outline" size={24} color="#000" />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Icon name="log-out-outline" size={24} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity onPress={() => setActiveTab('MyPosts')} style={[styles.tabBtn, activeTab === 'MyPosts' && styles.tabBtnActive]}>
            <Text style={[styles.tabText, activeTab === 'MyPosts' && styles.tabTextActive]}>내 묵상</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveTab('SavedPosts')} style={[styles.tabBtn, activeTab === 'SavedPosts' && styles.tabBtnActive]}>
            <Text style={[styles.tabText, activeTab === 'SavedPosts' && styles.tabTextActive]}>저장한 묵상</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveTab('SavedVerses')} style={[styles.tabBtn, activeTab === 'SavedVerses' && styles.tabBtnActive]}>
            <Text style={[styles.tabText, activeTab === 'SavedVerses' && styles.tabTextActive]}>저장한 말씀</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveTab('Badges')} style={[styles.tabBtn, activeTab === 'Badges' && styles.tabBtnActive]}>
            <Text style={[styles.tabText, activeTab === 'Badges' && styles.tabTextActive]}>뱃지</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <View style={styles.contentContainer}>
        {activeTab === 'MyPosts' && (
          <FlatList
            data={myPosts}
            keyExtractor={item => item.id}
            renderItem={renderPost}
            ListEmptyComponent={<Text style={styles.emptyText}>작성한 묵상이 없습니다.</Text>}
          />
        )}
        {activeTab === 'SavedPosts' && (
          <FlatList
            data={savedPosts}
            keyExtractor={item => item.id}
            renderItem={renderPost}
            ListEmptyComponent={<Text style={styles.emptyText}>저장한 묵상이 없습니다.</Text>}
          />
        )}
        {activeTab === 'SavedVerses' && (
          <FlatList
            data={likedVerses}
            keyExtractor={item => item}
            renderItem={renderVerse}
            ListEmptyComponent={<Text style={styles.emptyText}>저장한 말씀이 없습니다.</Text>}
          />
        )}
        {activeTab === 'Badges' && (
          <FlatList
            data={badgeCriteria}
            keyExtractor={item => item.id}
            renderItem={renderBadge}
            numColumns={3}
            contentContainerStyle={styles.badgeList}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EAEAEA',
  },
  userInfo: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 50, height: 50, borderRadius: 25, backgroundColor: '#000',
    justifyContent: 'center', alignItems: 'center', marginRight: 16,
  },
  avatarImage: { width: 50, height: 50, borderRadius: 25, marginRight: 16 },
  avatarText: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  userName: { fontSize: 18, fontWeight: 'bold', color: '#000', marginBottom: 4 },
  editButton: { marginLeft: 6, padding: 4, backgroundColor: '#F0F0F0', borderRadius: 12, marginBottom: 4 },
  userDesc: { fontSize: 13, color: '#888' },
  logoutBtn: { padding: 8 },
  tabsContainer: {
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EAEAEA',
  },
  tabBtn: { marginRight: 24, paddingVertical: 12 },
  tabBtnActive: { borderBottomWidth: 2, borderBottomColor: '#000' },
  tabText: { fontSize: 15, color: '#888', fontWeight: '600' },
  tabTextActive: { color: '#000', fontWeight: 'bold' },
  contentContainer: { flex: 1, padding: 16 },
  emptyText: { textAlign: 'center', marginTop: 40, color: '#999', fontSize: 14 },
  postCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  postTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 6, color: '#111' },
  postContent: { fontSize: 14, color: '#555', lineHeight: 20, marginBottom: 8 },
  postDate: { fontSize: 12, color: '#999' },
  verseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  verseIcon: { marginRight: 12 },
  verseRef: { fontSize: 15, fontWeight: 'bold', color: '#111' },
  
  // 뱃지 관련 스타일
  badgeList: { paddingBottom: 20 },
  badgeCard: {
    flex: 1/3,
    alignItems: 'center',
    marginBottom: 24,
    padding: 10,
  },
  badgeLocked: { opacity: 0.5 },
  badgeIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: '#F5F5F5',
  },
  badgeActive: { backgroundColor: '#FFF9C4', elevation: 2 },
  badgeInactive: { backgroundColor: '#F5F5F5' },
  badgeLabel: { fontSize: 12, fontWeight: 'bold', color: '#333', textAlign: 'center', marginBottom: 2 },
  badgeProgress: { fontSize: 10, color: '#888' },
  
  // 모달 스타일
  badgeModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeModalContent: {
    width: '80%',
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
  },
  badgeModalTitle: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  badgeModalSub: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 24 },
  badgeModalButtons: { flexDirection: 'row', width: '100%' },
  badgeModalBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 12 },
  badgeModalBtnPrimary: { backgroundColor: '#000', marginLeft: 10 },
  badgeModalBtnText: { fontSize: 16, fontWeight: 'bold', color: '#888' }
});
