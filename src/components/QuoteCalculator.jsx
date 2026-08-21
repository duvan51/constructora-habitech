import React, { useState, useEffect } from 'react';
import { Calculator, Save, Edit, Trash2, Plus, FileText, Printer, Undo, Image, X } from 'lucide-react';

const DEFAULT_PRICES = {
  obra_blanca_tradicional: 1500000,
  obra_gris_tradicional: 1400000,
  obra_negra_tradicional: 1000000,
  obra_blanca_prefabricado: 1400000,
  obra_gris_prefabricado: 1250000,
  obra_blanca_liviano: 1450000,
  corredores_exteriores: 600000,
  placa_niveles: 280000,
  escalera: 3000000
};

const INITIAL_CONCEPTS = [
  { id: 'c1', name: 'Obra Gris / Estructural (según acabado seleccionado)', amount: 15000000, included: true },
  { id: 'c2', name: 'Pintura y Estucado de Interiores y Exteriores', amount: 3500000, included: true },
  { id: 'c3', name: 'Instalaciones Hidráulicas y Griferías de Baño/Cocina', amount: 4500000, included: true },
  { id: 'c4', name: 'Instalaciones Eléctricas, Cableado y Luminarias', amount: 4800000, included: true },
  { id: 'c5', name: 'Sistema de Aguas Negras, Desagües y Conexiones', amount: 3000000, included: true },
  { id: 'c6', name: 'Acabados Especiales (Enchapados, Carpintería y Pisos)', amount: 6500000, included: true }
];

