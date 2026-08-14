import React, { useState } from 'react';
import { Mail, Key, Shield, ArrowRight } from 'lucide-react';
import { loginWithPin } from '../db/supabase';

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
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

  const handleSubmit = async (e) => {
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
        maxWidth: '450px',
        width: '100%',
        padding: '40px 30px',
        display: 'flex',
        flexDirection: 'column',
        gap: '25px',
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

        {/* Brand/Title */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-glass)',
            padding: '20px',
            borderRadius: '20px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--glow-cyan)'
          }}>
            <img src="/logo.png" alt="Logo HABITECH SAS" style={{ height: '140px', objectFit: 'contain' }} />
          </div>
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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
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
            marginTop: '10px',
            padding: '5px'
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
                  padding: '12px',
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
                padding: '12px',
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
                padding: '12px',
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
                padding: '12px',
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
              marginTop: '10px',
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
                Ingresar Sistema <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div style={{
          textAlign: 'center',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
          marginTop: '10px',
          lineHeight: '1.5'
        }}>
          <div>Administrador por defecto:</div>
          <div style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>constructorahabitecsas@gmail.com</div>
          <div>PIN: <span style={{ color: 'var(--primary-cyan)', fontWeight: 600 }}>1234</span></div>
        </div>
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
