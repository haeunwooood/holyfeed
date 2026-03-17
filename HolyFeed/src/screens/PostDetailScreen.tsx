import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, TextInput, Image, Modal, Share } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useStore, Post, Comment } from '../store/useStore';
import Icon from 'react-native-vector-icons/Ionicons';
import { signInWithKakao } from '../lib/supabase';

export default function PostDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const postId = route.params?.postId;

  const { posts, comments, toggleLikePost, likedPosts, addComment, deletePost, currentUser, toggleBookmarkPost, bookmarkedPosts, isAuthenticated } = useStore();
  
  const post = posts.find((p) => p.id === postId);
  const postComments = comments.filter((c) => c.postId === postId);

  // Pagination for comments (3 items per page)
  const [page, setPage] = useState(1);
  const COMMENTS_PER_PAGE = 3;
  
  const visibleComments = postComments.slice(0, page * COMMENTS_PER_PAGE);

  const [commentText, setCommentText] = useState('');
  
  // 수정/삭제 옵션 모달 상태
  const [optionsModalVisible, setOptionsModalVisible] = useState(false);
  
  const handleShare = async (postId: string, postTitle: string) => {
    try {
      await Share.share({
        message: `[HolyFeed] ${postTitle}\n\n묵상을 확인해보세요:\nhttps://holyfeed-haeunwooood.vercel.app/post/${postId}`,
      });
    } catch (error: any) {
      console.error(error.message);
    }
  };

  const handleLoadMore = () => {
    if (visibleComments.length < postComments.length) {
      setPage(page + 1);
    }
  };

  const handlePostComment = () => {
    if (!commentText.trim() || !currentUser) return;
    addComment({
      postId: post!.id,
      authorId: currentUser.id,
      authorName: currentUser.name,
      content: commentText.trim()
    });
    setCommentText('');
  };

  if (!post) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
        </View>
        <Text style={{ textAlign: 'center', marginTop: 50, color: '#999' }}>게시글을 찾을 수 없습니다.</Text>
      </SafeAreaView>
    );
  }

  const renderComment = ({ item }: { item: Comment }) => (
    <View style={styles.commentItem}>
      {item.authorAvatarUrl ? (
        <Image source={{ uri: item.authorAvatarUrl }} style={styles.commentAvatarImage} />
      ) : (
        <View style={styles.commentAvatar}>
          <Text style={styles.commentAvatarText}>{item.authorName[0]}</Text>
        </View>
      )}
      <View style={styles.commentContent}>
        <Text style={styles.commentAuthor}>{item.authorName}</Text>
        <Text style={styles.commentText}>{item.content}</Text>
        <Text style={styles.commentDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
      </View>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.postContainer}>
      <View style={styles.postHeader}>
        {post.authorAvatarUrl ? (
          <Image source={{ uri: post.authorAvatarUrl }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{post.authorName[0]}</Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.authorName}>{post.authorName}</Text>
          <Text style={styles.postTime}>
            {new Date(post.createdAt).toLocaleDateString()} · {post.visibility === 'Public' ? '전체' : '목장'}
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.moreOptionsBtn} 
          onPress={() => {
            if (post.authorId === currentUser?.id) {
              setOptionsModalVisible(true);
            } else {
              console.log('신고 기능 준비 중');
            }
          }}
        >
          <Icon name="ellipsis-horizontal" size={20} color="#888" />
        </TouchableOpacity>
      </View>

      {post.verses && post.verses.length > 0 && (
        <View style={styles.citationCard}>
          <Icon name="book" size={14} color="#666" style={{ marginRight: 6, marginTop: 2 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.citationText}>
              {post.verses.map((v, idx) => (
                <React.Fragment key={idx}>
                  <Text style={styles.superscript}>{v.verse} </Text>
                  {v.text}
                  {idx < post.verses.length - 1 ? '\n' : ''}
                </React.Fragment>
              ))}
            </Text>
            <Text style={styles.citationRef}>
              - {post.verses[0].book} {post.verses[0].chapter}장 {
                post.verses.length > 1 
                  ? `${[...post.verses].sort((a,b)=>a.verse-b.verse)[0].verse}~${[...post.verses].sort((a,b)=>a.verse-b.verse)[post.verses.length-1].verse}`
                  : post.verses[0].verse
              }절
            </Text>
          </View>
        </View>
      )}

      <Text style={styles.postTitle}>{post.title}</Text>
      {isAuthenticated ? (
        <Text style={styles.postContent}>{post.content}</Text>
      ) : (
        <View>
          <Text style={styles.postContent} numberOfLines={5}>{post.content}</Text>
          <View style={styles.loginPromptContainer}>
              <Text style={styles.loginPromptText}>더 많은 내용을 보려면 로그인하세요.</Text>
              <TouchableOpacity style={styles.loginPromptButton} onPress={signInWithKakao}>
                <Icon name="chatbubble" size={16} color="#000" style={{ marginRight: 8 }} />
                <Text style={styles.loginPromptButtonText}>카카오로 계속하기</Text>
              </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.postActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => toggleLikePost(post.id)}>
          <Icon name={likedPosts.includes(post.id) ? "heart" : "heart-outline"} size={22} color={likedPosts.includes(post.id) ? "#FF3040" : "#333"} />
          <Text style={[styles.actionBtnText, likedPosts.includes(post.id) && { color: '#FF3040', fontWeight: 'bold' }]}>
            {post.likes > 0 ? post.likes : ''}
          </Text>
        </TouchableOpacity>
        <View style={styles.actionBtn}>
          <Icon name="chatbubble-outline" size={20} color="#333" />
          <Text style={styles.actionBtnText}>
            댓글 {postComments.length > 0 && postComments.length}
          </Text>
        </View>
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleShare(post.id, post.title)}>
            <Icon name="share-outline" size={22} color="#333" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionBtn, { marginLeft: 'auto', marginRight: 0 }]} 
          onPress={() => toggleBookmarkPost(post.id)}
        >
          <Icon 
            name={bookmarkedPosts.includes(post.id) ? "bookmark" : "bookmark-outline"} 
            size={22} 
            color={bookmarkedPosts.includes(post.id) ? "#000" : "#333"} 
          />
        </TouchableOpacity>
      </View>
      <View style={styles.divider} />
      <Text style={styles.commentsTitle}>댓글 {postComments.length}개</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>묵상 상세</Text>
          <View style={{ width: 24 }} />
        </View>

        <FlatList
          data={visibleComments}
          keyExtractor={(item) => item.id}
          renderItem={renderComment}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={{ paddingBottom: 20 }}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
        />

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="댓글을 입력하세요..."
            placeholderTextColor="#999"
            value={commentText}
            onChangeText={setCommentText}
            multiline
          />
          <TouchableOpacity 
            style={[styles.sendBtn, !commentText.trim() && styles.sendBtnDisabled]} 
            onPress={handlePostComment}
            disabled={!commentText.trim()}
          >
            <Text style={styles.sendBtnText}>등록</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* 옵션 모달 */}
      <Modal visible={optionsModalVisible} animationType="fade" transparent={true}>
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setOptionsModalVisible(false)}
        >
          <View style={styles.optionsModalContent}>
            <TouchableOpacity 
              style={styles.optionBtn}
              onPress={() => {
                setOptionsModalVisible(false);
                navigation.navigate('Editor', { editPostId: post.id });
              }}
            >
              <Icon name="pencil" size={20} color="#000" style={styles.optionIcon} />
              <Text style={styles.optionText}>수정하기</Text>
            </TouchableOpacity>
            
            <View style={styles.optionDivider} />
            
            <TouchableOpacity 
              style={styles.optionBtn}
              onPress={async () => {
                setOptionsModalVisible(false);
                await deletePost(post.id);
                navigation.goBack();
              }}
            >
              <Icon name="trash" size={20} color="#FF3B30" style={styles.optionIcon} />
              <Text style={[styles.optionText, { color: '#FF3B30' }]}>삭제하기</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  postContainer: {
    padding: 20,
    backgroundColor: '#FFF',
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
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  avatarText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  authorName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#000',
  },
  postTime: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  moreOptionsBtn: {
    padding: 4,
  },
  citationCard: {
    flexDirection: 'row',
    backgroundColor: '#F9F9F9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#000',
  },
  citationText: {
    fontSize: 14,
    // fontStyle: 'italic', // 기울임 제외
    color: '#333',
    lineHeight: 22,
    marginBottom: 6,
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
    marginBottom: 12,
  },
  postContent: {
    fontSize: 15,
    color: '#333',
    lineHeight: 24,
    marginBottom: 20,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  actionBtnText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#555',
  },
  divider: {
    height: 1,
    backgroundColor: '#EAEAEA',
    marginVertical: 20,
  },
  commentsTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
  },
  commentItem: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EEE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  commentAvatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  commentAvatarText: {
    color: '#555',
    fontSize: 14,
    fontWeight: 'bold',
  },
  commentContent: {
    flex: 1,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  commentText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 4,
  },
  commentDate: {
    fontSize: 12,
    color: '#999',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    backgroundColor: '#FAFAFA',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#EAEAEA',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
  },
  sendBtn: {
    marginLeft: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#000',
    borderRadius: 20,
  },
  sendBtnDisabled: {
    backgroundColor: '#CCC',
  },
  sendBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 40,
    zIndex: 999,
  },
  optionsModalContent: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: '#FFF',
    borderRadius: 16,
    paddingVertical: 8,
    ...(Platform.OS === 'web' ? {
      boxShadow: '0px 10px 30px rgba(0,0,0,0.2)'
    } : {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.2,
      shadowRadius: 20,
      elevation: 5,
    })
  },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingHorizontal: 20,
  },
  optionIcon: {
    marginRight: 12,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  optionDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
  },
  loginPromptContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    marginTop: -20, // 텍스트와 자연스럽게 겹치게
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  loginPromptText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  loginPromptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE500',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  loginPromptButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#000',
  },
});
