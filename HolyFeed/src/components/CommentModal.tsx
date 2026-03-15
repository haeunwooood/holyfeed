import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import { useStore, Comment } from '../store/useStore';
import Icon from 'react-native-vector-icons/Ionicons';

interface CommentModalProps {
  visible: boolean;
  postId: string;
  onClose: () => void;
}

export default function CommentModal({ visible, postId, onClose }: CommentModalProps) {
  const { comments, addComment, currentUser } = useStore();
  const [content, setContent] = useState('');

  const postComments = comments.filter(c => c.postId === postId);

  const handleSend = () => {
    if (!content.trim() || !currentUser) return;
    
    addComment({
      postId,
      authorId: currentUser.id,
      authorName: currentUser.name,
      content: content.trim()
    });
    setContent('');
  };

  const renderComment = ({ item }: { item: Comment }) => (
    <View style={styles.commentContainer}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.authorName[0]}</Text>
      </View>
      <View style={styles.commentContent}>
        <Text style={styles.authorName}>{item.authorName}</Text>
        <Text style={styles.commentText}>{item.content}</Text>
        <Text style={styles.timeText}>{new Date(item.createdAt).toLocaleDateString()}</Text>
      </View>
    </View>
  );

  const modalContent = (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>댓글</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Icon name="close" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        <FlatList
          data={postComments}
          keyExtractor={item => item.id}
          renderItem={renderComment}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>아직 댓글이 없습니다.</Text>
              <Text style={styles.emptySubText}>첫 번째 댓글을 남겨보세요!</Text>
            </View>
          }
        />

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="댓글을 입력하세요..."
            placeholderTextColor="#999"
            value={content}
            onChangeText={setContent}
            multiline
          />
          <TouchableOpacity 
            style={[styles.sendBtn, !content.trim() && styles.sendBtnDisabled]} 
            onPress={handleSend}
            disabled={!content.trim()}
          >
            <Text style={styles.sendText}>게시</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );

  if (Platform.OS === 'web') {
    return visible ? (
      <View style={[StyleSheet.absoluteFill, { zIndex: 2000 }]}>
        {modalContent}
      </View>
    ) : null;
  }

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      {modalContent}
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  content: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '85%',
    maxWidth: '100%',
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    position: 'relative',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeBtn: {
    position: 'absolute',
    right: 16,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  commentContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  commentContent: {
    flex: 1,
  },
  authorName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 4,
  },
  commentText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 4,
  },
  timeText: {
    fontSize: 11,
    color: '#999',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 120 : 100,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    backgroundColor: '#FFF',
  },
  input: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 14,
    maxHeight: 100,
    minHeight: 40,
    color: '#000',
  },
  sendBtn: {
    marginLeft: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
  sendText: {
    color: '#007AFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#666',
  },
  emptySubText: {
    fontSize: 13,
    color: '#999',
    marginTop: 8,
  }
});
