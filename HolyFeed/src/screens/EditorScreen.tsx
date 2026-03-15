import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useStore, VerseRef } from '../store/useStore';
import Icon from 'react-native-vector-icons/Ionicons';

export default function EditorScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const initialVerses: VerseRef[] = route.params?.initialVerses || [];

  const { addPost } = useStore();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<'Public' | 'Group' | 'Private'>('Public');

  const handlePublish = async () => {
    if (!title.trim() || !content.trim()) return;

    await addPost({
      authorId: 'user_123', // This will be overwritten by useStore
      authorName: '사용자',
      title,
      content,
      verses: initialVerses,
      visibility,
    });

    navigation.navigate('Main', { screen: 'Feed' });
  };

  const renderVerses = () => {
    if (initialVerses.length === 0) return null;

    // 장/절 텍스트 합치기 (예: 1장 1~2절)
    const book = initialVerses[0].book;
    const chapter = initialVerses[0].chapter;
    const sortedVerses = [...initialVerses].sort((a, b) => a.verse - b.verse);
    const verseRange = sortedVerses.length > 1 
      ? `${sortedVerses[0].verse}~${sortedVerses[sortedVerses.length - 1].verse}`
      : `${sortedVerses[0].verse}`;

    return (
      <View style={styles.verseCard}>
        <Icon name="book" size={16} color="#888" style={styles.verseIcon} />
        <View style={{ flex: 1 }}>
          <Text style={styles.verseCardText}>
            {sortedVerses.map((v, idx) => (
              <React.Fragment key={idx}>
                {v.text}
                <Text style={styles.superscript}> {v.verse}</Text>
                {idx < sortedVerses.length - 1 ? ' ' : ''}
              </React.Fragment>
            ))}
          </Text>
          <Text style={styles.verseCardRef}>{book} {chapter}장 {verseRange}절</Text>
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
          <Text style={styles.headerTitle}>새 묵상 쓰기</Text>
          <TouchableOpacity onPress={handlePublish} disabled={!title.trim() || !content.trim()}>
            <Text style={[styles.publishBtn, (!title.trim() || !content.trim()) && styles.publishBtnDisabled]}>
              발행
            </Text>
          </TouchableOpacity>
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
    fontStyle: 'italic',
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
  }
});
