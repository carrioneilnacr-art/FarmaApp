import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { saleRepository } from '../../repositories/saleRepository';
import { VentaCompleta, ResumenDiario, EstadoVenta } from '../../types/database';
import { SaleCard } from '../../components/SaleCard';
import { DailySummaryCard } from '../../components/DailySummaryCard';
import { Colors, Rounded, Typography, Spacing } from '../../theme/colors';

const STATUS_FILTERS: { id: EstadoVenta | 'TODOS'; label: string }[] = [
  { id: 'TODOS', label: 'Todas' },
  { id: 'EMITIDA', label: 'Emitidas' },
  { id: 'ANULADA', label: 'Anuladas' },
  { id: 'DEVUELTA', label: 'Devueltas' },
];

export default function VentasScreen() {
  const router = useRouter();

  const [sales, setSales] = useState<VentaCompleta[]>([]);
  const [resumen, setResumen] = useState<ResumenDiario | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<EstadoVenta | 'TODOS'>('TODOS');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async (query: string = '', filter: EstadoVenta | 'TODOS' = 'TODOS') => {
    try {
      setLoading(true);
      const [salesData, summaryData] = await Promise.all([
        saleRepository.searchSales(query, filter, 40),
        saleRepository.getDailySummary(),
      ]);
      setSales(salesData);
      setResumen(summaryData);
    } catch (err) {
      console.error('Error loading sales data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData(searchQuery, activeFilter);
    }, 280);
    return () => clearTimeout(timer);
  }, [searchQuery, activeFilter, loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData(searchQuery, activeFilter);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={20} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gestión de Ventas</Text>
        <TouchableOpacity
          onPress={onRefresh}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.refreshButton}
        >
          <Ionicons name="refresh" size={18} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Buscador */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Ionicons name="search" size={16} color={Colors.textMuted} style={styles.searchIcon} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Buscar por # venta, comprobante o cliente..."
            placeholderTextColor={Colors.textMuted}
            style={styles.searchInput}
            autoCapitalize="none"
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
              <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filtros de Estado */}
        <View style={styles.filterRow}>
          {STATUS_FILTERS.map((f) => {
            const isSelected = activeFilter === f.id;
            return (
              <TouchableOpacity
                key={f.id}
                onPress={() => setActiveFilter(f.id)}
                style={[styles.filterChip, isSelected && styles.filterChipActive]}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Lista de Ventas */}
      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Cargando operaciones...</Text>
        </View>
      ) : (
        <FlatList
          data={sales}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <SaleCard
              venta={item}
              onPress={() => router.push(`/ventas/${item.id}` as never)}
            />
          )}
          ListHeaderComponent={
            resumen && activeFilter === 'TODOS' && !searchQuery ? (
              <DailySummaryCard resumen={resumen} />
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={44} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No se encontraron ventas</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery
                  ? `No hay operaciones con el término "${searchQuery}"`
                  : 'Aún no se han registrado ventas con los filtros seleccionados'}
              </Text>
            </View>
          }
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.spaceMd,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
    backgroundColor: Colors.canvas,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    ...Typography.headlineSm,
    color: Colors.text,
  },
  refreshButton: {
    padding: 4,
  },
  searchContainer: {
    paddingHorizontal: Spacing.spaceMd,
    paddingVertical: 10,
    backgroundColor: Colors.canvas,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
    gap: 8,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBackground,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: Rounded.DEFAULT, // 4px
    paddingHorizontal: 10,
    height: 44,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    ...Typography.bodyMd,
    color: Colors.text,
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 2,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 6,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Rounded.DEFAULT,
    backgroundColor: Colors.inputBackground,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    ...Typography.labelSm,
    color: Colors.textSecondary,
    fontSize: 10,
  },
  filterChipTextActive: {
    color: Colors.onPrimary,
  },
  listContent: {
    paddingBottom: 24,
    paddingTop: 6,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...Typography.bodySm,
    color: Colors.textMuted,
    marginTop: 8,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  emptyTitle: {
    ...Typography.headlineSm,
    color: Colors.text,
    marginTop: 12,
  },
  emptySubtitle: {
    ...Typography.bodySm,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
});
