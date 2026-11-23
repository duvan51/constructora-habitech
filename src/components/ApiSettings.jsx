import React, { useState } from 'react';
import { 
  Code, 
  Settings, 
  Copy, 
  Check, 
  Terminal, 
  Globe, 
  EyeOff, 
  Server,
  BookOpen,
  Layers,
  Palette,
  Sun,
  Moon
} from 'lucide-react';

export default function ApiSettings({ 
  quickSwitcherEnabled: propEnabled, 
  onToggleQuickSwitcher: propToggle,
  theme: propTheme,
  onToggleTheme: propToggleTheme
}) {
  const [activeSubTab, setActiveSubTab] = useState('api');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedJs, setCopiedJs] = useState(false);
  const [copiedCli, setCopiedCli] = useState(false);

  // Fallback to localStorage if props are not explicitly provided
  const [localEnabled, setLocalEnabled] = useState(() => {
    return localStorage.getItem('habitech_quick_switcher_enabled') !== 'false';
  });

  const [localTheme, setLocalTheme] = useState(() => {
    return localStorage.getItem('habitech_theme') || 'dark';
  });

  const isSwitcherActive = propEnabled !== undefined ? propEnabled : localEnabled;
  const currentTheme = propTheme || localTheme;

  const handleToggleSwitcher = () => {
    const nextVal = !isSwitcherActive;
    if (propToggle) {
      propToggle(nextVal);
    } else {
      setLocalEnabled(nextVal);
      localStorage.setItem('habitech_quick_switcher_enabled', String(nextVal));
    }
  };

  const handleSetTheme = (themeName) => {
    if (propToggleTheme) {
      propToggleTheme(themeName);
    } else {
      setLocalTheme(themeName);
      localStorage.setItem('habitech_theme', themeName);
      document.documentElement.setAttribute('data-theme', themeName);
      if (themeName === 'light') {
        document.documentElement.classList.add('theme-light');
        document.body.classList.add('theme-light');
      } else {
        document.documentElement.classList.remove('theme-light');
        document.body.classList.remove('theme-light');
      }
    }
  };

  const apiUrl = 'https://flknwsgtcswiusahfjar.supabase.co/functions/v1/proyectos-activos';
  
  const jsSnippet = `fetch('${apiUrl}')
  .then(response => response.json())
  .then(proyectos => {
    console.log("Proyectos en ejecución:", proyectos);
    // Aquí puedes renderizarlos en tu interfaz externa
  })
  .catch(error => console.error("Error al obtener proyectos:", error));`;

  const cliCommands = `npx supabase login
npx supabase functions deploy proyectos-activos --project-ref flknwsgtcswiusahfjar`;

  const handleCopy = (text, setCopiedState) => {
    navigator.clipboard.writeText(text);
    setCopiedState(true);
    setTimeout(() => setCopiedState(false), 2000);
  };

  return (
    <div className="api-settings-container animate-fade-in">
      <div style={{ marginBottom: '25px' }}>
        <h1>Configuración del Sistema</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Configura integraciones externas y gestiona el comportamiento general de la plataforma.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '25px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* Left Sub-Sidebar (Vertical Navigation) */}
        <div className="glass-panel" style={{ width: '240px', padding: '15px 10px', display: 'flex', flexDirection: 'column', gap: '5px', flexShrink: 0 }}>
          <button
            onClick={() => setActiveSubTab('api')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              width: '100%',
              padding: '12px 15px',
              borderRadius: '8px',
              border: 'none',
              background: activeSubTab === 'api' ? 'rgba(255, 109, 0, 0.1)' : 'transparent',
              color: activeSubTab === 'api' ? 'var(--primary-cyan)' : 'var(--text-secondary)',
              borderLeft: activeSubTab === 'api' ? '3px solid var(--primary-cyan)' : '3px solid transparent',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'var(--transition-smooth)'
            }}
          >
            <Code size={16} />
            <span>Tu API (Integración)</span>
          </button>
          
          <button
            onClick={() => setActiveSubTab('general')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              width: '100%',
              padding: '12px 15px',
              borderRadius: '8px',
              border: 'none',
              background: activeSubTab === 'general' ? 'rgba(255, 109, 0, 0.1)' : 'transparent',
              color: activeSubTab === 'general' ? 'var(--primary-cyan)' : 'var(--text-secondary)',
              borderLeft: activeSubTab === 'general' ? '3px solid var(--primary-cyan)' : '3px solid transparent',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'var(--transition-smooth)'
            }}
          >
            <Settings size={16} />
            <span>General</span>
          </button>

          <button
            onClick={() => setActiveSubTab('appearance')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              width: '100%',
              padding: '12px 15px',
              borderRadius: '8px',
              border: 'none',
              background: activeSubTab === 'appearance' ? 'rgba(255, 109, 0, 0.1)' : 'transparent',
              color: activeSubTab === 'appearance' ? 'var(--primary-cyan)' : 'var(--text-secondary)',
              borderLeft: activeSubTab === 'appearance' ? '3px solid var(--primary-cyan)' : '3px solid transparent',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'var(--transition-smooth)'
            }}
          >
            <Palette size={16} />
            <span>Apariencia y Tema</span>
          </button>
        </div>

        {/* Right Content Panel */}
        <div style={{ flex: 1, minWidth: '320px' }}>
          {activeSubTab === 'api' && (
            <div className="glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '25px' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', marginTop: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Globe style={{ color: 'var(--primary-cyan)' }} size={24} />
                  API Pública de Proyectos
                </h2>
                <p style={{ marginTop: '8px', fontSize: '0.95rem', lineHeight: '1.6' }}>
                  Esta API permite que otros sitios web (por ejemplo, tu sitio web corporativo o un portafolio público) consulten automáticamente los proyectos que se encuentran <strong>en ejecución</strong> (con estado <code>active</code>) en tiempo real.
                </p>
              </div>

              {/* Security Banner */}
              <div style={{
                background: 'rgba(255, 109, 0, 0.05)',
                border: '1px solid rgba(255, 109, 0, 0.15)',
                borderRadius: '12px',
                padding: '16px 20px',
                display: 'flex',
                gap: '15px',
                alignItems: 'flex-start'
              }}>
                <EyeOff style={{ color: 'var(--primary-cyan)', flexShrink: 0, marginTop: '2px' }} size={20} />
                <div>
                  <h4 style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.95rem', marginBottom: '4px' }}>Seguridad y Privacidad Garantizada</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                    La API filtra automáticamente los datos para no exponer información confidencial de tus clientes (teléfono, correo, costo total del proyecto, hitos de pago o detalles del presupuesto).
                  </p>
                </div>
              </div>

              {/* Endpoint Card */}
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Server size={16} style={{ color: 'var(--text-secondary)' }} />
                  Dirección URL del Endpoint (API URL)
                </h3>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'rgba(0, 0, 0, 0.25)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: '10px',
                  padding: '12px 15px',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <code style={{
                    fontSize: '0.85rem',
                    fontFamily: 'monospace',
                    color: 'var(--primary-cyan)',
                    wordBreak: 'break-all',
                    flex: 1,
                    paddingRight: '45px'
                  }}>
                    {apiUrl}
                  </code>
                  <button
                    onClick={() => handleCopy(apiUrl, setCopiedUrl)}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '6px',
                      padding: '8px',
                      cursor: 'pointer',
                      color: copiedUrl ? 'var(--primary-teal)' : 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'var(--transition-smooth)'
                    }}
                    title="Copiar URL"
                  >
                    {copiedUrl ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>

              {/* Deploy Instructions */}
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Terminal size={16} style={{ color: 'var(--text-secondary)' }} />
                  Instrucciones de Despliegue
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                  Si aún no has subido la función a tu cuenta de Supabase, ejecuta los siguientes comandos en la terminal de tu proyecto:
                </p>
                <div style={{
                  position: 'relative',
                  background: 'rgba(0, 0, 0, 0.25)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: '10px',
                  padding: '15px'
                }}>
                  <pre style={{
                    margin: 0,
                    fontSize: '0.8rem',
                    fontFamily: 'monospace',
                    color: '#e2e8f0',
                    lineHeight: '1.5',
                    overflowX: 'auto'
                  }}>
                    {cliCommands}
                  </pre>
                  <button
                    onClick={() => handleCopy(cliCommands, setCopiedCli)}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '8px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '6px',
                      padding: '8px',
                      cursor: 'pointer',
                      color: copiedCli ? 'var(--primary-teal)' : 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'var(--transition-smooth)'
                    }}
                    title="Copiar comandos"
                  >
                    {copiedCli ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>

              {/* Consumer Snippet */}
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BookOpen size={16} style={{ color: 'var(--text-secondary)' }} />
                  Ejemplo de Consumo (JavaScript)
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                  Copia este fragmento de código para integrarlo en tu página web externa:
                </p>
                <div style={{
                  position: 'relative',
                  background: 'rgba(0, 0, 0, 0.25)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: '10px',
                  padding: '15px'
                }}>
                  <pre style={{
                    margin: 0,
                    fontSize: '0.8rem',
                    fontFamily: 'monospace',
                    color: '#cbd5e1',
                    lineHeight: '1.6',
                    overflowX: 'auto'
                  }}>
                    {jsSnippet}
                  </pre>
                  <button
                    onClick={() => handleCopy(jsSnippet, setCopiedJs)}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '8px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '6px',
                      padding: '8px',
                      cursor: 'pointer',
                      color: copiedJs ? 'var(--primary-teal)' : 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'var(--transition-smooth)'
                    }}
                    title="Copiar código"
                  >
                    {copiedJs ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>

              {/* Table of Fields */}
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '12px' }}>
                  Datos entregados en el JSON
                </h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--text-secondary)' }}>
                        <th style={{ padding: '8px' }}>Campo</th>
                        <th style={{ padding: '8px' }}>Tipo</th>
                        <th style={{ padding: '8px' }}>Descripción</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                        <td style={{ padding: '8px', color: 'var(--primary-cyan)', fontFamily: 'monospace' }}>id</td>
                        <td style={{ padding: '8px', color: 'var(--text-secondary)' }}>string</td>
                        <td style={{ padding: '8px' }}>Identificador único del proyecto.</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                        <td style={{ padding: '8px', color: 'var(--primary-cyan)', fontFamily: 'monospace' }}>name</td>
                        <td style={{ padding: '8px', color: 'var(--text-secondary)' }}>string</td>
                        <td style={{ padding: '8px' }}>Nombre público de la obra.</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                        <td style={{ padding: '8px', color: 'var(--primary-cyan)', fontFamily: 'monospace' }}>status</td>
                        <td style={{ padding: '8px', color: 'var(--text-secondary)' }}>string</td>
                        <td style={{ padding: '8px' }}>Estado actual (siempre será <code>"active"</code>).</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                        <td style={{ padding: '8px', color: 'var(--primary-cyan)', fontFamily: 'monospace' }}>progress</td>
                        <td style={{ padding: '8px', color: 'var(--text-secondary)' }}>number</td>
                        <td style={{ padding: '8px' }}>Porcentaje de progreso de la obra (0 a 100).</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                        <td style={{ padding: '8px', color: 'var(--primary-cyan)', fontFamily: 'monospace' }}>start_date</td>
                        <td style={{ padding: '8px', color: 'var(--text-secondary)' }}>string (date)</td>
                        <td style={{ padding: '8px' }}>Fecha de inicio de la construcción.</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                        <td style={{ padding: '8px', color: 'var(--primary-cyan)', fontFamily: 'monospace' }}>end_date</td>
                        <td style={{ padding: '8px', color: 'var(--text-secondary)' }}>string (date)</td>
                        <td style={{ padding: '8px' }}>Fecha estimada de finalización.</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                        <td style={{ padding: '8px', color: 'var(--primary-cyan)', fontFamily: 'monospace' }}>location</td>
                        <td style={{ padding: '8px', color: 'var(--text-secondary)' }}>object (json)</td>
                        <td style={{ padding: '8px' }}>Contiene las coordenadas geográficas (lat, lng) y la dirección textual del proyecto.</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                        <td style={{ padding: '8px', color: 'var(--primary-cyan)', fontFamily: 'monospace' }}>progress_logs</td>
                        <td style={{ padding: '8px', color: 'var(--text-secondary)' }}>array (json)</td>
                        <td style={{ padding: '8px' }}>Listado de avances de la obra (bitácora), incluyendo descripción, fecha de subida y archivos multimedia (imágenes/videos) asociados.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Ejemplo de JSON Entregado */}
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Code size={16} style={{ color: 'var(--text-secondary)' }} />
                  Estructura del JSON de Respuesta
                </h3>
                <div style={{
                  position: 'relative',
                  background: 'rgba(0, 0, 0, 0.25)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: '10px',
                  padding: '15px'
                }}>
                  <pre style={{
                    margin: 0,
                    fontSize: '0.8rem',
                    fontFamily: 'monospace',
                    color: '#cbd5e1',
                    lineHeight: '1.6',
                    overflowX: 'auto'
                  }}>
{`[
  {
    "id": "obra_ejemplo_1",
    "name": "Casa Moderna El Campestre",
    "status": "active",
    "progress": 72,
    "start_date": "2026-03-15",
    "end_date": "2026-09-30",
    "location": {
      "address": "Calle 45 # 12-30, Cali, Colombia",
      "coordinates": { "lat": 3.4516, "lng": -76.5320 }
    },
    "progress_logs": [
      {
        "id": 14,
        "description": "Instalación de tuberías hidrosanitarias y vaciado de losa del segundo piso.",
        "upload_date": "2026-07-20",
        "media": [
          {
            "file_type": "image",
            "file_base64": "data:image/jpeg;base64,/9j/4AAQSkZJR..."
          }
        ]
      }
    ]
  }
]`}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {activeSubTab === 'general' && (
            <div className="glass-panel" style={{ padding: '30px' }}>
              <h2 style={{ fontSize: '1.4rem', marginTop: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                Configuración General
              </h2>
              <p style={{ marginBottom: '20px' }}>Detalles técnicos y estado de la plataforma Habitech Constructor.</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {/* Theme Selector Option in General */}
                <div style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: '12px',
                  padding: '18px 22px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '20px',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ flex: 1, minWidth: '220px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: currentTheme === 'light' ? 'rgba(255, 109, 0, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--primary-cyan)'
                      }}>
                        <Palette size={18} />
                      </div>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.98rem' }}>
                        Tema Visual de la Plataforma
                      </span>
                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '5px',
                        background: currentTheme === 'light' ? 'rgba(255, 109, 0, 0.15)' : 'rgba(255, 255, 255, 0.06)',
                        color: 'var(--primary-cyan)'
                      }}>
                        {currentTheme === 'light' ? 'Modo Claro' : 'Modo Oscuro'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: '1.45', paddingLeft: '42px' }}>
                      Alterna entre el Modo Oscuro (Cyber Executive) y el Modo Claro (Diurno de Alto Contraste).
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => handleSetTheme('dark')}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 14px',
                        borderRadius: '8px',
                        border: currentTheme === 'dark' ? '1.5px solid var(--primary-cyan)' : '1px solid var(--border-glass)',
                        background: currentTheme === 'dark' ? 'rgba(255, 109, 0, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                        color: currentTheme === 'dark' ? 'var(--primary-cyan)' : 'var(--text-secondary)',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'var(--transition-smooth)'
                      }}
                    >
                      <Moon size={15} />
                      Oscuro
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetTheme('light')}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 14px',
                        borderRadius: '8px',
                        border: currentTheme === 'light' ? '1.5px solid var(--primary-cyan)' : '1px solid var(--border-glass)',
                        background: currentTheme === 'light' ? 'rgba(255, 109, 0, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                        color: currentTheme === 'light' ? 'var(--primary-cyan)' : 'var(--text-secondary)',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'var(--transition-smooth)'
                      }}
                    >
                      <Sun size={15} />
                      Claro
                    </button>
                  </div>
                </div>

                {/* Floating Quick Project Switcher Option */}
                <div style={{
                  background: isSwitcherActive ? 'rgba(255, 109, 0, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                  border: isSwitcherActive ? '1px solid rgba(255, 109, 0, 0.35)' : '1px solid var(--border-glass)',
                  borderRadius: '12px',
                  padding: '18px 22px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '20px',
                  transition: 'all 0.25s ease'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: isSwitcherActive ? 'rgba(255, 109, 0, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isSwitcherActive ? 'var(--primary-cyan)' : 'var(--text-muted)'
                      }}>
                        <Layers size={18} />
                      </div>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.98rem' }}>
                        Cambiador Flotante de Obras (Navegación Rápida)
                      </span>
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '5px',
                        background: isSwitcherActive ? 'rgba(255, 109, 0, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                        color: isSwitcherActive ? 'var(--primary-cyan)' : 'var(--text-muted)',
                        fontFamily: 'monospace'
                      }}>
                        Ctrl + K
                      </span>
                    </div>
                    <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: '1.45', paddingLeft: '42px' }}>
                      Muestra un botón flotante en la esquina inferior derecha y una ventana emergente para buscar, recorrer con las flechas del teclado (<kbd style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: '3px' }}>↑</kbd> <kbd style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: '3px' }}>↓</kbd>) y abrir obras con <kbd style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: '3px' }}>Enter</kbd>.
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleToggleSwitcher}
                    style={{
                      background: isSwitcherActive 
                        ? 'linear-gradient(135deg, #FF6D00 0%, #FF8A00 100%)' 
                        : 'rgba(255, 255, 255, 0.08)',
                      border: isSwitcherActive 
                        ? '1px solid rgba(255, 109, 0, 0.6)' 
                        : '1px solid rgba(255, 255, 255, 0.15)',
                      color: isSwitcherActive ? '#ffffff' : 'var(--text-secondary)',
                      borderRadius: '24px',
                      padding: '8px 18px',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: isSwitcherActive ? '0 4px 14px rgba(255, 109, 0, 0.35)' : 'none',
                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                      flexShrink: 0
                    }}
                  >
                    <span style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: isSwitcherActive ? '#ffffff' : 'var(--text-muted)',
                      boxShadow: isSwitcherActive ? '0 0 8px #ffffff' : 'none'
                    }} />
                    {isSwitcherActive ? 'Activado' : 'Desactivado'}
                  </button>
                </div>

                <div style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: '10px',
                  padding: '15px 20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Nombre del Sistema</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Identificador para el aplicativo</div>
                  </div>
                  <span style={{ fontSize: '0.9rem', color: 'var(--primary-cyan)', fontWeight: 600 }}>Habitech Constructor v1.0.0</span>
                </div>

                <div style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: '10px',
                  padding: '15px 20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Proveedor Base de Datos</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Servicio de almacenamiento persistente</div>
                  </div>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>Supabase Postgres Cloud</span>
                </div>

                <div style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: '10px',
                  padding: '15px 20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Estado de Conexión</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Estado del túnel en tiempo real</div>
                  </div>
                  <span style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: 'var(--primary-teal)',
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    padding: '3px 8px',
                    borderRadius: '6px'
                  }}>
                    CONECTADO (ONLINE)
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeSubTab === 'appearance' && (
            <div className="glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '25px' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', marginTop: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Palette style={{ color: 'var(--primary-cyan)' }} size={24} />
                  Apariencia y Tema Visual
                </h2>
                <p style={{ marginTop: '8px', fontSize: '0.95rem', lineHeight: '1.6' }}>
                  Personaliza la experiencia visual de Habitech Constructor. Tu preferencia se guardará automáticamente en este navegador y se aplicará cada vez que ingreses.
                </p>
              </div>

              {/* Theme Cards Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                {/* Dark Mode Card */}
                <div 
                  onClick={() => handleSetTheme('dark')}
                  style={{
                    background: currentTheme === 'dark' ? 'rgba(255, 109, 0, 0.06)' : 'rgba(255, 255, 255, 0.02)',
                    border: currentTheme === 'dark' ? '2px solid var(--primary-cyan)' : '1px solid var(--border-glass)',
                    borderRadius: '16px',
                    padding: '24px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    transition: 'all 0.25s ease',
                    boxShadow: currentTheme === 'dark' ? '0 8px 30px rgba(255, 109, 0, 0.15)' : 'none',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: 'rgba(15, 23, 42, 0.8)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#60a5fa'
                      }}>
                        <Moon size={20} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>Modo Oscuro</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Cyber Executive</div>
                      </div>
                    </div>
                    {currentTheme === 'dark' && (
                      <span style={{
                        background: 'var(--primary-cyan)',
                        color: '#ffffff',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <Check size={12} strokeWidth={3} /> Activo
                      </span>
                    )}
                  </div>

                  {/* Visual Preview Box */}
                  <div style={{
                    borderRadius: '10px',
                    padding: '12px',
                    background: '#0b0f19',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '6px' }}>
                      <span style={{ fontSize: '0.75rem', color: '#f3f4f6', fontWeight: 600 }}>HABITECH</span>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#FF6D00' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <div style={{ width: '30%', height: '32px', borderRadius: '4px', background: '#111827', border: '1px solid rgba(255, 109, 0, 0.3)' }} />
                      <div style={{ width: '70%', height: '32px', borderRadius: '4px', background: '#1e293b' }} />
                    </div>
                  </div>

                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.45' }}>
                    Ideal para jornadas de trabajo prolongadas, reduce la fatiga visual y resalta los acentos naranja de la marca.
                  </p>

                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleSetTheme('dark'); }}
                    style={{
                      marginTop: 'auto',
                      padding: '10px 16px',
                      borderRadius: '8px',
                      border: currentTheme === 'dark' ? 'none' : '1px solid var(--border-glass)',
                      background: currentTheme === 'dark' ? 'linear-gradient(135deg, #FF6D00 0%, #FF8A00 100%)' : 'rgba(255, 255, 255, 0.05)',
                      color: currentTheme === 'dark' ? '#ffffff' : 'var(--text-primary)',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'var(--transition-smooth)'
                    }}
                  >
                    <Moon size={15} />
                    {currentTheme === 'dark' ? 'Tema Actual Activado' : 'Activar Modo Oscuro'}
                  </button>
                </div>

                {/* Light Mode Card */}
                <div 
                  onClick={() => handleSetTheme('light')}
                  style={{
                    background: currentTheme === 'light' ? 'rgba(255, 109, 0, 0.06)' : 'rgba(255, 255, 255, 0.02)',
                    border: currentTheme === 'light' ? '2px solid var(--primary-cyan)' : '1px solid var(--border-glass)',
                    borderRadius: '16px',
                    padding: '24px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    transition: 'all 0.25s ease',
                    boxShadow: currentTheme === 'light' ? '0 8px 30px rgba(255, 109, 0, 0.15)' : 'none',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: '#fef3c7',
                        border: '1px solid #fde68a',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#d97706'
                      }}>
                        <Sun size={20} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>Modo Claro</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Diurno de Alto Contraste</div>
                      </div>
                    </div>
                    {currentTheme === 'light' && (
                      <span style={{
                        background: 'var(--primary-cyan)',
                        color: '#ffffff',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <Check size={12} strokeWidth={3} /> Activo
                      </span>
                    )}
                  </div>

                  {/* Visual Preview Box */}
                  <div style={{
                    borderRadius: '10px',
                    padding: '12px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>
                      <span style={{ fontSize: '0.75rem', color: '#0f172a', fontWeight: 700 }}>HABITECH</span>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#FF6D00' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <div style={{ width: '30%', height: '32px', borderRadius: '4px', background: '#ffffff', border: '1.5px solid #FF6D00' }} />
                      <div style={{ width: '70%', height: '32px', borderRadius: '4px', background: '#ffffff', border: '1px solid #e2e8f0' }} />
                    </div>
                  </div>

                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.45' }}>
                    Excelente legibilidad en oficinas iluminadas y para presentaciones o exportación de tablas y presupuestos.
                  </p>

                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleSetTheme('light'); }}
                    style={{
                      marginTop: 'auto',
                      padding: '10px 16px',
                      borderRadius: '8px',
                      border: currentTheme === 'light' ? 'none' : '1px solid var(--border-glass)',
                      background: currentTheme === 'light' ? 'linear-gradient(135deg, #FF6D00 0%, #FF8A00 100%)' : 'rgba(255, 255, 255, 0.05)',
                      color: currentTheme === 'light' ? '#ffffff' : 'var(--text-primary)',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'var(--transition-smooth)'
                    }}
                  >
                    <Sun size={15} />
                    {currentTheme === 'light' ? 'Tema Actual Activado' : 'Activar Modo Claro'}
                  </button>
                </div>
              </div>

              {/* Brand Accent Note */}
              <div style={{
                background: 'rgba(255, 109, 0, 0.05)',
                border: '1px solid rgba(255, 109, 0, 0.2)',
                borderRadius: '12px',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '15px'
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: '#FF6D00',
                  boxShadow: '0 0 12px rgba(255, 109, 0, 0.4)',
                  flexShrink: 0
                }} />
                <div style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: '1.45' }}>
                  <strong style={{ color: 'var(--text-primary)' }}>Identidad Visual Habitech:</strong> El tono <strong style={{ color: '#FF6D00' }}>#FF6D00 (Naranja Habitech)</strong> se conserva como acento principal en ambos temas para garantizar la coherencia institucional y la rápida identificación de acciones clave.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
