import React, { useState, useEffect, useMemo } from 'react';
import { 
  BlockId, 
  DeliveryItem, 
  DeliveryStatus, 
  HubId,
  ServiceFilterType,
  KPIData,
  ColumnKey,
  VisibleColumns,
  DEFAULT_VISIBLE_COLUMNS
} from './types/delivery';
import { 
  INITIAL_DELIVERIES, 
  BLOCKS_CONFIG,
  HUBS_CONFIG,
  getHubFromItem,
  getServiceTypeFromItem
} from './data/mockData';
import { KPICards } from './components/KPICards';
import { FilterBar } from './components/FilterBar';
import { MasterExecutiveTable } from './components/MasterExecutiveTable';
import { FarmaciasTab } from './components/FarmaciasTab';
import { DeliveryFormModal } from './components/DeliveryFormModal';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';
import { ColumnVisibilityModal } from './components/ColumnVisibilityModal';
import { WhatsAppModal } from './components/WhatsAppModal';
import { exportDeliveriesToCSV, normalizeDateString } from './utils/csvHelper';
import { captureReportToPng } from './utils/captureHelper';
import { exportSingleFileHtml } from './utils/standaloneExporter';
import { 
  DEFAULT_SHEET_URL, 
  DEFAULT_SHEET_ID, 
  loadGoogleSheetDeliveries 
} from './services/googleSheetsService';
import { 
  Truck, 
  Plus, 
  FileSpreadsheet, 
  Download, 
  Camera, 
  Info,
  Calendar,
  FileCode2,
  RefreshCw,
  ExternalLink,
  Building2,
  CheckCircle2,
  Clock,
  SlidersHorizontal,
  MessageSquare,
  Store
} from 'lucide-react';

const STORAGE_KEY = 'rd_despachos_report_data_v4';
const SHEET_URL_KEY = 'rd_despachos_report_sheet_url_v4';
const VISIBLE_COLUMNS_KEY = 'rd_despachos_visible_columns_v4';

