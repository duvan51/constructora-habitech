import React, { useState } from 'react';
import { X, Save, Hammer, Layers, Layout, Trash2, Plus, Upload, Film, Image as ImageIcon } from 'lucide-react';

export default function PortfolioForm({ portfolioItem, onClose, onSave }) {
  const isEdit = !!portfolioItem;

  const [formData, setFormData] = useState(() => {
    return {
      id: portfolioItem?.id || `port_${new Date().getTime()}`,
      code: portfolioItem?.code || '',
      title: portfolioItem?.title || '',
      description: portfolioItem?.description || '',
      mainImage: portfolioItem?.mainImage || '',
      blueprintImage: portfolioItem?.blueprintImage || '',
      otherImages: portfolioItem?.otherImages || [],
      videoUrl: portfolioItem?.videoUrl || '',
      constructionSystems: portfolioItem?.constructionSystems || [],
      builtArea: portfolioItem?.builtArea || '',
      lotArea: portfolioItem?.lotArea || '',
      logos: portfolioItem?.logos || []
    };
  });

  const [newSystem, setNewSystem] = useState('');

  // Default suggested systems
  const suggestedSystems = ['Tradicional', 'Modular Prefabricado', 'Steel Framing', 'Wood Framing', 'Panel Sándwich'];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'builtArea' || name === 'lotArea' ? (parseFloat(value) || '') : value
    }));
  };

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setFormData(prev => ({ ...prev, [field]: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleMultipleFilesChange = (e, field) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        setFormData(prev => ({
          ...prev,
          [field]: [...(prev[field] || []), reader.result]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleToggleSystem = (sys) => {
    setFormData(prev => {
      const current = prev.constructionSystems;
      if (current.includes(sys)) {
        return { ...prev, constructionSystems: current.filter(s => s !== sys) };
      } else {
        return { ...prev, constructionSystems: [...current, sys] };
      }
    });
  };

  const handleAddCustomSystem = (e) => {
    e.preventDefault();
    const sys = newSystem.trim();
    if (!sys) return;

    if (!formData.constructionSystems.includes(sys)) {
      setFormData(prev => ({
        ...prev,
        constructionSystems: [...prev.constructionSystems, sys]
      }));
    }
    setNewSystem('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Ingresa el título del proyecto.');
      return;
    }
    if (!formData.code.trim()) {
      alert('Ingresa el código del proyecto (ej: CA-1).');
      return;
    }
    if (!formData.mainImage) {
      alert('Por favor selecciona una imagen principal para el catálogo.');
      return;
    }
    if (!formData.builtArea || formData.builtArea <= 0) {
      alert('Por favor ingresa un área construida válida.');
      return;
    }

    onSave(formData);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '750px' }}>
        <div className="modal-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Hammer size={22} style={{ color: 'var(--primary-cyan)' }} />
            {isEdit ? 'Editar Proyecto del Portafolio' : 'Registrar Proyecto en Portafolio'}
          </h3>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
            
            {/* Informacion Basica */}
            <div style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: '15px', marginBottom: '20px' }}>
              <h4 style={{ fontSize: '0.95rem', color: 'var(--primary-cyan)', marginBottom: '12px' }}>Ficha del Modelo comercial</h4>
              
              <div className="form-row">
                <div className="form-group" style={{ flex: 1.5 }}>
                  <label>Título del Proyecto / Nombre del Modelo</label>
                  <input
                    type="text"
                    name="title"
                    className="form-control"
                    placeholder="Ej: Casa Campestre 1 Piso"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group" style={{ flex: 0.5 }}>
                  <label>Código del Modelo</label>
                  <input
                    type="text"
                    name="code"
                    className="form-control"
                    placeholder="Ej: CA-1"
                    value={formData.code}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Descripción / Detalles Comerciales</label>
                <textarea
                  name="description"
                  className="form-control"
                  rows="3"
                  placeholder="Detalles sobre distribución, acabados, comodidades..."
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Área Construida (M²)</label>
                  <input
                    type="number"
                    name="builtArea"
                    className="form-control"
                    placeholder="Ej: 140"
                    value={formData.builtArea}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Área Total Sugerida Lote (M²)</label>
                  <input
                    type="number"
                    name="lotArea"
                    className="form-control"
                    placeholder="Ej: 300 (Opcional)"
                    value={formData.lotArea}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            {/* Sistemas Constructivos */}
            <div style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: '15px', marginBottom: '20px' }}>
              <h4 style={{ fontSize: '0.95rem', color: 'var(--primary-cyan)', marginBottom: '12px' }}>Sistemas Constructivos Soportados</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                {suggestedSystems.map(sys => {
                  const isChecked = formData.constructionSystems.includes(sys);
                  return (
                    <button
                      key={sys}
                      type="button"
                      className={`btn ${isChecked ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ padding: '6px 12px', fontSize: '0.85rem', borderRadius: '20px' }}
                      onClick={() => handleToggleSystem(sys)}
                    >
                      {sys}
                    </button>
                  );
                })}
                {formData.constructionSystems.filter(s => !suggestedSystems.includes(s)).map(sys => (
                  <button
                    key={sys}
                    type="button"
                    className="btn btn-primary"
                    style={{ padding: '6px 12px', fontSize: '0.85rem', borderRadius: '20px', background: 'var(--primary-teal)', borderColor: 'transparent' }}
                    onClick={() => handleToggleSystem(sys)}
                  >
                    {sys} <X size={12} style={{ marginLeft: '4px', display: 'inline' }} />
                  </button>
                ))}
              </div>

              {/* Add custom system */}
              <div style={{ display: 'flex', gap: '10px', maxWidth: '350px' }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Otro sistema (ej: Panel EPS)..."
                  value={newSystem}
                  onChange={(e) => setNewSystem(e.target.value)}
                />
                <button type="button" className="btn btn-secondary" onClick={handleAddCustomSystem}>
                  <Plus size={16} /> Agregar
                </button>
              </div>
            </div>

            {/* Video e Imagenes */}
            <div style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: '15px', marginBottom: '20px' }}>
              <h4 style={{ fontSize: '0.95rem', color: 'var(--primary-cyan)', marginBottom: '12px' }}>Multimedia del Portafolio</h4>

              {/* Video URL */}
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Film size={14} /> Enlace de Video (YouTube / Vimeo / Directo)</label>
                <input
                  type="url"
                  name="videoUrl"
                  className="form-control"
                  placeholder="Ej: https://www.youtube.com/watch?v=..."
                  value={formData.videoUrl}
                  onChange={handleInputChange}
                />
              </div>

              {/* Image Uploaders */}
              <div className="form-row" style={{ marginTop: '15px' }}>
                {/* Main Image */}
                <div className="form-group">
                  <label>Imagen Principal (Catálogo)</label>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <div style={{ position: 'relative', width: '90px', height: '65px', borderRadius: '8px', border: '1px solid var(--border-glass)', overflow: 'hidden', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {formData.mainImage ? (
                        <img src={formData.mainImage} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Principal" />
                      ) : (
                        <ImageIcon size={20} style={{ color: 'var(--text-muted)' }} />
                      )}
                    </div>
                    <input
                      type="file"
                      id="main-img"
                      style={{ display: 'none' }}
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'mainImage')}
                    />
                    <label htmlFor="main-img" className="btn btn-secondary" style={{ padding: '8px 12px', fontSize: '0.85rem', cursor: 'pointer' }}>
                      <Upload size={14} /> Seleccionar
                    </label>
                  </div>
                </div>

                {/* Blueprint Image */}
                <div className="form-group">
                  <label>Plano Técnico (Layout)</label>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <div style={{ position: 'relative', width: '90px', height: '65px', borderRadius: '8px', border: '1px solid var(--border-glass)', overflow: 'hidden', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {formData.blueprintImage ? (
                        <img src={formData.blueprintImage} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Plano" />
                      ) : (
                        <Layers size={20} style={{ color: 'var(--text-muted)' }} />
                      )}
                    </div>
                    <input
                      type="file"
                      id="blue-img"
                      style={{ display: 'none' }}
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'blueprintImage')}
                    />
                    <label htmlFor="blue-img" className="btn btn-secondary" style={{ padding: '8px 12px', fontSize: '0.85rem', cursor: 'pointer' }}>
                      <Upload size={14} /> Seleccionar
                    </label>
                  </div>
                </div>
              </div>

              {/* Other Images (Gallery) */}
              <div className="form-group" style={{ marginTop: '15px' }}>
                <label>Galería Adicional (Otras fotos de renders o de fachadas)</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
                  {formData.otherImages.map((img, idx) => (
                    <div key={idx} style={{ position: 'relative', width: '80px', height: '60px', borderRadius: '6px', border: '1px solid var(--border-glass)', overflow: 'hidden' }}>
                      <img src={img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Galería" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage('otherImages', idx)}
                        style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', color: 'var(--primary-red)', padding: '2px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
                <input
                  type="file"
                  id="gallery-imgs"
                  multiple
                  style={{ display: 'none' }}
                  accept="image/*"
                  onChange={(e) => handleMultipleFilesChange(e, 'otherImages')}
                />
                <label htmlFor="gallery-imgs" className="btn btn-secondary" style={{ padding: '8px 12px', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <Plus size={14} /> Agregar Imágenes a la Galería
                </label>
              </div>
            </div>

            {/* Logos */}
            <div>
              <h4 style={{ fontSize: '0.95rem', color: 'var(--primary-cyan)', marginBottom: '12px' }}>Logos de Aliados / Marcas Utilizadas / Certificados</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
                {formData.logos.map((img, idx) => (
                  <div key={idx} style={{ position: 'relative', width: '60px', height: '60px', borderRadius: '6px', border: '1px solid var(--border-glass)', overflow: 'hidden', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}>
                    <img src={img} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} alt="Logo" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage('logos', idx)}
                      style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', color: 'var(--primary-red)', padding: '2px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
              <input
                type="file"
                id="logos-imgs"
                multiple
                style={{ display: 'none' }}
                accept="image/*"
                onChange={(e) => handleMultipleFilesChange(e, 'logos')}
              />
              <label htmlFor="logos-imgs" className="btn btn-secondary" style={{ padding: '8px 12px', fontSize: '0.85rem', cursor: 'pointer' }}>
                <Plus size={14} /> Cargar Logos
              </label>
            </div>

          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              <Save size={16} /> Guardar Proyecto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
