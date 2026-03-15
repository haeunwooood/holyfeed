import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { signInWithKakao } from '../lib/supabase';
import { useStore } from '../store/useStore';

export default function LoginScreen() {
  const { setAuthenticated } = useStore();

  const handleKakaoLogin = async () => {
    // API 키가 세팅되면 실제 동작합니다.
    await signInWithKakao();
    // 성공했다고 가정하고 임시 처리 (실제로는 App.tsx의 onAuthStateChange가 담당)
    // setAuthenticated(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>HolyFeed</Text>
          <Text style={styles.subText}>말씀으로 시작하는 하루</Text>
        </View>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.kakaoButton} onPress={handleKakaoLogin}>
            <Icon name="chatbubble" size={20} color="#3c1e1e" style={styles.kakaoIcon} />
            <Text style={styles.kakaoButtonText}>카카오로 시작하기</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 100,
  },
  logoText: {
    fontSize: 48,
    fontWeight: '900',
    fontStyle: 'italic',
    color: '#000',
    marginBottom: 12,
  },
  subText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  buttonContainer: {
    width: '100%',
    paddingBottom: 40,
  },
  kakaoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE500',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  kakaoIcon: {
    marginRight: 8,
  },
  kakaoButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3c1e1e', // 카카오 공식 로고 폰트 색상
  }
});
