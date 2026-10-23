import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { productRepository } from '../../../repositories/productRepository';
import { saleRepository } from '../../../repositories/saleRepository';
import { Categoria, ProductoConCategoria, VentaCompleta } from '../../../types/database';
import { Colors } from '../../../theme/colors';

export default function EditSaleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [sale, setSale] = useState<VentaCompleta | null>(null);
  const [products, setProducts] = useState<ProductoConCategoria[]>([]);
  const [categories, setCategories] = useState<Categoria[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [original, setOriginal] = useState<Record<string, number>>({});
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('TODOS');
  const [reason, setReason] = useState('Corrección solicitada por el cliente');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const [currentSale, catalog, cats] = await Promise.all([saleRepository.getSaleById(id), productRepository.getAllProducts(300), productRepository.getCategories()]);
      if (!currentSale) throw new Error('Venta no encontrada');
      const initial = Object.fromEntries(currentSale.detalle_ventas.map(d => [d.producto_id, d.cantidad]));
      const soldProducts = currentSale.detalle_ventas.map(d => d.productos).filter(Boolean) as ProductoConCategoria[];
      const merged = [...catalog];
      soldProducts.forEach(p => { if (!merged.some(row => row.id === p.id)) merged.push(p); });
      setSale(currentSale); setProducts(merged); setCategories(cats); setQuantities(initial); setOriginal(initial);
    } catch (e) { Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo cargar la boleta', [{ text:'Volver', onPress:()=>router.back() }]); }
    finally { setLoading(false); }
  }, [id]);
  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => products.filter(p => {
    const text = query.trim().toLowerCase();
    return (!text || p.nombre.toLowerCase().includes(text) || p.codigo_barras.toLowerCase().includes(text)) && (category === 'TODOS' || p.categoria_id === category);
  }), [products, query, category]);
  const selected = products.filter(p => (quantities[p.id] || 0) > 0);
  const total = selected.reduce((sum, p) => sum + (quantities[p.id] || 0) * Number(sale?.detalle_ventas.find(d => d.producto_id === p.id)?.precio_unitario || p.precio), 0);
  const change = (p: ProductoConCategoria, delta: number) => {
    const current = quantities[p.id] || 0;
    const max = (original[p.id] || 0) + p.stock;
    const next = Math.max(0, current + delta);
    if (next > max) return Alert.alert('Stock insuficiente', `Puedes dejar como máximo ${max} unidades en esta boleta.`);
    setQuantities(prev => ({ ...prev, [p.id]: next }));
  };
  const save = async () => {
    const items = Object.entries(quantities).filter(([,qty]) => qty > 0).map(([producto_id,cantidad]) => ({ producto_id, cantidad }));
    if (!items.length) return Alert.alert('Boleta vacía', 'Para cancelar toda la compra usa “Anular venta” en la pantalla anterior.');
    try {
      setSaving(true);
      const result = await saleRepository.correctSale(id!, items, reason);
      Alert.alert('Misma boleta actualizada', `${result.numero_venta || result.codigo_venta}\nNuevo total: S/ ${Number(result.total).toFixed(2)}\nSe conservaron el ID, número y datos del cliente.`, [{ text:'Ver boleta', onPress:()=>router.replace(`/ventas/${id}` as never) }]);
    } catch (e) { Alert.alert('No se pudo corregir', e instanceof Error ? e.message : 'Error'); }
    finally { setSaving(false); }
  };
  if (loading) return <SafeAreaView style={styles.center}><ActivityIndicator color={Colors.secondary} /><Text style={styles.muted}>Cargando la misma boleta…</Text></SafeAreaView>;
  if (!sale) return null;

  return <SafeAreaView style={styles.page}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <View style={styles.receipt}><Text style={styles.receiptNumber}>{sale.numero_venta || sale.codigo_venta}</Text><Text style={styles.muted}>{sale.comprobante_serie}-{sale.comprobante_numero} · mismo ID</Text>{(sale.cliente_nombre || sale.cliente_documento) && <Text style={styles.customer}>Cliente: {sale.cliente_nombre || 'Sin nombre'}{sale.cliente_documento ? ` · ${sale.cliente_documento}` : ''}</Text>}</View>
    <Text style={styles.section}>PRODUCTOS DE LA BOLETA</Text>{selected.map(p => <View key={p.id} style={styles.item}><View style={{flex:1}}><Text style={styles.name}>{p.nombre}</Text><Text style={styles.muted}>S/ {Number(sale.detalle_ventas.find(d => d.producto_id === p.id)?.precio_unitario || p.precio).toFixed(2)} c/u</Text></View><Pressable onPress={()=>change(p,-1)} style={styles.qtyButton} accessibilityLabel={`Quitar ${p.nombre}`}><Ionicons name="remove" size={20} color={Colors.text} /></Pressable><Text style={styles.qty}>{quantities[p.id]}</Text><Pressable onPress={()=>change(p,1)} style={styles.qtyButton} accessibilityLabel={`Agregar ${p.nombre}`}><Ionicons name="add" size={20} color={Colors.text} /></Pressable></View>)}
    <Text style={styles.section}>AGREGAR OTRO PRODUCTO</Text><TextInput value={query} onChangeText={setQuery} style={styles.search} placeholder="Buscar nombre o código" />
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}><Pressable onPress={()=>setCategory('TODOS')} style={[styles.chip,category==='TODOS'&&styles.chipActive]}><Text style={[styles.chipText,category==='TODOS'&&styles.chipTextActive]}>Todos</Text></Pressable>{categories.map(c=><Pressable key={c.id} onPress={()=>setCategory(c.id)} style={[styles.chip,category===c.id&&styles.chipActive]}><Text style={[styles.chipText,category===c.id&&styles.chipTextActive]}>{c.nombre}</Text></Pressable>)}</ScrollView>
    {filtered.map(p => <Pressable key={p.id} onPress={()=>change(p,1)} style={styles.catalogItem} accessibilityRole="button"><View style={{flex:1}}><Text style={styles.name}>{p.nombre}</Text><Text style={styles.muted}>{p.categorias?.nombre || 'Sin categoría'} · Stock {p.stock}</Text></View><Ionicons name="add-circle" size={26} color={Colors.secondary} /></Pressable>)}
    <Text style={styles.label}>Motivo de la corrección</Text><TextInput value={reason} onChangeText={setReason} style={styles.search} maxLength={180} />
    <View style={styles.total}><Text style={styles.totalLabel}>Nuevo total</Text><Text style={styles.totalValue}>S/ {total.toFixed(2)}</Text></View>
    <Pressable onPress={save} disabled={saving} style={[styles.primary,saving&&{opacity:.55}]}>{saving?<ActivityIndicator color={Colors.white}/>:<Text style={styles.primaryText}>Actualizar esta misma boleta</Text>}</Pressable>
    <Text style={styles.audit}>El número, ID, cliente y comprobante se conservan. Los cambios de stock y el antes/después quedan registrados.</Text>
  </ScrollView></SafeAreaView>;
}

