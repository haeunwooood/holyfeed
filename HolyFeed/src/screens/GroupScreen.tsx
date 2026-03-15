import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, FlatList, TextInput, Image, Alert, Platform } from 'react-native';
import { useStore, Post } from '../store/useStore';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import * as Linking from 'expo-linking';
import CommentModal from '../components/CommentModal';

export default function GroupScreen() {
  const navigation = useNavigation<any>();
  const { posts, comments, currentUser, toggleLikePost, likedPosts, deletePost, toggleBookmarkPost, bookmarkedPosts } = useStore();
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  // 현재 속한 그룹의 게시물 필터링
  const groupPosts = posts.filter(post => post.visibility === 'Group');

  const copyInviteLink = () => {
    // 실제 딥링크 생성 로직
    const groupId = currentUser?.group_id || 'test-group-id';
    const link = Linking.createURL('/', { queryParams: { groupId } });
    if (typeof window !== 'undefined') alert(`초대 링크 복사 완료:\n${link}`);
  };

  const renderPost = ({ item }: { item: Post }) => {
    const postCommentsCount = comments.filter(c => c.postId === item.id).length;
    return (
      <TouchableOpacity 
        style={styles.postContainer}
        activeOpacity={0.9}
        onPress={() => navigation.navigate('PostDetail', { postId: item.id })}
      >
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
            <Text style={styles.postTime}>{new Date(item.createdAt).toLocaleDateString()} · 목장</Text>
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

        <Text style={styles.postTitle}>{item.title}</Text>
        <Text style={styles.postContent}>{item.content}</Text>

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

  if (!currentUser?.church_id) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Icon name="business-outline" size={64} color="#CCC" />
          <Text style={styles.emptyTitle}>소속된 교회가 없습니다.</Text>
          <Text style={styles.emptySubTitle}>교회에 등록하거나 목장에 초대받아보세요.</Text>
          <TouchableOpacity style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>교회 검색하기</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.churchName}>온누리교회</Text>
          <Text style={styles.groupName}>청년 1부 3목장</Text>
        </View>
        <TouchableOpacity style={styles.inviteBtn} onPress={copyInviteLink}>
          <Icon name="person-add-outline" size={16} color="#000" style={{ marginRight: 6 }} />
          <Text style={styles.inviteText}>초대하기</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={groupPosts}
        keyExtractor={item => item.id}
        renderItem={renderPost}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyFeed}>
            <Text style={styles.emptyFeedText}>목장에 작성된 묵상이 없습니다.</Text>
          </View>
        }
      />

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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EAEAEA',
  },
  churchName: { fontSize: 13, color: '#666', marginBottom: 4 },
  groupName: { fontSize: 22, fontWeight: 'bold', color: '#000' },
  inviteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 20,
    backgroundColor: '#F9F9F9'
  },
  inviteText: { fontSize: 13, fontWeight: 'bold', color: '#000' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#000', marginTop: 16, marginBottom: 8 },
  emptySubTitle: { fontSize: 14, color: '#666', marginBottom: 24, textAlign: 'center' },
  primaryBtn: { backgroundColor: '#000', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 8 },
  primaryBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  listContent: { paddingVertical: 10 },
  emptyFeed: { padding: 40, alignItems: 'center' },
  emptyFeedText: { fontSize: 14, color: '#999' },
  postContainer: {
    backgroundColor: '#FFF',
    marginBottom: 10,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EAEAEA',
  },
  postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#000',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  avatarText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  authorName: { fontSize: 15, fontWeight: 'bold', color: '#111' },
  postTime: { fontSize: 12, color: '#888', marginTop: 2 },
  moreOptionsBtn: { padding: 4 },
  citationCard: {
    flexDirection: 'row', backgroundColor: '#F7F7F7', padding: 12,
    borderRadius: 8, marginBottom: 16, borderLeftWidth: 3, borderLeftColor: '#000',
  },
  citationText: { fontSize: 14, color: '#444', lineHeight: 20, marginBottom: 6, fontStyle: 'italic' },
  superscript: {
    fontSize: 9,
    color: '#999',
    fontWeight: 'bold',
  },
  citationRef: { fontSize: 12, color: '#888', fontWeight: '600' },
  postTitle: { fontSize: 18, fontWeight: 'bold', color: '#000', marginBottom: 8 },
  postContent: { fontSize: 15, color: '#222', lineHeight: 24, marginBottom: 20 },
  postActions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#F0F0F0', paddingTop: 16 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', marginRight: 24 },
  actionBtnText: { fontSize: 14, fontWeight: '600', color: '#333', marginLeft: 6 },
});
