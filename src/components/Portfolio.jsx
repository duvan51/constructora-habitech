import React, { useState } from 'react';
import { Plus, Search, BookOpen, Layers, Layout, Video, ChevronRight, ArrowLeft, Edit2, Trash2, Home, Box, Maximize2 } from 'lucide-react';
import PortfolioForm from './PortfolioForm';

export default function Portfolio({ portfolio, userRole, onSave, onDelete }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSystem, setFilterSystem] = useState('all');
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [activeMediaTab, setActiveMediaTab] = useState('photos'); // 'photos' | 'blueprint' | 'video'
  const [selectedGalleryImage, setSelectedGalleryImage] = useState(null);

  // Extract all unique construction systems from the portfolio list for filtering
  const allSystems = Array.from(
    new Set(portfolio.reduce((acc, item) => [...acc, ...(item.constructionSystems || [])], []))
  );

  const formatM2 = (val) => `${val} m²`;

  const getYoutubeEmbedUrl = (url) => {
    if (!url) return '';
    // Handle standard watch link
    let regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    let match = url.match(regExp);
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}`;
    }
    // Handle shorts URL
    if (url.includes('/shorts/')) {
      const parts = url.split('/shorts/');
      if (parts[1]) {
        return `https://www.youtube.com/embed/${parts[1].split(/[?#]/)[0]}`;
      }
    }
    return url;
  };

  const handleEditClick = (item, e) => {
    e.stopPropagation();
    setEditingItem(item);
    setShowFormModal(true);
  };

  const handleDeleteClick = (id, e) => {
    e.stopPropagation();
    onDelete(id);
    if (selectedItemId === id) {
      setSelectedItemId(null);
    }
  };

  // Filtered portfolio items
  const filteredItems = portfolio.filter(item => {
    const matchesSearch = 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSystem = 
      filterSystem === 'all' || 
      item.constructionSystems.includes(filterSystem);

    return matchesSearch && matchesSystem;
  });

  const selectedItem = portfolio.find(item => item.id === selectedItemId);

  // Main Image + secondary images logic
  const allProjectImages = selectedItem 
    ? [selectedItem.mainImage, ...(selectedItem.otherImages || [])].filter(Boolean)
    : [];

  return (
    <div className="portfolio-view animate-fade-in">
      {selectedItem ? (
        /* ==================== DETAILED VIEW ==================== */
        <div className="portfolio-detail-layout animate-fade-in">
          {/* Header */}
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '25px', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
              <button className="btn-icon" onClick={() => { setSelectedItemId(null); setSelectedGalleryImage(null); setActiveMediaTab('photos'); }}>
                <ArrowLeft size={18} />
              </button>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="badge badge-planning" style={{ fontSize: '0.7rem' }}>Código {selectedItem.code}</span>
                </div>
                <h2 style={{ margin: 0, marginTop: '4px', fontSize: '1.6rem', color: 'var(--text-primary)' }}>{selectedItem.title}</h2>
              </div>
            </div>

            {userRole !== 'viewer' && (
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn btn-secondary" onClick={(e) => handleEditClick(selectedItem, e)}>
                  <Edit2 size={14} /> Editar Ficha
                </button>
                <button className="btn btn-danger" onClick={(e) => handleDeleteClick(selectedItem.id, e)}>
                  <Trash2 size={14} /> Eliminar
                </button>
              </div>
            )}
          </div>

          <div className="grid-2" style={{ gridTemplateColumns: '1.8fr 1.2fr', alignItems: 'start', gap: '25px' }}>
            {/* Left Column: Media Presentation */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Media tab selector */}
              <div className="tabs-header" style={{ marginBottom: '15px' }}>
                <button className={`tab-btn ${activeMediaTab === 'photos' ? 'active' : ''}`} onClick={() => setActiveMediaTab('photos')}>
                  Fotos del Proyecto ({allProjectImages.length})
                </button>
                {selectedItem.blueprintImage && (
                  <button className={`tab-btn ${activeMediaTab === 'blueprint' ? 'active' : ''}`} onClick={() => setActiveMediaTab('blueprint')}>
                    Plano de Distribución
                  </button>
                )}
                {selectedItem.videoUrl && (
                  <button className={`tab-btn ${activeMediaTab === 'video' ? 'active' : ''}`} onClick={() => setActiveMediaTab('video')}>
                    Video Recorrido
                  </button>
                )}
              </div>

              {/* Photos View */}
              {activeMediaTab === 'photos' && (
                <div className="glass-panel" style={{ padding: '15px' }}>
                  <div style={{ width: '100%', height: '380px', borderRadius: '12px', overflow: 'hidden', background: '#0b0f19', border: '1px solid var(--border-glass)' }}>
                    <img 
                      src={selectedGalleryImage || selectedItem.mainImage} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      alt={selectedItem.title} 
                    />
                  </div>

                  {/* Image Carousel Selection */}
                  {allProjectImages.length > 1 && (
                    <div style={{ display: 'flex', gap: '10px', marginTop: '12px', overflowX: 'auto', paddingBottom: '5px' }}>
                      {allProjectImages.map((img, idx) => {
                        const isSelected = selectedGalleryImage ? (selectedGalleryImage === img) : (selectedItem.mainImage === img);
                        return (
                          <div 
                            key={idx}
                            onClick={() => setSelectedGalleryImage(img)}
                            style={{ 
                              width: '80px', 
                              height: '60px', 
                              borderRadius: '6px', 
                              overflow: 'hidden', 
                              cursor: 'pointer',
                              border: isSelected ? '2px solid var(--primary-cyan)' : '1px solid var(--border-glass)',
                              boxShadow: isSelected ? 'var(--glow-cyan)' : 'none',
                              flexShrink: 0
                            }}
                          >
                            <img src={img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Miniatura" />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Blueprint View */}
              {activeMediaTab === 'blueprint' && selectedItem.blueprintImage && (
                <div className="glass-panel" style={{ padding: '15px', position: 'relative' }}>
                  <div style={{ width: '100%', height: '380px', borderRadius: '12px', overflow: 'hidden', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img 
                      src={selectedItem.blueprintImage} 
                      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} 
                      alt="Plano Técnico" 
                    />
                    <button 
                      type="button" 
                      className="btn-icon" 
                      title="Ampliar Plano"
                      onClick={() => {
                        const w = window.open();
                        w.document.write(`<img src="${selectedItem.blueprintImage}" style="max-width:100%; max-height:100vh; display:block; margin:auto;" />`);
                        w.document.title = `Plano - ${selectedItem.title}`;
                      }}
                      style={{ position: 'absolute', top: '25px', right: '25px' }}
                    >
                      <Maximize2 size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* Video View */}
              {activeMediaTab === 'video' && selectedItem.videoUrl && (
                <div className="glass-panel" style={{ padding: '15px' }}>
                  <div style={{ width: '100%', height: '380px', borderRadius: '12px', overflow: 'hidden', background: '#000', border: '1px solid var(--border-glass)' }}>
                    {selectedItem.videoUrl.startsWith('data:video/') ? (
                      /* Local uploaded Base64 video */
                      <video 
                        src={selectedItem.videoUrl} 
                        controls 
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                    ) : (
                      /* Embed YouTube iframe */
                      <iframe
                        width="100%"
                        height="100%"
                        src={getYoutubeEmbedUrl(selectedItem.videoUrl)}
                        title="Youtube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Specifications & Description */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Technical features */}
              <div className="glass-panel" style={{ padding: '22px' }}>
                <h3 style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px', marginBottom: '15px' }}>
                  Especificaciones del Modelo
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.95rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Área Construida:</span>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{formatM2(selectedItem.builtArea)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Área de Lote Sugerida:</span>
                    <span style={{ fontWeight: 600 }}>{selectedItem.lotArea ? formatM2(selectedItem.lotArea) : 'No especificado'}</span>
                  </div>
                  <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '12px', marginTop: '5px' }}>
                    <span style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>Sistemas Constructivos Soportados:</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {selectedItem.constructionSystems && selectedItem.constructionSystems.length > 0 ? (
                        selectedItem.constructionSystems.map(sys => (
                          <span key={sys} className="badge badge-active" style={{ fontSize: '0.7rem' }}>{sys}</span>
                        ))
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No configurado</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Description Panel */}
              <div className="glass-panel" style={{ padding: '22px' }}>
                <h3 style={{ marginBottom: '10px' }}>Descripción Comercial</h3>
                <p style={{ fontSize: '0.95rem', lineHeight: '1.6', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                  {selectedItem.description || 'Sin descripción detallada.'}
                </p>
              </div>

              {/* Associated logos/partners */}
              {selectedItem.logos && selectedItem.logos.length > 0 && (
                <div className="glass-panel" style={{ padding: '22px' }}>
                  <h3 style={{ marginBottom: '12px', fontSize: '0.95rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Marcas y Aliados del Proyecto
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'center' }}>
                    {selectedItem.logos.map((logo, idx) => (
                      <div 
                        key={idx} 
                        style={{ 
                          height: '50px', 
                          minWidth: '50px', 
                          background: 'white', 
                          borderRadius: '8px', 
                          padding: '6px', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          border: '1px solid var(--border-glass)'
                        }}
                      >
                        <img 
                          src={logo} 
                          style={{ maxHeight: '100%', maxWidth: '70px', objectFit: 'contain' }} 
                          alt="Logo aliado" 
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ==================== DIRECTORY / GRID VIEW ==================== */
        <div className="portfolio-directory animate-fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
            <div>
              <h1>Portafolio de Diseños</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Modelos y opciones de vivienda que ofrecemos para tu terreno.</p>
            </div>
            {userRole !== 'viewer' && (
              <button className="btn btn-primary" onClick={() => { setEditingItem(null); setShowFormModal(true); }}>
                <Plus size={16} /> Agregar Modelo al Portafolio
              </button>
            )}
          </div>

          {/* Filters Toolbar */}
          <div className="glass-panel" style={{ padding: '15px 20px', marginBottom: '25px', display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'center' }}>
            {/* Search Input */}
            <div style={{ position: 'relative', flex: 1, minWidth: '250px' }}>
              <input
                type="text"
                className="form-control"
                style={{ paddingLeft: '35px' }}
                placeholder="Buscar por modelo, código, descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>

            {/* Filter by System */}
            <select
              className="form-control"
              style={{ width: 'auto', minWidth: '200px' }}
              value={filterSystem}
              onChange={(e) => setFilterSystem(e.target.value)}
            >
              <option value="all">Todos los Sistemas Constructivos</option>
              {allSystems.map(sys => (
                <option key={sys} value={sys}>{sys}</option>
              ))}
            </select>

            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
              {filteredItems.length} proyectos encontrados
            </span>
          </div>

          {/* Portfolio Grid */}
          {filteredItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }} className="glass-panel">
              <BookOpen size={48} style={{ color: 'var(--text-muted)', marginBottom: '15px' }} />
              <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '5px' }}>No hay modelos en el portafolio</p>
              <p style={{ fontSize: '0.85rem' }}>Crea tu primer modelo comercial para clientes presionando el botón superior.</p>
            </div>
          ) : (
            <div className="grid-3">
              {filteredItems.map(item => (
                <div 
                  key={item.id} 
                  className="glass-card" 
                  onClick={() => setSelectedItemId(item.id)}
                  style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', height: '100%', padding: '0', overflow: 'hidden' }}
                >
                  {/* Image container */}
                  <div style={{ width: '100%', height: '180px', overflow: 'hidden', position: 'relative', background: '#111827' }}>
                    <img 
                      src={item.mainImage} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'var(--transition-smooth)' }} 
                      className="project-cover-hover"
                      alt={item.title} 
                    />
                    <div style={{ position: 'absolute', top: '12px', left: '12px' }}>
                      <span className="badge badge-planning" style={{ backdropFilter: 'blur(8px)', background: 'rgba(15,23,42,0.6)', color: 'var(--text-primary)' }}>
                        CÓD: {item.code}
                      </span>
                    </div>

                    {userRole !== 'viewer' && (
                      <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', gap: '6px' }} onClick={e => e.stopPropagation()}>
                        <button 
                          className="btn-icon" 
                          style={{ padding: '6px', background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.1)' }}
                          onClick={e => handleEditClick(item, e)}
                        >
                          <Edit2 size={12} />
                        </button>
                        <button 
                          className="btn-icon" 
                          style={{ padding: '6px', background: 'rgba(244,63,94,0.15)', border: '1px solid rgba(244,63,94,0.3)', color: '#fda4af' }}
                          onClick={e => handleDeleteClick(item.id, e)}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Body Info */}
                  <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--primary-cyan)', fontWeight: 700 }}>
                        {formatM2(item.builtArea)} de Construcción
                      </span>
                      {item.lotArea && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Lote {formatM2(item.lotArea)}
                        </span>
                      )}
                    </div>

                    <h3 style={{ fontSize: '1.15rem', marginBottom: '8px', fontWeight: 700, color: 'var(--text-primary)' }}>{item.title}</h3>
                    
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '15px', flex: 1 }}>
                      {item.description}
                    </p>

                    {/* Systems Badges */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', borderTop: '1px solid var(--border-glass)', paddingTop: '12px', marginTop: 'auto' }}>
                      {item.constructionSystems && item.constructionSystems.slice(0, 2).map(sys => (
                        <span key={sys} className="badge badge-active" style={{ fontSize: '0.65rem', padding: '2px 8px' }}>{sys}</span>
                      ))}
                      {item.constructionSystems && item.constructionSystems.length > 2 && (
                        <span className="badge badge-planning" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>+{item.constructionSystems.length - 2} más</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* FORM MODAL */}
      {showFormModal && (
        <PortfolioForm 
          portfolioItem={editingItem}
          onClose={() => { setShowFormModal(false); setEditingItem(null); }}
          onSave={onSave}
        />
      )}
    </div>
  );
}
