import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ActivityIndicator, SafeAreaView, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Icon from 'react-native-vector-icons/Ionicons';
import { useStore } from '../store/useStore';
import { supabase } from '../lib/supabase';
import { decode } from 'base64-arraybuffer';

export default function ProfileSetupScreen({ navigation, route }: any) {
  const { currentUser, setAuthenticated } = useStore();
  const isInitialSetup = route.params?.isInitialSetup || false;

  const [name, setName] = useState(currentUser?.name || '');
  const [bio, setBio] = useState(currentUser?.bio || '성경을 사랑하는 제자');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatar_url || '');
  const [loading, setLoading] = useState(false);

  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      alert('사진 접근 권한이 필요합니다.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      
      try {
        setLoading(true);
        if (!asset.base64) {
          throw new Error('Base64 data not found');
        }

        // Supabase Storage에 업로드 (avatars 버킷이 있어야 함)
        const fileExt = asset.uri.substring(asset.uri.lastIndexOf('.') + 1) || 'jpg';
        const fileName = `${currentUser?.id}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, decode(asset.base64), {
            contentType: `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`,
            upsert: true
          });

        if (uploadError) {
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        setAvatarUrl(publicUrl);
      } catch (error: any) {
        console.error('Image upload error:', error);
        alert(`프로필 사진 업로드에 실패했습니다. 에러: ${error?.message || '알 수 없는 오류'}`);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      alert('이름을 입력해주세요.');
      return;
    }
    if (loading) return; // 중복 실행 방지

    setLoading(true);
    try {
      // 1. Supabase Auth의 user_metadata 업데이트
      // 이렇게 하면 세션이 안전하게 갱신되어 토큰 충돌을 방지할 수 있습니다.
      const { data: { user: updatedAuthUser }, error: authError } = await supabase.auth.updateUser({
        data: { 
          name: name.trim(),
          avatar_url: avatarUrl,
        }
      });

      if (authError) {
        throw authError;
      }
      
      // 2. 공개 프로필 정보(users 테이블) 업데이트
      const updates = {
        name: name.trim(),
        bio: bio.trim(),
        avatar_url: avatarUrl,
      };

      const { error: dbError } = await supabase
        .from('users')
        .update(updates)
        .eq('id', currentUser?.id);

      if (dbError) {
        throw dbError;
      }

      // 3. Zustand 스토어의 상태 업데이트
      const finalUser = {
        ...currentUser,
        ...updatedAuthUser,
        ...updates
      };
      setAuthenticated(true, finalUser);
      
      // 4. 화면 이동
      if (isInitialSetup) {
        navigation.replace('Main');
      } else {
        navigation.goBack();
      }
    } catch (error: any) {
      console.error('Profile update error:', error);
      alert(`프로필 업데이트에 실패했습니다. 에러: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {!isInitialSetup && (
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>{isInitialSetup ? '프로필 설정' : '프로필 수정'}</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <TouchableOpacity style={styles.imageContainer} onPress={handlePickImage} disabled={loading}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Icon name="person" size={40} color="#AAA" />
            </View>
          )}
          <View style={styles.cameraBadge}>
            <Icon name="camera" size={16} color="#FFF" />
          </View>
        </TouchableOpacity>

        <Text style={styles.label}>이름 (닉네임)</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="이름을 입력하세요"
          placeholderTextColor="#999"
          maxLength={15}
        />

        <Text style={styles.label}>한 줄 소개</Text>
        <TextInput
          style={styles.input}
          value={bio}
          onChangeText={setBio}
          placeholder="한 줄 소개를 입력하세요"
          placeholderTextColor="#999"
          maxLength={30}
        />

        <TouchableOpacity 
          style={[styles.saveButton, loading && styles.saveButtonDisabled]} 
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.saveButtonText}>
              {isInitialSetup ? '시작하기' : '저장하기'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 20 : 0,
    height: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#EAEAEA',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 40,
    marginTop: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#EAEAEA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#000',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  label: {
    alignSelf: 'flex-start',
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 32,
  },
  saveButton: {
    width: '100%',
    backgroundColor: '#000',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#666',
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
