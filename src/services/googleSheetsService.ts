import Papa from 'papaparse';
import { DeliveryItem, DeliveryStatus, BlockId } from '../types/delivery';
import { parseCSVRowsToDeliveries } from '../utils/csvHelper';
import { BLOCKS_CONFIG } from '../data/mockData';

export const DEFAULT_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1X7xtW4YrjEv43t1byX6CjMFxh4UKsZft00KQJuXEroc/edit?usp=sharing';
export const DEFAULT_SHEET_ID = '1X7xtW4YrjEv43t1byX6CjMFxh4UKsZft00KQJuXEroc';

/**
 * Extract Google Spreadsheet ID from any URL or string
 */
export function extractSpreadsheetId(urlOrId: string): string | null {
  if (!urlOrId) return null;
  const trimmed = urlOrId.trim();
  // Check direct ID (typically 44 chars alphanumeric with dashes and underscores)
  if (/^[a-zA-Z0-9-_]{30,50}$/.test(trimmed)) {
    return trimmed;
  }
  // Check /spreadsheets/d/ID
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return null;
}

/**
 * Fetch Google Sheet data in real-time via GViz JSONP (bypasses browser CORS restrictions completely)
 */
/**
 * Fetch Google Sheet data in real-time via GViz JSONP (bypasses browser CORS restrictions completely)
 */
export function fetchSheetViaGViz(sheetId: string): Promise<DeliveryItem[]> {
  return new Promise((resolve, reject) => {
    const callbackName = `gviz_callback_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=responseHandler:${callbackName}`;

    const script = document.createElement('script');
    script.src = url;

    // Timeout safety
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('Tiempo de espera agotado en GViz.'));
    }, 7000);

    const cleanup = () => {
      clearTimeout(timeout);
      delete (window as any)[callbackName];
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };

    const handleGvizResponse = (response: any) => {
      cleanup();
      try {
        if (!response || !response.table) {
          throw new Error('Respuesta de Google Sheets inválida o vacía.');
        }

        const table = response.table;
        const cols: string[] = [];

        // Check columns
        if (table.cols && table.cols.length > 0) {
          table.cols.forEach((c: any, idx: number) => {
            cols.push(c.label || `col_${idx}`);
          });
        }

        const rawRows = table.rows || [];
        if (rawRows.length === 0) {
          resolve([]);
          return;
        }

        const standardHeaders = ['Fecha', 'Origen', 'Unidad', 'Chofer', 'Ayudante', 'Provincia', 'Bultos', 'Estado', 'Observación'];
        let startIndex = 0;

        // Check if row 0 is actually the header row (e.g. "Fecha", "Origen"...)
        const firstRowCells = rawRows[0]?.c?.map((cell: any) => String(cell?.v || '').trim().toLowerCase()) || [];
        const isHeaderRow = firstRowCells.some((val: string) => 
          val === 'fecha' || val === 'origen' || val === 'unidad' || val === 'chofer'
        );

        let headers = cols.map((c) => c.trim());
        const hasRecognizedCols = headers.some((h) =>
          ['fecha', 'origen', 'unidad', 'chofer', 'bultos', 'estado'].includes(h.toLowerCase())
        );

        if (isHeaderRow) {
          headers = rawRows[0].c.map((cell: any, i: number) => String(cell?.v || `col_${i}`).trim());
          startIndex = 1;
        } else if (!hasRecognizedCols) {
          headers = standardHeaders;
        }

        // If sheet only has headers and no data rows yet
        if (startIndex >= rawRows.length) {
          resolve([]);
          return;
        }

        const mappedRows: Record<string, any>[] = [];
        for (let i = startIndex; i < rawRows.length; i++) {
          const rowObj: Record<string, any> = {};
          const cells = rawRows[i].c || [];
          headers.forEach((header, colIdx) => {
            const cell = cells[colIdx];
            rowObj[header] = cell ? (cell.f !== undefined ? cell.f : cell.v) : '';
          });
          mappedRows.push(rowObj);
        }

        const deliveries = parseCSVRowsToDeliveries(mappedRows);
        resolve(deliveries);
      } catch (err: any) {
        reject(err);
      }
    };

    // Register callback for responseHandler
    (window as any)[callbackName] = handleGvizResponse;

    // Safety: also define google.visualization.Query.setResponse in case Google uses default handler
    try {
      (window as any).google = (window as any).google || {};
      (window as any).google.visualization = (window as any).google.visualization || {};
      (window as any).google.visualization.Query = (window as any).google.visualization.Query || {};
      (window as any).google.visualization.Query.setResponse = handleGvizResponse;
    } catch {
      // ignore
    }

    script.onerror = () => {
      cleanup();
      reject(new Error('Error de red al cargar GViz script de Google Sheets.'));
    };

    document.head.appendChild(script);
  });
}

