import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';

export default function PrivacyPolicyScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>약관 및 정책</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.sectionTitle}>회사 정보</Text>
        <Text style={styles.paragraph}>회사명: 무브모먼트</Text>
        <Text style={styles.paragraph}>대표자: 박찬양</Text>
        <Text style={styles.paragraph}>사업자등록번호: 789-46-01250</Text>

        <Text style={styles.sectionTitle}>개인정보처리방침</Text>
        
        <Text style={styles.subtitle}>1. 개인정보 수집</Text>
        <Text style={styles.paragraph}>HolyFeed(이하 "서비스")는 다음의 개인정보를 수집합니다:</Text>
        <Text style={styles.listItem}>• 필수: 이름, 이메일 주소, 카카오 프로필 정보</Text>
        <Text style={styles.listItem}>• 선택: 자기소개, 프로필 사진</Text>

        <Text style={styles.subtitle}>2. 개인정보 이용</Text>
        <Text style={styles.paragraph}>수집한 개인정보는 다음의 목적으로만 이용됩니다:</Text>
        <Text style={styles.listItem}>• 서비스 제공 및 계정 관리</Text>
        <Text style={styles.listItem}>• 사용자 식별 및 인증</Text>
        <Text style={styles.listItem}>• 서비스 개선 및 통계 분석</Text>
        <Text style={styles.listItem}>• 법적 의무 이행</Text>

        <Text style={styles.subtitle}>3. 개인정보 보호</Text>
        <Text style={styles.paragraph}>당사는 개인정보 보호를 위해 다음 조치를 취합니다:</Text>
        <Text style={styles.listItem}>• Supabase의 암호화된 데이터베이스 사용</Text>
        <Text style={styles.listItem}>• Row-Level Security (RLS)를 통한 접근 제어</Text>
        <Text style={styles.listItem}>• HTTPS 통신 암호화</Text>
        <Text style={styles.listItem}>• 정기적인 보안 감시 및 업데이트</Text>

        <Text style={styles.subtitle}>4. 데이터 보관 및 삭제</Text>
        <Text style={styles.listItem}>• 사용자가 회원 탈퇴 시 개인정보는 즉시 삭제됨</Text>
        <Text style={styles.listItem}>• 법적 의무가 있는 경우 필요한 기간만 보관</Text>

        <Text style={styles.subtitle}>5. 제3자 정보 공유</Text>
        <Text style={styles.listItem}>• 원칙적으로 개인정보를 제3자와 공유하지 않음</Text>
        <Text style={styles.listItem}>• 사용자의 명시적 동의 또는 법적 요구가 있을 때만 공유</Text>

        <Text style={styles.subtitle}>6. 사용자 권리</Text>
        <Text style={styles.paragraph}>사용자는 다음 권리를 행사할 수 있습니다:</Text>
        <Text style={styles.listItem}>• 개인정보 조회 및 수정</Text>
        <Text style={styles.listItem}>• 개인정보 삭제 요청</Text>
        <Text style={styles.listItem}>• 이의 제기</Text>
        
        <Text style={styles.subtitle}>7. 정책 변경</Text>
        <Text style={styles.paragraph}>당사는 개인정보처리방침을 변경할 수 있으며, 변경 시 서비스 내 공지를 통해 알립니다.</Text>
        
        <Text style={styles.subtitle}>8. 문의</Text>
        <Text style={styles.paragraph}>개인정보 관련 문의사항이 있으시면 문의해주시기 바랍니다.</Text>

        <Text style={styles.sectionTitle}>서비스 약관</Text>
        <Text style={styles.paragraph}>본 서비스는 기독교 묵상 공유 커뮤니티입니다. 사용자는 성경과 신앙에 존경을 보이며 건설적인 대화와 나눔을 약속합니다.</Text>
        <Text style={styles.listItem}>• 음란물, 폭력, 혐오 표현 금지</Text>
        <Text style={styles.listItem}>• 다른 사용자 존중 및 명예훼손 금지</Text>
        <Text style={styles.listItem}>• 광고 및 상업적 콘텐츠 금지</Text>
        <Text style={styles.listItem}>• 본 서비스는 보편적인 기독교 정통 교리를 지향하며, 이에 반하는 교리 전파나 포교 활동을 금지합니다.</Text>
        <Text style={styles.listItem}>• 공인된 기독교 교단에서 규정한 이단 및 사이비 단체의 포교, 홍보, 게시물 작성 행위 발견 시 이용이 제한될 수 있습니다.</Text>

        <Text style={styles.sectionTitle}>저작권</Text>
        <Text style={styles.paragraph}>ⓒ 2026 무브모먼트. All rights reserved.</Text>
        <Text style={styles.paragraph}>HolyFeed의 모든 콘텐츠는 저작권으로 보호됩니다.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'android' ? 12 : 0,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    backgroundColor: '#FFF',
    height: 50,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderColor: '#eee',
    paddingBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
    color: '#333',
    marginBottom: 4,
  },
  listItem: {
    fontSize: 14,
    lineHeight: 22,
    color: '#333',
    marginBottom: 4,
    paddingLeft: 8,
  }
});
