import React from 'react';
import { KPIData } from '../types/delivery';
import { Package, CheckCircle2, Clock, Truck, Building2 } from 'lucide-react';

interface KPICardsProps {
  kpis: KPIData;
  hubStats?: {
    santoDomingoViajes: number;
    santoDomingoBultos: number;
    santoDomingoEntregados: number;
    santiagoViajes: number;
    santiagoBultos: number;
    santiagoEntregados: number;
  };
}

export const KPICards: React.FC<KPICardsProps> = ({ kpis, hubStats }) => {
  const sdEfectividad = hubStats && hubStats.santoDomingoViajes > 0
    ? Math.round((hubStats.santoDomingoEntregados / hubStats.santoDomingoViajes) * 100)
    : 0;

  const stgEfectividad = hubStats && hubStats.santiagoViajes > 0
    ? Math.round((hubStats.santiagoEntregados / hubStats.santiagoViajes) * 100)
    : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Despachos */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs transition-shadow hover:shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Despachos Totales
            </span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
              <Truck className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold font-mono text-slate-900 tabular-nums">
              {kpis.totalEntregas}
            </span>
            <span className="text-xs text-slate-500 font-semibold font-mono">
              Viajes activos
            </span>
          </div>
        </div>

        {hubStats && (
          <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-slate-500 block">Sto. Dgo:</span>
              <strong className="text-slate-800 font-mono font-bold">{hubStats.santoDomingoViajes} viajes</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Santiago:</span>
              <strong className="text-slate-800 font-mono font-bold">{hubStats.santiagoViajes} viajes</strong>
            </div>
          </div>
        )}
      </div>

      {/* 2. Total Entregados */}
      <div className="bg-white rounded-xl border border-emerald-200/80 p-5 shadow-xs transition-shadow hover:shadow-sm bg-gradient-to-br from-white to-emerald-50/30 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              Entregados (Completados)
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold font-mono text-emerald-700 tabular-nums">
              {kpis.totalEntregados}
            </span>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md border border-emerald-300 font-mono">
              {kpis.porcentajeCompletado}% efectividad
            </span>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-emerald-100 flex items-center justify-between text-[11px] text-emerald-900 font-medium">
          <span>Bultos entregados</span>
          <span className="font-mono font-bold text-emerald-700 tabular-nums">
            {kpis.bultosEntregados.toLocaleString()} bultos
          </span>
        </div>
      </div>

      {/* 3. Total Pendientes */}
      <div className="bg-white rounded-xl border border-amber-200/80 p-5 shadow-xs transition-shadow hover:shadow-sm bg-gradient-to-br from-white to-amber-50/30 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
              Pendientes en Ruta
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold font-mono text-amber-800 tabular-nums">
              {kpis.totalPendientes}
            </span>
            <span className="text-xs font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-md border border-amber-300 font-mono">
              {kpis.totalEntregas > 0 ? 100 - kpis.porcentajeCompletado : 0}% en tránsito
            </span>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-amber-100 flex items-center justify-between text-[11px] text-amber-900 font-medium">
          <span>Bultos en camino</span>
          <span className="font-mono font-bold text-amber-700 tabular-nums">
            {kpis.bultosPendientes.toLocaleString()} bultos
          </span>
        </div>
      </div>

      {/* 4. Total Bultos */}
      <div className="bg-white rounded-xl border border-blue-200/80 p-5 shadow-xs transition-shadow hover:shadow-sm bg-gradient-to-br from-white to-blue-50/30 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-900">
              Total General Bultos
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold font-mono text-blue-800 tabular-nums">
              {kpis.totalBultos.toLocaleString()}
            </span>
            <span className="text-xs text-blue-700 font-semibold font-mono">
              Bultos asignados
            </span>
          </div>
        </div>

        {hubStats && (
          <div className="mt-3 pt-3 border-t border-blue-100 grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-slate-500 block">Sto. Dgo:</span>
              <strong className="text-slate-800 font-mono font-bold">{hubStats.santoDomingoBultos.toLocaleString()}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Santiago:</span>
              <strong className="text-slate-800 font-mono font-bold">{hubStats.santiagoBultos.toLocaleString()}</strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
