import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useStore } from '../store/useStore';

export default function PwaInstallBanner() {
  const { showPwaPrompt, dismissPwaPrompt, pwaInstallPrompt } = useStore();
  const [isLocalDismissed, setIsLocalDismissed] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web') {
      // 모바일 기기 감지
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      // 설치된 앱 환경(standalone) 확인
      const isAppMode = window.matchMedia('(display-mode: standalone)').matches || 
                        (window.navigator as any).standalone === true;
      
      // 모바일 + 브라우저 환경에서만 배너 표시
      setIsStandalone(!isMobileDevice || isAppMode);

      // localStorage 확인해서 "나중에" 상태 체크
      const dismissed = localStorage.getItem('pwaBannerDismissed');
      const dismissedTime = localStorage.getItem('pwaBannerDismissedTime');
      
      if (dismissed === 'true' && dismissedTime) {
        const passedHours = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60);
        if (passedHours < 24) {
          setIsLocalDismissed(true);
          return;
        } else {
          // 24시간 지났으므로 다시 표시
          localStorage.removeItem('pwaBannerDismissed');
          localStorage.removeItem('pwaBannerDismissedTime');
          setIsLocalDismissed(false);
        }
      }
    }
  }, []);

  // 설치된 앱(standalone) 또는 경고 버튼을 눌렀으면 숨김
  if (Platform.OS !== 'web' || !showPwaPrompt || isLocalDismissed || isStandalone) {
    return null;
  }

  const handleInstall = async () => {
    if (pwaInstallPrompt) {
      pwaInstallPrompt.prompt();
      const { outcome } = await pwaInstallPrompt.userChoice;
      if (outcome === 'accepted') {
        dismissPwaPrompt();
      }
    } else {
      // beforeinstallprompt가 없으면 수동으로 설치 안내
      alert('브라우저의 메뉴에서 "앱 설치" 또는 "홈 화면에 추가"를 선택하세요.');
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('pwaBannerDismissed', 'true');
    localStorage.setItem('pwaBannerDismissedTime', Date.now().toString());
    setIsLocalDismissed(true);
    dismissPwaPrompt();
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Icon name="cloud-download-outline" size={24} color="#007AFF" style={styles.icon} />
        <View style={styles.textContainer}>
          <Text style={styles.title}>HolyFeed을 앱으로 사용하세요</Text>
          <Text style={styles.subtitle}>홈 화면에 추가하면 더 빠르고 편합니다</Text>
        </View>
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.cancelBtn} onPress={handleDismiss}>
          <Text style={styles.cancelText}>나중에</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.installBtn} onPress={handleInstall}>
          <Icon name="add-circle" size={20} color="#FFF" style={styles.installIcon} />
          <Text style={styles.installText}>설치</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  cancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DDD',
  },
  cancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  installBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
  },
  installIcon: {
    marginRight: 4,
  },
  installText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFF',
  },
});
