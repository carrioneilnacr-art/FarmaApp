import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { EstadoVenta } from '../types/database';
import { Colors, Rounded, Typography } from '../theme/colors';

export interface StatusChipProps {
  estado: EstadoVenta | string;
  size?: 'sm' | 'md';
}

export const StatusChip: React.FC<StatusChipProps> = ({ estado, size = 'sm' }) => {
  const norm = (estado || '').toUpperCase();

  let bg = Colors.surfaceContainerLow;
  let fg = Colors.textSecondary;
  let dotColor = Colors.textMuted;
  let label = norm;

  switch (norm) {
    case 'EMITIDA':
      bg = Colors.surfaceContainerLow;
      fg = Colors.secondary;
      dotColor = Colors.tealConfirm;
      label = 'EMITIDA';
      break;
    case 'PAGADA':
      bg = Colors.surfaceContainer;
      fg = Colors.text;
      dotColor = Colors.textSecondary;
      label = 'PAGADA';
      break;
    case 'ABIERTA':
      bg = Colors.warningBg;
      fg = Colors.warning;
      dotColor = Colors.warning;
      label = 'ABIERTA';
      break;
    case 'ANULADA':
      bg = Colors.alertWash;
      fg = Colors.clinicalAlert;
      dotColor = Colors.clinicalAlert;
      label = 'ANULADA';
      break;
    case 'DEVUELTA':
      bg = Colors.tealWash;
      fg = Colors.secondary;
      dotColor = Colors.tealConfirm;
      label = 'DEVUELTA';
      break;
    case 'COMPLETADA':
      bg = Colors.tealWash;
      fg = Colors.secondary;
      dotColor = Colors.tealConfirm;
      label = 'COMPLETADA';
      break;
  }

  const isSmall = size === 'sm';

  return (
    <View style={[styles.container, { backgroundColor: bg }, isSmall ? styles.containerSm : styles.containerMd]}>
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
      <Text style={[styles.text, { color: fg }, isSmall ? styles.textSm : styles.textMd]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Rounded.DEFAULT, // 0.25rem = 4px
    alignSelf: 'flex-start',
    gap: 5,
  },
  containerSm: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
  },
  containerMd: {
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: Rounded.full,
  },
  text: {
    ...Typography.labelSm,
  },
  textSm: {
    fontSize: 10,
  },
  textMd: {
    fontSize: 11,
  },
});
