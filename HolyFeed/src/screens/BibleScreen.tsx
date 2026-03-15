import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, Modal, SafeAreaView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useStore, VerseRef } from '../store/useStore';
import Icon from 'react-native-vector-icons/Ionicons';
import bibleData from '../data/bible.json';

const BIBLE: any = bibleData;

const HIGHLIGHT_COLORS = ['transparent', '#EC7480', '#FFB069', '#FFF296', '#9EF0DE', '#85D2FF', '#9884E8'];

const OLD_TESTAMENT_ORDER = [
  '창세기', '출애굽기', '레위기', '민수기', '신명기',
  '여호수아', '사사기', '룻기', '사무엘상', '사무엘하', '열왕기상', '열왕기하', '역대상', '역대하',
  '에스라', '느헤미야', '에스더',
  '욥기', '시편', '잠언', '전도서', '아가',
  '이사야', '예레미야', '예레미야 애가', '에스겔', '다니엘',
  '호세아', '요엘', '아모스', '오바댜', '요나', '미가', '나훔', '하박국', '스바냐', '학개', '스가랴', '말라기'
];

const NEW_TESTAMENT_ORDER = [
  '마태복음', '마가복음', '누가복음', '요한복음', '사도행전',
  '로마서', '고린도전서', '고린도후서', '갈라디아서', '에베소서', '빌립보서', '골로새서',
  '데살로니가전서', '데살로니가후서', '디모데전서', '디모데후서', '디도서', '빌레몬서', '히브리서', '야고보서',
  '베드로전서', '베드로후서', '요한1서', '요한2서', '요한3서', '유다서', '요한계시록'
];

