import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Platform, Text, useWindowDimensions, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import { useStore } from './src/store/useStore';
import { supabase } from './src/lib/supabase';

import BibleScreen from './src/screens/BibleScreen';
import EditorScreen from './src/screens/EditorScreen';
import FeedScreen from './src/screens/FeedScreen';
import LoginScreen from './src/screens/LoginScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import GroupScreen from './src/screens/GroupScreen';
import ComingSoonScreen from './src/screens/ComingSoonScreen';
import AdminScreen from './src/screens/AdminScreen';
import ProfileSetupScreen from './src/screens/ProfileSetupScreen';
import PostDetailScreen from './src/screens/PostDetailScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
          tabBarIcon: ({ color }) => {
          let iconName = '';
          if (route.name === 'Feed') iconName = 'home';
          else if (route.name === 'Group') iconName = 'people';
          else if (route.name === 'Bible') iconName = 'book';
          else if (route.name === 'Profile') iconName = 'person';
          
          return <Icon name={iconName} size={20} color={color} />; // 아이콘 크기 고정 (작게)
        },
        tabBarActiveTintColor: '#000',
        tabBarInactiveTintColor: '#888',
        tabBarLabelStyle: {
          fontSize: 12, // 텍스트 크기
          fontWeight: '600',
          paddingBottom: 0,
          marginTop: 0, // 텍스트를 위로 살짝 끌어올리기
        },

        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#EAEAEA',
          backgroundColor: '#FFF',
          elevation: 0,
          height: Platform.OS === 'ios' ? 85 : 70, // 높이를 더 넉넉하게
          paddingTop: 5,
          paddingBottom: Platform.OS === 'ios' ? 20 : 10, // 안드로이드 하단 여백 추가
        },
      })}
    >
      <Tab.Screen name="Feed" component={FeedScreen} options={{ tabBarLabel: '피드' }} />
      <Tab.Screen name="Bible" component={BibleScreen} options={{ tabBarLabel: '말씀' }} />
      <Tab.Screen name="Group" component={ComingSoonScreen} options={{ tabBarLabel: '우리 목장' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: '마이페이지' }} />
    </Tab.Navigator>
  );
}

