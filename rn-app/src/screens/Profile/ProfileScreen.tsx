import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { useAuthStore } from '../../store/authStore';
import Card from '../../components/layout/Card';

export default function ProfileScreen({ navigation }: any) {
    const { user, profile, signOut, updateProfile } = useAuthStore();
    const insets = useSafeAreaInsets();

    const [height, setHeight] = useState('');
    const [weight, setWeight] = useState('');
    const [activity, setActivity] = useState('sedentary');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (profile) {
            setHeight(profile.height ? String(profile.height) : '');
            setWeight(profile.weight ? String(profile.weight) : '');
            setActivity(profile.activity_level || 'sedentary');
        }
    }, [profile]);

    const handleSave = async () => {
        setLoading(true);
        try {
            await updateProfile({
                height: Number(height),
                weight: Number(weight),
                activity_level: activity
            });
            Alert.alert('Successo', 'Profilo aggiornato');
        } catch (error: any) {
            Alert.alert('Errore', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut();
        } catch (error) {
            console.error(error);
        }
    };

    const activityLevels = [
        { id: 'sedentary', label: 'Sedentario', desc: 'Poco o nessun esercizio' },
        { id: 'light', label: 'Leggero', desc: 'Esercizio 1-3 volte/sett' },
        { id: 'moderate', label: 'Moderato', desc: 'Esercizio 3-5 volte/sett' },
        { id: 'active', label: 'Attivo', desc: 'Esercizio 6-7 volte/sett' },
    ];

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <Text style={styles.title}>Profilo</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.userInfo}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{profile?.email?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}</Text>
                    </View>
                    <Text style={styles.email}>{profile?.email || user?.email}</Text>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>Free Plan</Text>
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.photoBtn}
                    onPress={() => navigation.navigate('ProgressPhotos')}
                >
                    <View style={styles.photoIcon}>
                        <Ionicons name="camera" size={24} color="#fff" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.photoTitle}>Foto Progressi</Text>
                        <Text style={styles.photoSub}>Monitora i tuoi cambiamenti fisici</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.photoBtn}
                    onPress={() => navigation.navigate('Goals')}
                >
                    <View style={[styles.photoIcon, { backgroundColor: colors.cardAlt, borderWidth: 1, borderColor: colors.accent }]}>
                        <Ionicons name="flag" size={24} color={colors.accent} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.photoTitle}>I miei Obiettivi</Text>
                        <Text style={styles.photoSub}>Gestisci i tuoi target personali</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                </TouchableOpacity>

                <Text style={styles.sectionTitle}>Dati Biometrici</Text>
                <Card style={styles.formCard}>
                    <View style={styles.row}>
                        <View style={{ flex: 1, marginRight: 10 }}>
                            <Text style={styles.label}>Peso (kg)</Text>
                            <TextInput
                                style={styles.input}
                                value={weight}
                                onChangeText={setWeight}
                                keyboardType="numeric"
                                placeholder="es. 75"
                                placeholderTextColor={colors.textMuted}
                            />
                        </View>
                        <View style={{ flex: 1, marginLeft: 10 }}>
                            <Text style={styles.label}>Altezza (cm)</Text>
                            <TextInput
                                style={styles.input}
                                value={height}
                                onChangeText={setHeight}
                                keyboardType="numeric"
                                placeholder="es. 180"
                                placeholderTextColor={colors.textMuted}
                            />
                        </View>
                    </View>

                    <Text style={[styles.label, { marginTop: 16 }]}>Livello Attività</Text>
                    <View style={styles.activityGrid}>
                        {activityLevels.map((lvl) => (
                            <TouchableOpacity
                                key={lvl.id}
                                style={[styles.activityBtn, activity === lvl.id && styles.activityBtnActive]}
                                onPress={() => setActivity(lvl.id)}
                            >
                                <Text style={[styles.activityLabel, activity === lvl.id && styles.activityLabelActive]}>
                                    {lvl.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TouchableOpacity
                        style={styles.saveBtn}
                        onPress={handleSave}
                        disabled={loading}
                    >
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Salva Modifiche</Text>}
                    </TouchableOpacity>
                </Card>

                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={20} color={colors.danger} />
                    <Text style={styles.logoutText}>Esci</Text>
                </TouchableOpacity>

                <Text style={styles.version}>v0.1.0 • nextRep</Text>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { paddingHorizontal: 20, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.borderAlt },
    title: { fontSize: 24, fontWeight: '700', color: colors.textPrimary },
    content: { padding: 20 },
    userInfo: { alignItems: 'center', marginBottom: 30 },
    avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.cardAlt, alignItems: 'center', justifyContent: 'center', marginBottom: 12, borderWidth: 2, borderColor: colors.accent },
    avatarText: { fontSize: 32, fontWeight: '700', color: colors.accent },
    email: { fontSize: 16, color: colors.textPrimary, fontWeight: '600', marginBottom: 6 },
    badge: { backgroundColor: '#31343a', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    badgeText: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
    photoBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, padding: 16, borderRadius: 16, marginBottom: 24, borderWidth: 1, borderColor: colors.border },
    photoIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
    photoTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '600' },
    photoSub: { color: colors.textMuted, fontSize: 13 },
    sectionTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '600', marginBottom: 12 },
    formCard: { padding: 20, marginBottom: 24 },
    row: { flexDirection: 'row' },
    label: { color: colors.textSecondary, fontSize: 14, marginBottom: 8 },
    input: { backgroundColor: colors.background, color: colors.textPrimary, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: colors.borderAlt, fontSize: 16 },
    activityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
    activityBtn: { flexBasis: '48%', padding: 12, borderRadius: 10, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.borderAlt, alignItems: 'center' },
    activityBtnActive: { borderColor: colors.accent, backgroundColor: 'rgba(56, 189, 248, 0.1)' },
    activityLabel: { color: colors.textSecondary, fontWeight: '500' },
    activityLabelActive: { color: colors.accent, fontWeight: '700' },
    saveBtn: { backgroundColor: colors.accent, padding: 16, borderRadius: 12, alignItems: 'center' },
    saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
    logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, backgroundColor: 'rgba(239, 68, 68, 0.1)', marginBottom: 20 },
    logoutText: { color: colors.danger, fontWeight: '600', fontSize: 16, marginLeft: 8 },
    version: { textAlign: 'center', color: colors.textMuted, fontSize: 12 }
});
