import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform, useWindowDimensions, ScrollView, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
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

  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const wrapStyle = [
    styles.container,
    width > 720 ? { maxWidth: 720 } : undefined,
    {
      paddingTop: 20 + insets.top,
      paddingBottom: 40 + insets.bottom,
      alignSelf: 'center' as const,
      width: width,
    },
  ];
  return (
    <KeyboardAvoidingView style={{flex:1, backgroundColor:colors.background}} behavior={Platform.OS==='ios'?'padding':undefined}>
      <ScrollView contentContainerStyle={{paddingBottom:0}}>
        <View style={wrapStyle}>
          <Text style={styles.title}>Obiettivi</Text>
          {!goals && <ActivityIndicator color={colors.accent} />}
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
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:{ flex:1, backgroundColor:colors.background, padding:20 },
  title:{ color:colors.textPrimary, fontSize:24, fontWeight:'600', marginBottom:20 },
  form:{ gap:14 },
  fieldRow:{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', backgroundColor:colors.cardAlt, padding:10, borderRadius:12, borderWidth:1, borderColor:colors.border },
  label:{ color:colors.textPrimary, width:120, textTransform:'capitalize', fontWeight:'500' },
  input:{ backgroundColor:colors.card, color:colors.textPrimary, padding:10, borderRadius:10, flex:1, marginLeft:8, borderWidth:1, borderColor:colors.borderAlt },
  button:{ backgroundColor:colors.accent, padding:16, borderRadius:14, alignItems:'center', marginTop:16 },
  secondary:{ backgroundColor:colors.card },
  buttonText:{ color:'#fff', fontWeight:'600', letterSpacing:0.5 }
});