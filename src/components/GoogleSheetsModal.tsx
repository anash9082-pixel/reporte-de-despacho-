import React, { useState } from 'react';
import Papa from 'papaparse';
import { DeliveryItem } from '../types/delivery';
import { parseCSVRowsToDeliveries } from '../utils/csvHelper';
import { 
  DEFAULT_SHEET_URL, 
  DEFAULT_SHEET_ID, 
  loadGoogleSheetDeliveries, 
  generateGoogleAppsScriptCode,
  extractSpreadsheetId 
} from '../services/googleSheetsService';
import { 
  X, 
  FileSpreadsheet, 
  Upload, 
  CheckCircle2, 
  Loader2, 
  Code, 
  Copy, 
  Check, 
  ExternalLink,
  Sparkles,
  AlertCircle
} from 'lucide-react';

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportData: (items: DeliveryItem[], mode: 'replace' | 'append') => void;
  activeSheetUrl: string;
  onSaveSheetUrl: (url: string) => void;
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({
  isOpen,
  onClose,
  onImportData,
  activeSheetUrl,
  onSaveSheetUrl
}) => {
  const [activeTab, setActiveTab] = useState<'sync' | 'script' | 'file'>('sync');
  const [sheetUrl, setSheetUrl] = useState(activeSheetUrl || DEFAULT_SHEET_URL);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [parsedPreview, setParsedPreview] = useState<DeliveryItem[] | null>(null);
  const [copiedScript, setCopiedScript] = useState(false);
  const [importMode, setImportMode] = useState<'replace' | 'append'>('replace');

  if (!isOpen) return null;

  const appsScriptCode = generateGoogleAppsScriptCode();

  const handleCopyScript = () => {
    navigator.clipboard.writeText(appsScriptCode);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  const handleSyncSheet = async () => {
    const targetUrl = sheetUrl.trim() || DEFAULT_SHEET_URL;
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setParsedPreview(null);

    try {
      const { items, source } = await loadGoogleSheetDeliveries(targetUrl);
      onSaveSheetUrl(targetUrl);

      if (items.length === 0) {
        setSuccessMessage(`Conexión exitosa a ${source}. La hoja tiene las cabeceras listas (Fecha, Origen, Unidad, Chofer, Ayudante, Provincia, Bultos, Estado, Observación). Puedes agregar filas en tu Google Sheet o usar el Script para poblarlas.`);
      } else {
        setParsedPreview(items);
        setSuccessMessage(`¡Sincronizado con éxito desde ${source}! Se leyeron ${items.length} despachos.`);
      }
    } catch (err: any) {
      setErrorMessage(
        err.message || 'No se pudo conectar con Google Sheets. Asegúrate de que el enlace tenga permisos de "Cualquier persona con el enlace puede ver".'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setParsedPreview(null);

    Papa.parse<Record<string, any>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (!results.data || results.data.length === 0) {
          setErrorMessage('El archivo CSV está vacío.');
          setIsLoading(false);
          return;
        }

        const parsed = parseCSVRowsToDeliveries(results.data);
        setParsedPreview(parsed);
        setSuccessMessage(`Archivo "${file.name}" cargado exitosamente (${parsed.length} despachos).`);
        setIsLoading(false);
      },
      error: (err) => {
        setErrorMessage(`Error leyendo el archivo CSV: ${err.message}`);
        setIsLoading(false);
      }
    });
  };

  const handleConfirmImport = () => {
    if (!parsedPreview || parsedPreview.length === 0) return;
    onImportData(parsedPreview, importMode);
    onClose();
  };

  const sheetId = extractSpreadsheetId(sheetUrl) || DEFAULT_SHEET_ID;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Alimentación desde Google Sheets
              </h3>
              <p className="text-xs text-slate-500">
                Sincronización en vivo con tu hoja y script de automatización
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-3 border-b border-slate-200 flex gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('sync')}
            className={`pb-2.5 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'sync'
                ? 'border-emerald-600 text-emerald-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Sincronizar Hoja en Vivo
          </button>
          <button
            onClick={() => setActiveTab('script')}
            className={`pb-2.5 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'script'
                ? 'border-emerald-600 text-emerald-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Code className="w-3.5 h-3.5 text-blue-600" />
            <span>Script para tu Google Sheet</span>
            <span className="bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0.2 rounded font-mono">Recomendado</span>
          </button>
          <button
            onClick={() => setActiveTab('file')}
            className={`pb-2.5 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'file'
                ? 'border-emerald-600 text-emerald-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Carga de Archivo CSV
          </button>
        </div>

        <div className="p-6 space-y-4">
          {activeTab === 'sync' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Enlace de tu Google Sheet
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={sheetUrl}
                    onChange={(e) => setSheetUrl(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/1X7xt.../edit?usp=sharing"
                    className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white font-mono"
                  />
                  <button
                    onClick={handleSyncSheet}
                    disabled={isLoading}
                    className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors inline-flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Leyendo Hoja...
                      </>
                    ) : (
                      <>
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        Sincronizar Ahora
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Sheet link status */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-600 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-800">Hoja vinculada:</span>
                  <span className="font-mono text-slate-600 ml-1">ID: {sheetId}</span>
                </div>
                <a
                  href={`https://docs.google.com/spreadsheets/d/${sheetId}/edit`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 font-semibold"
                >
                  <span>Abrir Google Sheet</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* Feedback messages */}
              {errorMessage && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-800 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Preview table */}
              {parsedPreview && parsedPreview.length > 0 && (
                <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                  <div className="bg-slate-100 p-2.5 font-semibold text-slate-700 flex justify-between items-center">
                    <span>{parsedPreview.length} despachos listos para aplicar</span>
                    <div className="flex gap-3 font-normal text-[11px]">
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name="importMode"
                          checked={importMode === 'replace'}
                          onChange={() => setImportMode('replace')}
                        />
                        <span>Reemplazar actuales</span>
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name="importMode"
                          checked={importMode === 'append'}
                          onChange={() => setImportMode('append')}
                        />
                        <span>Añadir</span>
                      </label>
                    </div>
                  </div>
                  <div className="max-h-40 overflow-y-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 text-[10px] text-slate-500 uppercase">
                        <tr>
                          <th className="p-2">Fecha</th>
                          <th className="p-2">Origen</th>
                          <th className="p-2">Unidad</th>
                          <th className="p-2">Chofer</th>
                          <th className="p-2 text-right">Bultos</th>
                          <th className="p-2">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedPreview.slice(0, 5).map((row, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="p-2 font-mono text-[11px]">{row.fecha}</td>
                            <td className="p-2">{row.origen}</td>
                            <td className="p-2 font-semibold">{row.unidad}</td>
                            <td className="p-2">{row.chofer}</td>
                            <td className="p-2 text-right font-mono font-bold">{row.bultos}</td>
                            <td className="p-2">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                row.estado === 'Entregado' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {row.estado}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'script' && (
            <div className="space-y-3">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-900 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Script de Automatización Oficial para tu Google Sheet</p>
                  <p className="text-blue-800 mt-0.5 leading-relaxed">
                    Crea automáticamente en tu Google Sheet el menú <strong>&ldquo;🚚 Despachos RD&rdquo;</strong> con listas desplegables (Bases, Provincias de RD, Estados) y un botón para poblar o limpiar datos.
                  </p>
                </div>
              </div>

              {/* Instructions steps */}
              <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <p className="font-bold text-slate-800 mb-1">Cómo instalar en 3 pasos:</p>
                <ol className="list-decimal pl-4 space-y-0.5">
                  <li>En tu Google Sheet, ve a <strong>Extensiones &gt; Apps Script</strong>.</li>
                  <li>Borra el código que haya y <strong>pega el script</strong> que copias abajo.</li>
                  <li>Haz clic en el icono de <strong>Guardar (💾)</strong> y luego en <strong>Ejecutar</strong> en la función <code className="font-mono bg-slate-200 px-1 py-0.2 rounded">onOpen</code>.</li>
                </ol>
              </div>

              {/* Code viewer with copy */}
              <div className="relative">
                <button
                  onClick={handleCopyScript}
                  className="absolute right-3 top-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 rounded-md shadow-xs cursor-pointer z-10"
                >
                  {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedScript ? '¡Copiado!' : 'Copiar Script'}</span>
                </button>
                <pre className="bg-slate-950 text-slate-200 p-4 rounded-xl text-[11px] font-mono h-48 overflow-y-auto leading-relaxed border border-slate-800">
                  {appsScriptCode}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'file' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-emerald-500 hover:bg-emerald-50/20 transition-all cursor-pointer relative">
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 mb-2">
                    <Upload className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-semibold text-slate-800">
                    Arrastra tu archivo CSV o haz clic aquí
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Columnas: Fecha, Origen, Unidad, Chofer, Ayudante, Provincia, Bultos, Estado, Observación
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg cursor-pointer"
          >
            Cerrar
          </button>
          {parsedPreview && parsedPreview.length > 0 && (
            <button
              type="button"
              onClick={handleConfirmImport}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Aplicar {parsedPreview.length} Registros a la Tabla
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
