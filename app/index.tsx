import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../context/CartContext';
import { Colors } from '../theme/colors';

export default function HomeScreen() {
  const router = useRouter();
  const { totalItems, totalAmount } = useCart();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Banner de Bienvenida */}
        <View style={styles.heroBanner}>
          <View style={styles.heroContent}>
            <View style={styles.heroIconBadge}>
              <Ionicons name="medical" size={28} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroTitle}>FarmaApp POS</Text>
              <Text style={styles.heroSubtitle}>
                Punto de Venta e Inventario Rápido
              </Text>
            </View>
          </View>

          {/* Resumen en tiempo real del carrito actual */}
          <View style={styles.cartSummaryCard}>
            <View style={styles.cartSummaryItem}>
              <Text style={styles.cartSummaryLabel}>Productos en Carrito</Text>
              <Text style={styles.cartSummaryValue}>{totalItems} uds</Text>
            </View>
            <View style={styles.cartSummaryDivider} />
            <View style={styles.cartSummaryItem}>
              <Text style={styles.cartSummaryLabel}>Total Acumulado</Text>
              <Text style={styles.cartSummaryTotal}>S/ {totalAmount.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Sección de Acciones Operativas */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
          <Text style={styles.sectionSubtitle}>Selecciona una operación</Text>
        </View>

        <View style={styles.actionGrid}>
          {/* Tarjeta 1: Buscar Producto */}
          <TouchableOpacity
            style={styles.actionCard}
            activeOpacity={0.85}
            onPress={() => router.push('/buscar')}
          >
            <View style={[styles.actionIconContainer, { backgroundColor: '#E0F2FE' }]}>
              <Ionicons name="search" size={28} color="#0284C7" />
            </View>
            <View style={styles.actionTextContainer}>
              <Text style={styles.actionCardTitle}>Buscar Producto</Text>
              <Text style={styles.actionCardSubtitle}>
                Búsqueda reactiva por nombre o código
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
          </TouchableOpacity>

          {/* Tarjeta 2: Escanear Código */}
          <TouchableOpacity
            style={styles.actionCard}
            activeOpacity={0.85}
            onPress={() => router.push('/escanear')}
          >
            <View style={[styles.actionIconContainer, { backgroundColor: '#DCFCE7' }]}>
              <Ionicons name="barcode-outline" size={28} color="#16A34A" />
            </View>
            <View style={styles.actionTextContainer}>
              <Text style={styles.actionCardTitle}>Escanear Código</Text>
              <Text style={styles.actionCardSubtitle}>
                Lectura óptica instantánea con cámara
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
          </TouchableOpacity>

          {/* Tarjeta 3: Ver Venta Actual */}
          <TouchableOpacity
            style={[styles.actionCard, styles.cartActionCard]}
            activeOpacity={0.85}
            onPress={() => router.push('/venta')}
          >
            <View style={[styles.actionIconContainer, { backgroundColor: Colors.primaryLight }]}>
              <Ionicons name="cart" size={28} color={Colors.primaryDark} />
            </View>
            <View style={styles.actionTextContainer}>
              <View style={styles.cartTitleRow}>
                <Text style={styles.actionCardTitle}>Ver Venta Actual</Text>
                {totalItems > 0 && (
                  <View style={styles.itemsBadge}>
                    <Text style={styles.itemsBadgeText}>{totalItems}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.actionCardSubtitle}>
                {totalItems === 0
                  ? 'Carrito vacío. Agrega medicamentos'
                  : `Total a cobrar: S/ ${totalAmount.toFixed(2)}`}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Información / Ayuda rápida */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color={Colors.primary} />
          <Text style={styles.infoBoxText}>
            Las transacciones aplican validación atómica ACID en Supabase con bloqueo de stock
            para evitar inconsistencias de inventario.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  heroBanner: {
    backgroundColor: Colors.primaryDark,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  heroIconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: 0.3,
  },
  heroSubtitle: {
    fontSize: 13,
    color: Colors.primaryLight,
    marginTop: 2,
  },
  cartSummaryCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cartSummaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  cartSummaryDivider: {
    width: 1,
    backgroundColor: Colors.cardBorder,
    marginVertical: 4,
  },
  cartSummaryLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  cartSummaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  cartSummaryTotal: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  actionGrid: {
    paddingHorizontal: 16,
    gap: 12,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cartActionCard: {
    borderColor: Colors.primaryLight,
    borderWidth: 1.5,
  },
  actionIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  actionTextContainer: {
    flex: 1,
  },
  cartTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemsBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  itemsBadgeText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '800',
  },
  actionCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  actionCardSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.primaryLight,
    marginHorizontal: 16,
    marginTop: 24,
    padding: 14,
    borderRadius: 12,
  },
  infoBoxText: {
    flex: 1,
    fontSize: 12,
    color: Colors.primaryDark,
    lineHeight: 16,
  },
});
