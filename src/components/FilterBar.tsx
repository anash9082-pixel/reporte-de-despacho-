import React from 'react';
import { DeliveryStatus, HubId, ServiceFilterType } from '../types/delivery';
import { 
  Search, 
  X, 
  Plus, 
  FileSpreadsheet, 
  Download, 
  Camera, 
  RotateCcw,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Building2,
  Truck,
  RefreshCw,
  FileCode2,
  SlidersHorizontal,
  MessageSquare
} from 'lucide-react';

interface FilterBarProps {
  selectedHub: 'all' | HubId;
  onSelectHub: (hub: 'all' | HubId) => void;
  selectedService: ServiceFilterType;
  onSelectService: (service: ServiceFilterType) => void;
  statusFilter: 'all' | DeliveryStatus;
  onSelectStatus: (status: 'all' | DeliveryStatus) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedDate: string;
  onDateChange: (date: string) => void;
  onCapturePng: () => void;
  isCapturing: boolean;
  onOpenNewModal: () => void;
  onOpenSheetsModal: () => void;
  onSyncDirect: () => void;
  isSyncing: boolean;
  onExportCSV: () => void;
  onExportHtml: () => void;
  onResetData: () => void;
  onOpenColumnsModal: () => void;
  onOpenWhatsAppModal: () => void;
  visibleColumnsCount?: number;
  totalFilteredCount: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  selectedHub,
  onSelectHub,
  selectedService,
  onSelectService,
  statusFilter,
  onSelectStatus,
  searchQuery,
  onSearchChange,
  selectedDate,
  onDateChange,
  onCapturePng,
  isCapturing,
  onOpenNewModal,
  onOpenSheetsModal,
  onSyncDirect,
  isSyncing,
  onExportCSV,
  onExportHtml,
  onResetData,
  onOpenColumnsModal,
  onOpenWhatsAppModal,
  visibleColumnsCount,
  totalFilteredCount
}) => {
  const hubTabs: { id: 'all' | HubId; label: string; countText?: string }[] = [
    { id: 'all', label: 'Consolidado Nacional (Ambas Sedes)' },
    { id: 'santodomingo', label: 'Sede Santo Domingo' },
    { id: 'santiago', label: 'Sede Santiago de los Caballeros' }
  ];

  const serviceTabs: { id: ServiceFilterType; label: string }[] = [
    { id: 'all', label: 'Todos los Servicios' },
    { id: 'propia', label: 'Flota Propia' },
    { id: 'blanco', label: 'Transporte Blanco' }
  ];

  const handleShiftDate = (days: number) => {
    const baseDate = selectedDate ? new Date(selectedDate + 'T12:00:00') : new Date('2026-10-25T12:00:00');
    baseDate.setDate(baseDate.getDate() + days);
    onDateChange(baseDate.toISOString().slice(0, 10));
  };

  const handleSetToday = () => {
    onDateChange('2026-10-25');
  };

  const handleSetAllDates = () => {
    onDateChange('');
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3.5">
      {/* 1. Fila Superior: Selector de Fecha + Botonera de Acciones Ejecutivas */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        {/* Selector de Fecha */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="flex items-center gap-1 bg-slate-100 border border-slate-300 rounded-lg p-1 text-xs">
            <span className="px-2 font-bold text-slate-700 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              Fecha:
            </span>
            <button
              onClick={() => handleShiftDate(-1)}
              className="p-1 hover:bg-slate-200 rounded text-slate-600 cursor-pointer"
              title="Día anterior"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="bg-white px-2 py-0.5 rounded border border-slate-300 text-xs font-mono font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600 cursor-pointer"
            />
            <button
              onClick={() => handleShiftDate(1)}
              className="p-1 hover:bg-slate-200 rounded text-slate-600 cursor-pointer"
              title="Día siguiente"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={handleSetToday}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition cursor-pointer ${
              selectedDate === '2026-10-25'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Hoy (25 Oct)
          </button>

          <button
            onClick={handleSetAllDates}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition cursor-pointer ${
              !selectedDate
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Ver Todas
          </button>
        </div>

        {/* Acciones Rápidas Ejecutivas */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Sincronizar Google Sheet */}
          <button
            onClick={onSyncDirect}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition shadow-2xs cursor-pointer disabled:opacity-50"
            title="Sincronizar datos en tiempo real con Google Sheets"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar Sheet'}</span>
          </button>

          {/* Capturar Reporte en Imagen PNG */}
          <button
            onClick={onCapturePng}
            disabled={isCapturing}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition shadow-2xs cursor-pointer disabled:opacity-50"
            title="Descargar imagen PNG para enviar por WhatsApp o correo a Gerencia"
          >
            <Camera className="w-3.5 h-3.5 text-blue-200" />
            <span>{isCapturing ? 'Generando...' : '📷 Capturar para Gerencia'}</span>
          </button>

          {/* Enviar Reporte a WhatsApp Gerencia con Modal Interactivo */}
          <button
            onClick={onOpenWhatsAppModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition shadow-2xs cursor-pointer"
            title="Personalizar y enviar reporte por WhatsApp a Gerencia"
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-100" />
            <span>💬 WhatsApp Gerencia</span>
          </button>

          {/* Configurar Google Sheet Modal */}
          <button
            onClick={onOpenSheetsModal}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 text-xs font-semibold rounded-lg transition cursor-pointer"
            title="Configurar URL / Script de Google Sheets"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Config Sheet</span>
          </button>

          {/* Personalizar Columnas Visibles */}
          <button
            onClick={onOpenColumnsModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-semibold rounded-lg transition shadow-2xs cursor-pointer"
            title="Seleccionar campos visibles para el reporte y la captura"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
            <span>Columnas {visibleColumnsCount !== undefined ? `(${visibleColumnsCount})` : ''}</span>
          </button>

          {/* Nueva Entrega */}
          <button
            onClick={onOpenNewModal}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-semibold rounded-lg transition cursor-pointer"
            title="Agregar un despacho manual"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Entrega</span>
          </button>

          {/* Descargar HTML autónomo */}
          <button
            onClick={onExportHtml}
            className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg transition cursor-pointer"
            title="Descargar archivo HTML independiente para abrir sin servidor"
          >
            <FileCode2 className="w-4 h-4 text-slate-700" />
          </button>

          {/* Descargar CSV */}
          <button
            onClick={onExportCSV}
            className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg transition cursor-pointer"
            title="Descargar reporte en formato CSV"
          >
            <Download className="w-4 h-4 text-slate-700" />
          </button>
        </div>
      </div>

      {/* 2. Pestañas de Unificación de Sedes (Santo Domingo vs Santiago) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Segmented control para las Sedes */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 w-full sm:w-auto overflow-x-auto">
          {hubTabs.map((tab) => {
            const isActive = selectedHub === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectHub(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-lg transition whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Building2 className={`w-3.5 h-3.5 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Filtros secundarios: Tipo de servicio (Propia vs Blanco) y Estado */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Selector de Servicio */}
          <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg border border-slate-200 text-xs">
            {serviceTabs.map((s) => (
              <button
                key={s.id}
                onClick={() => onSelectService(s.id)}
                className={`px-2.5 py-1 font-semibold rounded-md transition cursor-pointer ${
                  selectedService === s.id
                    ? 'bg-white text-slate-900 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Selector de Estado */}
          <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => onSelectStatus('all')}
              className={`px-2.5 py-1 font-semibold rounded-md transition cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-900 font-bold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => onSelectStatus('Entregado')}
              className={`px-2.5 py-1 font-semibold rounded-md transition cursor-pointer ${
                statusFilter === 'Entregado'
                  ? 'bg-emerald-600 text-white font-bold shadow-2xs'
                  : 'text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              Entregados
            </button>
            <button
              onClick={() => onSelectStatus('Pendiente')}
              className={`px-2.5 py-1 font-semibold rounded-md transition cursor-pointer ${
                statusFilter === 'Pendiente'
                  ? 'bg-amber-600 text-white font-bold shadow-2xs'
                  : 'text-amber-700 hover:bg-amber-50'
              }`}
            >
              Pendientes
            </button>
          </div>
        </div>
      </div>

      {/* 3. Barra de Búsqueda Integrada */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div className="relative flex-1 max-w-lg">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por chofer, unidad, ruta, provincia o detalle de carga..."
            className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium shrink-0">
          <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
            {totalFilteredCount} {totalFilteredCount === 1 ? 'unidad' : 'unidades'} en pantalla
          </span>
          {(searchQuery || selectedHub !== 'all' || selectedService !== 'all' || statusFilter !== 'all') && (
            <button
              onClick={onResetData}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer underline flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Limpiar filtros
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
