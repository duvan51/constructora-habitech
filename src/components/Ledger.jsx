import React, { useState, useRef, useEffect } from 'react';
import { DollarSign, ArrowUpRight, ArrowDownRight, Plus, Filter, Calendar, X, CreditCard, Upload, Camera, Paperclip, Check, Eye, Edit3, Trash2, Landmark, FileText, Printer, Building, Layers, ArrowUpDown, Calculator, RotateCcw } from 'lucide-react';
import ReceiptModal from './ReceiptModal';
import ExpenseReceiptModal from './ExpenseReceiptModal';

export default function Ledger({ transactions, projects, personnel, onAddTransaction, onUpdateTransaction, userRole }) {
  const [filterType, setFilterType] = useState('all'); // 'all' | 'income' | 'expense'
  const [filterProject, setFilterProject] = useState('all'); // 'all' | projectId
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPersonnel, setFilterPersonnel] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showCanceled, setShowCanceled] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' = más nuevo primero, 'asc' = más viejo primero

  const [uploadMode, setUploadMode] = useState('file'); // 'file' | 'camera'
  const [fileBase64, setFileBase64] = useState('');
  const [fileName, setFileName] = useState('');
  const [previewReceipt, setPreviewReceipt] = useState(null);

  // Official Printable Receipts Modals
  const [showClientReceipt, setShowClientReceipt] = useState(null); // { project, payment }
  const [showExpenseReceipt, setShowExpenseReceipt] = useState(null); // { project, transaction }

  // Camera states
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState('');

  const [selectedTx, setSelectedTx] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTxData, setEditTxData] = useState(null);

  // Sync edit form with selected transaction
  useEffect(() => {
    if (selectedTx) {
      setEditTxData({
        id: selectedTx.id,
        projectId: selectedTx.projectId || 'general',
        type: selectedTx.type,
        category: selectedTx.category,
        milestoneId: selectedTx.milestoneId || '',
        method: selectedTx.method || 'Transferencia',
        description: selectedTx.description,
        amount: selectedTx.amount,
        date: selectedTx.date,
        receiptBase64: selectedTx.receiptBase64 || ''
      });
      setUploadMode('file');
      setFileBase64(selectedTx.receiptBase64 || '');
      setFileName(selectedTx.receiptBase64 ? 'Comprobante cargado' : '');
      setCapturedImage('');
    } else {
      setEditTxData(null);
    }
  }, [selectedTx]);

  // Turn off camera stream when modal closes
  useEffect(() => {
    if (!showAddModal) {
      stopCamera();
    }
  }, [showAddModal]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stream]);

  const startCamera = async () => {
    setCapturedImage('');
    setFileBase64('');
    setFileName('');
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setCameraActive(true);
    } catch (err) {
      console.error('Error accessing camera:', err);
      alert('No se pudo acceder a la cámara. Revisa los permisos o sube un archivo.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/png');
    setCapturedImage(dataUrl);
    setFileName(`soporte_${new Date().getTime()}.png`);
    stopCamera();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setFileBase64(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // New Transaction Form State
  const [txData, setTxData] = useState({
    projectId: 'general', // 'general' or specific projectId
    type: 'expense',
    category: 'materials',
    milestoneId: '',
    method: 'Transferencia',
    budgetItemId: '',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    personnelId: ''
  });

  // Category labels translator
  const getCategoryLabel = (category) => {
    switch (category) {
      case 'client_payment': return 'Cobro a Cliente';
      case 'materials': return 'Materiales y Suministros';
      case 'labor': return 'Mano de Obra';
      case 'permits': return 'Licencias y Permisos';
      case 'administrative': return 'Administrativo / Oficina';
      default: return category;
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTxData(prev => {
      const next = { ...prev, [name]: value };

      // If user switches project or type, update default category / milestone
      if (name === 'projectId' && value !== 'general') {
        const selProj = projects.find(p => p.id === value);
        if (next.type === 'income' && selProj?.paymentPlan?.length > 0) {
          const firstUnpaid = selProj.paymentPlan.find(m => {
            const mPaid = (m.payments || []).reduce((s, p) => s + p.amount, 0) || (m.status === 'paid' ? m.amount : 0);
            return mPaid < m.amount;
          }) || selProj.paymentPlan[0];
          if (firstUnpaid && !next.milestoneId) {
            next.milestoneId = firstUnpaid.id;
          }
        }
      }

      if (name === 'type') {
        if (value === 'income') {
          next.category = 'client_payment';
          if (next.projectId !== 'general') {
            const selProj = projects.find(p => p.id === next.projectId);
            if (selProj?.paymentPlan?.length > 0) {
              const firstUnpaid = selProj.paymentPlan.find(m => {
                const mPaid = (m.payments || []).reduce((s, p) => s + p.amount, 0) || (m.status === 'paid' ? m.amount : 0);
                return mPaid < m.amount;
              }) || selProj.paymentPlan[0];
              next.milestoneId = firstUnpaid?.id || '';
            }
          }
        } else {
          next.category = 'materials';
          next.milestoneId = '';
        }
      }

      return next;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const amt = parseFloat(txData.amount);
    if (!txData.description.trim() || amt <= 0) {
      alert('Ingresa detalles y monto válidos.');
      return;
    }

    // Lookup project name
    let projName = 'Administración General';
    let targetProject = null;
    if (txData.projectId !== 'general') {
      targetProject = projects.find(p => p.id === txData.projectId);
      if (targetProject) projName = targetProject.name;
    }

    let personnelName = null;
    if (txData.personnelId && personnel) {
      const p = personnel.find(per => per.id === txData.personnelId);
      if (p) personnelName = p.name;
    }

    let milestoneName = null;
    if (txData.type === 'income' && targetProject && txData.milestoneId) {
      const m = targetProject.paymentPlan?.find(item => item.id === txData.milestoneId);
      if (m) milestoneName = m.name;
    }

    const receiptImg = uploadMode === 'file' ? fileBase64 : capturedImage;

    const newTx = {
      projectId: txData.projectId,
      projectName: projName,
      type: txData.type,
      category: txData.category,
      milestoneId: txData.milestoneId || null,
      milestoneName: milestoneName,
      method: txData.method || 'Transferencia',
      budgetItemId: txData.budgetItemId || null,
      description: txData.description,
      amount: amt,
      date: txData.date,
      receiptBase64: receiptImg || null,
      files: receiptImg ? [{ fileName: fileName || 'Comprobante de Caja', fileType: 'image', fileBase64: receiptImg }] : [],
      personnelId: txData.personnelId || null,
      personnelName: personnelName
    };

    onAddTransaction(newTx);
    
    // Reset
    setTxData({
      projectId: 'general',
      type: 'expense',
      category: 'materials',
      milestoneId: '',
      method: 'Transferencia',
      budgetItemId: '',
      description: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      personnelId: ''
    });
    setUploadMode('file');
    setFileBase64('');
    setFileName('');
    setCapturedImage('');
    setShowAddModal(false);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    const amt = parseFloat(editTxData.amount);
    if (!editTxData.description.trim() || amt <= 0) {
      alert('Ingresa detalles y monto válidos.');
      return;
    }

    // Lookup project name
    let projName = 'Administración General';
    let targetProject = null;
    if (editTxData.projectId !== 'general') {
      targetProject = projects.find(p => p.id === editTxData.projectId);
      if (targetProject) projName = targetProject.name;
    }

    let personnelName = null;
    if (editTxData.personnelId && personnel) {
      const p = personnel.find(per => per.id === editTxData.personnelId);
      if (p) personnelName = p.name;
    }

    let milestoneName = null;
    if (editTxData.type === 'income' && targetProject && editTxData.milestoneId) {
      const m = targetProject.paymentPlan?.find(item => item.id === editTxData.milestoneId);
      if (m) milestoneName = m.name;
    }

    const receiptImg = uploadMode === 'file' ? fileBase64 : capturedImage;

    const updatedTx = {
      ...selectedTx,
      projectId: editTxData.projectId,
      projectName: projName,
      type: editTxData.type,
      category: editTxData.category,
      milestoneId: editTxData.milestoneId || selectedTx.milestoneId || null,
      milestoneName: milestoneName || selectedTx.milestoneName || null,
      method: editTxData.method || selectedTx.method || 'Transferencia',
      description: editTxData.description,
      amount: amt,
      date: editTxData.date,
      receiptBase64: receiptImg || selectedTx.receiptBase64 || null,
      files: receiptImg ? [{ fileName: fileName || 'Comprobante de Caja', fileType: 'image', fileBase64: receiptImg }] : (selectedTx.files || []),
      personnelId: editTxData.personnelId || null,
      personnelName: personnelName
    };

    onUpdateTransaction(updatedTx, selectedTx);
    
    // Close modal
    setSelectedTx(null);
    setIsEditing(false);
  };

  const handleOpenReceiptForTx = (tx) => {
    if (tx.type === 'income') {
      const proj = projects.find(p => p.id === tx.projectId) || {
        id: tx.projectId || 'OBRA',
        name: tx.projectName || 'Proyecto',
        clientName: 'Cliente Registrado',
        totalCost: tx.amount,
        paymentPlan: []
      };

      let milestone = null;
      if (proj.paymentPlan && proj.paymentPlan.length > 0) {
        if (tx.milestoneId) {
          milestone = proj.paymentPlan.find(m => m.id === tx.milestoneId);
        }
        if (!milestone && tx.paymentId) {
          milestone = proj.paymentPlan.find(m => m.payments && m.payments.some(p => p.id === tx.paymentId));
        }
        if (!milestone && tx.id) {
          milestone = proj.paymentPlan.find(m => m.payments && m.payments.some(p => String(tx.id).includes(p.id) || p.id === tx.id));
        }
      }

      if (milestone) {
        const exactPayment = milestone.payments?.find(p => p.id === tx.paymentId || String(tx.id).includes(p.id)) || {
          id: tx.paymentId || tx.id,
          amount: tx.amount,
          date: tx.date,
          method: tx.method || 'Transferencia',
          files: tx.receiptBase64 ? [{ fileName: 'Comprobante', fileType: 'image', fileBase64: tx.receiptBase64 }] : (tx.files || [])
        };

        setShowClientReceipt({
          project: proj,
          payment: {
            ...milestone,
            id: exactPayment.id || milestone.id,
            paidDate: exactPayment.date || tx.date,
            amount: exactPayment.amount || tx.amount,
            payments: [exactPayment]
          }
        });
      } else {
        setShowClientReceipt({
          project: proj,
          payment: {
            id: tx.id ? String(tx.id).replace('tx_', '') : 'PAG1',
            name: tx.description || 'Cobro / Abono a Obra',
            amount: tx.amount,
            percentage: 100,
            status: 'paid',
            paidDate: tx.date,
            payments: [{
              id: tx.paymentId || tx.id,
              amount: tx.amount,
              date: tx.date,
              method: tx.method || 'Transferencia',
              files: tx.receiptBase64 ? [{ fileName: 'Comprobante de Caja', fileType: 'image', fileBase64: tx.receiptBase64 }] : (tx.files || [])
            }]
          }
        });
      }
    } else if (tx.type === 'expense') {
      const proj = projects.find(p => p.id === tx.projectId) || {
        id: 'GEN',
        name: tx.projectName || 'Administración General',
        clientName: 'Grupo Empresarial Habitech SAS',
        clientPhone: '3124147911',
        clientEmail: 'contacto@constructorahabitech.com',
        location: { address: 'km 4 via villavicencio acacias, lote 1 barrio la nohora' }
      };

      setShowExpenseReceipt({
        project: proj,
        transaction: tx
      });
    }
  };

  const handleAnularTransaction = async (tx) => {
    if (!await window.confirmDialog('¿Estás seguro de anular esta transacción? Su monto pasará a $0 y quedará registrada como anulada.')) {
      return;
    }

    const updatedTx = {
      ...tx,
      description: `[ANULADO] (Monto original: ${formatCurrency(tx.amount)}) - ${tx.description}`,
      amount: 0
    };

    onUpdateTransaction(updatedTx, tx);
    setSelectedTx(null);
  };

  // Filtered transactions
  const filteredTxs = transactions.filter(t => {
    const isCanceled = t.description.startsWith('[CANCELADO]') || t.description.startsWith('[ANULADO]');
    if (!showCanceled && isCanceled) {
      return false; // Hide canceled transactions by default
    }

    const typeMatch = filterType === 'all' || t.type === filterType;
    const projectMatch = filterProject === 'all' || t.projectId === filterProject;
    
    // Category and Personnel filters
    const categoryMatch = filterCategory === 'all' || t.category === filterCategory;
    const personnelMatch = filterPersonnel === 'all' || String(t.personnelId) === filterPersonnel;
    
    // Date range filter
    let dateMatch = true;
    if (startDate) {
      dateMatch = dateMatch && (t.date >= startDate);
    }
    if (endDate) {
      dateMatch = dateMatch && (t.date <= endDate);
    }
    
    return typeMatch && projectMatch && categoryMatch && personnelMatch && dateMatch;
  }).sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    if (dateA !== dateB) {
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    }
    // Fallback to sort by ID if same date
    return sortOrder === 'desc' 
      ? String(b.id).localeCompare(String(a.id))
      : String(a.id).localeCompare(String(b.id));
  });

  // Privilege check: Admin and Editor can view filtered totals in Caja General
  const canViewFilteredTotals = userRole === 'admin' || userRole === 'editor' || (!userRole);

  // Check if any filter is active
  const hasActiveFilters = 
    filterType !== 'all' || 
    filterProject !== 'all' || 
    filterCategory !== 'all' || 
    filterPersonnel !== 'all' || 
    Boolean(startDate) || 
    Boolean(endDate);

  // Active (non-canceled) transactions in the filtered list
  const activeFilteredTxs = filteredTxs.filter(t => {
    const isCanceled = t.description?.startsWith('[CANCELADO]') || t.description?.startsWith('[ANULADO]');
    return !isCanceled;
  });

  // Filter sums (sum of expenses, sum of income, net balance of active filters)
  const filteredIncome = activeFilteredTxs
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const filteredExpenses = activeFilteredTxs
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const filteredNet = filteredIncome - filteredExpenses;

  // Selected filter labels
  const selectedPersonnelObj = personnel?.find(p => String(p.id) === filterPersonnel);
  const selectedProjectObj = projects?.find(p => p.id === filterProject);

  const handleResetFilters = () => {
    setFilterType('all');
    setFilterProject('all');
    setFilterCategory('all');
    setFilterPersonnel('all');
    setStartDate('');
    setEndDate('');
    setShowCanceled(false);
  };

  // Metric calculations (reactive to project filter)
  const activeProjectsForMetrics = filterProject === 'all' 
    ? projects 
    : projects.filter(p => p.id === filterProject);

  const totalContracted = activeProjectsForMetrics.reduce((sum, p) => sum + (p.totalCost || 0), 0);

  // Filters for metrics (excluding canceled transactions)
  const activeTxsForMetrics = transactions.filter(t => {
    const isCanceled = t.description?.startsWith('[CANCELADO]') || t.description?.startsWith('[ANULADO]');
    if (isCanceled) return false;
    const projectMatch = filterProject === 'all' || t.projectId === filterProject;
    return projectMatch;
  });

  const totalCollected = activeTxsForMetrics
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const totalExpenses = activeTxsForMetrics
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const remainingToCollect = Math.max(0, totalContracted - totalCollected);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="ledger-view animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <h1>Libro de Caja General</h1>
        {userRole !== 'viewer' && (
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={16} /> Registrar Transacción Manual
          </button>
        )}
      </div>

      {/* Financial ledger metrics */}
      {canViewFilteredTotals && hasActiveFilters && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(6, 182, 212, 0.08)',
          border: '1px solid rgba(6, 182, 212, 0.25)',
          padding: '10px 16px',
          borderRadius: '10px',
          marginBottom: '18px',
          fontSize: '0.85rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
            <Filter size={15} style={{ color: 'var(--primary-cyan)' }} />
            <span>
              Métricas calculadas para <strong>{activeFilteredTxs.length} movimientos filtrados</strong>
              {selectedPersonnelObj && ` • Personal: ${selectedPersonnelObj.name}`}
              {filterCategory !== 'all' && ` • Categoría: ${getCategoryLabel(filterCategory)}`}
              {filterProject !== 'all' && ` • Obra: ${filterProject === 'general' ? 'Gastos Administrativos' : selectedProjectObj?.name || 'Seleccionada'}`}
              {(startDate || endDate) && ` • Fechas: ${startDate || '...'} a ${endDate || '...'}`}
            </span>
          </div>
          <button
            type="button"
            onClick={handleResetFilters}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid var(--border-glass)',
              color: 'var(--primary-cyan)',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
            title="Restablecer todos los filtros"
          >
            <RotateCcw size={13} /> Limpiar filtros
          </button>
        </div>
      )}

      <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <div className="glass-panel metric-card" style={{ padding: '18px 22px' }}>
          <div className="metric-info">
            <h3>{canViewFilteredTotals && hasActiveFilters && (filterPersonnel !== 'all' || filterCategory !== 'all' || startDate || endDate) ? 'Movimientos Filtrados' : 'Presupuesto Contratado'}</h3>
            <div className="metric-value" style={{ color: 'var(--primary-orange)' }}>
              {canViewFilteredTotals && hasActiveFilters && (filterPersonnel !== 'all' || filterCategory !== 'all' || startDate || endDate)
                ? activeFilteredTxs.length
                : formatCurrency(totalContracted)}
            </div>
            {canViewFilteredTotals && hasActiveFilters && (filterPersonnel !== 'all' || filterCategory !== 'all' || startDate || endDate) && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>transacciones activas</span>
            )}
          </div>
          <div className="metric-icon orange">
            {canViewFilteredTotals && hasActiveFilters && (filterPersonnel !== 'all' || filterCategory !== 'all' || startDate || endDate)
              ? <Layers size={20} style={{ color: 'var(--primary-orange)' }} />
              : <Landmark size={20} style={{ color: 'var(--primary-orange)' }} />}
          </div>
        </div>

        <div className="glass-panel metric-card" style={{ padding: '18px 22px' }}>
          <div className="metric-info">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <h3>Total Cobrado (Ingresos)</h3>
              {canViewFilteredTotals && hasActiveFilters && (
                <span className="badge" style={{ fontSize: '0.65rem', padding: '1px 5px', background: 'rgba(20, 184, 166, 0.15)', color: 'var(--primary-teal)' }}>Filtro</span>
              )}
            </div>
            <div className="metric-value" style={{ color: 'var(--primary-teal)' }}>
              {formatCurrency(canViewFilteredTotals && hasActiveFilters ? filteredIncome : totalCollected)}
            </div>
            {canViewFilteredTotals && hasActiveFilters && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {activeFilteredTxs.filter(t => t.type === 'income').length} cobros
              </span>
            )}
          </div>
          <div className="metric-icon green">
            <ArrowUpRight size={20} />
          </div>
        </div>

        <div className="glass-panel metric-card" style={{ padding: '18px 22px' }}>
          <div className="metric-info">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <h3>{canViewFilteredTotals && hasActiveFilters && (filterPersonnel !== 'all' || filterCategory !== 'all' || startDate || endDate || filterType !== 'all') ? 'Balance Neto Filtro' : 'Saldo por Cobrar'}</h3>
              {canViewFilteredTotals && hasActiveFilters && (
                <span className="badge" style={{ fontSize: '0.65rem', padding: '1px 5px', background: 'rgba(6, 182, 212, 0.15)', color: 'var(--primary-cyan)' }}>Filtro</span>
              )}
            </div>
            <div className="metric-value" style={{
              color: canViewFilteredTotals && hasActiveFilters && (filterPersonnel !== 'all' || filterCategory !== 'all' || startDate || endDate || filterType !== 'all')
                ? (filteredNet >= 0 ? 'var(--primary-teal)' : 'var(--primary-red)')
                : 'var(--primary-cyan)'
            }}>
              {canViewFilteredTotals && hasActiveFilters && (filterPersonnel !== 'all' || filterCategory !== 'all' || startDate || endDate || filterType !== 'all')
                ? `${filteredNet >= 0 ? '+' : ''}${formatCurrency(filteredNet)}`
                : formatCurrency(remainingToCollect)}
            </div>
            {canViewFilteredTotals && hasActiveFilters && (filterPersonnel !== 'all' || filterCategory !== 'all' || startDate || endDate || filterType !== 'all') && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ingresos - Egresos</span>
            )}
          </div>
          <div className="metric-icon purple">
            <DollarSign size={20} />
          </div>
        </div>

        <div className="glass-panel metric-card" style={{ padding: '18px 22px' }}>
          <div className="metric-info">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <h3>Gastos Realizados (Egresos)</h3>
              {canViewFilteredTotals && hasActiveFilters && (
                <span className="badge" style={{ fontSize: '0.65rem', padding: '1px 5px', background: 'rgba(244, 63, 94, 0.15)', color: 'var(--primary-red)' }}>Filtro</span>
              )}
            </div>
            <div className="metric-value" style={{ color: 'var(--primary-red)' }}>
              {formatCurrency(canViewFilteredTotals && hasActiveFilters ? filteredExpenses : totalExpenses)}
            </div>
            {canViewFilteredTotals && hasActiveFilters && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {activeFilteredTxs.filter(t => t.type === 'expense').length} gastos
              </span>
            )}
          </div>
          <div className="metric-icon red">
            <ArrowDownRight size={20} />
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="glass-panel" style={{ padding: '15px 20px', marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          <Filter size={16} />
          <span>Filtrar por:</span>
        </div>

        {/* Type Filter */}
        <select
          className="form-control"
          style={{ width: 'auto', minWidth: '150px' }}
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="all">Todos los Flujos</option>
          <option value="income">Solo Ingresos (Cobros)</option>
          <option value="expense">Solo Egresos (Gastos)</option>
        </select>

        {/* Project Filter */}
        <select
          className="form-control"
          style={{ width: 'auto', minWidth: '220px' }}
          value={filterProject}
          onChange={(e) => setFilterProject(e.target.value)}
        >
          <option value="all">Todas las Obras / General</option>
          <option value="general">Gastos Administrativos</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        {/* Category Filter */}
        <select
          className="form-control"
          style={{ width: 'auto', minWidth: '180px' }}
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="all">Todas las Categorías</option>
          <option value="client_payment">Cobro a Cliente</option>
          <option value="materials">Materiales y Suministros</option>
          <option value="labor">Mano de Obra</option>
          <option value="permits">Licencias y Permisos</option>
          <option value="administrative">Administrativo / Oficina</option>
        </select>

        {/* Personnel Filter */}
        <select
          className="form-control"
          style={{ width: 'auto', minWidth: '180px' }}
          value={filterPersonnel}
          onChange={(e) => setFilterPersonnel(e.target.value)}
        >
          <option value="all">Todo el Personal</option>
          {personnel && personnel.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        {/* Date Range Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Desde:</span>
          <input
            type="date"
            className="form-control"
            style={{ width: 'auto', padding: '6px 12px' }}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Hasta:</span>
          <input
            type="date"
            className="form-control"
            style={{ width: 'auto', padding: '6px 12px' }}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        {/* Clear Date Filters Button */}
        {(startDate || endDate) && (
          <button
            type="button"
            className="btn btn-secondary"
            style={{ padding: '6px 10px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
            onClick={() => {
              setStartDate('');
              setEndDate('');
            }}
          >
            <X size={12} /> Limpiar Fechas
          </button>
        )}

        {/* Sort Order Toggle Button */}
        <button
          type="button"
          className="btn btn-secondary"
          style={{
            padding: '6px 14px',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-glass-active)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            borderRadius: '8px',
            transition: 'all 0.2s'
          }}
          onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
          title="Click para alternar: Más nuevo a más viejo / Más viejo a más nuevo"
        >
          <ArrowUpDown size={15} style={{ color: 'var(--primary-cyan)' }} />
          <span>
            Orden: <strong style={{ color: 'var(--primary-cyan)' }}>{sortOrder === 'desc' ? 'Más Nuevo a Más Viejo 🔽' : 'Más Viejo a Más Nuevo 🔼'}</strong>
          </span>
        </button>

        {/* Toggle show canceled */}
        <label style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          fontSize: '0.85rem', 
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          userSelect: 'none',
          padding: '6px 12px',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--border-glass)',
          borderRadius: '8px',
          transition: 'all 0.2s',
          marginLeft: 'auto'
        }}
        onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'}
        onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-glass)'}
        >
          <input
            type="checkbox"
            checked={showCanceled}
            onChange={(e) => setShowCanceled(e.target.checked)}
            style={{ 
              accentColor: 'var(--primary-cyan)',
              cursor: 'pointer'
            }}
          />
          <span>Mostrar Anulados</span>
        </label>

        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Mostrando {filteredTxs.length} registros
        </span>
      </div>

      {/* Filter Totals Summary Panel for Admin and Editor */}
      {canViewFilteredTotals && (
        <div className="glass-panel animate-fade-in" style={{
          padding: '16px 20px',
          marginBottom: '20px',
          background: hasActiveFilters 
            ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.05) 0%, rgba(16, 185, 129, 0.04) 50%, rgba(244, 63, 94, 0.04) 100%)'
            : 'rgba(255, 255, 255, 0.02)',
          border: hasActiveFilters ? '1px solid rgba(6, 182, 212, 0.25)' : '1px solid var(--border-glass)',
          borderRadius: '12px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: 700,
                fontSize: '0.95rem',
                color: 'var(--text-primary)'
              }}>
                <Calculator size={18} style={{ color: 'var(--primary-cyan)' }} />
                <span>{hasActiveFilters ? 'Suma de Totales según Filtros Aplicados' : 'Totales Globales de Caja'}</span>
              </div>
              
              {hasActiveFilters && (
                <span className="badge" style={{
                  background: 'rgba(6, 182, 212, 0.15)',
                  color: 'var(--primary-cyan)',
                  border: '1px solid rgba(6, 182, 212, 0.3)',
                  fontSize: '0.75rem',
                  padding: '2px 8px'
                }}>
                  Filtro activo ({activeFilteredTxs.length} registros)
                </span>
              )}
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                style={{
                  background: 'rgba(244, 63, 94, 0.08)',
                  border: '1px solid rgba(244, 63, 94, 0.25)',
                  color: '#fda4af',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.2s'
                }}
                title="Quitar todos los filtros aplicados"
              >
                <X size={12} /> Limpiar todos los filtros
              </button>
            )}
          </div>

          {/* Badges of active filters */}
          {hasActiveFilters && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
              {filterPersonnel !== 'all' && (
                <span style={{
                  background: 'rgba(168, 85, 247, 0.15)',
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                  color: '#d8b4fe',
                  padding: '3px 10px',
                  borderRadius: '16px',
                  fontSize: '0.8rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  👤 Personal: <strong>{selectedPersonnelObj?.name || 'Seleccionado'}</strong>
                </span>
              )}
              {filterCategory !== 'all' && (
                <span style={{
                  background: 'rgba(245, 158, 11, 0.15)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  color: 'var(--primary-orange)',
                  padding: '3px 10px',
                  borderRadius: '16px',
                  fontSize: '0.8rem'
                }}>
                  🏷️ Categoría: <strong>{getCategoryLabel(filterCategory)}</strong>
                </span>
              )}
              {filterType !== 'all' && (
                <span style={{
                  background: filterType === 'income' ? 'rgba(20, 184, 166, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                  border: filterType === 'income' ? '1px solid rgba(20, 184, 166, 0.3)' : '1px solid rgba(244, 63, 94, 0.3)',
                  color: filterType === 'income' ? 'var(--primary-teal)' : '#fda4af',
                  padding: '3px 10px',
                  borderRadius: '16px',
                  fontSize: '0.8rem'
                }}>
                  🔄 Flujo: <strong>{filterType === 'income' ? 'Solo Ingresos' : 'Solo Egresos'}</strong>
                </span>
              )}
              {filterProject !== 'all' && (
                <span style={{
                  background: 'rgba(56, 189, 248, 0.15)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  color: 'var(--primary-cyan)',
                  padding: '3px 10px',
                  borderRadius: '16px',
                  fontSize: '0.8rem'
                }}>
                  🏢 Obra: <strong>{filterProject === 'general' ? 'Gastos Administrativos' : (selectedProjectObj?.name || 'Seleccionada')}</strong>
                </span>
              )}
              {(startDate || endDate) && (
                <span style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid var(--border-glass)',
                  color: 'var(--text-secondary)',
                  padding: '3px 10px',
                  borderRadius: '16px',
                  fontSize: '0.8rem'
                }}>
                  📅 Fechas: <strong>{startDate || 'Inicio'} → {endDate || 'Hoy'}</strong>
                </span>
              )}
            </div>
          )}

          {/* Sum metric cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '12px'
          }}>
            {/* Sum of Expenses */}
            <div style={{
              background: 'rgba(244, 63, 94, 0.08)',
              border: '1px solid rgba(244, 63, 94, 0.25)',
              borderRadius: '10px',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#fda4af', fontWeight: 600, marginBottom: '4px' }}>
                  Suma de Egresos (Gastos)
                </div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary-red)' }}>
                  {formatCurrency(filteredExpenses)}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {activeFilteredTxs.filter(t => t.type === 'expense').length} movimientos de egreso
                </div>
              </div>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(244, 63, 94, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary-red)'
              }}>
                <ArrowDownRight size={20} />
              </div>
            </div>

            {/* Sum of Income */}
            <div style={{
              background: 'rgba(20, 184, 166, 0.08)',
              border: '1px solid rgba(20, 184, 166, 0.25)',
              borderRadius: '10px',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#5eead4', fontWeight: 600, marginBottom: '4px' }}>
                  Suma de Ingresos (Cobros)
                </div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary-teal)' }}>
                  {formatCurrency(filteredIncome)}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {activeFilteredTxs.filter(t => t.type === 'income').length} movimientos de ingreso
                </div>
              </div>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(20, 184, 166, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary-teal)'
              }}>
                <ArrowUpRight size={20} />
              </div>
            </div>

            {/* Net Balance */}
            <div style={{
              background: filteredNet >= 0 ? 'rgba(20, 184, 166, 0.05)' : 'rgba(244, 63, 94, 0.05)',
              border: filteredNet >= 0 ? '1px solid rgba(20, 184, 166, 0.2)' : '1px solid rgba(244, 63, 94, 0.2)',
              borderRadius: '10px',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '4px' }}>
                  Balance Neto {hasActiveFilters ? 'del Filtro' : 'de Caja'}
                </div>
                <div style={{
                  fontSize: '1.35rem',
                  fontWeight: 800,
                  color: filteredNet >= 0 ? 'var(--primary-teal)' : 'var(--primary-red)'
                }}>
                  {filteredNet >= 0 ? '+' : ''}{formatCurrency(filteredNet)}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Ingresos menos Egresos
                </div>
              </div>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: filteredNet >= 0 ? 'rgba(20, 184, 166, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: filteredNet >= 0 ? 'var(--primary-teal)' : 'var(--primary-red)'
              }}>
                <DollarSign size={20} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ledger Table */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        {filteredTxs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
            No se encontraron transacciones con los filtros seleccionados.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '750px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-glass)' }}>
                  <th 
                    onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                    style={{ 
                      padding: '12px', 
                      color: 'var(--text-secondary)', 
                      fontSize: '0.85rem', 
                      cursor: 'pointer',
                      userSelect: 'none',
                      whiteSpace: 'nowrap'
                    }}
                    title="Click para alternar orden: más nuevo / más viejo"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>Fecha</span>
                      <ArrowUpDown size={13} style={{ color: 'var(--primary-cyan)' }} />
                      <span style={{ fontSize: '0.7rem', color: 'var(--primary-cyan)', fontWeight: 700 }}>
                        {sortOrder === 'desc' ? '▼ Más nuevo' : '▲ Más viejo'}
                      </span>
                    </div>
                  </th>
                  <th style={{ padding: '12px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Obra / Destino</th>
                  <th style={{ padding: '12px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Tipo</th>
                  <th style={{ padding: '12px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Categoría</th>
                  <th style={{ padding: '12px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Concepto / Detalles</th>
                  <th style={{ padding: '12px', color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'right' }}>Monto</th>
                  <th style={{ padding: '12px', color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'center', width: '130px' }}>Comprobante</th>
                  <th style={{ padding: '12px', color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'center', width: '70px' }}>Ver</th>
                </tr>
              </thead>
              <tbody>
                {filteredTxs.map((tx) => {
                  const isInc = tx.type === 'income';
                  const isCanceled = tx.description.startsWith('[CANCELADO]') || tx.description.startsWith('[ANULADO]');
                  return (
                    <tr key={tx.id} style={{ 
                      borderBottom: '1px solid var(--border-glass)',
                      opacity: isCanceled ? 0.55 : 1,
                      background: isCanceled ? 'rgba(255, 255, 255, 0.01)' : 'transparent'
                    }}>
                      <td style={{ padding: '14px 12px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        {tx.date}
                      </td>
                      <td style={{ padding: '14px 12px', fontWeight: 600 }}>
                        {tx.projectName}
                      </td>
                      <td style={{ padding: '14px 12px' }}>
                        {isCanceled ? (
                          <span className="badge" style={{ fontSize: '0.65rem', background: 'rgba(239, 68, 68, 0.12)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.25)' }}>Anulado</span>
                        ) : isInc ? (
                          <span className="badge badge-completed" style={{ fontSize: '0.65rem' }}>Entrada</span>
                        ) : (
                          <span className="badge badge-danger" style={{ fontSize: '0.65rem', background: 'rgba(244,63,94,0.15)', color: '#fda4af', border: '1px solid rgba(244,63,94,0.3)' }}>Salida</span>
                        )}
                      </td>
                      <td style={{ padding: '14px 12px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        {getCategoryLabel(tx.category)}
                      </td>
                      <td style={{ padding: '14px 12px', fontSize: '0.9rem', color: isCanceled ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ textDecoration: isCanceled ? 'line-through' : 'none' }}>{tx.description}</span>
                          {tx.personnelName && (
                            <span style={{ 
                              background: 'rgba(168, 85, 247, 0.1)', 
                              border: '1px solid rgba(168, 85, 247, 0.2)', 
                              color: '#d8b4fe', 
                              padding: '2px 8px', 
                              borderRadius: '12px', 
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              whiteSpace: 'nowrap'
                            }}>
                              👤 {tx.personnelName}
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ 
                        padding: '14px 12px', 
                        textAlign: 'right', 
                        fontWeight: 700, 
                        color: isCanceled ? 'var(--text-muted)' : isInc ? 'var(--primary-teal)' : 'var(--primary-red)',
                        textDecoration: isCanceled ? 'line-through' : 'none'
                      }}>
                        {isCanceled ? '' : isInc ? '+' : '-'} {formatCurrency(tx.amount)}
                      </td>
                      <td style={{ padding: '14px 12px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          {!isCanceled && (
                            <button
                              type="button"
                              onClick={() => handleOpenReceiptForTx(tx)}
                              style={{
                                background: isInc ? 'rgba(20, 184, 166, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                                border: isInc ? '1px solid rgba(20, 184, 166, 0.3)' : '1px solid rgba(244, 63, 94, 0.3)',
                                color: isInc ? 'var(--primary-teal)' : '#fda4af',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                cursor: 'pointer',
                                fontWeight: 600,
                                transition: 'all 0.2s'
                              }}
                              title={isInc ? 'Ver / Imprimir Recibo Oficial de Caja' : 'Ver / Imprimir Comprobante de Egreso'}
                            >
                              <FileText size={12} /> {isInc ? 'Recibo' : 'Egreso'}
                            </button>
                          )}
                          {tx.receiptBase64 && (
                            <button
                              type="button"
                              onClick={() => setPreviewReceipt(tx)}
                              style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid var(--border-glass)',
                                color: 'var(--primary-cyan)',
                                padding: '4px 6px',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '2px',
                                cursor: 'pointer'
                              }}
                              title="Ver Comprobante / Foto Adjunta"
                            >
                              <Paperclip size={12} />
                            </button>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '14px 12px', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setEditTxData({
                              id: tx.id,
                              projectId: tx.projectId,
                              type: tx.type,
                              category: tx.category,
                              milestoneId: tx.milestoneId || '',
                              method: tx.method || 'Transferencia',
                              description: tx.description,
                              amount: tx.amount,
                              date: tx.date,
                              personnelId: tx.personnelId || ''
                            });
                            setSelectedTx(tx);
                            setIsEditing(false);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--primary-cyan)',
                            cursor: 'pointer',
                            padding: '4px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'color 0.2s'
                          }}
                          title="Ver detalle / Editar"
                        >
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {canViewFilteredTotals && filteredTxs.length > 0 && (
                <tfoot>
                  <tr style={{ 
                    borderTop: '2px solid var(--border-glass-active)',
                    background: 'rgba(255, 255, 255, 0.03)'
                  }}>
                    <td colSpan={4} style={{ padding: '14px 12px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <strong style={{ color: 'var(--text-primary)' }}>TOTAL SEGÚN FILTROS:</strong>
                        <span>({activeFilteredTxs.length} transacciones activas)</span>
                        {hasActiveFilters && (
                          <span className="badge" style={{ background: 'rgba(6, 182, 212, 0.15)', color: 'var(--primary-cyan)', fontSize: '0.7rem' }}>
                            Filtro Activo
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '14px 12px', fontSize: '0.85rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {filteredIncome > 0 && (
                          <span style={{ color: 'var(--primary-teal)', fontWeight: 600 }}>Cobros: +{formatCurrency(filteredIncome)}</span>
                        )}
                        {filteredExpenses > 0 && (
                          <span style={{ color: 'var(--primary-red)', fontWeight: 600 }}>Gastos: -{formatCurrency(filteredExpenses)}</span>
                        )}
                      </div>
                    </td>
                    <td style={{ 
                      padding: '14px 12px', 
                      textAlign: 'right', 
                      fontSize: '1rem', 
                      fontWeight: 800, 
                      color: filterType === 'income' 
                        ? 'var(--primary-teal)' 
                        : filterType === 'expense' 
                          ? 'var(--primary-red)' 
                          : (filteredNet >= 0 ? 'var(--primary-teal)' : 'var(--primary-red)')
                    }}>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 400, textTransform: 'uppercase' }}>
                        {filterType === 'income' ? 'Total Ingresos' : filterType === 'expense' ? 'Total Egresos' : 'Balance Neto'}
                      </div>
                      {filterType === 'income' 
                        ? `+ ${formatCurrency(filteredIncome)}` 
                        : filterType === 'expense' 
                          ? `- ${formatCurrency(filteredExpenses)}` 
                          : `${filteredNet >= 0 ? '+' : ''}${formatCurrency(filteredNet)}`}
                    </td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>

      {/* MANUAL TRANSACTION DIALOG MODAL */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CreditCard size={20} style={{ color: 'var(--primary-cyan)' }} />
                Registrar Movimiento de Caja Manual
              </h3>
              <button className="btn-icon" onClick={() => setShowAddModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>Tipo de Flujo</label>
                    <select
                      name="type"
                      className="form-control"
                      value={txData.type}
                      onChange={handleInputChange}
                    >
                      <option value="expense">Salida / Egreso (Gasto)</option>
                      <option value="income">Entrada / Ingreso (Cobro)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Categoría</label>
                    <select
                      name="category"
                      className="form-control"
                      value={txData.category}
                      onChange={handleInputChange}
                    >
                      {txData.type === 'expense' ? (
                        <>
                          <option value="materials">Materiales y Suministros</option>
                          <option value="labor">Mano de Obra</option>
                          <option value="permits">Licencias o Impuestos</option>
                          <option value="administrative">Administrativo / Oficina</option>
                        </>
                      ) : (
                        <>
                          <option value="client_payment">Cobro a Cliente</option>
                          <option value="administrative">Otros Ingresos</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Asociar a Obra / Proyecto</label>
                  <select
                    name="projectId"
                    className="form-control"
                    value={txData.projectId}
                    onChange={handleInputChange}
                  >
                    <option value="general">Gasto Operativo General (No atado a obra)</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name} — ({p.clientName})</option>
                    ))}
                  </select>
                </div>

                {/* If Income and linked to a project, show Milestone (Hito de Pago) Selector */}
                {txData.type === 'income' && txData.projectId !== 'general' && (
                  <div style={{ background: 'rgba(20, 184, 166, 0.05)', border: '1px solid rgba(20, 184, 166, 0.2)', padding: '12px', borderRadius: '8px', marginBottom: '15px' }}>
                    <div className="form-group" style={{ marginBottom: '10px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary-teal)', fontWeight: 700 }}>
                        <Layers size={15} />
                        Hito de Pago Asociado de la Obra
                      </label>
                      <select
                        name="milestoneId"
                        className="form-control"
                        value={txData.milestoneId}
                        onChange={handleInputChange}
                      >
                        <option value="">-- Asignar automáticamente al primer hito pendiente --</option>
                        {projects.find(p => p.id === txData.projectId)?.paymentPlan?.map(m => {
                          const mPaid = (m.payments || []).reduce((s, p) => s + p.amount, 0) || (m.status === 'paid' ? m.amount : 0);
                          const mRest = Math.max(0, m.amount - mPaid);
                          return (
                            <option key={m.id} value={m.id}>
                              {m.name} ({m.percentage}%) — {mRest > 0 ? `Pendiente: ${formatCurrency(mRest)}` : 'Completado'} (Total: ${formatCurrency(m.amount)})
                            </option>
                          );
                        })}
                      </select>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        💡 Este pago se reflejará directamente en los pagos de la obra y actualizará su estado y saldo.
                      </p>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Método de Pago</label>
                      <select
                        name="method"
                        className="form-control"
                        value={txData.method}
                        onChange={handleInputChange}
                      >
                        <option value="Transferencia">Transferencia Bancaria</option>
                        <option value="Efectivo">Efectivo en Caja</option>
                        <option value="Consignación">Consignación Bancaria</option>
                        <option value="Cheque">Cheque</option>
                      </select>
                    </div>
                  </div>
                )}

                {txData.type === 'expense' && personnel && personnel.length > 0 && (
                  <div className="form-group">
                    <label>Asociar Personal / Contratista (Opcional)</label>
                    <select
                      name="personnelId"
                      className="form-control"
                      value={txData.personnelId}
                      onChange={handleInputChange}
                    >
                      <option value="">-- No asociar a persona --</option>
                      {personnel.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.jobTitle || 'Sin cargo'})</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="form-group">
                  <label>Descripción / Concepto del Pago</label>
                  <input
                    type="text"
                    name="description"
                    className="form-control"
                    placeholder={txData.type === 'income' ? "Ej. Abono a hito de cimentación" : "Ej. Pago alquiler de andamios y escaleras"}
                    value={txData.description}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Valor ($)</label>
                    <input
                      type="number"
                      name="amount"
                      className="form-control"
                      placeholder="Ej. 750000"
                      value={txData.amount}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Fecha</label>
                    <input
                      type="date"
                      name="date"
                      className="form-control"
                      value={txData.date}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                {/* Soporte / Comprobante de Pago o Foto */}
                <div style={{ borderTop: '1px dashed var(--border-glass)', marginTop: '15px', paddingTop: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Adjuntar Soporte / Recibo (Opcional)</label>
                  
                  {/* Tabs */}
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', background: 'rgba(255,255,255,0.02)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                    <button
                      type="button"
                      className="btn"
                      style={{ flex: 1, padding: '6px 12px', fontSize: '0.8rem', background: uploadMode === 'file' ? 'var(--bg-glass)' : 'transparent', border: uploadMode === 'file' ? '1px solid var(--border-glass-active)' : '1px solid transparent', color: uploadMode === 'file' ? 'var(--primary-cyan)' : 'var(--text-secondary)' }}
                      onClick={() => { setUploadMode('file'); stopCamera(); }}
                    >
                      <Upload size={14} /> Archivo / Media
                    </button>
                    <button
                      type="button"
                      className="btn"
                      style={{ flex: 1, padding: '6px 12px', fontSize: '0.8rem', background: uploadMode === 'camera' ? 'var(--bg-glass)' : 'transparent', border: uploadMode === 'camera' ? '1px solid var(--border-glass-active)' : '1px solid transparent', color: uploadMode === 'camera' ? 'var(--primary-cyan)' : 'var(--text-secondary)' }}
                      onClick={() => { setUploadMode('camera'); startCamera(); }}
                    >
                      <Camera size={14} /> Tomar Foto
                    </button>
                  </div>

                  {uploadMode === 'file' ? (
                    <div style={{ border: '1px dashed var(--border-glass)', borderRadius: '8px', padding: '20px 10px', textAlign: 'center' }}>
                      <input
                        type="file"
                        id="tx-file-input"
                        style={{ display: 'none' }}
                        accept="image/*,application/pdf"
                        onChange={handleFileChange}
                      />
                      <label htmlFor="tx-file-input" style={{ cursor: 'pointer', display: 'block' }}>
                        <Upload size={24} style={{ color: 'var(--text-muted)', marginBottom: '8px' }} />
                        <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>
                          Examinar archivos...
                        </p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>PDF o imágenes de recibos</p>
                      </label>
                      {fileName && (
                        <div style={{ marginTop: '10px', fontSize: '0.85rem', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                          <Check size={12} /> {fileName}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                      {cameraActive && (
                        <div style={{ position: 'relative', width: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--primary-cyan)' }}>
                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            style={{ width: '100%', display: 'block', background: '#000' }}
                          />
                          <div style={{ position: 'absolute', bottom: '10px', left: '0', right: '0', display: 'flex', justifyContent: 'center' }}>
                            <button type="button" className="btn btn-primary" onClick={capturePhoto} style={{ borderRadius: '50%', width: '42px', height: '42px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Camera size={18} />
                            </button>
                          </div>
                        </div>
                      )}
                      
                      {capturedImage && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '100%' }}>
                          <div style={{ position: 'relative', width: '100%', maxWidth: '200px', border: '1px solid var(--border-glass)', borderRadius: '8px', overflow: 'hidden' }}>
                            <img src={capturedImage} alt="Captured" style={{ width: '100%', display: 'block' }} />
                            <div style={{ position: 'absolute', top: '5px', right: '5px', background: 'var(--primary-teal)', color: 'white', borderRadius: '50%', padding: '2px' }}>
                              <Check size={12} />
                            </div>
                          </div>
                        </div>
                      )}

                      {!cameraActive && !capturedImage && (
                        <button type="button" className="btn btn-secondary" onClick={startCamera} style={{ fontSize: '0.8rem' }}>
                          <Camera size={14} /> Iniciar Cámara
                        </button>
                      )}
                      {(cameraActive || capturedImage) && (
                        <button type="button" className="btn btn-secondary" onClick={startCamera} style={{ fontSize: '0.8rem' }}>
                          Reintentar Foto
                        </button>
                      )}
                    </div>
                  )}
                  <canvas ref={canvasRef} style={{ display: 'none' }} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => { setShowAddModal(false); stopCamera(); }}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Registrar Movimiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECEIPT PREVIEW MODAL */}
      {previewReceipt && (
        <div className="modal-overlay" onClick={() => setPreviewReceipt(null)}>
          <div className="modal-content" style={{ maxWidth: '600px', width: '90%', background: 'var(--bg-secondary)', padding: '20px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Paperclip size={20} style={{ color: 'var(--primary-cyan)' }} />
                Comprobante Adjunto
              </h3>
              <button className="btn-icon" onClick={() => setPreviewReceipt(null)}><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '15px' }}>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '15px', textAlign: 'center' }}>
                <strong>Movimiento:</strong> {previewReceipt.description} ({formatCurrency(previewReceipt.amount)})
              </p>
              {previewReceipt.receiptBase64.startsWith('data:application/pdf') ? (
                <iframe 
                  src={previewReceipt.receiptBase64} 
                  title="Comprobante PDF" 
                  style={{ width: '100%', height: '400px', border: 'none', borderRadius: '8px' }}
                />
              ) : (
                <img 
                  src={previewReceipt.receiptBase64} 
                  alt="Comprobante" 
                  style={{ maxWidth: '100%', maxHeight: '450px', objectFit: 'contain', borderRadius: '8px', border: '1px solid var(--border-glass)' }} 
                />
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setPreviewReceipt(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TRANSACTION DETAIL & EDIT MODAL */}
      {selectedTx && editTxData && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '550px', width: '90%' }}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isEditing ? (
                  <>
                    <Edit3 size={20} style={{ color: 'var(--primary-cyan)' }} />
                    Editar Movimiento de Caja
                  </>
                ) : (
                  <>
                    <Eye size={20} style={{ color: 'var(--primary-cyan)' }} />
                    Detalle de Transacción
                  </>
                )}
              </h3>
              <button className="btn-icon" onClick={() => { setSelectedTx(null); stopCamera(); }}><X size={18} /></button>
            </div>

            {isEditing ? (
              <form onSubmit={handleEditSubmit}>
                <div className="modal-body">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Tipo de Flujo</label>
                      <select
                        className="form-control"
                        value={editTxData.type}
                        onChange={(e) => setEditTxData(prev => ({ ...prev, type: e.target.value }))}
                      >
                        <option value="expense">Salida / Egreso (Gasto)</option>
                        <option value="income">Entrada / Ingreso (Cobro)</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Categoría</label>
                      <select
                        className="form-control"
                        value={editTxData.category}
                        onChange={(e) => setEditTxData(prev => ({ ...prev, category: e.target.value }))}
                      >
                        {editTxData.type === 'expense' ? (
                          <>
                            <option value="materials">Materiales y Suministros</option>
                            <option value="labor">Mano de Obra</option>
                            <option value="permits">Licencias o Impuestos</option>
                            <option value="administrative">Administrativo / Oficina</option>
                          </>
                        ) : (
                          <>
                            <option value="client_payment">Cobro a Cliente</option>
                            <option value="administrative">Otros Ingresos</option>
                          </>
                        )}
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Asociar a Obra / Proyecto</label>
                    <select
                      className="form-control"
                      value={editTxData.projectId}
                      onChange={(e) => setEditTxData(prev => ({ ...prev, projectId: e.target.value }))}
                    >
                      <option value="general">Gasto Operativo General (No atado a obra)</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  {editTxData.type === 'expense' && personnel && personnel.length > 0 && (
                    <div className="form-group">
                      <label>Asociar Personal / Contratista (Opcional)</label>
                      <select
                        className="form-control"
                        value={editTxData.personnelId || ''}
                        onChange={(e) => setEditTxData(prev => ({ ...prev, personnelId: e.target.value }))}
                      >
                        <option value="">-- No asociar a persona --</option>
                        {personnel.map(p => (
                          <option key={p.id} value={p.id}>{p.name} ({p.jobTitle || 'Sin cargo'})</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="form-group">
                    <label>Descripción / Concepto del Pago</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editTxData.description}
                      onChange={(e) => setEditTxData(prev => ({ ...prev, description: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Valor ($)</label>
                      <input
                        type="number"
                        className="form-control"
                        value={editTxData.amount}
                        onChange={(e) => setEditTxData(prev => ({ ...prev, amount: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Fecha</label>
                      <input
                        type="date"
                        className="form-control"
                        value={editTxData.date}
                        onChange={(e) => setEditTxData(prev => ({ ...prev, date: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* Attachment in Edit Mode */}
                  <div style={{ borderTop: '1px dashed var(--border-glass)', marginTop: '15px', paddingTop: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Modificar Soporte / Recibo (Opcional)</label>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', background: 'rgba(255,255,255,0.02)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                      <button
                        type="button"
                        className="btn"
                        style={{ flex: 1, padding: '6px 12px', fontSize: '0.8rem', background: uploadMode === 'file' ? 'var(--bg-glass)' : 'transparent', border: uploadMode === 'file' ? '1px solid var(--border-glass-active)' : '1px solid transparent', color: uploadMode === 'file' ? 'var(--primary-cyan)' : 'var(--text-secondary)' }}
                        onClick={() => { setUploadMode('file'); stopCamera(); }}
                      >
                        <Upload size={14} /> Archivo / Media
                      </button>
                      <button
                        type="button"
                        className="btn"
                        style={{ flex: 1, padding: '6px 12px', fontSize: '0.8rem', background: uploadMode === 'camera' ? 'var(--bg-glass)' : 'transparent', border: uploadMode === 'camera' ? '1px solid var(--border-glass-active)' : '1px solid transparent', color: uploadMode === 'camera' ? 'var(--primary-cyan)' : 'var(--text-secondary)' }}
                        onClick={() => { setUploadMode('camera'); startCamera(); }}
                      >
                        <Camera size={14} /> Tomar Foto
                      </button>
                    </div>

                    {uploadMode === 'file' ? (
                      <div style={{ border: '1px dashed var(--border-glass)', borderRadius: '8px', padding: '20px 10px', textAlign: 'center' }}>
                        <input
                          type="file"
                          id="edit-tx-file-input"
                          style={{ display: 'none' }}
                          accept="image/*,application/pdf"
                          onChange={handleFileChange}
                        />
                        <label htmlFor="edit-tx-file-input" style={{ cursor: 'pointer', display: 'block' }}>
                          <Upload size={24} style={{ color: 'var(--text-muted)', marginBottom: '8px' }} />
                          <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>
                            Examinar archivos...
                          </p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>PDF o imágenes de recibos</p>
                        </label>
                        {fileName && (
                          <div style={{ marginTop: '10px', fontSize: '0.85rem', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                            <Check size={12} /> {fileName}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                        {cameraActive && (
                          <div style={{ position: 'relative', width: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--primary-cyan)' }}>
                            <video
                              ref={videoRef}
                              autoPlay
                              playsInline
                              style={{ width: '100%', display: 'block', background: '#000' }}
                            />
                            <div style={{ position: 'absolute', bottom: '10px', left: '0', right: '0', display: 'flex', justifyContent: 'center' }}>
                              <button type="button" className="btn btn-primary" onClick={capturePhoto} style={{ borderRadius: '50%', width: '42px', height: '42px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Camera size={18} />
                              </button>
                            </div>
                          </div>
                        )}
                        
                        {capturedImage && (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '100%' }}>
                            <div style={{ position: 'relative', width: '100%', maxWidth: '200px', border: '1px solid var(--border-glass)', borderRadius: '8px', overflow: 'hidden' }}>
                              <img src={capturedImage} alt="Captured" style={{ width: '100%', display: 'block' }} />
                              <div style={{ position: 'absolute', top: '5px', right: '5px', background: 'var(--primary-teal)', color: 'white', borderRadius: '50%', padding: '2px' }}>
                                <Check size={12} />
                              </div>
                            </div>
                          </div>
                        )}

                        {!cameraActive && !capturedImage && (
                          <button type="button" className="btn btn-secondary" onClick={startCamera} style={{ fontSize: '0.8rem' }}>
                            <Camera size={14} /> Iniciar Cámara
                          </button>
                        )}
                        {(cameraActive || capturedImage) && (
                          <button type="button" className="btn btn-secondary" onClick={startCamera} style={{ fontSize: '0.8rem' }}>
                            Reintentar Foto
                          </button>
                        )}
                      </div>
                    )}
                    <canvas ref={canvasRef} style={{ display: 'none' }} />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => { setIsEditing(false); stopCamera(); }}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Guardar Cambios
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px 10px', fontSize: '0.9rem' }}>
                      <div>
                        <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '3px' }}>Fecha</span>
                        <strong style={{ color: 'var(--text-primary)' }}>{selectedTx.date}</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '3px' }}>Tipo</span>
                        {selectedTx.type === 'income' ? (
                          <span className="badge badge-completed" style={{ fontSize: '0.7rem' }}>Entrada / Ingreso</span>
                        ) : (
                          <span className="badge badge-danger" style={{ fontSize: '0.7rem', background: 'rgba(244,63,94,0.15)', color: '#fda4af', border: '1px solid rgba(244,63,94,0.3)' }}>Salida / Egreso</span>
                        )}
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '3px' }}>Proyecto / Obra</span>
                        <strong style={{ color: 'var(--text-primary)' }}>{selectedTx.projectName}</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '3px' }}>Categoría</span>
                        <strong style={{ color: 'var(--text-primary)' }}>{getCategoryLabel(selectedTx.category)}</strong>
                      </div>
                    </div>
                  </div>

                  <div>
                    <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '5px' }}>Detalles / Concepto</span>
                    <div style={{ fontSize: '1rem', color: 'var(--text-primary)', padding: '12px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', borderRadius: '6px', lineHeight: '1.4' }}>
                      {selectedTx.description}
                    </div>
                  </div>

                  <div>
                    <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '5px' }}>Valor del Movimiento</span>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: selectedTx.type === 'income' ? 'var(--primary-teal)' : 'var(--primary-red)' }}>
                      {selectedTx.type === 'income' ? '+' : '-'} {formatCurrency(selectedTx.amount)}
                    </div>
                  </div>

                  {/* Official Receipt action inside details */}
                  {!selectedTx.description.startsWith('[CANCELADO]') && !selectedTx.description.startsWith('[ANULADO]') && (
                    <div style={{ borderTop: '1px dashed var(--border-glass)', paddingTop: '12px' }}>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: selectedTx.type === 'income' ? 'var(--primary-teal)' : '#fda4af', borderColor: selectedTx.type === 'income' ? 'rgba(20, 184, 166, 0.4)' : 'rgba(244, 63, 94, 0.4)' }}
                        onClick={() => handleOpenReceiptForTx(selectedTx)}
                      >
                        <FileText size={16} /> {selectedTx.type === 'income' ? 'Generar / Imprimir Recibo Oficial de Caja' : 'Generar / Imprimir Comprobante de Egreso'}
                      </button>
                    </div>
                  )}

                  {selectedTx.receiptBase64 && (
                    <div style={{ borderTop: '1px dashed var(--border-glass)', paddingTop: '15px' }}>
                      <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '8px' }}>Comprobante Adjunto</span>
                      <div style={{ display: 'flex', justifyContent: 'center', background: '#000', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                        {selectedTx.receiptBase64.startsWith('data:application/pdf') ? (
                          <iframe 
                            src={selectedTx.receiptBase64} 
                            title="Comprobante PDF" 
                            style={{ width: '100%', height: '300px', border: 'none' }}
                          />
                        ) : (
                          <img 
                            src={selectedTx.receiptBase64} 
                            alt="Comprobante" 
                            style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain' }} 
                          />
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setSelectedTx(null)}>
                    Cerrar
                  </button>
                  {userRole !== 'viewer' && !selectedTx.description.startsWith('[CANCELADO]') && !selectedTx.description.startsWith('[ANULADO]') && (
                    <button 
                      type="button" 
                      className="btn" 
                      onClick={() => handleAnularTransaction(selectedTx)}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px', 
                        background: 'rgba(239, 68, 68, 0.1)', 
                        color: '#fca5a5', 
                        borderColor: 'rgba(239, 68, 68, 0.2)' 
                      }}
                    >
                      <Trash2 size={14} /> Anular
                    </button>
                  )}
                  {userRole !== 'viewer' && (
                    <button type="button" className="btn btn-primary" onClick={() => setIsEditing(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Edit3 size={14} /> Editar
                    </button>
                  )}
                </div>
              </div>
            )}
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
