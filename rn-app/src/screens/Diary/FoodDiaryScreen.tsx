import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, RefreshControl, TextInput, KeyboardAvoidingView, Platform, ScrollView, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
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
  const { entries, load, loading, date, addEntry, setDate, removeEntry, compositeMeals, loadCompositeMeals, loadingComposite } = useDiaryStore();
  const { search, setSearch, runSearch, results } = useFoodStore();
  const [quick, setQuick] = useState<QuickAddState>({ name:'', quantity:'100', calories:'0', protein:'0', carbs:'0', fat:'0' });
  const [adding, setAdding] = useState(false);
  // panel removed; add form always visible
  const [panelOpen, setPanelOpen] = useState(false); // legacy flag not used anymore
  const [addingQuick, setAddingQuick] = useState(false);

  useEffect(() => { load(); if (loadCompositeMeals) loadCompositeMeals(); }, [date]);

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
  // Build combined recent foods + composite meals (as unified cards)
  const combinedItems = useMemo(()=>{
    const recent: any[] = [];
    const seen = new Set<string>();
    [...entries].reverse().forEach(e=>{
      const key = e.food_name_snapshot?.toLowerCase();
      if (key && !seen.has(key)) { seen.add(key); recent.push({ type:'food', data:e }); }
    });
    const foodsLimited = recent.slice(0,5);
    // Flatten composite meals items so each identified dish appears like a recent food
    const compItems = (compositeMeals||[]).flatMap((m:any)=> (m.items||[]).map((it:any)=> ({ type:'compositeItem', data: it, parent: m })));
    return [...foodsLimited, ...compItems];
  }, [entries, compositeMeals]);

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

  const addFromCompositeItem = async (it:any) => {
    if (addingQuick) return;
    setAddingQuick(true);
    try {
      await addEntry({
        foodName: it.item_name,
        consumedQuantity: it.quantity,
        consumedUnit: it.unit || 'g',
        calculatedNutrients: {
          calories: it.calories || 0,
          protein: it.protein_g || 0,
          carbohydrates_total: it.carbohydrates_g || 0,
          fat_total: it.fat_g || 0
        },
        consumptionDate: date,
        mealType: null
      } as any);
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

  const insets = useSafeAreaInsets();
  return (
    <View style={styles.container}>
      <View style={contentWrapperStyle}>
      <View style={[styles.headerRow,{marginTop: insets.top + 8}]}>        
        <View style={styles.dateNav}>          
          <Pressable onPress={()=>shiftDate(-1)} style={styles.navBtn}><Text style={styles.navBtnText}>{'<'}</Text></Pressable>
          <Text style={styles.title}>{date}</Text>
          <Pressable onPress={()=>shiftDate(1)} style={styles.navBtn}><Text style={styles.navBtnText}>{'>'}</Text></Pressable>
        </View>
  <Text style={styles.myDiaryLabel}>Diario Alimentare</Text>
      </View>
      {/* Add form now primary */}
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
        <Pressable style={styles.actionRow} onPress={()=>navigation.navigate('BarcodeScanner')}>
          <View style={styles.actionIcon}><Ionicons name='barcode-outline' size={20} color={colors.accent} /></View>
          <Text style={styles.actionLabel}>Scansiona codice a barre</Text>
          <Ionicons name='chevron-forward' size={18} color={colors.textMuted} />
        </Pressable>
        <Pressable style={styles.actionRow} onPress={()=>navigation.navigate('MealAnalysis')}>
          <View style={styles.actionIcon}><Ionicons name='sparkles-outline' size={20} color={colors.accent} /></View>
          <View style={{flex:1}}>
            <Text style={styles.actionLabel}>Analizza pasto</Text>
            <Text style={styles.actionSub}>Nuova funzione</Text>
          </View>
          <Ionicons name='chevron-forward' size={18} color={colors.textMuted} />
        </Pressable>
        <Text style={styles.recentsHeader}>Alimenti Recenti & Pasti</Text>
        {combinedItems.map(item => {
          if (item.type==='food') {
            const r = item.data;
            return (
              <View key={`f-${r.id}`} style={styles.recentCard}>
                <View style={styles.thumb}>{chooseEmoji(r.food_name_snapshot, {
                  calories: r.calories_calculated,
                  protein: r.protein_g_calculated,
                  carbs: r.carbohydrates_total_g_calculated,
                  fat: r.fat_total_g_calculated
                })}</View>
                <View style={{flex:1}}>
                  <Text style={styles.recentName}>{r.food_name_snapshot}</Text>
                  <Text style={styles.recentQty}>{r.consumed_quantity}{r.consumed_unit} · {Math.round(r.calories_calculated||0)} kcal</Text>
                </View>
                {/* Add button removed as requested */}
              </View>
            );
          }
          if (item.type==='compositeItem') {
            const it = item.data; // composite_meal_item row
            return (
              <View key={`ci-${it.id}`} style={styles.recentCard}>
                <View style={styles.thumb}>{chooseEmoji(it.item_name, {
                  calories: it.calories,
                  protein: it.protein_g,
                  carbs: it.carbohydrates_g,
                  fat: it.fat_g
                })}</View>
                <View style={{flex:1}}>
                  <Text style={styles.recentName}>{it.item_name}</Text>
                  <Text style={styles.recentQty}>{it.quantity}{it.unit} · {Math.round(it.calories)} kcal · P{Math.round(it.protein_g)} C{Math.round(it.carbohydrates_g)} F{Math.round(it.fat_g)}</Text>
                </View>
                {/* Add button removed as requested */}
              </View>
            );
          }
          return null;
        })}
        {combinedItems.length===0 && !loadingComposite && <Text style={styles.noRecent}>Nessun alimento o pasto AI</Text>}
        <Text style={[styles.recentsHeader,{marginTop:24}]}>Voci di oggi</Text>
        {loading && entries.length===0 && <ActivityIndicator color={colors.accent} />}
        {!loading && entries.length===0 && <Text style={styles.empty}>Nessuna voce per oggi</Text>}
        {entries.map(item => (
          <View key={item.id} style={styles.entry}> 
            <View style={{flex:1}}>
              <Text style={styles.entryText}>{item.food_name_snapshot}</Text>
              <Text style={styles.entryQty}>{item.consumed_quantity}{item.consumed_unit} · {Math.round(item.calories_calculated)} kcal</Text>
            </View>
            <View style={styles.rowActions}>                
              <Pressable onPress={()=>navigation.navigate('EditDiaryEntry',{ id: item.id })}><Text style={styles.action}>✎</Text></Pressable>
              <Pressable onPress={()=>removeEntry(item.id)}><Text style={styles.actionDelete}>✕</Text></Pressable>
            </View>
          </View>
        ))}
      </ScrollView>
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
  myDiaryLabel:{ color:colors.accent, fontWeight:'700', fontSize:15, marginLeft:12, letterSpacing:0.5 },
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
  ,compositeCard:{ backgroundColor:colors.cardAlt, padding:14, borderRadius:16, marginBottom:12, borderWidth:1, borderColor:colors.border }
  ,compositeTitle:{ color:colors.textPrimary, fontSize:14, fontWeight:'600', flex:1, paddingRight:8 }
  ,compositeMeta:{ color:colors.textMuted, fontSize:11, fontWeight:'500' }
  ,compItemRow:{ flexDirection:'row', justifyContent:'space-between', marginBottom:4 }
  ,compItemName:{ color:colors.textPrimary, fontSize:13, flex:1, paddingRight:6 }
  ,compItemVals:{ color:colors.textMuted, fontSize:11 }
  ,compNotes:{ color:colors.textSecondary, fontSize:11, marginTop:6, fontStyle:'italic' }
});

function chooseEmoji(name:string, macros?: { calories?: number; protein?: number; carbs?: number; fat?: number }){
  const lower = (name||'').toLowerCase();
  const tokenized = lower.replace(/[^a-zA-Zàèéìòùç0-9 ]/g,' ').split(/\s+/).filter(Boolean);
  // Core keyword groups (small set). Adding new words here auto-works without changing logic.
  const groups: { emoji: string; words: string[] }[] = [
    { emoji:'🍗', words:['pollo','chicken','tacchin','tacchino','petto','manzo','bovino','beef','steak','maiale','pork','prosciutt','salame','bresaola'] },
    { emoji:'🐟', words:['pesce','salmone','tonno','merluzz','orata','branzino','fish','tuna','salmon','cod'] },
    { emoji:'🥚', words:['uovo','uova','egg'] },
    { emoji:'🍚', words:['riso','rice','risott'] },
    { emoji:'�', words:['pasta','spaghett','penne','fusill','maccher','lasagn','gnocchi','tagliatell'] },
    { emoji:'🍕', words:['pizza'] },
    { emoji:'🍞', words:['pane','bread','baguette','panino','focaccia'] },
    { emoji:'🥔', words:['patata','patate','potato','patatin','fries'] },
    { emoji:'�', words:['insalata','salad','lattuga','lettuce','crudita'] },
    { emoji:'🥦', words:['brocc','broccolo','cavolfior','cavolo','zucchin','verza'] },
    { emoji:'🥕', words:['carota','carrot'] },
    { emoji:'🍎', words:['mela','apple'] },
    { emoji:'🍌', words:['banana'] },
    { emoji:'🍓', words:['fragola','strawberry','frago'] },
    { emoji:'🍊', words:['arancia','orange','mandarino','clementin'] },
    { emoji:'🥛', words:['yogurt','yoghurt','latte','milk','kefir'] },
    { emoji:'�', words:['formagg','cheese','grana','parmig','mozzarella','caciotta'] },
    { emoji:'🫘', words:['fagiol','legum','bean','lentil','ceci','chickpea','pisell'] },
    { emoji:'🥣', words:['avena','oat','porridge','fiocc'] },
    { emoji:'🥞', words:['pancake','waffle','crepe'] },
    { emoji:'🥜', words:['arachid','peanut','noccio','mandor','anacard','pistac'] },
    { emoji:'🍫', words:['cioccol','chocolate','cacao','barretta','bar ','protein bar'] },
    { emoji:'🍪', words:['biscott','cookie'] },
    { emoji:'🍨', words:['gelato','ice','sorbetto'] },
    { emoji:'🍰', words:['torta','cake','crostat','cheesecake'] },
    { emoji:'💧', words:['acqua','water'] },
    { emoji:'☕', words:['caffe','coffee','espresso','cappucc'] },
  ];
  for (const g of groups) {
    if (tokenized.some(t => g.words.some(w => t.startsWith(w)))) return <Text style={{fontSize:20}}>{g.emoji}</Text>;
  }
  // Macro-based heuristic fallback if keywords not matched
  if (macros && macros.calories && macros.calories > 0) {
    const pCals = (macros.protein||0)*4;
    const cCals = (macros.carbs||0)*4;
    const fCals = (macros.fat||0)*9;
    const total = pCals + cCals + fCals;
    if (total > 0) {
      const pShare = pCals/total, cShare = cCals/total, fShare = fCals/total;
      if (pShare > 0.35 && pShare > cShare && pShare > fShare) return <Text style={{fontSize:20}}>🍗</Text>;
      if (cShare > 0.45 && cShare > pShare && cShare > fShare) return <Text style={{fontSize:20}}>🍚</Text>;
      if (fShare > 0.5) return <Text style={{fontSize:20}}>🧀</Text>;
    }
  }
  // Default
  return <Text style={{fontSize:20}}>🍽️</Text>;
}

function addFromCompositeItem(it:any){
  // This helper will be replaced inline by closure if needed; placeholder kept intentionally if refactoring later
}
