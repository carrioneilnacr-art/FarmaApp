import React, { useState } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../theme/colors';

export function LoginScreen() {
  const { signIn } = useAuth();
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async () => {
    if (busy) return;
    setBusy(true);
    setError('');
    setError((await signIn(id, password)) || '');
    setBusy(false);
  };
  return <SafeAreaView style={styles.page}>
    <View style={styles.card}>
      <View style={styles.icon}><Ionicons name="medical" size={34} color={Colors.white} /></View>
      <Text style={styles.title}>FarmaApp</Text>
      <Text style={styles.subtitle}>Accede con tu ID de personal</Text>
      <Text style={styles.label}>ID</Text>
      <TextInput value={id} onChangeText={setId} style={styles.input} placeholder="Administrador o Trabajador" autoCapitalize="none" autoCorrect={false} accessibilityLabel="ID de usuario" />
      <Text style={styles.label}>Contraseña</Text>
      <TextInput value={password} onChangeText={setPassword} style={styles.input} placeholder="Tu contraseña" secureTextEntry accessibilityLabel="Contraseña" />
      {!!error && <Text style={styles.error}>{error}</Text>}
      <TouchableOpacity style={styles.button} onPress={submit} disabled={busy} accessibilityRole="button">
        {busy ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.buttonText}>Entrar</Text>}
      </TouchableOpacity>
      <Text style={styles.help}>Necesitas internet para iniciar sesión y consultar datos en tiempo real.</Text>
    </View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: Colors.background, justifyContent: 'center', padding: 24 },
  card: { backgroundColor: Colors.white, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: Colors.cardBorder },
  icon: { width: 56, height: 56, borderRadius: 16, backgroundColor: Colors.primaryDark, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  title: { fontSize: 28, fontWeight: '800', color: Colors.text },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 5, marginBottom: 26 },
  label: { fontSize: 13, fontWeight: '700', color: Colors.text, marginBottom: 7 },
  input: { borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surfaceContainerLow, borderRadius: 12, padding: 14, fontSize: 16, color: Colors.text, marginBottom: 18 },
  error: { color: Colors.error, marginBottom: 14, fontSize: 13 },
  button: { backgroundColor: Colors.primaryDark, minHeight: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: Colors.white, fontSize: 16, fontWeight: '700' },
  help: { fontSize: 12, lineHeight: 18, color: Colors.textMuted, marginTop: 20 },
});
