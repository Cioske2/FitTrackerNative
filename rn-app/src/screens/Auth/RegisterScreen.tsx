import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { useAuthStore } from '../../store/authStore';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ParamListBase } from '@react-navigation/native';

type Props = { navigation: NativeStackNavigationProp<ParamListBase> };

export default function RegisterScreen({ navigation }: Props) {
  const signUp = useAuthStore((s: any) => s.signUp);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const onSubmit = async () => {
    setError('');
    setSuccess(false);

    if (!email || !password || !confirmPassword) {
      setError('Compila tutti i campi');
      return;
    }

    if (password !== confirmPassword) {
      setError('Le password non coincidono');
      return;
    }

    if (password.length < 6) {
      setError('La password deve essere di almeno 6 caratteri');
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password);
      setSuccess(true);
      setTimeout(() => {
        navigation.goBack();
      }, 2000);
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message || 'Errore durante la registrazione');
      } else {
        setError('Errore durante la registrazione');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Text style={styles.logo}>Crea account</Text>
      <View style={styles.form}>
        <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#888" autoCapitalize='none' keyboardType="email-address" value={email} onChangeText={setEmail} />
        <View style={styles.passwordContainer}>
          <TextInput style={styles.passwordInput} placeholder="Password" placeholderTextColor="#888" secureTextEntry={!showPassword} value={password} onChangeText={setPassword} />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
            <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={22} color="#888" />
          </TouchableOpacity>
        </View>
        <View style={styles.passwordContainer}>
          <TextInput style={styles.passwordInput} placeholder="Conferma Password" placeholderTextColor="#888" secureTextEntry={!showConfirmPassword} value={confirmPassword} onChangeText={setConfirmPassword} />
          <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
            <Ionicons name={showConfirmPassword ? 'eye-off' : 'eye'} size={22} color="#888" />
          </TouchableOpacity>
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {success ? <Text style={styles.success}>Registrazione completata! Controlla la tua email per confermare.</Text> : null}
        <Pressable style={({ pressed }) => [styles.button, pressed && { opacity: 0.8 }]} onPress={onSubmit} disabled={loading || success}>
          <Text style={styles.buttonText}>{loading ? 'Caricamento...' : success ? 'Completato!' : 'Registrati'}</Text>
        </Pressable>
        <Text style={styles.loginText}>Hai già un account? <Text style={styles.link} onPress={() => navigation.goBack()}>Accedi</Text></Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 28, justifyContent: 'center' },
  logo: { fontSize: 30, fontWeight: '700', color: colors.textPrimary, textAlign: 'center', marginBottom: 36, letterSpacing: 0.5 },
  form: { gap: 18 },
  input: { backgroundColor: colors.cardAlt, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 16, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border },
  button: { backgroundColor: colors.accent, paddingVertical: 16, borderRadius: 14, marginTop: 12 },
  buttonText: { textAlign: 'center', color: '#fff', fontWeight: '600', fontSize: 16, letterSpacing: 0.5 },
  error: { color: '#ff4444', fontSize: 13, marginTop: -8 },
  success: { color: colors.accent, fontSize: 13, marginTop: -8, textAlign: 'center' },
  loginText: { color: colors.textMuted, marginTop: 28, textAlign: 'center', fontSize: 13 },
  link: { color: colors.accent, fontWeight: '600' },
  passwordContainer: { position: 'relative' },
  passwordInput: { backgroundColor: colors.cardAlt, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 16, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border, paddingRight: 50 },
  eyeIcon: { position: 'absolute', right: 16, top: 16 }
});
