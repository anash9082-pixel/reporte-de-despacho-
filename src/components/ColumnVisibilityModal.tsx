import React from 'react';
import { 
  ColumnKey, 
  VisibleColumns, 
  AVAILABLE_COLUMNS, 
  DEFAULT_VISIBLE_COLUMNS 
} from '../types/delivery';
import { 
  SlidersHorizontal, 
  Check, 
  X, 
  RotateCcw, 
  Eye, 
  EyeOff,
  LayoutGrid,
  FileCheck
} from 'lucide-react';

interface ColumnVisibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  visibleColumns: VisibleColumns;
  onChangeColumn: (key: ColumnKey, value: boolean) => void;
  onSetAllColumns: (value: boolean) => void;
  onApplyPreset: (preset: 'all' | 'executive' | 'compact') => void;
}

export const ColumnVisibilityModal: React.FC<ColumnVisibilityModalProps> = ({
  isOpen,
  onClose,
  visibleColumns,
  onChangeColumn,
  onSetAllColumns,
  onApplyPreset
}) => {
  if (!isOpen) return null;

  const totalVisible = Object.values(visibleColumns).filter(Boolean).length;
  const totalCount = AVAILABLE_COLUMNS.length;

  const categories = [
    {
      id: 'informacion',
      title: 'Datos de Despacho y Personal',
      icon: LayoutGrid,
      color: 'text-blue-600'
    },
    {
      id: 'metricas',
      title: 'Métricas de Entrega y Bultos',
      icon: FileCheck,
      color: 'text-emerald-600'
    },
    {
      id: 'control',
      title: 'Detalles y Acciones',
      icon: SlidersHorizontal,
      color: 'text-slate-600'
    }
  ] as const;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-950 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
                Personalizar Columnas del Reporte
                <span className="bg-slate-800 text-blue-300 text-[10px] font-mono px-2 py-0.5 rounded border border-slate-700">
                  {totalVisible}/{totalCount} activas
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Selecciona qué campos mostrar en pantalla y en la captura PNG
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Presets Rápidos */}
        <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider text-[10px]">
            Vistas Predefinidas:
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => onApplyPreset('all')}
              className="px-2.5 py-1 text-xs font-semibold bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer"
            >
              Mostrar Todo
            </button>
            <button
              onClick={() => onApplyPreset('executive')}
              className="px-2.5 py-1 text-xs font-bold bg-blue-50 border border-blue-200 text-blue-800 rounded-lg hover:bg-blue-100 transition cursor-pointer"
            >
              Ejecutiva Gerencial
            </button>
            <button
              onClick={() => onApplyPreset('compact')}
              className="px-2.5 py-1 text-xs font-semibold bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer"
            >
              Compacta (WhatsApp)
            </button>
          </div>
        </div>

        {/* Lista de Campos agrupados por categoría */}
        <div className="p-6 overflow-y-auto space-y-5 divide-y divide-slate-100">
          {categories.map((cat, idx) => {
            const cols = AVAILABLE_COLUMNS.filter(c => c.category === cat.id);
            if (cols.length === 0) return null;

            return (
              <div key={cat.id} className={idx > 0 ? 'pt-4' : ''}>
                <div className="flex items-center gap-2 mb-2.5">
                  <cat.icon className={`w-4 h-4 ${cat.color}`} />
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    {cat.title}
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {cols.map((col) => {
                    const isChecked = !!visibleColumns[col.id];
                    const isRequired = col.required;

                    return (
                      <label
                        key={col.id}
                        className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition cursor-pointer select-none ${
                          isChecked
                            ? 'bg-blue-50/60 border-blue-200 text-slate-900 shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300 hover:bg-slate-50'
                        } ${isRequired ? 'opacity-90 cursor-not-allowed' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={isRequired}
                          onChange={(e) => {
                            if (!isRequired) {
                              onChangeColumn(col.id, e.target.checked);
                            }
                          }}
                          className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer disabled:cursor-not-allowed"
                        />
                        <div className="flex-1 min-w-0">
                          <span className={`text-xs block font-semibold truncate ${
                            isChecked ? 'text-slate-900' : 'text-slate-500'
                          }`}>
                            {col.label}
                          </span>
                          {isRequired && (
                            <span className="text-[10px] text-blue-600 block leading-tight">
                              (Campo principal obligatorio)
                            </span>
                          )}
                        </div>
                        {isChecked ? (
                          <Eye className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        ) : (
                          <EyeOff className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            onClick={() => onApplyPreset('all')}
            className="text-xs text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            Restablecer todas
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-sm transition cursor-pointer flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Aplicar al Reporte</span>
          </button>
        </div>
      </div>
    </div>
  );
};
