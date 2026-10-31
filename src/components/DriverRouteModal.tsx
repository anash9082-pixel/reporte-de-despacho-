import React, { useState, useMemo } from 'react';
import { DeliveryItem } from '../types/delivery';
import { 
  User, 
  X, 
  MessageSquare, 
  Copy, 
  Check, 
  Send, 
  Truck, 
  Package, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  ChevronRight,
  Store,
  Calendar,
  Share2
} from 'lucide-react';

interface DriverRouteModalProps {
  isOpen: boolean;
  onClose: () => void;
  deliveries: DeliveryItem[];
  selectedDate: string;
}

export const DriverRouteModal: React.FC<DriverRouteModalProps> = ({
  isOpen,
  onClose,
  deliveries,
  selectedDate
}) => {
  const [selectedDriver, setSelectedDriver] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // Group deliveries by driver for the selected date
  const driversMap = useMemo(() => {
    const map = new Map<string, DeliveryItem[]>();
    deliveries.forEach((d) => {
      const choferName = (d.chofer || '').trim() || 'Sin Chofer Asignado';
      if (!map.has(choferName)) {
        map.set(choferName, []);
      }
      map.get(choferName)!.push(d);
    });
    return map;
  }, [deliveries]);

  const driverNames = useMemo(() => {
    return Array.from(driversMap.keys()).sort((a, b) => a.localeCompare(b));
  }, [driversMap]);

  // Set default driver when list changes
  React.useEffect(() => {
    if (driverNames.length > 0 && (!selectedDriver || !driverNames.includes(selectedDriver))) {
      setSelectedDriver(driverNames[0]);
    }
  }, [driverNames, selectedDriver]);

  const activeDeliveries = useMemo(() => {
    return selectedDriver ? driversMap.get(selectedDriver) || [] : [];
  }, [selectedDriver, driversMap]);

  const activeDriverUnit = useMemo(() => {
    if (activeDeliveries.length > 0) {
      return activeDeliveries[0].unidad || 'Unidad asignada';
    }
    return '';
  }, [activeDeliveries]);

  const totalBultos = useMemo(() => {
    return activeDeliveries.reduce((acc, d) => acc + (Number(d.bultos) || 0), 0);
  }, [activeDeliveries]);

  const entregadosCount = useMemo(() => {
    return activeDeliveries.filter(d => d.estado.toLowerCase().includes('entregad')).length;
  }, [activeDeliveries]);

  // Generate WhatsApp formatted route text for this specific driver
  const messageText = useMemo(() => {
    if (!selectedDriver || activeDeliveries.length === 0) return '';

    const lines: string[] = [];
    lines.push(`🚚 *HOJA DE RUTA Y DESPACHO DEL DÍA*`);
    lines.push(`👤 *Chofer:* ${selectedDriver.toUpperCase()}`);
    if (activeDriverUnit) {
      lines.push(`🚛 *Unidad:* ${activeDriverUnit}`);
    }
    lines.push(`📅 *Fecha:* ${selectedDate || 'Hoy'}`);
    lines.push(`📦 *Carga:* ${activeDeliveries.length} pedidos | ${totalBultos} bultos totales`);
    lines.push(`────────────────────────`);
    lines.push(`📍 *LISTADO DE ENTREGAS A REALIZAR:*`);

    activeDeliveries.forEach((item, idx) => {
      const num = idx + 1;
      const farmacia = item.farmacia ? item.farmacia.trim() : 'Cliente sin nombre';
      const ped = item.numeroPedido ? ` [Pedido #${item.numeroPedido}]` : '';
      const bultos = item.bultos ? `${item.bultos} bulto(s)` : '1 bulto';
      const prov = item.provincia ? ` (${item.provincia})` : '';
      const estado = item.estado.toLowerCase().includes('entregad') ? '✅ Entregado' : '⏳ Pendiente';

      lines.push(`${num}. *${farmacia}*${ped}`);
      lines.push(`   • Destino: ${prov}`);
      lines.push(`   • Carga: ${bultos}`);
      if (item.horaFacturacion) {
        lines.push(`   • Facturado: ${item.horaFacturacion}`);
      }
      lines.push(`   • Estado: ${estado}`);
      if (item.observacion && item.observacion !== 'Sin novedad') {
        lines.push(`   • Nota: _${item.observacion}_`);
      }
      lines.push(``);
    });

    lines.push(`────────────────────────`);
    lines.push(`⚠️ *Favor confirmar hora de entrega de cada cliente al completar.*`);
    lines.push(`¡Buen viaje y manejo seguro! 🛣️`);

    return lines.join('\n');
  }, [selectedDriver, activeDeliveries, activeDriverUnit, selectedDate, totalBultos]);

  if (!isOpen) return null;

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendWhatsApp = () => {
    const encoded = encodeURIComponent(messageText);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white tracking-wide">
                Hoja de Ruta Individual por Chofer (WhatsApp)
              </h3>
              <p className="text-xs text-slate-400">
                Genera y envía la lista de entregas personalizada para cada chofer al instante
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

        {/* Driver Selector Tabs */}
        <div className="p-4 bg-slate-100/80 border-b border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-600" />
              Selecciona el Chofer a Notificar:
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Fecha activa: <strong>{selectedDate || 'Todas las fechas'}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {driverNames.length === 0 ? (
              <span className="text-xs text-slate-400 italic">No hay choferes con entregas registradas en esta fecha.</span>
            ) : (
              driverNames.map((driver) => {
                const count = driversMap.get(driver)?.length || 0;
                const isSelected = selectedDriver === driver;
                return (
                  <button
                    key={driver}
                    onClick={() => setSelectedDriver(driver)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer border ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    <span className="capitalize">{driver}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      isSelected ? 'bg-blue-800 text-white' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Modal Main Content: Split View (Left: Deliveries List, Right: WhatsApp Preview) */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200">
          {/* Left Column: Orders in Route */}
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div>
                <h4 className="font-extrabold text-slate-900 text-sm capitalize">{selectedDriver || 'Chofer'}</h4>
                <p className="text-xs text-slate-500 font-mono">{activeDriverUnit || 'Sin unidad asignada'}</p>
              </div>
              <div className="text-right text-xs font-mono">
                <span className="block font-bold text-slate-800">{activeDeliveries.length} pedidos</span>
                <span className="text-emerald-700 font-bold">{entregadosCount} entregados</span>
              </div>
            </div>

            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
              {activeDeliveries.map((item, idx) => (
                <div key={item.id} className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center font-mono text-[10px] text-slate-600 font-bold">
                        {idx + 1}
                      </span>
                      {item.farmacia || 'Farmacia sin nombre'}
                    </span>
                    <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      #{item.numeroPedido || 'S/N'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600 text-[11px] pt-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span className="capitalize">{item.provincia || 'N/A'}</span>
                    </span>
                    <span className="font-mono font-bold text-slate-800">
                      {item.bultos} bulto(s)
                    </span>
                    <span className={`px-2 py-0.2 rounded-full font-bold text-[10px] ${
                      item.estado.toLowerCase().includes('entregad')
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                        : 'bg-amber-50 text-amber-800 border border-amber-300'
                    }`}>
                      {item.estado}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: WhatsApp Formatted Output Preview */}
          <div className="p-4 bg-emerald-50/40 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                  Mensaje Listo para WhatsApp:
                </span>
                <span className="text-[11px] text-emerald-700 font-mono font-semibold">Formato WhatsApp</span>
              </div>

              <div className="bg-white rounded-xl border border-emerald-200 p-3.5 text-xs font-mono text-slate-800 whitespace-pre-wrap shadow-inner max-h-[350px] overflow-y-auto leading-relaxed selection:bg-emerald-200">
                {messageText || 'Selecciona un chofer para generar su mensaje de ruta.'}
              </div>
            </div>

            {/* Actions for this Driver */}
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleCopyMessage}
                disabled={!messageText}
                className="flex-1 py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-300" />}
                <span>{copied ? '¡Texto Copiado!' : 'Copiar Texto'}</span>
              </button>

              <button
                onClick={handleSendWhatsApp}
                disabled={!messageText}
                className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
              >
                <Send className="w-4 h-4 text-emerald-100" />
                <span>Enviar a WhatsApp</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Envía a cada chofer su itinerario sin revelar los datos de los demás choferes</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg transition cursor-pointer"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};
