import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { workoutService } from '../../services/workoutService';

const DAYS = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];

export default function WeeklyPlanScreen({ navigation }: any) {
    const insets = useSafeAreaInsets();
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDay, setSelectedDay] = useState(new Date().getDay()); // Default to today

    // Edit state
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({
        id: undefined as string | undefined,
        exercise: '',
        sets: '',
        reps: '',
        notes: ''
    });

    useEffect(() => {
        loadPlans();
    }, []);

    const loadPlans = async () => {
        setLoading(true);
        try {
            const data = await workoutService.getAllPlans();
            setPlans(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!editData.exercise) return;
        setLoading(true);
        try {
            if (editData.id) {
                await workoutService.updatePlan(editData.id, {
                    exercise: editData.exercise,
                    sets: Number(editData.sets),
                    reps: Number(editData.reps),
                    notes: editData.notes,
                    weekday: selectedDay
                });
            } else {
                await workoutService.addPlan({
                    weekday: selectedDay,
                    exercise: editData.exercise,
                    sets: Number(editData.sets),
                    reps: Number(editData.reps),
                    notes: editData.notes
                });
            }
            await loadPlans();
            setIsEditing(false);
            setEditData({ id: undefined, exercise: '', sets: '', reps: '', notes: '' });
        } catch (e: any) {
            Alert.alert('Errore', e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        Alert.alert('Conferma', 'Eliminare questo esercizio?', [
            { text: 'Annulla', style: 'cancel' },
            {
                text: 'Elimina', style: 'destructive', onPress: async () => {
                    setLoading(true);
                    try {
                        await workoutService.deletePlan(id);
                        await loadPlans();
                    } catch (e) { console.error(e); } finally { setLoading(false); }
                }
            }
        ]);
    };

    const startEdit = (item?: any) => {
        if (item) {
            setEditData({
                id: item.id,
                exercise: item.exercise,
                sets: String(item.sets),
                reps: String(item.reps),
                notes: item.notes || ''
            });
        } else {
            setEditData({ id: undefined, exercise: '', sets: '', reps: '', notes: '' });
        }
        setIsEditing(true);
    };

    const currentDayPlans = plans.filter(p => p.weekday === selectedDay);

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.title}>Scheda Settimanale</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.daysTabs}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
                    {DAYS.map((d, idx) => (
                        <TouchableOpacity
                            key={idx}
                            style={[styles.dayTab, selectedDay === idx && styles.dayTabActive]}
                            onPress={() => { setSelectedDay(idx); setIsEditing(false); }}
                        >
                            <Text style={[styles.dayTabText, selectedDay === idx && styles.dayTabTextActive]}>{d.slice(0, 3)}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <View style={styles.content}>
                <View style={styles.dayHeader}>
                    <Text style={styles.dayTitle}>{DAYS[selectedDay]}</Text>
                    {!isEditing && (
                        <TouchableOpacity style={styles.addBtn} onPress={() => startEdit()}>
                            <Ionicons name="add" size={20} color="#fff" />
                            <Text style={styles.addBtnText}>Aggiungi</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {isEditing ? (
                    <View style={styles.editForm}>
                        <Text style={styles.formTitle}>{editData.id ? 'Modifica Esercizio' : 'Nuovo Esercizio'}</Text>

                        <Text style={styles.label}>Esercizio</Text>
                        <TextInput
                            style={styles.input}
                            value={editData.exercise}
                            onChangeText={t => setEditData(p => ({ ...p, exercise: t }))}
                            placeholder="es. Panca Piana"
                            placeholderTextColor={colors.textMuted}
                            autoFocus
                        />

                        <View style={styles.row}>
                            <View style={{ flex: 1, marginRight: 8 }}>
                                <Text style={styles.label}>Serie</Text>
                                <TextInput
                                    style={styles.input}
                                    value={editData.sets}
                                    onChangeText={t => setEditData(p => ({ ...p, sets: t }))}
                                    keyboardType="numeric"
                                    placeholder="4"
                                    placeholderTextColor={colors.textMuted}
                                />
                            </View>
                            <View style={{ flex: 1, marginLeft: 8 }}>
                                <Text style={styles.label}>Reps</Text>
                                <TextInput
                                    style={styles.input}
                                    value={editData.reps}
                                    onChangeText={t => setEditData(p => ({ ...p, reps: t }))}
                                    keyboardType="numeric"
                                    placeholder="10"
                                    placeholderTextColor={colors.textMuted}
                                />
                            </View>
                        </View>

                        <Text style={styles.label}>Note (opzionale)</Text>
                        <TextInput
                            style={styles.input}
                            value={editData.notes}
                            onChangeText={t => setEditData(p => ({ ...p, notes: t }))}
                            placeholder="es. RPE 8"
                            placeholderTextColor={colors.textMuted}
                        />

                        <View style={styles.formActions}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsEditing(false)}>
                                <Text style={styles.cancelBtnText}>Annulla</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                                <Text style={styles.saveBtnText}>Salva</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
                        {loading ? (
                            <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
                        ) : currentDayPlans.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Ionicons name="barbell-outline" size={48} color={colors.cardAlt} />
                                <Text style={styles.emptyText}>Nessun esercizio programmato per {DAYS[selectedDay]}</Text>
                                <TouchableOpacity onPress={() => startEdit()}>
                                    <Text style={styles.emptyLink}>Aggiungi il primo esercizio</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            currentDayPlans.map((item, i) => (
                                <View key={item.id} style={styles.planItem}>
                                    <View style={styles.planIndex}><Text style={styles.planIndexText}>{i + 1}</Text></View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.planName}>{item.exercise}</Text>
                                        <Text style={styles.planMeta}>{item.sets} x {item.reps} {item.notes ? `• ${item.notes}` : ''}</Text>
                                    </View>
                                    <View style={styles.itemActions}>
                                        <TouchableOpacity onPress={() => startEdit(item)} style={styles.iconBtn}>
                                            <Ionicons name="pencil" size={18} color={colors.accent} />
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.iconBtn}>
                                            <Ionicons name="trash-outline" size={18} color={colors.danger} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))
                        )}
                    </ScrollView>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12 },
    backBtn: { padding: 8 },
    title: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
    daysTabs: { borderBottomWidth: 1, borderBottomColor: colors.borderAlt, paddingBottom: 12 },
    dayTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8, backgroundColor: colors.card },
    dayTabActive: { backgroundColor: colors.accent },
    dayTabText: { color: colors.textSecondary, fontWeight: '600' },
    dayTabTextActive: { color: '#fff', fontWeight: '700' },
    content: { flex: 1, padding: 16 },
    dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    dayTitle: { fontSize: 22, fontWeight: '700', color: colors.textPrimary },
    addBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.accent, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    addBtnText: { color: '#fff', fontWeight: '600', marginLeft: 4 },
    planItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, padding: 16, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: colors.borderAlt },
    planIndex: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.cardAlt, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    planIndexText: { color: colors.textMuted, fontSize: 12, fontWeight: '700' },
    planName: { color: colors.textPrimary, fontSize: 16, fontWeight: '600' },
    planMeta: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
    itemActions: { flexDirection: 'row', gap: 8 },
    iconBtn: { padding: 8 },
    emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 60, opacity: 0.7 },
    emptyText: { color: colors.textMuted, marginTop: 16, fontSize: 16 },
    emptyLink: { color: colors.accent, marginTop: 8, fontWeight: '600' },
    editForm: { backgroundColor: colors.card, padding: 20, borderRadius: 16, borderWidth: 1, borderColor: colors.border },
    formTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '700', marginBottom: 16 },
    label: { color: colors.textSecondary, fontSize: 13, marginBottom: 6 },
    input: { backgroundColor: colors.cardAlt, color: colors.textPrimary, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: colors.borderAlt, marginBottom: 16 },
    row: { flexDirection: 'row' },
    formActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 8 },
    cancelBtn: { paddingVertical: 10, paddingHorizontal: 16 },
    cancelBtnText: { color: colors.textMuted, fontWeight: '600' },
    saveBtn: { backgroundColor: colors.accent, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
    saveBtnText: { color: '#fff', fontWeight: '700' }
});
