import React from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';

interface FooterProps {
  isWebWide?: boolean;
  onPrivacyPolicyPress?: () => void;
}

export default function Footer({ isWebWide = false, onPrivacyPolicyPress }: FooterProps) {
  // 웹 환경이 아니거나 웹 와이드 환경이 아니면 표시 안 함
  if (Platform.OS !== 'web' || !isWebWide) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* 회사 정보 */}
        <View style={styles.section}>
          <Text style={styles.title}>회사 정보</Text>
          <Text style={styles.text}>회사명: 무브모먼트</Text>
          <Text style={styles.text}>대표자: 박찬양</Text>
          <Text style={styles.text}>사업자등록번호: 789-46-01250</Text>
        </View>

        {/* 링크 섹션 */}
        <View style={styles.section}>
          <TouchableOpacity onPress={onPrivacyPolicyPress}>
            <Text style={styles.link}>개인정보처리방침</Text>
          </TouchableOpacity>
        </View>

        {/* 저작권 */}
        <View style={styles.section}>
          <Text style={styles.text}>
            ⓒ 2026 무브모먼트. All rights reserved.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F5F5F5',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 12,
    paddingBottom: 12,
    maxHeight: 160,
  },
  content: {
    maxWidth: 1200,
    marginHorizontal: 'auto',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  section: {
    marginBottom: 12,
  },
  title: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 6,
  },
  text: {
    fontSize: 11,
    color: '#666',
    lineHeight: 16,
    marginBottom: 4,
  },
  link: {
    fontSize: 11,
    color: '#007AFF',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
