import React, { useState, useMemo } from 'react';
import { DeliveryItem } from '../types/delivery';
import { getHubFromItem, getServiceTypeFromItem } from '../data/mockData';
import { 
  Building2, 
  Package, 
  Truck, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  Hash, 
  Search, 
  SlidersHorizontal,
  ExternalLink,
  Store,
  FileSpreadsheet,
  Calendar,
  Camera,
  Copy,
  ChevronLeft,
  ChevronRight,
  Receipt,
  Timer,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { getTodayString, getYesterdayString, formatDateLabel } from '../utils/csvHelper';

interface FarmaciasTabProps {
  deliveries: DeliveryItem[];
  selectedDate: string;
  onDateChange: (date: string) => void;
  onShiftDate: (days: number) => void;
  onCapturePng?: () => void;
  isCapturing?: boolean;
  onCopyReportWithPhoto?: () => void;
  isCopying?: boolean;
}

export const FarmaciasTab: React.FC<FarmaciasTabProps> = ({
  deliveries,
  selectedDate,
  onDateChange,
  onShiftDate,
  onCapturePng,
  isCapturing = false,
  onCopyReportWithPhoto,
  isCopying = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHubFilter, setSelectedHubFilter] = useState<'all' | 'santodomingo' | 'santiago'>('all');
  const [isFullFitMode, setIsFullFitMode] = useState<boolean>(true);

  // Filter deliveries for the farmacias tab
  const filteredList = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return deliveries.filter(item => {
      if (selectedHubFilter !== 'all' && getHubFromItem(item) !== selectedHubFilter) {
        return false;
      }
      if (!term) return true;
      const farm = (item.farmacia || '').toLowerCase();
      const ped = (item.numeroPedido || '').toLowerCase();
      const chofer = (item.chofer || '').toLowerCase();
      const prov = (item.provincia || '').toLowerCase();
      const unid = (item.unidad || '').toLowerCase();
      return farm.includes(term) || ped.includes(term) || chofer.includes(term) || prov.includes(term) || unid.includes(term);
    });
  }, [deliveries, searchTerm, selectedHubFilter]);

  // Group by Hub: Santo Domingo vs Santiago
  const sdDeliveries = useMemo(() => 
    filteredList.filter(d => getHubFromItem(d) === 'santodomingo'),
    [filteredList]
  );

  const stgDeliveries = useMemo(() => 
    filteredList.filter(d => getHubFromItem(d) === 'santiago'),
    [filteredList]
  );

  // Overall KPI metrics for farmacias
  const stats = useMemo(() => {
    const totalDespachos = filteredList.length;
    const totalBultos = filteredList.reduce((acc, d) => acc + (Number(d.bultos) || 0), 0);
    const entregados = filteredList.filter(d => d.estado.toLowerCase().includes('entregad')).length;
    const pendientes = totalDespachos - entregados;
    const pedidosConNumero = filteredList.filter(d => Boolean(d.numeroPedido && d.numeroPedido.trim())).length;
    const farmaciasConNombre = filteredList.filter(d => Boolean(d.farmacia && d.farmacia.trim())).length;
    const efectividad = totalDespachos > 0 ? Math.round((entregados / totalDespachos) * 100) : 0;

    return {
      totalDespachos,
      totalBultos,
      entregados,
      pendientes,
      pedidosConNumero,
      farmaciasConNombre,
      efectividad
    };
  }, [filteredList]);

  const cleanTimeStr = (t?: string): string => {
    if (!t || !t.trim()) return '';
    let s = t.trim();
    // Normalize "12:37 p. m." or "12:37 p.m." -> "12:37 PM"
    s = s.replace(/\s*p\.?\s*m\.?/i, ' PM').replace(/\s*a\.?\s*m\.?/i, ' AM');
    return s.trim();
  };

  const toTitleCase = (text?: string): string => {
    if (!text) return '';
    const trimmed = text.trim();
    if (!trimmed) return '';
    return trimmed
      .split(/\s+/)
      .map(w => {
        // preserve acronyms like GBC, TB, SD, JAC
        if (w.length <= 4 && w === w.toUpperCase() && !/^[0-9]+$/.test(w)) return w;
        return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
      })
      .join(' ');
  };

  const renderSedeTable = (
    title: string, 
    sedeKey: 'Santo Domingo' | 'Santiago', 
    items: DeliveryItem[], 
    accentColor: string
  ) => {
    const totalSedeBultos = items.reduce((acc, d) => acc + (Number(d.bultos) || 0), 0);
    const entregadosSede = items.filter(d => d.estado.toLowerCase().includes('entregad')).length;
    const pendientesSede = items.length - entregadosSede;
    const efectividadSede = items.length > 0 ? Math.round((entregadosSede / items.length) * 100) : 0;

    return (
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden mb-6">
        {/* Sede Header */}
        <div className={`px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 text-white ${
          sedeKey === 'Santo Domingo' ? 'bg-slate-900 border-b-2 border-blue-600' : 'bg-slate-900 border-b-2 border-amber-600'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
              sedeKey === 'Santo Domingo' ? 'bg-blue-600 text-white' : 'bg-amber-600 text-white'
            }`}>
              <Store className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-wide text-white">
                {title}
              </h3>
              <p className="text-[11px] text-slate-300">
                Desglose específico de farmacias receptoras, pedidos y bultos
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="bg-slate-800/80 px-2.5 py-1 rounded text-slate-300 border border-slate-700">
              <strong className="text-white font-bold">{items.length}</strong> Despachos
            </span>
            <span className="bg-slate-800/80 px-2.5 py-1 rounded text-slate-300 border border-slate-700">
              <strong className="text-blue-300 font-bold">{totalSedeBultos}</strong> Bultos
            </span>
            <span className="bg-emerald-950/80 text-emerald-300 border border-emerald-800 px-2.5 py-1 rounded font-bold">
              {efectividadSede}% Efectividad
            </span>
          </div>
        </div>

        {/* Table Content */}
        <div className={`overflow-x-auto ${isFullFitMode ? 'w-full' : ''}`}>
          <table className={`w-full text-left border-collapse ${isFullFitMode ? 'table-auto text-[11px]' : 'text-xs'}`}>
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                <th scope="col" className="py-2.5 px-2 w-8 text-center">#</th>
                <th scope="col" className={`py-2.5 px-2.5 ${isFullFitMode ? 'min-w-[150px]' : 'min-w-[200px]'}`}>Farmacia / Distribuidora</th>
                <th scope="col" className="py-2.5 px-2 text-center whitespace-nowrap">Nº Pedido</th>
                <th scope="col" className="py-2.5 px-2 text-center whitespace-nowrap">Hora Facturación</th>
                <th scope="col" className="py-2.5 px-2 text-center whitespace-nowrap">Hora Entregas</th>
                <th scope="col" className="py-2.5 px-1.5 text-center whitespace-nowrap">Bultos</th>
                <th scope="col" className="py-2.5 px-2 whitespace-nowrap">Ruta / Provincia</th>
                <th scope="col" className="py-2.5 px-2 whitespace-nowrap">Unidad Asignada</th>
                <th scope="col" className="py-2.5 px-2 whitespace-nowrap">Chofer</th>
                <th scope="col" className="py-2.5 px-2 text-center whitespace-nowrap">Estado</th>
                <th scope="col" className={`py-2.5 px-2.5 ${isFullFitMode ? 'min-w-[120px]' : 'min-w-[160px]'}`}>Observación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-400 italic">
                    No hay despachos de farmacias registrados para esta sede en la fecha seleccionada.
                  </td>
                </tr>
              ) : (
                items.map((item, idx) => {
                  const isDelivered = item.estado.toLowerCase().includes('entregad');
                  const serviceType = getServiceTypeFromItem(item);
                  const isTercerizado = serviceType === 'Transporte Blanco';
                  const rawFarmacia = item.farmacia && item.farmacia.trim() 
                    ? item.farmacia 
                    : `Cliente Ruta ${item.provincia}`;
                  const farmaciaDisplay = toTitleCase(rawFarmacia);
                  const rawPedido = item.numeroPedido && item.numeroPedido.trim()
                    ? item.numeroPedido.replace(/^#\s*/, '')
                    : `${idx + 101}`;

                  const facturada = cleanTimeStr(item.horaFacturacion);
                  const entregada = cleanTimeStr(item.horaEntrega);

                  return (
                    <tr 
                      key={item.id} 
                      className={`hover:bg-slate-50/90 transition-colors ${
                        idx % 2 === 1 ? 'bg-slate-50/40' : 'bg-white'
                      }`}
                    >
                      {/* Num */}
                      <td className="py-2.5 px-2 text-center font-mono text-slate-400 text-xs">
                        {idx + 1}
                      </td>

                      {/* Farmacia / Distribuidora */}
                      <td className="py-2.5 px-2.5 font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
                            <Store className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block leading-tight text-xs">
                              {farmaciaDisplay}
                            </span>
                            <span className="text-[10px] text-slate-400 capitalize">
                              {item.provincia ? item.provincia.toLowerCase() : ''}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Número de Pedido */}
                      <td className="py-2.5 px-2 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200 font-bold font-mono text-xs whitespace-nowrap shadow-2xs">
                          <Hash className="w-2.5 h-2.5 text-blue-500 shrink-0" />
                          {rawPedido}
                        </span>
                      </td>

                      {/* Hora de Facturación */}
                      <td className="py-2.5 px-2 text-center whitespace-nowrap">
                        {facturada ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/90 font-bold font-mono text-xs whitespace-nowrap shadow-2xs">
                            <Receipt className="w-3 h-3 text-indigo-600 shrink-0" />
                            {facturada}
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center font-mono text-xs text-slate-400 select-none">
                            --:--
                          </span>
                        )}
                      </td>

                      {/* Hora de Entregas */}
                      <td className="py-2.5 px-2 text-center whitespace-nowrap">
                        {entregada ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/90 font-bold font-mono text-xs whitespace-nowrap shadow-2xs">
                            <Clock className="w-3 h-3 text-emerald-600 shrink-0" />
                            {entregada}
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center font-mono text-xs text-slate-400 select-none">
                            --:--
                          </span>
                        )}
                      </td>

                      {/* Bultos */}
                      <td className="py-2.5 px-1.5 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-black font-mono text-xs">
                          <Package className="w-3 h-3 text-slate-500" />
                          {item.bultos}
                        </span>
                      </td>

                      {/* Ruta / Provincia */}
                      <td className="py-2.5 px-2 text-slate-700 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-xs">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="font-medium text-slate-800">{toTitleCase(item.provincia)}</span>
                        </div>
                      </td>

                      {/* Unidad Asignada */}
                      <td className="py-2.5 px-2 whitespace-nowrap">
                        <div className="font-semibold text-slate-800 text-xs tracking-tight uppercase font-mono leading-tight">
                          {item.unidad}
                        </div>
                        <span className={`inline-block text-[9px] font-bold px-1.5 py-0.2 rounded mt-0.5 uppercase tracking-wider ${
                          isTercerizado 
                            ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}>
                          {serviceType}
                        </span>
                      </td>

                      {/* Chofer */}
                      <td className="py-2.5 px-2 text-slate-800 text-xs whitespace-nowrap">
                        <span className="font-medium">{toTitleCase(item.chofer) || 'Por asignar'}</span>
                        {item.ayudante && item.ayudante !== 'N/A' && (
                          <span className="block text-[10px] text-slate-400">Ayud: {toTitleCase(item.ayudante)}</span>
                        )}
                      </td>

                      {/* Estado */}
                      <td className="py-2.5 px-2 text-center whitespace-nowrap">
                        {isDelivered ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 whitespace-nowrap shadow-2xs">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                            Entregado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300 whitespace-nowrap shadow-2xs">
                            <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                            Pendiente
                          </span>
                        )}
                      </td>

                      {/* Observación */}
                      <td className="py-2.5 px-2.5 text-slate-600 text-xs italic">
                        {item.observacion || 'Sin novedad'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {/* Subtotal por Sede */}
            {items.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100 font-bold text-slate-800 border-t-2 border-slate-300 text-xs">
                  <td colSpan={5} className="py-2.5 px-3">
                    SUBTOTAL {title} ({items.length} pedidos)
                  </td>
                  <td className="py-2.5 px-1.5 text-center font-mono font-black text-slate-950">
                    {totalSedeBultos}
                  </td>
                  <td colSpan={3} className="py-2.5 px-2 text-slate-500 text-[11px]">
                    {entregadosSede} entregados · {pendientesSede} pendientes
                  </td>
                  <td className="py-2.5 px-2 text-center font-mono font-black text-emerald-800">
                    {efectividadSede}%
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & Stats for Farmacias */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Farmacias / Clientes</span>
            <Store className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black font-mono text-slate-900">{stats.farmaciasConNombre || stats.totalDespachos}</span>
            <span className="text-xs font-semibold text-slate-500">Puntos de Entrega</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Pedidos Despachados</span>
            <Hash className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black font-mono text-slate-900">{stats.pedidosConNumero || stats.totalDespachos}</span>
            <span className="text-xs font-semibold text-blue-600">Órdenes activas</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Bultos Farmacéuticos</span>
            <Package className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black font-mono text-slate-900">{stats.totalBultos.toLocaleString()}</span>
            <span className="text-xs font-semibold text-slate-500">Cajas / Bultos</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Efectividad de Entrega</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black font-mono text-emerald-700">{stats.efectividad}%</span>
            <span className="text-xs font-semibold text-slate-500">{stats.entregados} de {stats.totalDespachos}</span>
          </div>
        </div>
      </div>

      {/* Barra de Filtro de Fechas (Por Día) en Pestaña 2 */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-300 rounded-xl p-1.5 text-xs shadow-2xs">
            <span className="px-2 font-bold text-slate-800 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
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

            {/* Fecha Específica */}
            <div className="bg-white px-2.5 py-1 rounded-lg border border-slate-300 flex items-center gap-1.5">
              <input
                id="farmacia-single-date"
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

          {/* Botones de selección rápida */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => onDateChange(getTodayString())}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition cursor-pointer ${
                selectedDate === getTodayString()
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              Hoy ({formatDateLabel(getTodayString())})
            </button>
            <button
              onClick={() => onDateChange(getYesterdayString())}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition cursor-pointer ${
                selectedDate === getYesterdayString()
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
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

        <div className="text-xs text-slate-600 font-mono">
          {selectedDate ? (
            <span>📅 Mostrando despachos del día: <strong className="text-slate-900">{selectedDate}</strong></span>
          ) : (
            <span>📅 Mostrando todos los registros</span>
          )}
        </div>
      </div>

      {/* Internal Filter Bar for Farmacias */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Hub selector */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200 w-full sm:w-auto">
          <button
            onClick={() => setSelectedHubFilter('all')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition cursor-pointer ${
              selectedHubFilter === 'all' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Ambas Sedes ({filteredList.length})
          </button>
          <button
            onClick={() => setSelectedHubFilter('santodomingo')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition cursor-pointer ${
              selectedHubFilter === 'santodomingo' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sede Santo Domingo ({sdDeliveries.length})
          </button>
          <button
            onClick={() => setSelectedHubFilter('santiago')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition cursor-pointer ${
              selectedHubFilter === 'santiago' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sede Santiago ({stgDeliveries.length})
          </button>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap justify-end">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por farmacia, pedido, chofer o provincia..."
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
            />
          </div>

          {/* Botón de Ajuste de Ancho Completo */}
          <button
            onClick={() => setIsFullFitMode(!isFullFitMode)}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors whitespace-nowrap shadow-2xs inline-flex items-center gap-1.5 cursor-pointer shrink-0 ${
              isFullFitMode
                ? 'bg-indigo-50 text-indigo-700 border-indigo-300 hover:bg-indigo-100'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
            title="Ajustar todas las columnas al 100% de la pantalla para ver el reporte completo sin scroll horizontal"
          >
            {isFullFitMode ? (
              <Minimize2 className="w-3.5 h-3.5 text-indigo-600" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5 text-slate-600" />
            )}
            <span>{isFullFitMode ? 'Cuadro Completo (100%)' : 'Vista Expandida'}</span>
          </button>

          {onCopyReportWithPhoto && (
            <button
              onClick={onCopyReportWithPhoto}
              disabled={isCopying}
              className="px-3 py-1.5 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shadow-2xs inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
              title="Copiar imagen del cuadro y resumen al portapapeles para WhatsApp (Ctrl+V)"
            >
              <Copy className={`w-3.5 h-3.5 text-blue-200 ${isCopying ? 'animate-pulse' : ''}`} />
              <span>{isCopying ? 'Copiando...' : '📋 Copiar con Foto'}</span>
            </button>
          )}

          {onCapturePng && (
            <button
              onClick={onCapturePng}
              disabled={isCapturing}
              className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors whitespace-nowrap shadow-2xs inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
              title="Descargar imagen PNG del cuadro de farmacias y pedidos"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>{isCapturing ? 'Capturando...' : '📷 Capturar PNG'}</span>
            </button>
          )}
        </div>
      </div>

      {/* ÁREA CAPTURABLE PARA DETALLE DE FARMACIAS Y PEDIDOS */}
      <div id="area-captura-farmacias" className="space-y-4">
        {/* Encabezado Corporativo Oficial para la Captura de Farmacias */}
        <div className="bg-slate-950 text-white px-6 py-4 rounded-xl shadow-xs border-b-2 border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500"></span>
              <h2 className="text-sm sm:text-base font-extrabold tracking-wider uppercase text-white">
                REPORTE DETALLADO DE FARMACIAS Y PEDIDOS · RD
              </h2>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Fecha: {selectedDate || 'Todas las Fechas'} · Sedes Santo Domingo &amp; Santiago
            </p>
          </div>
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="bg-slate-800 text-emerald-300 border border-slate-700 px-3 py-1 rounded-md font-bold">
              {stats.farmaciasConNombre || stats.totalDespachos} Farmacias
            </span>
            <span className="bg-slate-800 text-blue-300 border border-slate-700 px-3 py-1 rounded-md font-bold">
              {stats.totalBultos.toLocaleString()} Bultos
            </span>
            <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 px-3 py-1 rounded-md font-bold">
              {stats.efectividad}% Efectividad
            </span>
          </div>
        </div>

        {/* Render Sede Santo Domingo */}
        {(selectedHubFilter === 'all' || selectedHubFilter === 'santodomingo') && (
          renderSedeTable(
            'SEDE SANTO DOMINGO - DETALLE DE FARMACIAS Y PEDIDOS',
            'Santo Domingo',
            sdDeliveries,
            'blue'
          )
        )}

        {/* Render Sede Santiago */}
        {(selectedHubFilter === 'all' || selectedHubFilter === 'santiago') && (
          renderSedeTable(
            'SEDE SANTIAGO DE LOS CABALLEROS - DETALLE DE FARMACIAS Y PEDIDOS',
            'Santiago',
            stgDeliveries,
            'amber'
          )
        )}
      </div>
    </div>
  );
};
