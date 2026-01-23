import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Dimensions, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LineChart } from 'react-native-chart-kit';
import { colors } from '../../theme/colors';
import { useWorkoutStore } from '../../store/workoutStore';
import workoutParser from '../../services/workoutParser';
import Card from '../../components/layout/Card';
import { Ionicons } from '@expo/vector-icons';

interface GroupedDay { date: string; items: any[] }
interface Series { labels: string[]; points: number[] }

export default function WorkoutScreen() {
  const { workouts, load, add, remove, loading } = useWorkoutStore();
  const insets = useSafeAreaInsets();

  // Multi-add state
  const [addModal, setAddModal] = useState(false);
  const [currentExercise, setCurrentExercise] = useState({ exerciseName: '', sets: '', reps: '', weight: '' });
  const [pendingExercises, setPendingExercises] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [dayModal, setDayModal] = useState<GroupedDay | null>(null);

  // Parsing AI modal
  const [parseModal, setParseModal] = useState(false);
  const [parseText, setParseText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState<any[]>([]);
  const [savingParsed, setSavingParsed] = useState(false);

  // Selection modal
  const [selectionModal, setSelectionModal] = useState(false);

  // Month filtering
  const [selectedMonth, setSelectedMonth] = useState(new Date()); // default current month
  const [showAll, setShowAll] = useState(false); // show all workouts
  const [monthPickerModal, setMonthPickerModal] = useState(false);
  const [showAllWorkouts, setShowAllWorkouts] = useState(false); // show all workout days or limit to 7

  const grouped = useMemo(() => {
    if (showAll) {
      return groupByDate(workouts);
    }
    const filtered = workouts.filter(w => {
      const d = new Date(w.date);
      return d.getMonth() === selectedMonth.getMonth() && d.getFullYear() === selectedMonth.getFullYear();
    });
    return groupByDate(filtered);
  }, [workouts, selectedMonth, showAll]);

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

  const addCurrentToPending = async () => {
    if (!currentExercise.exerciseName || !currentExercise.sets || !currentExercise.reps) {
      Alert.alert('Mancano dati', 'Inserisci almeno nome, serie e ripetizioni.');
      return;
    }

    // Normalize exercise name using exercise library
    const exerciseLibraryService = (await import('../../services/exerciseLibraryService')).default;
    const normalizedName = await exerciseLibraryService.findBestMatch(currentExercise.exerciseName);

    setPendingExercises([...pendingExercises, { ...currentExercise, exerciseName: normalizedName, id: Date.now().toString() }]);
    setCurrentExercise({ exerciseName: '', sets: '', reps: '', weight: '' });
  };

  const removePending = (id: string) => {
    setPendingExercises(pendingExercises.filter(p => p.id !== id));
  };

  const submitAll = async () => {
    let list = [...pendingExercises];
    if (currentExercise.exerciseName && currentExercise.sets && currentExercise.reps) {
      // Normalize current exercise name before adding to list
      const exerciseLibraryService = (await import('../../services/exerciseLibraryService')).default;
      const normalizedName = await exerciseLibraryService.findBestMatch(currentExercise.exerciseName);
      list.push({ ...currentExercise, exerciseName: normalizedName });
    }

    if (list.length === 0) return;

    setSubmitting(true);
    try {
      const dateStr = new Date().toISOString().slice(0, 10);
      for (const ex of list) {
        await add({
          exerciseName: ex.exerciseName.trim(),
          sets: Number(ex.sets),
          reps: Number(ex.reps),
          weight: ex.weight ? Number(ex.weight) : 0,
          date: dateStr
        });
      }
      setPendingExercises([]);
      setCurrentExercise({ exerciseName: '', sets: '', reps: '', weight: '' });
      setAddModal(false);
    } catch (e: any) {
      Alert.alert('Errore', e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const shiftMonth = (delta: number) => {
    if (showAll) {
      setShowAll(false);
    }
    const d = new Date(selectedMonth);
    d.setMonth(d.getMonth() + delta);
    setSelectedMonth(d);
  };

  const selectMonth = (month: Date | null) => {
    if (month === null) {
      setShowAll(true);
    } else {
      setShowAll(false);
      setSelectedMonth(month);
    }
    setMonthPickerModal(false);
  };

  const monthLabel = showAll ? 'Tutti' : selectedMonth.toLocaleString('it-IT', { month: 'long', year: 'numeric' });
  const capitalizedMonth = showAll ? 'Tutti' : monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={{ marginTop: insets.top, marginBottom: 12 }}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Allenamenti</Text>
          <Pressable style={styles.addBtnSmall} onPress={() => setSelectionModal(true)}>
            <Text style={styles.addBtnSmallTxt}>+</Text>
          </Pressable>
        </View>
        <View style={styles.monthNav}>
          <Pressable onPress={() => shiftMonth(-1)} style={styles.navBtn}><Text style={styles.navBtnText}>{'<'}</Text></Pressable>
          <Pressable onPress={() => setMonthPickerModal(true)}>
            <Text style={styles.monthTitle}>{capitalizedMonth}</Text>
          </Pressable>
          <Pressable onPress={() => shiftMonth(1)} style={styles.navBtn}><Text style={styles.navBtnText}>{'>'}</Text></Pressable>
        </View>
      </View>

      {loading && workouts.length === 0 && <ActivityIndicator color={colors.accent} />}
      {!loading && grouped.length === 0 && <Text style={styles.empty}>Nessun allenamento in questo mese</Text>}

      {(showAllWorkouts ? grouped : grouped.slice(0, 7)).map(g => (
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

      {grouped.length > 7 && (
        <Pressable style={styles.showMoreBtn} onPress={() => setShowAllWorkouts(!showAllWorkouts)}>
          <Text style={styles.showMoreTxt}>{showAllWorkouts ? 'Mostra meno' : `Mostra altro (${grouped.length - 7})`}</Text>
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
              labels: series.labels.length ? series.labels : ['', '', '', '', '', ''],
              datasets: [{ data: series.points.length ? series.points : [0, 0, 0, 0, 0, 0], color: () => colors.accent, strokeWidth: 2 }]
            }}
            width={Math.max(Dimensions.get('window').width - 64, Math.max(series.points.length, 6) * 42)}
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
              propsForDots: { r: series.points.length > 40 ? '0' : (series.points.length ? '4' : '0'), strokeWidth: '0' },
              propsForBackgroundLines: { stroke: colors.borderAlt, strokeDasharray: '4 6', strokeWidth: 1 }
            }}
            bezier={false}
            withShadow={false}
            style={{ marginLeft: -4 }}
            formatYLabel={val => val}
          />
        </View>
        {selectedExercise && series.points.length > 1 && (
          <Text style={styles.improveText}>{improvement >= 0 ? '+' + improvement.toFixed(1) : improvement.toFixed(1)}% vs inizio</Text>
        )}
      </Card>

      {/* Modals */}
      <Modal visible={selectionModal} animationType="fade" transparent onRequestClose={() => setSelectionModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setSelectionModal(false)}>
          <View style={styles.selectionCard}>
            <Text style={styles.selectionTitle}>Nuovo Allenamento</Text>
            <Pressable style={styles.selectionOption} onPress={() => { setSelectionModal(false); setAddModal(true); }}>
              <Ionicons name="create-outline" size={24} color={colors.accent} />
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.selectionOptionTitle}>Manuale</Text>
                <Text style={styles.selectionOptionSub}>Inserisci esercizi, serie e ripetizioni</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} style={{ marginLeft: 'auto' }} />
            </Pressable>
            <View style={styles.divider} />
            <Pressable style={styles.selectionOption} onPress={() => { setSelectionModal(false); setParseModal(true); }}>
              <Ionicons name="sparkles-outline" size={24} color={colors.accent} />
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.selectionOptionTitle}>Parsing AI</Text>
                <Text style={styles.selectionOptionSub}>Incolla testo o scrivi in linguaggio naturale</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} style={{ marginLeft: 'auto' }} />
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      <Modal visible={addModal} animationType="slide" transparent onRequestClose={() => setAddModal(false)}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'center' }}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Nuovo Allenamento</Text>

              <ScrollView style={{ maxHeight: 150, marginBottom: 10 }}>
                {pendingExercises.map((p, i) => (
                  <View key={i} style={styles.pendingRow}>
                    <Text style={styles.pendingText}>{p.exerciseName} - {p.sets}x{p.reps} {p.weight ? `@ ${p.weight}kg` : ''}</Text>
                    <Pressable onPress={() => removePending(p.id)}><Ionicons name="trash-outline" size={18} color="#ef4444" /></Pressable>
                  </View>
                ))}
                {pendingExercises.length === 0 && <Text style={styles.emptyPending}>Nessun esercizio aggiunto alla lista</Text>}
              </ScrollView>

              <View style={styles.divider} />

              <Text style={styles.subTitle}>Aggiungi Esercizio</Text>
              <TextInput
                placeholder="Esercizio (es. Panca Piana)" placeholderTextColor={colors.textMuted}
                style={styles.input} value={currentExercise.exerciseName} onChangeText={t => setCurrentExercise(f => ({ ...f, exerciseName: t }))}
              />
              <View style={styles.rowInputs}>
                <TextInput placeholder="Serie" placeholderTextColor={colors.textMuted} keyboardType="number-pad" style={[styles.input, styles.inputSmall]}
                  value={currentExercise.sets} onChangeText={t => setCurrentExercise(f => ({ ...f, sets: t }))} />
                <TextInput placeholder="Ripet." placeholderTextColor={colors.textMuted} keyboardType="number-pad" style={[styles.input, styles.inputSmall]}
                  value={currentExercise.reps} onChangeText={t => setCurrentExercise(f => ({ ...f, reps: t }))} />
                <TextInput placeholder="Peso" placeholderTextColor={colors.textMuted} keyboardType="decimal-pad" style={[styles.input, styles.inputSmall]}
                  value={currentExercise.weight} onChangeText={t => setCurrentExercise(f => ({ ...f, weight: t }))} />
              </View>

              <Pressable style={styles.addOneBtn} onPress={addCurrentToPending}>
                <Text style={styles.addOneBtnTxt}>+ Aggiungi alla lista</Text>
              </Pressable>

              <View style={styles.modalBtnsRow}>
                <Pressable style={[styles.btn, styles.btnCancel]} onPress={() => setAddModal(false)}><Text style={styles.btnTxt}>Annulla</Text></Pressable>
                <Pressable style={[styles.btn, styles.btnPrimary, (pendingExercises.length === 0 && !currentExercise.exerciseName) && styles.btnDisabled]}
                  disabled={(pendingExercises.length === 0 && !currentExercise.exerciseName) || submitting} onPress={submitAll}>
                  <Text style={styles.btnPrimaryTxt}>{submitting ? 'Salvataggio...' : `Salva Tutto (${pendingExercises.length + (currentExercise.exerciseName ? 1 : 0)})`}</Text>
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <Modal visible={parseModal} animationType="fade" transparent onRequestClose={() => { if (!parsing) setParseModal(false); }}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'center' }}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Parsing Allenamento (AI)</Text>
              <TextInput
                multiline
                placeholder={`Incolla o scrivi il tuo allenamento in linguaggio naturale
Esempio: 
Panca piana 4x8 60kg
Rematore bilanciere 3x10 50kg 1'
Curl manubri 3x12 12kg`}
                placeholderTextColor={colors.textMuted}
                style={[styles.input, { height: 140, textAlignVertical: 'top' }]}
                value={parseText}
                onChangeText={setParseText}
              />
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: parsed.length ? 12 : 4 }}>
                {/* Swap: Chiudi first, Analizza second */}
                <Pressable style={[styles.btn, styles.btnCancel]} onPress={() => !parsing && setParseModal(false)}><Text style={styles.btnTxt}>Chiudi</Text></Pressable>
                <Pressable style={[styles.btn, styles.btnSecondary, (parsing || !parseText.trim()) && styles.btnDisabled]} disabled={parsing || !parseText.trim()} onPress={async () => {
                  setParsing(true); setParsed([]);
                  try {
                    const res = await workoutParser.parseWorkout(parseText.trim());
                    setParsed(res);
                    if (res.length === 0) Alert.alert('Nessun esercizio', 'Non sono stati riconosciuti esercizi validi.');
                  } catch (e: any) { Alert.alert('Errore parsing', e.message || 'Impossibile parsificare'); }
                  finally { setParsing(false); }
                }}>
                  {parsing
                    ? <ActivityIndicator color={colors.accent} size="small" />
                    : <Text style={styles.btnTxt}>Analizza</Text>
                  }
                </Pressable>
              </View>
              {parsed.length > 0 && (
                <ScrollView style={{ maxHeight: 230, marginBottom: 12 }}>
                  {parsed.map((p, i) => (
                    <View key={i} style={styles.parsedRow}>
                      <Text style={styles.parsedExercise}>{p.exercise}</Text>
                      <Text style={styles.parsedMeta}>{p.sets}x{p.reps}{p.weight ? ` @ ${p.weight}kg` : ''}{p.rest ? ` · ${p.rest}` : ''}</Text>
                    </View>
                  ))}
                </ScrollView>
              )}
              {parsed.length > 0 && (
                <Pressable style={[styles.btn, styles.btnPrimary, savingParsed && styles.btnDisabled]} disabled={savingParsed} onPress={async () => {
                  setSavingParsed(true);
                  try {
                    for (const p of parsed) {
                      await add({
                        exerciseName: p.exercise,
                        sets: p.sets,
                        reps: p.reps,
                        weight: p.weight || 0,
                        date: new Date().toISOString().slice(0, 10),
                        notes: p.notes || ''
                      });
                    }
                    setParseModal(false); setParseText(''); setParsed([]);
                  } catch (e: any) { Alert.alert('Salvataggio fallito', e.message || 'Errore sconosciuto'); }
                  finally { setSavingParsed(false); }
                }}>
                  {savingParsed
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={styles.btnPrimaryTxt}>{`Salva ${parsed.length}`}</Text>
                  }
                </Pressable>
              )}
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

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

      {/* Month Picker Modal */}
      <Modal visible={monthPickerModal} animationType="fade" transparent onRequestClose={() => setMonthPickerModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setMonthPickerModal(false)}>
          <View style={styles.monthPickerCard}>
            <Text style={styles.monthPickerTitle}>Seleziona Periodo</Text>
            <ScrollView style={{ maxHeight: 400 }}>
              <Pressable style={[styles.monthOption, showAll && styles.monthOptionActive]} onPress={() => selectMonth(null)}>
                <Text style={[styles.monthOptionText, showAll && styles.monthOptionTextActive]}>Tutti</Text>
                {showAll && <Ionicons name="checkmark" size={20} color="#fff" />}
              </Pressable>
              {Array.from({ length: 12 }, (_, i) => {
                const date = new Date();
                date.setMonth(date.getMonth() - i);
                const label = date.toLocaleString('it-IT', { month: 'long', year: 'numeric' });
                const capitalizedLabel = label.charAt(0).toUpperCase() + label.slice(1);
                const isActive = !showAll && date.getMonth() === selectedMonth.getMonth() && date.getFullYear() === selectedMonth.getFullYear();
                return (
                  <Pressable key={i} style={[styles.monthOption, isActive && styles.monthOptionActive]} onPress={() => selectMonth(date)}>
                    <Text style={[styles.monthOptionText, isActive && styles.monthOptionTextActive]}>{capitalizedLabel}</Text>
                    {isActive && <Ionicons name="checkmark" size={20} color="#fff" />}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

function groupByDate(items: any[]): GroupedDay[] {
  const map: Record<string, any[]> = {};
  items.forEach(i => { if (!map[i.date]) map[i.date] = []; map[i.date].push(i); });
  return Object.entries(map)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([date, items]) => ({ date, items }));
}

function buildExerciseSeries(workouts: any[], exercise: string | null): Series {
  if (!exercise) return { labels: [], points: [] };
  const months = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];
  const filtered = workouts
    .filter(w => w.exerciseName === exercise && w.weight && w.weight > 0)
    .sort((a, b) => a.date.localeCompare(b.date));

  const last = filtered.slice(-45);
  const rawLabels = last.map(w => {
    const d = new Date(w.date + 'T00:00:00');
    return d.getDate() + ' ' + months[d.getMonth()];
  });
  const points = last.map(w => Number(w.weight));

  let step = 1;
  if (rawLabels.length > 36) step = 6; else if (rawLabels.length > 30) step = 5; else if (rawLabels.length > 24) step = 4; else if (rawLabels.length > 18) step = 3; else if (rawLabels.length > 12) step = 2;
  const labels = rawLabels.map((l, i) => (i % step === 0 ? l : ''));
  return { labels, points };
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 20, paddingTop: 24 },
  title: { fontSize: 26, fontWeight: '700', color: colors.textPrimary },
  sectionHeading: { fontSize: 16, fontWeight: '600', color: colors.textPrimary, letterSpacing: 0.5 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
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
  showMoreBtn: { alignSelf: 'center', paddingVertical: 6, paddingHorizontal: 18, borderRadius: 20, backgroundColor: colors.cardAlt, marginTop: 4 },
  showMoreTxt: { color: colors.textSecondary, fontSize: 13, fontWeight: '500' },
  improveText: { marginTop: 10, fontSize: 13, color: colors.textSecondary },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', padding: 24, justifyContent: 'center' },
  modalCard: { backgroundColor: colors.card, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: colors.borderAlt },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: 14 },
  input: { backgroundColor: colors.cardAlt, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, color: colors.textPrimary, fontSize: 14, borderWidth: 1, borderColor: colors.borderAlt, marginBottom: 12 },
  rowInputs: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  inputSmall: { flex: 1, marginRight: 8 },
  modalBtnsRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12, columnGap: 12 },
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
  aiParseBtn: { alignSelf: 'flex-start', backgroundColor: colors.cardAlt, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 18, borderWidth: 1, borderColor: colors.borderAlt, marginBottom: 12 },
  aiParseBtnTxt: { color: colors.accent, fontWeight: '600', fontSize: 13, letterSpacing: 0.5 },
  btnSecondary: { backgroundColor: colors.cardAlt },
  parsedRow: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.borderAlt },
  parsedExercise: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  parsedMeta: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  monthNav: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  navBtn: { backgroundColor: colors.cardAlt, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  navBtnText: { color: colors.accent, fontSize: 14, fontWeight: '700' },
  monthTitle: { fontSize: 14, fontWeight: '600', color: colors.textPrimary, letterSpacing: 0.3 },
  pendingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.cardAlt, padding: 10, borderRadius: 10, marginBottom: 6 },
  pendingText: { color: colors.textPrimary, fontSize: 13 },
  emptyPending: { color: colors.textMuted, fontSize: 12, textAlign: 'center', fontStyle: 'italic', marginBottom: 8 },
  divider: { height: 1, backgroundColor: colors.borderAlt, marginVertical: 12 },
  subTitle: { color: colors.textSecondary, fontSize: 13, fontWeight: '600', marginBottom: 8 },
  addOneBtn: { alignSelf: 'center', paddingVertical: 8 },
  addOneBtnTxt: { color: colors.accent, fontWeight: '600', fontSize: 14 },
  selectionCard: { backgroundColor: colors.card, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: colors.borderAlt, width: '100%', maxWidth: 340, alignSelf: 'center' },
  selectionTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: 16, textAlign: 'center' },
  selectionOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  selectionOptionTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '600' },
  selectionOptionSub: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  monthPickerCard: { backgroundColor: colors.card, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: colors.borderAlt, width: '100%', maxWidth: 340, alignSelf: 'center' },
  monthPickerTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: 12, textAlign: 'center' },
  monthOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, marginBottom: 6, backgroundColor: colors.cardAlt },
  monthOptionActive: { backgroundColor: colors.accent },
  monthOptionText: { color: colors.textPrimary, fontSize: 15, fontWeight: '600' },
  monthOptionTextActive: { color: '#fff' }
});
