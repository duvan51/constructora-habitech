// Centralized Chequeras & Cajas management for Habitech Constructor
// Handles default accounts ('Caja Dumar', 'Caja Duvan', 'Bancolombia Empresas', etc.)
// and allows users to dynamically add new cash boxes / bank accounts.

export const DEFAULT_CHEQUERAS = [
  'Caja Dumar',
  'Caja Duvan',
  'Bancolombia Empresas'
];

const STORAGE_KEY = 'habitech_chequeras';

/**
 * Get all available chequeras/cajas, merging defaults with custom ones saved in localStorage.
 */
export const getChequerasList = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const combined = [...parsed];
        DEFAULT_CHEQUERAS.forEach(def => {
          if (!combined.some(c => c.trim().toLowerCase() === def.toLowerCase())) {
            combined.push(def);
          }
        });
        return combined;
      }
    }
  } catch (e) {
    console.warn('Error reading chequeras from localStorage:', e);
  }
  return [...DEFAULT_CHEQUERAS];
};

/**
 * Register a new chequera/caja if it doesn't already exist.
 */
export const saveNewChequera = (name) => {
  if (!name || !name.trim()) return getChequerasList();
  const trimmed = name.trim();
  const current = getChequerasList();
  if (!current.some(c => c.trim().toLowerCase() === trimmed.toLowerCase())) {
    const updated = [...current, trimmed];
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Error saving chequeras to localStorage:', e);
    }
    return updated;
  }
  return current;
};

/**
 * Extract the chequera / caja name from a transaction object or raw description.
 */
export const extractChequera = (txOrDesc) => {
  if (!txOrDesc) return '';
  if (typeof txOrDesc === 'object') {
    if (txOrDesc.chequera && txOrDesc.chequera.trim()) return txOrDesc.chequera.trim();
    if (txOrDesc.account && txOrDesc.account.trim()) return txOrDesc.account.trim();
    if (txOrDesc.method && !['Transferencia', 'Efectivo', 'Consignación', 'Cheque'].includes(txOrDesc.method.trim())) {
      return txOrDesc.method.trim();
    }
    if (txOrDesc.description) {
      return extractChequera(txOrDesc.description);
    }
    return '';
  }

  if (typeof txOrDesc === 'string') {
    const match = txOrDesc.match(/\[(?:Chequera|Caja|Cuenta):\s*([^\]]+)\]/i) || 
                  txOrDesc.match(/\((?:Chequera|Caja|Cuenta):\s*([^)]+)\)/i);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return '';
};

/**
 * Strips technical suffixes, personnel details and chequera metadata from description to show a clean purchase title.
 */
export const cleanPurchaseDescription = (rawDesc, projectName = '') => {
  if (!rawDesc) return '';
  let desc = rawDesc;
  if (desc.includes(' || Compra: ')) {
    desc = desc.split(' || Compra: ')[1] || desc;
  } else if (desc.includes(' || ')) {
    desc = desc.split(' || ')[1] || desc;
  }
  if (projectName) {
    desc = desc.replace(` (Obra: ${projectName})`, '');
  }
  desc = desc.replace(/ \(Obra: .*?\)$/, '');
  desc = desc.replace(/ \[Pagado a: .*? - Cédula: .*?\]/, '');
  desc = desc.replace(/ \[Chequera:\s*[^\]]+\]/i, '');
  desc = desc.replace(/ \[Caja:\s*[^\]]+\]/i, '');
  desc = desc.replace(/ \[Cuenta:\s*[^\]]+\]/i, '');
  return desc.trim();
};

