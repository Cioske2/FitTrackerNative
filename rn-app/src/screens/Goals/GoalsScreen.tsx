import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useGoalsStore } from '../../store/goalsStore';

export default function GoalsScreen() {
  const { goals, load, save, reset } = useGoalsStore();
  const [local, setLocal] = useState({ calories:'', protein:'', carbohydrates:'', fat:'' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);
  useEffect(() => { if (goals) setLocal({
    calories: String(goals.calories),
    protein: String(goals.protein),
    carbohydrates: String(goals.carbohydrates),
    fat: String(goals.fat)
  }); }, [goals]);

  const commit = async () => {
    setSaving(true);
    await save({
      calories: Number(local.calories),
      protein: Number(local.protein),
      carbohydrates: Number(local.carbohydrates),
      fat: Number(local.fat)
    });
    setSaving(false);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS==='ios'?'padding':undefined}>
      <Text style={styles.title}>Obiettivi</Text>
      {!goals && <ActivityIndicator color="#10b981" />}
      {goals && (
        <View style={styles.form}>
          {(['calories','protein','carbohydrates','fat'] as const).map((key) => (
            <View key={key} style={styles.fieldRow}>
              <Text style={styles.label}>{key}</Text>
              <TextInput
                keyboardType='numeric'
                value={(local as any)[key]}
                onChangeText={(t: string) => setLocal((s: typeof local) => ({ ...s, [key]: t }))}
                style={styles.input}
              />
            </View>
          ))}
          <Pressable disabled={saving} style={styles.button} onPress={commit}>
            <Text style={styles.buttonText}>{saving ? 'Salvataggio...' : 'Salva'}</Text>
          </Pressable>
          <Pressable disabled={saving} style={[styles.button, styles.secondary]} onPress={reset}>
            <Text style={styles.buttonText}>Reset Default</Text>
          </Pressable>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:{ flex:1, backgroundColor:'#000', padding:16 },
  title:{ color:'#fff', fontSize:24, fontWeight:'600', marginBottom:16 },
  form:{ gap:12 },
  fieldRow:{ flexDirection:'row', alignItems:'center', justifyContent:'space-between' },
  label:{ color:'#fff', width:120, textTransform:'capitalize' },
  input:{ backgroundColor:'#1f2937', color:'#fff', padding:8, borderRadius:8, flex:1 },
  button:{ backgroundColor:'#10b981', padding:14, borderRadius:10, alignItems:'center', marginTop:12 },
  secondary:{ backgroundColor:'#374151' },
  buttonText:{ color:'#fff', fontWeight:'600' }
});