const styles=StyleSheet.create({page:{flex:1,backgroundColor:Colors.background},center:{flex:1,alignItems:'center',justifyContent:'center',gap:10,backgroundColor:Colors.background},content:{padding:16,paddingBottom:42},receipt:{backgroundColor:Colors.primaryDark,borderRadius:14,padding:16,marginBottom:18},receiptNumber:{color:Colors.white,fontSize:20,fontWeight:'800'},customer:{color:Colors.primaryLight,fontSize:13,marginTop:8},muted:{color:Colors.textSecondary,fontSize:12,marginTop:3},section:{fontSize:11,fontWeight:'800',color:Colors.textMuted,letterSpacing:.6,marginVertical:10},item:{minHeight:64,flexDirection:'row',alignItems:'center',gap:8,backgroundColor:Colors.white,borderWidth:1,borderColor:Colors.cardBorder,borderRadius:10,padding:10,marginBottom:8},name:{fontSize:14,fontWeight:'700',color:Colors.text},qtyButton:{width:44,height:44,borderRadius:10,borderWidth:1,borderColor:Colors.border,alignItems:'center',justifyContent:'center'},qty:{width:24,textAlign:'center',fontSize:16,fontWeight:'800',color:Colors.text},search:{minHeight:48,borderWidth:1,borderColor:Colors.border,borderRadius:10,backgroundColor:Colors.white,paddingHorizontal:13,fontSize:15,color:Colors.text,marginBottom:10},chips:{gap:8,paddingBottom:12},chip:{minHeight:44,justifyContent:'center',paddingHorizontal:13,borderWidth:1,borderColor:Colors.border,borderRadius:10,backgroundColor:Colors.white},chipActive:{backgroundColor:Colors.secondary,borderColor:Colors.secondary},chipText:{fontSize:12,fontWeight:'700',color:Colors.textSecondary},chipTextActive:{color:Colors.white},catalogItem:{minHeight:58,flexDirection:'row',alignItems:'center',backgroundColor:Colors.white,borderBottomWidth:1,borderColor:Colors.cardBorder,paddingHorizontal:12},label:{fontSize:13,fontWeight:'700',color:Colors.text,marginTop:18,marginBottom:7},total:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginVertical:16},totalLabel:{fontSize:15,fontWeight:'700',color:Colors.text},totalValue:{fontSize:24,fontWeight:'800',color:Colors.primaryDark},primary:{minHeight:52,alignItems:'center',justifyContent:'center',borderRadius:12,backgroundColor:Colors.primaryDark},primaryText:{color:Colors.white,fontSize:15,fontWeight:'800'},audit:{fontSize:12,lineHeight:18,textAlign:'center',color:Colors.textMuted,marginTop:14}});
