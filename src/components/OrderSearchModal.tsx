import React, { useState, useMemo } from 'react';
import { DeliveryItem } from '../types/delivery';
import { 
  Search, 
  X, 
  Calendar, 
  MapPin, 
  Truck, 
  User, 
  Package, 
  Clock, 
  CheckCircle2, 
  Receipt, 
  Hash, 
  Store, 
  Copy, 
  Check, 
  ExternalLink,
  History,
  ArrowRight
} from 'lucide-react';
import { getHubFromItem, getServiceTypeFromItem } from '../data/mockData';

interface OrderSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  deliveries: DeliveryItem[];
  onSelectDate?: (date: string) => void;
}

export const OrderSearchModal: React.FC<OrderSearchModalProps> = ({
  isOpen,
  onClose,
  deliveries,
  onSelectDate
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Search across all items (regardless of current date filter)
  const results = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return [];

    return deliveries.filter(item => {
      const pedido = (item.numeroPedido || '').toLowerCase();
      const farmacia = (item.farmacia || '').toLowerCase();
      const chofer = (item.chofer || '').toLowerCase();
      const prov = (item.provincia || '').toLowerCase();
      const unid = (item.unidad || '').toLowerCase();
      const obs = (item.observacion || '').toLowerCase();
      const fecha = (item.fecha || '').toLowerCase();

      return (
        pedido.includes(term) ||
        farmacia.includes(term) ||
        chofer.includes(term) ||
        prov.includes(term) ||
        unid.includes(term) ||
        obs.includes(term) ||
        fecha.includes(term)
      );
    });
  }, [deliveries, searchTerm]);

  if (!isOpen) return null;

  const handleCopyOrderInfo = (item: DeliveryItem) => {
    const isEntregado = item.estado.toLowerCase().includes('entregad');
    const text = `📦 *DETALLE DE PEDIDO #${item.numeroPedido || 'N/A'}*\n` +
      `🏥 *Farmacia:* ${item.farmacia || 'N/A'}\n` +
      `📅 *Fecha:* ${item.fecha}\n` +
      `📍 *Provincia:* ${item.provincia}\n` +
      `🚚 *Chofer:* ${item.chofer} (${item.unidad})\n` +
      `📦 *Bultos:* ${item.bultos}\n` +
      `⏱️ *Hora Factura:* ${item.horaFacturacion || '--:--'} | *Hora Entrega:* ${item.horaEntrega || '--:--'}\n` +
      `📌 *Estado:* ${isEntregado ? '✅ Entregado' : '⏳ Pendiente'}\n` +
      (item.observacion ? `💬 *Observación:* ${item.observacion}\n` : '');

    navigator.clipboard.writeText(text);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white tracking-wide">
                Buscador y Rastreador Global de Pedidos
              </h3>
              <p className="text-xs text-slate-400">
                Localiza cualquier pedido, farmacia o cliente en todo el historial
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              autoFocus
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Escribe número de pedido (ej. 1876, 1912), farmacia, chofer o provincia..."
              className="w-full pl-11 pr-10 py-3 bg-white border-2 border-blue-500 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-500/20 shadow-xs"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between mt-2.5 px-1 text-xs text-slate-500">
            <span>
              {searchTerm ? (
                results.length > 0 ? (
                  <strong className="text-blue-600 font-bold">Se encontraron {results.length} coincidencias</strong>
                ) : (
                  <span className="text-rose-600 font-semibold">Sin resultados para "{searchTerm}"</span>
                )
              ) : (
                'Busca en toda la base de datos de Google Sheets sin límite de fecha.'
              )}
            </span>
            <span className="text-slate-400 font-mono text-[11px] hidden sm:inline">
              Total histórico: {deliveries.length} registros
            </span>
          </div>
        </div>

        {/* Results Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {!searchTerm ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Search className="w-10 h-10 mx-auto text-slate-300 stroke-1" />
              <p className="font-semibold text-slate-600 text-sm">¿Qué pedido o cliente deseas rastrear?</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Ingresa el número de conduce o pedido, el nombre de la farmacia o el chofer para ver su estatus y horario en vivo.
              </p>
            </div>
          ) : results.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto text-lg font-bold">
                ✕
              </div>
              <p className="font-semibold text-slate-700 text-sm">No se encontraron registros</p>
              <p className="text-xs text-slate-400">Verifica el número de pedido o nombre de la farmacia ingresada.</p>
            </div>
          ) : (
            results.map((item) => {
              const isEntregado = item.estado.toLowerCase().includes('entregad');
              const hub = getHubFromItem(item);
              const isCopied = copiedId === item.id;

              return (
                <div 
                  key={item.id}
                  className="bg-white p-4 rounded-xl border border-slate-200 hover:border-blue-400 shadow-2xs hover:shadow-xs transition space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 text-blue-800 font-black font-mono text-xs border border-blue-200">
                        <Hash className="w-3.5 h-3.5 text-blue-600" />
                        {item.numeroPedido || 'S/N'}
                      </span>
                      <span className="font-extrabold text-sm text-slate-900">
                        {item.farmacia || 'Farmacia sin nombre'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        isEntregado 
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-300' 
                          : 'bg-amber-50 text-amber-800 border border-amber-300'
                      }`}>
                        {isEntregado ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Clock className="w-3.5 h-3.5 text-amber-600" />}
                        {item.estado}
                      </span>

                      <button
                        onClick={() => handleCopyOrderInfo(item)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition inline-flex items-center gap-1 cursor-pointer"
                        title="Copiar información de este pedido para WhatsApp"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                        <span>{isCopied ? '¡Copiado!' : 'Copiar'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Metadata Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="bg-slate-50 p-2 rounded-lg">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Fecha Despacho</span>
                      <div className="flex items-center gap-1 font-mono font-bold text-slate-800 mt-0.5">
                        <Calendar className="w-3.5 h-3.5 text-blue-500" />
                        <span>{item.fecha}</span>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-2 rounded-lg">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Ruta / Destino</span>
                      <div className="flex items-center gap-1 font-semibold text-slate-800 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-rose-500" />
                        <span className="capitalize">{item.provincia || 'N/A'}</span>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-2 rounded-lg">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Horarios Fact/Entrega</span>
                      <div className="font-mono text-slate-800 mt-0.5 font-bold">
                        <span>{item.horaFacturacion || '--:--'}</span>
                        <span className="text-slate-400 mx-1">➔</span>
                        <span className={item.horaEntrega ? 'text-emerald-700 font-black' : 'text-slate-400'}>
                          {item.horaEntrega || '--:--'}
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-2 rounded-lg">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Bultos / Cajas</span>
                      <div className="flex items-center gap-1 font-mono font-black text-slate-900 mt-0.5">
                        <Package className="w-3.5 h-3.5 text-purple-600" />
                        <span>{item.bultos} bulto(s)</span>
                      </div>
                    </div>
                  </div>

                  {/* Driver / Assigned Unit */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1 text-slate-600">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        Chofer: <strong className="text-slate-900 font-semibold capitalize">{item.chofer || 'Por asignar'}</strong>
                      </span>
                      <span className="flex items-center gap-1 font-mono">
                        <Truck className="w-3.5 h-3.5 text-slate-400" />
                        <strong className="text-slate-800 uppercase">{item.unidad}</strong>
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold uppercase">
                        {hub === 'santodomingo' ? 'Sede Sto. Dgo.' : 'Sede Santiago'}
                      </span>
                    </div>

                    {item.observacion && (
                      <span className="text-slate-500 italic text-[11px] bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                        "{item.observacion}"
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Presiona <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono text-[10px] shadow-2xs">ESC</kbd> o cerrar para volver al reporte</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
