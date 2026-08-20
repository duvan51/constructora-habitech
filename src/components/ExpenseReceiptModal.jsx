import React from 'react';
import { X, Printer, CheckCircle } from 'lucide-react';

export default function ExpenseReceiptModal({ project, transaction, onClose }) {
  if (!project || !transaction) return null;

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

  // Generate nice Receipt Number
  const receiptNumber = `EGR-${project.id}-${transaction.id.toUpperCase().split('_')[1]?.substring(0, 6) || transaction.id.toUpperCase().substring(0, 6)}`;

  // Parse transaction category label
  const getCategoryLabel = (cat) => {
    switch (cat) {
      case 'materials': return 'Materiales';
      case 'labor': return 'Mano de Obra';
      case 'permits': return 'Licencias y Permisos';
      default: return cat;
    }
  };

  // Strip description text to show clean details
  const getCleanDescription = () => {
    if (!transaction.description) return '';
    // If it contains "|| Compra: ", extract what is after it
    if (transaction.description.includes('|| Compra:')) {
      const parts = transaction.description.split('|| Compra:');
      return parts[1]?.split('(Obra:')[0]?.trim() || transaction.description;
    }
    return transaction.description;
  };

  // Get the associated budget line (Renglón Presupuestario)
  const getBudgetLine = () => {
    if (!transaction.description) return 'No especificado';
    if (transaction.description.includes(' || ')) {
      return transaction.description.split(' || ')[0];
    }
    return 'Sin clasificar / General';
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '750px', background: 'var(--bg-secondary)' }}>
        <div className="modal-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={22} style={{ color: 'var(--primary-orange)' }} />
            Comprobante de Egreso Generado
          </h3>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-body" style={{ padding: '25px' }}>
          {/* Printable wrapper */}
          <div className="printable-area receipt-container">
            {/* Header */}
            <div className="receipt-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                  <img src="/logo.png" alt="Logo HABITECH SAS" style={{ height: '75px', objectFit: 'contain' }} />
                </div>
                <div style={{ fontSize: '0.8rem', color: '#4b5563', lineHeight: '1.3' }}>
                  Grupo empresarial habitech sas<br />
                  NIT: 902067080-1<br />
                  Dirección: km 4 via villavicencio acacias, lote 1 barrio la nohora<br />
                  Celular: 3124147911<br />
                  Villavicencio - Meta
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#111827' }}>COMPROBANTE DE EGRESO</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#FF6D00', marginTop: '3px' }}>
                  N° {receiptNumber}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#4b5563', marginTop: '10px' }}>
                  <strong>Fecha Egreso:</strong> {transaction.date}
                </div>
              </div>
            </div>

            {/* Receipt Details */}
            <div className="receipt-details">
              <div style={{ background: '#f9fafb', padding: '15px', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#9ca3af', fontWeight: 700, marginBottom: '6px' }}>
                  ENTREGADO A / PAGADO A
                </div>
                <div style={{ fontWeight: 700, color: '#1f2937', fontSize: '1.05rem' }}>Proveedor / Compras de Obra</div>
                <div style={{ fontSize: '0.85rem', color: '#4b5563', marginTop: '4px' }}>
                  <strong>Concepto General:</strong> Compra de materiales y servicios relacionados.
                </div>
              </div>

              <div style={{ background: '#f9fafb', padding: '15px', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#9ca3af', fontWeight: 700, marginBottom: '6px' }}>
                  DETALLES DE LA OBRA
                </div>
                <div style={{ fontWeight: 700, color: '#1f2937', fontSize: '1.05rem' }}>{project.name}</div>
                <div style={{ fontSize: '0.85rem', color: '#4b5563', marginTop: '4px' }}>
                  <strong>Dirección:</strong> {project.location?.customAddress || project.location?.address || 'Ubicación registrada'}
                </div>
              </div>
            </div>

            {/* Itemized Table */}
            <table className="receipt-table" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px', marginBottom: '20px' }}>
              <thead>
                <tr style={{ background: '#f3f4f6', borderBottom: '2px solid #e5e7eb', color: '#374151', fontSize: '0.85rem', textAlign: 'left' }}>
                  <th style={{ padding: '10px' }}>Detalle de la Transacción / Compra</th>
                  <th style={{ padding: '10px' }}>Categoría Presupuesto</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Valor Retirado (Egreso)</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #e5e7eb', fontSize: '0.9rem', color: '#4b5563' }}>
                  <td style={{ padding: '12px 10px' }}>
                    <div style={{ fontWeight: 600, color: '#1f2937' }}>{getCleanDescription()}</div>
                    <div style={{ fontSize: '0.8rem', color: '#4b5563', marginTop: '3px' }}>
                      <strong>Renglón Presupuestario Asociado:</strong> {getBudgetLine()}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '2px' }}>
                      Egreso cargado a costos de obra
                    </div>
                  </td>
                  <td style={{ padding: '12px 10px' }}>{getCategoryLabel(transaction.category)}</td>
                  <td style={{ padding: '12px 10px', textAlign: 'right', fontWeight: 700, color: '#ef4444' }}>
                    {formatCurrency(transaction.amount)}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Financial Summary */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
              <div style={{ width: '100%', maxWidth: '340px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', borderTop: '2px solid #e5e7eb', paddingTop: '8px' }}>
                  <span style={{ fontWeight: 700, color: '#1f2937' }}>Valor Total del Egreso:</span>
                  <span style={{ fontWeight: 700, color: '#ef4444' }}>{formatCurrency(transaction.amount)}</span>
                </div>
              </div>
            </div>

            {/* Note / Associated Budget Line */}
            <div style={{ 
              background: '#f9fafb', 
              padding: '12px 15px', 
              borderRadius: '6px', 
              borderLeft: '4px solid #FF6D00', 
              fontSize: '0.85rem', 
              color: '#374151',
              marginBottom: '25px',
              marginTop: '15px',
              textAlign: 'left'
            }}>
              <strong>NOTA:</strong> Este egreso está asociado al renglón presupuestario: <strong>{getBudgetLine()}</strong>.
            </div>

            {/* Receipt Footer */}
            <div className="receipt-footer">
              <div style={{ width: '45%', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ height: '55px', borderBottom: '1px solid #9ca3af', marginBottom: '10px', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', width: '100%', position: 'relative' }}>
                  <img 
                    src="/firma_representante.png" 
                    alt="Firma Representante Legal" 
                    style={{ maxHeight: '85px', position: 'absolute', bottom: '-15px', mixBlendMode: 'multiply' }} 
                  />
                </div>
                <div style={{ fontWeight: 600 }}>Grupo empresarial habitech sas</div>
                <div style={{ fontSize: '0.75rem' }}>Firma Autorizada</div>
              </div>
              <div style={{ width: '45%', textAlign: 'center' }}>
                <div style={{ height: '55px', borderBottom: '1px solid #9ca3af', marginBottom: '10px' }}></div>
                <div style={{ fontWeight: 600 }}>Firma Beneficiario</div>
                <div style={{ fontSize: '0.75rem' }}>Recibido Conforme</div>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cerrar
          </button>
          <button type="button" className="btn btn-primary" onClick={handlePrint}>
            <Printer size={16} /> Imprimir Egreso
          </button>
        </div>
      </div>
    </div>
  );
}
