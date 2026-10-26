import { toPng, toBlob } from 'html-to-image';

/**
 * Capture an HTML element to PNG with 100% Tailwind CSS v4 and OKLCH color compatibility.
 * Uses native SVG foreignObject rasterization so modern color functions (oklch, oklab, color())
 * never cause parser crashes.
 */
export async function captureReportToPng(
  elementId: string = 'area-captura',
  dateLabel: string = new Date().toISOString().slice(0, 10),
  customFileName?: string
): Promise<boolean> {
  // Find element by priority: requested ID -> fallback to either table area
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

  // Filter out interactive controls, buttons, and no-capture markers
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

  try {
    // Attempt 1: Full crisp 2x retina rendering with html-to-image
    const dataUrl = await toPng(element, {
      pixelRatio: 2,
      backgroundColor: '#ffffff',
      cacheBust: true,
      filter: filterNode as any,
      style: {
        margin: '0',
        transform: 'none'
      }
    });

    downloadDataUrl(dataUrl, fileName);
    return true;
  } catch (primaryError) {
    console.warn('[captureHelper] Primary capture attempt with fonts encountered an issue, trying font-safe fallback:', primaryError);

    try {
      // Attempt 2: Fallback with skipFonts to avoid any cross-origin font fetch issues
      const dataUrl = await toPng(element, {
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        skipFonts: true,
        filter: filterNode as any
      });

      downloadDataUrl(dataUrl, fileName);
      return true;
    } catch (secondaryError) {
      console.warn('[captureHelper] html-to-image fallback failed, trying direct Canvas SVG rasterization:', secondaryError);

      try {
        // Attempt 3: Direct SVG ForeignObject Canvas render
        const success = await directSvgCanvasRender(element, fileName, filterNode);
        return success;
      } catch (finalError) {
        console.error('[captureHelper] All capture attempts failed:', finalError);
        return false;
      }
    }
  }
}

function downloadDataUrl(dataUrl: string, fileName: string) {
  const link = document.createElement('a');
  link.download = fileName;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Ultra-resilient direct SVG ForeignObject canvas rendering
 */
async function directSvgCanvasRender(
  element: HTMLElement,
  fileName: string,
  filterNode: (node: Node) => boolean
): Promise<boolean> {
  const rect = element.getBoundingClientRect();
  const width = Math.ceil(rect.width || element.scrollWidth || 1200);
  const height = Math.ceil(rect.height || element.scrollHeight || 800);

  // Clone element and strip no-capture elements
  const clone = element.cloneNode(true) as HTMLElement;
  const noCaptureEls = clone.querySelectorAll('.no-capture, .no-print');
  noCaptureEls.forEach((el) => el.remove());

  // Embed computed styles into clone to ensure styles persist in SVG
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
