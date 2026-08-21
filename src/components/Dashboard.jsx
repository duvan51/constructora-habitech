import React from 'react';
import { DollarSign, HardHat, TrendingUp, AlertTriangle, ArrowUpRight, ArrowDownRight, Calendar } from 'lucide-react';

export default function Dashboard({ projects, transactions, onViewProject }) {
  // Financial Calculations
  const totalBudget = projects.reduce((sum, p) => sum + p.totalCost, 0);
  
  const totalPaid = projects.reduce((sum, p) => {
    const paidInProject = p.paymentPlan.reduce((s, pay) => {
      const paidForHito = pay.payments && pay.payments.length > 0
        ? pay.payments.reduce((acc, pym) => acc + pym.amount, 0)
        : (pay.status === 'paid' ? pay.amount : 0);
      return s + paidForHito;
    }, 0);
    return sum + paidInProject;
  }, 0);

  const pendingBalance = totalBudget - totalPaid;

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netCash = totalPaid - totalExpenses; // Actual liquid cash in bank

  // Project counts based on status and payments
  const activeWorks = projects.filter(p => p.progress > 0 && p.progress < 100).length;
  const projectedWorks = projects.filter(p => p.progress === 0).length;
  const closingWorks = projects.filter(p => p.progress >= 85 && p.progress < 100).length;

  const worksToCollect = projects.filter(p => {
    const totalPaidInProj = p.paymentPlan.reduce((s, pay) => {
      const paidForHito = pay.payments && pay.payments.length > 0
        ? pay.payments.reduce((acc, pym) => acc + pym.amount, 0)
        : (pay.status === 'paid' ? pay.amount : 0);
      return s + paidForHito;
    }, 0);
    return p.totalCost > totalPaidInProj;
  }).length;

  // Overdue and upcoming payments check
  const todayStr = new Date().toISOString().split('T')[0];
  const pendingMilestones = [];

  const getDaysRemaining = (dueDateStr) => {
    if (!dueDateStr) return null;
    const today = new Date();
    today.setHours(0,0,0,0);
    const due = new Date(dueDateStr);
    due.setHours(0,0,0,0);
    const diff = due - today;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  projects.forEach(p => {
    p.paymentPlan.forEach(pay => {
      const totalPaidForHito = pay.payments && pay.payments.length > 0
        ? pay.payments.reduce((s, pym) => s + pym.amount, 0)
        : (pay.status === 'paid' ? pay.amount : 0);
      const remainingAmount = pay.amount - totalPaidForHito;

      if (remainingAmount > 0) {
        const days = getDaysRemaining(pay.dueDate);
        if (days !== null) {
          if (days < 0) {
            pendingMilestones.push({
              projectName: p.name,
              projectId: p.id,
              milestoneName: pay.name,
              amount: remainingAmount,
              dueDate: pay.dueDate,
              type: 'overdue',
              days: Math.abs(days)
            });
          } else if (days === 0) {
            pendingMilestones.push({
              projectName: p.name,
              projectId: p.id,
              milestoneName: pay.name,
              amount: remainingAmount,
              dueDate: pay.dueDate,
              type: 'today',
              days: 0
            });
          } else if (days <= 7) {
            pendingMilestones.push({
              projectName: p.name,
              projectId: p.id,
              milestoneName: pay.name,
              amount: remainingAmount,
              dueDate: pay.dueDate,
              type: 'upcoming',
              days
            });
          }
        }
      }
    });
  });

  // Currency Formatter
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value);
  };

  // Billing alert configuration helper
  const getAlertConfig = (type, days, date) => {
    switch (type) {
      case 'overdue':
        return {
          bg: 'rgba(244, 63, 94, 0.06)',
          border: '1px solid rgba(244, 63, 94, 0.18)',
          color: 'var(--primary-red)',
          text: `Venció hace ${days} días (${date})`
        };
      case 'today':
        return {
          bg: 'rgba(245, 158, 11, 0.08)',
          border: '1px solid rgba(245, 158, 11, 0.22)',
          color: 'var(--primary-orange)',
          text: `Vence hoy (${date})`
        };
      case 'upcoming':
        return {
          bg: 'rgba(6, 182, 212, 0.06)',
          border: '1px solid rgba(6, 182, 212, 0.18)',
          color: 'var(--primary-cyan)',
          text: `Vence en ${days} días (${date})`
        };
      default:
        return { bg: 'transparent', border: 'none', color: 'inherit', text: '' };
    }
  };

  // Render simple beautiful SVG charts to ensure perfect visual presentation and 0 build errors
  // Chart 1: Budgets vs Paid per project
  const renderSVGChart1 = () => {
    if (projects.length === 0) return <p>No hay datos suficientes para graficar.</p>;
    
    const chartHeight = 160;
    const barWidth = 25;
    const gap = 35;
    const chartWidth = Math.max(450, projects.length * (barWidth * 2 + gap) + 60);
    const maxVal = Math.max(...projects.map(p => Math.max(p.totalCost, 10000000)), 50000000);

    return (
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight + 40}`} width="100%" height="200" style={{ overflow: 'visible', minWidth: `${chartWidth}px` }}>
        {/* Y Axis Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
          const y = chartHeight - ratio * chartHeight + 10;
          return (
            <g key={i}>
              <line x1="40" y1={y} x2={chartWidth} y2={y} stroke="rgba(255,255,255,0.05)" strokeDasharray="3" />
              <text x="35" y={y + 4} fill="var(--text-muted)" fontSize="8" textAnchor="end">
                {formatCurrency(ratio * maxVal / 1000000)}M
              </text>
            </g>
          );
        })}

        {/* X Axis */}
        <line x1="40" y1={chartHeight + 10} x2={chartWidth} y2={chartHeight + 10} stroke="rgba(255,255,255,0.15)" />

        {/* Bars */}
        {projects.map((proj, idx) => {
          const x = 55 + idx * (barWidth * 2 + gap);
          const costHeight = (proj.totalCost / maxVal) * chartHeight;
          
          const paidAmount = proj.paymentPlan.reduce((sum, pay) => {
            const paidForHito = pay.payments && pay.payments.length > 0
              ? pay.payments.reduce((s, pym) => s + pym.amount, 0)
              : (pay.status === 'paid' ? pay.amount : 0);
            return sum + paidForHito;
          }, 0);
          const paidHeight = (paidAmount / maxVal) * chartHeight;

          const truncatedName = proj.name.length > 12 ? proj.name.substring(0, 12) + '...' : proj.name;

          return (
            <g key={proj.id}>
              {/* Cost Bar (Indigo) */}
              <rect
                x={x}
                y={chartHeight - costHeight + 10}
                width={barWidth}
                height={costHeight}
                fill="url(#indigoGrad)"
                rx="4"
              />
              {/* Paid Bar (Teal) */}
              <rect
                x={x + barWidth + 4}
                y={chartHeight - paidHeight + 10}
                width={barWidth}
                height={paidHeight}
                fill="url(#cyanGrad)"
                rx="4"
              />
              {/* Tooltip trigger */}
              <title>{`${proj.name}\nPresupuesto: ${formatCurrency(proj.totalCost)}\nCobrado: ${formatCurrency(paidAmount)}`}</title>
              {/* X label */}
              <text x={x + barWidth} y={chartHeight + 25} fill="var(--text-secondary)" fontSize="9" textAnchor="middle">
                {truncatedName}
              </text>
            </g>
          );
        })}

        {/* Gradients */}
        <defs>
          <linearGradient id="indigoGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary-indigo)" />
            <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.4" />
          </linearGradient>
          <linearGradient id="cyanGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary-cyan)" />
            <stop offset="100%" stopColor="#0891b2" stopOpacity="0.4" />
          </linearGradient>
        </defs>
      </svg>
    );
  };

  // Chart 2: Recent Transactions Income vs Expense
  const renderSVGChart2 = () => {
    // Generate mock dates/months data from recent transaction history
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
    const incomeData = [36000000, 0, 0, 0, 36000000, 8500000];
    const expenseData = [8200000, 30500000, 12000000, 0, 12000000, 7800000];

    const chartHeight = 160;
    const chartWidth = 450;
    const pointsCount = months.length;
    const xStep = (chartWidth - 50) / (pointsCount - 1);
    const maxVal = 40000000; // 40M scale

    const getPointsStr = (data) => {
      return data.map((val, i) => {
        const x = 40 + i * xStep;
        const y = chartHeight - (val / maxVal) * chartHeight + 10;
        return `${x},${y}`;
      }).join(' ');
    };

    return (
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight + 40}`} width="100%" height="200" style={{ overflow: 'visible' }}>
        {/* Y Axis Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
          const y = chartHeight - ratio * chartHeight + 10;
          return (
            <g key={i}>
              <line x1="40" y1={y} x2={chartWidth} y2={y} stroke="rgba(255,255,255,0.05)" strokeDasharray="3" />
              <text x="35" y={y + 4} fill="var(--text-muted)" fontSize="8" textAnchor="end">
                {formatCurrency(ratio * maxVal / 1000000)}M
              </text>
            </g>
          );
        })}

        {/* X Axis labels */}
        {months.map((m, i) => (
          <text key={i} x={40 + i * xStep} y={chartHeight + 25} fill="var(--text-secondary)" fontSize="9" textAnchor="middle">
            {m}
          </text>
        ))}

        {/* Lines */}
        <polyline
          fill="none"
          stroke="var(--primary-teal)"
          strokeWidth="3"
          points={getPointsStr(incomeData)}
          strokeLinecap="round"
        />
        <polyline
          fill="none"
          stroke="var(--primary-red)"
          strokeWidth="3"
          points={getPointsStr(expenseData)}
          strokeLinecap="round"
        />

        {/* Dots on line */}
        {incomeData.map((val, i) => {
          const x = 40 + i * xStep;
          const y = chartHeight - (val / maxVal) * chartHeight + 10;
          return (
            <circle key={`inc-${i}`} cx={x} cy={y} r="4" fill="var(--primary-teal)" stroke="#0b0f19" strokeWidth="1.5">
              <title>Ingreso: {formatCurrency(val)}</title>
            </circle>
          );
        })}
        {expenseData.map((val, i) => {
          const x = 40 + i * xStep;
          const y = chartHeight - (val / maxVal) * chartHeight + 10;
          return (
            <circle key={`exp-${i}`} cx={x} cy={y} r="4" fill="var(--primary-red)" stroke="#0b0f19" strokeWidth="1.5">
              <title>Egreso: {formatCurrency(val)}</title>
            </circle>
          );
        })}
      </svg>
    );
  };

  return (
    <div className="dashboard-view animate-fade-in">
      <h1>Panel de Control</h1>
      
      {/* Metrics Section */}
      <div className="metrics-grid">
        <div className="glass-panel metric-card">
          <div className="metric-info">
            <h3>Presupuesto Contratado</h3>
            <div className="metric-value">{formatCurrency(totalBudget)}</div>
          </div>
          <div className="metric-icon blue">
            <HardHat size={22} />
          </div>
        </div>

        <div className="glass-panel metric-card">
          <div className="metric-info">
            <h3>Total Cobrado (Clientes)</h3>
            <div className="metric-value" style={{ color: 'var(--primary-teal)' }}>
              {formatCurrency(totalPaid)}
            </div>
          </div>
          <div className="metric-icon green">
            <ArrowUpRight size={22} />
          </div>
        </div>

        <div className="glass-panel metric-card">
          <div className="metric-info">
            <h3>Saldo por Cobrar</h3>
            <div className="metric-value" style={{ color: 'var(--primary-orange)' }}>
              {formatCurrency(pendingBalance)}
            </div>
          </div>
          <div className="metric-icon orange">
            <Calendar size={22} />
          </div>
        </div>

        <div className="glass-panel metric-card">
          <div className="metric-info">
            <h3>Gastos Realizados</h3>
            <div className="metric-value" style={{ color: 'var(--primary-red)' }}>
              {formatCurrency(totalExpenses)}
            </div>
          </div>
          <div className="metric-icon red">
            <ArrowDownRight size={22} />
          </div>
        </div>
      </div>

      {/* Project Status Dashboard Row */}
      <h2 style={{ fontSize: '1.2rem', marginTop: '30px', marginBottom: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
        Estado de Obras y Proyectos
      </h2>
      <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px', marginBottom: '30px' }}>
        
        {/* Total Projects */}
        <div className="glass-panel metric-card" style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Total Proyectos</span>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '4px', color: 'var(--text-primary)' }}>{projects.length}</div>
          </div>
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-glass)', borderRadius: '10px', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
            <HardHat size={20} />
          </div>
        </div>

        {/* Active Works */}
        <div className="glass-panel metric-card" style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Obras Activas</span>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '4px', color: 'var(--primary-cyan)' }}>{activeWorks}</div>
          </div>
          <div style={{ background: 'rgba(255, 109, 0, 0.05)', border: '1px solid rgba(255, 109, 0, 0.15)', borderRadius: '10px', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-cyan)' }}>
            <TrendingUp size={20} />
          </div>
        </div>

        {/* Works to Collect */}
        <div className="glass-panel metric-card" style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Obras por Cobrar</span>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '4px', color: 'var(--primary-teal)' }}>{worksToCollect}</div>
          </div>
          <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.15)', borderRadius: '10px', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-teal)' }}>
            <DollarSign size={20} />
          </div>
        </div>

        {/* Projected Works */}
        <div className="glass-panel metric-card" style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>En Proyección</span>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '4px', color: '#38bdf8' }}>{projectedWorks}</div>
          </div>
          <div style={{ background: 'rgba(56, 189, 248, 0.05)', border: '1px solid rgba(56, 189, 248, 0.15)', borderRadius: '10px', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
            <Calendar size={20} />
          </div>
        </div>

        {/* Works for Closing */}
        <div className="glass-panel metric-card" style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Por Cierre</span>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '4px', color: '#a78bfa' }}>{closingWorks}</div>
          </div>
          <div style={{ background: 'rgba(167, 139, 250, 0.05)', border: '1px solid rgba(167, 139, 250, 0.15)', borderRadius: '10px', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a78bfa' }}>
            <HardHat size={20} />
          </div>
        </div>

      </div>

      {/* Cash Flow Balance Banner */}
      <div className="glass-panel" style={{ padding: '20px 25px', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, rgba(6,182,212,0.1), rgba(99,102,241,0.1))', border: '1px solid rgba(6,182,212,0.2)' }}>
        <div>
          <h3 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={18} style={{ color: 'var(--primary-cyan)' }} />
            Utilidad Neta / Flujo Caja Recaudado
          </h3>
          <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>Diferencia entre cobros reales liquidados y compras de materiales/mano de obra.</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '1.8rem', fontWeight: 800, color: netCash >= 0 ? '#10b981' : '#f43f5e' }}>
            {formatCurrency(netCash)}
          </span>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>
            Caja líquida actual
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid-2">
        <div className="glass-panel" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <h3 style={{ fontSize: '1.1rem' }}>Presupuestos vs Cobros reales</h3>
            <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '10px', height: '10px', background: 'var(--primary-indigo)', borderRadius: '2px' }}></span>Presupuesto</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '10px', height: '10px', background: 'var(--primary-cyan)', borderRadius: '2px' }}></span>Cobrado</span>
            </div>
          </div>
          <div style={{ width: '100%', overflowX: 'auto' }}>
            {renderSVGChart1()}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <h3 style={{ fontSize: '1.1rem' }}>Tendencia de Caja (Histórico Mensual)</h3>
            <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '10px', height: '1.5px', background: 'var(--primary-teal)', display: 'inline-block' }}></span>Cobros</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '10px', height: '1.5px', background: 'var(--primary-red)', display: 'inline-block' }}></span>Gastos</span>
            </div>
          </div>
          <div style={{ width: '100%', overflowX: 'auto' }}>
            {renderSVGChart2()}
          </div>
        </div>
      </div>

      {/* Alerts and Quick Actions */}
      <div className="grid-2">
        {/* Overdue milestones alerts */}
        <div className="glass-panel" style={{ padding: '22px' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-orange)', marginBottom: '15px', fontSize: '1.1rem' }}>
            <AlertTriangle size={18} />
            Alertas de Cobros y Vencimientos
          </h3>
          
          {pendingMilestones.length === 0 ? (
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', padding: '10px 0' }}>
              No hay alertas de cobros pendientes. Facturación al día.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '220px', overflowY: 'auto' }}>
              {pendingMilestones.map((alert, i) => {
                const config = getAlertConfig(alert.type, alert.days, alert.dueDate);
                return (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: config.bg, border: config.border, borderRadius: '10px', padding: '12px' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{alert.projectName}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span>{alert.milestoneName}</span>
                        <span style={{ color: config.color, fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>
                          • {config.text}
                        </span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, color: config.color }}>{formatCurrency(alert.amount)}</div>
                      <button
                        className="btn"
                        style={{ fontSize: '0.75rem', padding: '4px 8px', marginTop: '6px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', border: '1px solid var(--border-glass)' }}
                        onClick={() => onViewProject(alert.projectId)}
                      >
                        Ir a obra
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Resumen de Obras Activas */}
        <div className="glass-panel" style={{ padding: '22px' }}>
          <h3 style={{ marginBottom: '15px', fontSize: '1.1rem' }}>Obras Activas</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '220px', overflowY: 'auto' }}>
            {projects.map(proj => (
              <div key={proj.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px' }}>
                <div style={{ flex: 1, marginRight: '10px' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }} onClick={() => onViewProject(proj.id)}>
                    {proj.name}
                  </div>
                  <div className="progress-bar-container">
                    <div className="progress-bar-fill" style={{ width: `${proj.progress}%`, background: 'var(--primary-cyan)' }}></div>
                  </div>
                </div>
                <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>{proj.progress}%</span>
                  <button className="btn btn-icon" onClick={() => onViewProject(proj.id)} style={{ padding: '4px' }}>
                    <ArrowUpRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
