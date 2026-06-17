import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Edit3, MapPin, Calendar, User, Phone, Mail, 
  DollarSign, CheckSquare, FileText, Image as ImageIcon, Camera, 
  TrendingUp, Plus, Trash2, Eye, Download, CheckCircle, Clock, X 
} from 'lucide-react';
import { 
  getDocumentsForProject, 
  getGalleryForProject, 
  saveGalleryItem, 
  deleteItem 
} from '../db/supabase';
import ScannerModal from './ScannerModal';
import ReceiptModal from './ReceiptModal';

export default function ProjectDetail({ project, onBack, onUpdate, logGlobalTransaction, userRole }) {
  const [activeTab, setActiveTab] = useState('general');
  const [documents, setDocuments] = useState([]);
  const [gallery, setGallery] = useState([]);
  
  // Modal states
  const [showScanner, setShowScanner] = useState(false);
  const [showReceipt, setShowReceipt] = useState(null); // holds payment object
  
  // Expense Logging Form State
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [expenseData, setExpenseData] = useState({
    description: '',
    categoryIndex: 0,
    amount: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Timeline Progress Entry State
  const [showAddTimeline, setShowAddTimeline] = useState(false);
  const [timelineData, setTimelineData] = useState({
    description: '',
    mediaBase64: '',
    mediaType: 'image' // 'image' | 'video'
  });

  // Custom Budget Item State
  const [showAddBudgetItem, setShowAddBudgetItem] = useState(false);
  const [newBudgetItem, setNewBudgetItem] = useState({
    name: '',
    estimated: '',
    category: 'materials'
  });
  const [calcPercentage, setCalcPercentage] = useState('');
  const [expensePercentage, setExpensePercentage] = useState('');

  // Restructure Payment Plan States
  const [showEditPaymentPlan, setShowEditPaymentPlan] = useState(false);
  const [tempPaymentPlan, setTempPaymentPlan] = useState([]);

  const handleEstimatedChange = (e) => {
    const val = e.target.value;
    setNewBudgetItem(prev => ({ ...prev, estimated: val }));
    const amt = parseFloat(val) || 0;
    if (amt > 0 && project.totalCost > 0) {
      setCalcPercentage(((amt / project.totalCost) * 100).toFixed(1));
    } else {
      setCalcPercentage('');
    }
  };

  const handleCalcPercentageChange = (e) => {
    const val = e.target.value;
    setCalcPercentage(val);
    const pct = parseFloat(val) || 0;
    setNewBudgetItem(prev => ({
      ...prev,
      estimated: pct > 0 ? Math.round((project.totalCost * pct) / 100) : ''
    }));
  };

  const handleExpenseAmountChange = (e) => {
    const val = e.target.value;
    setExpenseData(prev => ({ ...prev, amount: val }));
    const amt = parseFloat(val) || 0;
    if (amt > 0 && project.totalCost > 0) {
      setExpensePercentage(((amt / project.totalCost) * 100).toFixed(2));
    } else {
      setExpensePercentage('');
    }
  };

  const handleExpensePercentageChange = (e) => {
    const val = e.target.value;
    setExpensePercentage(val);
    const pct = parseFloat(val) || 0;
    setExpenseData(prev => ({
      ...prev,
      amount: pct > 0 ? Math.round((project.totalCost * pct) / 100) : ''
    }));
  };

  // Load documents and gallery items on mount or update
  useEffect(() => {
    loadFiles();
  }, [project.id]);

  const loadFiles = async () => {
    try {
      const docs = await getDocumentsForProject(project.id);
      const items = await getGalleryForProject(project.id);
      setDocuments(docs);
      setGallery(items);
    } catch (err) {
      console.error('Error loading files:', err);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value);
  };

  // 1. Payment Hito Status Update
  const handleMarkPaymentPaid = (paymentId) => {
    const paidDate = prompt('Ingresa la fecha del pago (AAAA-MM-DD):', new Date().toISOString().split('T')[0]);
    if (!paidDate) return;

    const paymentMethod = prompt('Método de pago (Efectivo / Transferencia / Cheque):', 'Transferencia');
    if (!paymentMethod) return;

    const updatedPayments = project.paymentPlan.map(pay => {
      if (pay.id === paymentId) {
        // Log transaction in global ledger
        const newTx = {
          projectId: project.id,
          projectName: project.name,
          type: 'income',
          category: 'client_payment',
          description: `Cobro Recibido: ${pay.name} (Ref: ${paymentMethod})`,
          amount: pay.amount,
          date: paidDate
        };
        logGlobalTransaction(newTx);

        return { ...pay, status: 'paid', paidDate };
      }
      return pay;
    });

    const updatedProject = { ...project, paymentPlan: updatedPayments };
    
    // Automatically recalculate project physical progress if paid hitos represent milestones
    onUpdate(updatedProject);
  };

  // 2. Add Expense to a Budget Category
  const handleAddExpenseSubmit = (e) => {
    e.preventDefault();
    const amt = parseFloat(expenseData.amount);
    if (!expenseData.description.trim() || amt <= 0) {
      alert('Por favor ingresa detalles y valor de gasto válidos.');
      return;
    }

    const catIdx = expenseData.categoryIndex;
    const updatedBudgetItems = [...project.budgetItems];
    const category = updatedBudgetItems[catIdx];
    
    category.actual = (category.actual || 0) + amt;

    const updatedProject = {
      ...project,
      budgetItems: updatedBudgetItems
    };

    // Log in global ledger
    const newTx = {
      projectId: project.id,
      projectName: project.name,
      type: 'expense',
      category: category.category, // 'materials' | 'labor' | 'permits'
      description: `Compra: ${expenseData.description} (Obra: ${project.name})`,
      amount: amt,
      date: expenseData.date
    };

    logGlobalTransaction(newTx);
    onUpdate(updatedProject);

    // Reset Form
    setExpenseData({
      description: '',
      categoryIndex: 0,
      amount: '',
      date: new Date().toISOString().split('T')[0]
    });
    setShowAddExpense(false);
  };

  // Add Custom Budget Item
  const handleAddBudgetItemSubmit = (e) => {
    e.preventDefault();
    const est = parseFloat(newBudgetItem.estimated);
    if (!newBudgetItem.name.trim() || est <= 0) {
      alert('Por favor ingresa nombre y estimación presupuestal válidos.');
      return;
    }

    const newItem = {
      name: newBudgetItem.name.trim(),
      estimated: est,
      actual: 0,
      category: newBudgetItem.category
    };

    const updatedProject = {
      ...project,
      budgetItems: [...project.budgetItems, newItem]
    };

    onUpdate(updatedProject);

    // Reset
    setNewBudgetItem({
      name: '',
      estimated: '',
      category: 'materials'
    });
    setShowAddBudgetItem(false);
  };

  // Remove Custom Budget Item
  const handleRemoveBudgetItem = (idx) => {
    const item = project.budgetItems[idx];
    let msg = `¿Seguro que deseas eliminar el renglón presupuestario "${item.name}"?`;
    if (item.actual > 0) {
      msg = `¡Atención! El renglón "${item.name}" ya tiene gastos acumulados de ${formatCurrency(item.actual)}. Si lo eliminas, estos gastos seguirán en la contabilidad general pero no aparecerán aquí. ¿Deseas eliminarlo de todos modos?`;
    }
    if (confirm(msg)) {
      const updatedBudgetItems = project.budgetItems.filter((_, i) => i !== idx);
      const updatedProject = {
        ...project,
        budgetItems: updatedBudgetItems
      };
      onUpdate(updatedProject);
    }
  };

  // Payment Plan Restructuring Handlers
  const handleOpenEditPaymentPlan = () => {
    // Clone payment plan
    setTempPaymentPlan(JSON.parse(JSON.stringify(project.paymentPlan)));
    setShowEditPaymentPlan(true);
  };

  const handleTempPaymentChange = (id, field, value) => {
    setTempPaymentPlan(prev => {
      return prev.map(p => {
        if (p.id === id) {
          const item = { ...p };
          if (field === 'percentage') {
            const pct = parseFloat(value) || 0;
            item.percentage = pct;
            item.amount = Math.round((project.totalCost * pct) / 100);
          } else {
            item[field] = value;
          }
          return item;
        }
        return p;
      });
    });
  };

  const handleAddTempPayment = () => {
    setTempPaymentPlan(prev => [
      ...prev,
      {
        id: `p_new_${new Date().getTime()}`,
        name: '',
        percentage: 0,
        amount: 0,
        dueDate: '',
        status: 'pending',
        paidDate: null
      }
    ]);
  };

  const handleRemoveTempPayment = (id) => {
    setTempPaymentPlan(prev => prev.filter(p => p.id !== id));
  };

  const handleSavePaymentPlan = () => {
    const totalPct = tempPaymentPlan.reduce((sum, p) => sum + p.percentage, 0);
    if (totalPct !== 100) {
      alert(`La suma total de los porcentajes de los hitos debe ser exactamente 100%. Actualmente es ${totalPct}%.`);
      return;
    }

    const hasEmptyName = tempPaymentPlan.some(p => !p.name.trim());
    if (hasEmptyName) {
      alert('Por favor ingresa un nombre o descripción para todos los hitos.');
      return;
    }

    const updatedProject = {
      ...project,
      paymentPlan: tempPaymentPlan
    };

    onUpdate(updatedProject);
    setShowEditPaymentPlan(false);
  };

  // 3. Add Timeline progress update with image
  const handleTimelineImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileType = file.type.startsWith('video/') ? 'video' : 'image';
    const reader = new FileReader();
    reader.onload = () => {
      setTimelineData(prev => ({
        ...prev,
        mediaBase64: reader.result,
        mediaType: fileType
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleAddTimelineSubmit = async (e) => {
    e.preventDefault();
    if (!timelineData.description.trim()) {
      alert('Ingresa una descripción del avance.');
      return;
    }

    try {
      await saveGalleryItem(
        project.id,
        timelineData.description,
        timelineData.mediaBase64,
        timelineData.mediaType
      );
      
      // Seed timeline list
      await loadFiles();
      
      // Update overall progress slightly as a mock or let it be
      setShowAddTimeline(false);
      setTimelineData({ description: '', mediaBase64: '', mediaType: 'image' });
    } catch (err) {
      console.error('Error saving progress item:', err);
    }
  };

  const handleDeleteDoc = async (id) => {
    if (confirm('¿Estás seguro de eliminar este documento del expediente?')) {
      await deleteItem('documents', id);
      loadFiles();
    }
  };

  const handleDeleteGallery = async (id) => {
    if (confirm('¿Estás seguro de eliminar esta foto/video de avance?')) {
      await deleteItem('gallery', id);
      loadFiles();
    }
  };

  // Calculate totals
  const totalPaid = project.paymentPlan
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalBudgetEst = project.budgetItems.reduce((sum, i) => sum + i.estimated, 0);
  const totalBudgetAct = project.budgetItems.reduce((sum, i) => sum + (i.actual || 0), 0);

  return (
    <div className="project-detail-view animate-fade-in">
      {/* Header Navigation */}
      <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '25px' }}>
        <button className="btn-icon" onClick={onBack}>
          <ArrowLeft size={18} />
        </button>
        <div>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
            Obra / Detalles
          </span>
          <h2 style={{ margin: 0, fontSize: '1.6rem', color: 'var(--text-primary)' }}>{project.name}</h2>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="tabs-header">
        <button className={`tab-btn ${activeTab === 'general' ? 'active' : ''}`} onClick={() => setActiveTab('general')}>
          Resumen General
        </button>
        <button className={`tab-btn ${activeTab === 'payments' ? 'active' : ''}`} onClick={() => setActiveTab('payments')}>
          Plan de Pagos ({project.paymentPlan.length})
        </button>
        <button className={`tab-btn ${activeTab === 'budget' ? 'active' : ''}`} onClick={() => setActiveTab('budget')}>
          Presupuesto y Gastos
        </button>
        <button className={`tab-btn ${activeTab === 'docs' ? 'active' : ''}`} onClick={() => setActiveTab('docs')}>
          Expediente Documentos ({documents.length})
        </button>
        <button className={`tab-btn ${activeTab === 'gallery' ? 'active' : ''}`} onClick={() => setActiveTab('gallery')}>
          Bitácora y Avances ({gallery.length})
        </button>
      </div>

      {/* 1. GENERAL TAB */}
      {activeTab === 'general' && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="grid-2">
            {/* Project Details Panel */}
            <div className="glass-panel" style={{ padding: '22px' }}>
              <h3 style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px', marginBottom: '15px' }}>
                Ficha Técnica
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.95rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Cliente:</span>
                  <span style={{ fontWeight: 600 }}>{project.clientName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Teléfono:</span>
                  <span>{project.clientPhone || 'No registrado'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Email:</span>
                  <span>{project.clientEmail || 'No registrado'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Fecha Inicio Obra:</span>
                  <span>{project.startDate}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Fecha Estimada Fin:</span>
                  <span>{project.endDate || 'Abierto'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-glass)', paddingTop: '10px', marginTop: '5px' }}>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Presupuesto Contratado:</span>
                  <span style={{ fontWeight: 800, color: 'var(--primary-teal)' }}>{formatCurrency(project.totalCost)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Total Cobrado:</span>
                  <span style={{ fontWeight: 800, color: 'var(--primary-cyan)' }}>{formatCurrency(totalPaid)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Saldo Pendiente:</span>
                  <span style={{ fontWeight: 700, color: 'var(--primary-orange)' }}>{formatCurrency(project.totalCost - totalPaid)}</span>
                </div>
              </div>
            </div>

            {/* Address and Geoposition Map */}
            <div className="glass-panel" style={{ padding: '22px', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
                <MapPin size={18} style={{ color: 'var(--primary-cyan)' }} />
                Ubicación Satelital
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '15px' }}>
                <strong>Dirección:</strong> {project.location?.address || 'Sin dirección registrada'}
              </p>
              
              {/* Simple read-only static iframe map preview or dynamic OSM embed */}
              <div style={{ flex: 1, minHeight: '180px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-glass)' }}>
                <iframe
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  scrolling="no"
                  marginHeight="0"
                  marginWidth="0"
                  src={`https://maps.google.com/maps?q=${project.location?.lat || 6.2518},${project.location?.lng || -75.5636}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                  style={{ filter: 'grayscale(0.6) invert(0.95) contrast(1.2) hue-rotate(180deg)' }}
                ></iframe>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-around', gap: '20px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '5px' }}>Progreso Físico</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary-cyan)' }}>{project.progress}%</div>
            </div>
            <div style={{ borderLeft: '1px solid var(--border-glass)' }}></div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '5px' }}>Cobrado Hitos</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary-teal)' }}>
                {Math.round((totalPaid / project.totalCost) * 100)}%
              </div>
            </div>
            <div style={{ borderLeft: '1px solid var(--border-glass)' }}></div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '5px' }}>Margen de Gasto Real</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: totalBudgetAct > totalBudgetEst ? 'var(--primary-red)' : '#818cf8' }}>
                {Math.round((totalBudgetAct / project.totalCost) * 100)}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. PAYMENTS TAB */}
      {activeTab === 'payments' && (
        <div className="glass-panel animate-fade-in" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
            <div>
              <h3>Planificación de Formas de Pago</h3>
              <p style={{ fontSize: '0.85rem' }}>Estructura de cobros y facturación convenida con el cliente.</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Total Cobrado: <strong style={{ color: 'var(--primary-teal)' }}>{formatCurrency(totalPaid)}</strong> / {formatCurrency(project.totalCost)}
              </span>
              {userRole !== 'viewer' && (
                <button className="btn btn-secondary" onClick={handleOpenEditPaymentPlan} style={{ padding: '8px 14px', fontSize: '0.85rem' }}>
                  Reestructurar Pagos Pendientes
                </button>
              )}
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-glass)' }}>
                  <th style={{ padding: '12px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Hito / Descripción</th>
                  <th style={{ padding: '12px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>%</th>
                  <th style={{ padding: '12px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Monto sugerido</th>
                  <th style={{ padding: '12px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Fecha Límite</th>
                  <th style={{ padding: '12px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Estado</th>
                  <th style={{ padding: '12px', color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {project.paymentPlan.map((pay) => {
                  const isPaid = pay.status === 'paid';
                  const isOverdue = pay.status === 'pending' && pay.dueDate && pay.dueDate < new Date().toISOString().split('T')[0];

                  return (
                    <tr key={pay.id} style={{ borderBottom: '1px solid var(--border-glass)', background: isPaid ? 'rgba(16,185,129,0.02)' : 'transparent' }}>
                      <td style={{ padding: '15px 12px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{pay.name}</div>
                      </td>
                      <td style={{ padding: '15px 12px', fontWeight: 600 }}>{pay.percentage}%</td>
                      <td style={{ padding: '15px 12px', fontWeight: 700, color: 'var(--text-primary)' }}>{formatCurrency(pay.amount)}</td>
                      <td style={{ padding: '15px 12px', color: isOverdue ? 'var(--primary-red)' : 'var(--text-secondary)' }}>
                        {pay.dueDate || 'Hito de avance'}
                      </td>
                      <td style={{ padding: '15px 12px' }}>
                        {isPaid ? (
                          <span className="badge badge-completed" style={{ fontSize: '0.7rem' }}>Cobrado</span>
                        ) : isOverdue ? (
                          <span className="badge badge-halted" style={{ fontSize: '0.7rem', background: 'rgba(244,63,94,0.15)', color: '#fda4af', borderColor: 'rgba(244,63,94,0.3)' }}>Vencido</span>
                        ) : (
                          <span className="badge badge-planning" style={{ fontSize: '0.7rem' }}>Pendiente</span>
                        )}
                      </td>
                      <td style={{ padding: '15px 12px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          {!isPaid ? (
                            userRole !== 'viewer' ? (
                              <button className="btn btn-success" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => handleMarkPaymentPaid(pay.id)}>
                                Registrar Cobro
                              </button>
                            ) : (
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Pendiente</span>
                            )
                          ) : (
                            <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => setShowReceipt(pay)}>
                              <Eye size={12} /> Recibo
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. BUDGET & EXPENSES TAB */}
      {activeTab === 'budget' && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-panel" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3>Presupuesto y Ejecución de Egresos</h3>
                <p style={{ fontSize: '0.85rem' }}>Control y balance de insumos, materiales y mano de obra.</p>
              </div>
              {userRole !== 'viewer' && (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="btn btn-secondary" onClick={() => { setShowAddBudgetItem(true); setCalcPercentage(''); }}>
                    <Plus size={16} /> Agregar Renglón
                  </button>
                  <button className="btn btn-primary" onClick={() => { setShowAddExpense(true); setExpensePercentage(''); }}>
                    <Plus size={16} /> Registrar Compra / Gasto
                  </button>
                </div>
              )}
            </div>

            {/* Budget list comparison */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '15px' }}>
              {project.budgetItems.map((item, idx) => {
                const diff = item.estimated - (item.actual || 0);
                const percent = Math.round(((item.actual || 0) / item.estimated) * 100) || 0;
                let colorBar = 'var(--primary-cyan)';
                if (percent > 90 && percent <= 100) colorBar = 'var(--primary-orange)';
                if (percent > 100) colorBar = 'var(--primary-red)';

                return (
                  <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)', padding: '16px', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                            {item.category === 'materials' ? 'Materiales' : item.category === 'labor' ? 'Mano de Obra' : 'Licencias/Otros'}
                          </span>
                          {userRole !== 'viewer' && (
                            <button
                              type="button"
                              style={{ background: 'none', border: 'none', color: 'var(--primary-red)', cursor: 'pointer', padding: '0', display: 'inline-flex', alignItems: 'center' }}
                              onClick={() => handleRemoveBudgetItem(idx)}
                              title="Eliminar renglón presupuestario"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                        <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>{item.name}</h4>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                          Gastado: <strong style={{ color: item.actual > item.estimated ? 'var(--primary-red)' : 'var(--text-primary)' }}>{formatCurrency(item.actual || 0)}</strong> / {formatCurrency(item.estimated)}
                        </span>
                        <div style={{ fontSize: '0.75rem', color: diff >= 0 ? '#10b981' : '#f43f5e', marginTop: '2px' }}>
                          {diff >= 0 ? `Disponible: ${formatCurrency(diff)}` : `Excedido por: ${formatCurrency(Math.abs(diff))}`}
                        </div>
                      </div>
                    </div>
                    {/* Progress Slider Bar */}
                    <div className="progress-bar-container" style={{ margin: '0 0 5px 0' }}>
                      <div className="progress-bar-fill" style={{ width: `${Math.min(percent, 100)}%`, background: colorBar }}></div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <span>Ejecución del renglón</span>
                      <span style={{ fontWeight: 700 }}>{percent}%</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total Budget Summary card */}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid var(--border-glass)', paddingTop: '20px', marginTop: '10px', flexWrap: 'wrap', gap: '20px' }}>
              <div>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Estimado Presupuestado Total:</span>
                <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{formatCurrency(totalBudgetEst)}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Total Ejecutado en Obra:</span>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: totalBudgetAct > totalBudgetEst ? 'var(--primary-red)' : 'var(--primary-cyan)' }}>
                  {formatCurrency(totalBudgetAct)}
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Diferencia Global:</span>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: (totalBudgetEst - totalBudgetAct) >= 0 ? '#10b981' : '#f43f5e' }}>
                  {formatCurrency(totalBudgetEst - totalBudgetAct)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. DOCUMENTS TAB */}
      {activeTab === 'docs' && (
        <div className="glass-panel animate-fade-in" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3>Expediente de Documentación y Contratos</h3>
              <p style={{ fontSize: '0.85rem' }}>Archivo seguro digitalizado del cliente (contratos, comprobantes de pago).</p>
            </div>
            {userRole !== 'viewer' && (
              <button className="btn btn-primary" onClick={() => setShowScanner(true)}>
                <Plus size={16} /> Escanear o Subir Archivo
              </button>
            )}
          </div>

          {documents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)', border: '2px dashed var(--border-glass)', borderRadius: '12px' }}>
              <FileText size={48} style={{ color: 'var(--text-muted)', marginBottom: '15px' }} />
              <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '5px' }}>Expediente Vacío</p>
              <p style={{ fontSize: '0.85rem' }}>Sube o escanea el contrato firmado del cliente o sus recibos para tenerlos aquí respaldados.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
              {documents.map((doc) => (
                <div key={doc.id} className="glass-panel" style={{ padding: '15px', display: 'flex', flexDirection: 'column', height: '100%', background: 'rgba(255,255,255,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <span className="badge" style={{ 
                      fontSize: '0.65rem',
                      background: doc.type === 'contract' ? 'rgba(99,102,241,0.15)' : doc.type === 'payment_receipt' ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)',
                      color: doc.type === 'contract' ? '#a5b4fc' : doc.type === 'payment_receipt' ? '#6ee7b7' : 'var(--text-secondary)'
                    }}>
                      {doc.type === 'contract' ? 'Contrato' : doc.type === 'payment_receipt' ? 'Pago' : 'Documento'}
                    </span>
                    {userRole !== 'viewer' && (
                      <button className="btn-icon" style={{ padding: '3px', background: 'none', border: 'none' }} onClick={() => handleDeleteDoc(doc.id)}>
                        <Trash2 size={13} style={{ color: 'var(--primary-red)' }} />
                      </button>
                    )}
                  </div>

                  <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px', wordBreak: 'break-word', flex: 1 }}>
                    {doc.name}
                  </h4>

                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '15px' }}>
                    Subido: {doc.uploadDate}
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <a 
                      href={doc.fileBase64} 
                      download={doc.name}
                      className="btn btn-secondary" 
                      style={{ padding: '6px', fontSize: '0.8rem', flex: 1, textDecoration: 'none', textAlign: 'center' }}
                    >
                      <Download size={14} />
                    </a>
                    {doc.fileBase64.startsWith('data:image/') && (
                      <button 
                        className="btn btn-primary" 
                        style={{ padding: '6px', fontSize: '0.8rem', flex: 1 }}
                        onClick={() => {
                          const w = window.open();
                          w.document.write(`<img src="${doc.fileBase64}" style="max-width:100%; max-height:100vh; display:block; margin:auto;" />`);
                          w.document.title = doc.name;
                        }}
                      >
                        <Eye size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. BITACORA / PROGRESS GALLERY TAB */}
      {activeTab === 'gallery' && (
        <div className="glass-panel animate-fade-in" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
            <div>
              <h3>Bitácora Fotográfica de Obra</h3>
              <p style={{ fontSize: '0.85rem' }}>Línea de tiempo del avance físico y registro multimedia.</p>
            </div>
            {userRole !== 'viewer' && (
              <button className="btn btn-primary" onClick={() => setShowAddTimeline(true)}>
                <Plus size={16} /> Agregar Avance de Obra
              </button>
            )}
          </div>

          {gallery.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)', border: '2px dashed var(--border-glass)', borderRadius: '12px' }}>
              <ImageIcon size={48} style={{ color: 'var(--text-muted)', marginBottom: '15px' }} />
              <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '5px' }}>Sin Registros de Avance</p>
              <p style={{ fontSize: '0.85rem' }}>Registra hitos del progreso de la construcción adjuntando fotos o videos del terreno.</p>
            </div>
          ) : (
            <div className="timeline">
              {gallery.map((item) => (
                <div key={item.id} className="timeline-item">
                  <div className="timeline-dot"></div>
                  <div className="timeline-content">
                    <div className="timeline-meta">
                      <span className="timeline-date">{item.uploadDate}</span>
                      {userRole !== 'viewer' && (
                        <button 
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary-red)' }} 
                          onClick={() => handleDeleteGallery(item.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                    <p style={{ color: 'var(--text-primary)', fontSize: '0.95rem', marginBottom: '12px' }}>
                      {item.description}
                    </p>

                    {item.fileBase64 && (
                      <div style={{ maxWidth: '300px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-glass)' }}>
                        {item.fileType === 'video' ? (
                          <video src={item.fileBase64} controls style={{ width: '100%', display: 'block' }} />
                        ) : (
                          <img 
                            src={item.fileBase64} 
                            alt="Avance de obra" 
                            style={{ width: '100%', display: 'block', cursor: 'pointer' }}
                            onClick={() => {
                              const w = window.open();
                              w.document.write(`<img src="${item.fileBase64}" style="max-width:100%; max-height:100vh; display:block; margin:auto;" />`);
                              w.document.title = "Avance Obra";
                            }}
                          />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* EXPENSE LOGGING MODAL FORM */}
      {showAddExpense && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>Registrar Compra / Gasto en Obra</h3>
              <button className="btn-icon" onClick={() => setShowAddExpense(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleAddExpenseSubmit}>
              <div className="modal-body">
                {/* Financial balance verification panel */}
                {(() => {
                  const remainingCash = totalPaid - totalBudgetAct;
                  const newExpenseAmt = parseFloat(expenseData.amount) || 0;
                  const projectedBalance = remainingCash - newExpenseAmt;
                  return (
                    <div style={{ 
                      background: 'rgba(255, 255, 255, 0.02)', 
                      border: '1px solid var(--border-glass)', 
                      borderRadius: '10px', 
                      padding: '12px 15px', 
                      marginBottom: '20px', 
                      fontSize: '0.85rem'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Ingresos Cobrados (Cliente):</span>
                        <span style={{ fontWeight: 700, color: 'var(--primary-teal)' }}>{formatCurrency(totalPaid)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Egresos Acumulados:</span>
                        <span style={{ fontWeight: 700, color: 'var(--primary-red)' }}>{formatCurrency(totalBudgetAct)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-glass)', paddingTop: '6px', fontWeight: 600 }}>
                        <span style={{ color: 'var(--text-primary)' }}>Caja Disponible de la Obra:</span>
                        <span style={{ color: remainingCash >= 0 ? 'var(--primary-teal)' : 'var(--primary-red)' }}>{formatCurrency(remainingCash)}</span>
                      </div>

                      {newExpenseAmt > 0 && (
                        <div style={{ 
                          marginTop: '10px', 
                          paddingTop: '8px', 
                          borderTop: '1px dashed var(--border-glass)', 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          fontWeight: 700 
                        }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Saldo Proyectado:</span>
                          <span style={{ color: projectedBalance >= 0 ? 'var(--primary-cyan)' : 'var(--primary-red)' }}>
                            {formatCurrency(projectedBalance)}
                          </span>
                        </div>
                      )}

                      {projectedBalance < 0 && (
                        <div style={{ 
                          marginTop: '12px', 
                          background: 'rgba(244, 63, 94, 0.08)', 
                          border: '1px solid rgba(244, 63, 94, 0.25)', 
                          borderRadius: '8px', 
                          padding: '8px 10px', 
                          color: '#fca5a5', 
                          display: 'flex', 
                          gap: '6px', 
                          alignItems: 'center', 
                          fontSize: '0.8rem',
                          fontWeight: 500
                        }}>
                          <span style={{ fontSize: '1.1rem' }}>⚠️</span>
                          <span>
                            ¡Advertencia! Este gasto supera el dinero cobrado al cliente. Quedarás con saldo negativo por <strong>{formatCurrency(Math.abs(projectedBalance))}</strong>.
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })()}

                <div className="form-group">
                  <label>Renglón Presupuestario Asociado</label>
                  <select
                    className="form-control"
                    value={expenseData.categoryIndex}
                    onChange={(e) => setExpenseData(prev => ({ ...prev, categoryIndex: parseInt(e.target.value) }))}
                  >
                    {project.budgetItems.map((item, idx) => (
                      <option key={idx} value={idx}>
                        {item.name} ({item.category === 'materials' ? 'Materiales' : item.category === 'labor' ? 'Mano de Obra' : 'Licencia'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Detalle / Descripción de Compra</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ej. Compra de cemento Portland x 50 sacos"
                    value={expenseData.description}
                    onChange={(e) => setExpenseData(prev => ({ ...prev, description: e.target.value }))}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Valor Factura ($)</label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="Ej. 1850000"
                      value={expenseData.amount}
                      onChange={handleExpenseAmountChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Fecha Factura</label>
                    <input
                      type="date"
                      className="form-control"
                      value={expenseData.date}
                      onChange={(e) => setExpenseData(prev => ({ ...prev, date: e.target.value }))}
                    />
                  </div>

                  {/* Reactive Expense Percentage Calculator Widget */}
                  <div className="form-group" style={{ gridColumn: 'span 2', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-glass)', marginTop: '5px' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>
                      Calculadora de Gasto por % de la Obra
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flex: 1, minWidth: '150px' }}>
                        <input
                          type="number"
                          className="form-control"
                          style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                          placeholder="Porcentaje (ej: 1.5)"
                          min="0"
                          max="100"
                          step="0.01"
                          value={expensePercentage}
                          onChange={handleExpensePercentageChange}
                        />
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>%</span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', flex: 1.5, minWidth: '200px' }}>
                        De un total contratado de: <strong style={{ color: 'var(--text-primary)' }}>{formatCurrency(project.totalCost)}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddExpense(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Registrar Transacción
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TIMELINE ADD MODAL */}
      {showAddTimeline && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>Registrar Avance de Obra</h3>
              <button className="btn-icon" onClick={() => setShowAddTimeline(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleAddTimelineSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Descripción del Avance</label>
                  <textarea
                    rows="3"
                    className="form-control"
                    placeholder="Ej. Finalización del encofrado del primer piso y colocación de tuberías..."
                    value={timelineData.description}
                    onChange={(e) => setTimelineData(prev => ({ ...prev, description: e.target.value }))}
                    required
                  ></textarea>
                </div>

                <div className="form-group">
                  <label>Foto / Video del Avance</label>
                  <input
                    type="file"
                    className="form-control"
                    accept="image/*,video/*"
                    onChange={handleTimelineImageChange}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddTimeline(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={!timelineData.description.trim()}>
                  Guardar Avance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DOCUMENT SCANNER MODAL */}
      {showScanner && (
        <ScannerModal
          projectId={project.id}
          onClose={() => setShowScanner(false)}
          onSave={loadFiles}
        />
      )}

      {/* PRINTABLE CLIENT RECEIPT MODAL */}
      {showReceipt && (
        <ReceiptModal
          project={project}
          payment={showReceipt}
          onClose={() => setShowReceipt(null)}
        />
      )}
      {/* ADD BUDGET ITEM MODAL */}
      {showAddBudgetItem && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>Agregar Nuevo Renglón Presupuestario</h3>
              <button className="btn-icon" onClick={() => setShowAddBudgetItem(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleAddBudgetItemSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Nombre del Renglón / Descripción</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ej. Carpintería de Aluminio, Red Eléctrica..."
                    value={newBudgetItem.name}
                    onChange={(e) => setNewBudgetItem(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Presupuesto Estimado ($)</label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="Ej. 12000000"
                      value={newBudgetItem.estimated}
                      onChange={handleEstimatedChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Categoría</label>
                    <select
                      className="form-control"
                      value={newBudgetItem.category}
                      onChange={(e) => setNewBudgetItem(prev => ({ ...prev, category: e.target.value }))}
                    >
                      <option value="materials">Materiales</option>
                      <option value="labor">Mano de Obra</option>
                      <option value="permits">Licencias/Otros</option>
                    </select>
                  </div>

                  {/* Reactive Percentage Calculator Widget */}
                  <div className="form-group" style={{ gridColumn: 'span 2', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-glass)', marginTop: '5px' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>
                      Calculadora de Presupuesto por %
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flex: 1, minWidth: '150px' }}>
                        <input
                          type="number"
                          className="form-control"
                          style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                          placeholder="Porcentaje (ej: 8.5)"
                          min="0"
                          max="100"
                          step="0.1"
                          value={calcPercentage}
                          onChange={handleCalcPercentageChange}
                        />
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>%</span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', flex: 1.5, minWidth: '200px' }}>
                        De un total contratado de: <strong style={{ color: 'var(--text-primary)' }}>{formatCurrency(project.totalCost)}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddBudgetItem(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Agregar Renglón
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* RESTRUCTURE PAYMENT PLAN MODAL */}
      {showEditPaymentPlan && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '750px' }}>
            <div className="modal-header">
              <h3>Reestructurar Pagos del Proyecto</h3>
              <button className="btn-icon" onClick={() => setShowEditPaymentPlan(false)}><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
              <div style={{ marginBottom: '15px', padding: '10px 15px', borderRadius: '8px', background: 'rgba(6, 182, 212, 0.05)', border: '1px solid rgba(6, 182, 212, 0.15)', fontSize: '0.85rem' }}>
                <p>⚠️ <strong>Nota:</strong> Los hitos de pago ya cobrados se encuentran bloqueados para proteger los ingresos registrados en contabilidad. Solo puedes modificar, dividir o agregar hitos de pago pendientes.</p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h4 style={{ fontSize: '0.95rem', color: 'var(--primary-cyan)' }}>Plan de Pagos Actual</h4>
                <button type="button" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={handleAddTempPayment}>
                  <Plus size={14} /> Agregar Hito Pendiente
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {tempPaymentPlan.map((pay) => {
                  const isPaid = pay.status === 'paid';
                  return (
                    <div key={pay.id} style={{ display: 'flex', gap: '10px', alignItems: 'center', background: isPaid ? 'rgba(16,185,129,0.03)' : 'rgba(255,255,255,0.01)', padding: '10px', borderRadius: '8px', border: isPaid ? '1px dashed rgba(16,185,129,0.2)' : '1px solid var(--border-glass)' }}>
                      
                      {/* Name input */}
                      <div style={{ flex: 2 }}>
                        <input
                          type="text"
                          className="form-control"
                          value={pay.name}
                          onChange={(e) => handleTempPaymentChange(pay.id, 'name', e.target.value)}
                          disabled={isPaid}
                          placeholder="Concepto (ej: 50% Estructura)"
                          required
                        />
                      </div>

                      {/* Percentage */}
                      <div style={{ width: '85px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="number"
                          className="form-control"
                          value={pay.percentage}
                          onChange={(e) => handleTempPaymentChange(pay.id, 'percentage', e.target.value)}
                          disabled={isPaid}
                          placeholder="%"
                          min="0"
                          max="100"
                          required
                        />
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>%</span>
                      </div>

                      {/* Due Date */}
                      <div style={{ flex: 1.2 }}>
                        <input
                          type="date"
                          className="form-control"
                          value={pay.dueDate || ''}
                          onChange={(e) => handleTempPaymentChange(pay.id, 'dueDate', e.target.value)}
                          disabled={isPaid}
                          required
                        />
                      </div>

                      {/* Amount preview */}
                      <div style={{ width: '120px', textAlign: 'right', fontSize: '0.85rem', fontWeight: 600, color: isPaid ? 'var(--primary-teal)' : 'var(--text-primary)' }}>
                        {formatCurrency(pay.amount)}
                      </div>

                      {/* Action / Delete */}
                      <div style={{ width: '32px', textAlign: 'center' }}>
                        {isPaid ? (
                          <span className="badge badge-completed" style={{ fontSize: '0.65rem', padding: '3px 6px' }}>Cobrado</span>
                        ) : (
                          <button 
                            type="button" 
                            className="btn-icon" 
                            style={{ padding: '6px', color: 'var(--primary-red)', background: 'rgba(244,63,94,0.05)', borderColor: 'rgba(244,63,94,0.1)' }}
                            onClick={() => handleRemoveTempPayment(pay.id)}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Percentages validation display */}
              {(() => {
                const totalTempPct = tempPaymentPlan.reduce((sum, p) => sum + p.percentage, 0);
                return (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px', padding: '10px 15px', borderRadius: '8px', background: totalTempPct === 100 ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)', border: totalTempPct === 100 ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(245,158,11,0.2)' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Total Distribuido del Plan:
                    </span>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem', color: totalTempPct === 100 ? 'var(--primary-teal)' : 'var(--primary-orange)' }}>
                      {totalTempPct}% / 100% {totalTempPct === 100 ? '✓ Listo' : '⚠️ Ajustar a 100%'}
                    </span>
                  </div>
                );
              })()}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowEditPaymentPlan(false)}>
                Cancelar
              </button>
              <button type="button" className="btn btn-primary" onClick={handleSavePaymentPlan} disabled={tempPaymentPlan.reduce((sum, p) => sum + p.percentage, 0) !== 100}>
                Guardar Reestructuración
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
