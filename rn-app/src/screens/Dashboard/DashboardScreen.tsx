
import React, { useEffect, useMemo, useState } from 'react';
import { Modal, TouchableOpacity, View, Text, TextInput, ScrollView, Pressable } from 'react-native';
import workoutRepository from '../../repositories/workoutRepository';
import { queryClient } from '../../queryClient';
import { enqueueOfflineOperation } from '../../services/offlineSyncService';
import { trackEvent } from '../../services/analyticsService';

type PlanType = { id: string; weekday: number; exercise: string; sets: number; reps: number; notes?: string; exerciseName?: string };
interface WeeklyPlanModalProps {
  visible: boolean;
  onClose: () => void;
  plans: PlanType[];
  onPlansChange: (plans: PlanType[]) => void;
}
// ...
function WeeklyPlanModal({ visible, onClose, plans, onPlansChange }: WeeklyPlanModalProps) {
  const [loading, setLoading] = useState(false);
  // Static import for workoutService (fix Metro error)
  const days = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
  const uniquePlans = Object.values(
    plans.reduce((acc, p) => {
      acc[p.id] = p;
      return acc;
    }, {} as { [id: string]: PlanType })
  );
  const grouped: { [key: number]: PlanType[] } = {};
  uniquePlans.forEach((p) => {
    if (!grouped[p.weekday]) grouped[p.weekday] = [];
    grouped[p.weekday].push(p);
  });

  // Stato per aggiunta/modifica
  const [edit, setEdit] = useState<{ id?: string, weekday: number, exercise: string, sets: string, reps: string, notes: string } | null>(null);
  const [addingDay, setAddingDay] = useState<number | null>(null);

  // Handler CRUD
  const handleSave = async () => {
    if (!edit) return;
    setLoading(true);
    try {
      if (edit.id) {
        // Modifica
        const patch = {
          weekday: edit.weekday,
          exercise: edit.exercise,
          sets: Number(edit.sets),
          reps: Number(edit.reps),
          notes: edit.notes
        };
        await workoutRepository.updatePlan(edit.id, patch);
        trackEvent('workoutplan_update');
      } else {
        // Aggiunta
        const payload = {
          weekday: edit.weekday,
          exercise: edit.exercise,
          sets: Number(edit.sets),
          reps: Number(edit.reps),
          notes: edit.notes
        };
        await workoutRepository.addPlan(payload);
        trackEvent('workoutplan_add');
      }
      // Aggiorna lista
      const updated = await queryClient.fetchQuery({
        queryKey: ['workoutPlans'],
        queryFn: () => workoutRepository.getAllPlans(),
      });
      onPlansChange(updated);
    } catch (e) {
      if (edit.id) {
        await enqueueOfflineOperation({
          type: 'workoutplan:update',
          payload: {
            id: edit.id,
            patch: {
              weekday: edit.weekday,
              exercise: edit.exercise,
              sets: Number(edit.sets),
              reps: Number(edit.reps),
              notes: edit.notes
            }
          }
        });
        trackEvent('workoutplan_update_offline');
      } else {
        const local = {
          id: `local-${Date.now()}`,
          weekday: edit.weekday,
          exercise: edit.exercise,
          sets: Number(edit.sets),
          reps: Number(edit.reps),
          notes: edit.notes
        } as any;
        await enqueueOfflineOperation({ type: 'workoutplan:add', payload: local });
        trackEvent('workoutplan_add_offline');
        onPlansChange([...plans, local]);
      }
    }
    setEdit(null); setAddingDay(null); setLoading(false);
  };
  const handleDelete = async (id: string) => {
    setLoading(true);
    try {
      await workoutRepository.deletePlan(id);
      const updated = await queryClient.fetchQuery({
        queryKey: ['workoutPlans'],
        queryFn: () => workoutRepository.getAllPlans(),
      });
      onPlansChange(updated);
      trackEvent('workoutplan_delete');
    } catch (e) {
      await enqueueOfflineOperation({ type: 'workoutplan:delete', payload: { id } });
      onPlansChange(plans.filter((p) => p.id !== id));
      trackEvent('workoutplan_delete_offline');
    }
    setEdit(null); setAddingDay(null); setLoading(false);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ backgroundColor: '#23272e', borderRadius: 18, padding: 20, width: '92%', maxHeight: '82%' }}>
          <Text style={{ fontWeight: '700', fontSize: 18, marginBottom: 12, color: '#fff' }}>Scheda settimanale</Text>
          <ScrollView style={{ maxHeight: 400 }}>
            {[0, 1, 2, 3, 4, 5, 6].map(dayIdx => (
              <View key={dayIdx} style={{ marginBottom: 18 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6, justifyContent: 'space-between' }}>
                  <Text style={{ fontWeight: '600', color: '#bfc6d1', fontSize: 15 }}>{days[dayIdx]}</Text>
                  <TouchableOpacity
                    onPress={() => { setAddingDay(dayIdx); setEdit({ id: undefined, weekday: dayIdx, exercise: '', sets: '', reps: '', notes: '' }); }}
                    style={{ paddingHorizontal: 10, paddingVertical: 4, backgroundColor: '#31343a', borderRadius: 8 }}
                    accessibilityRole="button"
                    accessibilityLabel={`Aggiungi esercizio per ${days[dayIdx]}`}
                  >
                    <Text style={{ fontSize: 15, fontWeight: '700', color: '#7ee787' }}>＋</Text>
                  </TouchableOpacity>
                </View>
                {/* Form aggiunta inline */}
                {addingDay === dayIdx && (
                  <View style={{ backgroundColor: '#1a1d22', borderRadius: 10, padding: 10, marginBottom: 10 }}>
                    <View style={{ marginBottom: 8 }}>
                      <Text style={{ color: '#bfc6d1', fontSize: 13, marginBottom: 4 }}>Giorno</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                        <View style={{ flexDirection: 'row', gap: 6 }}>
                          {days.map((day, idx) => (
                            <TouchableOpacity key={idx} onPress={() => setEdit(e => e ? { ...e, weekday: idx } : { id: undefined, weekday: idx, exercise: '', sets: '', reps: '', notes: '' })} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: edit?.weekday === idx ? '#7ee787' : '#31343a', borderWidth: 1, borderColor: edit?.weekday === idx ? '#7ee787' : '#444' }}>
                              <Text style={{ color: edit?.weekday === idx ? '#000' : '#bfc6d1', fontWeight: '600', fontSize: 13 }}>{day.slice(0, 3)}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </ScrollView>
                    </View>
                    <TextInput placeholder="Esercizio" placeholderTextColor="#888" value={edit?.exercise || ''} onChangeText={t => setEdit(e => e ? { ...e, exercise: t } : null)} style={{ borderBottomWidth: 1, borderColor: '#444', marginBottom: 6, color: '#fff', backgroundColor: '#23272e', borderRadius: 6, paddingHorizontal: 8 }} />
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TextInput placeholder="Serie" placeholderTextColor="#888" value={edit?.sets || ''} onChangeText={t => setEdit(e => e ? { ...e, sets: t } : null)} keyboardType="numeric" style={{ flex: 1, borderBottomWidth: 1, borderColor: '#444', marginBottom: 6, color: '#fff', backgroundColor: '#23272e', borderRadius: 6, paddingHorizontal: 8 }} />
                      <TextInput placeholder="Ripetizioni" placeholderTextColor="#888" value={edit?.reps || ''} onChangeText={t => setEdit(e => e ? { ...e, reps: t } : null)} keyboardType="numeric" style={{ flex: 1, borderBottomWidth: 1, borderColor: '#444', marginBottom: 6, color: '#fff', backgroundColor: '#23272e', borderRadius: 6, paddingHorizontal: 8 }} />
                    </View>
                    <TextInput placeholder="Note" placeholderTextColor="#888" value={edit?.notes || ''} onChangeText={t => setEdit(e => e ? { ...e, notes: t } : null)} style={{ borderBottomWidth: 1, borderColor: '#444', marginBottom: 6, color: '#fff', backgroundColor: '#23272e', borderRadius: 6, paddingHorizontal: 8 }} />
                    <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'flex-end' }}>
                      <TouchableOpacity onPress={() => { setEdit(null); setAddingDay(null); }} style={{ padding: 7, borderRadius: 7, backgroundColor: '#31343a', marginRight: 6 }}><Text style={{ color: '#bfc6d1' }}>Annulla</Text></TouchableOpacity>
                      <TouchableOpacity onPress={handleSave} style={{ padding: 7, borderRadius: 7, backgroundColor: '#238636' }}><Text style={{ color: '#fff' }}>Salva</Text></TouchableOpacity>
                    </View>
                  </View>
                )}
                {/* Lista esercizi */}
                {grouped[dayIdx] && grouped[dayIdx].map((ex) => (
                  <View key={ex.id} style={{ padding: 10, borderRadius: 10, backgroundColor: '#1a1d22', marginBottom: 7, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: '600', color: '#fff', fontSize: 15 }}>{ex.exerciseName || ex.exercise}</Text>
                      <Text style={{ color: '#bfc6d1', fontSize: 13 }}>{ex.sets}x{ex.reps} {ex.notes ? ' - ' + ex.notes : ''}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      <TouchableOpacity
                        onPress={() => setEdit({ id: ex.id, weekday: ex.weekday, exercise: ex.exerciseName || ex.exercise, sets: String(ex.sets), reps: String(ex.reps), notes: ex.notes || '' })}
                        style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: 'rgba(126, 231, 135, 0.15)', borderWidth: 1, borderColor: 'rgba(126, 231, 135, 0.3)', alignItems: 'center', justifyContent: 'center' }}
                        accessibilityRole="button"
                        accessibilityLabel="Modifica esercizio"
                      >
                        <Text style={{ color: '#7ee787', fontSize: 14, fontWeight: '600' }}>✎</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDelete(ex.id)}
                        style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: 'rgba(239, 68, 68, 0.15)', borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)', alignItems: 'center', justifyContent: 'center' }}
                        accessibilityRole="button"
                        accessibilityLabel="Elimina esercizio"
                      >
                        <Text style={{ color: '#ef4444', fontSize: 14, fontWeight: '600' }}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
                {/* Form modifica inline */}
                {edit && edit.id && edit.weekday === dayIdx && (
                  <View style={{ backgroundColor: '#1a1d22', borderRadius: 10, padding: 10, marginBottom: 10 }}>
                    <View style={{ marginBottom: 8 }}>
                      <Text style={{ color: '#bfc6d1', fontSize: 13, marginBottom: 4 }}>Giorno</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                        <View style={{ flexDirection: 'row', gap: 6 }}>
                          {days.map((day, idx) => (
                            <TouchableOpacity key={idx} onPress={() => setEdit(e => e ? { ...e, weekday: idx } : null)} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: edit?.weekday === idx ? '#7ee787' : '#31343a', borderWidth: 1, borderColor: edit?.weekday === idx ? '#7ee787' : '#444' }}>
                              <Text style={{ color: edit?.weekday === idx ? '#000' : '#bfc6d1', fontWeight: '600', fontSize: 13 }}>{day.slice(0, 3)}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </ScrollView>
                    </View>
                    <TextInput placeholder="Esercizio" placeholderTextColor="#888" value={edit.exercise} onChangeText={t => setEdit(e => e ? { ...e, exercise: t } : null)} style={{ borderBottomWidth: 1, borderColor: '#444', marginBottom: 6, color: '#fff', backgroundColor: '#23272e', borderRadius: 6, paddingHorizontal: 8 }} />
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TextInput placeholder="Serie" placeholderTextColor="#888" value={edit.sets} onChangeText={t => setEdit(e => e ? { ...e, sets: t } : null)} keyboardType="numeric" style={{ flex: 1, borderBottomWidth: 1, borderColor: '#444', marginBottom: 6, color: '#fff', backgroundColor: '#23272e', borderRadius: 6, paddingHorizontal: 8 }} />
                      <TextInput placeholder="Ripetizioni" placeholderTextColor="#888" value={edit.reps} onChangeText={t => setEdit(e => e ? { ...e, reps: t } : null)} keyboardType="numeric" style={{ flex: 1, borderBottomWidth: 1, borderColor: '#444', marginBottom: 6, color: '#fff', backgroundColor: '#23272e', borderRadius: 6, paddingHorizontal: 8 }} />
                    </View>
                    <TextInput placeholder="Note" placeholderTextColor="#888" value={edit.notes} onChangeText={t => setEdit(e => e ? { ...e, notes: t } : null)} style={{ borderBottomWidth: 1, borderColor: '#444', marginBottom: 6, color: '#fff', backgroundColor: '#23272e', borderRadius: 6, paddingHorizontal: 8 }} />
                    <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'flex-end' }}>
                      <TouchableOpacity onPress={() => setEdit(null)} style={{ padding: 7, borderRadius: 7, backgroundColor: '#31343a', marginRight: 6 }}><Text style={{ color: '#bfc6d1' }}>Annulla</Text></TouchableOpacity>
                      <TouchableOpacity onPress={handleSave} style={{ padding: 7, borderRadius: 7, backgroundColor: '#238636' }}><Text style={{ color: '#fff' }}>Salva</Text></TouchableOpacity>
                    </View>
                  </View>
                )}
                {(!grouped[dayIdx] || grouped[dayIdx].length === 0) && addingDay !== dayIdx && (
                  <Text style={{ color: '#666', fontSize: 13, fontStyle: 'italic', marginBottom: 4 }}>Nessun esercizio</Text>
                )}
              </View>
            ))}
            {uniquePlans.length === 0 && <Text style={{ color: '#bfc6d1', textAlign: 'center' }}>Nessun esercizio in scheda</Text>}
          </ScrollView>
          <TouchableOpacity onPress={onClose} style={{ marginTop: 18, alignSelf: 'center', backgroundColor: '#31343a', borderRadius: 10, paddingHorizontal: 28, paddingVertical: 12 }}>
            <Text style={{ fontWeight: '700', color: '#fff', fontSize: 16 }}>Chiudi</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
