import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { useAuthStore } from '../../store/authStore';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function OnboardingScreen({ navigation }: any) {
    const insets = useSafeAreaInsets();
    const { updateProfile } = useAuthStore();
    const [step, setStep] = useState(0);

    const [data, setData] = useState({
        goal: '',
        gender: '',
        age: '',
        height: '',
        weight: '',
        activityLevel: ''
    });

    const updateData = (key: string, value: string) => setData(prev => ({ ...prev, [key]: value }));

    const handleNext = async () => {
        if (step < 3) {
            setStep(step + 1);
        } else {
            // Finish
            try {
                await updateProfile({
                    goal: data.goal,
                    gender: data.gender,
                    age: Number(data.age),
                    height: Number(data.height),
                    weight: Number(data.weight),
                    activity_level: data.activityLevel
                });
            } catch (e) {
                console.error(e);
            }
        }
    };

    const handleBack = () => {
        if (step > 0) setStep(step - 1);
    };

    const renderStep0_Goal = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.question}>Qual è il tuo obiettivo principale?</Text>
            <View style={styles.optionsContainer}>
                {[
                    { id: 'lose_weight', label: 'Perdere Peso', icon: 'scale-outline' },
                    { id: 'gain_muscle', label: 'Mettere Muscoli', icon: 'barbell-outline' },
                    { id: 'maintain', label: 'Mantenere Peso', icon: 'heart-outline' }
                ].map(opt => (
                    <TouchableOpacity
                        key={opt.id}
                        style={[styles.optionBtn, data.goal === opt.id && styles.optionBtnActive]}
                        onPress={() => updateData('goal', opt.id)}
                    >
                        <Ionicons name={opt.icon as any} size={32} color={data.goal === opt.id ? colors.accent : colors.textMuted} />
                        <Text style={[styles.optionLabel, data.goal === opt.id && styles.optionLabelActive]}>{opt.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    const renderStep1_Biometrics = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.question}>Parlaci di te</Text>
            <View style={styles.formContainer}>
                <Text style={styles.label}>Sesso</Text>
                <View style={styles.row}>
                    {['Uomo', 'Donna'].map(g => (
                        <TouchableOpacity
                            key={g}
                            style={[styles.genderBtn, data.gender === g && styles.genderBtnActive]}
                            onPress={() => updateData('gender', g)}
                        >
                            <Text style={[styles.genderText, data.gender === g && styles.genderTextActive]}>{g}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.label}>Età</Text>
                <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={data.age}
                    onChangeText={t => updateData('age', t)}
                    placeholder="Anni"
                    placeholderTextColor={colors.textMuted}
                />

                <View style={styles.row}>
                    <View style={{ flex: 1, marginRight: 10 }}>
                        <Text style={styles.label}>Peso (kg)</Text>
                        <TextInput
                            style={styles.input}
                            keyboardType="numeric"
                            value={data.weight}
                            onChangeText={t => updateData('weight', t)}
                            placeholder="kg"
                            placeholderTextColor={colors.textMuted}
                        />
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.label}>Altezza (cm)</Text>
                        <TextInput
                            style={styles.input}
                            keyboardType="numeric"
                            value={data.height}
                            onChangeText={t => updateData('height', t)}
                            placeholder="cm"
                            placeholderTextColor={colors.textMuted}
                        />
                    </View>
                </View>
            </View>
        </View>
    );

    const renderStep2_Activity = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.question}>Quanto sei attivo?</Text>
            <ScrollView style={{ flex: 1 }}>
                {[
                    { id: 'sedentary', label: 'Sedentario', desc: 'Lavoro d\'ufficio, poco movimento' },
                    { id: 'light', label: 'Leggermente Attivo', desc: 'Allenamento 1-3 volte a settimana' },
                    { id: 'moderate', label: 'Moderatamente Attivo', desc: 'Allenamento 3-5 volte a settimana' },
                    { id: 'active', label: 'Molto Attivo', desc: 'Allenamento 6-7 volte a settimana' },
                    { id: 'athlete', label: 'Atleta', desc: 'Lavoro fisico o doppio allenamento' }
                ].map(opt => (
                    <TouchableOpacity
                        key={opt.id}
                        style={[styles.activityOption, data.activityLevel === opt.id && styles.activityOptionActive]}
                        onPress={() => updateData('activityLevel', opt.id)}
                    >
                        <Text style={[styles.activityLabel, data.activityLevel === opt.id && styles.activityLabelActive]}>{opt.label}</Text>
                        <Text style={styles.activityDesc}>{opt.desc}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );

    const renderStep3_Review = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.question}>Tutto pronto!</Text>
            <Text style={styles.subtext}>Abbiamo personalizzato la tua esperienza in base ai tuoi dati.</Text>

            <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Il tuo piano</Text>
                <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Obiettivo:</Text><Text style={styles.summaryVal}>{data.goal.replace('_', ' ')}</Text></View>
                <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Biometria:</Text><Text style={styles.summaryVal}>{data.gender}, {data.age} anni</Text></View>
                <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Corpo:</Text><Text style={styles.summaryVal}>{data.weight}kg, {data.height}cm</Text></View>
                <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Attività:</Text><Text style={styles.summaryVal}>{data.activityLevel}</Text></View>
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${((step + 1) / 4) * 100}%` }]} />
            </View>

            <View style={styles.content}>
                {step === 0 && renderStep0_Goal()}
                {step === 1 && renderStep1_Biometrics()}
                {step === 2 && renderStep2_Activity()}
                {step === 3 && renderStep3_Review()}
            </View>

            <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
                {step > 0 && (
                    <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
                        <Text style={styles.backText}>Indietro</Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity
                    onPress={handleNext}
                    style={[styles.nextBtn, step === 0 && !data.goal && styles.disabledBtn]}
                    disabled={step === 0 && !data.goal}
                >
                    <Text style={styles.nextText}>{step === 3 ? 'Inizia!' : 'Avanti'}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    progressBar: { height: 4, backgroundColor: colors.cardAlt, width: '100%' },
    progressFill: { height: '100%', backgroundColor: colors.accent },
    content: { flex: 1, padding: 24 },
    stepContainer: { flex: 1 },
    question: { fontSize: 28, fontWeight: '700', color: colors.textPrimary, marginBottom: 30 },
    subtext: { fontSize: 16, color: colors.textSecondary, marginBottom: 30, lineHeight: 24 },
    optionsContainer: { gap: 16 },
    optionBtn: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.borderAlt, gap: 20 },
    optionBtnActive: { borderColor: colors.accent, backgroundColor: 'rgba(56, 189, 248, 0.1)' },
    optionLabel: { fontSize: 18, fontWeight: '600', color: colors.textSecondary },
    optionLabelActive: { color: colors.accent },
    formContainer: { gap: 20 },
    label: { color: colors.textSecondary, fontSize: 14, marginBottom: 8 },
    row: { flexDirection: 'row', gap: 10 },
    genderBtn: { flex: 1, padding: 16, backgroundColor: colors.card, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: colors.borderAlt },
    genderBtnActive: { borderColor: colors.accent, backgroundColor: 'rgba(56, 189, 248, 0.1)' },
    genderText: { color: colors.textSecondary, fontWeight: '600' },
    genderTextActive: { color: colors.accent },
    input: { backgroundColor: colors.card, color: colors.textPrimary, padding: 16, borderRadius: 12, fontSize: 16, borderWidth: 1, borderColor: colors.borderAlt },
    activityOption: { padding: 20, backgroundColor: colors.card, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.borderAlt },
    activityOptionActive: { borderColor: colors.accent, backgroundColor: 'rgba(56, 189, 248, 0.1)' },
    activityLabel: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
    activityLabelActive: { color: colors.accent },
    activityDesc: { fontSize: 13, color: colors.textMuted },
    summaryCard: { backgroundColor: colors.card, padding: 24, borderRadius: 20, borderWidth: 1, borderColor: colors.border },
    summaryTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: 16 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    summaryLabel: { color: colors.textMuted, fontSize: 14 },
    summaryVal: { color: colors.textPrimary, fontWeight: '600', fontSize: 14, textTransform: 'capitalize' },
    footer: { flexDirection: 'row', paddingHorizontal: 24, alignItems: 'center', justifyContent: 'space-between' },
    backBtn: { padding: 16 },
    backText: { color: colors.textSecondary, fontSize: 16, fontWeight: '600' },
    nextBtn: { backgroundColor: colors.accent, paddingVertical: 16, paddingHorizontal: 32, borderRadius: 14, marginLeft: 'auto' },
    disabledBtn: { opacity: 0.5 },
    nextText: { color: '#fff', fontSize: 16, fontWeight: '700' }
});
