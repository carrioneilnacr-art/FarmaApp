/**
 * FarmaApp - Definiciones de Tipos TypeScript para Supabase / PostgreSQL
 * Proceso 1 (Atención y Venta) & Proceso 2 (Gestión y Corrección de Ventas)
 * Contratos de Base de Datos, Entidades, Movimientos de Stock y RPCs
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type MetodoPago = 'EFECTIVO' | 'TARJETA' | 'YAPE' | 'PLIN' | 'TRANSFERENCIA';

export type EstadoVenta =
  | 'ABIERTA'
  | 'PAGADA'
  | 'EMITIDA'
  | 'ANULADA'
  | 'DEVUELTA'
  | 'COMPLETADA';

export type TipoIncidencia =
  | 'ANULACION'
  | 'DEVOLUCION'
  | 'CORRECCION'
  | 'AGREGAR_PRODUCTO'
  | 'OTRO';

export type EstadoIncidencia = 'PENDIENTE' | 'PROCESADA' | 'CANCELADA';

export type TipoMovimientoStock = 'VENTA' | 'DEVOLUCION' | 'ANULACION' | 'AJUSTE';

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
      devoluciones: {
        Row: Devolucion;
        Insert: DevolucionInsert;
        Update: DevolucionUpdate;
      };
      detalle_devoluciones: {
        Row: DetalleDevolucion;
        Insert: DetalleDevolucionInsert;
        Update: DetalleDevolucionUpdate;
      };
      incidencias_ventas: {
        Row: IncidenciaVenta;
        Insert: IncidenciaVentaInsert;
        Update: IncidenciaVentaUpdate;
      };
      historial_ventas: {
        Row: HistorialVenta;
        Insert: HistorialVentaInsert;
        Update: HistorialVentaUpdate;
      };
      movimientos_stock: {
        Row: MovimientoStock;
        Insert: MovimientoStockInsert;
        Update: MovimientoStockUpdate;
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
      registrar_devolucion_atomica: {
        Args: {
          p_venta_id: string;
          p_items: Json;
          p_motivo: string;
        };
        Returns: RegistrarDevolucionResponse;
      };
      anular_venta_atomica: {
        Args: {
          p_venta_id: string;
          p_motivo: string;
          p_revertir_stock?: boolean;
        };
        Returns: AnularVentaResponse;
      };
      obtener_resumen_diario: {
        Args: {
          p_fecha?: string;
        };
        Returns: ResumenDiario;
      };
      registrar_incidencia_venta: {
        Args: {
          p_venta_id: string;
          p_tipo: string;
          p_descripcion: string;
        };
        Returns: { success: boolean; incidencia_id: string; mensaje: string };
      };
    };
    Enums: {
      metodo_pago: MetodoPago;
      estado_venta: EstadoVenta;
      tipo_incidencia: TipoIncidencia;
      tipo_movimiento_stock: TipoMovimientoStock;
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
  numero_venta?: string | null;
  subtotal?: number | null;
  total: number;
  cliente_nombre: string | null;
  cliente_documento: string | null;
  metodo_pago: MetodoPago;
  estado: EstadoVenta;
  comprobante_tipo?: string | null;
  comprobante_serie?: string | null;
  comprobante_numero?: string | null;
  venta_origen_id?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface VentaInsert {
  id?: string;
  codigo_venta: string;
  numero_venta?: string | null;
  subtotal?: number | null;
  total: number;
  cliente_nombre?: string | null;
  cliente_documento?: string | null;
  metodo_pago?: MetodoPago;
  estado?: EstadoVenta;
  comprobante_tipo?: string | null;
  comprobante_serie?: string | null;
  comprobante_numero?: string | null;
  venta_origen_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface VentaUpdate {
  id?: string;
  codigo_venta?: string;
  numero_venta?: string | null;
  subtotal?: number | null;
  total?: number;
  cliente_nombre?: string | null;
  cliente_documento?: string | null;
  metodo_pago?: MetodoPago;
  estado?: EstadoVenta;
  comprobante_tipo?: string | null;
  comprobante_serie?: string | null;
  comprobante_numero?: string | null;
  venta_origen_id?: string | null;
  updated_at?: string;
}

// ==============================================================================
// 4. ENTIDAD: DETALLE_VENTA
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

// ==============================================================================
// 5. ENTIDADES PROCESO 2: DEVOLUCIONES, INCIDENCIAS, HISTORIAL Y STOCK
// ==============================================================================
export interface Devolucion {
  id: string;
  venta_id: string;
  codigo_devolucion: string;
  fecha: string;
  motivo: string;
  estado: string;
  total_devuelto: number;
  created_at: string;
}

export interface DevolucionInsert {
  id?: string;
  venta_id: string;
  codigo_devolucion: string;
  fecha?: string;
  motivo: string;
  estado?: string;
  total_devuelto: number;
  created_at?: string;
}

export interface DevolucionUpdate {
  id?: string;
  motivo?: string;
  estado?: string;
  total_devuelto?: number;
}

export interface DetalleDevolucion {
  id: string;
  devolucion_id: string;
  producto_id: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  created_at: string;
  productos?: Producto | null;
}

export interface DetalleDevolucionInsert {
  id?: string;
  devolucion_id: string;
  producto_id: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  created_at?: string;
}

export interface DetalleDevolucionUpdate {
  id?: string;
  cantidad?: number;
  precio_unitario?: number;
  subtotal?: number;
}

export interface IncidenciaVenta {
  id: string;
  venta_id: string;
  tipo: TipoIncidencia;
  descripcion: string;
  estado: EstadoIncidencia;
  created_at: string;
  updated_at: string;
}

export interface IncidenciaVentaInsert {
  id?: string;
  venta_id: string;
  tipo: TipoIncidencia;
  descripcion: string;
  estado?: EstadoIncidencia;
  created_at?: string;
  updated_at?: string;
}

export interface IncidenciaVentaUpdate {
  id?: string;
  tipo?: TipoIncidencia;
  descripcion?: string;
  estado?: EstadoIncidencia;
  updated_at?: string;
}

export interface HistorialVenta {
  id: string;
  venta_id: string;
  evento: string;
  descripcion: string | null;
  estado_anterior?: string | null;
  estado_nuevo?: string | null;
  metadata?: any;
  created_at: string;
}

export interface HistorialVentaInsert {
  id?: string;
  venta_id: string;
  evento: string;
  descripcion?: string | null;
  estado_anterior?: string | null;
  estado_nuevo?: string | null;
  metadata?: any;
  created_at?: string;
}

export interface HistorialVentaUpdate {
  id?: string;
  evento?: string;
  descripcion?: string | null;
}

export interface MovimientoStock {
  id: string;
  producto_id: string;
  tipo: TipoMovimientoStock;
  cantidad: number;
  stock_anterior: number;
  stock_nuevo: number;
  referencia_tipo?: string | null;
  referencia_id?: string | null;
  motivo?: string | null;
  created_at: string;
  productos?: Producto | null;
}

export interface MovimientoStockInsert {
  id?: string;
  producto_id: string;
  tipo: TipoMovimientoStock;
  cantidad: number;
  stock_anterior: number;
  stock_nuevo: number;
  referencia_tipo?: string | null;
  referencia_id?: string | null;
  motivo?: string | null;
  created_at?: string;
}

export interface MovimientoStockUpdate {
  id?: string;
  motivo?: string | null;
}

// Venta completa con todas sus relaciones para la pantalla de detalle
export interface VentaCompleta extends Venta {
  detalle_ventas: DetalleVentaConProducto[];
  devoluciones?: (Devolucion & { detalle_devoluciones?: DetalleDevolucion[] })[];
  incidencias_ventas?: IncidenciaVenta[];
  historial_ventas?: HistorialVenta[];
  venta_origen?: Venta | null;
}

// Resumen diario del negocio para el dueño
export interface ResumenDiario {
  fecha: string;
  ventas_realizadas: number;
  total_vendido: number;
  ventas_anuladas: number;
  devoluciones: number;
  productos_vendidos: number;
  productos_devueltos: number;
}

// ==============================================================================
// 6. CONTRATOS RPC
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
  venta_origen_id?: string;
}

export interface RegistrarVentaResponse {
  success: boolean;
  venta_id: string;
  codigo_venta: string;
  numero_venta?: string;
  total: number;
  items_procesados: number;
  fecha: string;
  estado?: EstadoVenta;
  comprobante?: string;
  mensaje: string;
}

export interface ItemDevolucionPayload {
  producto_id: string;
  cantidad: number;
}

export interface RegistrarDevolucionPayload {
  venta_id: string;
  items: ItemDevolucionPayload[];
  motivo: string;
}

export interface RegistrarDevolucionResponse {
  success: boolean;
  devolucion_id: string;
  codigo_devolucion: string;
  total_devuelto: number;
  nuevo_estado: EstadoVenta;
  mensaje: string;
}

export interface AnularVentaPayload {
  venta_id: string;
  motivo: string;
  revertir_stock?: boolean;
}

export interface AnularVentaResponse {
  success: boolean;
  venta_id: string;
  codigo_venta: string;
  nuevo_estado: EstadoVenta;
  mensaje: string;
}

// ==============================================================================
// 7. TIPO PARA ITEM DEL CARRITO EN FRONTEND (POS)
// ==============================================================================
export interface CartItem {
  producto: Producto;
  cantidad: number;
  subtotal: number;
}