import { StyleSheet, ActivityIndicator, Pressable as RNPressable, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import Card from '../../components/layout/Card';
import { useDiaryStore } from '../../store/diaryStore';
import { useGoalsStore } from '../../store/goalsStore';
import { useWorkoutStore } from '../../store/workoutStore';

export default function DashboardScreen({ navigation }: any) {
  // ...existing code...
  // Callback per aggiornare la lista dopo CRUD dal modale
  const handlePlansChange = (plans: PlanType[]) => setAllPlans(plans);
  // const [showPlanModal, setShowPlanModal] = useState(false); // Removed
  const [showTodayWorkoutModal, setShowTodayWorkoutModal] = useState(false);
  // Carica la scheda settimanale completa
  const [allPlans, setAllPlans] = useState<PlanType[]>([]);
  useEffect(() => {
    queryClient.fetchQuery({
      queryKey: ['workoutPlans'],
      queryFn: () => workoutRepository.getAllPlans(),
    }).then(setAllPlans).catch(() => { });
  }, []);
  // ...existing code...
  const { date, load, entries, loading, compositeMeals, loadCompositeMeals } = useDiaryStore();
  const { goals, load: loadGoals, save: saveGoals, reset: resetGoals } = useGoalsStore();
  const [showMacroModal, setShowMacroModal] = useState(false);
  const [macroDraft, setMacroDraft] = useState({ calories: '', protein: '', carbohydrates: '', fat: '' });
  const { workouts, load: loadWorkouts, plannedToday, loadPlannedToday, plannedTodayList, loadPlannedTodayList } = useWorkoutStore();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  useEffect(() => { load(); if (loadCompositeMeals) loadCompositeMeals(); }, [date]);
  useEffect(() => { if (!goals) { loadGoals(); } loadWorkouts(); loadPlannedToday(); loadPlannedTodayList(); }, [goals]);
  useEffect(() => {
    if (goals) setMacroDraft({
      calories: String(goals.calories ?? ''),
      protein: String(goals.protein ?? ''),
      carbohydrates: String(goals.carbohydrates ?? ''),
      fat: String(goals.fat ?? '')
    });
  }, [goals]);
  const openMacroModal = () => setShowMacroModal(true);
  const handleSaveMacros = async () => {
    await saveGoals({
      calories: Number(macroDraft.calories) || 0,
      protein: Number(macroDraft.protein) || 0,
      carbohydrates: Number(macroDraft.carbohydrates) || 0,
      fat: Number(macroDraft.fat) || 0
    });
    setShowMacroModal(false);
  };
  const handleResetMacros = async () => { await resetGoals(); };
  const aggregates = useMemo(() => {
    // Somma delle voci del diario del giorno
    const base = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    const presentNames = new Set<string>();
    entries.forEach((e: any) => {
      base.calories += e.calories_calculated || 0;
      base.protein += e.protein_g_calculated || 0;
      base.carbs += e.carbohydrates_total_g_calculated || 0;
      base.fat += e.fat_total_g_calculated || 0;
      if (e.food_name_snapshot) presentNames.add(String(e.food_name_snapshot).toLowerCase());
    });
    // Integra anche gli item dei pasti AI/compositi se non già presenti come voce singola
    (compositeMeals || []).forEach((m: any) => {
      (m.items || []).forEach((it: any) => {
        const name = (it.item_name || '').toLowerCase();
        if (!presentNames.has(name)) { // evita doppio conteggio se già aggiunto manualmente/automaticamente
          base.calories += it.calories || 0;
          base.protein += it.protein_g || 0;
          base.carbs += it.carbohydrates_g || 0;
          base.fat += it.fat_g || 0;
        }
      });
    });
    return base;
  }, [entries, compositeMeals]);
  const pct = (value: number, goal?: number) => goal ? Math.min(100, (value / goal) * 100) : 0;
  const todayWorkout = plannedToday || workouts.find((w: any) => w.date === date);
  const plannedCount = plannedTodayList?.length || (todayWorkout ? 1 : 0);
  const firstPlanned = plannedTodayList && plannedTodayList[0];
  const latest = workouts
    .filter((w: any) => w.date !== date)
    .sort((a: any, b: any) => b.date.localeCompare(a.date))
    .slice(0, 3);
  const wrapStyle = [styles.inner, width > 720 && styles.innerWide, { paddingTop: 18 + insets.top, paddingBottom: 40 + insets.bottom }];
  return (
    <ScrollView contentContainerStyle={styles.scrollOuter}>
      <View style={wrapStyle}>
        <Text style={styles.screenTitle}>Dashboard</Text>
        {/* Sezione calorie e macro */}
        <View style={styles.section}>
          <Pressable onPress={openMacroModal} style={{ borderRadius: 18 }}>
            <Card style={styles.todayCard}>
              {loading && entries.length === 0 ? <ActivityIndicator color={colors.accent} /> : (
                <>
                  <View style={styles.calHeaderRow}>
                    <Text style={styles.calTitle}>Calorie</Text>
                    <Text style={styles.calTotalText}>{Math.round(aggregates.calories)}<Text style={styles.calGoalText}> / {goals?.calories ?? '-'} kcal</Text></Text>
                  </View>
                  <View style={styles.progressBarOuter}>
                    {(() => {
                      const p = pct(aggregates.calories, goals?.calories); return (
                        <View style={[styles.progressBarInner, { width: `${p}%`, backgroundColor: colors.accent }]} />
                      );
                    })()}
                  </View>
                  <View style={styles.macroColumns}>
                    <View style={styles.macroCol}>
                      <Text style={styles.macroValue}>{Math.round(aggregates.protein)}g</Text>
                      <Text style={styles.macroLabel}>Proteine</Text>
                    </View>
                    <View style={styles.macroCol}>
                      <Text style={styles.macroValue}>{Math.round(aggregates.carbs)}g</Text>
                      <Text style={styles.macroLabel}>Carbo</Text>
                    </View>
                    <View style={styles.macroCol}>
                      <Text style={styles.macroValue}>{Math.round(aggregates.fat)}g</Text>
                      <Text style={styles.macroLabel}>Grassi</Text>
                    </View>
                  </View>
                </>
              )}
            </Card>
          </Pressable>
        </View>
        {/* Card sempre visibile per la scheda settimanale */}
        <View style={styles.section}>
          <Card style={styles.todayCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontWeight: '700', fontSize: 15, color: colors.textPrimary }}>Scheda settimanale</Text>
              <TouchableOpacity onPress={() => (navigation as any).navigate('WeeklyPlan')} style={{ backgroundColor: colors.accent, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 }}>
                <Text style={{ color: '#fff', fontWeight: '600' }}>Visualizza</Text>
              </TouchableOpacity>
            </View>
            <View style={{ marginTop: 10 }}>
              {allPlans.length === 0 && (
                <Text style={{ color: '#888' }}>Nessun esercizio in scheda</Text>
              )}
            </View>
          </Card>
        </View>
        {/* Sezione allenamento di oggi */}
        {(todayWorkout || plannedCount > 0) && (
          <View style={styles.section}>
            <Card style={styles.workoutTodayCard}>
              <View style={styles.workoutIcon}><Text style={styles.workoutIconText}>✦</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.workoutTitle}>Allenamento di oggi</Text>
                <Text style={styles.workoutName} numberOfLines={1}>
                  {firstPlanned?.exerciseName || todayWorkout?.exerciseName || todayWorkout?.title || 'Workout'}
                </Text>
                {plannedCount > 1 && (
                  <Text style={styles.subWorkouts}>{plannedCount} esercizi programmati</Text>
                )}
              </View>
              <RNPressable style={styles.playBtn} onPress={() => setShowTodayWorkoutModal(true)}><Text style={styles.playText}>▶</Text></RNPressable>
            </Card>
          </View>
        )}
        {/* Sezione ultimi allenamenti */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Ultimi Allenamenti</Text>
          {latest.map((w: any) => (
            <Card key={w.id} style={styles.workoutItem}>
              <View style={styles.workoutIconSmall}><Text style={styles.workoutIconText}>✦</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemTitle}>{w.exerciseName || w.title}</Text>
                <Text style={styles.itemMeta}>{w.sets ? `${w.sets}x${w.reps}` : ''}</Text>
              </View>
              <Text style={styles.itemAgo}>{relativeDay(w.date)}</Text>
            </Card>
          ))}
          {latest.length === 0 && <Text style={styles.empty}>Nessun allenamento recente</Text>}
        </View>
      </View>
      {/* Modal modifica macros */}
      {showMacroModal && (
        <Modal visible animationType="fade" transparent onRequestClose={() => setShowMacroModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Modifica Obiettivi Macro</Text>
              {(['calories', 'protein', 'carbohydrates', 'fat'] as const).map(key => (
                <View key={key} style={styles.modalFieldRow}>
                  <Text style={styles.modalLabel}>{key}</Text>
                  <TextInput
                    keyboardType='numeric'
                    value={(macroDraft as any)[key]}
                    onChangeText={t => setMacroDraft(s => ({ ...s, [key]: t }))}
                    style={styles.modalInput}
                    placeholder='0'
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              ))}
              <View style={styles.modalActionsRow}>
                <RNPressable onPress={() => setShowMacroModal(false)} style={[styles.modalBtn, styles.modalCancel]}><Text style={styles.modalBtnTxt}>Annulla</Text></RNPressable>
                <RNPressable onPress={handleResetMacros} style={[styles.modalBtn, styles.modalNeutral]}><Text style={styles.modalBtnTxt}>Default</Text></RNPressable>
                <RNPressable onPress={handleSaveMacros} style={[styles.modalBtn, styles.modalPrimary]}><Text style={styles.modalBtnPrimaryTxt}>Salva</Text></RNPressable>
              </View>
            </View>
          </View>
        </Modal>
      )}
      {/* Modal allenamento di oggi */}
      {showTodayWorkoutModal && (
        <Modal visible animationType="slide" transparent onRequestClose={() => setShowTodayWorkoutModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { maxHeight: '80%' }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Text style={styles.modalTitle}>Allenamento di Oggi</Text>
                <RNPressable onPress={() => setShowTodayWorkoutModal(false)} hitSlop={10}>
                  <Text style={{ color: colors.textSecondary, fontSize: 20, fontWeight: '600' }}>✕</Text>
                </RNPressable>
              </View>
              <ScrollView style={{ maxHeight: 400 }}>
                {plannedTodayList && plannedTodayList.length > 0 ? (
                  plannedTodayList.map((ex: any, idx: number) => (
                    <View key={idx} style={{ backgroundColor: colors.cardAlt, padding: 14, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: colors.border }}>
                      <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: '600', marginBottom: 4 }}>{ex.exerciseName || ex.exercise || 'Esercizio'}</Text>
                      <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{ex.sets}x{ex.reps}{ex.notes ? ` - ${ex.notes}` : ''}</Text>
                    </View>
                  ))
                ) : todayWorkout ? (
                  <View style={{ backgroundColor: colors.cardAlt, padding: 14, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: colors.border }}>
                    <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: '600', marginBottom: 4 }}>{todayWorkout.exerciseName || todayWorkout.title || 'Esercizio'}</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{todayWorkout.sets}x{todayWorkout.reps}{todayWorkout.weight ? ` @ ${todayWorkout.weight}kg` : ''}</Text>
                  </View>
                ) : (
                  <Text style={{ color: colors.textMuted, textAlign: 'center' }}>Nessun allenamento programmato</Text>
                )}
              </ScrollView>
              <RNPressable onPress={() => setShowTodayWorkoutModal(false)} style={[styles.modalBtn, styles.modalPrimary, { marginTop: 16, width: '100%', alignItems: 'center' }]}>
                <Text style={styles.modalBtnPrimaryTxt}>Chiudi</Text>
              </RNPressable>
            </View>
          </View>
        </Modal>
      )}
    </ScrollView>
  );
}

