import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Convert Base64 data URI to Blob
const base64ToBlob = (base64Str) => {
  try {
    const parts = base64Str.split(';base64,');
    const contentType = parts[0].split(':')[1];
    const raw = window.atob(parts[1]);
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);
    for (let i = 0; i < rawLength; ++i) {
      uInt8Array[i] = raw.charCodeAt(i);
    }
    return new Blob([uInt8Array], { type: contentType });
  } catch (err) {
    console.error('Error parsing base64 string:', err);
    return null;
  }
};

// Upload helper to upload image/video/doc base64 to Supabase Storage.
// Falls back to returning the base64 string on failure (e.g. if bucket doesn't exist).
export const uploadFileToStorage = async (path, base64Str) => {
  if (!base64Str || !base64Str.startsWith('data:')) {
    return base64Str; // Already a URL or not a base64 string
  }

  try {
    const blob = base64ToBlob(base64Str);
    if (!blob) return base64Str;
    
    const contentType = blob.type;
    // Generate a unique file name
    const ext = contentType.split('/')[1] || 'bin';
    const filename = `${new Date().getTime()}_${Math.random().toString(36).substring(2, 9)}.${ext}`;
    const fullPath = `${path}/${filename}`;

    const { data, error } = await supabase.storage
      .from('habitech-media')
      .upload(fullPath, blob, {
        contentType,
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.warn('Storage upload warning (create a public bucket "habitech-media" in Supabase Storage dashboard to activate):', error);
      return base64Str; // Graceful fallback
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('habitech-media')
      .getPublicUrl(fullPath);

    return publicUrl;
  } catch (err) {
    console.warn('Failed uploading to Supabase Storage, using Base64 fallback:', err);
    return base64Str;
  }
};

const processPaymentPlanFiles = async (paymentPlan, projectId) => {
  if (!paymentPlan) return [];
  const updatedPlan = await Promise.all(paymentPlan.map(async (hito) => {
    if (!hito.payments) return hito;
    const updatedPayments = await Promise.all(hito.payments.map(async (pay) => {
      if (!pay.files) return pay;
      const updatedFiles = await Promise.all(pay.files.map(async (file) => {
        if (file.fileBase64 && file.fileBase64.startsWith('data:')) {
          const publicUrl = await uploadFileToStorage(`payments/${projectId}`, file.fileBase64);
          return {
            ...file,
            fileBase64: publicUrl
          };
        }
        return file;
      }));
      return { ...pay, files: updatedFiles };
    }));
    return { ...hito, payments: updatedPayments };
  }));
  return updatedPlan;
};

// Mapping helpers to translate Postgres snake_case to React camelCase
const mapTransactionToCamel = (t) => {
  if (!t) return null;
  return {
    id: t.id,
    projectId: t.project_id || 'general',
    projectName: t.project_name,
    type: t.type,
    category: t.category,
    description: t.description,
    amount: parseFloat(t.amount) || 0,
    date: t.date,
    createdAt: t.created_at
  };
};

const mapTransactionToSnake = (t) => {
  if (!t) return null;
  return {
    id: t.id,
    project_id: t.projectId === 'general' ? null : t.projectId,
    project_name: t.projectName,
    type: t.type,
    category: t.category,
    description: t.description,
    amount: t.amount,
    date: t.date
  };
};

const mapProjectToCamel = (p) => {
  if (!p) return null;
  return {
    id: p.id,
    name: p.name,
    clientName: p.client_name,
    clientPhone: p.client_phone,
    clientEmail: p.client_email,
    location: p.location,
    status: p.status,
    totalCost: parseFloat(p.total_cost) || 0,
    startDate: p.start_date,
    endDate: p.end_date,
    progress: p.progress,
    budgetItems: p.budget_items || [],
    paymentPlan: p.payment_plan || []
  };
};

const mapProjectToSnake = (p) => {
  if (!p) return null;
  return {
    id: p.id,
    name: p.name,
    client_name: p.clientName,
    client_phone: p.clientPhone,
    client_email: p.clientEmail,
    location: p.location,
    status: p.status,
    total_cost: p.totalCost,
    start_date: p.startDate,
    end_date: p.endDate,
    progress: p.progress,
    budget_items: p.budgetItems,
    payment_plan: p.paymentPlan
  };
};

// Seeding default demo data in Supabase if empty
export const seedMockData = async () => {
  try {
    const { count, error } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.warn('Could not check project count. Make sure SQL schema has been executed in Supabase SQL editor.', error);
      return;
    }

    if (count === 0) {
      const defaultProjects = [
        {
          id: '1',
          name: 'Condominio Altamira - Torre 1',
          client_name: 'Alejandro Restrepo',
          client_phone: '+57 312 456 7890',
          client_email: 'alejandro.restrepo@email.com',
          location: {
            lat: 6.2518,
            lng: -75.5636,
            address: 'Carrera 43A #1-50, Poblado, Medellín'
          },
          status: 'active',
          total_cost: 120000000,
          start_date: '2026-01-15',
          end_date: '2026-12-20',
          progress: 45,
          budget_items: [
            { name: 'Cimentación y estructura', estimated: 35000000, actual: 36500000, category: 'materials' },
            { name: 'Mano de obra (Estructura)', estimated: 25000000, actual: 24000000, category: 'labor' },
            { name: 'Redes Hidrosanitarias', estimated: 15000000, actual: 12000000, category: 'materials' },
            { name: 'Mampostería y revoques', estimated: 20000000, actual: 5000000, category: 'labor' },
            { name: 'Licencia de construcción', estimated: 8000000, actual: 8200000, category: 'permits' },
            { name: 'Acabados y carpintería', estimated: 17000000, actual: 0, category: 'materials' }
          ],
          payment_plan: [
            { id: 'p1', name: 'Cuota Inicial / Firma de Contrato', percentage: 30, amount: 36000000, dueDate: '2026-01-16', status: 'paid', paidDate: '2026-01-16' },
            { id: 'p2', name: 'Vaciado de Losa de Tercer Piso', percentage: 30, amount: 36000000, dueDate: '2026-05-10', status: 'paid', paidDate: '2026-05-12' },
            { id: 'p3', name: 'Techado e Instalaciones Internas', percentage: 20, amount: 24000000, dueDate: '2026-08-30', status: 'pending', paidDate: null },
            { id: 'p4', name: 'Entrega de Llaves y Acabados', percentage: 20, amount: 24000000, dueDate: '2026-12-15', status: 'pending', paidDate: null }
          ]
        },
        {
          id: '2',
          name: 'Residencia Campo Verde',
          client_name: 'Liliana Patricia Gómez',
          client_phone: '+57 300 765 4321',
          client_email: 'liliana.gomez@email.com',
          location: {
            lat: 6.2730,
            lng: -75.5925,
            address: 'Calle 10Sur #34-12, Envigado'
          },
          status: 'planning',
          total_cost: 85000000,
          start_date: '2026-07-01',
          end_date: '2027-03-15',
          progress: 5,
          budget_items: [
            { name: 'Movimiento de tierra', estimated: 12000000, actual: 2000000, category: 'labor' },
            { name: 'Cimentación', estimated: 22000000, actual: 0, category: 'materials' },
            { name: 'Estructura metálica', estimated: 25000000, actual: 0, category: 'materials' },
            { name: 'Estudios de suelo y planos', estimated: 6000000, actual: 5800000, category: 'permits' },
            { name: 'Mano de obra general', estimated: 20000000, actual: 0, category: 'labor' }
          ],
          payment_plan: [
            { id: 'r1', name: 'Hito 1: Anticipo de Diseño', percentage: 10, amount: 8500000, dueDate: '2026-06-05', status: 'paid', paidDate: '2026-06-04' },
            { id: 'r2', name: 'Hito 2: Inicio de Movimiento Tierras', percentage: 40, amount: 34000000, dueDate: '2026-07-01', status: 'pending', paidDate: null },
            { id: 'r3', name: 'Hito 3: Estructura y Cubierta', percentage: 30, amount: 25500000, dueDate: '2026-11-15', status: 'pending', paidDate: null },
            { id: 'r4', name: 'Hito 4: Acabados y Acta Final', percentage: 20, amount: 17000000, dueDate: '2027-03-01', status: 'pending', paidDate: null }
          ]
        }
      ];

      const defaultTransactions = [
        { id: 'tx_1', project_id: '1', project_name: 'Condominio Altamira - Torre 1', type: 'income', category: 'client_payment', description: 'Firma de Contrato - Alejandro Restrepo', amount: 36000000, date: '2026-01-16' },
        { id: 'tx_2', project_id: '1', project_name: 'Condominio Altamira - Torre 1', type: 'expense', category: 'permits', description: 'Pago Licencia Curaduría 2', amount: 8200000, date: '2026-01-20' },
        { id: 'tx_3', project_id: '1', project_name: 'Condominio Altamira - Torre 1', type: 'expense', category: 'materials', description: 'Compra de Hierro y Malla Electrosoldada', amount: 18500000, date: '2026-02-05' },
        { id: 'tx_4', project_id: '1', project_name: 'Condominio Altamira - Torre 1', type: 'expense', category: 'labor', description: 'Pago de nómina oficial y ayudantes - Quincena Feb 1', amount: 12000000, date: '2026-02-15' },
        { id: 'tx_5', project_id: '1', project_name: 'Condominio Altamira - Torre 1', type: 'expense', category: 'materials', description: 'Vaciado de concreto premezclado de losa cimiento', amount: 18000000, date: '2026-02-28' },
        { id: 'tx_6', project_id: '1', project_name: 'Condominio Altamira - Torre 1', type: 'expense', category: 'labor', description: 'Pago de nómina oficial y ayudantes - Quincena Feb 2', amount: 12000000, date: '2026-02-28' },
        { id: 'tx_7', project_id: '1', project_name: 'Condominio Altamira - Torre 1', type: 'income', category: 'client_payment', description: 'Vaciado Losa de Tercer Piso - Cuota 2', amount: 36000000, date: '2026-05-12' },
        { id: 'tx_8', project_id: '1', project_name: 'Condominio Altamira - Torre 1', type: 'expense', category: 'materials', description: 'Tuberías PVC de ventilación y desagües', amount: 12000000, date: '2026-05-20' },
        { id: 'tx_9', project_id: '2', project_name: 'Residencia Campo Verde', type: 'expense', category: 'permits', description: 'Pago estudio geotécnico', amount: 5800000, date: '2026-05-28' },
        { id: 'tx_10', project_id: '2', project_name: 'Residencia Campo Verde', type: 'income', category: 'client_payment', description: 'Anticipo de Diseño - Liliana Gómez', amount: 8500000, date: '2026-06-04' },
        { id: 'tx_11', project_id: '2', project_name: 'Residencia Campo Verde', type: 'expense', category: 'labor', description: 'Primer abono a maquinaria de excavación', amount: 2000000, date: '2026-06-10' }
      ];

      await supabase.from('projects').insert(defaultProjects);
      await supabase.from('transactions').insert(defaultTransactions);
      console.log('Supabase mock data seeded successfully.');
    }

    // Seed default portfolio data if empty
    const { count: portCount, error: portError } = await supabase
      .from('portfolio')
      .select('*', { count: 'exact', head: true });

    if (!portError && portCount === 0) {
      const defaultPortfolio = [
        {
          id: 'p_1',
          code: 'CA-1',
          title: 'Casa Campestre Premium',
          description: 'Hermoso diseño de casa campestre de un solo piso. Cuenta con una distribución abierta que conecta una sala con chimenea, comedor y cocina americana. Incluye 3 habitaciones, 2 baños y una terraza exterior con zona de asados.',
          main_image: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MDAiIGhlaWdodD0iNjAwIiB2aWV3Qm94PSIwIDAgODAwIDYwMCI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iIzFlMjkzYiIvPjxwYXRoIGQ9Ik00MDAgMTUwIEw2MDAgMzUwIEgyMDAgWiIgZmlsbD0iI2ZmNmQwMCIvPjxyZWN0IHg9IjI1MCIgeT0iMzUwIiB3aWR0aD0iMzAwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iI2UyZThmMCIvPjxyZWN0IHg9IjM3MCIgeT0iNDAwIiB3aWR0aD0iNjAiIGhlaWdodD0iMTAwIiBmaWxsPSIjMGYxNzJhIi8+PGNpcmNsZSBjeD0iMzg1IiBjeT0iNDUwIiByPSI0IiBmaWxsPSIjZTJlOGYwIi8+PHJlY3QgeD0iMjgwIiB5PSIzODAiIHdpZHRoPSI2MCIgaGVpZ2h0PSI1MCIgZmlsbD0iIzBmMTcyYSIvPjxyZWN0IHg9IjE2MCIgeT0iMzgwIiB3aWR0aD0iNjAiIGhlaWdodD0iNTAiIGZpbGw9IiMwZjE3MmEiLz48L3N2Zz4=',
          blueprint_image: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MDAiIGhlaWdodD0iNjAwIiB2aWV3Qm94PSIwIDAgODAwIDYwMCI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iIzBkOTR4OCIvPjxnIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjUpIiBzdHJva2Utd2lkdGg9IjEiIHN0cm9rZS1kYXNoYXJyYXk9IjUsNSI+PGxpbmUgeDE9IjAiIHkxPSIxMDAiIHgyPSI4MDAiIHkyPSIxMDAiIC8+PGxpbmUgeDE9IjAiIHkxPSIyMDAiIHgyPSI4MDAiIHkyPSIyMDAiIC8+PGxpbmUgeDE9IjAiIHkxPSIzMDAiIHgyPSI4MDAiIHkyPSIzMDAiIC8+PGxpbmUgeDE9IjAiIHkxPSI0MDAiIHgyPSI4MDAiIHkyPSI0MDAiIC8+PGxpbmUgeDE9IjAiIHkxPSI1MDAiIHgyPSI4MDAiIHkyPSI1MDAiIC8+PGxpbmUgeDE9IjEwMCIgeT0iMCIgeDI9IjEwMCIgeTI9IjYwMCIgLz48bGluZSB4MT0iMjAwIiB5MT0iMCIgeDI9IjIwMCIgeTI9IjYwMCIgLz48bGluZSB4MT0iMzAwIiB5MT0iMCIgeDI9IjMwMCIgeTI9IjYwMCIgLz48bGluZSB4MT0iNDAwIiB5MT0iMCIgeDI9IjQwMCIgeTI9IjYwMCIgLz48bGluZSB4MT0iNTAwIiB5MT0iMCIgeDI9IjUwMCIgeTI9IjYwMCIgLz48bGluZSB4MT0iNjAwIiB5MT0iMCIgeDI9IjYwMCIgeTI9IjYwMCIgLz48bGluZSB4MT0iNzAwIiB5MT0iMCIgeDI9IjcwMCIgeTI9IjYwMCIgLz48L2c+PHJlY3QgeD0iMTUwIiB5PSIxNTAiIHdpZHRoPSI1MDAiIGhlaWdodD0iMzAwIiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iNCIvPjxsaW5lIHgxPSIzNTAiIHkxPSIxNTAiIHgyPSIzNTAiIHkyPSI0NTAiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSI0Ii8+PGxpbmUgeDE9IjE1MCIgeTE9IjMwMCIgeDI9IjM1MCIgeTI9IjMwMCIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjQiLz48dGV4dCB4PSIyNTAiIHk9IjIzMCIgZmlsbD0iI2ZmZiIgZm9udC1zaXplPSIyMCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+SEFCSVRBQ0nTT04gMTwvdGV4dD48dGV4dCB4PSIyNTAiIHk9IjM4MCIgZmlsbD0iI2ZmZiIgZm9udC1zaXplPSIyMCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+SEFCSVRBQ0nTT04gIDI8L3RleHQ+PHRleHQgeD0iNTAwIiB5PSIzMDAiIGZpbGw9IiNmZmYiIGZvbnQtc2l6ZT0iMjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiPlpPTkEgU09DSUFMPC90ZXh0Pjwvc3ZnPg==',
          other_images: [
            'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MDAiIGhlaWdodD0iNjAwIiB2aWV3Qm94PSIwIDAgODAwIDYwMCI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iIzExMTgyNyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmaWxsPSIjOTNhM2FmIiBmb250LXNpemU9IjMwIiBmb250LXdlaWdodD0iYm9sZCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+RmFjaGFkYSBQZXJzcGVjdGl2YTwvdGV4dD48L3N2Zz4='
          ],
          video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          construction_systems: ['Tradicional', 'Modular Prefabricado'],
          built_area: 140,
          lot_area: 320,
          logos: [
            'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iIzBmMTcyYSIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iNTAiIHI9IjM1IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZjZkMDAiIHN0cm9rZS13aWR0aD0iNCIvPjx0ZXh0IHg9IjUwIiB5PSI1NSIgZmlsbD0iI2ZmNmQwMCIgZm9udC1zaXplPSIxMiIgZm9udC13ZWlnaHQ9ImJvbGQiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkFMSUFETyAxPC90ZXh0Pjwvc3ZnPg==',
            'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iIzBmMTcyYSIvPjxwb2x5Z29uIHBvaW50cz0iNTAsMTUgODUsODAgMTUsODAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzEwYjk4MSIgc3Ryb2tlLXdpZHRoPSI0Ii8+PHRleHQgeD0iNTAiIHk9IjY1IiBmaWxsPSIjMTBiOTgxIiBmb250LXNpemU9IjEyIiBmb250LXdlaWdodD0iYm9sZCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+QUxJQURPIDI8L3RleHQ+PC9zdmc+'
          ]
        },
        {
          id: 'p_2',
          code: 'BM-2',
          title: 'Bungalow Moderno Loft',
          description: 'Diseño tipo loft industrial de doble altura. Perfecto para parejas o solteros, con una recámara en mezzanine, sala integrada a cocina de concepto abierto, grandes cristaleras y acabados rústicos en concreto expuesto.',
          main_image: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MDAiIGhlaWdodD0iNjAwIiB2aWV3Qm94PSIwIDAgODAwIDYwMCI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iIzExMTgyNyIvPjxyZWN0IHg9IjIwMCIgeT0iMjAwIiB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iIzQ3NTU2OSIvPjxwb2x5Z29uIHBvaW50cz0iMjAwLDIwMCA2MDAsMjAwIDUwMCwxMDAgMzAwLDEwMCIgZmlsbD0iI2ZmNmQwMCIvPjxyZWN0IHg9IjI1MCIgeT0iMjUwIiB3aWR0aD0iMzAwIiBoZWlnaHQ9IjI1MCIgZmlsbD0iIzA4OTFiMiIvPjxsaW5lIHgxPSI0MDAiIHkxPSIyNTAiIHgyPSI0MDAiIHkyPSI1MDAiIHN0cm9rZT0iIzBmMTcyYSIgc3Ryb2tlLXdpZHRoPSI0Ii8+PC9zdmc+',
          blueprint_image: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MDAiIGhlaWdodD0iNjAwIiB2aWV3Qm94PSIwIDAgODAwIDYwMCI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iIzBkOTR4OCIvPjxnIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjUpIiBzdHJva2Utd2lkdGg9IjEiIHN0cm9rZS1kYXNoYXJyYXk9IjUsNSI+PC9nPjxyZWN0IHg9IjIwMCIgeT0iMjAwIiB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjQiLz48dGV4dCB4PSI0MDAiIHk9IjMwMCIgZmlsbD0iI2ZmZiIgZm9udC1zaXplPSIyMCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+TE9GVCBBUkVSPC90ZXh0Pjwvc3ZnPg==',
          other_images: [],
          video_url: '',
          construction_systems: ['Steel Framing', 'Modular Prefabricado'],
          built_area: 85,
          lot_area: 120,
          logos: []
        }
      ];
      await supabase.from('portfolio').insert(defaultPortfolio);
      console.log('Supabase portfolio mock data seeded successfully.');
    }
  } catch (err) {
    console.error('Seeding error:', err);
  }
};

// Generic Accessors
export const getAll = async (tableName) => {
  const { data, error } = await supabase
    .from(tableName)
    .select('*');

  if (error) throw error;
  
  if (tableName === 'projects') {
    return data.map(mapProjectToCamel);
  }
  if (tableName === 'transactions') {
    return data.map(mapTransactionToCamel);
  }
  return data;
};

export const saveItem = async (tableName, item) => {
  let itemToSave = item;
  if (tableName === 'projects') {
    itemToSave = mapProjectToSnake(item);
  } else if (tableName === 'transactions') {
    itemToSave = mapTransactionToSnake(item);
  }

  const { data, error } = await supabase
    .from(tableName)
    .upsert(itemToSave)
    .select();

  if (error) throw error;
  return data;
};

export const deleteItem = async (tableName, key) => {
  const { error } = await supabase
    .from(tableName)
    .delete()
    .eq('id', key);

  if (error) throw error;
  return true;
};

// Specialized Document Storage
export const saveDocument = async (projId, name, type, fileBase64) => {
  const { data, error } = await supabase
    .from('documents')
    .insert({
      project_id: projId,
      name,
      type,
      file_base64: fileBase64,
      upload_date: new Date().toISOString().split('T')[0]
    })
    .select();

  if (error) throw error;
  return data;
};

export const getDocumentsForProject = async (projId) => {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('project_id', projId);

  if (error) throw error;
  return data.map(d => ({
    id: d.id,
    projectId: d.project_id,
    name: d.name,
    type: d.type,
    fileBase64: d.file_base64,
    uploadDate: d.upload_date
  }));
};

// Specialized Progress Gallery Storage
export const saveGalleryItem = async (projId, description, fileBase64, fileType) => {
  const { data, error } = await supabase
    .from('gallery')
    .insert({
      project_id: projId,
      description,
      file_base64: fileBase64,
      file_type: fileType,
      upload_date: new Date().toISOString().split('T')[0]
    })
    .select();

  if (error) throw error;
  return data;
};

export const getGalleryForProject = async (projId) => {
  const { data, error } = await supabase
    .from('gallery')
    .select('*')
    .eq('project_id', projId);

  if (error) throw error;
  return data.map(g => ({
    id: g.id,
    projectId: g.project_id,
    description: g.description,
    fileBase64: g.file_base64,
    fileType: g.file_type,
    uploadDate: g.upload_date
  }));
};

// --- User Management & Auth Services ---

export const loginWithPin = async (email, pin) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email.trim().toLowerCase())
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('Usuario no encontrado');
    }
    throw error;
  }

  if (data.pin !== pin) {
    throw new Error('PIN incorrecto');
  }

  return {
    email: data.email,
    name: data.name,
    role: data.role
  };
};

