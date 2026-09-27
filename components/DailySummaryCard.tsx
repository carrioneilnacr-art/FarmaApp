import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ResumenDiario } from '../types/database';
import { Colors, Rounded, Typography, Spacing } from '../theme/colors';

export interface DailySummaryCardProps {
  resumen: ResumenDiario;
}

export const DailySummaryCard: React.FC<DailySummaryCardProps> = ({ resumen }) => {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>RESUMEN DEL DÍA</Text>
        <Text style={styles.dateText}>{resumen.fecha}</Text>
      </View>

      <View style={styles.heroMetric}>
        <Text style={styles.heroLabel}>Total Vendido (Efectivo & Digital)</Text>
        <View style={styles.heroAmountRow}>
          <Text style={styles.heroCurrency}>S/</Text>
          <Text style={styles.heroAmount}>{Number(resumen.total_vendido).toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{resumen.ventas_realizadas}</Text>
          <Text style={styles.statLabel}>Ventas Realizadas</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <Text style={styles.statValue}>{resumen.productos_vendidos}</Text>
          <Text style={styles.statLabel}>Uds Vendidas</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <Text style={[styles.statValue, resumen.devoluciones > 0 && { color: Colors.secondary }]}>
            {resumen.devoluciones}
          </Text>
          <Text style={styles.statLabel}>Devoluciones</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <Text style={[styles.statValue, resumen.ventas_anuladas > 0 && { color: Colors.clinicalAlert }]}>
            {resumen.ventas_anuladas}
          </Text>
          <Text style={styles.statLabel}>Anuladas</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Rounded.lg,
    padding: Spacing.spaceMd,
    marginHorizontal: Spacing.spaceMd,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitle: {
    ...Typography.labelSm,
    color: Colors.textMuted,
  },
  dateText: {
    ...Typography.bodySm,
    fontSize: 11,
    color: Colors.textMuted,
  },
  heroMetric: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Rounded.DEFAULT,
    padding: 12,
    marginBottom: 12,
  },
  heroLabel: {
    ...Typography.bodySm,
    color: Colors.textSecondary,
    fontSize: 11,
  },
  heroAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 2,
  },
  heroCurrency: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginRight: 3,
  },
  heroAmount: {
    ...Typography.tabularPrice,
    fontSize: 24,
    color: Colors.text,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.cardBorder,
  },
  statValue: {
    ...Typography.headlineSm,
    color: Colors.text,
    fontSize: 15,
  },
  statLabel: {
    ...Typography.bodySm,
    fontSize: 9,
    color: Colors.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
});
