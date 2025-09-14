import React, { useEffect, useMemo } from 'react';
import { ScrollView, Text, StyleSheet, View, ActivityIndicator, Pressable, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import Card from '../../components/layout/Card';
import { useDiaryStore } from '../../store/diaryStore';
import { useGoalsStore } from '../../store/goalsStore';
import { useWorkoutStore } from '../../store/workoutStore';

export default function DashboardScreen() {
  const { date, load, entries, loading } = useDiaryStore();
  const { goals, load: loadGoals } = useGoalsStore();
  const { workouts, load: loadWorkouts } = useWorkoutStore();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  useEffect(() => { load(); }, [date]);
  useEffect(() => { if (!goals) loadGoals(); loadWorkouts(); }, [goals]);
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
  const todayWorkout = workouts.find((w:any)=> w.date === date);
  const latest = workouts
    .filter((w:any)=> w.date !== date)
    .sort((a:any,b:any)=> b.date.localeCompare(a.date))
    .slice(0,3);
  const wrapStyle = [styles.inner, width>720 && styles.innerWide, {paddingTop:18+insets.top, paddingBottom:40+insets.bottom}];
  return (
    <ScrollView contentContainerStyle={styles.scrollOuter}>
      <View style={wrapStyle}>
        <Text style={styles.screenTitle}>Dashboard</Text>
        <View style={styles.section}>
          <Card style={styles.todayCard}>
            <Text style={styles.sectionLabel}>Oggi</Text>
            {loading && entries.length===0 ? <ActivityIndicator color={colors.accent} /> : (
              <>
                <View style={styles.calRow}>                
                  <View style={{flex:1}}>
                    <Text style={styles.calTitle}>Calorie</Text>
                    <View style={styles.progressBarOuter}> 
                      {(() => { const p = pct(aggregates.calories, goals?.calories); return (
                        <View style={[styles.progressBarInner,{ flexBasis: `${p}%`, maxWidth: '100%', backgroundColor: colors.accent }]} />
                      ); })()}
                    </View>
                    <Text style={styles.valueLine}>{Math.round(aggregates.calories)} / {goals?.calories ?? '-'} kcal</Text>
                    <View style={styles.macrosRow}>
                      <Text style={styles.macro}>Proteine {Math.round(aggregates.protein)}g</Text>
                      <Text style={styles.macro}>Carboidrati {Math.round(aggregates.carbs)}g</Text>
                      <Text style={styles.macro}>Grassi {Math.round(aggregates.fat)}g</Text>
                    </View>
                  </View>
                </View>
              </>
            )}
          </Card>
        </View>
        {todayWorkout && (
          <View style={styles.section}>
            <Card style={styles.workoutTodayCard}>
              <View style={styles.workoutIcon}><Text style={styles.workoutIconText}>✦</Text></View>
              <View style={{flex:1}}>
                <Text style={styles.workoutTitle}>Allenamento di oggi</Text>
                <Text style={styles.workoutName}>{todayWorkout.exerciseName || todayWorkout.title || 'Workout'}</Text>
              </View>
              <Pressable style={styles.playBtn}><Text style={styles.playText}>▶</Text></Pressable>
            </Card>
          </View>
        )}
        <View style={styles.section}>        
          <Text style={styles.sectionHeader}>Ultimi Allenamenti</Text>
          {latest.map((w:any)=>(
            <Card key={w.id} style={styles.workoutItem}> 
              <View style={styles.workoutIconSmall}><Text style={styles.workoutIconText}>✦</Text></View>
              <View style={{flex:1}}>
                <Text style={styles.itemTitle}>{w.exerciseName || w.title}</Text>
                <Text style={styles.itemMeta}>{w.sets? `${w.sets}x${w.reps}`:''}</Text>
              </View>
              <Text style={styles.itemAgo}>{relativeDay(w.date)}</Text>
            </Card>
          ))}
          {latest.length===0 && <Text style={styles.empty}>Nessun allenamento recente</Text>}
        </View>
      </View>
    </ScrollView>
  );
}

function relativeDay(iso:string){
  try { const d = new Date(iso); const today = new Date(); const diff = Math.floor((today.getTime()-d.getTime())/86400000); if (diff===0) return 'oggi'; if (diff===1) return '1g fa'; return diff+'g fa'; } catch { return ''; }
}

const styles = StyleSheet.create({
  scrollOuter:{ backgroundColor:colors.background },
  inner:{ width:'100%', alignSelf:'center', paddingHorizontal:18 },
  innerWide:{ maxWidth:720 },
  screenTitle:{ fontSize:18, fontWeight:'600', color:colors.textPrimary, marginBottom:18, textAlign:'center' },
  section:{ marginBottom:22 },
  todayCard:{ padding:18 },
  sectionLabel:{ color:colors.textPrimary, fontSize:16, fontWeight:'600', marginBottom:12 },
  calRow:{ flexDirection:'row', alignItems:'center', gap:16 },
  calTitle:{ color:colors.textPrimary, fontSize:14, fontWeight:'500', marginBottom:8 },
  progressBarOuter:{ height:12, backgroundColor:colors.cardAlt, borderRadius:8, overflow:'hidden', marginBottom:10 },
  progressBarInner:{ height:'100%' },
  valueLine:{ color:colors.textPrimary, fontSize:12, marginBottom:6 },
  macrosRow:{ marginTop:4 },
  macro:{ color:colors.textMuted, fontSize:11, marginTop:2 },
  workoutTodayCard:{ flexDirection:'row', alignItems:'center', gap:14, padding:18 },
  workoutIcon:{ width:44, height:44, borderRadius:14, backgroundColor:colors.cardAlt, alignItems:'center', justifyContent:'center', borderWidth:1, borderColor:colors.border },
  workoutIconSmall:{ width:40, height:40, borderRadius:14, backgroundColor:colors.cardAlt, alignItems:'center', justifyContent:'center', marginRight:14, borderWidth:1, borderColor:colors.border },
  workoutIconText:{ color:colors.accent, fontSize:16, fontWeight:'700' },
  workoutTitle:{ color:colors.textMuted, fontSize:11, fontWeight:'500' },
  workoutName:{ color:colors.textPrimary, fontSize:14, fontWeight:'600', marginTop:2 },
  playBtn:{ backgroundColor:colors.accent, width:46, height:46, borderRadius:18, alignItems:'center', justifyContent:'center' },
  playText:{ color:'#fff', fontSize:16, fontWeight:'700' },
  sectionHeader:{ color:colors.textPrimary, fontSize:15, fontWeight:'600', marginBottom:12 },
  workoutItem:{ flexDirection:'row', alignItems:'center', padding:14, marginBottom:10 },
  itemTitle:{ color:colors.textPrimary, fontSize:14, fontWeight:'600' },
  itemMeta:{ color:colors.textMuted, fontSize:11, marginTop:2 },
  itemAgo:{ color:colors.textMuted, fontSize:11 },
  empty:{ color:colors.textMuted, fontSize:12, textAlign:'center', marginTop:8 }
});
