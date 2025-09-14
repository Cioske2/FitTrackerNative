import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, ActivityIndicator } from 'react-native';
import { colors } from '../../theme/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LineChart } from 'react-native-chart-kit';
import { useDiaryStore } from '../../store/diaryStore';


export default function ProgressChartsScreen() {
  const { history7d, loadHistory } = useDiaryStore();
  useEffect(()=>{ loadHistory(7); },[]);
  const labels = history7d.map(h=>h.date.slice(5));
  const data = history7d.map(h=>h.calories || 0);
  const loading = history7d.length === 0;
  const insets = useSafeAreaInsets();
  const width = Dimensions.get('window').width;
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
    <ScrollView style={{flex:1, backgroundColor:colors.background}} contentContainerStyle={{paddingBottom:0}}>
      <View style={wrapStyle}>
        <Text style={styles.title}>Progressi</Text>
        <View style={styles.chartBox}>
          <Text style={styles.chartTitle}>Calorie (7 giorni)</Text>
          {loading ? <ActivityIndicator color={colors.accent} /> : (
            <LineChart
              data={{ labels, datasets:[{ data, color:()=>colors.accent }] }}
              width={width - 32}
              height={220}
              yAxisSuffix=""
              chartConfig={{
                backgroundColor:colors.background,backgroundGradientFrom:colors.background,backgroundGradientTo:colors.background,
                decimalPlaces:0,
                color:(opacity:number)=>`rgba(16,185,129,${opacity})`,labelColor:()=> colors.textMuted, propsForDots:{ r:'4', strokeWidth:'2', stroke:colors.accent }
              }}
              bezier
              style={{ borderRadius:16 }}
            />
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:{ padding:16, backgroundColor:colors.background },
  title:{ color:colors.textPrimary, fontSize:24, fontWeight:'600', marginBottom:16 },
  chartBox:{ marginBottom:24 },
  chartTitle:{ color:colors.textPrimary, marginBottom:8, fontWeight:'600' }
});
