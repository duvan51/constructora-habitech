import React from 'react';
import { X, Printer, CheckCircle } from 'lucide-react';

export default function ReceiptModal({ project, payment, onClose }) {
  if (!project || !payment) return null;

  // Formatting helpers
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value);
  };

  const handlePrint = () => {
    window.print();
  };

  // Calculate project financials up to this point
  const totalPaid = project.paymentPlan
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingBalance = project.totalCost - totalPaid;

  const receiptNumber = `RCP-${project.id}-${payment.id.toUpperCase()}`;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '750px', background: 'var(--bg-secondary)' }}>
        <div className="modal-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={22} style={{ color: 'var(--primary-teal)' }} />
            Recibo de Caja Generado
          </h3>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-body" style={{ padding: '25px' }}>
          {/* Printable wrapper */}
          <div className="printable-area receipt-container">
            {/* Header */}
            <div className="receipt-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                  {/* Clean SVG Logo */}
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L2 12H5V21H9V15H15V21H19V12H22L12 2Z" fill="#06b6d4" />
                    <path d="M12 5L4 13V19H7V13H17V19H20V13L12 5Z" fill="#6366f1" />
                  </svg>
                  <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.5px' }}>
                    HABITECH <span style={{ color: '#06b6d4', fontWeight: 400 }}>Constructor</span>
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#4b5563', lineHeight: '1.3' }}>
                  Habitech Construcciones S.A.S.<br />
                  NIT: 901.452.883-1<br />
                  Medellín, Colombia<br />
                  soporte@habitech.com.co
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#111827' }}>RECIBO DE CAJA</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#06b6d4', marginTop: '3px' }}>
                  N° {receiptNumber}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#4b5563', marginTop: '10px' }}>
                  <strong>Fecha Emisión:</strong> {payment.paidDate || new Date().toISOString().split('T')[0]}
                </div>
              </div>
            </div>

            {/* Receipt Details */}
            <div className="receipt-details">
              <div style={{ background: '#f9fafb', padding: '15px', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#9ca3af', fontWeight: 700, marginBottom: '6px' }}>
                  RECIBIDO DE (CLIENTE)
                </div>
                <div style={{ fontWeight: 700, color: '#1f2937', fontSize: '1.05rem' }}>{project.clientName}</div>
                <div style={{ fontSize: '0.85rem', color: '#4b5563', marginTop: '4px' }}>
                  <strong>Tel:</strong> {project.clientPhone || 'N/A'}<br />
                  <strong>Email:</strong> {project.clientEmail || 'N/A'}
                </div>
              </div>

              <div style={{ background: '#f9fafb', padding: '15px', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#9ca3af', fontWeight: 700, marginBottom: '6px' }}>
                  DETALLES DE LA OBRA
                </div>
                <div style={{ fontWeight: 700, color: '#1f2937', fontSize: '1.05rem' }}>{project.name}</div>
                <div style={{ fontSize: '0.85rem', color: '#4b5563', marginTop: '4px' }}>
                  <strong>Dirección:</strong> {project.location?.address || 'Ubicación registrada'}
                </div>
              </div>
            </div>

            {/* Financial Ledger Table */}
            <table className="receipt-table">
              <thead>
                <tr>
                  <th>Concepto / Descripción del Pago</th>
                  <th style={{ textAlign: 'right' }}>Valor Recibido</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <div style={{ fontWeight: 600, color: '#1f2937' }}>{payment.name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '4px' }}>
                      Porcentaje correspondiente del plan de pagos: {payment.percentage}%
                    </div>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700, fontSize: '1.1rem', color: '#10b981' }}>
                    {formatCurrency(payment.amount)}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Financial Summary */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
              <div style={{ width: '100%', maxWidth: '300px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span style={{ color: '#4b5563' }}>Valor de la Obra:</span>
                  <span style={{ fontWeight: 600, color: '#1f2937' }}>{formatCurrency(project.totalCost)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span style={{ color: '#4b5563' }}>Total Recaudado:</span>
                  <span style={{ fontWeight: 600, color: '#10b981' }}>{formatCurrency(totalPaid)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', borderTop: '2px solid #e5e7eb', paddingTop: '8px' }}>
                  <span style={{ fontWeight: 700, color: '#1f2937' }}>Saldo Pendiente:</span>
                  <span style={{ fontWeight: 700, color: '#f59e0b' }}>{formatCurrency(pendingBalance)}</span>
                </div>
              </div>
            </div>

            {/* Receipt Footer */}
            <div className="receipt-footer">
              <div style={{ width: '45%', textAlign: 'center' }}>
                <div style={{ height: '50px', borderBottom: '1px solid #9ca3af', marginBottom: '10px' }}></div>
                <div style={{ fontWeight: 600 }}>HABITECH Construcciones</div>
                <div style={{ fontSize: '0.75rem' }}>Firma Autorizada</div>
              </div>
              <div style={{ width: '45%', textAlign: 'center' }}>
                <div style={{ height: '50px', borderBottom: '1px solid #9ca3af', marginBottom: '10px' }}></div>
                <div style={{ fontWeight: 600 }}>{project.clientName}</div>
                <div style={{ fontSize: '0.75rem' }}>Firma del Cliente</div>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cerrar
          </button>
          <button type="button" className="btn btn-primary" onClick={handlePrint}>
            <Printer size={16} /> Imprimir Recibo
          </button>
        </div>
      </div>
    </div>
  );
}
