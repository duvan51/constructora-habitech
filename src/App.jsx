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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [projectSearch, setProjectSearch] = useState('');

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
      const [cachedProjects, cachedTransactions, cachedPortfolio] = await Promise.all([
        getCachedData('supabase_projects'),
        getCachedData('supabase_transactions'),
        getCachedData('supabase_portfolio')
      ]);

      if (cachedProjects) setProjects(cachedProjects);
      if (cachedTransactions) setTransactions(cachedTransactions);
      if (cachedPortfolio) setPortfolio(cachedPortfolio);
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

      // Save fresh data to cache for next load
      try {
        await Promise.all([
          setCachedData('supabase_projects', allProj),
          setCachedData('supabase_transactions', allTx),
          allPort.length > 0 ? setCachedData('supabase_portfolio', allPort) : Promise.resolve()
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
    if (confirm('¿Estás seguro de eliminar este proyecto del portafolio?')) {
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
    if (confirm('¿Estás seguro de eliminar esta obra? Todos sus datos se borrarán.')) {
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

  // Log manual transactions and automatically update project budget if applicable
  const handleAddManualTransaction = async (newTx) => {
    try {
      const txWithId = {
        ...newTx,
        id: `tx_${new Date().getTime()}`
      };
      
      // Save the transaction in ledger
      await saveItem('transactions', txWithId);

      // If transaction is tied to a specific project and is an expense, sync to its budget
      if (newTx.projectId !== 'general' && newTx.type === 'expense') {
        const targetProj = projects.find(p => p.id === newTx.projectId);
        if (targetProj) {
          const updatedBudget = targetProj.budgetItems.map(item => {
            if (item.category === newTx.category) {
              return { ...item, actual: (item.actual || 0) + newTx.amount };
            }
            return item;
          });
          
          const updatedProj = { ...targetProj, budgetItems: updatedBudget };
          await saveItem('projects', updatedProj);
        }
      }

      await loadData();
    } catch (err) {
      console.error('Error saving manual transaction:', err);
      alert('Ocurrió un error al registrar el movimiento.');
    }
  };

  // Update transaction and adjust associated project budgets if applicable
  const handleUpdateTransaction = async (updatedTx, oldTx) => {
    try {
      // 1. Save updated transaction
      await saveItem('transactions', updatedTx);

      // 2. Adjust budgets
      // If old transaction was a project expense, subtract it
      if (oldTx && oldTx.projectId !== 'general' && oldTx.type === 'expense') {
        const freshProjects = await getAll('projects');
        const oldProj = freshProjects.find(p => p.id === oldTx.projectId);
        if (oldProj) {
          const updatedBudget = oldProj.budgetItems.map(item => {
            if (item.category === oldTx.category) {
              return { ...item, actual: Math.max(0, (item.actual || 0) - oldTx.amount) };
            }
            return item;
          });
          const updatedProj = { ...oldProj, budgetItems: updatedBudget };
          await saveItem('projects', updatedProj);
        }
      }

      // If updated transaction is a project expense, add it
      if (updatedTx.projectId !== 'general' && updatedTx.type === 'expense') {
        const freshProjects = await getAll('projects');
        const targetProj = freshProjects.find(p => p.id === updatedTx.projectId);
        if (targetProj) {
          const updatedBudget = targetProj.budgetItems.map(item => {
            if (item.category === updatedTx.category) {
              return { ...item, actual: (item.actual || 0) + updatedTx.amount };
            }
            return item;
          });
          const updatedProj = { ...targetProj, budgetItems: updatedBudget };
          await saveItem('projects', updatedProj);
        }
      }

      await loadData();
    } catch (err) {
      console.error('Error updating transaction:', err);
      alert('Ocurrió un error al actualizar la transacción.');
    }
  };

  const activeProject = projects.find(p => p.id === selectedProjectId);

  // Inactivity tracking (5 minutes lock for non-admins)
  useEffect(() => {
    if (!currentUser || currentUser.role === 'admin' || isLocked) {
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
    </div>
  );
}
