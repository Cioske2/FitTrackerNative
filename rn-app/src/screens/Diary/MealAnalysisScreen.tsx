import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, ScrollView, Pressable, TextInput, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
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
  const [imageLoading, setImageLoading] = useState(false);
  const [error, setError] = useState('');
  const [dishes, setDishes] = useState<ParsedDish[]>([]);
  const addCompositeMeal = useDiaryStore(s => s.addCompositeMealFromAI); // implement in store later if missing

  const pickImage = async () => {
    setError('');
    setImageLoading(true);
    setImageUri(null);
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) { setError('Permesso galleria negato'); return; }
      const res = await ImagePicker.launchImageLibraryAsync({ quality: 0.85, base64: true });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        const asset = res.assets[0];
        setImageUri(asset.uri || null);
        setDishes([]);
      }
    } finally {
      setImageLoading(false);
    }
  };

  const takePhoto = async () => {
    setError('');
    setImageLoading(true);
    setImageUri(null);
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) { setError('Permesso fotocamera negato'); return; }
      const res = await ImagePicker.launchCameraAsync({ quality: 0.85, base64: true });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        const asset = res.assets[0];
        setImageUri(asset.uri || null);
        setDishes([]);
      }
    } finally {
      setImageLoading(false);
    }
  };

  const analyze = async () => {
    if (!imageUri) { setError('Seleziona o scatta un\'immagine'); return; }
    setLoading(true); setError(''); setDishes([]);
    try {
      const result = await analyzeMealImage(imageUri);
      setDishes(result);
      if (result.length === 0) setError('Nessun piatto riconosciuto');
    } catch (e: any) {
      setError(e.message || 'Errore analisi');
    } finally { setLoading(false); }
  };

  const navigation = useNavigation();

  const saveMeal = async () => {
    if (!dishes.length) { Alert.alert('Nessun piatto'); return; }
    try {
      if (typeof addCompositeMeal === 'function') {
        await addCompositeMeal({ dishes });
        Alert.alert('Pasto salvato', `Pasto AI salvato con ${dishes.length} piatti!`, [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
        setDishes([]); setImageUri(null);
      } else {
        Alert.alert('Funzione non disponibile', 'Salvataggio non implementato su questo store.');
      }
    } catch (e: any) { Alert.alert('Errore salvataggio', e.message); }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Analizza Pasto</Text>
      <Text style={styles.subtitle}>Scatta una foto o seleziona un'immagine del tuo pasto per analizzarne i valori nutrizionali</Text>

      <View style={styles.imagePickerSection}>
        {imageLoading ? (
          <View style={styles.emptyImageBox}>
            <ActivityIndicator color={colors.accent} size="large" />
            <Text style={[styles.emptyImageText, { marginTop: 10 }]}>Caricamento immagine…</Text>
          </View>
        ) : imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.preview} />
        ) : (
          <View style={styles.emptyImageBox}>
            <Text style={styles.emptyImageIcon}>📸</Text>
            <Text style={styles.emptyImageText}>Nessuna immagine selezionata</Text>
          </View>
        )}
      </View>

      <View style={styles.actionsRow}>
        <Pressable onPress={pickImage} style={styles.actionBtn}>
          <Text style={styles.actionIcon}>🖼️</Text>
          <Text style={styles.actionTxt}>Galleria</Text>
        </Pressable>
        <Pressable onPress={takePhoto} style={styles.actionBtn}>
          <Text style={styles.actionIcon}>📷</Text>
          <Text style={styles.actionTxt}>Fotocamera</Text>
        </Pressable>
      </View>

      <Pressable
        onPress={analyze}
        disabled={!imageUri || loading || imageLoading}
        style={[styles.analyzeBtn, (!imageUri || loading || imageLoading) && styles.analyzeBtnDisabled]}
      >
        {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.analyzeBtnTxt}>✨ Analizza con AI</Text>
          )}
      </Pressable>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {dishes.map(d => (
        <View key={d.id} style={styles.card}>
          <TextInput value={d.name} onChangeText={t => setDishes(p => p.map(x => x.id === d.id ? { ...x, name: t } : x))} style={styles.dishName} />
          <TextInput value={d.quantityText} onChangeText={t => setDishes(p => p.map(x => x.id === d.id ? { ...x, quantityText: t } : x))} style={styles.qty} />
          <View style={styles.macrosRow}>
            <MacroInput label="Cal" value={String(Math.round(d.calories))} onChange={v => updateDish(d.id, { calories: Number(v) || 0 })} />
            <MacroInput label="P" value={String(d.protein.toFixed(1))} onChange={v => updateDish(d.id, { protein: Number(v) || 0 })} />
            <MacroInput label="C" value={String(d.carbs.toFixed(1))} onChange={v => updateDish(d.id, { carbs: Number(v) || 0 })} />
            <MacroInput label="F" value={String(d.fat.toFixed(1))} onChange={v => updateDish(d.id, { fat: Number(v) || 0 })} />
          </View>
        </View>
      ))}
      {dishes.length > 0 && (
        <Pressable onPress={saveMeal} style={[styles.saveBtn]}><Text style={styles.saveTxt}>Salva Pasto</Text></Pressable>
      )}
    </ScrollView>
  );

  function updateDish(id: string, patch: Partial<ParsedDish>) {
    setDishes(prev => prev.map(d => d.id === id ? { ...d, ...patch } : d));
  }
}

function MacroInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ color: colors.textMuted, fontSize: 10 }}>{label}</Text>
      <TextInput value={value} onChangeText={onChange} keyboardType='numeric' style={styles.macroInput} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: colors.background, paddingBottom: 40 },
  title: { color: colors.textPrimary, fontSize: 24, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  subtitle: { color: colors.textMuted, fontSize: 14, marginBottom: 20, textAlign: 'center', lineHeight: 20 },
  imagePickerSection: { marginBottom: 20 },
  emptyImageBox: {
    width: '100%',
    height: 220,
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center'
  },
  emptyImageIcon: { fontSize: 48, marginBottom: 8, opacity: 0.5 },
  emptyImageText: { color: colors.textMuted, fontSize: 14 },
  actionsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  actionBtn: {
    flex: 1,
    backgroundColor: colors.card,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center'
  },
  actionIcon: { fontSize: 28, marginBottom: 6 },
  actionTxt: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  analyzeBtn: {
    backgroundColor: colors.accent,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8
  },
  analyzeBtnDisabled: { opacity: 0.5 },
  analyzeBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
  preview: { width: '100%', height: 220, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: '#111' },
  error: { color: '#ef4444', fontSize: 13, marginBottom: 12, textAlign: 'center', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: 12, borderRadius: 12 },
  card: { backgroundColor: colors.cardAlt, padding: 14, borderRadius: 16, marginBottom: 14, borderWidth: 1, borderColor: colors.border },
  dishName: { color: colors.textPrimary, fontSize: 15, fontWeight: '600', marginBottom: 6, borderBottomWidth: 1, borderColor: colors.borderAlt, paddingBottom: 4 },
  qty: { color: colors.textSecondary, fontSize: 13, marginBottom: 10 },
  macrosRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  macroInput: { backgroundColor: colors.card, color: colors.textPrimary, paddingHorizontal: 8, paddingVertical: 6, borderRadius: 10, width: 65, textAlign: 'center', borderWidth: 1, borderColor: colors.borderAlt, fontSize: 13, fontWeight: '600' },
  saveBtn: { backgroundColor: colors.accent, paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginTop: 8 },
  saveTxt: { color: '#fff', fontSize: 16, fontWeight: '700' }
});
