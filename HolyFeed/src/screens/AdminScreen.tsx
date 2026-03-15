import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, TextInput, Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import Icon from 'react-native-vector-icons/Ionicons';

export default function AdminScreen() {
  const [churches, setChurches] = useState<any[]>([]);
  const [newChurchName, setNewChurchName] = useState('');
  const [repName, setRepName] = useState('');

  const fetchChurches = async () => {
    const { data } = await supabase.from('churches').select('*').order('created_at', { ascending: false });
    if (data) setChurches(data);
  };

  useEffect(() => {
    fetchChurches();
  }, []);

  const handleApprove = async (id: string) => {
    await supabase.from('churches').update({ status: 'approved' }).eq('id', id);
    fetchChurches();
    Alert.alert('승인 완료', '해당 교회가 승인되었습니다.');
  };

  const handleApplyChurch = async () => {
    if (!newChurchName || !repName) return;
    await supabase.from('churches').insert([{ name: newChurchName, rep_name: repName, status: 'pending' }]);
    setNewChurchName('');
    setRepName('');
    fetchChurches();
    Alert.alert('신청 완료', '교회 등록이 신청되었습니다. 관리자 승인을 기다려주세요.');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>어드민 센터</Text>
      </View>
      
      <View style={styles.form}>
        <Text style={styles.subTitle}>교회 개설 신청 (테스트)</Text>
        <TextInput style={styles.input} placeholder="교회 이름" value={newChurchName} onChangeText={setNewChurchName} />
        <TextInput style={styles.input} placeholder="대표자 이름" value={repName} onChangeText={setRepName} />
        <TouchableOpacity style={styles.btn} onPress={handleApplyChurch}>
          <Text style={styles.btnText}>신청하기</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.subTitle}>가입 신청 목록</Text>
      <FlatList 
        data={churches}
        keyExtractor={item => item.id}
        renderItem={({item}) => (
          <View style={styles.card}>
            <View>
              <Text style={styles.churchName}>{item.name}</Text>
              <Text style={styles.repName}>대표: {item.rep_name}</Text>
              <Text style={item.status === 'approved' ? styles.statusApproved : styles.statusPending}>
                {item.status === 'approved' ? '승인됨' : '대기중'}
              </Text>
            </View>
            {item.status === 'pending' && (
              <TouchableOpacity style={styles.approveBtn} onPress={() => handleApprove(item.id)}>
                <Text style={styles.approveBtnText}>승인</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA', padding: 20 },
  header: { marginBottom: 20, marginTop: 10 },
  title: { fontSize: 24, fontWeight: 'bold' },
  subTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  form: { backgroundColor: '#FFF', padding: 16, borderRadius: 8, marginBottom: 24, borderWidth: 1, borderColor: '#EAEAEA' },
  input: { backgroundColor: '#F5F5F5', padding: 12, borderRadius: 8, marginBottom: 10 },
  btn: { backgroundColor: '#000', padding: 14, borderRadius: 8, alignItems: 'center' },
  btnText: { color: '#FFF', fontWeight: 'bold' },
  card: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF', padding: 16, borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: '#EAEAEA' },
  churchName: { fontSize: 18, fontWeight: 'bold' },
  repName: { fontSize: 14, color: '#666', marginTop: 4 },
  statusPending: { color: '#FF9500', marginTop: 8, fontWeight: 'bold' },
  statusApproved: { color: '#34C759', marginTop: 8, fontWeight: 'bold' },
  approveBtn: { backgroundColor: '#007AFF', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  approveBtnText: { color: '#FFF', fontWeight: 'bold' }
});