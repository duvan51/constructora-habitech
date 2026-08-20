import React, { useState, useRef, useEffect } from 'react';
import { DollarSign, ArrowUpRight, ArrowDownRight, Plus, Filter, Calendar, X, CreditCard, Upload, Camera, Paperclip, Check, Eye, Edit3 } from 'lucide-react';

export default function Ledger({ transactions, projects, onAddTransaction, onUpdateTransaction, userRole }) {
  const [filterType, setFilterType] = useState('all'); // 'all' | 'income' | 'expense'
  const [filterProject, setFilterProject] = useState('all'); // 'all' | projectId
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const [uploadMode, setUploadMode] = useState('file'); // 'file' | 'camera'
  const [fileBase64, setFileBase64] = useState('');
  const [fileName, setFileName] = useState('');
  const [previewReceipt, setPreviewReceipt] = useState(null);

  // Camera states
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState('');

  const [selectedTx, setSelectedTx] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTxData, setEditTxData] = useState(null);

  // Sync edit form with selected transaction
  useEffect(() => {
    if (selectedTx) {
      setEditTxData({
        id: selectedTx.id,
        projectId: selectedTx.projectId || 'general',
        type: selectedTx.type,
        category: selectedTx.category,
        description: selectedTx.description,
        amount: selectedTx.amount,
        date: selectedTx.date,
        receiptBase64: selectedTx.receiptBase64 || ''
      });
      setUploadMode('file');
      setFileBase64(selectedTx.receiptBase64 || '');
      setFileName(selectedTx.receiptBase64 ? 'Comprobante cargado' : '');
      setCapturedImage('');
    } else {
      setEditTxData(null);
    }
  }, [selectedTx]);

  // Turn off camera stream when modal closes
  useEffect(() => {
    if (!showAddModal) {
      stopCamera();
    }
  }, [showAddModal]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stream]);

  const startCamera = async () => {
    setCapturedImage('');
    setFileBase64('');
    setFileName('');
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setCameraActive(true);
    } catch (err) {
      console.error('Error accessing camera:', err);
      alert('No se pudo acceder a la cámara. Revisa los permisos o sube un archivo.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/png');
    setCapturedImage(dataUrl);
    setFileName(`soporte_${new Date().getTime()}.png`);
    stopCamera();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setFileBase64(reader.result);
    };
    reader.readAsDataURL(file);
  };

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
      date: txData.date,
      receiptBase64: uploadMode === 'file' ? fileBase64 : capturedImage
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
    setUploadMode('file');
    setFileBase64('');
    setFileName('');
    setCapturedImage('');
    setShowAddModal(false);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    const amt = parseFloat(editTxData.amount);
    if (!editTxData.description.trim() || amt <= 0) {
      alert('Ingresa detalles y monto válidos.');
      return;
    }

    // Lookup project name
    let projName = 'Administración General';
    if (editTxData.projectId !== 'general') {
      const proj = projects.find(p => p.id === editTxData.projectId);
      if (proj) projName = proj.name;
    }

    const updatedTx = {
      ...selectedTx,
      projectId: editTxData.projectId,
      projectName: projName,
      type: editTxData.type,
      category: editTxData.category,
      description: editTxData.description,
      amount: amt,
      date: editTxData.date,
      receiptBase64: uploadMode === 'file' ? fileBase64 : capturedImage
    };

    onUpdateTransaction(updatedTx, selectedTx);
    
    // Close modal
    setSelectedTx(null);
    setIsEditing(false);
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
                  <th style={{ padding: '12px', color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'center', width: '90px' }}>Ver / Editar</th>
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span>{tx.description}</span>
                          {tx.receiptBase64 && (
                            <button
                              type="button"
                              onClick={() => setPreviewReceipt(tx)}
                              style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid var(--border-glass)',
                                color: 'var(--primary-cyan)',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                              }}
                              title="Ver Comprobante / Foto"
                            >
                              <Paperclip size={10} /> Adjunto
                            </button>
                          )}
                        </div>
                      </td>
                      <td style={{ 
                        padding: '14px 12px', 
                        textAlign: 'right', 
                        fontWeight: 700, 
                        color: isInc ? 'var(--primary-teal)' : 'var(--primary-red)'
                      }}>
                        {isInc ? '+' : '-'} {formatCurrency(tx.amount)}
                      </td>
                      <td style={{ padding: '14px 12px', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTx(tx);
                            setIsEditing(false);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--primary-cyan)',
                            cursor: 'pointer',
                            padding: '4px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'color 0.2s'
                          }}
                          title="Ver detalle / Editar"
                        >
                          <Eye size={18} />
                        </button>
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

                {/* Soporte / Comprobante de Pago o Foto */}
                <div style={{ borderTop: '1px dashed var(--border-glass)', marginTop: '15px', paddingTop: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Adjuntar Soporte / Recibo (Opcional)</label>
                  
                  {/* Tabs */}
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', background: 'rgba(255,255,255,0.02)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                    <button
                      type="button"
                      className="btn"
                      style={{ flex: 1, padding: '6px 12px', fontSize: '0.8rem', background: uploadMode === 'file' ? 'var(--bg-glass)' : 'transparent', border: uploadMode === 'file' ? '1px solid var(--border-glass-active)' : '1px solid transparent', color: uploadMode === 'file' ? 'var(--primary-cyan)' : 'var(--text-secondary)' }}
                      onClick={() => { setUploadMode('file'); stopCamera(); }}
                    >
                      <Upload size={14} /> Archivo / Media
                    </button>
                    <button
                      type="button"
                      className="btn"
                      style={{ flex: 1, padding: '6px 12px', fontSize: '0.8rem', background: uploadMode === 'camera' ? 'var(--bg-glass)' : 'transparent', border: uploadMode === 'camera' ? '1px solid var(--border-glass-active)' : '1px solid transparent', color: uploadMode === 'camera' ? 'var(--primary-cyan)' : 'var(--text-secondary)' }}
                      onClick={() => { setUploadMode('camera'); startCamera(); }}
                    >
                      <Camera size={14} /> Tomar Foto
                    </button>
                  </div>

                  {uploadMode === 'file' ? (
                    <div style={{ border: '1px dashed var(--border-glass)', borderRadius: '8px', padding: '20px 10px', textAlign: 'center' }}>
                      <input
                        type="file"
                        id="tx-file-input"
                        style={{ display: 'none' }}
                        accept="image/*,application/pdf"
                        onChange={handleFileChange}
                      />
                      <label htmlFor="tx-file-input" style={{ cursor: 'pointer', display: 'block' }}>
                        <Upload size={24} style={{ color: 'var(--text-muted)', marginBottom: '8px' }} />
                        <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>
                          Examinar archivos...
                        </p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>PDF o imágenes de recibos</p>
                      </label>
                      {fileName && (
                        <div style={{ marginTop: '10px', fontSize: '0.85rem', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                          <Check size={12} /> {fileName}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                      {cameraActive && (
                        <div style={{ position: 'relative', width: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--primary-cyan)' }}>
                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            style={{ width: '100%', display: 'block', background: '#000' }}
                          />
                          <div style={{ position: 'absolute', bottom: '10px', left: '0', right: '0', display: 'flex', justifyContent: 'center' }}>
                            <button type="button" className="btn btn-primary" onClick={capturePhoto} style={{ borderRadius: '50%', width: '42px', height: '42px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Camera size={18} />
                            </button>
                          </div>
                        </div>
                      )}
                      
                      {capturedImage && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '100%' }}>
                          <div style={{ position: 'relative', width: '100%', maxWidth: '200px', border: '1px solid var(--border-glass)', borderRadius: '8px', overflow: 'hidden' }}>
                            <img src={capturedImage} alt="Captured" style={{ width: '100%', display: 'block' }} />
                            <div style={{ position: 'absolute', top: '5px', right: '5px', background: 'var(--primary-teal)', color: 'white', borderRadius: '50%', padding: '2px' }}>
                              <Check size={12} />
                            </div>
                          </div>
                        </div>
                      )}

                      {!cameraActive && !capturedImage && (
                        <button type="button" className="btn btn-secondary" onClick={startCamera} style={{ fontSize: '0.8rem' }}>
                          <Camera size={14} /> Iniciar Cámara
                        </button>
                      )}
                      {(cameraActive || capturedImage) && (
                        <button type="button" className="btn btn-secondary" onClick={startCamera} style={{ fontSize: '0.8rem' }}>
                          Reintentar Foto
                        </button>
                      )}
                    </div>
                  )}
                  <canvas ref={canvasRef} style={{ display: 'none' }} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => { setShowAddModal(false); stopCamera(); }}>
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

      {/* RECEIPT PREVIEW MODAL */}
      {previewReceipt && (
        <div className="modal-overlay" onClick={() => setPreviewReceipt(null)}>
          <div className="modal-content" style={{ maxWidth: '600px', width: '90%', background: 'var(--bg-secondary)', padding: '20px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Paperclip size={20} style={{ color: 'var(--primary-cyan)' }} />
                Comprobante Adjunto
              </h3>
              <button className="btn-icon" onClick={() => setPreviewReceipt(null)}><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '15px' }}>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '15px', textAlign: 'center' }}>
                <strong>Movimiento:</strong> {previewReceipt.description} ({formatCurrency(previewReceipt.amount)})
              </p>
              {previewReceipt.receiptBase64.startsWith('data:application/pdf') ? (
                <iframe 
                  src={previewReceipt.receiptBase64} 
                  title="Comprobante PDF" 
                  style={{ width: '100%', height: '400px', border: 'none', borderRadius: '8px' }}
                />
              ) : (
                <img 
                  src={previewReceipt.receiptBase64} 
                  alt="Comprobante" 
                  style={{ maxWidth: '100%', maxHeight: '450px', objectFit: 'contain', borderRadius: '8px', border: '1px solid var(--border-glass)' }} 
                />
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setPreviewReceipt(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TRANSACTION DETAIL & EDIT MODAL */}
      {selectedTx && editTxData && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '550px', width: '90%' }}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isEditing ? (
                  <>
                    <Edit3 size={20} style={{ color: 'var(--primary-cyan)' }} />
                    Editar Movimiento de Caja
                  </>
                ) : (
                  <>
                    <Eye size={20} style={{ color: 'var(--primary-cyan)' }} />
                    Detalle de Transacción
                  </>
                )}
              </h3>
              <button className="btn-icon" onClick={() => { setSelectedTx(null); stopCamera(); }}><X size={18} /></button>
            </div>

            {isEditing ? (
              <form onSubmit={handleEditSubmit}>
                <div className="modal-body">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Tipo de Flujo</label>
                      <select
                        className="form-control"
                        value={editTxData.type}
                        onChange={(e) => setEditTxData(prev => ({ ...prev, type: e.target.value }))}
                      >
                        <option value="expense">Salida / Egreso (Gasto)</option>
                        <option value="income">Entrada / Ingreso (Cobro)</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Categoría</label>
                      <select
                        className="form-control"
                        value={editTxData.category}
                        onChange={(e) => setEditTxData(prev => ({ ...prev, category: e.target.value }))}
                      >
                        {editTxData.type === 'expense' ? (
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
                      className="form-control"
                      value={editTxData.projectId}
                      onChange={(e) => setEditTxData(prev => ({ ...prev, projectId: e.target.value }))}
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
                      className="form-control"
                      value={editTxData.description}
                      onChange={(e) => setEditTxData(prev => ({ ...prev, description: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Valor ($)</label>
                      <input
                        type="number"
                        className="form-control"
                        value={editTxData.amount}
                        onChange={(e) => setEditTxData(prev => ({ ...prev, amount: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Fecha</label>
                      <input
                        type="date"
                        className="form-control"
                        value={editTxData.date}
                        onChange={(e) => setEditTxData(prev => ({ ...prev, date: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* Attachment in Edit Mode */}
                  <div style={{ borderTop: '1px dashed var(--border-glass)', marginTop: '15px', paddingTop: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Modificar Soporte / Recibo (Opcional)</label>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', background: 'rgba(255,255,255,0.02)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                      <button
                        type="button"
                        className="btn"
                        style={{ flex: 1, padding: '6px 12px', fontSize: '0.8rem', background: uploadMode === 'file' ? 'var(--bg-glass)' : 'transparent', border: uploadMode === 'file' ? '1px solid var(--border-glass-active)' : '1px solid transparent', color: uploadMode === 'file' ? 'var(--primary-cyan)' : 'var(--text-secondary)' }}
                        onClick={() => { setUploadMode('file'); stopCamera(); }}
                      >
                        <Upload size={14} /> Archivo / Media
                      </button>
                      <button
                        type="button"
                        className="btn"
                        style={{ flex: 1, padding: '6px 12px', fontSize: '0.8rem', background: uploadMode === 'camera' ? 'var(--bg-glass)' : 'transparent', border: uploadMode === 'camera' ? '1px solid var(--border-glass-active)' : '1px solid transparent', color: uploadMode === 'camera' ? 'var(--primary-cyan)' : 'var(--text-secondary)' }}
                        onClick={() => { setUploadMode('camera'); startCamera(); }}
                      >
                        <Camera size={14} /> Tomar Foto
                      </button>
                    </div>

                    {uploadMode === 'file' ? (
                      <div style={{ border: '1px dashed var(--border-glass)', borderRadius: '8px', padding: '20px 10px', textAlign: 'center' }}>
                        <input
                          type="file"
                          id="edit-tx-file-input"
                          style={{ display: 'none' }}
                          accept="image/*,application/pdf"
                          onChange={handleFileChange}
                        />
                        <label htmlFor="edit-tx-file-input" style={{ cursor: 'pointer', display: 'block' }}>
                          <Upload size={24} style={{ color: 'var(--text-muted)', marginBottom: '8px' }} />
                          <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>
                            Examinar archivos...
                          </p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>PDF o imágenes de recibos</p>
                        </label>
                        {fileName && (
                          <div style={{ marginTop: '10px', fontSize: '0.85rem', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                            <Check size={12} /> {fileName}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                        {cameraActive && (
                          <div style={{ position: 'relative', width: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--primary-cyan)' }}>
                            <video
                              ref={videoRef}
                              autoPlay
                              playsInline
                              style={{ width: '100%', display: 'block', background: '#000' }}
                            />
                            <div style={{ position: 'absolute', bottom: '10px', left: '0', right: '0', display: 'flex', justifyContent: 'center' }}>
                              <button type="button" className="btn btn-primary" onClick={capturePhoto} style={{ borderRadius: '50%', width: '42px', height: '42px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Camera size={18} />
                              </button>
                            </div>
                          </div>
                        )}
                        
                        {capturedImage && (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '100%' }}>
                            <div style={{ position: 'relative', width: '100%', maxWidth: '200px', border: '1px solid var(--border-glass)', borderRadius: '8px', overflow: 'hidden' }}>
                              <img src={capturedImage} alt="Captured" style={{ width: '100%', display: 'block' }} />
                              <div style={{ position: 'absolute', top: '5px', right: '5px', background: 'var(--primary-teal)', color: 'white', borderRadius: '50%', padding: '2px' }}>
                                <Check size={12} />
                              </div>
                            </div>
                          </div>
                        )}

                        {!cameraActive && !capturedImage && (
                          <button type="button" className="btn btn-secondary" onClick={startCamera} style={{ fontSize: '0.8rem' }}>
                            <Camera size={14} /> Iniciar Cámara
                          </button>
                        )}
                        {(cameraActive || capturedImage) && (
                          <button type="button" className="btn btn-secondary" onClick={startCamera} style={{ fontSize: '0.8rem' }}>
                            Reintentar Foto
                          </button>
                        )}
                      </div>
                    )}
                    <canvas ref={canvasRef} style={{ display: 'none' }} />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => { setIsEditing(false); stopCamera(); }}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Guardar Cambios
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px 10px', fontSize: '0.9rem' }}>
                      <div>
                        <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '3px' }}>Fecha</span>
                        <strong style={{ color: 'var(--text-primary)' }}>{selectedTx.date}</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '3px' }}>Tipo</span>
                        {selectedTx.type === 'income' ? (
                          <span className="badge badge-completed" style={{ fontSize: '0.7rem' }}>Entrada / Ingreso</span>
                        ) : (
                          <span className="badge badge-danger" style={{ fontSize: '0.7rem', background: 'rgba(244,63,94,0.15)', color: '#fda4af', border: '1px solid rgba(244,63,94,0.3)' }}>Salida / Egreso</span>
                        )}
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '3px' }}>Proyecto / Obra</span>
                        <strong style={{ color: 'var(--text-primary)' }}>{selectedTx.projectName}</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '3px' }}>Categoría</span>
                        <strong style={{ color: 'var(--text-primary)' }}>{getCategoryLabel(selectedTx.category)}</strong>
                      </div>
                    </div>
                  </div>

                  <div>
                    <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '5px' }}>Detalles / Concepto</span>
                    <div style={{ fontSize: '1rem', color: 'var(--text-primary)', padding: '12px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', borderRadius: '6px', lineHeight: '1.4' }}>
                      {selectedTx.description}
                    </div>
                  </div>

                  <div>
                    <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '5px' }}>Valor del Movimiento</span>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: selectedTx.type === 'income' ? 'var(--primary-teal)' : 'var(--primary-red)' }}>
                      {selectedTx.type === 'income' ? '+' : '-'} {formatCurrency(selectedTx.amount)}
                    </div>
                  </div>

                  {selectedTx.receiptBase64 && (
                    <div style={{ borderTop: '1px dashed var(--border-glass)', paddingTop: '15px' }}>
                      <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '8px' }}>Comprobante Adjunto</span>
                      <div style={{ display: 'flex', justifyContent: 'center', background: '#000', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                        {selectedTx.receiptBase64.startsWith('data:application/pdf') ? (
                          <iframe 
                            src={selectedTx.receiptBase64} 
                            title="Comprobante PDF" 
                            style={{ width: '100%', height: '300px', border: 'none' }}
                          />
                        ) : (
                          <img 
                            src={selectedTx.receiptBase64} 
                            alt="Comprobante" 
                            style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain' }} 
                          />
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setSelectedTx(null)}>
                    Cerrar
                  </button>
                  {userRole !== 'viewer' && (
                    <button type="button" className="btn btn-primary" onClick={() => setIsEditing(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Edit3 size={14} /> Editar
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