/**
 * Strategy 1: Fetch via Local / Vercel Server Proxy (/api/sheets-proxy)
 */
async function fetchViaServerProxy(sheetId: string): Promise<DeliveryItem[]> {
  const url = `/api/sheets-proxy?sheetId=${encodeURIComponent(sheetId)}`;
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`Proxy error HTTP ${resp.status}`);
  }
  const csvText = await resp.text();
  if (!csvText || !csvText.trim()) {
    return [];
  }
  const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
  if (!parsed.data || parsed.data.length === 0) {
    return [];
  }
  return parseCSVRowsToDeliveries(parsed.data as Record<string, any>[]);
}

/**
 * Strategy 3: Fetch via public CORS proxy fallback
 */
async function fetchViaCorsProxy(csvUrl: string): Promise<DeliveryItem[]> {
  const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(csvUrl)}`;
  const resp = await fetch(proxyUrl);
  if (!resp.ok) {
    throw new Error(`CORS proxy HTTP ${resp.status}`);
  }
  const csvText = await resp.text();
  const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
  return parseCSVRowsToDeliveries(parsed.data as Record<string, any>[]);
}

/**
 * Universal Sheet Loader: multi-tier resilient loading architecture:
 * 1. Server Proxy (/api/sheets-proxy) -> 100% reliable in local dev server and Vercel!
 * 2. GViz JSONP (with dual callback support) -> reliable in browser without server!
 * 3. Public CORS proxy -> fallback if in standalone browser and GViz is ad-blocked!
 * 4. PapaParse direct download -> final fallback
 */
export async function loadGoogleSheetDeliveries(sheetUrlOrId: string): Promise<{ items: DeliveryItem[]; source: string }> {
  const sheetId = extractSpreadsheetId(sheetUrlOrId) || DEFAULT_SHEET_ID;
  const csvExportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;

  // 1. First Priority: Server Proxy (Vite dev server + Vercel serverless)
  try {
    const items = await fetchViaServerProxy(sheetId);
    if (items && items.length > 0) {
      return { items, source: `Google Sheets en Vivo (Servidor Proxy)` };
    }
  } catch (proxyErr) {
    console.warn('[loadGoogleSheetDeliveries] Server proxy attempt failed, falling back to GViz:', proxyErr);
  }

  // 2. Second Priority: GViz JSONP (bypasses CORS in pure browser)
  try {
    const items = await fetchSheetViaGViz(sheetId);
    if (items && items.length > 0) {
      return { items, source: `Google Sheets (GViz JSONP)` };
    }
  } catch (gvizError: any) {
    console.warn('[loadGoogleSheetDeliveries] GViz JSONP failed, trying CORS proxy:', gvizError);
  }

  // 3. Third Priority: Public CORS Proxy
  try {
    const items = await fetchViaCorsProxy(csvExportUrl);
    if (items && items.length > 0) {
      return { items, source: `Google Sheets (CORS Proxy)` };
    }
  } catch (corsErr) {
    console.warn('[loadGoogleSheetDeliveries] CORS proxy failed, trying direct CSV download:', corsErr);
  }

  // 4. Final Fallback: Direct PapaParse download
  return new Promise((resolve, reject) => {
    Papa.parse(csvExportUrl, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (!results.data || results.data.length === 0) {
          resolve({ items: [], source: 'CSV' });
          return;
        }
        const parsed = parseCSVRowsToDeliveries(results.data as Record<string, any>[]);
        resolve({ items: parsed, source: 'CSV Directo' });
      },
      error: (err) => {
        reject(new Error(`Error al leer hoja de Google Sheets: ${err.message}`));
      }
    });
  });
}

/**
 * Generate complete Google Apps Script code for the user's spreadsheet
 */
export function generateGoogleAppsScriptCode(): string {
  return `/**
 * =========================================================================
 * GOOGLE APPS SCRIPT: SISTEMA DE REPORTE DIARIO DE ENTREGAS Y DESPACHOS RD
 * =========================================================================
 * INSTRUCCIONES DE INSTALACIÓN:
 * 1. En tu Google Sheet, ve al menú: Extensiones > Apps Script.
 * 2. Borra todo el código que aparezca y pega este script completo.
 * 3. Haz clic en "Guardar" (icono de disquete) y pulsa "Ejecutar" en la función "onOpen".
 * 4. Vuelve a tu Google Sheet: ¡Verás un nuevo menú arriba llamado "🚚 Despachos RD"!
 */

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('🚚 Despachos RD')
    .addItem('1. Formatear y Configurar Columnas', 'configurarCabeceras')
    .addItem('2. Crear Listas Desplegables (Validación)', 'crearListasDesplegables')
    .addItem('3. Cargar Datos de Prueba Iniciales (4 Bases)', 'cargarDatosIniciales')
    .addSeparator()
    .addItem('4. Limpiar Datos (Conservar Cabeceras)', 'limpiarDatos')
    .addToUi();
}

