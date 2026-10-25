export type DeliveryStatus = 'Entregado' | 'Pendiente';

export type BlockId = 
  | 'santodomingo_propia'
  | 'santiago_propia'
  | 'santodomingo_blanco'
  | 'santiago_blanco';

export interface DeliveryItem {
  id: string;
  fecha: string;         // Fecha de Despacho (YYYY-MM-DD o DD/MM/YYYY)
  origen: string;        // Origen / Base
  blockId: BlockId;
  unidad: string;        // Unidad de Entrega (Vehículo/Ficha)
  chofer: string;        // Chofer
  ayudante: string;      // Ayudante (o "N/A")
  provincia: string;     // Provincia (Destino)
  bultos: number;        // Cantidad de Bultos
  estado: DeliveryStatus; // Estado
  observacion: string;   // Observación
  farmacia?: string;     // Farmacia / Distribuidora
  numeroPedido?: string; // Número de Pedido
  horaDespacho?: string; // Hora opcional
}

export type HubId = 'santodomingo' | 'santiago';
export type ServiceFilterType = 'all' | 'propia' | 'blanco';

export interface HubMeta {
  id: HubId;
  titulo: string;
  subtitulo: string;
  sede: string;
  badgeLabel: string;
  accentBorder: string;
  accentBadge: string;
}

export interface BlockMeta {
  id: BlockId;
  titulo: string;
  subtitulo: string;
  tipo: 'propia' | 'tercerizado';
  sede: 'Santo Domingo' | 'Santiago';
  badgeLabel: string;
  headerBg: string;
}

export interface KPIData {
  totalEntregas: number;
  totalEntregados: number;
  totalPendientes: number;
  totalBultos: number;
  bultosEntregados: number;
  bultosPendientes: number;
  porcentajeCompletado: number;
}

export type ColumnKey =
  | 'unidad'
  | 'chofer'
  | 'ayudante'
  | 'provincia'
  | 'farmacia'
  | 'numeroPedido'
  | 'entregados'
  | 'pendientes'
  | 'totalViajes'
  | 'bultos'
  | 'efectividad'
  | 'observacion'
  | 'acciones';

export interface ColumnDefinition {
  id: ColumnKey;
  label: string;
  category: 'informacion' | 'metricas' | 'control';
  required?: boolean;
}

export type VisibleColumns = Record<ColumnKey, boolean>;

export const DEFAULT_VISIBLE_COLUMNS: VisibleColumns = {
  unidad: true,
  chofer: true,
  ayudante: true,
  provincia: true,
  farmacia: false,
  numeroPedido: false,
  entregados: true,
  pendientes: true,
  totalViajes: true,
  bultos: true,
  efectividad: true,
  observacion: true,
  acciones: true,
};

export const AVAILABLE_COLUMNS: ColumnDefinition[] = [
  { id: 'unidad', label: 'Unidad / Ficha / Servicio', category: 'informacion', required: true },
  { id: 'chofer', label: 'Chofer', category: 'informacion' },
  { id: 'ayudante', label: 'Ayudante', category: 'informacion' },
  { id: 'provincia', label: 'Ruta / Provincia', category: 'informacion' },
  { id: 'farmacia', label: 'Farmacia / Distribuidora', category: 'informacion' },
  { id: 'numeroPedido', label: 'Número de Pedido', category: 'informacion' },
  { id: 'entregados', label: 'Entregados (1/0)', category: 'metricas' },
  { id: 'pendientes', label: 'Pendientes (1/0)', category: 'metricas' },
  { id: 'totalViajes', label: 'Total Viajes', category: 'metricas' },
  { id: 'bultos', label: 'Cantidad de Bultos', category: 'metricas' },
  { id: 'efectividad', label: 'Efectividad (%)', category: 'metricas' },
  { id: 'observacion', label: 'Observación / Detalle', category: 'control' },
  { id: 'acciones', label: 'Acciones (Editar / Estado)', category: 'control' },
];
