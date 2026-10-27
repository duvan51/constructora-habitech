/**
 * URL and Dynamic Routing Utility for Habitech Constructor
 * 
 * Provides human-readable, clean URLs indicating the active project/obra,
 * subtab section (presupuesto, pagos, documentos, bitácora), editing status,
 * full browser history (back/forward) support, and dynamic page titles.
 */

// Convert project name to clean URL slug (e.g. "Remodelación Apto 402" -> "remodelacion-apto-402")
export const slugify = (text) => {
  if (!text) return '';
  return String(text)
    .normalize('NFD') // Normalize unicode accents
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove non-alphanumeric chars
    .replace(/[\s_]+/g, '-') // Replace spaces & underscores with -
    .replace(/-+/g, '-'); // Collapse multiple hyphens
};

export const SUBTAB_TO_SECTION = {
  general: 'general',
  payments: 'pagos',
  budget: 'presupuesto',
  docs: 'documentos',
  gallery: 'bitacora'
};

export const SECTION_TO_SUBTAB = {
  general: 'general',
  resumen: 'general',
  fases: 'general',
  pagos: 'payments',
  payments: 'payments',
  hitos: 'payments',
  presupuesto: 'budget',
  budget: 'budget',
  gastos: 'budget',
  costos: 'budget',
  documentos: 'docs',
  docs: 'docs',
  expediente: 'docs',
  bitacora: 'gallery',
  gallery: 'gallery',
  avances: 'gallery',
  fotos: 'gallery'
};

export const TAB_TITLES = {
  dashboard: 'Panel de Control',
  projects: 'Directorio de Obras',
  management: 'Gestión y Control de Obras',
  personnel: 'Gestión de Personal',
  adjustments: 'Ajustes Totales',
  portfolio: 'Portafolio de Proyectos',
  ledger: 'Libro de Caja y Finanzas',
  quote: 'Cotizador Habitech',
  retefuente: 'Calculadora de Retefuente',
  users: 'Gestión de Usuarios',
  settings: 'Configuración API'
};

export const SUBTAB_TITLES = {
  general: 'Resumen y Fases',
  payments: 'Plan de Pagos e Hitos',
  budget: 'Presupuesto y Costos',
  docs: 'Expediente Documental',
  gallery: 'Bitácora y Avances'
};

/**
 * Parse current URL query parameters into state values
 */
export const parseUrlState = () => {
  if (typeof window === 'undefined') {
    return { tab: 'dashboard', projectId: null, obraSlug: null, subTab: 'general', isEditing: false };
  }

  const params = new URLSearchParams(window.location.search);
  const tab = params.get('tab') || (params.get('obra') || params.get('id') ? 'projects' : 'dashboard');
  const projectId = params.get('id') || null;
  const obraSlug = params.get('obra') || params.get('proyecto') || null;
  
  const rawSection = params.get('seccion') || params.get('subtab') || params.get('sec') || '';
  const subTab = SECTION_TO_SUBTAB[rawSection.toLowerCase()] || 'general';
  
  const isEditing = params.get('modo') === 'editar' || 
                    params.get('editar') === 'true' || 
                    params.get('edit') === 'true';

  return { tab, projectId, obraSlug, subTab, isEditing };
};

/**
 * Locate project from URL parameters (by ID or slug)
 */
export const findProjectFromUrl = (projectsList = [], { projectId, obraSlug } = {}) => {
  if (!projectsList || projectsList.length === 0) return null;

  // 1. Direct match by ID
  if (projectId) {
    const matchById = projectsList.find(p => String(p.id) === String(projectId));
    if (matchById) return matchById;
  }

  // 2. Match by exact slug
  if (obraSlug) {
    const cleanSlug = slugify(obraSlug);
    const matchBySlug = projectsList.find(p => slugify(p.name) === cleanSlug);
    if (matchBySlug) return matchBySlug;

    // 3. Match if slug includes or starts with
    const partialMatch = projectsList.find(p => {
      const pSlug = slugify(p.name);
      return pSlug.startsWith(cleanSlug) || cleanSlug.startsWith(pSlug) || pSlug.includes(cleanSlug);
    });
    if (partialMatch) return partialMatch;
  }

  return null;
};

/**
 * Build the query string for given state
 */
export const buildQueryString = ({ tab = 'dashboard', project = null, subTab = 'general', isEditing = false }) => {
  const params = new URLSearchParams();

  if (project) {
    params.set('tab', tab || 'projects');
    const slug = slugify(project.name);
    if (slug) params.set('obra', slug);
    if (project.id) params.set('id', project.id);
    
    if (subTab && subTab !== 'general') {
      params.set('seccion', SUBTAB_TO_SECTION[subTab] || subTab);
    }

    if (isEditing) {
      params.set('modo', 'editar');
    }
  } else {
    if (tab && tab !== 'dashboard') {
      params.set('tab', tab);
    }
  }

  const queryStr = params.toString();
  return queryStr ? `?${queryStr}` : window.location.pathname;
};

/**
 * Update the browser URL and page title without reloading
 */
export const syncUrlAndTitle = ({ 
  tab = 'dashboard', 
  project = null, 
  subTab = 'general', 
  isEditing = false, 
  replace = false 
}) => {
  if (typeof window === 'undefined') return;

  const targetPath = buildQueryString({ tab, project, subTab, isEditing });
  const currentPath = window.location.search || window.location.pathname;

  // Only update URL if something meaningful changed
  if (targetPath !== currentPath) {
    const stateObj = { 
      tab, 
      projectId: project?.id || null, 
      obraSlug: project ? slugify(project.name) : null,
      subTab, 
      isEditing 
    };

    if (replace) {
      window.history.replaceState(stateObj, '', targetPath);
    } else {
      window.history.pushState(stateObj, '', targetPath);
    }
  }

  // Update browser window / tab title
  if (project) {
    if (isEditing) {
      document.title = `✏️ Editando: ${project.name} | Habitech`;
    } else {
      const subTitle = SUBTAB_TITLES[subTab] || 'Obra';
      document.title = `🏗️ ${project.name} · ${subTitle} | Habitech`;
    }
  } else {
    const tabName = TAB_TITLES[tab] || 'Control de Obras y Finanzas';
    document.title = `Habitech Constructor | ${tabName}`;
  }
};
