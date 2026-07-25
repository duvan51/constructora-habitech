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
  BookOpen
} from 'lucide-react';

export default function ApiSettings() {
  const [activeSubTab, setActiveSubTab] = useState('api');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedJs, setCopiedJs] = useState(false);
  const [copiedCli, setCopiedCli] = useState(false);

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
                    </tbody>
                  </table>
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
        </div>
      </div>
    </div>
  );
}
