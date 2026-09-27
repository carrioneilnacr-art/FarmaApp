import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CartItem as CartItemType } from '../types/database';
import { Colors } from '../theme/colors';
import { useCart } from '../context/CartContext';

export interface CartItemProps {
  item: CartItemType;
  onStockLimitReached?: () => void;
}

export const CartItem: React.FC<CartItemProps> = ({ item, onStockLimitReached }) => {
  const { incrementItem, decrementItem, removeItem } = useCart();
  const { producto, cantidad, subtotal } = item;
  const [imgError, setImgError] = useState(false);

  const isMaxStock = cantidad >= producto.stock;

  const handleIncrement = () => {
    const result = incrementItem(producto.id);
    if (!result.success && onStockLimitReached) {
      onStockLimitReached();
    }
  };

  const handleDecrement = () => {
    decrementItem(producto.id);
  };

  const handleRemove = () => {
    removeItem(producto.id);
  };

  return (
    <View style={styles.card}>
      <View style={styles.thumbnailContainer}>
        {producto.imagen_url && !imgError ? (
          <Image
            source={{ uri: producto.imagen_url }}
            style={styles.thumbnail}
            resizeMode="contain"
            onError={() => setImgError(true)}
          />
        ) : (
          <Ionicons name="medkit-outline" size={22} color={Colors.textMuted} />
        )}
      </View>

      <View style={styles.mainInfo}>
        <View style={styles.headerRow}>
          <Text style={styles.productName} numberOfLines={2}>
            {producto.nombre}
          </Text>
          <TouchableOpacity
            onPress={handleRemove}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.deleteButton}
          >
            <Ionicons name="trash-outline" size={17} color={Colors.danger} />
          </TouchableOpacity>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.unitPrice}>
            Precio: <Text style={styles.unitPriceBold}>S/ {Number(producto.precio).toFixed(2)}</Text>
          </Text>
          <Text style={styles.stockLimitText}>
            (Disp: {producto.stock})
          </Text>
        </View>

        <View style={styles.actionRow}>
          {/* Stepper (+ / -) */}
          <View style={styles.stepperContainer}>
            <TouchableOpacity
              onPress={handleDecrement}
              style={styles.stepperButton}
              activeOpacity={0.7}
            >
              <Ionicons name="remove" size={15} color={Colors.primaryDark} />
            </TouchableOpacity>

            <View style={styles.stepperQuantity}>
              <Text style={styles.stepperQuantityText}>{cantidad}</Text>
            </View>

            <TouchableOpacity
              onPress={handleIncrement}
              disabled={isMaxStock}
              style={[styles.stepperButton, isMaxStock && styles.stepperButtonDisabled]}
              activeOpacity={0.7}
            >
              <Ionicons
                name="add"
                size={15}
                color={isMaxStock ? Colors.textMuted : Colors.primaryDark}
              />
            </TouchableOpacity>
          </View>

          {/* Subtotal */}
          <View style={styles.subtotalContainer}>
            <Text style={styles.subtotalLabel}>Subtotal</Text>
            <Text style={styles.subtotalValue}>S/ {subtotal.toFixed(2)}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 12,
    marginVertical: 5,
    marginHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  thumbnailContainer: {
    width: 58,
    height: 58,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  mainInfo: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 3,
  },
  productName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginRight: 6,
    lineHeight: 18,
  },
  deleteButton: {
    padding: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  unitPrice: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  unitPriceBold: {
    fontWeight: '600',
    color: Colors.text,
  },
  stockLimitText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  stepperButton: {
    paddingVertical: 4,
    paddingHorizontal: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonDisabled: {
    opacity: 0.35,
  },
  stepperQuantity: {
    minWidth: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperQuantityText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  subtotalContainer: {
    alignItems: 'flex-end',
  },
  subtotalLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },
  subtotalValue: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
});