/**
 * 1. Configurar Cabeceras con Estilo Corporativo Azul Marino
 */
function configurarCabeceras() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var headers = [
    'Fecha', 
    'Origen', 
    'Unidad', 
    'Chofer', 
    'Ayudante', 
    'Provincia', 
    'Bultos', 
    'Estado', 
    'Observación'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // Estilo cabecera
  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#0f172a'); // Slate 900
  headerRange.setFontColor('#ffffff');
  headerRange.setFontWeight('bold');
  headerRange.setFontFamily('Arial');
  headerRange.setFontSize(11);
  headerRange.setHorizontalAlignment('center');
  
  sheet.setFrozenRows(1);
  
  // Ajuste de anchos
  sheet.setColumnWidth(1, 110); // Fecha
  sheet.setColumnWidth(2, 280); // Origen
  sheet.setColumnWidth(3, 230); // Unidad
  sheet.setColumnWidth(4, 200); // Chofer
  sheet.setColumnWidth(5, 180); // Ayudante
  sheet.setColumnWidth(6, 170); // Provincia
  sheet.setColumnWidth(7, 90);  // Bultos
  sheet.setColumnWidth(8, 120); // Estado
  sheet.setColumnWidth(9, 280); // Observación
  
  SpreadsheetApp.getUi().alert('✅ Cabeceras configuradas correctamente con el esquema oficial.');
}

/**
 * 2. Configurar Validaciones de Datos (Listas Desplegables)
 */
