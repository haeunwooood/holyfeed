import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, Image, Alert, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useStore, Post } from '../store/useStore';
import Icon from 'react-native-vector-icons/Ionicons';
import CommentModal from '../components/CommentModal';

export default function FeedScreen() {
  const navigation = useNavigation<any>();
  const { posts, comments, toggleLikePost, likedPosts, deletePost, currentUser, toggleBookmarkPost, bookmarkedPosts } = useStore();
  const [activeTab, setActiveTab] = useState<'All' | 'Following'>('All');
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  const filteredPosts = posts.filter(post => {
    if (activeTab === 'Following') return post.visibility === 'Public'; // Simplified MVP: assume we follow all public for now
    if (activeTab === 'All') return post.visibility === 'Public';
    return true; 
  });

  const renderPost = ({ item }: { item: Post }) => {
    const postCommentsCount = comments.filter(c => c.postId === item.id).length;

    return (
      <TouchableOpacity 
        style={styles.postContainer} 
        activeOpacity={0.9} 
        onPress={() => navigation.navigate('PostDetail', { postId: item.id })}
      >
        {/* Post Header: User info */}
        <View style={styles.postHeader}>
          {item.authorAvatarUrl ? (
            <Image source={{ uri: item.authorAvatarUrl }} style={{ width: 40, height: 40, borderRadius: 20, marginRight: 12 }} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.authorName[0]}</Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.authorName}>{item.authorName}</Text>
            <Text style={styles.postTime}>
              {new Date(item.createdAt).toLocaleDateString()} · {item.visibility === 'Public' ? '전체' : '목장'}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.moreOptionsBtn} 
            onPress={(e) => {
              if (Platform.OS === 'web') e.stopPropagation();
              if (item.authorId === currentUser?.id) {
                if (Platform.OS === 'web') {
                  const confirmDelete = window.confirm('묵상을 삭제하시겠습니까?');
                  if (confirmDelete) deletePost(item.id);
                } else {
                  Alert.alert('묵상 관리', '어떤 작업을 하시겠습니까?', [
                    { text: '삭제', style: 'destructive', onPress: () => deletePost(item.id) },
                    { text: '취소', style: 'cancel' }
                  ]);
                }
              } else {
                if (Platform.OS === 'web') {
                  window.alert('게시글 신고 또는 차단 기능은 준비 중입니다.');
                } else {
                  Alert.alert('옵션', '게시글 신고 또는 차단 기능은 준비 중입니다.', [{ text: '확인' }]);
                }
              }
            }}
          >
            <Icon name="ellipsis-horizontal" size={20} color="#888" />
          </TouchableOpacity>
        </View>

        {/* Selected Verse Citation */}
        {item.verses && item.verses.length > 0 && (
          <View style={styles.citationCard}>
            <Icon name="book" size={14} color="#666" style={{ marginRight: 6, marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.citationText} numberOfLines={3}>
                "{item.verses.map((v, idx) => (
                  <React.Fragment key={idx}>
                    {v.text}
                    <Text style={styles.superscript}> {v.verse}</Text>
                    {idx < item.verses.length - 1 ? ' ' : ''}
                  </React.Fragment>
                ))}"
              </Text>
              <Text style={styles.citationRef}>
                - {item.verses[0].book} {item.verses[0].chapter}장 {
                  item.verses.length > 1 
                    ? `${[...item.verses].sort((a,b)=>a.verse-b.verse)[0].verse}~${[...item.verses].sort((a,b)=>a.verse-b.verse)[item.verses.length-1].verse}`
                    : item.verses[0].verse
                }절
              </Text>
            </View>
          </View>
        )}

        {/* Post Content */}
        <Text style={styles.postTitle}>{item.title}</Text>
        <Text style={styles.postContent}>{item.content}</Text>

        {/* Post Actions (Like, Comment) */}
        <View style={styles.postActions}>
          <TouchableOpacity 
            style={styles.actionBtn} 
            onPress={(e) => {
              if (Platform.OS === 'web') e.stopPropagation();
              toggleLikePost(item.id);
            }}
          >
            <Icon name={likedPosts.includes(item.id) ? "heart" : "heart-outline"} size={22} color={likedPosts.includes(item.id) ? "#FF3040" : "#333"} />
            <Text style={[styles.actionBtnText, likedPosts.includes(item.id) && { color: '#FF3040', fontWeight: 'bold' }]}>
              {item.likes > 0 ? item.likes : ''}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionBtn} 
            onPress={(e) => {
              if (Platform.OS === 'web') e.stopPropagation();
              setSelectedPostId(item.id);
            }}
          >
            <Icon name="chatbubble-outline" size={20} color="#333" />
            <Text style={styles.actionBtnText}>
              댓글 {postCommentsCount > 0 && postCommentsCount}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionBtn, { marginLeft: 'auto', marginRight: 0 }]} 
            onPress={(e) => {
              if (Platform.OS === 'web') e.stopPropagation();
              toggleBookmarkPost(item.id);
            }}
          >
            <Icon 
              name={bookmarkedPosts.includes(item.id) ? "bookmark" : "bookmark-outline"} 
              size={22} 
              color={bookmarkedPosts.includes(item.id) ? "#000" : "#333"} 
            />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Tabs */}
      <View style={styles.header}>
        <Text style={styles.logoText}>HolyFeed</Text>
        <View style={styles.tabsContainer}>
          <TouchableOpacity onPress={() => setActiveTab('All')} style={[styles.tabBtn, activeTab === 'All' && styles.tabBtnActive]}>
            <Text style={[styles.tabText, activeTab === 'All' && styles.tabTextActive]}>추천</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveTab('Following')} style={[styles.tabBtn, activeTab === 'Following' && styles.tabBtnActive]}>
            <Text style={[styles.tabText, activeTab === 'Following' && styles.tabTextActive]}>팔로잉</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Feed List */}
      <FlatList
        data={filteredPosts}
        keyExtractor={item => item.id}
        renderItem={renderPost}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="document-text-outline" size={48} color="#CCC" />
            <Text style={styles.emptyText}>아직 나누어진 묵상이 없습니다.</Text>
            <Text style={styles.emptySubText}>첫 번째 묵상을 남겨보세요!</Text>
          </View>
        }
      />

      {/* 글쓰기 플로팅 버튼 */}
      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => navigation.navigate('Editor')}
      >
        <Icon name="pencil" size={24} color="#FFF" />
      </TouchableOpacity>

      {/* 댓글 모달 */}
      <CommentModal 
        visible={!!selectedPostId} 
        postId={selectedPostId || ''} 
        onClose={() => setSelectedPostId(null)} 
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EAEAEA',
  },
  logoText: {
    fontSize: 24,
    fontWeight: '900',
    fontStyle: 'italic',
    marginBottom: 16,
    color: '#000',
  },
  tabsContainer: {
    flexDirection: 'row',
  },
  tabBtn: {
    marginRight: 20,
    paddingBottom: 8,
  },
  tabBtnActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#000',
  },
  tabText: {
    fontSize: 16,
    color: '#888',
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#000',
    fontWeight: 'bold',
  },
  listContent: {
    paddingVertical: 10,
    paddingBottom: 100, // 글쓰기 버튼이 북마크를 가리지 않도록 하단 여백 추가
  },
  postContainer: {
    backgroundColor: '#FFF',
    marginBottom: 10,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EAEAEA',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  authorName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#111',
  },
  postTime: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  moreOptionsBtn: {
    marginLeft: 'auto',
    padding: 8,
  },
  citationCard: {
    flexDirection: 'row',
    backgroundColor: '#F7F7F7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#000',
  },
  citationText: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
    marginBottom: 6,
    fontStyle: 'italic',
  },
  superscript: {
    fontSize: 9,
    color: '#999',
    fontWeight: 'bold',
  },
  citationRef: {
    fontSize: 12,
    color: '#888',
    fontWeight: '600',
  },
  postTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  postContent: {
    fontSize: 15,
    color: '#222',
    lineHeight: 24,
    marginBottom: 20,
  },
  postActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 16,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 6,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  }
});
