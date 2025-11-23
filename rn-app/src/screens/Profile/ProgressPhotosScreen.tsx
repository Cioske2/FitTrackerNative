import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, FlatList, Alert, Modal, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const COLUMNS = 3;
const ITEM_SIZE = (width - 48) / COLUMNS;

interface PhotoItem {
    id: string;
    uri: string;
    date: string;
}

const PHOTOS_KEY = 'progress_photos_v1';

export default function ProgressPhotosScreen({ navigation }: any) {
    const insets = useSafeAreaInsets();
    const [photos, setPhotos] = useState<PhotoItem[]>([]);
    const [selectedPhoto, setSelectedPhoto] = useState<PhotoItem | null>(null);

    useEffect(() => {
        loadPhotos();
    }, []);

    const loadPhotos = async () => {
        try {
            const stored = await AsyncStorage.getItem(PHOTOS_KEY);
            if (stored) {
                setPhotos(JSON.parse(stored));
            }
        } catch (e) {
            console.error(e);
        }
    };

    const savePhotos = async (newPhotos: PhotoItem[]) => {
        try {
            await AsyncStorage.setItem(PHOTOS_KEY, JSON.stringify(newPhotos));
            setPhotos(newPhotos);
        } catch (e) {
            console.error(e);
        }
    };

    const handleAddPhoto = async () => {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
            Alert.alert('Permesso negato', 'Serve accesso alla fotocamera');
            return;
        }

        Alert.alert('Nuova Foto', 'Scegli sorgente', [
            { text: 'Galleria', onPress: () => pickImage(false) },
            { text: 'Fotocamera', onPress: () => pickImage(true) },
            { text: 'Annulla', style: 'cancel' }
        ]);
    };

    const pickImage = async (useCamera: boolean) => {
        const result = useCamera
            ? await ImagePicker.launchCameraAsync({ quality: 0.7 })
            : await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });

        if (!result.canceled && result.assets[0]) {
            const asset = result.assets[0];
            // Copy to app document directory to ensure persistence
            const fileName = `progress-${Date.now()}.jpg`;
            const newPath = ((FileSystem as any).documentDirectory || (FileSystem as any).cacheDirectory) + fileName;

            try {
                await FileSystem.copyAsync({ from: asset.uri, to: newPath });

                const newPhoto: PhotoItem = {
                    id: Date.now().toString(),
                    uri: newPath,
                    date: new Date().toISOString()
                };

                const updated = [newPhoto, ...photos];
                await savePhotos(updated);
            } catch (e) {
                Alert.alert('Errore', 'Impossibile salvare la foto');
                console.error(e);
            }
        }
    };

    const handleDelete = async (id: string) => {
        Alert.alert('Elimina', 'Sei sicuro?', [
            { text: 'Annulla', style: 'cancel' },
            {
                text: 'Elimina', style: 'destructive', onPress: async () => {
                    const updated = photos.filter(p => p.id !== id);
                    await savePhotos(updated);
                    setSelectedPhoto(null);
                    // Optionally delete file from FS
                }
            }
        ]);
    };

    const renderItem = ({ item }: { item: PhotoItem }) => (
        <TouchableOpacity onPress={() => setSelectedPhoto(item)} style={styles.itemContainer}>
            <Image source={{ uri: item.uri }} style={styles.thumb} />
            <View style={styles.dateBadge}>
                <Text style={styles.dateText}>{new Date(item.date).toLocaleDateString()}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.title}>Progressi</Text>
                <TouchableOpacity onPress={handleAddPhoto} style={styles.addBtn}>
                    <Ionicons name="camera" size={24} color={colors.accent} />
                </TouchableOpacity>
            </View>

            <FlatList
                data={photos}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                numColumns={COLUMNS}
                contentContainerStyle={styles.grid}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Ionicons name="images-outline" size={64} color={colors.cardAlt} />
                        <Text style={styles.emptyText}>Nessuna foto ancora</Text>
                        <Text style={styles.emptySub}>Scatta una foto per monitorare i tuoi cambiamenti</Text>
                    </View>
                }
            />

            <Modal visible={!!selectedPhoto} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <TouchableOpacity style={styles.closeModal} onPress={() => setSelectedPhoto(null)}>
                        <Ionicons name="close" size={30} color="#fff" />
                    </TouchableOpacity>

                    {selectedPhoto && (
                        <>
                            <Image source={{ uri: selectedPhoto.uri }} style={styles.fullImage} resizeMode="contain" />
                            <View style={styles.modalFooter}>
                                <Text style={styles.modalDate}>{new Date(selectedPhoto.date).toLocaleDateString()} {new Date(selectedPhoto.date).toLocaleTimeString().slice(0, 5)}</Text>
                                <TouchableOpacity onPress={() => handleDelete(selectedPhoto.id)} style={styles.deleteBtn}>
                                    <Ionicons name="trash" size={24} color={colors.danger} />
                                </TouchableOpacity>
                            </View>
                        </>
                    )}
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.borderAlt },
    backBtn: { padding: 8 },
    title: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
    addBtn: { padding: 8 },
    grid: { padding: 16, gap: 8 },
    itemContainer: { width: ITEM_SIZE, height: ITEM_SIZE * 1.3, marginBottom: 8, marginRight: 8, borderRadius: 8, overflow: 'hidden', backgroundColor: colors.card },
    thumb: { width: '100%', height: '100%' },
    dateBadge: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.6)', padding: 4 },
    dateText: { color: '#fff', fontSize: 10, textAlign: 'center' },
    empty: { alignItems: 'center', marginTop: 100, opacity: 0.7 },
    emptyText: { color: colors.textMuted, fontSize: 18, fontWeight: '600', marginTop: 16 },
    emptySub: { color: colors.textSecondary, fontSize: 14, marginTop: 8 },
    modalOverlay: { flex: 1, backgroundColor: '#000', justifyContent: 'center' },
    closeModal: { position: 'absolute', top: 50, right: 20, zIndex: 10, padding: 10 },
    fullImage: { width: '100%', height: '80%' },
    modalFooter: { position: 'absolute', bottom: 50, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 30 },
    modalDate: { color: '#fff', fontSize: 16, fontWeight: '600' },
    deleteBtn: { padding: 10, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20 }
});
