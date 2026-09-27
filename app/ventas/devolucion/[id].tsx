import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  TextInput,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { saleRepository } from '../../../repositories/saleRepository';
import { VentaCompleta, DetalleVentaConProducto } from '../../../types/database';
import { Colors, Rounded, Typography, Spacing } from '../../../theme/colors';

const MOTIVOS_PREDEFINIDOS = [
  'Medicamento equivocado',
  'Empaque deteriorado',
  'Cliente desistió',
  'Reacción adversa / Alergia',
  'Error en cobro',
];

export default function RegistrarDevolucionScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [venta, setVenta] = useState<VentaCompleta | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Cantidades seleccionadas para devolver { [producto_id]: number }
  const [selectedQuantities, setSelectedQuantities] = useState<Record<string, number>>({});
  const [motivo, setMotivo] = useState('');

  const fetchSale = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await saleRepository.getSaleById(id);
      setVenta(data);

      // Inicializar cantidades en 0
      if (data && data.detalle_ventas) {
        const initialMap: Record<string, number> = {};
        data.detalle_ventas.forEach((d) => {
          initialMap[d.producto_id] = 0;
        });
        setSelectedQuantities(initialMap);
      }
    } catch (err) {
      console.error('Error fetching sale for devolution:', err);
      Alert.alert('Error', 'No se pudo cargar la información de la venta.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSale();
  }, [fetchSale]);

  // Mapa de cantidades ya devueltas previamente por producto
  const alreadyReturnedMap = useMemo(() => {
    const map: Record<string, number> = {};
    if (!venta || !venta.devoluciones) return map;

    venta.devoluciones.forEach((dev) => {
      dev.detalle_devoluciones?.forEach((dd) => {
        map[dd.producto_id] = (map[dd.producto_id] || 0) + dd.cantidad;
      });
    });

    return map;
  }, [venta]);

  // Cálculo de totales a devolver
  const devolutionSummary = useMemo(() => {
    if (!venta || !venta.detalle_ventas) {
      return { totalRefund: 0, totalItems: 0, itemsToReturn: [] };
    }

    let totalRefund = 0;
    let totalItems = 0;
    const itemsToReturn: { producto_id: string; cantidad: number }[] = [];

    venta.detalle_ventas.forEach((item) => {
      const qty = selectedQuantities[item.producto_id] || 0;
      if (qty > 0) {
        totalItems += qty;
        totalRefund += qty * item.precio_unitario;
        itemsToReturn.push({
          producto_id: item.producto_id,
          cantidad: qty,
        });
      }
    });

    return { totalRefund, totalItems, itemsToReturn };
  }, [venta, selectedQuantities]);

  const handleIncrement = (productoId: string, maxAvailable: number) => {
    setSelectedQuantities((prev) => {
      const current = prev[productoId] || 0;
      if (current < maxAvailable) {
        return { ...prev, [productoId]: current + 1 };
      }
      return prev;
    });
  };

  const handleDecrement = (productoId: string) => {
    setSelectedQuantities((prev) => {
      const current = prev[productoId] || 0;
      if (current > 0) {
        return { ...prev, [productoId]: current - 1 };
      }
      return prev;
    });
  };

  const handleConfirmDevolution = async () => {
    if (!venta) return;

    if (devolutionSummary.itemsToReturn.length === 0) {
      Alert.alert('Selección requerida', 'Por favor indique al menos 1 unidad de producto a devolver.');
      return;
    }

    if (!motivo.trim()) {
      Alert.alert('Motivo requerido', 'Por favor especifique o seleccione el motivo de la devolución.');
      return;
    }

    Alert.alert(
      'Confirmar Devolución',
      `¿Desea registrar la devolución de ${devolutionSummary.totalItems} producto(s) por un total de S/ ${devolutionSummary.totalRefund.toFixed(2)}?\n\nEl stock en almacén será restaurado automáticamente y quedará registrado en el Kardex.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          style: 'destructive',
          onPress: async () => {
            try {
              setProcessing(true);
              const res = await saleRepository.processDevolution({
                venta_id: venta.id,
                items: devolutionSummary.itemsToReturn,
                motivo: motivo.trim(),
              });

              if (res.success) {
                Alert.alert(
                  'Devolución Exitosa',
                  `Código de devolución: ${res.codigo_devolucion}\nTotal reembolsado: S/ ${Number(res.total_devuelto).toFixed(2)}\n\nEl inventario fue actualizado.`,
                  [
                    {
                      text: 'Aceptar',
                      onPress: () => router.replace(`/ventas/${venta.id}` as never),
                    },
                  ]
                );
              }
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : 'Error al procesar devolución';
              Alert.alert('Error', msg);
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Cargando datos para devolución...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!venta) return null;

  const isAnnulled = venta.estado === 'ANULADA';
  const displayNumber = venta.numero_venta || venta.codigo_venta;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.headerIconBtn}
        >
          <Ionicons name="arrow-back" size={20} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Registrar Devolución</Text>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Cabecera de la venta original */}
        <View style={styles.saleHeaderCard}>
          <View style={styles.saleHeaderRow}>
            <View>
              <Text style={styles.saleCode}>{displayNumber}</Text>
              <Text style={styles.saleMeta}>
                Comprobante: {venta.comprobante_tipo || 'BOLETA'} {venta.comprobante_serie}-{venta.comprobante_numero}
              </Text>
            </View>
            <View style={styles.totalBadge}>
              <Text style={styles.totalBadgeLabel}>TOTAL VENTA</Text>
              <Text style={styles.totalBadgeValue}>S/ {Number(venta.total).toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {isAnnulled && (
          <View style={styles.annulledNotice}>
            <Ionicons name="alert-circle" size={18} color={Colors.clinicalAlert} />
            <Text style={styles.annulledText}>
              Esta venta se encuentra ANULADA. No es posible procesar devoluciones sobre operaciones anuladas.
            </Text>
          </View>
        )}

        {/* Sección: Selección de Productos a Devolver */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>SELECCIONAR PRODUCTOS</Text>
          <Text style={styles.sectionSubtitle}>Indique cantidades a retornar</Text>
        </View>

        <View style={styles.itemsCard}>
          {venta.detalle_ventas.map((item: DetalleVentaConProducto, index: number) => {
            const alreadyReturned = alreadyReturnedMap[item.producto_id] || 0;
            const maxReturnable = Math.max(0, item.cantidad - alreadyReturned);
            const selectedQty = selectedQuantities[item.producto_id] || 0;
            const currentStock = item.productos?.stock ?? 0;
            const projectedStock = currentStock + selectedQty;
            const isFullyReturned = maxReturnable === 0;

            return (
              <View
                key={item.id}
                style={[
                  styles.itemRow,
                  index < venta.detalle_ventas.length - 1 && styles.itemRowBorder,
                  isFullyReturned && styles.itemRowDisabled,
                ]}
              >
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.productos?.nombre || 'Producto'}</Text>
                  <Text style={styles.itemMeta}>
                    P. Unit: S/ {Number(item.precio_unitario).toFixed(2)} · Vendido: {item.cantidad} u.
                    {alreadyReturned > 0 ? ` (Devuelto: ${alreadyReturned} u.)` : ''}
                  </Text>

                  {/* Previsualización en tiempo real del stock */}
                  <View style={styles.stockPreviewRow}>
                    <Ionicons name="cube-outline" size={13} color={Colors.textSecondary} />
                    <Text style={styles.stockPreviewText}>
                      Stock almacén: <Text style={styles.stockNum}>{currentStock}</Text>
                      {selectedQty > 0 ? (
                        <>
                          {' → '}
                          <Text style={styles.stockNumProjected}>+{selectedQty} ({projectedStock})</Text>
                        </>
                      ) : null}
                    </Text>
                  </View>
                </View>

                {/* Controles de Cantidad */}
                {isFullyReturned ? (
                  <View style={styles.returnedBadge}>
                    <Text style={styles.returnedBadgeText}>DEVUELTO</Text>
                  </View>
                ) : (
                  <View style={styles.stepperContainer}>
                    <TouchableOpacity
                      onPress={() => handleDecrement(item.producto_id)}
                      disabled={selectedQty === 0 || isAnnulled}
                      style={[
                        styles.stepperBtn,
                        (selectedQty === 0 || isAnnulled) && styles.stepperBtnDisabled,
                      ]}
                    >
                      <Ionicons
                        name="remove"
                        size={16}
                        color={selectedQty === 0 || isAnnulled ? Colors.textMuted : Colors.text}
                      />
                    </TouchableOpacity>

                    <Text style={styles.stepperValue}>{selectedQty}</Text>

                    <TouchableOpacity
                      onPress={() => handleIncrement(item.producto_id, maxReturnable)}
                      disabled={selectedQty >= maxReturnable || isAnnulled}
                      style={[
                        styles.stepperBtn,
                        (selectedQty >= maxReturnable || isAnnulled) && styles.stepperBtnDisabled,
                      ]}
                    >
                      <Ionicons
                        name="add"
                        size={16}
                        color={selectedQty >= maxReturnable || isAnnulled ? Colors.textMuted : Colors.primary}
                      />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Sección: Motivo de Devolución */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>MOTIVO DE LA DEVOLUCIÓN</Text>
        </View>

        <View style={styles.motivoCard}>
          {/* Pastillas de motivos comunes */}
          <View style={styles.motivoPillsRow}>
            {MOTIVOS_PREDEFINIDOS.map((mot) => {
              const isSelected = motivo === mot;
              return (
                <TouchableOpacity
                  key={mot}
                  onPress={() => setMotivo(mot)}
                  style={[styles.motivoPill, isSelected && styles.motivoPillSelected]}
                >
                  <Text
                    style={[
                      styles.motivoPillText,
                      isSelected && styles.motivoPillTextSelected,
                    ]}
                  >
                    {mot}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Campo de texto libre para detalle */}
          <TextInput
            style={styles.motivoInput}
            placeholder="Especifique el motivo de devolución..."
            placeholderTextColor={Colors.textMuted}
            value={motivo}
            onChangeText={setMotivo}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Resumen de Reembolso e Impacto */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>RESUMEN DE REEMBOLSO</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Productos a devolver:</Text>
            <Text style={styles.summaryValue}>{devolutionSummary.totalItems} unidad(es)</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Monto a reintegrar al cliente:</Text>
            <Text style={styles.summaryTotalValue}>
              S/ {devolutionSummary.totalRefund.toFixed(2)}
            </Text>
          </View>

          <View style={styles.auditInfoBox}>
            <Ionicons name="shield-checkmark-outline" size={16} color={Colors.secondary} />
            <Text style={styles.auditInfoText}>
              Se emitirá constancia formal de devolución interna. La venta original conservará su
              registro histórico y se creará el movimiento correspondiente en Kardex.
            </Text>
          </View>
        </View>

        {/* Botón de Confirmación */}
        <TouchableOpacity
          style={[
            styles.confirmBtn,
            (devolutionSummary.totalItems === 0 || isAnnulled || processing) && styles.confirmBtnDisabled,
          ]}
          onPress={handleConfirmDevolution}
          disabled={devolutionSummary.totalItems === 0 || isAnnulled || processing}
          activeOpacity={0.8}
        >
          {processing ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={20} color="#ffffff" style={{ marginRight: 8 }} />
              <Text style={styles.confirmBtnText}>
                Confirmar Devolución (S/ {devolutionSummary.totalRefund.toFixed(2)})
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Botón Cancelar */}
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => router.back()}
          disabled={processing}
        >
          <Text style={styles.cancelBtnText}>Regresar sin cambios</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.canvas,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: Typography.size.sm,
    fontFamily: Typography.family.medium,
    color: Colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  headerIconBtn: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: Typography.size.md,
    fontFamily: Typography.family.semiBold,
    color: Colors.text,
    letterSpacing: -0.2,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl * 2,
  },
  saleHeaderCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Rounded.sm,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  saleHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  saleCode: {
    fontSize: Typography.size.md,
    fontFamily: Typography.family.bold,
    color: Colors.text,
    letterSpacing: -0.3,
  },
  saleMeta: {
    fontSize: Typography.size.xs,
    fontFamily: Typography.family.regular,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  totalBadge: {
    alignItems: 'flex-end',
  },
  totalBadgeLabel: {
    fontSize: Typography.size.xxs,
    fontFamily: Typography.family.bold,
    color: Colors.textSecondary,
    letterSpacing: 0.5,
  },
  totalBadgeValue: {
    ...Typography.tabularPrice,
    fontSize: Typography.size.md,
    fontFamily: Typography.family.bold,
    color: Colors.text,
  },
  annulledNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#fecdd3',
    borderRadius: Rounded.sm,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  annulledText: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: Typography.size.xs,
    fontFamily: Typography.family.medium,
    color: Colors.clinicalAlert,
  },
  sectionHeaderRow: {
    marginBottom: Spacing.xs,
  },
  sectionTitle: {
    fontSize: Typography.size.xs,
    fontFamily: Typography.family.bold,
    color: Colors.textSecondary,
    letterSpacing: 0.8,
  },
  sectionSubtitle: {
    fontSize: Typography.size.xxs,
    fontFamily: Typography.family.regular,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  itemsCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Rounded.sm,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
  },
  itemRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  itemRowDisabled: {
    opacity: 0.5,
    backgroundColor: Colors.surfaceContainerLow,
  },
  itemInfo: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  itemName: {
    fontSize: Typography.size.sm,
    fontFamily: Typography.family.semiBold,
    color: Colors.text,
  },
  itemMeta: {
    fontSize: Typography.size.xs,
    fontFamily: Typography.family.regular,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  stockPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  stockPreviewText: {
    fontSize: Typography.size.xxs,
    fontFamily: Typography.family.regular,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  stockNum: {
    fontFamily: Typography.family.semiBold,
    color: Colors.text,
  },
  stockNumProjected: {
    fontFamily: Typography.family.bold,
    color: Colors.secondary,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Rounded.sm,
  },
  stepperBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperBtnDisabled: {
    opacity: 0.3,
  },
  stepperValue: {
    minWidth: 28,
    textAlign: 'center',
    ...Typography.tabularPrice,
    fontSize: Typography.size.sm,
    fontFamily: Typography.family.bold,
    color: Colors.text,
  },
  returnedBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Rounded.sm,
  },
  returnedBadgeText: {
    fontSize: Typography.size.xxs,
    fontFamily: Typography.family.bold,
    color: Colors.textMuted,
  },
  motivoCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Rounded.sm,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  motivoPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.sm,
  },
  motivoPill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Rounded.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceContainerLow,
    marginRight: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  motivoPillSelected: {
    borderColor: Colors.secondary,
    backgroundColor: Colors.tealWash,
  },
  motivoPillText: {
    fontSize: Typography.size.xs,
    fontFamily: Typography.family.medium,
    color: Colors.textSecondary,
  },
  motivoPillTextSelected: {
    color: Colors.secondary,
    fontFamily: Typography.family.semiBold,
  },
  motivoInput: {
    backgroundColor: Colors.canvas,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Rounded.sm,
    padding: Spacing.sm,
    fontSize: Typography.size.sm,
    fontFamily: Typography.family.regular,
    color: Colors.text,
    minHeight: 70,
  },
  summaryCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Rounded.sm,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  summaryTitle: {
    fontSize: Typography.size.xs,
    fontFamily: Typography.family.bold,
    color: Colors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  summaryLabel: {
    fontSize: Typography.size.sm,
    fontFamily: Typography.family.regular,
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontSize: Typography.size.sm,
    fontFamily: Typography.family.semiBold,
    color: Colors.text,
  },
  summaryTotalValue: {
    ...Typography.tabularPrice,
    fontSize: Typography.size.md,
    fontFamily: Typography.family.bold,
    color: Colors.clinicalAlert,
  },
  auditInfoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.tealWash,
    borderRadius: Rounded.sm,
    padding: Spacing.sm,
    marginTop: Spacing.md,
  },
  auditInfoText: {
    flex: 1,
    marginLeft: Spacing.xs,
    fontSize: Typography.size.xxs,
    fontFamily: Typography.family.regular,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.secondary,
    paddingVertical: Spacing.md,
    borderRadius: Rounded.sm,
    marginBottom: Spacing.sm,
  },
  confirmBtnDisabled: {
    opacity: 0.4,
  },
  confirmBtnText: {
    color: '#ffffff',
    fontSize: Typography.size.sm,
    fontFamily: Typography.family.bold,
    letterSpacing: 0.2,
  },
  cancelBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
  },
  cancelBtnText: {
    color: Colors.textSecondary,
    fontSize: Typography.size.sm,
    fontFamily: Typography.family.medium,
  },
});
