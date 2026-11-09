import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  User, 
  Phone, 
  CheckCircle, 
  AlertCircle, 
  Plus, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  ExternalLink, 
  HardHat, 
  Users, 
  Check, 
  Trash2, 
  Edit3, 
  MessageCircle, 
  AlertTriangle, 
  Building, 
  List, 
  Grid,
  CalendarCheck,
  Flag,
  Share2
} from 'lucide-react';

// Predefined Event Categories for Construction & Real Estate
export const EVENT_TYPES = [
  { id: 'visita', name: 'Visita de Obra', color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.12)', border: 'rgba(6, 182, 212, 0.3)', icon: HardHat },
  { id: 'cliente', name: 'Reunión con Cliente', color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.3)', icon: Users },
  { id: 'comite', name: 'Comité de Obra / Cuadrilla', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.3)', icon: Building },
  { id: 'materiales', name: 'Recepción de Materiales', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.12)', border: 'rgba(168, 85, 247, 0.3)', icon: CalendarCheck },
  { id: 'entrega', name: 'Hito / Entrega de Fase', color: '#ec4899', bg: 'rgba(236, 72, 153, 0.12)', border: 'rgba(236, 72, 153, 0.3)', icon: CheckCircle },
  { id: 'tramite', name: 'Trámite / Licencia / Curaduría', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.12)', border: 'rgba(56, 189, 248, 0.3)', icon: AlertCircle },
  { id: 'otro', name: 'Otro / General', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.12)', border: 'rgba(148, 163, 184, 0.3)', icon: CalendarIcon }
];

