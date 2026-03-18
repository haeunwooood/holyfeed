import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState, useEffect,useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, Modal, SafeAreaView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useStore, VerseRef } from '../store/useStore';
import Icon from 'react-native-vector-icons/Ionicons';
import bibleData from '../data/bible.json';
import Footer from '../components/Footer';

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
  const { likedVerses, toggleLikeVerse } = useStore();
  const [selectedVerseIds, setSelectedVerseIds] = useState<string[]>([]);
  const [highlightedVerses, setHighlightedVerses] = useState<Record<string, string>>({}); // verseId -> color
  const [bookSelectorVisible, setBookSelectorVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [initialScrollIndex, setInitialScrollIndex] = useState<number | null>(null); // 복원할 스크롤 위치 (인덱스)
  const [nextChapterModalVisible, setNextChapterModalVisible] = useState(false);
  const [nextBookInfo, setNextBookInfo] = useState<{ book: string, testament: 'old_testament' | 'new_testament' } | null>(null);
  const [fontSize, setFontSize] = useState(16); // 폰트 크기 상태 추가
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const loadSavedData = async () => {
      try {
        const [lastReadSaved, savedFontSize] = await Promise.all([
          AsyncStorage.getItem('lastReadBible'),
          AsyncStorage.getItem('bibleFontSize')
        ]);

        if (lastReadSaved) {
          const parsed = JSON.parse(lastReadSaved);
          if (parsed.testament) setTestament(parsed.testament);
          if (parsed.book) setSelectedBook(parsed.book);
          if (parsed.chapter) setSelectedChapter(parsed.chapter);
          if (parsed.scrollIndex !== undefined) setInitialScrollIndex(parsed.scrollIndex);
        }

        if (savedFontSize) {
          setFontSize(parseInt(savedFontSize, 10));
        }
      } catch (e) {
        console.error('Failed to load saved bible data', e);
      } finally {
        setIsLoaded(true);
      }
    };
    loadSavedData();
  }, []);

  // 스크롤 위치 저장 핸들러
  const handleScroll = (event: any) => {
    if (!isLoaded || verses.length === 0) return;
    
    // 대략적인 렌더링 아이템의 높이를 가정하여 현재 화면 상단의 아이템 인덱스 계산
    // (더 정확한 위치를 위해서는 onViewableItemsChanged를 사용하는 것이 좋으나, 
    // 성능 문제나 복잡성 고려 시 간단한 스크롤 오프셋 기반 인덱스 추정이 많이 쓰입니다)
    const yOffset = event.nativeEvent.contentOffset.y;
    // 항목 하나의 대략적인 높이 (패딩, 마진 포함)를 60 정도로 가정
    const estimatedItemHeight = 60; 
    const currentIndex = Math.max(0, Math.floor(yOffset / estimatedItemHeight));
    
    // 상태에 저장하지 않고 비동기로 바로 스토리지에 업데이트하여 렌더링 성능 저하 방지
    AsyncStorage.setItem('lastReadBible', JSON.stringify({ 
      testament, 
      book: selectedBook, 
      chapter: selectedChapter,
      scrollIndex: currentIndex
    })).catch(e => console.error('Failed to save bible scroll state', e));
  };

  useEffect(() => {
    if (isLoaded) {
      AsyncStorage.setItem('lastReadBible', JSON.stringify({ testament, book: selectedBook, chapter: selectedChapter }))
        .catch(e => console.error('Failed to save bible state', e));
    }
  }, [selectedBook, selectedChapter, testament, isLoaded]);

  // 성경이나 장이 변경될 때 선택된 구절 초기화 및 스크롤 위치 복원
  useEffect(() => {
    if (isLoaded) {
      setSelectedVerseIds([]);
      
      // 처음 로드될 때 저장된 인덱스가 있다면 해당 위치로, 아니면 맨 위로
      if (initialScrollIndex !== null) {
        // FlatList가 렌더링될 시간을 약간 주기 위해 setTimeout 사용
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({ index: initialScrollIndex, animated: false });
          setInitialScrollIndex(null); // 한 번 복원 후 초기화
        }, 100);
      } else {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
      }
    }
  }, [selectedBook, selectedChapter, isLoaded]);

  const handleFontSizeChange = async (delta: number) => {
    const newSize = Math.max(12, Math.min(30, fontSize + delta)); // 12~30 범위 제한
    setFontSize(newSize);
    try {
      await AsyncStorage.setItem('bibleFontSize', newSize.toString());
    } catch (e) {
      console.error('Failed to save font size', e);
    }
  };

  const handleBookSelect = async (book: string) => {
    // 현재 보고 있는 책이 새로 선택한 책과 다를 때만 '직전 성경'으로 업데이트
    // if (selectedBook !== book) {
    //   setLastReadBook(selectedBook);
    //   await AsyncStorage.setItem('prevReadBook', selectedBook);
    // }
    
    setSelectedBook(book);
    setSelectedChapter(1); // Always start at chapter 1 when selecting a new book
    setBookSelectorVisible(false);
  };

  // const resetBookProgress = async (bookName: string) => {
  //   const newProgress = { ...bookProgress };
  //   delete newProgress[bookName];
  //   setBookProgress(newProgress);
  //   try {
  //     await AsyncStorage.setItem('bibleBookProgress', JSON.stringify(newProgress));
  //     if (selectedBook === bookName) {
  //       setSelectedChapter(1);
  //     }
  //   } catch (e) {
  //     console.error('Failed to reset progress', e);
  //   }
  // };

  // const { likedVerses, toggleLikeVerse } = useStore();
  // const [selectedVerseIds, setSelectedVerseIds] = useState<string[]>([]);
  // const [highlightedVerses, setHighlightedVerses] = useState<Record<string, string>>({}); // verseId -> color
  // const [bookSelectorVisible, setBookSelectorVisible] = useState(false);

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

  const handlePrevChapter = () => {
    if (selectedChapter > 1) {
      setSelectedChapter(selectedChapter - 1);
    } else {
      // 이전 책 찾기
      const currentBookIndex = orderArray.indexOf(selectedBook);
      let prevBook = null;
      let prevTestament = testament;
      let prevBookMaxChapter = 1;

      if (currentBookIndex > 0) {
        prevBook = orderArray[currentBookIndex - 1];
      } else if (testament === 'new_testament') {
        prevTestament = 'old_testament';
        prevBook = OLD_TESTAMENT_ORDER[OLD_TESTAMENT_ORDER.length - 1]; // 말라기
      }

      if (prevBook) {
        const prevBookData = BIBLE[prevTestament][prevBook];
        prevBookMaxChapter = prevBookData?.length || 1;
        setTestament(prevTestament);
        setSelectedBook(prevBook);
        setSelectedChapter(prevBookMaxChapter); // 이전 책의 마지막 장으로 이동
      } else {
        // 성경 전체 처음 (창세기 1장)
        console.log('성경의 첫 장입니다.');
      }
    }
  };

  // const handlePrevChapter = () => {
  //   if (selectedChapter > 1) {
  //     setSelectedChapter(selectedChapter - 1);
  //   } else {
  //     // 이전 책 찾기
  //     const currentBookIndex = orderArray.indexOf(selectedBook);
  //     let prevBook = null;
  //     let prevTestament = testament;

  //     if (currentBookIndex > 0) {
  //       prevBook = orderArray[currentBookIndex - 1];
  //     } else if (testament === 'new_testament') {
  //       prevTestament = 'old_testament';
  //       prevBook = OLD_TESTAMENT_ORDER[OLD_TESTAMENT_ORDER.length - 1];
  //     }

  //     if (prevBook) {
  //       setTestament(prevTestament);
  //       setSelectedBook(prevBook);
  //       const prevBookData = BIBLE[prevTestament][prevBook];
  //       setSelectedChapter(prevBookData?.length || 1); // 이전 성경의 마지막 장으로 이동
  //     } else {
  //       console.log('성경의 첫 장입니다.');
  //     }
  //   }
  // };

  const handleNextChapter = () => {
    const currentBookMaxChapter = currentBookData?.length || 1;
    if (selectedChapter < currentBookMaxChapter) {
      setSelectedChapter(selectedChapter + 1);
    } else {
      // 다음 책 찾기
      const currentBookIndex = orderArray.indexOf(selectedBook);
      let nextBook = null;
      let nextTestament = testament;

      if (currentBookIndex !== -1 && currentBookIndex < orderArray.length - 1) {
        nextBook = orderArray[currentBookIndex + 1];
      } else if (testament === 'old_testament') {
        nextTestament = 'new_testament';
        nextBook = NEW_TESTAMENT_ORDER[0];
      }

      if (nextBook) {
        setNextBookInfo({ book: nextBook, testament: nextTestament });
        setNextChapterModalVisible(true);
      } else {
        // 성경 전체 마지막 (요한계시록 마지막 장)
        console.log('성경의 마지막 장입니다.');
      }
    }
  };

  const confirmNextBook = () => {
    if (nextBookInfo) {
      setTestament(nextBookInfo.testament);
      setSelectedBook(nextBookInfo.book);
      setSelectedChapter(1);
      setNextChapterModalVisible(false);
      setNextBookInfo(null);
    }
  };

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
            (highlightColor && highlightColor !== 'transparent' && !isSelected) && { color: isLightColor ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.7)' },
            { fontSize: fontSize - 4 } // 절 번호도 동적으로 크기 조절
          ]}>
            {item.verse}
          </Text>
          <Text style={[
            styles.verseText, 
            (highlightColor && highlightColor !== 'transparent' && !isSelected) && { color: isLightColor ? '#000' : '#FFF' },
            { fontSize: fontSize, lineHeight: fontSize * 1.6 } // 본문 폰트 크기 및 줄간격 동적 반영
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

  // const calculateTestamentProgress = (t: 'old_testament' | 'new_testament') => {
  //   const testamentBooks = BIBLE[t];
  //   let totalChapters = 0;
  //   let readChapters = 0;

  //   Object.keys(testamentBooks).forEach(bookName => {
  //     totalChapters += testamentBooks[bookName].length;
  //     readChapters += bookProgress[bookName] || 0;
  //   });

  //   return Math.floor((readChapters / totalChapters) * 100);
  // };

  const renderBookSelector = () => {
    // const oldProgress = calculateTestamentProgress('old_testament');
    // const newProgress = calculateTestamentProgress('new_testament');

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
                {/* <Text style={[styles.testamentPercent, testament === 'old_testament' && styles.testamentTextActive]}>{oldProgress}%</Text> */}
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleTestamentChange('new_testament')} style={[styles.testamentBtn, testament === 'new_testament' && styles.testamentBtnActive]}>
              <View style={styles.testamentBtnContent}>
                <Text style={[styles.testamentText, testament === 'new_testament' && styles.testamentTextActive]}>신약</Text>
                {/* <Text style={[styles.testamentPercent, testament === 'new_testament' && styles.testamentTextActive]}>{newProgress}%</Text> */}
              </View>
            </TouchableOpacity>
          </View>
          <ScrollView>
            {books.map(book => {
              const bookData = BIBLE[testament][book];
              // const lastChapter = bookProgress[book] || 0;
              // const totalChapters = bookData?.length || 1;
              // const percent = Math.round((lastChapter / totalChapters) * 100);
              // const isPrevious = lastReadBook === book; // 직전에 읽던 책인가?
              const isCurrent = selectedBook === book; // 현재 보고 있는 책인가?

              return (
                <View key={book}>
                  <TouchableOpacity 
                    style={[styles.bookListItem]}
                    onPress={() => handleBookSelect(book)}
                  >
                    <View style={styles.bookListLeft}>
                      <Text style={[styles.bookListText, isCurrent && styles.bookListTextActive]}>{book}</Text>
                    </View>
                    <View style={styles.bookListRight}>
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
      {/* 상단 네비게이션바: 책 선택기 및 글꼴 제어 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setBookSelectorVisible(true)} style={styles.bookSelectorBtn}>
          <Text style={styles.headerTitle}>{selectedBook} {selectedChapter}장</Text>
          <Icon name="chevron-down" size={20} color="#000" />
        </TouchableOpacity>
        
        <View style={styles.fontControlContainer}>
          <TouchableOpacity style={styles.fontBtn} onPress={() => handleFontSizeChange(-1)}>
            <Icon name="remove" size={16} color="#333" />
          </TouchableOpacity>
          <Text style={styles.fontText}>{fontSize}</Text>
          <TouchableOpacity style={styles.fontBtn} onPress={() => handleFontSizeChange(1)}>
            <Icon name="add" size={16} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={verses}
        keyExtractor={item => item.verse.toString()}
        renderItem={renderVerse}
        contentContainerStyle={styles.listContent}
        onScroll={handleScroll}
        scrollEventThrottle={16} // 스크롤 이벤트 발생 주기 (ms)
        onScrollToIndexFailed={(info) => {
          // 인덱스 위치를 찾지 못했을 때의 예외 처리
          const wait = new Promise(resolve => setTimeout(resolve, 100));
          wait.then(() => {
            flatListRef.current?.scrollToIndex({ index: info.index, animated: true });
          });
        }}
      />

      {/* 장 이동 버튼 (좌우 분리) */}
      <TouchableOpacity 
        onPress={handlePrevChapter} 
        style={[styles.navBtn, styles.navBtnLeft]}
      >
        <Icon name="chevron-back" size={24} color="#000" />
      </TouchableOpacity>
      
      <TouchableOpacity 
        onPress={handleNextChapter} 
        style={[styles.navBtn, styles.navBtnRight]}
      >
        <Icon name="chevron-forward" size={24} color="#000" />
      </TouchableOpacity>

      {/* 다중 선택 액션 메뉴 (하단 플로팅 바) */}
      {selectedVerseIds.length > 0 && (
        <View style={styles.floatingActionBar}>
          <View style={styles.floatingActionTopRow}>
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
            <TouchableOpacity style={styles.actionLikeBtn} onPress={handleLike}>
              <Icon name="heart-outline" size={36} color="#000" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.floatingActionDivider} />

          <View style={styles.bottomActionRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setSelectedVerseIds([])}>
              <Text style={styles.cancelBtnText}>선택해제</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.meditateButton]} onPress={handleMeditate}>
              <Text style={[styles.actionText, { color: '#fff' }]}>묵상하기 ({selectedVerseIds.length})</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 책 선택 모달 */}
      {renderBookSelector()}

      {/* 다음 권 이동 모달 */}
      <Modal visible={nextChapterModalVisible} animationType="fade" transparent={true}>
        <View style={styles.nextBookModalOverlay}>
          <View style={styles.nextBookModalContent}>
            <Text style={styles.nextBookModalTitle}>{selectedBook} 마지막 장입니다.</Text>
            <Text style={styles.nextBookModalSub}>다음 {nextBookInfo?.book} 1장으로 이동할까요?</Text>
            <View style={styles.nextBookModalButtons}>
              <TouchableOpacity 
                style={styles.nextBookModalBtn} 
                onPress={() => setNextChapterModalVisible(false)}
              >
                <Text style={styles.nextBookModalBtnText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.nextBookModalBtn, styles.nextBookModalBtnPrimary]} 
                onPress={confirmNextBook}
              >
                <Text style={[styles.nextBookModalBtnText, { color: '#FFF' }]}>확인</Text>
              </TouchableOpacity>
            </View>
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
  fontControlContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  fontBtn: {
    padding: 4,
  },
  fontText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginHorizontal: 12,
    width: 20,
    textAlign: 'center',
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
    paddingBottom: 280, // Increase padding to make space for floating action bar and chapter nav
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
  // 불필요한 기존 actionMenu 등 삭제
  colorPalette: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  colorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginRight: 10,
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
  // 장 이동 버튼 (공통)
  navBtn: {
    position: 'absolute',
    top: '50%', // 세로 중앙
    marginTop: -24, // 높이의 절반만큼 위로 올려서 정확한 중앙 정렬
    width: 48,
    height: 48,
    backgroundColor: '#FFF',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    zIndex: 10,
    ...(Platform.OS === 'web' ? {
      boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.15)'
    } : {
      shadowColor: '#000',
      shadowOpacity: 0.15,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 8,
    })
  },
  // 왼쪽 버튼 (절반만 보이게)
  navBtnLeft: {
    left: -20, // 너비의 절반만큼 왼쪽으로 뺌
  },
  // 오른쪽 버튼 (절반만 보이게)
  navBtnRight: {
    right: -20, // 너비의 절반만큼 오른쪽으로 뺌
  },
  // 플로팅 액션 바 스타일
  floatingActionBar: {
    position: 'absolute',
    bottom: 100, // 장 이동 버튼(bottom 90 + 높이 48 + 여백) 위에 표시
    left: 20,
    right: 20,
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'column',
    elevation: 6,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    ...(Platform.OS === 'web' ? {
      boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.15)'
    } : {
      shadowColor: '#000',
      shadowOpacity: 0.15,
      shadowOffset: { width: 0, height: 4 },
      shadowRadius: 10,
    })
  },
  floatingActionTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  actionLikeBtn: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingActionDivider: {
    width: '100%',
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 16,
  },
  bottomActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  cancelBtn: {
    flex: 1, // '묵상하기' 버튼과 반반 비율을 맞추기 위함
    paddingVertical: 14, // 묵상하기 버튼과 동일한 패딩
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cancelBtnText: {
    fontSize: 20, // 묵상하기 텍스트 크기와 일치시킴
    fontWeight: 'bold', // 묵상하기 텍스트와 일치시킴
    color: '#666',
  },
  actionButton: {
    flex: 1, // '선택해제' 버튼과 반반 비율을 맞추기 위함
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  meditateButton: {
    backgroundColor: '#000',
    paddingVertical: 14,
    borderRadius: 16,
  },
  actionText: {
    fontSize: 20,
    fontWeight: 'bold',
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
    paddingBottom: 100, // 모달 하단 네비게이션 가려지는 부분 확보
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
    elevation: 2,
    ...(Platform.OS === 'web' ? {
      boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)'
    } : {
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 4,
    })
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
  bookListRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bookListText: {
    fontSize: 16,
    color: '#333',
  },
  bookListTextActive: {
    fontWeight: 'bold',
    color: '#000',
  },
  // 모달 스타일 (다음 책 이동)
  nextBookModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  nextBookModalContent: {
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
  nextBookModalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 8, textAlign: 'center' },
  nextBookModalSub: { fontSize: 15, color: '#666', textAlign: 'center', marginBottom: 24 },
  nextBookModalButtons: { flexDirection: 'row', width: '100%' },
  nextBookModalBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 12, backgroundColor: '#F5F5F5' },
  nextBookModalBtnPrimary: { backgroundColor: '#000', marginLeft: 10 },
  nextBookModalBtnText: { fontSize: 15, fontWeight: 'bold', color: '#666' }
});
