import React from 'react';
import { MapPin, Calendar, DollarSign, User, ArrowRight } from 'lucide-react';

export default function ProjectCard({ project, onSelect }) {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'planning': return <span className="badge badge-planning">Planificación</span>;
      case 'active': return <span className="badge badge-active">En Obra</span>;
      case 'halted': return <span className="badge badge-halted">Detenido</span>;
      case 'completed': return <span className="badge badge-completed">Terminado</span>;
      default: return null;
    }
  };

  // Calculate financial progression
  const totalPaid = project.paymentPlan
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="glass-panel glass-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Card Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        {getStatusBadge(project.status)}
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Calendar size={12} />
          {project.startDate}
        </div>
      </div>

      {/* Project Name */}
      <h3 style={{ fontSize: '1.15rem', marginBottom: '15px', color: 'var(--text-primary)', cursor: 'pointer' }} onClick={() => onSelect(project.id)}>
        {project.name}
      </h3>

      {/* Details List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px', flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <User size={14} style={{ color: 'var(--primary-cyan)', flexShrink: 0 }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <strong>Cliente:</strong> {project.clientName}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MapPin size={14} style={{ color: 'var(--primary-cyan)', flexShrink: 0 }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={project.location?.address}>
            <strong>Ubicación:</strong> {project.location?.address}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <DollarSign size={14} style={{ color: 'var(--primary-teal)', flexShrink: 0 }} />
          <span>
            <strong>Presupuesto:</strong> {formatCurrency(project.totalCost)}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '22px', fontSize: '0.8rem' }}>
          <span><strong>Cobrado:</strong> <span style={{ color: 'var(--primary-teal)', fontWeight: 600 }}>{formatCurrency(totalPaid)}</span></span>
          <span style={{ marginLeft: '10px' }}><strong>Pendiente:</strong> <span style={{ color: 'var(--primary-orange)' }}>{formatCurrency(project.totalCost - totalPaid)}</span></span>
        </div>
      </div>

      {/* Progress Section */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
          <span>Progreso Físico</span>
          <span style={{ fontWeight: 700, color: 'var(--primary-cyan)' }}>{project.progress}%</span>
        </div>
        <div className="progress-bar-container" style={{ margin: '0' }}>
          <div 
            className="progress-bar-fill" 
            style={{ 
              width: `${project.progress}%`, 
              background: 'linear-gradient(90deg, var(--primary-cyan), var(--primary-indigo))'
            }}
          ></div>
        </div>
      </div>

      {/* Card Action Button */}
      <button 
        onClick={() => onSelect(project.id)}
        className="btn btn-secondary" 
        style={{ 
          width: '100%', 
          marginTop: 'auto',
          display: 'flex', 
          justifyContent: 'center', 
          gap: '8px' 
        }}
      >
        Administrar Obra
        <ArrowRight size={14} />
      </button>
    </div>
  );
}
