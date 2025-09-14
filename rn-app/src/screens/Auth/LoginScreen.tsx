import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { colors } from '../../theme/colors';
import { useAuthStore } from '../../store/authStore';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ParamListBase } from '@react-navigation/native';

type Props = { navigation: NativeStackNavigationProp<ParamListBase> };

export default function LoginScreen({ navigation }: Props) {
  const signIn = useAuthStore((s: any) => s.signIn);
  const loading = useAuthStore((s: any) => s.loading);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onSubmit = async () => {
    try {
      await signIn(email, password);
    } catch (e) {
      if (e instanceof Error) {
        console.warn(e.message);
      } else {
        console.warn(String(e));
      }
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
  <Text style={styles.logo}>nextRep</Text>
      <View style={styles.form}>        
        <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#888" autoCapitalize='none' value={email} onChangeText={setEmail} />
        <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#888" secureTextEntry value={password} onChangeText={setPassword} />
        <Pressable style={({pressed}) => [styles.button, pressed && {opacity:0.85}]} onPress={onSubmit} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? '...' : 'Sign In'}</Text>
        </Pressable>
        <Text style={styles.signupText}>Don't have an account? <Text style={styles.link} onPress={() => navigation.navigate('Register')}>Sign Up</Text></Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:{ flex:1, backgroundColor:colors.background, padding:28, justifyContent:'center' },
  logo:{ fontSize:34, fontWeight:'700', color:colors.textPrimary, textAlign:'center', marginBottom:40, letterSpacing:0.5 },
  form:{ gap:18 },
  input:{ backgroundColor:colors.cardAlt, borderRadius:12, paddingHorizontal:18, paddingVertical:16, color:colors.textPrimary, borderWidth:1, borderColor:colors.border },
  button:{ backgroundColor:colors.accent, paddingVertical:16, borderRadius:14, marginTop:12 },
  buttonText:{ textAlign:'center', color:'#fff', fontWeight:'600', fontSize:16, letterSpacing:0.5 },
  signupText:{ color:colors.textMuted, marginTop:28, textAlign:'center', fontSize:13 },
  link:{ color:colors.accent, fontWeight:'600' }
});
