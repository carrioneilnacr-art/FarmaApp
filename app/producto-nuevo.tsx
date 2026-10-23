import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { productRepository } from '../repositories/productRepository';
import { Categoria } from '../types/database';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../theme/colors';

export default function NewProductScreen() {
  const router = useRouter();
  const { role } = useAuth();
  const [categories, setCategories] = useState<Categoria[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [name, setName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('0');
  const [minimum, setMinimum] = useState('5');
  const [busy, setBusy] = useState(false);

  const loadCategories = async () => {
    try {
      const rows = await productRepository.getCategories();
      setCategories(rows);
      if (!categoryId && rows[0]) setCategoryId(rows[0].id);
    } catch (e) { Alert.alert('Error', e instanceof Error ? e.message : 'No se cargaron las categorías'); }
  };
  useEffect(() => { loadCategories(); }, []);

  if (role !== 'administrador') return <SafeAreaView style={styles.center}><Ionicons name="lock-closed-outline" size={38} color={Colors.error} /><Text style={styles.denied}>Solo el Administrador puede registrar productos.</Text></SafeAreaView>;

  const addCategory = async () => {
    if (!newCategory.trim()) return;
    try {
      setBusy(true);
      const created = await productRepository.createCategory({ nombre: newCategory.trim(), activo: true });
      setCategories(prev => [...prev, created].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')));
      setCategoryId(created.id);
      setNewCategory('');
    } catch (e) { Alert.alert('No se pudo crear', e instanceof Error ? e.message : 'Error'); }
    finally { setBusy(false); }
  };

  const save = async () => {
    const numericPrice = Number(price.replace(',', '.'));
    const numericStock = Number(stock);
    const numericMinimum = Number(minimum);
    if (!categoryId || !name.trim() || !barcode.trim() || !Number.isFinite(numericPrice) || numericPrice <= 0 || !Number.isInteger(numericStock) || numericStock < 0 || !Number.isInteger(numericMinimum) || numericMinimum < 0) {
      Alert.alert('Revisa los datos', 'Completa categoría, nombre, código, precio, stock y stock mínimo con valores válidos.');
      return;
    }
    try {
      setBusy(true);
      await productRepository.createProduct({ categoria_id: categoryId, codigo_barras: barcode.trim(), nombre: name.trim(), descripcion: description.trim() || null, precio: numericPrice, stock: numericStock, stock_minimo: numericMinimum, activo: true });
      Alert.alert('Producto registrado', `${name.trim()} ya está disponible en inventario y búsqueda.`, [{ text: 'Aceptar', onPress: () => router.back() }]);
    } catch (e) { Alert.alert('No se pudo registrar', e instanceof Error ? e.message : 'Error'); }
    finally { setBusy(false); }
  };

  return <SafeAreaView style={styles.page}><KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Nuevo producto</Text><Text style={styles.subtitle}>Completa la ficha que verá el personal al buscar o escanear.</Text>
      <Text style={styles.label}>Categoría *</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>{categories.map(c => <Pressable key={c.id} onPress={() => setCategoryId(c.id)} style={[styles.chip, categoryId === c.id && styles.chipActive]} accessibilityRole="button" accessibilityState={{ selected: categoryId === c.id }}><Text style={[styles.chipText, categoryId === c.id && styles.chipTextActive]}>{c.nombre}</Text></Pressable>)}</ScrollView>
      <View style={styles.newCategory}><TextInput value={newCategory} onChangeText={setNewCategory} placeholder="Nueva categoría" style={[styles.input, { flex: 1, marginBottom: 0 }]} accessibilityLabel="Nombre de nueva categoría" /><Pressable onPress={addCategory} disabled={busy || !newCategory.trim()} style={[styles.smallButton, (!newCategory.trim() || busy) && styles.disabled]} accessibilityRole="button"><Text style={styles.smallButtonText}>Crear</Text></Pressable></View>
      <Text style={styles.label}>Nombre del producto *</Text><TextInput value={name} onChangeText={setName} style={styles.input} placeholder="Ej. Paracetamol 500 mg" />
      <Text style={styles.label}>Código de barras *</Text><TextInput value={barcode} onChangeText={setBarcode} style={styles.input} placeholder="Escanea o escribe el código" autoCapitalize="characters" />
      <Text style={styles.label}>Descripción</Text><TextInput value={description} onChangeText={setDescription} style={[styles.input, styles.multiline]} placeholder="Presentación o detalle" multiline />
      <View style={styles.row}><View style={styles.half}><Text style={styles.label}>Precio S/ *</Text><TextInput value={price} onChangeText={setPrice} style={styles.input} keyboardType="decimal-pad" placeholder="0.00" /></View><View style={styles.half}><Text style={styles.label}>Stock inicial *</Text><TextInput value={stock} onChangeText={setStock} style={styles.input} keyboardType="number-pad" /></View></View>
      <Text style={styles.label}>Stock mínimo *</Text><TextInput value={minimum} onChangeText={setMinimum} style={styles.input} keyboardType="number-pad" />
      <Pressable onPress={save} disabled={busy} style={[styles.primary, busy && styles.disabled]} accessibilityRole="button">{busy ? <ActivityIndicator color={Colors.white} /> : <><Ionicons name="save-outline" size={20} color={Colors.white} /><Text style={styles.primaryText}>Guardar producto</Text></>}</Pressable>
    </ScrollView>
  </KeyboardAvoidingView></SafeAreaView>;
}

const styles = StyleSheet.create({
  page:{flex:1,backgroundColor:Colors.background},content:{padding:16,paddingBottom:40},center:{flex:1,alignItems:'center',justifyContent:'center',padding:24,backgroundColor:Colors.background},denied:{marginTop:12,color:Colors.text,textAlign:'center',fontSize:16,fontWeight:'600'},title:{fontSize:24,fontWeight:'800',color:Colors.text},subtitle:{fontSize:14,lineHeight:20,color:Colors.textSecondary,marginTop:4,marginBottom:22},label:{fontSize:13,fontWeight:'700',color:Colors.text,marginBottom:7},chips:{gap:8,paddingBottom:12},chip:{minHeight:44,justifyContent:'center',paddingHorizontal:14,borderRadius:12,borderWidth:1,borderColor:Colors.border,backgroundColor:Colors.white},chipActive:{backgroundColor:Colors.secondary,borderColor:Colors.secondary},chipText:{fontSize:13,fontWeight:'700',color:Colors.textSecondary},chipTextActive:{color:Colors.white},newCategory:{flexDirection:'row',gap:8,alignItems:'center',marginBottom:20},input:{minHeight:48,borderWidth:1,borderColor:Colors.border,borderRadius:10,backgroundColor:Colors.white,paddingHorizontal:13,fontSize:16,color:Colors.text,marginBottom:17},multiline:{minHeight:80,textAlignVertical:'top',paddingTop:12},smallButton:{minHeight:48,paddingHorizontal:16,alignItems:'center',justifyContent:'center',borderRadius:10,backgroundColor:Colors.secondary},smallButtonText:{color:Colors.white,fontWeight:'700'},row:{flexDirection:'row',gap:10},half:{flex:1},primary:{minHeight:52,borderRadius:12,backgroundColor:Colors.primaryDark,flexDirection:'row',gap:9,alignItems:'center',justifyContent:'center',marginTop:8},primaryText:{color:Colors.white,fontSize:16,fontWeight:'800'},disabled:{opacity:.55}
});
