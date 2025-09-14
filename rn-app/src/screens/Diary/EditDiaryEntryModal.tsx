import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { colors } from '../../theme/colors';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { useDiaryStore } from '../../store/diaryStore';
// Nota: il servizio Gemini sta nella cartella web src/services; riuso diretto.
import { estimateMacrosForEntry } from '../../services/geminiService';

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
  const [aiLoading, setAiLoading] = useState(false);

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
    const patch: any = {
      consumedQuantity: Number(qty)||0,
      notes: notes.trim()||null,
      calculatedNutrients: {
        calories: Number(cal)||0,
        protein: Number(protein)||0,
        carbohydrates_total: Number(carbs)||0,
        fat_total: Number(fat)||0
      }
    };
    await updateEntry(entry.id, patch);
    nav.goBack();
  };
  const del = async () => { await removeEntry(entry.id); nav.goBack(); };

  const runAIMacros = async () => {
    if (!entry) return;
    if (aiLoading) return;
    const qNum = Number(qty)||0; if (qNum<=0) { Alert.alert('Quantità non valida'); return; }
    setAiLoading(true);
    try {
      const res = await estimateMacrosForEntry(entry.food_name_snapshot, qNum, entry.consumed_unit || 'g');
      // Arrotondamenti coerenti con altre parti dell'app
      setCal(String(Math.round(res.calories)));
      setProtein(String(+res.protein.toFixed(1)));
      setCarbs(String(+res.carbohydrates_total.toFixed(1)));
      setFat(String(+res.fat_total.toFixed(1)));
      Alert.alert('Macro aggiornati', 'Valori stimati dall\'AI applicati. Verifica prima di salvare.');
    } catch(e:any){
      Alert.alert('AI fallita', e.message || 'Impossibile ottenere stima');
    } finally { setAiLoading(false); }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} style={{backgroundColor:colors.background}}>
      <Text style={styles.title}>{entry.food_name_snapshot}</Text>
      <TextInput style={styles.input} keyboardType='numeric' value={qty} onChangeText={setQty} placeholder='Quantità' placeholderTextColor={colors.textMuted} />
      <TextInput style={[styles.input,{height:90,textAlignVertical:'top'}]} multiline value={notes} onChangeText={setNotes} placeholder='Note' placeholderTextColor={colors.textMuted} />
      <View style={styles.row}>        
        <View style={styles.macroWrap}> 
          <Text style={styles.macroLabel}>Proteine (g)</Text>
          <TextInput style={styles.macro} keyboardType='numeric' value={protein} onChangeText={setProtein} placeholder='0' placeholderTextColor={colors.textMuted} />
        </View>
        <View style={styles.macroWrap}> 
          <Text style={styles.macroLabel}>Carbo (g)</Text>
          <TextInput style={styles.macro} keyboardType='numeric' value={carbs} onChangeText={setCarbs} placeholder='0' placeholderTextColor={colors.textMuted} />
        </View>
        <View style={styles.macroWrap}> 
          <Text style={styles.macroLabel}>Grassi (g)</Text>
          <TextInput style={styles.macro} keyboardType='numeric' value={fat} onChangeText={setFat} placeholder='0' placeholderTextColor={colors.textMuted} />
        </View>
        <View style={styles.macroWrap}> 
          <Text style={styles.macroLabel}>Kcal</Text>
          <TextInput style={styles.macro} keyboardType='numeric' value={cal} onChangeText={setCal} placeholder='0' placeholderTextColor={colors.textMuted} />
        </View>
      </View>
      <View style={styles.aiRow}>
        <Pressable style={[styles.aiBtn, aiLoading && {opacity:0.6}]} disabled={aiLoading} onPress={runAIMacros}>
          {aiLoading ? <ActivityIndicator color="#04140a" /> : <Text style={styles.aiTxt}>AI Macros</Text>}
        </Pressable>
        <Pressable style={styles.saveBtn} onPress={persist}><Text style={styles.saveTxt}>Salva</Text></Pressable>
      </View>
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
  macroWrap:{ flex:1 },
  macroLabel:{ color:colors.textMuted, fontSize:11, marginBottom:4, textAlign:'center', letterSpacing:0.3 },
  aiRow:{ flexDirection:'row', gap:12, marginBottom:8 },
  aiBtn:{ flex:1, backgroundColor:'#34d399', padding:16, borderRadius:14, alignItems:'center', borderWidth:1, borderColor:'#249d72' },
  aiTxt:{ color:'#04140a', fontWeight:'700', letterSpacing:0.5 },
  saveBtn:{ backgroundColor:colors.accent, padding:16, borderRadius:14, alignItems:'center', marginTop:4, flex:1 },
  saveTxt:{ color:'#fff', fontWeight:'600', letterSpacing:0.5 },
  deleteBtn:{ backgroundColor:colors.cardAlt, padding:14, borderRadius:14, alignItems:'center', marginTop:14, borderWidth:1, borderColor:colors.border },
  deleteTxt:{ color:'#ef4444', fontWeight:'600', letterSpacing:0.5 },
  missing:{ color:colors.textPrimary, padding:20 }
});
