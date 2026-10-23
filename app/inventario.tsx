import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { inventoryRepository, InventorySnapshot, RecentStockMovement } from '../repositories/inventoryRepository';
import { ProductoConCategoria } from '../types/database';
import { estimateCoverageDays, getStockStatus } from '../utils/inventory';
import { Colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';

type Filter = 'TODOS' | 'ALERTAS';

export default function InventoryScreen() {
  const router = useRouter();
  const { role } = useAuth();
  const [snapshot, setSnapshot] = useState<InventorySnapshot | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('TODOS');
  const [selected, setSelected] = useState<string | null>(null);
  const [movements, setMovements] = useState<RecentStockMovement[]>([]);
  const [loadingMovements, setLoadingMovements] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setError('');
      setSnapshot(await inventoryRepository.getSnapshot());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo cargar el inventario.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const refresh = () => {
    setRefreshing(true);
    load();
  };

  const toggleDetail = async (product: ProductoConCategoria) => {
    if (selected === product.id) {
      setSelected(null);
      return;
    }
    setSelected(product.id);
    setMovements([]);
    setDetailError('');
    setLoadingMovements(true);
    try {
      setMovements(await inventoryRepository.getRecentMovements(product.id));
    } catch {
      setDetailError('No se pudo consultar el historial de movimientos.');
    } finally {
      setLoadingMovements(false);
    }
  };

  const products = useMemo(() => {
    const cleanQuery = query.trim().toLocaleLowerCase();
    return (snapshot?.products || []).filter(product => {
      const matchesQuery = !cleanQuery ||
        product.nombre.toLocaleLowerCase().includes(cleanQuery) ||
        product.codigo_barras.toLocaleLowerCase().includes(cleanQuery);
      return matchesQuery && (filter === 'TODOS' || getStockStatus(product.stock, product.stock_minimo) !== 'DISPONIBLE');
    });
  }, [snapshot, query, filter]);

  const alerts = snapshot?.products.filter(product => getStockStatus(product.stock, product.stock_minimo) !== 'DISPONIBLE').length || 0;

  const renderProduct = ({ item }: { item: ProductoConCategoria }) => {
    const status = getStockStatus(item.stock, item.stock_minimo);
    const coverage = snapshot?.salesHistoryAvailable
      ? estimateCoverageDays(item.stock, snapshot.soldLast30Days[item.id] || 0)
      : null;
    const expanded = selected === item.id;
    return (
      <View style={styles.card}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${item.nombre}, ${item.stock} unidades, ${status === 'DISPONIBLE' ? 'disponible' : status === 'AGOTADO' ? 'agotado' : 'requiere reposición'}`}
          accessibilityState={{ expanded }}
          android_ripple={{ color: Colors.surfaceContainer }}
          onPress={() => toggleDetail(item)}
          style={styles.cardButton}
        >
          <View style={styles.cardMain}>
            <Text style={styles.productName}>{item.nombre}</Text>
            <Text style={styles.productCode}>{item.codigo_barras}</Text>
            <Text style={styles.meta}>Mínimo {item.stock_minimo} · {coverage === null ? 'Cobertura sin datos' : `Cobertura aprox. ${coverage} días`}</Text>
          </View>
          <View style={styles.cardSide}>
            <Text style={[styles.stock, status !== 'DISPONIBLE' && styles.stockAlert]}>{item.stock}</Text>
            <Text style={styles.units}>unidades</Text>
            <Text style={[styles.status, status !== 'DISPONIBLE' && styles.statusAlert]}>
              {status === 'AGOTADO' ? 'Agotado' : status === 'REPOSICION' ? 'Reponer' : 'Disponible'}
            </Text>
          </View>
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.textSecondary} />
        </Pressable>
        {expanded && (
          <View style={styles.detail}>
            <Text style={styles.detailTitle}>Últimos movimientos</Text>
            {loadingMovements ? <ActivityIndicator color={Colors.secondary} /> : detailError ? <Text style={styles.error}>{detailError}</Text> :
              movements.length === 0 ? <Text style={styles.meta}>Sin movimientos registrados.</Text> :
                movements.map(movement => (
                  <View key={movement.id} style={styles.movement}>
                    <Text style={styles.movementType}>{movement.tipo} · {movement.cantidad} uds</Text>
                    <Text style={styles.meta}>{movement.stock_anterior} → {movement.stock_nuevo} · {new Date(movement.created_at).toLocaleDateString('es-PE')}</Text>
                    {!!movement.motivo && <Text style={styles.meta}>{movement.motivo}</Text>}
                  </View>
                ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={products}
        keyExtractor={item => item.id}
        renderItem={renderProduct}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} colors={[Colors.secondary]} />}
        ListHeaderComponent={<>
          <Text style={styles.title}>Inventario</Text>
          <Text style={styles.subtitle}>Existencias y movimientos registrados en Supabase</Text>
          <View style={styles.summary}>
            <View><Text style={styles.summaryValue}>{snapshot?.products.length || 0}</Text><Text style={styles.meta}>Productos</Text></View>
            <View><Text style={[styles.summaryValue, styles.stockAlert]}>{alerts}</Text><Text style={styles.meta}>Alertas de stock</Text></View>
          </View>
          {role === 'administrador' && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Registrar un producto nuevo"
              onPress={() => router.push('/producto-nuevo')}
              style={styles.addProductButton}
            >
              <Ionicons name="add-circle-outline" size={20} color={Colors.white} />
              <Text style={styles.addProductText}>Registrar producto</Text>
            </Pressable>
          )}
          <TextInput
            accessibilityLabel="Buscar producto en inventario"
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar producto o código"
            placeholderTextColor={Colors.textMuted}
            style={styles.search}
          />
          <View style={styles.filters}>
            {(['TODOS', 'ALERTAS'] as const).map(value => (
              <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: filter === value }}
                onPress={() => setFilter(value)} style={[styles.filter, filter === value && styles.filterActive]}>
                <Text style={[styles.filterText, filter === value && styles.filterTextActive]}>{value === 'TODOS' ? 'Todos' : `Alertas (${alerts})`}</Text>
              </Pressable>
            ))}
          </View>
          {!!error && <Text style={styles.error}>{error}</Text>}
          {loading && <ActivityIndicator color={Colors.secondary} style={styles.loading} />}
        </>}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>{error ? 'Desliza hacia abajo para reintentar.' : 'No hay productos para este filtro.'}</Text> : null}
        ListFooterComponent={<Text style={styles.footer}>La cobertura usa salidas por venta de los últimos 30 días. Es una estimación; los lotes y vencimientos aún no están registrados.</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  list: { padding: 16, paddingBottom: 40 },
  title: { color: Colors.text, fontSize: 26, fontWeight: '700' },
  subtitle: { color: Colors.textSecondary, fontSize: 14, marginTop: 4, marginBottom: 16 },
  summary: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: Colors.white, borderColor: Colors.cardBorder, borderWidth: 1, borderRadius: 8, padding: 16, marginBottom: 16 },
  summaryValue: { fontSize: 24, fontWeight: '700', color: Colors.text },
  addProductButton: { minHeight: 48, marginBottom: 16, borderRadius: 8, backgroundColor: Colors.primaryDark, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 16 },
  addProductText: { color: Colors.white, fontSize: 15, fontWeight: '700' },
  stockAlert: { color: Colors.error },
  search: { minHeight: 48, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, backgroundColor: Colors.white, paddingHorizontal: 14, fontSize: 16, color: Colors.text },
  filters: { flexDirection: 'row', gap: 8, marginVertical: 16 },
  filter: { minHeight: 48, justifyContent: 'center', borderWidth: 1, borderColor: Colors.border, borderRadius: 8, paddingHorizontal: 16, backgroundColor: Colors.white },
  filterActive: { borderColor: Colors.secondary, backgroundColor: Colors.tealWash },
  filterText: { color: Colors.textSecondary, fontSize: 14, fontWeight: '600' },
  filterTextActive: { color: Colors.secondary },
  card: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.cardBorder, borderRadius: 8, marginBottom: 10, overflow: 'hidden' },
  cardButton: { minHeight: 96, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardMain: { flex: 1 },
  productName: { color: Colors.text, fontSize: 16, fontWeight: '700' },
  productCode: { color: Colors.textSecondary, fontSize: 12, marginTop: 3 },
  meta: { color: Colors.textSecondary, fontSize: 12, marginTop: 4 },
  cardSide: { alignItems: 'flex-end', minWidth: 75 },
  stock: { color: Colors.text, fontSize: 22, fontWeight: '700' },
  units: { color: Colors.textSecondary, fontSize: 11 },
  status: { color: Colors.secondary, fontSize: 11, fontWeight: '700', marginTop: 3 },
  statusAlert: { color: Colors.error },
  detail: { borderTopWidth: 1, borderColor: Colors.cardBorder, padding: 14 },
  detailTitle: { color: Colors.text, fontSize: 14, fontWeight: '700', marginBottom: 8 },
  movement: { borderTopWidth: 1, borderColor: Colors.cardBorder, paddingVertical: 8 },
  movementType: { color: Colors.text, fontSize: 13, fontWeight: '600' },
  error: { color: Colors.error, fontSize: 13, marginBottom: 10 },
  empty: { color: Colors.textSecondary, fontSize: 14, textAlign: 'center', marginTop: 24 },
  loading: { marginVertical: 24 },
  footer: { color: Colors.textSecondary, fontSize: 12, lineHeight: 18, marginTop: 14 },
});
