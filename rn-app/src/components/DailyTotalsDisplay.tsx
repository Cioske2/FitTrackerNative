import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
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
  container:{ backgroundColor:colors.cardAlt, padding:14, borderRadius:16, marginBottom:18, borderWidth:1, borderColor:colors.border },
  title:{ color:colors.textPrimary, fontWeight:'600', marginBottom:10, fontSize:15 },
  row:{ flexDirection:'row', justifyContent:'space-between' },
  metric:{ flex:1, marginHorizontal:4 },
  metricLabel:{ color:colors.textMuted, fontSize:11, marginBottom:6, textAlign:'center', letterSpacing:0.3 },
  barOuter:{ backgroundColor:colors.card, height:8, borderRadius:6, overflow:'hidden', flexDirection:'row' },
  barInner:{ backgroundColor:colors.accent, height:'100%' },
  metricValue:{ color:colors.textPrimary, fontSize:11, textAlign:'center', marginTop:4, fontWeight:'500' },
  smallBox:{ backgroundColor:colors.card, paddingVertical:6, paddingHorizontal:12, borderRadius:10, minWidth:68, alignItems:'center', borderWidth:1, borderColor:colors.borderAlt },
  smallLabel:{ color:colors.textMuted, fontSize:10, textTransform:'uppercase', letterSpacing:0.5 },
  smallVal:{ color:colors.textPrimary, fontSize:13, fontWeight:'600', marginTop:2 }
});