export default function BibleScreen() {
  const navigation = useNavigation<any>();
  const [selectedBook, setSelectedBook] = useState('창세기');
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [testament, setTestament] = useState<'old_testament' | 'new_testament'>('old_testament');
  const [bookProgress, setBookProgress] = useState<Record<string, number>>({}); // bookName -> lastReadChapter
  const [lastReadBook, setLastReadBook] = useState<string | null>(null); // 직전에 보던 성경 저장
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadSavedData = async () => {
      try {
        const [lastReadSaved, progressSaved, prevBookSaved] = await Promise.all([
          AsyncStorage.getItem('lastReadBible'),
          AsyncStorage.getItem('bibleBookProgress'),
          AsyncStorage.getItem('prevReadBook')
        ]);

        if (lastReadSaved) {
          const parsed = JSON.parse(lastReadSaved);
          if (parsed.testament) setTestament(parsed.testament);
          if (parsed.book) setSelectedBook(parsed.book);
          if (parsed.chapter) setSelectedChapter(parsed.chapter);
        }

        if (progressSaved) {
          setBookProgress(JSON.parse(progressSaved));
        }

        if (prevBookSaved) {
          setLastReadBook(prevBookSaved);
        }
      } catch (e) {
        console.error('Failed to load saved bible data', e);
      } finally {
        setIsLoaded(true);
      }
    };
    loadSavedData();
  }, []);

  useEffect(() => {
    if (isLoaded) {
      AsyncStorage.setItem('lastReadBible', JSON.stringify({ testament, book: selectedBook, chapter: selectedChapter }))
        .catch(e => console.error('Failed to save bible state', e));
      
      // 개별 책 진행률 업데이트
      setBookProgress(prev => {
        const currentSaved = prev[selectedBook] || 0;
        if (selectedChapter > currentSaved) {
          const newProgress = { ...prev, [selectedBook]: selectedChapter };
          AsyncStorage.setItem('bibleBookProgress', JSON.stringify(newProgress))
            .catch(e => console.error('Failed to save book progress', e));
          return newProgress;
        }
        return prev;
      });
    }
  }, [selectedBook, selectedChapter, testament, isLoaded]);

  const handleBookSelect = async (book: string, lastChapter: number) => {
    // 현재 보고 있는 책이 새로 선택한 책과 다를 때만 '직전 성경'으로 업데이트
    if (selectedBook !== book) {
      setLastReadBook(selectedBook);
      await AsyncStorage.setItem('prevReadBook', selectedBook);
    }
    
    setSelectedBook(book);
    setSelectedChapter(lastChapter > 0 ? lastChapter : 1);
    setBookSelectorVisible(false);
  };

  const resetBookProgress = async (bookName: string) => {
    const newProgress = { ...bookProgress };
    delete newProgress[bookName];
    setBookProgress(newProgress);
    try {
      await AsyncStorage.setItem('bibleBookProgress', JSON.stringify(newProgress));
      if (selectedBook === bookName) {
        setSelectedChapter(1);
      }
    } catch (e) {
      console.error('Failed to reset progress', e);
    }
  };

  const { likedVerses, toggleLikeVerse } = useStore();
  const [selectedVerseIds, setSelectedVerseIds] = useState<string[]>([]);
  const [highlightedVerses, setHighlightedVerses] = useState<Record<string, string>>({}); // verseId -> color
  const [bookSelectorVisible, setBookSelectorVisible] = useState(false);

  const handleTestamentChange = (newTestament: 'old_testament' | 'new_testament') => {
    setTestament(newTestament);
    if (newTestament === 'old_testament' && !BIBLE['old_testament'][selectedBook]) {
      setSelectedBook('창세기');
      setSelectedChapter(1);
    } else if (newTestament === 'new_testament' && !BIBLE['new_testament'][selectedBook]) {
      setSelectedBook('마태복음');
      setSelectedChapter(1);
    }
  };

  // 책 목록 가져오기 및 순서 정렬
  const rawBooks = Object.keys(BIBLE[testament]);
  const orderArray = testament === 'old_testament' ? OLD_TESTAMENT_ORDER : NEW_TESTAMENT_ORDER;
  
  const books = rawBooks.sort((a, b) => {
    const idxA = orderArray.indexOf(a);
    const idxB = orderArray.indexOf(b);
    if (idxA === -1 && idxB === -1) return a.localeCompare(b);
    if (idxA === -1) return 1;
    if (idxB === -1) return -1;
    return idxA - idxB;
  });

  const currentBookData = BIBLE[testament][selectedBook];
  const currentChapterData = currentBookData?.find((c: any) => c.chapter === selectedChapter);
  const verses = currentChapterData ? Object.entries(currentChapterData.verses).map(([v, text]) => ({ verse: parseInt(v), text: text as string })) : [];

  const handleVersePress = (verse: number) => {
    const verseId = `${selectedBook}_${selectedChapter}_${verse}`;
    setSelectedVerseIds(prev => {
      if (prev.includes(verseId)) {
        return prev.filter(id => id !== verseId);
      }
      return [...prev, verseId];
    });
  };

  const handleHighlight = (color: string) => {
    if (selectedVerseIds.length === 0) return;
    setHighlightedVerses(prev => {
      const updated = { ...prev };
      selectedVerseIds.forEach(id => {
        if (color === 'transparent') {
          delete updated[id];
        } else {
          updated[id] = color;
        }
      });
      return updated;
    });
    setSelectedVerseIds([]);
  };

  const handleLike = () => {
    if (selectedVerseIds.length === 0) return;
    selectedVerseIds.forEach(id => {
      // 이미 좋아요 한 경우 해제 로직을 store에서 자동으로 처리 (toggle)
      toggleLikeVerse(id);
    });
    setSelectedVerseIds([]);
  };

  const handleMeditate = () => {
    if (selectedVerseIds.length === 0) return;
    
    // 여러 구절이 선택된 경우 오름차순(절 번호 기준)으로 정렬
    const sortedVerseIds = [...selectedVerseIds].sort((a, b) => {
      const vA = parseInt(a.split('_')[2]);
      const vB = parseInt(b.split('_')[2]);
      return vA - vB;
    });

    const initialVerses: VerseRef[] = sortedVerseIds.map(id => {
      const [, , v] = id.split('_');
      return {
        book: selectedBook,
        chapter: selectedChapter,
        verse: parseInt(v),
        text: currentChapterData.verses[v]
      };
    });

    setSelectedVerseIds([]);
    navigation.navigate('Editor', { initialVerses });
  };

  const renderVerse = ({ item }: { item: { verse: number, text: string } }) => {
    const verseId = `${selectedBook}_${selectedChapter}_${item.verse}`;
    const isSelected = selectedVerseIds.includes(verseId);
    const isLiked = likedVerses.includes(verseId);
    const highlightColor = highlightedVerses[verseId];
    const isLightColor = highlightColor === '#FFF296' || highlightColor === '#9EF0DE';

    return (
      <View style={styles.verseContainer}>
        <TouchableOpacity 
          onPress={() => handleVersePress(item.verse)}
          style={[styles.verseTouchable, highlightColor && highlightColor !== 'transparent' ? { backgroundColor: highlightColor } : null, isSelected && styles.selectedVerse]}
        >
          <Text style={[
            styles.verseNumber, 
            (highlightColor && highlightColor !== 'transparent' && !isSelected) && { color: isLightColor ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.7)' }
          ]}>
            {item.verse}
          </Text>
          <Text style={[
            styles.verseText, 
            (highlightColor && highlightColor !== 'transparent' && !isSelected) && { color: isLightColor ? '#000' : '#FFF' }
          ]}>
            {item.text}
          </Text>
          {isLiked && (
            <Icon 
              name="heart" 
              size={14} 
              color={(highlightColor && highlightColor !== 'transparent' && !isSelected) ? (isLightColor ? "#FF3040" : "#FFF") : "#FF3040"} 
              style={styles.likeIcon} 
            />
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const calculateTestamentProgress = (t: 'old_testament' | 'new_testament') => {
    const testamentBooks = BIBLE[t];
    let totalChapters = 0;
    let readChapters = 0;

    Object.keys(testamentBooks).forEach(bookName => {
      totalChapters += testamentBooks[bookName].length;
      readChapters += bookProgress[bookName] || 0;
    });

    return Math.floor((readChapters / totalChapters) * 100);
  };

  const renderBookSelector = () => {
    const oldProgress = calculateTestamentProgress('old_testament');
    const newProgress = calculateTestamentProgress('new_testament');

    const content = (
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>성경 선택</Text>
            <TouchableOpacity onPress={() => setBookSelectorVisible(false)}>
              <Icon name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>
          <View style={styles.testamentSelector}>
            <TouchableOpacity onPress={() => handleTestamentChange('old_testament')} style={[styles.testamentBtn, testament === 'old_testament' && styles.testamentBtnActive]}>
              <View style={styles.testamentBtnContent}>
                <Text style={[styles.testamentText, testament === 'old_testament' && styles.testamentTextActive]}>구약</Text>
                <Text style={[styles.testamentPercent, testament === 'old_testament' && styles.testamentTextActive]}>{oldProgress}%</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleTestamentChange('new_testament')} style={[styles.testamentBtn, testament === 'new_testament' && styles.testamentBtnActive]}>
              <View style={styles.testamentBtnContent}>
                <Text style={[styles.testamentText, testament === 'new_testament' && styles.testamentTextActive]}>신약</Text>
                <Text style={[styles.testamentPercent, testament === 'new_testament' && styles.testamentTextActive]}>{newProgress}%</Text>
              </View>
            </TouchableOpacity>
          </View>
          <ScrollView>
            {books.map(book => {
              const bookData = BIBLE[testament][book];
              const lastChapter = bookProgress[book] || 0;
              const totalChapters = bookData?.length || 1;
              const percent = Math.round((lastChapter / totalChapters) * 100);
              const isPrevious = lastReadBook === book; // 직전에 읽던 책인가?
              const isCurrent = selectedBook === book; // 현재 보고 있는 책인가?

              return (
                <View key={book}>
                  <TouchableOpacity 
                    style={[styles.bookListItem, isPrevious && styles.lastReadItem]}
                    onPress={() => handleBookSelect(book, lastChapter)}
                  >
                    <View style={styles.bookListLeft}>
                      <Text style={[styles.bookListText, isCurrent && styles.bookListTextActive]}>{book}</Text>
                      {isPrevious && (
                        <View style={styles.lastBadge}>
                          <Text style={styles.lastBadgeText}>마지막</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.bookListRight}>
                      <View style={styles.unifiedProgress}>
                        <View style={[styles.unifiedProgressFill, { width: `${percent}%` }]} />
                        <Text style={[styles.unifiedProgressText, percent > 50 && { color: '#FFF' }]}>{percent}%</Text>
                      </View>
                      <TouchableOpacity 
                        style={styles.resetBtn} 
                        onPress={() => resetBookProgress(book)}
                      >
                        <Icon name="refresh-outline" size={16} color="#999" />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                </View>
              );
            })}
          </ScrollView>
        </View>
      </View>
    );

    if (Platform.OS === 'web') {
      return bookSelectorVisible ? (
        <View style={[StyleSheet.absoluteFill, { zIndex: 1000 }]}>
          {content}
        </View>
      ) : null;
    }

    return (
      <Modal visible={bookSelectorVisible} animationType="slide" transparent={true}>
        {content}
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 상단 네비게이션바: 책 선택기 및 진행도 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setBookSelectorVisible(true)} style={styles.bookSelectorBtn}>
          <Text style={styles.headerTitle}>{selectedBook} {selectedChapter}장</Text>
          <Icon name="chevron-down" size={20} color="#000" />
        </TouchableOpacity>
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${Math.round((selectedChapter / (currentBookData?.length || 1)) * 100)}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {Math.round((selectedChapter / (currentBookData?.length || 1)) * 100)}%
          </Text>
        </View>
      </View>

      <FlatList
        data={verses}
        keyExtractor={item => item.verse.toString()}
        renderItem={renderVerse}
        contentContainerStyle={styles.listContent}
      />

      {/* 장 이동 버튼 */}
      <View style={styles.chapterNav}>
        <TouchableOpacity onPress={() => setSelectedChapter(Math.max(1, selectedChapter - 1))} style={styles.navBtn}>
          <Icon name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setSelectedChapter(selectedChapter + 1)} style={styles.navBtn}>
          <Icon name="chevron-forward" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* 다중 선택 액션 메뉴 (하단 플로팅 바) */}
      {selectedVerseIds.length > 0 && (
        <View style={styles.floatingActionBar}>
          <View style={styles.colorPalette}>
            {HIGHLIGHT_COLORS.map(color => (
              <TouchableOpacity 
                key={color} 
                style={[
                  styles.colorCircle, 
                  { backgroundColor: color === 'transparent' ? '#FFF' : color },
                ]} 
                onPress={() => handleHighlight(color)} 
              >
                {color === 'transparent' && (
                  <View style={styles.removeHighlightWrapper}>
                    <View style={styles.diagonalLine} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
              <Icon name="heart-outline" size={22} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.meditateButton]} onPress={handleMeditate}>
              <Text style={[styles.actionText, { color: '#fff' }]}>묵상하기 ({selectedVerseIds.length})</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 책 선택 모달 */}
      {renderBookSelector()}
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
    justifyContent: 'space-between',
    padding: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    alignItems: 'center',
  },
  bookSelectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 4,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 100, // 전체 길이 조정
  },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#EAEAEA',
    borderRadius: 3,
    marginRight: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#000', // 검은색으로 차오름 (포인트 컬러)
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    width: 30, // 퍼센트 텍스트가 흔들리지 않게 고정 폭 설정
    textAlign: 'right',
  },
  listContent: {
    padding: 20,
    paddingBottom: 100, // 여백 확보
  },
  verseContainer: {
    marginBottom: 8,
  },
  verseTouchable: {
    flexDirection: 'row',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  selectedVerse: {
    backgroundColor: '#F9F9F9',
    borderLeftWidth: 3,
    borderLeftColor: '#000',
  },
  verseNumber: {
    fontSize: 12,
    color: '#888',
    marginRight: 8,
    marginTop: 4,
  },
  verseText: {
    fontSize: 16,
    lineHeight: 26,
    flex: 1,
    color: '#111',
  },
  likeIcon: {
    marginLeft: 8,
    marginTop: 4,
  },
  actionMenu: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  colorPalette: {
    flexDirection: 'row',
  },
  colorCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  removeHighlightWrapper: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  diagonalLine: {
    width: '120%',
    height: 2,
    backgroundColor: '#FF3040',
    transform: [{ rotate: '45deg' }],
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
  },
  meditateButton: {
    backgroundColor: '#000',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  actionText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '600',
  },
  chapterNav: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 50,
  },
  navBtn: {
    width: 48,
    height: 48,
    backgroundColor: '#FFF',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 4,
  },
  floatingActionBar: {
    position: 'absolute',
    bottom: 80, // 장 이동 버튼 위에 표시
    left: 16,
    right: 16,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '70%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  testamentSelector: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 4,
  },
  testamentBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  testamentBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '80%',
  },
  testamentBtnActive: {
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  testamentText: {
    color: '#888',
    fontWeight: '600',
  },
  testamentTextActive: {
    color: '#000',
  },
  testamentPercent: {
    fontSize: 12,
    color: '#888',
    fontWeight: 'bold',
  },
  bookListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    borderRadius: 8,
  },
  lastReadItem: {
    backgroundColor: '#F0F7FF',
    borderBottomWidth: 0,
  },
  bookListLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  lastBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  bookListRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unifiedProgress: {
    width: 70,
    height: 18,
    backgroundColor: '#EAEAEA',
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    marginRight: 10,
  },
  unifiedProgressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#000',
  },
  unifiedProgressText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#666',
    zIndex: 1,
  },
  resetBtn: {
    padding: 4,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
  },
  bookListText: {
    fontSize: 16,
    color: '#333',
  },
  bookListTextActive: {
    fontWeight: 'bold',
    color: '#000',
  }
});
