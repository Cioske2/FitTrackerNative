import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, ScrollView, Pressable, TextInput, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../../theme/colors';
import { analyzeMealImage } from '../../services/imageMealAnalysisService';
import { useDiaryStore } from '../../store/diaryStore';

interface ParsedDish {
  id: string;
  name: string;
  quantityText: string;
  ingredients: string[];
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export default function MealAnalysisScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dishes, setDishes] = useState<ParsedDish[]>([]);
  const addCompositeMeal = useDiaryStore(s => s.addCompositeMealFromAI); // implement in store later if missing

  const pickImage = async () => {
    setError('');
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { setError('Permesso galleria negato'); return; }
    const res = await ImagePicker.launchImageLibraryAsync({ quality:0.85, base64:true });
    if (!res.canceled && res.assets && res.assets.length>0) {
      const asset = res.assets[0];
      setImageUri(asset.uri || null);
      if (asset.base64) {
        setDishes([]);
      }
    }
  };

  const takePhoto = async () => {
    setError('');
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) { setError('Permesso fotocamera negato'); return; }
    const res = await ImagePicker.launchCameraAsync({ quality:0.85, base64:true });
    if (!res.canceled && res.assets && res.assets.length>0) {
      const asset = res.assets[0];
      setImageUri(asset.uri || null);
    }
  };

  const analyze = async () => {
    if (!imageUri) { setError('Seleziona o scatta un\'immagine'); return; }
    setLoading(true); setError(''); setDishes([]);
    try {
      const result = await analyzeMealImage(imageUri);
      setDishes(result);
      if (result.length===0) setError('Nessun piatto riconosciuto');
    } catch (e:any) {
      setError(e.message || 'Errore analisi');
    } finally { setLoading(false); }
  };

  const saveMeal = async () => {
    if (!dishes.length) { Alert.alert('Nessun piatto'); return; }
    try {
      if (typeof addCompositeMeal === 'function') {
        await addCompositeMeal({ dishes });
        Alert.alert('Pasto salvato', `Pasto AI salvato con ${dishes.length} piatti!`);
        setDishes([]); setImageUri(null);
      } else {
        Alert.alert('Funzione non disponibile', 'Salvataggio non implementato su questo store.');
      }
    } catch(e:any){ Alert.alert('Errore salvataggio', e.message); }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Analizza Pasto</Text>
      <View style={styles.actionsRow}>
        <Pressable onPress={pickImage} style={styles.actionBtn}><Text style={styles.actionTxt}>Galleria</Text></Pressable>
        <Pressable onPress={takePhoto} style={styles.actionBtn}><Text style={styles.actionTxt}>Fotocamera</Text></Pressable>
        <Pressable onPress={analyze} disabled={!imageUri || loading} style={[styles.actionBtn, (!imageUri||loading)&&styles.actionBtnDisabled]}><Text style={styles.actionTxt}>{loading? 'Analizzo...' : 'Analizza'}</Text></Pressable>
      </View>
      {imageUri && <Image source={{uri:imageUri}} style={styles.preview} />}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {dishes.map(d => (
        <View key={d.id} style={styles.card}>
          <TextInput value={d.name} onChangeText={t=>setDishes(p=>p.map(x=>x.id===d.id?{...x,name:t}:x))} style={styles.dishName} />
          <TextInput value={d.quantityText} onChangeText={t=>setDishes(p=>p.map(x=>x.id===d.id?{...x,quantityText:t}:x))} style={styles.qty} />
          <View style={styles.macrosRow}>
            <MacroInput label="Cal" value={String(Math.round(d.calories))} onChange={v=>updateDish(d.id,{calories: Number(v)||0})} />
            <MacroInput label="P" value={String(d.protein.toFixed(1))} onChange={v=>updateDish(d.id,{protein: Number(v)||0})} />
            <MacroInput label="C" value={String(d.carbs.toFixed(1))} onChange={v=>updateDish(d.id,{carbs: Number(v)||0})} />
            <MacroInput label="F" value={String(d.fat.toFixed(1))} onChange={v=>updateDish(d.id,{fat: Number(v)||0})} />
          </View>
        </View>
      ))}
      {dishes.length>0 && (
        <Pressable onPress={saveMeal} style={[styles.saveBtn]}><Text style={styles.saveTxt}>Salva Pasto</Text></Pressable>
      )}
      {loading && <ActivityIndicator color={colors.accent} style={{marginTop:16}} />}
    </ScrollView>
  );

  function updateDish(id:string, patch:Partial<ParsedDish>){
    setDishes(prev => prev.map(d=> d.id===id ? {...d,...patch}: d));
  }
}

function MacroInput({ label, value, onChange }:{ label:string; value:string; onChange:(v:string)=>void }){
  return (
    <View style={{alignItems:'center'}}>
      <Text style={{color:colors.textMuted, fontSize:10}}>{label}</Text>
      <TextInput value={value} onChangeText={onChange} keyboardType='numeric' style={styles.macroInput} />
    </View>
  );
}

const styles = StyleSheet.create({
  container:{ padding:16, backgroundColor:colors.background },
  title:{ color:colors.textPrimary, fontSize:18, fontWeight:'600', marginBottom:12 },
  actionsRow:{ flexDirection:'row', gap:10, marginBottom:12 },
  actionBtn:{ backgroundColor:colors.card, paddingHorizontal:14, paddingVertical:10, borderRadius:12, borderWidth:1, borderColor:colors.border },
  actionBtnDisabled:{ opacity:0.5 },
  actionTxt:{ color:colors.textPrimary, fontSize:13, fontWeight:'600' },
  preview:{ width:'100%', height:200, borderRadius:16, marginBottom:14, borderWidth:1, borderColor:colors.border, backgroundColor:'#111' },
  error:{ color:'#ef4444', fontSize:12, marginBottom:12 },
  card:{ backgroundColor:colors.cardAlt, padding:12, borderRadius:16, marginBottom:12, borderWidth:1, borderColor:colors.border },
  dishName:{ color:colors.textPrimary, fontSize:14, fontWeight:'600', marginBottom:6 },
  qty:{ color:colors.textSecondary, fontSize:12, marginBottom:8 },
  macrosRow:{ flexDirection:'row', justifyContent:'space-between' },
  macroInput:{ backgroundColor:colors.card, color:colors.textPrimary, paddingHorizontal:8, paddingVertical:4, borderRadius:8, width:60, textAlign:'center', borderWidth:1, borderColor:colors.borderAlt, fontSize:12 },
  saveBtn:{ backgroundColor:colors.accent, paddingVertical:14, borderRadius:16, alignItems:'center', marginTop:8 },
  saveTxt:{ color:'#04140a', fontSize:15, fontWeight:'700' }
});
