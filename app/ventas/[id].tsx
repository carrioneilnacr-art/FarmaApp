import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { saleRepository } from '../../repositories/saleRepository';
import { VentaCompleta } from '../../types/database';
import { StatusChip } from '../../components/StatusChip';
import { SaleHistoryTimeline } from '../../components/SaleHistoryTimeline';
import { Colors, Rounded, Typography, Spacing } from '../../theme/colors';

export default function VentaDetalleScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [venta, setVenta] = useState<VentaCompleta | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSale = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await saleRepository.getSaleById(id);
      setVenta(data);
    } catch (err) {
      console.error('Error fetching sale details:', err);
      Alert.alert('Error', 'No se pudo cargar la información de la venta.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSale();
  }, [fetchSale]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Cargando detalle de venta...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!venta) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.clinicalAlert} />
          <Text style={styles.notFoundTitle}>Venta no encontrada</Text>
          <Text style={styles.notFoundSubtitle}>
            No encontramos una venta con el identificador solicitado.
          </Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>Volver a Ventas</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const displayNumber = venta.numero_venta || venta.codigo_venta;
  const isAnnulled = venta.estado === 'ANULADA';
  const canManage = venta.estado === 'EMITIDA' || venta.estado === 'PAGADA' || venta.estado === 'DEVUELTA';
  const total = Number(venta.total);
  const igv = Number((total * 0.18 / 1.18).toFixed(2));
  const subtotal = Number((total - igv).toFixed(2));

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Navigation */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.headerIconBtn}
        >
          <Ionicons name="arrow-back" size={20} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalle de Venta</Text>
        <TouchableOpacity
          onPress={fetchSale}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.headerIconBtn}
        >
          <Ionicons name="refresh" size={18} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Banner de Operación / Comprobante */}
        <View style={[styles.mainCard, isAnnulled && styles.cardAnnulled]}>
          <View style={styles.titleRow}>
            <View>
              <Text style={styles.saleNumber}>{displayNumber}</Text>
              <Text style={styles.saleDateText}>
                {new Date(venta.created_at).toLocaleString('es-PE', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </Text>
            </View>
            <StatusChip estado={venta.estado} size="md" />
          </View>

          {/* Comprobante emitido badge */}
          <View style={styles.receiptBadge}>
            <Ionicons name="receipt-outline" size={14} color={Colors.secondary} />
            <Text style={styles.receiptBadgeText}>
              {venta.comprobante_tipo || 'BOLETA'}{' '}
              {venta.comprobante_serie || 'B001'}-
              {venta.comprobante_numero || '000000'} · Simulación controlada
            </Text>
          </View>

          {/* Información del cliente & pago */}
          <View style={styles.metaGrid}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>MÉTODO DE PAGO</Text>
              <Text style={styles.metaValue}>{venta.metodo_pago}</Text>
            </View>

            {venta.cliente_nombre ? (
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>CLIENTE</Text>
                <Text style={styles.metaValue}>{venta.cliente_nombre}</Text>
              </View>
            ) : null}

            {venta.cliente_documento ? (
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>DOCUMENTO</Text>
                <Text style={styles.metaValue}>{venta.cliente_documento}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Tabla de Productos (Open list separated by 1px hairline) */}
        <View style={styles.itemsCard}>
          <Text style={styles.sectionHeader}>PRODUCTOS DESPACHADOS</Text>

          {venta.detalle_ventas?.map((item, idx) => (
            <View key={item.id || idx} style={styles.itemRow}>
              <View style={styles.itemMainInfo}>
                <Text style={styles.itemName}>
                  {item.productos?.nombre || 'Medicamento'}
                </Text>
                <Text style={styles.itemMeta}>
                  {item.cantidad} uds × S/ {Number(item.precio_unitario).toFixed(2)}
                  {item.productos?.codigo_barras ? ` · ${item.productos.codigo_barras}` : ''}
                </Text>
              </View>
              <Text style={styles.itemSubtotal}>S/ {Number(item.subtotal).toFixed(2)}</Text>
            </View>
          ))}

          {/* Totales */}
          <View style={styles.totalsContainer}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalVal}>S/ {subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>IGV (18% incl.)</Text>
              <Text style={styles.totalVal}>S/ {igv.toFixed(2)}</Text>
            </View>
            <View style={[styles.totalRow, styles.totalRowMain]}>
              <Text style={styles.totalMainLabel}>TOTAL COBRADO</Text>
              <Text
                style={[
                  styles.totalMainVal,
                  isAnnulled && styles.priceAnnulled,
                ]}
              >
                S/ {total.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Sección de Devoluciones (si existen) */}
        {venta.devoluciones && venta.devoluciones.length > 0 && (
          <View style={styles.returnsCard}>
            <Text style={styles.sectionHeaderDev}>DEVOLUCIONES ASOCIADAS</Text>
            {venta.devoluciones.map((dev) => (
              <View key={dev.id} style={styles.devItem}>
                <View style={styles.devHeader}>
                  <Text style={styles.devCode}>{dev.codigo_devolucion}</Text>
                  <Text style={styles.devTotal}>- S/ {Number(dev.total_devuelto).toFixed(2)}</Text>
                </View>
                <Text style={styles.devReason}>Motivo: {dev.motivo}</Text>
                <Text style={styles.devDate}>
                  {new Date(dev.created_at).toLocaleString('es-PE', {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  })}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Sección de Incidencias registradas */}
        {venta.incidencias_ventas && venta.incidencias_ventas.length > 0 && (
          <View style={styles.incidentsCard}>
            <Text style={styles.sectionHeaderInc}>INCIDENCIAS REGISTRADAS</Text>
            {venta.incidencias_ventas.map((inc) => (
              <View key={inc.id} style={styles.incItem}>
                <View style={styles.incBadge}>
                  <Text style={styles.incBadgeText}>{inc.tipo}</Text>
                </View>
                <Text style={styles.incDesc}>{inc.descripcion}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Historial y Auditoría inmutable */}
        <SaleHistoryTimeline historial={venta.historial_ventas || []} />
      </ScrollView>

      {/* Sticky Action Shelf (Fitts' Law Ergonomics) */}
      <View style={styles.actionShelf}>
        {canManage ? (
          <TouchableOpacity
            style={styles.manageButton}
            onPress={() => router.push(`/ventas/gestionar/${venta.id}` as never)}
            activeOpacity={0.85}
          >
            <Ionicons name="options-outline" size={18} color={Colors.onPrimary} />
            <Text style={styles.manageButtonText}>Gestionar Venta</Text>
          </TouchableOpacity>
        ) : isAnnulled ? (
          <View style={styles.annulledNotice}>
            <Ionicons name="close-circle-outline" size={18} color={Colors.clinicalAlert} />
            <Text style={styles.annulledNoticeText}>
              Operación anulada · Conservada para trazabilidad y auditoría
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.back()}
          >
            <Text style={styles.secondaryButtonText}>Volver a Lista</Text>
          </TouchableOpacity>
        )}
      </View>
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
  headerIconBtn: {
    padding: 4,
  },
  headerTitle: {
    ...Typography.headlineSm,
    color: Colors.text,
  },
  scrollContent: {
    paddingVertical: 10,
    paddingBottom: 90,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    ...Typography.bodySm,
    color: Colors.textMuted,
    marginTop: 8,
  },
  notFoundTitle: {
    ...Typography.headlineMd,
    color: Colors.text,
    marginTop: 12,
  },
  notFoundSubtitle: {
    ...Typography.bodySm,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  backBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: Rounded.DEFAULT,
  },
  backBtnText: {
    ...Typography.labelMd,
    color: Colors.onPrimary,
  },
  mainCard: {
    backgroundColor: Colors.card,
    borderRadius: Rounded.lg,
    padding: Spacing.spaceMd,
    marginHorizontal: Spacing.spaceMd,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  cardAnnulled: {
    backgroundColor: Colors.surfaceContainerLow,
    opacity: 0.9,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  saleNumber: {
    ...Typography.headlineMd,
    color: Colors.text,
  },
  saleDateText: {
    ...Typography.bodySm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  receiptBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.tealWash,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Rounded.DEFAULT,
    marginBottom: 12,
  },
  receiptBadgeText: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.secondary,
    fontWeight: '600',
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
  },
  metaItem: {
    minWidth: 110,
  },
  metaLabel: {
    ...Typography.labelSm,
    color: Colors.textMuted,
    fontSize: 9,
  },
  metaValue: {
    ...Typography.bodySm,
    color: Colors.text,
    fontWeight: '600',
    marginTop: 1,
  },
  itemsCard: {
    backgroundColor: Colors.card,
    borderRadius: Rounded.lg,
    padding: Spacing.spaceMd,
    marginHorizontal: Spacing.spaceMd,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  sectionHeader: {
    ...Typography.labelSm,
    color: Colors.textMuted,
    marginBottom: 10,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.inputBackground,
  },
  itemMainInfo: {
    flex: 1,
    marginRight: 10,
  },
  itemName: {
    ...Typography.bodyMd,
    fontWeight: '600',
    color: Colors.text,
  },
  itemMeta: {
    ...Typography.bodySm,
    color: Colors.textMuted,
    marginTop: 2,
    fontSize: 12,
  },
  itemSubtotal: {
    ...Typography.tabularPrice,
    fontSize: 15,
    color: Colors.text,
  },
  totalsContainer: {
    paddingTop: 12,
    gap: 4,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalRowMain: {
    paddingTop: 8,
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
  },
  totalLabel: {
    ...Typography.bodySm,
    color: Colors.textSecondary,
  },
  totalVal: {
    ...Typography.tabularPrice,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  totalMainLabel: {
    ...Typography.headlineSm,
    color: Colors.text,
  },
  totalMainVal: {
    ...Typography.tabularPrice,
    fontSize: 22,
    color: Colors.text,
  },
  priceAnnulled: {
    textDecorationLine: 'line-through',
    color: Colors.textMuted,
  },
  returnsCard: {
    backgroundColor: Colors.card,
    borderRadius: Rounded.lg,
    padding: Spacing.spaceMd,
    marginHorizontal: Spacing.spaceMd,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.secondaryContainer,
  },
  sectionHeaderDev: {
    ...Typography.labelSm,
    color: Colors.secondary,
    marginBottom: 8,
  },
  devItem: {
    backgroundColor: Colors.tealWash,
    padding: 10,
    borderRadius: Rounded.DEFAULT,
    marginBottom: 6,
  },
  devHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  devCode: {
    ...Typography.labelMd,
    color: Colors.secondary,
  },
  devTotal: {
    ...Typography.tabularPrice,
    fontSize: 14,
    color: Colors.secondary,
  },
  devReason: {
    ...Typography.bodySm,
    color: Colors.textSecondary,
    marginTop: 3,
    fontSize: 12,
  },
  devDate: {
    ...Typography.bodySm,
    color: Colors.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  incidentsCard: {
    backgroundColor: Colors.card,
    borderRadius: Rounded.lg,
    padding: Spacing.spaceMd,
    marginHorizontal: Spacing.spaceMd,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  sectionHeaderInc: {
    ...Typography.labelSm,
    color: Colors.textMuted,
    marginBottom: 8,
  },
  incItem: {
    backgroundColor: Colors.inputBackground,
    padding: 8,
    borderRadius: Rounded.DEFAULT,
    marginBottom: 6,
  },
  incBadge: {
    backgroundColor: Colors.surfaceContainer,
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Rounded.DEFAULT,
    marginBottom: 3,
  },
  incBadgeText: {
    ...Typography.labelSm,
    fontSize: 9,
    color: Colors.text,
  },
  incDesc: {
    ...Typography.bodySm,
    color: Colors.textSecondary,
    fontSize: 12,
  },
  actionShelf: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.canvas,
    paddingHorizontal: Spacing.spaceMd,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    height: 52,
    borderRadius: Rounded.DEFAULT,
    gap: 8,
  },
  manageButtonText: {
    ...Typography.labelLg,
    color: Colors.onPrimary,
  },
  secondaryButton: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: Rounded.DEFAULT,
  },
  secondaryButtonText: {
    ...Typography.labelMd,
    color: Colors.textSecondary,
  },
  annulledNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  annulledNoticeText: {
    ...Typography.bodySm,
    color: Colors.clinicalAlert,
    fontSize: 12,
    fontWeight: '600',
  },
});
