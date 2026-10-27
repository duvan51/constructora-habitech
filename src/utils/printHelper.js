/**
 * printHelper.js
 * Utilidad profesional para imprimir comprobantes, recibos y documentos en aislamiento total.
 * Evita la filtración de páginas de fondo (dashboard, tablas, paneles) en el cuadro de diálogo de impresión.
 */

export const printElement = (element, options = {}) => {
  if (!element) {
    window.print();
    return;
  }

  const { title = 'Comprobante' } = options;

  // 1. Crear iframe invisible para aislar la impresión
  const iframe = document.createElement('iframe');
  iframe.setAttribute('title', 'Documento de Impresión');
  iframe.style.position = 'fixed';
  iframe.style.top = '0';
  iframe.style.left = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  iframe.style.opacity = '0';
  iframe.style.pointerEvents = 'none';
  iframe.style.zIndex = '-9999';
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentWindow?.document;
  if (!iframeDoc) {
    window.print();
    return;
  }

  // 2. Extraer hojas de estilo y etiquetas de estilo del documento padre
  const styleElements = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'));
  const stylesHtml = styleElements.map(el => el.outerHTML).join('\n');

  // 3. Escribir documento aislado
  iframeDoc.open();
  iframeDoc.write(`
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${title}</title>
        ${stylesHtml}
        <style>
          @page {
            size: letter portrait;
            margin: 10mm 12mm;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            box-sizing: border-box !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #111827 !important;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
            width: 100% !important;
            height: auto !important;
            min-height: 0 !important;
          }
          .printable-area, .receipt-container {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 auto !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            background: #ffffff !important;
            color: #111827 !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .no-print, button, nav, .modal-header, .modal-footer {
            display: none !important;
          }
        </style>
      </head>
      <body>
        <div class="print-isolated-container">
          ${element.outerHTML}
        </div>
      </body>
    </html>
  `);
  iframeDoc.close();

  // 4. Asegurarse de que las imágenes (logo, firmas) se hayan cargado antes de imprimir
  const images = Array.from(iframeDoc.images);
  const imagePromises = images.map(img => {
    if (img.complete && img.naturalHeight !== 0) {
      return Promise.resolve();
    }
    return new Promise(resolve => {
      img.onload = () => resolve();
      img.onerror = () => resolve();
      setTimeout(resolve, 400); // Respaldo rápido
    });
  });

  const executePrint = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (err) {
      console.warn('Fallo en impresión por iframe, ejecutando respaldo nativo:', err);
      window.print();
    } finally {
      // Eliminar iframe después de cerrar el diálogo
      setTimeout(() => {
        if (iframe.parentNode) {
          document.body.removeChild(iframe);
        }
      }, 2000);
    }
  };

  Promise.all(imagePromises).then(() => {
    setTimeout(executePrint, 150);
  });
};
