import React, { useState } from 'react';
import { Mail, Key, Shield, ArrowRight, UserCheck, CreditCard, Search, FileText, Camera, Sparkles } from 'lucide-react';
import { loginWithPin, supabase } from '../db/supabase';

export default function Login({ onLoginSuccess, projects = [] }) {
  const [loginMode, setLoginMode] = useState('staff'); // 'staff' | 'client'
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [clientCedula, setClientCedula] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleKeyPress = (num) => {
    if (pin.length < 4) {
      setPin(prev => prev + num);
    }
  };

  const handleClear = () => {
    setPin('');
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };

  // Staff Login (Email + PIN)
  const handleStaffSubmit = async (e) => {
    e.preventDefault();
    if (!email || !pin) {
      setError('Por favor, ingresa tu correo y PIN.');
      return;
    }

    if (pin.length !== 4) {
      setError('El PIN debe ser de 4 dígitos.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const user = await loginWithPin(email, pin);
      onLoginSuccess(user);
    } catch (err) {
      console.error(err);
      if (err.message.includes('relation "public.users" does not exist') || err.message.includes('relation "users" does not exist')) {
        setError('Error: La tabla de usuarios no existe en Supabase. Asegúrate de ejecutar el script sql en el SQL Editor.');
      } else {
        setError(err.message || 'Error de autenticación.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Client Portal Login (Documento / Cédula)
  const handleClientSubmit = async (e) => {
    e.preventDefault();
    const cleanCedula = clientCedula.trim();
    if (!cleanCedula) {
      setError('Por favor ingresa tu número de cédula o documento de identidad.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Search in memory projects first
      let matches = (projects || []).filter(p => {
        const pDoc = String(p.clientDocumentId || '').trim();
        if (!pDoc) return false;
        return pDoc.toLowerCase() === cleanCedula.toLowerCase() ||
               pDoc.replace(/\D/g, '') === cleanCedula.replace(/\D/g, '');
      });

      // 2. If not found in memory, query directly from Supabase
      if (matches.length === 0) {
        const { data: dbProjects, error: dbErr } = await supabase
          .from('projects')
          .select('*');

        if (!dbErr && dbProjects && dbProjects.length > 0) {
          matches = dbProjects
            .filter(p => {
              const pDoc = String(p.client_document_id || p.clientDocumentId || '').trim();
              if (!pDoc) return false;
              return pDoc.toLowerCase() === cleanCedula.toLowerCase() ||
                     pDoc.replace(/\D/g, '') === cleanCedula.replace(/\D/g, '');
            })
            .map(p => ({
              id: p.id,
              name: p.name,
              clientName: p.client_name,
              clientPhone: p.client_phone,
              clientEmail: p.client_email,
              clientDocumentId: p.client_document_id || p.clientDocumentId || '',
              location: p.location,
              status: p.status,
              totalCost: parseFloat(p.total_cost) || 0,
              startDate: p.start_date,
              endDate: p.end_date,
              progress: p.progress,
              budgetItems: p.budget_items || [],
              paymentPlan: p.payment_plan || [],
              managerName: p.manager_name,
              managerPhone: p.manager_phone,
              phases: p.phases || [],
              contacts: p.contacts || [],
              notes: p.notes || []
            }));
        }
      }

      if (matches.length === 0) {
        setError(`No se encontraron obras registradas con la cédula "${cleanCedula}". Por favor verifica el número o comunícate con la Constructora HABITECH SAS.`);
        return;
      }

      // Found project(s)! Create client session object
      const clientUser = {
        role: 'client',
        name: matches[0].clientName || 'Cliente Habitech',
        email: matches[0].clientEmail || `cliente_${cleanCedula}@habitech.com`,
        clientDocumentId: cleanCedula,
        isClient: true,
        projectIds: matches.map(p => p.id)
      };

      onLoginSuccess(clientUser);
    } catch (err) {
      console.error('Error al autenticar cliente:', err);
      setError('Ocurrió un error al consultar tu obra. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      width: '100vw',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary)',
      padding: '20px',
      boxSizing: 'border-box'
    }}>
      <div className="glass-panel" style={{
        maxWidth: '460px',
        width: '100%',
        padding: '35px 28px',
        display: 'flex',
        flexDirection: 'column',
        gap: '22px',
        position: 'relative',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)'
      }}>
        {/* Glow effect */}
        <div style={{
          position: 'absolute',
          top: '-10px',
          left: '-10px',
          right: '-10px',
          bottom: '-10px',
          background: 'linear-gradient(135deg, rgba(255, 109, 0, 0.15), rgba(224, 83, 0, 0.15))',
          filter: 'blur(20px)',
          zIndex: -1,
          borderRadius: '26px'
        }} />

        {/* Brand/Logo */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-glass)',
            padding: '16px 20px',
            borderRadius: '20px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--glow-cyan)'
          }}>
            <img src="/logo.png" alt="Logo HABITECH SAS" style={{ height: '110px', objectFit: 'contain' }} />
          </div>
        </div>

        {/* Dual Mode Switcher Tabs */}
        <div style={{
          display: 'flex',
          background: 'rgba(255, 255, 255, 0.04)',
          padding: '4px',
          borderRadius: '12px',
          border: '1px solid var(--border-glass)',
          gap: '6px'
        }}>
          <button
            type="button"
            onClick={() => { setLoginMode('staff'); setError(''); }}
            style={{
              flex: 1,
              padding: '10px 8px',
              borderRadius: '9px',
              border: 'none',
              background: loginMode === 'staff' ? 'rgba(255, 109, 0, 0.18)' : 'transparent',
              borderBottom: loginMode === 'staff' ? '2px solid var(--primary-cyan)' : '2px solid transparent',
              color: loginMode === 'staff' ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: loginMode === 'staff' ? 700 : 500,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            <Shield size={16} style={{ color: loginMode === 'staff' ? 'var(--primary-cyan)' : 'inherit' }} />
            Colaborador
          </button>

          <button
            type="button"
            onClick={() => { setLoginMode('client'); setError(''); }}
            style={{
              flex: 1,
              padding: '10px 8px',
              borderRadius: '9px',
              border: 'none',
              background: loginMode === 'client' ? 'rgba(255, 109, 0, 0.18)' : 'transparent',
              borderBottom: loginMode === 'client' ? '2px solid var(--primary-cyan)' : '2px solid transparent',
              color: loginMode === 'client' ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: loginMode === 'client' ? 700 : 500,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            <UserCheck size={16} style={{ color: loginMode === 'client' ? 'var(--primary-cyan)' : 'inherit' }} />
            Portal Clientes
          </button>
        </div>

        {error && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.12)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            borderRadius: '10px',
            padding: '12px',
            fontSize: '0.85rem',
            color: '#fda4af',
            textAlign: 'center',
            lineHeight: '1.4'
          }}>
            {error}
          </div>
        )}

        {/* 1. STAFF LOGIN FORM */}
        {loginMode === 'staff' && (
          <form onSubmit={handleStaffSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Mail size={16} style={{ color: 'var(--primary-cyan)' }} /> Correo Electrónico
              </label>
              <input
                type="email"
                className="form-control"
                placeholder="ejemplo@constructora.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
                style={{
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid var(--border-glass)',
                  padding: '12px 16px',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Key size={16} style={{ color: 'var(--primary-cyan)' }} /> PIN de Seguridad (4 dígitos)
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  maxLength={4}
                  pattern="[0-9]*"
                  inputMode="numeric"
                  className="form-control"
                  placeholder="••••"
                  value={pin}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    if (val.length <= 4) setPin(val);
                  }}
                  disabled={loading}
                  required
                  style={{
                    background: 'rgba(0,0,0,0.2)',
                    border: '1px solid var(--border-glass)',
                    padding: '12px 16px',
                    fontSize: '1.25rem',
                    letterSpacing: '10px',
                    textAlign: 'center'
                  }}
                />
              </div>
            </div>

            {/* Visual Numeric Keypad for fast input */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '10px',
              marginTop: '5px',
              padding: '2px'
            }}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleKeyPress(num)}
                  disabled={loading}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-glass)',
                    color: 'var(--text-primary)',
                    borderRadius: '10px',
                    padding: '11px',
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'var(--transition-smooth)'
                  }}
                  className="pin-key"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={handleClear}
                disabled={loading}
                style={{
                  background: 'rgba(244, 63, 94, 0.05)',
                  border: '1px solid rgba(244, 63, 94, 0.15)',
                  color: '#fda4af',
                  borderRadius: '10px',
                  padding: '11px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'var(--transition-smooth)'
                }}
              >
                Borrar
              </button>
              <button
                type="button"
                onClick={() => handleKeyPress(0)}
                disabled={loading}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-glass)',
                  color: 'var(--text-primary)',
                  borderRadius: '10px',
                  padding: '11px',
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'var(--transition-smooth)'
                }}
                className="pin-key"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleBackspace}
                disabled={loading}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-glass)',
                  color: 'var(--text-secondary)',
                  borderRadius: '10px',
                  padding: '11px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'var(--transition-smooth)'
                }}
              >
                ←
              </button>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '1rem',
                marginTop: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px'
              }}
            >
              {loading ? (
                <>
                  <svg width="20" height="20" viewBox="0 0 50 50" style={{ animation: 'spin 1s linear infinite' }}>
                    <circle cx="25" cy="25" r="20" fill="none" stroke="white" strokeWidth="4" strokeDasharray="31.4 31.4" />
                  </svg>
                  Verificando...
                </>
              ) : (
                <>
                  Ingresar al Sistema <ArrowRight size={16} />
                </>
              )}
            </button>

            <div style={{
              textAlign: 'center',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              marginTop: '5px',
              lineHeight: '1.5'
            }}>
              <div>Administrador por defecto:</div>
              <div style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>constructorahabitecsas@gmail.com</div>
              <div>PIN: <span style={{ color: 'var(--primary-cyan)', fontWeight: 600 }}>1234</span></div>
            </div>
          </form>
        )}

        {/* 2. CLIENT PORTAL LOGIN FORM */}
        {loginMode === 'client' && (
          <form onSubmit={handleClientSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{
              background: 'rgba(255, 109, 0, 0.07)',
              border: '1px solid rgba(255, 109, 0, 0.2)',
              borderRadius: '12px',
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-cyan)', fontWeight: 700, fontSize: '0.9rem' }}>
                <Sparkles size={16} /> Portal de Propietarios y Clientes
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                Consulta el avance fotográfico de tu obra, la bitácora técnica de construcción y tu expediente de documentos en tiempo real.
              </p>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 600 }}>
                <CreditCard size={17} style={{ color: 'var(--primary-cyan)' }} /> Cédula o Documento de Identidad
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  inputMode="numeric"
                  className="form-control"
                  placeholder="Ingresa tu número de documento"
                  value={clientCedula}
                  onChange={(e) => setClientCedula(e.target.value)}
                  disabled={loading}
                  required
                  autoFocus
                  style={{
                    background: 'rgba(0,0,0,0.25)',
                    border: '1.5px solid var(--border-glass)',
                    padding: '14px 16px 14px 44px',
                    fontSize: '1.1rem',
                    letterSpacing: '0.5px'
                  }}
                />
                <Search size={18} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              </div>
              <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '6px', display: 'block' }}>
                Ingresa los dígitos de tu cédula o NIT registrado en tu contrato de obra.
              </small>
            </div>

            {/* Quick Demo Credentials Pill */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px dashed var(--border-glass)',
              borderRadius: '10px',
              padding: '10px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                Cédulas Demo para Pruebas:
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setClientCedula('1020304050')}
                  style={{
                    background: 'rgba(6, 182, 212, 0.1)',
                    border: '1px solid rgba(6, 182, 212, 0.25)',
                    color: 'var(--primary-cyan)',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  Altamira: 1020304050
                </button>
                <button
                  type="button"
                  onClick={() => setClientCedula('987654321')}
                  style={{
                    background: 'rgba(255, 109, 0, 0.1)',
                    border: '1px solid rgba(255, 109, 0, 0.25)',
                    color: 'var(--primary-orange)',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  Campo Verde: 987654321
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '1rem',
                marginTop: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px'
              }}
            >
              {loading ? (
                <>
                  <svg width="20" height="20" viewBox="0 0 50 50" style={{ animation: 'spin 1s linear infinite' }}>
                    <circle cx="25" cy="25" r="20" fill="none" stroke="white" strokeWidth="4" strokeDasharray="31.4 31.4" />
                  </svg>
                  Consultando Obra...
                </>
              ) : (
                <>
                  Consultar Mi Obra <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        )}
      </div>

      <style>{`
        .pin-key:hover {
          background: rgba(255, 109, 0, 0.12) !important;
          border-color: var(--primary-cyan) !important;
          transform: scale(1.05);
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
