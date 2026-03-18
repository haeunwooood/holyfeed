import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import Constants from 'expo-constants';


const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: Platform.OS === 'web' ? undefined : AsyncStorage,
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