export default function App() {
  const { width } = useWindowDimensions();
  const isWebWide = Platform.OS === 'web' && width > 1000;
  
  const { isAuthenticated, setAuthenticated, fetchData, showBadgeModal, newBadge, clearNewBadge } = useStore();
  const [isInitializing, setIsInitializing] = useState(true);
  const [initialRoute, setInitialRoute] = useState<'Main' | 'ProfileSetup'>('Main');

  useEffect(() => {
    // 1. 앱 실행 시 기존 세션 확인
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session).finally(() => setIsInitializing(false));
    });

    // 2. 로그인 상태 변경(로그인 성공, 로그아웃 등) 실시간 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session);
    });

    const handleSession = async (session: any) => {
      if (session?.user) {
        setIsInitializing(true);
        // 이미 DB에 등록된 유저인지 확인
        const { data: user } = await supabase.from('users').select('*').eq('id', session.user.id).single();
        
        let isNew = false;
        let currentUser = user;

        if (!user) {
          // 카카오를 통해 처음 로그인한 유저라면 users 테이블에 프로필 저장
          const newUser = {
             id: session.user.id,
             name: session.user.user_metadata?.name || session.user.user_metadata?.nickname || '새로운 성도',
             avatar_url: session.user.user_metadata?.avatar_url || session.user.user_metadata?.profile_image,
             bio: '성경을 사랑하는 제자',
             role: 'user'
          };
          await supabase.from('users').insert([newUser]);
          currentUser = newUser;
          isNew = true;
          setInitialRoute('ProfileSetup');
        } else {
          setInitialRoute('Main');
        }
        
        setAuthenticated(true, currentUser);
        
        // 로그인 성공 시 서버의 최신 데이터를 한 번 긁어옴
        fetchData();
        setIsInitializing(false);
      } else {
        // 세션이 없으면 로그아웃 상태
        setAuthenticated(false, null);
        setIsInitializing(false);
      }
    };

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (isInitializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.mainWrapper}>
      {isWebWide ? (
        <>
          {/* 왼쪽: 브랜드 소개 영역 */}
          <View style={styles.webLeftGutter}>
            <View style={styles.introContent}>
              <Text style={styles.introLogo}>HolyFeed</Text>
              <Text style={styles.introTitle}>묵상으로 시작하는 하루,{'\n'}건강한 영적 교제</Text>
              <Text style={styles.introSub}>홀리피드에서 매일의 묵상을 기록하고{'\n'}믿음의 사람들과 나누어 보세요.</Text>
              
              <View style={styles.introCard}>
                <Text style={styles.cardEmoji}>📖</Text>
                <View>
                  <Text style={styles.cardTitle}>홀리피드는</Text>
                  <Text style={styles.cardDesc}>말씀 탭에서 성경을 읽고 마음에 닿는 구절을 선택 후 묵상해 보세요.</Text>
                </View>
              </View>
            </View>
          </View>

          {/* 중앙: 앱 본체 */}
          <View style={styles.appContainer}>
            <NavigationContainer>
              <Stack.Navigator 
                screenOptions={{ headerShown: false, presentation: 'modal' }} 
                initialRouteName={!isAuthenticated ? 'Login' : initialRoute}
              >
                {!isAuthenticated ? (
                  <Stack.Screen name="Login" component={LoginScreen} />
                ) : (
                  <>
                    <Stack.Screen name="Main" component={MainTabs} />
                    <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} initialParams={{ isInitialSetup: initialRoute === 'ProfileSetup' }} />
                    <Stack.Screen name="PostDetail" component={PostDetailScreen} />
                    <Stack.Screen name="Editor" component={EditorScreen} />
                    <Stack.Screen name="Admin" component={AdminScreen} />
                  </>
                )}
              </Stack.Navigator>
            </NavigationContainer>
          </View>

          {/* 오른쪽: 대칭을 위한 빈 공간 (중앙 정렬 유지용) */}
          <View style={styles.webRightGutter} />
        </>
      ) : (
        /* 모바일/좁은 화면: 앱 본체만 출력 */
        <View style={styles.appContainer}>
          <NavigationContainer>
            <Stack.Navigator 
              screenOptions={{ headerShown: false, presentation: 'modal' }} 
              initialRouteName={!isAuthenticated ? 'Login' : initialRoute}
            >
              {!isAuthenticated ? (
                <Stack.Screen name="Login" component={LoginScreen} />
              ) : (
                <>
                  <Stack.Screen name="Main" component={MainTabs} />
                  <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} initialParams={{ isInitialSetup: initialRoute === 'ProfileSetup' }} />
                  <Stack.Screen name="PostDetail" component={PostDetailScreen} />
                  <Stack.Screen name="Editor" component={EditorScreen} />
                  <Stack.Screen name="Admin" component={AdminScreen} />
                </>
              )}
            </Stack.Navigator>
          </NavigationContainer>
        </View>
      )}

      {/* 글로벌 뱃지 알림 모달 (앱 레이아웃 내부에 렌더링) */}
      {showBadgeModal && (
        <View style={styles.badgeModalOverlay}>
          <View style={styles.badgeModalContent}>
            <Icon name="trophy" size={60} color="#FFD700" style={{ marginBottom: 16 }} />
            <Text style={styles.badgeModalTitle}>축하합니다!</Text>
            <Text style={styles.badgeModalSub}>{newBadge} 뱃지를 획득하셨습니다.</Text>
            <View style={styles.badgeModalButtons}>
              <TouchableOpacity style={styles.badgeModalBtn} onPress={clearNewBadge}>
                <Text style={styles.badgeModalBtnText}>확인</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.badgeModalBtn, styles.badgeModalBtnPrimary]} 
                onPress={() => {
                  clearNewBadge();
                  // 딥링크나 네비게이션 처리가 필요할 수 있음
                }}
              >
                <Text style={[styles.badgeModalBtnText, { color: '#FFF' }]}>보러가기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mainWrapper: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#FAFAFA',
  },
  webLeftGutter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 60,
  },
  webRightGutter: {
    flex: 1,
  },
  introContent: {
    maxWidth: 400,
  },
  introLogo: {
    fontSize: 42,
    fontWeight: '900',
    fontStyle: 'italic',
    color: '#000',
    marginBottom: 20,
  },
  introTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111',
    lineHeight: 44,
    marginBottom: 16,
  },
  introSub: {
    fontSize: 18,
    color: '#666',
    lineHeight: 28,
    marginBottom: 40,
  },
  introCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 5,
  },
  cardEmoji: {
    fontSize: 32,
    marginRight: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 14,
    color: '#888',
  },
  appContainer: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: '#FAFAFA',
    position: 'relative', // absolute 요소(모달)의 기준점이 됨
    overflow: 'hidden', // 모달이 컨테이너를 벗어나지 않도록 함
    // PC 화면에서 앱처럼 보이도록 테두리/그림자 처리
    ...(Platform.OS === 'web' ? {
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowOffset: { width: 0, height: 0 },
      shadowRadius: 30,
      height: '100vh' as any,
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderColor: '#EAEAEA',
    } : {
      flex: 1,
    })
  },
  badgeModalOverlay: {
    ...StyleSheet.absoluteFillObject,
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
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
  },
  badgeModalTitle: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  badgeModalSub: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 24 },
  badgeModalButtons: { flexDirection: 'row', width: '100%' },
  badgeModalBtn: { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 12 },
  badgeModalBtnPrimary: { backgroundColor: '#000', marginLeft: 10 },
  badgeModalBtnText: { fontSize: 16, fontWeight: 'bold', color: '#888' }
});
