import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, SectionList, Pressable, ActivityIndicator, RefreshControl, TextInput } from 'react-native';
import { colors } from '../../theme/colors';
import DailyTotalsDisplay from '../../components/DailyTotalsDisplay';
import { useDiaryStore } from '../../store/diaryStore';
import { useFoodStore } from '../../store/foodStore';

interface QuickAddState {
  name: string;
  quantity: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
}

import { NativeStackNavigationProp } from '@react-navigation/native-stack';
type Props = { navigation: NativeStackNavigationProp<any> };
export default function FoodDiaryScreen({ navigation }: Props) {
  const { entries, load, loading, date, addEntry, setDate, removeEntry } = useDiaryStore();
  const { search, setSearch, runSearch, results } = useFoodStore();
  const [quick, setQuick] = useState<QuickAddState>({ name:'', quantity:'100', calories:'0', protein:'0', carbs:'0', fat:'0' });
  const [adding, setAdding] = useState(false);

  useEffect(() => { load(); }, [date]);

  const [mealType, setMealType] = useState<string|null>(null);
  const [notes, setNotes] = useState('');
  const mealTypes: { key: string; label: string }[] = [
    { key:'breakfast', label:'Colazione' },
    { key:'lunch', label:'Pranzo' },
    { key:'dinner', label:'Cena' },
    { key:'snack', label:'Snack' }
  ];

  const numeric = (v:string) => Number(v.replace(/,/g,'.')) || 0;
  const errors = useMemo(()=>{
    const errs:string[] = [];
    if (!quick.name.trim()) errs.push('Nome richiesto');
    const qty = numeric(quick.quantity); if (qty<=0) errs.push('Quantità > 0');
    ['calories','protein','carbs','fat'].forEach(k=>{ const val = numeric((quick as any)[k]); if (val < 0) errs.push('Valori macro non negativi'); });
    return errs;
  }, [quick]);

  const canAdd = errors.length===0 && !adding;

  const submitQuick = async () => {
    if (!canAdd) return;
    const qty = numeric(quick.quantity);
    setAdding(true);
    try {
      await addEntry({
        foodName: quick.name.trim(),
        consumedQuantity: qty,
        consumedUnit: 'g',
        calculatedNutrients: {
          calories: numeric(quick.calories),
          protein: numeric(quick.protein),
          carbohydrates_total: numeric(quick.carbs),
          fat_total: numeric(quick.fat)
        },
        consumptionDate: date,
        mealType,
        notes: notes.trim() || undefined
      } as any);
      setQuick({ name:'', quantity:'100', calories:'0', protein:'0', carbs:'0', fat:'0' });
      setMealType(null); setNotes(''); setSearch('');
    } finally { setAdding(false); }
  };

  const shiftDate = (delta:number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + delta);
    const next = d.toISOString().slice(0,10);
    setDate(next);
  };

  const sections = useMemo(()=>buildSections(entries), [entries]);
  const keyExtractor = useCallback((i:any)=>String(i.id), []);
  const getItemLayout = useCallback((_:any, index:number)=>({ length:72, offset:72*index, index }), []);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.dateNav}>          
          <Pressable onPress={()=>shiftDate(-1)} style={styles.navBtn}><Text style={styles.navBtnText}>{'<'}</Text></Pressable>
          <Text style={styles.title}>{date}</Text>
          <Pressable onPress={()=>shiftDate(1)} style={styles.navBtn}><Text style={styles.navBtnText}>{'>'}</Text></Pressable>
        </View>
        <Pressable onPress={() => navigation.navigate('BarcodeScanner')}><Text style={styles.scan}>Scanner</Text></Pressable>
      </View>
      {loading && entries.length === 0 ? (
  <ActivityIndicator color={colors.accent} />
      ) : (
        <SectionList
          sections={sections}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.accent} />}
          keyExtractor={keyExtractor}
          ListEmptyComponent={<Text style={styles.empty}>Nessuna voce per oggi</Text>}
          getItemLayout={getItemLayout}
          renderItem={({item}:any) => (
            <View style={styles.entry}> 
              <View style={{flex:1}}>
                <Text style={styles.entryText}>{item.food_name_snapshot}</Text>
                <Text style={styles.entryQty}>{item.consumed_quantity}{item.consumed_unit} · {Math.round(item.calories_calculated)} kcal</Text>
              </View>
              <View style={styles.rowActions}>                
                <Pressable onPress={()=>navigation.navigate('EditDiaryEntry',{ id: item.id })}><Text style={styles.action}>✎</Text></Pressable>
                <Pressable onPress={()=>removeEntry(item.id)}><Text style={styles.actionDelete}>✕</Text></Pressable>
              </View>
            </View>
          )}
          renderSectionHeader={({section}) => (
            <View style={styles.sectionHeader}> 
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionSub}>{section.meta}</Text>
            </View>
          )}
          initialNumToRender={25}
          stickySectionHeadersEnabled
          removeClippedSubviews
          windowSize={5}
          ListHeaderComponent={
            <View>
              <DailyTotalsDisplay />
              <View style={styles.searchBox}>
                <TextInput
                  placeholder='Cerca alimento...'
                  placeholderTextColor='#666'
                  style={styles.input}
                  value={search}
                  onChangeText={(t:string)=>{ setSearch(t); runSearch(t); }}
                />
                {results.length>0 && (
                  <View style={styles.resultsBox}>
                    {results.slice(0,6).map(r => (
                      <Pressable key={r.id} style={styles.resultRow} onPress={()=>{
                        setQuick(q=>({ ...q, name:r.name, calories:String(r.calories||0), protein:String(r.protein_g||0), carbs:String(r.carbohydrates_total_g||0), fat:String(r.fat_total_g||0) }));
                        setSearch('');
                      }}>
                        <Text style={styles.resultText}>{r.name}</Text>
                        <Text style={styles.resultCals}>{Math.round(r.calories||0)} kcal</Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
              <View style={styles.quickBox}>
                <Text style={styles.quickTitle}>Quick Add</Text>
                <View style={styles.mealRow}>
                  {mealTypes.map(mt => (
                    <Pressable key={mt.key} onPress={()=>setMealType(mealType===mt.key? null: mt.key)} style={[styles.mealBtn, mealType===mt.key && styles.mealBtnActive]}>
                      <Text style={[styles.mealBtnText, mealType===mt.key && styles.mealBtnTextActive]}>{mt.label}</Text>
                    </Pressable>
                  ))}
                </View>
                <TextInput placeholder='Nome alimento' placeholderTextColor='#666' style={styles.input} value={quick.name} onChangeText={(t:string)=>setQuick((s:QuickAddState)=>({...s,name:t}))} />
                <View style={styles.rowWrap}>
                  <TextInput placeholder='Qty g' placeholderTextColor='#666' style={styles.inputNum} keyboardType='numeric' value={quick.quantity} onChangeText={(t:string)=>setQuick((s:QuickAddState)=>({...s,quantity:t}))} />
                  <TextInput placeholder='kcal' placeholderTextColor='#666' style={styles.inputNum} keyboardType='numeric' value={quick.calories} onChangeText={(t:string)=>setQuick((s:QuickAddState)=>({...s,calories:t}))} />
                  <TextInput placeholder='P' placeholderTextColor='#666' style={styles.inputNum} keyboardType='numeric' value={quick.protein} onChangeText={(t:string)=>setQuick((s:QuickAddState)=>({...s,protein:t}))} />
                  <TextInput placeholder='C' placeholderTextColor='#666' style={styles.inputNum} keyboardType='numeric' value={quick.carbs} onChangeText={(t:string)=>setQuick((s:QuickAddState)=>({...s,carbs:t}))} />
                  <TextInput placeholder='F' placeholderTextColor='#666' style={styles.inputNum} keyboardType='numeric' value={quick.fat} onChangeText={(t:string)=>setQuick((s:QuickAddState)=>({...s,fat:t}))} />
                  <Pressable disabled={!canAdd} style={[styles.addBtn, !canAdd && styles.addBtnDisabled]} onPress={submitQuick}><Text style={styles.addBtnText}>{adding? '...' : '+'}</Text></Pressable>
                </View>
                <TextInput placeholder='Note (opzionale)' placeholderTextColor='#666' style={styles.input} value={notes} onChangeText={setNotes} />
                {errors.length>0 && (
                  <Text style={styles.errorText}>{errors[0]}</Text>
                )}
              </View>
            </View>
          }
        />
      )}
    </View>
  );
}

function buildSections(entries: any[]) {
  const order = ['breakfast','lunch','dinner','snack'];
  const groups: Record<string, any[]> = {};
  entries.forEach(e => {
    const key = e.meal_type || 'other';
    if (!groups[key]) groups[key] = [];
    groups[key].push(e);
  });
  const computeMeta = (arr:any[]) => {
    let cal=0, p=0,c=0,f=0; arr.forEach(e=>{ cal+=e.calories_calculated||0; p+=e.protein_g_calculated||0; c+=e.carbohydrates_total_g_calculated||0; f+=e.fat_total_g_calculated||0; });
    return `${Math.round(cal)} kcal · P${Math.round(p)} C${Math.round(c)} F${Math.round(f)}`;
  };
  const sections: any[] = [];
  order.forEach(k => { if (groups[k]) sections.push({ title: labelForMeal(k), data: groups[k], meta: computeMeta(groups[k]) }); });
  if (groups['other']) sections.push({ title:'Altro', data: groups['other'], meta: computeMeta(groups['other']) });
  return sections;
}
function labelForMeal(k:string){ switch(k){ case 'breakfast': return 'Colazione'; case 'lunch': return 'Pranzo'; case 'dinner': return 'Cena'; case 'snack': return 'Snack'; default: return 'Altro'; } }

const styles = StyleSheet.create({
  container:{ flex:1, backgroundColor:colors.background, padding:16 },
  headerRow:{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:12 },
  title:{ fontSize:18, fontWeight:'600', color:colors.textPrimary, letterSpacing:0.5 },
  scan:{ color:colors.accent, fontSize:13, fontWeight:'600' },
  dateNav:{ flexDirection:'row', alignItems:'center', gap:8 },
  navBtn:{ backgroundColor:colors.cardAlt, paddingHorizontal:10, paddingVertical:6, borderRadius:8 },
  navBtnText:{ color:colors.accent, fontSize:16, fontWeight:'700' },
  entry:{ padding:12, backgroundColor:colors.card, borderRadius:14, marginBottom:10, flexDirection:'row', justifyContent:'space-between', borderWidth:1, borderColor:colors.border },
  entryText:{ color:colors.textPrimary, fontSize:14, fontWeight:'500' },
  entryQty:{ color:colors.textMuted, fontSize:11, marginTop:2 },
  rowActions:{ flexDirection:'row', alignItems:'center', gap:10 },
  action:{ color:colors.accent, fontSize:16, paddingHorizontal:4 },
  actionDelete:{ color:'#ef4444', fontSize:16, paddingHorizontal:4 },
  sectionHeader:{ backgroundColor:colors.background, paddingTop:18, paddingBottom:6 },
  sectionTitle:{ color:colors.textPrimary, fontSize:15, fontWeight:'600' },
  sectionSub:{ color:colors.textMuted, fontSize:11, marginTop:2 },
  empty:{ color:colors.textFaint, textAlign:'center', marginTop:32 },
  quickBox:{ backgroundColor:colors.cardAlt, padding:14, borderRadius:16, marginBottom:18, borderWidth:1, borderColor:colors.border },
  quickTitle:{ color:colors.textPrimary, fontWeight:'600', marginBottom:10, fontSize:15 },
  input:{ backgroundColor:colors.card, color:colors.textPrimary, padding:10, borderRadius:10, marginBottom:10, fontSize:13, borderWidth:1, borderColor:colors.borderAlt },
  rowWrap:{ flexDirection:'row', flexWrap:'wrap', alignItems:'center', gap:6, marginBottom:6 },
  inputNum:{ backgroundColor:colors.card, color:colors.textPrimary, padding:8, borderRadius:10, width:62, textAlign:'center', fontSize:12, borderWidth:1, borderColor:colors.borderAlt },
  addBtn:{ backgroundColor:colors.accent, paddingVertical:10, paddingHorizontal:14, borderRadius:10 },
  addBtnDisabled:{ backgroundColor:colors.accentMuted },
  addBtnText:{ color:'#fff', fontSize:18, fontWeight:'700' },
  searchBox:{ marginBottom:18 },
  resultsBox:{ position:'absolute', top:50, left:0, right:0, backgroundColor:colors.card, borderRadius:12, borderWidth:1, borderColor:colors.borderAlt, zIndex:20, paddingVertical:4 },
  resultRow:{ paddingVertical:8, paddingHorizontal:12, flexDirection:'row', justifyContent:'space-between' },
  resultText:{ color:colors.textPrimary, flex:1, paddingRight:8, fontSize:13 },
  resultCals:{ color:colors.textMuted, fontSize:12 },
  mealRow:{ flexDirection:'row', flexWrap:'wrap', gap:8, marginBottom:10 },
  mealBtn:{ backgroundColor:colors.card, paddingVertical:6, paddingHorizontal:12, borderRadius:20, borderWidth:1, borderColor:colors.borderAlt },
  mealBtnActive:{ backgroundColor:colors.accent, borderColor:colors.accent },
  mealBtnText:{ color:colors.textSecondary, fontSize:12, fontWeight:'500' },
  mealBtnTextActive:{ color:'#04140a', fontWeight:'700' },
  errorText:{ color:colors.danger, fontSize:12, marginTop:4 },
});
