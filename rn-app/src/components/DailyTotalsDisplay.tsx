import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useDiaryStore } from '../store/diaryStore';
import { useGoalsStore } from '../store/goalsStore';

export default function DailyTotalsDisplay() {
  const { entries } = useDiaryStore();
  const { goals } = useGoalsStore();

  const totals = useMemo(() => {
    return entries.reduce((acc: any, e: any) => {
      acc.calories += e.calories_calculated || 0;
      acc.protein += e.protein_g_calculated || 0;
      acc.carbs += e.carbohydrates_total_g_calculated || 0;
      acc.fat += e.fat_total_g_calculated || 0;
      acc.fiber += e.fiber_g_calculated || 0;
      acc.sugar += e.sugar_g_calculated || 0;
      return acc;
    }, { calories:0, protein:0, carbs:0, fat:0, fiber:0, sugar:0 });
  }, [entries]);

  const pct = (value:number, goal?:number) => goal ? Math.min(100, (value/goal)*100) : 0;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Totali Giorno</Text>
      <View style={styles.row}>        
        <Metric label="Cal" value={totals.calories} goal={goals?.calories} pct={pct(totals.calories, goals?.calories)} />
        <Metric label="P" value={totals.protein} goal={goals?.protein} pct={pct(totals.protein, goals?.protein)} />
        <Metric label="C" value={totals.carbs} goal={goals?.carbohydrates} pct={pct(totals.carbs, goals?.carbohydrates)} />
        <Metric label="F" value={totals.fat} goal={goals?.fat} pct={pct(totals.fat, goals?.fat)} />
      </View>
      <View style={[styles.row,{ marginTop:6 }]}> 
        <Small label="Fib" value={totals.fiber} />
        <Small label="Sug" value={totals.sugar} />
      </View>
    </View>
  );
}

function Metric({ label, value, goal, pct }:{ label:string; value:number; goal?:number; pct:number }) {
  return (
    <View style={styles.metric}>      
      <Text style={styles.metricLabel}>{label}</Text>
       <View style={styles.barOuter}><View style={[styles.barInner, { flex: Math.max(0, Math.min(1, pct/100)) }]} /></View>
      <Text style={styles.metricValue}>{Math.round(value)}{goal? `/${goal}`:''}</Text>
    </View>
  );
}

function Small({ label, value }:{ label:string; value:number }) {
  return (
    <View style={styles.smallBox}>
      <Text style={styles.smallLabel}>{label}</Text>
      <Text style={styles.smallVal}>{Math.round(value)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container:{ backgroundColor:'#1f2937', padding:12, borderRadius:12, marginBottom:12 },
  title:{ color:'#fff', fontWeight:'600', marginBottom:8 },
  row:{ flexDirection:'row', justifyContent:'space-between' },
  metric:{ flex:1, marginHorizontal:4 },
  metricLabel:{ color:'#ccc', fontSize:11, marginBottom:4, textAlign:'center' },
  barOuter:{ backgroundColor:'#111827', height:6, borderRadius:4, overflow:'hidden', flexDirection:'row' },
  barInner:{ backgroundColor:'#10b981', height:'100%' },
  metricValue:{ color:'#fff', fontSize:11, textAlign:'center', marginTop:4 },
  smallBox:{ backgroundColor:'#111827', paddingVertical:6, paddingHorizontal:10, borderRadius:8, minWidth:60, alignItems:'center' },
  smallLabel:{ color:'#888', fontSize:11 },
  smallVal:{ color:'#fff', fontSize:12, fontWeight:'600', marginTop:2 }
});
