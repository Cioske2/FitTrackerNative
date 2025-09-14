import React, { useState, useCallback, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, Pressable, Modal, TextInput, Image, ScrollView } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useFocusEffect } from '@react-navigation/native';
import { useDiaryStore } from '../../store/diaryStore';
import barcodeService from '../../services/barcodeService';

import { NativeStackNavigationProp } from '@react-navigation/native-stack';
type ScannerProps = { navigation: NativeStackNavigationProp<any> };
export default function BarcodeScannerScreen({ navigation }: ScannerProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const lastCodeRef = useRef<string|null>(null);
  const { addEntry, date } = useDiaryStore();
  const [productPreview, setProductPreview] = useState<any|null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [qty, setQty] = useState('100');
  const [saving, setSaving] = useState(false);

  useFocusEffect(useCallback(() => { setScanned(false); }, []));

  const handleBarcode = async (result: any) => {
    if (scanned || loading) return;
    const code = result?.data;
    if (!code) return;
    // Debounce stesso codice letto in rapida successione
    if (lastCodeRef.current === code) return;
    lastCodeRef.current = code;
    setScanned(true);
    setLoading(true);
    try {
      const lookup = await barcodeService.lookupAndEnsureFood(code);
      if (!lookup) throw new Error('Non trovato');
      const f = lookup.foodRecord;
      // Salviamo anteprima per conferma
      setProductPreview({
        food: f,
        product: lookup.product
      });
      setQty('100');
      setModalVisible(true);
    } catch (e:any) {
      Alert.alert('Errore', e?.message === 'Non trovato' ? 'Prodotto non trovato' : 'Barcode non riconosciuto');
      setScanned(false);
    } finally {
      setLoading(false);
    }
  };

  const parsedQty = useMemo(()=>{
    const n = Number(qty.replace(/,/g,'.'));
    return isFinite(n) && n>0 ? n : 0;
  }, [qty]);

  const scaledMacros = useMemo(()=>{
    if (!productPreview) return null;
    const f = productPreview.food;
    const factor = parsedQty/100 || 0;
    return {
      calories: Math.round((f.calories||0)*factor),
      protein: +( (f.protein_g||0)*factor ).toFixed(1),
      carbs: +( (f.carbohydrates_total_g||0)*factor ).toFixed(1),
      fat: +( (f.fat_total_g||0)*factor ).toFixed(1)
    };
  }, [productPreview, parsedQty]);

  const confirmAdd = async () => {
    if (!productPreview) return;
    if (parsedQty<=0) { Alert.alert('Quantità non valida'); return; }
    setSaving(true);
    try {
      const f = productPreview.food;
      const factor = parsedQty/100;
      await addEntry({
        foodId: f.id,
        foodName: f.name,
        consumedQuantity: parsedQty,
        consumedUnit: 'g',
        calculatedNutrients: {
          calories: Math.round((f.calories||0)*factor),
          protein: +( (f.protein_g||0)*factor ).toFixed(1),
          carbohydrates_total: +( (f.carbohydrates_total_g||0)*factor ).toFixed(1),
          fat_total: +( (f.fat_total_g||0)*factor ).toFixed(1),
          fiber: f.carbohydrates_fiber_g != null ? +( (f.carbohydrates_fiber_g||0)*factor ).toFixed(1) : undefined,
          sugar: f.carbohydrates_sugar_g != null ? +( (f.carbohydrates_sugar_g||0)*factor ).toFixed(1) : undefined
        },
        consumptionDate: date
      } as any);
      setModalVisible(false);
      navigation.goBack();
    } catch (e:any) {
      Alert.alert('Errore', 'Salvataggio non riuscito');
    } finally {
      setSaving(false);
    }
  };

  const cancelModal = () => {
    setModalVisible(false);
    setProductPreview(null);
    setScanned(false); // consente nuovo scan
  };

  let body: React.ReactNode;
  if (!permission) {
    body = <View style={styles.center} />;
  } else if (!permission.granted) {
    body = (
      <View style={styles.center}>        
        <Text style={styles.text}>Serve permesso fotocamera</Text>
        <Text style={styles.link} onPress={requestPermission}>Concedi permesso</Text>
      </View>
    );
  } else {
    body = (
      <>
        <CameraView style={StyleSheet.absoluteFill} onBarcodeScanned={handleBarcode} barcodeScannerSettings={{ barcodeTypes:['ean13','ean8','upc_a','upc_e','code128'] }} />
        <View style={styles.overlay}>
          {!scanned && !loading && <Text style={styles.text}>Inquadra il codice</Text>}
          {(scanned || loading) && <ActivityIndicator color="#fff" />}
          <Pressable style={styles.cancel} onPress={()=>navigation.goBack()}><Text style={styles.cancelText}>Annulla</Text></Pressable>
        </View>
      </>
    );
  }

  return (
    <View style={styles.container}>
      {body}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalBox}>
            {!productPreview ? <ActivityIndicator /> : (
              <ScrollView contentContainerStyle={{paddingBottom:4}}>
                <Text style={styles.modalTitle}>{productPreview.food.name}</Text>
                {productPreview.product?.image_url ? (
                  <Image source={{ uri: productPreview.product.image_url }} style={styles.productImage} />
                ) : (
                  <View style={styles.imagePlaceholder}><Text style={styles.placeholderText}>Nessuna immagine</Text></View>
                )}
                <View style={styles.rowQty}> 
                  <Text style={styles.label}>Quantità (g)</Text>
                  <TextInput value={qty} onChangeText={setQty} keyboardType='numeric' style={styles.inputQty} />
                </View>
                {scaledMacros && (
                  <View style={styles.macrosRow}>
                    <Text style={styles.macroText}>Cal {scaledMacros.calories}</Text>
                    <Text style={styles.macroText}>P {scaledMacros.protein}</Text>
                    <Text style={styles.macroText}>C {scaledMacros.carbs}</Text>
                    <Text style={styles.macroText}>F {scaledMacros.fat}</Text>
                  </View>
                )}
                <View style={styles.actionsRow}>
                  <Pressable style={[styles.btn, styles.btnCancel]} onPress={cancelModal} disabled={saving}><Text style={styles.btnCancelText}>Annulla</Text></Pressable>
                  <Pressable style={[styles.btn, styles.btnConfirm, (parsedQty<=0||saving)&&{opacity:0.5}]} onPress={confirmAdd} disabled={parsedQty<=0||saving}>
                    {saving ? <ActivityIndicator color="#04140a" /> : <Text style={styles.btnConfirmText}>Aggiungi</Text>}
                  </Pressable>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
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
  ,modalBackdrop:{ flex:1, backgroundColor:'rgba(0,0,0,0.6)', justifyContent:'center', padding:24 }
  ,modalBox:{ backgroundColor:'#0f1614', borderRadius:20, padding:18, maxHeight:'80%' }
  ,modalTitle:{ color:'#fff', fontSize:16, fontWeight:'600', marginBottom:12 }
  ,productImage:{ width:'100%', height:140, borderRadius:12, marginBottom:14, backgroundColor:'#111' }
  ,imagePlaceholder:{ width:'100%', height:140, borderRadius:12, marginBottom:14, backgroundColor:'#1e2725', alignItems:'center', justifyContent:'center' }
  ,placeholderText:{ color:'#647a73', fontSize:12 }
  ,rowQty:{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:12 }
  ,label:{ color:'#cbd5d1', fontSize:13 }
  ,inputQty:{ backgroundColor:'#16211e', color:'#fff', paddingVertical:6, paddingHorizontal:10, borderRadius:10, width:90, borderWidth:1, borderColor:'#2a3b36', textAlign:'center' }
  ,macrosRow:{ flexDirection:'row', justifyContent:'space-around', marginBottom:18, backgroundColor:'#16211e', padding:10, borderRadius:14, borderWidth:1, borderColor:'#22312c' }
  ,macroText:{ color:'#e2e8e5', fontSize:13, fontWeight:'600' }
  ,actionsRow:{ flexDirection:'row', justifyContent:'space-between', gap:12 }
  ,btn:{ flex:1, paddingVertical:12, borderRadius:14, alignItems:'center', justifyContent:'center' }
  ,btnCancel:{ backgroundColor:'#1e2a27', borderWidth:1, borderColor:'#2c3d38' }
  ,btnCancelText:{ color:'#cbd5d1', fontSize:13, fontWeight:'600' }
  ,btnConfirm:{ backgroundColor:'#34d399' }
  ,btnConfirmText:{ color:'#04140a', fontSize:14, fontWeight:'700', letterSpacing:0.5 }
});
