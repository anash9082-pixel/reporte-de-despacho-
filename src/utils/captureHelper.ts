import { toPng, toBlob } from 'html-to-image';

/**
 * Filter out interactive controls, buttons, and no-capture markers
 */
const filterNode = (node: HTMLElement | Node): boolean => {
  if (node && node.nodeType === 1) {
    const el = node as HTMLElement;
    if (
      el.classList?.contains('no-capture') ||
      el.classList?.contains('no-print') ||
      el.getAttribute?.('data-no-capture') === 'true'
    ) {
      return false;
    }
  }
  return true;
};

/**
 * Download a data URL as a file
 */
function downloadDataUrl(dataUrl: string, fileName: string) {
  const link = document.createElement('a');
  link.download = fileName;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Temporarily expands any scrollable containers (overflow-x-auto) so that
 * all columns from left to right are rendered completely with zero truncation.
 */
function prepareFullWidthElement(element: HTMLElement) {
  const scrollContainers = Array.from(element.querySelectorAll<HTMLElement>('.overflow-x-auto, [class*="overflow-x"]'));
  const tables = Array.from(element.querySelectorAll<HTMLElement>('table'));

  // Calculate true maximum content width
  let maxContentWidth = element.scrollWidth;
  tables.forEach(t => {
    if (t.scrollWidth > maxContentWidth) maxContentWidth = t.scrollWidth;
    if (t.offsetWidth > maxContentWidth) maxContentWidth = t.offsetWidth;
  });
  scrollContainers.forEach(c => {
    if (c.scrollWidth > maxContentWidth) maxContentWidth = c.scrollWidth;
  });

  const fullWidth = Math.max(maxContentWidth, element.offsetWidth, 1200);

  const cleanupFns: (() => void)[] = [];

  const prevElementWidth = element.style.width;
  const prevElementMaxWidth = element.style.maxWidth;
  const prevElementOverflow = element.style.overflow;

  element.style.width = `${fullWidth}px`;
  element.style.maxWidth = 'none';
  element.style.overflow = 'visible';

  cleanupFns.push(() => {
    element.style.width = prevElementWidth;
    element.style.maxWidth = prevElementMaxWidth;
    element.style.overflow = prevElementOverflow;
  });

  scrollContainers.forEach(container => {
    const prevOverflow = container.style.overflow;
    const prevWidth = container.style.width;
    const prevMaxWidth = container.style.maxWidth;

    container.style.overflow = 'visible';
    container.style.width = '100%';
    container.style.maxWidth = 'none';

    cleanupFns.push(() => {
      container.style.overflow = prevOverflow;
      container.style.width = prevWidth;
      container.style.maxWidth = prevMaxWidth;
    });
  });

  return {
    fullWidth,
    restore: () => {
      cleanupFns.reverse().forEach(fn => fn());
    }
  };
}

/**
 * Ultra-resilient direct SVG ForeignObject canvas rendering
 */
async function directSvgCanvasRender(
  element: HTMLElement,
  fileName: string,
  filterNodeFn: (node: Node) => boolean
): Promise<boolean> {
  const clone = element.cloneNode(true) as HTMLElement;
  const noCaptureEls = clone.querySelectorAll('.no-capture, .no-print');
  noCaptureEls.forEach((el) => el.remove());

  // Expand table containers in the clone so nothing is cropped
  clone.querySelectorAll<HTMLElement>('.overflow-x-auto, [class*="overflow-x"]').forEach(el => {
    el.style.overflow = 'visible';
    el.style.width = '100%';
    el.style.maxWidth = 'none';
  });

  const width = Math.max(clone.scrollWidth || element.scrollWidth || 1200, 1200);
  const height = Math.ceil(element.scrollHeight || 800);

  clone.style.width = `${width}px`;
  clone.style.backgroundColor = '#ffffff';

  const serializedHtml = new XMLSerializer().serializeToString(clone);
  const svgString = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <foreignObject width="100%" height="100%">
        <div xmlns="http://www.w3.org/1999/xhtml" style="background:#ffffff;font-family:sans-serif;">
          ${serializedHtml}
        </div>
      </foreignObject>
    </svg>
  `;

  return new Promise((resolve) => {
    const img = new Image();
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width * 2;
      canvas.height = height * 2;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(2, 2);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        const pngUrl = canvas.toDataURL('image/png');
        downloadDataUrl(pngUrl, fileName);
        resolve(true);
      } else {
        URL.revokeObjectURL(url);
        resolve(false);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(false);
    };

    img.src = url;
  });
}

/**
 * Capture an HTML element to PNG with 100% complete width (no column cut-offs).
 */
export async function captureReportToPng(
  elementId: string = 'area-captura',
  dateLabel: string = new Date().toISOString().slice(0, 10),
  customFileName?: string
): Promise<boolean> {
  let element = document.getElementById(elementId);
  if (!element) {
    element = document.getElementById('area-captura') || 
              document.getElementById('area-captura-farmacias') ||
              document.getElementById('executive-report-capture');
  }

  if (!element) {
    console.warn(`[captureHelper] Element #${elementId} not found in DOM`);
    return false;
  }

  const fileName = customFileName || `Reporte_Despachos_${dateLabel || 'Consolidado'}.png`;
  const expansion = prepareFullWidthElement(element);

  try {
    const dataUrl = await toPng(element, {
      pixelRatio: 2,
      backgroundColor: '#ffffff',
      cacheBust: true,
      skipFonts: true,
      fontEmbedCSS: '',
      width: expansion.fullWidth,
      filter: filterNode as any,
      style: {
        margin: '0',
        transform: 'none',
        width: `${expansion.fullWidth}px`,
        maxWidth: 'none',
        overflow: 'visible'
      }
    });

    downloadDataUrl(dataUrl, fileName);
    return true;
  } catch (primaryError) {
    console.warn('[captureHelper] Primary capture issue, trying SVG direct canvas fallback:', primaryError);

    try {
      const success = await directSvgCanvasRender(element, fileName, filterNode);
      return success;
    } catch (finalError) {
      console.error('[captureHelper] All capture attempts failed:', finalError);
      return false;
    }
  } finally {
    expansion.restore();
  }
}

