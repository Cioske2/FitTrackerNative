import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ParamListBase } from '@react-navigation/native';

type Props = { navigation: NativeStackNavigationProp<ParamListBase> };

export default function RegisterScreen({ navigation }: Props) {
  const signUp = useAuthStore((s: any) => s.signUp);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onSubmit = async () => {
    try {
      await signUp(email, password);
      navigation.goBack();
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
      <Text style={styles.logo}>Crea account</Text>
      <View style={styles.form}>        
        <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#888" autoCapitalize='none' value={email} onChangeText={setEmail} />
        <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#888" secureTextEntry value={password} onChangeText={setPassword} />
        <Pressable style={({pressed}) => [styles.button, pressed && {opacity:0.8}]} onPress={onSubmit}>
          <Text style={styles.buttonText}>Register</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:{ flex:1, backgroundColor:'#000', padding:24, justifyContent:'center' },
  logo:{ fontSize:32, fontWeight:'700', color:'#fff', textAlign:'center', marginBottom:32 },
  form:{ gap:16 },
  input:{ backgroundColor:'#1f1f1f', borderRadius:8, paddingHorizontal:16, paddingVertical:14, color:'#fff' },
  button:{ backgroundColor:'#10b981', paddingVertical:16, borderRadius:10, marginTop:8 },
  buttonText:{ textAlign:'center', color:'#000', fontWeight:'600', fontSize:16 }
});