const PRIORITIES = [
  { id: 'baja', label: 'Baja', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.15)' },
  { id: 'normal', label: 'Normal', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)' },
  { id: 'alta', label: 'Alta', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
  { id: 'urgente', label: 'Urgente', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' }
];

export default function Agenda({
  projects = [],
  personnel = [],
  events = [],
  onSaveEvent,
  onDeleteEvent,
  onViewProject,
  userRole
}) {
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' | 'list'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayEvents, setSelectedDayEvents] = useState(null); // { dateStr, events }
  
  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProject, setFilterProject] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('pending'); // 'all' | 'pending' | 'completed' | 'cancelled'
  const [filterPriority, setFilterPriority] = useState('all');

  // Modal create/edit state
  const [showModal, setShowModal] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    projectId: 'general',
    eventType: 'visita',
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '10:00',
    allDay: false,
    location: '',
    contactName: '',
    contactPhone: '',
    priority: 'normal',
    status: 'pending',
    notes: ''
  });

  const isReadOnly = userRole === 'viewer';

  // Format Helpers
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const getCleanPhone = (phone) => {
    if (!phone) return '';
    return phone.replace(/\D/g, '');
  };

  const getWhatsAppLink = (phone, title, date) => {
    const clean = getCleanPhone(phone);
    if (!clean) return null;
    const phoneWithCode = clean.length === 10 ? `57${clean}` : clean;
    const msg = encodeURIComponent(`Hola, te contacto de Constructora Habitech respecto a la cita: "${title}" programada para el día ${date}.`);
    return `https://wa.me/${phoneWithCode}?text=${msg}`;
  };

  const getMapsLink = (location) => {
    if (!location) return null;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
  };

  // Month navigation helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Open modal for new event
  const handleOpenNewEvent = (initialDate = null) => {
    setEditingEventId(null);
    setFormData({
      title: '',
      projectId: projects.length > 0 ? projects[0].id : 'general',
      eventType: 'visita',
      date: initialDate || new Date().toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '10:00',
      allDay: false,
      location: projects.length > 0 ? (projects[0].location?.address || '') : '',
      contactName: '',
      contactPhone: '',
      priority: 'normal',
      status: 'pending',
      notes: ''
    });
    setShowModal(true);
  };

  // Open modal for editing
  const handleOpenEditEvent = (evt) => {
    setEditingEventId(evt.id);
    setFormData({
      title: evt.title || '',
      projectId: evt.projectId || 'general',
      eventType: evt.eventType || 'visita',
      date: evt.date || new Date().toISOString().split('T')[0],
      startTime: evt.startTime || '09:00',
      endTime: evt.endTime || '10:00',
      allDay: Boolean(evt.allDay),
      location: evt.location || '',
      contactName: evt.contactName || '',
      contactPhone: evt.contactPhone || '',
      priority: evt.priority || 'normal',
      status: evt.status || 'pending',
      notes: evt.notes || ''
    });
    setShowModal(true);
  };

  // When project changes in form, auto-fill address if available
  const handleProjectChangeInForm = (projId) => {
    const selectedProj = projects.find(p => p.id === projId);
    setFormData(prev => ({
      ...prev,
      projectId: projId,
      location: selectedProj ? (selectedProj.location?.customAddress || selectedProj.location?.address || prev.location) : prev.location,
      contactName: prev.contactName || (selectedProj ? selectedProj.clientName : '')
    }));
  };

  // Handle Save
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    const selectedProj = projects.find(p => p.id === formData.projectId);
    const evtPayload = {
      ...formData,
      id: editingEventId || `evt_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      projectName: formData.projectId === 'general' ? 'Oficina / General' : (selectedProj ? selectedProj.name : 'Obra')
    };

    if (onSaveEvent) {
      await onSaveEvent(evtPayload);
    }
    setShowModal(false);
  };

  // Quick Toggle Status
  const handleToggleStatus = async (evt) => {
    if (isReadOnly || !onSaveEvent) return;
    const newStatus = evt.status === 'completed' ? 'pending' : 'completed';
    await onSaveEvent({
      ...evt,
      status: newStatus
    });
  };

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return events.filter(evt => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (evt.title || '').toLowerCase().includes(q);
        const matchContact = (evt.contactName || '').toLowerCase().includes(q);
        const matchLoc = (evt.location || '').toLowerCase().includes(q);
        const matchNotes = (evt.notes || '').toLowerCase().includes(q);
        const matchProj = (evt.projectName || '').toLowerCase().includes(q);
        if (!matchTitle && !matchContact && !matchLoc && !matchNotes && !matchProj) return false;
      }

      // Project filter
      if (filterProject !== 'all') {
        if (filterProject === 'general' && evt.projectId && evt.projectId !== 'general') return false;
        if (filterProject !== 'general' && evt.projectId !== filterProject) return false;
      }

      // Type filter
      if (filterType !== 'all' && evt.eventType !== filterType) return false;

      // Status filter
      if (filterStatus !== 'all') {
        if (filterStatus === 'pending' && evt.status === 'completed') return false;
        if (filterStatus === 'completed' && evt.status !== 'completed') return false;
        if (filterStatus === 'cancelled' && evt.status !== 'cancelled') return false;
      }

      // Priority filter
      if (filterPriority !== 'all' && evt.priority !== filterPriority) return false;

      return true;
    }).sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return (a.startTime || '').localeCompare(b.startTime || '');
    });
  }, [events, searchQuery, filterProject, filterType, filterStatus, filterPriority]);

  // Calendar Days calculation
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Days in week: Monday = 0, Sunday = 6 in European/Latin format
    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const days = [];

    // Prev month padding
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      const dateObj = new Date(year, month - 1, d);
      days.push({
        dateObj,
        dateStr: dateObj.toISOString().split('T')[0],
        dayNumber: d,
        isCurrentMonth: false
      });
    }

    // Current month days
    for (let d = 1; d <= lastDayOfMonth.getDate(); d++) {
      const dateObj = new Date(year, month, d);
      days.push({
        dateObj,
        dateStr: dateObj.toISOString().split('T')[0],
        dayNumber: d,
        isCurrentMonth: true
      });
    }

    // Next month padding to complete 35 or 42 grid
    const totalSlots = days.length <= 35 ? 35 : 42;
    const remainingSlots = totalSlots - days.length;
    for (let d = 1; d <= remainingSlots; d++) {
      const dateObj = new Date(year, month + 1, d);
      days.push({
        dateObj,
        dateStr: dateObj.toISOString().split('T')[0],
        dayNumber: d,
        isCurrentMonth: false
      });
    }

    return days;
  }, [year, month]);

  // KPI Metrics
  const metrics = useMemo(() => {
    const total = events.length;
    const todayEvents = events.filter(e => e.date === todayStr && e.status !== 'cancelled');
    const upcomingVisits = events.filter(e => e.eventType === 'visita' && e.status === 'pending');
    const upcomingClients = events.filter(e => e.eventType === 'cliente' && e.status === 'pending');
    const completedCount = events.filter(e => e.status === 'completed').length;
    return {
      total,
      todayCount: todayEvents.length,
      upcomingVisitsCount: upcomingVisits.length,
      upcomingClientsCount: upcomingClients.length,
      completedCount
    };
  }, [events, todayStr]);

  // Grouped events for List View
  const groupedEvents = useMemo(() => {
    const today = todayStr;
    const tomorrowObj = new Date();
    tomorrowObj.setDate(tomorrowObj.getDate() + 1);
    const tomorrow = tomorrowObj.toISOString().split('T')[0];

    const in7DaysObj = new Date();
    in7DaysObj.setDate(in7DaysObj.getDate() + 7);
    const in7Days = in7DaysObj.toISOString().split('T')[0];

    const groups = {
      today: [],
      tomorrow: [],
      thisWeek: [],
      later: [],
      completed: []
    };

    filteredEvents.forEach(evt => {
      if (evt.status === 'completed') {
        groups.completed.push(evt);
      } else if (evt.date === today) {
        groups.today.push(evt);
      } else if (evt.date === tomorrow) {
        groups.tomorrow.push(evt);
      } else if (evt.date > tomorrow && evt.date <= in7Days) {
        groups.thisWeek.push(evt);
      } else if (evt.date > in7Days) {
        groups.later.push(evt);
      } else {
        // Overdue pending events belong in today's attention
        groups.today.push(evt);
      }
    });

    return groups;
  }, [filteredEvents, todayStr]);

  return (
    <div className="agenda-module animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '100%' }}>
      
      {/* 1. Header & KPI Cards */}
      <div className="glass-panel" style={{ padding: '24px 28px', borderRadius: '16px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '15px', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ background: 'rgba(255, 109, 0, 0.15)', border: '1px solid rgba(255, 109, 0, 0.3)', padding: '8px', borderRadius: '10px', color: '#ff6d00' }}>
                <CalendarIcon size={24} />
              </div>
              <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 800 }}>Agenda y Control de Citas</h1>
            </div>
            <p style={{ margin: '6px 0 0 0', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
              Planifica y haz seguimiento a visitas de obra, reuniones con clientes, recepción de insumos e hitos constructivos.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* View Mode Switcher */}
            <div style={{ display: 'inline-flex', background: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border-glass)' }}>
              <button
                type="button"
                className="btn"
                onClick={() => setViewMode('calendar')}
                style={{
                  padding: '6px 14px',
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: viewMode === 'calendar' ? 'var(--primary-cyan)' : 'transparent',
                  color: viewMode === 'calendar' ? '#0f172a' : 'var(--text-secondary)',
                  fontWeight: viewMode === 'calendar' ? 700 : 500,
                  border: 'none',
                  borderRadius: '6px'
                }}
              >
                <Grid size={15} /> Calendario
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => setViewMode('list')}
                style={{
                  padding: '6px 14px',
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: viewMode === 'list' ? 'var(--primary-cyan)' : 'transparent',
                  color: viewMode === 'list' ? '#0f172a' : 'var(--text-secondary)',
                  fontWeight: viewMode === 'list' ? 700 : 500,
                  border: 'none',
                  borderRadius: '6px'
                }}
              >
                <List size={15} /> Lista / Próximos
              </button>
            </div>

            {!isReadOnly && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleOpenNewEvent()}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 18px', fontWeight: 700 }}
              >
                <Plus size={18} /> Programar Cita / Visita
              </button>
            )}
          </div>
        </div>

        {/* KPI Counter Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '14px', marginTop: '10px' }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-glass)', borderRadius: '12px', padding: '14px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)', fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 700 }}>
              <span>Citas para Hoy</span>
              <CalendarIcon size={16} style={{ color: 'var(--primary-cyan)' }} />
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: metrics.todayCount > 0 ? 'var(--primary-cyan)' : 'var(--text-primary)', marginTop: '4px' }}>
              {metrics.todayCount}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {metrics.todayCount === 1 ? '1 compromiso agendado' : `${metrics.todayCount} compromisos agendados`}
            </div>
          </div>

          <div style={{ background: 'rgba(6, 182, 212, 0.05)', border: '1px solid rgba(6, 182, 212, 0.2)', borderRadius: '12px', padding: '14px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#67e8f9', fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 700 }}>
              <span>Visitas de Obra Pendientes</span>
              <HardHat size={16} style={{ color: '#06b6d4' }} />
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#06b6d4', marginTop: '4px' }}>
              {metrics.upcomingVisitsCount}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Supervisión técnica e inspección
            </div>
          </div>

          <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '12px', padding: '14px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#6ee7b7', fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 700 }}>
              <span>Reuniones con Clientes</span>
              <Users size={16} style={{ color: '#10b981' }} />
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>
              {metrics.upcomingClientsCount}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Atención comercial y actas
            </div>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-glass)', borderRadius: '12px', padding: '14px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)', fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 700 }}>
              <span>Eventos Completados</span>
              <CheckCircle size={16} style={{ color: '#34d399' }} />
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
              {metrics.completedCount}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Historial de actividades concluidas
            </div>
          </div>
        </div>
      </div>

      {/* 2. Filters & Search Toolbar */}
      <div className="glass-panel" style={{ padding: '16px 20px', borderRadius: '14px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', flex: 1 }}>
          {/* Search Input */}
          <div style={{ position: 'relative', minWidth: '220px', flex: '1 1 240px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-control"
              placeholder="Buscar por título, contacto, notas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '36px', fontSize: '0.85rem', borderRadius: '20px' }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Obra Filter */}
          <select
            className="form-control"
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            style={{ width: 'auto', minWidth: '180px', fontSize: '0.82rem', borderRadius: '16px' }}
          >
            <option value="all">🏗️ Todas las Obras</option>
            <option value="general">🏢 Oficina / Sin Obra</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          {/* Event Type Filter */}
          <select
            className="form-control"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{ width: 'auto', minWidth: '170px', fontSize: '0.82rem', borderRadius: '16px' }}
          >
            <option value="all">🏷️ Todos los Tipos</option>
            {EVENT_TYPES.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            className="form-control"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ width: 'auto', minWidth: '140px', fontSize: '0.82rem', borderRadius: '16px' }}
          >
            <option value="pending">⏳ Solo Pendientes</option>
            <option value="completed">✅ Completadas</option>
            <option value="cancelled">❌ Canceladas</option>
            <option value="all">Todos los Estados</option>
          </select>

          {/* Priority Filter */}
          <select
            className="form-control"
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            style={{ width: 'auto', minWidth: '130px', fontSize: '0.82rem', borderRadius: '16px' }}
          >
            <option value="all">🚩 Prioridad (Todas)</option>
            {PRIORITIES.map(pr => (
              <option key={pr.id} value={pr.id}>{pr.label}</option>
            ))}
          </select>
        </div>

        {/* Reset Filters Pill */}
        {(searchQuery || filterProject !== 'all' || filterType !== 'all' || filterStatus !== 'pending' || filterPriority !== 'all') && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setSearchQuery('');
              setFilterProject('all');
              setFilterType('all');
              setFilterStatus('pending');
              setFilterPriority('all');
            }}
            style={{ fontSize: '0.78rem', padding: '5px 12px', borderRadius: '16px' }}
          >
            <X size={13} /> Limpiar Filtros
          </button>
        )}
      </div>

      {/* 3. Main Views: Calendar Grid OR List View */}
      {viewMode === 'calendar' ? (
        <div className="glass-panel" style={{ padding: '20px', borderRadius: '16px' }}>
          
          {/* Calendar Month Header Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {monthNames[month]} {year}
              </h2>
              <span className="badge" style={{ background: 'rgba(6, 182, 212, 0.12)', color: 'var(--primary-cyan)', fontSize: '0.75rem', fontWeight: 700 }}>
                {filteredEvents.filter(e => e.date?.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`)).length} eventos este mes
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handlePrevMonth}
                style={{ padding: '6px 10px', borderRadius: '8px' }}
                title="Mes anterior"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleToday}
                style={{ padding: '6px 14px', fontSize: '0.82rem', fontWeight: 600, borderRadius: '8px' }}
              >
                Hoy
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleNextMonth}
                style={{ padding: '6px 10px', borderRadius: '8px' }}
                title="Mes siguiente"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Days of Week Header */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', textAlign: 'center', marginBottom: '8px' }}>
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((dayName, idx) => (
              <div key={idx} style={{ padding: '8px 4px', fontSize: '0.78rem', fontWeight: 700, color: idx >= 5 ? 'var(--text-muted)' : 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {dayName}
              </div>
            ))}
          </div>

          {/* Calendar Days 7x5 / 7x6 Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
            {calendarDays.map((day, idx) => {
              const dayEvents = filteredEvents.filter(e => e.date === day.dateStr);
              const isToday = day.dateStr === todayStr;

              return (
                <div
                  key={idx}
                  onClick={() => {
                    if (dayEvents.length > 0) {
                      setSelectedDayEvents({ dateStr: day.dateStr, events: dayEvents });
                    } else if (!isReadOnly) {
                      handleOpenNewEvent(day.dateStr);
                    }
                  }}
                  style={{
                    minHeight: '105px',
                    maxHeight: '135px',
                    background: isToday 
                      ? 'rgba(255, 109, 0, 0.06)' 
                      : day.isCurrentMonth 
                        ? 'rgba(255, 255, 255, 0.02)' 
                        : 'rgba(0, 0, 0, 0.15)',
                    border: isToday 
                      ? '1.5px solid #ff6d00' 
                      : '1px solid var(--border-glass)',
                    borderRadius: '10px',
                    padding: '6px 8px',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    opacity: day.isCurrentMonth ? 1 : 0.45,
                    overflow: 'hidden',
                    position: 'relative'
                  }}
                  className="agenda-day-cell"
                >
                  {/* Day header number */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{
                      fontSize: '0.82rem',
                      fontWeight: isToday ? 800 : 600,
                      color: isToday ? '#ff6d00' : 'var(--text-primary)',
                      background: isToday ? 'rgba(255, 109, 0, 0.15)' : 'transparent',
                      padding: isToday ? '1px 6px' : '0',
                      borderRadius: '6px'
                    }}>
                      {day.dayNumber}
                    </span>
                    {dayEvents.length > 0 && (
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                        {dayEvents.length}
                      </span>
                    )}
                  </div>

                  {/* Day Event Pills */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', overflowY: 'auto' }}>
                    {dayEvents.slice(0, 3).map((evt) => {
                      const typeInfo = EVENT_TYPES.find(t => t.id === evt.eventType) || EVENT_TYPES[0];
                      const isCompleted = evt.status === 'completed';

                      return (
                        <div
                          key={evt.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditEvent(evt);
                          }}
                          style={{
                            fontSize: '0.68rem',
                            padding: '2px 5px',
                            borderRadius: '4px',
                            background: typeInfo.bg,
                            borderLeft: `3px solid ${typeInfo.color}`,
                            color: typeInfo.color,
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            textDecoration: isCompleted ? 'line-through' : 'none',
                            opacity: isCompleted ? 0.6 : 1
                          }}
                          title={`${evt.startTime || ''} - ${evt.title} (${typeInfo.name})`}
                        >
                          {evt.startTime ? `${evt.startTime} ` : ''}{evt.title}
                        </div>
                      );
                    })}
                    {dayEvents.length > 3 && (
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, paddingLeft: '4px' }}>
                        +{dayEvents.length - 3} más...
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Legend at bottom */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', marginTop: '18px', paddingTop: '15px', borderTop: '1px solid var(--border-glass)', fontSize: '0.74rem' }}>
            <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Tipos de Cita:</span>
            {EVENT_TYPES.map(t => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: t.color }}></span>
                <span style={{ color: 'var(--text-secondary)' }}>{t.name}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* 4. List View / Timeline */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {filteredEvents.length === 0 ? (
            <div className="glass-panel" style={{ padding: '45px 20px', textAlign: 'center', borderRadius: '14px', color: 'var(--text-muted)' }}>
              <CalendarIcon size={42} style={{ marginBottom: '12px', opacity: 0.35 }} />
              <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>No hay compromisos agendados</h3>
              <p style={{ fontSize: '0.85rem', margin: '6px 0 16px 0' }}>
                No se encontraron citas o eventos con los filtros actuales.
              </p>
              {!isReadOnly && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleOpenNewEvent()}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Plus size={16} /> Programar Primera Cita
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Group: HOY */}
              {groupedEvents.today.length > 0 && (
                <div className="agenda-group">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <span style={{ background: '#ff6d00', width: '10px', height: '10px', borderRadius: '50%' }}></span>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#ff6d00' }}>
                      COMPROMISOS PARA HOY ({groupedEvents.today.length})
                    </h3>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {groupedEvents.today.map(evt => (
                      <EventCard 
                        key={evt.id} 
                        event={evt} 
                        onEdit={handleOpenEditEvent} 
                        onToggle={handleToggleStatus} 
                        onDelete={onDeleteEvent} 
                        onViewProject={onViewProject}
                        getWhatsAppLink={getWhatsAppLink}
                        getMapsLink={getMapsLink}
                        isReadOnly={isReadOnly}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Group: MAÑANA */}
              {groupedEvents.tomorrow.length > 0 && (
                <div className="agenda-group">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <span style={{ background: 'var(--primary-cyan)', width: '10px', height: '10px', borderRadius: '50%' }}></span>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--primary-cyan)' }}>
                      MAÑANA ({groupedEvents.tomorrow.length})
                    </h3>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {groupedEvents.tomorrow.map(evt => (
                      <EventCard 
                        key={evt.id} 
                        event={evt} 
                        onEdit={handleOpenEditEvent} 
                        onToggle={handleToggleStatus} 
                        onDelete={onDeleteEvent} 
                        onViewProject={onViewProject}
                        getWhatsAppLink={getWhatsAppLink}
                        getMapsLink={getMapsLink}
                        isReadOnly={isReadOnly}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Group: ESTA SEMANA */}
              {groupedEvents.thisWeek.length > 0 && (
                <div className="agenda-group">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <span style={{ background: '#38bdf8', width: '10px', height: '10px', borderRadius: '50%' }}></span>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      ESTA SEMANA ({groupedEvents.thisWeek.length})
                    </h3>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {groupedEvents.thisWeek.map(evt => (
                      <EventCard 
                        key={evt.id} 
                        event={evt} 
                        onEdit={handleOpenEditEvent} 
                        onToggle={handleToggleStatus} 
                        onDelete={onDeleteEvent} 
                        onViewProject={onViewProject}
                        getWhatsAppLink={getWhatsAppLink}
                        getMapsLink={getMapsLink}
                        isReadOnly={isReadOnly}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Group: MÁS ADELANTE */}
              {groupedEvents.later.length > 0 && (
                <div className="agenda-group">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <span style={{ background: 'var(--text-muted)', width: '10px', height: '10px', borderRadius: '50%' }}></span>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                      PRÓXIMAS FECHAS ({groupedEvents.later.length})
                    </h3>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {groupedEvents.later.map(evt => (
                      <EventCard 
                        key={evt.id} 
                        event={evt} 
                        onEdit={handleOpenEditEvent} 
                        onToggle={handleToggleStatus} 
                        onDelete={onDeleteEvent} 
                        onViewProject={onViewProject}
                        getWhatsAppLink={getWhatsAppLink}
                        getMapsLink={getMapsLink}
                        isReadOnly={isReadOnly}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Group: COMPLETADOS */}
              {groupedEvents.completed.length > 0 && (
                <div className="agenda-group" style={{ opacity: 0.8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <span style={{ background: '#10b981', width: '10px', height: '10px', borderRadius: '50%' }}></span>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#34d399' }}>
                      COMPLETADAS / HISTORIAL ({groupedEvents.completed.length})
                    </h3>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {groupedEvents.completed.map(evt => (
                      <EventCard 
                        key={evt.id} 
                        event={evt} 
                        onEdit={handleOpenEditEvent} 
                        onToggle={handleToggleStatus} 
                        onDelete={onDeleteEvent} 
                        onViewProject={onViewProject}
                        getWhatsAppLink={getWhatsAppLink}
                        getMapsLink={getMapsLink}
                        isReadOnly={isReadOnly}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

        </div>
      )}

      {/* 5. MODAL: PROGRAMAR / EDITAR CITA O EVENTO */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" style={{ maxWidth: '680px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CalendarIcon size={20} style={{ color: 'var(--primary-cyan)' }} />
                <h3 style={{ margin: 0 }}>{editingEventId ? 'Modificar Cita o Evento' : 'Programar Nueva Cita / Visita'}</h3>
              </div>
              <button type="button" className="btn-icon" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>

            <form onSubmit={handleSubmitForm} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              
              {/* Título */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Título o Asunto del Compromiso *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ej. Visita técnica cimentación / Reunión entrega planos"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>

              {/* Fila: Tipo de evento y Obra asociada */}
              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Tipo de Evento</label>
                  <select
                    className="form-control"
                    value={formData.eventType}
                    onChange={(e) => setFormData(prev => ({ ...prev, eventType: e.target.value }))}
                  >
                    {EVENT_TYPES.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Obra / Proyecto Asociado</label>
                  <select
                    className="form-control"
                    value={formData.projectId}
                    onChange={(e) => handleProjectChangeInForm(e.target.value)}
                  >
                    <option value="general">🏢 Oficina / Sin obra específica</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Fila: Fecha y Horas */}
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)', borderRadius: '10px', padding: '12px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontWeight: 600, fontSize: '0.85rem', margin: 0 }}>Horario y Fecha</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--text-secondary)', cursor: 'pointer', margin: 0 }}>
                    <input
                      type="checkbox"
                      checked={formData.allDay}
                      onChange={(e) => setFormData(prev => ({ ...prev, allDay: e.target.checked }))}
                    />
                    Todo el día
                  </label>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: formData.allDay ? '1fr' : '1.5fr 1fr 1fr', gap: '10px' }}>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Fecha</span>
                    <input
                      type="date"
                      className="form-control"
                      value={formData.date}
                      onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                      required
                    />
                  </div>

                  {!formData.allDay && (
                    <>
                      <div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Hora Inicio</span>
                        <input
                          type="time"
                          className="form-control"
                          value={formData.startTime}
                          onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                        />
                      </div>
                      <div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>Hora Fin</span>
                        <input
                          type="time"
                          className="form-control"
                          value={formData.endTime}
                          onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Fila: Ubicación / Dirección */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', fontWeight: 600 }}>
                  <MapPin size={15} style={{ color: 'var(--primary-cyan)' }} /> Ubicación / Dirección
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ej. Calle 10Sur #34-12, Envigado / Sala de ventas"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                />
              </div>

              {/* Fila: Contacto y Teléfono */}
              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', fontWeight: 600 }}>
                    <User size={15} style={{ color: 'var(--primary-teal)' }} /> Persona / Contacto
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ej. Ing. Juan David / Propietario"
                    value={formData.contactName}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', fontWeight: 600 }}>
                    <Phone size={15} style={{ color: '#10b981' }} /> Teléfono / WhatsApp
                  </label>
                  <input
                    type="tel"
                    className="form-control"
                    placeholder="Ej. 300 123 4567"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
                  />
                </div>
              </div>

              {/* Fila: Prioridad y Estado */}
              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Prioridad</label>
                  <select
                    className="form-control"
                    value={formData.priority}
                    onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                  >
                    {PRIORITIES.map(p => (
                      <option key={p.id} value={p.id}>{p.label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Estado</label>
                  <select
                    className="form-control"
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="pending">⏳ Pendiente</option>
                    <option value="in_progress">🚧 En curso</option>
                    <option value="completed">✅ Completada</option>
                    <option value="cancelled">❌ Cancelada</option>
                  </select>
                </div>
              </div>

              {/* Notas u Observaciones */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>Notas / Checklist / Observaciones</label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="Detalles adicionales, recordatorios de EPP para la obra, documentos a llevar..."
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  style={{ resize: 'vertical' }}
                />
              </div>

              {/* Botones de acción */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" style={{ padding: '8px 20px', fontWeight: 700 }}>
                  {editingEventId ? 'Guardar Cambios' : 'Agendar Compromiso'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL: DETALLES DE DÍA ESPECÍFICO */}
      {selectedDayEvents && (
        <div className="modal-overlay" onClick={() => setSelectedDayEvents(null)}>
          <div className="modal-content" style={{ maxWidth: '650px', width: '100%' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CalendarIcon size={20} style={{ color: 'var(--primary-cyan)' }} />
                <h3 style={{ margin: 0 }}>Compromisos para el {selectedDayEvents.dateStr}</h3>
              </div>
              <button type="button" className="btn-icon" onClick={() => setSelectedDayEvents(null)}><X size={18} /></button>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '70vh', overflowY: 'auto' }}>
              {selectedDayEvents.events.map(evt => (
                <EventCard 
                  key={evt.id} 
                  event={evt} 
                  onEdit={(e) => { setSelectedDayEvents(null); handleOpenEditEvent(e); }} 
                  onToggle={handleToggleStatus} 
                  onDelete={onDeleteEvent} 
                  onViewProject={onViewProject}
                  getWhatsAppLink={getWhatsAppLink}
                  getMapsLink={getMapsLink}
                  isReadOnly={isReadOnly}
                />
              ))}

              {!isReadOnly && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    const d = selectedDayEvents.dateStr;
                    setSelectedDayEvents(null);
                    handleOpenNewEvent(d);
                  }}
                  style={{ marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Plus size={16} /> Programar otra cita en esta fecha
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// Sub-Component: Clean Responsive Event Card
function EventCard({
  event,
  onEdit,
  onToggle,
  onDelete,
  onViewProject,
  getWhatsAppLink,
  getMapsLink,
  isReadOnly
}) {
  const typeInfo = EVENT_TYPES.find(t => t.id === event.eventType) || EVENT_TYPES[0];
  const priorityInfo = PRIORITIES.find(p => p.id === event.priority) || PRIORITIES[1];
  const isCompleted = event.status === 'completed';
  const IconComp = typeInfo.icon || CalendarIcon;

  return (
    <div 
      className="agenda-event-card"
      style={{
        background: isCompleted ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.04)',
        border: `1px solid ${isCompleted ? 'var(--border-glass)' : typeInfo.border}`,
        borderLeft: `4px solid ${typeInfo.color}`,
        borderRadius: '12px',
        padding: '14px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        transition: 'all 0.15s ease',
        opacity: isCompleted ? 0.75 : 1
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flex: 1, minWidth: '220px' }}>
          
          {/* Quick Checkbox button */}
          {!isReadOnly && (
            <button
              type="button"
              onClick={() => onToggle(event)}
              style={{
                background: isCompleted ? '#10b981' : 'transparent',
                border: isCompleted ? '1px solid #10b981' : '2px solid var(--border-glass-active)',
                color: isCompleted ? '#ffffff' : 'transparent',
                borderRadius: '6px',
                width: '22px',
                height: '22px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                marginTop: '3px',
                flexShrink: 0
              }}
              title={isCompleted ? 'Marcar como pendiente' : 'Marcar como realizada'}
            >
              <Check size={14} style={{ opacity: isCompleted ? 1 : 0 }} />
            </button>
          )}

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
              <span className="badge" style={{ background: typeInfo.bg, color: typeInfo.color, fontSize: '0.72rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <IconComp size={12} /> {typeInfo.name}
              </span>

              {event.priority && event.priority !== 'normal' && (
                <span className="badge" style={{ background: priorityInfo.bg, color: priorityInfo.color, fontSize: '0.68rem', fontWeight: 700 }}>
                  <Flag size={10} style={{ marginRight: '3px' }} /> {priorityInfo.label}
                </span>
              )}

              {event.projectName && event.projectName !== 'Oficina / General' && (
                <span 
                  className="badge" 
                  onClick={() => event.projectId && onViewProject && onViewProject(event.projectId)}
                  style={{ 
                    background: 'rgba(56, 189, 248, 0.1)', 
                    color: 'var(--primary-cyan)', 
                    fontSize: '0.72rem', 
                    cursor: event.projectId && onViewProject ? 'pointer' : 'default',
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '4px' 
                  }}
                  title="Clic para ir a la obra"
                >
                  <Building size={11} /> {event.projectName}
                </span>
              )}
            </div>

            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', textDecoration: isCompleted ? 'line-through' : 'none' }}>
              {event.title}
            </h4>
          </div>
        </div>

        {/* Date & Time pill */}
        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            <CalendarIcon size={14} style={{ color: 'var(--primary-cyan)' }} />
            {event.date}
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
            <Clock size={12} />
            {event.allDay ? 'Todo el día' : `${event.startTime || '09:00'} - ${event.endTime || '10:00'}`}
          </div>
        </div>
      </div>

      {/* Meta details row: Location, Contact, WhatsApp */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)', paddingTop: '4px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        {event.location && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <MapPin size={13} style={{ color: 'var(--primary-cyan)' }} />
            <span>{event.location}</span>
            <a 
              href={getMapsLink(event.location)} 
              target="_blank" 
              rel="noopener noreferrer" 
              style={{ color: 'var(--primary-cyan)', display: 'inline-flex', alignItems: 'center' }}
              title="Abrir en Google Maps"
            >
              <ExternalLink size={11} />
            </a>
          </div>
        )}

        {event.contactName && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <User size={13} style={{ color: 'var(--primary-teal)' }} />
            <span>{event.contactName}</span>
          </div>
        )}

        {event.contactPhone && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Phone size={13} style={{ color: '#10b981' }} />
            <span>{event.contactPhone}</span>
            <a
              href={getWhatsAppLink(event.contactPhone, event.title, event.date)}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#34d399',
                padding: '2px 6px',
                borderRadius: '6px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.72rem',
                textDecoration: 'none',
                fontWeight: 600
              }}
              title="Enviar mensaje de WhatsApp"
            >
              <MessageCircle size={11} /> WhatsApp
            </a>
          </div>
        )}
      </div>

      {/* Notes preview if any */}
      {event.notes && (
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.2)', padding: '6px 10px', borderRadius: '6px', fontStyle: 'italic' }}>
          💡 {event.notes}
        </div>
      )}

      {/* Action Footer */}
      {!isReadOnly && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '6px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => onEdit(event)}
            style={{ padding: '4px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <Edit3 size={12} /> Editar
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={async () => {
              if (await window.confirmDialog(`¿Deseas eliminar el compromiso "${event.title}"?`)) {
                onDelete(event.id);
              }
            }}
            style={{ padding: '4px 10px', fontSize: '0.75rem', color: '#fda4af', borderColor: 'rgba(244, 63, 94, 0.3)', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <Trash2 size={12} /> Eliminar
          </button>
        </div>
      )}

    </div>
  );
}

