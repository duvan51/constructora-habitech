import React, { useState, useEffect } from 'react';
import { X, Save, Hammer, MapPin, DollarSign, User, Plus, Trash2, Calendar } from 'lucide-react';
import MapSelector from './MapSelector';

export default function ProjectForm({ project, onClose, onSave }) {
  const isEdit = !!project;

  const [formData, setFormData] = useState(() => {
    const cost = project?.totalCost || 0;
    const sDate = project?.startDate || new Date().toISOString().split('T')[0];
    const eDate = project?.endDate || '';
    return {
      id: project?.id || `proj_${new Date().getTime()}`,
      name: project?.name || '',
      clientName: project?.clientName || '',
      clientPhone: project?.clientPhone || '',
      clientEmail: project?.clientEmail || '',
      location: project?.location || { lat: 6.2518, lng: -75.5636, address: 'Medellín, Colombia' },
      status: project?.status || 'planning',
      totalCost: cost,
      startDate: sDate,
      endDate: eDate,
      progress: project?.progress || 0,
      budgetItems: project?.budgetItems || [],
      // Initialize with existing plan or a blank slate
      paymentPlan: project?.paymentPlan || [
        { id: 'p1', name: 'Cuota Inicial / Firma Contrato', percentage: 30, amount: Math.round(cost * 0.3), dueDate: sDate, status: 'pending', paidDate: null },
        { id: 'p2', name: 'Hito de Avance Medio (50% Obra)', percentage: 40, amount: Math.round(cost * 0.4), dueDate: '', status: 'pending', paidDate: null },
        { id: 'p3', name: 'Entrega y Firmas Finales', percentage: 30, amount: Math.round(cost * 0.3), dueDate: eDate, status: 'pending', paidDate: null }
      ]
    };
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'totalCost') {
      const cost = parseFloat(value) || 0;
      setFormData(prev => ({
        ...prev,
        totalCost: cost,
        // Automatically recalculate amounts for all milestones
        paymentPlan: prev.paymentPlan.map(p => ({
          ...p,
          amount: Math.round((cost * p.percentage) / 100)
        }))
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: name === 'progress' ? parseFloat(value) || 0 : value
      }));
    }
  };

  const handleLocationChange = (loc) => {
    setFormData(prev => ({ ...prev, location: loc }));
  };

  // Payment Plan Management Actions
  const handleAddMilestone = () => {
    setFormData(prev => {
      const newId = `p_${new Date().getTime()}`;
      return {
        ...prev,
        paymentPlan: [
          ...prev.paymentPlan,
          {
            id: newId,
            name: '',
            percentage: 0,
            amount: 0,
            dueDate: '',
            status: 'pending',
            paidDate: null
          }
        ]
      };
    });
  };

  const handleRemoveMilestone = (id) => {
    setFormData(prev => ({
      ...prev,
      paymentPlan: prev.paymentPlan.filter(p => p.id !== id)
    }));
  };

  const handleMilestoneChange = (id, field, value) => {
    setFormData(prev => {
      const updatedPlan = prev.paymentPlan.map(p => {
        if (p.id === id) {
          const updated = { ...p };
          if (field === 'percentage') {
            const pct = parseFloat(value) || 0;
            updated.percentage = pct;
            updated.amount = Math.round((prev.totalCost * pct) / 100);
          } else {
            updated[field] = value;
          }
          return updated;
        }
        return p;
      });
      return { ...prev, paymentPlan: updatedPlan };
    });
  };

  // Calculate sum of plan percentages
  const totalPercentage = formData.paymentPlan.reduce((sum, p) => sum + p.percentage, 0);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Por favor ingresa el nombre de la obra.');
      return;
    }
    if (!formData.clientName.trim()) {
      alert('Por favor ingresa el nombre del cliente.');
      return;
    }
    if (formData.totalCost <= 0) {
      alert('Por favor ingresa un costo total válido mayor a 0.');
      return;
    }

    // Percentage check
    if (totalPercentage !== 100) {
      alert(`La suma de los porcentajes de los hitos de pago debe ser exactamente 100%. Actualmente es ${totalPercentage}%. Ajusta los porcentajes antes de continuar.`);
      return;
    }

    // Check if any milestone lacks a name
    const hasEmptyName = formData.paymentPlan.some(p => !p.name.trim());
    if (hasEmptyName) {
      alert('Por favor ingresa una descripción o nombre para todos los hitos de pago.');
      return;
    }

    let updatedFormData = { ...formData };

    // Default budget category seeding if empty
    if (updatedFormData.budgetItems.length === 0) {
      const c = formData.totalCost;
      updatedFormData.budgetItems = [
        { name: 'Materiales Generales', estimated: Math.round(c * 0.4), actual: 0, category: 'materials' },
        { name: 'Mano de Obra Estimada', estimated: Math.round(c * 0.35), actual: 0, category: 'labor' },
        { name: 'Licencias y Curaduría', estimated: Math.round(c * 0.08), actual: 0, category: 'permits' },
        { name: 'Otros Imprevistos', estimated: Math.round(c * 0.17), actual: 0, category: 'materials' }
      ];
    }

    onSave(updatedFormData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '750px' }}>
        <div className="modal-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Hammer size={22} style={{ color: 'var(--primary-cyan)' }} />
            {isEdit ? 'Editar Información de Obra' : 'Registrar Nueva Obra'}
          </h3>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
            
            {/* General Info */}
            <div style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: '15px', marginBottom: '20px' }}>
              <h4 style={{ fontSize: '0.95rem', color: 'var(--primary-cyan)', marginBottom: '12px' }}>Información Básica</h4>
              <div className="form-group">
                <label>Nombre Comercial de la Obra</label>
                <input
                  type="text"
                  name="name"
                  className="form-control"
                  placeholder="Ej: Residencia Altos de Robledo"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Presupuesto Total Contratado ($)</label>
                  <input
                    type="number"
                    name="totalCost"
                    className="form-control"
                    placeholder="Ej. 120000000"
                    value={formData.totalCost || ''}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Estado de Obra</label>
                  <select
                    name="status"
                    className="form-control"
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    <option value="planning">Planificación</option>
                    <option value="active">En Obra</option>
                    <option value="halted">Detenido</option>
                    <option value="completed">Terminado</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Fecha de Inicio</label>
                  <input
                    type="date"
                    name="startDate"
                    className="form-control"
                    value={formData.startDate}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Fecha Estimada Fin</label>
                  <input
                    type="date"
                    name="endDate"
                    className="form-control"
                    value={formData.endDate}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              {isEdit && (
                <div className="form-group">
                  <label>Progreso de Obra ({formData.progress}%)</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <input
                      type="range"
                      name="progress"
                      min="0"
                      max="100"
                      className="form-control"
                      style={{ padding: '0', height: '8px' }}
                      value={formData.progress}
                      onChange={handleInputChange}
                    />
                    <span style={{ fontWeight: 700, minWidth: '40px' }}>{formData.progress}%</span>
                  </div>
                </div>
              )}
            </div>

            {/* Client Info */}
            <div style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: '15px', marginBottom: '20px' }}>
              <h4 style={{ fontSize: '0.95rem', color: 'var(--primary-cyan)', marginBottom: '12px' }}>Datos del Cliente</h4>
              <div className="form-group">
                <label>Nombre Completo del Cliente</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    name="clientName"
                    className="form-control"
                    style={{ paddingLeft: '35px' }}
                    placeholder="Ej. Juan Carlos Cardona"
                    value={formData.clientName}
                    onChange={handleInputChange}
                    required
                  />
                  <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Teléfono de Contacto</label>
                  <input
                    type="tel"
                    name="clientPhone"
                    className="form-control"
                    placeholder="Ej. +57 310 123 4567"
                    value={formData.clientPhone}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Correo Electrónico</label>
                  <input
                    type="email"
                    name="clientEmail"
                    className="form-control"
                    placeholder="Ej. cliente@email.com"
                    value={formData.clientEmail}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            {/* CUSTOM PAYMENT PLAN EDITOR */}
            <div style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: '15px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ fontSize: '0.95rem', color: 'var(--primary-cyan)' }}>Organizar Plan de Pagos del Cliente</h4>
                <button type="button" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={handleAddMilestone}>
                  <Plus size={14} /> Agregar Hito
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {formData.paymentPlan.map((milestone, idx) => (
                  <div key={milestone.id} style={{ display: 'flex', gap: '10px', alignItems: 'center', background: 'rgba(255,255,255,0.01)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                    
                    {/* Milestone Name */}
                    <div style={{ flex: 2 }}>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Concepto (ej: Cimentación)"
                        value={milestone.name}
                        onChange={(e) => handleMilestoneChange(milestone.id, 'name', e.target.value)}
                        required
                      />
                    </div>

                    {/* Percentage */}
                    <div style={{ width: '85px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="%"
                        min="0"
                        max="100"
                        value={milestone.percentage || ''}
                        onChange={(e) => handleMilestoneChange(milestone.id, 'percentage', e.target.value)}
                        required
                      />
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>%</span>
                    </div>

                    {/* Due Date */}
                    <div style={{ flex: 1.2 }}>
                      <input
                        type="date"
                        className="form-control"
                        value={milestone.dueDate}
                        onChange={(e) => handleMilestoneChange(milestone.id, 'dueDate', e.target.value)}
                        required
                      />
                    </div>

                    {/* Amount preview */}
                    <div style={{ width: '130px', textAlign: 'right', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {formatCurrency(milestone.amount)}
                    </div>

                    {/* Delete item */}
                    <button 
                      type="button" 
                      className="btn-icon" 
                      style={{ padding: '6px', color: 'var(--primary-red)', background: 'rgba(244,63,94,0.05)', borderColor: 'rgba(244,63,94,0.1)' }}
                      onClick={() => handleRemoveMilestone(milestone.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Percentages validation display */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px', padding: '10px 15px', borderRadius: '8px', background: totalPercentage === 100 ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)', border: totalPercentage === 100 ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(245,158,11,0.2)' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Total del Presupuesto Distribuido:
                </span>
                <span style={{ fontWeight: 700, fontSize: '0.95rem', color: totalPercentage === 100 ? 'var(--primary-teal)' : 'var(--primary-orange)' }}>
                  {totalPercentage}% / 100% {totalPercentage === 100 ? '✓ Listo' : '⚠️ Pendiente'}
                </span>
              </div>
            </div>

            {/* Map Selection */}
            <div>
              <h4 style={{ fontSize: '0.95rem', color: 'var(--primary-cyan)', marginBottom: '12px' }}>Localización de la Obra (Pin)</h4>
              <MapSelector location={formData.location} onChange={handleLocationChange} />
            </div>

          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={totalPercentage !== 100}>
              <Save size={16} /> Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
