import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { HistorialVenta } from '../types/database';
import { Colors, Rounded, Typography, Spacing } from '../theme/colors';

export interface SaleHistoryTimelineProps {
  historial: HistorialVenta[];
}

export const SaleHistoryTimeline: React.FC<SaleHistoryTimelineProps> = ({ historial }) => {
  if (!historial || historial.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Sin eventos históricos registrados</Text>
      </View>
    );
  }

  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>HISTORIAL Y TRAZABILIDAD</Text>

      <View style={styles.timeline}>
        {historial.map((item, index) => {
          const isLast = index === historial.length - 1;
          return (
            <View key={item.id || index} style={styles.timelineItem}>
              <View style={styles.leftCol}>
                <View style={[styles.dot, isLast && styles.dotActive]} />
                {!isLast && <View style={styles.line} />}
              </View>

              <View style={styles.contentCol}>
                <View style={styles.eventHeader}>
                  <Text style={styles.eventTitle}>{item.evento.replace(/_/g, ' ')}</Text>
                  <Text style={styles.eventTime}>{formatTime(item.created_at)}</Text>
                </View>
                {item.descripcion ? (
                  <Text style={styles.eventDesc}>{item.descripcion}</Text>
                ) : null}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: Rounded.lg,
    padding: Spacing.spaceMd,
    marginHorizontal: Spacing.spaceMd,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  sectionTitle: {
    ...Typography.labelSm,
    color: Colors.textMuted,
    marginBottom: 12,
  },
  emptyContainer: {
    padding: 16,
    alignItems: 'center',
  },
  emptyText: {
    ...Typography.bodySm,
    color: Colors.textMuted,
  },
  timeline: {
    paddingLeft: 4,
  },
  timelineItem: {
    flexDirection: 'row',
    minHeight: 44,
  },
  leftCol: {
    alignItems: 'center',
    width: 16,
    marginRight: 10,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: Rounded.full,
    backgroundColor: Colors.border,
    marginTop: 4,
  },
  dotActive: {
    backgroundColor: Colors.secondary,
  },
  line: {
    flex: 1,
    width: 1,
    backgroundColor: Colors.cardBorder,
    marginVertical: 2,
  },
  contentCol: {
    flex: 1,
    paddingBottom: 12,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventTitle: {
    ...Typography.labelMd,
    color: Colors.text,
    fontSize: 12,
  },
  eventTime: {
    ...Typography.bodySm,
    color: Colors.textMuted,
    fontSize: 11,
  },
  eventDesc: {
    ...Typography.bodySm,
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
});
