import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Mapping helpers to translate Postgres snake_case to React camelCase
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
  return data;
};

export const saveItem = async (tableName, item) => {
  let itemToSave = item;
  if (tableName === 'projects') {
    itemToSave = mapProjectToSnake(item);
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

