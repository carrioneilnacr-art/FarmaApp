import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  SafeAreaView,
  Vibration,
  Image,
} from 'react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { productRepository } from '../repositories/productRepository';
import { ProductoConCategoria } from '../types/database';
import { useCart } from '../context/CartContext';
import { BarcodeScannerOverlay } from '../components/BarcodeScannerOverlay';
import { PrimaryButton } from '../components/PrimaryButton';
import { Colors } from '../theme/colors';

export default function EscanearScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [isScanning, setIsScanning] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  // Producto encontrado
  const [scannedProduct, setScannedProduct] = useState<ProductoConCategoria | null>(null);
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const { addItem, getItemQuantity } = useCart();
  const lockRef = useRef(false);

  const handleBarcodeScanned = async (result: BarcodeScanningResult) => {
    if (lockRef.current || !isScanning || modalVisible) return;

    const barcode = result.data;
    if (!barcode) return;

    lockRef.current = true;
    setIsScanning(false);
    setIsSearching(true);
    setScannedBarcode(barcode);

    // Feedback táctil
    try {
      Vibration.vibrate(80);
    } catch {
      // Ignorar si no está disponible
    }

    try {
      const product = await productRepository.getProductByBarcode(barcode);
      if (product) {
        setScannedProduct(product);
        setNotFound(false);
      } else {
        setScannedProduct(null);
        setNotFound(true);
      }
      setModalVisible(true);
    } catch (err) {
      console.error('Error lookup barcode:', err);
      setScannedProduct(null);
      setNotFound(true);
      setModalVisible(true);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setScannedProduct(null);
    setScannedBarcode(null);
    setNotFound(false);
    // Reactivar escáner tras pequeño delay
    setTimeout(() => {
      lockRef.current = false;
      setIsScanning(true);
    }, 600);
  };

  const handleAddToCart = () => {
    if (scannedProduct) {
      addItem(scannedProduct, 1);
      handleCloseModal();
    }
  };

  if (!permission) {
    // Permisos cargando
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.permissionText}>Cargando permisos de cámara...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    // Permiso denegado
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <Ionicons name="camera-outline" size={64} color={Colors.primary} />
        <Text style={styles.permissionTitle}>Permiso de Cámara Requerido</Text>
        <Text style={styles.permissionSubtitle}>
          FarmaApp necesita acceso a la cámara para escanear los códigos de barras de los
          medicamentos.
        </Text>
        <PrimaryButton
          title="Conceder Permiso"
          onPress={requestPermission}
          style={{ width: '100%', marginTop: 20 }}
        />
        <TouchableOpacity style={{ marginTop: 16 }} onPress={() => router.back()}>
          <Text style={{ color: Colors.textSecondary, fontWeight: '600' }}>Volver atrás</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const quantityInCart = scannedProduct ? getItemQuantity(scannedProduct.id) : 0;
  const isOutOfStock = scannedProduct ? scannedProduct.stock <= 0 : false;
  const isMaxReached = scannedProduct ? quantityInCart >= scannedProduct.stock : false;

  return (
    <View style={styles.container}>
      {/* Vista de Cámara */}
      <CameraView
        style={StyleSheet.absoluteFillObject}
        enableTorch={torchEnabled}
        barcodeScannerSettings={{
          barcodeTypes: [
            'ean13',
            'ean8',
            'upc_a',
            'upc_e',
            'code128',
            'code39',
            'qr',
          ],
        }}
        onBarcodeScanned={isScanning ? handleBarcodeScanned : undefined}
      />

      {/* Guía y Controles Superpuestos */}
      <BarcodeScannerOverlay
        torchEnabled={torchEnabled}
        onToggleTorch={() => setTorchEnabled((prev) => !prev)}
        onClose={() => router.back()}
        isProcessing={isSearching}
      />

      {/* Modal Bottom Sheet con Información del Producto Escaneado */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            {/* Header del Modal */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Resultado del Escaneo</Text>
              <TouchableOpacity onPress={handleCloseModal} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={22} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {notFound ? (
              <View style={styles.notFoundContainer}>
                <Ionicons name="alert-circle-outline" size={48} color={Colors.warning} />
                <Text style={styles.notFoundTitle}>Medicamento No Encontrado</Text>
                <Text style={styles.notFoundSubtitle}>
                  El código <Text style={{ fontWeight: '700' }}>{scannedBarcode}</Text> no está
                  registrado en la base de datos de FarmaApp.
                </Text>
                <PrimaryButton
                  title="Escanear Otro Producto"
                  onPress={handleCloseModal}
                  style={{ width: '100%', marginTop: 16 }}
                />
              </View>
            ) : scannedProduct ? (
              <View style={styles.productDetails}>
                {scannedProduct.imagen_url ? (
                  <View style={styles.modalImageContainer}>
                    <Image
                      source={{ uri: scannedProduct.imagen_url }}
                      style={styles.modalImage}
                      resizeMode="contain"
                    />
                  </View>
                ) : null}

                <View style={styles.productBadgeRow}>
                  {scannedProduct.categorias && (
                    <View style={styles.categoryPill}>
                      <Text style={styles.categoryPillText}>
                        {scannedProduct.categorias.nombre}
                      </Text>
                    </View>
                  )}
                  <View
                    style={[
                      styles.stockPill,
                      {
                        backgroundColor: isOutOfStock
                          ? Colors.dangerBg
                          : scannedProduct.stock <= scannedProduct.stock_minimo
                          ? Colors.warningBg
                          : Colors.successBg,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.stockPillText,
                        {
                          color: isOutOfStock
                            ? Colors.danger
                            : scannedProduct.stock <= scannedProduct.stock_minimo
                            ? Colors.warning
                            : Colors.success,
                        },
                      ]}
                    >
                      {isOutOfStock
                        ? 'Agotado'
                        : `Stock: ${scannedProduct.stock} uds`}
                    </Text>
                  </View>
                </View>

                <Text style={styles.productModalName}>{scannedProduct.nombre}</Text>

                {scannedProduct.descripcion ? (
                  <Text style={styles.productModalDesc}>{scannedProduct.descripcion}</Text>
                ) : null}

                <View style={styles.codeRow}>
                  <Ionicons name="barcode-outline" size={16} color={Colors.textSecondary} />
                  <Text style={styles.codeText}>{scannedProduct.codigo_barras}</Text>
                </View>

                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Precio de Venta:</Text>
                  <Text style={styles.modalPrice}>
                    S/ {Number(scannedProduct.precio).toFixed(2)}
                  </Text>
                </View>

                {quantityInCart > 0 && (
                  <View style={styles.inCartNotice}>
                    <Ionicons name="cart" size={16} color={Colors.primaryDark} />
                    <Text style={styles.inCartNoticeText}>
                      Actualmente tienes {quantityInCart} en el carrito
                    </Text>
                  </View>
                )}

                <View style={styles.modalActions}>
                  <PrimaryButton
                    title={
                      isOutOfStock
                        ? 'Agotado (Sin Stock)'
                        : isMaxReached
                        ? 'Máximo Stock en Carrito'
                        : '+ Agregar a la Venta'
                    }
                    onPress={handleAddToCart}
                    disabled={isOutOfStock || isMaxReached}
                    style={{ flex: 1 }}
                  />
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={handleCloseModal}
                  >
                    <Text style={styles.cancelButtonText}>Continuar Escaneando</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    gap: 12,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
    backgroundColor: Colors.background,
    gap: 8,
  },
  permissionText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
    marginTop: 14,
    textAlign: 'center',
  },
  permissionSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 6,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 34,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  modalCloseBtn: {
    padding: 4,
  },
  notFoundContainer: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  notFoundTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
  },
  notFoundSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  productDetails: {
    gap: 10,
  },
  modalImageContainer: {
    width: '100%',
    height: 140,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
  productBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryPill: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primaryDark,
    textTransform: 'uppercase',
  },
  stockPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  stockPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  productModalName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  productModalDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  codeText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.inputBackground,
    padding: 12,
    borderRadius: 10,
    marginTop: 4,
  },
  priceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  modalPrice: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  inCartNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primaryLight,
    padding: 8,
    borderRadius: 8,
  },
  inCartNoticeText: {
    fontSize: 12,
    color: Colors.primaryDark,
    fontWeight: '600',
  },
  modalActions: {
    marginTop: 14,
    gap: 10,
  },
  cancelButton: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
});
