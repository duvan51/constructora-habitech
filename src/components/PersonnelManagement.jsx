import React, { useState } from 'react';
import { Plus, Edit3, Trash2, Search, FileText, Phone, User, Download, Upload, X, Check } from 'lucide-react';

export default function PersonnelManagement({ personnel, userRole, onSave, onDelete }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    documentId: '',
    phone1: '',
    phone2: '',
    documentBase64: '',
    arlBase64: '',
    jobTitle: ''
  });
  
  const [docFileName, setDocFileName] = useState('');
  const [arlFileName, setArlFileName] = useState('');
  const [previewFile, setPreviewFile] = useState(null); // { title, base64 }

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      documentId: '',
      phone1: '',
      phone2: '',
      documentBase64: '',
      arlBase64: '',
      jobTitle: ''
    });
    setDocFileName('');
    setArlFileName('');
    setEditingItem(null);
    setShowFormModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      documentId: item.documentId,
      phone1: item.phone1 || '',
      phone2: item.phone2 || '',
      documentBase64: item.documentBase64 || '',
      arlBase64: item.arlBase64 || '',
      jobTitle: item.jobTitle || ''
    });
    setDocFileName(item.documentBase64 ? 'Cédula cargada' : '');
    setArlFileName(item.arlBase64 ? 'ARL cargada' : '');
    setShowFormModal(true);
  };

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    if (field === 'doc') {
      setDocFileName(file.name);
    } else {
      setArlFileName(file.name);
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({
        ...prev,
        [field === 'doc' ? 'documentBase64' : 'arlBase64']: reader.result
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.documentId.trim()) {
      alert('Nombre y Cédula son campos obligatorios.');
      return;
    }

    const itemToSave = {
      ...formData,
      id: editingItem ? editingItem.id : `staff_${new Date().getTime()}`,
      name: formData.name.trim(),
      documentId: formData.documentId.trim(),
      jobTitle: formData.jobTitle.trim()
    };

    onSave(itemToSave);
    setShowFormModal(false);
  };

  const filteredPersonnel = personnel.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.documentId.includes(searchTerm) ||
    (p.jobTitle || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="personnel-view animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1>Gestión de Personal</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Registra, administra y asocia el personal de obra para el pago de mano de obra y contratistas.</p>
        </div>
        {userRole !== 'viewer' && (
          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <Plus size={16} /> Agregar Personal
          </button>
        )}
      </div>

      {/* Toolbar */}
      <div className="glass-panel" style={{ padding: '15px 20px', marginBottom: '25px', display: 'flex', gap: '15px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            type="text"
            className="form-control"
            style={{ paddingLeft: '35px' }}
            placeholder="Buscar por nombre, cédula o cargo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        </div>
      </div>

      {/* Grid of Personnel Card Panels */}
      {filteredPersonnel.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-secondary)' }}>
          <User size={48} style={{ color: 'var(--text-muted)', marginBottom: '15px' }} />
          <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '5px' }}>No hay personal registrado</p>
          <p style={{ fontSize: '0.85rem' }}>Agrega empleados o subcontratistas para poder seleccionarlos al pagar mano de obra.</p>
        </div>
      ) : (
        <div className="grid-3">
          {filteredPersonnel.map(item => (
            <div key={item.id} className="glass-panel" style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '15px', position: 'relative', borderLeft: '4px solid var(--primary-cyan)' }}>
              
              {/* Header Info */}
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', color: 'var(--text-primary)' }}>{item.name}</h3>
                {item.jobTitle && (
                  <span className="badge badge-completed" style={{ fontSize: '0.7rem', display: 'inline-block', background: 'rgba(255, 109, 0, 0.1)', color: 'var(--primary-cyan)', border: '1px solid rgba(255, 109, 0, 0.2)' }}>
                    {item.jobTitle}
                  </span>
                )}
              </div>

              {/* Data Rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={14} style={{ color: 'var(--text-muted)' }} />
                  <span><strong>Cédula:</strong> {item.documentId}</span>
                </div>
                {(item.phone1 || item.phone2) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Phone size={14} style={{ color: 'var(--text-muted)' }} />
                    <span>
                      <strong>Teléfono:</strong> {item.phone1} {item.phone2 && ` / ${item.phone2}`}
                    </span>
                  </div>
                )}
              </div>

              {/* Files Uploaded Row */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', borderTop: '1px solid var(--border-glass)', paddingTop: '12px', marginTop: '5px' }}>
                {item.documentBase64 ? (
                  <button 
                    type="button"
                    className="btn" 
                    style={{ fontSize: '0.75rem', padding: '4px 8px', background: 'rgba(6, 182, 212, 0.08)', color: 'var(--primary-cyan)', border: '1px solid rgba(6, 182, 212, 0.15)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    onClick={() => setPreviewFile({ title: `Cédula: ${item.name}`, base64: item.documentBase64 })}
                  >
                    📄 Cédula
                  </button>
                ) : (
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center' }}>Sin Cédula cargada</span>
                )}
                {item.arlBase64 ? (
                  <button 
                    type="button"
                    className="btn" 
                    style={{ fontSize: '0.75rem', padding: '4px 8px', background: 'rgba(16, 185, 129, 0.08)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.15)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    onClick={() => setPreviewFile({ title: `ARL: ${item.name}`, base64: item.arlBase64 })}
                  >
                    🏥 ARL
                  </button>
                ) : (
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center' }}>Sin ARL</span>
                )}
              </div>

              {/* Action Buttons */}
              {userRole !== 'viewer' && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                  <button 
                    type="button"
                    className="btn-icon" 
                    onClick={() => handleOpenEdit(item)}
                    style={{ padding: '6px', color: 'var(--primary-cyan)' }}
                    title="Editar"
                  >
                    <Edit3 size={15} />
                  </button>
                  <button 
                    type="button"
                    className="btn-icon" 
                    onClick={() => onDelete(item.id)}
                    style={{ padding: '6px', color: 'var(--primary-red)' }}
                    title="Eliminar"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ADD/EDIT MODAL FORM */}
      {showFormModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px', width: '90%' }}>
            <div className="modal-header">
              <h3>{editingItem ? 'Editar Personal' : 'Agregar Personal'}</h3>
              <button className="btn-icon" onClick={() => setShowFormModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                
                <div className="form-group">
                  <label>Nombre Completo *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ej. Juan Pérez"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Cédula / Documento *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ej. 10234567"
                      value={formData.documentId}
                      onChange={(e) => setFormData(prev => ({ ...prev, documentId: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Cargo / Rol en Obra</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ej. Oficial, Ayudante, Contratista"
                      value={formData.jobTitle}
                      onChange={(e) => setFormData(prev => ({ ...prev, jobTitle: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Teléfono 1</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ej. 3123456789"
                      value={formData.phone1}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone1: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Teléfono 2 (Opcional)</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ej. 3209876543"
                      value={formData.phone2}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone2: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Upload File Fields */}
                <div style={{ borderTop: '1px dashed var(--border-glass)', paddingTop: '15px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  
                  {/* Cedula Document */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Cargar Cédula (PDF o Imagen)</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input
                        type="file"
                        id="cedula-upload"
                        style={{ display: 'none' }}
                        accept="image/*,application/pdf"
                        onChange={(e) => handleFileChange(e, 'doc')}
                      />
                      <label htmlFor="cedula-upload" className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0, padding: '8px 14px' }}>
                        <Upload size={14} /> Examinar...
                      </label>
                      <span style={{ fontSize: '0.8rem', color: docFileName ? 'var(--primary-teal)' : 'var(--text-muted)' }}>
                        {docFileName ? (
                          <>
                            <Check size={12} style={{ display: 'inline', marginRight: '4px' }} />
                            {docFileName}
                          </>
                        ) : 'Sin archivo seleccionado'}
                      </span>
                    </div>
                  </div>

                  {/* ARL Document */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Cargar Planilla ARL (PDF o Imagen)</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input
                        type="file"
                        id="arl-upload"
                        style={{ display: 'none' }}
                        accept="image/*,application/pdf"
                        onChange={(e) => handleFileChange(e, 'arl')}
                      />
                      <label htmlFor="arl-upload" className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0, padding: '8px 14px' }}>
                        <Upload size={14} /> Examinar...
                      </label>
                      <span style={{ fontSize: '0.8rem', color: arlFileName ? 'var(--primary-teal)' : 'var(--text-muted)' }}>
                        {arlFileName ? (
                          <>
                            <Check size={12} style={{ display: 'inline', marginRight: '4px' }} />
                            {arlFileName}
                          </>
                        ) : 'Sin archivo seleccionado'}
                      </span>
                    </div>
                  </div>

                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowFormModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingItem ? 'Guardar Cambios' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DOCUMENT PREVIEW MODAL */}
      {previewFile && (
        <div className="modal-overlay" onClick={() => setPreviewFile(null)}>
          <div className="modal-content" style={{ maxWidth: '650px', width: '90%', background: 'var(--bg-secondary)', padding: '20px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={20} style={{ color: 'var(--primary-cyan)' }} />
                {previewFile.title}
              </h3>
              <button className="btn-icon" onClick={() => setPreviewFile(null)}><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '10px' }}>
              {previewFile.base64.startsWith('data:application/pdf') || previewFile.base64.startsWith('http') && previewFile.base64.endsWith('.pdf') ? (
                <iframe 
                  src={previewFile.base64} 
                  title="Documento" 
                  style={{ width: '100%', height: '450px', border: 'none', borderRadius: '8px' }}
                />
              ) : (
                <img 
                  src={previewFile.base64} 
                  alt="Documento" 
                  style={{ maxWidth: '100%', maxHeight: '450px', objectFit: 'contain', borderRadius: '8px', border: '1px solid var(--border-glass)' }} 
                />
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setPreviewFile(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
