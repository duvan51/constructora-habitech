import React, { useState, useEffect } from 'react';
import { 
  Percent, 
  Calculator, 
  DollarSign, 
  Copy, 
  Check, 
  Printer, 
  RotateCcw, 
  Save, 
  Trash2, 
  Info, 
  HelpCircle, 
  FileText, 
  Clock, 
  Download, 
  ChevronDown, 
  ChevronUp, 
  ShieldCheck, 
  Building2, 
  ArrowRight,
  Sparkles,
  MapPin,
  X
} from 'lucide-react';

const COMMON_RATES = [
  { rate: 2.5, label: '2.5% - Compras y suministros generales (Por defecto)', description: 'Bienes y compras en general para personas jurídicas y declarantes', badge: 'Recomendado' },
  { rate: 3.5, label: '3.5% - Servicios generales (No declarantes)', description: 'Servicios técnicos o generales prestados por no declarantes de renta' },
  { rate: 1.0, label: '1.0% - Obras de construcción y urbanización', description: 'Contratos de construcción, urbanización y confección de obra material' },
  { rate: 4.0, label: '4.0% - Arrendamientos y servicios calificados', description: 'Arrendamiento de bienes muebles o servicios específicos declarantes' },
  { rate: 11.0, label: '11.0% - Honorarios (Personas jurídicas / declarantes)', description: 'Servicios profesionales donde predomina el factor intelectual' },
  { rate: 10.0, label: '10.0% - Honorarios (Personas naturales no declarantes)', description: 'Honorarios y comisiones para no declarantes' }
];

const COMMON_RETEICA_RATES = [
  { rate: 0.3, label: '0.3% - Tarifa Oficial Villavicencio (Constructora Habitech)', description: 'Retención de ICA sobre la Base Gravable (Total antes de IVA) en Villavicencio', badge: 'Villavicencio' },
  { rate: 0.966, label: '0.966% (9.66‰) - Obras y construcción general (Otros municipios)', description: 'Tarifa general de obras en otros municipios' },
  { rate: 0.414, label: '0.414% (4.14‰) - Servicios generales y mano de obra', description: 'Servicios en otros municipios' },
  { rate: 0.69, label: '0.69% (6.9‰) - Compra de materiales y ferretería', description: 'Comercio e insumos en otros municipios' }
];

