import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, ActivityIndicator, TouchableOpacity, Image, Alert } from 'react-native';
import { colors } from '../../theme/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LineChart } from 'react-native-chart-kit';
import { useDiaryStore } from '../../store/diaryStore';

export default function ProgressChartsScreen() {
  const { history7d, loadHistory } = useDiaryStore();
  const [photos, setPhotos] = React.useState<any[]>([]);
  const [uploading, setUploading] = React.useState(false);
  const insets = useSafeAreaInsets();
  const width = Dimensions.get('window').width;

  useEffect(() => {
    loadHistory(7);
    loadPhotos();
  }, []);

  const loadPhotos = async () => {
    try {
      const { progressService } = await import('../../services/progressService');
      const data = await progressService.getProgressEntries();
      setPhotos(data);
    } catch (e) {
      console.error('Failed to load photos', e);
    }
  };

  const pickAndUploadImage = async () => {
    try {
      const ImagePicker = await import('expo-image-picker');
      const { progressService } = await import('../../services/progressService');

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        setUploading(true);
        const uri = result.assets[0].uri;
        const path = await progressService.uploadProgressPhoto(uri);
        await progressService.addProgressEntry(path);
        await loadPhotos();
      }
    } catch (e) {
      Alert.alert('Errore', 'Errore caricamento foto: ' + (e as any).message);
    } finally {
      setUploading(false);
    }
  };

  const labels = history7d.map(h => h.date.slice(5));
  const data = history7d.map(h => h.calories || 0);
  const loading = history7d.length === 0;

  const wrapStyle = [
    styles.container,
    width > 720 ? { maxWidth: 720 } : undefined,
    {
      paddingTop: 20 + insets.top,
      paddingBottom: 40 + insets.bottom,
      alignSelf: 'center' as const,
      width: width,
    },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ paddingBottom: 0 }}>
      <View style={wrapStyle}>
        <Text style={styles.title}>Progressi</Text>

        <View style={styles.chartBox}>
          <Text style={styles.chartTitle}>Calorie (7 giorni)</Text>
          {loading ? <ActivityIndicator color={colors.accent} /> : (
            <LineChart
              data={{ labels, datasets: [{ data, color: () => colors.accent }] }}
              width={width - 32}
              height={220}
              yAxisSuffix=""
              chartConfig={{
                backgroundColor: colors.background, backgroundGradientFrom: colors.background, backgroundGradientTo: colors.background,
                decimalPlaces: 0,
                color: (opacity: number) => `rgba(16,185,129,${opacity})`, labelColor: () => colors.textMuted, propsForDots: { r: '4', strokeWidth: '2', stroke: colors.accent }
              }}
              bezier
              style={{ borderRadius: 16 }}
            />
          )}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.title}>Foto Progressi</Text>
          <TouchableOpacity onPress={pickAndUploadImage} disabled={uploading} style={styles.addButton}>
            {uploading ? <ActivityIndicator color="#000" size="small" /> : <Text style={styles.addButtonText}>+ Aggiungi</Text>}
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoScroll}>
          {photos.map((p) => (
            <View key={p.id} style={styles.photoCard}>
              <Image
                source={{ uri: `https://cbfd46b4-1b49-4baa-8733-6a6f01b2e96d.supabase.co/storage/v1/object/public/progress_photos/${p.photo_path}` }}
                style={styles.photo}
              />
              <Text style={styles.photoDate}>{p.date}</Text>
            </View>
          ))}
          {photos.length === 0 && (
            <Text style={{ color: colors.textMuted, fontStyle: 'italic' }}>Nessuna foto ancora.</Text>
          )}
        </ScrollView>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: colors.background },
  title: { color: colors.textPrimary, fontSize: 24, fontWeight: '600', marginBottom: 16 },
  chartBox: { marginBottom: 24 },
  chartTitle: { color: colors.textPrimary, marginBottom: 8, fontWeight: '600' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, marginTop: 16 },
  addButton: { backgroundColor: colors.accent, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  addButtonText: { color: '#000', fontWeight: 'bold' },
  photoScroll: { marginBottom: 24 },
  photoCard: { marginRight: 12, alignItems: 'center' },
  photo: { width: 120, height: 160, borderRadius: 8, backgroundColor: '#333' },
  photoDate: { color: colors.textMuted, fontSize: 12, marginTop: 4 }
});
