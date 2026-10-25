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
  FileSpreadsheet
} from 'lucide-react';

interface FarmaciasTabProps {
  deliveries: DeliveryItem[];
  selectedDate: string;
}

export const FarmaciasTab: React.FC<FarmaciasTabProps> = ({
  deliveries,
  selectedDate
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHubFilter, setSelectedHubFilter] = useState<'all' | 'santodomingo' | 'santiago'>('all');

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
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                <th scope="col" className="py-2.5 px-4 w-12 text-center">#</th>
                <th scope="col" className="py-2.5 px-3 min-w-[200px]">Farmacia / Distribuidora</th>
                <th scope="col" className="py-2.5 px-3 w-36">Número de Pedido</th>
                <th scope="col" className="py-2.5 px-3 text-center w-24">Bultos</th>
                <th scope="col" className="py-2.5 px-3 w-36">Ruta / Provincia</th>
                <th scope="col" className="py-2.5 px-3 w-44">Unidad Asignada</th>
                <th scope="col" className="py-2.5 px-3 w-40">Chofer</th>
                <th scope="col" className="py-2.5 px-3 text-center w-28">Estado</th>
                <th scope="col" className="py-2.5 px-3 min-w-[180px]">Observación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 italic">
                    No hay despachos de farmacias registrados para esta sede en la fecha seleccionada.
                  </td>
                </tr>
              ) : (
                items.map((item, idx) => {
                  const isDelivered = item.estado.toLowerCase().includes('entregad');
                  const serviceType = getServiceTypeFromItem(item);
                  const isTercerizado = serviceType === 'Transporte Blanco';
                  const farmaciaDisplay = item.farmacia && item.farmacia.trim() 
                    ? item.farmacia 
                    : `Cliente Ruta ${item.provincia}`;
                  const pedidoDisplay = item.numeroPedido && item.numeroPedido.trim()
                    ? item.numeroPedido
                    : `PED-${String(idx + 101).padStart(4, '0')}`;

                  return (
                    <tr 
                      key={item.id} 
                      className={`hover:bg-slate-50/80 transition-colors ${
                        idx % 2 === 1 ? 'bg-slate-50/40' : 'bg-white'
                      }`}
                    >
                      {/* Num */}
                      <td className="py-2.5 px-4 text-center font-mono text-slate-400 text-[11px]">
                        {idx + 1}
                      </td>

                      {/* Farmacia / Distribuidora */}
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
                            <Store className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block leading-tight">
                              {farmaciaDisplay}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {item.provincia}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Número de Pedido */}
                      <td className="py-2.5 px-3 font-mono">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 font-bold text-[11px]">
                          <Hash className="w-3 h-3 text-blue-500" />
                          {pedidoDisplay}
                        </span>
                      </td>

                      {/* Bultos */}
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-900">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-black">
                          <Package className="w-3 h-3 text-slate-500" />
                          {item.bultos}
                        </span>
                      </td>

                      {/* Ruta / Provincia */}
                      <td className="py-2.5 px-3 text-slate-700">
                        <div className="flex items-center gap-1 text-[11px]">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="font-medium truncate">{item.provincia}</span>
                        </div>
                      </td>

                      {/* Unidad Asignada */}
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-800 text-[11px]">
                          {item.unidad}
                        </div>
                        <span className={`inline-block text-[9px] font-bold px-1.5 py-0.2 rounded mt-0.5 ${
                          isTercerizado 
                            ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}>
                          {serviceType}
                        </span>
                      </td>

                      {/* Chofer */}
                      <td className="py-2.5 px-3 text-slate-700 text-[11px]">
                        <span className="font-medium">{item.chofer || 'Por asignar'}</span>
                        {item.ayudante && item.ayudante !== 'N/A' && (
                          <span className="block text-[10px] text-slate-400">Ayudante: {item.ayudante}</span>
                        )}
                      </td>

                      {/* Estado */}
                      <td className="py-2.5 px-3 text-center">
                        {isDelivered ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Entregado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            <Clock className="w-3 h-3 text-amber-600" />
                            Pendiente
                          </span>
                        )}
                      </td>

                      {/* Observación */}
                      <td className="py-2.5 px-3 text-slate-600 text-[11px] italic">
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
                <tr className="bg-slate-100 font-bold text-slate-800 border-t-2 border-slate-300 text-[11px]">
                  <td colSpan={3} className="py-2.5 px-4">
                    SUBTOTAL {title} ({items.length} pedidos)
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono font-black text-slate-950">
                    {totalSedeBultos}
                  </td>
                  <td colSpan={3} className="py-2.5 px-3 text-slate-500">
                    {entregadosSede} entregados · {pendientesSede} pendientes
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono font-black text-emerald-800">
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

        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por farmacia, pedido, chofer o provincia..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
          />
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
  );
};
