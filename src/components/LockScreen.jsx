import React, { useState } from 'react';
import { Key, ArrowRight, Lock, LogOut } from 'lucide-react';
import { loginWithPin } from '../db/supabase';

export default function LockScreen({ currentUser, onUnlock, onLogout }) {
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
    if (e) e.preventDefault();
    if (!pin) {
      setError('Por favor, ingresa tu PIN.');
      return;
    }

    if (pin.length !== 4) {
      setError('El PIN debe ser de 4 dígitos.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Validate PIN by signing in again
      await loginWithPin(currentUser.email, pin);
      onUnlock();
    } catch (err) {
      console.error(err);
      setError('PIN incorrecto. Inténtalo de nuevo.');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(15, 23, 42, 0.8)',
      backdropFilter: 'blur(15px)',
      WebkitBackdropFilter: 'blur(15px)',
      zIndex: 99999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      boxSizing: 'border-box'
    }}>
      <div className="glass-panel" style={{
        maxWidth: '400px',
        width: '100%',
        padding: '35px 25px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        position: 'relative',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
        border: '1px solid rgba(255,255,255,0.08)'
      }}>
        {/* Glow effect */}
        <div style={{
          position: 'absolute',
          top: '-10px',
          left: '-10px',
          right: '-10px',
          bottom: '-10px',
          background: 'linear-gradient(135deg, rgba(255, 109, 0, 0.1), rgba(0, 229, 255, 0.1))',
          filter: 'blur(15px)',
          zIndex: -1,
          borderRadius: '20px'
        }} />

        {/* Lock Icon Header */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
          <div style={{
            background: 'rgba(255, 109, 0, 0.1)',
            border: '1px solid rgba(255, 109, 0, 0.3)',
            padding: '15px',
            borderRadius: '50%',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(255, 109, 0, 0.2)'
          }}>
            <Lock size={32} style={{ color: 'var(--primary-orange)' }} />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '5px 0 0 0', color: 'var(--text-primary)' }}>
            Aplicación Bloqueada
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
            Hola, <strong>{currentUser?.name}</strong>. Introduce tu PIN para continuar.
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.12)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            borderRadius: '8px',
            padding: '10px',
            fontSize: '0.8rem',
            color: '#fda4af',
            textAlign: 'center',
            lineHeight: '1.4'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
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
                autoFocus
                style={{
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid var(--border-glass)',
                  padding: '10px 14px',
                  fontSize: '1.25rem',
                  letterSpacing: '10px',
                  textAlign: 'center'
                }}
              />
            </div>
          </div>

          {/* Numeric Keypad */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px',
            marginTop: '5px'
          }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <button
                key={num}
                type="button"
                onClick={() => handleKeyPress(num)}
                disabled={loading}
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-glass)',
                  color: 'var(--text-primary)',
                  borderRadius: '8px',
                  padding: '10px',
                  fontSize: '1rem',
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
                background: 'rgba(244, 63, 94, 0.03)',
                border: '1px solid rgba(244, 63, 94, 0.1)',
                color: '#fda4af',
                borderRadius: '8px',
                padding: '10px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Borrar
            </button>
            <button
              type="button"
              onClick={() => handleKeyPress(0)}
              disabled={loading}
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-glass)',
                color: 'var(--text-primary)',
                borderRadius: '8px',
                padding: '10px',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer'
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
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-glass)',
                color: 'var(--text-secondary)',
                borderRadius: '8px',
                padding: '10px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              ←
            </button>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onLogout}
              style={{
                flex: 1,
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontSize: '0.9rem',
                background: 'rgba(244, 63, 94, 0.1)',
                color: '#fda4af',
                borderColor: 'rgba(244, 63, 94, 0.2)'
              }}
            >
              <LogOut size={16} /> Salir
            </button>
            
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || pin.length !== 4}
              style={{
                flex: 1.5,
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontSize: '0.9rem'
              }}
            >
              {loading ? 'Validando...' : (
                <>
                  Desbloquear <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
      <style>{`
        .pin-key:hover {
          background: rgba(255, 109, 0, 0.1) !important;
          border-color: var(--primary-cyan) !important;
          transform: scale(1.03);
        }
      `}</style>
    </div>
  );
}
