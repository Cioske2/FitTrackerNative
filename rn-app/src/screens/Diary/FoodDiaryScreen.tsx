import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, SectionList, Pressable, ActivityIndicator, RefreshControl, TextInput, KeyboardAvoidingView, Platform, ScrollView, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
  const [panelOpen, setPanelOpen] = useState(false);
  const [addingQuick, setAddingQuick] = useState(false);

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

  // Build recent foods from latest diary entries (unique by food_name_snapshot)
  const recentFoods = useMemo(()=>{
    const seen = new Set<string>();
    const list: any[] = [];
    [...entries].reverse().forEach(e=>{
      const key = e.food_name_snapshot?.toLowerCase();
      if (key && !seen.has(key)) { seen.add(key); list.push(e); }
    });
    return list.slice(0,5);
  }, [entries]);

  const addFromEntryTemplate = async (entryTemplate:any) => {
    if (addingQuick) return;
    setAddingQuick(true);
    try {
      // scale macros to 100g base (mockup mostra 100g)
      const baseQty = entryTemplate.consumed_quantity || 100;
      const targetQty = 100;
      const factor = baseQty ? (targetQty / baseQty) : 1;
      await addEntry({
        foodName: entryTemplate.food_name_snapshot,
        consumedQuantity: targetQty,
        consumedUnit: entryTemplate.consumed_unit || 'g',
        calculatedNutrients: {
          calories: Math.round((entryTemplate.calories_calculated||0)*factor),
          protein: (entryTemplate.protein_g_calculated||0)*factor,
          carbohydrates_total: (entryTemplate.carbohydrates_total_g_calculated||0)*factor,
          fat_total: (entryTemplate.fat_total_g_calculated||0)*factor
        },
        consumptionDate: date,
        mealType: null
      } as any);
    } finally { setAddingQuick(false); }
  };

  const addFromSearch = async (food:any) => {
    if (addingQuick) return;
    setAddingQuick(true);
    try {
      await addEntry({
        foodId: food.id,
        foodName: food.name,
        consumedQuantity: 100,
        consumedUnit: 'g',
        calculatedNutrients: {
          calories: food.calories || 0,
          protein: food.protein_g || 0,
          carbohydrates_total: food.carbohydrates_total_g || 0,
          fat_total: food.fat_total_g || 0
        },
        consumptionDate: date,
        mealType: null
      } as any);
      setSearch('');
    } finally { setAddingQuick(false); }
  };

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
  const { width } = useWindowDimensions();
  const contentWrapperStyle = useMemo(() => [styles.contentWrapper, width>720 && styles.contentWrapperWide], [width]);

  return (
    <View style={styles.container}>
      <View style={contentWrapperStyle}>
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
          ListHeaderComponent={<View><DailyTotalsDisplay /></View>}
        />
      )}
      <Pressable style={styles.fab} onPress={()=>setPanelOpen(true)}><Text style={styles.fabPlus}>+</Text></Pressable>

      {panelOpen && (
        <View style={styles.overlay}>
          <KeyboardAvoidingView style={styles.panelWrapper} behavior={Platform.OS==='ios'?'padding':undefined}>
            <View style={styles.panelBox}>
              <View style={styles.panelTopBar}>
                <Pressable onPress={()=>setPanelOpen(false)} style={styles.closeHit}><Ionicons name="close" size={22} color={colors.textPrimary}/></Pressable>
                <Text style={styles.panelTitle}>Aggiungi alimento</Text>
              </View>
              <ScrollView keyboardShouldPersistTaps='handled' contentContainerStyle={{paddingBottom:40}}>
                <View style={styles.searchBar}> 
                  <Ionicons name="search" size={16} color={colors.textMuted} style={{marginRight:8}} />
                  <TextInput
                    placeholder='Cerca alimento'
                    placeholderTextColor={colors.textMuted}
                    style={styles.searchInput}
                    value={search}
                    onChangeText={(t:string)=>{ setSearch(t); runSearch(t); }}
                  />
                </View>
                {results.length>0 && (
                  <View style={styles.resultsDropdown}>
                    {results.slice(0,6).map(r => (
                      <Pressable key={r.id} style={styles.resultRow} onPress={()=>addFromSearch(r)}>
                        <Text style={styles.resultText}>{r.name}</Text>
                        <Text style={styles.resultCals}>{Math.round(r.calories||0)} kcal</Text>
                      </Pressable>
                    ))}
                  </View>
                )}
                <Pressable style={styles.actionRow} onPress={()=>{ setPanelOpen(false); navigation.navigate('BarcodeScanner'); }}>
                  <View style={styles.actionIcon}><Ionicons name='barcode-outline' size={20} color={colors.accent} /></View>
                  <Text style={styles.actionLabel}>Scansiona codice a barre</Text>
                  <Ionicons name='chevron-forward' size={18} color={colors.textMuted} />
                </Pressable>
                <Pressable style={styles.actionRow}>
                  <View style={styles.actionIcon}><Ionicons name='sparkles-outline' size={20} color={colors.accent} /></View>
                  <View style={{flex:1}}>
                    <Text style={styles.actionLabel}>Analizza pasto con AI</Text>
                    <Text style={styles.actionSub}>Nuova funzione</Text>
                  </View>
                  <Ionicons name='chevron-forward' size={18} color={colors.textMuted} />
                </Pressable>
                <Text style={styles.recentsHeader}>Ultimi alimenti</Text>
                {recentFoods.map(r => (
                  <View key={r.id} style={styles.recentCard}>
                    <View style={styles.thumb}>{chooseEmoji(r.food_name_snapshot)}</View>
                    <View style={{flex:1}}>
                      <Text style={styles.recentName}>{r.food_name_snapshot}</Text>
                      <Text style={styles.recentQty}>100g</Text>
                    </View>
                    <Pressable disabled={addingQuick} onPress={()=>addFromEntryTemplate(r)} style={styles.addCircle}><Text style={styles.addCircleTxt}>+</Text></Pressable>
                  </View>
                ))}
                {recentFoods.length===0 && <Text style={styles.noRecent}>Nessun alimento recente</Text>}
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      )}
      </View>
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
  container:{ flex:1, backgroundColor:colors.background },
  contentWrapper:{ flex:1, padding:16, width:'100%', alignSelf:'center' },
  contentWrapperWide:{ maxWidth:720 },
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
  fab:{ position:'absolute', bottom:28, right:24, backgroundColor:colors.accent, width:62, height:62, borderRadius:22, alignItems:'center', justifyContent:'center', shadowColor:'#000', shadowOpacity:0.4, shadowRadius:10, shadowOffset:{width:0,height:4}, elevation:8 },
  fabPlus:{ color:'#04140a', fontSize:34, fontWeight:'700', marginTop:-2 },
  overlay:{ position:'absolute', top:0, left:0, right:0, bottom:0, backgroundColor:colors.background },
  panelWrapper:{ flex:1 },
  panelBox:{ flex:1, paddingTop:38, paddingHorizontal:18 },
  panelTopBar:{ flexDirection:'row', alignItems:'center', marginBottom:20 },
  closeHit:{ padding:6, marginRight:8 },
  panelTitle:{ flex:1, textAlign:'center', color:colors.textPrimary, fontSize:18, fontWeight:'600', letterSpacing:0.4 },
  searchBar:{ flexDirection:'row', alignItems:'center', backgroundColor:colors.cardAlt, borderRadius:12, paddingHorizontal:14, paddingVertical:10, borderWidth:1, borderColor:colors.borderAlt, marginBottom:16 },
  searchInput:{ flex:1, color:colors.textPrimary, fontSize:14 },
  resultsDropdown:{ backgroundColor:colors.card, borderRadius:12, borderWidth:1, borderColor:colors.borderAlt, marginBottom:16, overflow:'hidden' },
  actionRow:{ flexDirection:'row', alignItems:'center', backgroundColor:colors.cardAlt, padding:14, borderRadius:16, marginBottom:12, borderWidth:1, borderColor:colors.border },
  actionIcon:{ width:42, height:42, borderRadius:14, backgroundColor:colors.card, alignItems:'center', justifyContent:'center', marginRight:14, borderWidth:1, borderColor:colors.borderAlt },
  actionLabel:{ flex:1, color:colors.textPrimary, fontSize:14, fontWeight:'600' },
  actionSub:{ color:colors.textMuted, fontSize:11, marginTop:2 },
  recentsHeader:{ color:colors.textPrimary, fontSize:13, fontWeight:'600', marginTop:12, marginBottom:10, letterSpacing:0.5 },
  recentCard:{ flexDirection:'row', alignItems:'center', backgroundColor:colors.cardAlt, padding:12, borderRadius:16, marginBottom:10, borderWidth:1, borderColor:colors.border },
  thumb:{ width:46, height:46, borderRadius:14, backgroundColor:colors.card, borderWidth:1, borderColor:colors.borderAlt, alignItems:'center', justifyContent:'center', marginRight:14 },
  recentName:{ color:colors.textPrimary, fontSize:14, fontWeight:'600' },
  recentQty:{ color:colors.textMuted, fontSize:11, marginTop:2 },
  addCircle:{ backgroundColor:colors.card, width:40, height:40, borderRadius:14, alignItems:'center', justifyContent:'center', borderWidth:1, borderColor:colors.borderAlt },
  addCircleTxt:{ color:colors.accent, fontSize:24, fontWeight:'700', marginTop:-2 },
  noRecent:{ color:colors.textMuted, fontSize:12, textAlign:'center', marginTop:24 }
});

function chooseEmoji(name:string){
  const lower = (name||'').toLowerCase();
  let emoji = '🍽️';
  if (lower.includes('pollo')||lower.includes('chicken')) emoji='🍗';
  else if (lower.includes('riso')||lower.includes('rice')) emoji='🍚';
  else if (lower.includes('brocc')) emoji='🥦';
  else if (lower.includes('pane')||lower.includes('bread')) emoji='🍞';
  return <Text style={{fontSize:20}}>{emoji}</Text>;
}
