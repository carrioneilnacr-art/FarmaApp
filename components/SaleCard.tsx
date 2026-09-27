import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VentaCompleta } from '../types/database';
import { StatusChip } from './StatusChip';
import { Colors, Rounded, Typography, Spacing } from '../theme/colors';

export interface SaleCardProps {
  venta: VentaCompleta;
  onPress: () => void;
}

export const SaleCard: React.FC<SaleCardProps> = ({ venta, onPress }) => {
  const itemsCount = venta.detalle_ventas?.reduce((acc, it) => acc + it.cantidad, 0) || 0;
  const itemsPreview = venta.detalle_ventas
    ?.map((it) => `${it.productos?.nombre || 'Producto'} (x${it.cantidad})`)
    .slice(0, 2)
    .join(', ');

  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit' });
    } catch {
      return '';
    }
  };

  const displayNumber = venta.numero_venta || venta.codigo_venta;

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      style={[styles.card, venta.estado === 'ANULADA' && styles.cardAnnulled]}
    >
      <View style={styles.headerRow}>
        <View style={styles.codeGroup}>
          <Text style={styles.saleNumber}>{displayNumber}</Text>
          <Text style={styles.timeText}>
            {formatDate(venta.created_at)} · {formatTime(venta.created_at)}
          </Text>
        </View>
        <StatusChip estado={venta.estado} size="sm" />
      </View>

      {itemsPreview ? (
        <Text style={styles.itemsSummary} numberOfLines={1}>
          {itemsPreview}
          {venta.detalle_ventas && venta.detalle_ventas.length > 2 ? '...' : ''}
        </Text>
      ) : null}

      <View style={styles.footerRow}>
        <View style={styles.metaGroup}>
          <View style={styles.payBadge}>
            <Ionicons name="card-outline" size={12} color={Colors.textSecondary} />
            <Text style={styles.payBadgeText}>{venta.metodo_pago}</Text>
          </View>
          <Text style={styles.itemsCountText}>{itemsCount} uds</Text>
        </View>

        <View style={styles.priceContainer}>
          <Text style={styles.priceCurrency}>S/</Text>
          <Text
            style={[
              styles.priceValue,
              venta.estado === 'ANULADA' && styles.priceAnnulled,
            ]}
          >
            {Number(venta.total).toFixed(2)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Rounded.lg, // 8px
    padding: Spacing.spaceMd, // 16px
    marginVertical: 4,
    marginHorizontal: Spacing.spaceMd,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  cardAnnulled: {
    backgroundColor: Colors.surfaceContainerLow,
    borderColor: Colors.cardBorder,
    opacity: 0.85,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  codeGroup: {
    flex: 1,
    marginRight: 8,
  },
  saleNumber: {
    ...Typography.headlineSm,
    color: Colors.text,
  },
  timeText: {
    ...Typography.bodySm,
    color: Colors.textMuted,
    marginTop: 1,
  },
  itemsSummary: {
    ...Typography.bodySm,
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
  },
  metaGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  payBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.inputBackground,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: Rounded.DEFAULT,
  },
  payBadgeText: {
    ...Typography.labelSm,
    color: Colors.textSecondary,
    fontSize: 9,
  },
  itemsCountText: {
    ...Typography.bodySm,
    color: Colors.textMuted,
    fontSize: 11,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceCurrency: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
    marginRight: 2,
  },
  priceValue: {
    ...Typography.tabularPrice,
    color: Colors.text,
  },
  priceAnnulled: {
    textDecorationLine: 'line-through',
    color: Colors.textMuted,
  },
});
