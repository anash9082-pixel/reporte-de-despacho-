import React, { useState, useMemo } from 'react';
import { DeliveryItem, DeliveryStatus, HubId } from '../types/delivery';
import { normalizeDateString, getTodayString, getYesterdayString, formatDateLabel } from '../utils/csvHelper';
import { getHubFromItem, PROVINCIAS_RD } from '../data/mockData';
import { 
  MapPin, 
  Package, 
  Truck, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Camera, 
  Copy, 
  MessageSquare, 
  RefreshCw, 
  Search, 
  CheckCircle2, 
  Clock, 
  Store, 
  Building2, 
  FileSpreadsheet,
  TrendingUp,
  AlertCircle,
  Hash,
  Layers
} from 'lucide-react';

interface ProvinceSummary {
  provincia: string;
  pedidosCount: number;
  totalBultos: number;
  entregadosCount: number;
  pendientesCount: number;
  efectividad: number;
  unidades: string[];
  choferes: string[];
  farmacias: string[];
  pedidos: string[];
  items: DeliveryItem[];
}

interface ReporteGerencialDespachoTabProps {
  deliveries: DeliveryItem[];
  selectedDate: string;
  onDateChange: (date: string) => void;
  onShiftDate: (days: number) => void;
  selectedProvincia: string;
  onSelectProvincia: (prov: string) => void;
  availableProvincias: { name: string; count: number }[];
  selectedHub: 'all' | HubId;
  onSelectHub: (hub: 'all' | HubId) => void;
  onToggleStatus: (id: string) => void;
  onCapturePng: () => void;
  isCapturing: boolean;
  onCopyReportWithPhoto: () => void;
  isCopying: boolean;
  onSyncDirect: () => void;
  isSyncing: boolean;
}

