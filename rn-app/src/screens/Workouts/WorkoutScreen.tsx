import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { colors } from '../../theme/colors';
import { useWorkoutStore } from '../../store/workoutStore';

export default function WorkoutScreen() {
  const { workouts, load, add, remove, loading } = useWorkoutStore();
  const [form, setForm] = useState({ exerciseName:'', sets:'', reps:'', weight:'' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { load(); }, []);

  const submit = async () => {
    if (!form.exerciseName || !form.sets || !form.reps) return;
    setSubmitting(true);
    await add({
      exerciseName: form.exerciseName,
      sets: Number(form.sets),
      reps: Number(form.reps),
      weight: form.weight ? Number(form.weight) : 0,
      date: new Date().toISOString().slice(0,10)
    });
    setForm({ exerciseName:'', sets:'', reps:'', weight:'' });
    setSubmitting(false);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS==='ios' ? 'padding': undefined}>
      <Text style={styles.title}>Workouts</Text>
      <View style={styles.formRow}>
  <TextInput placeholder='Esercizio' placeholderTextColor='#666' style={styles.input} value={form.exerciseName} onChangeText={(t:string)=>setForm((s: typeof form)=>({...s,exerciseName:t}))} />
  <TextInput placeholder='Sets' placeholderTextColor='#666' style={styles.inputNum} keyboardType='numeric' value={form.sets} onChangeText={(t:string)=>setForm((s: typeof form)=>({...s,sets:t}))} />
  <TextInput placeholder='Reps' placeholderTextColor='#666' style={styles.inputNum} keyboardType='numeric' value={form.reps} onChangeText={(t:string)=>setForm((s: typeof form)=>({...s,reps:t}))} />
  <TextInput placeholder='Kg' placeholderTextColor='#666' style={styles.inputNum} keyboardType='numeric' value={form.weight} onChangeText={(t:string)=>setForm((s: typeof form)=>({...s,weight:t}))} />
        <Pressable disabled={submitting} onPress={submit} style={styles.addBtn}><Text style={styles.addText}>+</Text></Pressable>
      </View>
  {loading && workouts.length===0 ? <ActivityIndicator color={colors.accent} />: (
        <FlatList
          data={workouts}
          keyExtractor={(i:any)=>String(i.id)}
          style={{marginTop:12}}
          renderItem={({item}:any)=>(
            <View style={styles.item}> 
              <View style={{flex:1}}>
                <Text style={styles.itemTitle}>{item.exerciseName}</Text>
                <Text style={styles.itemMeta}>{item.sets}x{item.reps} {item.weight? item.weight+'kg':''}</Text>
              </View>
              <Pressable onPress={()=>remove(item.id)}><Text style={styles.delete}>✕</Text></Pressable>
            </View>
          )}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:{ flex:1, backgroundColor:colors.background, padding:16 },
  title:{ color:colors.textPrimary, fontSize:24, fontWeight:'600', marginBottom:8 },
  formRow:{ flexDirection:'row', alignItems:'center', flexWrap:'wrap', gap:6 },
  input:{ backgroundColor:colors.cardAlt, color:colors.textPrimary, padding:8, borderRadius:8, flexGrow:1, flexBasis:120 },
  inputNum:{ backgroundColor:colors.cardAlt, color:colors.textPrimary, padding:8, borderRadius:8, width:60, textAlign:'center' },
  addBtn:{ backgroundColor:colors.accent, width:40, height:40, borderRadius:8, alignItems:'center', justifyContent:'center' },
  addText:{ color:'#fff', fontSize:24, lineHeight:24 },
  item:{ flexDirection:'row', backgroundColor:colors.card, padding:12, borderRadius:10, marginBottom:8, alignItems:'center' },
  itemTitle:{ color:colors.textPrimary, fontSize:16 },
  itemMeta:{ color:colors.textMuted, fontSize:12, marginTop:2 },
  delete:{ color:colors.danger, fontSize:18, paddingHorizontal:8 }
});