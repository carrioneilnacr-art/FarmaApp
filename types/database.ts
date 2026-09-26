/**
 * FarmaApp - Definiciones de Tipos TypeScript para Supabase / PostgreSQL
 * Contratos de Base de Datos, Entidades y Parámetros RPC
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type MetodoPago = 'EFECTIVO' | 'TARJETA' | 'YAPE' | 'PLIN' | 'TRANSFERENCIA';
export type EstadoVenta = 'COMPLETADA' | 'ANULADA' | 'PENDIENTE';

export interface Database {
  public: {
    Tables: {
      categorias: {
        Row: Categoria;
        Insert: CategoriaInsert;
        Update: CategoriaUpdate;
      };
      productos: {
        Row: Producto;
        Insert: ProductoInsert;
        Update: ProductoUpdate;
      };
      ventas: {
        Row: Venta;
        Insert: VentaInsert;
        Update: VentaUpdate;
      };
      detalle_ventas: {
        Row: DetalleVenta;
        Insert: DetalleVentaInsert;
        Update: DetalleVentaUpdate;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      registrar_venta_atomica: {
        Args: {
          p_items: Json;
          p_cliente_nombre?: string | null;
          p_cliente_documento?: string | null;
          p_metodo_pago?: string | null;
        };
        Returns: RegistrarVentaResponse;
      };
    };
    Enums: {
      metodo_pago: MetodoPago;
      estado_venta: EstadoVenta;
    };
  };
}

// ==============================================================================
// 1. ENTIDAD: CATEGORIA
// ==============================================================================
export interface Categoria {
  id: string;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface CategoriaInsert {
  id?: string;
  nombre: string;
  descripcion?: string | null;
  activo?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CategoriaUpdate {
  id?: string;
  nombre?: string;
  descripcion?: string | null;
  activo?: boolean;
  updated_at?: string;
}

// ==============================================================================
// 2. ENTIDAD: PRODUCTO
// ==============================================================================
export interface Producto {
  id: string;
  categoria_id: string;
  codigo_barras: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
  stock: number;
  stock_minimo: number;
  imagen_url: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductoInsert {
  id?: string;
  categoria_id: string;
  codigo_barras: string;
  nombre: string;
  descripcion?: string | null;
  precio: number;
  stock?: number;
  stock_minimo?: number;
  imagen_url?: string | null;
  activo?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ProductoUpdate {
  id?: string;
  categoria_id?: string;
  codigo_barras?: string;
  nombre?: string;
  descripcion?: string | null;
  precio?: number;
  stock?: number;
  stock_minimo?: number;
  imagen_url?: string | null;
  activo?: boolean;
  updated_at?: string;
}

export interface ProductoConCategoria extends Producto {
  categorias?: Categoria | null;
}

// ==============================================================================
// 3. ENTIDAD: VENTA
// ==============================================================================
export interface Venta {
  id: string;
  codigo_venta: string;
  total: number;
  cliente_nombre: string | null;
  cliente_documento: string | null;
  metodo_pago: MetodoPago;
  estado: EstadoVenta;
  created_at: string;
}

export interface VentaInsert {
  id?: string;
  codigo_venta: string;
  total: number;
  cliente_nombre?: string | null;
  cliente_documento?: string | null;
  metodo_pago?: MetodoPago;
  estado?: EstadoVenta;
  created_at?: string;
}

export interface VentaUpdate {
  id?: string;
  codigo_venta?: string;
  total?: number;
  cliente_nombre?: string | null;
  cliente_documento?: string | null;
  metodo_pago?: MetodoPago;
  estado?: EstadoVenta;
}

// ==============================================================================
// 4. ENTIDAD: DETALLE DE VENTA
// ==============================================================================
export interface DetalleVenta {
  id: string;
  venta_id: string;
  producto_id: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  created_at: string;
}

export interface DetalleVentaInsert {
  id?: string;
  venta_id: string;
  producto_id: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  created_at?: string;
}

export interface DetalleVentaUpdate {
  id?: string;
  venta_id?: string;
  producto_id?: string;
  cantidad?: number;
  precio_unitario?: number;
  subtotal?: number;
}

export interface DetalleVentaConProducto extends DetalleVenta {
  productos?: Producto | null;
}

export interface VentaCompleta extends Venta {
  detalle_ventas: DetalleVentaConProducto[];
}

// ==============================================================================
// 5. CONTRATOS RPC (registrar_venta_atomica)
// ==============================================================================
export interface RegistrarVentaItemPayload {
  producto_id: string;
  cantidad: number;
}

export interface RegistrarVentaPayload {
  items: RegistrarVentaItemPayload[];
  cliente_nombre?: string;
  cliente_documento?: string;
  metodo_pago?: MetodoPago;
}

export interface RegistrarVentaResponse {
  success: boolean;
  venta_id: string;
  codigo_venta: string;
  total: number;
  items_procesados: number;
  fecha: string;
  mensaje: string;
}

// ==============================================================================
// 6. TIPO PARA ITEM DEL CARRITO EN FRONTEND (POS)
// ==============================================================================
export interface CartItem {
  producto: Producto;
  cantidad: number;
  subtotal: number;
}
