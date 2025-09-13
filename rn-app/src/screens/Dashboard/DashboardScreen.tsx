import React, { useEffect, useMemo } from 'react';
import { ScrollView, Text, StyleSheet, View, ActivityIndicator } from 'react-native';
import { colors } from '../../theme/colors';
import Card from '../../components/layout/Card';
import { useDiaryStore } from '../../store/diaryStore';
import { useGoalsStore } from '../../store/goalsStore';

export default function DashboardScreen() {
  const { date, load, entries, loading } = useDiaryStore();
  const { goals, load: loadGoals } = useGoalsStore();

  useEffect(() => { load(); }, [date]);
  useEffect(() => { if (!goals) loadGoals(); }, [goals]);

  const aggregates = useMemo(() => {
    const base = { calories:0, protein:0, carbs:0, fat:0 };
    entries.forEach((e:any) => {
      base.calories += e.calories_calculated || 0;
      base.protein += e.protein_g_calculated || 0;
      base.carbs += e.carbohydrates_total_g_calculated || 0;
      base.fat += e.fat_total_g_calculated || 0;
    });
    return base;
  }, [entries]);

  const pct = (value:number, goal?:number) => goal ? Math.min(100, (value/goal)*100) : 0;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Oggi {date}</Text>
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Calorie</Text>
  {loading && entries.length === 0 ? <ActivityIndicator color={colors.accent} /> : (
          <>
            <View style={[styles.progressBarOuter, { flexDirection: 'row' }]}> 
              <View style={[styles.progressBarInner, { flex: Math.max(0, Math.min(1, pct(aggregates.calories, goals?.calories)/100)), backgroundColor: colors.accent }]} />
            </View>
            <Text style={styles.valueLine}>{Math.round(aggregates.calories)} / {goals?.calories ?? '-'} kcal</Text>
            <View style={styles.macrosRow}>
              <Text style={styles.macro}>P {Math.round(aggregates.protein)}/{goals?.protein ?? '-'}g</Text>
              <Text style={styles.macro}>C {Math.round(aggregates.carbs)}/{goals?.carbohydrates ?? '-'}g</Text>
              <Text style={styles.macro}>F {Math.round(aggregates.fat)}/{goals?.fat ?? '-'}g</Text>
            </View>
          </>
        )}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:{ padding:16, backgroundColor:colors.background },
  title:{ fontSize:24, fontWeight:'600', color:colors.textPrimary, marginBottom:16 },
  card:{ marginBottom:16 },
  cardTitle:{ color:colors.textPrimary, fontSize:16, fontWeight:'500', marginBottom:8 },
  progressBarOuter:{ height:10, backgroundColor:colors.cardAlt, borderRadius:6, overflow:'hidden', marginBottom:12 },
  progressBarInner:{ height:'100%' },
  macrosRow:{ flexDirection:'row', justifyContent:'space-between', marginTop:8 },
  macro:{ color:colors.textMuted, fontSize:12 },
  valueLine:{ color:colors.textPrimary, fontSize:12, marginBottom:6 }
});
