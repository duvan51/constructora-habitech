import React, { useState, useMemo } from 'react';
import { printElement } from '../utils/printHelper';
import { 
  Scale, 
  Search, 
  Filter, 
  DollarSign, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  ChevronDown, 
  ChevronUp, 
  PlusCircle, 
  FileText, 
  Printer, 
  HardHat, 
  User, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Building, 
  Layers, 
  Receipt, 
  Check, 
  X,
  ExternalLink,
  Eye,
  Info,
  RotateCcw,
  ArrowUpDown
} from 'lucide-react';

export default function TotalAdjustments({ 
  projects = [], 
  personnel = [], 
  transactions = [], 
  userRole, 
  onAddTransaction, 
  onNavigateToProject,
  onNavigateToLedger 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'pending', 'settled', 'overpaid'
  const [projectFilter, setProjectFilter] = useState('all');
  const [sortBy, setSortBy] = useState('pendingDesc'); // 'pendingDesc', 'budgetDesc', 'paidDesc', 'nameAsc'
  const [expandedPersonId, setExpandedPersonId] = useState(null);
  const [activeTabByPerson, setActiveTabByPerson] = useState({}); // { personId: 'budget' | 'payments' }

  // Modal states
  const [abonoModalPerson, setAbonoModalPerson] = useState(null);
  const [pazYSalvoPerson, setPazYSalvoPerson] = useState(null);
  const [previewReceipt, setPreviewReceipt] = useState(null);

  // Abono form state
  const [abonoForm, setAbonoForm] = useState({
    projectId: '',
    budgetItemId: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    receiptNumber: '',
    description: ''
  });
  const [abonoSubmitting, setAbonoSubmitting] = useState(false);
  const [abonoSuccessMessage, setAbonoSuccessMessage] = useState('');

  // Currency Formatter
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', { 
      style: 'currency', 
      currency: 'COP', 
      maximumFractionDigits: 0 
    }).format(amount || 0);
  };

  // Date Formatter
  const formatDate = (dateStr) => {
    if (!dateStr) return '---';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return new Date(dateStr).toLocaleDateString('es-CO');
    } catch {
      return dateStr;
    }
  };

  // -------------------------------------------------------------
  // CONSOLIDATION CALCULATIONS
  // -------------------------------------------------------------
  const consolidatedPersonnel = useMemo(() => {
    if (!personnel || personnel.length === 0) return [];

    return personnel.map(person => {
      // 1. Gather all assigned budget items across all projects
      const assignedBudgetItems = [];
      projects.forEach(project => {
        (project.budgetItems || []).forEach(bItem => {
          const matches = bItem.personnelId && String(bItem.personnelId) === String(person.id);
          if (matches) {
            assignedBudgetItems.push({
              projectId: project.id,
              projectName: project.name,
              budgetItemId: bItem.id || `item_${bItem.name}`,
              name: bItem.name,
              category: bItem.category || 'labor',
              estimated: Number(bItem.estimated) || 0,
              actual: Number(bItem.actual) || 0,
              status: bItem.status || 'pending'
            });
          }
        });
      });

      // Sum of all assigned budgets across all obras ($X + $Y + ...)
      const totalPresupuestado = assignedBudgetItems.reduce((acc, item) => acc + item.estimated, 0);

      // 2. Gather all cash register expense transactions delivered to this person
      const matchingExpenses = transactions.filter(t => {
        if (t.type !== 'expense') return false;
        // Exclude cancelled transactions
        const desc = (t.description || '').trim();
        if (desc.startsWith('[CANCELADO]') || desc.startsWith('[ANULADO]')) return false;

        // Direct ID match
        if (t.personnelId && String(t.personnelId) === String(person.id)) return true;

        // Document ID match in description
        if (person.documentId && desc.includes(person.documentId)) return true;

        // Exact name match in personnelName or description
        if (t.personnelName && t.personnelName.trim().toLowerCase() === person.name.trim().toLowerCase()) return true;

        return false;
      });

      // Sum of all payments delivered ($F)
      const totalPagado = matchingExpenses.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);

      // Net balance ($L = Total Presupuestado - Total Pagado)
      const balance = totalPresupuestado - totalPagado;

      // Status determination
      let status = 'settled'; // Paz y Salvo
      if (balance > 0) {
        status = 'pending'; // Le debemos plata
      } else if (balance < 0) {
        status = 'overpaid'; // Le hemos dado más de lo presupuestado (saldo a favor de constructora)
      }

      // Percentage paid
      let percentPaid = 0;
      if (totalPresupuestado > 0) {
        percentPaid = Math.min(100, Math.max(0, (totalPagado / totalPresupuestado) * 100));
      } else if (totalPagado > 0) {
        percentPaid = 100;
      }

      // Projects involved
      const projectIdsSet = new Set();
      assignedBudgetItems.forEach(b => projectIdsSet.add(b.projectId));
      matchingExpenses.forEach(t => {
        if (t.projectId && t.projectId !== 'general') projectIdsSet.add(t.projectId);
      });
      const participatingProjects = Array.from(projectIdsSet).map(pId => {
        const found = projects.find(p => p.id === pId);
        return found ? { id: found.id, name: found.name } : { id: pId, name: pId };
      });

      return {
        person,
        assignedBudgetItems,
        totalPresupuestado,
        matchingExpenses,
        totalPagado,
        balance,
        status,
        percentPaid,
        participatingProjects
      };
    });
  }, [personnel, projects, transactions]);

  // Global Financial KPIs
  const globalKPIs = useMemo(() => {
    let totalPresupuestado = 0;
    let totalPagado = 0;
    let totalPendientePorPagar = 0;
    let totalSaldoAFavor = 0;
    let countPending = 0;
    let countSettled = 0;
    let countOverpaid = 0;

    consolidatedPersonnel.forEach(cp => {
      totalPresupuestado += cp.totalPresupuestado;
      totalPagado += cp.totalPagado;
      if (cp.balance > 0) {
        totalPendientePorPagar += cp.balance;
        countPending++;
      } else if (cp.balance < 0) {
        totalSaldoAFavor += Math.abs(cp.balance);
        countOverpaid++;
      } else if (cp.totalPresupuestado > 0 || cp.totalPagado > 0) {
        countSettled++;
      }
    });

    return {
      totalPresupuestado,
      totalPagado,
      totalPendientePorPagar,
      totalSaldoAFavor,
      countPending,
      countSettled,
      countOverpaid,
      totalActiveContractors: consolidatedPersonnel.filter(cp => cp.totalPresupuestado > 0 || cp.totalPagado > 0).length
    };
  }, [consolidatedPersonnel]);

  // Filter and Sort Personnel
  const filteredPersonnel = useMemo(() => {
    let list = consolidatedPersonnel.filter(cp => {
      // Search term (searches name, cédula, cargo, involved projects and assigned budget items)
      const search = searchTerm.toLowerCase().trim();
      if (search) {
        const nameMatch = cp.person.name.toLowerCase().includes(search);
        const docMatch = (cp.person.documentId || '').toLowerCase().includes(search);
        const jobMatch = (cp.person.jobTitle || '').toLowerCase().includes(search);
        const projectMatch = cp.participatingProjects.some(p => (p.name || '').toLowerCase().includes(search));
        const budgetMatch = cp.assignedBudgetItems.some(b => (b.name || '').toLowerCase().includes(search));
        if (!nameMatch && !docMatch && !jobMatch && !projectMatch && !budgetMatch) return false;
      }

      // Status filter
      if (statusFilter !== 'all' && cp.status !== statusFilter) return false;

      // Project filter
      if (projectFilter !== 'all') {
        const inProject = cp.participatingProjects.some(p => p.id === projectFilter);
        if (!inProject) return false;
      }

      return true;
    });

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'pendingDesc') {
        return b.balance - a.balance;
      }
      if (sortBy === 'budgetDesc') {
        return b.totalPresupuestado - a.totalPresupuestado;
      }
      if (sortBy === 'paidDesc') {
        return b.totalPagado - a.totalPagado;
      }
      if (sortBy === 'nameAsc') {
        return a.person.name.localeCompare(b.person.name);
      }
      return 0;
    });

    return list;
  }, [consolidatedPersonnel, searchTerm, statusFilter, projectFilter, sortBy]);

  // Filter helper flags
  const hasActiveFilters = Boolean(
    searchTerm.trim() !== '' || 
    statusFilter !== 'all' || 
    projectFilter !== 'all' || 
    sortBy !== 'pendingDesc'
  );

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setProjectFilter('all');
    setSortBy('pendingDesc');
  };

  // -------------------------------------------------------------
  // ABONO RÁPIDO HANDLERS
  // -------------------------------------------------------------
  const handleOpenAbonoModal = (cp) => {
    setAbonoModalPerson(cp);
    setAbonoSuccessMessage('');

    // Pre-select first project if available
    const defaultProjectId = cp.assignedBudgetItems.length > 0 
      ? cp.assignedBudgetItems[0].projectId 
      : (projects.length > 0 ? projects[0].id : 'general');

    // Pre-select first budget item for that project if available
    const defaultBudgetItem = cp.assignedBudgetItems.find(b => b.projectId === defaultProjectId);

    setAbonoForm({
      projectId: defaultProjectId,
      budgetItemId: defaultBudgetItem ? defaultBudgetItem.budgetItemId : '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      receiptNumber: '',
      description: `Abono mano de obra / liquidación a ${cp.person.name}`
    });
  };

  const handleAbonoProjectChange = (e) => {
    const pId = e.target.value;
    // Find matching budget items for this person in selected project
    let matchingItem = '';
    if (abonoModalPerson) {
      const bItem = abonoModalPerson.assignedBudgetItems.find(b => b.projectId === pId);
      if (bItem) matchingItem = bItem.budgetItemId;
    }

    setAbonoForm(prev => ({
      ...prev,
      projectId: pId,
      budgetItemId: matchingItem
    }));
  };

  const handleSubmitAbono = async (e) => {
    e.preventDefault();
    if (!onAddTransaction) return;

    const parsedAmount = Number(abonoForm.amount);
    if (!parsedAmount || parsedAmount <= 0) {
      alert('Por favor ingresa un monto válido superior a $0.');
      return;
    }

    try {
      setAbonoSubmitting(true);
      const selectedProject = projects.find(p => p.id === abonoForm.projectId);
      const projectName = abonoForm.projectId === 'general' 
        ? 'Caja General' 
        : (selectedProject?.name || 'Obra');

      let targetBudgetItem = null;
      if (selectedProject && abonoForm.budgetItemId) {
        targetBudgetItem = (selectedProject.budgetItems || []).find(b => 
          (b.id && String(b.id) === String(abonoForm.budgetItemId)) || b.name === abonoForm.budgetItemId
        );
      }

      // Format description cleanly
      let fullDescription = abonoForm.description.trim();
      if (targetBudgetItem?.name) {
        fullDescription = `${targetBudgetItem.name} || ${fullDescription}`;
      }
      if (abonoForm.receiptNumber.trim()) {
        fullDescription += ` (Factura/Soporte: ${abonoForm.receiptNumber.trim()})`;
      }
      fullDescription += ` [Pagado a: ${abonoModalPerson.person.name} - Cédula: ${abonoModalPerson.person.documentId}]`;

      const newTx = {
        type: 'expense',
        projectId: abonoForm.projectId,
        projectName: projectName,
        category: targetBudgetItem?.category || 'labor',
        budgetItemId: targetBudgetItem?.id || abonoForm.budgetItemId || null,
        budgetItemName: targetBudgetItem?.name || null,
        personnelId: abonoModalPerson.person.id,
        personnelName: abonoModalPerson.person.name,
        amount: parsedAmount,
        date: abonoForm.date || new Date().toISOString().split('T')[0],
        description: fullDescription,
        receiptNumber: abonoForm.receiptNumber.trim() || null
      };

      await onAddTransaction(newTx);
      setAbonoSuccessMessage(`¡Abono de ${formatCurrency(parsedAmount)} registrado exitosamente en Caja!`);
      setTimeout(() => {
        setAbonoModalPerson(null);
        setAbonoSuccessMessage('');
      }, 1400);
    } catch (err) {
      console.error('Error registering abono:', err);
      alert('Ocurrió un error al registrar el abono.');
    } finally {
      setAbonoSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // RENDER
  // -------------------------------------------------------------
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '25px', width: '100%' }}>
      
      {/* HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ 
            fontSize: '1.8rem', 
            fontWeight: 800, 
            color: 'var(--text-primary)', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px' 
          }}>
            <div style={{ 
              background: 'linear-gradient(135deg, #FF6D00 0%, #e05300 100%)', 
              padding: '10px', 
              borderRadius: '12px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              boxShadow: '0 4px 15px rgba(255, 109, 0, 0.35)'
            }}>
              <Scale size={26} color="#ffffff" />
            </div>
            Ajustes Totales y Cuentas de Personal
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '6px' }}>
            Consolidación financiera multi-obra: presupuestos contratados ($X + $Y) vs desembolsos en Caja ($F) = Saldo ($L)
          </p>
        </div>

        {/* Action button if needed */}
        <div style={{ display: 'flex', gap: '10px' }}>
          {onNavigateToLedger && (
            <button 
              className="btn btn-secondary"
              onClick={onNavigateToLedger}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}
            >
              <Receipt size={16} />
              Ir a Libro de Caja
            </button>
          )}
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="adjustments-kpis-grid">
        
        {/* Card 1: Presupuesto Global Contratado */}
        <div className="glass-panel adjustments-kpi-card">
          <div className="adjustments-kpi-header">
            <span className="adjustments-kpi-label">
              Presupuesto Total Contratado
            </span>
            <div className="adjustments-kpi-icon-box" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
              <Layers size={18} style={{ color: 'var(--primary-cyan)' }} />
            </div>
          </div>
          <div className="adjustments-kpi-val" style={{ color: 'var(--text-primary)' }} title={formatCurrency(globalKPIs.totalPresupuestado)}>
            {formatCurrency(globalKPIs.totalPresupuestado)}
          </div>
          <div className="adjustments-kpi-sub" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>Suma de renglones asignados en todas las obras</span>
          </div>
        </div>

        {/* Card 2: Total Desembolsado / Pagado */}
        <div className="glass-panel adjustments-kpi-card">
          <div className="adjustments-kpi-header">
            <span className="adjustments-kpi-label">
              Total Entregado / Pagado
            </span>
            <div className="adjustments-kpi-icon-box" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
              <ArrowDownLeft size={18} style={{ color: '#34d399' }} />
            </div>
          </div>
          <div className="adjustments-kpi-val" style={{ color: '#34d399' }} title={formatCurrency(globalKPIs.totalPagado)}>
            {formatCurrency(globalKPIs.totalPagado)}
          </div>
          <div className="adjustments-kpi-sub">
            Egresos reales y abonos registrados en Caja
          </div>
        </div>

        {/* Card 3: Saldo Pendiente por Pagar */}
        <div className="glass-panel adjustments-kpi-card" style={{ borderLeft: '4px solid #FF6D00' }}>
          <div className="adjustments-kpi-header">
            <span className="adjustments-kpi-label" style={{ color: '#FF6D00' }}>
              Saldo Pendiente por Pagar
            </span>
            <div className="adjustments-kpi-icon-box" style={{ background: 'rgba(255, 109, 0, 0.15)' }}>
              <AlertTriangle size={18} style={{ color: '#FF6D00' }} />
            </div>
          </div>
          <div className="adjustments-kpi-val" style={{ color: '#FF6D00' }} title={formatCurrency(globalKPIs.totalPendientePorPagar)}>
            {formatCurrency(globalKPIs.totalPendientePorPagar)}
          </div>
          <div className="adjustments-kpi-sub" style={{ color: 'var(--text-secondary)' }}>
            <strong>{globalKPIs.countPending}</strong> contratistas con saldo pendiente
          </div>
        </div>

        {/* Card 4: Saldos a Favor / Anticipos Excedidos */}
        <div className="glass-panel adjustments-kpi-card">
          <div className="adjustments-kpi-header">
            <span className="adjustments-kpi-label">
              Saldos a Favor Constructora
            </span>
            <div className="adjustments-kpi-icon-box" style={{ background: 'rgba(56, 189, 248, 0.1)' }}>
              <ArrowUpRight size={18} style={{ color: '#38bdf8' }} />
            </div>
          </div>
          <div className="adjustments-kpi-val" style={{ color: '#38bdf8' }} title={formatCurrency(globalKPIs.totalSaldoAFavor)}>
            {formatCurrency(globalKPIs.totalSaldoAFavor)}
          </div>
          <div className="adjustments-kpi-sub">
            {globalKPIs.countOverpaid} personas con pagos superiores al presupuesto
          </div>
        </div>

      </div>

      {/* TOOLBAR & FILTERS */}
      <div className="adjustments-toolbar-panel">
        <div className="adjustments-toolbar-top">
          
          {/* Main Search Bar */}
          <div className="adjustments-search-box">
            <div className="adjustments-search-icon">
              <Search size={18} />
            </div>
            <input 
              type="text"
              className="adjustments-search-input"
              placeholder="Buscar personal por nombre, cédula, cargo, obra o concepto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="adjustments-search-actions">
              {searchTerm && (
                <>
                  <span className="adjustments-search-match-badge">
                    {filteredPersonnel.length} {filteredPersonnel.length === 1 ? 'coincidencia' : 'coincidencias'}
                  </span>
                  <button 
                    type="button"
                    className="adjustments-search-clear"
                    onClick={() => setSearchTerm('')}
                    title="Borrar búsqueda"
                  >
                    <X size={14} />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Obra Filter */}
          <div className="adjustments-select-box">
            <div className="adjustments-select-icon">
              <Building size={16} />
            </div>
            <select
              className="adjustments-select"
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
            >
              <option value="all">Todas las Obras ({projects.length})</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <div className="adjustments-select-chevron">
              <ChevronDown size={14} />
            </div>
          </div>

          {/* Sort By */}
          <div className="adjustments-select-box">
            <div className="adjustments-select-icon">
              <ArrowUpDown size={16} />
            </div>
            <select
              className="adjustments-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="pendingDesc">Mayor Saldo Pendiente</option>
              <option value="budgetDesc">Mayor Presupuesto Total</option>
              <option value="paidDesc">Mayor Monto Pagado</option>
              <option value="nameAsc">Nombre (A - Z)</option>
            </select>
            <div className="adjustments-select-chevron">
              <ChevronDown size={14} />
            </div>
          </div>

        </div>

        {/* Status Filter Tabs & Summary Row */}
        <div className="adjustments-filters-row">
          <div className="adjustments-filter-pills">
            <button
              type="button"
              className={`adjustments-pill-btn ${statusFilter === 'all' ? 'active-all' : ''}`}
              onClick={() => setStatusFilter('all')}
            >
              <Layers size={14} />
              <span>Todos</span>
              <span className="adjustments-pill-badge">{consolidatedPersonnel.length}</span>
            </button>
            
            <button
              type="button"
              className={`adjustments-pill-btn ${statusFilter === 'pending' ? 'active-pending' : ''}`}
              onClick={() => setStatusFilter('pending')}
            >
              <AlertTriangle size={14} />
              <span>Con Saldo Pendiente</span>
              <span className="adjustments-pill-badge">{globalKPIs.countPending}</span>
            </button>

            <button
              type="button"
              className={`adjustments-pill-btn ${statusFilter === 'settled' ? 'active-settled' : ''}`}
              onClick={() => setStatusFilter('settled')}
            >
              <CheckCircle2 size={14} />
              <span>Paz y Salvo</span>
              <span className="adjustments-pill-badge">{globalKPIs.countSettled}</span>
            </button>

            <button
              type="button"
              className={`adjustments-pill-btn ${statusFilter === 'overpaid' ? 'active-overpaid' : ''}`}
              onClick={() => setStatusFilter('overpaid')}
            >
              <ArrowUpRight size={14} />
              <span>Saldo a Favor Constructora</span>
              <span className="adjustments-pill-badge">{globalKPIs.countOverpaid}</span>
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div className="adjustments-results-summary">
              Mostrando <strong style={{ color: 'var(--text-primary)' }}>{filteredPersonnel.length}</strong> de {consolidatedPersonnel.length} personas
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                className="adjustments-reset-filters-btn"
                onClick={handleResetFilters}
                title="Restablecer todos los filtros"
              >
                <RotateCcw size={13} />
                Limpiar filtros
              </button>
            )}
          </div>
        </div>
      </div>

      {/* CONSOLIDATED CONTRACTOR CARDS LIST */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {filteredPersonnel.length === 0 ? (
          <div className="glass-panel" style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Scale size={48} style={{ color: 'var(--text-muted)', marginBottom: '15px', opacity: 0.5 }} />
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '6px' }}>No se encontraron registros</h3>
            <p style={{ fontSize: '0.85rem' }}>No hay personal que coincida con los filtros seleccionados.</p>
            {hasActiveFilters && (
              <div style={{ marginTop: '18px' }}>
                <button 
                  type="button"
                  className="btn btn-secondary" 
                  onClick={handleResetFilters}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', padding: '8px 18px', borderRadius: '20px' }}
                >
                  <RotateCcw size={15} />
                  Limpiar búsqueda y filtros
                </button>
              </div>
            )}
          </div>
        ) : (
          filteredPersonnel.map(cp => {
            const isExpanded = expandedPersonId === cp.person.id;
            const currentTab = activeTabByPerson[cp.person.id] || 'budget';

            // Visual Status Badges
            let statusBadge = null;
            if (cp.status === 'pending') {
              statusBadge = (
                <div style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  padding: '6px 12px', 
                  borderRadius: '20px', 
                  background: 'rgba(255, 109, 0, 0.15)', 
                  border: '1px solid rgba(255, 109, 0, 0.4)',
                  color: '#FF6D00',
                  fontWeight: 700,
                  fontSize: '0.85rem'
                }}>
                  <AlertTriangle size={15} />
                  <span>Le debemos: {formatCurrency(cp.balance)}</span>
                </div>
              );
            } else if (cp.status === 'settled') {
              statusBadge = (
                <div style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  padding: '6px 12px', 
                  borderRadius: '20px', 
                  background: 'rgba(16, 185, 129, 0.15)', 
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  color: '#34d399',
                  fontWeight: 700,
                  fontSize: '0.85rem'
                }}>
                  <CheckCircle2 size={15} />
                  <span>Paz y Salvo (Al día)</span>
                </div>
              );
            } else {
              statusBadge = (
                <div style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  padding: '6px 12px', 
                  borderRadius: '20px', 
                  background: 'rgba(56, 189, 248, 0.15)', 
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  color: '#38bdf8',
                  fontWeight: 700,
                  fontSize: '0.85rem'
                }}>
                  <ArrowUpRight size={15} />
                  <span>Saldo a favor constructora: {formatCurrency(Math.abs(cp.balance))}</span>
                </div>
              );
            }

            return (
              <div 
                key={cp.person.id} 
                className="glass-panel" 
                style={{ 
                  borderRadius: '16px', 
                  border: isExpanded ? '1px solid var(--primary-cyan)' : '1px solid var(--border-glass)',
                  transition: 'all 0.25s ease',
                  overflow: 'hidden'
                }}
              >
                {/* Main Card Header */}
                <div style={{ padding: '22px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px' }}>
                    
                    {/* Person Avatar & Basic Info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flex: '1 1 300px' }}>
                      <div style={{ 
                        width: '52px', 
                        height: '52px', 
                        borderRadius: '14px', 
                        background: 'linear-gradient(135deg, rgba(255, 109, 0, 0.2) 0%, rgba(255, 255, 255, 0.05) 100%)',
                        border: '1px solid rgba(255, 109, 0, 0.3)',
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        fontSize: '1.2rem',
                        fontWeight: 800,
                        color: 'var(--primary-cyan)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                      }}>
                        {cp.person.name.substring(0, 2).toUpperCase()}
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                          <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {cp.person.name}
                          </h3>
                          {statusBadge}
                        </div>

                        <div style={{ display: 'flex', gap: '14px', marginTop: '5px', fontSize: '0.82rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                          <span><strong>C.C:</strong> {cp.person.documentId || 'Sin documento'}</span>
                          {cp.person.jobTitle && <span>• <strong>Cargo:</strong> {cp.person.jobTitle}</span>}
                          {cp.person.phone1 && <span>• <strong>Tel:</strong> {cp.person.phone1}</span>}
                        </div>

                        {/* Participating Projects Chips */}
                        <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                          {cp.participatingProjects.length > 0 ? (
                            cp.participatingProjects.map(p => (
                              <span 
                                key={p.id} 
                                style={{ 
                                  fontSize: '0.72rem', 
                                  padding: '2px 8px', 
                                  borderRadius: '6px', 
                                  background: 'rgba(255, 255, 255, 0.05)', 
                                  color: 'var(--text-secondary)',
                                  border: '1px solid rgba(255, 255, 255, 0.08)',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <HardHat size={11} style={{ color: 'var(--primary-cyan)' }} />
                                {p.name}
                              </span>
                            ))
                          ) : (
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                              Sin obras asignadas activas
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Financial Summary Columns */}
                    <div className="adjustments-financial-summary">
                      
                      {/* Presupuesto Total ($X + $Y) */}
                      <div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
                          Presupuesto Total (X+Y)
                        </div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                          {formatCurrency(cp.totalPresupuestado)}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {cp.assignedBudgetItems.length} {cp.assignedBudgetItems.length === 1 ? 'renglón' : 'renglones'}
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="adjustments-financial-divider" />

                      {/* Pagado Total ($F) */}
                      <div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
                          Total Entregado (F)
                        </div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#34d399', marginTop: '2px' }}>
                          {formatCurrency(cp.totalPagado)}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {cp.matchingExpenses.length} {cp.matchingExpenses.length === 1 ? 'abono' : 'abonos en caja'}
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="adjustments-financial-divider" />

                      {/* Saldo Neto ($L) */}
                      <div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
                          Saldo de Ajuste (L)
                        </div>
                        <div style={{ 
                          fontSize: '1.2rem', 
                          fontWeight: 800, 
                          color: cp.status === 'pending' ? '#FF6D00' : cp.status === 'settled' ? '#34d399' : '#38bdf8', 
                          marginTop: '2px' 
                        }}>
                          {formatCurrency(cp.balance)}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {cp.status === 'pending' ? 'Por pagar' : cp.status === 'settled' ? 'Completado' : 'A favor'}
                        </div>
                      </div>

                    </div>

                  </div>

                  {/* Payment Progress Bar */}
                  <div style={{ marginTop: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '5px' }}>
                      <span>Porcentaje de liquidación: <strong>{cp.percentPaid.toFixed(1)}%</strong></span>
                      <span>
                        {cp.totalPresupuestado > 0 
                          ? `${formatCurrency(cp.totalPagado)} de ${formatCurrency(cp.totalPresupuestado)}`
                          : (cp.totalPagado > 0 ? `Pagado sin presupuesto asignado: ${formatCurrency(cp.totalPagado)}` : 'Sin asignación')}
                      </span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ 
                        width: `${Math.min(100, cp.percentPaid)}%`, 
                        height: '100%', 
                        background: cp.status === 'pending' 
                          ? 'linear-gradient(90deg, #FF6D00, #ff9e40)' 
                          : cp.status === 'settled' 
                            ? 'linear-gradient(90deg, #10b981, #34d399)' 
                            : 'linear-gradient(90deg, #0284c7, #38bdf8)',
                        borderRadius: '3px',
                        transition: 'width 0.4s ease'
                      }} />
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    marginTop: '18px', 
                    paddingTop: '15px', 
                    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                    flexWrap: 'wrap',
                    gap: '10px'
                  }}>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      {/* Abono Directo en Caja */}
                      {userRole !== 'viewer' && onAddTransaction && (
                        <button 
                          className="btn btn-primary"
                          onClick={() => handleOpenAbonoModal(cp)}
                          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', padding: '7px 14px' }}
                        >
                          <PlusCircle size={15} />
                          Registrar Abono en Caja
                        </button>
                      )}

                      {/* Generar Paz y Salvo / Estado de Cuenta */}
                      <button 
                        className="btn btn-secondary"
                        onClick={() => setPazYSalvoPerson(cp)}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', padding: '7px 14px' }}
                      >
                        <FileText size={15} />
                        Paz y Salvo / Estado de Cuenta
                      </button>
                    </div>

                    {/* Toggle Details Chevron */}
                    <button 
                      className="btn btn-secondary"
                      onClick={() => setExpandedPersonId(isExpanded ? null : cp.person.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', padding: '7px 14px' }}
                    >
                      <span>{isExpanded ? 'Ocultar Desglose' : 'Ver Desglose y Movimientos'}</span>
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>

                </div>

                {/* EXPANDED DETAILS ACCORDION */}
                {isExpanded && (
                  <div className="adjustments-expanded-content">
                    
                    {/* Tabs switcher */}
                    <div className="adjustments-tabs-container">
                      <button 
                        className={`btn adjustments-tab-btn ${currentTab === 'budget' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setActiveTabByPerson(prev => ({ ...prev, [cp.person.id]: 'budget' }))}
                      >
                        <Layers size={14} />
                        Obras y Renglones Asignados ({cp.assignedBudgetItems.length})
                      </button>

                      <button 
                        className={`btn adjustments-tab-btn ${currentTab === 'payments' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setActiveTabByPerson(prev => ({ ...prev, [cp.person.id]: 'payments' }))}
                      >
                        <Receipt size={14} />
                        Historial de Pagos de Caja ({cp.matchingExpenses.length})
                      </button>
                    </div>

                    {/* TAB 1: Obras y Renglones Asignados */}
                    {currentTab === 'budget' && (
                      <div>
                        {cp.assignedBudgetItems.length === 0 ? (
                          <div style={{ padding: '25px', textAlign: 'center', color: 'var(--text-muted)' }}>
                            <Info size={22} style={{ marginBottom: '8px', opacity: 0.7 }} />
                            <p style={{ margin: 0, fontSize: '0.85rem' }}>
                              Este trabajador no tiene renglones presupuestarios asignados directamente en las obras.
                            </p>
                            <p style={{ fontSize: '0.78rem', marginTop: '4px' }}>
                              Puedes asignarle renglones entrando a la pestaña de Presupuesto de cualquier Obra.
                            </p>
                          </div>
                        ) : (
                          <>
                            {/* 1. DESKTOP VIEW: Clean Modern Glass Table */}
                            <div className="table-desktop-view">
                              <table className="modern-glass-table">
                                <thead>
                                  <tr>
                                    <th>Obra / Proyecto</th>
                                    <th>Renglón Presupuestario</th>
                                    <th>Categoría</th>
                                    <th style={{ textAlign: 'right' }}>Presupuesto Contratado</th>
                                    <th style={{ textAlign: 'right' }}>Pagado en Renglón</th>
                                    <th style={{ textAlign: 'right' }}>Saldo Renglón</th>
                                    <th style={{ textAlign: 'center' }}>Acción</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {cp.assignedBudgetItems.map((item, idx) => {
                                    const itemRemaining = item.estimated - item.actual;
                                    return (
                                      <tr key={`${item.projectId}_${item.budgetItemId}_${idx}`}>
                                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <HardHat size={14} style={{ color: 'var(--primary-cyan)' }} />
                                            {item.projectName}
                                          </div>
                                        </td>
                                        <td>
                                          <span style={{ fontWeight: 600, color: '#f3f4f6' }}>{item.name}</span>
                                        </td>
                                        <td>
                                          <span style={{ 
                                            fontSize: '0.72rem', 
                                            padding: '2px 8px', 
                                            borderRadius: '4px', 
                                            background: item.category === 'labor' ? 'rgba(255, 109, 0, 0.15)' : 'rgba(56, 189, 248, 0.15)', 
                                            color: item.category === 'labor' ? '#FF6D00' : '#38bdf8', 
                                            textTransform: 'uppercase', 
                                            fontWeight: 600 
                                          }}>
                                            {item.category === 'labor' ? 'Mano de Obra' : item.category === 'materials' ? 'Materiales' : 'Licencias'}
                                          </span>
                                        </td>
                                        <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)' }}>
                                          {formatCurrency(item.estimated)}
                                        </td>
                                        <td style={{ textAlign: 'right', fontWeight: 600, color: '#34d399' }}>
                                          {formatCurrency(item.actual)}
                                        </td>
                                        <td style={{ textAlign: 'right', fontWeight: 700, color: itemRemaining > 0 ? '#FF6D00' : '#34d399' }}>
                                          {formatCurrency(itemRemaining)}
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                          {onNavigateToProject && (
                                            <button 
                                              className="btn-icon" 
                                              title="Ver Obra"
                                              onClick={() => onNavigateToProject(item.projectId)}
                                              style={{ color: 'var(--primary-cyan)' }}
                                            >
                                              <ExternalLink size={15} />
                                            </button>
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>

                            {/* 2. MOBILE VIEW: Responsive Cards */}
                            <div className="table-mobile-cards">
                              {cp.assignedBudgetItems.map((item, idx) => {
                                const itemRemaining = item.estimated - item.actual;
                                const itemPercent = item.estimated > 0 ? Math.min(100, Math.round((item.actual / item.estimated) * 100)) : 0;
                                return (
                                  <div key={`m_item_${item.projectId}_${item.budgetItemId}_${idx}`} className="adjustments-budget-card">
                                    <div className="adjustments-budget-card-header">
                                      <div className="adjustments-project-badge">
                                        <HardHat size={15} style={{ color: 'var(--primary-cyan)', flexShrink: 0 }} />
                                        <span>{item.projectName}</span>
                                      </div>
                                      <span style={{ 
                                        fontSize: '0.7rem', 
                                        padding: '3px 8px', 
                                        borderRadius: '6px', 
                                        background: item.category === 'labor' ? 'rgba(255, 109, 0, 0.15)' : 'rgba(56, 189, 248, 0.15)', 
                                        color: item.category === 'labor' ? '#FF6D00' : '#38bdf8', 
                                        textTransform: 'uppercase', 
                                        fontWeight: 700 
                                      }}>
                                        {item.category === 'labor' ? 'Mano de Obra' : item.category === 'materials' ? 'Materiales' : 'Licencias'}
                                      </span>
                                    </div>

                                    <div>
                                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '2px' }}>
                                        Renglón Presupuestario
                                      </div>
                                      <div className="adjustments-budget-card-title">
                                        {item.name}
                                      </div>
                                    </div>

                                    {/* Metrics Grid */}
                                    <div className="adjustments-budget-card-metrics">
                                      <div className="adjustments-metric-item">
                                        <span className="adjustments-metric-label">Contratado</span>
                                        <span className="adjustments-metric-value" style={{ color: 'var(--text-primary)' }}>
                                          {formatCurrency(item.estimated)}
                                        </span>
                                      </div>
                                      <div className="adjustments-metric-item">
                                        <span className="adjustments-metric-label">Pagado</span>
                                        <span className="adjustments-metric-value" style={{ color: '#34d399' }}>
                                          {formatCurrency(item.actual)}
                                        </span>
                                      </div>
                                      <div className="adjustments-metric-item">
                                        <span className="adjustments-metric-label">Saldo</span>
                                        <span className="adjustments-metric-value" style={{ color: itemRemaining > 0 ? '#FF6D00' : '#34d399' }}>
                                          {formatCurrency(itemRemaining)}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Progress */}
                                    <div>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                                        <span>Avance de Pago</span>
                                        <span style={{ fontWeight: 600, color: itemPercent >= 100 ? '#34d399' : '#FF6D00' }}>
                                          {itemPercent}%
                                        </span>
                                      </div>
                                      <div className="adjustments-progress-track">
                                        <div style={{ 
                                          width: `${itemPercent}%`, 
                                          height: '100%', 
                                          background: itemPercent >= 100 ? '#34d399' : 'linear-gradient(90deg, #FF6D00, #ff9e40)', 
                                          borderRadius: '3px',
                                          transition: 'width 0.4s ease'
                                        }} />
                                      </div>
                                    </div>

                                    {onNavigateToProject && (
                                      <div className="adjustments-budget-card-footer">
                                        <button 
                                          className="btn btn-secondary"
                                          onClick={() => onNavigateToProject(item.projectId)}
                                          style={{ fontSize: '0.78rem', padding: '5px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                                        >
                                          <ExternalLink size={13} />
                                          <span>Ver Obra</span>
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {/* TAB 2: Historial de Desembolsos de Caja */}
                    {currentTab === 'payments' && (
                      <div>
                        {cp.matchingExpenses.length === 0 ? (
                          <div style={{ padding: '25px', textAlign: 'center', color: 'var(--text-muted)' }}>
                            <Info size={22} style={{ marginBottom: '8px', opacity: 0.7 }} />
                            <p style={{ margin: 0, fontSize: '0.85rem' }}>
                              Aún no se han registrado pagos o desembolsos en Caja para esta persona.
                            </p>
                          </div>
                        ) : (
                          <>
                            {/* 1. DESKTOP VIEW: Clean Modern Glass Table */}
                            <div className="table-desktop-view">
                              <table className="modern-glass-table">
                                <thead>
                                  <tr>
                                    <th>Fecha</th>
                                    <th>Obra Destino</th>
                                    <th>Renglón Asignado</th>
                                    <th>Concepto / Detalle</th>
                                    <th style={{ textAlign: 'right' }}>Monto Pagado</th>
                                    <th style={{ textAlign: 'center' }}>Soporte</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {cp.matchingExpenses.map(t => (
                                    <tr key={t.id}>
                                      <td style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                                        {formatDate(t.date)}
                                      </td>
                                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                        {t.projectName || (t.projectId === 'general' ? 'Caja General' : t.projectId)}
                                      </td>
                                      <td>
                                        {t.budgetItemName ? (
                                          <span style={{ 
                                            fontSize: '0.75rem', 
                                            padding: '2px 8px', 
                                            borderRadius: '4px', 
                                            background: 'rgba(255, 109, 0, 0.12)', 
                                            color: '#FF6D00',
                                            fontWeight: 600 
                                          }}>
                                            {t.budgetItemName}
                                          </span>
                                        ) : (
                                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Egreso Directo</span>
                                        )}
                                      </td>
                                      <td style={{ maxWidth: '320px', wordBreak: 'break-word' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>
                                          {t.description || 'Sin detalle'}
                                        </span>
                                      </td>
                                      <td style={{ textAlign: 'right', fontWeight: 700, color: '#34d399', whiteSpace: 'nowrap' }}>
                                        {formatCurrency(t.amount)}
                                      </td>
                                      <td style={{ textAlign: 'center' }}>
                                        {t.receiptBase64 ? (
                                          <button 
                                            className="btn-icon" 
                                            title="Ver Comprobante Adjunto"
                                            onClick={() => setPreviewReceipt({ title: `Comprobante ${formatDate(t.date)} - ${formatCurrency(t.amount)}`, base64: t.receiptBase64 })}
                                            style={{ color: 'var(--primary-teal)' }}
                                          >
                                            <Eye size={15} />
                                          </button>
                                        ) : (
                                          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>---</span>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                            {/* 2. MOBILE VIEW: Touch-Friendly Responsive Payment Cards */}
                            <div className="table-mobile-cards">
                              {cp.matchingExpenses.map(t => {
                                const projectName = t.projectName || (t.projectId === 'general' ? 'Caja General' : t.projectId);
                                return (
                                  <div key={`m_pay_${t.id}`} className="adjustments-payment-card">
                                    {/* Header: Obra Destino and Date */}
                                    <div className="adjustments-payment-card-header">
                                      <div className="adjustments-project-badge">
                                        <Building size={14} style={{ color: 'var(--primary-cyan)', flexShrink: 0 }} />
                                        <span>{projectName}</span>
                                      </div>
                                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                                        <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
                                        <span>{formatDate(t.date)}</span>
                                      </div>
                                    </div>

                                    {/* Concepto / Motivo de Pago */}
                                    <div className="adjustments-payment-concept-box">
                                      <span className="adjustments-concept-label">
                                        Concepto / Detalle del Desembolso
                                      </span>
                                      <span className="adjustments-concept-text">
                                        {t.description || 'Sin detalle especificado'}
                                      </span>
                                    </div>

                                    {/* Renglón Presupuestario Tag */}
                                    <div>
                                      {t.budgetItemName ? (
                                        <span style={{ 
                                          fontSize: '0.75rem', 
                                          padding: '3px 8px', 
                                          borderRadius: '6px', 
                                          background: 'rgba(255, 109, 0, 0.12)', 
                                          color: '#FF6D00',
                                          fontWeight: 600,
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '5px'
                                        }}>
                                          <Layers size={12} />
                                          <span>Renglón: {t.budgetItemName}</span>
                                        </span>
                                      ) : (
                                        <span style={{ 
                                          fontSize: '0.75rem', 
                                          padding: '3px 8px', 
                                          borderRadius: '6px', 
                                          background: 'rgba(255, 255, 255, 0.05)', 
                                          color: 'var(--text-muted)',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '5px'
                                        }}>
                                          Egreso Directo de Caja
                                        </span>
                                      )}
                                    </div>

                                    {/* Footer: Monto Pagado & Soporte Button */}
                                    <div className="adjustments-payment-card-footer">
                                      <div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
                                          Monto Pagado
                                        </div>
                                        <div className="adjustments-payment-amount">
                                          {formatCurrency(t.amount)}
                                        </div>
                                      </div>

                                      <div>
                                        {t.receiptBase64 ? (
                                          <button 
                                            className="btn btn-secondary"
                                            onClick={() => setPreviewReceipt({ title: `Comprobante ${formatDate(t.date)} - ${formatCurrency(t.amount)}`, base64: t.receiptBase64 })}
                                            style={{ fontSize: '0.78rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary-teal)' }}
                                          >
                                            <Eye size={14} />
                                            <span>Ver Soporte</span>
                                          </button>
                                        ) : (
                                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                            Sin soporte adjunto
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </>
                        )}
                      </div>
                    )}

                  </div>
                )}

              </div>
            );
          })
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MODAL 1: REGISTRAR ABONO RÁPIDO EN CAJA                        */}
      {/* ------------------------------------------------------------- */}
      {abonoModalPerson && (
        <div className="modal-overlay" style={{ zIndex: 100000 }}>
          <div className="modal-content glass-panel" style={{ maxWidth: '520px', width: '100%', background: 'var(--bg-secondary)', border: '1px solid rgba(255, 109, 0, 0.3)' }}>
            
            <div className="modal-header" style={{ padding: '18px 22px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                <PlusCircle size={20} style={{ color: 'var(--primary-cyan)' }} />
                Registrar Abono en Caja
              </h3>
              <button className="btn-icon" onClick={() => setAbonoModalPerson(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitAbono} style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Target Person Info */}
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px 16px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Beneficiario / Contratista
                </div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {abonoModalPerson.person.name}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  C.C: {abonoModalPerson.person.documentId} | Saldo Pendiente: <strong style={{ color: '#FF6D00' }}>{formatCurrency(abonoModalPerson.balance)}</strong>
                </div>
              </div>

              {/* Obra selector */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Obra a la que se carga el gasto:
                </label>
                <select
                  className="input-field"
                  value={abonoForm.projectId}
                  onChange={handleAbonoProjectChange}
                  style={{ width: '100%' }}
                  required
                >
                  <option value="general">Caja General (Sin Obra)</option>
                  {projects.map(p => {
                    const hasRenglon = abonoModalPerson.assignedBudgetItems.some(b => b.projectId === p.id);
                    return (
                      <option key={p.id} value={p.id}>
                        {p.name} {hasRenglon ? '⭐ (Tiene renglón presupuestado)' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* BudgetItem selector (if project selected) */}
              {abonoForm.projectId !== 'general' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Renglón Presupuestario de la Obra:
                  </label>
                  <select
                    className="input-field"
                    value={abonoForm.budgetItemId}
                    onChange={(e) => setAbonoForm(prev => ({ ...prev, budgetItemId: e.target.value }))}
                    style={{ width: '100%' }}
                  >
                    <option value="">-- Sin Renglón Específico (Gasto General de Obra) --</option>
                    {(() => {
                      const selProj = projects.find(p => p.id === abonoForm.projectId);
                      if (!selProj || !selProj.budgetItems) return null;
                      return selProj.budgetItems.map(b => {
                        const isAssigned = b.personnelId && String(b.personnelId) === String(abonoModalPerson.person.id);
                        return (
                          <option key={b.id || b.name} value={b.id || b.name}>
                            {b.name} {isAssigned ? '👤 (Asignado a este contratista)' : ''} — Presupuesto: {formatCurrency(b.estimated)}
                          </option>
                        );
                      });
                    })()}
                  </select>
                </div>
              )}

              {/* Monto & Fecha */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Monto a Abonar ($):
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    className="input-field"
                    placeholder="Ej. 1500000"
                    value={abonoForm.amount}
                    onChange={(e) => setAbonoForm(prev => ({ ...prev, amount: e.target.value }))}
                    style={{ width: '100%', fontWeight: 700 }}
                    required
                  />
                  {abonoForm.amount && Number(abonoForm.amount) > 0 && (
                    <div style={{ fontSize: '0.75rem', color: '#34d399', marginTop: '4px', fontWeight: 600 }}>
                      {formatCurrency(Number(abonoForm.amount))}
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Fecha del Egreso:
                  </label>
                  <input
                    type="date"
                    className="input-field"
                    value={abonoForm.date}
                    onChange={(e) => setAbonoForm(prev => ({ ...prev, date: e.target.value }))}
                    style={{ width: '100%' }}
                    required
                  />
                </div>
              </div>

              {/* Recibo / Factura / Soporte N° */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  N° de Recibo o Factura (Opcional):
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Ej. REC-0042 o Transf. Bancaria"
                  value={abonoForm.receiptNumber}
                  onChange={(e) => setAbonoForm(prev => ({ ...prev, receiptNumber: e.target.value }))}
                  style={{ width: '100%' }}
                />
              </div>

              {/* Descripción / Nota */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Nota o Descripción:
                </label>
                <textarea
                  className="input-field"
                  rows="2"
                  value={abonoForm.description}
                  onChange={(e) => setAbonoForm(prev => ({ ...prev, description: e.target.value }))}
                  style={{ width: '100%', resize: 'none' }}
                  required
                />
              </div>

              {/* Success Banner */}
              {abonoSuccessMessage && (
                <div style={{ 
                  background: 'rgba(16, 185, 129, 0.15)', 
                  border: '1px solid rgba(16, 185, 129, 0.3)', 
                  color: '#34d399', 
                  padding: '10px 14px', 
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  textAlign: 'center',
                  fontWeight: 600
                }}>
                  {abonoSuccessMessage}
                </div>
              )}

              {/* Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setAbonoModalPerson(null)}
                  disabled={abonoSubmitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={abonoSubmitting}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {abonoSubmitting ? (
                    <span>Registrando...</span>
                  ) : (
                    <>
                      <Check size={16} />
                      <span>Confirmar Abono en Caja</span>
                    </>
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 2: PAZ Y SALVO / ESTADO DE CUENTA IMPRIMIBLE             */}
      {/* ------------------------------------------------------------- */}
      {pazYSalvoPerson && (
        <div className="modal-overlay" style={{ zIndex: 100000 }}>
          <div className="modal-content" style={{ maxWidth: '800px', width: '100%', background: '#ffffff', color: '#1f2937', borderRadius: '12px' }}>
            
            {/* Modal Header (Hidden on Print) */}
            <div className="no-print" style={{ 
              padding: '16px 22px', 
              background: 'var(--bg-secondary)', 
              color: 'var(--text-primary)', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              borderTopLeftRadius: '12px',
              borderTopRightRadius: '12px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} style={{ color: 'var(--primary-cyan)' }} />
                Certificado de Paz y Salvo / Estado de Cuenta
              </h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  className="btn btn-primary"
                  onClick={() => printElement(document.getElementById('paz-y-salvo-print-area'), { title: `Paz_y_Salvo_${(pazYSalvoPerson?.name || 'Personal').replace(/\s+/g, '_')}` })}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', padding: '6px 14px' }}
                >
                  <Printer size={15} />
                  Imprimir Certificado
                </button>
                <button className="btn-icon" onClick={() => setPazYSalvoPerson(null)}>
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* PRINTABLE BODY */}
            <div id="paz-y-salvo-print-area" className="printable-area receipt-container" style={{ padding: '35px 40px', background: '#ffffff', color: '#111827', fontFamily: 'Arial, sans-serif' }}>
              
              {/* Official Habitech Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #FF6D00', paddingBottom: '16px', marginBottom: '20px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '6px' }}>
                    <img src="/logo.png" alt="Logo HABITECH SAS" style={{ height: '70px', objectFit: 'contain' }} />
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#4b5563', lineHeight: '1.3' }}>
                    <strong>GRUPO EMPRESARIAL HABITECH SAS</strong><br />
                    NIT: 902067080-1<br />
                    Km 4 Vía Villavicencio - Acacías, Lote 1 Barrio La Nohora<br />
                    Celular: 3124147911 • Villavicencio, Meta
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ 
                    display: 'inline-block', 
                    padding: '4px 10px', 
                    background: pazYSalvoPerson.balance <= 0 ? '#ecfdf5' : '#fffbeb', 
                    color: pazYSalvoPerson.balance <= 0 ? '#059669' : '#d97706',
                    border: `1px solid ${pazYSalvoPerson.balance <= 0 ? '#10b981' : '#f59e0b'}`,
                    borderRadius: '6px',
                    fontWeight: 800,
                    fontSize: '0.85rem',
                    textTransform: 'uppercase'
                  }}>
                    {pazYSalvoPerson.balance <= 0 ? 'CERTIFICADO DE PAZ Y SALVO' : 'ESTADO DE CUENTA Y LIQUIDACIÓN'}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: '8px' }}>
                    <strong>Consecutivo:</strong> PYS-{pazYSalvoPerson.person.documentId || '00'}-{new Date().getFullYear()}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: '2px' }}>
                    <strong>Fecha de Emisión:</strong> {new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                </div>
              </div>

              {/* Contractor Information Box */}
              <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '14px 18px', marginBottom: '22px' }}>
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#6b7280', fontWeight: 700, marginBottom: '6px' }}>
                  Información del Contratista / Personal
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', fontSize: '0.85rem' }}>
                  <div><strong>Nombre Completo:</strong> {pazYSalvoPerson.person.name}</div>
                  <div><strong>Cédula de Ciudadanía:</strong> {pazYSalvoPerson.person.documentId || 'N/A'}</div>
                  <div><strong>Cargo / Oficio:</strong> {pazYSalvoPerson.person.jobTitle || 'Contratista'}</div>
                  <div><strong>Teléfono:</strong> {pazYSalvoPerson.person.phone1 || 'N/A'}</div>
                </div>
              </div>

              {/* Section 1: Summary of Budgeted Items / Contracts */}
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '0.9rem', color: '#111827', margin: '0 0 8px 0', borderBottom: '1px solid #e5e7eb', paddingBottom: '4px' }}>
                  1. Obras y Contratos Presupuestados
                </h4>
                {pazYSalvoPerson.assignedBudgetItems.length === 0 ? (
                  <p style={{ fontSize: '0.8rem', color: '#6b7280', fontStyle: 'italic' }}>
                    No registra renglones presupuestarios asignados. Los pagos corresponden a egresos de caja directa.
                  </p>
                ) : (
                  <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse', border: '1px solid #e5e7eb' }}>
                    <thead>
                      <tr style={{ background: '#f3f4f6', textAlign: 'left', borderBottom: '1px solid #d1d5db' }}>
                        <th style={{ padding: '6px 10px' }}>Obra / Proyecto</th>
                        <th style={{ padding: '6px 10px' }}>Renglón Presupuestario</th>
                        <th style={{ padding: '6px 10px', textAlign: 'right' }}>Presupuestado</th>
                        <th style={{ padding: '6px 10px', textAlign: 'right' }}>Pagado en Renglón</th>
                        <th style={{ padding: '6px 10px', textAlign: 'right' }}>Saldo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pazYSalvoPerson.assignedBudgetItems.map((item, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={{ padding: '6px 10px' }}>{item.projectName}</td>
                          <td style={{ padding: '6px 10px' }}>{item.name}</td>
                          <td style={{ padding: '6px 10px', textAlign: 'right' }}>{formatCurrency(item.estimated)}</td>
                          <td style={{ padding: '6px 10px', textAlign: 'right' }}>{formatCurrency(item.actual)}</td>
                          <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(item.estimated - item.actual)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Section 2: Summary of Payments Delivered */}
              <div style={{ marginBottom: '22px' }}>
                <h4 style={{ fontSize: '0.9rem', color: '#111827', margin: '0 0 8px 0', borderBottom: '1px solid #e5e7eb', paddingBottom: '4px' }}>
                  2. Desembolsos y Pagos Realizados desde Caja
                </h4>
                {pazYSalvoPerson.matchingExpenses.length === 0 ? (
                  <p style={{ fontSize: '0.8rem', color: '#6b7280', fontStyle: 'italic' }}>
                    No registra pagos asentados en el libro de caja.
                  </p>
                ) : (
                  <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse', border: '1px solid #e5e7eb' }}>
                    <thead>
                      <tr style={{ background: '#f3f4f6', textAlign: 'left', borderBottom: '1px solid #d1d5db' }}>
                        <th style={{ padding: '6px 10px' }}>Fecha</th>
                        <th style={{ padding: '6px 10px' }}>Obra</th>
                        <th style={{ padding: '6px 10px' }}>Concepto</th>
                        <th style={{ padding: '6px 10px', textAlign: 'right' }}>Monto Desembolsado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pazYSalvoPerson.matchingExpenses.map((t, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={{ padding: '6px 10px' }}>{formatDate(t.date)}</td>
                          <td style={{ padding: '6px 10px' }}>{t.projectName}</td>
                          <td style={{ padding: '6px 10px' }}>{t.budgetItemName || t.description || 'Abono'}</td>
                          <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(t.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Financial Consolidation Box */}
              <div style={{ 
                background: '#f8fafc', 
                border: '2px solid #e2e8f0', 
                borderRadius: '8px', 
                padding: '16px 20px', 
                display: 'flex', 
                justifyContent: 'space-around', 
                textAlign: 'center',
                marginBottom: '25px' 
              }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Total Presupuesto</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#1e293b' }}>{formatCurrency(pazYSalvoPerson.totalPresupuestado)}</div>
                </div>
                <div style={{ borderLeft: '1px solid #cbd5e1' }} />
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Total Entregado / Pagado</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#059669' }}>{formatCurrency(pazYSalvoPerson.totalPagado)}</div>
                </div>
                <div style={{ borderLeft: '1px solid #cbd5e1' }} />
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Saldo Final de Ajuste</div>
                  <div style={{ 
                    fontSize: '1.3rem', 
                    fontWeight: 800, 
                    color: pazYSalvoPerson.balance > 0 ? '#d97706' : pazYSalvoPerson.balance === 0 ? '#059669' : '#0284c7' 
                  }}>
                    {formatCurrency(pazYSalvoPerson.balance)}
                  </div>
                </div>
              </div>

              {/* Legal Declaration Text */}
              <div style={{ fontSize: '0.82rem', color: '#374151', lineHeight: '1.5', textAlign: 'justify', marginBottom: '45px' }}>
                {pazYSalvoPerson.balance <= 0 ? (
                  <p>
                    Por medio de la presente, <strong>GRUPO EMPRESARIAL HABITECH SAS</strong> certifica que el contratista / trabajador <strong>{pazYSalvoPerson.person.name}</strong>, identificado con cédula de ciudadanía número <strong>{pazYSalvoPerson.person.documentId}</strong>, se encuentra a la fecha <strong>A PAZ Y SALVO EN SU TOTALIDAD</strong> por concepto de la ejecución y cumplimiento de los contratos y renglones presupuestarios anteriormente relacionados, no adeudándose suma alguna a la fecha de expedición de este certificado.
                  </p>
                ) : (
                  <p>
                    Por medio de la presente se deja constancia del <strong>ESTADO DE CUENTA CONSOLIDADO</strong> del contratista / trabajador <strong>{pazYSalvoPerson.person.name}</strong>, identificado con cédula de ciudadanía número <strong>{pazYSalvoPerson.person.documentId}</strong>, registrando a la fecha un saldo pendiente por desembolsar a su favor de <strong>{formatCurrency(pazYSalvoPerson.balance)}</strong>, el cual será cancelado conforme al avance y entrega de las obras contratadas.
                  </p>
                )}
              </div>

              {/* Signatures Area */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '50px', paddingTop: '20px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ borderTop: '1px solid #000000', width: '80%', margin: '0 auto 8px auto' }} />
                  <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{pazYSalvoPerson.person.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#4b5563' }}>C.C. {pazYSalvoPerson.person.documentId}</div>
                  <div style={{ fontSize: '0.72rem', color: '#6b7280' }}>Contratista / Beneficiario</div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ borderTop: '1px solid #000000', width: '80%', margin: '0 auto 8px auto' }} />
                  <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>GRUPO EMPRESARIAL HABITECH SAS</div>
                  <div style={{ fontSize: '0.75rem', color: '#4b5563' }}>NIT: 902067080-1</div>
                  <div style={{ fontSize: '0.72rem', color: '#6b7280' }}>Representante Legal / Director de Obra</div>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 3: PREVIEW DE RECIBO / SOPORTE                          */}
      {/* ------------------------------------------------------------- */}
      {previewReceipt && (
        <div className="modal-overlay" style={{ zIndex: 110000 }}>
          <div className="modal-content glass-panel" style={{ maxWidth: '600px', width: '100%', background: 'var(--bg-secondary)' }}>
            <div className="modal-header" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-primary)' }}>{previewReceipt.title}</h3>
              <button className="btn-icon" onClick={() => setPreviewReceipt(null)}>
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <img 
                src={previewReceipt.base64} 
                alt="Soporte de Pago" 
                style={{ maxWidth: '100%', maxHeight: '550px', objectFit: 'contain', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.1)' }} 
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
