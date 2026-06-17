// IndexedDB storage manager for Habitech Constructor

const DB_NAME = 'HabitechDB';
const DB_VERSION = 1;

export const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('Database error:', event.target.error);
      reject(event.target.error);
    };

    request.onsuccess = (event) => {
      const db = event.target.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Projects store
      if (!db.objectStoreNames.contains('projects')) {
        db.createObjectStore('projects', { keyPath: 'id' });
      }

      // Ledger Transactions store
      if (!db.objectStoreNames.contains('transactions')) {
        db.createObjectStore('transactions', { keyPath: 'id', autoIncrement: true });
      }

      // Scanned client documents (contracts, payment slips)
      if (!db.objectStoreNames.contains('documents')) {
        db.createObjectStore('documents', { keyPath: 'id', autoIncrement: true });
      }

      // Progress gallery (photos & videos)
      if (!db.objectStoreNames.contains('gallery')) {
        db.createObjectStore('gallery', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
};

// Seed default data if stores are empty
export const seedMockData = async () => {
  const db = await initDB();
  
  const checkEmpty = (storeName) => {
    return new Promise((resolve) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const countRequest = store.count();
      countRequest.onsuccess = () => {
        resolve(countRequest.result === 0);
      };
    });
  };

  const isProjectsEmpty = await checkEmpty('projects');
  
  if (isProjectsEmpty) {
    const defaultProjects = [
      {
        id: '1',
        name: 'Condominio Altamira - Torre 1',
        clientName: 'Alejandro Restrepo',
        clientPhone: '+57 312 456 7890',
        clientEmail: 'alejandro.restrepo@email.com',
        location: {
          lat: 6.2518,
          lng: -75.5636,
          address: 'Carrera 43A #1-50, Poblado, Medellín'
        },
        status: 'active',
        totalCost: 120000000,
        startDate: '2026-01-15',
        endDate: '2026-12-20',
        progress: 45,
        budgetItems: [
          { name: 'Cimentación y estructura', estimated: 35000000, actual: 36500000, category: 'materials' },
          { name: 'Mano de obra (Estructura)', estimated: 25000000, actual: 24000000, category: 'labor' },
          { name: 'Redes Hidrosanitarias', estimated: 15000000, actual: 12000000, category: 'materials' },
          { name: 'Mampostería y revoques', estimated: 20000000, actual: 5000000, category: 'labor' },
          { name: 'Licencia de construcción', estimated: 8000000, actual: 8200000, category: 'permits' },
          { name: 'Acabados y carpintería', estimated: 17000000, actual: 0, category: 'materials' }
        ],
        paymentPlan: [
          { id: 'p1', name: 'Cuota Inicial / Firma de Contrato', percentage: 30, amount: 36000000, dueDate: '2026-01-16', status: 'paid', paidDate: '2026-01-16' },
          { id: 'p2', name: 'Vaciado de Losa de Tercer Piso', percentage: 30, amount: 36000000, dueDate: '2026-05-10', status: 'paid', paidDate: '2026-05-12' },
          { id: 'p3', name: 'Techado e Instalaciones Internas', percentage: 20, amount: 24000000, dueDate: '2026-08-30', status: 'pending', paidDate: null },
          { id: 'p4', name: 'Entrega de Llaves y Acabados', percentage: 20, amount: 24000000, dueDate: '2026-12-15', status: 'pending', paidDate: null }
        ]
      },
      {
        id: '2',
        name: 'Residencia Campo Verde',
        clientName: 'Liliana Patricia Gómez',
        clientPhone: '+57 300 765 4321',
        clientEmail: 'liliana.gomez@email.com',
        location: {
          lat: 6.2730,
          lng: -75.5925,
          address: 'Calle 10Sur #34-12, Envigado'
        },
        status: 'planning',
        totalCost: 85000000,
        startDate: '2026-07-01',
        endDate: '2027-03-15',
        progress: 5,
        budgetItems: [
          { name: 'Movimiento de tierra', estimated: 12000000, actual: 2000000, category: 'labor' },
          { name: 'Cimentación', estimated: 22000000, actual: 0, category: 'materials' },
          { name: 'Estructura metálica', estimated: 25000000, actual: 0, category: 'materials' },
          { name: 'Estudios de suelo y planos', estimated: 6000000, actual: 5800000, category: 'permits' },
          { name: 'Mano de obra general', estimated: 20000000, actual: 0, category: 'labor' }
        ],
        paymentPlan: [
          { id: 'r1', name: 'Hito 1: Anticipo de Diseño', percentage: 10, amount: 8500000, dueDate: '2026-06-05', status: 'paid', paidDate: '2026-06-04' },
          { id: 'r2', name: 'Hito 2: Inicio de Movimiento Tierras', percentage: 40, amount: 34000000, dueDate: '2026-07-01', status: 'pending', paidDate: null },
          { id: 'r3', name: 'Hito 3: Estructura y Cubierta', percentage: 30, amount: 25500000, dueDate: '2026-11-15', status: 'pending', paidDate: null },
          { id: 'r4', name: 'Hito 4: Acabados y Acta Final', percentage: 20, amount: 17000000, dueDate: '2027-03-01', status: 'pending', paidDate: null }
        ]
      }
    ];

    const defaultTransactions = [
      { id: 1, projectId: '1', projectName: 'Condominio Altamira - Torre 1', type: 'income', category: 'client_payment', description: 'Firma de Contrato - Alejandro Restrepo', amount: 36000000, date: '2026-01-16' },
      { id: 2, projectId: '1', projectName: 'Condominio Altamira - Torre 1', type: 'expense', category: 'permits', description: 'Pago Licencia Curaduría 2', amount: 8200000, date: '2026-01-20' },
      { id: 3, projectId: '1', projectName: 'Condominio Altamira - Torre 1', type: 'expense', category: 'materials', description: 'Compra de Hierro y Malla Electrosoldada', amount: 18500000, date: '2026-02-05' },
      { id: 4, projectId: '1', projectName: 'Condominio Altamira - Torre 1', type: 'expense', category: 'labor', description: 'Pago de nómina oficial y ayudantes - Quincena Feb 1', amount: 12000000, date: '2026-02-15' },
      { id: 5, projectId: '1', projectName: 'Condominio Altamira - Torre 1', type: 'expense', category: 'materials', description: 'Vaciado de concreto premezclado de losa cimiento', amount: 18000000, date: '2026-02-28' },
      { id: 6, projectId: '1', projectName: 'Condominio Altamira - Torre 1', type: 'expense', category: 'labor', description: 'Pago de nómina oficial y ayudantes - Quincena Feb 2', amount: 12000000, date: '2026-02-28' },
      { id: 7, projectId: '1', projectName: 'Condominio Altamira - Torre 1', type: 'income', category: 'client_payment', description: 'Vaciado Losa de Tercer Piso - Cuota 2', amount: 36000000, date: '2026-05-12' },
      { id: 8, projectId: '1', projectName: 'Condominio Altamira - Torre 1', type: 'expense', category: 'materials', description: 'Tuberías PVC de ventilación y desagües', amount: 12000000, date: '2026-05-20' },
      { id: 9, projectId: '2', projectName: 'Residencia Campo Verde', type: 'expense', category: 'permits', description: 'Pago estudio geotécnico', amount: 5800000, date: '2026-05-28' },
      { id: 10, projectId: '2', projectName: 'Residencia Campo Verde', type: 'income', category: 'client_payment', description: 'Anticipo de Diseño - Liliana Gómez', amount: 8500000, date: '2026-06-04' },
      { id: 11, projectId: '2', projectName: 'Residencia Campo Verde', type: 'expense', category: 'labor', description: 'Primer abono a maquinaria de excavación', amount: 2000000, date: '2026-06-10' }
    ];

    const transaction = db.transaction(['projects', 'transactions'], 'readwrite');
    const projectsStore = transaction.objectStore('projects');
    const transStore = transaction.objectStore('transactions');

    defaultProjects.forEach(proj => projectsStore.add(proj));
    defaultTransactions.forEach(trans => transStore.add(trans));
    
    console.log('Mock data seeded successfully.');
  }
};

// Generic DB Accessors
export const getAll = (storeName) => {
  return new Promise(async (resolve, reject) => {
    const db = await initDB();
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const saveItem = (storeName, item) => {
  return new Promise(async (resolve, reject) => {
    const db = await initDB();
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(item);
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const deleteItem = (storeName, key) => {
  return new Promise(async (resolve, reject) => {
    const db = await initDB();
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(key);
    
    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
};

// Specialized Document Storage
export const saveDocument = (projId, name, type, fileBase64) => {
  return saveItem('documents', {
    projectId: projId,
    name,
    type, // 'contract' | 'payment_receipt' | 'other'
    fileBase64, // base64 string
    uploadDate: new Date().toISOString().split('T')[0]
  });
};

export const getDocumentsForProject = async (projId) => {
  const docs = await getAll('documents');
  return docs.filter(doc => doc.projectId === projId);
};

// Specialized Progress Gallery Storage
export const saveGalleryItem = (projId, description, fileBase64, fileType) => {
  return saveItem('gallery', {
    projectId: projId,
    description,
    fileBase64,
    fileType, // 'image' | 'video'
    uploadDate: new Date().toISOString().split('T')[0]
  });
};

export const getGalleryForProject = async (projId) => {
  const gallery = await getAll('gallery');
  return gallery.filter(item => item.projectId === projId);
};
