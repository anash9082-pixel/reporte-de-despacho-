import React, { useState, useEffect } from 'react';
import { BlockId, DeliveryItem, DeliveryStatus } from '../types/delivery';
import { BLOCKS_CONFIG, PROVINCIAS_RD } from '../data/mockData';
import { X, Check } from 'lucide-react';

interface DeliveryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: DeliveryItem) => void;
  initialItem?: DeliveryItem | null;
  defaultBlockId?: BlockId;
  defaultDate?: string;
}

export const DeliveryFormModal: React.FC<DeliveryFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialItem,
  defaultBlockId = 'santodomingo_propia',
  defaultDate = new Date().toISOString().slice(0, 10)
}) => {
  const [fecha, setFecha] = useState(defaultDate);
  const [blockId, setBlockId] = useState<BlockId>(defaultBlockId);
  const [unidad, setUnidad] = useState('');
  const [chofer, setChofer] = useState('');
  const [ayudante, setAyudante] = useState('');
  const [provincia, setProvincia] = useState('Distrito Nacional');
  const [estado, setEstado] = useState<DeliveryStatus>('Pendiente');
  const [bultos, setBultos] = useState<number | string>(50);
  const [observacion, setObservacion] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialItem) {
      setFecha(initialItem.fecha || defaultDate);
      setBlockId(initialItem.blockId);
      setUnidad(initialItem.unidad);
      setChofer(initialItem.chofer);
      setAyudante(initialItem.ayudante);
      setProvincia(initialItem.provincia);
      setEstado(initialItem.estado);
      setBultos(initialItem.bultos);
      setObservacion(initialItem.observacion);
    } else {
      setFecha(defaultDate);
      setBlockId(defaultBlockId);
      setUnidad('');
      setChofer('');
      const isBlanco = defaultBlockId.includes('blanco');
      setAyudante(isBlanco ? 'N/A' : '');
      setProvincia(defaultBlockId.includes('santiago') ? 'Santiago' : 'Distrito Nacional');
      setEstado('Pendiente');
      setBultos(60);
      setObservacion('');
    }
    setErrors({});
  }, [initialItem, defaultBlockId, defaultDate, isOpen]);

  const handleBlockChange = (newBlockId: BlockId) => {
    setBlockId(newBlockId);
    if (newBlockId.includes('blanco')) {
      setAyudante('N/A');
    } else if (ayudante === 'N/A') {
      setAyudante('');
    }
    if (newBlockId.includes('santiago') && !initialItem) {
      setProvincia('Santiago');
    } else if (newBlockId.includes('santodomingo') && !initialItem) {
      setProvincia('Distrito Nacional');
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!unidad.trim()) newErrors.unidad = 'La unidad de entrega es obligatoria';
    if (!chofer.trim()) newErrors.chofer = 'El nombre del chofer es obligatorio';
    const numBultos = Number(bultos);
    if (isNaN(numBultos) || numBultos <= 0) newErrors.bultos = 'Ingrese una cantidad válida mayor a 0';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const itemToSave: DeliveryItem = {
      id: initialItem ? initialItem.id : `del-${Date.now()}`,
      fecha: fecha || new Date().toISOString().slice(0, 10),
      origen: BLOCKS_CONFIG[blockId]?.titulo || 'BASE SANTO DOMINGO',
      blockId,
      unidad: unidad.trim(),
      chofer: chofer.trim(),
      ayudante: ayudante.trim() || 'N/A',
      provincia,
      estado,
      bultos: Math.round(numBultos),
      observacion: observacion.trim() || 'Entrega estándar sin novedades',
      horaDespacho: initialItem?.horaDespacho || new Date().toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' })
    };

    onSave(itemToSave);
    onClose();
  };

  const isBlanco = blockId.includes('blanco');

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {initialItem ? 'Editar Registro de Despacho' : 'Nueva Unidad de Entrega'}
            </h3>
            <p className="text-xs text-slate-500">
              Complete los datos operativos según el modelo gerencial de despachos
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Fecha */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Fecha de Operación
              </label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all font-mono"
              />
            </div>

            {/* Bloque Destino */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Base Operativa
              </label>
              <select
                value={blockId}
                onChange={(e) => handleBlockChange(e.target.value as BlockId)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all font-medium"
              >
                <option value="santodomingo_propia">1. BASE SANTO DOMINGO</option>
                <option value="santiago_propia">2. BASE SANTIAGO DE LOS CABALLEROS</option>
                <option value="santodomingo_blanco">3. TRANSPORTE BLANCO - SANTO DOMINGO</option>
                <option value="santiago_blanco">4. TRANSPORTE BLANCO - SANTIAGO DE LOS CABALLEROS</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Unidad */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Unidad de Entrega *
              </label>
              <input
                type="text"
                value={unidad}
                onChange={(e) => setUnidad(e.target.value)}
                placeholder="Ej: FURGONETA 1, CAMIÓN 2..."
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all font-semibold"
              />
              {errors.unidad && <p className="text-xs text-red-600 mt-1">{errors.unidad}</p>}
            </div>

            {/* Chofer */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Chofer *
              </label>
              <input
                type="text"
                value={chofer}
                onChange={(e) => setChofer(e.target.value)}
                placeholder="Ej. Juan Pérez Rosario"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
              />
              {errors.chofer && <p className="text-xs text-red-600 mt-1">{errors.chofer}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Ayudante */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Ayudante
                </label>
                {isBlanco && (
                  <span className="text-[11px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded font-mono">
                    N/A por ser Tercerizado
                  </span>
                )}
              </div>
              <input
                type="text"
                value={ayudante}
                onChange={(e) => setAyudante(e.target.value)}
                placeholder={isBlanco ? 'N/A' : 'Ej. Pedro Vargas'}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
              />
            </div>

            {/* Provincia Destino */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Ruta / Provincia (Destino)
              </label>
              <select
                value={provincia}
                onChange={(e) => setProvincia(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
              >
                {PROVINCIAS_RD.map((prov) => (
                  <option key={prov} value={prov}>{prov}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Estado */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Estado
              </label>
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value as DeliveryStatus)}
                className={`w-full px-3 py-2 text-sm font-semibold rounded-lg border focus:outline-none focus:ring-2 transition-all ${
                  estado === 'Entregado'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 focus:ring-emerald-500'
                    : 'bg-amber-50 text-amber-800 border-amber-300 focus:ring-amber-500'
                }`}
              >
                <option value="Pendiente">Pendiente (En ruta)</option>
                <option value="Entregado">Entregado (Completado)</option>
              </select>
            </div>

            {/* Cantidad de Bultos */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Cantidad de Bultos *
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={bultos}
                onChange={(e) => setBultos(e.target.value)}
                className="w-full px-3 py-2 text-sm font-mono font-bold text-slate-900 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
              />
              {errors.bultos && <p className="text-xs text-red-600 mt-1">{errors.bultos}</p>}
            </div>
          </div>

          {/* Observación */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Observación / Notas de Despacho
            </label>
            <textarea
              rows={2}
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
              placeholder="Detalles de descarga, muelle, conduce o contacto..."
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
            />
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-2xs cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              {initialItem ? 'Guardar Cambios' : 'Registrar Entrega'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