export default function RetefuenteCalculator() {
  // Inputs
  const [inputValue, setInputValue] = useState('10000000');
  const [ivaMode, setIvaMode] = useState('included_19'); // 'included_19' | 'included_5' | 'no_iva' | 'manual_iva' | 'add_19'
  const [manualIva, setManualIva] = useState('0');
  const [reteRate, setReteRate] = useState(2.5);
  const [isCustomRate, setIsCustomRate] = useState(false);
  const [customRateValue, setCustomRateValue] = useState('2.5');

  // ReteICA Toggle and Rates (Villavicencio 0.3% por defecto)
  const [applyReteIca, setApplyReteIca] = useState(false);
  const [reteIcaRate, setReteIcaRate] = useState(0.3); // 0.3% sobre la Base
  const [isCustomReteIca, setIsCustomReteIca] = useState(false);
  const [customReteIcaValue, setCustomReteIcaValue] = useState('0.3');

  // Optional Extra ReteIVA
  const [showAdvancedTaxes, setShowAdvancedTaxes] = useState(false);
  const [applyReteIva, setApplyReteIva] = useState(false);
  const [reteIvaRate, setReteIvaRate] = useState('15'); // 15% del IVA

  // Metadata / Beneficiary
  const [beneficiary, setBeneficiary] = useState('');
  const [concept, setConcept] = useState('');
  const [docNumber, setDocNumber] = useState('');

  // UI state
  const [copied, setCopied] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [history, setHistory] = useState([]);

  // Load history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('habitech_retefuente_history');
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Error reading retefuente history:', e);
    }
  }, []);

  // Save history to localStorage
  const saveHistoryList = (newList) => {
    setHistory(newList);
    try {
      localStorage.setItem('habitech_retefuente_history', JSON.stringify(newList));
    } catch (e) {
      console.warn('Error saving retefuente history:', e);
    }
  };

  // Currency Formatter
  const formatCOP = (val) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(Math.round(val || 0));
  };

  // Numeric parsing
  const rawPrice = parseFloat(String(inputValue).replace(/[^\d.-]/g, '')) || 0;
  const rawManualIva = parseFloat(String(manualIva).replace(/[^\d.-]/g, '')) || 0;
  const currentRetePercent = isCustomRate ? (parseFloat(customRateValue) || 0) : reteRate;
  const activeReteIcaRate = isCustomReteIca ? (parseFloat(customReteIcaValue) || 0) : reteIcaRate;

  // 1. Calculate Base (total antes de IVA) and IVA
  let valorBase = 0;
  let montoIva = 0;
  let valorTotalFacturado = 0;

  if (ivaMode === 'included_19') {
    valorTotalFacturado = rawPrice;
    valorBase = Math.round(rawPrice / 1.19);
    montoIva = valorTotalFacturado - valorBase;
  } else if (ivaMode === 'included_5') {
    valorTotalFacturado = rawPrice;
    valorBase = Math.round(rawPrice / 1.05);
    montoIva = valorTotalFacturado - valorBase;
  } else if (ivaMode === 'no_iva') {
    valorTotalFacturado = rawPrice;
    valorBase = rawPrice;
    montoIva = 0;
  } else if (ivaMode === 'manual_iva') {
    valorTotalFacturado = rawPrice;
    montoIva = Math.min(rawManualIva, valorTotalFacturado);
    valorBase = Math.max(0, valorTotalFacturado - montoIva);
  } else if (ivaMode === 'add_19') {
    valorBase = rawPrice;
    montoIva = Math.round(rawPrice * 0.19);
    valorTotalFacturado = valorBase + montoIva;
  }

  // 2. Retención en la Fuente: valorBase * (tasa / 100)
  const montoRetefuente = Math.round(valorBase * (currentRetePercent / 100));

  // 3. ReteICA: valorBase (total antes de IVA) * (activeReteIcaRate / 100)
  // En Villavicencio: 0.3% sobre la base = valorBase * 0.003
  const montoReteIca = applyReteIca 
    ? Math.round(valorBase * (activeReteIcaRate / 100)) 
    : 0;

  // 4. Optional ReteIVA: 15% del IVA
  const montoReteIva = (applyReteIva && montoIva > 0)
    ? Math.round(montoIva * ((parseFloat(reteIvaRate) || 0) / 100))
    : 0;

  const totalRetenciones = montoRetefuente + montoReteIca + montoReteIva;

  // 5. Lo que se debe pagar al cliente/proveedor: iva + valorBase - retenciones
  // Equivalente a: valorTotalFacturado - totalRetenciones
  const totalAPagar = Math.max(0, valorBase + montoIva - totalRetenciones);

  // Quick amount additions
  const addAmount = (amount) => {
    const current = parseFloat(String(inputValue).replace(/[^\d.-]/g, '')) || 0;
    setInputValue(String(current + amount));
  };

  // Copy structured summary for WhatsApp or Email
  const handleCopySummary = () => {
    const text = `📋 *CONSTRUCTORA HABITECH SAS - LIQUIDACIÓN DE RETENCIONES*
📅 *Fecha:* ${new Date().toLocaleDateString('es-CO')}
📍 *Sede:* Villavicencio, Meta
${beneficiary ? `👤 *Beneficiario / Proveedor:* ${beneficiary}\n` : ''}${docNumber ? `🪪 *NIT / Documento:* ${docNumber}\n` : ''}${concept ? `📝 *Concepto / Factura:* ${concept}\n` : ''}--------------------------------------------------
💰 *Valor Total Facturado:* ${formatCOP(valorTotalFacturado)}
➖ *IVA Descontado:* ${formatCOP(montoIva)} ${ivaMode === 'no_iva' ? '(Sin IVA)' : ''}
📌 *Valor Base (Antes de IVA):* ${formatCOP(valorBase)}
✂️ *Retefuente (${currentRetePercent}%):* -${formatCOP(montoRetefuente)}${applyReteIca ? `\n✂️ *ReteICA (${activeReteIcaRate}% - Villavicencio sobre Base):* -${formatCOP(montoReteIca)}` : ''}${applyReteIva ? `\n✂️ *ReteIVA (${reteIvaRate}%):* -${formatCOP(montoReteIva)}` : ''}
--------------------------------------------------
💵 *TOTAL NETO A PAGAR / GIRAR:* ${formatCOP(totalAPagar)}
--------------------------------------------------
*Fórmula Aplicada:*
Valor Base (${formatCOP(valorBase)}) + IVA (${formatCOP(montoIva)}) - Retefuente (${formatCOP(montoRetefuente)})${applyReteIca ? ` - ReteICA (${formatCOP(montoReteIca)})` : ''} = ${formatCOP(totalAPagar)}
_Generado por Constructora Habitech SAS_`;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      if (window.showToast) {
        window.showToast('¡Liquidación copiada al portapapeles para WhatsApp!', 'success');
      }
      setTimeout(() => setCopied(false), 2500);
    });
  };

  // Save current calculation to history
  const handleSaveToHistory = () => {
    if (rawPrice <= 0) {
      if (window.showToast) window.showToast('Ingresa un valor mayor a cero para guardar', 'error');
      return;
    }
    const record = {
      id: 'ret_' + Date.now(),
      date: new Date().toLocaleString('es-CO'),
      beneficiary: beneficiary || 'Sin especificar',
      concept: concept || 'Compra o servicio general',
      docNumber: docNumber || '',
      valorTotal: valorTotalFacturado,
      montoIva,
      valorBase,
      reteRate: currentRetePercent,
      montoRetefuente,
      applyReteIca,
      reteIcaRate: activeReteIcaRate,
      montoReteIca,
      totalAPagar,
      applyReteIva,
      montoReteIva
    };

    const updated = [record, ...history.slice(0, 29)];
    saveHistoryList(updated);
    if (window.showToast) window.showToast('Liquidación guardada en el historial', 'success');
  };

  const handleClearHistory = () => {
    if (window.confirmDialog) {
      window.confirmDialog('¿Deseas vaciar todo el historial de liquidaciones?').then(yes => {
        if (yes) saveHistoryList([]);
      });
    } else if (window.confirm('¿Deseas vaciar todo el historial de liquidaciones?')) {
      saveHistoryList([]);
    }
  };

  const handleLoadRecord = (rec) => {
    setInputValue(String(rec.valorTotal));
    setBeneficiary(rec.beneficiary !== 'Sin especificar' ? rec.beneficiary : '');
    setConcept(rec.concept !== 'Compra o servicio general' ? rec.concept : '');
    setDocNumber(rec.docNumber || '');
    if (rec.montoIva === 0) {
      setIvaMode('no_iva');
    } else {
      setIvaMode('included_19');
    }
    const matched = COMMON_RATES.find(r => r.rate === rec.reteRate);
    if (matched) {
      setReteRate(rec.reteRate);
      setIsCustomRate(false);
    } else {
      setIsCustomRate(true);
      setCustomRateValue(String(rec.reteRate));
    }

    if (rec.applyReteIca) {
      setApplyReteIca(true);
      const matchedIca = COMMON_RETEICA_RATES.find(r => r.rate === Number(rec.reteIcaRate));
      if (matchedIca) {
        setReteIcaRate(Number(rec.reteIcaRate));
        setIsCustomReteIca(false);
      } else {
        setIsCustomReteIca(true);
        setCustomReteIcaValue(String(rec.reteIcaRate ?? 0.3));
      }
    } else {
      setApplyReteIca(false);
    }

    if (window.showToast) window.showToast('Liquidación cargada en la calculadora', 'info');
  };

  const handleDeleteRecord = (id) => {
    saveHistoryList(history.filter(h => h.id !== id));
  };

  return (
    <div className="animate-fade-in" style={{ width: '100%', maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '25px' }}>
      
      {/* Top Banner Header */}
      <div className="glass-panel" style={{
        padding: '25px 30px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px',
        background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.8) 0%, rgba(30, 41, 59, 0.6) 100%)',
        borderLeft: '4px solid var(--primary-cyan)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: 0.05, pointerEvents: 'none' }}>
          <Percent size={180} />
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <span style={{
              background: 'rgba(255, 109, 0, 0.15)',
              color: '#FF6D00',
              padding: '4px 10px',
              borderRadius: '8px',
              fontSize: '0.75rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <Sparkles size={14} /> MÓDULO FINANCIERO HABITECH
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>• Retefuente & ReteICA Villavicencio</span>
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0 0 6px 0', letterSpacing: '-0.5px', color: 'var(--text-primary)' }}>
            Calculadora de Retefuente y ReteICA
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', margin: 0, maxWidth: '800px', lineHeight: '1.4' }}>
            Descuenta el IVA para obtener el <strong>Valor Base (total antes de IVA)</strong>, calcula la <strong>Retefuente (2.5%)</strong> y aplica el <strong>ReteICA del 0.3% de Villavicencio</strong> sobre la Base para obtener el valor neto a pagar a tu cliente o contratista.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              setInputValue('0');
              setBeneficiary('');
              setConcept('');
              setDocNumber('');
              setManualIva('0');
              setApplyReteIca(false);
            }}
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
            title="Limpiar datos de la calculadora"
          >
            <RotateCcw size={16} /> Limpiar
          </button>

          <button
            onClick={handleCopySummary}
            className="btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.85rem',
              background: copied ? '#10b981' : 'rgba(255, 255, 255, 0.08)',
              color: '#fff',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              transition: 'var(--transition-smooth)'
            }}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? '¡Copiado!' : 'Copiar WhatsApp'}
          </button>

          <button
            onClick={handleSaveToHistory}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
          >
            <Save size={16} /> Guardar
          </button>

          <button
            onClick={() => setShowPrintModal(true)}
            className="btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.85rem',
              background: 'rgba(255, 109, 0, 0.15)',
              color: '#FF6D00',
              border: '1px solid rgba(255, 109, 0, 0.3)'
            }}
          >
            <Printer size={16} /> Comprobante
          </button>
        </div>
      </div>

      {/* Main Grid: Form Left, Results Right */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
        gap: '25px',
        alignItems: 'start'
      }}>

        {/* LEFT COLUMN: Input Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Main Input Card */}
          <div className="glass-panel" style={{ padding: '25px' }}>
            
            {/* 1. Price and IVA */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{
                background: 'rgba(255, 109, 0, 0.15)',
                color: '#FF6D00',
                padding: '8px',
                borderRadius: '10px'
              }}>
                <DollarSign size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>1. Valor / Precio a Liquidar</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Monto bruto de la factura, recibo o cuenta de cobro</span>
              </div>
            </div>

            {/* Price Input */}
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Precio / Valor Facturado (COP):
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute',
                  left: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontWeight: 800,
                  fontSize: '1.25rem',
                  color: '#FF6D00'
                }}>
                  $
                </span>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  className="form-control"
                  style={{
                    paddingLeft: '35px',
                    fontSize: '1.35rem',
                    fontWeight: 700,
                    height: '52px',
                    color: '#fff',
                    letterSpacing: '0.5px'
                  }}
                  placeholder="0"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />
              </div>
              <div style={{ marginTop: '6px', fontSize: '0.85rem', color: '#10b981', fontWeight: 600 }}>
                Valor formateado: {formatCOP(rawPrice)}
              </div>
            </div>

            {/* Quick Amount Chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '25px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', alignSelf: 'center', marginRight: '4px' }}>Sumar rápido:</span>
              {[100000, 500000, 1000000, 5000000, 10000000].map(amt => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => addAmount(amt)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '6px',
                    color: 'var(--text-secondary)',
                    padding: '4px 10px',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    transition: 'var(--transition-smooth)'
                  }}
                  onMouseEnter={(e) => e.target.style.borderColor = 'var(--primary-cyan)'}
                  onMouseLeave={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)'}
                >
                  +{formatCOP(amt)}
                </button>
              ))}
            </div>

            {/* IVA Treatment Selector */}
            <div style={{ marginBottom: '25px', paddingTop: '15px', borderTop: '1px solid var(--border-glass)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Tratamiento del IVA (Desglose de Base):
                </label>
                <span style={{ fontSize: '0.75rem', color: 'var(--primary-cyan)', fontWeight: 600 }}>
                  {ivaMode === 'included_19' && 'Descontando 19%'}
                  {ivaMode === 'included_5' && 'Descontando 5%'}
                  {ivaMode === 'no_iva' && 'Sin IVA (0%)'}
                  {ivaMode === 'manual_iva' && 'IVA Manual'}
                  {ivaMode === 'add_19' && 'Sumando 19% a la Base'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '8px' }}>
                {[
                  { id: 'included_19', label: 'Factura con IVA 19%', sub: 'Desglosar Base (Total / 1.19)' },
                  { id: 'included_5', label: 'Factura con IVA 5%', sub: 'Desglosar Base (Total / 1.05)' },
                  { id: 'no_iva', label: 'Sin IVA / Exento (0%)', sub: 'Cuenta de cobro o no gravado' },
                  { id: 'manual_iva', label: 'Digitar IVA Manual', sub: 'Ingresar valor exacto en $' },
                  { id: 'add_19', label: 'Base + Sumar IVA 19%', sub: 'El valor era antes de IVA' }
                ].map(item => {
                  const active = ivaMode === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setIvaMode(item.id)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: active ? '1.5px solid #FF6D00' : '1px solid rgba(255, 255, 255, 0.08)',
                        background: active ? 'rgba(255, 109, 0, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'var(--transition-smooth)'
                      }}
                    >
                      <div style={{ fontSize: '0.82rem', fontWeight: active ? 700 : 600, color: active ? '#FF6D00' : 'var(--text-primary)' }}>
                        {item.label}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {item.sub}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Manual IVA Input if selected */}
              {ivaMode === 'manual_iva' && (
                <div style={{ marginTop: '12px', background: 'rgba(255, 255, 255, 0.02)', padding: '12px', borderRadius: '8px', border: '1px dashed var(--border-glass)' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '5px' }}>
                    Valor exacto del IVA discriminado en la factura:
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    className="form-control"
                    placeholder="Monto de IVA en COP"
                    value={manualIva}
                    onChange={(e) => setManualIva(e.target.value)}
                    style={{ fontSize: '1rem' }}
                  />
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    IVA ingresado: {formatCOP(rawManualIva)}
                  </div>
                </div>
              )}
            </div>

            {/* 2. Retefuente Rate Selector */}
            <div style={{ paddingTop: '15px', borderTop: '1px solid var(--border-glass)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  2. Tarifa de Retención en la Fuente:
                </label>
                <span style={{
                  background: 'rgba(255, 109, 0, 0.2)',
                  color: '#FF6D00',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 700
                }}>
                  {currentRetePercent}%
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {COMMON_RATES.map((item) => {
                  const active = !isCustomRate && reteRate === item.rate;
                  return (
                    <button
                      key={item.rate}
                      type="button"
                      onClick={() => {
                        setReteRate(item.rate);
                        setIsCustomRate(false);
                      }}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: active ? '1.5px solid #FF6D00' : '1px solid rgba(255, 255, 255, 0.07)',
                        background: active ? 'rgba(255, 109, 0, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                        textAlign: 'left',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'var(--transition-smooth)'
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0, paddingRight: '10px' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: active ? 700 : 600, color: active ? '#FF6D00' : 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>{item.label}</span>
                          {item.badge && (
                            <span style={{ fontSize: '0.65rem', background: '#FF6D00', color: '#000', padding: '1px 6px', borderRadius: '4px', fontWeight: 800 }}>
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.description}
                        </div>
                      </div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 800, color: active ? '#FF6D00' : 'var(--text-secondary)' }}>
                        {item.rate}%
                      </div>
                    </button>
                  );
                })}

                {/* Custom Rate Option */}
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: isCustomRate ? '1.5px solid #FF6D00' : '1px solid rgba(255, 255, 255, 0.07)',
                  background: isCustomRate ? 'rgba(255, 109, 0, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', flex: 1, fontSize: '0.85rem', color: isCustomRate ? '#FF6D00' : 'var(--text-primary)', fontWeight: isCustomRate ? 700 : 500 }}>
                    <input
                      type="radio"
                      name="rateMode"
                      checked={isCustomRate}
                      onChange={() => setIsCustomRate(true)}
                    />
                    <span>Ingresar porcentaje personalizado:</span>
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', width: '110px' }}>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      className="form-control"
                      value={customRateValue}
                      disabled={!isCustomRate}
                      onClick={() => setIsCustomRate(true)}
                      onChange={(e) => {
                        setIsCustomRate(true);
                        setCustomRateValue(e.target.value);
                      }}
                      style={{ height: '36px', fontSize: '0.9rem', textAlign: 'right', fontWeight: 700 }}
                    />
                    <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. RETEICA SELECTOR (VILLAVICENCIO 0.3% SOBRE LA BASE ANTES DE IVA) */}
            <div style={{ paddingTop: '20px', borderTop: '1px solid var(--border-glass)', marginTop: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    background: applyReteIca ? 'rgba(255, 109, 0, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    color: applyReteIca ? '#FF6D00' : 'var(--text-muted)',
                    padding: '8px',
                    borderRadius: '10px',
                    display: 'flex'
                  }}>
                    <Building2 size={18} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        3. ¿Se le agrega ReteICA?
                      </h3>
                      <span style={{ fontSize: '0.72rem', background: 'rgba(255, 109, 0, 0.15)', color: '#FF6D00', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                        Villavicencio 0.3%
                      </span>
                    </div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Retención de ICA calculada sobre el <strong>Valor Base (total antes de IVA)</strong>
                    </span>
                  </div>
                </div>

                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  padding: '3px 10px',
                  borderRadius: '999px',
                  background: applyReteIca ? 'rgba(255, 109, 0, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  color: applyReteIca ? '#FF6D00' : 'var(--text-muted)',
                  border: applyReteIca ? '1px solid rgba(255, 109, 0, 0.4)' : '1px solid transparent'
                }}>
                  {applyReteIca ? `SÍ (${activeReteIcaRate}% sobre Base)` : 'NO APLICA'}
                </span>
              </div>

              {/* Big SÍ / NO Selection Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: applyReteIca ? '15px' : '0' }}>
                <button
                  type="button"
                  onClick={() => {
                    setApplyReteIca(true);
                    setReteIcaRate(0.3);
                    setIsCustomReteIca(false);
                  }}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: applyReteIca ? '2px solid #FF6D00' : '1px solid rgba(255, 255, 255, 0.08)',
                    background: applyReteIca ? 'linear-gradient(135deg, rgba(255, 109, 0, 0.22) 0%, rgba(255, 109, 0, 0.08) 100%)' : 'rgba(255, 255, 255, 0.02)',
                    color: applyReteIca ? '#FF6D00' : 'var(--text-secondary)',
                    fontWeight: 800,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: applyReteIca ? '0 0 15px rgba(255, 109, 0, 0.3)' : 'none',
                    transition: 'var(--transition-smooth)'
                  }}
                >
                  <Check size={18} />
                  <span>SÍ, aplicar ReteICA (0.3%)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setApplyReteIca(false)}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: !applyReteIca ? '2px solid rgba(255, 255, 255, 0.25)' : '1px solid rgba(255, 255, 255, 0.08)',
                    background: !applyReteIca ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                    color: !applyReteIca ? '#ffffff' : 'var(--text-muted)',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'var(--transition-smooth)'
                  }}
                >
                  <X size={18} />
                  <span>NO aplicar ReteICA</span>
                </button>
              </div>

              {/* Expanded ReteICA rate options when SÍ */}
              {applyReteIca && (
                <div className="animate-fade-in" style={{
                  background: 'rgba(255, 109, 0, 0.04)',
                  padding: '16px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 109, 0, 0.25)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                      Tarifa de ReteICA sobre la Base (Antes de IVA):
                    </span>
                    <span style={{ fontSize: '0.85rem', color: '#FF6D00', fontWeight: 800 }}>
                      Descuento: -{formatCOP(montoReteIca)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {COMMON_RETEICA_RATES.map((item) => {
                      const active = !isCustomReteIca && reteIcaRate === item.rate;
                      return (
                        <button
                          key={item.rate}
                          type="button"
                          onClick={() => {
                            setReteIcaRate(item.rate);
                            setIsCustomReteIca(false);
                          }}
                          style={{
                            padding: '9px 12px',
                            borderRadius: '8px',
                            border: active ? '1.5px solid #FF6D00' : '1px solid rgba(255, 255, 255, 0.06)',
                            background: active ? 'rgba(255, 109, 0, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                            color: active ? '#FF6D00' : 'var(--text-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                            fontSize: '0.82rem',
                            fontWeight: active ? 700 : 500,
                            textAlign: 'left',
                            transition: 'var(--transition-smooth)'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>{item.label}</span>
                            {item.badge && (
                              <span style={{ fontSize: '0.65rem', background: '#FF6D00', color: '#000', padding: '1px 6px', borderRadius: '4px', fontWeight: 800 }}>
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <span style={{ fontWeight: 800, color: active ? '#FF6D00' : 'var(--text-secondary)' }}>
                            {item.rate}%
                          </span>
                        </button>
                      );
                    })}

                    {/* Custom ReteICA Rate */}
                    <div style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: isCustomReteIca ? '1.5px solid #FF6D00' : '1px solid rgba(255, 255, 255, 0.06)',
                      background: isCustomReteIca ? 'rgba(255, 109, 0, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      fontSize: '0.82rem'
                    }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', flex: 1, color: isCustomReteIca ? '#FF6D00' : 'var(--text-secondary)', fontWeight: isCustomReteIca ? 700 : 500 }}>
                        <input
                          type="radio"
                          name="reteIcaMode"
                          checked={isCustomReteIca}
                          onChange={() => setIsCustomReteIca(true)}
                        />
                        <span>Porcentaje de ICA personalizado (%):</span>
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', width: '100px' }}>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="form-control"
                          value={customReteIcaValue}
                          disabled={!isCustomReteIca}
                          onClick={() => setIsCustomReteIca(true)}
                          onChange={(e) => {
                            setIsCustomReteIca(true);
                            setCustomReteIcaValue(e.target.value);
                          }}
                          style={{ height: '30px', fontSize: '0.85rem', textAlign: 'right', fontWeight: 700 }}
                        />
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>%</span>
                      </div>
                    </div>
                  </div>

                  {/* Clarification Box */}
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px', background: 'rgba(0,0,0,0.25)', padding: '8px 12px', borderRadius: '6px', borderLeft: '3px solid #FF6D00' }}>
                    <div style={{ fontWeight: 700, color: '#FF6D00', marginBottom: '2px' }}>
                      📍 Retención ICA Villavicencio (0.3% sobre la Base):
                    </div>
                    Valor Base antes de IVA ({formatCOP(valorBase)}) × <strong>{activeReteIcaRate}%</strong> = <strong style={{ color: '#fff' }}>-{formatCOP(montoReteIca)}</strong> que se descuenta del total a pagar a tu cliente.
                  </div>
                </div>
              )}
            </div>

            {/* Optional Beneficiary and Concept Info */}
            <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid var(--border-glass)' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                4. Datos de la Liquidación (Opcionales para Comprobante)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Proveedor / Cliente / Beneficiario:</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ej: Materiales del Llano SAS"
                    value={beneficiary}
                    onChange={(e) => setBeneficiary(e.target.value)}
                    style={{ fontSize: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>NIT / Cédula:</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ej: 900.123.456-7"
                    value={docNumber}
                    onChange={(e) => setDocNumber(e.target.value)}
                    style={{ fontSize: '0.85rem' }}
                  />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Concepto o Referencia Factura:</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ej: Compra de cemento y varilla corrugada - Factura 4520"
                  value={concept}
                  onChange={(e) => setConcept(e.target.value)}
                  style={{ fontSize: '0.85rem' }}
                />
              </div>
            </div>

            {/* Optional ReteIVA Collapsible */}
            <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid var(--border-glass)' }}>
              <button
                type="button"
                onClick={() => setShowAdvancedTaxes(!showAdvancedTaxes)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  padding: 0
                }}
              >
                {showAdvancedTaxes ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                <span>¿Aplicar también ReteIVA (15% del IVA)? — Opcional</span>
              </button>

              {showAdvancedTaxes && (
                <div style={{ marginTop: '12px', background: 'rgba(255, 255, 255, 0.02)', padding: '15px', borderRadius: '8px', border: '1px solid var(--border-glass)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        disabled={montoIva === 0}
                        checked={applyReteIva && montoIva > 0}
                        onChange={(e) => setApplyReteIva(e.target.checked)}
                      />
                      <span>Aplicar ReteIVA (15% del IVA)</span>
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', width: '130px' }}>
                      <input
                        type="number"
                        step="1"
                        className="form-control"
                        disabled={!applyReteIva || montoIva === 0}
                        value={reteIvaRate}
                        onChange={(e) => setReteIvaRate(e.target.value)}
                        style={{ height: '32px', fontSize: '0.85rem', textAlign: 'right' }}
                      />
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>% IVA</span>
                    </div>
                  </div>
                  {applyReteIva && montoIva > 0 && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--primary-cyan)', textAlign: 'right' }}>
                      Descuento ReteIVA: -{formatCOP(montoReteIva)}
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>

          {/* Quick Informative Notes */}
          <div className="glass-panel" style={{ padding: '16px 20px', background: 'rgba(15, 23, 42, 0.45)', borderLeft: '3px solid #3b82f6' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <Info size={18} style={{ color: '#60a5fa', flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                <strong style={{ color: 'var(--text-primary)' }}>Normativa de Retenciones en Villavicencio:</strong>
                <p style={{ margin: '4px 0 0 0' }}>
                  En Villavicencio, el <strong>ReteICA es del 0.3%</strong> y la <strong>Retefuente general es del 2.5%</strong>. Ambas retenciones se liquidan siempre sobre el <strong>Valor Base antes de IVA</strong>.
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Live Calculation Results & Visual Flow */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Main Visual Result Card */}
          <div className="glass-panel" style={{
            padding: '30px',
            background: 'linear-gradient(145deg, rgba(17, 24, 39, 0.9) 0%, rgba(30, 41, 59, 0.7) 100%)',
            border: '1px solid rgba(255, 109, 0, 0.25)',
            boxShadow: 'var(--shadow-premium), 0 0 25px rgba(255, 109, 0, 0.1)'
          }}>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '25px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#10b981',
                  padding: '8px',
                  borderRadius: '10px'
                }}>
                  <Calculator size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>Resultado de la Liquidación</h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Cálculo en vivo con Retefuente {applyReteIca ? 'y ReteICA (0.3% Villavicencio)' : ''}</span>
                </div>
              </div>
              <span style={{
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#34d399',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '4px 10px',
                borderRadius: '999px',
                fontSize: '0.75rem',
                fontWeight: 700
              }}>
                ● En Vivo
              </span>
            </div>

            {/* Formula Step-by-Step Flow Chart */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '25px',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '10px', letterSpacing: '0.5px' }}>
                📐 Desglose Paso a Paso de la Fórmula
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem' }}>
                
                {/* Step 1: Valor - IVA = Base */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255, 255, 255, 0.02)', padding: '8px 12px', borderRadius: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ background: 'rgba(255, 255, 255, 0.1)', color: 'var(--text-secondary)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700 }}>Paso 1</span>
                    <span style={{ color: 'var(--text-secondary)' }}>Valor Factura ({formatCOP(valorTotalFacturado)}) - IVA ({formatCOP(montoIva)})</span>
                  </div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                    = Base (antes de IVA): {formatCOP(valorBase)}
                  </div>
                </div>

                {/* Step 2: Base * Rate = Retefuente */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255, 255, 255, 0.02)', padding: '8px 12px', borderRadius: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ background: 'rgba(255, 109, 0, 0.2)', color: '#FF6D00', padding: '2px 6px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700 }}>Paso 2</span>
                    <span style={{ color: 'var(--text-secondary)' }}>Retefuente: Base ({formatCOP(valorBase)}) × {currentRetePercent}%</span>
                  </div>
                  <div style={{ fontWeight: 700, color: '#FF6D00' }}>
                    = -{formatCOP(montoRetefuente)}
                  </div>
                </div>

                {/* Step 3 (Optional): ReteICA */}
                {applyReteIca && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', padding: '8px 12px', borderRadius: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ background: '#f59e0b', color: '#000', padding: '2px 6px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 800 }}>Paso 3</span>
                      <span style={{ color: '#fde68a' }}>ReteICA Villavicencio: Base ({formatCOP(valorBase)}) × {activeReteIcaRate}%</span>
                    </div>
                    <div style={{ fontWeight: 700, color: '#fbbf24' }}>
                      = -{formatCOP(montoReteIca)}
                    </div>
                  </div>
                )}

                {/* Step Final: Total a Pagar */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '8px 12px', borderRadius: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ background: '#10b981', color: '#000', padding: '2px 6px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 800 }}>{applyReteIca ? 'Paso 4' : 'Paso 3'}</span>
                    <span style={{ color: '#a7f3d0' }}>Base + IVA - Retefuente {applyReteIca ? '- ReteICA' : ''}</span>
                  </div>
                  <div style={{ fontWeight: 800, color: '#34d399' }}>
                    = {formatCOP(totalAPagar)}
                  </div>
                </div>

              </div>
            </div>

            {/* Prominent Calculation KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${applyReteIca ? '150px' : '180px'}, 1fr))`, gap: '15px', marginBottom: '25px' }}>
              
              {/* Card 1: Valor Base */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                padding: '16px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}>
                <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '6px' }}>
                  Base (Sin IVA)
                </div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {formatCOP(valorBase)}
                </div>
                <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Total antes de IVA
                </div>
              </div>

              {/* Card 2: Monto IVA */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                padding: '16px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}>
                <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '6px' }}>
                  IVA Descontado
                </div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#60a5fa' }}>
                  {formatCOP(montoIva)}
                </div>
                <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {ivaMode === 'no_iva' ? 'Operación sin IVA' : 'Impuesto discriminado'}
                </div>
              </div>

              {/* Card 3: Retefuente a Retener */}
              <div style={{
                background: 'rgba(255, 109, 0, 0.08)',
                padding: '16px',
                borderRadius: '10px',
                border: '1.5px solid rgba(255, 109, 0, 0.35)'
              }}>
                <div style={{ fontSize: '0.73rem', color: '#FF6D00', textTransform: 'uppercase', fontWeight: 700, marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Retefuente</span>
                  <span>{currentRetePercent}%</span>
                </div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#FF6D00' }}>
                  -{formatCOP(montoRetefuente)}
                </div>
                <div style={{ fontSize: '0.73rem', color: '#fda4af', marginTop: '4px' }}>
                  Descuento Retefuente
                </div>
              </div>

              {/* Card 4: ReteICA a Retener (if applied) */}
              {applyReteIca && (
                <div className="animate-fade-in" style={{
                  background: 'rgba(245, 158, 11, 0.08)',
                  padding: '16px',
                  borderRadius: '10px',
                  border: '1.5px solid rgba(245, 158, 11, 0.4)'
                }}>
                  <div style={{ fontSize: '0.73rem', color: '#fbbf24', textTransform: 'uppercase', fontWeight: 700, marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>ReteICA Villao</span>
                    <span>{activeReteIcaRate}%</span>
                  </div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fbbf24' }}>
                    -{formatCOP(montoReteIca)}
                  </div>
                  <div style={{ fontSize: '0.73rem', color: '#fde68a', marginTop: '4px' }}>
                    0.3% sobre la Base
                  </div>
                </div>
              )}

            </div>

            {/* Hero Big Payment Card */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.25) 100%)',
              border: '2px solid rgba(16, 185, 129, 0.5)',
              borderRadius: '16px',
              padding: '24px 28px',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: 'var(--glow-teal), 0 10px 30px rgba(0,0,0,0.4)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                <div>
                  <div style={{
                    fontSize: '0.85rem',
                    textTransform: 'uppercase',
                    color: '#a7f3d0',
                    fontWeight: 800,
                    letterSpacing: '1px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '6px'
                  }}>
                    <ShieldCheck size={18} /> LO QUE DEBES PAGARLE / TRANSFERIR A TU CLIENTE:
                  </div>
                  <div style={{
                    fontSize: '2.5rem',
                    fontWeight: 900,
                    color: '#ffffff',
                    letterSpacing: '-1px',
                    textShadow: '0 2px 10px rgba(0,0,0,0.5)'
                  }}>
                    {formatCOP(totalAPagar)}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#d1fae5', marginTop: '4px' }}>
                    Neto tras descontar Retefuente ({currentRetePercent}%)
                    {applyReteIca && ` y ReteICA Villavicencio (${activeReteIcaRate}% sobre la Base)`}
                    {montoReteIva > 0 && ' y ReteIVA'}.
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCopySummary}
                  className="btn"
                  style={{
                    background: '#ffffff',
                    color: '#064e3b',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    padding: '12px 20px',
                    borderRadius: '10px',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                    transition: 'var(--transition-smooth)'
                  }}
                >
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                  {copied ? '¡Copiado!' : 'Copiar Liquidación'}
                </button>
              </div>
            </div>

            {/* Full Summary Table */}
            <div style={{ marginTop: '25px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '10px', border: '1px solid var(--border-glass)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <tbody>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Valor Total Inicial (Facturado)</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: 'var(--text-primary)' }}>{formatCOP(valorTotalFacturado)}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>(-) Descuento de IVA</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: '#60a5fa' }}>-{formatCOP(montoIva)}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', background: 'rgba(255, 255, 255, 0.02)' }}>
                    <td style={{ padding: '12px 16px', color: 'var(--text-primary)', fontWeight: 700 }}>(=) Base Gravable (Total antes de IVA)</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 800, color: 'var(--text-primary)' }}>{formatCOP(valorBase)}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <td style={{ padding: '12px 16px', color: '#FF6D00', fontWeight: 600 }}>(-) Retención en la Fuente ({currentRetePercent}%)</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: '#FF6D00' }}>-{formatCOP(montoRetefuente)}</td>
                  </tr>
                  {applyReteIca && (
                    <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', background: 'rgba(245, 158, 11, 0.05)' }}>
                      <td style={{ padding: '12px 16px', color: '#fbbf24', fontWeight: 600 }}>(-) Retención ICA Villavicencio ({activeReteIcaRate}% sobre Base)</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: '#fbbf24' }}>-{formatCOP(montoReteIca)}</td>
                    </tr>
                  )}
                  {applyReteIva && montoIva > 0 && (
                    <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <td style={{ padding: '12px 16px', color: '#FF6D00' }}>(-) ReteIVA ({reteIvaRate}% del IVA)</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: '#FF6D00' }}>-{formatCOP(montoReteIva)}</td>
                    </tr>
                  )}
                  <tr style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
                    <td style={{ padding: '14px 16px', color: '#34d399', fontWeight: 800 }}>(=) TOTAL NETO A PAGAR</td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 900, fontSize: '1.05rem', color: '#34d399' }}>{formatCOP(totalAPagar)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

          </div>

        </div>

      </div>

      {/* BOTTOM SECTION: History of Saved Liquidations */}
      <div className="glass-panel" style={{ padding: '25px', marginTop: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.08)',
              color: 'var(--text-primary)',
              padding: '8px',
              borderRadius: '8px'
            }}>
              <Clock size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Historial de Liquidaciones Guardadas</h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Consulta o recarga liquidaciones anteriores de retención</span>
            </div>
          </div>

          {history.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="btn btn-secondary"
              style={{ fontSize: '0.8rem', color: 'var(--primary-red)', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Trash2 size={14} /> Vaciar Historial
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', background: 'rgba(255, 255, 255, 0.01)', borderRadius: '10px', border: '1px dashed var(--border-glass)' }}>
            <FileText size={36} style={{ color: 'var(--text-muted)', marginBottom: '10px', opacity: 0.5 }} />
            <p style={{ margin: '0 0 5px 0', fontWeight: 600, color: 'var(--text-secondary)' }}>Aún no hay liquidaciones guardadas</p>
            <p style={{ margin: 0, fontSize: '0.8rem' }}>Haz una liquidación arriba y presiona "Guardar" para conservarla en este historial.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-glass)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '12px 14px' }}>Fecha</th>
                  <th style={{ padding: '12px 14px' }}>Beneficiario / Proveedor</th>
                  <th style={{ padding: '12px 14px' }}>Concepto</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>Total Facturado</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>Base (antes IVA)</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>Retefuente</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>ReteICA</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>Neto Pagado</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', transition: 'background 0.2s' }} className="table-row-hover">
                    <td style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>{item.date}</td>
                    <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {item.beneficiary}
                      {item.docNumber && <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)' }}>NIT: {item.docNumber}</span>}
                    </td>
                    <td style={{ padding: '12px 14px', color: 'var(--text-secondary)', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.concept}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', color: 'var(--text-primary)' }}>{formatCOP(item.valorTotal)}</td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', color: 'var(--text-primary)' }}>{formatCOP(item.valorBase)}</td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', color: '#FF6D00', fontWeight: 700 }}>
                      -{formatCOP(item.montoRetefuente)}
                      <span style={{ fontSize: '0.7rem', display: 'block', color: 'var(--text-muted)' }}>({item.reteRate}%)</span>
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', color: item.applyReteIca ? '#fbbf24' : 'var(--text-muted)', fontWeight: item.applyReteIca ? 700 : 400 }}>
                      {item.applyReteIca ? `-${formatCOP(item.montoReteIca)}` : 'No'}
                      {item.applyReteIca && <span style={{ fontSize: '0.7rem', display: 'block', color: 'var(--text-muted)' }}>({item.reteIcaRate}%)</span>}
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', color: '#34d399', fontWeight: 800 }}>{formatCOP(item.totalAPagar)}</td>
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => handleLoadRecord(item)}
                          className="btn-icon"
                          style={{ padding: '6px', borderRadius: '6px' }}
                          title="Cargar en la calculadora"
                        >
                          <RotateCcw size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteRecord(item.id)}
                          className="btn-icon"
                          style={{ padding: '6px', borderRadius: '6px', color: 'var(--primary-red)' }}
                          title="Eliminar registro"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PRINTABLE COMPROBANTE MODAL */}
      {showPrintModal && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 999999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          boxSizing: 'border-box'
        }}>
          <div className="modal-content" style={{
            maxWidth: '800px',
            width: '100%',
            background: 'var(--bg-secondary)',
            borderRadius: '16px',
            border: '1px solid var(--border-glass)',
            boxShadow: '0 25px 50px rgba(0,0,0,0.6)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '90vh'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '16px 24px',
              borderBottom: '1px solid var(--border-glass)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Printer size={20} style={{ color: '#FF6D00' }} />
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-primary)' }}>
                  Comprobante Oficial de Retenciones
                </h3>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => window.print()}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
                >
                  <Printer size={16} /> Imprimir / PDF
                </button>
                <button
                  type="button"
                  onClick={() => setShowPrintModal(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px' }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body - Printable Paper */}
            <div style={{ padding: '25px', overflowY: 'auto' }}>
              <div className="printable-area receipt-container" style={{
                background: '#ffffff',
                color: '#111827',
                padding: '35px',
                borderRadius: '8px',
                fontFamily: 'Arial, sans-serif'
              }}>
                
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #FF6D00', paddingBottom: '20px', marginBottom: '20px' }}>
                  <div>
                    <img src="/logo.png" alt="Logo HABITECH SAS" style={{ height: '65px', objectFit: 'contain', marginBottom: '8px' }} />
                    <div style={{ fontSize: '0.8rem', color: '#4b5563', lineHeight: '1.3' }}>
                      <strong>GRUPO EMPRESARIAL HABITECH SAS</strong><br />
                      NIT: 902067080-1<br />
                      Km 4 vía Villavicencio - Acacías, Lote 1 Barrio La Nohora<br />
                      Celular: 3124147911 • Villavicencio - Meta
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827', textTransform: 'uppercase' }}>
                      COMPROBANTE DE RETENCIONES
                    </div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#FF6D00', marginTop: '4px' }}>
                      N° RET-{Date.now().toString().slice(-6)}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#4b5563', marginTop: '8px' }}>
                      <strong>Fecha de Emisión:</strong> {new Date().toLocaleDateString('es-CO')}
                    </div>
                  </div>
                </div>

                {/* Beneficiary Info */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', background: '#f9fafb', padding: '15px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.85rem' }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 700 }}>BENEFICIARIO / PROVEEDOR:</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: '#111827', marginTop: '2px' }}>
                      {beneficiary || 'Cliente / Proveedor General'}
                    </div>
                    {docNumber && <div style={{ color: '#4b5563', marginTop: '2px' }}><strong>NIT / CC:</strong> {docNumber}</div>}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 700 }}>CONCEPTO / REFERENCIA:</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#111827', marginTop: '2px' }}>
                      {concept || 'Liquidación por compras / servicios de obra'}
                    </div>
                    <div style={{ color: '#4b5563', marginTop: '2px' }}>
                      <strong>Tarifas:</strong> Retefuente ({currentRetePercent}%){applyReteIca ? ` • ReteICA Villavicencio (${activeReteIcaRate}% sobre Base)` : ''}
                    </div>
                  </div>
                </div>

                {/* Table of Breakdown */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '25px', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ background: '#111827', color: '#ffffff', textAlign: 'left' }}>
                      <th style={{ padding: '10px 14px' }}>Concepto Liquidado</th>
                      <th style={{ padding: '10px 14px', textAlign: 'right' }}>Monto (COP)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '10px 14px', color: '#374151' }}>Valor Total Facturado</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600, color: '#111827' }}>{formatCOP(valorTotalFacturado)}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #e5e7eb', color: '#6b7280' }}>
                      <td style={{ padding: '10px 14px' }}>(-) IVA Descontado para Base Gravable</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600, color: '#2563eb' }}>-{formatCOP(montoIva)}</td>
                    </tr>
                    <tr style={{ borderBottom: '2px solid #111827', background: '#f3f4f6' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 700, color: '#111827' }}>(=) Base Gravable (Total antes de IVA)</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 800, color: '#111827' }}>{formatCOP(valorBase)}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #e5e7eb', background: '#fff7ed' }}>
                      <td style={{ padding: '10px 14px', color: '#c2410c', fontWeight: 600 }}>(-) Retención en la Fuente ({currentRetePercent}%)</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: '#c2410c' }}>-{formatCOP(montoRetefuente)}</td>
                    </tr>
                    {applyReteIca && (
                      <tr style={{ borderBottom: '1px solid #e5e7eb', background: '#fefce8' }}>
                        <td style={{ padding: '10px 14px', color: '#b45309', fontWeight: 600 }}>(-) Retención ICA Villavicencio ({activeReteIcaRate}% sobre Base antes de IVA)</td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: '#b45309' }}>-{formatCOP(montoReteIca)}</td>
                      </tr>
                    )}
                    {applyReteIva && montoIva > 0 && (
                      <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '10px 14px', color: '#c2410c' }}>(-) Retención de IVA ({reteIvaRate}%)</td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600, color: '#c2410c' }}>-{formatCOP(montoReteIva)}</td>
                      </tr>
                    )}
                    <tr style={{ background: '#ecfdf5', borderTop: '2px solid #059669' }}>
                      <td style={{ padding: '14px 14px', fontWeight: 800, color: '#065f46', fontSize: '1.05rem' }}>
                        (=) TOTAL NETO A PAGAR / GIRAR
                      </td>
                      <td style={{ padding: '14px 14px', textAlign: 'right', fontWeight: 900, color: '#065f46', fontSize: '1.2rem' }}>
                        {formatCOP(totalAPagar)}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Signatures */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginTop: '60px', paddingTop: '20px' }}>
                  <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ height: '55px', borderBottom: '1px solid #9ca3af', marginBottom: '10px', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', width: '100%', position: 'relative' }}>
                      <img 
                        src="/firma_representante.png" 
                        alt="Firma Representante Legal" 
                        style={{ maxHeight: '80px', position: 'absolute', bottom: '-15px', mixBlendMode: 'multiply' }} 
                      />
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Dumar Aponte Ramirez</div>
                    <div style={{ fontSize: '0.75rem', color: '#4b5563' }}>C.C. 1121918601 / Rep. Legal - Habitech SAS</div>
                  </div>
                  <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ height: '55px', borderBottom: '1px solid #9ca3af', marginBottom: '10px', width: '100%' }}></div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{beneficiary || 'Firma Beneficiario / Proveedor'}</div>
                    <div style={{ fontSize: '0.75rem', color: '#4b5563' }}>{docNumber ? `C.C. / NIT ${docNumber}` : 'Recibido Conforme'}</div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
