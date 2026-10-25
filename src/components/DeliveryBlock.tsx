import React from 'react';
import { BlockMeta, DeliveryItem, DeliveryStatus } from '../types/delivery';
import { 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Edit3, 
  Trash2, 
  Truck, 
  Building2, 
  Plus
} from 'lucide-react';

interface DeliveryBlockProps {
  blockMeta: BlockMeta;
  items: DeliveryItem[];
  onToggleStatus: (id: string) => void;
  onEditItem: (item: DeliveryItem) => void;
  onDeleteItem: (id: string) => void;
  onAddNewToBlock: (blockId: BlockMeta['id']) => void;
}

export const DeliveryBlock: React.FC<DeliveryBlockProps> = ({
  blockMeta,
  items,
  onToggleStatus,
  onEditItem,
  onDeleteItem,
  onAddNewToBlock
}) => {
  const totalBultos = items.reduce((acc, item) => acc + (Number(item.bultos) || 0), 0);
  const entregadosCount = items.filter(item => item.estado === 'Entregado').length;
  const pendientesCount = items.filter(item => item.estado === 'Pendiente').length;
  const bultosEntregados = items
    .filter(item => item.estado === 'Entregado')
    .reduce((acc, item) => acc + (Number(item.bultos) || 0), 0);
  const bultosPendientes = items
    .filter(item => item.estado === 'Pendiente')
    .reduce((acc, item) => acc + (Number(item.bultos) || 0), 0);
  
  const completionPct = items.length > 0 ? Math.round((entregadosCount / items.length) * 100) : 0;

  const isTercerizado = blockMeta.tipo === 'tercerizado';

  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden transition-all print-break-inside-avoid">
      {/* Block Header */}
      <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50/80 via-white to-slate-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
            isTercerizado ? 'bg-indigo-50 text-indigo-700' : 'bg-blue-50 text-blue-700'
          }`}>
            {isTercerizado ? <Truck className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                {blockMeta.titulo}
              </h2>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                isTercerizado
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}>
                {blockMeta.badgeLabel}
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs font-medium text-slate-500">
                Sede {blockMeta.sede}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {blockMeta.subtitulo}
            </p>
          </div>
        </div>

        {/* Header Stats Badges & Quick Add */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 self-start sm:self-auto">
          <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-100/80 px-2.5 py-1 rounded-md">
            <span>Viajes: <strong className="font-mono text-slate-900">{items.length}</strong></span>
            <span>·</span>
            <span>Listos: <strong className="font-mono text-emerald-700">{entregadosCount}</strong></span>
            <span>·</span>
            <span>Pend.: <strong className="font-mono text-amber-700">{pendientesCount}</strong></span>
          </div>

          <div className="bg-slate-900 text-white px-3 py-1 rounded-md text-xs font-mono font-semibold tabular-nums shadow-2xs">
            {totalBultos.toLocaleString()} Bultos
          </div>

          <button
            onClick={() => onAddNewToBlock(blockMeta.id)}
            className="no-print p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg border border-slate-200 transition-colors cursor-pointer"
            title="Añadir nueva entrega a este bloque"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Bar within block */}
      <div className="w-full bg-slate-100 h-1">
        <div 
          className="bg-emerald-500 h-1 transition-all duration-300" 
          style={{ width: `${completionPct}%` }}
          title={`${completionPct}% completado`}
        />
      </div>

      {/* High-density Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[760px]">
          <thead>
            <tr className="bg-slate-50/70 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
              <th scope="col" className="px-4 py-3 w-48">Unidad de Entrega</th>
              <th scope="col" className="px-4 py-3 w-44">Chofer</th>
              <th scope="col" className="px-4 py-3 w-36">Ayudante</th>
              <th scope="col" className="px-4 py-3 w-36">Provincia</th>
              <th scope="col" className="px-4 py-3 w-32">Estado</th>
              <th scope="col" className="px-4 py-3 text-right w-36">Cantidad de Bultos</th>
              <th scope="col" className="px-4 py-3 min-w-48">Observación</th>
              <th scope="col" className="px-3 py-3 text-center w-20 no-print">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {items.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-10 text-center text-sm text-slate-500">
                  <p className="font-medium">No hay entregas registradas en este bloque que coincidan con el filtro.</p>
                  <p className="text-xs text-slate-400 mt-1">Usa el botón &quot;+&quot; para registrar un nuevo viaje o ajusta la búsqueda.</p>
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const isDelivered = item.estado === 'Entregado';
                return (
                  <tr 
                    key={item.id} 
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    {/* 1. Unidad de Entrega (Vehículo/Ficha) */}
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      <div className="flex flex-col">
                        <span>{item.unidad}</span>
                        {item.horaDespacho && (
                          <span className="text-[11px] text-slate-400 font-mono font-normal">
                            Salida: {item.horaDespacho}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 2. Chofer */}
                    <td className="px-4 py-3 text-slate-800 font-medium">
                      {item.chofer}
                    </td>

                    {/* 3. Ayudante (o "N/A" si no aplica, como en el transporte blanco) */}
                    <td className="px-4 py-3 text-slate-600">
                      {item.ayudante === 'N/A' || !item.ayudante ? (
                        <span className="text-slate-400 font-mono text-xs">N/A</span>
                      ) : (
                        <span className="text-slate-700">{item.ayudante}</span>
                      )}
                    </td>

                    {/* 4. Provincia (Destino) */}
                    <td className="px-4 py-3 text-slate-800">
                      <span className="inline-flex items-center gap-1 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {item.provincia}
                      </span>
                    </td>

                    {/* 5. Estado (con insignias/badges visuales diferenciadas) */}
                    <td className="px-4 py-3">
                      <button
                        onClick={() => onToggleStatus(item.id)}
                        title="Hacer clic para cambiar estado (Entregado / Pendiente)"
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-2xs ${
                          isDelivered
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                        }`}
                      >
                        {isDelivered ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                        )}
                        <span>{item.estado}</span>
                      </button>
                    </td>

                    {/* 6. Cantidad de Bultos */}
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                      {item.bultos.toLocaleString()}
                    </td>

                    {/* 7. Observación */}
                    <td className="px-4 py-3 text-xs text-slate-600 leading-relaxed">
                      {item.observacion || <span className="text-slate-400 italic">Sin observaciones</span>}
                    </td>

                    {/* Actions */}
                    <td className="px-3 py-3 text-center no-print">
                      <div className="flex items-center justify-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onEditItem(item)}
                          className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                          title="Editar entrega"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteItem(item.id)}
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                          title="Eliminar entrega"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>

          {/* Table Footer with Subtotal and Metric Sums */}
          <tfoot>
            <tr className="bg-slate-50 border-t-2 border-slate-200 font-semibold text-sm text-slate-800">
              <td colSpan={5} className="px-4 py-3 text-right text-xs uppercase tracking-wider text-slate-500">
                Sumatoria Total de Bultos ({blockMeta.titulo}):
              </td>
              <td className="px-4 py-3 text-right font-mono text-base font-bold text-blue-700 tabular-nums">
                {totalBultos.toLocaleString()}
              </td>
              <td colSpan={2} className="px-4 py-3 text-xs text-slate-500">
                <span className="text-emerald-700 font-medium font-mono">{bultosEntregados} entregados</span>
                <span className="mx-1">/</span>
                <span className="text-amber-700 font-medium font-mono">{bultosPendientes} pendientes</span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
};