export default function App() {
  const [activeTab, setActiveTab] = useState<'consolidado' | 'farmacias'>('consolidado');
  const [startDate, setStartDate] = useState<string>('2026-10-25');
  const [endDate, setEndDate] = useState<string>('2026-10-25');

  const handleSetDateRange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
  };

  // Load deliveries from localStorage or fallback to initial mock data
  const [deliveries, setDeliveries] = useState<DeliveryItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return INITIAL_DELIVERIES;
  });

  // Saved Google Sheets URL (defaults to user's exact spreadsheet)
  const [activeSheetUrl, setActiveSheetUrl] = useState<string>(() => {
    try {
      return localStorage.getItem(SHEET_URL_KEY) || DEFAULT_SHEET_URL;
    } catch {
      return DEFAULT_SHEET_URL;
    }
  });

  // Unified Hub and Service Filters state
  const [selectedHub, setSelectedHub] = useState<'all' | HubId>('all');
  const [selectedService, setSelectedService] = useState<ServiceFilterType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | DeliveryStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState(false);
  const [isColumnsModalOpen, setIsColumnsModalOpen] = useState(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DeliveryItem | null>(null);
  const [defaultBlockForNew, setDefaultBlockForNew] = useState<BlockId>('santodomingo_propia');

  // Column visibility state (persisted)
  const [visibleColumns, setVisibleColumns] = useState<VisibleColumns>(() => {
    try {
      const saved = localStorage.getItem(VISIBLE_COLUMNS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return { ...DEFAULT_VISIBLE_COLUMNS, ...parsed, unidad: true };
        }
      }
    } catch {
      // ignore
    }
    return DEFAULT_VISIBLE_COLUMNS;
  });

  // Loading and capture states
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSyncingSheet, setIsSyncingSheet] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4500);
  };

  // Sync state with localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(deliveries));
    } catch {
      // ignore
    }
  }, [deliveries]);

  // Sync visible columns with localStorage
  useEffect(() => {
    try {
      localStorage.setItem(VISIBLE_COLUMNS_KEY, JSON.stringify(visibleColumns));
    } catch {
      // ignore
    }
  }, [visibleColumns]);

  const handleChangeColumn = (column: ColumnKey, value: boolean) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [column]: value
    }));
  };

  const handleSetAllColumns = (value: boolean) => {
    setVisibleColumns((prev) => {
      const updated = { ...prev };
      (Object.keys(updated) as ColumnKey[]).forEach((key) => {
        if (key === 'unidad') {
          updated[key] = true;
        } else {
          updated[key] = value;
        }
      });
      return updated;
    });
  };

  const handleApplyPreset = (preset: 'all' | 'executive' | 'compact') => {
    if (preset === 'all') {
      setVisibleColumns({
        unidad: true,
        chofer: true,
        ayudante: true,
        provincia: true,
        farmacia: true,
        numeroPedido: true,
        observacion: true,
        entregados: true,
        pendientes: true,
        totalViajes: true,
        bultos: true,
        efectividad: true,
        acciones: true
      });
      showToast('Mostrando todas las columnas del reporte.');
    } else if (preset === 'executive') {
      setVisibleColumns({
        unidad: true,
        chofer: true,
        ayudante: false,
        provincia: true,
        farmacia: false,
        numeroPedido: false,
        observacion: true,
        entregados: true,
        pendientes: true,
        totalViajes: true,
        bultos: true,
        efectividad: true,
        acciones: false
      });
      showToast('Vista Ejecutiva Gerencial aplicada.');
    } else if (preset === 'compact') {
      setVisibleColumns({
        unidad: true,
        chofer: true,
        ayudante: false,
        provincia: true,
        farmacia: false,
        numeroPedido: false,
        observacion: false,
        entregados: true,
        pendientes: false,
        totalViajes: true,
        bultos: true,
        efectividad: true,
        acciones: false
      });
      showToast('Vista Compacta (WhatsApp) aplicada.');
    }
  };

  const handleSaveSheetUrl = (url: string) => {
    setActiveSheetUrl(url);
    try {
      localStorage.setItem(SHEET_URL_KEY, url);
    } catch {
      // ignore
    }
  };

  // Sync directly from the user's Google Sheet
  const handleDirectSheetSync = async (notify: boolean = true) => {
    setIsSyncingSheet(true);
    try {
      const { items } = await loadGoogleSheetDeliveries(activeSheetUrl || DEFAULT_SHEET_URL);
      if (items && items.length > 0) {
        setDeliveries(items);
        if (notify) {
          showToast(`¡Sincronizado! Se cargaron ${items.length} despachos en vivo desde tu Google Sheet.`);
        }
      } else {
        if (notify) {
          showToast(`Conectado a Google Sheet. Mostrando datos consolidados.`);
        }
      }
    } catch (err: any) {
      console.warn('Error syncing sheet:', err);
      if (notify) {
        showToast('No se pudo conectar a Google Sheets en este momento. Usando datos guardados.');
      }
    } finally {
      setIsSyncingSheet(false);
    }
  };

  // Auto-sync on first mount
  useEffect(() => {
    handleDirectSheetSync(false);
  }, []);

  // Filter deliveries by date range (Desde - Hasta), unified Hub (SD / STI), service type, status, and search query
  const filteredDeliveries = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return deliveries.filter((item) => {
      // Date range filter (Desde - Hasta)
      if (startDate || endDate) {
        const itemNormDate = normalizeDateString(item.fecha);
        if (startDate && itemNormDate && itemNormDate < startDate) {
          return false;
        }
        if (endDate && itemNormDate && itemNormDate > endDate) {
          return false;
        }
      }

      // Unified Hub filter (Santo Domingo vs Santiago)
      if (selectedHub !== 'all') {
        const itemHub = getHubFromItem(item);
        if (itemHub !== selectedHub) {
          return false;
        }
      }

      // Service mode filter (Flota Propia vs Transporte Blanco)
      if (selectedService !== 'all') {
        const itemService = getServiceTypeFromItem(item);
        if (selectedService === 'propia' && itemService !== 'Flota Propia') return false;
        if (selectedService === 'blanco' && itemService !== 'Transporte Blanco') return false;
      }

      // Status filter
      if (statusFilter !== 'all') {
        const isEntregado = item.estado.toLowerCase().includes('entregad');
        if (statusFilter === 'Entregado' && !isEntregado) return false;
        if (statusFilter === 'Pendiente' && isEntregado) return false;
      }

      // Search query
      if (query) {
        const matchChofer = (item.chofer || '').toLowerCase().includes(query);
        const matchProvincia = (item.provincia || '').toLowerCase().includes(query);
        const matchUnidad = (item.unidad || '').toLowerCase().includes(query);
        const matchObs = (item.observacion || '').toLowerCase().includes(query);
        const matchAyudante = (item.ayudante || '').toLowerCase().includes(query);
        if (!matchChofer && !matchProvincia && !matchUnidad && !matchObs && !matchAyudante) {
          return false;
        }
      }
      return true;
    });
  }, [deliveries, startDate, endDate, selectedHub, selectedService, statusFilter, searchQuery]);

  // Overall KPIs
  const kpis: KPIData = useMemo(() => {
    const totalEntregas = filteredDeliveries.length;
    const totalEntregados = filteredDeliveries.filter((d) => d.estado.toLowerCase().includes('entregad')).length;
    const totalPendientes = filteredDeliveries.filter((d) => !d.estado.toLowerCase().includes('entregad')).length;
    const totalBultos = filteredDeliveries.reduce((acc, d) => acc + (Number(d.bultos) || 0), 0);
    const bultosEntregados = filteredDeliveries
      .filter((d) => d.estado.toLowerCase().includes('entregad'))
      .reduce((acc, d) => acc + (Number(d.bultos) || 0), 0);
    const bultosPendientes = filteredDeliveries
      .filter((d) => !d.estado.toLowerCase().includes('entregad'))
      .reduce((acc, d) => acc + (Number(d.bultos) || 0), 0);
    const porcentajeCompletado = totalEntregas > 0 ? Math.round((totalEntregados / totalEntregas) * 100) : 0;

    return {
      totalEntregas,
      totalEntregados,
      totalPendientes,
      totalBultos,
      bultosEntregados,
      bultosPendientes,
      porcentajeCompletado,
    };
  }, [filteredDeliveries]);

  // Hub specific stats for comparative KPI cards
  const hubStats = useMemo(() => {
    const sdItems = filteredDeliveries.filter(d => getHubFromItem(d) === 'santodomingo');
    const stgItems = filteredDeliveries.filter(d => getHubFromItem(d) === 'santiago');

    return {
      santoDomingoViajes: sdItems.length,
      santoDomingoBultos: sdItems.reduce((acc, d) => acc + (Number(d.bultos) || 0), 0),
      santoDomingoEntregados: sdItems.filter(d => d.estado.toLowerCase().includes('entregad')).length,
      santiagoViajes: stgItems.length,
      santiagoBultos: stgItems.reduce((acc, d) => acc + (Number(d.bultos) || 0), 0),
      santiagoEntregados: stgItems.filter(d => d.estado.toLowerCase().includes('entregad')).length
    };
  }, [filteredDeliveries]);

  // Handlers for Delivery items
  const handleToggleStatus = (id: string) => {
    setDeliveries((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const isCurrentlyDelivered = item.estado.toLowerCase().includes('entregad');
          const newStatus: DeliveryStatus = isCurrentlyDelivered ? 'Pendiente' : 'Entregado';
          showToast(`${item.unidad} marcado como "${newStatus}"`);
          return { ...item, estado: newStatus };
        }
        return item;
      })
    );
  };

  const handleSaveDelivery = (item: DeliveryItem) => {
    setDeliveries((prev) => {
      const exists = prev.some((d) => d.id === item.id);
      if (exists) {
        showToast(`Registro actualizado: ${item.unidad}`);
        return prev.map((d) => (d.id === item.id ? item : d));
      } else {
        showToast(`Nueva unidad registrada: ${item.unidad}`);
        return [item, ...prev];
      }
    });
  };

  const handleDeleteDelivery = (id: string) => {
    const item = deliveries.find((d) => d.id === id);
    if (!item) return;
    const confirmDelete = window.confirm(`¿Está seguro de eliminar el despacho de ${item.unidad} (${item.chofer})?`);
    if (confirmDelete) {
      setDeliveries((prev) => prev.filter((d) => d.id !== id));
      showToast(`Registro eliminado: ${item.unidad}`);
    }
  };

  const handleEditDelivery = (item: DeliveryItem) => {
    setEditingItem(item);
    setIsFormModalOpen(true);
  };

  const handleAddNewToBlock = (blockId: BlockId) => {
    setEditingItem(null);
    setDefaultBlockForNew(blockId);
    setIsFormModalOpen(true);
  };

  const handleResetData = () => {
    setSelectedHub('all');
    setSelectedService('all');
    setStatusFilter('all');
    setStartDate('2026-10-25');
    setEndDate('2026-10-25');
    setSearchQuery('');
    showToast('Filtros restablecidos al consolidado nacional.');
  };

  const handleImportData = (items: DeliveryItem[], mode: 'replace' | 'append') => {
    if (mode === 'replace') {
      setDeliveries(items);
      showToast(`Se reemplazaron los registros por ${items.length} filas desde Google Sheets.`);
    } else {
      setDeliveries((prev) => [...items, ...prev]);
      showToast(`Se añadieron ${items.length} filas a los registros.`);
    }
  };

  // Capture Report in PNG using modern SVG canvas engine (eliminates OKLCH color error)
  const handleCapturePng = async () => {
    setIsCapturing(true);
    const isFarmaciasTab = activeTab === 'farmacias';
    const targetElementId = isFarmaciasTab ? 'area-captura-farmacias' : 'area-captura';
    const tabName = isFarmaciasTab ? 'Farmacias' : 'Consolidado';
    showToast(`Generando captura en imagen PNG (${tabName})...`);
    try {
      const dateTag = startDate && endDate
        ? (startDate === endDate ? startDate : `${startDate}_al_${endDate}`)
        : 'Consolidado';
      const fileName = `Reporte_${tabName}_Despachos_RD_${dateTag}.png`;
      const success = await captureReportToPng(targetElementId, dateTag, fileName);
      if (success) {
        showToast(`📷 ¡Cuadro de ${tabName} capturado exitosamente en PNG! Listo para enviar por WhatsApp.`);
      } else {
        showToast('No se pudo generar la captura. Intente nuevamente.');
      }
    } catch (err) {
      console.error(err);
      showToast('Ocurrió un error al capturar la imagen.');
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-16 font-sans">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-200 border border-slate-700">
          <Info className="w-4 h-4 text-blue-400 shrink-0" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Top Header Bar */}
      <header className="bg-slate-950 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
          {/* Logo / Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <Truck className="w-5 h-5 text-blue-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold tracking-tight text-white whitespace-nowrap block">
                  Reporte Diario de Entregas y Despachos
                </span>
                <span className="bg-blue-900/60 text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-700">
                  RD
                </span>
              </div>
              <span className="text-[11px] text-slate-400 hidden sm:block font-mono">
                Sedes Santo Domingo &amp; Santiago de los Caballeros
              </span>
            </div>
          </div>

          {/* Quick Hub Switcher in Navigation */}
          <nav className="hidden lg:flex items-center gap-2 text-xs font-bold p-1 bg-slate-900 rounded-lg border border-slate-800">
            <button
              onClick={() => setSelectedHub('all')}
              className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                selectedHub === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Consolidado Nacional
            </button>
            <button
              onClick={() => setSelectedHub('santodomingo')}
              className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                selectedHub === 'santodomingo' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sede Santo Domingo
            </button>
            <button
              onClick={() => setSelectedHub('santiago')}
              className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                selectedHub === 'santiago' 
                  ? 'bg-amber-600 text-white' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sede Santiago
            </button>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => handleDirectSheetSync(true)}
              disabled={isSyncingSheet}
              className="px-3 py-1.5 text-xs font-semibold text-emerald-300 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors whitespace-nowrap shadow-xs inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Sincronizar en tiempo real con tu Google Sheet"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingSheet ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Sincronizar Sheet</span>
            </button>

            <button
              onClick={handleCapturePng}
              disabled={isCapturing}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap shadow-2xs inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Descargar imagen PNG para WhatsApp"
            >
              <Camera className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">📷 Capturar para Gerencia</span>
            </button>

            <button
              onClick={() => setIsWhatsAppModalOpen(true)}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors whitespace-nowrap shadow-2xs inline-flex items-center gap-1.5 cursor-pointer"
              title="Personalizar y enviar reporte por WhatsApp a Gerencia"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-100" />
              <span className="hidden sm:inline">💬 WhatsApp Gerencia</span>
            </button>

            <button
              onClick={() => setIsColumnsModalOpen(true)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors whitespace-nowrap shadow-2xs inline-flex items-center gap-1.5 cursor-pointer"
              title="Seleccionar campos visibles en el reporte"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Columnas ({Object.values(visibleColumns).filter(Boolean).length})</span>
            </button>

            <button
              onClick={() => {
                setEditingItem(null);
                setDefaultBlockForNew(selectedHub === 'santiago' ? 'santiago_propia' : 'santodomingo_propia');
                setIsFormModalOpen(true);
              }}
              className="px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors whitespace-nowrap shadow-2xs inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Nueva Unidad</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-5 space-y-5">
        {/* Google Sheet Live Connection Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs no-print">
          <div className="flex items-center gap-2 text-xs text-slate-700 flex-wrap">
            <span className="flex items-center gap-1.5 font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Google Sheets Conectado
            </span>
            <span className="text-slate-300 hidden sm:inline">|</span>
            <span className="font-mono text-slate-500 text-[11px]">ID: 1X7xtW4YrjEv43t1byX6CjMFxh4UKsZft00KQJuXEroc</span>
            <span className="text-slate-300 hidden sm:inline">|</span>
            <span className="text-slate-600 font-semibold">
              {filteredDeliveries.length} unidades activas en visualización
            </span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={activeSheetUrl || DEFAULT_SHEET_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Abrir Hoja</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <button
              onClick={() => setIsSheetsModalOpen(true)}
              className="text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 px-2.5 py-1 rounded-lg ml-1 cursor-pointer"
            >
              Script &amp; Configuración
            </button>
          </div>
        </div>

        {/* Sistema de Pestañas (Tabs) de Visualización */}
        <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-xl border border-slate-200 shadow-2xs no-print">
          <button
            onClick={() => setActiveTab('consolidado')}
            className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-lg font-extrabold text-xs sm:text-sm inline-flex items-center justify-center gap-2 transition cursor-pointer ${
              activeTab === 'consolidado'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Truck className={`w-4 h-4 ${activeTab === 'consolidado' ? 'text-blue-400' : 'text-slate-500'}`} />
            <span>Pestaña 1: Reporte Gerencial Consolidado</span>
          </button>

          <button
            onClick={() => setActiveTab('farmacias')}
            className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-lg font-extrabold text-xs sm:text-sm inline-flex items-center justify-center gap-2 transition cursor-pointer ${
              activeTab === 'farmacias'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Store className={`w-4 h-4 ${activeTab === 'farmacias' ? 'text-emerald-400' : 'text-slate-500'}`} />
            <span>Pestaña 2: Detalle de Farmacias y Pedidos</span>
          </button>
        </div>

        {activeTab === 'consolidado' ? (
          <>
            {/* 1. KPIs Section with Unified Hub Breakdowns */}
            <section aria-label="Resumen de Indicadores Clave">
              <KPICards kpis={kpis} hubStats={hubStats} />
            </section>

            {/* 2. Controls & Rapid Filters Section */}
            <section aria-label="Filtros y Búsqueda" className="no-print">
              <FilterBar
                selectedHub={selectedHub}
                onSelectHub={setSelectedHub}
                selectedService={selectedService}
                onSelectService={setSelectedService}
                statusFilter={statusFilter}
                onSelectStatus={setStatusFilter}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                startDate={startDate}
                endDate={endDate}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
                onSetDateRange={handleSetDateRange}
                onCapturePng={handleCapturePng}
                isCapturing={isCapturing}
                onOpenNewModal={() => {
                  setEditingItem(null);
                  setDefaultBlockForNew(selectedHub === 'santiago' ? 'santiago_propia' : 'santodomingo_propia');
                  setIsFormModalOpen(true);
                }}
                onOpenSheetsModal={() => setIsSheetsModalOpen(true)}
                onSyncDirect={() => handleDirectSheetSync(true)}
                isSyncing={isSyncingSheet}
                onExportCSV={() => exportDeliveriesToCSV(deliveries)}
                onExportHtml={() => exportSingleFileHtml(deliveries)}
                onResetData={handleResetData}
                onOpenColumnsModal={() => setIsColumnsModalOpen(true)}
                onOpenWhatsAppModal={() => setIsWhatsAppModalOpen(true)}
                visibleColumnsCount={Object.values(visibleColumns).filter(Boolean).length}
                totalFilteredCount={filteredDeliveries.length}
              />
            </section>

            {/* 3. Master Executive Table Unified into 2 Hubs */}
            <section aria-label="Tabla Maestra Unificada por Sedes">
              <MasterExecutiveTable
                deliveries={filteredDeliveries}
                startDate={startDate}
                endDate={endDate}
                visibleColumns={visibleColumns}
                onToggleStatus={handleToggleStatus}
                onEditItem={handleEditDelivery}
                onDeleteItem={handleDeleteDelivery}
                onAddNewToBlock={handleAddNewToBlock}
                onOpenColumnsModal={() => setIsColumnsModalOpen(true)}
              />
            </section>
          </>
        ) : (
          /* Pestaña 2: Detalle de Farmacias y Pedidos */
          <section aria-label="Detalle de Farmacias y Pedidos por Sede">
            <FarmaciasTab
              deliveries={filteredDeliveries}
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
              onSetDateRange={handleSetDateRange}
              onCapturePng={handleCapturePng}
              isCapturing={isCapturing}
            />
          </section>
        )}

        {/* Footer Actions */}
        <footer className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 no-print">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Sistema Gerencial de Despachos RD</span>
            <span aria-hidden="true">·</span>
            <span>Operación Unificada Santo Domingo &amp; Santiago</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsWhatsAppModalOpen(true)}
              className="font-bold text-emerald-700 hover:text-emerald-900 inline-flex items-center gap-1 cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              💬 WhatsApp Gerencia
            </button>
            <span>·</span>
            <button
              onClick={() => setIsColumnsModalOpen(true)}
              className="text-slate-600 hover:text-slate-900 inline-flex items-center gap-1 cursor-pointer font-medium"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
              Columnas ({Object.values(visibleColumns).filter(Boolean).length})
            </button>
            <span>·</span>
            <button
              onClick={handleCapturePng}
              className="font-bold text-blue-700 hover:text-blue-900 inline-flex items-center gap-1 cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              Capturar PNG Gerencia
            </button>
            <span>·</span>
            <button
              onClick={() => exportDeliveriesToCSV(deliveries)}
              className="hover:text-slate-900 transition-colors inline-flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Descargar CSV
            </button>
            <span>·</span>
            <button
              onClick={() => exportSingleFileHtml(deliveries)}
              className="text-slate-700 hover:text-slate-900 font-semibold inline-flex items-center gap-1 cursor-pointer"
            >
              <FileCode2 className="w-3.5 h-3.5" />
              Descargar HTML
            </button>
          </div>
        </footer>
      </main>

      {/* Delivery Form Modal (New / Edit) */}
      <DeliveryFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveDelivery}
        initialItem={editingItem}
        defaultBlockId={defaultBlockForNew}
        defaultDate={startDate || new Date().toISOString().slice(0, 10)}
      />

      {/* Google Sheets / CSV Modal */}
      <GoogleSheetsModal
        isOpen={isSheetsModalOpen}
        onClose={() => setIsSheetsModalOpen(false)}
        onImportData={handleImportData}
        activeSheetUrl={activeSheetUrl}
        onSaveSheetUrl={handleSaveSheetUrl}
      />

      {/* Column Visibility Customizer Modal */}
      <ColumnVisibilityModal
        isOpen={isColumnsModalOpen}
        onClose={() => setIsColumnsModalOpen(false)}
        visibleColumns={visibleColumns}
        onChangeColumn={handleChangeColumn}
        onSetAllColumns={handleSetAllColumns}
        onApplyPreset={handleApplyPreset}
      />

      {/* WhatsApp Gerencia Customizer Modal */}
      <WhatsAppModal
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
        deliveries={filteredDeliveries}
        startDate={startDate}
        endDate={endDate}
        kpis={kpis}
      />
    </div>
  );
}
