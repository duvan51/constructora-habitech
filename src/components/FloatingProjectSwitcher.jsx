import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Layers, 
  Search, 
  X, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Building, 
  HardHat, 
  MapPin, 
  User, 
  CornerDownLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react';

export default function FloatingProjectSwitcher({
  projects = [],
  onSelectProject,
  currentProjectId = null,
  enabled = true
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef(null);
  const listRef = useRef(null);
  const itemRefs = useRef([]);

  // Filter projects by search query
  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects;
    const query = searchQuery.toLowerCase().trim();

    return projects.filter(p => {
      const nameMatch = (p.name || '').toLowerCase().includes(query);
      const clientMatch = (p.clientName || '').toLowerCase().includes(query);
      const docMatch = (p.clientDocumentId || '').toLowerCase().includes(query);
      const addressMatch = (p.location?.address || p.location?.customAddress || '').toLowerCase().includes(query);
      const statusMatch = (p.status || '').toLowerCase().includes(query);

      return nameMatch || clientMatch || docMatch || addressMatch || statusMatch;
    });
  }, [projects, searchQuery]);

  // Keep selected index within valid range
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 50);
    } else {
      setSearchQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Global keyboard shortcut (Ctrl + K or Cmd + K)
  useEffect(() => {
    if (!enabled) return;

    const handleGlobalKeyDown = (e) => {
      // Toggle with Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      // Close with Escape
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [enabled, isOpen]);

  // Ensure active keyboard item is scrolled into view
  useEffect(() => {
    if (isOpen && itemRefs.current[selectedIndex]) {
      itemRefs.current[selectedIndex].scrollIntoView({
        block: 'nearest',
        behavior: 'smooth'
      });
    }
  }, [selectedIndex, isOpen]);

  // Key navigation inside search input
  const handleKeyDown = (e) => {
    if (filteredProjects.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % filteredProjects.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredProjects.length) % filteredProjects.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const targetProject = filteredProjects[selectedIndex];
      if (targetProject) {
        handleSelect(targetProject.id);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  const handleSelect = (projectId) => {
    if (onSelectProject) {
      onSelectProject(projectId);
    }
    setIsOpen(false);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'planning':
        return { label: 'Planificación', bg: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc', border: 'rgba(99, 102, 241, 0.3)' };
      case 'active':
        return { label: 'En Obra', bg: 'rgba(16, 185, 129, 0.15)', color: '#6ee7b7', border: 'rgba(16, 185, 129, 0.3)' };
      case 'halted':
        return { label: 'Detenido', bg: 'rgba(245, 158, 11, 0.15)', color: '#fde047', border: 'rgba(245, 158, 11, 0.3)' };
      default:
        return { label: 'Terminado', bg: 'rgba(56, 189, 248, 0.15)', color: '#7dd3fc', border: 'rgba(56, 189, 248, 0.3)' };
    }
  };

  // If switcher feature is disabled in settings, render nothing
  if (!enabled) return null;

  return (
    <>
      {/* FLOATING ACTION BUTTON (BOTTOM RIGHT) */}
      <button
        type="button"
        className="floating-switcher-fab"
        onClick={() => setIsOpen(true)}
        title="Cambio rápido de obras (Ctrl + K)"
        aria-label="Abrir cambiador de obras"
      >
        <div className="floating-switcher-fab-icon">
          <Layers size={20} />
        </div>
        <span className="floating-switcher-fab-label">
          Obras <kbd className="floating-switcher-fab-kbd">Ctrl+K</kbd>
        </span>
      </button>

      {/* FLOATING BANNER / COMMAND PALETTE MODAL */}
      {isOpen && (
        <div 
          className="floating-switcher-overlay animate-fade-in"
          onClick={() => setIsOpen(false)}
        >
          <div 
            className="floating-switcher-modal animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Bar Header */}
            <div className="floating-switcher-header">
              <div className="floating-switcher-search-icon">
                <Search size={20} />
              </div>
              <input
                ref={inputRef}
                type="text"
                className="floating-switcher-input"
                placeholder="Buscar obra por nombre, cliente, dirección o estado..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="floating-switcher-clear-btn"
                  onClick={() => {
                    setSearchQuery('');
                    inputRef.current?.focus();
                  }}
                  title="Borrar búsqueda"
                >
                  <X size={16} />
                </button>
              )}
              <div className="floating-switcher-count-badge">
                {filteredProjects.length} {filteredProjects.length === 1 ? 'obra' : 'obras'}
              </div>
            </div>

            {/* List of Obras */}
            <div className="floating-switcher-list" ref={listRef}>
              {filteredProjects.length === 0 ? (
                <div className="floating-switcher-empty">
                  <Building size={38} style={{ opacity: 0.4, marginBottom: '10px' }} />
                  <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    No se encontraron obras
                  </p>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Intenta con otro término de búsqueda o limpia el buscador.
                  </span>
                </div>
              ) : (
                filteredProjects.map((project, index) => {
                  const isSelected = index === selectedIndex;
                  const isCurrent = project.id === currentProjectId;
                  const badge = getStatusBadge(project.status);

                  return (
                    <div
                      key={project.id}
                      ref={el => itemRefs.current[index] = el}
                      className={`floating-switcher-item ${isSelected ? 'is-selected' : ''} ${isCurrent ? 'is-current' : ''}`}
                      onClick={() => handleSelect(project.id)}
                      onMouseEnter={() => setSelectedIndex(index)}
                    >
                      <div className="floating-switcher-item-left">
                        <div className="floating-switcher-item-icon">
                          <HardHat size={18} />
                        </div>
                        <div className="floating-switcher-item-info">
                          <div className="floating-switcher-item-title-row">
                            <span className="floating-switcher-item-name">
                              {project.name}
                            </span>
                            {isCurrent && (
                              <span className="floating-switcher-current-tag">
                                Obra activa
                              </span>
                            )}
                            <span 
                              className="badge" 
                              style={{ 
                                fontSize: '0.68rem', 
                                padding: '2px 8px', 
                                background: badge.bg, 
                                color: badge.color, 
                                border: `1px solid ${badge.border}` 
                              }}
                            >
                              {badge.label}
                            </span>
                          </div>

                          <div className="floating-switcher-item-meta">
                            {project.clientName && (
                              <span className="floating-switcher-meta-client">
                                <User size={12} /> {project.clientName}
                              </span>
                            )}
                            {(project.location?.address || project.location?.customAddress) && (
                              <span className="floating-switcher-meta-address">
                                <MapPin size={12} /> {project.location?.customAddress || project.location?.address}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="floating-switcher-item-right">
                        {/* Progress Indicator */}
                        <div className="floating-switcher-progress-wrap">
                          <div className="floating-switcher-progress-bar">
                            <div 
                              className="floating-switcher-progress-fill" 
                              style={{ width: `${Math.min(100, Math.max(0, project.progress || 0))}%` }} 
                            />
                          </div>
                          <span className="floating-switcher-progress-val">
                            {project.progress || 0}%
                          </span>
                        </div>

                        {isSelected ? (
                          <div className="floating-switcher-enter-hint">
                            <span>Abrir</span>
                            <CornerDownLeft size={13} />
                          </div>
                        ) : (
                          <ChevronRight size={16} className="floating-switcher-chevron" />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Keyboard Shortcuts Footer */}
            <div className="floating-switcher-footer">
              <div className="floating-switcher-shortcuts">
                <span className="floating-switcher-shortcut-item">
                  <kbd className="switcher-kbd">↑</kbd>
                  <kbd className="switcher-kbd">↓</kbd>
                  <span>Navegar</span>
                </span>
                <span className="floating-switcher-shortcut-item">
                  <kbd className="switcher-kbd">↵ Enter</kbd>
                  <span>Abrir obra</span>
                </span>
                <span className="floating-switcher-shortcut-item">
                  <kbd className="switcher-kbd">ESC</kbd>
                  <span>Cerrar</span>
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Habitech Quick Switcher
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
