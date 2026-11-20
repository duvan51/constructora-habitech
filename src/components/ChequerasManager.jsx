import React, { useState, useMemo } from 'react';
import { 
  Landmark, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ArrowRightLeft, 
  Plus, 
  Filter, 
  Calendar, 
  Search, 
  Download, 
  Eye, 
  Printer, 
  Paperclip, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Building2, 
  Users, 
  ChevronRight, 
  DollarSign, 
  X, 
  Layers,
  Edit3,
  HelpCircle
} from 'lucide-react';
import { 
  getChequerasList, 
  saveNewChequera, 
  removeChequera, 
  extractChequera, 
  cleanPurchaseDescription, 
  getChequeraTheme, 
  DEFAULT_CHEQUERAS 
} from '../utils/chequeras';
import ReceiptModal from './ReceiptModal';
import ExpenseReceiptModal from './ExpenseReceiptModal';

export default function ChequerasManager({
  transactions = [],
  projects = [],
  personnel = [],
  currentUser,
  onAddTransaction,
  onUpdateTransaction,
  onNavigateToProject
}) {
  // Check super admin permission
  const isAdmin = currentUser?.role === 'admin';

  // State for chequeras list (starts with Bancolombia Empresas, Caja Dumar, Caja Duvan)
  const [chequeras, setChequeras] = useState(() => getChequerasList());

  // Filter States
  const [selectedChequeraFilter, setSelectedChequeraFilter] = useState('all'); // 'all', 'unassigned', or chequera name
  const [filterFlow, setFilterFlow] = useState('all'); // 'all', 'income', 'expense', 'transfer'
  const [filterMonth, setFilterMonth] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterProject, setFilterProject] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferData, setTransferData] = useState({
    from: 'Bancolombia Empresas',
    to: 'Caja Duvan',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    concept: 'Traslado de fondos para gastos de obra'
  });

  const [showDirectTxModal, setShowDirectTxModal] = useState(false);
  const [directTxData, setDirectTxData] = useState({
    chequera: 'Bancolombia Empresas',
    type: 'income',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    projectId: 'general',
    description: '',
    method: 'Transferencia',
    personnelId: ''
  });

  const [showNewAccountModal, setShowNewAccountModal] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountInitialBalance, setNewAccountInitialBalance] = useState('');

  // Reassignment modal
  const [reassignTargetTx, setReassignTargetTx] = useState(null);
  const [newAssignedChequera, setNewAssignedChequera] = useState('');

  // Receipt & Image previews
  const [previewImage, setPreviewImage] = useState(null);
  const [showClientReceipt, setShowClientReceipt] = useState(null);
  const [showExpenseReceipt, setShowExpenseReceipt] = useState(null);

  // Status/Feedback toast message
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  const showNotification = (text, isSuccess = true) => {
    setFeedbackMsg({ text, isSuccess });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // Currency Formatter
  const formatCOP = (val) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(num);
  };

  // Refresh chequeras list
  const refreshChequeras = () => {
    setChequeras(getChequerasList());
  };

  // Discover any chequeras dynamically present in transactions
  const allKnownChequeras = useMemo(() => {
    const set = new Set(chequeras);
    transactions.forEach(tx => {
      const ch = extractChequera(tx);
      if (ch && ch.trim()) {
        set.add(ch.trim());
      }
    });
    return Array.from(set);
  }, [chequeras, transactions]);

  // Project map for quick lookup
  const projectMap = useMemo(() => {
    const map = {};
    projects.forEach(p => {
      map[p.id] = p;
    });
    return map;
  }, [projects]);

  // Personnel map for quick lookup
  const personnelMap = useMemo(() => {
    const map = {};
    personnel.forEach(p => {
      map[p.id] = p;
    });
    return map;
  }, [personnel]);

  // Process and normalize transactions with resolved Chequera (DO NOT default to Caja Dumar!)
  const enrichedTransactions = useMemo(() => {
    return transactions.map(tx => {
      // Determine chequera - if not provided or empty, leave as '' (Sin Asignar)
      const rawCh = extractChequera(tx);
      const ch = (rawCh && rawCh.trim()) ? rawCh.trim() : '';
      
      // Determine if it is a transfer between chequeras
      const isTransfer = (
        tx.category === 'transfer' || 
        (tx.description && (
          tx.description.toLowerCase().includes('[traslado') || 
          tx.description.toLowerCase().includes('traslado de fondos') ||
          tx.description.toLowerCase().includes('transferencia entre cajas')
        ))
      );

      // Resolve associated project
      const proj = projectMap[tx.projectId] || null;
      const projectName = proj ? proj.name : (tx.projectId === 'general' ? 'Gastos Generales / Admón' : (tx.projectName || 'Sin Asignar'));

      // Resolve personnel / client name
      let personName = '';
      if (tx.personnelId && personnelMap[tx.personnelId]) {
        personName = personnelMap[tx.personnelId].name;
      } else if (tx.personnelName) {
        personName = tx.personnelName;
      } else if (proj?.client) {
        personName = typeof proj.client === 'object' ? proj.client.name : proj.client;
      }

      // Clean human-readable description
      const cleanDesc = cleanPurchaseDescription(tx.description || '', projectName);

      // Support / Receipt file checking
      const hasSupport = !!(
        tx.receiptBase64 || 
        (tx.files && tx.files.length > 0) || 
        tx.supportUrl || 
        tx.fileBase64
      );

      const isCanceled = (
        (tx.description && (tx.description.startsWith('[CANCELADO]') || tx.description.startsWith('[ANULADO]'))) ||
        tx.status === 'canceled'
      );

      return {
        ...tx,
        resolvedChequera: ch,
        isUnassigned: !ch,
        isTransfer,
        projectName,
        personName,
        cleanDesc: cleanDesc || tx.description || 'Movimiento de Caja',
        hasSupport,
        isCanceled
      };
    });
  }, [transactions, projectMap, personnelMap]);

  // Calculate Balances & Metrics for each Chequera AND unassigned movements
  const { chequerasStats, unassignedStats } = useMemo(() => {
    const stats = {};
    allKnownChequeras.forEach(ch => {
      stats[ch] = {
        name: ch,
        totalIncome: 0,
        totalExpense: 0,
        balance: 0,
        movementCount: 0,
        lastDate: null
      };
    });

    const unassigned = {
      name: 'Sin Asignar (En blanco)',
      key: 'unassigned',
      totalIncome: 0,
      totalExpense: 0,
      balance: 0,
      movementCount: 0,
      lastDate: null
    };

    enrichedTransactions.forEach(tx => {
      if (tx.isCanceled) return; // Skip canceled/anulados
      const ch = tx.resolvedChequera;
      const amount = Number(tx.amount) || 0;

      // Unassigned movement
      if (!ch) {
        if (tx.type === 'income') {
          unassigned.totalIncome += amount;
        } else if (tx.type === 'expense') {
          unassigned.totalExpense += amount;
        }
        unassigned.movementCount += 1;
        if (tx.date) {
          if (!unassigned.lastDate || new Date(tx.date) > new Date(unassigned.lastDate)) {
            unassigned.lastDate = tx.date;
          }
        }
        return;
      }

      if (!stats[ch]) {
        stats[ch] = {
          name: ch,
          totalIncome: 0,
          totalExpense: 0,
          balance: 0,
          movementCount: 0,
          lastDate: null
        };
      }

      if (tx.type === 'income') {
        stats[ch].totalIncome += amount;
      } else if (tx.type === 'expense') {
        stats[ch].totalExpense += amount;
      }
      stats[ch].movementCount += 1;

      if (tx.date) {
        if (!stats[ch].lastDate || new Date(tx.date) > new Date(stats[ch].lastDate)) {
          stats[ch].lastDate = tx.date;
        }
      }
    });

    // Compute balance for unassigned
    unassigned.balance = unassigned.totalIncome - unassigned.totalExpense;

    // Compute balance for each chequera
    Object.values(stats).forEach(item => {
      item.balance = item.totalIncome - item.totalExpense;
    });

    return { chequerasStats: stats, unassignedStats: unassigned };
  }, [allKnownChequeras, enrichedTransactions]);

  // Global consolidated KPIs (only across explicit chequeras)
  const globalKPIs = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;
    let totalMovements = 0;

    Object.values(chequerasStats).forEach(s => {
      totalIncome += s.totalIncome;
      totalExpense += s.totalExpense;
      totalMovements += s.movementCount;
    });

    const totalBalance = totalIncome - totalExpense;

    return {
      totalBalance,
      totalIncome,
      totalExpense,
      totalMovements,
      activeChequerasCount: Object.keys(chequerasStats).length
    };
  }, [chequerasStats]);

  // Filtered movements for the audit table
  const filteredMovements = useMemo(() => {
    return enrichedTransactions
      .filter(tx => {
        // Chequera filter
        if (selectedChequeraFilter === 'unassigned') {
          if (tx.resolvedChequera) return false;
        } else if (selectedChequeraFilter !== 'all') {
          if (tx.resolvedChequera.toLowerCase() !== selectedChequeraFilter.toLowerCase()) {
            return false;
          }
        }

        // Flow filter
        if (filterFlow === 'income' && tx.type !== 'income') return false;
        if (filterFlow === 'expense' && tx.type !== 'expense') return false;
        if (filterFlow === 'transfer' && !tx.isTransfer) return false;

        // Month filter (YYYY-MM)
        if (filterMonth && tx.date) {
          if (!tx.date.startsWith(filterMonth)) return false;
        }

        // Date range
        if (filterDateFrom && tx.date) {
          if (tx.date < filterDateFrom) return false;
        }
        if (filterDateTo && tx.date) {
          if (tx.date > filterDateTo) return false;
        }

        // Project filter
        if (filterProject !== 'all') {
          if (tx.projectId !== filterProject) return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchDesc = (tx.description || '').toLowerCase().includes(q);
          const matchClean = (tx.cleanDesc || '').toLowerCase().includes(q);
          const matchProj = (tx.projectName || '').toLowerCase().includes(q);
          const matchPerson = (tx.personName || '').toLowerCase().includes(q);
          const matchMethod = (tx.method || '').toLowerCase().includes(q);
          const matchChequera = (tx.resolvedChequera || '').toLowerCase().includes(q);
          const matchAmount = String(tx.amount || '').includes(q);
          if (!matchDesc && !matchClean && !matchProj && !matchPerson && !matchMethod && !matchChequera && !matchAmount) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  }, [
    enrichedTransactions, 
    selectedChequeraFilter, 
    filterFlow, 
    filterMonth, 
    filterDateFrom, 
    filterDateTo, 
    filterProject, 
    searchQuery
  ]);

  // Current view totals
  const currentViewTotals = useMemo(() => {
    let income = 0;
    let expense = 0;
    filteredMovements.forEach(m => {
      if (m.isCanceled) return;
      if (m.type === 'income') income += Number(m.amount) || 0;
      if (m.type === 'expense') expense += Number(m.amount) || 0;
    });
    return {
      income,
      expense,
      net: income - expense,
      count: filteredMovements.length
    };
  }, [filteredMovements]);

  // Handle Transfer between two chequeras
  const handleExecuteTransfer = async (e) => {
    e.preventDefault();
    const amountNum = Number(transferData.amount);
    if (!amountNum || amountNum <= 0) {
      alert('Ingresa un monto válido mayor a 0 para el traslado.');
      return;
    }
    if (transferData.from === transferData.to) {
      alert('La chequera de origen y destino no pueden ser la misma.');
      return;
    }

    try {
      const transferId = 'TRF_' + Date.now();
      const baseNote = transferData.concept?.trim() || 'Traslado entre chequeras';

      // 1. Transaction 1: Expense from source chequera
      const expenseTx = {
        id: `tx_${transferId}_out`,
        date: transferData.date,
        type: 'expense',
        category: 'transfer',
        amount: amountNum,
        projectId: 'general',
        projectName: 'Gastos Generales / Admón',
        method: 'Transferencia',
        chequera: transferData.from,
        description: `[Traslado hacia ${transferData.to}] ${baseNote} [Chequera: ${transferData.from}]`,
        notes: `Traslado a ${transferData.to}`
      };

      // 2. Transaction 2: Income into destination chequera
      const incomeTx = {
        id: `tx_${transferId}_in`,
        date: transferData.date,
        type: 'income',
        category: 'transfer',
        amount: amountNum,
        projectId: 'general',
        projectName: 'Gastos Generales / Admón',
        method: 'Transferencia',
        chequera: transferData.to,
        description: `[Traslado desde ${transferData.from}] ${baseNote} [Chequera: ${transferData.to}]`,
        notes: `Traslado desde ${transferData.from}`
      };

      if (onAddTransaction) {
        await onAddTransaction(expenseTx);
        await onAddTransaction(incomeTx);
      }

      showNotification(`✅ Traslado de ${formatCOP(amountNum)} de ${transferData.from} a ${transferData.to} registrado con éxito.`);
      setShowTransferModal(false);
      setTransferData({
        from: 'Bancolombia Empresas',
        to: 'Caja Duvan',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        concept: 'Traslado de fondos para gastos de obra'
      });
    } catch (err) {
      console.error('Error al ejecutar traslado:', err);
      alert('Hubo un error al registrar el traslado. Por favor intenta de nuevo.');
    }
  };

  // Handle direct movement / manual adjustment
  const handleSaveDirectTx = async (e) => {
    e.preventDefault();
    const amountNum = Number(directTxData.amount);
    if (!amountNum || amountNum <= 0) {
      alert('Ingresa un monto válido mayor a 0.');
      return;
    }

    try {
      const txId = 'tx_' + Date.now();
      const proj = projectMap[directTxData.projectId] || null;
      const projName = proj ? proj.name : (directTxData.projectId === 'general' ? 'Gastos Generales / Admón' : 'General');
      
      const chToSave = (directTxData.chequera || '').trim();
      const descWithChequera = chToSave 
        ? `${directTxData.description?.trim() || 'Movimiento directo'} [Chequera: ${chToSave}]`
        : (directTxData.description?.trim() || 'Movimiento directo');

      const newTx = {
        id: txId,
        date: directTxData.date,
        type: directTxData.type,
        category: directTxData.type === 'income' ? 'client_payment' : 'administrative',
        amount: amountNum,
        projectId: directTxData.projectId,
        projectName: projName,
        method: directTxData.method || 'Transferencia',
        chequera: chToSave,
        account: chToSave,
        description: descWithChequera,
        personnelId: directTxData.personnelId || null
      };

      if (onAddTransaction) {
        await onAddTransaction(newTx);
      }

      showNotification(`✅ Movimiento registrado exitosamente${chToSave ? ` en ${chToSave}` : ' (Sin chequera)'}.`);
      setShowDirectTxModal(false);
      setDirectTxData({
        chequera: 'Bancolombia Empresas',
        type: 'income',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        projectId: 'general',
        description: '',
        method: 'Transferencia',
        personnelId: ''
      });
    } catch (err) {
      console.error('Error al guardar movimiento:', err);
      alert('Ocurrió un error al guardar el movimiento.');
    }
  };

  // Handle creation of new chequera/account
  const handleCreateNewAccount = (e) => {
    e.preventDefault();
    if (!newAccountName || !newAccountName.trim()) {
      alert('Por favor escribe el nombre de la cuenta o chequera.');
      return;
    }
    const cleanName = newAccountName.trim();
    saveNewChequera(cleanName);
    refreshChequeras();

    // If initial balance > 0, register initial income
    const initBalance = Number(newAccountInitialBalance);
    if (initBalance > 0 && onAddTransaction) {
      const initTx = {
        id: 'tx_init_' + Date.now(),
        date: new Date().toISOString().split('T')[0],
        type: 'income',
        category: 'administrative',
        amount: initBalance,
        projectId: 'general',
        projectName: 'Gastos Generales / Admón',
        method: 'Apertura de Cuenta',
        chequera: cleanName,
        account: cleanName,
        description: `Saldo inicial de apertura [Chequera: ${cleanName}]`
      };
      onAddTransaction(initTx);
    }

    showNotification(`🏛️ Chequera "${cleanName}" creada exitosamente.`);
    setShowNewAccountModal(false);
    setNewAccountName('');
    setNewAccountInitialBalance('');
  };

  // Handle reassigning a transaction to a different chequera (or leaving it blank)
  const handleSaveReassignment = async () => {
    if (!reassignTargetTx) return;

    try {
      let desc = reassignTargetTx.description || '';
      // Strip old chequera tag if present
      desc = desc.replace(/\[(?:Chequera|Caja|Cuenta):\s*[^\]]+\]/gi, '').trim();

      let updated;
      if (newAssignedChequera && newAssignedChequera.trim()) {
        desc = `${desc} [Chequera: ${newAssignedChequera.trim()}]`.trim();
        updated = {
          ...reassignTargetTx,
          chequera: newAssignedChequera.trim(),
          account: newAssignedChequera.trim(),
          description: desc
        };
      } else {
        // Leave completely blank
        updated = {
          ...reassignTargetTx,
          chequera: '',
          account: '',
          description: desc
        };
      }

      if (onUpdateTransaction) {
        await onUpdateTransaction(updated);
      }

      showNotification(`✅ Movimiento actualizado: ${newAssignedChequera ? `Asignado a ${newAssignedChequera}` : 'Dejado en blanco (Sin Chequera)'}.`);
      setReassignTargetTx(null);
      setNewAssignedChequera('');
    } catch (err) {
      console.error('Error reasignando chequera:', err);
      alert('Ocurrió un error al reasignar la chequera.');
    }
  };

  // Export filtered movements to CSV
  const handleExportCSV = () => {
    if (filteredMovements.length === 0) {
      alert('No hay movimientos para exportar con los filtros seleccionados.');
      return;
    }

    const headers = ['Fecha', 'Chequera / Cuenta', 'Tipo Flujo', 'Concepto', 'Obra / Proyecto', 'Personal / Cliente', 'Método', 'Monto COP', 'Estado'];
    const rows = filteredMovements.map(m => [
      `"${m.date || ''}"`,
      `"${m.resolvedChequera || 'Sin Asignar'}"`,
      `"${m.type === 'income' ? 'Ingreso / Entrada' : 'Egreso / Salida'}"`,
      `"${(m.cleanDesc || '').replace(/"/g, '""')}"`,
      `"${(m.projectName || '').replace(/"/g, '""')}"`,
      `"${(m.personName || '').replace(/"/g, '""')}"`,
      `"${m.method || ''}"`,
      m.amount || 0,
      `"${m.isCanceled ? 'Anulado' : 'Activo'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Habitech_Chequeras_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Open receipt modal depending on whether it's income or expense
  const handleOpenReceipt = (tx) => {
    const proj = projectMap[tx.projectId] || { id: tx.projectId || 'gen', name: tx.projectName || 'General', client: tx.personName || 'Cliente Habitech' };
    if (tx.type === 'income') {
      setShowClientReceipt({
        project: proj,
        payment: {
          id: tx.paymentId || tx.id,
          amount: tx.amount,
          date: tx.date,
          method: tx.method || 'Transferencia',
          notes: tx.description
        }
      });
    } else {
      setShowExpenseReceipt({
        project: proj,
        transaction: tx
      });
    }
  };

  // Security guard for admin role
  if (!isAdmin) {
    return (
      <div className="glass-panel" style={{ padding: '60px 30px', textAlign: 'center', maxWidth: '600px', margin: '40px auto' }}>
        <AlertCircle size={54} style={{ color: 'var(--primary-red)', marginBottom: '16px' }} />
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '10px' }}>
          Acceso Exclusivo de Super Administrador
        </h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '0.95rem' }}>
          El módulo de <strong>Saldos y Control de Chequeras</strong> contiene información financiera sensible y saldos consolidados de la compañía. Solo los usuarios con rol de Administrador tienen permisos para consultar esta sección.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '60px' }}>
      
      {/* Toast feedback */}
      {feedbackMsg && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 999999,
          background: feedbackMsg.isSuccess ? 'rgba(16, 185, 129, 0.95)' : 'rgba(239, 68, 68, 0.95)',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: '10px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
          fontWeight: 600,
          fontSize: '0.9rem',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          backdropFilter: 'blur(10px)',
          animation: 'fadeIn 0.25s ease-out'
        }}>
          {feedbackMsg.text}
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="glass-panel" style={{
        padding: '24px 28px',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(250, 204, 21, 0.2), rgba(6, 182, 212, 0.2))',
            border: '1px solid var(--border-glass)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#facc15',
            boxShadow: '0 0 20px rgba(250, 204, 21, 0.15)'
          }}>
            <Landmark size={28} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Saldos y Control de Chequeras
              </h1>
              <span className="badge" style={{ background: 'rgba(6, 182, 212, 0.15)', color: 'var(--primary-cyan)', border: '1px solid rgba(6, 182, 212, 0.3)', fontSize: '0.72rem', padding: '3px 8px' }}>
                🔒 Super Admin
              </span>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              Monitoreo y auditoría exacta de cuentas bancarias y cajas de efectivo. No se asume ninguna chequera si no ha sido seleccionada.
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setShowTransferModal(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 16px', fontSize: '0.88rem' }}
          >
            <ArrowRightLeft size={16} style={{ color: 'var(--primary-cyan)' }} />
            <span>Traslado entre Cajas</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setShowDirectTxModal(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 16px', fontSize: '0.88rem' }}
          >
            <Plus size={16} style={{ color: 'var(--primary-teal)' }} />
            <span>Registrar Movimiento</span>
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowNewAccountModal(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', fontSize: '0.88rem' }}
          >
            <Wallet size={16} />
            <span>Nueva Chequera</span>
          </button>
        </div>
      </div>

      {/* NOTICE BANNER: UNASSIGNED MOVEMENTS */}
      {unassignedStats.movementCount > 0 && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.08)',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          borderRadius: '14px',
          padding: '14px 20px',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'rgba(245, 158, 11, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fbbf24',
              flexShrink: 0
            }}>
              <AlertCircle size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#fde047' }}>
                Hay {unassignedStats.movementCount} movimientos sin chequera asignada (en blanco)
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Total: +{formatCOP(unassignedStats.totalIncome)} en ingresos y -{formatCOP(unassignedStats.totalExpense)} en egresos sin clasificar.
              </div>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setSelectedChequeraFilter(selectedChequeraFilter === 'unassigned' ? 'all' : 'unassigned')}
            style={{ fontSize: '0.82rem', padding: '8px 16px' }}
          >
            {selectedChequeraFilter === 'unassigned' ? 'Mostrar Todas las Cajas' : 'Filtrar Movimientos en Blanco'}
          </button>
        </div>
      )}

      {/* CONSOLIDATED GLOBAL METRICS CARDS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
        gap: '16px'
      }}>
        {/* Total Consolidado */}
        <div className="glass-panel metric-card" style={{ padding: '20px', borderLeft: '4px solid var(--primary-cyan)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', fontWeight: 700 }}>
                Saldo Total en Chequeras
              </span>
              <div style={{
                fontSize: '1.6rem',
                fontWeight: 800,
                color: globalKPIs.totalBalance >= 0 ? 'var(--primary-cyan)' : 'var(--primary-red)',
                marginTop: '6px'
              }}>
                {formatCOP(globalKPIs.totalBalance)}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Disponible neto en cuentas registradas
              </span>
            </div>
            <div className="metric-icon cyan">
              <DollarSign size={22} />
            </div>
          </div>
        </div>

        {/* Total Entregas / Ingresos */}
        <div className="glass-panel metric-card" style={{ padding: '20px', borderLeft: '4px solid var(--primary-teal)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', fontWeight: 700 }}>
                Total Entregas / Ingresos
              </span>
              <div style={{
                fontSize: '1.6rem',
                fontWeight: 800,
                color: 'var(--primary-teal)',
                marginTop: '6px'
              }}>
                + {formatCOP(globalKPIs.totalIncome)}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Recaudos clasificados en cuentas
              </span>
            </div>
            <div className="metric-icon teal">
              <ArrowUpRight size={22} />
            </div>
          </div>
        </div>

        {/* Total Salidas / Gastos */}
        <div className="glass-panel metric-card" style={{ padding: '20px', borderLeft: '4px solid var(--primary-red)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', fontWeight: 700 }}>
                Total Salidas / Egresos
              </span>
              <div style={{
                fontSize: '1.6rem',
                fontWeight: 800,
                color: 'var(--primary-red)',
                marginTop: '6px'
              }}>
                - {formatCOP(globalKPIs.totalExpense)}
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Gastos clasificados en cuentas
              </span>
            </div>
            <div className="metric-icon red">
              <ArrowDownLeft size={22} />
            </div>
          </div>
        </div>

        {/* Chequeras Activas */}
        <div className="glass-panel metric-card" style={{ padding: '20px', borderLeft: '4px solid #facc15' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', fontWeight: 700 }}>
                Cuentas Registradas
              </span>
              <div style={{
                fontSize: '1.6rem',
                fontWeight: 800,
                color: '#facc15',
                marginTop: '6px'
              }}>
                {globalKPIs.activeChequerasCount} Activas
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {globalKPIs.totalMovements} movimientos clasificados
              </span>
            </div>
            <div className="metric-icon yellow" style={{ background: 'rgba(250, 204, 21, 0.15)', color: '#facc15' }}>
              <Landmark size={22} />
            </div>
          </div>
        </div>
      </div>

      {/* INDIVIDUAL CHEQUERAS CARDS GRID */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={18} style={{ color: 'var(--primary-cyan)' }} />
            <span>Desglose por Chequera y Cuenta</span>
          </h2>
          {selectedChequeraFilter !== 'all' && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setSelectedChequeraFilter('all')}
              style={{ fontSize: '0.78rem', padding: '4px 10px' }}
            >
              Mostrar Todas
            </button>
          )}
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '18px'
        }}>
          {allKnownChequeras.map(chName => {
            const stat = chequerasStats[chName] || { totalIncome: 0, totalExpense: 0, balance: 0, movementCount: 0 };
            const theme = getChequeraTheme(chName);
            const isSelected = selectedChequeraFilter.toLowerCase() === chName.toLowerCase();

            return (
              <div
                key={chName}
                className="glass-panel"
                style={{
                  padding: '22px',
                  borderRadius: '16px',
                  border: isSelected ? `2px solid ${theme.color}` : `1px solid ${theme.border}`,
                  background: isSelected ? 'rgba(6, 182, 212, 0.08)' : theme.bg,
                  boxShadow: isSelected ? `0 0 25px ${theme.border}` : 'none',
                  transition: 'all 0.25s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  position: 'relative'
                }}
              >
                {/* Card Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      background: theme.pillBg,
                      color: theme.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Landmark size={20} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {chName}
                      </h3>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {stat.movementCount} movimientos registrados
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <span className="badge" style={{ background: theme.color, color: '#0b0f19', fontWeight: 700, fontSize: '0.68rem' }}>
                      Filtro Activo
                    </span>
                  )}
                </div>

                {/* Card Main Balance */}
                <div style={{
                  background: 'rgba(0, 0, 0, 0.25)',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.04)'
                }}>
                  <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    Saldo Disponible Actual
                  </span>
                  <div style={{
                    fontSize: '1.75rem',
                    fontWeight: 900,
                    color: stat.balance >= 0 ? theme.color : 'var(--primary-red)',
                    marginTop: '2px',
                    letterSpacing: '-0.5px'
                  }}>
                    {formatCOP(stat.balance)}
                  </div>
                </div>

                {/* Card Sub-stats (Income vs Expense) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div style={{ background: 'rgba(16, 185, 129, 0.08)', padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: 'var(--primary-teal)', fontWeight: 700 }}>
                      <ArrowUpRight size={13} />
                      <span>Ingresos / Entregas</span>
                    </div>
                    <div style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--primary-teal)', marginTop: '4px' }}>
                      +{formatCOP(stat.totalIncome)}
                    </div>
                  </div>

                  <div style={{ background: 'rgba(244, 63, 94, 0.08)', padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(244, 63, 94, 0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: 'var(--primary-red)', fontWeight: 700 }}>
                      <ArrowDownLeft size={13} />
                      <span>Egresos / Gastos</span>
                    </div>
                    <div style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--primary-red)', marginTop: '4px' }}>
                      -{formatCOP(stat.totalExpense)}
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '4px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setSelectedChequeraFilter(isSelected ? 'all' : chName)}
                    style={{
                      flex: 1,
                      fontSize: '0.8rem',
                      padding: '8px 12px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      borderColor: isSelected ? theme.color : undefined
                    }}
                  >
                    <Filter size={13} />
                    <span>{isSelected ? 'Ver Todas' : 'Filtrar Historial'}</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setTransferData(prev => ({ ...prev, from: chName }));
                      setShowTransferModal(true);
                    }}
                    title="Hacer traslado desde esta chequera"
                    style={{
                      padding: '8px 12px',
                      fontSize: '0.8rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px'
                    }}
                  >
                    <ArrowRightLeft size={13} />
                    <span>Mover</span>
                  </button>
                </div>
              </div>
            );
          })}

          {/* DEDICATED CARD FOR UNASSIGNED MOVEMENTS (IF ANY) */}
          {unassignedStats.movementCount > 0 && (
            <div
              className="glass-panel"
              style={{
                padding: '22px',
                borderRadius: '16px',
                border: selectedChequeraFilter === 'unassigned' ? '2px solid #fbbf24' : '1px dashed rgba(245, 158, 11, 0.4)',
                background: selectedChequeraFilter === 'unassigned' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.05)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: 'rgba(245, 158, 11, 0.2)',
                    color: '#fbbf24',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <AlertCircle size={20} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#fde047' }}>
                      Sin Asignar (En blanco)
                    </h3>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {unassignedStats.movementCount} movimientos sin clasificar
                    </span>
                  </div>
                </div>

                <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', fontSize: '0.68rem', fontWeight: 700 }}>
                  Por Clasificar
                </span>
              </div>

              <div style={{
                background: 'rgba(0, 0, 0, 0.25)',
                padding: '14px 16px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.04)'
              }}>
                <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Saldo Neto Sin Clasificar
                </span>
                <div style={{
                  fontSize: '1.75rem',
                  fontWeight: 900,
                  color: '#fbbf24',
                  marginTop: '2px',
                  letterSpacing: '-0.5px'
                }}>
                  {formatCOP(unassignedStats.balance)}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ background: 'rgba(16, 185, 129, 0.08)', padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--primary-teal)', fontWeight: 700 }}>Ingresos en Blanco</div>
                  <div style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--primary-teal)', marginTop: '4px' }}>
                    +{formatCOP(unassignedStats.totalIncome)}
                  </div>
                </div>
                <div style={{ background: 'rgba(244, 63, 94, 0.08)', padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(244, 63, 94, 0.2)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--primary-red)', fontWeight: 700 }}>Egresos en Blanco</div>
                  <div style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--primary-red)', marginTop: '4px' }}>
                    -{formatCOP(unassignedStats.totalExpense)}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '4px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedChequeraFilter(selectedChequeraFilter === 'unassigned' ? 'all' : 'unassigned')}
                  style={{ width: '100%', fontSize: '0.8rem', padding: '8px 12px' }}
                >
                  {selectedChequeraFilter === 'unassigned' ? 'Ver Todas' : 'Filtrar Sin Asignar'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AUDIT & TRANSACTION HISTORY TABLE */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Table Title and Actions */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '14px' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Clock size={20} style={{ color: 'var(--primary-cyan)' }} />
              <span>Historial Detallado de Entregas y Movimientos</span>
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {currentViewTotals.count} movimientos listados según filtros activos.
            </p>
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleExportCSV}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', padding: '8px 16px' }}
          >
            <Download size={15} />
            <span>Exportar Excel / CSV</span>
          </button>
        </div>

        {/* Filters Toolbar */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--border-glass)',
          borderRadius: '12px',
          padding: '16px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'center'
        }}>
          {/* Chequera Filter */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>Chequera / Caja</label>
            <select
              className="form-control"
              value={selectedChequeraFilter}
              onChange={(e) => setSelectedChequeraFilter(e.target.value)}
              style={{ minWidth: '180px', fontSize: '0.85rem', padding: '8px 12px' }}
            >
              <option value="all">Todas las Chequeras</option>
              <option value="unassigned">⚠️ Sin Asignar (En blanco) ({unassignedStats.movementCount})</option>
              {allKnownChequeras.map(c => (
                <option key={c} value={c}>🏦 {c}</option>
              ))}
            </select>
          </div>

          {/* Flow Filter */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>Tipo de Flujo</label>
            <select
              className="form-control"
              value={filterFlow}
              onChange={(e) => setFilterFlow(e.target.value)}
              style={{ minWidth: '160px', fontSize: '0.85rem', padding: '8px 12px' }}
            >
              <option value="all">Todos los Movimientos</option>
              <option value="income">🟢 Entradas / Cobros Clientes</option>
              <option value="expense">🔴 Salidas / Gastos Obra</option>
              <option value="transfer">🔄 Solo Traslados entre Cajas</option>
            </select>
          </div>

          {/* Month Filter */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>Mes (YYYY-MM)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <input
                type="month"
                className="form-control"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                style={{ width: '150px', fontSize: '0.85rem', padding: '8px 10px' }}
              />
              {filterMonth && (
                <button
                  type="button"
                  className="btn-icon"
                  onClick={() => setFilterMonth('')}
                  title="Limpiar filtro de mes"
                  style={{ width: '32px', height: '32px' }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Date Range: From */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>Desde</label>
            <input
              type="date"
              className="form-control"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              style={{ width: '140px', fontSize: '0.85rem', padding: '8px 10px' }}
            />
          </div>

          {/* Date Range: To */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>Hasta</label>
            <input
              type="date"
              className="form-control"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              style={{ width: '140px', fontSize: '0.85rem', padding: '8px 10px' }}
            />
          </div>

          {/* Project Filter */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>Obra / Proyecto</label>
            <select
              className="form-control"
              value={filterProject}
              onChange={(e) => setFilterProject(e.target.value)}
              style={{ minWidth: '180px', fontSize: '0.85rem', padding: '8px 12px' }}
            >
              <option value="all">Todas las Obras / Admón</option>
              <option value="general">Gastos Generales / Admón</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Search Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '1 1 200px' }}>
            <label style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>Buscar</label>
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="form-control"
                placeholder="Buscar concepto, cliente, personal..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '34px', fontSize: '0.85rem', width: '100%' }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Subtotal Banner for Active Filter */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(6, 182, 212, 0.05)',
          border: '1px solid rgba(6, 182, 212, 0.2)',
          borderRadius: '10px',
          padding: '12px 18px',
          gap: '12px'
        }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <strong>Resumen del Filtro:</strong> {currentViewTotals.count} movimientos encontrados
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            {currentViewTotals.income > 0 && (
              <span style={{ fontSize: '0.85rem', color: 'var(--primary-teal)', fontWeight: 700 }}>
                Entradas: +{formatCOP(currentViewTotals.income)}
              </span>
            )}
            {currentViewTotals.expense > 0 && (
              <span style={{ fontSize: '0.85rem', color: 'var(--primary-red)', fontWeight: 700 }}>
                Salidas: -{formatCOP(currentViewTotals.expense)}
              </span>
            )}
            <span style={{
              fontSize: '0.95rem',
              fontWeight: 800,
              color: currentViewTotals.net >= 0 ? 'var(--primary-cyan)' : 'var(--primary-red)',
              background: 'rgba(0, 0, 0, 0.3)',
              padding: '4px 10px',
              borderRadius: '6px'
            }}>
              Neto: {currentViewTotals.net >= 0 ? '+' : ''}{formatCOP(currentViewTotals.net)}
            </span>
          </div>
        </div>

        {/* MOVEMENTS TABLE */}
        {filteredMovements.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-secondary)' }}>
            <Landmark size={44} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
            <p style={{ fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>No se encontraron movimientos</p>
            <p style={{ fontSize: '0.85rem', margin: 0 }}>Prueba ajustando los filtros de fecha, chequera o término de búsqueda.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ width: '105px' }}>Fecha</th>
                  <th style={{ width: '165px' }}>Chequera / Caja</th>
                  <th style={{ width: '130px' }}>Flujo</th>
                  <th>Concepto / Detalle</th>
                  <th style={{ width: '170px' }}>Obra / Proyecto</th>
                  <th style={{ width: '150px' }}>Personal / Cliente</th>
                  <th style={{ width: '120px' }}>Método</th>
                  <th style={{ textAlign: 'right', width: '140px' }}>Monto COP</th>
                  <th style={{ textAlign: 'center', width: '90px' }}>Soporte</th>
                  <th style={{ textAlign: 'center', width: '110px' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredMovements.map(m => {
                  const hasChequera = Boolean(m.resolvedChequera);
                  const theme = getChequeraTheme(m.resolvedChequera);
                  const isIncome = m.type === 'income';
                  const isAnulado = m.isCanceled;

                  return (
                    <tr 
                      key={m.id}
                      style={{
                        opacity: isAnulado ? 0.45 : 1,
                        textDecoration: isAnulado ? 'line-through' : 'none'
                      }}
                    >
                      {/* Fecha */}
                      <td style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {m.date || '—'}
                      </td>

                      {/* Chequera */}
                      <td>
                        {hasChequera ? (
                          <span 
                            className="badge" 
                            style={{
                              background: theme.bg,
                              color: theme.color,
                              border: `1px solid ${theme.border}`,
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              padding: '3px 8px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Landmark size={11} />
                            {m.resolvedChequera}
                          </span>
                        ) : (
                          <span 
                            className="badge" 
                            style={{
                              background: 'rgba(245, 158, 11, 0.12)',
                              color: '#fbbf24',
                              border: '1px solid rgba(245, 158, 11, 0.3)',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              padding: '3px 8px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                            title="No se seleccionó chequera al registrar este movimiento"
                          >
                            <AlertCircle size={11} /> Sin Asignar
                          </span>
                        )}
                      </td>

                      {/* Flujo */}
                      <td>
                        {m.isTransfer ? (
                          <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)', fontSize: '0.72rem' }}>
                            🔄 Traslado
                          </span>
                        ) : isIncome ? (
                          <span className="badge badge-completed" style={{ fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <ArrowUpRight size={11} /> Entrada
                          </span>
                        ) : (
                          <span className="badge badge-danger" style={{ fontSize: '0.72rem', background: 'rgba(244, 63, 94, 0.15)', color: '#fda4af', border: '1px solid rgba(244, 63, 94, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <ArrowDownLeft size={11} /> Salida
                          </span>
                        )}
                      </td>

                      {/* Concepto */}
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.88rem' }}>
                          {m.cleanDesc}
                        </div>
                        {m.notes && m.notes !== m.cleanDesc && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {m.notes}
                          </div>
                        )}
                      </td>

                      {/* Obra / Proyecto */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Building2 size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                            {m.projectName}
                          </span>
                        </div>
                      </td>

                      {/* Personal / Cliente */}
                      <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        {m.personName || '—'}
                      </td>

                      {/* Método de Pago */}
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {m.method || 'Transferencia'}
                      </td>

                      {/* Monto */}
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <span style={{
                          fontWeight: 800,
                          fontSize: '0.92rem',
                          color: isIncome ? 'var(--primary-teal)' : 'var(--primary-red)'
                        }}>
                          {isIncome ? '+ ' : '- '}{formatCOP(m.amount)}
                        </span>
                      </td>

                      {/* Soporte / Comprobante */}
                      <td style={{ textAlign: 'center' }}>
                        {m.hasSupport ? (
                          <button
                            type="button"
                            onClick={() => {
                              if (m.receiptBase64 || m.fileBase64) {
                                setPreviewImage(m.receiptBase64 || m.fileBase64);
                              } else if (m.files && m.files[0]?.fileBase64) {
                                setPreviewImage(m.files[0].fileBase64);
                              } else {
                                handleOpenReceipt(m);
                              }
                            }}
                            className="btn-icon"
                            title="Ver soporte adjunto"
                            style={{ color: 'var(--primary-cyan)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <Paperclip size={14} />
                          </button>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>—</span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', alignItems: 'center' }}>
                          {/* Reassign / Choose Chequera */}
                          <button
                            type="button"
                            onClick={() => {
                              setReassignTargetTx(m);
                              setNewAssignedChequera(m.resolvedChequera || '');
                            }}
                            className="btn-icon"
                            title="Cambiar o Asignar Chequera"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            <Edit3 size={13} />
                          </button>

                          {/* Print / View formal receipt */}
                          <button
                            type="button"
                            onClick={() => handleOpenReceipt(m)}
                            className="btn-icon"
                            title="Ver Recibo Oficial de Caja"
                            style={{ color: 'var(--primary-cyan)' }}
                          >
                            <Printer size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: TRASLADO ENTRE CHEQUERAS */}
      {showTransferModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '500px', width: '90%' }}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, color: 'var(--text-primary)' }}>
                <ArrowRightLeft size={20} style={{ color: 'var(--primary-cyan)' }} />
                <span>Traslado entre Cajas y Chequeras</span>
              </h3>
              <button type="button" className="btn-icon" onClick={() => setShowTransferModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleExecuteTransfer}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Mueve dinero de una chequera o cuenta a otra. Se generará un egreso en la cuenta de origen y un ingreso sincronizado en la cuenta receptora.
                </p>

                {/* From / To */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                      Origen (Sale Dinero)
                    </label>
                    <select
                      className="form-control"
                      value={transferData.from}
                      onChange={(e) => setTransferData({ ...transferData, from: e.target.value })}
                      required
                    >
                      {allKnownChequeras.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <span style={{ fontSize: '0.7rem', color: 'var(--primary-red)' }}>
                      Saldo: {formatCOP(chequerasStats[transferData.from]?.balance || 0)}
                    </span>
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                      Destino (Entra Dinero)
                    </label>
                    <select
                      className="form-control"
                      value={transferData.to}
                      onChange={(e) => setTransferData({ ...transferData, to: e.target.value })}
                      required
                    >
                      {allKnownChequeras.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <span style={{ fontSize: '0.7rem', color: 'var(--primary-teal)' }}>
                      Saldo: {formatCOP(chequerasStats[transferData.to]?.balance || 0)}
                    </span>
                  </div>
                </div>

                {/* Amount */}
                <div className="form-group">
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    Monto a Trasladar ($ COP)
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Ej. 5000000"
                    value={transferData.amount}
                    onChange={(e) => setTransferData({ ...transferData, amount: e.target.value })}
                    required
                    min="1"
                    style={{ fontSize: '1.1rem', fontWeight: 700 }}
                  />
                  {transferData.amount > 0 && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--primary-cyan)', marginTop: '2px', display: 'block' }}>
                      {formatCOP(transferData.amount)}
                    </span>
                  )}
                </div>

                {/* Date */}
                <div className="form-group">
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    Fecha del Traslado
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    value={transferData.date}
                    onChange={(e) => setTransferData({ ...transferData, date: e.target.value })}
                    required
                  />
                </div>

                {/* Concept / Notes */}
                <div className="form-group">
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    Motivo / Observación
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ej. Traslado para nómina y materiales de la semana"
                    value={transferData.concept}
                    onChange={(e) => setTransferData({ ...transferData, concept: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowTransferModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle size={15} />
                  <span>Confirmar Traslado</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: REGISTRAR MOVIMIENTO DIRECTO */}
      {showDirectTxModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '520px', width: '90%' }}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, color: 'var(--text-primary)' }}>
                <Plus size={20} style={{ color: 'var(--primary-cyan)' }} />
                <span>Registrar Movimiento en Chequera</span>
              </h3>
              <button type="button" className="btn-icon" onClick={() => setShowDirectTxModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveDirectTx}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                
                {/* Chequera & Flow Type */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Chequera / Caja</label>
                    <select
                      className="form-control"
                      value={directTxData.chequera}
                      onChange={(e) => setDirectTxData({ ...directTxData, chequera: e.target.value })}
                    >
                      <option value="">-- Sin Chequera (En blanco) --</option>
                      {allKnownChequeras.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Tipo de Movimiento</label>
                    <select
                      className="form-control"
                      value={directTxData.type}
                      onChange={(e) => setDirectTxData({ ...directTxData, type: e.target.value })}
                      required
                    >
                      <option value="income">🟢 Entrada / Ingreso (Cobro o Inyección)</option>
                      <option value="expense">🔴 Salida / Egreso (Gasto o Pago)</option>
                    </select>
                  </div>
                </div>

                {/* Amount & Date */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Monto ($ COP)</label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="0"
                      value={directTxData.amount}
                      onChange={(e) => setDirectTxData({ ...directTxData, amount: e.target.value })}
                      required
                      min="1"
                    />
                    {directTxData.amount > 0 && (
                      <span style={{ fontSize: '0.72rem', color: 'var(--primary-cyan)', marginTop: '2px', display: 'block' }}>
                        {formatCOP(directTxData.amount)}
                      </span>
                    )}
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Fecha</label>
                    <input
                      type="date"
                      className="form-control"
                      value={directTxData.date}
                      onChange={(e) => setDirectTxData({ ...directTxData, date: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Project / Obra */}
                <div className="form-group">
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Vincular a Obra / Proyecto</label>
                  <select
                    className="form-control"
                    value={directTxData.projectId}
                    onChange={(e) => setDirectTxData({ ...directTxData, projectId: e.target.value })}
                  >
                    <option value="general">Gastos Generales / Administración Habitech</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div className="form-group">
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Concepto / Descripción</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ej. Abono cliente, Compra de cemento, etc."
                    value={directTxData.description}
                    onChange={(e) => setDirectTxData({ ...directTxData, description: e.target.value })}
                    required
                  />
                </div>

                {/* Payment Method */}
                <div className="form-group">
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Método de Pago</label>
                  <select
                    className="form-control"
                    value={directTxData.method}
                    onChange={(e) => setDirectTxData({ ...directTxData, method: e.target.value })}
                  >
                    <option value="Transferencia">Transferencia Bancaria</option>
                    <option value="Consignación">Consignación Bancaria</option>
                    <option value="Efectivo">Efectivo en Caja</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer" style={{ marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowDirectTxModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Guardar Movimiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CREAR NUEVA CHEQUERA / CUENTA */}
      {showNewAccountModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '440px', width: '90%' }}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, color: 'var(--text-primary)' }}>
                <Wallet size={20} style={{ color: 'var(--primary-cyan)' }} />
                <span>Crear Nueva Chequera o Caja</span>
              </h3>
              <button type="button" className="btn-icon" onClick={() => setShowNewAccountModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateNewAccount}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Agrega una nueva cuenta bancaria o caja menor para rastrear su saldo y asociarle pagos y egresos.
                </p>

                <div className="form-group">
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    Nombre de la Cuenta / Chequera
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ej. Davivienda Habitech, Caja Menor Marinilla..."
                    value={newAccountName}
                    onChange={(e) => setNewAccountName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    Saldo Inicial Apertura ($ COP - Opcional)
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="0"
                    value={newAccountInitialBalance}
                    onChange={(e) => setNewAccountInitialBalance(e.target.value)}
                    min="0"
                  />
                  {newAccountInitialBalance > 0 && (
                    <span style={{ fontSize: '0.72rem', color: 'var(--primary-teal)', marginTop: '2px', display: 'block' }}>
                      Se registrará un ingreso inicial de {formatCOP(newAccountInitialBalance)}
                    </span>
                  )}
                </div>
              </div>

              <div className="modal-footer" style={{ marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowNewAccountModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Crear Chequera
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: REASIGNAR CHEQUERA */}
      {reassignTargetTx && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '440px', width: '90%' }}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, color: 'var(--text-primary)' }}>
                <Edit3 size={18} style={{ color: 'var(--primary-cyan)' }} />
                <span>Asignar o Cambiar Chequera</span>
              </h3>
              <button type="button" className="btn-icon" onClick={() => setReassignTargetTx(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                Selecciona la cuenta a la cual pertenece este movimiento. También puedes dejarlo en blanco si no corresponde a ninguna chequera.
              </p>

              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Movimiento:</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {reassignTargetTx.cleanDesc}
                </div>
                <div style={{ fontSize: '0.82rem', color: reassignTargetTx.type === 'income' ? 'var(--primary-teal)' : 'var(--primary-red)', marginTop: '4px', fontWeight: 800 }}>
                  {reassignTargetTx.type === 'income' ? '+' : '-'}{formatCOP(reassignTargetTx.amount)}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Chequera actual: <strong style={{ color: reassignTargetTx.resolvedChequera ? 'var(--primary-cyan)' : '#fbbf24' }}>
                    {reassignTargetTx.resolvedChequera || 'Sin Asignar (En blanco)'}
                  </strong>
                </div>
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  Seleccionar Chequera / Cuenta
                </label>
                <select
                  className="form-control"
                  value={newAssignedChequera}
                  onChange={(e) => setNewAssignedChequera(e.target.value)}
                >
                  <option value="">-- Sin Asignar (Dejar en blanco) --</option>
                  {allKnownChequeras.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="modal-footer" style={{ marginTop: '20px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setReassignTargetTx(null)}>
                Cancelar
              </button>
              <button type="button" className="btn btn-primary" onClick={handleSaveReassignment}>
                Guardar Asignación
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: PHOTO / IMAGE SUPPORT PREVIEW */}
      {previewImage && (
        <div 
          className="modal-overlay" 
          onClick={() => setPreviewImage(null)}
          style={{ zIndex: 1000000 }}
        >
          <div 
            className="glass-panel modal-content" 
            style={{ maxWidth: '700px', width: '90%', padding: '16px', textAlign: 'center' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)' }}>Soporte Adjunto</h3>
              <button type="button" className="btn-icon" onClick={() => setPreviewImage(null)}>
                <X size={18} />
              </button>
            </div>
            <div style={{ maxHeight: '70vh', overflowY: 'auto', borderRadius: '8px' }}>
              <img 
                src={previewImage} 
                alt="Soporte de movimiento" 
                style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px' }} 
              />
            </div>
          </div>
        </div>
      )}

      {/* OFFICIAL CLIENT RECEIPT MODAL */}
      {showClientReceipt && (
        <ReceiptModal
          project={showClientReceipt.project}
          payment={showClientReceipt.payment}
          onClose={() => setShowClientReceipt(null)}
        />
      )}

      {/* OFFICIAL EXPENSE RECEIPT MODAL */}
      {showExpenseReceipt && (
        <ExpenseReceiptModal
          project={showExpenseReceipt.project}
          transaction={showExpenseReceipt.transaction}
          onClose={() => setShowExpenseReceipt(null)}
        />
      )}
    </div>
  );
}