export const ReporteGerencialDespachoTab: React.FC<ReporteGerencialDespachoTabProps> = ({
  deliveries,
  selectedDate,
  onDateChange,
  onShiftDate,
  selectedProvincia,
  onSelectProvincia,
  availableProvincias,
  selectedHub,
  onSelectHub,
  onToggleStatus,
  onCapturePng,
  isCapturing,
  onCopyReportWithPhoto,
  isCopying,
  onSyncDirect,
  isSyncing
}) => {
  const [searchFilter, setSearchFilter] = useState('');
  const [expandedProvinces, setExpandedProvinces] = useState<Record<string, boolean>>({});

  const toggleExpand = (prov: string) => {
    setExpandedProvinces(prev => ({
      ...prev,
      [prov]: !prev[prov]
    }));
  };

  const expandAll = () => {
    const all: Record<string, boolean> = {};
    provinceSummaries.forEach(s => { all[s.provincia] = true; });
    setExpandedProvinces(all);
  };

  const collapseAll = () => {
    setExpandedProvinces({});
  };

  // Filter deliveries according to active controls
  const filteredDeliveries = useMemo(() => {
    const q = searchFilter.trim().toLowerCase();

    return deliveries.filter(item => {
      // 1. Date filter (por día solo)
      if (selectedDate) {
        const itemNormDate = normalizeDateString(item.fecha);
        if (itemNormDate && itemNormDate !== selectedDate) {
          return false;
        }
      }

      // 2. Hub filter
      if (selectedHub !== 'all') {
        const itemHub = getHubFromItem(item);
        if (itemHub !== selectedHub) return false;
      }

      // 3. Province filter
      if (selectedProvincia !== 'all') {
        const itemProv = (item.provincia || '').toLowerCase().trim();
        const targetProv = selectedProvincia.toLowerCase().trim();
        if (itemProv !== targetProv) return false;
      }

      // 4. Search query
      if (q) {
        const provMatch = (item.provincia || '').toLowerCase().includes(q);
        const farmMatch = (item.farmacia || '').toLowerCase().includes(q);
        const pedMatch = (item.numeroPedido || '').toLowerCase().includes(q);
        const chofMatch = (item.chofer || '').toLowerCase().includes(q);
        const unidMatch = (item.unidad || '').toLowerCase().includes(q);
        if (!provMatch && !farmMatch && !pedMatch && !chofMatch && !unidMatch) {
          return false;
        }
      }

      return true;
    });
  }, [deliveries, selectedDate, selectedHub, selectedProvincia, searchFilter]);

  // Aggregate and group orders by province
  const provinceSummaries: ProvinceSummary[] = useMemo(() => {
    const groupMap = new Map<string, DeliveryItem[]>();

    filteredDeliveries.forEach(item => {
      const prov = (item.provincia || 'Sin Provincia Asignada').trim();
      const existing = groupMap.get(prov) || [];
      existing.push(item);
      groupMap.set(prov, existing);
    });

    const summaries: ProvinceSummary[] = [];

    groupMap.forEach((items, prov) => {
      const pedidosCount = items.length;
      const totalBultos = items.reduce((acc, it) => acc + (Number(it.bultos) || 0), 0);
      const entregadosCount = items.filter(it => it.estado.toLowerCase().includes('entregad')).length;
      const pendientesCount = items.filter(it => !it.estado.toLowerCase().includes('entregad')).length;
      const efectividad = pedidosCount > 0 ? Math.round((entregadosCount / pedidosCount) * 100) : 0;

      const unidades = Array.from(new Set(items.map(it => it.unidad).filter(Boolean)));
      const choferes = Array.from(new Set(items.map(it => it.chofer).filter(Boolean)));
      const farmacias = Array.from(new Set(items.map(it => it.farmacia).filter(Boolean))) as string[];
      const pedidos = Array.from(new Set(items.map(it => it.numeroPedido).filter(Boolean))) as string[];

      summaries.push({
        provincia: prov,
        pedidosCount,
        totalBultos,
        entregadosCount,
        pendientesCount,
        efectividad,
        unidades,
        choferes,
        farmacias,
        pedidos,
        items
      });
    });

    // Sort by largest order count first
    return summaries.sort((a, b) => b.pedidosCount - a.pedidosCount || b.totalBultos - a.totalBultos);
  }, [filteredDeliveries]);

  // Grand totals across all provinces
  const grandTotals = useMemo(() => {
    const totalProvincias = provinceSummaries.length;
    const totalPedidos = provinceSummaries.reduce((acc, s) => acc + s.pedidosCount, 0);
    const totalBultos = provinceSummaries.reduce((acc, s) => acc + s.totalBultos, 0);
    const totalEntregados = provinceSummaries.reduce((acc, s) => acc + s.entregadosCount, 0);
    const totalPendientes = provinceSummaries.reduce((acc, s) => acc + s.pendientesCount, 0);
    const efectividadGlobal = totalPedidos > 0 ? Math.round((totalEntregados / totalPedidos) * 100) : 0;
    const mayorDemanda = provinceSummaries.length > 0 ? provinceSummaries[0] : null;

    return {
      totalProvincias,
      totalPedidos,
      totalBultos,
      totalEntregados,
      totalPendientes,
      efectividadGlobal,
      mayorDemanda
    };
  }, [provinceSummaries]);

  // Generate WhatsApp message specifically formatted for Province Breakdown
  const handleShareWhatsAppProvincias = () => {
    const dateFormatted = selectedDate || 'Consolidado General';
    let text = `📊 *REPORTE GERENCIAL DE DESPACHOS POR PROVINCIA*\n`;
    text += `📅 *Fecha:* ${dateFormatted}\n`;
    text += `🏢 *Sede:* ${selectedHub === 'all' ? 'Consolidado Nacional (SD & STI)' : selectedHub === 'santodomingo' ? 'Sede Santo Domingo' : 'Sede Santiago'}\n`;
    text += `📍 *Provincias con Despacho:* ${grandTotals.totalProvincias}\n`;
    text += `📦 *Total de Pedidos:* ${grandTotals.totalPedidos} pedidos\n`;
    text += `📦 *Total de Bultos:* ${grandTotals.totalBultos} bultos\n`;
    text += `🎯 *Efectividad:* ${grandTotals.efectividadGlobal}% (${grandTotals.totalEntregados} entregados / ${grandTotals.totalPendientes} pendientes)\n\n`;

    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `📍 *DESGLOSE DE PEDIDOS POR PROVINCIA:*\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

    provinceSummaries.forEach((s, idx) => {
      text += `*${idx + 1}. PROVINCIA: ${s.provincia.toUpperCase()}*\n`;
      text += `   • *Cantidad de Pedidos:* ${s.pedidosCount}\n`;
      text += `   • *Total Bultos:* ${s.totalBultos}\n`;
      text += `   • *Efectividad:* ${s.efectividad}% (${s.entregadosCount} entregados, ${s.pendientesCount} pendientes)\n`;
      if (s.choferes.length > 0) {
        text += `   • *Choferes / Unidades:* ${s.choferes.join(', ')} (${s.unidades.join(', ')})\n`;
      }
      text += `   • *Detalle de Pedidos:*\n`;
      s.items.forEach(it => {
        const pedStr = it.numeroPedido ? `[Ped #${it.numeroPedido}] ` : '';
        const farmStr = it.farmacia ? `${it.farmacia} - ` : '';
        const statusEmoji = it.estado.toLowerCase().includes('entregad') ? '✅' : '⏳';
        text += `     ${statusEmoji} ${pedStr}${farmStr}${it.bultos} bultos (${it.chofer})\n`;
      });
      text += `\n`;
    });

    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `_Sistema Gerencial de Despacho Logístico RD_\n`;

    const encoded = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  return (
    <div className="space-y-4">
      {/* 1. Barra de Controles y Filtros Superior */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3.5 no-print">
        {/* Fila 1: Filtro de Fecha por Día + Botones de Acción */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          {/* Navegador de Fecha */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-300 rounded-xl p-1.5 text-xs shadow-2xs">
              <span className="px-2 font-bold text-slate-800 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                Fecha:
              </span>
              <button
                onClick={() => onShiftDate(-1)}
                className="p-1 hover:bg-slate-200 rounded text-slate-700 transition cursor-pointer"
                title="Día anterior (-1 día)"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="bg-white px-2.5 py-1 rounded-lg border border-slate-300 flex items-center gap-1.5">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => onDateChange(e.target.value)}
                  className="bg-transparent text-xs font-mono font-bold text-slate-900 focus:outline-none cursor-pointer"
                />
              </div>
              <button
                onClick={() => onShiftDate(1)}
                className="p-1 hover:bg-slate-200 rounded text-slate-700 transition cursor-pointer"
                title="Día siguiente (+1 día)"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Accesos rápidos de fecha */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => onDateChange(getTodayString())}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition cursor-pointer ${
                  selectedDate === getTodayString()
                    ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                Hoy ({formatDateLabel(getTodayString())})
              </button>
              <button
                onClick={() => onDateChange(getYesterdayString())}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition cursor-pointer ${
                  selectedDate === getYesterdayString()
                    ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                Ayer ({formatDateLabel(getYesterdayString())})
              </button>
              <button
                onClick={() => onDateChange('')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition cursor-pointer ${
                  !selectedDate
                    ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                Ver Todas
              </button>
            </div>
          </div>

          {/* Botonera Ejecutiva */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Copiar con Foto */}
            <button
              onClick={onCopyReportWithPhoto}
              disabled={isCopying}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-lg transition shadow-2xs cursor-pointer disabled:opacity-50"
              title="Copiar imagen del reporte de provincias para pegar directo en WhatsApp"
            >
              <Copy className={`w-3.5 h-3.5 text-blue-200 ${isCopying ? 'animate-pulse' : ''}`} />
              <span>{isCopying ? 'Copiando foto...' : '📋 Copiar con Foto'}</span>
            </button>

            {/* Sincronizar Sheet */}
            <button
              onClick={onSyncDirect}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition shadow-2xs cursor-pointer disabled:opacity-50"
              title="Sincronizar datos con Google Sheets"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar Sheet'}</span>
            </button>

            {/* Capturar PNG */}
            <button
              onClick={onCapturePng}
              disabled={isCapturing}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition shadow-2xs cursor-pointer disabled:opacity-50"
              title="Descargar reporte de provincias en imagen PNG"
            >
              <Camera className="w-3.5 h-3.5 text-blue-200" />
              <span>{isCapturing ? 'Generando...' : '📷 Capturar PNG'}</span>
            </button>

            {/* WhatsApp Gerencia por Provincias */}
            <button
              onClick={handleShareWhatsAppProvincias}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition shadow-2xs cursor-pointer"
              title="Enviar resumen agrupado por provincia directamente a WhatsApp"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-100" />
              <span>💬 WhatsApp Provincias</span>
            </button>
          </div>
        </div>

        {/* Fila 2: Filtro Territorial de Provincias (Botones Rápidos) */}
        <div className="flex flex-col gap-2 pt-1">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <MapPin className="w-3.5 h-3.5 text-rose-600" />
              <span>Filtrar por Provincia:</span>
              <span className="text-slate-400 font-normal">
                ({provinceSummaries.length} con despacho {selectedDate ? `el ${selectedDate}` : 'en total'})
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={expandAll}
                className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 underline cursor-pointer"
              >
                Expandir Todo
              </button>
              <span className="text-slate-300">|</span>
              <button
                onClick={collapseAll}
                className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 underline cursor-pointer"
              >
                Colapsar Todo
              </button>
            </div>
          </div>

          {/* Botones de Provincias Activas con Conteo de Pedidos */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => onSelectProvincia('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition cursor-pointer ${
                selectedProvincia === 'all'
                  ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              Todas las Provincias ({grandTotals.totalPedidos} Pedidos)
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
                >
                  <MapPin className={`w-3 h-3 ${isSelected ? 'text-rose-200' : 'text-rose-500'}`} />
                  <span>{name}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                    isSelected ? 'bg-rose-800 text-rose-100' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {count} {count === 1 ? 'ped' : 'peds'}
                  </span>
                </button>
              );
            })}

            {/* Selector desplegable para las 32 provincias de RD */}
            <div className="inline-block">
              <select
                value={selectedProvincia}
                onChange={(e) => onSelectProvincia(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 font-semibold focus:outline-none focus:ring-1 focus:ring-rose-500 cursor-pointer"
              >
                <option value="all">📍 Ver las 32 Provincias de RD...</option>
                {PROVINCIAS_RD.map((prov) => (
                  <option key={prov} value={prov}>{prov}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Fila 3: Sedes + Búsqueda Rápida */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-slate-100">
          <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => onSelectHub('all')}
              className={`px-3 py-1 font-bold rounded-md transition cursor-pointer ${
                selectedHub === 'all' ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Consolidado Nacional
            </button>
            <button
              onClick={() => onSelectHub('santodomingo')}
              className={`px-3 py-1 font-bold rounded-md transition cursor-pointer ${
                selectedHub === 'santodomingo' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sede Santo Domingo
            </button>
            <button
              onClick={() => onSelectHub('santiago')}
              className={`px-3 py-1 font-bold rounded-md transition cursor-pointer ${
                selectedHub === 'santiago' ? 'bg-amber-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sede Santiago
            </button>
          </div>

          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Buscar pedido, farmacia, provincia o chofer..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>
        </div>
      </div>

      {/* ÁREA DE CAPTURA PARA EXPORTACIÓN EN IMAGEN (area-captura-provincias) */}
      <div id="area-captura-provincias" className="space-y-4 bg-slate-100 p-1 rounded-xl">
        {/* Cabecera Corporativa de la Captura */}
        <div className="bg-slate-950 text-white rounded-xl p-4 sm:p-5 border border-slate-800 shadow-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-rose-600 flex items-center justify-center text-white shadow-md shrink-0">
                <MapPin className="w-6 h-6 text-rose-100" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg sm:text-xl font-extrabold tracking-tight uppercase">
                    Reporte Gerencial de Despacho por Provincia
                  </h1>
                  <span className="bg-rose-900/80 text-rose-200 text-xs font-bold px-2.5 py-0.5 rounded border border-rose-700">
                    AGRUPACIÓN TERRITORIAL
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Conteo consolidado de pedidos por provincia, bultos despachados y trazabilidad de entregas
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-right">
                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Fecha Operativa</div>
                <div className="text-xs font-mono font-bold text-blue-400">
                  {selectedDate || 'Histórico Completo'}
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-right">
                <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Total Pedidos</div>
                <div className="text-xs font-mono font-extrabold text-emerald-400">
                  {grandTotals.totalPedidos} Pedidos
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tarjetas de Métricas Ejecutivas de Provincias */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Provincias</span>
              <MapPin className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900">{grandTotals.totalProvincias}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Destinos territoriales</div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Total Pedidos</span>
              <Package className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-extrabold text-blue-600">{grandTotals.totalPedidos}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Cantidad de despachos</div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Total Bultos</span>
              <Layers className="w-4 h-4 text-slate-700" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900">{grandTotals.totalBultos}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Cajas / Bultos cargados</div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Efectividad</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-extrabold text-emerald-600">{grandTotals.efectividadGlobal}%</div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {grandTotals.totalEntregados} entregados / {grandTotals.totalPendientes} pend.
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Mayor Demanda</span>
              <TrendingUp className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-sm font-extrabold text-slate-900 truncate">
              {grandTotals.mayorDemanda ? grandTotals.mayorDemanda.provincia : 'N/A'}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5 font-medium">
              {grandTotals.mayorDemanda ? `${grandTotals.mayorDemanda.pedidosCount} pedidos (${grandTotals.mayorDemanda.totalBultos} bultos)` : 'Sin operaciones'}
            </div>
          </div>
        </div>

        {/* 2. TABLA MAESTRA GERENCIAL: RESUMEN Y CONTEO DE PEDIDOS POR PROVINCIA */}
        <div className="bg-white rounded-xl border border-slate-300 shadow-sm overflow-hidden">
          {/* Header de la Tabla */}
          <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-400" />
              <span className="font-bold text-xs sm:text-sm tracking-wide uppercase">
                Tabla Maestra Gerencial: Pedidos Agrupados por Provincia
              </span>
            </div>
            <span className="text-xs text-slate-300 font-mono">
              {provinceSummaries.length} Provincias | {grandTotals.totalPedidos} Pedidos Totales
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Provincia / Destino</th>
                  <th className="py-2.5 px-3 text-center bg-blue-50/80 text-blue-900 font-extrabold">
                    Cantidad de Pedidos
                  </th>
                  <th className="py-2.5 px-3 text-center">Bultos</th>
                  <th className="py-2.5 px-3 text-center text-emerald-800">Entregados</th>
                  <th className="py-2.5 px-3 text-center text-amber-800">Pendientes</th>
                  <th className="py-2.5 px-3 text-center">Efectividad</th>
                  <th className="py-2.5 px-3">Farmacias / Distribuidoras</th>
                  <th className="py-2.5 px-3">Choferes &amp; Unidades</th>
                  <th className="py-2.5 px-3 text-center no-print">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {provinceSummaries.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-10 text-center text-slate-500 italic bg-white">
                      No se encontraron pedidos para los filtros seleccionados ({selectedDate || 'Todas las fechas'}).
                    </td>
                  </tr>
                ) : (
                  provinceSummaries.map((summary, index) => {
                    const isExpanded = !!expandedProvinces[summary.provincia];
                    return (
                      <tr 
                        key={summary.provincia} 
                        className={`hover:bg-slate-50/80 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}
                      >
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-400">
                          {index + 1}
                        </td>

                        <td className="py-2.5 px-3 font-extrabold text-slate-900">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            <span>{summary.provincia}</span>
                          </div>
                        </td>

                        {/* CANTIDAD DE PEDIDOS (DESTACADA) */}
                        <td className="py-2.5 px-3 text-center bg-blue-50/80">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-600 text-white rounded-md font-mono font-black text-xs shadow-2xs">
                            <Package className="w-3 h-3 text-blue-200" />
                            <span>{summary.pedidosCount} {summary.pedidosCount === 1 ? 'pedido' : 'pedidos'}</span>
                          </span>
                        </td>

                        <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-800">
                          {summary.totalBultos}
                        </td>

                        <td className="py-2.5 px-3 text-center font-mono font-bold text-emerald-700">
                          {summary.entregadosCount}
                        </td>

                        <td className="py-2.5 px-3 text-center font-mono font-bold text-amber-700">
                          {summary.pendientesCount}
                        </td>

                        <td className="py-2.5 px-3 text-center">
                          <div className="inline-flex items-center gap-1.5">
                            <div className="w-14 bg-slate-200 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  summary.efectividad === 100
                                    ? 'bg-emerald-500'
                                    : summary.efectividad > 0
                                    ? 'bg-blue-500'
                                    : 'bg-amber-400'
                                }`}
                                style={{ width: `${summary.efectividad}%` }}
                              />
                            </div>
                            <span className="font-mono font-bold text-[11px] text-slate-800 w-8 text-right">
                              {summary.efectividad}%
                            </span>
                          </div>
                        </td>

                        <td className="py-2.5 px-3 text-slate-700 max-w-[220px]">
                          <div className="truncate font-medium" title={summary.farmacias.join(', ')}>
                            {summary.farmacias.length > 0 
                              ? summary.farmacias.join(', ')
                              : <span className="text-slate-400 italic">No especificada</span>
                            }
                          </div>
                          {summary.pedidos.length > 0 && (
                            <div className="text-[10px] text-slate-400 font-mono">
                              Pedidos: {summary.pedidos.join(', ')}
                            </div>
                          )}
                        </td>

                        <td className="py-2.5 px-3 text-slate-700 max-w-[180px]">
                          <div className="truncate font-medium text-slate-800" title={summary.choferes.join(', ')}>
                            {summary.choferes.join(', ')}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate" title={summary.unidades.join(', ')}>
                            {summary.unidades.join(', ')}
                          </div>
                        </td>

                        <td className="py-2.5 px-3 text-center no-print">
                          <button
                            onClick={() => toggleExpand(summary.provincia)}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold transition cursor-pointer"
                          >
                            {isExpanded ? 'Ocultar' : 'Ver Pedidos'}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>

              {/* FILA DE TOTAL GENERAL */}
              <tfoot>
                <tr className="bg-slate-900 text-white font-extrabold border-t-2 border-blue-500">
                  <td className="py-3 px-3"></td>
                  <td className="py-3 px-3 uppercase tracking-wider text-xs font-black">
                    TOTAL GENERAL ({grandTotals.totalProvincias} Provincias)
                  </td>
                  <td className="py-3 px-3 text-center bg-blue-700 text-white font-mono text-sm">
                    {grandTotals.totalPedidos} Pedidos
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-sm text-blue-200">
                    {grandTotals.totalBultos}
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-sm text-emerald-300">
                    {grandTotals.totalEntregados}
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-sm text-amber-300">
                    {grandTotals.totalPendientes}
                  </td>
                  <td className="py-3 px-3 text-center font-mono text-sm text-white">
                    {grandTotals.efectividadGlobal}%
                  </td>
                  <td colSpan={3} className="py-3 px-3 text-right text-xs text-slate-300 font-normal">
                    Consolidación Logística de República Dominicana
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* 3. DESGLOSE INDIVIDUAL DE PEDIDOS POR PROVINCIA (SECCIONES TERRITORIALES) */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <Store className="w-4 h-4 text-emerald-600" />
              <span>Desglose Detallado de Pedidos y Farmacias por Provincia</span>
            </h2>
            <span className="text-xs text-slate-500">
              Total {provinceSummaries.length} bloques territoriales
            </span>
          </div>

          {provinceSummaries.map((summary) => (
            <div 
              key={`detail-${summary.provincia}`}
              className="bg-white rounded-xl border border-slate-300 shadow-xs overflow-hidden"
            >
              {/* Encabezado de la Provincia */}
              <div className="bg-slate-950 text-white p-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-rose-600/90 flex items-center justify-center text-white shrink-0">
                    <MapPin className="w-4 h-4 text-rose-100" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm sm:text-base font-extrabold uppercase tracking-wide text-white">
                        {summary.provincia}
                      </span>
                      <span className="bg-blue-600 text-white font-mono text-xs px-2 py-0.5 rounded font-black">
                        {summary.pedidosCount} {summary.pedidosCount === 1 ? 'Pedido' : 'Pedidos'}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {summary.totalBultos} bultos totales • Choferes: {summary.choferes.join(', ')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="bg-slate-900 border border-slate-700 px-2.5 py-1 rounded text-xs font-mono text-emerald-400 font-bold">
                    {summary.entregadosCount} Entregados
                  </span>
                  <span className="bg-slate-900 border border-slate-700 px-2.5 py-1 rounded text-xs font-mono text-amber-400 font-bold">
                    {summary.pendientesCount} Pendientes
                  </span>
                  <span className="bg-slate-900 border border-slate-700 px-2.5 py-1 rounded text-xs font-mono text-blue-300 font-bold">
                    {summary.efectividad}% Efec.
                  </span>
                </div>
              </div>

              {/* Tabla de Pedidos de esta Provincia */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <th className="py-2 px-3">N° Pedido</th>
                      <th className="py-2 px-3">Farmacia / Distribuidora</th>
                      <th className="py-2 px-3">Unidad</th>
                      <th className="py-2 px-3">Chofer</th>
                      <th className="py-2 px-3">Sede / Origen</th>
                      <th className="py-2 px-3 text-center">Bultos</th>
                      <th className="py-2 px-3 text-center">Estado</th>
                      <th className="py-2 px-3">Observación</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {summary.items.map((item, idx) => {
                      const isDelivered = item.estado.toLowerCase().includes('entregad');
                      return (
                        <tr key={item.id || idx} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-3">
                            <span className="font-mono font-black text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 inline-block">
                              {item.numeroPedido ? `#${item.numeroPedido}` : `ORD-${idx + 1}`}
                            </span>
                          </td>

                          <td className="py-2.5 px-3 font-bold text-slate-900">
                            {item.farmacia || <span className="text-slate-400 italic">No especificada</span>}
                          </td>

                          <td className="py-2.5 px-3 font-semibold text-slate-700">
                            {item.unidad}
                          </td>

                          <td className="py-2.5 px-3 text-slate-700">
                            <span className="font-medium">{item.chofer}</span>
                            {item.ayudante && item.ayudante !== 'N/A' && (
                              <span className="text-[10px] text-slate-400 block">Ayud: {item.ayudante}</span>
                            )}
                          </td>

                          <td className="py-2.5 px-3 text-slate-600">
                            <span className="text-[11px] font-semibold bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              {item.origen || 'Base Central'}
                            </span>
                          </td>

                          <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-800">
                            {item.bultos}
                          </td>

                          <td className="py-2.5 px-3 text-center">
                            <button
                              onClick={() => onToggleStatus(item.id)}
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition cursor-pointer ${
                                isDelivered
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                                  : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                              }`}
                              title="Haga clic para alternar estado"
                            >
                              {isDelivered ? (
                                <>
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>Entregado</span>
                                </>
                              ) : (
                                <>
                                  <Clock className="w-3 h-3 text-amber-600" />
                                  <span>Pendiente</span>
                                </>
                              )}
                            </button>
                          </td>

                          <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                            {item.observacion || <span className="text-slate-400 italic">Sin observación</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
