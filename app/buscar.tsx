import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  Pressable,
  ScrollView,
} from 'react-native';
import { SearchBar } from '../components/SearchBar';
import { ProductCard } from '../components/ProductCard';
import { productRepository } from '../repositories/productRepository';
import { Categoria, ProductoConCategoria } from '../types/database';
import { Colors } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';

export default function BuscarScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<ProductoConCategoria[]>([]);
  const [categories, setCategories] = useState<Categoria[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchProducts = useCallback(async (query: string = '', categoryId: string | null = null) => {
    try {
      setLoading(true);
      const data = await productRepository.searchProducts(query, 100, categoryId || undefined);
      setProducts(data);
    } catch (err) {
      console.error('Error in fetchProducts:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    productRepository.getCategories().then(setCategories).catch(error => {
      console.error('Error loading categories:', error);
    });
  }, []);

  // Búsqueda reactiva con debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts(searchQuery, selectedCategory);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory, fetchProducts]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts(searchQuery, selectedCategory);
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 2200);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Barra de búsqueda */}
      <View style={styles.searchHeader}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Nombre del fármaco o código..."
          autoFocus={false}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}
          accessibilityRole="tablist"
        >
          <Pressable
            onPress={() => setSelectedCategory(null)}
            accessibilityRole="tab"
            accessibilityState={{ selected: selectedCategory === null }}
            style={[styles.categoryChip, selectedCategory === null && styles.categoryChipActive]}
          >
            <Text style={[styles.categoryText, selectedCategory === null && styles.categoryTextActive]}>Todos</Text>
          </Pressable>
          {categories.map(category => (
            <Pressable
              key={category.id}
              onPress={() => setSelectedCategory(category.id)}
              accessibilityRole="tab"
              accessibilityState={{ selected: selectedCategory === category.id }}
              style={[styles.categoryChip, selectedCategory === category.id && styles.categoryChipActive]}
            >
              <Text style={[styles.categoryText, selectedCategory === category.id && styles.categoryTextActive]}>{category.nombre}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Listado de Productos */}
      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Buscando en catálogo...</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ProductCard
              producto={item}
              onAddSuccess={(msg) => showToast(msg)}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No se encontraron medicamentos</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery.length > 0
                  ? `No hay coincidencias para "${searchQuery}".`
                  : 'No hay productos registrados en el inventario.'}
              </Text>
            </View>
          }
        />
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <View style={styles.toastContainer}>
          <Ionicons name="checkmark-circle" size={20} color={Colors.white} />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  searchHeader: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  categoryList: {
    gap: 8,
    paddingTop: 10,
    paddingRight: 12,
  },
  categoryChip: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  categoryChipActive: {
    borderColor: Colors.secondary,
    backgroundColor: Colors.tealWash,
  },
  categoryText: { color: Colors.textSecondary, fontSize: 14, fontWeight: '600' },
  categoryTextActive: { color: Colors.secondary, fontWeight: '700' },
  listContent: {
    paddingVertical: 10,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  toastContainer: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  toastText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
});