/**
 * Copy the report image directly to the clipboard with 100% complete width (no column cut-offs).
 */
export async function copyReportImageToClipboard(
  elementId: string = 'area-captura',
  summaryText?: string
): Promise<{ success: boolean; message: string }> {
  let element = document.getElementById(elementId);
  if (!element) {
    element = document.getElementById('area-captura') || 
              document.getElementById('area-captura-farmacias');
  }

  if (!element) {
    return { success: false, message: 'No se encontró el cuadro para copiar.' };
  }

  const expansion = prepareFullWidthElement(element);

  try {
    let blob: Blob | null = null;
    try {
      blob = await toBlob(element, {
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        cacheBust: true,
        skipFonts: true,
        fontEmbedCSS: '',
        width: expansion.fullWidth,
        filter: filterNode as any,
        style: {
          margin: '0',
          transform: 'none',
          width: `${expansion.fullWidth}px`,
          maxWidth: 'none',
          overflow: 'visible'
        }
      });
    } catch {
      blob = await toBlob(element, {
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        skipFonts: true,
        fontEmbedCSS: '',
        width: expansion.fullWidth,
        filter: filterNode as any,
        style: {
          margin: '0',
          transform: 'none',
          width: `${expansion.fullWidth}px`,
          maxWidth: 'none',
          overflow: 'visible'
        }
      });
    }

    if (!blob) {
      throw new Error('No se pudo generar la imagen para el portapapeles.');
    }

    // Try modern ClipboardItem API
    if (navigator.clipboard && typeof navigator.clipboard.write === 'function' && typeof ClipboardItem !== 'undefined') {
      try {
        const clipboardItems: Record<string, Blob> = {
          'image/png': blob
        };
        if (summaryText) {
          clipboardItems['text/plain'] = new Blob([summaryText], { type: 'text/plain' });
        }
        await navigator.clipboard.write([new ClipboardItem(clipboardItems)]);
        return { 
          success: true, 
          message: '📋 ¡Cuadro COMPLETO copiado al portapapeles! Listo para pegar (Ctrl+V) en tu reporte o WhatsApp.' 
        };
      } catch {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        return { 
          success: true, 
          message: '📋 ¡Foto del cuadro completo copiada al portapapeles! Pégala directo con Ctrl+V.' 
        };
      }
    } else {
      const downloadName = `Reporte_Despachos_${new Date().toISOString().slice(0, 10)}.png`;
      downloadDataUrl(URL.createObjectURL(blob), downloadName);
      if (summaryText && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(summaryText);
      }
      return { 
        success: true, 
        message: '📷 Foto completa descargada y texto copiado. Puedes adjuntarla en tu reporte.' 
      };
    }
  } catch (err: any) {
    console.error('[captureHelper] Error copying image to clipboard:', err);
    return { 
      success: false, 
      message: 'No se pudo copiar la foto al portapapeles. Usa el botón "Capturar PNG".' 
    };
  } finally {
    expansion.restore();
  }
}