function crearListasDesplegables() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var maxRows = 200;
  
  // Lista de las 4 Bases Exactas
  var bases = [
    'BASE SANTO DOMINGO',
    'BASE SANTIAGO DE LOS CABALLEROS',
    'TRANSPORTE BLANCO - SANTO DOMINGO',
    'TRANSPORTE BLANCO - SANTIAGO DE LOS CABALLEROS'
  ];
  var ruleOrigen = SpreadsheetApp.newDataValidation()
    .requireValueInList(bases, true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(2, 2, maxRows, 1).setDataValidation(ruleOrigen);
  
  // Lista de Estados
  var estados = ['Entregado', 'Pendiente'];
  var ruleEstado = SpreadsheetApp.newDataValidation()
    .requireValueInList(estados, true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(2, 8, maxRows, 1).setDataValidation(ruleEstado);
  
  // Lista de Provincias RD
  var provinciasRD = [
    'Distrito Nacional', 'Santo Domingo', 'Santiago', 'Puerto Plata', 'La Vega', 
    'Espaillat', 'Duarte', 'Monseñor Nouel', 'San Cristóbal', 'San Pedro de Macorís', 
    'La Romana', 'La Altagracia', 'Valverde', 'Monte Cristi', 'Sánchez Ramírez', 
    'Hato Mayor', 'El Seibo', 'Azua', 'Peravia', 'San Juan', 'Barahona', 'Samaná'
  ];
  var ruleProvincia = SpreadsheetApp.newDataValidation()
    .requireValueInList(provinciasRD, true)
    .setAllowInvalid(true)
    .build();
  sheet.getRange(2, 6, maxRows, 1).setDataValidation(ruleProvincia);
  
  SpreadsheetApp.getUi().alert('✅ Listas desplegables configuradas para Origen, Estado y Provincias.');
}

/**
 * 3. Poblar Datos de Prueba Iniciales (4 Bases Completas)
 */
function cargarDatosIniciales() {
  configurarCabeceras();
  crearListasDesplegables();
  
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var hoy = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  
  var datos = [
    // 1. BASE SANTO DOMINGO
    [hoy, 'BASE SANTO DOMINGO', 'CAMIÓN 1 (Mack 8T)', 'Manuel Alejandro Batista', 'Diógenes Cuevas', 'Distrito Nacional', 210, 'Entregado', 'Ensanche La Fe y Villa Consuelo'],
    [hoy, 'BASE SANTO DOMINGO', 'CAMIÓN 2 (Isuzu 6T)', 'Héctor Bienvenido Feliz', 'Junior Alexander Méndez', 'Santo Domingo', 165, 'Entregado', 'Megacentro y San Isidro'],
    [hoy, 'BASE SANTO DOMINGO', 'FURGONETA 3 (Isuzu NPR)', 'Yovanny Santana Mateo', 'Cristian Daniel Soto', 'San Cristóbal', 115, 'Pendiente', 'Ventana recepción 11:30 AM'],
    [hoy, 'BASE SANTO DOMINGO', 'CAMIÓN 4 (Hino 500)', 'Sandy Vladimir Terrero', 'Marcos Encarnación', 'San Pedro de Macorís', 130, 'Pendiente', 'Peaje Las Américas'],
    [hoy, 'BASE SANTO DOMINGO', 'FURGONETA 5 (Daihatsu)', 'Bernardo Antonio Ciprián', 'Ángel Gabriel Tejada', 'Santo Domingo', 78, 'Entregado', 'Herrera y Los Alcarrizos'],
    
    // 2. BASE SANTIAGO DE LOS CABALLEROS
    [hoy, 'BASE SANTIAGO DE LOS CABALLEROS', 'CAMIÓN 1 (Isuzu 5T)', 'Carlos Manuel Rosario', 'Pedro Julio Vargas', 'Santiago', 145, 'Entregado', 'Zona Franca Víctor Espaillat'],
    [hoy, 'BASE SANTIAGO DE LOS CABALLEROS', 'FURGONETA 2 (Daihatsu)', 'Ramón Antonio Almonte', 'José Francisco Marte', 'Puerto Plata', 82, 'Entregado', 'Montellano y Sosúa'],
    [hoy, 'BASE SANTIAGO DE LOS CABALLEROS', 'CAMIÓN 3 (Hino 300)', 'Rafael Emilio Disla', 'Kelvin Santos', 'La Vega', 94, 'Pendiente', 'Muelle El Riíto'],
    [hoy, 'BASE SANTIAGO DE LOS CABALLEROS', 'CAMIÓN 4 (Hyundai HD78)', 'Nelson David Guzmán', 'Luis Miguel Reyes', 'Espaillat', 68, 'Entregado', 'Moca centro'],
    [hoy, 'BASE SANTIAGO DE LOS CABALLEROS', 'CAMIÓN 5 (Freightliner)', 'Wilson Gabriel Polanco', 'Arismendy Cruz', 'Valverde', 120, 'Pendiente', 'Ruta hacia Mao'],
    
    // 3. TRANSPORTE BLANCO - SANTO DOMINGO
    [hoy, 'TRANSPORTE BLANCO - SANTO DOMINGO', 'TB-SD 1 (Furgón JAC)', 'Ambiorix De la Rosa', 'N/A', 'La Romana', 92, 'Entregado', 'Bayahíbe y La Romana Pueblo'],
    [hoy, 'TRANSPORTE BLANCO - SANTO DOMINGO', 'TB-SD 2 (Camioneta Box)', 'Freddy Ramón Castillo', 'N/A', 'La Altagracia', 64, 'Pendiente', 'Bávaro - Punta Cana'],
    [hoy, 'TRANSPORTE BLANCO - SANTO DOMINGO', 'TB-SD 3 (Panel Transit)', 'Elvin José Segura', 'N/A', 'Distrito Nacional', 48, 'Entregado', 'Piantini y Naco'],
    [hoy, 'TRANSPORTE BLANCO - SANTO DOMINGO', 'TB-SD 4 (Daihatsu 3.5T)', 'Silvio Antonio Paredes', 'N/A', 'Peravia', 75, 'Pendiente', 'Almacén Central Baní'],
    
    // 4. TRANSPORTE BLANCO - SANTIAGO DE LOS CABALLEROS
    [hoy, 'TRANSPORTE BLANCO - SANTIAGO DE LOS CABALLEROS', 'TB-STG 1 (Panel H100)', 'Franklin Jiménez Peralta', 'N/A', 'Duarte', 55, 'Entregado', 'San Francisco de Macorís'],
    [hoy, 'TRANSPORTE BLANCO - SANTIAGO DE LOS CABALLEROS', 'TB-STG 2 (Hilux Baranda)', 'Eduardo José Tavárez', 'N/A', 'Monte Cristi', 42, 'Pendiente', 'Guayubín y Montecristi'],
    [hoy, 'TRANSPORTE BLANCO - SANTIAGO DE LOS CABALLEROS', 'TB-STG 3 (Mitsubishi 4.5T)', 'Guillermo Antonio Peña', 'N/A', 'Monseñor Nouel', 88, 'Entregado', 'Bonao KM 84'],
    [hoy, 'TRANSPORTE BLANCO - SANTIAGO DE LOS CABALLEROS', 'TB-STG 4 (Panel Kia)', 'Domingo Alberto Morillo', 'N/A', 'Santiago', 37, 'Pendiente', 'Tamboril y Licey']
  ];
  
  sheet.getRange(2, 1, datos.length, datos[0].length).setValues(datos);
  SpreadsheetApp.getUi().alert('🎉 Se cargaron 18 despachos de prueba para las 4 bases operativas.');
}

/**
 * 4. Limpiar datos preservando cabecera
 */
function limpiarDatos() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
    SpreadsheetApp.getUi().alert('🧹 Datos eliminados. Las cabeceras y validaciones permanecen intactas.');
  }
}

/**
 * Web App API Endpoint: Para sincronización en tiempo real vía JSON o CSV
 */
function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'empty', rows: [] }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  var headers = data[0];
  var rows = [];
  for (var i = 1; i < data.length; i++) {
    var row = {};
    for (var j = 0; j < headers.length; j++) {
      row[headers[j]] = data[i][j];
    }
    rows.push(row);
  }
  
  return ContentService.createTextOutput(JSON.stringify({ status: 'ok', count: rows.length, rows: rows }))
    .setMimeType(ContentService.MimeType.JSON);
}
`;
}
