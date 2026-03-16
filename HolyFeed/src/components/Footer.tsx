import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';

export default function Footer({ onPrivacyPress }: { onPrivacyPress: () => void }) {
  if (Platform.OS !== 'web') {
    return null;
  }

  return (
    <View style={styles.footerContainer}>
      <Text style={styles.footerText}>
        상호: 무브모먼트 | 대표: 박찬양 | 사업자등록번호: 789-46-01250
      </Text>
      <TouchableOpacity onPress={onPrivacyPress}>
        <Text style={[styles.footerText, styles.linkText]}>개인정보처리방침</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  footerContainer: {
    backgroundColor: '#FAFAFA', // 배경색을 화면 배경색에 맞춤
    paddingTop: 30,
    paddingBottom: 6, // 하단 네비게이션을 위해 여백 유지
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e7e7e7',
    marginTop: 20, // 콘텐츠와 간격 추가
  },
  footerText: {
    fontSize: 12,
    color: '#888',
    lineHeight: 20,
  },
  linkText: {
    color: '#555',
    textDecorationLine: 'underline',
  },
});
