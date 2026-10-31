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
  MessageSquare,
  Copy,
  Check,
  MapPin
} from 'lucide-react';
import { PROVINCIAS_RD } from '../data/mockData';
import { getTodayString, getYesterdayString, formatDateLabel } from '../utils/csvHelper';

interface FilterBarProps {
  selectedHub: 'all' | HubId;
  onSelectHub: (hub: 'all' | HubId) => void;
  selectedService: ServiceFilterType;
  onSelectService: (service: ServiceFilterType) => void;
  statusFilter: 'all' | DeliveryStatus;
  onSelectStatus: (status: 'all' | DeliveryStatus) => void;
  selectedProvincia: string;
  onSelectProvincia: (provincia: string) => void;
  availableProvincias: { name: string; count: number }[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedDate: string;
  onDateChange: (date: string) => void;
  onShiftDate: (days: number) => void;
  onCapturePng: () => void;
  isCapturing: boolean;
  onCopyReportWithPhoto: () => void;
  isCopying: boolean;
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
  autoSyncInterval: number; // 0 = off, 30, 60, 120, 300
  onSetAutoSyncInterval: (interval: number) => void;
  lastSyncTime?: Date | null;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  selectedHub,
  onSelectHub,
  selectedService,
  onSelectService,
  statusFilter,
  onSelectStatus,
  selectedProvincia,
  onSelectProvincia,
  availableProvincias,
  searchQuery,
  onSearchChange,
  selectedDate,
  onDateChange,
  onShiftDate,
  onCapturePng,
  isCapturing,
  onCopyReportWithPhoto,
  isCopying,
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
  totalFilteredCount,
  autoSyncInterval,
  onSetAutoSyncInterval,
  lastSyncTime
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

  const today = getTodayString();
  const yesterday = getYesterdayString();

  const handleSetToday = () => {
    onDateChange(today);
  };

  const handleSetYesterday = () => {
    onDateChange(yesterday);
  };

  const handleSetAllDates = () => {
    onDateChange('');
  };

  const isTodayActive = selectedDate === today;
  const isYesterdayActive = selectedDate === yesterday;
  const isAllDatesActive = !selectedDate;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3.5">
      {/* 1. Fila Superior: Filtro de Fecha por Día + Botonera Ejecutiva */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        {/* Selector de Fecha Por Día (con navegación ◀ / ▶) */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-300 rounded-xl p-1.5 text-xs shadow-2xs">
            <span className="px-2 font-bold text-slate-800 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              Fecha:
            </span>

            {/* Botón día anterior */}
            <button
              onClick={() => onShiftDate(-1)}
              className="p-1 hover:bg-slate-200 rounded text-slate-700 transition cursor-pointer"
              title="Ir al día anterior (-1 día)"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Input de Fecha Específica */}
            <div className="bg-white px-2.5 py-1 rounded-lg border border-slate-300 flex items-center gap-1.5">
              <input
                id="filter-single-date"
                type="date"
                value={selectedDate}
                onChange={(e) => onDateChange(e.target.value)}
                className="bg-transparent text-xs font-mono font-bold text-slate-900 focus:outline-none cursor-pointer"
                title="Filtrar despachos por día"
              />
            </div>

            {/* Botón día siguiente */}
            <button
              onClick={() => onShiftDate(1)}
              className="p-1 hover:bg-slate-200 rounded text-slate-700 transition cursor-pointer"
              title="Ir al día siguiente (+1 día)"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Botones de Selección Rápida */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleSetToday}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition cursor-pointer ${
                isTodayActive
                  ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
              title={`Filtrar despachos de hoy (${formatDateLabel(today)})`}
            >
              Hoy ({formatDateLabel(today)})
            </button>

            <button
              onClick={handleSetYesterday}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition cursor-pointer ${
                isYesterdayActive
                  ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
              title={`Filtrar despachos de ayer (${formatDateLabel(yesterday)})`}
            >
              Ayer ({formatDateLabel(yesterday)})
            </button>

            <button
              onClick={handleSetAllDates}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition cursor-pointer ${
                isAllDatesActive
                  ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
              title="Ver todas las fechas"
            >
              Ver Todas
            </button>
          </div>
        </div>

        {/* Acciones Rápidas Ejecutivas */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* NUEVO BOTÓN: Copiar Reporte con Foto al Portapapeles */}
          <button
            onClick={onCopyReportWithPhoto}
            disabled={isCopying}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-lg transition shadow-2xs cursor-pointer disabled:opacity-50"
            title="Copiar imagen del cuadro y resumen al portapapeles para pegar directo (Ctrl+V) en WhatsApp"
          >
            <Copy className={`w-3.5 h-3.5 text-blue-200 ${isCopying ? 'animate-pulse' : ''}`} />
            <span>{isCopying ? 'Copiando foto...' : '📋 Copiar con Foto'}</span>
          </button>

          {/* Sincronizar Google Sheet con Selector de Auto-Refresco En Vivo */}
          <div className="flex items-center rounded-lg bg-slate-900 border border-slate-700 p-0.5 shadow-2xs">
            <button
              onClick={onSyncDirect}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-slate-800 text-white text-xs font-semibold rounded-md transition cursor-pointer disabled:opacity-50"
              title="Sincronizar datos en tiempo real con Google Sheets ahora"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar'}</span>
            </button>

            {/* Selector de intervalo Auto-Sync */}
            <div className="border-l border-slate-700 pl-1.5 pr-2 py-1 flex items-center gap-1 text-[11px]">
              <span className={`w-2 h-2 rounded-full ${autoSyncInterval > 0 ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
              <select
                value={autoSyncInterval}
                onChange={(e) => onSetAutoSyncInterval(Number(e.target.value))}
                className="bg-transparent text-slate-200 text-[11px] font-semibold focus:outline-none cursor-pointer pr-1"
                title="Configurar auto-actualización periódica en vivo desde Google Sheet"
              >
                <option value={0} className="bg-slate-900 text-white">Manual</option>
                <option value={30} className="bg-slate-900 text-white">⏱️ Cada 30s</option>
                <option value={60} className="bg-slate-900 text-white">⏱️ Cada 1 min</option>
                <option value={120} className="bg-slate-900 text-white">⏱️ Cada 2 min</option>
                <option value={300} className="bg-slate-900 text-white">⏱️ Cada 5 min</option>
              </select>
            </div>
          </div>

          {/* Capturar Reporte en Imagen PNG */}
          <button
            onClick={onCapturePng}
            disabled={isCapturing}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition shadow-2xs cursor-pointer disabled:opacity-50"
            title="Descargar imagen PNG para enviar por WhatsApp o correo a Gerencia"
          >
            <Camera className="w-3.5 h-3.5 text-blue-200" />
            <span>{isCapturing ? 'Generando...' : '📷 Capturar PNG'}</span>
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

      {/* 3. Filtro Territorial por Provincia (Botones Rápidos con Conteo de Unidades/Pedidos) */}
      <div className="flex flex-col gap-2 pt-1 border-t border-slate-100">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
            <MapPin className="w-3.5 h-3.5 text-rose-600" />
            <span>Filtrar por Provincia:</span>
            {selectedProvincia !== 'all' && (
              <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-200">
                Activa: {selectedProvincia}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => onSelectProvincia('all')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition cursor-pointer ${
              selectedProvincia === 'all'
                ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            Todas las Provincias
          </button>

          {availableProvincias.map(({ name, count }) => {
            const isSelected = selectedProvincia.toLowerCase() === name.toLowerCase();
            return (
              <button
                key={name}
                onClick={() => onSelectProvincia(isSelected ? 'all' : name)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition cursor-pointer ${
                  isSelected
                    ? 'bg-rose-600 text-white border-rose-600 shadow-2xs font-bold'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-rose-50 hover:border-rose-300'
                }`}
                title={`Filtrar despachos en ${name} (${count} registros)`}
              >
                <MapPin className={`w-3 h-3 ${isSelected ? 'text-rose-200' : 'text-rose-500'}`} />
                <span>{name}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                  isSelected ? 'bg-rose-800 text-rose-100' : 'bg-slate-100 text-slate-700'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}

          {/* Selector de todas las 32 provincias de RD */}
          <div className="inline-block">
            <select
              value={selectedProvincia}
              onChange={(e) => onSelectProvincia(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 font-semibold focus:outline-none focus:ring-1 focus:ring-rose-500 cursor-pointer"
            >
              <option value="all">📍 Ver todas las provincias ({PROVINCIAS_RD.length})...</option>
              {PROVINCIAS_RD.map((prov) => (
                <option key={prov} value={prov}>{prov}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 4. Barra de Búsqueda Integrada */}
      <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-100">
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
          {(searchQuery || selectedHub !== 'all' || selectedService !== 'all' || statusFilter !== 'all' || selectedProvincia !== 'all') && (
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
