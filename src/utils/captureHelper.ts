import html2canvas from 'html2canvas';

// Mathematically convert oklch(...) to standard rgb/rgba so html2canvas never crashes
function convertOklchToRgb(oklchStr: string): string {
  if (!oklchStr || !oklchStr.includes('oklch')) return oklchStr;

  // 1. Try native 2D canvas conversion first
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#000000';
      ctx.fillStyle = oklchStr;
      const res = ctx.fillStyle;
      if (res && !res.includes('oklch')) {
        return res;
      }
    }
  } catch {
    // fallback to mathematical conversion
  }

  // 2. Mathematical OKLCH -> sRGB fallback
  try {
    const match = oklchStr.match(/oklch\(\s*([\d.%]+)\s+([\d.%]+)\s+([\d.]+)(?:\s*\/\s*([\d.%]+))?\s*\)/i);
    if (!match) return oklchStr;

    let l = parseFloat(match[1]);
    if (match[1].endsWith('%')) l /= 100;
    let c = parseFloat(match[2]);
    if (match[2].endsWith('%')) c /= 100;
    let h = parseFloat(match[3]);
    let alpha = match[4] ? parseFloat(match[4]) : 1;
    if (match[4] && match[4].endsWith('%')) alpha /= 100;

    const hRad = (h * Math.PI) / 180;
    const a = c * Math.cos(hRad);
    const b = c * Math.sin(hRad);

    const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
    const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
    const s_ = l - 0.0894841775 * a - 1.2914855480 * b;

    const l_cube = l_ * l_ * l_;
    const m_cube = m_ * m_ * m_;
    const s_cube = s_ * s_ * s_;

    const rLinear = +4.0767416621 * l_cube - 3.3077115913 * m_cube + 0.2309699292 * s_cube;
    const gLinear = -1.2684380046 * l_cube + 2.6097574011 * m_cube - 0.3413193965 * s_cube;
    const bLinear = -0.0041960863 * l_cube - 0.7034186147 * m_cube + 1.7076147010 * s_cube;

    const toSrgb = (v: number) => {
      const clamped = Math.max(0, Math.min(1, v));
      return clamped <= 0.0031308
        ? Math.round(12.92 * clamped * 255)
        : Math.round((1.055 * Math.pow(clamped, 1 / 2.4) - 0.055) * 255);
    };

    const r = toSrgb(rLinear);
    const g = toSrgb(gLinear);
    const blue = toSrgb(bLinear);

    if (alpha < 1) {
      return `rgba(${r}, ${g}, ${blue}, ${alpha})`;
    }
    return `rgb(${r}, ${g}, ${blue})`;
  } catch {
    return '#0f172a';
  }
}

// Sanitize all elements inside a cloned DOM node to remove any oklch colors
function sanitizeElementColors(rootElement: HTMLElement) {
  const allElements = [rootElement, ...Array.from(rootElement.querySelectorAll('*'))] as HTMLElement[];

  const colorProperties = [
    'color',
    'backgroundColor',
    'borderColor',
    'borderTopColor',
    'borderRightColor',
    'borderBottomColor',
    'borderLeftColor',
    'outlineColor',
    'textDecorationColor'
  ] as const;

  allElements.forEach((el) => {
    // Check computed style
    const computed = window.getComputedStyle(el);
    for (const prop of colorProperties) {
      const val = (computed as any)[prop];
      if (val && typeof val === 'string' && val.includes('oklch')) {
        const rgbVal = convertOklchToRgb(val);
        (el.style as any)[prop] = rgbVal;
      }
    }

    // Also sanitize inline styles
    if (el.style) {
      for (let i = 0; i < el.style.length; i++) {
        const propName = el.style[i];
        const val = el.style.getPropertyValue(propName);
        if (val && val.includes('oklch')) {
          el.style.setProperty(propName, convertOklchToRgb(val));
        }
      }
    }
  });
}

export async function captureReportToPng(
  elementId: string = 'area-captura',
  dateLabel: string = new Date().toISOString().slice(0, 10)
): Promise<boolean> {
  const element = document.getElementById(elementId) || document.getElementById('executive-report-capture');
  if (!element) {
    console.error(`Element with id ${elementId} not found`);
    return false;
  }

  try {
    const canvas = await html2canvas(element, {
      scale: 2, // Crisp 2x retina resolution
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      ignoreElements: (el) => {
        return el.classList.contains('no-capture') || el.classList.contains('no-print');
      },
      onclone: (clonedDoc) => {
        const clonedElement = clonedDoc.getElementById(element.id);
        if (clonedElement) {
          sanitizeElementColors(clonedElement);
        }
      }
    });

    const imageUri = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = imageUri;
    link.download = `Reporte_Despachos_${dateLabel || 'Consolidado'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return true;
  } catch (error) {
    console.error('Error capturing report with html2canvas:', error);
    return false;
  }
}
