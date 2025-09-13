import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';

export default function Card({ children, style, ...rest }: ViewProps) {
  return <View style={[styles.card, style]} {...rest}>{children}</View>;
}

const styles = StyleSheet.create({
  card:{
    backgroundColor:'#111827',
    borderRadius:16,
    padding:16,
    shadowColor:'#000',
    shadowOpacity:0.3,
    shadowRadius:12,
    shadowOffset:{ width:0, height:6 },
    elevation:6,
    borderWidth:1,
    borderColor:'#1f2937'
  }
});
