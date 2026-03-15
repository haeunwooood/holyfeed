import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useStore } from '../store/useStore';

export default function PwaInstallBanner() {
  const { pwaInstallPrompt, showPwaPrompt, dismissPwaPrompt } = useStore();

  if (Platform.OS !== 'web' || !showPwaPrompt || !pwaInstallPrompt) {
    return null;
  }

  const handleInstall = async () => {
    if (pwaInstallPrompt) {
      pwaInstallPrompt.prompt();
      const { outcome } = await pwaInstallPrompt.userChoice;
      if (outcome === 'accepted') {
        dismissPwaPrompt();
      }
    }
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
        <TouchableOpacity style={styles.cancelBtn} onPress={dismissPwaPrompt}>
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
