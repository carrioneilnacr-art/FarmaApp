import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../context/CartContext';
import { CartItem } from '../components/CartItem';
import { PrimaryButton } from '../components/PrimaryButton';
import { MetodoPago, RegistrarVentaResponse } from '../types/database';
import { Colors } from '../theme/colors';

const METODOS_PAGO: { id: MetodoPago; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'EFECTIVO', label: 'Efectivo', icon: 'cash-outline' },
  { id: 'YAPE', label: 'Yape', icon: 'phone-portrait-outline' },
  { id: 'PLIN', label: 'Plin', icon: 'phone-portrait-outline' },
  { id: 'TARJETA', label: 'Tarjeta', icon: 'card-outline' },
  { id: 'TRANSFERENCIA', label: 'Transfer.', icon: 'business-outline' },
];

export default function VentaScreen() {
  const router = useRouter();
  const { items, totalAmount, totalItems, clearCart, processSale, isProcessing } = useCart();

  // Estados del formulario de venta
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('EFECTIVO');
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteDocumento, setClienteDocumento] = useState('');

  // Estado del resultado de venta
  const [saleResult, setSaleResult] = useState<RegistrarVentaResponse | null>(null);
  const [successModalVisible, setSuccessModalVisible] = useState(false);

  const handleConfirmSale = async () => {
    if (items.length === 0) {
      Alert.alert('Carrito Vacío', 'Agregue productos antes de confirmar la venta.');
      return;
    }

    try {
      const response = await processSale({
        clienteNombre,
        clienteDocumento,
        metodoPago,
      });

      if (response.success) {
        setSaleResult(response);
        setSuccessModalVisible(true);
      } else {
        Alert.alert('Error en Venta', response.mensaje || 'No se pudo procesar la venta.');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error inesperado al registrar la venta.';
      Alert.alert('Error de Transacción', errorMessage);
    }
  };

  const handleFinishSale = () => {
    setSuccessModalVisible(false);
    setSaleResult(null);
    setClienteNombre('');
    setClienteDocumento('');
    router.replace('/');
  };

  if (items.length === 0 && !successModalVisible) {
    return (
      <SafeAreaView style={styles.emptySafeArea}>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="cart-outline" size={60} color={Colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>El Carrito Está Vacío</Text>
          <Text style={styles.emptySubtitle}>
            No hay productos seleccionados para esta venta. Busca en el catálogo o escanea
            códigos de barras.
          </Text>

          <View style={styles.emptyButtonsContainer}>
            <PrimaryButton
              title="Buscar Productos"
              icon={<Ionicons name="search" size={18} color={Colors.white} />}
              onPress={() => router.push('/buscar')}
              style={{ width: '100%' }}
            />
            <PrimaryButton
              title="Escanear con Cámara"
              variant="outline"
              icon={<Ionicons name="barcode-outline" size={18} color={Colors.primary} />}
              onPress={() => router.push('/escanear')}
              style={{ width: '100%', marginTop: 10 }}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.producto.id}
        renderItem={({ item }) => <CartItem item={item} />}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.cartHeaderContainer}>
            <View style={styles.cartHeaderRow}>
              <Text style={styles.sectionHeaderTitle}>
                Medicamentos Seleccionados ({totalItems})
              </Text>
              <TouchableOpacity onPress={clearCart} style={styles.clearCartBtn}>
                <Ionicons name="trash-outline" size={14} color={Colors.danger} />
                <Text style={styles.clearCartText}>Vaciar</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        ListFooterComponent={
          <View style={styles.footerFormContainer}>
            {/* Método de Pago */}
            <Text style={styles.formSectionTitle}>Método de Pago</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.paymentMethodsRow}
            >
              {METODOS_PAGO.map((m) => {
                const isSelected = metodoPago === m.id;
                return (
                  <TouchableOpacity
                    key={m.id}
                    onPress={() => setMetodoPago(m.id)}
                    style={[
                      styles.paymentMethodChip,
                      isSelected && styles.paymentMethodChipActive,
                    ]}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={m.icon}
                      size={18}
                      color={isSelected ? Colors.white : Colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.paymentMethodChipText,
                        isSelected && styles.paymentMethodChipTextActive,
                      ]}
                    >
                      {m.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Datos del Cliente (Opcionales) */}
            <Text style={styles.formSectionTitle}>Datos del Cliente (Opcional)</Text>
            <View style={styles.inputGroup}>
              <TextInput
                style={styles.textInput}
                placeholder="Nombre o Razón Social"
                placeholderTextColor={Colors.textMuted}
                value={clienteNombre}
                onChangeText={setClienteNombre}
              />
              <TextInput
                style={[styles.textInput, { marginTop: 8 }]}
                placeholder="DNI / RUC"
                placeholderTextColor={Colors.textMuted}
                keyboardType="numeric"
                maxLength={11}
                value={clienteDocumento}
                onChangeText={setClienteDocumento}
              />
            </View>

            {/* Resumen de Totales */}
            <View style={styles.totalsCard}>
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>Cantidad total de ítems:</Text>
                <Text style={styles.totalsValue}>{totalItems} unidades</Text>
              </View>
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>IGV incluido (18%):</Text>
                <Text style={styles.totalsValue}>
                  S/ {(totalAmount - totalAmount / 1.18).toFixed(2)}
                </Text>
              </View>
              <View style={styles.totalsDivider} />
              <View style={styles.totalsRow}>
                <Text style={styles.totalFinalLabel}>TOTAL A PAGAR</Text>
                <Text style={styles.totalFinalValue}>S/ {totalAmount.toFixed(2)}</Text>
              </View>
            </View>

            {/* Botón de Confirmación */}
            <PrimaryButton
              title={`Confirmar Venta (S/ ${totalAmount.toFixed(2)})`}
              size="lg"
              loading={isProcessing}
              disabled={isProcessing}
              onPress={handleConfirmSale}
              icon={<Ionicons name="checkmark-circle-outline" size={22} color={Colors.white} />}
              style={styles.confirmButton}
            />
          </View>
        }
      />

      {/* Modal de Éxito de Venta */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={successModalVisible}
        onRequestClose={handleFinishSale}
      >
        <View style={styles.successModalOverlay}>
          <View style={styles.successCard}>
            <View style={styles.successIconCircle}>
              <Ionicons name="checkmark" size={48} color={Colors.white} />
            </View>

            <Text style={styles.successTitle}>¡Venta Registrada!</Text>
            <Text style={styles.successSubtitle}>
              Transacción atómica completada en Supabase
            </Text>

            {saleResult && (
              <View style={styles.receiptContainer}>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Código de Venta:</Text>
                  <Text style={styles.receiptCode}>{saleResult.codigo_venta}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Método de Pago:</Text>
                  <Text style={styles.receiptValue}>{metodoPago}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptLabel}>Ítems Procesados:</Text>
                  <Text style={styles.receiptValue}>{saleResult.items_procesados}</Text>
                </View>
                {clienteNombre ? (
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Cliente:</Text>
                    <Text style={styles.receiptValue}>{clienteNombre}</Text>
                  </View>
                ) : null}
                <View style={styles.receiptDivider} />
                <View style={styles.receiptRow}>
                  <Text style={styles.receiptTotalLabel}>Total Cobrado:</Text>
                  <Text style={styles.receiptTotalValue}>
                    S/ {Number(saleResult.total).toFixed(2)}
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.stockNoticeBox}>
              <Ionicons name="sync" size={16} color={Colors.primary} />
              <Text style={styles.stockNoticeText}>
                Stock descontado y sincronizado automáticamente.
              </Text>
            </View>

            <PrimaryButton
              title="Nueva Venta / Inicio"
              size="lg"
              onPress={handleFinishSale}
              style={{ width: '100%', marginTop: 20 }}
            />
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
  emptySafeArea: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 30,
    maxWidth: 380,
    width: '100%',
  },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyButtonsContainer: {
    width: '100%',
  },
  listContent: {
    paddingBottom: 40,
  },
  cartHeaderContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 6,
  },
  cartHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  clearCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 6,
  },
  clearCartText: {
    fontSize: 13,
    color: Colors.danger,
    fontWeight: '600',
  },
  footerFormContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  formSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 14,
    marginBottom: 8,
  },
  paymentMethodsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 6,
  },
  paymentMethodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.card,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  paymentMethodChipActive: {
    backgroundColor: Colors.primaryDark,
    borderColor: Colors.primaryDark,
  },
  paymentMethodChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  paymentMethodChipTextActive: {
    color: Colors.white,
  },
  inputGroup: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  textInput: {
    backgroundColor: Colors.inputBackground,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.text,
  },
  totalsCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  totalsLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  totalsValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  totalsDivider: {
    height: 1,
    backgroundColor: Colors.cardBorder,
    marginVertical: 10,
  },
  totalFinalLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  totalFinalValue: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.primaryDark,
  },
  confirmButton: {
    marginTop: 18,
    borderRadius: 14,
  },
  successModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  successCard: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.text,
    marginBottom: 4,
  },
  successSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  receiptContainer: {
    width: '100%',
    backgroundColor: Colors.inputBackground,
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  receiptLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  receiptCode: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  receiptValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  receiptDivider: {
    height: 1,
    backgroundColor: Colors.cardBorder,
    marginVertical: 4,
  },
  receiptTotalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.text,
  },
  receiptTotalValue: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.primaryDark,
  },
  stockNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primaryLight,
    padding: 10,
    borderRadius: 8,
    marginTop: 14,
    width: '100%',
  },
  stockNoticeText: {
    fontSize: 12,
    color: Colors.primaryDark,
    fontWeight: '600',
    flex: 1,
  },
});
