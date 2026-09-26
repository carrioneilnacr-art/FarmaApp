import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { CartItem, MetodoPago, Producto, ProductoConCategoria, RegistrarVentaResponse } from '../types/database';
import { saleRepository } from '../repositories/saleRepository';

interface AddItemResult {
  success: boolean;
  message?: string;
}

interface CartContextType {
  items: CartItem[];
  totalAmount: number;
  totalItems: number;
  addItem: (producto: Producto | ProductoConCategoria, cantidad?: number) => AddItemResult;
  removeItem: (productoId: string) => void;
  incrementItem: (productoId: string) => AddItemResult;
  decrementItem: (productoId: string) => void;
  updateQuantity: (productoId: string, cantidad: number) => AddItemResult;
  clearCart: () => void;
  getItemQuantity: (productoId: string) => number;
  isProcessing: boolean;
  processSale: (params?: {
    clienteNombre?: string;
    clienteDocumento?: string;
    metodoPago?: MetodoPago;
  }) => Promise<RegistrarVentaResponse>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Cantidad actual en carrito de un producto
  const getItemQuantity = useCallback(
    (productoId: string): number => {
      const item = items.find((i) => i.producto.id === productoId);
      return item ? item.cantidad : 0;
    },
    [items]
  );

  // Agregar producto al carrito respetando stock
  const addItem = useCallback(
    (producto: Producto | ProductoConCategoria, cantidad: number = 1): AddItemResult => {
      if (cantidad <= 0) {
        return { success: false, message: 'La cantidad debe ser mayor a 0' };
      }

      if (producto.stock <= 0) {
        return { success: false, message: `"${producto.nombre}" está agotado.` };
      }

      let result: AddItemResult = { success: true };

      setItems((prevItems) => {
        const existingIndex = prevItems.findIndex((i) => i.producto.id === producto.id);

        if (existingIndex > -1) {
          const existingItem = prevItems[existingIndex];
          const newQty = existingItem.cantidad + cantidad;

          if (newQty > producto.stock) {
            result = {
              success: false,
              message: `Stock insuficiente. Solo quedan ${producto.stock} unidades de "${producto.nombre}".`,
            };
            return prevItems;
          }

          const updated = [...prevItems];
          const unitPrice = Number(producto.precio);
          updated[existingIndex] = {
            ...existingItem,
            cantidad: newQty,
            subtotal: Number((newQty * unitPrice).toFixed(2)),
          };
          result = { success: true, message: `Se actualizó la cantidad de "${producto.nombre}".` };
          return updated;
        } else {
          if (cantidad > producto.stock) {
            result = {
              success: false,
              message: `Stock insuficiente. Solo quedan ${producto.stock} unidades de "${producto.nombre}".`,
            };
            return prevItems;
          }

          const unitPrice = Number(producto.precio);
          const newItem: CartItem = {
            producto,
            cantidad,
            subtotal: Number((cantidad * unitPrice).toFixed(2)),
          };
          result = { success: true, message: `"${producto.nombre}" agregado a la venta.` };
          return [...prevItems, newItem];
        }
      });

      return result;
    },
    []
  );

  // Incrementar 1 unidad
  const incrementItem = useCallback(
    (productoId: string): AddItemResult => {
      let result: AddItemResult = { success: true };

      setItems((prevItems) => {
        const existingIndex = prevItems.findIndex((i) => i.producto.id === productoId);
        if (existingIndex === -1) {
          result = { success: false, message: 'Producto no encontrado en el carrito' };
          return prevItems;
        }

        const existingItem = prevItems[existingIndex];
        const newQty = existingItem.cantidad + 1;

        if (newQty > existingItem.producto.stock) {
          result = {
            success: false,
            message: `Máximo stock alcanzado (${existingItem.producto.stock} uds).`,
          };
          return prevItems;
        }

        const updated = [...prevItems];
        const unitPrice = Number(existingItem.producto.precio);
        updated[existingIndex] = {
          ...existingItem,
          cantidad: newQty,
          subtotal: Number((newQty * unitPrice).toFixed(2)),
        };
        return updated;
      });

      return result;
    },
    []
  );

  // Decrementar 1 unidad
  const decrementItem = useCallback((productoId: string) => {
    setItems((prevItems) => {
      const existingIndex = prevItems.findIndex((i) => i.producto.id === productoId);
      if (existingIndex === -1) return prevItems;

      const existingItem = prevItems[existingIndex];
      const newQty = existingItem.cantidad - 1;

      if (newQty <= 0) {
        return prevItems.filter((i) => i.producto.id !== productoId);
      }

      const updated = [...prevItems];
      const unitPrice = Number(existingItem.producto.precio);
      updated[existingIndex] = {
        ...existingItem,
        cantidad: newQty,
        subtotal: Number((newQty * unitPrice).toFixed(2)),
      };
      return updated;
    });
  }, []);

  // Actualizar cantidad directa
  const updateQuantity = useCallback((productoId: string, cantidad: number): AddItemResult => {
    if (cantidad <= 0) {
      setItems((prev) => prev.filter((i) => i.producto.id !== productoId));
      return { success: true, message: 'Producto eliminado del carrito' };
    }

    let result: AddItemResult = { success: true };

    setItems((prevItems) => {
      const existingIndex = prevItems.findIndex((i) => i.producto.id === productoId);
      if (existingIndex === -1) {
        result = { success: false, message: 'Producto no encontrado' };
        return prevItems;
      }

      const existingItem = prevItems[existingIndex];
      if (cantidad > existingItem.producto.stock) {
        result = {
          success: false,
          message: `Stock insuficiente. Máximo disponible: ${existingItem.producto.stock}.`,
        };
        return prevItems;
      }

      const updated = [...prevItems];
      const unitPrice = Number(existingItem.producto.precio);
      updated[existingIndex] = {
        ...existingItem,
        cantidad,
        subtotal: Number((cantidad * unitPrice).toFixed(2)),
      };
      return updated;
    });

    return result;
  }, []);

  // Eliminar producto
  const removeItem = useCallback((productoId: string) => {
    setItems((prev) => prev.filter((i) => i.producto.id !== productoId));
  }, []);

  // Limpiar carrito
  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  // Totales
  const totalAmount = useMemo(() => {
    const sum = items.reduce((acc, item) => acc + item.subtotal, 0);
    return Number(sum.toFixed(2));
  }, [items]);

  const totalItems = useMemo(() => {
    return items.reduce((acc, item) => acc + item.cantidad, 0);
  }, [items]);

  // Procesar venta llamando a Supabase RPC
  const processSale = useCallback(
    async (params?: {
      clienteNombre?: string;
      clienteDocumento?: string;
      metodoPago?: MetodoPago;
    }): Promise<RegistrarVentaResponse> => {
      if (items.length === 0) {
        throw new Error('El carrito está vacío');
      }

      setIsProcessing(true);
      try {
        const response = await saleRepository.processSale({
          items,
          clienteNombre: params?.clienteNombre,
          clienteDocumento: params?.clienteDocumento,
          metodoPago: params?.metodoPago || 'EFECTIVO',
        });

        // Limpiar carrito si la venta fue exitosa
        if (response.success) {
          clearCart();
        }

        return response;
      } finally {
        setIsProcessing(false);
      }
    },
    [items, clearCart]
  );

  return (
    <CartContext.Provider
      value={{
        items,
        totalAmount,
        totalItems,
        addItem,
        removeItem,
        incrementItem,
        decrementItem,
        updateQuantity,
        clearCart,
        getItemQuantity,
        isProcessing,
        processSale,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart debe ser utilizado dentro de un CartProvider');
  }
  return context;
};
