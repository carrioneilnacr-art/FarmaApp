import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
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

  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

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
          <Ionicons name="close-circle" size={11} color={Colors.danger} />
          <Text style={[styles.stockBadgeText, { color: Colors.danger }]}>Agotado</Text>
        </View>
      );
    }

    if (isLowStock) {
      return (
        <View style={[styles.stockBadge, { backgroundColor: Colors.warningBg }]}>
          <Ionicons name="alert-circle" size={11} color={Colors.warning} />
          <Text style={[styles.stockBadgeText, { color: Colors.warning }]}>
            Bajo ({producto.stock})
          </Text>
        </View>
      );
    }

    return (
      <View style={[styles.stockBadge, { backgroundColor: Colors.successBg }]}>
        <Ionicons name="checkmark-circle" size={11} color={Colors.success} />
        <Text style={[styles.stockBadgeText, { color: Colors.success }]}>
          Stock: {producto.stock}
        </Text>
      </View>
    );
  };

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={onPress}
      disabled={!onPress}
      style={[styles.card, isOutOfStock && styles.cardDisabled]}
    >
      <View style={styles.cardContent}>
        {/* Imagen Responsive del Producto */}
        <View style={styles.imageWrapper}>
          {producto.imagen_url && !imageError ? (
            <>
              <Image
                source={{ uri: producto.imagen_url }}
                style={styles.image}
                resizeMode="contain"
                onLoadEnd={() => setImageLoading(false)}
                onError={() => {
                  setImageLoading(false);
                  setImageError(true);
                }}
              />
              {imageLoading && (
                <View style={styles.imageLoadingContainer}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                </View>
              )}
            </>
          ) : (
            <View style={styles.imageFallback}>
              <Ionicons name="medkit-outline" size={26} color={Colors.textMuted} />
            </View>
          )}
        </View>

        {/* Detalles del Producto */}
        <View style={styles.detailsContainer}>
          <View style={styles.headerRow}>
            <View style={styles.categoryContainer}>
              {producto.categorias && (
                <Text style={styles.categoryText} numberOfLines={1}>
                  {producto.categorias.nombre}
                </Text>
              )}
            </View>
            {renderStockBadge()}
          </View>

          <Text style={styles.productName} numberOfLines={2}>
            {producto.nombre}
          </Text>

          {producto.descripcion ? (
            <Text style={styles.productDescription} numberOfLines={1}>
              {producto.descripcion}
            </Text>
          ) : null}

          <View style={styles.barcodeRow}>
            <Ionicons name="barcode-outline" size={13} color={Colors.textSecondary} />
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
                  <Ionicons name="remove" size={16} color={Colors.primary} />
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
                    size={16}
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
                <Ionicons name="cart-outline" size={14} color={Colors.white} />
                <Text style={styles.addButtonText}>Agregar</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 14,
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
  },
  cardDisabled: {
    opacity: 0.72,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  imageWrapper: {
    width: 82,
    height: 82,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageLoadingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageFallback: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    backgroundColor: '#F1F5F9',
  },
  detailsContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  categoryContainer: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    maxWidth: '55%',
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primaryDark,
    textTransform: 'uppercase',
  },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 3,
  },
  stockBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  productName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    lineHeight: 18,
    marginBottom: 2,
  },
  productDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
    lineHeight: 16,
  },
  barcodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  barcodeText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceCurrency: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryDark,
    marginRight: 2,
  },
  priceValue: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  addButtonText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  outOfStockAction: {
    paddingVertical: 5,
    paddingHorizontal: 8,
    backgroundColor: Colors.inputBackground,
    borderRadius: 6,
  },
  outOfStockText: {
    fontSize: 11,
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
    paddingVertical: 5,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonDisabled: {
    opacity: 0.4,
  },
  stepperQuantity: {
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperQuantityText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
});
