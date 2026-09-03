import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ProjectCard from './components/ProjectCard';
import ProjectDetail from './components/ProjectDetail';
import ProjectForm from './components/ProjectForm';
import Ledger from './components/Ledger';
import Login from './components/Login';
import LockScreen from './components/LockScreen';
import UserManagement from './components/UserManagement';
import ApiSettings from './components/ApiSettings';
import ProjectManagement from './components/ProjectManagement';
import QuoteCalculator from './components/QuoteCalculator';
import PersonnelManagement from './components/PersonnelManagement';
import { 
  seedMockData, 
  getAll, 
  saveItem, 
  deleteItem,
  getPortfolio,
  savePortfolioItem,
  deletePortfolioItem
} from './db/supabase';
import { HardHat, Plus, Search, Calendar, Landmark, Menu } from 'lucide-react';
import Portfolio from './components/Portfolio';
import { getCachedData, setCachedData } from './db/storage';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLocked, setIsLocked] = useState(false);
  const [currentTab, setTab] = useState('dashboard');
  const [toasts, setToasts] = useState([]);
  const [confirmData, setConfirmData] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [personnel, setPersonnel] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [projectSearch, setProjectSearch] = useState('');
  const [isGlobalLoading, setIsGlobalLoading] = useState(false);

  // Override window.alert and window.confirm with premium custom UI elements
  useEffect(() => {
    window.showToast = (message, type = 'info') => {
      const id = Date.now() + Math.random();
      setToasts(prev => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 4000);
    };

    window.alert = (message) => {
      let type = 'info';
      const lower = message.toLowerCase();
      if (lower.includes('error') || lower.includes('falló') || lower.includes('no se pudo') || lower.includes('válido') || lower.includes('ingresa') || lower.includes('incorrecto') || lower.includes('error')) {
        type = 'error';
      } else if (lower.includes('guardado') || lower.includes('éxito') || lower.includes('creado') || lower.includes('actualizado') || lower.includes('eliminado') || lower.includes('correcto') || lower.includes('bien')) {
        type = 'success';
      }
      window.showToast(message, type);
    };

    window.confirmDialog = (message) => {
      return new Promise((resolve) => {
        setConfirmData({
          message,
          resolve: (result) => {
            setConfirmData(null);
            resolve(result);
          }
        });
      });
    };

    window.setGlobalLoading = (state) => {
      setIsGlobalLoading(state);
    };
  }, []);

  // Initial database setup and session recovery
  useEffect(() => {
    const initApp = async () => {
      try {
        const savedSession = localStorage.getItem('habitech_user_session');
        if (savedSession) {
          setCurrentUser(JSON.parse(savedSession));
        }
        await seedMockData();
        await loadData();
      } catch (err) {
        console.error('Initialization error:', err);
      } finally {
        setLoading(false);
      }
    };
    initApp();
  }, []);

  const loadData = async () => {
    // 1. Try loading cached data first for instant load
    try {
      const [cachedProjects, cachedTransactions, cachedPortfolio, cachedPersonnel] = await Promise.all([
        getCachedData('supabase_projects'),
        getCachedData('supabase_transactions'),
        getCachedData('supabase_portfolio'),
        getCachedData('supabase_personnel')
      ]);

      if (cachedProjects) setProjects(cachedProjects);
      if (cachedTransactions) setTransactions(cachedTransactions);
      if (cachedPortfolio) setPortfolio(cachedPortfolio);
      if (cachedPersonnel) setPersonnel(cachedPersonnel);
    } catch (cacheErr) {
      console.warn('Failed to load cached projects/transactions:', cacheErr);
    }

    // 2. Fetch fresh data from Supabase
    try {
      const allProj = await getAll('projects');
      const allTx = await getAll('transactions');
      setProjects(allProj);
      setTransactions(allTx);
      
      let allPort = [];
      try {
        allPort = await getPortfolio();
        setPortfolio(allPort);
      } catch (portErr) {
        console.warn('Portfolio table may not exist yet in Supabase. Check supabase_schema.sql.', portErr);
      }

      let allPersonnel = [];
      try {
        allPersonnel = await getAll('personnel');
        setPersonnel(allPersonnel);
      } catch (personnelErr) {
        console.warn('Personnel table may not exist yet in Supabase. Check supabase_schema.sql.', personnelErr);
      }

      // Save fresh data to cache for next load
      try {
        await Promise.all([
          setCachedData('supabase_projects', allProj),
          setCachedData('supabase_transactions', allTx),
          allPort.length > 0 ? setCachedData('supabase_portfolio', allPort) : Promise.resolve(),
          allPersonnel.length > 0 ? setCachedData('supabase_personnel', allPersonnel) : Promise.resolve()
        ]);
      } catch (cacheErr) {
        console.warn('Failed to save to cache:', cacheErr);
      }
    } catch (err) {
      console.error('Error loading data:', err);
    }
  };

  const handleSavePortfolioItem = async (updatedItem) => {
    try {
      await savePortfolioItem(updatedItem);
      await loadData();
    } catch (err) {
      console.error('Error saving portfolio item:', err);
      alert('Ocurrió un error al guardar el proyecto del portafolio.');
    }
  };

  const handleDeletePortfolioItem = async (id) => {
    if (currentUser.role === 'viewer') return;
    if (await window.confirmDialog('¿Estás seguro de eliminar este proyecto del portafolio?')) {
      try {
        await deletePortfolioItem(id);
        await loadData();
      } catch (err) {
        console.error('Error deleting portfolio item:', err);
        alert('Ocurrió un error al eliminar el proyecto.');
      }
    }
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setIsLocked(false);
    localStorage.setItem('habitech_user_session', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsLocked(false);
    localStorage.removeItem('habitech_user_session');
    setTab('dashboard');
    setSelectedProjectId(null);
  };

  // Add a new project or update an existing one
  const handleSaveProject = async (updatedProject) => {
    try {
      await saveItem('projects', updatedProject);
      await loadData();
      setShowProjectForm(false);
    } catch (err) {
      console.error('Error saving project:', err);
      alert('Error al guardar el proyecto.');
    }
  };

  // Delete a project completely
  const handleDeleteProject = async (projId) => {
    if (currentUser.role === 'viewer') return;
    if (await window.confirmDialog('¿Estás seguro de eliminar esta obra? Todos sus datos se borrarán.')) {
      try {
        await deleteItem('projects', projId);
        await loadData();
        setSelectedProjectId(null);
      } catch (err) {
        console.error('Error deleting project:', err);
      }
    }
  };

  // Log global transactions (from invoice payments or project detail purchases)
  const logGlobalTransaction = async (newTx) => {
    try {
      const txWithId = {
        ...newTx,
        id: `tx_${new Date().getTime()}`
      };
      await saveItem('transactions', txWithId);
      await loadData();
    } catch (err) {
      console.error('Error logging transaction:', err);
    }
  };

  // Log manual transactions and automatically update project budget or milestone payments
  const handleAddManualTransaction = async (newTx) => {
    try {
      const paymentId = newTx.paymentId || `pay_${Date.now()}`;
      const txWithId = {
        ...newTx,
        id: newTx.id || `tx_${new Date().getTime()}`,
        paymentId
      };
      
      // 1. If transaction is tied to a specific project and is an Income (Cobro a Cliente), sync to paymentPlan milestones!
      if (newTx.projectId && newTx.projectId !== 'general' && newTx.type === 'income') {
        const freshProjects = await getAll('projects');
        const targetProj = freshProjects.find(p => p.id === newTx.projectId) || projects.find(p => p.id === newTx.projectId);
        if (targetProj) {
          const newPaymentItem = {
            id: paymentId,
            amount: newTx.amount,
            date: newTx.date,
            method: newTx.method || 'Transferencia',
            files: newTx.receiptBase64 
              ? [{ fileName: 'Comprobante de Caja', fileType: 'image', fileBase64: newTx.receiptBase64 }] 
              : (newTx.files || [])
          };

          let updatedPaymentPlan = [...(targetProj.paymentPlan || [])];
          let targetMilestone = null;

          if (newTx.milestoneId) {
            targetMilestone = updatedPaymentPlan.find(m => m.id === newTx.milestoneId);
          }

          // If milestoneId not found or not specified, pick the first milestone with remaining balance or first milestone
          if (!targetMilestone && updatedPaymentPlan.length > 0) {
            targetMilestone = updatedPaymentPlan.find(m => {
              const mPaid = (m.payments || []).reduce((s, p) => s + p.amount, 0);
              return mPaid < m.amount;
            }) || updatedPaymentPlan[0];
          }

          if (targetMilestone) {
            updatedPaymentPlan = updatedPaymentPlan.map(m => {
              if (m.id === targetMilestone.id) {
                const existing = m.payments || (m.status === 'paid' ? [{ id: 'legacy', amount: m.amount, date: m.paidDate || m.dueDate, method: 'Transferencia', files: [] }] : []);
                const updatedPayments = [...existing, newPaymentItem];
                const hitoTotalPaid = updatedPayments.reduce((s, p) => s + p.amount, 0);
                const updatedStatus = hitoTotalPaid >= m.amount ? 'paid' : 'partial';
                return {
                  ...m,
                  payments: updatedPayments,
                  status: updatedStatus,
                  paidDate: updatedStatus === 'paid' ? newTx.date : (m.paidDate || null)
                };
              }
              return m;
            });

            txWithId.milestoneId = targetMilestone.id;
            txWithId.milestoneName = targetMilestone.name;
          } else {
            // If project has no payment plan milestones at all, create an initial milestone
            const newMilestone = {
              id: 'h_' + Date.now(),
              name: newTx.description || 'Cobro Inicial / Abono',
              amount: newTx.amount,
              percentage: 100,
              status: 'paid',
              dueDate: newTx.date,
              paidDate: newTx.date,
              payments: [newPaymentItem]
            };
            updatedPaymentPlan = [newMilestone];
            txWithId.milestoneId = newMilestone.id;
            txWithId.milestoneName = newMilestone.name;
          }

          const updatedProj = { ...targetProj, paymentPlan: updatedPaymentPlan };
          await saveItem('projects', updatedProj);
        }
      }

      // 2. If transaction is tied to a specific project and is an expense, sync to its budget
      if (newTx.projectId && newTx.projectId !== 'general' && newTx.type === 'expense') {
        const freshProjects = await getAll('projects');
        const targetProj = freshProjects.find(p => p.id === newTx.projectId) || projects.find(p => p.id === newTx.projectId);
        if (targetProj && targetProj.budgetItems) {
          const updatedBudget = targetProj.budgetItems.map(item => {
            if (item.category === newTx.category || item.id === newTx.budgetItemId || item.name === newTx.budgetItemName) {
              return { ...item, actual: (item.actual || 0) + newTx.amount };
            }
            return item;
          });
          
          const updatedProj = { ...targetProj, budgetItems: updatedBudget };
          await saveItem('projects', updatedProj);
        }
      }

      // Save the transaction in ledger
      await saveItem('transactions', txWithId);

      await loadData();
    } catch (err) {
      console.error('Error saving manual transaction:', err);
      alert('Ocurrió un error al registrar el movimiento.');
    }
  };

  // Update transaction and adjust associated project budgets and milestone payments if applicable
  const handleUpdateTransaction = async (updatedTx, oldTx) => {
    try {
      // 1. Save updated transaction
      await saveItem('transactions', updatedTx);

      const freshProjects = await getAll('projects');

      // 2. Adjust milestone payments if old transaction was project income
      if (oldTx && oldTx.projectId && oldTx.projectId !== 'general' && oldTx.type === 'income') {
        const oldProj = freshProjects.find(p => p.id === oldTx.projectId);
        if (oldProj && oldProj.paymentPlan) {
          const paymentId = oldTx.paymentId || (oldTx.id && String(oldTx.id).startsWith('tx_pay_') ? String(oldTx.id).replace('tx_pay_', '') : oldTx.id);
          const updatedPlan = oldProj.paymentPlan.map(m => {
            if (m.payments) {
              const filtered = m.payments.filter(p => p.id !== paymentId && `tx_pay_${p.id}` !== oldTx.id && p.id !== oldTx.id);
              const hitoTotalPaid = filtered.reduce((s, p) => s + p.amount, 0);
              const updatedStatus = hitoTotalPaid >= m.amount ? 'paid' : (hitoTotalPaid > 0 ? 'partial' : 'pending');
              return {
                ...m,
                payments: filtered,
                status: updatedStatus,
                paidDate: updatedStatus === 'paid' ? (filtered[filtered.length - 1]?.date || null) : null
              };
            }
            return m;
          });
          await saveItem('projects', { ...oldProj, paymentPlan: updatedPlan });
        }
      }

      // 3. If updated transaction is active project income (not canceled), add/update in target project
      const isCanceled = updatedTx.description && (updatedTx.description.startsWith('[CANCELADO]') || updatedTx.description.startsWith('[ANULADO]'));
      if (!isCanceled && updatedTx.projectId && updatedTx.projectId !== 'general' && updatedTx.type === 'income' && updatedTx.amount > 0) {
        const freshProjects2 = await getAll('projects');
        const targetProj = freshProjects2.find(p => p.id === updatedTx.projectId);
        if (targetProj && targetProj.paymentPlan) {
          const paymentId = updatedTx.paymentId || `pay_${Date.now()}`;
          const newPaymentItem = {
            id: paymentId,
            amount: updatedTx.amount,
            date: updatedTx.date,
            method: updatedTx.method || 'Transferencia',
            files: updatedTx.receiptBase64 
              ? [{ fileName: 'Comprobante de Caja', fileType: 'image', fileBase64: updatedTx.receiptBase64 }] 
              : (updatedTx.files || [])
          };

          let targetMilestone = targetProj.paymentPlan.find(m => m.id === updatedTx.milestoneId) || targetProj.paymentPlan[0];
          if (targetMilestone) {
            const updatedPlan = targetProj.paymentPlan.map(m => {
              if (m.id === targetMilestone.id) {
                const existing = m.payments || [];
                const updatedPayments = [...existing.filter(p => p.id !== paymentId && p.id !== updatedTx.id), newPaymentItem];
                const hitoTotalPaid = updatedPayments.reduce((s, p) => s + p.amount, 0);
                const updatedStatus = hitoTotalPaid >= m.amount ? 'paid' : 'partial';
                return {
                  ...m,
                  payments: updatedPayments,
                  status: updatedStatus,
                  paidDate: updatedStatus === 'paid' ? updatedTx.date : (m.paidDate || null)
                };
              }
              return m;
            });
            await saveItem('projects', { ...targetProj, paymentPlan: updatedPlan });
          }
        }
      }

      // 4. Adjust budgets for expenses
      if (oldTx && oldTx.projectId && oldTx.projectId !== 'general' && oldTx.type === 'expense') {
        const freshProjects3 = await getAll('projects');
        const oldProj = freshProjects3.find(p => p.id === oldTx.projectId);
        if (oldProj && oldProj.budgetItems) {
          const updatedBudget = oldProj.budgetItems.map(item => {
            if (item.category === oldTx.category) {
              return { ...item, actual: Math.max(0, (item.actual || 0) - oldTx.amount) };
            }
            return item;
          });
          await saveItem('projects', { ...oldProj, budgetItems: updatedBudget });
        }
      }

      if (!isCanceled && updatedTx.projectId && updatedTx.projectId !== 'general' && updatedTx.type === 'expense' && updatedTx.amount > 0) {
        const freshProjects4 = await getAll('projects');
        const targetProj = freshProjects4.find(p => p.id === updatedTx.projectId);
        if (targetProj && targetProj.budgetItems) {
          const updatedBudget = targetProj.budgetItems.map(item => {
            if (item.category === updatedTx.category) {
              return { ...item, actual: (item.actual || 0) + updatedTx.amount };
            }
            return item;
          });
          await saveItem('projects', { ...targetProj, budgetItems: updatedBudget });
        }
      }

      await loadData();
    } catch (err) {
      console.error('Error updating transaction:', err);
      alert('Ocurrió un error al actualizar la transacción.');
    }
  };

  const activeProject = projects.find(p => p.id === selectedProjectId);

  // Inactivity tracking (5 minutes lock for all users)
  useEffect(() => {
    if (!currentUser || isLocked) {
      return;
    }

    const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes
    let timeoutId;

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsLocked(true);
      }, INACTIVITY_TIMEOUT);
    };

    const activityEvents = ['mousemove', 'keydown', 'mousedown', 'click', 'scroll', 'touchstart'];

    const handleUserActivity = () => {
      resetTimer();
    };

    activityEvents.forEach(event => {
      window.addEventListener(event, handleUserActivity);
    });

    // Initialize timer
    resetTimer();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleUserActivity);
      });
    };
  }, [currentUser, isLocked]);

  // Filtering projects
  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(projectSearch.toLowerCase()) ||
    p.clientName.toLowerCase().includes(projectSearch.toLowerCase()) ||
    (p.location.address || '').toLowerCase().includes(projectSearch.toLowerCase()) ||
    (p.location.customAddress || '').toLowerCase().includes(projectSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', flexDirection: 'column', gap: '20px' }}>
        <svg width="40" height="40" viewBox="0 0 50 50" style={{ animation: 'spin 1s linear infinite' }}>
          <circle cx="25" cy="25" r="20" fill="none" stroke="var(--primary-cyan)" strokeWidth="4" strokeDasharray="31.4 31.4" />
        </svg>
        <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Cargando Habitech Constructor...</span>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!currentUser) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }


  return (
    <div className="app-container">
      {/* Mobile Top Header Bar */}
      <header className="mobile-header glass-panel">
        <button 
          type="button" 
          className="btn-icon" 
          style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)' }}
          onClick={() => setIsSidebarOpen(true)}
        >
          <Menu size={20} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="24" height="24" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M 24 20 H 42 V 26 H 36 V 74 H 42 V 80 H 24 V 74 H 30 V 26 H 24 Z" fill="#FF6D00" />
            <path d="M 58 20 H 76 V 26 H 70 V 74 H 76 V 80 H 58 V 74 H 64 V 26 H 58 Z" fill="#FF6D00" />
            <path d="M 36 48 C 42 36, 58 64, 70 52 C 70 58, 58 70, 36 54 Z" fill="#FF6D00" />
          </svg>
          <span style={{ fontWeight: 800, color: '#FF6D00', fontSize: '1.1rem', letterSpacing: '0.5px' }}>HABITECH</span>
        </div>
        <div style={{ width: '36px' }} />
      </header>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Navigation Sidebar */}
      <Sidebar 
        currentTab={currentTab} 
        setTab={(tab) => { 
          setTab(tab); 
          setSelectedProjectId(null); 
          setIsSidebarOpen(false); 
        }} 
        projectCount={projects.length}
        currentUser={currentUser}
        onLogout={handleLogout}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <main className="main-content">
        {/* Render Project Details if an active project is open */}
        {activeProject ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <ProjectDetail 
              project={activeProject} 
              onBack={() => setSelectedProjectId(null)}
              onUpdate={handleSaveProject}
              logGlobalTransaction={logGlobalTransaction}
              userRole={currentUser.role}
              transactions={transactions}
              personnel={personnel}
            />
            
            {currentUser.role !== 'viewer' && (
              <div style={{ alignSelf: 'flex-start', marginTop: '20px' }}>
                <button 
                  type="button" 
                  className="btn btn-danger" 
                  style={{ fontSize: '0.85rem' }}
                  onClick={() => handleDeleteProject(activeProject.id)}
                >
                  Eliminar Obra Definitivamente
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Dashboard View */}
            {currentTab === 'dashboard' && (
              <Dashboard 
                projects={projects} 
                transactions={transactions} 
                onViewProject={(id) => setSelectedProjectId(id)}
              />
            )}

            {/* Project Directory List View */}
            {currentTab === 'projects' && (
              <div className="projects-directory animate-fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
                  <div>
                    <h1>Obras y Proyectos</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Directorio activo de frentes de obra y contrataciones.</p>
                  </div>
                  {currentUser.role !== 'viewer' && (
                    <button className="btn btn-primary" onClick={() => setShowProjectForm(true)}>
                      <Plus size={16} /> Registrar Nueva Obra
                    </button>
                  )}
                </div>

                {/* Toolbar Directory */}
                <div className="glass-panel" style={{ padding: '15px 20px', marginBottom: '25px', display: 'flex', gap: '15px' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <input
                      type="text"
                      className="form-control"
                      style={{ paddingLeft: '35px' }}
                      placeholder="Buscar por obra, cliente o dirección..."
                      value={projectSearch}
                      onChange={(e) => setProjectSearch(e.target.value)}
                    />
                    <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  </div>
                </div>

                {filteredProjects.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }} className="glass-panel">
                    <HardHat size={48} style={{ color: 'var(--text-muted)', marginBottom: '15px' }} />
                    <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '5px' }}>No hay obras registradas</p>
                    <p style={{ fontSize: '0.85rem' }}>Crea tu primer proyecto de construcción presionando el botón superior.</p>
                  </div>
                ) : (
                  <div className="grid-3">
                    {filteredProjects.map(proj => (
                      <ProjectCard 
                        key={proj.id} 
                        project={proj} 
                        onSelect={(id) => setSelectedProjectId(id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* General Ledger Ledger View */}
            {currentTab === 'ledger' && (
              <Ledger 
                transactions={transactions} 
                projects={projects}
                personnel={personnel}
                onAddTransaction={handleAddManualTransaction}
                onUpdateTransaction={handleUpdateTransaction}
                userRole={currentUser.role}
              />
            )}

            {/* User Management View */}
            {currentTab === 'users' && currentUser.role === 'admin' && (
              <UserManagement currentUser={currentUser} />
            )}

            {/* Portfolio View */}
            {currentTab === 'portfolio' && (
              <Portfolio 
                portfolio={portfolio}
                userRole={currentUser.role}
                onSave={handleSavePortfolioItem}
                onDelete={handleDeletePortfolioItem}
              />
            )}

            {/* Project Management View */}
            {currentTab === 'management' && (
              <ProjectManagement 
                projects={projects}
                onUpdateProject={handleSaveProject}
                onViewProject={(id) => {
                  setSelectedProjectId(id);
                  setTab('projects');
                }}
                userRole={currentUser.role}
              />
            )}

            {/* Quote Calculator View */}
            {currentTab === 'quote' && (
              <QuoteCalculator />
            )}

            {/* Personnel Management View */}
            {currentTab === 'personnel' && (
              <PersonnelManagement 
                personnel={personnel}
                userRole={currentUser.role}
                onSave={async (item) => {
                  await saveItem('personnel', item);
                  await loadData();
                }}
                onDelete={async (id) => {
                  if (await window.confirmDialog('¿Estás seguro de eliminar a esta persona del personal?')) {
                    await deleteItem('personnel', id);
                    await loadData();
                  }
                }}
              />
            )}

            {/* API & System Settings View */}
            {currentTab === 'settings' && currentUser.role === 'admin' && (
              <ApiSettings />
            )}
          </>
        )}
      </main>

      {/* NEW PROJECT CREATION FORM MODAL */}
      {showProjectForm && (
        <ProjectForm 
          onClose={() => setShowProjectForm(false)}
          onSave={handleSaveProject}
        />
      )}

      {/* SECURITY LOCK SCREEN FOR INACTIVITY */}
      {isLocked && currentUser && (
        <LockScreen 
          currentUser={currentUser}
          onUnlock={() => setIsLocked(false)}
          onLogout={handleLogout}
        />
      )}

      {/* Toast notifications */}
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 100000,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        maxWidth: '350px',
        width: '90%'
      }}>
        {toasts.map(toast => {
          let bgColor = 'rgba(15, 23, 42, 0.9)';
          let borderColor = 'rgba(255, 255, 255, 0.1)';
          let iconColor = 'var(--primary-cyan)';
          let icon = 'ℹ️';

          if (toast.type === 'success') {
            bgColor = 'rgba(16, 185, 129, 0.15)';
            borderColor = 'rgba(16, 185, 129, 0.3)';
            iconColor = '#34d399';
            icon = '✅';
          } else if (toast.type === 'error') {
            bgColor = 'rgba(244, 63, 94, 0.15)';
            borderColor = 'rgba(244, 63, 94, 0.3)';
            iconColor = '#fda4af';
            icon = '⚠️';
          }

          return (
            <div 
              key={toast.id} 
              className="glass-panel"
              style={{
                background: bgColor,
                borderColor: borderColor,
                padding: '12px 16px',
                borderRadius: '10px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                animation: 'slideIn 0.3s ease-out forwards',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <span style={{ fontSize: '1.2rem', color: iconColor }}>{icon}</span>
              <div style={{ flex: 1, fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: '1.4' }}>
                {toast.message}
              </div>
              <button 
                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  padding: '2px',
                  display: 'inline-flex',
                  alignItems: 'center'
                }}
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>

      {/* Custom Confirm Dialog Modal */}
      {confirmData && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 999999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          boxSizing: 'border-box'
        }}>
          <div className="glass-panel" style={{
            maxWidth: '420px',
            width: '100%',
            padding: '25px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            animation: 'modalFadeIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
          }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
              ⚠️ Confirmación Requerida
            </h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              {confirmData.message}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => confirmData.resolve(false)}
                style={{ padding: '8px 16px', fontSize: '0.85rem' }}
              >
                Cancelar
              </button>
              <button 
                className="btn btn-primary" 
                onClick={() => confirmData.resolve(true)}
                style={{ padding: '8px 20px', fontSize: '0.85rem' }}
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GLOBAL LOADING SPINNER OVERLAY */}
      {isGlobalLoading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(11, 15, 25, 0.75)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          zIndex: 9999999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <svg width="50" height="50" viewBox="0 0 50 50" style={{ animation: 'spin 1s linear infinite' }}>
            <circle cx="25" cy="25" r="20" fill="none" stroke="var(--primary-cyan)" strokeWidth="4" strokeDasharray="31.4 31.4" />
          </svg>
          <span style={{ color: 'var(--text-primary)', marginTop: '15px', fontWeight: 600, fontSize: '1.1rem', letterSpacing: '0.5px' }}>
            Procesando...
          </span>
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(120%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes modalFadeIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
