import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Edit3, MapPin, Calendar, User, Phone, Mail, 
  DollarSign, CheckSquare, FileText, Image as ImageIcon, Camera, 
  TrendingUp, Plus, Trash2, Eye, Download, CheckCircle, Clock, X, Printer 
} from 'lucide-react';
import { 
  getDocumentsForProject, 
  getProgressLogsForProject, 
  saveProgressLog, 
  deleteProgressLog,
  deleteItem,
  saveItem
} from '../db/supabase';
import ScannerModal from './ScannerModal';
import ReceiptModal from './ReceiptModal';
import ProjectForm from './ProjectForm';
import { getCachedData, setCachedData } from '../db/storage';

// Client-side image compression helper
const compressImage = (base64Str, maxWidth = 1200, maxHeight = 1200, quality = 0.7) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => {
      resolve(base64Str);
    };
  });
};

export default function ProjectDetail({ project, onBack, onUpdate, logGlobalTransaction, userRole, transactions = [] }) {
  const [activeTab, setActiveTab] = useState('general');
  const [documents, setDocuments] = useState([]);
  const [progressLogs, setProgressLogs] = useState([]);

  console.log("ProjectDetail transactions count:", transactions.length);
  console.log("ProjectDetail current project ID:", project.id);
  console.log("ProjectDetail transactions for project:", transactions.filter(t => String(t.projectId) === String(project.id)));

  
  // Modal states
  const [showScanner, setShowScanner] = useState(false);
  const [showReceipt, setShowReceipt] = useState(null); // holds payment object
  const [showHitoPayments, setShowHitoPayments] = useState(null); // holds the active payment plan hito object
  const [showEditProject, setShowEditProject] = useState(false); // toggle project edit modal
  const [newPayment, setNewPayment] = useState({
    id: null,
    amount: '',
    date: new Date().toISOString().split('T')[0],
    method: 'Transferencia',
    files: [] // { fileBase64, fileName, fileType }
  });
  
  // Expense Logging Form State
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [expenseData, setExpenseData] = useState({
    description: '',
    categoryIndex: 0,
    amount: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Timeline Progress Entry State
  const [showAddTimeline, setShowAddTimeline] = useState(false);
  const [timelineData, setTimelineData] = useState({
    id: null,
    description: '',
    uploadDate: new Date().toISOString().split('T')[0],
    media: [] // Array of { fileBase64, fileType }
  });

  // Custom Budget Item State
  const [showAddBudgetItem, setShowAddBudgetItem] = useState(false);
  const [editingBudgetItemIndex, setEditingBudgetItemIndex] = useState(null);
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

  const handleOpenEditBudgetItem = (idx) => {
    const item = project.budgetItems[idx];
    setNewBudgetItem({
      name: item.name,
      estimated: item.estimated,
      category: item.category
    });
    if (project.totalCost > 0) {
      setCalcPercentage(((item.estimated / project.totalCost) * 100).toFixed(1));
    } else {
      setCalcPercentage('');
    }
    setEditingBudgetItemIndex(idx);
    setShowAddBudgetItem(true);
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
    const cachedDocsKey = `supabase_docs_${project.id}`;
    const cachedLogsKey = `supabase_logs_${project.id}`;

    // 1. Try loading from IndexedDB cache first for instant render
    try {
      const [cachedDocs, cachedLogs] = await Promise.all([
        getCachedData(cachedDocsKey),
        getCachedData(cachedLogsKey)
      ]);

      if (cachedDocs) setDocuments(cachedDocs);
      if (cachedLogs) setProgressLogs(cachedLogs);
    } catch (cacheErr) {
      console.warn('Failed to load cached files:', cacheErr);
    }

    // 2. Fetch fresh data from Supabase
    try {
      const docs = await getDocumentsForProject(project.id);
      const items = await getProgressLogsForProject(project.id);
      
      // Update React states
      setDocuments(docs);
      setProgressLogs(items);

      // Save fresh data to cache for next load
      try {
        await Promise.all([
          setCachedData(cachedDocsKey, docs),
          setCachedData(cachedLogsKey, items)
        ]);
      } catch (cacheErr) {
        console.warn('Failed to save files to cache:', cacheErr);
      }
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

  // 1. Payment Hito Status Update with partial payments & comprobantes
  const handlePaymentFileChange = (e) => {
    const filesList = Array.from(e.target.files);
    if (!filesList.length) return;

    filesList.forEach(file => {
      const fileType = file.type.includes('pdf') ? 'pdf' : 'image';
      const reader = new FileReader();
      reader.onload = async () => {
        let base64Result = reader.result;
        if (fileType === 'image') {
          base64Result = await compressImage(base64Result);
        }
        setNewPayment(prev => ({
          ...prev,
          files: [
            ...prev.files,
            { fileBase64: base64Result, fileName: file.name, fileType }
          ]
        }));
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleRemovePaymentFile = (index) => {
    setNewPayment(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index)
    }));
  };

  const handleSavePaymentSubmit = async (e) => {
    e.preventDefault();
    const amt = parseFloat(newPayment.amount);
    if (isNaN(amt) || amt <= 0) {
      alert('Por favor ingresa un monto válido.');
      return;
    }

    const payId = `pay_${new Date().getTime()}`;
    const newPayItem = {
      id: payId,
      amount: amt,
      date: newPayment.date,
      method: newPayment.method,
      files: newPayment.files
    };

    // Calculate milestone payments
    const currentMilestone = project.paymentPlan.find(h => h.id === showHitoPayments.id);
    const existingPayments = currentMilestone.payments || (currentMilestone.status === 'paid' ? [{ id: 'legacy', amount: currentMilestone.amount, date: currentMilestone.paidDate || currentMilestone.dueDate, method: 'Transferencia', files: [] }] : []);
    const updatedPaymentsList = [...existingPayments, newPayItem];

    const hitoTotalPaid = updatedPaymentsList.reduce((s, p) => s + p.amount, 0);
    const updatedStatus = hitoTotalPaid >= currentMilestone.amount ? 'paid' : 'partial';

    const updatedPaymentPlan = project.paymentPlan.map(h => {
      if (h.id === showHitoPayments.id) {
        return {
          ...h,
          payments: updatedPaymentsList,
          status: updatedStatus,
          paidDate: updatedStatus === 'paid' ? newPayment.date : null
        };
      }
      return h;
    });

    const updatedProject = { ...project, paymentPlan: updatedPaymentPlan };

    // Ledger income transaction
    const newTx = {
      id: `tx_pay_${payId}`,
      projectId: project.id,
      projectName: project.name,
      type: 'income',
      category: 'client_payment',
      description: `Cobro Parcial Hito: ${showHitoPayments.name} (${newPayment.method})`,
      amount: amt,
      date: newPayment.date
    };

    try {
      logGlobalTransaction(newTx);
      await onUpdate(updatedProject);
      
      // Update local modal state
      const updatedHito = updatedPaymentPlan.find(h => h.id === showHitoPayments.id);
      setShowHitoPayments(updatedHito);

      // Reset form
      setNewPayment({
        id: null,
        amount: '',
        date: new Date().toISOString().split('T')[0],
        method: 'Transferencia',
        files: []
      });
    } catch (err) {
      console.error(err);
      alert('Error al registrar abono.');
    }
  };

  const handleDeletePayment = async (paymentId) => {
    if (!confirm('¿Estás seguro de eliminar este comprobante de abono? El saldo se actualizará y la transacción asociada se borrará del libro de caja.')) return;

    const currentMilestone = project.paymentPlan.find(h => h.id === showHitoPayments.id);
    const existingPayments = currentMilestone.payments || (currentMilestone.status === 'paid' ? [{ id: 'legacy', amount: currentMilestone.amount, date: currentMilestone.paidDate || currentMilestone.dueDate, method: 'Transferencia', files: [] }] : []);
    
    const updatedPaymentsList = existingPayments.filter(p => p.id !== paymentId);
    const hitoTotalPaid = updatedPaymentsList.reduce((s, p) => s + p.amount, 0);
    const updatedStatus = hitoTotalPaid >= currentMilestone.amount 
      ? 'paid' 
      : (hitoTotalPaid > 0 ? 'partial' : 'pending');

    const updatedPaymentPlan = project.paymentPlan.map(h => {
      if (h.id === showHitoPayments.id) {
        return {
          ...h,
          payments: updatedPaymentsList,
          status: updatedStatus,
          paidDate: updatedStatus === 'paid' ? (updatedPaymentsList[updatedPaymentsList.length - 1]?.date || null) : null
        };
      }
      return h;
    });

    const updatedProject = { ...project, paymentPlan: updatedPaymentPlan };

    try {
      if (paymentId !== 'legacy') {
        await deleteItem('transactions', `tx_pay_${paymentId}`);
      }
      await onUpdate(updatedProject);

      // Update local modal state
      const updatedHito = updatedPaymentPlan.find(h => h.id === showHitoPayments.id);
      setShowHitoPayments(updatedHito);
    } catch (err) {
      console.error(err);
      alert('Error al eliminar abono.');
    }
  };

  // 2. Add Expense to a Budget Category
  // 2. Add / Edit Expense to a Budget Category
  const handleAddExpenseSubmit = async (e) => {
    e.preventDefault();
    const amt = parseFloat(expenseData.amount);
    if (!expenseData.description.trim() || amt <= 0) {
      alert('Por favor ingresa detalles y valor de gasto válidos.');
      return;
    }

    const catIdx = expenseData.categoryIndex;
    const updatedBudgetItems = [...project.budgetItems];
    const category = updatedBudgetItems[catIdx];

    // Log in global ledger
    const newTx = {
      projectId: project.id,
      projectName: project.name,
      type: 'expense',
      category: category.category, // 'materials' | 'labor' | 'permits'
      description: `${category.name} || Compra: ${expenseData.description} (Obra: ${project.name})`,
      amount: amt,
      date: expenseData.date
    };

    try {
      if (editingExpenseId !== null) {
        // Editing existing expense
        const oldTx = transactions.find(t => String(t.id) === String(editingExpenseId));
        if (oldTx) {
          const oldAmt = oldTx.amount;
          // Find old budget item name from description
          const oldBudgetItemName = oldTx.description.split(' || ')[0];
          let oldBudgetItem = updatedBudgetItems.find(item => item.name === oldBudgetItemName);
          if (!oldBudgetItem) {
            oldBudgetItem = updatedBudgetItems.find(item => item.category === oldTx.category);
          }
          if (oldBudgetItem) {
            oldBudgetItem.actual = Math.max(0, (oldBudgetItem.actual || 0) - oldAmt);
          }
        }

        // Add new amount to currently selected category
        category.actual = (category.actual || 0) + amt;

        // Save updated transaction in database
        await saveItem('transactions', {
          ...oldTx,
          ...newTx,
          id: editingExpenseId
        });
      } else {
        // Creating new expense
        category.actual = (category.actual || 0) + amt;

        // Save new transaction
        const txWithId = {
          ...newTx,
          id: `tx_${new Date().getTime()}`
        };
        await saveItem('transactions', txWithId);
      }

      const updatedProject = {
        ...project,
        budgetItems: updatedBudgetItems
      };

      await onUpdate(updatedProject);

      // Reset Form
      setExpenseData({
        description: '',
        categoryIndex: 0,
        amount: '',
        date: new Date().toISOString().split('T')[0]
      });
      setEditingExpenseId(null);
      setShowAddExpense(false);
    } catch (err) {
      console.error(err);
      alert('Error al guardar la transacción.');
    }
  };

  const handleOpenEditExpense = (exp, budgetItemIdx) => {
    const parts = exp.description.split(' || ');
    const originalDesc = parts[1] ? parts[1].replace(`Compra: `, '').replace(` (Obra: ${project.name})`, '') : exp.description;

    setExpenseData({
      description: originalDesc,
      categoryIndex: budgetItemIdx,
      amount: exp.amount.toString(),
      date: exp.date
    });
    setEditingExpenseId(exp.id);
    if (project.totalCost > 0) {
      setExpensePercentage(((exp.amount / project.totalCost) * 100).toFixed(2));
    } else {
      setExpensePercentage('');
    }
    setShowAddExpense(true);
  };

  const handleDeleteExpense = async (exp, budgetItemIdx) => {
    if (confirm(`¿Seguro que deseas eliminar el gasto "${exp.description.split(' || ')[1] || exp.description}" por valor de ${formatCurrency(exp.amount)}?`)) {
      try {
        const updatedBudgetItems = [...project.budgetItems];
        
        // Find which budget item to deduct from
        const parts = exp.description.split(' || ');
        let category = null;
        if (parts[1]) {
          category = updatedBudgetItems.find(item => item.name === parts[0]);
        } else {
          category = updatedBudgetItems[budgetItemIdx] || updatedBudgetItems.find(item => item.category === exp.category);
        }

        if (category) {
          category.actual = Math.max(0, (category.actual || 0) - exp.amount);
        }

        const updatedProject = {
          ...project,
          budgetItems: updatedBudgetItems
        };

        // Delete from ledger
        await deleteItem('transactions', exp.id);
        
        // Save project changes
        await onUpdate(updatedProject);
      } catch (err) {
        console.error(err);
        alert('Error al eliminar el gasto.');
      }
    }
  };

  // Add Custom Budget Item
  const handleAddBudgetItemSubmit = (e) => {
    e.preventDefault();
    const est = parseFloat(newBudgetItem.estimated);
    if (!newBudgetItem.name.trim() || est <= 0) {
      alert('Por favor ingresa nombre y estimación presupuestal válidos.');
      return;
    }

    let updatedBudgetItems;
    if (editingBudgetItemIndex !== null) {
      // Editing existing
      updatedBudgetItems = project.budgetItems.map((item, idx) => {
        if (idx === editingBudgetItemIndex) {
          return {
            ...item,
            name: newBudgetItem.name.trim(),
            estimated: est,
            category: newBudgetItem.category
          };
        }
        return item;
      });
    } else {
      // Adding new
      const newItem = {
        name: newBudgetItem.name.trim(),
        estimated: est,
        actual: 0,
        category: newBudgetItem.category
      };
      updatedBudgetItems = [...project.budgetItems, newItem];
    }

    const updatedProject = {
      ...project,
      budgetItems: updatedBudgetItems
    };

    onUpdate(updatedProject);

    // Reset
    setNewBudgetItem({
      name: '',
      estimated: '',
      category: 'materials'
    });
    setEditingBudgetItemIndex(null);
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
          } else if (field === 'amount') {
            const amt = parseFloat(value) || 0;
            item.amount = amt;
            item.percentage = project.totalCost > 0 ? parseFloat(((amt / project.totalCost) * 100).toFixed(2)) : 0;
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
    const totalPct = tempPaymentPlan.reduce((sum, p) => sum + (parseFloat(p.percentage) || 0), 0);
    const totalAmount = tempPaymentPlan.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    const isPlanValid = Math.abs(totalPct - 100) < 0.1 || totalAmount === project.totalCost;

    if (!isPlanValid) {
      const proceed = window.confirm(`⚠️ Advertencia: El plan de pagos no cubre el 100% del proyecto (suma de porcentajes: ${totalPct.toFixed(2)}%, suma de montos: ${formatCurrency(totalAmount)} de ${formatCurrency(project.totalCost)}).\n\n¿Deseas guardar de todas formas?`);
      if (!proceed) return;
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

  // 3. Add Timeline progress update with multiple images/videos
  const handleTimelineFilesChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    files.forEach(file => {
      const fileType = file.type.startsWith('video/') ? 'video' : 'image';
      const reader = new FileReader();
      reader.onload = async () => {
        let base64Result = reader.result;
        if (fileType === 'image') {
          base64Result = await compressImage(base64Result);
        }
        setTimelineData(prev => ({
          ...prev,
          media: [
            ...prev.media,
            { fileBase64: base64Result, fileType }
          ]
        }));
      };
      reader.readAsDataURL(file);
    });
    // Limpiar input
    e.target.value = '';
  };

  const handleRemoveMedia = (index) => {
    setTimelineData(prev => ({
      ...prev,
      media: prev.media.filter((_, i) => i !== index)
    }));
  };

  const handleAddTimelineSubmit = async (e) => {
    e.preventDefault();
    if (!timelineData.description.trim()) {
      alert('Ingresa una descripción del avance.');
      return;
    }

    try {
      await saveProgressLog({
        id: timelineData.id,
        projectId: project.id,
        description: timelineData.description,
        uploadDate: timelineData.uploadDate,
        media: timelineData.media
      });
      
      await loadFiles();
      setShowAddTimeline(false);
      setTimelineData({
        id: null,
        description: '',
        uploadDate: new Date().toISOString().split('T')[0],
        media: []
      });
    } catch (err) {
      console.error('Error saving progress log:', err);
      alert('Ocurrió un error al guardar el avance de obra.');
    }
  };

  const handleDeleteDoc = async (id) => {
    if (confirm('¿Estás seguro de eliminar este documento del expediente?')) {
      await deleteItem('documents', id);
      loadFiles();
    }
  };

  const handleDeleteProgressLog = async (id) => {
    if (confirm('¿Estás seguro de eliminar este registro de avance?')) {
      try {
        await deleteProgressLog(id);
        await loadFiles();
      } catch (err) {
        console.error('Error deleting progress log:', err);
        alert('Ocurrió un error al eliminar el avance de obra.');
      }
    }
  };

  // Calculate totals (including partial payments)
  const totalPaid = project.paymentPlan.reduce((sum, p) => {
    const paidForHito = p.payments && p.payments.length > 0
      ? p.payments.reduce((s, pay) => s + pay.amount, 0)
      : (p.status === 'paid' ? p.amount : 0);
    return sum + paidForHito;
  }, 0);

  const totalBudgetEst = project.budgetItems.reduce((sum, i) => sum + i.estimated, 0);
  const totalBudgetAct = project.budgetItems.reduce((sum, i) => sum + (i.actual || 0), 0);

  return (
    <div className="project-detail-view animate-fade-in">
      {/* Header Navigation */}
      <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '25px', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <button className="btn-icon" onClick={onBack}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
              Obra / Detalles
            </span>
            <h2 style={{ margin: 0, fontSize: '1.6rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              {project.name}
              {userRole !== 'viewer' && (
                <button className="btn-icon" onClick={() => setShowEditProject(true)} title="Editar Ficha Técnica" style={{ padding: '6px', color: 'var(--primary-cyan)', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <Edit3 size={16} />
                </button>
              )}
            </h2>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {project.status === 'planning' ? (
            <span className="badge badge-planning">Planificación</span>
          ) : project.status === 'active' ? (
            <span className="badge badge-progress">En Obra</span>
          ) : project.status === 'halted' ? (
            <span className="badge badge-halted">Detenido</span>
          ) : (
            <span className="badge badge-completed">Terminado</span>
          )}
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
          Bitácora y Avances ({progressLogs.length})
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
                  const isPartial = pay.status === 'partial';
                  const isOverdue = pay.status === 'pending' && pay.dueDate && pay.dueDate < new Date().toISOString().split('T')[0];

                  const milestonePayments = pay.payments || (pay.status === 'paid' ? [{ id: 'legacy', amount: pay.amount, date: pay.paidDate || pay.dueDate, method: 'Transferencia', files: [] }] : []);
                  const hitoTotalPaid = milestonePayments.reduce((s, p) => s + p.amount, 0);
                  const hitoRemaining = Math.max(0, pay.amount - hitoTotalPaid);

                  return (
                    <tr key={pay.id} style={{ borderBottom: '1px solid var(--border-glass)', background: isPaid ? 'rgba(16,185,129,0.02)' : isPartial ? 'rgba(245,158,11,0.02)' : 'transparent' }}>
                      <td style={{ padding: '15px 12px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{pay.name}</div>
                        {isPartial && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                            Cobrado: <strong style={{ color: 'var(--primary-teal)' }}>{formatCurrency(hitoTotalPaid)}</strong> | Falta: <strong style={{ color: 'var(--primary-cyan)' }}>{formatCurrency(hitoRemaining)}</strong>
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '15px 12px', fontWeight: 600 }}>{pay.percentage}%</td>
                      <td style={{ padding: '15px 12px', fontWeight: 700, color: 'var(--text-primary)' }}>{formatCurrency(pay.amount)}</td>
                      <td style={{ padding: '15px 12px', color: isOverdue ? 'var(--primary-red)' : 'var(--text-secondary)' }}>
                        {pay.dueDate || 'Hito de avance'}
                      </td>
                      <td style={{ padding: '15px 12px' }}>
                        {isPaid ? (
                          <span className="badge badge-completed" style={{ fontSize: '0.7rem' }}>Cobrado</span>
                        ) : isPartial ? (
                          <span className="badge badge-planning" style={{ fontSize: '0.7rem', background: 'rgba(245, 158, 11, 0.15)', color: '#fde047', borderColor: 'rgba(245, 158, 11, 0.3)' }}>Parcial</span>
                        ) : isOverdue ? (
                          <span className="badge badge-halted" style={{ fontSize: '0.7rem', background: 'rgba(244,63,94,0.15)', color: '#fda4af', borderColor: 'rgba(244,63,94,0.3)' }}>Vencido</span>
                        ) : (
                          <span className="badge badge-planning" style={{ fontSize: '0.7rem' }}>Pendiente</span>
                        )}
                      </td>
                      <td style={{ padding: '15px 12px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => {
                            setNewPayment({
                              id: null,
                              amount: hitoRemaining > 0 ? hitoRemaining.toString() : '',
                              date: new Date().toISOString().split('T')[0],
                              method: 'Transferencia',
                              files: []
                            });
                            setShowHitoPayments(pay);
                          }}>
                            <Eye size={12} /> {userRole === 'viewer' ? 'Ver Cobros' : 'Gestionar Cobros'}
                          </button>
                          {isPaid && (
                            <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => setShowReceipt(pay)}>
                              <Printer size={12} /> Recibo
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
                  <button className="btn btn-secondary" onClick={() => { setEditingBudgetItemIndex(null); setNewBudgetItem({ name: '', estimated: '', category: 'materials' }); setCalcPercentage(''); setShowAddBudgetItem(true); }}>
                    <Plus size={16} /> Agregar Renglón
                  </button>
                  <button className="btn btn-primary" onClick={() => { 
                    setEditingExpenseId(null); 
                    setExpenseData({
                      description: '',
                      categoryIndex: 0,
                      amount: '',
                      date: new Date().toISOString().split('T')[0]
                    });
                    setExpensePercentage(''); 
                    setShowAddExpense(true); 
                  }}>
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
                            <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
                              <button
                                type="button"
                                style={{ background: 'none', border: 'none', color: 'var(--primary-cyan)', cursor: 'pointer', padding: '0', display: 'inline-flex', alignItems: 'center' }}
                                onClick={() => handleOpenEditBudgetItem(idx)}
                                title="Editar renglón presupuestario"
                              >
                                <Edit3 size={12} />
                              </button>
                              <button
                                type="button"
                                style={{ background: 'none', border: 'none', color: 'var(--primary-red)', cursor: 'pointer', padding: '0', display: 'inline-flex', alignItems: 'center' }}
                                onClick={() => handleRemoveBudgetItem(idx)}
                                title="Eliminar renglón presupuestario"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
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

                    {/* Gastos asociados a este renglón */}
                    {(() => {
                      const itemExpenses = transactions.filter(t => 
                        String(t.projectId) === String(project.id) &&
                        t.type === 'expense' &&
                        t.description.startsWith(item.name + ' || ')
                      );

                      if (itemExpenses.length === 0) return null;

                      return (
                        <div style={{ marginTop: '12px', borderTop: '1px dashed var(--border-glass)', paddingTop: '10px' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Gastos / Compras registrados:</span>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                            {itemExpenses.map((exp) => {
                              const descParts = exp.description.split(' || ');
                              const displayDesc = descParts[1] 
                                ? descParts[1].replace('Compra: ', '').replace(` (Obra: ${project.name})`, '')
                                : exp.description;
                              return (
                                <div key={exp.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', padding: '6px 10px', borderRadius: '6px' }}>
                                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{displayDesc}</span>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{exp.date}</span>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{formatCurrency(exp.amount)}</span>
                                    {userRole !== 'viewer' && (
                                      <div style={{ display: 'flex', gap: '4px' }}>
                                        <button 
                                          type="button" 
                                          style={{ background: 'none', border: 'none', color: 'var(--primary-cyan)', cursor: 'pointer', padding: '0', display: 'inline-flex', alignItems: 'center' }}
                                          onClick={() => handleOpenEditExpense(exp, idx)}
                                          title="Editar gasto"
                                        >
                                          <Edit3 size={11} />
                                        </button>
                                        <button 
                                          type="button" 
                                          style={{ background: 'none', border: 'none', color: 'var(--primary-red)', cursor: 'pointer', padding: '0', display: 'inline-flex', alignItems: 'center' }}
                                          onClick={() => handleDeleteExpense(exp, idx)}
                                          title="Eliminar gasto"
                                        >
                                          <Trash2 size={11} />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                );
              })}
            </div>

            {/* Unclassified expenses (Legacy) */}
            {(() => {
              const unclassifiedExpenses = transactions.filter(t => {
                if (String(t.projectId) !== String(project.id) || t.type !== 'expense') return false;
                const belongsToAnyItem = project.budgetItems.some(item => t.description.startsWith(item.name + ' || '));
                return !belongsToAnyItem;
              });

              if (unclassifiedExpenses.length === 0) return null;

              return (
                <div className="glass-panel" style={{ padding: '16px', borderRadius: '12px', background: 'rgba(245,158,11,0.02)', border: '1px dashed rgba(245,158,11,0.2)', marginBottom: '15px' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--primary-orange)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    ⚠️ Gastos sin Clasificar en Renglón ({unclassifiedExpenses.length})
                  </h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                    Estos gastos fueron registrados previamente. Haz clic en el lápiz para editarlos y asignarlos a un renglón presupuestario específico.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {unclassifiedExpenses.map((exp) => (
                      <div key={exp.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', padding: '6px 10px', borderRadius: '6px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{exp.description}</span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{exp.date}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{formatCurrency(exp.amount)}</span>
                          {userRole !== 'viewer' && (
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button 
                                type="button" 
                                style={{ background: 'none', border: 'none', color: 'var(--primary-cyan)', cursor: 'pointer', padding: '0', display: 'inline-flex', alignItems: 'center' }}
                                onClick={() => handleOpenEditExpense(exp, 0)}
                                title="Asignar a un renglón"
                              >
                                <Edit3 size={11} />
                              </button>
                              <button 
                                type="button" 
                                style={{ background: 'none', border: 'none', color: 'var(--primary-red)', cursor: 'pointer', padding: '0', display: 'inline-flex', alignItems: 'center' }}
                                onClick={() => handleDeleteExpense(exp, 0)}
                                title="Eliminar gasto"
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

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
              <button 
                className="btn btn-primary" 
                onClick={() => {
                  setTimelineData({
                    id: null,
                    description: '',
                    uploadDate: new Date().toISOString().split('T')[0],
                    media: []
                  });
                  setShowAddTimeline(true);
                }}
              >
                <Plus size={16} /> Agregar Avance de Obra
              </button>
            )}
          </div>

          {progressLogs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)', border: '2px dashed var(--border-glass)', borderRadius: '12px' }}>
              <ImageIcon size={48} style={{ color: 'var(--text-muted)', marginBottom: '15px' }} />
              <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '5px' }}>Sin Registros de Avance</p>
              <p style={{ fontSize: '0.85rem' }}>Registra hitos del progreso de la construcción adjuntando fotos o videos del terreno.</p>
            </div>
          ) : (
            <div className="timeline">
              {progressLogs.map((item) => (
                <div key={item.id} className="timeline-item">
                  <div className="timeline-dot"></div>
                  <div className="timeline-content" style={{ width: '100%' }}>
                    <div className="timeline-meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="timeline-date" style={{ fontSize: '0.85rem', color: 'var(--primary-cyan)', fontWeight: 600 }}>{item.uploadDate}</span>
                      {userRole !== 'viewer' && (
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button 
                            type="button"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }} 
                            onClick={() => {
                              setTimelineData({
                                id: item.id,
                                description: item.description,
                                uploadDate: item.uploadDate,
                                media: [...item.media]
                              });
                              setShowAddTimeline(true);
                            }}
                            title="Editar avance"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button 
                            type="button"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary-red)' }} 
                            onClick={() => handleDeleteProgressLog(item.id)}
                            title="Eliminar avance"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                    <p style={{ color: 'var(--text-primary)', fontSize: '0.95rem', marginBottom: '12px', marginTop: '6px' }}>
                      {item.description}
                    </p>

                    {item.media && item.media.length > 0 && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px', marginTop: '10px' }}>
                        {item.media.map((mediaItem, idx) => (
                          <div key={idx} style={{ position: 'relative', height: '110px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-glass)', background: 'rgba(0,0,0,0.2)' }}>
                            {mediaItem.fileType === 'video' ? (
                              <video 
                                src={mediaItem.fileBase64} 
                                style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }} 
                                onClick={() => {
                                  const w = window.open();
                                  w.document.write(`<div style="background:#000; width:100vw; height:100vh; display:flex; align-items:center; justify-content:center;"><video src="${mediaItem.fileBase64}" controls style="max-width:100%; max-height:100vh; display:block;" /></div>`);
                                  w.document.body.style.margin = '0';
                                  w.document.title = "Video de Avance";
                                }} 
                              />
                            ) : (
                              <img 
                                src={mediaItem.fileBase64} 
                                alt="Avance" 
                                loading="lazy"
                                style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }}
                                onClick={() => {
                                  const w = window.open();
                                  w.document.write(`<div style="background:#000; width:100vw; height:100vh; display:flex; align-items:center; justify-content:center;"><img src="${mediaItem.fileBase64}" style="max-width:100%; max-height:100vh; display:block;" /></div>`);
                                  w.document.body.style.margin = '0';
                                  w.document.title = "Imagen de Avance";
                                }}
                              />
                            )}
                          </div>
                        ))}
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
              <h3>{editingExpenseId !== null ? 'Editar Gasto / Compra' : 'Registrar Compra / Gasto en Obra'}</h3>
              <button className="btn-icon" onClick={() => { setShowAddExpense(false); setEditingExpenseId(null); }}><X size={18} /></button>
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
                <button type="button" className="btn btn-secondary" onClick={() => { setShowAddExpense(false); setEditingExpenseId(null); }}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingExpenseId !== null ? 'Guardar Cambios' : 'Registrar Transacción'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TIMELINE ADD/EDIT MODAL */}
      {showAddTimeline && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>{timelineData.id ? 'Editar Avance de Obra' : 'Registrar Avance de Obra'}</h3>
              <button className="btn-icon" onClick={() => setShowAddTimeline(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleAddTimelineSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div className="form-group">
                  <label>Fecha del Avance</label>
                  <input
                    type="date"
                    className="form-control"
                    value={timelineData.uploadDate}
                    onChange={(e) => setTimelineData(prev => ({ ...prev, uploadDate: e.target.value }))}
                    required
                  />
                </div>

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
                  <label>Fotos / Videos del Avance (Puedes elegir múltiples)</label>
                  <input
                    type="file"
                    className="form-control"
                    accept="image/*,video/*"
                    multiple
                    onChange={handleTimelineFilesChange}
                  />
                </div>

                {/* Previews of uploaded media in the log */}
                {timelineData.media && timelineData.media.length > 0 && (
                  <div>
                    <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Archivos Seleccionados ({timelineData.media.length})
                    </label>
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', 
                      gap: '10px', 
                      marginTop: '8px',
                      maxHeight: '180px',
                      overflowY: 'auto',
                      padding: '5px',
                      border: '1px solid var(--border-glass)',
                      borderRadius: '8px',
                      background: 'rgba(0,0,0,0.1)'
                    }}>
                      {timelineData.media.map((mediaItem, idx) => (
                        <div key={idx} style={{ position: 'relative', height: '80px', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border-glass)' }}>
                          {mediaItem.fileType === 'video' ? (
                            <video src={mediaItem.fileBase64} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <img src={mediaItem.fileBase64} alt="Previa" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveMedia(idx)}
                            style={{
                              position: 'absolute',
                              top: '4px',
                              right: '4px',
                              background: 'rgba(244, 63, 94, 0.85)',
                              border: 'none',
                              borderRadius: '50%',
                              color: 'white',
                              width: '18px',
                              height: '18px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer'
                            }}
                            title="Quitar archivo"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddTimeline(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={!timelineData.description.trim()}>
                  {timelineData.id ? 'Guardar Cambios' : 'Guardar Avance'}
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

      {/* GESTIONAR COBROS (PAGOS PARCIALES) MODAL */}
      {showHitoPayments && (() => {
        const milestonePayments = showHitoPayments.payments || (showHitoPayments.status === 'paid' ? [{ id: 'legacy', amount: showHitoPayments.amount, date: showHitoPayments.paidDate || showHitoPayments.dueDate, method: 'Transferencia', files: [] }] : []);
        const hitoTotalPaid = milestonePayments.reduce((s, p) => s + p.amount, 0);
        const hitoRemaining = Math.max(0, showHitoPayments.amount - hitoTotalPaid);

        return (
          <div className="modal-overlay animate-fade-in">
            <div className="modal-content" style={{ maxWidth: '650px' }}>
              <div className="modal-header">
                <div style={{ textAlign: 'left' }}>
                  <h3 style={{ margin: 0 }}>Gestionar Cobros - Hito</h3>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{showHitoPayments.name}</span>
                </div>
                <button className="btn-icon" onClick={() => setShowHitoPayments(null)}><X size={18} /></button>
              </div>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '75vh', overflowY: 'auto' }}>
                
                {/* Milestone Balance Card */}
                <div style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: '12px',
                  padding: '15px 20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '15px',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ minWidth: '120px' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Monto del Hito</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '4px' }}>{formatCurrency(showHitoPayments.amount)}</div>
                  </div>
                  <div style={{ minWidth: '120px' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Total Cobrado</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary-teal)', marginTop: '4px' }}>{formatCurrency(hitoTotalPaid)}</div>
                  </div>
                  <div style={{ minWidth: '120px' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Saldo Pendiente</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: hitoRemaining > 0 ? 'var(--primary-cyan)' : 'var(--text-muted)', marginTop: '4px' }}>{formatCurrency(hitoRemaining)}</div>
                  </div>
                </div>

                {/* Form to add a new abono (Admins/Editors only and only if there's remaining balance) */}
                {userRole !== 'viewer' && hitoRemaining > 0 && (
                  <form onSubmit={handleSavePaymentSubmit} style={{ background: 'rgba(255, 109, 0, 0.02)', border: '1px dashed var(--border-glass-active)', padding: '18px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Registrar Nuevo Abono / Comprobante</h4>
                    
                    <div className="form-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
                      <div className="form-group">
                        <label>Monto Recibido ($)</label>
                        <input
                          type="number"
                          className="form-control"
                          placeholder="Ej. 10000000"
                          value={newPayment.amount}
                          onChange={(e) => setNewPayment(prev => ({ ...prev, amount: e.target.value }))}
                          max={hitoRemaining}
                          required
                        />
                      </div>
                      
                      <div className="form-group">
                        <label>Fecha de Pago</label>
                        <input
                          type="date"
                          className="form-control"
                          value={newPayment.date}
                          onChange={(e) => setNewPayment(prev => ({ ...prev, date: e.target.value }))}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label>Método de Pago</label>
                        <select
                          className="form-control"
                          value={newPayment.method}
                          onChange={(e) => setNewPayment(prev => ({ ...prev, method: e.target.value }))}
                        >
                          <option value="Transferencia">Transferencia</option>
                          <option value="Efectivo">Efectivo</option>
                          <option value="Cheque">Cheque</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Comprobantes Adjuntos (PDF o Imagen)</label>
                      <input
                        type="file"
                        className="form-control"
                        accept="image/*,application/pdf"
                        multiple
                        onChange={handlePaymentFileChange}
                      />
                    </div>

                    {/* Form File Previews */}
                    {newPayment.files && newPayment.files.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '5px' }}>
                        {newPayment.files.map((file, idx) => (
                          <div key={idx} style={{ position: 'relative', height: '65px', width: '80px', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border-glass)', background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {file.fileType === 'pdf' ? (
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', color: '#fda4af', fontWeight: 600 }}>
                                <span style={{ fontSize: '1rem' }}>📄</span>
                                <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '70px' }}>{file.fileName}</span>
                              </div>
                            ) : (
                              <img src={file.fileBase64} alt="comprobante" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemovePaymentFile(idx)}
                              style={{
                                position: 'absolute',
                                top: '2px',
                                right: '2px',
                                background: 'rgba(244,63,94,0.85)',
                                border: 'none',
                                borderRadius: '50%',
                                color: 'white',
                                width: '15px',
                                height: '15px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '8px',
                                cursor: 'pointer'
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <button type="submit" className="btn btn-success" style={{ padding: '8px', fontSize: '0.9rem', width: '100%', marginTop: '5px' }}>
                      Registrar Cobro
                    </button>
                  </form>
                )}

                {/* Receipts list */}
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '12px' }}>Historial de Cobros Recibidos</h4>
                  {milestonePayments.length === 0 ? (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>
                      No se han registrado pagos para este hito.
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {milestonePayments.map((p, idx) => (
                        <div key={p.id || idx} style={{
                          background: 'rgba(255, 255, 255, 0.01)',
                          border: '1px solid var(--border-glass)',
                          borderRadius: '10px',
                          padding: '12px 15px'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--primary-teal)' }}>
                                  {formatCurrency(p.amount)}
                                </span>
                                <span style={{ fontSize: '0.75rem', background: 'rgba(255, 255, 255, 0.05)', padding: '2px 6px', borderRadius: '4px', color: 'var(--text-secondary)' }}>
                                  {p.method}
                                </span>
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                Fecha envío/pago: <strong>{p.date}</strong>
                              </div>
                            </div>
                            
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button 
                                className="btn btn-secondary" 
                                style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                                onClick={() => {
                                  setShowReceipt({
                                    ...showHitoPayments,
                                    id: p.id,
                                    paidDate: p.date,
                                    amount: p.amount,
                                    payments: [p] // Pass only this payment
                                  });
                                }}
                              >
                                <Printer size={12} /> Recibo
                              </button>
                              {userRole !== 'viewer' && (
                                <button 
                                  className="btn-icon" 
                                  style={{ padding: '4px', color: 'var(--primary-red)', background: 'transparent', border: 'none', cursor: 'pointer' }}
                                  onClick={() => handleDeletePayment(p.id)}
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Render files attached to this payment */}
                          {p.files && p.files.length > 0 && (
                            <div style={{ marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '10px' }}>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Comprobantes Adjuntos:</div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                {p.files.map((file, fIdx) => (
                                  <div 
                                    key={fIdx} 
                                    onClick={() => {
                                      const w = window.open();
                                      if (file.fileType === 'pdf') {
                                        w.document.write(`<embed width="100%" height="100%" src="${file.fileBase64}" type="application/pdf" />`);
                                      } else {
                                        w.document.write(`<div style="background:#000; width:100vw; height:100vh; display:flex; align-items:center; justify-content:center;"><img src="${file.fileBase64}" style="max-width:100%; max-height:100vh;" /></div>`);
                                      }
                                      w.document.body.style.margin = '0';
                                      w.document.title = file.fileName || 'Comprobante';
                                    }}
                                    style={{
                                      background: 'rgba(255, 255, 255, 0.03)',
                                      border: '1px solid var(--border-glass)',
                                      borderRadius: '6px',
                                      padding: '6px 10px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '8px',
                                      fontSize: '0.75rem',
                                      color: 'var(--text-primary)',
                                      cursor: 'pointer',
                                      transition: 'var(--transition-smooth)'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary-cyan)'}
                                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-glass)'}
                                  >
                                    <span>{file.fileType === 'pdf' ? '📄' : '🖼️'}</span>
                                    <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      {file.fileName || `archivo_${fIdx + 1}`}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowHitoPayments(null)}>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        );
      })()}
      {/* ADD BUDGET ITEM MODAL */}
      {showAddBudgetItem && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>{editingBudgetItemIndex !== null ? 'Editar Renglón Presupuestario' : 'Agregar Nuevo Renglón Presupuestario'}</h3>
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
                  {editingBudgetItemIndex !== null ? 'Guardar Cambios' : 'Agregar Renglón'}
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
                          required
                        />
                      </div>

                      {/* Amount input */}
                      <div style={{ width: '150px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>$</span>
                        <input
                          type="number"
                          className="form-control"
                          value={pay.amount !== undefined && pay.amount !== null ? pay.amount : ''}
                          onChange={(e) => handleTempPaymentChange(pay.id, 'amount', e.target.value)}
                          placeholder="Monto"
                          min="0"
                          required
                          style={isPaid ? { borderColor: 'rgba(16,185,129,0.3)', color: 'var(--primary-teal)', fontWeight: 600 } : {}}
                        />
                      </div>

                      {/* Action / Delete */}
                      <div style={{ width: '90px', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                        {isPaid && (
                          <span className="badge badge-completed" style={{ fontSize: '0.65rem', padding: '3px 6px' }}>Cobrado</span>
                        )}
                        <button 
                          type="button" 
                          className="btn-icon" 
                          style={{ padding: '6px', color: 'var(--primary-red)', background: 'rgba(244,63,94,0.05)', borderColor: 'rgba(244,63,94,0.1)' }}
                          onClick={() => handleRemoveTempPayment(pay.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Percentages validation display */}
              {(() => {
                const totalTempPct = tempPaymentPlan.reduce((sum, p) => sum + (parseFloat(p.percentage) || 0), 0);
                const totalTempAmount = tempPaymentPlan.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
                const isPlanValid = Math.abs(totalTempPct - 100) < 0.1 || totalTempAmount === project.totalCost;
                return (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px', padding: '10px 15px', borderRadius: '8px', background: isPlanValid ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)', border: isPlanValid ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(245,158,11,0.2)' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Total Distribuido del Plan:
                    </span>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem', color: isPlanValid ? 'var(--primary-teal)' : 'var(--primary-orange)' }}>
                      {totalTempPct.toFixed(2)}% / 100% {isPlanValid ? '✓ Listo' : '⚠️ Pendiente'}
                    </span>
                  </div>
                );
              })()}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowEditPaymentPlan(false)}>
                Cancelar
              </button>
              <button type="button" className="btn btn-primary" onClick={handleSavePaymentPlan}>
                Guardar Reestructuración
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT PROJECT MODAL */}
      {showEditProject && (
        <ProjectForm
          project={project}
          onClose={() => setShowEditProject(false)}
          onSave={async (updatedProj) => {
            await onUpdate(updatedProj);
            setShowEditProject(false);
          }}
        />
      )}
    </div>
  );
}
