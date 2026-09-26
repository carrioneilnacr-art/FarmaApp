import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProductoConCategoria } from '../types/database';
import { Colors } from '../theme/colors';
import { useCart } from '../context/CartContext';

export interface ProductCardProps {
  producto: ProductoConCategoria;
  onPress?: () => void;
  onAddSuccess?: (message: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  producto,
  onPress,
  onAddSuccess,
}) => {
  const { addItem, getItemQuantity, incrementItem, decrementItem } = useCart();
  const quantityInCart = getItemQuantity(producto.id);

  const isOutOfStock = producto.stock <= 0;
  const isLowStock = !isOutOfStock && producto.stock <= producto.stock_minimo;

  const handleAdd = () => {
    const result = addItem(producto, 1);
    if (result.success && onAddSuccess) {
      onAddSuccess(result.message || 'Producto agregado');
    }
  };

  const handleIncrement = () => {
    const result = incrementItem(producto.id);
    if (result.success && onAddSuccess) {
      onAddSuccess(result.message || 'Cantidad incrementada');
    }
  };

  const handleDecrement = () => {
    decrementItem(producto.id);
  };

  // Badge de Stock
  const renderStockBadge = () => {
    if (isOutOfStock) {
      return (
        <View style={[styles.stockBadge, { backgroundColor: Colors.dangerBg }]}>
          <Ionicons name="close-circle" size={12} color={Colors.danger} />
          <Text style={[styles.stockBadgeText, { color: Colors.danger }]}>Agotado</Text>
        </View>
      );
    }

    if (isLowStock) {
      return (
        <View style={[styles.stockBadge, { backgroundColor: Colors.warningBg }]}>
          <Ionicons name="alert-circle" size={12} color={Colors.warning} />
          <Text style={[styles.stockBadgeText, { color: Colors.warning }]}>
            Stock bajo ({producto.stock})
          </Text>
        </View>
      );
    }

    return (
      <View style={[styles.stockBadge, { backgroundColor: Colors.successBg }]}>
        <Ionicons name="checkmark-circle" size={12} color={Colors.success} />
        <Text style={[styles.stockBadgeText, { color: Colors.success }]}>
          Stock: {producto.stock}
        </Text>
      </View>
    );
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      disabled={!onPress}
      style={[styles.card, isOutOfStock && styles.cardDisabled]}
    >
      <View style={styles.headerRow}>
        <View style={styles.categoryContainer}>
          {producto.categorias && (
            <Text style={styles.categoryText}>{producto.categorias.nombre}</Text>
          )}
        </View>
        {renderStockBadge()}
      </View>

      <Text style={styles.productName} numberOfLines={2}>
        {producto.nombre}
      </Text>

      {producto.descripcion ? (
        <Text style={styles.productDescription} numberOfLines={2}>
          {producto.descripcion}
        </Text>
      ) : null}

      <View style={styles.barcodeRow}>
        <Ionicons name="barcode-outline" size={15} color={Colors.textSecondary} />
        <Text style={styles.barcodeText}>{producto.codigo_barras}</Text>
      </View>

      <View style={styles.footerRow}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceCurrency}>S/</Text>
          <Text style={styles.priceValue}>{Number(producto.precio).toFixed(2)}</Text>
        </View>

        {/* Acciones de compra */}
        {isOutOfStock ? (
          <View style={styles.outOfStockAction}>
            <Text style={styles.outOfStockText}>No disponible</Text>
          </View>
        ) : quantityInCart > 0 ? (
          <View style={styles.stepperContainer}>
            <TouchableOpacity
              onPress={handleDecrement}
              style={styles.stepperButton}
              activeOpacity={0.7}
            >
              <Ionicons name="remove" size={18} color={Colors.primary} />
            </TouchableOpacity>
            <View style={styles.stepperQuantity}>
              <Text style={styles.stepperQuantityText}>{quantityInCart}</Text>
            </View>
            <TouchableOpacity
              onPress={handleIncrement}
              disabled={quantityInCart >= producto.stock}
              style={[
                styles.stepperButton,
                quantityInCart >= producto.stock && styles.stepperButtonDisabled,
              ]}
              activeOpacity={0.7}
            >
              <Ionicons
                name="add"
                size={18}
                color={quantityInCart >= producto.stock ? Colors.textMuted : Colors.primary}
              />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAdd}
            activeOpacity={0.8}
          >
            <Ionicons name="cart-outline" size={16} color={Colors.white} />
            <Text style={styles.addButtonText}>Agregar</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    marginVertical: 6,
    marginHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardDisabled: {
    opacity: 0.75,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryContainer: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primaryDark,
    textTransform: 'uppercase',
  },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  stockBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  productName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 8,
    lineHeight: 18,
  },
  barcodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 10,
  },
  barcodeText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: undefined,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceCurrency: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primaryDark,
    marginRight: 2,
  },
  priceValue: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    gap: 6,
  },
  addButtonText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  outOfStockAction: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: Colors.inputBackground,
    borderRadius: 6,
  },
  outOfStockText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
    overflow: 'hidden',
  },
  stepperButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonDisabled: {
    opacity: 0.4,
  },
  stepperQuantity: {
    minWidth: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperQuantityText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
});
