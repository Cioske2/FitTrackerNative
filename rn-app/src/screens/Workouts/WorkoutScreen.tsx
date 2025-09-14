import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Dimensions, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LineChart } from 'react-native-chart-kit';
import { colors } from '../../theme/colors';
import { useWorkoutStore } from '../../store/workoutStore';
import Card from '../../components/layout/Card';

interface GroupedDay { date: string; items: any[] }
interface Series { labels: string[]; points: number[] }

export default function WorkoutScreen() {
  const { workouts, load, add, remove, loading } = useWorkoutStore();
  const insets = useSafeAreaInsets();
  const [addModal, setAddModal] = useState(false);
  const [dayModal, setDayModal] = useState<GroupedDay | null>(null);
  const [form, setForm] = useState({ exerciseName: '', sets: '', reps: '', weight: '' });
  const [submitting, setSubmitting] = useState(false);
    const grouped = useMemo(() => groupByDate(workouts), [workouts]);
    const [showAllDays, setShowAllDays] = useState(false);
  const exerciseNames = useMemo(() => Array.from(new Set(workouts.map(w => w.exerciseName))).sort(), [workouts]);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);

  useEffect(() => { load(); }, []); // initial load
  useEffect(() => { if (exerciseNames.length && !selectedExercise) setSelectedExercise(exerciseNames[0]); }, [exerciseNames]);

  const series: Series = useMemo(() => buildExerciseSeries(workouts, selectedExercise), [workouts, selectedExercise]);
  const improvement = useMemo(() => {
    if (!series.points.length) return 0;
    const first = series.points[0];
    const last = series.points[series.points.length - 1];
    if (first === 0) return 0;
    return ((last - first) / first) * 100;
  }, [series]);

  const submit = async () => {
    if (!form.exerciseName || !form.sets || !form.reps) return;
    setSubmitting(true);
    await add({
      exerciseName: form.exerciseName.trim(),
      sets: Number(form.sets),
      reps: Number(form.reps),
      weight: form.weight ? Number(form.weight) : 0,
      date: new Date().toISOString().slice(0, 10)
    });
    setForm({ exerciseName: '', sets: '', reps: '', weight: '' });
    setSubmitting(false);
    setAddModal(false);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingTop: 12, paddingBottom: 120 + insets.bottom }}>
      <Text style={styles.title}>Allenamenti</Text>

      {/* Cronologia per giorno */}
      <View style={styles.headerRow}>        
        <Text style={styles.sectionHeading}>Cronologia per giorno</Text>
        <Pressable style={styles.addBtnSmall} onPress={() => setAddModal(true)}>
          <Text style={styles.addBtnSmallTxt}>＋</Text>
        </Pressable>
      </View>
      {loading && workouts.length === 0 && <ActivityIndicator color={colors.accent} />}
      {!loading && grouped.length === 0 && <Text style={styles.empty}>Nessun allenamento</Text>}
      {(showAllDays ? grouped : grouped.slice(0,6)).map(g => (
        <Pressable key={g.date} onPress={() => setDayModal(g)}>
          <Card style={styles.dayCard}>
            <View style={styles.dayCardRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.dayDate}>{g.date}</Text>
                <Text style={styles.dayMeta}>{g.items.length} esercizi</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </View>
          </Card>
        </Pressable>
      ))}
      {grouped.length>6 && (
        <Pressable onPress={()=>setShowAllDays(s=>!s)} style={styles.showMoreBtn}>
          <Text style={styles.showMoreTxt}>{showAllDays? 'Mostra meno' : 'Mostra altri'}</Text>
        </Pressable>
      )}

      {/* Grafico progresso */}
      <Text style={[styles.sectionHeading, { marginTop: 28 }]}>Progresso esercizio</Text>
      <Card style={styles.chartCard}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
          <View style={styles.exerciseChipsRow}>
            {exerciseNames.map(n => (
              <Pressable key={n} onPress={() => setSelectedExercise(n)} style={[styles.exerciseChip, selectedExercise === n && styles.exerciseChipActive]}>
                <Text style={[styles.exerciseChipTxt, selectedExercise === n && styles.exerciseChipTxtActive]}>{n}</Text>
              </Pressable>
            ))}
            {exerciseNames.length === 0 && <Text style={styles.noExercises}>Aggiungi un allenamento</Text>}
          </View>
        </ScrollView>
        <View style={{ width: '100%' }}>
          <LineChart
            data={{
              labels: series.labels.length ? series.labels : ['','','','','',''],
              datasets: [{ data: series.points.length ? series.points : [0,0,0,0,0,0], color: () => colors.accent, strokeWidth: 2 }]
            }}
            width={Math.max(Dimensions.get('window').width - 64, Math.max(series.points.length,6) * 42)}
            height={200}
            withInnerLines={true}
            withOuterLines={true}
            withHorizontalLabels={true}
            withVerticalLabels={true}
            fromZero
            yAxisSuffix="kg"
            segments={4}
            chartConfig={{
              backgroundGradientFrom: colors.card,
              backgroundGradientTo: colors.card,
              color: () => colors.accent,
              labelColor: () => colors.textSecondary,
              decimalPlaces: 0,
              propsForDots: { r: series.points.length > 40 ? '0' : (series.points.length ? '4':'0'), strokeWidth: '0' },
              propsForBackgroundLines: { stroke: colors.borderAlt, strokeDasharray: '4 6', strokeWidth: 1 }
            }}
            bezier={false}
            withShadow={false}
            style={{ marginLeft: -4 }}
            formatYLabel={val => val}
          />
        </View>
        {selectedExercise && series.points.length>1 && (
          <Text style={styles.improveText}>{improvement >= 0 ? '+' + improvement.toFixed(1) : improvement.toFixed(1)}% vs inizio</Text>
        )}
      </Card>

      {/* Modal: Aggiungi Allenamento */}
      <Modal visible={addModal} animationType="fade" transparent onRequestClose={() => setAddModal(false)}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'center' }}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Nuovo allenamento</Text>
              <TextInput
                placeholder="Esercizio" placeholderTextColor={colors.textMuted}
                style={styles.input} value={form.exerciseName} onChangeText={t => setForm(f => ({ ...f, exerciseName: t }))}
              />
              <View style={styles.rowInputs}>
                <TextInput placeholder="Serie" placeholderTextColor={colors.textMuted} keyboardType="number-pad" style={[styles.input, styles.inputSmall]}
                  value={form.sets} onChangeText={t => setForm(f => ({ ...f, sets: t }))} />
                <TextInput placeholder="Ripet." placeholderTextColor={colors.textMuted} keyboardType="number-pad" style={[styles.input, styles.inputSmall]}
                  value={form.reps} onChangeText={t => setForm(f => ({ ...f, reps: t }))} />
                <TextInput placeholder="Peso" placeholderTextColor={colors.textMuted} keyboardType="decimal-pad" style={[styles.input, styles.inputSmall]}
                  value={form.weight} onChangeText={t => setForm(f => ({ ...f, weight: t }))} />
              </View>
              <View style={styles.modalBtnsRow}>
                <Pressable style={[styles.btn, styles.btnCancel]} onPress={() => setAddModal(false)}><Text style={styles.btnTxt}>Annulla</Text></Pressable>
                <Pressable style={[styles.btn, styles.btnPrimary, (!form.exerciseName || !form.sets || !form.reps) && styles.btnDisabled]} disabled={!form.exerciseName || !form.sets || !form.reps || submitting} onPress={submit}>
                  <Text style={styles.btnPrimaryTxt}>{submitting ? '...' : 'Salva'}</Text>
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Modal: Dettaglio Giorno */}
      <Modal visible={!!dayModal} animationType="fade" transparent onRequestClose={() => setDayModal(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.dayModalCard}>
            <View style={styles.dayModalHeader}>
              <Text style={styles.dayModalTitle}>{dayModal?.date}</Text>
              <Pressable onPress={() => setDayModal(null)} hitSlop={10}><Text style={styles.closeX}>✕</Text></Pressable>
            </View>
            <ScrollView style={{ maxHeight: 400 }}>
              {dayModal?.items.map(w => (
                <View key={w.id} style={styles.dayItemRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.dayItemExercise}>{w.exerciseName}</Text>
                    <Text style={styles.dayItemMeta}>{w.sets} x {w.reps}{w.weight ? ` @ ${w.weight}kg` : ''}</Text>
                  </View>
                  <Pressable style={styles.deleteBtn} onPress={() => remove(w.id)}>
                    <Text style={styles.deleteBtnTxt}>🗑</Text>
                  </Pressable>
                </View>
              ))}
              {dayModal?.items.length === 0 && <Text style={styles.empty}>Vuoto</Text>}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

// Helpers
function groupByDate(items: any[]): GroupedDay[] {
  const map: Record<string, any[]> = {};
  items.forEach(i => { if (!map[i.date]) map[i.date] = []; map[i.date].push(i); });
  return Object.entries(map)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([date, items]) => ({ date, items }));
}