function relativeDay(iso: string) {
  try { const d = new Date(iso); const today = new Date(); const diff = Math.floor((today.getTime() - d.getTime()) / 86400000); if (diff === 0) return 'oggi'; if (diff === 1) return '1g fa'; return diff + 'g fa'; } catch { return ''; }
}

const styles = StyleSheet.create({
  scrollOuter: { backgroundColor: colors.background },
  inner: { width: '100%', alignSelf: 'center', paddingHorizontal: 18 },
  innerWide: { maxWidth: 720 },
  screenTitle: { fontSize: 18, fontWeight: '600', color: colors.textPrimary, marginBottom: 18, textAlign: 'center' },
  section: { marginBottom: 22 },
  todayCard: { padding: 18 },
  sectionLabel: { color: colors.textPrimary, fontSize: 16, fontWeight: '600', marginBottom: 12 },
  calHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 10 },
  calTitle: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  calTotalText: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
  calGoalText: { color: colors.textMuted, fontSize: 12, fontWeight: '500' },
  progressBarOuter: { height: 10, backgroundColor: colors.cardAlt, borderRadius: 8, overflow: 'hidden', marginBottom: 14 },
  progressBarInner: { height: '100%', borderRadius: 8 },
  macroColumns: { flexDirection: 'row', justifyContent: 'space-between' },
  macroCol: { alignItems: 'center', flex: 1 },
  macroValue: { color: '#fff', fontSize: 14, fontWeight: '600' },
  macroLabel: { color: colors.accent, fontSize: 11, marginTop: 2, opacity: 0.9 },
  workoutTodayCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18 },
  workoutIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.cardAlt, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  workoutIconSmall: { width: 40, height: 40, borderRadius: 14, backgroundColor: colors.cardAlt, alignItems: 'center', justifyContent: 'center', marginRight: 14, borderWidth: 1, borderColor: colors.border },
  workoutIconText: { color: colors.accent, fontSize: 16, fontWeight: '700' },
  workoutTitle: { color: colors.textMuted, fontSize: 11, fontWeight: '500' },
  workoutName: { color: colors.textPrimary, fontSize: 14, fontWeight: '600', marginTop: 2 },
  subWorkouts: { color: colors.textMuted, fontSize: 11, marginTop: 4 },
  playBtn: { backgroundColor: colors.accent, width: 46, height: 46, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  playText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  sectionHeader: { color: colors.textPrimary, fontSize: 15, fontWeight: '600', marginBottom: 12 },
  workoutItem: { flexDirection: 'row', alignItems: 'center', padding: 14, marginBottom: 10 },
  itemTitle: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  itemMeta: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  itemAgo: { color: colors.textMuted, fontSize: 11 },
  empty: { color: colors.textMuted, fontSize: 12, textAlign: 'center', marginTop: 8 }
  , modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 24 }
  , modalCard: { backgroundColor: colors.card, borderRadius: 22, padding: 20, borderWidth: 1, borderColor: colors.border }
  , modalTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '700', marginBottom: 14 }
  , modalFieldRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }
  , modalLabel: { color: colors.textPrimary, fontSize: 14, textTransform: 'capitalize', width: 120 }
  , modalInput: { backgroundColor: colors.cardAlt, color: colors.textPrimary, padding: 10, borderRadius: 12, flex: 1, borderWidth: 1, borderColor: colors.border }
  , modalActionsRow: { flexDirection: 'row', justifyContent: 'flex-end', columnGap: 10, marginTop: 8 }
  , modalBtn: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14, backgroundColor: colors.cardAlt, borderWidth: 1, borderColor: colors.border }
  , modalCancel: {}
  , modalNeutral: { backgroundColor: colors.card }
  , modalPrimary: { backgroundColor: colors.accent, borderColor: colors.accent }
  , modalBtnTxt: { color: colors.textPrimary, fontWeight: '600' }
  , modalBtnPrimaryTxt: { color: '#fff', fontWeight: '700' }
});
