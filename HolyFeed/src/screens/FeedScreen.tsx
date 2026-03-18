import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, Image, Platform, Modal, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useStore, Post } from '../store/useStore';
import Icon from 'react-native-vector-icons/Ionicons';
import CommentModal from '../components/CommentModal';
import Footer from '../components/Footer';
// import PwaInstallBanner from '../components/PwaInstallBanner'; // PWA 배너 비활성화

export default function FeedScreen() {
  const navigation = useNavigation<any>();
  const { posts, comments, toggleLikePost, likedPosts, deletePost, currentUser, toggleBookmarkPost, bookmarkedPosts, fetchPosts, isLoadingPosts, hasMorePosts } = useStore();
  const [activeTab, setActiveTab] = useState<'All' | 'Following'>('All');
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  
  // 수정/삭제 옵션 모달 상태
  const [optionsModalVisible, setOptionsModalVisible] = useState(false);
  const [selectedPostForOptions, setSelectedPostForOptions] = useState<string | null>(null);

  const filteredPosts = posts.filter(post => {
    if (activeTab === 'Following') return post.visibility === 'Public'; // Simplified MVP: assume we follow all public for now
    if (activeTab === 'All') return post.visibility === 'Public';
    return true; 
  });

  const handleLoadMore = () => {
    if (!isLoadingPosts && hasMorePosts) {
      fetchPosts(false);
    }
  };

  const renderFooter = () => {
    if (!isLoadingPosts) {
      return <Footer onPrivacyPress={() => navigation.navigate('PrivacyPolicy')} />;
    }
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="small" color="#000" />
      </View>
    );
  };

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
                setSelectedPostForOptions(item.id);
                setOptionsModalVisible(true);
              } else {
                // 다른 사람 글일 경우 신고 등 기능 (생략 가능)
                console.log('신고 기능 준비 중');
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
                {item.verses.map((v, idx) => (
                  <React.Fragment key={idx}>
                    <Text style={styles.superscript}>{v.verse} </Text>
                    {v.text}
                    {idx < item.verses.length - 1 ? '\n' : ''}
                  </React.Fragment>
                ))}
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
        <Text style={styles.postContent} numberOfLines={5}>{item.content}</Text>

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
        // ListHeaderComponent={<PwaInstallBanner />} // PWA 배너 비활성화
        ListFooterComponent={renderFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
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
                if (selectedPostForOptions) {
                  navigation.navigate('Editor', { editPostId: selectedPostForOptions });
                }
              }}
            >
              <Icon name="pencil" size={20} color="#000" style={styles.optionIcon} />
              <Text style={styles.optionText}>수정하기</Text>
            </TouchableOpacity>
            
            <View style={styles.optionDivider} />
            
            <TouchableOpacity 
              style={styles.optionBtn}
              onPress={() => {
                setOptionsModalVisible(false);
                if (selectedPostForOptions) {
                  // 삭제 확인 모달을 여기서 띄워도 되지만, 단순화를 위해 바로 삭제 (앱 내 경고창 사용 가능)
                  deletePost(selectedPostForOptions);
                }
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
    paddingBottom: 90, // 하단 네비게이션 및 푸터 여유 공간 확보 (원래 100)
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
    // fontStyle: 'italic', // 기울임 제외
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
  loaderContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
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
    bottom: 100, // 하단 플로팅 네비바(60px) + 여백(60px)을 고려하여 위로 띄움
    right: 24,
    width: 46,
    height: 46,
    borderRadius: 28,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    ...(Platform.OS === 'web' ? {
      boxShadow: '0px 3px 4px rgba(0, 0, 0, 0.3)'
    } : {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
    })
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 999,
  },
  optionsModalContent: {
    width: '90%',
    maxWidth: 340,
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
    paddingHorizontal: 24,
  },
  optionIcon: {
    marginRight: 16,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  optionDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
  }
});
