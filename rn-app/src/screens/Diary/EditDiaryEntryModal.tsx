import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView } from 'react-native';
import { colors } from '../../theme/colors';
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
    <ScrollView contentContainerStyle={styles.container} style={{backgroundColor:colors.background}}>
      <Text style={styles.title}>{entry.food_name_snapshot}</Text>
      <TextInput style={styles.input} keyboardType='numeric' value={qty} onChangeText={setQty} placeholder='Quantità' placeholderTextColor={colors.textMuted} />
      <TextInput style={[styles.input,{height:90,textAlignVertical:'top'}]} multiline value={notes} onChangeText={setNotes} placeholder='Note' placeholderTextColor={colors.textMuted} />
      <View style={styles.row}>        
        <TextInput style={styles.macro} keyboardType='numeric' value={protein} onChangeText={setProtein} placeholder='Prot' placeholderTextColor={colors.textMuted} />
        <TextInput style={styles.macro} keyboardType='numeric' value={carbs} onChangeText={setCarbs} placeholder='Carb' placeholderTextColor={colors.textMuted} />
        <TextInput style={styles.macro} keyboardType='numeric' value={fat} onChangeText={setFat} placeholder='Grassi' placeholderTextColor={colors.textMuted} />
        <TextInput style={styles.macro} keyboardType='numeric' value={cal} onChangeText={setCal} placeholder='Kcal' placeholderTextColor={colors.textMuted} />
      </View>
      <Pressable style={styles.saveBtn} onPress={persist}><Text style={styles.saveTxt}>Salva</Text></Pressable>
      <Pressable style={styles.deleteBtn} onPress={del}><Text style={styles.deleteTxt}>Elimina</Text></Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:{ padding:18, backgroundColor:colors.background },
  title:{ fontSize:20, fontWeight:'600', color:colors.textPrimary, marginBottom:16, letterSpacing:0.3 },
  input:{ borderWidth:1, borderColor:colors.borderAlt, borderRadius:12, padding:12, marginBottom:14, color:colors.textPrimary, backgroundColor:colors.card },
  row:{ flexDirection:'row', gap:10, marginBottom:16 },
  macro:{ flex:1, borderWidth:1, borderColor:colors.borderAlt, borderRadius:12, padding:12, color:colors.textPrimary, backgroundColor:colors.card, textAlign:'center' },
  saveBtn:{ backgroundColor:colors.accent, padding:16, borderRadius:14, alignItems:'center', marginTop:4 },
  saveTxt:{ color:'#fff', fontWeight:'600', letterSpacing:0.5 },
  deleteBtn:{ backgroundColor:colors.cardAlt, padding:14, borderRadius:14, alignItems:'center', marginTop:14, borderWidth:1, borderColor:colors.border },
  deleteTxt:{ color:'#ef4444', fontWeight:'600', letterSpacing:0.5 },
  missing:{ color:colors.textPrimary, padding:20 }
});
