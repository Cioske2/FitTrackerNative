import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, Pressable } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useFocusEffect } from '@react-navigation/native';
import { foodService } from '../../services/foodService';
import { nutritionService } from '../../services/nutritionService';
import { useDiaryStore } from '../../store/diaryStore';

import { NativeStackNavigationProp } from '@react-navigation/native-stack';
type ScannerProps = { navigation: NativeStackNavigationProp<any> };
export default function BarcodeScannerScreen({ navigation }: ScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const { addEntry, date } = useDiaryStore();

  useFocusEffect(useCallback(() => { setScanned(false); }, []));

  if (!permission) return <View />;

  if (!permission.granted) {
    return (
      <View style={styles.center}>        
        <Text style={styles.text}>Serve permesso fotocamera</Text>
        <Text style={styles.link} onPress={requestPermission}>Concedi permesso</Text>
      </View>
    );
  }

  const handleBarcode = async (result: any) => {
    if (scanned) return;
    setScanned(true);
    try {
      const code = result?.data;
      if (!code) throw new Error('Codice non valido');
      const existing = await foodService.getFoodByBarcode(code);
      let food = existing as any;
      if (!food) {
        const fallback = await nutritionService.searchOpenFoodFacts(code);
        if (fallback && fallback[0]) {
          const f = fallback[0];
            const inserted = await foodService.addFood({
              name: f.name,
              servingSize: 100,
              serving_unit: 'g',
              calories: Math.round(f.nutrients.calories||0),
              protein: Math.round(f.nutrients.protein||0),
              carbsTotal: Math.round(f.nutrients.carbs||0),
              fatTotal: Math.round(f.nutrients.fat||0),
              sugar: f.nutrients.sugar,
              fiber: f.nutrients.fiber,
              barcode: code,
              brand: f.brand || null,
              isGeneric: true
            });
            food = inserted;
        }
      }
      if (!food) throw new Error('Non trovato');
      await addEntry({
        foodId: food.id,
        foodName: food.name,
        consumedQuantity: 100,
        consumedUnit: 'g',
        calculatedNutrients: {
          calories: food.calories,
          protein: food.protein_g,
          carbohydrates_total: food.carbohydrates_total_g,
          fat_total: food.fat_total_g,
          fiber: food.carbohydrates_fiber_g,
          sugar: food.carbohydrates_sugar_g
        },
        consumptionDate: date
      } as any);
      navigation.goBack();
    } catch (e) {
      Alert.alert('Errore', 'Barcode non riconosciuto');
      setScanned(false);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView style={StyleSheet.absoluteFill} onBarcodeScanned={handleBarcode} barcodeScannerSettings={{ barcodeTypes:['ean13','ean8','upc_a','upc_e','code128'] }} />
      <View style={styles.overlay}>
        {!scanned ? <Text style={styles.text}>Inquadra il codice</Text> : <ActivityIndicator color="#fff" />}
        <Pressable style={styles.cancel} onPress={()=>navigation.goBack()}><Text style={styles.cancelText}>Annulla</Text></Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:{ flex:1, backgroundColor:'#000' },
  overlay:{ position:'absolute', bottom:80, alignSelf:'center', backgroundColor:'rgba(0,0,0,0.4)', padding:16, borderRadius:12, alignItems:'center', gap:12 },
  text:{ color:'#fff', fontSize:16 },
  center:{ flex:1, justifyContent:'center', alignItems:'center' },
  link:{ color:'#10b981', marginTop:12 },
  cancel:{ backgroundColor:'rgba(255,255,255,0.1)', paddingVertical:6, paddingHorizontal:14, borderRadius:20 },
  cancelText:{ color:'#fff', fontSize:12, letterSpacing:0.5 }
});
