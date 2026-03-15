import React from 'react';
import { View, Text, StyleSheet, Platform, ScrollView } from 'react-native';

export default function Footer() {
  if (Platform.OS !== 'web') {
    return null; // 모바일에서는 표시 안 함
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.content}>
          {/* 회사 정보 */}
          <View style={styles.section}>
            <Text style={styles.title}>회사 정보</Text>
            <Text style={styles.text}>회사명: 무브모먼트</Text>
            <Text style={styles.text}>대표자: 박찬양</Text>
            <Text style={styles.text}>사업자등록번호: 789-46-01250</Text>
          </View>

          {/* 개인정보처리방침 */}
          <View style={styles.section}>
            <Text style={styles.title}>개인정보처리방침</Text>
            
            <Text style={styles.subtitle}>1. 개인정보 수집</Text>
            <Text style={styles.text}>
              HolyFeed(이하 "서비스")는 다음의 개인정보를 수집합니다:
            </Text>
            <Text style={styles.text}>• 필수: 이름, 이메일 주소, 카카오 프로필 정보</Text>
            <Text style={styles.text}>• 선택: 자기소개, 프로필 사진</Text>

            <Text style={styles.subtitle}>2. 개인정보 이용</Text>
            <Text style={styles.text}>
              수집한 개인정보는 다음의 목적으로만 이용됩니다:
            </Text>
            <Text style={styles.text}>• 서비스 제공 및 계정 관리</Text>
            <Text style={styles.text}>• 사용자 식별 및 인증</Text>
            <Text style={styles.text}>• 서비스 개선 및 통계 분석</Text>
            <Text style={styles.text}>• 법적 의무 이행</Text>

            <Text style={styles.subtitle}>3. 개인정보 보호</Text>
            <Text style={styles.text}>
              당사는 개인정보 보호를 위해 다음 조치를 취합니다:
            </Text>
            <Text style={styles.text}>• Supabase의 암호화된 데이터베이스 사용</Text>
            <Text style={styles.text}>• Row-Level Security (RLS)를 통한 접근 제어</Text>
            <Text style={styles.text}>• HTTPS 통신 암호화</Text>
            <Text style={styles.text}>• 정기적인 보안 감시 및 업데이트</Text>

            <Text style={styles.subtitle}>4. 데이터 보관 및 삭제</Text>
            <Text style={styles.text}>
              • 사용자가 회원 탈퇴 시 개인정보는 즉시 삭제됨
            </Text>
            <Text style={styles.text}>
              • 법적 의무가 있는 경우 필요한 기간만 보관
            </Text>

            <Text style={styles.subtitle}>5. 제3자 정보 공유</Text>
            <Text style={styles.text}>
              • 원칙적으로 개인정보를 제3자와 공유하지 않음
            </Text>
            <Text style={styles.text}>
              • 사용자의 명시적 동의 또는 법적 요구가 있을 때만 공유
            </Text>

            <Text style={styles.subtitle}>6. 사용자 권리</Text>
            <Text style={styles.text}>
              사용자는 다음 권리를 행사할 수 있습니다:
            </Text>
            <Text style={styles.text}>• 개인정보 조회 및 수정</Text>
            <Text style={styles.text}>• 개인정보 삭제 요청</Text>
            <Text style={styles.text}>• 이의 제기</Text>

            <Text style={styles.subtitle}>7. 정책 변경</Text>
            <Text style={styles.text}>
              당사는 개인정보처리방침을 변경할 수 있으며, 변경 시 서비스 내 공지를 통해 알립니다.
            </Text>

            <Text style={styles.subtitle}>8. 문의</Text>
            <Text style={styles.text}>
              개인정보 관련 문의사항이 있으시면 문의해주시기 바랍니다.
            </Text>
          </View>

          {/* 서비스 약관 */}
          <View style={styles.section}>
            <Text style={styles.title}>서비스 약관</Text>
            <Text style={styles.text}>
              본 서비스는 기독교 묵상 공유 커뮤니티입니다. 사용자는 성경과 신앙에 존경을 보이며 건설적인 대화와 나눔을 약속합니다.
            </Text>
            <Text style={styles.text}>
              • 음란물, 폭력, 혐오 표현 금지
            </Text>
            <Text style={styles.text}>
              • 다른 사용자 존중 및 명예훼손 금지
            </Text>
            <Text style={styles.text}>
              • 광고 및 상업적 콘텐츠 금지
            </Text>
          </View>

          {/* 저작권 */}
          <View style={styles.section}>
            <Text style={styles.subtitle}>저작권</Text>
            <Text style={styles.text}>
              ⓒ 2026 무브모먼트. All rights reserved.
            </Text>
            <Text style={styles.text}>
              HolyFeed의 모든 콘텐츠는 저작권으로 보호됩니다.
            </Text>
          </View>

          {/* 추가 정보 */}
          <View style={styles.section}>
            <Text style={styles.subtitle}>서비스 정보</Text>
            <Text style={styles.text}>
              문제 발생 시 또는 피드백은 앱 내 문의 기능을 통해 보내주시면 감사하겠습니다.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F5F5F5',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 24,
    paddingBottom: 24,
  },
  content: {
    maxWidth: 1200,
    marginHorizontal: 'auto',
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 32,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
    marginBottom: 8,
  },
  text: {
    fontSize: 12,
    color: '#555',
    lineHeight: 18,
    marginBottom: 8,
  },
});
