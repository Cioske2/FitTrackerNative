import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, SectionList, TextInput, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform, Modal, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { useWorkoutStore } from '../../store/workoutStore';
import Card from '../../components/layout/Card';

export default function WorkoutScreen() {
  const { workouts, load, add, remove, loading } = useWorkoutStore();
  const [form, setForm] = useState({ exerciseName:'', sets:'', reps:'', weight:'' });
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => { load(); }, []);

  const grouped = useMemo(()=>groupByDate(workouts), [workouts]);
  const sections = useMemo(()=> grouped.map(g => ({ title:g.date, data:g.items })), [grouped]);
  const totalVolume7d = useMemo(()=>{
    // simple total of sets*reps*weight (if weight) for last 7 days
    const today = new Date();
    const cutoff = new Date(); cutoff.setDate(today.getDate()-6);
    return workouts.filter(w=>{ const d=new Date(w.date); return d>=cutoff; })
      .reduce((acc,w)=> acc + (w.weight? w.sets*w.reps*w.weight: 0), 0);
  }, [workouts]);

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
    setModalOpen(false);
  };

  const [barW, setBarW] = useState(0);

  return (
    <View style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={(i:any)=>String(i.id)}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={
          <View>
            <Text style={styles.title}>Allenamenti</Text>
            <Card style={styles.progressCard}>
              <Text style={styles.progressLabel}>Volume ultimi 7 giorni</Text>
              <Text style={styles.progressValue}>{Math.round(totalVolume7d)} kg reps</Text>
              <View style={styles.progressBarOuter} onLayout={e=> setBarW(e.nativeEvent.layout.width)}> 
                {(() => { const max = 50000; const pctVal = Math.min(1, (totalVolume7d / max)); const w = barW * pctVal; return (
                  <View style={[styles.progressFill,{ width: w }]} />
                ); })()}
              </View>
              <Text style={styles.progressHint}>Obiettivo riferimento 50k</Text>
            </Card>
            <Text style={styles.sectionHeading}>Cronologia</Text>
          </View>
        }
        renderSectionHeader={({section}) => (
          <Text style={styles.dateHeader}>{section.title}</Text>
        )}
        renderItem={({item}:any)=>(
          <Card style={styles.itemCard}>
            <View style={{flex:1}}>
              <Text style={styles.itemTitle}>{item.exerciseName}</Text>
              <Text style={styles.itemMeta}>{item.sets}x{item.reps} {item.weight? item.weight+'kg':''}</Text>
            </View>
            <Pressable onPress={()=>remove(item.id)}><Text style={styles.delete}>✕</Text></Pressable>
          </Card>
        )}
        ListEmptyComponent={loading? <ActivityIndicator color={colors.accent} /> : <Text style={styles.empty}>Nessun allenamento</Text>}
        contentContainerStyle={{ paddingBottom:120, paddingTop:12 }}
      />
      <Pressable style={styles.fab} onPress={()=>setModalOpen(true)}>
        <Text style={styles.fabPlus}>+</Text>
      </Pressable>
      <Modal visible={modalOpen} animationType='slide' transparent>
        <KeyboardAvoidingView style={styles.modalWrap} behavior={Platform.OS==='ios'?'padding':undefined}>
          <View style={styles.sheet}>            
            <Text style={styles.sheetTitle}>Nuovo Allenamento</Text>
            <TextInput placeholder='Esercizio' placeholderTextColor={colors.textMuted} style={styles.input} value={form.exerciseName} onChangeText={(t:string)=>setForm(s=>({...s,exerciseName:t}))} />
            <View style={styles.inlineRow}>
              <TextInput placeholder='Sets' placeholderTextColor={colors.textMuted} style={styles.inputNum} keyboardType='numeric' value={form.sets} onChangeText={(t:string)=>setForm(s=>({...s,sets:t}))} />
              <TextInput placeholder='Reps' placeholderTextColor={colors.textMuted} style={styles.inputNum} keyboardType='numeric' value={form.reps} onChangeText={(t:string)=>setForm(s=>({...s,reps:t}))} />
              <TextInput placeholder='Kg' placeholderTextColor={colors.textMuted} style={styles.inputNum} keyboardType='numeric' value={form.weight} onChangeText={(t:string)=>setForm(s=>({...s,weight:t}))} />
            </View>
            <Pressable disabled={submitting} onPress={submit} style={[styles.submitBtn, submitting && {opacity:0.7}]}><Text style={styles.submitTxt}>{submitting? '...' : 'Salva'}</Text></Pressable>
            <Pressable style={styles.cancelBtn} onPress={()=>setModalOpen(false)}><Text style={styles.cancelTxt}>Annulla</Text></Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function groupByDate(items:any[]){
  const map: Record<string, any[]> = {};
  items.forEach(i=>{ if(!map[i.date]) map[i.date]=[]; map[i.date].push(i); });
  return Object.entries(map).sort((a,b)=> b[0].localeCompare(a[0])).map(([date,items])=>({ date, items }));
}

const styles = StyleSheet.create({
  container:{ flex:1, backgroundColor:colors.background, paddingHorizontal:16 },
  title:{ color:colors.textPrimary, fontSize:22, fontWeight:'600', marginBottom:14, textAlign:'center' },
  progressCard:{ marginBottom:24, padding:18 },
  progressLabel:{ color:colors.textMuted, fontSize:11, textTransform:'uppercase', letterSpacing:0.5, marginBottom:8 },
  progressValue:{ color:colors.textPrimary, fontSize:18, fontWeight:'600', marginBottom:10 },
  progressBarOuter:{ height:10, backgroundColor:colors.cardAlt, borderRadius:6, overflow:'hidden', marginBottom:6 },
  progressFill:{ height:'100%', backgroundColor:colors.accent },
  progressHint:{ color:colors.textMuted, fontSize:10, letterSpacing:0.5 },
  sectionHeading:{ color:colors.textPrimary, fontSize:15, fontWeight:'600', marginBottom:8 },
  dateHeader:{ color:colors.textMuted, fontSize:12, marginTop:24, marginBottom:8, letterSpacing:0.5 },
  itemCard:{ flexDirection:'row', alignItems:'center', padding:14, marginBottom:10 },
  itemTitle:{ color:colors.textPrimary, fontSize:14, fontWeight:'600' },
  itemMeta:{ color:colors.textMuted, fontSize:11, marginTop:2 },
  delete:{ color:colors.danger, fontSize:18, paddingHorizontal:8 },
  fab:{ position:'absolute', bottom:28, right:24, backgroundColor:colors.accent, width:60, height:60, borderRadius:22, alignItems:'center', justifyContent:'center', shadowColor:'#000', shadowOpacity:0.4, shadowRadius:10, shadowOffset:{width:0,height:4}, elevation:8 },
  fabPlus:{ color:'#fff', fontSize:34, fontWeight:'700', marginTop:-2 },
  modalWrap:{ flex:1, justifyContent:'flex-end', backgroundColor:'rgba(0,0,0,0.5)' },
  sheet:{ backgroundColor:colors.cardElevated, padding:20, borderTopLeftRadius:28, borderTopRightRadius:28 },
  sheetTitle:{ color:colors.textPrimary, fontSize:18, fontWeight:'600', marginBottom:16, textAlign:'center' },
  input:{ backgroundColor:colors.card, color:colors.textPrimary, padding:12, borderRadius:12, borderWidth:1, borderColor:colors.borderAlt, marginBottom:14 },
  inlineRow:{ flexDirection:'row', gap:10, marginBottom:8 },
  inputNum:{ backgroundColor:colors.card, color:colors.textPrimary, padding:12, borderRadius:12, flex:1, textAlign:'center', borderWidth:1, borderColor:colors.borderAlt },
  submitBtn:{ backgroundColor:colors.accent, paddingVertical:14, borderRadius:14, alignItems:'center', marginTop:8 },
  submitTxt:{ color:'#04140a', fontWeight:'700', letterSpacing:0.5, fontSize:15 },
  cancelBtn:{ paddingVertical:14, borderRadius:14, alignItems:'center', marginTop:8, backgroundColor:colors.cardAlt },
  cancelTxt:{ color:colors.textMuted, fontWeight:'600', fontSize:13 },
  empty:{ color:colors.textMuted, textAlign:'center', marginTop:60 }
});