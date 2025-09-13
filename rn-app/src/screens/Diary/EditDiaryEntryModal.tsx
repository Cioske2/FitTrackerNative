import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView } from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { useDiaryStore } from '../../store/diaryStore';

export default function EditDiaryEntryModal(){
  const route = useRoute<any>();
  const nav = useNavigation<any>();
  const { entries, updateEntry, removeEntry } = useDiaryStore();
  const entry = entries.find(e=> e.id === route.params?.id);
  const [qty,setQty] = useState(entry? String(entry.consumed_quantity):'');
  const [notes,setNotes] = useState(entry?.notes || '');
  const [protein,setProtein] = useState(entry? String(entry.protein_g_calculated||0):'0');
  const [carbs,setCarbs] = useState(entry? String(entry.carbohydrates_total_g_calculated||0):'0');
  const [fat,setFat] = useState(entry? String(entry.fat_total_g_calculated||0):'0');
  const [cal,setCal] = useState(entry? String(entry.calories_calculated||0):'0');

  useEffect(()=>{ if (entry){
    setQty(String(entry.consumed_quantity));
    setNotes(entry.notes||'');
    setProtein(String(entry.protein_g_calculated||0));
    setCarbs(String(entry.carbohydrates_total_g_calculated||0));
    setFat(String(entry.fat_total_g_calculated||0));
    setCal(String(entry.calories_calculated||0));
  } }, [entry?.id]);

  if(!entry){
    return <View style={styles.container}><Text style={styles.missing}>Voce non trovata</Text></View>;
  }

  const persist = async () => {
    await updateEntry(entry.id, {
      consumed_quantity: Number(qty)||0,
      notes: notes.trim()||null,
      calories_calculated: Number(cal)||0,
      protein_g_calculated: Number(protein)||0,
      carbohydrates_total_g_calculated: Number(carbs)||0,
      fat_total_g_calculated: Number(fat)||0
    } as any);
    nav.goBack();
  };
  const del = async () => { await removeEntry(entry.id); nav.goBack(); };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{entry.food_name_snapshot}</Text>
      <TextInput style={styles.input} keyboardType='numeric' value={qty} onChangeText={setQty} placeholder='Quantità' placeholderTextColor='#666' />
      <TextInput style={styles.input} multiline value={notes} onChangeText={setNotes} placeholder='Note' placeholderTextColor='#666' />
      <View style={styles.row}>        
        <TextInput style={styles.macro} keyboardType='numeric' value={protein} onChangeText={setProtein} placeholder='Prot' placeholderTextColor='#666' />
        <TextInput style={styles.macro} keyboardType='numeric' value={carbs} onChangeText={setCarbs} placeholder='Carb' placeholderTextColor='#666' />
        <TextInput style={styles.macro} keyboardType='numeric' value={fat} onChangeText={setFat} placeholder='Grassi' placeholderTextColor='#666' />
        <TextInput style={styles.macro} keyboardType='numeric' value={cal} onChangeText={setCal} placeholder='Kcal' placeholderTextColor='#666' />
      </View>
      <Pressable style={styles.saveBtn} onPress={persist}><Text style={styles.saveTxt}>Salva</Text></Pressable>
      <Pressable style={styles.deleteBtn} onPress={del}><Text style={styles.deleteTxt}>Elimina</Text></Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:{ padding:16 },
  title:{ fontSize:18, fontWeight:'600', color:'#111', marginBottom:12 },
  input:{ borderWidth:1, borderColor:'#ccc', borderRadius:8, padding:10, marginBottom:12, color:'#111', backgroundColor:'#fff' },
  row:{ flexDirection:'row', gap:8, marginBottom:12 },
  macro:{ flex:1, borderWidth:1, borderColor:'#ccc', borderRadius:8, padding:10, color:'#111', backgroundColor:'#fff' },
  saveBtn:{ backgroundColor:'#10b981', padding:14, borderRadius:10, alignItems:'center', marginTop:4 },
  saveTxt:{ color:'#fff', fontWeight:'600' },
  deleteBtn:{ backgroundColor:'#ef4444', padding:12, borderRadius:10, alignItems:'center', marginTop:12 },
  deleteTxt:{ color:'#fff', fontWeight:'600' },
  missing:{ color:'#111', padding:20 }
});
