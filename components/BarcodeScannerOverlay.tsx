import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';

const { width } = Dimensions.get('window');
const SCAN_AREA_SIZE = width * 0.72;

export interface BarcodeScannerOverlayProps {
  torchEnabled: boolean;
  onToggleTorch: () => void;
  onClose?: () => void;
  isProcessing?: boolean;
}

export const BarcodeScannerOverlay: React.FC<BarcodeScannerOverlayProps> = ({
  torchEnabled,
  onToggleTorch,
  onClose,
  isProcessing = false,
}) => {
  return (
    <View style={styles.overlayContainer} pointerEvents="box-none">
      {/* Barra superior de controles */}
      <View style={styles.topBar}>
        {onClose && (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={26} color={Colors.white} />
          </TouchableOpacity>
        )}
        <View style={{ flex: 1 }} />
        <TouchableOpacity
          style={[styles.iconButton, torchEnabled && styles.iconButtonActive]}
          onPress={onToggleTorch}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name={torchEnabled ? 'flash' : 'flash-off'}
            size={24}
            color={torchEnabled ? '#FBBF24' : Colors.white}
          />
        </TouchableOpacity>
      </View>

      {/* Área central de escaneo */}
      <View style={styles.centerContainer} pointerEvents="none">
        <View style={styles.scannerBox}>
          {/* 4 esquinas de mira */}
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />

          {/* Línea láser central */}
          <View style={[styles.laserLine, isProcessing && styles.laserLineProcessing]} />
        </View>

        <Text style={styles.hintText}>
          {isProcessing
            ? 'Buscando medicamento...'
            : 'Enfoca el código de barras dentro del recuadro'}
        </Text>
      </View>

      {/* Pie con indicador */}
      <View style={styles.bottomBar} pointerEvents="none">
        <View style={styles.badgeContainer}>
          <Ionicons name="barcode-outline" size={18} color={Colors.white} />
          <Text style={styles.badgeText}>Escáner Activo</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 10,
    zIndex: 10,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  iconButtonActive: {
    backgroundColor: 'rgba(251, 191, 36, 0.25)',
    borderColor: '#FBBF24',
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerBox: {
    width: SCAN_AREA_SIZE,
    height: SCAN_AREA_SIZE * 0.75,
    borderRadius: 16,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: Colors.secondary,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 14,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 14,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 14,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 14,
  },
  laserLine: {
    width: '90%',
    height: 2,
    backgroundColor: Colors.secondary,
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
  laserLineProcessing: {
    backgroundColor: '#F59E0B',
    shadowColor: '#F59E0B',
  },
  hintText: {
    marginTop: 20,
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: 'hidden',
  },
  bottomBar: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15, 118, 110, 0.85)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
});
