import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

// =========================================================================
// [필독] Supabase 연동 설정 가이드
// =========================================================================
// 1. Supabase 대시보드(https://app.supabase.com)에서 프로젝트를 생성하세요.
// 2. Project Settings -> API 메뉴에서 URL과 anon public 키를 복사해서 아래 변수에 넣으세요.
// 
// [카카오 로그인 세팅 상세 가이드]
// 3. Supabase 대시보드 좌측 메뉴: Authentication -> Configuration 내 'Providers' 클릭
// 4. 스크롤을 내려 'Kakao'를 찾아 클릭하고 'Enable Kakao' 스위치를 켭니다.
// 5. 나타나는 화면에서 'Callback URL (for OAuth)' 값을 복사해 둡니다.
// 6. 카카오 디벨로퍼스(https://developers.kakao.com) 접속 -> 내 애플리케이션 추가
// 7. 카카오 디벨로퍼스 메뉴 '요약 정보'에 있는 'REST API 키'를 복사해서 Supabase 화면의 'REST API Key' 칸에 넣습니다.
// 8. 카카오 디벨로퍼스 메뉴 '보안' -> 'Client Secret'을 생성하고 복사해서 Supabase 화면의 'Client Secret Key' 칸에 넣고 [Save]를 누릅니다.
// 9. 카카오 디벨로퍼스 메뉴 '카카오 로그인' 활성화 스위치를 켭니다.
// 10. 카카오 디벨로퍼스 메뉴 '카카오 로그인' 하단의 'Redirect URI'에 5번에서 복사해둔 Supabase Callback URL을 등록합니다.
// 11. 카카오 디벨로퍼스 메뉴 '동의항목'에서 닉네임과 프로필 사진을 '필수 동의'로 설정합니다.
// =========================================================================

const supabaseUrl = 'https://eqbtzxehjpvrztiindgv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxYnR6eGVoanB2cnp0aWluZGd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNDIxNjQsImV4cCI6MjA4ODcxODE2NH0.YQaT9R87GaR80xCavzTRtWALWjuYZ-rOK80w7J-LCBA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// 웹 브라우저가 열려있을 때 닫기 위한 핸들러
WebBrowser.maybeCompleteAuthSession();

// 카카오 소셜 로그인 함수
export const signInWithKakao = async () => {
  try {
    const redirectUrl = Linking.createURL('/');
    
    // Supabase의 OAuth 로그인 메서드 호출 (카카오)
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: redirectUrl,
        scopes: 'profile_nickname profile_image friends talk_message',
        skipBrowserRedirect: Platform.OS !== 'web', // 앱에서는 자동 리다이렉트 방지, 웹에서는 자동 리다이렉트 사용
      },
    });

    if (error) {
      console.error('Kakao login error:', error.message);
      return null;
    }

    if (Platform.OS !== 'web' && data?.url) {
      // 엑스포 웹 브라우저를 띄워서 카카오 로그인 페이지 표시 (앱 환경)
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
      
      // 로그인이 성공적으로 완료되면 URL 파싱 후 세션 획득
      if (result.type === 'success') {
        const { url } = result;
        // 앱 환경에서 반환된 URL에서 code를 추출해 세션 획득
        const parsedUrl = new URL(url.replace('#', '?')); // 해시된 토큰 또는 파라미터 파싱
        const code = parsedUrl.searchParams.get('code');
        if (code) {
          await supabase.auth.exchangeCodeForSession(code);
        } else {
          // Implicit flow인 경우 access_token 파싱
          const access_token = parsedUrl.searchParams.get('access_token');
          const refresh_token = parsedUrl.searchParams.get('refresh_token');
          if (access_token && refresh_token) {
            await supabase.auth.setSession({ access_token, refresh_token });
          }
        }
      }
    }
  } catch (e) {
    console.error('Unexpected error during Kakao login:', e);
  }
};
