import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useStore } from '../store/useStore';

export default function PwaInstallBanner() {
  // PWA 배너 비활성화
  return null;

  // const { showPwaPrompt, dismissPwaPrompt, pwaInstallPrompt } = useStore();
  // const [isVisible, setIsVisible] = useState(false);
  // const [activeTab, setActiveTab] = useState<'ios' | 'android'>('android');

  // useEffect(() => {
    if (Platform.OS !== 'web' || !showPwaPrompt) {
      setIsVisible(false);
      return;
    }

    // 기기 타입 감지
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    if (isIOS) {
      setActiveTab('ios');
    } else if (isAndroid) {
      setActiveTab('android');
    }

    // 모바일 기기 감지
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // 설치된 앱 환경(standalone) 확인
    const isAppMode = window.matchMedia('(display-mode: standalone)').matches || 
                      (window.navigator as any).standalone === true;
    
    // 모바일 + 브라우저 환경에서만 표시
    if (!isMobileDevice || isAppMode) {
      setIsVisible(false);
      return;
    }

    // localStorage 확인 - 24시간 dismiss 체크
    const dismissed = localStorage.getItem('pwaBannerDismissed');
    const dismissedTime = localStorage.getItem('pwaBannerDismissedTime');
    
    if (dismissed === 'true' && dismissedTime) {
      const passedHours = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60);
      if (passedHours < 24) {
        setIsVisible(false);
        return;
      }
      localStorage.removeItem('pwaBannerDismissed');
      localStorage.removeItem('pwaBannerDismissedTime');
    }

    setIsVisible(true);
  }, [showPwaPrompt]);

  const handleInstall = async () => {
    if (pwaInstallPrompt) {
      pwaInstallPrompt.prompt();
      const { outcome } = await pwaInstallPrompt.userChoice;
      if (outcome === 'accepted') {
        handleDismiss();
      }
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('pwaBannerDismissed', 'true');
    localStorage.setItem('pwaBannerDismissedTime', Date.now().toString());
    setIsVisible(false);
    dismissPwaPrompt();
  };

  if (!isVisible) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Icon name="phone-portrait-outline" size={24} color="#FFF" />
          <View style={styles.headerText}>
            <Text style={styles.title}>HolyFeed 앱 설치</Text>
            <Text style={styles.subtitle}>홈 화면에 추가하여 더 빠르게 이용하세요</Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleDismiss}>
          <Icon name="close" size={22} color="#999" />
        </TouchableOpacity>
      </View>

      {/* 탭 */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'android' && styles.tabActive]}
          onPress={() => setActiveTab('android')}
        >
          <Icon name="logo-android" size={16} color={activeTab === 'android' ? '#FFF' : '#666'} />
          <Text style={[styles.tabText, activeTab === 'android' && styles.tabTextActive]}>
            Android
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'ios' && styles.tabActive]}
          onPress={() => setActiveTab('ios')}
        >
          <Icon name="logo-apple" size={16} color={activeTab === 'ios' ? '#FFF' : '#666'} />
          <Text style={[styles.tabText, activeTab === 'ios' && styles.tabTextActive]}>
            iPhone/iPad
          </Text>
        </TouchableOpacity>
      </View>

      {/* 가이드 */}
      <View style={styles.guideContainer}>
        {activeTab === 'android' ? (
          <View>
            <Text style={styles.guideTitle}>Chrome/Samsung Internet에서 설치하기</Text>
            
            <View style={styles.step}>
              <View style={styles.stepBadge}><Text style={styles.stepNum}>1</Text></View>
              <View style={styles.stepBody}>
                <Text style={styles.stepTitle}>오른쪽 상단 메뉴 버튼 (⋮) 클릭</Text>
                <Text style={styles.stepDesc}>3개 점 모양 버튼을 누르세요</Text>
              </View>
            </View>

            <View style={styles.step}>
              <View style={styles.stepBadge}><Text style={styles.stepNum}>2</Text></View>
              <View style={styles.stepBody}>
                <Text style={styles.stepTitle}>"앱 설치" 또는 "홈 화면에 추가" 선택</Text>
                <Text style={styles.stepDesc}>메뉴에서 해당 옵션을 탭하세요</Text>
              </View>
            </View>

            <View style={styles.step}>
              <View style={styles.stepBadge}><Text style={styles.stepNum}>3</Text></View>
              <View style={styles.stepBody}>
                <Text style={styles.stepTitle}>설치 또는 추가 버튼 클릭</Text>
                <Text style={styles.stepDesc}>확인 팝업에서 버튼을 누르면 완료!</Text>
              </View>
            </View>
          </View>
        ) : (
          <View>
            <Text style={styles.guideTitle}>Safari에서 설치하기</Text>
            
            <View style={styles.step}>
              <View style={styles.stepBadge}><Text style={styles.stepNum}>1</Text></View>
              <View style={styles.stepBody}>
                <Text style={styles.stepTitle}>하단 중앙의 공유 버튼 (↑) 탭</Text>
                <Text style={styles.stepDesc}>화면 아래 공유 아이콘을 누르세요</Text>
              </View>
            </View>

            <View style={styles.step}>
              <View style={styles.stepBadge}><Text style={styles.stepNum}>2</Text></View>
              <View style={styles.stepBody}>
                <Text style={styles.stepTitle}>"홈 화면에 추가" 선택</Text>
                <Text style={styles.stepDesc}>메뉴를 아래로 스크롤해서 찾으세요</Text>
              </View>
            </View>

            <View style={styles.step}>
              <View style={styles.stepBadge}><Text style={styles.stepNum}>3</Text></View>
              <View style={styles.stepBody}>
                <Text style={styles.stepTitle}>앱 이름 입력 후 "추가" 클릭</Text>
                <Text style={styles.stepDesc}>기본 이름은 "HolyFeed"입니다</Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* 버튼 */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.cancelBtn} onPress={handleDismiss}>
          <Text style={styles.cancelText}>나중에</Text>
        </TouchableOpacity>
        {pwaInstallPrompt && (
          <TouchableOpacity style={styles.installBtn} onPress={handleInstall}>
            <Icon name="add-circle" size={18} color="#FFF" />
            <Text style={styles.installText}>지금 설치</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#111',
    borderRadius: 12,
    marginHorizontal: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#000',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  headerText: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: '#888',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#111',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#007AFF',
    backgroundColor: 'rgba(0, 122, 255, 0.05)',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginLeft: 6,
  },
  tabTextActive: {
    color: '#007AFF',
  },
  guideContainer: {
    padding: 16,
    backgroundColor: '#111',
  },
  guideTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 14,
  },
  step: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepNum: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFF',
  },
  stepBody: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 2,
  },
  stepDesc: {
    fontSize: 11,
    color: '#888',
    lineHeight: 14,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#222',
    backgroundColor: '#000',
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#333',
  },
  cancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
  },
  installBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  installText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFF',
  },
});

