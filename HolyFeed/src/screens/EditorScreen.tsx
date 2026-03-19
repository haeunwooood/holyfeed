import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useStore, VerseRef } from '../store/useStore';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function EditorScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const editPostId = route.params?.editPostId;
  const [verses, setVerses] = useState<VerseRef[]>(route.params?.initialVerses || []);

  const { addPost, posts, updatePost } = useStore();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<'Public' | 'Group' | 'Private'>('Public');
  const [draftModalVisible, setDraftModalVisible] = useState(false);
  const [savedDraft, setSavedDraft] = useState<any>(null);
  const [saveSuccessModalVisible, setSaveSuccessModalVisible] = useState(false); // 임시저장 성공 모달

  useEffect(() => {
    if (editPostId) {
      // 수정 모드일 때 기존 데이터 불러오기
      const postToEdit = posts.find(p => p.id === editPostId);
      if (postToEdit) {
        setTitle(postToEdit.title);
        setContent(postToEdit.content);
        setVisibility(postToEdit.visibility);
        setVerses(postToEdit.verses || []);
      }
    } else {
      // 새 글 작성 모드일 때 임시저장 확인
      checkDraft();
    }
  }, [editPostId]);

  const checkDraft = async () => {
    try {
      const draft = await AsyncStorage.getItem('postDraft');
      if (draft) {
        setSavedDraft(JSON.parse(draft));
        setDraftModalVisible(true);
      }
    } catch (e) {
      console.error('Failed to load draft', e);
    }
  };

  const saveDraft = async () => {
    if (!title.trim() && !content.trim()) return;
    try {
      await AsyncStorage.setItem('postDraft', JSON.stringify({ title, content, visibility, verses }));
      setSaveSuccessModalVisible(true);
      setTimeout(() => {
        setSaveSuccessModalVisible(false);
      }, 1500); // 1.5초 후 자동 닫힘
    } catch (e) {
      console.error('Failed to save draft', e);
    }
  };

  const loadDraft = () => {
    if (savedDraft) {
      setTitle(savedDraft.title || '');
      setContent(savedDraft.content || '');
      setVisibility(savedDraft.visibility || 'Public');
      setVerses(savedDraft.verses || []);
    }
    setDraftModalVisible(false);
  };

  const deleteDraft = async () => {
    try {
      await AsyncStorage.removeItem('postDraft');
      setDraftModalVisible(false);
    } catch (e) {
      console.error('Failed to delete draft', e);
    }
  };

  const handlePublish = async (e: any) => {
    e.preventDefault(); // 새로고침 방지
    if (!title.trim() || !content.trim()) return;

    if (editPostId) {
      // 게시물 업데이트
      // updatePost 함수가 useStore에 있어야 함 (없다면 추가 필요)
      // 현재 스토어 구조상 addPost만 있다면 update 로직을 추가해야 합니다.
      if (updatePost) {
        await updatePost(editPostId, { title, content, visibility });
      }
    } else {
      // 새 게시물 등록
      await addPost({
        title,
        content,
        verses: verses,
        visibility,
      });
      // 글 발행 시 임시저장 데이터 삭제
      await AsyncStorage.removeItem('postDraft');
    }

    navigation.navigate('Main', { screen: 'Feed' });
  };

  const renderVerses = () => {
    if (verses.length === 0) return null;

    // 장/절 텍스트 합치기
    // Sort verses by book, then chapter, then verse
    const sortedVerses = [...verses].sort((a, b) => {
      if (a.book !== b.book) return a.book.localeCompare(b.book);
      if (a.chapter !== b.chapter) return a.chapter - b.chapter;
      return a.verse - b.verse;
    });

    // Generate formatted reference string (e.g. "요한복음 1장 1절, 2장 1절")
    let referenceString = '';
    const groupedByBookAndChapter: Record<string, Record<number, number[]>> = {};
    
    sortedVerses.forEach(v => {
      if (!groupedByBookAndChapter[v.book]) groupedByBookAndChapter[v.book] = {};
      if (!groupedByBookAndChapter[v.book][v.chapter]) groupedByBookAndChapter[v.book][v.chapter] = [];
      groupedByBookAndChapter[v.book][v.chapter].push(v.verse);
    });

    const bookRefs = Object.entries(groupedByBookAndChapter).map(([book, chapters]) => {
      const chapterRefs = Object.entries(chapters).map(([chapter, verseList]) => {
        // Find consecutive verse ranges
        const ranges: string[] = [];
        let start = verseList[0];
        let prev = start;
        
        for (let i = 1; i <= verseList.length; i++) {
          if (i === verseList.length || verseList[i] !== prev + 1) {
            if (start === prev) {
              ranges.push(`${start}`);
            } else {
              ranges.push(`${start}~${prev}`);
            }
            if (i < verseList.length) {
              start = verseList[i];
              prev = start;
            }
          } else {
            prev = verseList[i];
          }
        }
        return `${chapter}장 ${ranges.join(', ')}절`;
      });
      return `${book} ${chapterRefs.join(', ')}`;
    });

    referenceString = bookRefs.join('; ');

    return (
      <View style={styles.verseCard}>
        <Icon name="book" size={16} color="#888" style={styles.verseIcon} />
        <View style={{ flex: 1 }}>
          <Text style={styles.verseCardText}>
            {sortedVerses.map((v, idx) => {
              // Show chapter number as superscript if it's the first verse of a new chapter or book
              const isNewContext = idx === 0 || sortedVerses[idx - 1].book !== v.book || sortedVerses[idx - 1].chapter !== v.chapter;
              return (
                <React.Fragment key={idx}>
                  <Text style={styles.superscript}>
                    {isNewContext && verses.length > 1 ? `${v.book.substring(0,2)}${v.chapter}:` : ''}{v.verse} 
                  </Text>
                  {v.text}
                  {idx < sortedVerses.length - 1 ? '\n' : ''}
                </React.Fragment>
              );
            })}
          </Text>
          <Text style={styles.verseCardRef}>{referenceString}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="close" size={28} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{editPostId ? '묵상 수정하기' : '새 묵상 쓰기'}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {!editPostId && (
              <TouchableOpacity onPress={saveDraft} style={styles.draftBtn}>
                <Text style={styles.draftBtnText}>임시저장</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={handlePublish} disabled={!title.trim() || !content.trim()}>
              <Text style={[styles.publishBtn, (!title.trim() || !content.trim()) && styles.publishBtnDisabled]}>
                {editPostId ? '수정' : '발행'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {renderVerses()}

          <TextInput
            style={styles.titleInput}
            placeholder="묵상의 제목을 입력하세요"
            placeholderTextColor="#CCC"
            value={title}
            onChangeText={setTitle}
          />
          
          {/* 웹/앱 모두 호환되는 기본 텍스트 영역으로 원복 */}
          <TextInput
            style={styles.bodyInput}
            placeholder="말씀을 통해 깨달은 것을 자유롭게 나누어보세요..."
            placeholderTextColor="#CCC"
            multiline
            value={content}
            onChangeText={setContent}
            textAlignVertical="top"
          />
        </ScrollView>

        <View style={styles.footer}>
          <View style={styles.visibilityToggle}>
            {(['Public', 'Group', 'Private'] as const).map(v => (
              <TouchableOpacity 
                key={v}
                style={[styles.visibilityBtn, visibility === v && styles.visibilityBtnActive]}
                onPress={() => setVisibility(v)}
              >
                <Text style={[styles.visibilityText, visibility === v && styles.visibilityTextActive]}>
                  {v === 'Public' ? '전체 공개' : v === 'Group' ? '목장 공개' : '나만 보기'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* 임시저장 불러오기 모달 (앱 내 표시) */}
      <Modal visible={draftModalVisible} animationType="fade" transparent={true}>
        <View style={styles.badgeModalOverlay}>
          <View style={styles.badgeModalContent}>
            <Text style={styles.badgeModalTitle}>임시저장된 글이 있습니다</Text>
            <Text style={styles.badgeModalSub}>이전에 작성 중이던 묵상을 불러오시겠습니까?</Text>
            <View style={styles.badgeModalButtons}>
              <TouchableOpacity style={styles.badgeModalBtn} onPress={deleteDraft}>
                <Text style={styles.badgeModalBtnText}>아니오 (삭제)</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.badgeModalBtn, styles.badgeModalBtnPrimary]} 
                onPress={loadDraft}
              >
                <Text style={[styles.badgeModalBtnText, { color: '#FFF' }]}>불러오기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 임시저장 성공 모달 */}
      <Modal visible={saveSuccessModalVisible} animationType="fade" transparent={true}>
        <View style={styles.badgeModalOverlay}>
          <View style={styles.badgeModalContent}>
            <Icon name="checkmark-circle" size={48} color="#4CAF50" style={{ marginBottom: 12 }} />
            <Text style={styles.badgeModalTitle}>임시저장 완료</Text>
            <Text style={styles.badgeModalSub}>작성 중인 내용이 저장되었습니다.</Text>
          </View>
        </View>
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
  publishBtn: {
    color: '#007AFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  publishBtnDisabled: {
    color: '#CCC',
  },
  content: {
    padding: 20,
  },
  verseCard: {
    flexDirection: 'row',
    backgroundColor: '#F9F9F9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#000',
  },
  verseIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  verseCardText: {
    fontSize: 15,
    // fontStyle: 'italic', // 기울임 제외
    color: '#333',
    lineHeight: 22,
    marginBottom: 8,
  },
  superscript: {
    fontSize: 10,
    lineHeight: 14,
    color: '#888',
    fontWeight: 'bold',
    textAlignVertical: 'top',
  },
  verseCardRef: {
    fontSize: 13,
    color: '#888',
    fontWeight: '600',
  },
  titleInput: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
  },
  bodyInput: {
    fontSize: 16,
    color: '#111',
    lineHeight: 24,
    minHeight: 200,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    backgroundColor: '#FAFAFA',
  },
  visibilityToggle: {
    flexDirection: 'row',
    backgroundColor: '#EEE',
    borderRadius: 8,
    padding: 4,
  },
  visibilityBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  visibilityBtnActive: {
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 2,
  },
  visibilityText: {
    fontSize: 13,
    color: '#888',
    fontWeight: '500',
  },
  visibilityTextActive: {
    color: '#000',
    fontWeight: 'bold',
  },
  draftBtn: {
    marginRight: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#F0F0F0',
    borderRadius: 14,
  },
  draftBtnText: {
    color: '#555',
    fontSize: 14,
    fontWeight: '600',
  },
  badgeModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  badgeModalContent: {
    width: '80%',
    maxWidth: 340,
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    elevation: 5,
    ...(Platform.OS === 'web' ? {
      boxShadow: '0px 10px 20px rgba(0, 0, 0, 0.2)'
    } : {
      shadowColor: '#000',
      shadowOpacity: 0.2,
      shadowOffset: { width: 0, height: 10 },
      shadowRadius: 20,
    })
  },
  badgeModalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 8, textAlign: 'center' },
  badgeModalSub: { fontSize: 15, color: '#666', textAlign: 'center', marginBottom: 24 },
  badgeModalButtons: { flexDirection: 'row', width: '100%' },
  badgeModalBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 12, backgroundColor: '#F5F5F5' },
  badgeModalBtnPrimary: { backgroundColor: '#000', marginLeft: 10 },
  badgeModalBtnText: { fontSize: 15, fontWeight: 'bold', color: '#666' }
});
