import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const onSubmit = async () => {
    setError('');
    if (!email || !password) {
      setError('Compila tutti i campi');
      return;
    }
    setIsLoggingIn(true);
    try {
      await signIn(email, password);
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message || 'Errore durante il login');
      } else {
        setError('Errore durante il login');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Text style={styles.logo}>nextRep</Text>
      <View style={styles.form}>
        <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#888" autoCapitalize='none' value={email} onChangeText={setEmail} />
        <View style={styles.passwordContainer}>
          <TextInput style={styles.passwordInput} placeholder="Password" placeholderTextColor="#888" secureTextEntry={!showPassword} value={password} onChangeText={setPassword} />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
            <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={22} color="#888" />
          </TouchableOpacity>
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable style={({ pressed }) => [styles.button, pressed && { opacity: 0.85 }]} onPress={onSubmit} disabled={isLoggingIn}>
          <Text style={styles.buttonText}>{isLoggingIn ? 'Caricamento...' : 'Accedi'}</Text>
        </Pressable>
        <Text style={styles.signupText}>Non hai un account? <Text style={styles.link} onPress={() => navigation.navigate('Register')}>Registrati</Text></Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 28, justifyContent: 'center' },
  logo: { fontSize: 34, fontWeight: '700', color: colors.textPrimary, textAlign: 'center', marginBottom: 40, letterSpacing: 0.5 },
  form: { gap: 18 },
  input: { backgroundColor: colors.cardAlt, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 16, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border },
  button: { backgroundColor: colors.accent, paddingVertical: 16, borderRadius: 14, marginTop: 12 },
  buttonText: { textAlign: 'center', color: '#fff', fontWeight: '600', fontSize: 16, letterSpacing: 0.5 },
  signupText: { color: colors.textMuted, marginTop: 28, textAlign: 'center', fontSize: 13 },
  link: { color: colors.accent, fontWeight: '600' },
  error: { color: '#ff4444', fontSize: 13, marginTop: -8 },
  passwordContainer: { position: 'relative' },
  passwordInput: { backgroundColor: colors.cardAlt, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 16, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border, paddingRight: 50 },
  eyeIcon: { position: 'absolute', right: 16, top: 16 }
});
