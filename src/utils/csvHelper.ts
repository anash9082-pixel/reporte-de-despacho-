import Papa from 'papaparse';
import { BlockId, DeliveryItem, DeliveryStatus } from '../types/delivery';
import { BLOCKS_CONFIG } from '../data/mockData';

export function exportDeliveriesToCSV(deliveries: DeliveryItem[]): void {
  const data = deliveries.map(item => {
    const block = BLOCKS_CONFIG[item.blockId];
    return {
      'Fecha': item.fecha,
      'Origen': block ? block.titulo : item.origen,
      'Unidad': item.unidad,
      'Chofer': item.chofer,
      'Ayudante': item.ayudante,
      'Provincia': item.provincia,
      'Bultos': item.bultos,
      'Estado': item.estado,
      'Observación': item.observacion,
      'Farmacia/Distribuidora': item.farmacia || '',
      'Numero de pedido': item.numeroPedido || '',
      'Hora de facturacion': item.horaFacturacion || '',
      'Hora de entrega': item.horaEntrega || ''
    };
  });

  const csv = Papa.unparse(data, {
    quotes: true,
    delimiter: ',',
    header: true
  });

  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `reporte_diario_despachos_rd_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function downloadCSVTemplate(): void {
  const sampleData = [
    {
      'Fecha': new Date().toISOString().slice(0, 10),
      'Origen': 'BASE SANTO DOMINGO',
      'Unidad': 'CAMIÓN 1 (Mack 8T - Ficha 202)',
      'Chofer': 'Manuel Alejandro Batista',
      'Ayudante': 'Diógenes Cuevas',
      'Provincia': 'Distrito Nacional',
      'Bultos': 210,
      'Estado': 'Entregado',
      'Observación': 'Ensanche La Fe y Villa Consuelo',
      'Farmacia/Distribuidora': 'Farmacia Carol Principal',
      'Numero de pedido': 'PED-2026-8841'
    },
    {
      'Fecha': new Date().toISOString().slice(0, 10),
      'Origen': 'BASE SANTIAGO DE LOS CABALLEROS',
      'Unidad': 'CAMIÓN 1 (Isuzu 5T - Ficha 101)',
      'Chofer': 'Carlos Manuel Rosario',
      'Ayudante': 'Pedro Julio Vargas',
      'Provincia': 'Santiago',
      'Bultos': 145,
      'Estado': 'Entregado',
      'Observación': 'Zona Franca Víctor Espaillat Mera'
    },
    {
      'Fecha': new Date().toISOString().slice(0, 10),
      'Origen': 'TRANSPORTE BLANCO - SANTO DOMINGO',
      'Unidad': 'TB-SD 1 (Furgón JAC 4T)',
      'Chofer': 'Ambiorix De la Rosa',
      'Ayudante': 'N/A',
      'Provincia': 'La Romana',
      'Bultos': 92,
      'Estado': 'Pendiente',
      'Observación': 'La Romana Pueblo y Bayahíbe'
    },
    {
      'Fecha': new Date().toISOString().slice(0, 10),
      'Origen': 'TRANSPORTE BLANCO - SANTIAGO DE LOS CABALLEROS',
      'Unidad': 'TB-STG 1 (Panel Hyundai H100)',
      'Chofer': 'Franklin Jiménez Peralta',
      'Ayudante': 'N/A',
      'Provincia': 'Duarte',
      'Bultos': 55,
      'Estado': 'Entregado',
      'Observación': 'San Francisco de Macorís'
    }
  ];

  const csv = Papa.unparse(sampleData);
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'plantilla_despachos_rd.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getYesterdayString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateLabel(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const dia = parseInt(parts[2], 10);
    const mesIdx = parseInt(parts[1], 10) - 1;
    return `${dia} ${meses[mesIdx] || ''}`;
  }
  return dateStr;
}

export function normalizeDateString(dateStr: string): string {
  if (!dateStr) return '';
  const s = String(dateStr).trim();
  
  // DD-MM-YYYY or DD/MM/YYYY (e.g. 27-10-2026 or 27/10/2026)
  const dmy = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmy) {
    const day = dmy[1].padStart(2, '0');
    const month = dmy[2].padStart(2, '0');
    const year = dmy[3];
    return `${year}-${month}-${day}`;
  }

  // DD-MM-YY or DD/MM/YY (e.g. 26-10-26)
  const dmyShort = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2})$/);
  if (dmyShort) {
    const day = dmyShort[1].padStart(2, '0');
    const month = dmyShort[2].padStart(2, '0');
    const year = `20${dmyShort[3]}`;
    return `${year}-${month}-${day}`;
  }

  // YYYY-MM-DD or YYYY/MM/DD (e.g. 2026-10-27)
  const ymd = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (ymd) {
    const year = ymd[1];
    const month = ymd[2].padStart(2, '0');
    const day = ymd[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Date(year, monthIndex, day) from GViz JSONP
  const gvizMatch = s.match(/Date\((\d{4}),\s*(\d{1,2}),\s*(\d{1,2})\)/i);
  if (gvizMatch) {
    const year = gvizMatch[1];
    const month = String(parseInt(gvizMatch[2], 10) + 1).padStart(2, '0');
    const day = gvizMatch[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  return s;
}

export function detectBlockFromOrigin(origenRaw: string, fallbackIndex: number = 0): BlockId {
  const oLower = (origenRaw || '').toLowerCase().trim();
  const isBlanco = oLower.includes('blanco') || oLower.includes('tb') || oLower.includes('tercerizad') || oLower.includes('trasporte blanco');
  const isSantiago = oLower.includes('santiago') || oLower.includes('stg') || oLower.includes('cibao');
  const isSantoDomingo = oLower.includes('santo domingo') || oLower.includes('sd') || oLower.includes('distrito') || oLower.includes('nacional');

  if (isBlanco) {
    if (isSantiago) return 'santiago_blanco';
    if (isSantoDomingo) return 'santodomingo_blanco';
    return fallbackIndex % 2 === 0 ? 'santodomingo_blanco' : 'santiago_blanco';
  }

  if (isSantiago) return 'santiago_propia';
  if (isSantoDomingo) return 'santodomingo_propia';

  const defaultBases: BlockId[] = ['santodomingo_propia', 'santiago_propia', 'santodomingo_blanco', 'santiago_blanco'];
  return defaultBases[fallbackIndex % defaultBases.length];
}

export function parseCSVRowsToDeliveries(rows: Record<string, any>[]): DeliveryItem[] {
  const result: DeliveryItem[] = [];
  const currentToday = getTodayString();

  rows.forEach((row, index) => {
    // Tolerant column lookup
    const findVal = (...keys: string[]): string => {
      for (const k of keys) {
        for (const actualKey of Object.keys(row)) {
          if (actualKey.trim().toLowerCase() === k.toLowerCase()) {
            const val = String(row[actualKey] ?? '').trim();
            if (val) return val;
          }
        }
      }
      return '';
    };

    // Resilient Date Lookup:
    // 1. Try column names 'fecha', 'date', 'dia', 'día'
    let fechaRaw = findVal('fecha', 'date', 'dia', 'día');

    // 2. If not found (e.g. cell A1 was left blank in Google Sheet, resulting in key '' or ' ')
    if (!fechaRaw) {
      if (row[''] !== undefined && String(row['']).trim()) {
        fechaRaw = String(row['']).trim();
      } else {
        const firstKey = Object.keys(row)[0];
        if (firstKey !== undefined && row[firstKey] !== undefined) {
          const firstVal = String(row[firstKey]).trim();
          if (/^\d{1,4}[-/]\d{1,2}[-/]\d{1,4}/.test(firstVal)) {
            fechaRaw = firstVal;
          }
        }
      }
    }

    // 3. Scan all keys in row if still not identified as date
    if (!fechaRaw || !/^\d{1,4}[-/]\d{1,2}[-/]\d{1,4}/.test(fechaRaw)) {
      for (const k of Object.keys(row)) {
        const val = String(row[k] ?? '').trim();
        if (/^\d{1,4}[-/]\d{1,2}[-/]\d{1,4}/.test(val)) {
          fechaRaw = val;
          break;
        }
      }
    }

    const fecha = normalizeDateString(fechaRaw) || currentToday;
    const origenRaw = findVal('origen', 'base', 'bloque', 'sede', 'bloque id', 'bloque_id');
    const unidad = findVal('unidad', 'unidad de entrega', 'vehiculo', 'vehículo', 'ficha') || `UNIDAD ${index + 1}`;
    const chofer = findVal('chofer', 'conductor', 'chofer / conductor') || 'Por asignar';
    let ayudante = findVal('ayudante', 'asistente');
    if (!ayudante || ayudante === '' || ayudante.toLowerCase() === 'ninguno' || ayudante.toLowerCase() === 'null') {
      ayudante = 'N/A';
    }
    const provincia = findVal('provincia', 'destino', 'ruta', 'ruta / provincia') || 'Distrito Nacional';
    const estadoRaw = findVal('estado', 'status').toLowerCase();
    const bultosRaw = findVal('bultos', 'cantidad de bultos', 'cantidad', 'cajas');
    const observacion = findVal('observacion', 'observación', 'notas', 'comentario') || 'Sin novedad';
    const farmacia = findVal('farmacia/distribuidora', 'farmacia / distribuidora', 'farmacia', 'distribuidora', 'cliente') || '';
    const numeroPedido = findVal('numero de pedido', 'número de pedido', 'numero pedido', 'pedido', 'no. pedido', 'orden') || '';
    const horaFacturacion = findVal('hora de facturacion', 'hora de facturación', 'hora facturacion', 'hora facturación', 'facturacion', 'facturación', 'factura', 'hora fact') || '';
    const horaEntrega = findVal('hora de entrega', 'hora de entregas', 'hora entrega', 'hora entregas', 'hora de despacho', 'hora entregada', 'hora') || '';

    // Ignore completely empty phantom rows
    if (!unidad && !chofer && !farmacia && !numeroPedido && !bultosRaw) {
      return;
    }

    // Map origen to blockId flexibly
    const blockId: BlockId = detectBlockFromOrigin(origenRaw, index);

    if (blockId.includes('blanco')) {
      if (!ayudante || ayudante === '' || ayudante.toLowerCase() === 'ninguno') {
        ayudante = 'N/A';
      }
    }

    const estado: DeliveryStatus = estadoRaw.includes('entregad') || estadoRaw.includes('complet') || estadoRaw.includes('listo')
      ? 'Entregado'
      : 'Pendiente';

    const bultos = Math.max(1, parseInt(bultosRaw, 10) || 1);

    result.push({
      id: `csv-${Date.now()}-${index}`,
      fecha,
      origen: BLOCKS_CONFIG[blockId]?.titulo || origenRaw || 'BASE SANTO DOMINGO',
      blockId,
      unidad,
      chofer,
      ayudante,
      provincia,
      bultos,
      estado,
      observacion,
      farmacia,
      numeroPedido,
      horaFacturacion,
      horaEntrega,
      horaDespacho: horaEntrega || horaFacturacion || new Date().toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' })
    });
  });

  return result;
}
