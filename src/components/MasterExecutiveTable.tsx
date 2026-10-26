import React from 'react';
import { DeliveryItem, BlockId, VisibleColumns, DEFAULT_VISIBLE_COLUMNS } from '../types/delivery';
import { 
  ORDERED_HUB_IDS, 
  HUBS_CONFIG, 
  getHubFromItem, 
  getServiceTypeFromItem 
} from '../data/mockData';
import { 
  MapPin, 
  Edit3, 
  Trash2, 
  Plus,
  CheckCircle2,
  Clock,
  Building2,
  Truck,
  SlidersHorizontal
} from 'lucide-react';

interface MasterExecutiveTableProps {
  deliveries: DeliveryItem[];
  selectedDate?: string;
  startDate?: string;
  endDate?: string;
  visibleColumns?: VisibleColumns;
  onToggleStatus: (id: string) => void;
  onEditItem: (item: DeliveryItem) => void;
  onDeleteItem: (id: string) => void;
  onAddNewToBlock: (blockId: BlockId) => void;
  onOpenColumnsModal?: () => void;
}

export const MasterExecutiveTable: React.FC<MasterExecutiveTableProps> = ({
  deliveries,
  selectedDate = '',
  startDate = '',
  endDate = '',
  visibleColumns = DEFAULT_VISIBLE_COLUMNS,
  onToggleStatus,
  onEditItem,
  onDeleteItem,
  onAddNewToBlock,
  onOpenColumnsModal
}) => {
  const dateLabel = React.useMemo(() => {
    if (startDate && endDate) {
      if (startDate === endDate) return `Fecha: ${startDate}`;
      return `Período: ${startDate} al ${endDate}`;
    }
    if (startDate) return `Desde: ${startDate}`;
    if (endDate) return `Hasta: ${endDate}`;
    return selectedDate ? `Fecha: ${selectedDate}` : 'Todas las Fechas';
  }, [startDate, endDate, selectedDate]);
  // Global totals across current filtered deliveries
  const totalGeneralViajes = deliveries.length;
  const totalGeneralBultos = deliveries.reduce((acc, d) => acc + (Number(d.bultos) || 0), 0);
  const totalGeneralEntregados = deliveries.filter(d => d.estado.toLowerCase().includes('entregad')).length;
  const totalGeneralPendientes = deliveries.filter(d => !d.estado.toLowerCase().includes('entregad')).length;
  const efectividadTotal = totalGeneralViajes > 0 
    ? Math.round((totalGeneralEntregados / totalGeneralViajes) * 100) 
    : 0;

  // Compute leading and metric colspans dynamically
  let leadingColSpan = 0;
  if (visibleColumns.unidad) leadingColSpan++;
  if (visibleColumns.chofer) leadingColSpan++;
  if (visibleColumns.ayudante) leadingColSpan++;
  if (visibleColumns.provincia) leadingColSpan++;
  if (visibleColumns.farmacia) leadingColSpan++;
  if (visibleColumns.numeroPedido) leadingColSpan++;
  if (visibleColumns.observacion) leadingColSpan++;
  leadingColSpan = Math.max(1, leadingColSpan);

  let metricColSpan = 0;
  if (visibleColumns.entregados) metricColSpan++;
  if (visibleColumns.pendientes) metricColSpan++;
  if (visibleColumns.totalViajes) metricColSpan++;
  if (visibleColumns.bultos) metricColSpan++;
  if (visibleColumns.efectividad) metricColSpan++;
  metricColSpan = Math.max(1, metricColSpan);

  const totalCols = leadingColSpan + metricColSpan + (visibleColumns.acciones ? 1 : 0);

  const renderColumnHeaders = (keyPrefix: string) => (
    <tr key={keyPrefix} className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-300 text-[11px] uppercase tracking-wider">
      {visibleColumns.unidad && (
        <th scope="col" className="py-2.5 px-4 w-44">Unidad / Servicio</th>
      )}
      {visibleColumns.chofer && (
        <th scope="col" className="py-2.5 px-3">Chofer</th>
      )}
      {visibleColumns.ayudante && (
        <th scope="col" className="py-2.5 px-3 w-28">Ayudante</th>
      )}
      {visibleColumns.provincia && (
        <th scope="col" className="py-2.5 px-3 w-36">Ruta / Provincia</th>
      )}
      {visibleColumns.farmacia && (
        <th scope="col" className="py-2.5 px-3 min-w-36">Farmacia / Cliente</th>
      )}
      {visibleColumns.numeroPedido && (
        <th scope="col" className="py-2.5 px-3 w-32">Nº Pedido</th>
      )}
      {visibleColumns.observacion && (
        <th scope="col" className="py-2.5 px-3 min-w-44">Observación / Conduce</th>
      )}
      {visibleColumns.entregados && (
        <th scope="col" className="py-2.5 px-2 text-center w-20">Entregados</th>
      )}
      {visibleColumns.pendientes && (
        <th scope="col" className="py-2.5 px-2 text-center w-20">Pendientes</th>
      )}
      {visibleColumns.totalViajes && (
        <th scope="col" className="py-2.5 px-2 text-center w-20">Total Viajes</th>
      )}
      {visibleColumns.bultos && (
        <th scope="col" className="py-2.5 px-3 text-center w-24">Bultos</th>
      )}
      {visibleColumns.efectividad && (
        <th scope="col" className="py-2.5 px-3 text-center w-24">Efectividad</th>
      )}
      {visibleColumns.acciones && (
        <th scope="col" className="py-2.5 px-2 text-center w-16 no-capture no-print">Acción</th>
      )}
    </tr>
  );

  return (
    <div 
      id="area-captura" 
      className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden"
    >
      {/* Encabezado Corporativo Oficial para Captura / Pantalla */}
      <div className="bg-slate-950 text-white px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b-2 border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-xs bg-blue-500"></span>
            <h2 className="text-sm sm:text-base font-extrabold tracking-wider uppercase text-white">
              REPORTE DIARIO DE DESPACHOS Y ENTREGAS · RD
            </h2>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-0.5" id="label-fecha-reporte">
            {dateLabel} · Sedes Santo Domingo &amp; Santiago de los Caballeros
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span 
            className="text-xs bg-slate-800 text-blue-300 border border-slate-700 px-3 py-1 rounded-md font-semibold font-mono"
            id="badge-total-unidades"
          >
            {totalGeneralViajes} viajes consolidados
          </span>
          <span className="text-xs bg-slate-800 text-emerald-400 px-3 py-1 rounded-md font-mono font-bold border border-slate-700">
            {totalGeneralBultos.toLocaleString()} Bultos ({efectividadTotal}% Efectividad)
          </span>
          {onOpenColumnsModal && (
            <button
              onClick={onOpenColumnsModal}
              className="no-print text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-500 px-2.5 py-1 rounded-md font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Configurar columnas visibles en el reporte"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-blue-400" />
              <span>Personalizar Columnas</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabla Maestra Dinámica con Encabezados para Cada Sede */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <tbody id="tabla-cuerpo" className="divide-y divide-slate-200">
            {ORDERED_HUB_IDS.map((hubId) => {
              const hub = HUBS_CONFIG[hubId];
              const itemsHub = deliveries.filter(d => getHubFromItem(d) === hubId);

              let hubBultos = 0;
              let hubEntregados = 0;
              let hubPendientes = 0;
              const hubViajes = itemsHub.length;

              itemsHub.forEach(i => {
                hubBultos += Number(i.bultos) || 0;
                if (i.estado.toLowerCase().includes('entregad')) hubEntregados++;
                else hubPendientes++;
              });

              const efectividadHub = hubViajes > 0 
                ? Math.round((hubEntregados / hubViajes) * 100) 
                : 0;

              const defaultBlockId: BlockId = hubId === 'santiago' ? 'santiago_propia' : 'santodomingo_propia';

              return (
                <React.Fragment key={hubId}>
                  {/* Fila de Cabecera de Sede Unificada (Barra Oscura Corporativa) */}
                  <tr className={`bg-slate-900 text-white font-semibold text-xs border-y-2 border-slate-950 ${hub.accentBorder}`}>
                    <td colSpan={leadingColSpan} className="py-3 px-4">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <div className="w-5 h-5 rounded-xs bg-slate-800 flex items-center justify-center text-blue-400">
                          <Building2 className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-extrabold tracking-wide uppercase text-white text-xs sm:text-sm">
                          {hub.titulo}
                        </span>
                        <span className={`text-[10px] px-2.5 py-0.5 rounded font-mono border font-bold uppercase tracking-wider ${hub.accentBadge}`}>
                          {hub.badgeLabel}
                        </span>
                      </div>
                    </td>
                    <td colSpan={metricColSpan + (visibleColumns.acciones ? 1 : 0)} className="py-3 px-4 text-right text-slate-300 font-mono text-[11px]">
                      <span className="bg-slate-800 text-blue-300 px-2.5 py-1 rounded border border-slate-700 font-semibold mr-2">
                        {hubViajes} unidad{hubViajes === 1 ? '' : 'es'} ({efectividadHub}% efec.)
                      </span>
                      <span className="font-bold text-white">
                        {hubBultos.toLocaleString()} Bultos
                      </span>
                      <button
                        onClick={() => onAddNewToBlock(defaultBlockId)}
                        className="no-capture no-print ml-2.5 p-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded inline-flex items-center cursor-pointer transition"
                        title={`Añadir despacho a ${hub.titulo}`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>

                  {/* Encabezados de columnas de esta Sede */}
                  {renderColumnHeaders(`head-${hubId}`)}

                  {/* Filas de detalle de la Sede */}
                  {itemsHub.length === 0 ? (
                    <tr className="bg-slate-50 text-slate-400 italic text-xs">
                      <td colSpan={totalCols} className="py-4 px-6 text-center">
                        0 unidades asignadas - Sin operaciones registradas para {hub.titulo} en esta fecha
                      </td>
                    </tr>
                  ) : (
                    itemsHub.map((item, idx) => {
                      const esEntregado = item.estado.toLowerCase().includes('entregad');
                      const serviceType = getServiceTypeFromItem(item);
                      const isBlanco = serviceType === 'Transporte Blanco';
                      const rowBg = idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60';

                      return (
                        <tr 
                          key={item.id} 
                          className={`${rowBg} hover:bg-blue-50/50 transition border-b border-slate-200/80 group`}
                        >
                          {/* 1. Unidad / Servicio */}
                          {visibleColumns.unidad && (
                            <td className="py-2.5 px-4 font-semibold text-slate-900">
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="uppercase font-bold text-slate-900 tracking-tight">
                                    {item.unidad}
                                  </span>
                                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold uppercase tracking-wider border ${
                                    isBlanco 
                                      ? 'bg-sky-50 text-sky-800 border-sky-300' 
                                      : 'bg-slate-100 text-slate-700 border-slate-300'
                                  }`}>
                                    {isBlanco ? 'TB Blanco' : 'Flota Propia'}
                                  </span>
                                </div>
                                {!visibleColumns.observacion && item.observacion && (
                                  <p className="text-[11px] text-slate-500 font-normal leading-tight mt-0.5">
                                    {item.observacion}
                                  </p>
                                )}
                              </div>
                            </td>
                          )}

                          {/* 2. Chofer */}
                          {visibleColumns.chofer && (
                            <td className="py-2.5 px-3 text-slate-800 font-medium">
                              {item.chofer}
                            </td>
                          )}

                          {/* 3. Ayudante */}
                          {visibleColumns.ayudante && (
                            <td className="py-2.5 px-3 text-slate-600">
                              {item.ayudante || 'N/A'}
                            </td>
                          )}

                          {/* 4. Ruta / Provincia */}
                          {visibleColumns.provincia && (
                            <td className="py-2.5 px-3 text-slate-700 font-medium">
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                {item.provincia}
                              </span>
                            </td>
                          )}

                          {/* Farmacia / Cliente */}
                          {visibleColumns.farmacia && (
                            <td className="py-2.5 px-3 text-slate-800 font-semibold text-xs">
                              {item.farmacia || `Cliente ${item.provincia}`}
                            </td>
                          )}

                          {/* Nº Pedido */}
                          {visibleColumns.numeroPedido && (
                            <td className="py-2.5 px-3 font-mono text-[11px] text-blue-700 font-bold">
                              {item.numeroPedido || 'N/A'}
                            </td>
                          )}

                          {/* 5. Observación (columna dedicada) */}
                          {visibleColumns.observacion && (
                            <td className="py-2.5 px-3 text-slate-600 text-xs">
                              {item.observacion || 'Sin novedad'}
                            </td>
                          )}

                          {/* 6. Entregados (1 o 0) */}
                          {visibleColumns.entregados && (
                            <td className="py-2.5 px-2 text-center font-mono">
                              <button
                                onClick={() => onToggleStatus(item.id)}
                                className={`px-2 py-0.5 rounded text-xs font-bold cursor-pointer transition-transform hover:scale-110 ${
                                  esEntregado 
                                    ? 'text-emerald-700 bg-emerald-50 border border-emerald-300 font-bold' 
                                    : 'text-slate-400'
                                }`}
                                title="Haga clic para alternar Estado"
                              >
                                {esEntregado ? 1 : 0}
                              </button>
                            </td>
                          )}

                          {/* 7. Pendientes (1 o 0) */}
                          {visibleColumns.pendientes && (
                            <td className="py-2.5 px-2 text-center font-mono">
                              <button
                                onClick={() => onToggleStatus(item.id)}
                                className={`px-2 py-0.5 rounded text-xs font-bold cursor-pointer transition-transform hover:scale-110 ${
                                  !esEntregado 
                                    ? 'text-amber-800 bg-amber-50 border border-amber-300 font-bold' 
                                    : 'text-slate-400'
                                }`}
                                title="Haga clic para alternar Estado"
                              >
                                {!esEntregado ? 1 : 0}
                              </button>
                            </td>
                          )}

                          {/* 8. Total Viajes */}
                          {visibleColumns.totalViajes && (
                            <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-800">
                              1
                            </td>
                          )}

                          {/* 9. Bultos */}
                          {visibleColumns.bultos && (
                            <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-900 tabular-nums">
                              {Number(item.bultos).toLocaleString()}
                            </td>
                          )}

                          {/* 10. Efectividad */}
                          {visibleColumns.efectividad && (
                            <td className="py-2.5 px-3 text-center font-mono font-semibold">
                              <span className={`px-2 py-0.5 rounded text-[11px] ${
                                esEntregado 
                                  ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200' 
                                  : 'bg-amber-50 text-amber-800 border border-amber-200'
                              }`}>
                                {esEntregado ? '100%' : '0%'}
                              </span>
                            </td>
                          )}

                          {/* 11. Acciones */}
                          {visibleColumns.acciones && (
                            <td className="py-2 px-2 text-center no-capture no-print">
                              <div className="flex items-center justify-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => onEditItem(item)}
                                  className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded cursor-pointer"
                                  title="Editar despacho"
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => onDeleteItem(item.id)}
                                  className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded cursor-pointer"
                                  title="Eliminar"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}

                  {/* Fila Subtotal de la Sede */}
                  <tr className="bg-slate-200/90 font-bold text-slate-900 border-t-2 border-slate-300 text-xs">
                    <td colSpan={leadingColSpan} className="py-2.5 px-4 uppercase tracking-wide font-extrabold text-slate-900">
                      SUBTOTAL {hub.titulo}
                    </td>
                    {visibleColumns.entregados && (
                      <td className="py-2.5 px-2 text-center font-mono text-emerald-800 font-black">
                        {hubEntregados}
                      </td>
                    )}
                    {visibleColumns.pendientes && (
                      <td className="py-2.5 px-2 text-center font-mono text-amber-800 font-black">
                        {hubPendientes}
                      </td>
                    )}
                    {visibleColumns.totalViajes && (
                      <td className="py-2.5 px-2 text-center font-mono font-black text-slate-900">
                        {hubViajes}
                      </td>
                    )}
                    {visibleColumns.bultos && (
                      <td className="py-2.5 px-3 text-center font-mono font-black text-slate-950 tabular-nums">
                        {hubBultos.toLocaleString()}
                      </td>
                    )}
                    {visibleColumns.efectividad && (
                      <td className="py-2.5 px-3 text-center font-mono font-black text-blue-900">
                        {efectividadHub}%
                      </td>
                    )}
                    {visibleColumns.acciones && (
                      <td className="no-capture no-print"></td>
                    )}
                  </tr>
                </React.Fragment>
              );
            })}

            {/* Fila TOTAL GENERAL Consolidado Nacional */}
            <tr className="bg-slate-950 text-white font-extrabold text-xs uppercase tracking-wider border-t-4 border-blue-600">
              <td colSpan={leadingColSpan} className="py-3.5 px-4 text-white">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-blue-500 rounded-xs"></span>
                  <span className="text-sm font-black tracking-wide">TOTAL GENERAL (REPÚBLICA DOMINICANA)</span>
                  <span className="text-[11px] font-mono text-slate-400 font-normal ml-2">
                    ({totalGeneralViajes} viajes consolidados)
                  </span>
                </div>
              </td>
              {visibleColumns.entregados && (
                <td className="py-3.5 px-2 text-center font-mono text-emerald-400 font-black text-sm">
                  {totalGeneralEntregados}
                </td>
              )}
              {visibleColumns.pendientes && (
                <td className="py-3.5 px-2 text-center font-mono text-amber-400 font-black text-sm">
                  {totalGeneralPendientes}
                </td>
              )}
              {visibleColumns.totalViajes && (
                <td className="py-3.5 px-2 text-center font-mono text-white font-black text-sm">
                  {totalGeneralViajes}
                </td>
              )}
              {visibleColumns.bultos && (
                <td className="py-3.5 px-3 text-center font-mono text-white font-black text-sm tabular-nums">
                  {totalGeneralBultos.toLocaleString()}
                </td>
              )}
              {visibleColumns.efectividad && (
                <td className="py-3.5 px-3 text-center font-mono text-blue-300 font-black text-sm">
                  {efectividadTotal}%
                </td>
              )}
              {visibleColumns.acciones && (
                <td className="no-capture no-print"></td>
              )}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Pie informativo para la captura gerencial */}
      <div className="bg-slate-900 text-slate-300 px-6 py-3 flex flex-wrap justify-between items-center text-xs gap-3 border-t border-slate-800">
        <div className="flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <strong className="text-white font-mono">{totalGeneralEntregados}</strong> Entregados
          </span>
          <span className="text-slate-600">·</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <strong className="text-white font-mono">{totalGeneralPendientes}</strong> Pendientes
          </span>
          <span className="text-slate-600">·</span>
          <span className="flex items-center gap-1">
            <Truck className="w-3.5 h-3.5 text-blue-400" />
            <strong className="text-white font-mono">{totalGeneralBultos.toLocaleString()}</strong> Bultos Totales
          </span>
        </div>
        <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2">
          {onOpenColumnsModal && (
            <button
              onClick={onOpenColumnsModal}
              className="no-capture no-print text-blue-400 hover:text-blue-300 underline font-sans cursor-pointer"
            >
              Configurar Columnas
            </button>
          )}
          <span>Operación Logística RD · Santo Domingo &amp; Santiago</span>
        </div>
      </div>
    </div>
  );
};
