import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform, useWindowDimensions, ScrollView, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { useGoalItemsStore } from '../../store/goalItemsStore';
import { Ionicons } from '@expo/vector-icons';
import Card from '../../components/layout/Card';

export default function GoalsScreen() {
  // (Macro goals removed as per request)
  // User goal items list
  const { items, load: loadItems, add, update, remove, complete } = useGoalItemsStore();
  const [addModal, setAddModal] = useState(false);
  const [newGoal, setNewGoal] = useState({ title:'', type:'other', direction:'increase', target:'', unit:'', description:'' });
  const [adding, setAdding] = useState(false);

  useEffect(() => { loadItems(); }, []);

  // commit removed (macros eliminated)

  const submitNewGoal = async () => {
    if (!newGoal.title) return;
    setAdding(true);
    const payload: any = {
      title: newGoal.title.trim(),
      type: newGoal.type,
      direction: newGoal.direction,
      description: newGoal.description || ''
    };
    if (newGoal.target) payload.target_value = Number(newGoal.target);
    if (newGoal.unit) payload.unit = newGoal.unit;
    await add(payload);
    setAdding(false);
    setAddModal(false);
    setNewGoal({ title:'', type:'other', direction:'increase', target:'', unit:'', description:'' });
  };

  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
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
    <KeyboardAvoidingView style={{flex:1, backgroundColor:colors.background}} behavior={Platform.OS==='ios'?'padding':undefined}>
      <ScrollView contentContainerStyle={{paddingBottom:0}}>
        <View style={wrapStyle}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Obiettivi</Text>
            <Pressable onPress={()=>setAddModal(true)} style={styles.addBtn}><Ionicons name="add" size={22} color="#fff" /></Pressable>
          </View>

          {/* Lista goal items */}
          <View style={{ marginBottom:28 }}>
            {items.length===0 && <Text style={styles.empty}>Nessun obiettivo</Text>}
            {items.map(g => (
              <Card key={g.id} style={styles.goalCard}>
                <View style={styles.goalRow}>
                  <View style={{flex:1}}>
                    <Text style={styles.goalTitle}>{g.title}</Text>
                    {g.description ? <Text style={styles.goalDesc}>{g.description}</Text> : null}
                    {g.target_value ? <Text style={styles.goalMeta}>Target: {g.target_value}{g.unit||''}</Text> : null}
                  </View>
                  <View style={styles.goalActions}>
                    {g.status==='active' && (
                      <Pressable onPress={()=>complete(g.id)} style={styles.smallAction}><Ionicons name="checkmark" size={18} color={colors.accent} /></Pressable>
                    )}
                    <Pressable onPress={()=>remove(g.id)} style={styles.smallAction}><Ionicons name="trash" size={18} color={colors.danger} /></Pressable>
                  </View>
                </View>
              </Card>
            ))}
          </View>

          {/* Macronutrienti section removed */}
        </View>
      </ScrollView>

      {/* Modal nuovo obiettivo */}
      <Modal visible={addModal} transparent animationType="fade" onRequestClose={()=>setAddModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Nuovo Obiettivo</Text>
            <TextInput placeholder='Titolo' placeholderTextColor={colors.textMuted} style={styles.modalInput} value={newGoal.title} onChangeText={t=>setNewGoal(g=>({...g,title:t}))} />
            <TextInput placeholder='Descrizione (opzionale)' placeholderTextColor={colors.textMuted} style={styles.modalInput} value={newGoal.description} onChangeText={t=>setNewGoal(g=>({...g,description:t}))} />
            <View style={styles.row2}>
              <TextInput placeholder='Target' placeholderTextColor={colors.textMuted} keyboardType='decimal-pad' style={[styles.modalInput, styles.half]} value={newGoal.target} onChangeText={t=>setNewGoal(g=>({...g,target:t}))} />
              <TextInput placeholder='Unità' placeholderTextColor={colors.textMuted} style={[styles.modalInput, styles.half]} value={newGoal.unit} onChangeText={t=>setNewGoal(g=>({...g,unit:t}))} />
            </View>
            <View style={styles.modalActions}>
              <Pressable onPress={()=>setAddModal(false)} style={[styles.modalBtn, styles.modalCancel]}><Text style={styles.modalBtnTxt}>Annulla</Text></Pressable>
              <Pressable disabled={!newGoal.title || adding} onPress={submitNewGoal} style={[styles.modalBtn, styles.modalPrimary, (!newGoal.title||adding)&&{opacity:0.5}]}>
                <Text style={styles.modalBtnPrimaryTxt}>{adding? '...' : 'Salva'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:{ flex:1, backgroundColor:colors.background, padding:20 },
  title:{ color:colors.textPrimary, fontSize:24, fontWeight:'700' },
  headerRow:{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:18 },
  addBtn:{ backgroundColor:colors.accent, width:42, height:42, borderRadius:12, alignItems:'center', justifyContent:'center' },
  sectionHeading:{ color:colors.textPrimary, fontSize:16, fontWeight:'600', marginBottom:12 },
  empty:{ color:colors.textMuted, fontSize:14 },
  goalCard:{ marginBottom:12, padding:16 },
  goalRow:{ flexDirection:'row', alignItems:'flex-start' },
  goalTitle:{ color:colors.textPrimary, fontSize:15, fontWeight:'600', marginBottom:2 },
  goalDesc:{ color:colors.textSecondary, fontSize:12, marginBottom:4 },
  goalMeta:{ color:colors.textMuted, fontSize:11 },
  goalActions:{ flexDirection:'row', alignItems:'center', columnGap:4 },
  smallAction:{ padding:6, borderRadius:10, backgroundColor:colors.cardAlt },
  form:{ gap:14 },
  fieldRow:{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', backgroundColor:colors.cardAlt, padding:10, borderRadius:12, borderWidth:1, borderColor:colors.border },
  label:{ color:colors.textPrimary, width:120, textTransform:'capitalize', fontWeight:'500' },
  input:{ backgroundColor:colors.card, color:colors.textPrimary, padding:10, borderRadius:10, flex:1, marginLeft:8, borderWidth:1, borderColor:colors.borderAlt },
  button:{ backgroundColor:colors.accent, padding:16, borderRadius:14, alignItems:'center', marginTop:16 },
  secondary:{ backgroundColor:colors.card },
  buttonText:{ color:'#fff', fontWeight:'600', letterSpacing:0.5 },
  modalOverlay:{ flex:1, backgroundColor:'rgba(0,0,0,0.6)', padding:24, justifyContent:'center' },
  modalCard:{ backgroundColor:colors.card, borderRadius:20, padding:20, borderWidth:1, borderColor:colors.borderAlt },
  modalTitle:{ color:colors.textPrimary, fontSize:18, fontWeight:'700', marginBottom:14 },
  modalInput:{ backgroundColor:colors.cardAlt, color:colors.textPrimary, padding:12, borderRadius:12, marginBottom:12, borderWidth:1, borderColor:colors.borderAlt },
  row2:{ flexDirection:'row', columnGap:12 },
  half:{ flex:1 },
  modalActions:{ flexDirection:'row', justifyContent:'flex-end', columnGap:12, marginTop:4 },
  modalBtn:{ paddingHorizontal:18, paddingVertical:12, borderRadius:14, backgroundColor:colors.cardAlt, borderWidth:1, borderColor:colors.borderAlt },
  modalCancel:{},
  modalPrimary:{ backgroundColor:colors.accent, borderColor:colors.accent },
  modalBtnTxt:{ color:colors.textPrimary, fontWeight:'600' },
  modalBtnPrimaryTxt:{ color:'#fff', fontWeight:'700' }
});