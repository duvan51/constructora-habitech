import React, { useState } from 'react';
import { 
  Calendar, Clock, CheckCircle, AlertTriangle, 
  Building, Check, Info, BarChart3, HelpCircle 
} from 'lucide-react';

export default function ProjectManagement({ projects, onUpdateProject, onViewProject, userRole }) {
  const [activeTab, setActiveTab] = useState('gantt'); // 'gantt' | 'budget'
  const [selectedProjectId, setSelectedProjectId] = useState('all');
  const [scale, setScale] = useState('semanal'); // 'semanal' | 'mensual'

  // Helper: Format Currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value);
  };

  // Helper: Parse Date Safely
  const parseDate = (dStr) => {
    if (!dStr) return new Date();
    return new Date(dStr);
  };

  // Toggle milestone status
  const handleToggleMilestone = async (project, milestoneId) => {
    if (userRole === 'viewer') return;
    const updatedPlan = project.paymentPlan.map(m => {
      if (m.id === milestoneId) {
        const isPaid = m.status === 'paid';
        return {
          ...m,
          status: isPaid ? 'pending' : 'paid',
          paidDate: isPaid ? null : new Date().toISOString().split('T')[0]
        };
      }
      return m;
    });

    const updated = {
      ...project,
      paymentPlan: updatedPlan
    };
    await onUpdateProject(updated);
  };

  // Update milestone due date
  const handleMilestoneDateChange = async (project, milestoneId, newDate) => {
    if (userRole === 'viewer') return;
    const updatedPlan = project.paymentPlan.map(m => {
      if (m.id === milestoneId) {
        return { ...m, dueDate: newDate };
      }
      return m;
    });

    const updated = {
      ...project,
      paymentPlan: updatedPlan
    };
    await onUpdateProject(updated);
  };

  // Build rows and date boundaries for the Gantt Chart
  const getGanttData = () => {
    const rows = [];
    
    // Default boundaries: today to 90 days from now
    let globalMin = new Date();
    let globalMax = new Date();
    globalMax.setDate(globalMax.getDate() + 90);
    
    const projectsToRender = selectedProjectId === 'all' 
      ? projects 
      : projects.filter(p => p.id === selectedProjectId);

    if (projectsToRender.length > 0) {
      let dates = [];
      projectsToRender.forEach(p => {
        if (p.startDate) dates.push(new Date(p.startDate));
        if (p.endDate) dates.push(new Date(p.endDate));
        p.paymentPlan.forEach(m => {
          if (m.dueDate) dates.push(new Date(m.dueDate));
        });
      });

      if (dates.length > 0) {
        globalMin = new Date(Math.min(...dates));
        globalMax = new Date(Math.max(...dates));
        
        // Pad the timeline a little bit
        globalMin.setDate(globalMin.getDate() - 7);
        globalMax.setDate(globalMax.getDate() + 10);
      }
    }

    const minTime = globalMin.getTime();
    const maxTime = globalMax.getTime();
    const timelineDuration = maxTime - minTime;

    projectsToRender.forEach((project) => {
      const projStart = project.startDate ? parseDate(project.startDate) : new Date();
      const projEnd = project.endDate 
        ? parseDate(project.endDate) 
        : new Date(projStart.getTime() + 90 * 24 * 60 * 60 * 1000);

      // Parent row representing the whole project (Phase container)
      rows.push({
        type: 'project',
        id: project.id,
        name: project.name,
        clientName: project.clientName,
        startDate: projStart,
        endDate: projEnd,
        progress: project.progress,
        status: project.status,
        projectObj: project
      });

      // Sorted Milestones representing task components
      const milestones = [...project.paymentPlan].sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      });

      milestones.forEach((m, idx) => {
        let mStart = projStart;
        
        // Task starts where previous task ended to mimic waterfall dependency
        if (idx > 0 && milestones[idx - 1].dueDate) {
          mStart = parseDate(milestones[idx - 1].dueDate);
        }
        
        let mEnd = m.dueDate ? parseDate(m.dueDate) : new Date(mStart.getTime() + 20 * 24 * 60 * 60 * 1000);
        
        if (mEnd < mStart) {
          mEnd = new Date(mStart.getTime() + 24 * 60 * 60 * 1000); // minimum 1 day
        }

        rows.push({
          type: 'milestone',
          id: `${project.id}-${m.id}`,
          name: m.name,
          startDate: mStart,
          endDate: mEnd,
          status: m.status,
          amount: m.amount,
          projectObj: project,
          milestoneId: m.id
        });
      });
    });

    return {
      rows,
      globalMin,
      globalMax,
      timelineDuration
    };
  };

  const { rows, globalMin, globalMax, timelineDuration } = getGanttData();

  // Generate timeline grid columns based on scale
  const getTimelineColumns = () => {
    const cols = [];
    let curr = new Date(globalMin.getTime());
    
    const diffDays = Math.ceil((globalMax - globalMin) / (24 * 60 * 60 * 1000));
    
    // Scale steps
    let stepDays = 7; // default weekly
    if (scale === 'mensual') {
      stepDays = 30;
    } else if (diffDays <= 15) {
      stepDays = 1; // daily if range is very short
    } else if (diffDays > 120) {
      stepDays = 14; // bi-weekly if long range
    }

    while (curr <= globalMax) {
      cols.push(new Date(curr.getTime()));
      curr.setDate(curr.getDate() + stepDays);
    }
    return cols;
  };

  const cols = getTimelineColumns();

  // Today marker percent position
  const today = new Date();
  const todayPercent = ((today.getTime() - globalMin.getTime()) / timelineDuration) * 100;

  // Calculate arrow connections between rows
  const getArrows = () => {
    const arrows = [];
    let prevMilestoneRowIdx = -1;
    let prevMilestoneEndPercent = -1;

    rows.forEach((row, idx) => {
      if (row.type === 'project') {
        // Reset connection logic for a new project block
        prevMilestoneRowIdx = -1;
        prevMilestoneEndPercent = -1;
      } else {
        const startP = ((row.startDate.getTime() - globalMin.getTime()) / timelineDuration) * 100;
        const endP = ((row.endDate.getTime() - globalMin.getTime()) / timelineDuration) * 100;

        if (prevMilestoneRowIdx !== -1) {
          arrows.push({
            fromRow: prevMilestoneRowIdx,
            toRow: idx,
            fromX: prevMilestoneEndPercent,
            toX: startP
          });
        }
        prevMilestoneRowIdx = idx;
        prevMilestoneEndPercent = endP;
      }
    });

    return arrows;
  };

  const arrows = getArrows();

  // Budget calculations
  const budgetProject = selectedProjectId === 'all' 
    ? projects[0] 
    : projects.find(p => p.id === selectedProjectId);

  return (
    <div className="project-management-view animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1>Gestión de Proyectos</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Monitorea el cronograma de frentes de obra y la ejecución de presupuestos en tiempo real.</p>
        </div>

        {/* Tab Selector */}
        <div className="glass-panel" style={{ display: 'flex', padding: '4px', gap: '4px', borderRadius: '10px' }}>
          <button 
            type="button"
            className={`btn ${activeTab === 'gantt' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 16px', fontSize: '0.85rem', border: 'none', background: activeTab === 'gantt' ? 'var(--primary-cyan)' : 'transparent', color: activeTab === 'gantt' ? '#0b0f19' : 'var(--text-secondary)' }}
            onClick={() => setActiveTab('gantt')}
          >
            Diagrama de Gantt
          </button>
          <button 
            type="button"
            className={`btn ${activeTab === 'budget' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 16px', fontSize: '0.85rem', border: 'none', background: activeTab === 'budget' ? 'var(--primary-cyan)' : 'transparent', color: activeTab === 'budget' ? '#0b0f19' : 'var(--text-secondary)' }}
            onClick={() => setActiveTab('budget')}
          >
            Ejecución Presupuesto
          </button>
        </div>
      </div>

      {/* Toolbar Filter / Scale Controls */}
      <div className="glass-panel" style={{ padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
          <Building size={18} style={{ color: 'var(--primary-cyan)' }} />
          <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Filtrar Obra:</span>
          <select 
            className="form-control" 
            style={{ maxWidth: '250px', margin: 0 }}
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
          >
            <option value="all">Todas las Obras</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {activeTab === 'gantt' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Escala Temporal:</span>
            <div className="glass-panel" style={{ display: 'flex', padding: '2px', gap: '2px', borderRadius: '6px' }}>
              <button 
                type="button" 
                style={{ padding: '4px 10px', fontSize: '0.75rem', background: scale === 'semanal' ? 'rgba(6, 182, 212, 0.1)' : 'transparent', color: scale === 'semanal' ? 'var(--primary-cyan)' : 'var(--text-secondary)', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                onClick={() => setScale('semanal')}
              >
                Semanal
              </button>
              <button 
                type="button" 
                style={{ padding: '4px 10px', fontSize: '0.75rem', background: scale === 'mensual' ? 'rgba(6, 182, 212, 0.1)' : 'transparent', color: scale === 'mensual' ? 'var(--primary-cyan)' : 'var(--text-secondary)', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                onClick={() => setScale('mensual')}
              >
                Mensual
              </button>
            </div>
          </div>
        )}
      </div>

      {/* TAB: INTERACTIVE GANTT CHART */}
      {activeTab === 'gantt' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          {/* Gantt Legend */}
          <div style={{ display: 'flex', gap: '20px', fontSize: '0.75rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.01)', padding: '10px 15px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '16px', height: '10px', background: 'linear-gradient(90deg, var(--primary-indigo), var(--primary-cyan))', borderRadius: '3px' }}></div>
              <span>Fase Completa (Proyecto)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '16px', height: '10px', background: 'rgba(255, 109, 0, 0.1)', border: '1.5px solid var(--primary-orange)', borderRadius: '3px' }}></div>
              <span>Hito Pendiente (Tarea)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '16px', height: '10px', background: 'rgba(16, 185, 129, 0.1)', border: '1.5px solid var(--primary-teal)', borderRadius: '3px' }}></div>
              <span>Hito Completado / Pagado</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
              <Info size={12} style={{ color: 'var(--primary-cyan)' }} />
              <span>Haz clic en un hito para cambiar su estado o editar su fecha.</span>
            </div>
          </div>

          {/* Master Gantt Container */}
          <div style={{ display: 'flex', background: 'var(--bg-secondary)', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-glass)', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            
            {/* Sticky Left Sidebar (Rows list) */}
            <div style={{ width: '280px', flexShrink: 0, borderRight: '1px solid var(--border-glass)', background: 'rgba(255,255,255,0.01)' }}>
              <div style={{ height: '45px', borderBottom: '1px solid var(--border-glass)', display: 'flex', alignItems: 'center', padding: '0 15px', fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Estructura de Fases / Obras
              </div>
              
              {rows.map((row) => (
                <div 
                  key={row.id} 
                  style={{ 
                    height: '54px', 
                    borderBottom: '1px solid var(--border-glass)', 
                    display: 'flex', 
                    flexDirection: 'column',
                    justifyContent: 'center',
                    padding: '0 15px',
                    background: row.type === 'project' ? 'rgba(255,255,255,0.02)' : 'transparent',
                    fontSize: row.type === 'project' ? '0.85rem' : '0.8rem',
                    fontWeight: row.type === 'project' ? 700 : 500,
                    color: row.type === 'project' ? 'var(--text-primary)' : 'var(--text-secondary)',
                    overflow: 'hidden'
                  }}
                >
                  {row.type === 'project' ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%' }}>
                      <Building size={14} style={{ color: 'var(--primary-indigo)', flexShrink: 0 }} />
                      <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{row.name}</span>
                    </div>
                  ) : (
                    <div style={{ paddingLeft: '15px', display: 'flex', flexDirection: 'column', width: '100%' }}>
                      <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{row.name}</span>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Monto: {formatCurrency(row.amount)}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Scrollable Right Area (Timeline Chart) */}
            <div style={{ flex: 1, overflowX: 'auto', position: 'relative' }}>
              <div style={{ minWidth: '950px', position: 'relative' }}>
                
                {/* Timeline Column Dates Header */}
                <div style={{ height: '45px', borderBottom: '1px solid var(--border-glass)', display: 'flex', position: 'relative' }}>
                  {cols.map((col, idx) => (
                    <div key={idx} style={{ flex: 1, borderRight: '1px dashed rgba(255,255,255,0.05)', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {col.toLocaleDateString('es-CO', { month: 'short', day: 'numeric' })}
                    </div>
                  ))}
                </div>

                {/* SVG Connecting Arrows */}
                <svg style={{ position: 'absolute', top: '45px', left: 0, width: '100%', height: `${rows.length * 54}px`, pointerEvents: 'none', zIndex: 1 }}>
                  <defs>
                    <marker id="arrow" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--primary-orange)" style={{ opacity: 0.6 }} />
                    </marker>
                  </defs>
                  {arrows.map((arr, idx) => {
                    const y1 = arr.fromRow * 54 + 27; // Row vertical center
                    const y2 = arr.toRow * 54 + 27;   // Next Row vertical center
                    const x1 = arr.fromX;
                    const x2 = arr.toX;
                    return (
                      <path 
                        key={idx}
                        d={`M ${x1}% ${y1} L ${x1}% ${y2 - 12} L ${x2}% ${y2 - 12} L ${x2}% ${y2}`}
                        fill="none"
                        stroke="var(--primary-orange)"
                        strokeWidth="1.5"
                        style={{ opacity: 0.4 }}
                        markerEnd="url(#arrow)"
                      />
                    );
                  })}
                </svg>

                {/* Vertical Red Today Line */}
                {todayPercent >= 0 && todayPercent <= 100 && (
                  <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${todayPercent}%`, width: '2px', background: 'var(--primary-red)', zIndex: 3, pointerEvents: 'none' }}>
                    <span style={{ position: 'absolute', top: '5px', left: '5px', background: 'var(--primary-red)', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 700 }}>
                      Hoy
                    </span>
                  </div>
                )}

                {/* Background Vertical Grid Lines */}
                <div style={{ position: 'absolute', top: '45px', bottom: 0, left: 0, right: 0, display: 'flex', pointerEvents: 'none' }}>
                  {cols.map((_, idx) => (
                    <div key={idx} style={{ flex: 1, borderRight: '1px dashed rgba(255,255,255,0.03)', height: '100%' }}></div>
                  ))}
                </div>

                {/* Row Grid Bars Content */}
                <div style={{ position: 'relative', zIndex: 2 }}>
                  {rows.map((row, idx) => {
                    const startP = ((row.startDate.getTime() - globalMin.getTime()) / timelineDuration) * 100;
                    const endP = ((row.endDate.getTime() - globalMin.getTime()) / timelineDuration) * 100;
                    const widthP = Math.max(1.5, endP - startP);

                    return (
                      <div 
                        key={row.id} 
                        style={{ 
                          height: '54px', 
                          borderBottom: '1px solid var(--border-glass)', 
                          position: 'relative',
                          display: 'flex',
                          alignItems: 'center',
                          background: row.type === 'project' ? 'rgba(255,255,255,0.02)' : 'transparent'
                        }}
                      >
                        {/* Render Main Project Phase Bar (Blue) */}
                        {row.type === 'project' ? (
                          <div 
                            style={{
                              position: 'absolute',
                              left: `${startP}%`,
                              width: `${widthP}%`,
                              height: '24px',
                              background: 'linear-gradient(90deg, var(--primary-indigo), var(--primary-cyan))',
                              borderRadius: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '0 12px',
                              fontSize: '0.75rem',
                              color: 'white',
                              fontWeight: 700,
                              boxShadow: '0 3px 6px rgba(0,0,0,0.2)',
                              cursor: 'pointer'
                            }}
                            onClick={() => onViewProject(row.id)}
                            title={`Obra: ${row.name} - Progreso: ${row.progress}% (Ver detalles)`}
                          >
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.name} ({row.progress}%)</span>
                            <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>
                              {row.startDate.toLocaleDateString('es-CO', {day:'numeric', month:'short'})} - {row.endDate.toLocaleDateString('es-CO', {day:'numeric', month:'short'})}
                            </span>
                          </div>
                        ) : (
                          /* Render Milestone Task Bar (Orange / Green) */
                          <div style={{ position: 'absolute', left: `${startP}%`, width: `${widthP}%`, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div 
                              style={{
                                height: '22px',
                                flex: 1,
                                background: row.status === 'paid' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 109, 0, 0.12)',
                                border: row.status === 'paid' ? '1.5px solid var(--primary-teal)' : '1.5px solid var(--primary-orange)',
                                borderRadius: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '0 8px',
                                fontSize: '0.72rem',
                                color: row.status === 'paid' ? 'var(--primary-teal)' : 'var(--primary-orange)',
                                fontWeight: 700,
                                cursor: 'pointer',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                              }}
                              onClick={() => handleToggleMilestone(row.projectObj, row.milestoneId)}
                              title={`Hito: ${row.name} - Haz clic para cambiar estado (Pagado/Pendiente)`}
                            >
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {row.name}
                              </span>
                              <span style={{ opacity: 0.9 }}>{formatCurrency(row.amount)}</span>
                            </div>

                            {/* Quick Inline Date Adjust */}
                            {userRole !== 'viewer' && (
                              <input 
                                type="date" 
                                className="form-control" 
                                style={{ margin: 0, padding: '2px 4px', fontSize: '0.7rem', width: '95px', height: '22px', background: 'var(--bg-primary)', border: '1px solid var(--border-glass)', borderRadius: '4px' }}
                                value={row.endDate.toISOString().split('T')[0]} 
                                onChange={(e) => handleMilestoneDateChange(row.projectObj, row.milestoneId, e.target.value)} 
                                title="Cambiar fecha de vencimiento"
                              />
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB: EJECUCIÓN PRESUPUESTO */}
      {activeTab === 'budget' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {!budgetProject ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }} className="glass-panel">
              <AlertTriangle size={36} style={{ color: 'var(--text-muted)', marginBottom: '15px' }} />
              <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Selecciona una obra para revisar la ejecución de su presupuesto</p>
            </div>
          ) : (
            <div className="glass-panel" style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: '15px' }}>
                <h2 style={{ fontSize: '1.25rem', color: 'var(--primary-cyan)' }}>Ejecución Presupuestal: {budgetProject.name}</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '2px' }}>Cliente: <strong>{budgetProject.clientName}</strong> | Costo de Obra Contratado: <strong>{formatCurrency(budgetProject.totalCost)}</strong></p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {budgetProject.budgetItems && budgetProject.budgetItems.length > 0 ? (
                  budgetProject.budgetItems.map((item, idx) => {
                    const estimated = item.estimated || 0;
                    const actual = item.actual || 0;
                    const percent = estimated > 0 ? Math.round((actual / estimated) * 100) : 0;
                    const isOverLimit = actual > estimated;

                    let barColor = 'linear-gradient(90deg, var(--primary-cyan), var(--primary-indigo))';
                    if (percent >= 80 && percent <= 100) {
                      barColor = 'linear-gradient(90deg, var(--primary-orange), #f59e0b)';
                    } else if (isOverLimit) {
                      barColor = 'linear-gradient(90deg, var(--primary-red), #e11d48)';
                    }

                    return (
                      <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', fontSize: '0.85rem' }}>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {item.name}
                            {isOverLimit && <AlertTriangle size={14} style={{ color: 'var(--primary-red)' }} title="Presupuesto excedido" />}
                          </span>
                          <span style={{ color: 'var(--text-secondary)' }}>
                            Gastado: <strong style={{ color: isOverLimit ? 'var(--primary-red)' : 'var(--primary-teal)' }}>{formatCurrency(actual)}</strong> de {formatCurrency(estimated)}
                            <span style={{ marginLeft: '10px', background: isOverLimit ? 'rgba(244,63,94,0.1)' : 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700, color: isOverLimit ? 'var(--primary-red)' : 'var(--text-secondary)' }}>
                              {percent}%
                            </span>
                          </span>
                        </div>
                        <div className="progress-bar-container" style={{ margin: '0', height: '10px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-glass)' }}>
                          <div 
                            className="progress-bar-fill" 
                            style={{ 
                              width: `${Math.min(100, percent)}%`, 
                              height: '100%', 
                              background: barColor 
                            }}
                          ></div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    No se han definido categorías ni ítems de presupuesto para esta obra.
                  </div>
                )}
              </div>

              {budgetProject.budgetItems && budgetProject.budgetItems.length > 0 && (() => {
                const totalEstimated = budgetProject.budgetItems.reduce((s, i) => s + (i.estimated || 0), 0);
                const totalActual = budgetProject.budgetItems.reduce((s, i) => s + (i.actual || 0), 0);
                const totalPercent = totalEstimated > 0 ? Math.round((totalActual / totalEstimated) * 100) : 0;
                const balance = totalEstimated - totalActual;

                return (
                  <div style={{ marginTop: '20px', borderTop: '2px solid var(--border-glass)', paddingTop: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.01)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                      <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Estimado Total Costos</span>
                      <strong style={{ display: 'block', fontSize: '1.2rem', marginTop: '4px' }}>{formatCurrency(totalEstimated)}</strong>
                    </div>
                    <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)' }}>
                      <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Real Ejecutado Total</span>
                      <strong style={{ display: 'block', fontSize: '1.2rem', marginTop: '4px', color: totalActual > totalEstimated ? 'var(--primary-red)' : 'var(--primary-teal)' }}>
                        {formatCurrency(totalActual)}
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, marginLeft: '6px', color: 'var(--text-secondary)' }}>
                          ({totalPercent}%)
                        </span>
                      </strong>
                    </div>
                    <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)' }}>
                      <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Saldo / Margen Disponible</span>
                      <strong style={{ display: 'block', fontSize: '1.2rem', marginTop: '4px', color: balance < 0 ? 'var(--primary-red)' : 'var(--primary-orange)' }}>
                        {formatCurrency(balance)}
                      </strong>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
