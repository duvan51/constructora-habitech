import React, { useState } from 'react';
import { DollarSign, ArrowUpRight, ArrowDownRight, Plus, Filter, Calendar, X, CreditCard } from 'lucide-react';

export default function Ledger({ transactions, projects, onAddTransaction, userRole }) {
  const [filterType, setFilterType] = useState('all'); // 'all' | 'income' | 'expense'
  const [filterProject, setFilterProject] = useState('all'); // 'all' | projectId
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // New Transaction Form State
  const [txData, setTxData] = useState({
    projectId: 'general', // 'general' or specific projectId
    type: 'expense',
    category: 'materials',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0]
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
    setTxData(prev => ({ ...prev, [name]: value }));
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
    if (txData.projectId !== 'general') {
      const proj = projects.find(p => p.id === txData.projectId);
      if (proj) projName = proj.name;
    }

    const newTx = {
      projectId: txData.projectId,
      projectName: projName,
      type: txData.type,
      category: txData.category,
      description: txData.description,
      amount: amt,
      date: txData.date
    };

    onAddTransaction(newTx);
    
    // Reset
    setTxData({
      projectId: 'general',
      type: 'expense',
      category: 'materials',
      description: '',
      amount: '',
      date: new Date().toISOString().split('T')[0]
    });
    setShowAddModal(false);
  };

  // Filtered transactions
  const filteredTxs = transactions.filter(t => {
    const typeMatch = filterType === 'all' || t.type === filterType;
    const projectMatch = filterProject === 'all' || t.projectId === filterProject;
    
    // Date range filter
    let dateMatch = true;
    if (startDate) {
      dateMatch = dateMatch && (t.date >= startDate);
    }
    if (endDate) {
      dateMatch = dateMatch && (t.date <= endDate);
    }
    
    return typeMatch && projectMatch && dateMatch;
  });

  // Financial calculations based on filter or overall
  const totalIncome = filteredTxs
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = filteredTxs
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;

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
      <div className="metrics-grid">
        <div className="glass-panel metric-card" style={{ padding: '18px 22px' }}>
          <div className="metric-info">
            <h3>Ingresos totales</h3>
            <div className="metric-value" style={{ color: 'var(--primary-teal)' }}>
              {formatCurrency(totalIncome)}
            </div>
          </div>
          <div className="metric-icon green">
            <ArrowUpRight size={20} />
          </div>
        </div>

        <div className="glass-panel metric-card" style={{ padding: '18px 22px' }}>
          <div className="metric-info">
            <h3>Gastos totales</h3>
            <div className="metric-value" style={{ color: 'var(--primary-red)' }}>
              {formatCurrency(totalExpense)}
            </div>
          </div>
          <div className="metric-icon red">
            <ArrowDownRight size={20} />
          </div>
        </div>

        <div className="glass-panel metric-card" style={{ padding: '18px 22px' }}>
          <div className="metric-info">
            <h3>Caja Neta / Balance</h3>
            <div className="metric-value" style={{ color: balance >= 0 ? 'var(--primary-teal)' : 'var(--primary-red)' }}>
              {formatCurrency(balance)}
            </div>
          </div>
          <div className="metric-icon purple">
            <DollarSign size={20} />
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

        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
          Mostrando {filteredTxs.length} registros
        </span>
      </div>

      {/* Ledger Table */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        {filteredTxs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
            No se encontraron transacciones con los filtros seleccionados.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-glass)' }}>
                  <th style={{ padding: '12px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Fecha</th>
                  <th style={{ padding: '12px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Obra / Destino</th>
                  <th style={{ padding: '12px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Tipo</th>
                  <th style={{ padding: '12px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Categoría</th>
                  <th style={{ padding: '12px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Concepto / Detalles</th>
                  <th style={{ padding: '12px', color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'right' }}>Monto</th>
                </tr>
              </thead>
              <tbody>
                {filteredTxs.slice().reverse().map((tx) => {
                  const isInc = tx.type === 'income';
                  return (
                    <tr key={tx.id} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                      <td style={{ padding: '14px 12px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        {tx.date}
                      </td>
                      <td style={{ padding: '14px 12px', fontWeight: 600 }}>
                        {tx.projectName}
                      </td>
                      <td style={{ padding: '14px 12px' }}>
                        {isInc ? (
                          <span className="badge badge-completed" style={{ fontSize: '0.65rem' }}>Entrada</span>
                        ) : (
                          <span className="badge badge-danger" style={{ fontSize: '0.65rem', background: 'rgba(244,63,94,0.15)', color: '#fda4af', border: '1px solid rgba(244,63,94,0.3)' }}>Salida</span>
                        )}
                      </td>
                      <td style={{ padding: '14px 12px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        {getCategoryLabel(tx.category)}
                      </td>
                      <td style={{ padding: '14px 12px', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                        {tx.description}
                      </td>
                      <td style={{ 
                        padding: '14px 12px', 
                        textAlign: 'right', 
                        fontWeight: 700, 
                        color: isInc ? 'var(--primary-teal)' : 'var(--primary-red)'
                      }}>
                        {isInc ? '+' : '-'} {formatCurrency(tx.amount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MANUAL TRANSACTION DIALOG MODAL */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
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
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Descripción / Concepto del Pago</label>
                  <input
                    type="text"
                    name="description"
                    className="form-control"
                    placeholder="Ej. Pago alquiler de andamios y escaleras"
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
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
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
    </div>
  );
}