export default function QuoteCalculator() {
  // Base prices (stored in localStorage)
  const [prices, setPrices] = useState(() => {
    const saved = localStorage.getItem('habitech_quote_prices');
    return saved ? JSON.parse(saved) : DEFAULT_PRICES;
  });

  const [isEditingPrices, setIsEditingPrices] = useState(false);
  const [tempPrices, setTempPrices] = useState({ ...prices });

  // Mode Selection: 'm2' (Area-based) or 'concepts' (Itemized project)
  const [quoteMode, setQuoteMode] = useState('m2');

  // Client Info
  const [clientData, setClientData] = useState({
    name: '',
    phone: '',
    project: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Blueprint Plan Image
  const [blueprintImg, setBlueprintImg] = useState(null);

  // M2 Mode States
  const [finishType, setFinishType] = useState('obra_blanca_tradicional');
  const [houseAreaMode, setHouseAreaMode] = useState('dims'); 
  const [houseDims, setHouseDims] = useState({ width: '', length: '', area: '' });
  
  const [includeSlab, setIncludeSlab] = useState(false);
  const [slabAreaMode, setSlabAreaMode] = useState('dims');
  const [slabDims, setSlabDims] = useState({ width: '', length: '', area: '' });
  
  const [includeCorridors, setIncludeCorridors] = useState(false);
  const [corridorAreaMode, setCorridorAreaMode] = useState('dims');
  const [corridorDims, setCorridorDims] = useState({ width: '', length: '', area: '' });
  
  const [includeStairs, setIncludeStairs] = useState(false);
  const [stairsQty, setStairsQty] = useState('1');

  // Concepts Mode States
  const [concepts, setConcepts] = useState(() => {
    const saved = localStorage.getItem('habitech_quote_concepts');
    return saved ? JSON.parse(saved) : INITIAL_CONCEPTS;
  });

  // Additional settings
  const [discountPercent, setDiscountPercent] = useState('0');
  const [adjustmentAmount, setAdjustmentAmount] = useState('0');
  const [notes, setNotes] = useState('Garantía de construcción de 5 años estructural. Validez de esta cotización de 30 días.');

  // Modal open state for printing
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Auto-calculate areas when dimensions change
  useEffect(() => {
    if (houseAreaMode === 'dims') {
      const w = parseFloat(houseDims.width) || 0;
      const l = parseFloat(houseDims.length) || 0;
      setHouseDims(prev => ({ ...prev, area: (w * l).toFixed(2) }));
    }
  }, [houseDims.width, houseDims.length, houseAreaMode]);

  useEffect(() => {
    if (slabAreaMode === 'dims') {
      const w = parseFloat(slabDims.width) || 0;
      const l = parseFloat(slabDims.length) || 0;
      setSlabDims(prev => ({ ...prev, area: (w * l).toFixed(2) }));
    }
  }, [slabDims.width, slabDims.length, slabAreaMode]);

  useEffect(() => {
    if (corridorAreaMode === 'dims') {
      const w = parseFloat(corridorDims.width) || 0;
      const l = parseFloat(corridorDims.length) || 0;
      setCorridorDims(prev => ({ ...prev, area: (w * l).toFixed(2) }));
    }
  }, [corridorDims.width, corridorDims.length, corridorAreaMode]);

  // Keep first concept name aligned with chosen finish type on concept mode
  useEffect(() => {
    if (quoteMode === 'concepts') {
      setConcepts(prev => {
        const updated = [...prev];
        if (updated[0]) {
          updated[0].name = `Obra Estructural / Acabado: ${getFinishTypeLabel(finishType)}`;
        }
        return updated;
      });
    }
  }, [finishType, quoteMode]);

  // Save concepts state changes
  useEffect(() => {
    localStorage.setItem('habitech_quote_concepts', JSON.stringify(concepts));
  }, [concepts]);

  // File Upload base64 helper
  const handleBlueprintUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setBlueprintImg(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeBlueprint = () => {
    setBlueprintImg(null);
  };

  // Currency Formatter
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(val);
  };

  const getFinishTypeLabel = (key) => {
    switch (key) {
      case 'obra_blanca_tradicional': return 'Obra Blanca Tradicional';
      case 'obra_gris_tradicional': return 'Obra Gris Tradicional';
      case 'obra_negra_tradicional': return 'Obra Negra Tradicional';
      case 'obra_blanca_prefabricado': return 'Obra Blanca Prefabricado';
      case 'obra_gris_prefabricado': return 'Obra Gris Prefabricado';
      case 'obra_blanca_liviano': return 'Obra Blanca Liviano';
      default: return key;
    }
  };

  // Base price edits
  const handleEditPriceChange = (key, value) => {
    setTempPrices(prev => ({ ...prev, [key]: parseFloat(value) || 0 }));
  };

  const handleSavePrices = () => {
    setPrices(tempPrices);
    localStorage.setItem('habitech_quote_prices', JSON.stringify(tempPrices));
    setIsEditingPrices(false);
  };

  const handleResetPrices = async () => {
    if (await window.confirmDialog('¿Deseas restaurar los precios predeterminados de fábrica?')) {
      setPrices(DEFAULT_PRICES);
      setTempPrices(DEFAULT_PRICES);
      localStorage.setItem('habitech_quote_prices', JSON.stringify(DEFAULT_PRICES));
      setIsEditingPrices(false);
    }
  };

  // Concepts Mode Actions
  const handleConceptChange = (id, field, value) => {
    setConcepts(prev => prev.map(c => {
      if (c.id === id) {
        return {
          ...c,
          [field]: field === 'amount' ? (parseFloat(value) || 0) : value
        };
      }
      return c;
    }));
  };

  const handleConceptToggle = (id) => {
    setConcepts(prev => prev.map(c => {
      if (c.id === id) {
        return { ...c, included: !c.included };
      }
      return c;
    }));
  };

  const handleAddConcept = () => {
    const newId = 'c_' + Date.now();
    setConcepts(prev => [
      ...prev,
      { id: newId, name: 'Nuevo Concepto Personalizado', amount: 1000000, included: true }
    ]);
  };

  const handleDeleteConcept = (id) => {
    setConcepts(prev => prev.filter(c => c.id !== id));
  };

  // Math Calculations (Pro-rated adjustment)
  const adjAmt = parseFloat(adjustmentAmount) || 0;
  
  let baseHouseSubtotal = 0;
  let baseSlabSubtotal = 0;
  let baseCorridorSubtotal = 0;
  let baseStairsSubtotal = 0;
  
  let rawSubtotal = 0;
  
  const houseArea = parseFloat(houseDims.area) || 0;
  const houseRate = prices[finishType] || 0;
  baseHouseSubtotal = houseArea * houseRate;

  const slabArea = includeSlab ? (parseFloat(slabDims.area) || 0) : 0;
  const slabRate = prices.placa_niveles || 0;
  baseSlabSubtotal = slabArea * slabRate;

  const corridorArea = includeCorridors ? (parseFloat(corridorDims.area) || 0) : 0;
  const corridorRate = prices.corredores_exteriores || 0;
  baseCorridorSubtotal = corridorArea * corridorRate;

  const stairsCount = includeStairs ? (parseInt(stairsQty) || 0) : 0;
  const stairsRate = prices.escalera || 0;
  baseStairsSubtotal = stairsCount * stairsRate;

  if (quoteMode === 'm2') {
    rawSubtotal = baseHouseSubtotal + baseSlabSubtotal + baseCorridorSubtotal + baseStairsSubtotal;
  } else {
    rawSubtotal = concepts
      .filter(c => c.included)
      .reduce((sum, c) => sum + c.amount, 0);
  }

  // Calculate pro-rating factor
  const factor = rawSubtotal > 0 ? (rawSubtotal + adjAmt) / rawSubtotal : 1;

  // Prorated items for rendering (Rounded to nearest Colombian Peso to avoid cents)
  const printedHouseRate = Math.round(houseRate * factor);
  const printedHouseSubtotal = Math.round(baseHouseSubtotal * factor);
  
  const printedSlabRate = Math.round(slabRate * factor);
  const printedSlabSubtotal = Math.round(baseSlabSubtotal * factor);
  
  const printedCorridorRate = Math.round(corridorRate * factor);
  const printedCorridorSubtotal = Math.round(baseCorridorSubtotal * factor);
  
  const printedStairsRate = Math.round(stairsRate * factor);
  const printedStairsSubtotal = Math.round(baseStairsSubtotal * factor);

  // Sum of prorated lines
  const subtotalBeforeDiscount = quoteMode === 'm2'
    ? (printedHouseSubtotal + printedSlabSubtotal + printedCorridorSubtotal + printedStairsSubtotal)
    : concepts.filter(c => c.included).reduce((sum, c) => sum + Math.round(c.amount * factor), 0);

  const discountVal = (subtotalBeforeDiscount * (parseFloat(discountPercent) || 0)) / 100;
  const totalQuote = subtotalBeforeDiscount - discountVal;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="quote-calculator-view animate-fade-in">
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <div>
          <h1>Cotizador de Construcción</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>Genera cotizaciones por metros cuadrados (M²) o desgloses detallados por capítulos de obra.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="btn btn-secondary" 
            onClick={() => {
              setTempPrices({ ...prices });
              setIsEditingPrices(!isEditingPrices);
            }}
          >
            <Edit size={16} /> {isEditingPrices ? 'Cerrar Precios' : 'Configurar Precios M2'}
          </button>
          <button className="btn btn-primary" onClick={() => setShowPrintModal(true)} disabled={subtotalBeforeDiscount === 0}>
            <Printer size={16} /> Imprimir Cotización
          </button>
        </div>
      </div>

      {/* PRICE CONFIGURATION MODAL / CARD */}
      {isEditingPrices && (
        <div className="glass-panel no-print animate-fade-in" style={{ padding: '20px', marginBottom: '20px', background: 'rgba(255, 109, 0, 0.04)', border: '1px solid rgba(255, 109, 0, 0.2)' }}>
          <h3 style={{ color: 'var(--primary-orange)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
            <Calculator size={18} />
            Editar Precios de Referencia M² (Persistentes)
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '15px', marginBottom: '15px' }}>
            {Object.keys(tempPrices).map((key) => (
              <div className="form-group" key={key}>
                <label style={{ fontSize: '0.75rem', textTransform: 'capitalize' }}>
                  {key.replace(/_/g, ' ')}
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>$</span>
                  <input
                    type="number"
                    className="form-control"
                    value={tempPrices[key]}
                    onChange={(e) => handleEditPriceChange(key, e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={handleResetPrices} style={{ color: 'var(--primary-red)' }}>
              <Undo size={14} /> Restaurar de Fábrica
            </button>
            <button className="btn btn-primary" onClick={handleSavePrices} style={{ background: 'var(--primary-orange)' }}>
              <Save size={14} /> Guardar Nuevos Precios
            </button>
          </div>
        </div>
      )}

      {/* WORKSPACE LAYOUT */}
      <div className="grid-2 no-print" style={{ alignItems: 'flex-start', gap: '20px' }}>
        
        {/* Left Side: Inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Main Config Mode */}
          <div className="glass-panel" style={{ padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Tipo de Cotización:</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                type="button" 
                className={`btn ${quoteMode === 'm2' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                onClick={() => setQuoteMode('m2')}
              >
                Por Metros (M²)
              </button>
              <button 
                type="button" 
                className={`btn ${quoteMode === 'concepts' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                onClick={() => setQuoteMode('concepts')}
              >
                Por Capítulos / Obra
              </button>
            </div>
          </div>

          {/* Client Information */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ marginBottom: '15px', fontSize: '1rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '8px' }}>
              Datos del Cliente
            </h3>
            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label>Nombre del Cliente</label>
              <input
                type="text"
                className="form-control"
                placeholder="Ej. Juan Pérez"
                value={clientData.name}
                onChange={(e) => setClientData({ ...clientData, name: e.target.value })}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Teléfono</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ej. 3124567890"
                  value={clientData.phone}
                  onChange={(e) => setClientData({ ...clientData, phone: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Proyecto / Ubicación</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ej. Lote 4 Nohora"
                  value={clientData.project}
                  onChange={(e) => setClientData({ ...clientData, project: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Plan/Blueprint Upload */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ marginBottom: '12px', fontSize: '1rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Image size={18} style={{ color: 'var(--primary-cyan)' }} />
              Plano de la Obra (Anexo)
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '15px' }}>
              Sube una imagen del plano arquitectónico para anexarlo automáticamente en la cotización de impresión.
            </p>
            
            {blueprintImg ? (
              <div style={{ position: 'relative', border: '1px solid var(--border-glass)', borderRadius: '8px', overflow: 'hidden', height: '140px', background: 'rgba(0,0,0,0.2)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <img src={blueprintImg} alt="Plano Subido" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                <button 
                  type="button" 
                  onClick={removeBlueprint}
                  style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(239, 68, 68, 0.8)', border: 'none', borderRadius: '50%', color: 'white', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <input 
                  type="file" 
                  accept="image/*" 
                  id="blueprint-upload-input" 
                  style={{ display: 'none' }} 
                  onChange={handleBlueprintUpload}
                />
                <label 
                  htmlFor="blueprint-upload-input" 
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100px', border: '1.5px dashed var(--border-glass)', borderRadius: '8px', cursor: 'pointer', background: 'rgba(255,255,255,0.01)', transition: 'var(--transition-smooth)' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.01)'}
                >
                  <Plus size={24} style={{ color: 'var(--primary-cyan)', marginBottom: '6px' }} />
                  <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Cargar Imagen del Plano</span>
                </label>
              </div>
            )}
          </div>

          {/* MODE A: M2 Form Fields */}
          {quoteMode === 'm2' && (
            <>
              {/* House calculations */}
              <div className="glass-panel" style={{ padding: '20px' }}>
                <h3 style={{ marginBottom: '15px', fontSize: '1rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Área Principal (Casa)</span>
                  <span className="badge" style={{ background: 'var(--primary-cyan)', color: '#0b0f19', fontSize: '0.7rem' }}>Requerido</span>
                </h3>

                <div className="form-row" style={{ marginBottom: '15px' }}>
                  <div className="form-group">
                    <label>Clase de Acabado (M²)</label>
                    <select
                      className="form-control"
                      value={finishType}
                      onChange={(e) => setFinishType(e.target.value)}
                    >
                      <option value="obra_blanca_tradicional">Obra Blanca Tradicional ({formatCurrency(prices.obra_blanca_tradicional)})</option>
                      <option value="obra_gris_tradicional">Obra Gris Tradicional ({formatCurrency(prices.obra_gris_tradicional)})</option>
                      <option value="obra_negra_tradicional">Obra Negra Tradicional ({formatCurrency(prices.obra_negra_tradicional)})</option>
                      <option value="obra_blanca_prefabricado">Obra Blanca Prefabricado ({formatCurrency(prices.obra_blanca_prefabricado)})</option>
                      <option value="obra_gris_prefabricado">Obra Gris Prefabricado ({formatCurrency(prices.obra_gris_prefabricado)})</option>
                      <option value="obra_blanca_liviano">Obra Blanca Liviano ({formatCurrency(prices.obra_blanca_liviano)})</option>
                    </select>
                  </div>
                  
                  <div className="form-group" style={{ maxWidth: '160px' }}>
                    <label>Método de Entrada</label>
                    <select
                      className="form-control"
                      value={houseAreaMode}
                      onChange={(e) => setHouseAreaMode(e.target.value)}
                    >
                      <option value="dims">Por Medidas</option>
                      <option value="direct">M² Directo</option>
                    </select>
                  </div>
                </div>

                {houseAreaMode === 'dims' ? (
                  <div className="form-row">
                    <div className="form-group">
                      <label>Ancho (Metros)</label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="Ej. 10"
                        value={houseDims.width}
                        onChange={(e) => setHouseDims({ ...houseDims, width: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Largo (Metros)</label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="Ej. 5"
                        value={houseDims.length}
                        onChange={(e) => setHouseDims({ ...houseDims, length: e.target.value })}
                      />
                    </div>
                    <div className="form-group" style={{ maxWidth: '100px' }}>
                      <label>Área Total</label>
                      <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)', borderRadius: '8px', fontSize: '0.95rem', fontWeight: 700, textAlign: 'center' }}>
                        {houseDims.area || 0} m²
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="form-group">
                    <label>Ingresar Área Total (M²)</label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="Ej. 75"
                      value={houseDims.area}
                      onChange={(e) => setHouseDims({ ...houseDims, area: e.target.value })}
                    />
                  </div>
                )}
              </div>

              {/* Adicionales */}
              <div className="glass-panel" style={{ padding: '20px' }}>
                <h3 style={{ marginBottom: '15px', fontSize: '1rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '8px' }}>
                  Adicionales de Obra (Opcional)
                </h3>

                {/* Placa de niveles */}
                <div style={{ marginBottom: '15px', borderBottom: '1px dashed var(--border-glass)', paddingBottom: '15px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={includeSlab}
                      onChange={(e) => setIncludeSlab(e.target.checked)}
                    />
                    Incluir Placa de Niveles / Entrepiso ({formatCurrency(prices.placa_niveles)}/m²)
                  </label>
                  
                  {includeSlab && (
                    <div style={{ marginTop: '10px', display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '0.75rem' }}>Método de Entrada</label>
                        <select className="form-control" value={slabAreaMode} onChange={(e) => setSlabAreaMode(e.target.value)}>
                          <option value="dims">Por Medidas</option>
                          <option value="direct">M² Directo</option>
                        </select>
                      </div>
                      {slabAreaMode === 'dims' ? (
                        <>
                          <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '0.75rem' }}>Ancho (m)</label>
                            <input type="number" className="form-control" value={slabDims.width} onChange={(e) => setSlabDims({ ...slabDims, width: e.target.value })} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '0.75rem' }}>Largo (m)</label>
                            <input type="number" className="form-control" value={slabDims.length} onChange={(e) => setSlabDims({ ...slabDims, length: e.target.value })} />
                          </div>
                        </>
                      ) : (
                        <div style={{ flex: 2 }}>
                          <label style={{ fontSize: '0.75rem' }}>Área (m²)</label>
                          <input type="number" className="form-control" value={slabDims.area} onChange={(e) => setSlabDims({ ...slabDims, area: e.target.value })} />
                        </div>
                      )}
                      <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)', borderRadius: '8px', fontWeight: 700 }}>
                        {slabDims.area || 0} m²
                      </div>
                    </div>
                  )}
                </div>

                {/* Corredores Exteriores */}
                <div style={{ marginBottom: '15px', borderBottom: '1px dashed var(--border-glass)', paddingBottom: '15px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={includeCorridors}
                      onChange={(e) => setIncludeCorridors(e.target.checked)}
                    />
                    Incluir Corredores Exteriores ({formatCurrency(prices.corredores_exteriores)}/m²)
                  </label>
                  
                  {includeCorridors && (
                    <div style={{ marginTop: '10px', display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '0.75rem' }}>Método de Entrada</label>
                        <select className="form-control" value={corridorAreaMode} onChange={(e) => setCorridorAreaMode(e.target.value)}>
                          <option value="dims">Por Medidas</option>
                          <option value="direct">M² Directo</option>
                        </select>
                      </div>
                      {corridorAreaMode === 'dims' ? (
                        <>
                          <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '0.75rem' }}>Ancho (m)</label>
                            <input type="number" className="form-control" value={corridorDims.width} onChange={(e) => setCorridorDims({ ...corridorDims, width: e.target.value })} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '0.75rem' }}>Largo (m)</label>
                            <input type="number" className="form-control" value={corridorDims.length} onChange={(e) => setCorridorDims({ ...corridorDims, length: e.target.value })} />
                          </div>
                        </>
                      ) : (
                        <div style={{ flex: 2 }}>
                          <label style={{ fontSize: '0.75rem' }}>Área (m²)</label>
                          <input type="number" className="form-control" value={corridorDims.area} onChange={(e) => setCorridorDims({ ...corridorDims, area: e.target.value })} />
                        </div>
                      )}
                      <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)', borderRadius: '8px', fontWeight: 700 }}>
                        {corridorDims.area || 0} m²
                      </div>
                    </div>
                  )}
                </div>

                {/* Escaleras */}
                <div style={{ marginBottom: '5px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, cursor: 'pointer', marginBottom: '10px' }}>
                    <input
                      type="checkbox"
                      checked={includeStairs}
                      onChange={(e) => setIncludeStairs(e.target.checked)}
                    />
                    Incluir Escaleras de Niveles ({formatCurrency(prices.escalera)}/unidad)
                  </label>

                  {includeStairs && (
                    <div className="form-group" style={{ maxWidth: '140px' }}>
                      <label style={{ fontSize: '0.75rem' }}>Cantidad Escaleras</label>
                      <input
                        type="number"
                        className="form-control"
                        min="1"
                        value={stairsQty}
                        onChange={(e) => setStairsQty(e.target.value)}
                      />
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* MODE B: Itemized Project Concepts Form */}
          {quoteMode === 'concepts' && (
            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '8px' }}>
                <h3 style={{ fontSize: '1rem' }}>Desglose por Capítulos / Actividades</h3>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                  onClick={handleAddConcept}
                >
                  <Plus size={12} /> Agregar Renglón
                </button>
              </div>

              {/* Finishing Select (Obra Blanca / Gris / Negra) for First Concept */}
              <div className="form-group" style={{ marginBottom: '15px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', padding: '12px', borderRadius: '8px' }}>
                <label>1. Tipo Acabado Estructural (Casa)</label>
                <select
                  className="form-control"
                  value={finishType}
                  onChange={(e) => setFinishType(e.target.value)}
                >
                  <option value="obra_blanca_tradicional">Obra Blanca Tradicional</option>
                  <option value="obra_gris_tradicional">Obra Gris Tradicional</option>
                  <option value="obra_negra_tradicional">Obra Negra Tradicional</option>
                  <option value="obra_blanca_prefabricado">Obra Blanca Prefabricado</option>
                  <option value="obra_gris_prefabricado">Obra Gris Prefabricado</option>
                  <option value="obra_blanca_liviano">Obra Blanca Liviano</option>
                </select>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>Este acabado actualizará automáticamente la descripción de la primera actividad.</p>
              </div>

              {/* Dynamic Concepts Checklist */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {concepts.map((concept, idx) => (
                  <div key={concept.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', background: concept.included ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.005)', border: '1px solid var(--border-glass)', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'space-between' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={concept.included}
                          onChange={() => handleConceptToggle(concept.id)}
                        />
                        Actividad #{idx + 1} {concept.included ? '(Incluida)' : '(Omitida)'}
                      </label>
                      {idx > 5 && (
                        <button 
                          type="button" 
                          style={{ background: 'none', border: 'none', color: 'var(--primary-red)', cursor: 'pointer', padding: '0' }}
                          onClick={() => handleDeleteConcept(concept.id)}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                    {concept.included && (
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <input
                          type="text"
                          className="form-control"
                          style={{ flex: 2, fontSize: '0.85rem' }}
                          value={concept.name}
                          onChange={(e) => handleConceptChange(concept.id, 'name', e.target.value)}
                          placeholder="Descripción del concepto"
                          required
                        />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1, minWidth: '100px' }}>
                          <span style={{ color: 'var(--text-muted)' }}>$</span>
                          <input
                            type="number"
                            className="form-control"
                            style={{ fontSize: '0.85rem' }}
                            value={concept.amount}
                            onChange={(e) => handleConceptChange(concept.id, 'amount', e.target.value)}
                            required
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Descuentos y notas */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ marginBottom: '15px', fontSize: '1rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '8px' }}>
              Descuentos, Margen y Notas
            </h3>
            
            <div className="form-row" style={{ marginBottom: '12px' }}>
              <div className="form-group">
                <label>Ajuste / Margen Global ($)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>$</span>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Ej. 10000000"
                    value={adjustmentAmount}
                    onChange={(e) => setAdjustmentAmount(e.target.value)}
                  />
                </div>
                <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '4px' }}>Este valor incrementará el total de la cotización y se distribuirá (prorrateará) proporcionalmente en los precios mostrados al cliente.</p>
              </div>

              <div className="form-group" style={{ maxWidth: '120px' }}>
                <label>Descuento (%)</label>
                <input
                  type="number"
                  className="form-control"
                  min="0"
                  max="100"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Notas de la Cotización</label>
              <textarea
                className="form-control"
                rows="2"
                style={{ resize: 'none' }}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

        </div>

        {/* Right Side: Live preview (NOT printable class, strictly screen container) */}
        <div style={{ position: 'sticky', top: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Previsualización del Documento (Vista de Pantalla)</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--primary-orange)' }}>* Margen Prorrateado Aplicado</span>
          </div>

          {/* Document Sheet Layout Container */}
          <div style={{ 
            background: 'white', 
            color: '#111827', 
            borderRadius: '12px', 
            boxShadow: '0 15px 40px rgba(0,0,0,0.6)', 
            padding: '30px', 
            fontSize: '0.85rem', 
            fontFamily: 'system-ui, sans-serif',
            minHeight: '680px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            
            {/* Watermark Logo */}
            <div style={{
              position: 'absolute',
              top: '45%',
              left: '50%',
              transform: 'translate(-50%, -50%) rotate(-15deg)',
              opacity: 0.04,
              pointerEvents: 'none',
              zIndex: 0,
              width: '320px',
              height: '320px',
              backgroundImage: 'url(/logo.png)',
              backgroundSize: 'contain',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }} />

            {/* Content Wrapper (guarantees layering on top of watermark) */}
            <div style={{ position: 'relative', zIndex: 1 }}>
              
              {/* Sheet Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #111827', paddingBottom: '15px', marginBottom: '20px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                    <img src="/logo.png" alt="Logo HABITECH" style={{ height: '55px', objectFit: 'contain' }} />
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#4b5563', lineHeight: '1.3' }}>
                    Grupo empresarial habitech sas<br />
                    NIT: 902067080-1<br />
                    Dirección: km 4 via villavicencio acacias, lote 1 barrio la nohora<br />
                    Celular: 3124147911<br />
                    Villavicencio - Meta
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.5px' }}>PRESUPUESTO DE OBRA</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#FF6D00', marginTop: '4px' }}>
                    COT-{Date.now().toString().substring(5, 11)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#4b5563', marginTop: '8px' }}>
                    <strong>Fecha:</strong> {clientData.date}<br />
                    <strong>Validez:</strong> 30 días
                  </div>
                </div>
              </div>

              {/* Client Info block */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '10px 12px', marginBottom: '20px' }}>
                <div>
                  <div style={{ fontSize: '0.65rem', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>COTIZADO A</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1f2937' }}>{clientData.name || '(Sin Nombre)'}</div>
                  <div style={{ fontSize: '0.8rem', color: '#4b5563' }}>
                    <strong>Celular:</strong> {clientData.phone || '(No registrado)'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.65rem', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>DETALLES DEL PROYECTO</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1f2937' }}>{clientData.project || '(Sin Destino)'}</div>
                  <div style={{ fontSize: '0.8rem', color: '#4b5563' }}>
                    <strong>Ubicación:</strong> Colombia
                  </div>
                </div>
              </div>

              {/* Items Breakdown Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '0.8rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f3f4f6', borderBottom: '2px solid #d1d5db', color: '#111827' }}>
                    <th style={{ padding: '8px 6px', fontWeight: 700 }}>Descripción de la Actividad / Item</th>
                    {quoteMode === 'm2' && <th style={{ padding: '8px 6px', fontWeight: 700, textAlign: 'center' }}>Medidas / Cantidad</th>}
                    {quoteMode === 'm2' && <th style={{ padding: '8px 6px', fontWeight: 700, textAlign: 'right' }}>Valor Unitario</th>}
                    <th style={{ padding: '8px 6px', fontWeight: 700, textAlign: 'right' }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Mode A: Render M2 rows */}
                  {quoteMode === 'm2' && (
                    <>
                      {/* House Row */}
                      {houseArea > 0 && (
                        <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                          <td style={{ padding: '10px 6px' }}>
                            <div style={{ fontWeight: 700, color: '#1f2937' }}>Área de Vivienda ({getFinishTypeLabel(finishType)})</div>
                            <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>Construcción principal en metros cuadrados</div>
                          </td>
                          <td style={{ padding: '10px 6px', textAlign: 'center' }}>
                            {houseDims.width && houseDims.length ? `${houseDims.width}m x ${houseDims.length}m` : ''} ({houseDims.area} m²)
                          </td>
                          <td style={{ padding: '10px 6px', textAlign: 'right' }}>{formatCurrency(printedHouseRate)}</td>
                          <td style={{ padding: '10px 6px', textAlign: 'right', fontWeight: 700 }}>{formatCurrency(printedHouseSubtotal)}</td>
                        </tr>
                      )}

                      {/* Slab Row */}
                      {includeSlab && slabArea > 0 && (
                        <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                          <td style={{ padding: '10px 6px' }}>
                            <div style={{ fontWeight: 700, color: '#1f2937' }}>Placa de Niveles / Entrepiso</div>
                            <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>Cimentación aérea para pisos superiores</div>
                          </td>
                          <td style={{ padding: '10px 6px', textAlign: 'center' }}>
                            {slabDims.width && slabDims.length ? `${slabDims.width}m x ${slabDims.length}m` : ''} ({slabDims.area} m²)
                          </td>
                          <td style={{ padding: '10px 6px', textAlign: 'right' }}>{formatCurrency(printedSlabRate)}</td>
                          <td style={{ padding: '10px 6px', textAlign: 'right', fontWeight: 700 }}>{formatCurrency(printedSlabSubtotal)}</td>
                        </tr>
                      )}

                      {/* Corredors Row */}
                      {includeCorridors && corridorArea > 0 && (
                        <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                          <td style={{ padding: '10px 6px' }}>
                            <div style={{ fontWeight: 700, color: '#1f2937' }}>Corredores Exteriores</div>
                            <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>Pasillos perimetrales transitables</div>
                          </td>
                          <td style={{ padding: '10px 6px', textAlign: 'center' }}>
                            {corridorDims.width && corridorDims.length ? `${corridorDims.width}m x ${corridorDims.length}m` : ''} ({corridorDims.area} m²)
                          </td>
                          <td style={{ padding: '10px 6px', textAlign: 'right' }}>{formatCurrency(printedCorridorRate)}</td>
                          <td style={{ padding: '10px 6px', textAlign: 'right', fontWeight: 700 }}>{formatCurrency(printedCorridorSubtotal)}</td>
                        </tr>
                      )}

                      {/* Stairs Row */}
                      {includeStairs && stairsCount > 0 && (
                        <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                          <td style={{ padding: '10px 6px' }}>
                            <div style={{ fontWeight: 700, color: '#1f2937' }}>Escalera de Niveles</div>
                            <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>Conectores de niveles en concreto o metal</div>
                          </td>
                          <td style={{ padding: '10px 6px', textAlign: 'center' }}>{stairsQty} Unidad(es)</td>
                          <td style={{ padding: '10px 6px', textAlign: 'right' }}>{formatCurrency(printedStairsRate)}</td>
                          <td style={{ padding: '10px 6px', textAlign: 'right', fontWeight: 700 }}>{formatCurrency(printedStairsSubtotal)}</td>
                        </tr>
                      )}
                    </>
                  )}

                  {/* Mode B: Render custom concepts rows */}
                  {quoteMode === 'concepts' && (
                    <>
                      {concepts.filter(c => c.included).map((concept) => (
                        <tr key={concept.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                          <td style={{ padding: '10px 6px' }}>
                            <div style={{ fontWeight: 700, color: '#1f2937' }}>{concept.name}</div>
                          </td>
                          <td style={{ padding: '10px 6px', textAlign: 'right', fontWeight: 700 }}>
                            {formatCurrency(Math.round(concept.amount * factor))}
                          </td>
                        </tr>
                      ))}
                    </>
                  )}

                  {subtotalBeforeDiscount === 0 && (
                    <tr>
                      <td colSpan={quoteMode === 'm2' ? 4 : 2} style={{ textAlign: 'center', padding: '20px', color: '#9ca3af' }}>
                        Sin conceptos registrados. Llena la información en el panel izquierdo.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Financial Totals */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
                <div style={{ width: '100%', maxWidth: '280px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4b5563' }}>
                    <span>Subtotal:</span>
                    <span>{formatCurrency(subtotalBeforeDiscount)}</span>
                  </div>
                  {parseFloat(discountPercent) > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981', fontWeight: 600 }}>
                      <span>Descuento ({discountPercent}%):</span>
                      <span>- {formatCurrency(discountVal)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 800, borderTop: '1.5px solid #111827', paddingTop: '8px', color: '#111827' }}>
                    <span>TOTAL ESTIMADO:</span>
                    <span>{formatCurrency(totalQuote)}</span>
                  </div>
                </div>
              </div>

              {/* Terms and conditions */}
              <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '10px', marginBottom: '30px' }}>
                <div style={{ fontSize: '0.65rem', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', marginBottom: '3px' }}>CONDICIONES DE CONTRATACIÓN</div>
                <p style={{ fontSize: '0.75rem', color: '#4b5563', lineHeight: '1.3', margin: 0, whiteSpace: 'pre-wrap' }}>
                  {notes}
                </p>
              </div>

              {/* Signature Blocks */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ width: '45%', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ height: '45px', borderBottom: '1px solid #9ca3af', marginBottom: '5px', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', width: '100%', position: 'relative' }}>
                    <img 
                      src="/firma_representante.png" 
                      alt="Firma Autorizada" 
                      style={{ maxHeight: '60px', position: 'absolute', bottom: '-10px', mixBlendMode: 'multiply' }} 
                    />
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.75rem' }}>Grupo empresarial habitech sas</div>
                  <div style={{ fontSize: '0.65rem', color: '#6b7280' }}>Firma Autorizada</div>
                </div>
                
                <div style={{ width: '45%', textAlign: 'center' }}>
                  <div style={{ height: '45px', borderBottom: '1px solid #9ca3af', marginBottom: '5px' }}></div>
                  <div style={{ fontWeight: 700, fontSize: '0.75rem' }}>Aceptación del Cliente</div>
                  <div style={{ fontSize: '0.65rem', color: '#6b7280' }}>Firma y Cédula</div>
                </div>
              </div>

              {/* Blueprint Page Break (Screen Preview) */}
              {blueprintImg && (
                <div style={{ 
                  borderTop: '2px dashed #e5e7eb', 
                  marginTop: '30px', 
                  paddingTop: '20px', 
                  position: 'relative' 
                }}>
                  <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #111827', paddingBottom: '10px', marginBottom: '20px' }}>
                      <img src="/logo.png" alt="Logo HABITECH" style={{ height: '40px', objectFit: 'contain' }} />
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#111827' }}>ANEXO TÉCNICO: PLANO DE LA OBRA</div>
                        <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>Cliente: {clientData.name || '(Sin Nombre)'}</div>
                      </div>
                    </div>

                    <div style={{ border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px', background: '#fafafa', display: 'inline-block', maxWidth: '100%' }}>
                      <img 
                        src={blueprintImg} 
                        alt="Plano de Construcción" 
                        style={{ maxWidth: '100%', maxHeight: '450px', objectFit: 'contain', display: 'block', margin: 'auto' }} 
                      />
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

      </div>

      {/* PRINTABLE ACTUAL MODAL OVERLAY (HAVE SAME STRUCTURE AND CLASSES AS RECEIPTS TO GUARANTEE PRINTABILITY) */}
      {showPrintModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '780px', background: 'var(--bg-secondary)' }}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={22} style={{ color: 'var(--primary-cyan)' }} />
                Presupuesto Generado
              </h3>
              <button className="btn-icon" onClick={() => setShowPrintModal(false)}><X size={18} /></button>
            </div>

            <div className="modal-body" style={{ padding: '25px', maxHeight: '75vh', overflowY: 'auto' }}>
              <div className="printable-area receipt-container" style={{ position: 'relative', overflow: 'hidden' }}>
                
                {/* Watermark Logo */}
                <div style={{
                  position: 'absolute',
                  top: '45%',
                  left: '50%',
                  transform: 'translate(-50%, -50%) rotate(-15deg)',
                  opacity: 0.04,
                  pointerEvents: 'none',
                  zIndex: 0,
                  width: '320px',
                  height: '320px',
                  backgroundImage: 'url(/logo.png)',
                  backgroundSize: 'contain',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat'
                }} />

                <div style={{ position: 'relative', zIndex: 1 }}>
                  {/* Header */}
                  <div className="receipt-header">
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                        <img src="/logo.png" alt="Logo HABITECH" style={{ height: '70px', objectFit: 'contain' }} />
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
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#111827' }}>PRESUPUESTO DE OBRA</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#FF6D00', marginTop: '4px' }}>
                        COT-{Date.now().toString().substring(5, 11)}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#4b5563', marginTop: '10px' }}>
                        <strong>Fecha:</strong> {clientData.date}<br />
                        <strong>Validez:</strong> 30 días
                      </div>
                    </div>
                  </div>

                  {/* Client Info */}
                  <div className="receipt-details">
                    <div style={{ background: '#f9fafb', padding: '12px', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                      <div style={{ fontSize: '0.65rem', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>COTIZADO A</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1f2937' }}>{clientData.name || '(Sin Nombre)'}</div>
                      <div style={{ fontSize: '0.8rem', color: '#4b5563' }}>
                        <strong>Celular:</strong> {clientData.phone || '(No registrado)'}
                      </div>
                    </div>
                    <div style={{ background: '#f9fafb', padding: '12px', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                      <div style={{ fontSize: '0.65rem', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>DETALLES DEL PROYECTO</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1f2937' }}>{clientData.project || '(Sin Destino)'}</div>
                      <div style={{ fontSize: '0.8rem', color: '#4b5563' }}>
                        <strong>Ubicación:</strong> Colombia
                      </div>
                    </div>
                  </div>

                  {/* Table */}
                  <table className="receipt-table" style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '0.85rem', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: '#f3f4f6', borderBottom: '2px solid #d1d5db', color: '#111827' }}>
                        <th style={{ padding: '8px 6px', fontWeight: 700 }}>Descripción de la Actividad / Item</th>
                        {quoteMode === 'm2' && <th style={{ padding: '8px 6px', fontWeight: 700, textAlign: 'center' }}>Medidas / Cantidad</th>}
                        {quoteMode === 'm2' && <th style={{ padding: '8px 6px', fontWeight: 700, textAlign: 'right' }}>Valor Unitario</th>}
                        <th style={{ padding: '8px 6px', fontWeight: 700, textAlign: 'right' }}>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Mode A */}
                      {quoteMode === 'm2' && (
                        <>
                          {houseArea > 0 && (
                            <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                              <td style={{ padding: '10px 6px' }}>
                                <div style={{ fontWeight: 700, color: '#1f2937' }}>Área de Vivienda ({getFinishTypeLabel(finishType)})</div>
                              </td>
                              <td style={{ padding: '10px 6px', textAlign: 'center' }}>
                                {houseDims.width && houseDims.length ? `${houseDims.width}m x ${houseDims.length}m` : ''} ({houseDims.area} m²)
                              </td>
                              <td style={{ padding: '10px 6px', textAlign: 'right' }}>{formatCurrency(printedHouseRate)}</td>
                              <td style={{ padding: '10px 6px', textAlign: 'right', fontWeight: 700 }}>{formatCurrency(printedHouseSubtotal)}</td>
                            </tr>
                          )}
                          {includeSlab && slabArea > 0 && (
                            <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                              <td style={{ padding: '10px 6px' }}>
                                <div style={{ fontWeight: 700, color: '#1f2937' }}>Placa de Niveles / Entrepiso</div>
                              </td>
                              <td style={{ padding: '10px 6px', textAlign: 'center' }}>
                                {slabDims.width && slabDims.length ? `${slabDims.width}m x ${slabDims.length}m` : ''} ({slabDims.area} m²)
                              </td>
                              <td style={{ padding: '10px 6px', textAlign: 'right' }}>{formatCurrency(printedSlabRate)}</td>
                              <td style={{ padding: '10px 6px', textAlign: 'right', fontWeight: 700 }}>{formatCurrency(printedSlabSubtotal)}</td>
                            </tr>
                          )}
                          {includeCorridors && corridorArea > 0 && (
                            <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                              <td style={{ padding: '10px 6px' }}>
                                <div style={{ fontWeight: 700, color: '#1f2937' }}>Corredores Exteriores</div>
                              </td>
                              <td style={{ padding: '10px 6px', textAlign: 'center' }}>
                                {corridorDims.width && corridorDims.length ? `${corridorDims.width}m x ${corridorDims.length}m` : ''} ({corridorDims.area} m²)
                              </td>
                              <td style={{ padding: '10px 6px', textAlign: 'right' }}>{formatCurrency(printedCorridorRate)}</td>
                              <td style={{ padding: '10px 6px', textAlign: 'right', fontWeight: 700 }}>{formatCurrency(printedCorridorSubtotal)}</td>
                            </tr>
                          )}
                          {includeStairs && stairsCount > 0 && (
                            <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                              <td style={{ padding: '10px 6px' }}>
                                <div style={{ fontWeight: 700, color: '#1f2937' }}>Escalera de Niveles</div>
                              </td>
                              <td style={{ padding: '10px 6px', textAlign: 'center' }}>{stairsQty} Unidad(es)</td>
                              <td style={{ padding: '10px 6px', textAlign: 'right' }}>{formatCurrency(printedStairsRate)}</td>
                              <td style={{ padding: '10px 6px', textAlign: 'right', fontWeight: 700 }}>{formatCurrency(printedStairsSubtotal)}</td>
                            </tr>
                          )}
                        </>
                      )}

                      {/* Mode B */}
                      {quoteMode === 'concepts' && (
                        <>
                          {concepts.filter(c => c.included).map((concept) => (
                            <tr key={concept.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                              <td style={{ padding: '10px 6px' }}>
                                <div style={{ fontWeight: 700, color: '#1f2937' }}>{concept.name}</div>
                              </td>
                              <td style={{ padding: '10px 6px', textAlign: 'right', fontWeight: 700 }}>
                                {formatCurrency(Math.round(concept.amount * factor))}
                              </td>
                            </tr>
                          ))}
                        </>
                      )}
                    </tbody>
                  </table>

                  {/* Totals */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
                    <div style={{ width: '100%', maxWidth: '280px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4b5563' }}>
                        <span>Subtotal:</span>
                        <span>{formatCurrency(subtotalBeforeDiscount)}</span>
                      </div>
                      {parseFloat(discountPercent) > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981', fontWeight: 600 }}>
                          <span>Descuento ({discountPercent}%):</span>
                          <span>- {formatCurrency(discountVal)}</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 800, borderTop: '1.5px solid #111827', paddingTop: '8px', color: '#111827' }}>
                        <span>TOTAL ESTIMADO:</span>
                        <span>{formatCurrency(totalQuote)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '10px', marginBottom: '30px' }}>
                    <div style={{ fontSize: '0.65rem', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', marginBottom: '3px' }}>CONDICIONES DE CONTRATACIÓN</div>
                    <p style={{ fontSize: '0.75rem', color: '#4b5563', lineHeight: '1.3', margin: 0, whiteSpace: 'pre-wrap' }}>
                      {notes}
                    </p>
                  </div>

                  {/* Signatures */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ width: '45%', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ height: '45px', borderBottom: '1px solid #9ca3af', marginBottom: '5px', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', width: '100%', position: 'relative' }}>
                        <img 
                          src="/firma_representante.png" 
                          alt="Firma Autorizada" 
                          style={{ maxHeight: '60px', position: 'absolute', bottom: '-10px', mixBlendMode: 'multiply' }} 
                        />
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '0.75rem' }}>Grupo empresarial habitech sas</div>
                      <div style={{ fontSize: '0.65rem', color: '#6b7280' }}>Firma Autorizada</div>
                    </div>
                    
                    <div style={{ width: '45%', textAlign: 'center' }}>
                      <div style={{ height: '45px', borderBottom: '1px solid #9ca3af', marginBottom: '5px' }}></div>
                      <div style={{ fontWeight: 700, fontSize: '0.75rem' }}>Aceptación del Cliente</div>
                      <div style={{ fontSize: '0.65rem', color: '#6b7280' }}>Firma y Cédula</div>
                    </div>
                  </div>

                  {/* Blueprint Page Break (Inside modal printed area) */}
                  {blueprintImg && (
                    <div style={{ 
                      borderTop: '2px dashed #e5e7eb', 
                      marginTop: '30px', 
                      paddingTop: '20px', 
                      pageBreakBefore: 'always', 
                      position: 'relative' 
                    }}>
                      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #111827', paddingBottom: '10px', marginBottom: '20px' }}>
                          <img src="/logo.png" alt="Logo HABITECH" style={{ height: '40px', objectFit: 'contain' }} />
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#111827' }}>ANEXO TÉCNICO: PLANO DE LA OBRA</div>
                            <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>Cliente: {clientData.name || '(Sin Nombre)'}</div>
                          </div>
                        </div>

                        <div style={{ border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px', background: '#fafafa', display: 'inline-block', maxWidth: '100%' }}>
                          <img 
                            src={blueprintImg} 
                            alt="Plano de Construcción" 
                            style={{ maxWidth: '100%', maxHeight: '450px', objectFit: 'contain', display: 'block', margin: 'auto' }} 
                          />
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280', fontStyle: 'italic', marginTop: '8px' }}>
                          El plano arquitectónico adjunto forma parte integral de la oferta comercial.
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowPrintModal(false)}>
                Cerrar
              </button>
              <button type="button" className="btn btn-primary" onClick={handlePrint}>
                <Printer size={16} /> Enviar a Impresora
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
