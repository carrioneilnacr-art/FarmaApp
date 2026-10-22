import React, { useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../theme/colors';

type Mode = 'stock' | 'ventas' | 'producto';
const options: { mode: Mode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { mode: 'stock', label: 'Stock bajo', icon: 'alert-circle-outline' },
  { mode: 'ventas', label: 'Ventas de hoy', icon: 'receipt-outline' },
  { mode: 'producto', label: 'Buscar producto', icon: 'search-outline' },
];

export default function AssistantScreen() {
  const { role } = useAuth();
  const [mode, setMode] = useState<Mode>('stock');
  const [term, setTerm] = useState('');
  const [question, setQuestion] = useState('¿Qué debo revisar ahora?');
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const ask = async () => {
    if (busy) return;
    setBusy(true);
    setAnswer('');
    setError('');
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('asistente-operativo', { body: { mode, term, question } });
      if (invokeError || data?.error) throw new Error(data?.error || 'No se pudo conectar con el asistente. Comprueba internet e inténtalo otra vez.');
      setAnswer(data.answer || 'No hay respuesta disponible.');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Error de conexión'); }
    finally { setBusy(false); }
  };
  return <SafeAreaView style={styles.page}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <View style={styles.intro}><Ionicons name="sparkles" size={24} color={Colors.secondary} /><Text style={styles.heading}>Consulta tus operaciones</Text></View>
    <Text style={styles.description}>El asistente usa datos actualizados de FarmaApp. Elige una consulta y escribe qué necesitas saber.</Text>
    <View style={styles.choices}>{options.filter(o => role === 'administrador' || o.mode !== 'ventas').map(o =>
      <TouchableOpacity key={o.mode} onPress={() => { setMode(o.mode); setAnswer(''); }} style={[styles.choice, mode === o.mode && styles.choiceActive]} accessibilityRole="button" accessibilityState={{ selected: mode === o.mode }}>
        <Ionicons name={o.icon} size={18} color={mode === o.mode ? Colors.white : Colors.secondary} /><Text style={[styles.choiceText, mode === o.mode && styles.choiceTextActive]}>{o.label}</Text>
      </TouchableOpacity>)}</View>
    {mode === 'producto' && <><Text style={styles.label}>Producto</Text><TextInput value={term} onChangeText={setTerm} style={styles.input} placeholder="Ej. paracetamol" accessibilityLabel="Nombre del producto" /></>}
    <Text style={styles.label}>Tu pregunta</Text>
    <TextInput value={question} onChangeText={setQuestion} style={[styles.input, styles.question]} multiline maxLength={500} placeholder="Escribe tu consulta" accessibilityLabel="Pregunta para el asistente" />
    <TouchableOpacity style={[styles.submit, busy && styles.disabled]} onPress={ask} disabled={busy} accessibilityRole="button">
      {busy ? <ActivityIndicator color={Colors.white} /> : <><Ionicons name="send-outline" size={17} color={Colors.white} /><Text style={styles.submitText}>Consultar</Text></>}
    </TouchableOpacity>
    {!!error && <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View>}
    {!!answer && <View style={styles.answerBox}><Text style={styles.answerTitle}>Respuesta</Text><Text style={styles.answer}>{answer}</Text></View>}
    <Text style={styles.note}>Uso operativo. No reemplaza la evaluación de un profesional de salud.</Text>
  </ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 18, paddingBottom: 36 },
  intro: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  heading: { fontSize: 22, fontWeight: '800', color: Colors.text },
  description: { marginTop: 9, color: Colors.textSecondary, fontSize: 14, lineHeight: 21 },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 24, marginBottom: 24 },
  choice: { borderWidth: 1, borderColor: Colors.secondary, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 6 },
  choiceActive: { backgroundColor: Colors.secondary },
  choiceText: { color: Colors.secondary, fontWeight: '700', fontSize: 12 },
  choiceTextActive: { color: Colors.white },
  label: { fontSize: 13, fontWeight: '700', color: Colors.text, marginBottom: 7 },
  input: { borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.white, borderRadius: 12, padding: 13, fontSize: 15, color: Colors.text, marginBottom: 18 },
  question: { minHeight: 100, textAlignVertical: 'top' },
  submit: { minHeight: 50, borderRadius: 12, backgroundColor: Colors.primaryDark, flexDirection: 'row', gap: 9, justifyContent: 'center', alignItems: 'center' },
  disabled: { opacity: 0.6 },
  submitText: { color: Colors.white, fontSize: 15, fontWeight: '700' },
  errorBox: { marginTop: 20, backgroundColor: Colors.dangerBg, borderRadius: 12, padding: 14 },
  errorText: { color: Colors.error, lineHeight: 20 },
  answerBox: { marginTop: 20, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.cardBorder, borderRadius: 14, padding: 18 },
  answerTitle: { fontSize: 12, textTransform: 'uppercase', fontWeight: '800', color: Colors.secondary, marginBottom: 8 },
  answer: { fontSize: 15, lineHeight: 23, color: Colors.text },
  note: { fontSize: 12, lineHeight: 18, color: Colors.textMuted, marginTop: 24 },
});
