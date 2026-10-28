import React, { useState, useMemo } from 'react';
import { DeliveryItem, KPIData } from '../types/delivery';
import { getHubFromItem, getServiceTypeFromItem } from '../data/mockData';
import { 
  MessageSquare, 
  X, 
  Copy, 
  Check, 
  Send, 
  Sparkles, 
  Calendar, 
  Building2, 
  Truck, 
  TrendingUp, 
  FileText,
  Camera
} from 'lucide-react';
import { copyReportImageToClipboard } from '../utils/captureHelper';

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  deliveries: DeliveryItem[];
  selectedDate?: string;
  startDate?: string;
  endDate?: string;
  kpis: KPIData;
}

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({
  isOpen,
  onClose,
  deliveries,
  selectedDate = '',
  startDate = '',
  endDate = '',
  kpis
}) => {
  const [includeHeader, setIncludeHeader] = useState(true);
  const [includeKpis, setIncludeKpis] = useState(true);
  const [includeBases, setIncludeBases] = useState(true);
  const [includeDetails, setIncludeDetails] = useState(true);
  const [includeFarmacias, setIncludeFarmacias] = useState(true);
  const [includeProvincias, setIncludeProvincias] = useState(true);
  const [includeFooter, setIncludeFooter] = useState(true);
  const [copied, setCopied] = useState(false);

  const formattedDate = useMemo(() => {
    if (startDate && endDate) {
      if (startDate === endDate) return startDate;
      return `${startDate} al ${endDate}`;
    }
    if (startDate) return `Desde ${startDate}`;
    if (endDate) return `Hasta ${endDate}`;
    return selectedDate || 'Consolidado General';
  }, [startDate, endDate, selectedDate]);

  // Generate WhatsApp formatted text
  const messageText = useMemo(() => {
    const lines: string[] = [];

    // 1. Header & Date
    if (includeHeader) {
      lines.push('🚚 *REPORTE DIARIO DE DESPACHOS Y ENTREGAS · RD*');
      lines.push(`📅 *Fecha / Período:* ${formattedDate}`);
      lines.push('──────────────────────');
    }

    // 2. Executive KPI Summary
    if (includeKpis) {
      lines.push('📊 *RESUMEN EJECUTIVO GENERAL*');
      lines.push(`• Total Viajes / Unidades: *${kpis.totalEntregas}*`);
      lines.push(`• Entregados con Éxito: *${kpis.totalEntregados}* ✅`);
      lines.push(`• Pendientes de Entrega: *${kpis.totalPendientes}* ⏳`);
      lines.push(`• Total General de Bultos: *${kpis.totalBultos.toLocaleString()}* 📦`);
      lines.push(`• Efectividad Global: *${kpis.porcentajeCompletado}%*`);
      lines.push('──────────────────────');
    }

    // 3. Breakdown by Bases
    if (includeBases) {
      lines.push('🏢 *DESGLOSE POR BASES / OPERACIONES*');

      // 4 Bases
      const bases = [
        {
          name: 'BASE SANTO DOMINGO (Flota Propia)',
          filter: (d: DeliveryItem) => getHubFromItem(d) === 'santodomingo' && getServiceTypeFromItem(d) === 'Flota Propia'
        },
        {
          name: 'TRANSPORTE BLANCO - SANTO DOMINGO',
          filter: (d: DeliveryItem) => getHubFromItem(d) === 'santodomingo' && getServiceTypeFromItem(d) === 'Transporte Blanco'
        },
        {
          name: 'BASE SANTIAGO DE LOS CABALLEROS (Flota Propia)',
          filter: (d: DeliveryItem) => getHubFromItem(d) === 'santiago' && getServiceTypeFromItem(d) === 'Flota Propia'
        },
        {
          name: 'TRANSPORTE BLANCO - SANTIAGO',
          filter: (d: DeliveryItem) => getHubFromItem(d) === 'santiago' && getServiceTypeFromItem(d) === 'Transporte Blanco'
        }
      ];

      bases.forEach((base) => {
        const items = deliveries.filter(base.filter);
        if (items.length === 0) return;

        const bultos = items.reduce((acc, i) => acc + (Number(i.bultos) || 0), 0);
        const entregados = items.filter(i => i.estado.toLowerCase().includes('entregad')).length;
        const pendientes = items.length - entregados;
        const efectividad = items.length > 0 ? Math.round((entregados / items.length) * 100) : 0;

        lines.push(`\n📍 *${base.name}*`);
        lines.push(`  • Unidades: *${items.length}* | Bultos: *${bultos}* | Efec: *${efectividad}%*`);
        lines.push(`  • Entregados: ${entregados} ✅ | Pendientes: ${pendientes} ⏳`);

        if (includeDetails) {
          items.forEach((item) => {
            const isDelivered = item.estado.toLowerCase().includes('entregad');
            const icon = isDelivered ? '✅' : '⏳';
            lines.push(`    - ${icon} *${item.unidad.toUpperCase()}*: ${item.chofer || 'Chofer'} ➔ ${item.provincia} (${item.bultos} bultos)${item.observacion ? ` [${item.observacion}]` : ''}`);
          });
        }
      });
      lines.push('──────────────────────');
    }

    // 4. Breakdown by Provinces (Conteo de Pedidos por Provincia)
    if (includeProvincias) {
      lines.push('📍 *CONSOLIDADO DE PEDIDOS POR PROVINCIA*');
      const provMap = new Map<string, { pedidos: number; bultos: number; entregados: number; pendientes: number; farmacias: string[] }>();
      deliveries.forEach(d => {
        const prov = (d.provincia || 'Otras').trim();
        const cur = provMap.get(prov) || { pedidos: 0, bultos: 0, entregados: 0, pendientes: 0, farmacias: [] };
        cur.pedidos += 1;
        cur.bultos += Number(d.bultos) || 0;
        if (d.estado.toLowerCase().includes('entregad')) cur.entregados += 1;
        else cur.pendientes += 1;
        if (d.farmacia && !cur.farmacias.includes(d.farmacia)) cur.farmacias.push(d.farmacia);
        provMap.set(prov, cur);
      });

      provMap.forEach((val, prov) => {
        const efec = val.pedidos > 0 ? Math.round((val.entregados / val.pedidos) * 100) : 0;
        lines.push(`• *${prov.toUpperCase()}*: *${val.pedidos} pedidos* | ${val.bultos} bultos | Efec: ${efec}%`);
        if (val.farmacias.length > 0) {
          lines.push(`  ↳ Farmacias: ${val.farmacias.slice(0, 3).join(', ')}${val.farmacias.length > 3 ? '...' : ''}`);
        }
      });
      lines.push('──────────────────────');
    }

    // 5. Breakdown by Farmacias & Pedidos por Sede
    if (includeFarmacias) {
      lines.push('💊 *DETALLE DE FARMACIAS Y PEDIDOS POR SEDE*');
      
      const sdFarmacias = deliveries.filter(d => getHubFromItem(d) === 'santodomingo');
      const stgFarmacias = deliveries.filter(d => getHubFromItem(d) === 'santiago');

      if (sdFarmacias.length > 0) {
        lines.push('\n🏢 *SEDE SANTO DOMINGO*');
        sdFarmacias.forEach(d => {
          const isDelivered = d.estado.toLowerCase().includes('entregad');
          const icon = isDelivered ? '✅' : '⏳';
          const farmName = d.farmacia && d.farmacia.trim() ? d.farmacia : `Cliente ${d.provincia}`;
          const orderNum = d.numeroPedido && d.numeroPedido.trim() ? ` [Ped: ${d.numeroPedido}]` : '';
          const timeInfo = [
            d.horaFacturacion ? `Fact: ${d.horaFacturacion}` : '',
            d.horaEntrega ? `Entr: ${d.horaEntrega}` : ''
          ].filter(Boolean).join(' | ');
          const timeBadge = timeInfo ? ` ⏱️ (${timeInfo})` : '';
          lines.push(`  • ${icon} *${farmName}*${orderNum}: ${d.bultos} bultos (${d.unidad})${timeBadge}`);
        });
      }

      if (stgFarmacias.length > 0) {
        lines.push('\n🏢 *SEDE SANTIAGO DE LOS CABALLEROS*');
        stgFarmacias.forEach(d => {
          const isDelivered = d.estado.toLowerCase().includes('entregad');
          const icon = isDelivered ? '✅' : '⏳';
          const farmName = d.farmacia && d.farmacia.trim() ? d.farmacia : `Cliente ${d.provincia}`;
          const orderNum = d.numeroPedido && d.numeroPedido.trim() ? ` [Ped: ${d.numeroPedido}]` : '';
          const timeInfo = [
            d.horaFacturacion ? `Fact: ${d.horaFacturacion}` : '',
            d.horaEntrega ? `Entr: ${d.horaEntrega}` : ''
          ].filter(Boolean).join(' | ');
          const timeBadge = timeInfo ? ` ⏱️ (${timeInfo})` : '';
          lines.push(`  • ${icon} *${farmName}*${orderNum}: ${d.bultos} bultos (${d.unidad})${timeBadge}`);
        });
      }

      lines.push('──────────────────────');
    }

    // 6. Footer Note
    if (includeFooter) {
      lines.push('📌 _Reporte emitido automáticamente desde el Sistema Gerencial de Despachos RD._');
    }

    return lines.join('\n');
  }, [includeHeader, includeKpis, includeBases, includeDetails, includeProvincias, includeFarmacias, includeFooter, deliveries, selectedDate, kpis]);

  const [isCopyingPhoto, setIsCopyingPhoto] = useState(false);
  const [photoCopied, setPhotoCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(messageText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
    }
  };

  const handleCopyTextAndPhoto = async () => {
    setIsCopyingPhoto(true);
    try {
      const res = await copyReportImageToClipboard('area-captura', messageText);
      setPhotoCopied(true);
      setTimeout(() => setPhotoCopied(false), 3000);
      alert(res.message);
    } catch {
      alert('Texto copiado al portapapeles.');
    } finally {
      setIsCopyingPhoto(false);
    }
  };

  const handleSendWhatsApp = () => {
    const encoded = encodeURIComponent(messageText);
    const url = `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-emerald-900 text-white px-6 py-4 flex items-center justify-between border-b border-emerald-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-xs">
              <MessageSquare className="w-5 h-5 text-emerald-100" />
            </div>
            <div>
              <h3 className="text-base font-extrabold tracking-tight text-white flex items-center gap-2">
                💬 WhatsApp Gerencia
                <span className="bg-emerald-800 text-emerald-200 text-[10px] font-mono px-2 py-0.5 rounded border border-emerald-700">
                  Listo para Enviar
                </span>
              </h3>
              <p className="text-xs text-emerald-200/90">
                Personaliza qué secciones incluir en el mensaje para los directivos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-300 hover:text-white p-1 rounded-lg hover:bg-emerald-800/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Checkboxes de Personalización */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              Selecciona el contenido a incluir:
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <label className="flex items-center gap-2.5 p-2 bg-white rounded-lg border border-slate-200 hover:border-slate-300 cursor-pointer transition select-none">
                <input
                  type="checkbox"
                  checked={includeHeader}
                  onChange={(e) => setIncludeHeader(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                />
                <span className="text-xs font-medium text-slate-700">
                  📅 Encabezado y Fecha
                </span>
              </label>

              <label className="flex items-center gap-2.5 p-2 bg-white rounded-lg border border-slate-200 hover:border-slate-300 cursor-pointer transition select-none">
                <input
                  type="checkbox"
                  checked={includeKpis}
                  onChange={(e) => setIncludeKpis(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                />
                <span className="text-xs font-medium text-slate-700">
                  📊 Resumen Ejecutivo General
                </span>
              </label>

              <label className="flex items-center gap-2.5 p-2 bg-white rounded-lg border border-slate-200 hover:border-slate-300 cursor-pointer transition select-none">
                <input
                  type="checkbox"
                  checked={includeBases}
                  onChange={(e) => setIncludeBases(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                />
                <span className="text-xs font-medium text-slate-700">
                  🏢 Desglose por cada Base
                </span>
              </label>

              <label className="flex items-center gap-2.5 p-2 bg-white rounded-lg border border-slate-200 hover:border-slate-300 cursor-pointer transition select-none">
                <input
                  type="checkbox"
                  checked={includeDetails}
                  disabled={!includeBases}
                  onChange={(e) => setIncludeDetails(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer disabled:opacity-40"
                />
                <span className={`text-xs font-medium ${includeBases ? 'text-slate-700' : 'text-slate-400'}`}>
                  🚚 Detalle de Choferes y Rutas
                </span>
              </label>

              <label className="flex items-center gap-2.5 p-2 bg-white rounded-lg border border-slate-200 hover:border-slate-300 cursor-pointer transition select-none sm:col-span-2">
                <input
                  type="checkbox"
                  checked={includeProvincias}
                  onChange={(e) => setIncludeProvincias(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                />
                <span className="text-xs font-medium text-slate-700">
                  📍 Consolidado de Pedidos por Provincia (Conteo de pedidos y efectividad)
                </span>
              </label>

              <label className="flex items-center gap-2.5 p-2 bg-white rounded-lg border border-slate-200 hover:border-slate-300 cursor-pointer transition select-none sm:col-span-2">
                <input
                  type="checkbox"
                  checked={includeFarmacias}
                  onChange={(e) => setIncludeFarmacias(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                />
                <span className="text-xs font-medium text-slate-700">
                  💊 Detalle de Farmacias y Pedidos por Sede (Clientes, # Pedido y Bultos)
                </span>
              </label>

              <label className="flex items-center gap-2.5 p-2 bg-white rounded-lg border border-slate-200 hover:border-slate-300 cursor-pointer transition select-none sm:col-span-2">
                <input
                  type="checkbox"
                  checked={includeFooter}
                  onChange={(e) => setIncludeFooter(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                />
                <span className="text-xs font-medium text-slate-700">
                  📌 Nota de Cierre / Firma del Sistema
                </span>
              </label>
            </div>
          </div>

          {/* Vista Previa del Mensaje Formateado */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                Vista Previa del Mensaje (formato WhatsApp):
              </label>
              <button
                type="button"
                onClick={handleCopy}
                className="text-xs text-emerald-700 hover:text-emerald-900 font-bold inline-flex items-center gap-1 cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Texto</span>
                  </>
                )}
              </button>
            </div>

            <div className="bg-[#0b141a] text-[#e9edef] p-4 rounded-xl font-mono text-xs whitespace-pre-wrap leading-relaxed border border-slate-800 shadow-inner max-h-60 overflow-y-auto selection:bg-emerald-600">
              {messageText || <span className="text-slate-500 italic">Selecciona al menos una opción arriba para generar el mensaje.</span>}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition cursor-pointer"
          >
            Cancelar
          </button>

          <div className="flex items-center gap-2.5 w-full sm:w-auto flex-wrap justify-end">
            <button
              onClick={handleCopyTextAndPhoto}
              disabled={isCopyingPhoto}
              className="flex-1 sm:flex-initial px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-lg transition shadow-2xs inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Copiar imagen del cuadro y el texto para pegar directo en WhatsApp (Ctrl+V)"
            >
              <Copy className="w-4 h-4 text-blue-200" />
              <span>{photoCopied ? '¡Texto + Foto Copiados!' : 'Copiar Texto + Foto'}</span>
            </button>

            <button
              onClick={handleCopy}
              className="flex-1 sm:flex-initial px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold rounded-lg transition shadow-2xs inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? '¡Texto Copiado!' : 'Copiar Solo Texto'}</span>
            </button>

            <button
              onClick={handleSendWhatsApp}
              className="flex-1 sm:flex-initial px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Enviar a WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