export const getUsers = async () => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data.map(u => ({
    email: u.email,
    name: u.name,
    role: u.role,
    pin: u.pin,
    createdAt: u.created_at
  }));
};

export const saveUser = async (user) => {
  const { data, error } = await supabase
    .from('users')
    .upsert({
      email: user.email.trim().toLowerCase(),
      name: user.name,
      role: user.role,
      pin: user.pin
    })
    .select();

  if (error) throw error;
  return data;
};

export const deleteUser = async (email) => {
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('email', email);

  if (error) throw error;
  return true;
};

// --- Portfolio Management Services ---

export const getPortfolio = async () => {
  const { data, error } = await supabase
    .from('portfolio')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data.map(item => ({
    id: item.id,
    code: item.code,
    title: item.title,
    description: item.description,
    mainImage: item.main_image,
    blueprintImage: item.blueprint_image,
    otherImages: item.other_images || [],
    videoUrl: item.video_url || '',
    constructionSystems: item.construction_systems || [],
    builtArea: parseFloat(item.built_area) || 0,
    lotArea: parseFloat(item.lot_area) || 0,
    logos: item.logos || [],
    createdAt: item.created_at
  }));
};

export const savePortfolioItem = async (item) => {
  const itemToSave = {
    id: item.id,
    code: item.code,
    title: item.title,
    description: item.description,
    main_image: item.mainImage,
    blueprint_image: item.blueprintImage,
    other_images: item.otherImages || [],
    video_url: item.videoUrl || '',
    construction_systems: item.constructionSystems || [],
    built_area: item.builtArea,
    lot_area: item.lotArea,
    logos: item.logos || []
  };

  const { data, error } = await supabase
    .from('portfolio')
    .upsert(itemToSave)
    .select();

  if (error) throw error;
  return data;
};

export const deletePortfolioItem = async (id) => {
  const { error } = await supabase
    .from('portfolio')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
};

// --- Specialized Progress Logs Services ---

export const getProgressLogsForProject = async (projId) => {
  const { data, error } = await supabase
    .from('progress_logs')
    .select('*')
    .eq('project_id', projId)
    .order('upload_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data.map(log => ({
    id: log.id,
    projectId: log.project_id,
    description: log.description,
    uploadDate: log.upload_date,
    media: log.media || [],
    createdAt: log.created_at
  }));
};

export const saveProgressLog = async (logItem) => {
  const itemToSave = {
    project_id: logItem.projectId,
    description: logItem.description,
    upload_date: logItem.uploadDate,
    media: logItem.media || []
  };

  if (logItem.id) {
    itemToSave.id = logItem.id;
  }

  const { data, error } = await supabase
    .from('progress_logs')
    .upsert(itemToSave)
    .select();

  if (error) throw error;
  return data;
};

export const deleteProgressLog = async (id) => {
  const { error } = await supabase
    .from('progress_logs')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
};



