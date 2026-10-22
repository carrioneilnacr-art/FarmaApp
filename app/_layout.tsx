import React from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { TouchableOpacity, View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CartProvider, useCart } from '../context/CartContext';
import { Colors } from '../theme/colors';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { LoginScreen } from '../components/LoginScreen';

function CartHeaderButton() {
  const router = useRouter();
  const { totalItems } = useCart();

  return (
    <TouchableOpacity
      style={styles.cartButton}
      onPress={() => router.push('/venta')}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      activeOpacity={0.7}
    >
      <Ionicons name="cart" size={24} color={Colors.white} />
      {totalItems > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {totalItems > 99 ? '99+' : totalItems}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function RootNavigator() {
  const { session, role, loading } = useAuth();
  if (loading) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={Colors.secondary} /></View>;
  if (!session || !role) return <LoginScreen />;
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: Colors.primaryDark,
          },
          headerTintColor: Colors.white,
          headerTitleStyle: {
            fontWeight: 'bold',
            fontSize: 18,
          },
          headerShadowVisible: false,
          contentStyle: {
            backgroundColor: Colors.background,
          },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: 'FarmaApp',
            headerRight: () => <CartHeaderButton />,
          }}
        />
        <Stack.Screen
          name="buscar"
          options={{
            title: 'Buscar Medicamento',
            headerRight: () => <CartHeaderButton />,
          }}
        />
        <Stack.Screen
          name="escanear"
          options={{
            title: 'Escanear Código',
            headerShown: false, // El escáner tiene su propio header transparente
          }}
        />
        <Stack.Screen
          name="venta"
          options={{
            title: 'Resumen de Venta',
          }}
        />
        <Stack.Screen name="inventario" options={{ title: 'Inventario' }} />
        <Stack.Screen name="asistente" options={{ title: 'Asistente IA' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider><CartProvider><RootNavigator /></CartProvider></AuthProvider>
  );
}

const styles = StyleSheet.create({
  cartButton: {
    padding: 6,
    position: 'relative',
    marginRight: 4,
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 0,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: Colors.primaryDark,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '800',
  },
});
