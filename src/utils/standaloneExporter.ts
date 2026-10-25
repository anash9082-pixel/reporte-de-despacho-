import { DeliveryItem } from '../types/delivery';

export async function exportSingleFileHtml(deliveries: DeliveryItem[]): Promise<void> {
  try {
    const res = await fetch('/sistema-reporte-entregas.html');
    if (res.ok) {
      let html = await res.text();
      // Inject the latest deliveries into the standalone HTML
      const jsonStr = JSON.stringify(deliveries, null, 2);
      html = html.replace(
        'let TODOS_LOS_DESPACHOS = [...DATOS_MOCK_INICIALES];',
        `let TODOS_LOS_DESPACHOS = ${jsonStr};`
      );

      const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Reporte_Despachos_Gerencia_${new Date().toISOString().slice(0, 10)}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  } catch (err) {
    console.error('Error al exportar archivo HTML:', err);
  }
}
