import React, { useState, useEffect } from 'react';
import { Calculator, Save, Edit, HelpCircle, Check, FileText, Printer, Undo } from 'lucide-react';

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

export default function QuoteCalculator() {
  // Base prices (stored in localStorage)
  const [prices, setPrices] = useState(() => {
    const saved = localStorage.getItem('habitech_quote_prices');
    return saved ? JSON.parse(saved) : DEFAULT_PRICES;
  });

  const [isEditingPrices, setIsEditingPrices] = useState(false);
  const [tempPrices, setTempPrices] = useState({ ...prices });

  // Quote input states
  const [clientData, setClientData] = useState({
    name: '',
    phone: '',
    project: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Main House Config
  const [finishType, setFinishType] = useState('obra_blanca_tradicional');
  const [houseAreaMode, setHouseAreaMode] = useState('dims'); // 'dims' | 'direct'
  const [houseDims, setHouseDims] = useState({ width: '', length: '', area: '' });

  // Slab Config (Placa de niveles)
  const [includeSlab, setIncludeSlab] = useState(false);
  const [slabAreaMode, setSlabAreaMode] = useState('dims'); // 'dims' | 'direct'
  const [slabDims, setSlabDims] = useState({ width: '', length: '', area: '' });

  // Corridors Config (Corredores exteriores)
  const [includeCorridors, setIncludeCorridors] = useState(false);
  const [corridorAreaMode, setCorridorAreaMode] = useState('dims'); // 'dims' | 'direct'
  const [corridorDims, setCorridorDims] = useState({ width: '', length: '', area: '' });

  // Stairs Config
  const [includeStairs, setIncludeStairs] = useState(false);
  const [stairsQty, setStairsQty] = useState('1');

  // Additional settings
  const [discountPercent, setDiscountPercent] = useState('0');
  const [notes, setNotes] = useState('Garantía de construcción de 5 años estructural. Validez de esta cotización de 30 días.');

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

  // Formatter helpers
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

  const handleResetPrices = () => {
    if (window.confirm('¿Deseas restaurar los precios predeterminados de fábrica?')) {
      setPrices(DEFAULT_PRICES);
      setTempPrices(DEFAULT_PRICES);
      localStorage.setItem('habitech_quote_prices', JSON.stringify(DEFAULT_PRICES));
      setIsEditingPrices(false);
    }
  };

  // Calculations
  const houseArea = parseFloat(houseDims.area) || 0;
  const houseRate = prices[finishType] || 0;
  const houseSubtotal = houseArea * houseRate;

  const slabArea = includeSlab ? (parseFloat(slabDims.area) || 0) : 0;
  const slabRate = prices.placa_niveles || 0;
  const slabSubtotal = slabArea * slabRate;

  const corridorArea = includeCorridors ? (parseFloat(corridorDims.area) || 0) : 0;
  const corridorRate = prices.corredores_exteriores || 0;
  const corridorSubtotal = corridorArea * corridorRate;

  const stairsCount = includeStairs ? (parseInt(stairsQty) || 0) : 0;
  const stairsRate = prices.escalera || 0;
  const stairsSubtotal = stairsCount * stairsRate;

  const subtotalBeforeDiscount = houseSubtotal + slabSubtotal + corridorSubtotal + stairsSubtotal;
  const discountVal = (subtotalBeforeDiscount * (parseFloat(discountPercent) || 0)) / 100;
  const totalQuote = subtotalBeforeDiscount - discountVal;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="quote-calculator-view animate-fade-in">
      {/* Dynamic CSS styles for clean printing layout */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          .sidebar-component, .no-print, header, .btn, button, input, select, textarea {
            display: none !important;
          }
          .printable-quote-page {
            display: block !important;
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: #111827 !important;
            box-shadow: none !important;
            border: none !important;
            padding: 40px 10px !important;
          }
          .glass-panel {
            background: none !important;
            border: none !important;
            box-shadow: none !important;
          }
          .table-print-border th {
            background: #f3f4f6 !important;
            color: #111827 !important;
            border-bottom: 2px solid #d1d5db !important;
          }
          .table-print-border td {
            border-bottom: 1px solid #e5e7eb !important;
            color: #374151 !important;
          }
          .print-header-color {
            color: #111827 !important;
          }
        }
      `}} />

      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
        <div>
          <h1>Cotizador de Construcción</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>Realiza presupuestos instantáneos según el área de obra y tipo de acabados.</p>
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
          <button className="btn btn-primary" onClick={handlePrint} disabled={houseArea === 0}>
            <Printer size={16} /> Imprimir Cotización
          </button>
        </div>
      </div>

      {/* PRICE CONFIGURATION MODAL / CARD */}
      {isEditingPrices && (
        <div className="glass-panel no-print animate-fade-in" style={{ padding: '20px', marginBottom: '20px', background: 'rgba(255, 109, 0, 0.04)', border: '1px solid rgba(255, 109, 0, 0.2)' }}>
          <h3 style={{ color: 'var(--primary-orange)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
            <Calculator size={18} />
            Editar Precios de Referencia (Valor por M² o Unidad)
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

          {/* Main House calculations */}
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
                    {houseArea} m²
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
                    {slabArea} m²
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
                    {corridorArea} m²
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

          {/* Descuentos y notas */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ marginBottom: '15px', fontSize: '1rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '8px' }}>
              Descuentos y Condiciones
            </h3>
            <div className="form-group" style={{ marginBottom: '12px', maxWidth: '150px' }}>
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

        {/* Right Side: Live Invoice Preview (Screen) */}
        <div style={{ position: 'sticky', top: '20px' }}>
          <div className="glass-panel" style={{ padding: '20px 25px', background: '#0b0f19', border: '1px solid var(--border-glass)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '8px' }}>
              <h3 style={{ fontSize: '1rem', color: 'var(--primary-cyan)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileText size={18} /> Resumen de Presupuesto
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Vista Previa en Vivo</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Cliente:</span>
                <span style={{ fontWeight: 600 }}>{clientData.name || 'Sin registrar'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Ubicación:</span>
                <span style={{ fontWeight: 600 }}>{clientData.project || 'Sin registrar'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Fecha:</span>
                <span>{clientData.date}</span>
              </div>

              {/* Subtotal Items lists */}
              <div style={{ borderTop: '1px dashed var(--border-glass)', borderBottom: '1px dashed var(--border-glass)', padding: '10px 0', margin: '8px 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                
                {/* House line */}
                {houseArea > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <div>{getFinishTypeLabel(finishType)}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{houseArea} m² x {formatCurrency(houseRate)}</div>
                    </div>
                    <span style={{ fontWeight: 600 }}>{formatCurrency(houseSubtotal)}</span>
                  </div>
                )}

                {/* Slab line */}
                {includeSlab && slabArea > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <div>Placa de Niveles</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{slabArea} m² x {formatCurrency(slabRate)}</div>
                    </div>
                    <span style={{ fontWeight: 600 }}>{formatCurrency(slabSubtotal)}</span>
                  </div>
                )}

                {/* Corredores line */}
                {includeCorridors && corridorArea > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <div>Corredores Exteriores</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{corridorArea} m² x {formatCurrency(corridorRate)}</div>
                    </div>
                    <span style={{ fontWeight: 600 }}>{formatCurrency(corridorSubtotal)}</span>
                  </div>
                )}

                {/* Stairs line */}
                {includeStairs && stairsCount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <div>Escalera de Conexión</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{stairsCount} und x {formatCurrency(stairsRate)}</div>
                    </div>
                    <span style={{ fontWeight: 600 }}>{formatCurrency(stairsSubtotal)}</span>
                  </div>
                )}

                {houseArea === 0 && (
                  <div style={{ textAlign: 'center', padding: '15px 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    Ingresa las dimensiones o área de la casa para calcular.
                  </div>
                )}
              </div>

              {/* Pricing Math */}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Subtotal:</span>
                <span>{formatCurrency(subtotalBeforeDiscount)}</span>
              </div>
              {parseFloat(discountPercent) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981' }}>
                  <span>Descuento ({discountPercent}%):</span>
                  <span>- {formatCurrency(discountVal)}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 800, borderTop: '2px solid var(--border-glass)', paddingTop: '10px', marginTop: '5px' }}>
                <span style={{ color: 'var(--text-primary)' }}>TOTAL ESTIMADO:</span>
                <span style={{ color: 'var(--primary-cyan)' }}>{formatCurrency(totalQuote)}</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* PRINTABLE ACTUAL PAGE WRAPPER (HIDDEN ON SCREEN, VISIBLE ON PRINT) */}
      <div className="printable-quote-page" style={{ display: 'none', background: 'white', color: '#111827', fontFamily: 'system-ui, sans-serif' }}>
        
        {/* Invoice Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #111827', paddingBottom: '20px', marginBottom: '25px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
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
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.5px' }}>PRESUPUESTO DE OBRA</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#FF6D00', marginTop: '4px' }}>
              COT-{Date.now().toString().substring(5, 11)}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#4b5563', marginTop: '10px' }}>
              <strong>Fecha:</strong> {clientData.date}<br />
              <strong>Validez:</strong> 30 días
            </div>
          </div>
        </div>

        {/* Client Metadata block */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '15px', marginBottom: '25px' }}>
          <div>
            <div style={{ fontSize: '0.7rem', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', marginBottom: '3px' }}>COTIZADO A</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1f2937' }}>{clientData.name || '(Sin Nombre)'}</div>
            <div style={{ fontSize: '0.85rem', color: '#4b5563', marginTop: '3px' }}>
              <strong>Celular:</strong> {clientData.phone || '(No registrado)'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', marginBottom: '3px' }}>DETALLES DEL PROYECTO</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1f2937' }}>{clientData.project || '(Sin Destino)'}</div>
            <div style={{ fontSize: '0.85rem', color: '#4b5563', marginTop: '3px' }}>
              <strong>Ubicación:</strong> Colombia
            </div>
          </div>
        </div>

        {/* Table of components breakdown */}
        <table className="table-print-border" style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '25px', fontSize: '0.9rem', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f3f4f6', borderBottom: '2px solid #d1d5db', color: '#111827' }}>
              <th style={{ padding: '10px', fontWeight: 700 }}>Descripción del Item / Servicio</th>
              <th style={{ padding: '10px', fontWeight: 700, textAlign: 'center' }}>Área / Cantidad</th>
              <th style={{ padding: '10px', fontWeight: 700, textAlign: 'right' }}>Valor Unitario (M²)</th>
              <th style={{ padding: '10px', fontWeight: 700, textAlign: 'right' }}>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {/* House Line */}
            {houseArea > 0 && (
              <tr>
                <td style={{ padding: '12px 10px' }}>
                  <div style={{ fontWeight: 700, color: '#1f2937' }}>Construcción de Área Principal (Casa)</div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '2px' }}>Acabado: {getFinishTypeLabel(finishType)}</div>
                </td>
                <td style={{ padding: '12px 10px', textAlign: 'center' }}>{houseArea} m²</td>
                <td style={{ padding: '12px 10px', textAlign: 'right' }}>{formatCurrency(houseRate)}</td>
                <td style={{ padding: '12px 10px', textAlign: 'right', fontWeight: 700, color: '#111827' }}>{formatCurrency(houseSubtotal)}</td>
              </tr>
            )}

            {/* Slab Line */}
            {includeSlab && slabArea > 0 && (
              <tr>
                <td style={{ padding: '12px 10px' }}>
                  <div style={{ fontWeight: 700, color: '#1f2937' }}>Placa de Niveles / Entrepiso</div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '2px' }}>Cimentación aérea para pisos superiores</div>
                </td>
                <td style={{ padding: '12px 10px', textAlign: 'center' }}>{slabArea} m²</td>
                <td style={{ padding: '12px 10px', textAlign: 'right' }}>{formatCurrency(slabRate)}</td>
                <td style={{ padding: '12px 10px', textAlign: 'right', fontWeight: 700, color: '#111827' }}>{formatCurrency(slabSubtotal)}</td>
              </tr>
            )}

            {/* Corredors Line */}
            {includeCorridors && corridorArea > 0 && (
              <tr>
                <td style={{ padding: '12px 10px' }}>
                  <div style={{ fontWeight: 700, color: '#1f2937' }}>Corredores Exteriores</div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '2px' }}>Zona exterior transitable perimetral</div>
                </td>
                <td style={{ padding: '12px 10px', textAlign: 'center' }}>{corridorArea} m²</td>
                <td style={{ padding: '12px 10px', textAlign: 'right' }}>{formatCurrency(corridorRate)}</td>
                <td style={{ padding: '12px 10px', textAlign: 'right', fontWeight: 700, color: '#111827' }}>{formatCurrency(corridorSubtotal)}</td>
              </tr>
            )}

            {/* Stairs Line */}
            {includeStairs && stairsCount > 0 && (
              <tr>
                <td style={{ padding: '12px 10px' }}>
                  <div style={{ fontWeight: 700, color: '#1f2937' }}>Escalera de Niveles</div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '2px' }}>Estructura de conexión metálica o concreto</div>
                </td>
                <td style={{ padding: '12px 10px', textAlign: 'center' }}>{stairsCount} Unidad(es)</td>
                <td style={{ padding: '12px 10px', textAlign: 'right' }}>{formatCurrency(stairsRate)}</td>
                <td style={{ padding: '12px 10px', textAlign: 'right', fontWeight: 700, color: '#111827' }}>{formatCurrency(stairsSubtotal)}</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pricing Summary */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '30px' }}>
          <div style={{ width: '100%', maxWidth: '320px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem' }}>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.15rem', fontWeight: 800, borderTop: '2px solid #111827', paddingTop: '10px', color: '#111827' }}>
              <span>TOTAL ESTIMADO:</span>
              <span>{formatCurrency(totalQuote)}</span>
            </div>
          </div>
        </div>

        {/* Terms and conditions block */}
        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '15px', marginBottom: '40px' }}>
          <div style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', marginBottom: '5px' }}>CONDICIONES DE CONTRATACIÓN</div>
          <p style={{ fontSize: '0.8rem', color: '#4b5563', lineHeight: '1.4', whiteSpace: 'pre-wrap' }}>
            {notes}
          </p>
        </div>

        {/* Signature Area */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
          <div style={{ width: '45%', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ height: '60px', borderBottom: '1px solid #9ca3af', marginBottom: '8px', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', width: '100%', position: 'relative' }}>
              <img 
                src="/firma_representante.png" 
                alt="Firma Autorizada" 
                style={{ maxHeight: '80px', position: 'absolute', bottom: '-15px', mixBlendMode: 'multiply' }} 
              />
            </div>
            <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Grupo empresarial habitech sas</div>
            <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>Firma Autorizada</div>
          </div>
          
          <div style={{ width: '45%', textAlign: 'center' }}>
            <div style={{ height: '60px', borderBottom: '1px solid #9ca3af', marginBottom: '8px' }}></div>
            <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Aceptación de la Oferta (Cliente)</div>
            <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>Firma y Cédula</div>
          </div>
        </div>

      </div>

    </div>
  );
}
