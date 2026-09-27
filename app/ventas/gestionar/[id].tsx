import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Modal,
  TextInput,
  Alert,
  Switch,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { saleRepository } from '../../../repositories/saleRepository';
import { VentaCompleta, TipoIncidencia } from '../../../types/database';
import { StatusChip } from '../../../components/StatusChip';
import { Colors, Rounded, Typography, Spacing } from '../../../theme/colors';

export default function GestionarVentaScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [venta, setVenta] = useState<VentaCompleta | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Modal Anulación
  const [annulModalVisible, setAnnulModalVisible] = useState(false);
  const [annulReason, setAnnulReason] = useState('');
  const [revertStock, setRevertStock] = useState(true);

  // Modal Incidencia
  const [incidentModalVisible, setIncidentModalVisible] = useState(false);
  const [incidentType, setIncidentType] = useState<TipoIncidencia>('CORRECCION');
  const [incidentDesc, setIncidentDesc] = useState('');

  const fetchSale = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await saleRepository.getSaleById(id);
      setVenta(data);
    } catch (err) {
      console.error('Error fetching sale for management:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSale();
  }, [fetchSale]);

  const handleConfirmAnnulment = async () => {
    if (!venta) return;
    if (!annulReason.trim()) {
      Alert.alert('Motivo Requerido', 'Por favor especifique el motivo de la anulación.');
      return;
    }

    try {
      setProcessing(true);
      const res = await saleRepository.processAnnulment({
        venta_id: venta.id,
        motivo: annulReason.trim(),
        revertir_stock: revertStock,
      });

      if (res.success) {
        setAnnulModalVisible(false);
        Alert.alert(
          'Venta Anulada',
          'La operación ha sido anulada con éxito. Se mantiene el registro histórico y el inventario fue actualizado.',
          [
            {
              text: 'Aceptar',
              onPress: () => router.replace(`/ventas/${venta.id}` as never),
            },
          ]
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al procesar la anulación';
      Alert.alert('Error', msg);
    } finally {
      setProcessing(false);
    }
  };

  const handleRegisterIncident = async () => {
    if (!venta) return;
    if (!incidentDesc.trim()) {
      Alert.alert('Descripción Requerida', 'Ingrese el detalle de la incidencia.');
      return;
    }

    try {
      setProcessing(true);
      const res = await saleRepository.registerIncident(
        venta.id,
        incidentType,
        incidentDesc.trim()
      );

      if (res.success) {
        setIncidentModalVisible(false);
        setIncidentDesc('');
        Alert.alert('Incidencia Guardada', 'La incidencia fue registrada en el historial de la venta.');
        fetchSale();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al registrar incidencia';
      Alert.alert('Error', msg);
    } finally {
      setProcessing(false);
    }
  };

  const handleCreateLinkedSale = () => {
    if (!venta) return;
    // Redirige al buscador de productos indicando que es una venta relacionada
    Alert.alert(
      'Agregar Producto a Operación',
      `Se iniciará una nueva operación vinculada a la venta ${venta.numero_venta || venta.codigo_venta}. El comprobante original se mantendrá inalterado.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Continuar',
          onPress: () => router.push(`/buscar?origen_id=${venta.id}` as never),
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Cargando opciones de gestión...</Text>
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
        <Text style={styles.headerTitle}>Gestionar Venta</Text>
        <View style={{ width: 20 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Cabecera de la Venta */}
        <View style={styles.saleCard}>
          <View style={styles.saleHeaderRow}>
            <View>
              <Text style={styles.saleNumber}>{displayNumber}</Text>
              <Text style={styles.saleMeta}>
                Total: S/ {Number(venta.total).toFixed(2)} · {venta.metodo_pago}
              </Text>
            </View>
            <StatusChip estado={venta.estado} size="sm" />
          </View>
        </View>

        {/* Advertencia / Regla de Comprobante Emitido */}
        <View style={styles.noticeCard}>
          <View style={styles.noticeHeader}>
            <Ionicons name="information-circle" size={18} color={Colors.secondary} />
            <Text style={styles.noticeTitle}>Comprobante Emitido</Text>
          </View>
          <Text style={styles.noticeBody}>
            Esta venta ya fue emitida ({venta.comprobante_tipo || 'BOLETA'}{' '}
            {venta.comprobante_serie}-{venta.comprobante_numero}).
          </Text>
          <Text style={styles.noticeRule}>
            No es posible modificar o eliminar directamente el comprobante original. Toda corrección
            se gestiona mediante devolución, anulación controlada u operación relacionada sin perder
            la trazabilidad tributaria ni el inventario.
          </Text>
        </View>

        {/* Opciones de Gestión */}
        <Text style={styles.sectionTitle}>OPERACIONES DISPONIBLES</Text>

        {!isAnnulled ? (
          <>
            {/* Opción 1: Devolución de Producto */}
            <TouchableOpacity
              style={styles.optionRow}
              onPress={() => router.push(`/ventas/devolucion/${venta.id}` as never)}
              activeOpacity={0.8}
            >
              <View style={[styles.optionIconBox, { backgroundColor: Colors.tealWash }]}>
                <Ionicons name="return-down-back-outline" size={20} color={Colors.secondary} />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Registrar Devolución</Text>
                <Text style={styles.optionSubtitle}>
                  El cliente retorna uno o más medicamentos. Se repone el stock y se emite constancia de devolución.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </TouchableOpacity>

            {/* Opción 2: Agregar Producto (Operación Vinculada) */}
            <TouchableOpacity
              style={styles.optionRow}
              onPress={handleCreateLinkedSale}
              activeOpacity={0.8}
            >
              <View style={[styles.optionIconBox, { backgroundColor: Colors.surfaceContainerLow }]}>
                <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Agregar Producto (Venta Vinculada)</Text>
                <Text style={styles.optionSubtitle}>
                  El cliente olvidó un medicamento. Se genera una nueva operación vinculada manteniendo la original.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </TouchableOpacity>

            {/* Opción 3: Registrar Incidencia */}
            <TouchableOpacity
              style={styles.optionRow}
              onPress={() => setIncidentModalVisible(true)}
              activeOpacity={0.8}
            >
              <View style={[styles.optionIconBox, { backgroundColor: Colors.inputBackground }]}>
                <Ionicons name="flag-outline" size={20} color={Colors.textSecondary} />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Registrar Incidencia</Text>
                <Text style={styles.optionSubtitle}>
                  Anotar notas operativas, reclamos o correcciones para revisión del dueño.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </TouchableOpacity>

            {/* Opción 4: Anular Operación */}
            <TouchableOpacity
              style={[styles.optionRow, styles.optionRowDanger]}
              onPress={() => setAnnulModalVisible(true)}
              activeOpacity={0.8}
            >
              <View style={[styles.optionIconBox, { backgroundColor: Colors.alertWash }]}>
                <Ionicons name="close-circle-outline" size={20} color={Colors.clinicalAlert} />
              </View>
              <View style={styles.optionContent}>
                <Text style={[styles.optionTitle, { color: Colors.clinicalAlert }]}>
                  Anular Venta Completa
                </Text>
                <Text style={styles.optionSubtitle}>
                  Anulación no destructiva. El registro se conserva en estado ANULADA y el inventario es revertido.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.clinicalAlert} />
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.annulledNoticeCard}>
            <Ionicons name="alert-circle-outline" size={24} color={Colors.clinicalAlert} />
            <Text style={styles.annulledNoticeTitle}>Venta Ya Anulada</Text>
            <Text style={styles.annulledNoticeDesc}>
              Esta operación ya fue dada de baja. Toda la información histórica se conserva con fines
              de trazabilidad e inspección contable.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Modal: Confirmación de Anulación */}
      <Modal visible={annulModalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalAlertHeader}>
              <View style={styles.modalAlertIcon}>
                <Ionicons name="alert" size={22} color={Colors.clinicalAlert} />
              </View>
              <Text style={styles.modalTitle}>¿Deseas gestionar la anulación?</Text>
            </View>

            <Text style={styles.modalSubtitle}>
              La venta <Text style={{ fontWeight: '700' }}>{displayNumber}</Text> no será eliminada
              de la base de datos. Se conservará el historial completo de auditoría.
            </Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>MOTIVO DE LA ANULACIÓN *</Text>
              <TextInput
                value={annulReason}
                onChangeText={setAnnulReason}
                placeholder="Ej. Error en forma de pago, desistimiento del cliente..."
                placeholderTextColor={Colors.textMuted}
                style={styles.textInput}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.switchRow}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={styles.switchLabel}>Revertir stock a inventario</Text>
                <Text style={styles.switchSub}>
                  Devuelve los productos despachados al inventario de la botica
                </Text>
              </View>
              <Switch
                value={revertStock}
                onValueChange={setRevertStock}
                trackColor={{ false: Colors.border, true: Colors.secondary }}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalBtnCancel}
                onPress={() => setAnnulModalVisible(false)}
                disabled={processing}
              >
                <Text style={styles.modalBtnCancelText}>Volver</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalBtnConfirm}
                onPress={handleConfirmAnnulment}
                disabled={processing}
              >
                {processing ? (
                  <ActivityIndicator size="small" color={Colors.onPrimary} />
                ) : (
                  <Text style={styles.modalBtnConfirmText}>Confirmar Anulación</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal: Registrar Incidencia */}
      <Modal visible={incidentModalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Registrar Incidencia</Text>
            <Text style={styles.modalSubtitle}>
              Añade una anotación a la venta {displayNumber} sin alterar su estado.
            </Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>TIPO DE INCIDENCIA</Text>
              <View style={styles.typeSelector}>
                {(['CORRECCION', 'AGREGAR_PRODUCTO', 'OTRO'] as TipoIncidencia[]).map((t) => (
                  <TouchableOpacity
                    key={t}
                    onPress={() => setIncidentType(t)}
                    style={[
                      styles.typeBtn,
                      incidentType === t && styles.typeBtnActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.typeBtnText,
                        incidentType === t && styles.typeBtnTextActive,
                      ]}
                    >
                      {t.replace(/_/g, ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>DETALLE / DESCRIPCIÓN *</Text>
              <TextInput
                value={incidentDesc}
                onChangeText={setIncidentDesc}
                placeholder="Detalle la situación o requerimiento..."
                placeholderTextColor={Colors.textMuted}
                style={styles.textInput}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalBtnCancel}
                onPress={() => setIncidentModalVisible(false)}
                disabled={processing}
              >
                <Text style={styles.modalBtnCancelText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtnConfirm, { backgroundColor: Colors.primary }]}
                onPress={handleRegisterIncident}
                disabled={processing}
              >
                {processing ? (
                  <ActivityIndicator size="small" color={Colors.onPrimary} />
                ) : (
                  <Text style={styles.modalBtnConfirmText}>Guardar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingVertical: 12,
    paddingBottom: 40,
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
  saleCard: {
    backgroundColor: Colors.card,
    borderRadius: Rounded.lg,
    padding: Spacing.spaceMd,
    marginHorizontal: Spacing.spaceMd,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  saleHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  saleNumber: {
    ...Typography.headlineMd,
    color: Colors.text,
  },
  saleMeta: {
    ...Typography.bodySm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  noticeCard: {
    backgroundColor: Colors.tealWash,
    borderRadius: Rounded.lg,
    padding: Spacing.spaceMd,
    marginHorizontal: Spacing.spaceMd,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.secondaryContainer,
  },
  noticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  noticeTitle: {
    ...Typography.labelMd,
    color: Colors.secondary,
    fontWeight: '700',
  },
  noticeBody: {
    ...Typography.bodySm,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: 4,
  },
  noticeRule: {
    ...Typography.bodySm,
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 16,
  },
  sectionTitle: {
    ...Typography.labelSm,
    color: Colors.textMuted,
    marginHorizontal: Spacing.spaceMd,
    marginBottom: 8,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Rounded.lg,
    padding: 14,
    marginHorizontal: Spacing.spaceMd,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    gap: 12,
  },
  optionRowDanger: {
    borderColor: Colors.errorContainer,
  },
  optionIconBox: {
    width: 40,
    height: 40,
    borderRadius: Rounded.DEFAULT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    ...Typography.bodyMd,
    fontWeight: '700',
    color: Colors.text,
  },
  optionSubtitle: {
    ...Typography.bodySm,
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  annulledNoticeCard: {
    backgroundColor: Colors.alertWash,
    padding: 20,
    borderRadius: Rounded.lg,
    marginHorizontal: Spacing.spaceMd,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.errorContainer,
    gap: 6,
  },
  annulledNoticeTitle: {
    ...Typography.headlineSm,
    color: Colors.clinicalAlert,
  },
  annulledNoticeDesc: {
    ...Typography.bodySm,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(11, 28, 48, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.spaceMd,
  },
  modalCard: {
    backgroundColor: Colors.canvas,
    borderRadius: Rounded.lg,
    padding: Spacing.spaceLg,
    width: '100%',
    maxWidth: 420,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  modalAlertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  modalAlertIcon: {
    width: 34,
    height: 34,
    borderRadius: Rounded.DEFAULT,
    backgroundColor: Colors.alertWash,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    ...Typography.headlineSm,
    color: Colors.text,
  },
  modalSubtitle: {
    ...Typography.bodySm,
    color: Colors.textSecondary,
    marginBottom: 14,
    lineHeight: 18,
  },
  fieldGroup: {
    marginBottom: 12,
  },
  fieldLabel: {
    ...Typography.labelSm,
    color: Colors.textMuted,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: Colors.inputBackground,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: Rounded.DEFAULT,
    padding: 10,
    ...Typography.bodyMd,
    color: Colors.text,
    textAlignVertical: 'top',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 16,
  },
  switchLabel: {
    ...Typography.bodyMd,
    fontWeight: '600',
    color: Colors.text,
  },
  switchSub: {
    ...Typography.bodySm,
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  modalBtnCancel: {
    flex: 1,
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: Rounded.DEFAULT,
  },
  modalBtnCancelText: {
    ...Typography.labelMd,
    color: Colors.textSecondary,
  },
  modalBtnConfirm: {
    flex: 1,
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.clinicalAlert,
    borderRadius: Rounded.DEFAULT,
  },
  modalBtnConfirmText: {
    ...Typography.labelMd,
    color: Colors.onPrimary,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 6,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: Rounded.DEFAULT,
    backgroundColor: Colors.inputBackground,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  typeBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  typeBtnText: {
    ...Typography.labelSm,
    color: Colors.textSecondary,
    fontSize: 9,
  },
  typeBtnTextActive: {
    color: Colors.onPrimary,
  },
});