function buildExerciseSeries(workouts: any[], exercise: string | null): Series {
  if (!exercise) return { labels: [], points: [] };
  const months = ['gen','feb','mar','apr','mag','giu','lug','ago','set','ott','nov','dic'];
  const filtered = workouts
    .filter(w => w.exerciseName === exercise && w.weight && w.weight > 0)
    .sort((a, b) => a.date.localeCompare(b.date));

  const last = filtered.slice(-45); // allow a bit more history, will sample labels
  const rawLabels = last.map(w => {
    const d = new Date(w.date + 'T00:00:00');
    return d.getDate() + ' ' + months[d.getMonth()];
  });
  const points = last.map(w => Number(w.weight));

  // Sampling labels for readability (avoid overcrowding)
  let step = 1;
  if (rawLabels.length > 36) step = 6; else if (rawLabels.length > 30) step = 5; else if (rawLabels.length > 24) step = 4; else if (rawLabels.length > 18) step = 3; else if (rawLabels.length > 12) step = 2;
  const labels = rawLabels.map((l, i) => (i % step === 0 ? l : ''));
  return { labels, points };
}

// Styles
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 20 },
  title: { fontSize: 26, fontWeight: '700', color: colors.textPrimary, marginBottom: 12 },
  sectionHeading: { fontSize: 16, fontWeight: '600', color: colors.textPrimary, letterSpacing: 0.5 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  addBtnSmall: { backgroundColor: colors.accent, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  addBtnSmallTxt: { color: '#fff', fontSize: 18, fontWeight: '600' },
  empty: { color: colors.textMuted, fontSize: 14, marginTop: 12 },
  dayCard: { marginBottom: 10, paddingVertical: 14, paddingHorizontal: 16 },
  dayCardRow: { flexDirection: 'row', alignItems: 'center' },
  dayDate: { color: colors.textPrimary, fontSize: 15, fontWeight: '600' },
  dayMeta: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  chevron: { color: colors.textSecondary, fontSize: 26, paddingHorizontal: 4, fontWeight: '200' },
  chartCard: { marginTop: 8 },
  exerciseChipsRow: { flexDirection: 'row', gap: 8 },
  exerciseChip: { backgroundColor: colors.cardAlt, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: colors.borderAlt },
  exerciseChipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  exerciseChipTxt: { color: colors.textSecondary, fontSize: 13, fontWeight: '500' },
  exerciseChipTxtActive: { color: '#fff' },
  noExercises: { color: colors.textMuted, fontSize: 13 },
  noSeries: { color: colors.textMuted, fontSize: 13, marginTop: 4 },
  showMoreBtn:{ alignSelf:'center', paddingVertical:6, paddingHorizontal:18, borderRadius:20, backgroundColor: colors.cardAlt, marginTop:4 },
  showMoreTxt:{ color: colors.textSecondary, fontSize:13, fontWeight:'500' },
  improveText: { marginTop: 10, fontSize: 13, color: colors.textSecondary },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', padding: 24 },
  modalCard: { backgroundColor: colors.card, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: colors.borderAlt },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: 14 },
  input: { backgroundColor: colors.cardAlt, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, color: colors.textPrimary, fontSize: 14, borderWidth: 1, borderColor: colors.borderAlt, marginBottom: 12 },
  rowInputs: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  inputSmall: { flex: 1, marginRight: 8 },
  modalBtnsRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 4, columnGap: 12 },
  btn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 14, backgroundColor: colors.cardAlt, borderWidth: 1, borderColor: colors.borderAlt },
  btnCancel: {},
  btnPrimary: { backgroundColor: colors.accent, borderColor: colors.accent },
  btnDisabled: { opacity: 0.4 },
  btnTxt: { color: colors.textPrimary, fontWeight: '600', fontSize: 14 },
  btnPrimaryTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },
  dayModalCard: { backgroundColor: colors.card, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: colors.borderAlt, width: '100%', maxHeight: '80%' },
  dayModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  dayModalTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  closeX: { fontSize: 20, color: colors.textSecondary },
  dayItemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.borderAlt },
  dayItemExercise: { color: colors.textPrimary, fontSize: 15, fontWeight: '600' },
  dayItemMeta: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  deleteBtn: { paddingHorizontal: 10, paddingVertical: 6 },
  deleteBtnTxt: { fontSize: 18 },
});
