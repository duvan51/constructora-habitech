import React, { useState, useEffect } from 'react';
import { Calculator, Save, Edit, Trash2, Plus, FileText, Printer, Undo, Image, X, RotateCcw, Layers } from 'lucide-react';

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

/**
 * Subcomponent to render paginated Letter sheets (Tamaño Carta)
 * Handles 1, 2 or 3 pages depending on concepts length and blueprint attachment
 */
function QuoteDocument({
  quoteNumber,
  clientData,
  quoteMode,
  finishType,
  getFinishTypeLabel,
  houseArea,
  houseDims,
  printedHouseRate,
  printedHouseSubtotal,
  includeSlab,
  slabArea,
  slabDims,
  printedSlabRate,
  printedSlabSubtotal,
  includeCorridors,
  corridorArea,
  corridorDims,
  printedCorridorRate,
  printedCorridorSubtotal,
  includeStairs,
  stairsCount,
  stairsQty,
  printedStairsRate,
  printedStairsSubtotal,
  concepts,
  factor,
  subtotalBeforeDiscount,
  discountPercent,
  discountVal,
  totalQuote,
  notes,
  blueprintImg,
  formatCurrency,
  showDividerBadges = true
}) {
  const activeConcepts = quoteMode === 'concepts' ? concepts.filter(c => c.included) : [];
  const isMultiPageConcepts = quoteMode === 'concepts' && activeConcepts.length > 6;
  
  const conceptsPage1 = isMultiPageConcepts ? activeConcepts.slice(0, 6) : activeConcepts;
  const conceptsPage2 = isMultiPageConcepts ? activeConcepts.slice(6) : [];

  const quotePagesCount = isMultiPageConcepts ? 2 : 1;
  const totalPages = quotePagesCount + (blueprintImg ? 1 : 0);

  // Common Header (Page 1)
  const renderPrimaryHeader = () => (
    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2.5px solid #0f172a', paddingBottom: '14px', marginBottom: '16px' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '6px' }}>
          <img src="/logo.png" alt="Logo HABITECH" style={{ height: '62px', objectFit: 'contain' }} />
        </div>
        <div style={{ fontSize: '0.75rem', color: '#475569', lineHeight: '1.35', fontWeight: 500 }}>
          <strong style={{ color: '#0f172a', fontSize: '0.8rem' }}>Grupo empresarial habitech sas</strong><br />
          NIT: 902067080-1<br />
          Dirección: km 4 via villavicencio acacias, lote 1 barrio la nohora<br />
          Celular: 3124147911 • Villavicencio - Meta
        </div>
      </div>
      <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>PRESUPUESTO DE OBRA</div>
          <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#FF6D00', marginTop: '2px', letterSpacing: '0.5px' }}>
            {quoteNumber}
          </div>
        </div>
        <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '6px' }}>
          <div><strong>Fecha de Emisión:</strong> {clientData.date || new Date().toISOString().split('T')[0]}</div>
          <div><strong>Validez de Oferta:</strong> 30 días calendario</div>
        </div>
      </div>
    </div>
  );

  // Continuation Header (Page 2+)
  const renderContinuationHeader = (subtitle) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '10px', marginBottom: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <img src="/logo.png" alt="Logo HABITECH" style={{ height: '38px', objectFit: 'contain' }} />
        <div>
          <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>Grupo empresarial habitech sas</div>
          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>NIT: 902067080-1 • Cel: 3124147911</div>
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#FF6D00' }}>{quoteNumber}</div>
        <div style={{ fontSize: '0.7rem', color: '#475569' }}>
          <strong>{subtitle || 'Continuación de Presupuesto'}</strong> | {clientData.name || 'Cliente'}
        </div>
      </div>
    </div>
  );

  // Client Info Box
  const renderClientBox = () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px' }}>
      <div>
        <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>COTIZADO A (CLIENTE)</div>
        <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a' }}>{clientData.name || '(Sin Nombre Registrado)'}</div>
        <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: '2px' }}>
          <strong>Celular:</strong> {clientData.phone || '(No registrado)'}
        </div>
      </div>
      <div>
        <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>DETALLES DEL PROYECTO / DESTINO</div>
        <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a' }}>{clientData.project || '(Sin Destino Especificado)'}</div>
        <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: '2px' }}>
          <strong>Ubicación:</strong> Colombia
        </div>
      </div>
    </div>
  );

  // Running Footer on every page
  const renderPageFooter = (pageNum) => (
    <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: '10px', marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: '#64748b' }}>
      <div>
        <strong style={{ color: '#334155' }}>Habitech Constructor</strong> • Excelencia y Calidad en Construcción
      </div>
      <div style={{ textAlign: 'center' }}>
        NIT 902067080-1 • Villavicencio - Meta
      </div>
      <div style={{ fontWeight: 700, color: '#0f172a', background: '#f1f5f9', padding: '2px 8px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
        Hoja {pageNum} de {totalPages}
      </div>
    </div>
  );

  // Watermark Component
  const renderWatermark = () => (
    <div style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%) rotate(-15deg)',
      opacity: 0.035,
      pointerEvents: 'none',
      zIndex: 0,
      width: '380px',
      height: '380px',
      backgroundImage: 'url(/logo.png)',
      backgroundSize: 'contain',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    }} />
  );

  // Financials & Signatures section
  const renderFinancialsAndSignatures = () => (
    <div style={{ marginTop: 'auto' }}>
      {/* Totals Box */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '14px' }}>
        <div style={{ width: '100%', maxWidth: '300px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '0.8rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
            <span>Subtotal Cotización:</span>
            <span style={{ fontWeight: 600 }}>{formatCurrency(subtotalBeforeDiscount)}</span>
          </div>
          {parseFloat(discountPercent) > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669', fontWeight: 600 }}>
              <span>Descuento Comercial ({discountPercent}%):</span>
              <span>- {formatCurrency(discountVal)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.02rem', fontWeight: 800, borderTop: '1.5px solid #0f172a', paddingTop: '6px', marginTop: '2px', color: '#0f172a' }}>
            <span>TOTAL ESTIMADO:</span>
            <span style={{ color: '#FF6D00' }}>{formatCurrency(totalQuote)}</span>
          </div>
        </div>
      </div>

      {/* Conditions */}
      <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '8px', marginBottom: '16px' }}>
        <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', marginBottom: '3px' }}>CONDICIONES DE CONTRATACIÓN Y GARANTÍAS</div>
        <p style={{ fontSize: '0.73rem', color: '#475569', lineHeight: '1.35', margin: 0, whiteSpace: 'pre-wrap' }}>
          {notes}
        </p>
      </div>

      {/* Signatures */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '12px', padding: '0 10px' }}>
        <div style={{ width: '44%', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ height: '48px', borderBottom: '1.5px solid #94a3b8', marginBottom: '4px', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', width: '100%', position: 'relative' }}>
            <img 
              src="/firma_representante.png" 
              alt="Firma Autorizada" 
              style={{ maxHeight: '58px', position: 'absolute', bottom: '-8px', mixBlendMode: 'multiply' }} 
            />
          </div>
          <div style={{ fontWeight: 700, fontSize: '0.76rem', color: '#0f172a' }}>Grupo empresarial habitech sas</div>
          <div style={{ fontSize: '0.66rem', color: '#64748b' }}>Firma Autorizada de la Constructora</div>
        </div>
        
        <div style={{ width: '44%', textAlign: 'center' }}>
          <div style={{ height: '48px', borderBottom: '1.5px solid #94a3b8', marginBottom: '4px' }}></div>
          <div style={{ fontWeight: 700, fontSize: '0.76rem', color: '#0f172a' }}>Aceptación del Cliente</div>
          <div style={{ fontSize: '0.66rem', color: '#64748b' }}>Firma y Cédula de Ciudadanía</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="quote-sheet-container printable-area">
      
      {/* ---------------------------------------------------- */}
      {/* SHEET 1: Main Quote Sheet (Presupuesto Principal)    */}
      {/* ---------------------------------------------------- */}
      {showDividerBadges && (
        <div className="page-divider-badge no-print">
          <Layers size={13} /> Hoja 1 de {totalPages} — Presupuesto Principal (Tamaño Carta)
        </div>
      )}
      
      <div className="quote-sheet-page">
        {renderWatermark()}
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          {renderPrimaryHeader()}
          {renderClientBox()}

          {/* Table of items (Page 1) */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '14px', fontSize: '0.8rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1', color: '#0f172a' }}>
                <th style={{ padding: '8px 10px', fontWeight: 700 }}>Descripción de la Actividad / Renglón</th>
                {quoteMode === 'm2' && <th style={{ padding: '8px 10px', fontWeight: 700, textAlign: 'center' }}>Medidas / Cantidad</th>}
                {quoteMode === 'm2' && <th style={{ padding: '8px 10px', fontWeight: 700, textAlign: 'right' }}>Valor Unitario</th>}
                <th style={{ padding: '8px 10px', fontWeight: 700, textAlign: 'right' }}>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {/* Mode A: Area M2 rows */}
              {quoteMode === 'm2' && (
                <>
                  {houseArea > 0 && (
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '10px' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>Área de Vivienda ({getFinishTypeLabel(finishType)})</div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Construcción principal en metros cuadrados</div>
                      </td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        {houseDims.width && houseDims.length ? `${houseDims.width}m x ${houseDims.length}m` : ''} ({houseDims.area} m²)
                      </td>
                      <td style={{ padding: '10px', textAlign: 'right' }}>{formatCurrency(printedHouseRate)}</td>
                      <td style={{ padding: '10px', textAlign: 'right', fontWeight: 700 }}>{formatCurrency(printedHouseSubtotal)}</td>
                    </tr>
                  )}

                  {includeSlab && slabArea > 0 && (
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '10px' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>Placa de Niveles / Entrepiso</div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Cimentación aérea para pisos superiores</div>
                      </td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        {slabDims.width && slabDims.length ? `${slabDims.width}m x ${slabDims.length}m` : ''} ({slabDims.area} m²)
                      </td>
                      <td style={{ padding: '10px', textAlign: 'right' }}>{formatCurrency(printedSlabRate)}</td>
                      <td style={{ padding: '10px', textAlign: 'right', fontWeight: 700 }}>{formatCurrency(printedSlabSubtotal)}</td>
                    </tr>
                  )}

                  {includeCorridors && corridorArea > 0 && (
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '10px' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>Corredores Exteriores</div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Pasillos perimetrales transitables</div>
                      </td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        {corridorDims.width && corridorDims.length ? `${corridorDims.width}m x ${corridorDims.length}m` : ''} ({corridorDims.area} m²)
                      </td>
                      <td style={{ padding: '10px', textAlign: 'right' }}>{formatCurrency(printedCorridorRate)}</td>
                      <td style={{ padding: '10px', textAlign: 'right', fontWeight: 700 }}>{formatCurrency(printedCorridorSubtotal)}</td>
                    </tr>
                  )}

                  {includeStairs && stairsCount > 0 && (
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '10px' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>Escalera de Niveles</div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Conectores de niveles en concreto o metal</div>
                      </td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>{stairsQty} Unidad(es)</td>
                      <td style={{ padding: '10px', textAlign: 'right' }}>{formatCurrency(printedStairsRate)}</td>
                      <td style={{ padding: '10px', textAlign: 'right', fontWeight: 700 }}>{formatCurrency(printedStairsSubtotal)}</td>
                    </tr>
                  )}
                </>
              )}

              {/* Mode B: Custom Concepts Rows (Page 1 Batch) */}
              {quoteMode === 'concepts' && (
                <>
                  {conceptsPage1.map((concept, idx) => (
                    <tr key={concept.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '9px 10px' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{idx + 1}. {concept.name}</div>
                      </td>
                      <td style={{ padding: '9px 10px', textAlign: 'right', fontWeight: 700 }}>
                        {formatCurrency(Math.round(concept.amount * factor))}
                      </td>
                    </tr>
                  ))}
                </>
              )}

              {subtotalBeforeDiscount === 0 && (
                <tr>
                  <td colSpan={quoteMode === 'm2' ? 4 : 2} style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                    Sin conceptos registrados. Configura los valores en el panel de edición.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* If Multi-page concepts, render page-break indicator */}
          {isMultiPageConcepts && (
            <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '6px', padding: '8px 12px', textAlign: 'center', fontSize: '0.75rem', color: '#475569', marginTop: '10px' }}>
              <strong>Continúa en la Hoja 2...</strong> (Desglose de actividades adicionales, totales financieros y firmas)
            </div>
          )}
        </div>

        {/* If Single Page Quote, render Financials and Signatures right on Page 1 */}
        {!isMultiPageConcepts && (
          <div style={{ position: 'relative', zIndex: 1 }}>
            {renderFinancialsAndSignatures()}
          </div>
        )}

        {/* Page Footer */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          {renderPageFooter(1)}
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* SHEET 2 (Optional): Concepts Overflow Continuation   */}
      {/* ---------------------------------------------------- */}
      {isMultiPageConcepts && (
        <>
          {showDividerBadges && (
            <div className="page-divider-badge no-print" style={{ marginTop: '10px' }}>
              <Layers size={13} /> Hoja 2 de {totalPages} — Continuación de Presupuesto y Firmas
            </div>
          )}
          
          <div className="quote-sheet-page">
            {renderWatermark()}
            
            <div style={{ position: 'relative', zIndex: 1 }}>
              {renderContinuationHeader('Desglose de Actividades (Parte 2)')}
              
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '14px', fontSize: '0.8rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1', color: '#0f172a' }}>
                    <th style={{ padding: '8px 10px', fontWeight: 700 }}>Descripción de la Actividad / Renglón (Continuación)</th>
                    <th style={{ padding: '8px 10px', fontWeight: 700, textAlign: 'right' }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {conceptsPage2.map((concept, idx) => (
                    <tr key={concept.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '9px 10px' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{idx + 7}. {concept.name}</div>
                      </td>
                      <td style={{ padding: '9px 10px', textAlign: 'right', fontWeight: 700 }}>
                        {formatCurrency(Math.round(concept.amount * factor))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ position: 'relative', zIndex: 1 }}>
              {renderFinancialsAndSignatures()}
            </div>

            <div style={{ position: 'relative', zIndex: 1 }}>
              {renderPageFooter(2)}
            </div>
          </div>
        </>
      )}

      {/* ---------------------------------------------------- */}
      {/* SHEET N (Optional): Blueprint Architectural Annex    */}
      {/* ---------------------------------------------------- */}
      {blueprintImg && (
        <>
          {showDividerBadges && (
            <div className="page-divider-badge no-print" style={{ marginTop: '10px' }}>
              <Layers size={13} /> Hoja {totalPages} de {totalPages} — Anexo Técnico: Plano de Obra
            </div>
          )}
          
          <div className="quote-sheet-page">
            {renderWatermark()}
            
            <div style={{ position: 'relative', zIndex: 1 }}>
              {renderContinuationHeader('ANEXO TÉCNICO: PLANO ARQUITECTÓNICO')}

              <div style={{ textAlign: 'center', marginBottom: '14px' }}>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '-0.3px' }}>
                  Plano Arquitectónico y Distribución Espacial
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                  Proyecto: <strong>{clientData.project || 'Vivienda'}</strong> | Cotizado a: <strong>{clientData.name || 'Cliente'}</strong>
                </div>
              </div>

              {/* Blueprint Frame Container */}
              <div style={{ 
                border: '1.5px solid #cbd5e1', 
                borderRadius: '10px', 
                padding: '12px', 
                background: '#f8fafc', 
                textAlign: 'center', 
                minHeight: '440px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '14px',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
              }}>
                <img 
                  src={blueprintImg} 
                  alt="Plano de Construcción" 
                  style={{ maxWidth: '100%', maxHeight: '460px', objectFit: 'contain', display: 'block', margin: 'auto' }} 
                />
              </div>

              {/* Architectural Technical Note */}
              <div style={{ background: '#f1f5f9', borderLeft: '3px solid #FF6D00', padding: '8px 12px', borderRadius: '0 6px 6px 0', marginBottom: '20px' }}>
                <div style={{ fontSize: '0.72rem', color: '#334155', lineHeight: '1.4' }}>
                  <strong>Nota Técnica:</strong> El presente plano arquitectónico define la distribución, cotas y especificaciones espaciales de la obra cotizada, y constituye anexo técnico vinculante e integral del presupuesto <strong>{quoteNumber}</strong>.
                </div>
              </div>

              {/* Signatures for Plan Approval */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '0 10px', marginBottom: '10px' }}>
                <div style={{ width: '44%', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ height: '45px', borderBottom: '1.5px solid #94a3b8', marginBottom: '4px', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', width: '100%', position: 'relative' }}>
                    <img 
                      src="/firma_representante.png" 
                      alt="Firma Autorizada" 
                      style={{ maxHeight: '55px', position: 'absolute', bottom: '-8px', mixBlendMode: 'multiply' }} 
                    />
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.75rem', color: '#0f172a' }}>Dirección Técnica Habitech</div>
                  <div style={{ fontSize: '0.65rem', color: '#64748b' }}>Aprobación de Diseño y Planos</div>
                </div>
                
                <div style={{ width: '44%', textAlign: 'center' }}>
                  <div style={{ height: '45px', borderBottom: '1.5px solid #94a3b8', marginBottom: '4px' }}></div>
                  <div style={{ fontWeight: 700, fontSize: '0.75rem', color: '#0f172a' }}>Aprobación del Cliente</div>
                  <div style={{ fontSize: '0.65rem', color: '#64748b' }}>Conformidad con Distribución Arquitectónica</div>
                </div>
              </div>
            </div>

            <div style={{ position: 'relative', zIndex: 1 }}>
              {renderPageFooter(totalPages)}
            </div>
          </div>
        </>
      )}

    </div>
  );
}

export default function QuoteCalculator() {
  // Base prices (stored in localStorage)
  const [prices, setPrices] = useState(() => {
    const saved = localStorage.getItem('habitech_quote_prices');
    return saved ? JSON.parse(saved) : DEFAULT_PRICES;
  });

  const [isEditingPrices, setIsEditingPrices] = useState(false);
  const [tempPrices, setTempPrices] = useState({ ...prices });

  // Persistent Quote Number
  const [quoteNumber, setQuoteNumber] = useState(() => 'COT-' + Math.floor(100000 + Math.random() * 900000));

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
  const [notes, setNotes] = useState('Garantía de construcción de 5 años estructural. Validez de esta cotización de 30 días calendario.');

  // Modal open state for printing
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Saved quotes history
  const [savedQuotes, setSavedQuotes] = useState(() => {
    const saved = localStorage.getItem('habitech_saved_quotes');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('habitech_saved_quotes', JSON.stringify(savedQuotes));
  }, [savedQuotes]);

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

  // Reset entire quote to start fresh
  const handleNewQuote = async () => {
    if (await window.confirmDialog('¿Crear una nueva cotización en blanco? Se generará un nuevo número de presupuesto.')) {
      setQuoteNumber('COT-' + Math.floor(100000 + Math.random() * 900000));
      setClientData({
        name: '',
        phone: '',
        project: '',
        date: new Date().toISOString().split('T')[0]
      });
      setHouseDims({ width: '', length: '', area: '' });
      setSlabDims({ width: '', length: '', area: '' });
      setCorridorDims({ width: '', length: '', area: '' });
      setIncludeSlab(false);
      setIncludeCorridors(false);
      setIncludeStairs(false);
      setStairsQty('1');
      setDiscountPercent('0');
      setAdjustmentAmount('0');
      setBlueprintImg(null);
    }
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

  const handleSaveQuote = () => {
    if (!clientData.name || !clientData.project) {
      alert('Por favor ingresa al menos el nombre del cliente y proyecto.');
      return;
    }
    const newQuote = {
      id: 'q_' + Date.now(),
      quoteNumber,
      savedAt: new Date().toISOString(),
      clientData,
      quoteMode,
      finishType,
      houseAreaMode,
      houseDims,
      includeSlab,
      slabAreaMode,
      slabDims,
      includeCorridors,
      corridorAreaMode,
      corridorDims,
      includeStairs,
      stairsQty,
      concepts,
      discountPercent,
      adjustmentAmount,
      notes,
      blueprintImg,
      totalQuote
    };
    setSavedQuotes(prev => [newQuote, ...prev]);
    alert('Cotización guardada exitosamente en el historial local.');
  };

  const handleLoadQuote = async (q) => {
    if (await window.confirmDialog('¿Cargar esta cotización? Se perderán los datos actuales no guardados.')) {
      setQuoteNumber(q.quoteNumber || ('COT-' + q.id.substring(2, 8)));
      setClientData(q.clientData);
      setQuoteMode(q.quoteMode);
      setFinishType(q.finishType);
      setHouseAreaMode(q.houseAreaMode);
      setHouseDims(q.houseDims);
      setIncludeSlab(q.includeSlab);
      setSlabAreaMode(q.slabAreaMode);
      setSlabDims(q.slabDims);
      setIncludeCorridors(q.includeCorridors);
      setCorridorAreaMode(q.corridorAreaMode);
      setCorridorDims(q.corridorDims);
      setIncludeStairs(q.includeStairs);
      setStairsQty(q.stairsQty);
      setConcepts(q.concepts || INITIAL_CONCEPTS);
      setDiscountPercent(q.discountPercent);
      setAdjustmentAmount(q.adjustmentAmount);
      setNotes(q.notes);
      setBlueprintImg(q.blueprintImg || null);
      setShowHistoryModal(false);
    }
  };

  const handleDeleteQuote = async (id) => {
    if (await window.confirmDialog('¿Eliminar esta cotización guardada?')) {
      setSavedQuotes(prev => prev.filter(q => q.id !== id));
    }
  };

  const quoteDocumentProps = {
    quoteNumber,
    clientData,
    quoteMode,
    finishType,
    getFinishTypeLabel,
    houseArea,
    houseDims,
    printedHouseRate,
    printedHouseSubtotal,
    includeSlab,
    slabArea,
    slabDims,
    printedSlabRate,
    printedSlabSubtotal,
    includeCorridors,
    corridorArea,
    corridorDims,
    printedCorridorRate,
    printedCorridorSubtotal,
    includeStairs,
    stairsCount,
    stairsQty,
    printedStairsRate,
    printedStairsSubtotal,
    concepts,
    factor,
    subtotalBeforeDiscount,
    discountPercent,
    discountVal,
    totalQuote,
    notes,
    blueprintImg,
    formatCurrency
  };

  return (
    <div className="quote-calculator-view animate-fade-in">
      
      {/* ACTION TOP BAR */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1>Cotizador de Construcción</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
            Genera cotizaciones profesionales divididas en hojas tamaño <strong>Carta (Letter)</strong> sin cortes ni pérdidas de formato.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            type="button"
            className="btn btn-secondary" 
            onClick={handleNewQuote}
            title="Crear nueva cotización en blanco"
          >
            <RotateCcw size={16} /> Nueva
          </button>
          <button 
            type="button"
            className="btn btn-secondary" 
            onClick={() => setShowHistoryModal(true)}
          >
            <FileText size={16} /> Historial ({savedQuotes.length})
          </button>
          <button 
            type="button"
            className="btn btn-secondary" 
            onClick={() => {
              setTempPrices({ ...prices });
              setIsEditingPrices(!isEditingPrices);
            }}
          >
            <Edit size={16} /> {isEditingPrices ? 'Cerrar Precios' : 'Precios M²'}
          </button>
          <button 
            type="button"
            className="btn btn-primary" 
            onClick={handleSaveQuote} 
            disabled={subtotalBeforeDiscount === 0} 
            style={{ background: 'var(--primary-teal)' }}
          >
            <Save size={16} /> Guardar
          </button>
          <button 
            type="button"
            className="btn btn-primary" 
            onClick={() => setShowPrintModal(true)} 
            disabled={subtotalBeforeDiscount === 0}
          >
            <Printer size={16} /> Imprimir / PDF
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
      <div className="grid-2 no-print" style={{ alignItems: 'flex-start', gap: '25px' }}>
        
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

          {/* Client Info */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '8px' }}>
              <h3 style={{ fontSize: '1rem' }}>Información del Cliente y Proyecto</h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--primary-orange)', fontWeight: 700 }}>
                {quoteNumber}
              </span>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Nombre del Cliente</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ej. Duvan Cardona"
                  value={clientData.name}
                  onChange={(e) => setClientData({ ...clientData, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Teléfono / Celular</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ej. 312 414 7911"
                  value={clientData.phone}
                  onChange={(e) => setClientData({ ...clientData, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Destino / Nombre del Proyecto</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ej. Casa Campestre La Nohora"
                  value={clientData.project}
                  onChange={(e) => setClientData({ ...clientData, project: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Fecha de Emisión</label>
                <input
                  type="date"
                  className="form-control"
                  value={clientData.date}
                  onChange={(e) => setClientData({ ...clientData, date: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Plan/Blueprint Upload */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '8px' }}>
              <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Image size={18} style={{ color: 'var(--primary-cyan)' }} />
                Plano Arquitectónico (Hoja Anexo Técnico)
              </h3>
              {blueprintImg && (
                <span className="badge" style={{ background: 'var(--primary-teal)', color: '#000', fontSize: '0.7rem' }}>
                  Adjunto (+1 Hoja)
                </span>
              )}
            </div>

            {blueprintImg ? (
              <div style={{ position: 'relative', border: '1px solid var(--border-glass)', borderRadius: '8px', overflow: 'hidden', height: '160px', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={blueprintImg} alt="Plano Subido" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                <button
                  type="button"
                  style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(239,68,68,0.85)', color: '#fff', border: 'none', borderRadius: '50%', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  onClick={removeBlueprint}
                  title="Eliminar plano"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <label 
                htmlFor="blueprint-upload-input" 
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  border: '2px dashed var(--border-glass)', 
                  borderRadius: '8px', 
                  padding: '24px', 
                  cursor: 'pointer', 
                  background: 'rgba(255,255,255,0.01)',
                  transition: 'border-color 0.2s'
                }}
              >
                <Image size={28} style={{ color: 'var(--text-muted)', marginBottom: '8px' }} />
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary-cyan)' }}>Subir Plano de la Obra</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>PNG, JPG o SVG (Se generará automáticamente como una hoja independiente de plano)</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  id="blueprint-upload-input" 
                  style={{ display: 'none' }} 
                  onChange={handleBlueprintUpload}
                />
              </label>
            )}
          </div>

          {/* MODE A: Area Inputs */}
          {quoteMode === 'm2' && (
            <>
              <div className="glass-panel" style={{ padding: '20px' }}>
                <h3 style={{ marginBottom: '15px', fontSize: '1rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '8px' }}>
                  Área Principal de Construcción (Vivienda)
                </h3>

                <div className="form-group">
                  <label>Tipo de Acabado / Sistema</label>
                  <select
                    className="form-control"
                    value={finishType}
                    onChange={(e) => setFinishType(e.target.value)}
                  >
                    <option value="obra_blanca_tradicional">Obra Blanca Tradicional ({formatCurrency(prices.obra_blanca_tradicional)}/m²)</option>
                    <option value="obra_gris_tradicional">Obra Gris Tradicional ({formatCurrency(prices.obra_gris_tradicional)}/m²)</option>
                    <option value="obra_negra_tradicional">Obra Negra Tradicional ({formatCurrency(prices.obra_negra_tradicional)}/m²)</option>
                    <option value="obra_blanca_prefabricado">Obra Blanca Prefabricado ({formatCurrency(prices.obra_blanca_prefabricado)}/m²)</option>
                    <option value="obra_gris_prefabricado">Obra Gris Prefabricado ({formatCurrency(prices.obra_gris_prefabricado)}/m²)</option>
                    <option value="obra_blanca_liviano">Obra Blanca Liviano ({formatCurrency(prices.obra_blanca_liviano)}/m²)</option>
                  </select>
                </div>

                <div className="form-row" style={{ alignItems: 'flex-end', marginBottom: '10px' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Modo de Medida</label>
                    <select
                      className="form-control"
                      value={houseAreaMode}
                      onChange={(e) => setHouseAreaMode(e.target.value)}
                    >
                      <option value="dims">Por Medidas (Ancho x Largo)</option>
                      <option value="direct">M² Directos</option>
                    </select>
                  </div>

                  {houseAreaMode === 'dims' ? (
                    <>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label>Ancho (m)</label>
                        <input
                          type="number"
                          className="form-control"
                          placeholder="Ej. 6"
                          value={houseDims.width}
                          onChange={(e) => setHouseDims({ ...houseDims, width: e.target.value })}
                        />
                      </div>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label>Largo (m)</label>
                        <input
                          type="number"
                          className="form-control"
                          placeholder="Ej. 10"
                          value={houseDims.length}
                          onChange={(e) => setHouseDims({ ...houseDims, length: e.target.value })}
                        />
                      </div>
                    </>
                  ) : null}

                  <div className="form-group" style={{ minWidth: '100px', flex: 1 }}>
                    <label>Área Total (M²)</label>
                    <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)', borderRadius: '8px', fontWeight: 700, color: 'var(--primary-cyan)' }}>
                      {houseDims.area || 0} m²
                    </div>
                  </div>
                </div>

                {houseAreaMode === 'direct' && (
                  <div className="form-group">
                    <label>Metros Cuadrados Directos</label>
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
                    <div style={{ marginTop: '10px', display: 'flex', gap: '10px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: '120px' }}>
                        <label style={{ fontSize: '0.75rem' }}>Método de Entrada</label>
                        <select className="form-control" value={slabAreaMode} onChange={(e) => setSlabAreaMode(e.target.value)}>
                          <option value="dims">Por Medidas</option>
                          <option value="direct">M² Directo</option>
                        </select>
                      </div>
                      {slabAreaMode === 'dims' ? (
                        <>
                          <div style={{ flex: 1, minWidth: '80px' }}>
                            <label style={{ fontSize: '0.75rem' }}>Ancho (m)</label>
                            <input type="number" className="form-control" value={slabDims.width} onChange={(e) => setSlabDims({ ...slabDims, width: e.target.value })} />
                          </div>
                          <div style={{ flex: 1, minWidth: '80px' }}>
                            <label style={{ fontSize: '0.75rem' }}>Largo (m)</label>
                            <input type="number" className="form-control" value={slabDims.length} onChange={(e) => setSlabDims({ ...slabDims, length: e.target.value })} />
                          </div>
                        </>
                      ) : (
                        <div style={{ flex: 2, minWidth: '120px' }}>
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
                    <div style={{ marginTop: '10px', display: 'flex', gap: '10px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: '120px' }}>
                        <label style={{ fontSize: '0.75rem' }}>Método de Entrada</label>
                        <select className="form-control" value={corridorAreaMode} onChange={(e) => setCorridorAreaMode(e.target.value)}>
                          <option value="dims">Por Medidas</option>
                          <option value="direct">M² Directo</option>
                        </select>
                      </div>
                      {corridorAreaMode === 'dims' ? (
                        <>
                          <div style={{ flex: 1, minWidth: '80px' }}>
                            <label style={{ fontSize: '0.75rem' }}>Ancho (m)</label>
                            <input type="number" className="form-control" value={corridorDims.width} onChange={(e) => setCorridorDims({ ...corridorDims, width: e.target.value })} />
                          </div>
                          <div style={{ flex: 1, minWidth: '80px' }}>
                            <label style={{ fontSize: '0.75rem' }}>Largo (m)</label>
                            <input type="number" className="form-control" value={corridorDims.length} onChange={(e) => setCorridorDims({ ...corridorDims, length: e.target.value })} />
                          </div>
                        </>
                      ) : (
                        <div style={{ flex: 2, minWidth: '120px' }}>
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
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <input
                          type="text"
                          className="form-control"
                          style={{ flex: 2, minWidth: '180px', fontSize: '0.85rem' }}
                          value={concept.name}
                          onChange={(e) => handleConceptChange(concept.id, 'name', e.target.value)}
                          placeholder="Descripción del concepto"
                          required
                        />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1, minWidth: '130px' }}>
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
              Descuentos, Margen y Condiciones
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
                <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '4px' }}>Este valor se distribuirá proporcionalmente en los precios mostrados al cliente.</p>
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
              <label>Notas y Garantías</label>
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

        {/* Right Side: Live preview with paginated sheets */}
        <div style={{ position: 'sticky', top: '20px', display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '100%', overflowX: 'auto' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Previsualización de Hojas Tamaño Carta (Letter)
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--primary-orange)', fontWeight: 600 }}>
              {blueprintImg ? '2 Hojas' : (quoteMode === 'concepts' && concepts.filter(c => c.included).length > 6 ? '2 Hojas' : '1 Hoja')}
            </span>
          </div>

          {/* Render standard QuoteDocument */}
          <QuoteDocument {...quoteDocumentProps} showDividerBadges={true} />
        </div>

      </div>

      {/* PRINTABLE MODAL OVERLAY */}
      {showPrintModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '860px', width: '95%', background: 'var(--bg-secondary)' }}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={22} style={{ color: 'var(--primary-cyan)' }} />
                Vista Previa de Impresión Tamaño Carta (Letter)
              </h3>
              <button className="btn-icon" onClick={() => setShowPrintModal(false)}><X size={18} /></button>
            </div>

            <div className="modal-body" style={{ padding: '20px', maxHeight: '78vh', overflowY: 'auto' }}>
              <div className="no-print" style={{ marginBottom: '15px', background: 'rgba(6, 182, 212, 0.06)', border: '1px solid rgba(6, 182, 212, 0.2)', padding: '10px 14px', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                💡 <strong>Formato Carta Configurado:</strong> Al pulsar <em>"Enviar a Impresora / Guardar PDF"</em>, el documento se imprimirá sin cortes superiores ni superposiciones, manteniendo la paginación exacta por hojas.
              </div>

              {/* Exact Quote Document */}
              <QuoteDocument {...quoteDocumentProps} showDividerBadges={true} />
            </div>

            <div className="modal-footer" style={{ background: 'rgba(255,255,255,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Total Presupuesto: <strong style={{ color: 'var(--primary-cyan)' }}>{formatCurrency(totalQuote)}</strong>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowPrintModal(false)}>
                  Cerrar
                </button>
                <button type="button" className="btn btn-primary" onClick={handlePrint}>
                  <Printer size={16} /> Enviar a Impresora / Guardar PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HISTORY MODAL */}
      {showHistoryModal && (
        <div className="modal-overlay no-print" style={{ zIndex: 1100 }}>
          <div className="modal-content" style={{ maxWidth: '800px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={20} style={{ color: 'var(--primary-cyan)' }} />
                Historial de Cotizaciones Guardadas
              </h3>
              <button className="btn-icon" onClick={() => setShowHistoryModal(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body" style={{ padding: '20px' }}>
              {savedQuotes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No hay cotizaciones guardadas en el historial.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
                  {savedQuotes.map((q) => (
                    <div key={q.id} style={{ border: '1px solid var(--border-glass)', borderRadius: '8px', padding: '15px', background: 'rgba(255,255,255,0.02)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {new Date(q.savedAt).toLocaleDateString()} {new Date(q.savedAt).toLocaleTimeString()}
                        </span>
                        <span className="badge" style={{ background: 'var(--primary-teal)', color: '#000', fontSize: '0.65rem' }}>
                          {q.quoteMode === 'm2' ? 'Por M²' : 'Por Conceptos'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--primary-orange)', fontWeight: 700, marginBottom: '4px' }}>
                        {q.quoteNumber || 'COT-HIST'}
                      </div>
                      <h4 style={{ margin: '0 0 5px 0', fontSize: '1.05rem', color: 'var(--text-primary)' }}>{q.clientData.name}</h4>
                      <p style={{ margin: '0 0 15px 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Proyecto: {q.clientData.project}</p>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary-cyan)', marginBottom: '15px' }}>
                        {formatCurrency(q.totalQuote)}
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-secondary" style={{ flex: 1, padding: '6px', fontSize: '0.8rem', border: '1px solid var(--border-glass)', color: 'var(--primary-cyan)' }} onClick={() => handleLoadQuote(q)}>
                          Cargar
                        </button>
                        <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem', border: '1px solid rgba(239, 68, 68, 0.3)', color: 'var(--primary-red)' }} onClick={() => handleDeleteQuote(q.id)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
