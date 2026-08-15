import { Home, HardHat, DollarSign, Users, LogOut, X, Briefcase, Settings, CheckSquare, Calculator } from 'lucide-react';

export default function Sidebar({ currentTab, setTab, projectCount, currentUser, onLogout, isOpen, onClose }) {
  const menuItems = [
    { id: 'dashboard', name: 'Panel de Control', icon: <Home size={18} /> },
    { id: 'projects', name: 'Obras y Proyectos', icon: <HardHat size={18} />, count: projectCount },
    { id: 'management', name: 'Gestión de Obras', icon: <CheckSquare size={18} /> },
    { id: 'portfolio', name: 'Portafolio Proyectos', icon: <Briefcase size={18} /> },
    { id: 'ledger', name: 'Libro de Caja', icon: <DollarSign size={18} /> },
    { id: 'quote', name: 'Cotizador Habitech', icon: <Calculator size={18} /> }
  ];

  if (currentUser && currentUser.role === 'admin') {
    menuItems.push({ id: 'users', name: 'Gestión Usuarios', icon: <Users size={18} /> });
    menuItems.push({ id: 'settings', name: 'Configuración', icon: <Settings size={18} /> });
  }

  const getInitials = (name) => {
    if (!name) return 'US';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'editor': return 'Editor';
      case 'viewer': return 'Solo Ver';
      default: return 'Usuario';
    }
  };

  return (
    <aside className={`sidebar-component glass-panel ${isOpen ? 'open' : ''}`}>
      {/* Brand Logo */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginBottom: '35px', padding: '0 10px', width: '100%', position: 'relative' }}>
        {onClose && (
          <button 
            type="button"
            className="mobile-close-btn" 
            onClick={onClose}
            style={{ position: 'absolute', right: '10px', top: '0', zIndex: 10 }}
            title="Cerrar menú"
          >
            <X size={16} />
          </button>
        )}
        {/* Custom SVG Orange Logo H */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border-glass)',
          padding: '12px 20px',
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--glow-cyan)'
        }}>
          <svg width="42" height="42" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Left Pillar of H */}
            <path d="M 24 20 H 42 V 26 H 36 V 74 H 42 V 80 H 24 V 74 H 30 V 26 H 24 Z" fill="#FF6D00" />
            {/* Right Pillar of H */}
            <path d="M 58 20 H 76 V 26 H 70 V 74 H 76 V 80 H 58 V 74 H 64 V 26 H 58 Z" fill="#FF6D00" />
            {/* Wavy bar in the middle */}
            <path d="M 36 48 C 42 36, 58 64, 70 52 C 70 58, 58 70, 36 54 Z" fill="#FF6D00" />
          </svg>
        </div>
        <div style={{ textAlign: 'center', width: '100%' }}>
          <div style={{ fontSize: '0.55rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.8px' }}>
            CONSTRUCTORA E INMOBILIARIA
          </div>
          <div style={{ 
            marginTop: '6px', 
            padding: '3px 10px', 
            border: '1.5px solid #FF6D00', 
            borderRadius: '6px', 
            display: 'inline-block',
            fontWeight: 800,
            fontSize: '0.85rem',
            color: '#FF6D00',
            letterSpacing: '0.5px'
          }}>
            HABITECH SAS
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
        {menuItems.map(item => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: '12px 16px',
                borderRadius: '10px',
                border: 'none',
                background: isActive ? 'rgba(6, 182, 212, 0.1)' : 'transparent',
                borderLeft: isActive ? '3px solid var(--primary-cyan)' : '3px solid transparent',
                color: isActive ? 'var(--primary-cyan)' : 'var(--text-secondary)',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.95rem',
                cursor: 'pointer',
                transition: 'var(--transition-smooth)',
                position: 'relative'
              }}
            >
              {item.icon}
              <span>{item.name}</span>
              {item.count > 0 && (
                <span style={{
                  position: 'absolute',
                  right: '16px',
                  background: isActive ? 'var(--primary-cyan)' : 'rgba(255, 255, 255, 0.08)',
                  color: isActive ? '#0b0f19' : 'var(--text-primary)',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  fontSize: '0.75rem',
                  fontWeight: 700
                }}>
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div style={{
        marginTop: 'auto',
        padding: '15px 10px',
        borderTop: '1px solid var(--border-glass)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary-indigo), var(--primary-cyan))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            color: 'white',
            fontSize: '0.9rem',
            flexShrink: 0
          }}>
            {getInitials(currentUser?.name)}
          </div>
          <div style={{ overflow: 'hidden', flex: 1 }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
              {currentUser?.name || 'Usuario'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--primary-cyan)', fontWeight: 500 }}>
              {getRoleLabel(currentUser?.role)}
            </div>
          </div>
        </div>

        {onLogout && (
          <button
            onClick={onLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: '100%',
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid rgba(244, 63, 94, 0.2)',
              background: 'rgba(244, 63, 94, 0.05)',
              color: '#fda4af',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'var(--transition-smooth)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(244, 63, 94, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(244, 63, 94, 0.05)';
            }}
          >
            <LogOut size={14} />
            Cerrar Sesión
          </button>
        )}
      </div>
    </aside>
  );
}

