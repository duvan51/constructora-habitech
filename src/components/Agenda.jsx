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
  BookUser, 
  Contact, 
  Truck, 
  Briefcase, 
  Store, 
  Hammer, 
  Mail, 
  PhoneCall, 
  Sparkles 
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

export const PRIORITIES = [
  { id: 'baja', label: 'Baja', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.15)' },
  { id: 'normal', label: 'Normal', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)' },
  { id: 'alta', label: 'Alta', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
  { id: 'urgente', label: 'Urgente', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' }
];

// Predefined Categories for Construction Directory
export const CONTACT_CATEGORIES = [
  { id: 'all', name: 'Todos los Contactos', icon: Users, color: '#38bdf8' },
  { id: 'ferreteria', name: 'Ferreterías y Depósitos', icon: Store, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.3)' },
  { id: 'maestro', name: 'Maestros y Cuadrillas', icon: HardHat, color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.12)', border: 'rgba(6, 182, 212, 0.3)' },
  { id: 'proveedor', name: 'Proveedores de Materiales', icon: Hammer, color: '#a855f7', bg: 'rgba(168, 85, 247, 0.12)', border: 'rgba(168, 85, 247, 0.3)' },
  { id: 'transporte', name: 'Transporte y Maquinaria', icon: Truck, color: '#ec4899', bg: 'rgba(236, 72, 153, 0.12)', border: 'rgba(236, 72, 153, 0.3)' },
  { id: 'profesional', name: 'Ingenieros y Especialistas', icon: Briefcase, color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.3)' },
  { id: 'entidad', name: 'Curadurías y Trámites', icon: Building, color: '#6366f1', bg: 'rgba(99, 102, 241, 0.12)', border: 'rgba(99, 102, 241, 0.3)' },
  { id: 'cliente', name: 'Clientes y Propietarios', icon: User, color: '#14b8a6', bg: 'rgba(20, 184, 166, 0.12)', border: 'rgba(20, 184, 166, 0.3)' },
  { id: 'otro', name: 'Otros Contactos', icon: Contact, color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.12)', border: 'rgba(148, 163, 184, 0.3)' }
];

export default function Agenda({
  projects = [],
  personnel = [],
  events = [],
  contacts = [],
  onSaveEvent,
  onDeleteEvent,
  onSaveContact,
  onDeleteContact,
  onViewProject,
  userRole
}) {
  // Main view navigation: 'contacts' (Directorio) | 'calendar' (Citas y Calendario)
  const [mainTab, setMainTab] = useState('contacts');

  // ---------- CONTACTS DIRECTORY STATE ----------
  const [contactSearch, setContactSearch] = useState('');
  const [contactCategoryFilter, setContactCategoryFilter] = useState('all');
  const [contactProjectFilter, setContactProjectFilter] = useState('all');
  const [showContactModal, setShowContactModal] = useState(false);
  const [editingContactId, setEditingContactId] = useState(null);
  const [contactForm, setContactForm] = useState({
    name: '',
    category: 'ferreteria',
    specialty: '',
    phone: '',
    phone_2: '',
    email: '',
    address: '',
    city: 'Medellín',
    projectId: 'general',
    contactPerson: '',
    nitOrId: '',
    notes: ''
  });

  // ---------- CALENDAR & APPOINTMENTS STATE ----------
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' | 'list'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayEvents, setSelectedDayEvents] = useState(null);
  const [eventSearchQuery, setEventSearchQuery] = useState('');
  const [filterProject, setFilterProject] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('pending'); // 'all' | 'pending' | 'completed' | 'cancelled'
  const [filterPriority, setFilterPriority] = useState('all');

  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const [eventFormData, setEventFormData] = useState({
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
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Phone clean helper
  const getCleanPhone = (phone) => {
    if (!phone) return '';
    return String(phone).replace(/\D/g, '');
  };

  // WhatsApp helpers
  const getContactWhatsAppLink = (phone, name, specialty) => {
    const clean = getCleanPhone(phone);
    if (!clean) return null;
    const phoneWithCode = clean.length === 10 ? `57${clean}` : clean;
    const msg = encodeURIComponent(`Hola ${name ? name : ''}, te escribo de Constructora Habitech.`);
    return `https://wa.me/${phoneWithCode}?text=${msg}`;
  };

  const getEventWhatsAppLink = (phone, title, date) => {
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

  // ==========================================
  // CONTACTS DIRECTORY LOGIC & FILTERING
  // ==========================================
  const filteredContacts = useMemo(() => {
    return (contacts || []).filter(c => {
      // Search query (name, specialty, phone, address, notes, contactPerson)
      if (contactSearch.trim()) {
        const q = contactSearch.toLowerCase();
        const matchesName = (c.name || '').toLowerCase().includes(q);
        const matchesSpecialty = (c.specialty || '').toLowerCase().includes(q);
        const matchesPhone = (c.phone || '').includes(q) || (c.phone_2 || '').includes(q);
        const matchesAddress = (c.address || '').toLowerCase().includes(q) || (c.city || '').toLowerCase().includes(q);
        const matchesNotes = (c.notes || '').toLowerCase().includes(q);
        const matchesPerson = (c.contactPerson || '').toLowerCase().includes(q);
        if (!matchesName && !matchesSpecialty && !matchesPhone && !matchesAddress && !matchesNotes && !matchesPerson) {
          return false;
        }
      }

      // Category filter
      if (contactCategoryFilter !== 'all' && c.category !== contactCategoryFilter) {
        return false;
      }

      // Project filter
      if (contactProjectFilter !== 'all') {
        if (contactProjectFilter === 'general' && c.projectId && c.projectId !== 'general') return false;
        if (contactProjectFilter !== 'general' && c.projectId !== contactProjectFilter) return false;
      }

      return true;
    }).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [contacts, contactSearch, contactCategoryFilter, contactProjectFilter]);

  // Directory KPI Metrics
  const directoryMetrics = useMemo(() => {
    const list = contacts || [];
    const total = list.length;
    const ferreterias = list.filter(c => c.category === 'ferreteria').length;
    const maestros = list.filter(c => c.category === 'maestro').length;
    const proveedores = list.filter(c => c.category === 'proveedor').length;
    const profesionales = list.filter(c => c.category === 'profesional').length;
    return { total, ferreterias, maestros, proveedores, profesionales };
  }, [contacts]);

  // Open Create Contact Modal
  const handleOpenNewContact = (presetCategory = 'ferreteria') => {
    setEditingContactId(null);
    setContactForm({
      name: '',
      category: presetCategory || 'ferreteria',
      specialty: '',
      phone: '',
      phone_2: '',
      email: '',
      address: '',
      city: 'Medellín',
      projectId: 'general',
      contactPerson: '',
      nitOrId: '',
      notes: ''
    });
    setShowContactModal(true);
  };

  // Open Edit Contact Modal
  const handleOpenEditContact = (c) => {
    setEditingContactId(c.id);
    setContactForm({
      name: c.name || '',
      category: c.category || 'ferreteria',
      specialty: c.specialty || '',
      phone: c.phone || '',
      phone_2: c.phone_2 || '',
      email: c.email || '',
      address: c.address || '',
      city: c.city || 'Medellín',
      projectId: c.projectId || 'general',
      contactPerson: c.contactPerson || '',
      nitOrId: c.nitOrId || '',
      notes: c.notes || ''
    });
    setShowContactModal(true);
  };

  // Submit Contact Form
  const handleSubmitContact = (e) => {
    e.preventDefault();
    if (!contactForm.name.trim()) {
      alert('Por favor ingresa el nombre o razón social del contacto.');
      return;
    }

    const projObj = projects.find(p => p.id === contactForm.projectId);
    const itemToSave = {
      ...contactForm,
      projectName: projObj ? projObj.name : (contactForm.projectId === 'general' ? 'General / Sin Obra' : '')
    };

    if (editingContactId) {
      itemToSave.id = editingContactId;
    }

    if (onSaveContact) {
      onSaveContact(itemToSave);
    }
    setShowContactModal(false);
  };

  // Quick Action: Agendar Cita con este Contacto
  const handleScheduleFromContact = (contact) => {
    setMainTab('calendar');
    handleOpenNewEvent({
      title: `Reunión / Cita con ${contact.name}`,
      contactName: contact.name,
      contactPhone: contact.phone || contact.phone_2 || '',
      location: contact.address ? `${contact.address}${contact.city ? ', ' + contact.city : ''}` : '',
      projectId: contact.projectId || 'general',
      eventType: contact.category === 'ferreteria' || contact.category === 'proveedor' ? 'materiales' : 
                 contact.category === 'maestro' ? 'comite' : 'cliente',
      notes: `Contacto de agenda: ${contact.specialty ? contact.specialty + '. ' : ''}${contact.notes || ''}`
    });
  };

  // ==========================================
  // CALENDAR & APPOINTMENTS LOGIC
  // ==========================================
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const handleToday = () => setCurrentDate(new Date());

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return (events || []).filter(evt => {
      if (eventSearchQuery.trim()) {
        const q = eventSearchQuery.toLowerCase();
        const matchesTitle = (evt.title || '').toLowerCase().includes(q);
        const matchesLocation = (evt.location || '').toLowerCase().includes(q);
        const matchesContact = (evt.contactName || '').toLowerCase().includes(q);
        const matchesNotes = (evt.notes || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesLocation && !matchesContact && !matchesNotes) return false;
      }
      if (filterProject !== 'all') {
        if (filterProject === 'general' && evt.projectId && evt.projectId !== 'general') return false;
        if (filterProject !== 'general' && evt.projectId !== filterProject) return false;
      }
      if (filterType !== 'all' && evt.eventType !== filterType) return false;
      if (filterStatus !== 'all') {
        if (filterStatus === 'pending' && evt.status === 'completed') return false;
        if (filterStatus === 'completed' && evt.status !== 'completed') return false;
        if (filterStatus === 'cancelled' && evt.status !== 'cancelled') return false;
      }
      if (filterPriority !== 'all' && evt.priority !== filterPriority) return false;

      return true;
    }).sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return (a.startTime || '').localeCompare(b.startTime || '');
    });
  }, [events, eventSearchQuery, filterProject, filterType, filterStatus, filterPriority]);

  // Calendar Days calculation
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const days = [];
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

    for (let d = 1; d <= lastDayOfMonth.getDate(); d++) {
      const dateObj = new Date(year, month, d);
      days.push({
        dateObj,
        dateStr: dateObj.toISOString().split('T')[0],
        dayNumber: d,
        isCurrentMonth: true
      });
    }

    const totalSlots = days.length <= 35 ? 35 : 42;
    const remainingSlots = totalSlots - days.length;
    for (let i = 1; i <= remainingSlots; i++) {
      const dateObj = new Date(year, month + 1, i);
      days.push({
        dateObj,
        dateStr: dateObj.toISOString().split('T')[0],
        dayNumber: i,
        isCurrentMonth: false
      });
    }

    return days;
  }, [year, month]);

  // Events map by dateStr for fast grid lookup
  const eventsByDate = useMemo(() => {
    const map = {};
    filteredEvents.forEach(evt => {
      if (!map[evt.date]) map[evt.date] = [];
      map[evt.date].push(evt);
    });
    return map;
  }, [filteredEvents]);

  // Calendar Metrics
  const calendarMetrics = useMemo(() => {
    const all = events || [];
    const todayEvents = all.filter(e => e.date === todayStr && e.status !== 'cancelled');
    const upcomingEvents = all.filter(e => e.date >= todayStr && e.status !== 'completed' && e.status !== 'cancelled');
    const completedEvents = all.filter(e => e.status === 'completed');
    const highPriority = all.filter(e => (e.priority === 'alta' || e.priority === 'urgente') && e.status !== 'completed');
    return {
      todayCount: todayEvents.length,
      upcomingCount: upcomingEvents.length,
      completedCount: completedEvents.length,
      highPriorityCount: highPriority.length
    };
  }, [events, todayStr]);

  // Open Event Modal
  const handleOpenNewEvent = (initialVals = {}) => {
    setEditingEventId(null);
    setEventFormData({
      title: initialVals.title || '',
      projectId: initialVals.projectId || 'general',
      eventType: initialVals.eventType || 'visita',
      date: initialVals.date || new Date().toISOString().split('T')[0],
      startTime: initialVals.startTime || '09:00',
      endTime: initialVals.endTime || '10:00',
      allDay: false,
      location: initialVals.location || '',
      contactName: initialVals.contactName || '',
      contactPhone: initialVals.contactPhone || '',
      priority: initialVals.priority || 'normal',
      status: 'pending',
      notes: initialVals.notes || ''
    });
    setShowEventModal(true);
  };

  const handleOpenEditEvent = (evt) => {
    setEditingEventId(evt.id);
    setEventFormData({
      title: evt.title || '',
      projectId: evt.projectId || 'general',
      eventType: evt.eventType || 'visita',
      date: evt.date || todayStr,
      startTime: evt.startTime || '09:00',
      endTime: evt.endTime || '10:00',
      allDay: !!evt.allDay,
      location: evt.location || '',
      contactName: evt.contactName || '',
      contactPhone: evt.contactPhone || '',
      priority: evt.priority || 'normal',
      status: evt.status || 'pending',
      notes: evt.notes || ''
    });
    setShowEventModal(true);
  };

  const handleSubmitEvent = (e) => {
    e.preventDefault();
    if (!eventFormData.title.trim()) {
      alert('Por favor ingresa un título descriptivo para la cita.');
      return;
    }

    const projObj = projects.find(p => p.id === eventFormData.projectId);
    const itemToSave = {
      ...eventFormData,
      projectName: projObj ? projObj.name : (eventFormData.projectId === 'general' ? 'General / Sin Obra' : '')
    };

    if (editingEventId) itemToSave.id = editingEventId;
    if (onSaveEvent) onSaveEvent(itemToSave);

    setShowEventModal(false);
    setSelectedDayEvents(null);
  };

  const handleToggleEventStatus = (evt, e) => {
    if (e) e.stopPropagation();
    if (isReadOnly || !onSaveEvent) return;
    const newStatus = evt.status === 'completed' ? 'pending' : 'completed';
    onSaveEvent({ ...evt, status: newStatus });
  };

  return (
    <div className="agenda-module-container" style={{ padding: '10px 0 30px 0' }}>
      
      {/* ======================================================== */}
      {/* TOP HERO & PRIMARY SUBTAB SWITCHER (CONTACTS vs CALENDAR) */}
      {/* ======================================================== */}
      <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', marginBottom: '25px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.25), rgba(59, 130, 246, 0.25))',
                padding: '10px',
                borderRadius: '12px',
                display: 'inline-flex',
                color: 'var(--primary-cyan)',
                border: '1px solid rgba(6, 182, 212, 0.3)'
              }}>
                {mainTab === 'contacts' ? <BookUser size={26} /> : <CalendarIcon size={26} />}
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
                  Agenda de Obra
                </h1>
                <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                  {mainTab === 'contacts' 
                    ? 'Directorio telefónico de ferreterías, maestros de obra, proveedores y profesionales'
                    : 'Calendario de visitas de obra, reuniones con clientes, recepción de materiales y comités'}
                </p>
              </div>
            </div>
          </div>

          {/* Primary View Switcher Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ 
              display: 'inline-flex', 
              background: 'rgba(0, 0, 0, 0.35)', 
              padding: '5px', 
              borderRadius: '12px', 
              border: '1px solid var(--border-glass)',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)'
            }}>
              <button
                type="button"
                className="btn"
                onClick={() => setMainTab('contacts')}
                style={{
                  padding: '8px 18px',
                  fontSize: '0.88rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: mainTab === 'contacts' ? 'linear-gradient(135deg, var(--primary-cyan), #0284c7)' : 'transparent',
                  color: mainTab === 'contacts' ? '#0f172a' : 'var(--text-secondary)',
                  fontWeight: mainTab === 'contacts' ? 700 : 500,
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: mainTab === 'contacts' ? '0 4px 12px rgba(6, 182, 212, 0.3)' : 'none'
                }}
              >
                <BookUser size={17} /> 
                Directorio de Contactos
                <span style={{
                  background: mainTab === 'contacts' ? 'rgba(15, 23, 42, 0.25)' : 'rgba(255, 255, 255, 0.1)',
                  padding: '2px 7px',
                  borderRadius: '10px',
                  fontSize: '0.75rem',
                  fontWeight: 800
                }}>
                  {directoryMetrics.total}
                </span>
              </button>

              <button
                type="button"
                className="btn"
                onClick={() => setMainTab('calendar')}
                style={{
                  padding: '8px 18px',
                  fontSize: '0.88rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: mainTab === 'calendar' ? 'linear-gradient(135deg, var(--primary-cyan), #0284c7)' : 'transparent',
                  color: mainTab === 'calendar' ? '#0f172a' : 'var(--text-secondary)',
                  fontWeight: mainTab === 'calendar' ? 700 : 500,
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: mainTab === 'calendar' ? '0 4px 12px rgba(6, 182, 212, 0.3)' : 'none'
                }}
              >
                <CalendarIcon size={17} /> 
                Citas y Calendario
                {calendarMetrics.todayCount > 0 && (
                  <span style={{
                    background: mainTab === 'calendar' ? '#ef4444' : '#ef4444',
                    color: '#fff',
                    padding: '2px 7px',
                    borderRadius: '10px',
                    fontSize: '0.75rem',
                    fontWeight: 800
                  }}>
                    {calendarMetrics.todayCount} hoy
                  </span>
                )}
              </button>
            </div>

            {/* Quick Action Button according to active subtab */}
            {!isReadOnly && mainTab === 'contacts' && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleOpenNewContact()}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontWeight: 700, borderRadius: '10px' }}
              >
                <Plus size={18} /> Nuevo Contacto
              </button>
            )}

            {!isReadOnly && mainTab === 'calendar' && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleOpenNewEvent()}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontWeight: 700, borderRadius: '10px' }}
              >
                <Plus size={18} /> Programar Cita
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SECTION 1: DIRECTORIO TELEFÓNICO Y DE CONTACTOS         */}
      {/* ======================================================== */}
      {mainTab === 'contacts' && (
        <div className="contacts-directory-section">
          
          {/* KPI Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '22px' }}>
            
            <div 
              onClick={() => setContactCategoryFilter('all')}
              style={{
                background: contactCategoryFilter === 'all' ? 'rgba(6, 182, 212, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                border: `1px solid ${contactCategoryFilter === 'all' ? 'var(--primary-cyan)' : 'var(--border-glass)'}`,
                borderRadius: '14px',
                padding: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)', fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 700 }}>
                <span>Total Contactos</span>
                <Users size={16} style={{ color: 'var(--primary-cyan)' }} />
              </div>
              <div style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
                {directoryMetrics.total}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                En tu agenda telefónica
              </div>
            </div>

            <div 
              onClick={() => setContactCategoryFilter('ferreteria')}
              style={{
                background: contactCategoryFilter === 'ferreteria' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.05)',
                border: `1px solid ${contactCategoryFilter === 'ferreteria' ? '#f59e0b' : 'rgba(245, 158, 11, 0.25)'}`,
                borderRadius: '14px',
                padding: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fbbf24', fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 700 }}>
                <span>Ferreterías & Depósitos</span>
                <Store size={16} style={{ color: '#f59e0b' }} />
              </div>
              <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#f59e0b', marginTop: '4px' }}>
                {directoryMetrics.ferreterias}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Cemento, hierro, herramientas
              </div>
            </div>

            <div 
              onClick={() => setContactCategoryFilter('maestro')}
              style={{
                background: contactCategoryFilter === 'maestro' ? 'rgba(6, 182, 212, 0.15)' : 'rgba(6, 182, 212, 0.05)',
                border: `1px solid ${contactCategoryFilter === 'maestro' ? 'var(--primary-cyan)' : 'rgba(6, 182, 212, 0.25)'}`,
                borderRadius: '14px',
                padding: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#67e8f9', fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 700 }}>
                <span>Maestros & Cuadrillas</span>
                <HardHat size={16} style={{ color: 'var(--primary-cyan)' }} />
              </div>
              <div style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--primary-cyan)', marginTop: '4px' }}>
                {directoryMetrics.maestros}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Oficiales, enchape, obra blanca
              </div>
            </div>

            <div 
              onClick={() => setContactCategoryFilter('proveedor')}
              style={{
                background: contactCategoryFilter === 'proveedor' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(168, 85, 247, 0.05)',
                border: `1px solid ${contactCategoryFilter === 'proveedor' ? '#a855f7' : 'rgba(168, 85, 247, 0.25)'}`,
                borderRadius: '14px',
                padding: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#c084fc', fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 700 }}>
                <span>Proveedores de Insumos</span>
                <Hammer size={16} style={{ color: '#a855f7' }} />
              </div>
              <div style={{ fontSize: '1.9rem', fontWeight: 800, color: '#c084fc', marginTop: '4px' }}>
                {directoryMetrics.proveedores}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Pinturas, cocinas, ventanería
              </div>
            </div>

          </div>

          {/* Search, Category Selector & Project Filters */}
          <div className="glass-panel" style={{ padding: '18px 20px', borderRadius: '14px', marginBottom: '22px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center', justifyContent: 'space-between' }}>
              
              {/* Live search input */}
              <div style={{ position: 'relative', flex: '1 1 320px', minWidth: '260px' }}>
                <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Buscar por nombre, especialidad (cemento, enchape, volquetas...), teléfono, dirección..."
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px 10px 40px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-glass)',
                    background: 'rgba(0, 0, 0, 0.25)',
                    color: 'var(--text-primary)',
                    fontSize: '0.88rem'
                  }}
                />
                {contactSearch && (
                  <button
                    type="button"
                    onClick={() => setContactSearch('')}
                    style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Filter by project */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Filter size={15} style={{ color: 'var(--text-muted)' }} />
                <select
                  value={contactProjectFilter}
                  onChange={(e) => setContactProjectFilter(e.target.value)}
                  style={{
                    padding: '9px 14px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-glass)',
                    background: 'rgba(0, 0, 0, 0.3)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem'
                  }}
                >
                  <option value="all">Todas las Obras</option>
                  <option value="general">Sin Asignar a Obra Específica</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

            </div>

            {/* Category Filter Pills */}
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '14px 0 4px 0', scrollbarWidth: 'thin' }}>
              {CONTACT_CATEGORIES.map(cat => {
                const Icon = cat.icon;
                const isSelected = contactCategoryFilter === cat.id;
                const count = cat.id === 'all' 
                  ? (contacts || []).length 
                  : (contacts || []).filter(c => c.category === cat.id).length;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setContactCategoryFilter(cat.id)}
                    style={{
                      padding: '7px 14px',
                      borderRadius: '20px',
                      border: `1px solid ${isSelected ? cat.color : 'rgba(255, 255, 255, 0.08)'}`,
                      background: isSelected ? (cat.bg || 'rgba(6, 182, 212, 0.2)') : 'rgba(255, 255, 255, 0.03)',
                      color: isSelected ? '#fff' : 'var(--text-secondary)',
                      fontSize: '0.8rem',
                      fontWeight: isSelected ? 700 : 500,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '7px',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.18s'
                    }}
                  >
                    <Icon size={14} style={{ color: cat.color }} />
                    {cat.name}
                    <span style={{
                      background: isSelected ? cat.color : 'rgba(255, 255, 255, 0.1)',
                      color: isSelected ? '#0f172a' : 'var(--text-muted)',
                      padding: '1px 6px',
                      borderRadius: '10px',
                      fontSize: '0.72rem',
                      fontWeight: 800
                    }}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

          </div>

          {/* Contacts Grid */}
          {filteredContacts.length === 0 ? (
            <div className="glass-panel" style={{ padding: '60px 20px', textAlign: 'center', borderRadius: '16px' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(6, 182, 212, 0.1)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary-cyan)',
                marginBottom: '16px'
              }}>
                <BookUser size={32} />
              </div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', color: 'var(--text-primary)' }}>
                No se encontraron contactos en esta categoría
              </h3>
              <p style={{ margin: '0 auto 20px auto', maxWidth: '480px', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                {contactSearch 
                  ? 'Intenta con otro término de búsqueda o limpia los filtros para ver todos tus contactos.'
                  : 'Agrega a tu agenda a tus ferreterías de confianza, maestros de obra, cuadrillas y proveedores de materiales.'}
              </p>
              {!isReadOnly && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleOpenNewContact(contactCategoryFilter !== 'all' ? contactCategoryFilter : 'ferreteria')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 22px', fontWeight: 700 }}
                >
                  <Plus size={18} /> Agregar Contacto Ahora
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '18px' }}>
              {filteredContacts.map(contact => {
                const catObj = CONTACT_CATEGORIES.find(c => c.id === contact.category) || CONTACT_CATEGORIES[1];
                const Icon = catObj.icon;
                const cleanPhone = getCleanPhone(contact.phone);
                const cleanPhone2 = getCleanPhone(contact.phone_2);
                const mapsUrl = getMapsLink(`${contact.address || ''} ${contact.city || ''}`);
                const waUrl = getContactWhatsAppLink(contact.phone || contact.phone_2, contact.name, contact.specialty);

                return (
                  <div 
                    key={contact.id}
                    className="glass-panel"
                    style={{
                      borderRadius: '16px',
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      border: '1px solid var(--border-glass)',
                      background: 'rgba(255, 255, 255, 0.02)',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      position: 'relative'
                    }}
                  >
                    {/* Top Row: Category Badge + Actions Menu */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '12px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 10px',
                          borderRadius: '8px',
                          background: catObj.bg || 'rgba(6, 182, 212, 0.12)',
                          border: `1px solid ${catObj.border || 'rgba(6, 182, 212, 0.3)'}`,
                          color: catObj.color || 'var(--primary-cyan)',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.3px'
                        }}>
                          <Icon size={13} />
                          {catObj.name}
                        </span>

                        {!isReadOnly && (
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => handleOpenEditContact(contact)}
                              title="Editar contacto"
                              style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid var(--border-glass)',
                                color: 'var(--text-secondary)',
                                width: '30px',
                                height: '30px',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.15s'
                              }}
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteContact && onDeleteContact(contact.id)}
                              title="Eliminar contacto"
                              style={{
                                background: 'rgba(239, 68, 68, 0.08)',
                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                color: '#f87171',
                                width: '30px',
                                height: '30px',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.15s'
                              }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Contact Name & Specialty */}
                      <h3 style={{ margin: '0 0 6px 0', fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                        {contact.name}
                      </h3>

                      {contact.specialty && (
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          padding: '4px 10px',
                          borderRadius: '8px',
                          fontSize: '0.8rem',
                          color: '#38bdf8',
                          fontWeight: 600,
                          marginBottom: '12px'
                        }}>
                          <Sparkles size={12} />
                          {contact.specialty}
                        </div>
                      )}

                      {/* Details block */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        
                        {contact.contactPerson && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <User size={14} style={{ color: 'var(--primary-cyan)', flexShrink: 0 }} />
                            <span><strong>Atiende:</strong> {contact.contactPerson}</span>
                          </div>
                        )}

                        {contact.phone && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Phone size={14} style={{ color: '#10b981', flexShrink: 0 }} />
                            <span>{contact.phone}</span>
                            {contact.phone_2 && (
                              <span style={{ color: 'var(--text-muted)' }}>| {contact.phone_2}</span>
                            )}
                          </div>
                        )}

                        {contact.email && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Mail size={14} style={{ color: '#a855f7', flexShrink: 0 }} />
                            <a 
                              href={`mailto:${contact.email}`}
                              style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}
                            >
                              {contact.email}
                            </a>
                          </div>
                        )}

                        {contact.address && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <MapPin size={14} style={{ color: '#f59e0b', flexShrink: 0 }} />
                            <span style={{ flex: 1 }}>{contact.address} {contact.city ? `(${contact.city})` : ''}</span>
                            {mapsUrl && (
                              <a 
                                href={mapsUrl}
                                target="_blank"
                                rel="noreferrer"
                                title="Abrir en Google Maps"
                                style={{ color: 'var(--primary-cyan)', textDecoration: 'none', display: 'inline-flex' }}
                              >
                                <ExternalLink size={12} />
                              </a>
                            )}
                          </div>
                        )}

                        {contact.nitOrId && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            <span><strong>NIT / Doc:</strong> {contact.nitOrId}</span>
                          </div>
                        )}

                        {contact.projectName && contact.projectId !== 'general' && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                            <HardHat size={14} style={{ color: '#ec4899', flexShrink: 0 }} />
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                              {contact.projectName}
                            </span>
                            {onViewProject && (
                              <button
                                type="button"
                                onClick={() => onViewProject(contact.projectId)}
                                style={{ background: 'none', border: 'none', color: 'var(--primary-cyan)', cursor: 'pointer', padding: 0, display: 'inline-flex' }}
                                title="Ver expediente de la obra"
                              >
                                <ExternalLink size={12} />
                              </button>
                            )}
                          </div>
                        )}

                        {contact.notes && (
                          <div style={{
                            marginTop: '8px',
                            background: 'rgba(0, 0, 0, 0.25)',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: '1px solid rgba(255, 255, 255, 0.05)',
                            fontSize: '0.8rem',
                            color: 'var(--text-muted)',
                            lineHeight: 1.4
                          }}>
                            {contact.notes}
                          </div>
                        )}

                      </div>
                    </div>

                    {/* Bottom Action Buttons: WhatsApp, Call, Agendar Cita */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr 1fr',
                      gap: '8px',
                      marginTop: '18px',
                      paddingTop: '14px',
                      borderTop: '1px solid rgba(255, 255, 255, 0.06)'
                    }}>
                      
                      {/* WhatsApp Button */}
                      {waUrl ? (
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            background: 'rgba(16, 185, 129, 0.12)',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            color: '#34d399',
                            padding: '8px 4px',
                            borderRadius: '8px',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            textDecoration: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '5px',
                            transition: 'all 0.15s'
                          }}
                        >
                          <MessageCircle size={14} /> WhatsApp
                        </a>
                      ) : (
                        <button
                          type="button"
                          disabled
                          style={{
                            background: 'rgba(255, 255, 255, 0.02)',
                            border: '1px solid rgba(255, 255, 255, 0.05)',
                            color: 'var(--text-muted)',
                            padding: '8px 4px',
                            borderRadius: '8px',
                            fontSize: '0.78rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '5px'
                          }}
                        >
                          <MessageCircle size={14} /> WhatsApp
                        </button>
                      )}

                      {/* Direct Call Button */}
                      {cleanPhone ? (
                        <a
                          href={`tel:${cleanPhone}`}
                          style={{
                            background: 'rgba(6, 182, 212, 0.1)',
                            border: '1px solid rgba(6, 182, 212, 0.25)',
                            color: '#38bdf8',
                            padding: '8px 4px',
                            borderRadius: '8px',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            textDecoration: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '5px',
                            transition: 'all 0.15s'
                          }}
                        >
                          <PhoneCall size={14} /> Llamar
                        </a>
                      ) : (
                        <button
                          type="button"
                          disabled
                          style={{
                            background: 'rgba(255, 255, 255, 0.02)',
                            border: '1px solid rgba(255, 255, 255, 0.05)',
                            color: 'var(--text-muted)',
                            padding: '8px 4px',
                            borderRadius: '8px',
                            fontSize: '0.78rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '5px'
                          }}
                        >
                          <PhoneCall size={14} /> Llamar
                        </button>
                      )}

                      {/* Schedule Appointment with this Contact */}
                      <button
                        type="button"
                        onClick={() => handleScheduleFromContact(contact)}
                        title="Programar visita o reunión con este contacto"
                        style={{
                          background: 'rgba(245, 158, 11, 0.12)',
                          border: '1px solid rgba(245, 158, 11, 0.3)',
                          color: '#fbbf24',
                          padding: '8px 4px',
                          borderRadius: '8px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '5px',
                          cursor: 'pointer',
                          transition: 'all 0.15s'
                        }}
                      >
                        <CalendarIcon size={14} /> Agendar
                      </button>

                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* ======================================================== */}
      {/* SECTION 2: CITAS Y CALENDARIO INTERACTIVO                */}
      {/* ======================================================== */}
      {mainTab === 'calendar' && (
        <div className="calendar-appointments-section">
          
          {/* Calendar Header with Sub-view switcher & Month Navigator */}
          <div className="glass-panel" style={{ padding: '16px 20px', borderRadius: '14px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              
              {/* Month & Year Navigation */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    type="button"
                    className="btn"
                    onClick={handlePrevMonth}
                    style={{ padding: '6px 10px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: 'var(--text-primary)' }}
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    type="button"
                    className="btn"
                    onClick={handleNextMonth}
                    style={{ padding: '6px 10px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-glass)', borderRadius: '8px', color: 'var(--text-primary)' }}
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>

                <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', minWidth: '180px' }}>
                  {monthNames[month]} {year}
                </h2>

                <button
                  type="button"
                  className="btn"
                  onClick={handleToday}
                  style={{ padding: '6px 12px', fontSize: '0.8rem', background: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.3)', color: 'var(--primary-cyan)', borderRadius: '8px', fontWeight: 600 }}
                >
                  Hoy
                </button>
              </div>

              {/* View Mode Toggle: Calendar Grid vs Chronological List */}
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

            </div>

            {/* Filter Bar for Calendar */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '16px', paddingTop: '14px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
              
              <div style={{ position: 'relative', flex: '1 1 240px' }}>
                <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Buscar citas por título, obra, lugar..."
                  value={eventSearchQuery}
                  onChange={(e) => setEventSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 36px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-glass)',
                    background: 'rgba(0, 0, 0, 0.25)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem'
                  }}
                />
              </div>

              <select
                value={filterProject}
                onChange={(e) => setFilterProject(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-glass)',
                  background: 'rgba(0, 0, 0, 0.25)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem'
                }}
              >
                <option value="all">Todas las Obras</option>
                <option value="general">Citas Generales</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-glass)',
                  background: 'rgba(0, 0, 0, 0.25)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem'
                }}
              >
                <option value="all">Todos los Tipos</option>
                {EVENT_TYPES.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-glass)',
                  background: 'rgba(0, 0, 0, 0.25)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem'
                }}
              >
                <option value="all">Todos los Estados</option>
                <option value="pending">Pendientes / Programados</option>
                <option value="completed">Completados</option>
                <option value="cancelled">Cancelados</option>
              </select>

            </div>
          </div>

          {/* CALENDAR MONTH GRID VIEW */}
          {viewMode === 'calendar' && (
            <div className="glass-panel" style={{ padding: '16px', borderRadius: '16px', overflowX: 'auto' }}>
              <div style={{ minWidth: '780px' }}>
                
                {/* Days of week header */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', marginBottom: '8px', textAlign: 'center' }}>
                  {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(d => (
                    <div key={d} style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', padding: '6px 0' }}>
                      {d}
                    </div>
                  ))}
                </div>

                {/* Days Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
                  {calendarDays.map((day, idx) => {
                    const dayEvents = eventsByDate[day.dateStr] || [];
                    const isToday = day.dateStr === todayStr;
                    const maxDisplayEvents = 3;
                    const overflowCount = dayEvents.length - maxDisplayEvents;

                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          if (dayEvents.length > 0) {
                            setSelectedDayEvents({ dateStr: day.dateStr, events: dayEvents });
                          } else if (!isReadOnly) {
                            handleOpenNewEvent({ date: day.dateStr });
                          }
                        }}
                        style={{
                          minHeight: '115px',
                          background: isToday ? 'rgba(6, 182, 212, 0.08)' : (day.isCurrentMonth ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.25)'),
                          border: `1px solid ${isToday ? 'var(--primary-cyan)' : (day.isCurrentMonth ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.02)')}`,
                          borderRadius: '10px',
                          padding: '8px',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                          transition: 'background 0.15s, border-color 0.15s',
                          opacity: day.isCurrentMonth ? 1 : 0.4
                        }}
                      >
                        {/* Day number */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{
                            fontSize: '0.82rem',
                            fontWeight: isToday ? 800 : 600,
                            color: isToday ? 'var(--primary-cyan)' : (day.isCurrentMonth ? 'var(--text-primary)' : 'var(--text-muted)'),
                            background: isToday ? 'rgba(6, 182, 212, 0.2)' : 'transparent',
                            width: isToday ? '24px' : 'auto',
                            height: isToday ? '24px' : 'auto',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            {day.dayNumber}
                          </span>

                          {dayEvents.length > 0 && (
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                              {dayEvents.length}
                            </span>
                          )}
                        </div>

                        {/* Events Pills */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '2px', flex: 1 }}>
                          {dayEvents.slice(0, maxDisplayEvents).map(evt => {
                            const typeObj = EVENT_TYPES.find(t => t.id === evt.eventType) || EVENT_TYPES[0];
                            const isCompleted = evt.status === 'completed';

                            return (
                              <div
                                key={evt.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEditEvent(evt);
                                }}
                                style={{
                                  padding: '3px 6px',
                                  borderRadius: '5px',
                                  background: isCompleted ? 'rgba(255, 255, 255, 0.05)' : typeObj.bg,
                                  border: `1px solid ${isCompleted ? 'rgba(255, 255, 255, 0.1)' : typeObj.border}`,
                                  color: isCompleted ? 'var(--text-muted)' : typeObj.color,
                                  fontSize: '0.72rem',
                                  fontWeight: 600,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  textDecoration: isCompleted ? 'line-through' : 'none',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}
                                title={`${evt.startTime || ''} - ${evt.title}`}
                              >
                                {evt.startTime && <span style={{ opacity: 0.8, fontSize: '0.68rem' }}>{evt.startTime}</span>}
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{evt.title}</span>
                              </div>
                            );
                          })}

                          {overflowCount > 0 && (
                            <div style={{ fontSize: '0.68rem', color: 'var(--primary-cyan)', fontWeight: 700, paddingLeft: '4px' }}>
                              +{overflowCount} más
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>
            </div>
          )}

          {/* CHRONOLOGICAL LIST VIEW */}
          {viewMode === 'list' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredEvents.length === 0 ? (
                <div className="glass-panel" style={{ padding: '50px 20px', textAlign: 'center', borderRadius: '16px' }}>
                  <CalendarCheck size={40} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
                  <h3 style={{ margin: '0 0 6px 0', color: 'var(--text-primary)' }}>No hay citas agendadas</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    No se encontraron citas o compromisos con los filtros seleccionados.
                  </p>
                </div>
              ) : (
                filteredEvents.map(evt => {
                  const typeObj = EVENT_TYPES.find(t => t.id === evt.eventType) || EVENT_TYPES[0];
                  const Icon = typeObj.icon;
                  const isCompleted = evt.status === 'completed';
                  const waLink = getEventWhatsAppLink(evt.contactPhone, evt.title, evt.date);
                  const mapLink = getMapsLink(evt.location);

                  return (
                    <div
                      key={evt.id}
                      className="glass-panel"
                      style={{
                        padding: '16px 20px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '14px',
                        borderLeft: `4px solid ${isCompleted ? '#10b981' : typeObj.color}`,
                        opacity: isCompleted ? 0.7 : 1
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: '1 1 320px' }}>
                        <button
                          type="button"
                          onClick={(e) => handleToggleEventStatus(evt, e)}
                          title={isCompleted ? 'Marcar como pendiente' : 'Marcar como completada'}
                          style={{
                            width: '26px',
                            height: '26px',
                            borderRadius: '50%',
                            background: isCompleted ? '#10b981' : 'rgba(255, 255, 255, 0.05)',
                            border: `2px solid ${isCompleted ? '#10b981' : 'var(--text-muted)'}`,
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            flexShrink: 0
                          }}
                        >
                          {isCompleted && <Check size={14} />}
                        </button>

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '6px',
                              background: typeObj.bg,
                              color: typeObj.color,
                              textTransform: 'uppercase'
                            }}>
                              {typeObj.name}
                            </span>

                            {evt.projectName && evt.projectId !== 'general' && (
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                                • {evt.projectName}
                              </span>
                            )}
                          </div>

                          <h4 style={{ margin: '4px 0', fontSize: '1.05rem', color: 'var(--text-primary)', textDecoration: isCompleted ? 'line-through' : 'none' }}>
                            {evt.title}
                          </h4>

                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                              <CalendarIcon size={13} style={{ color: 'var(--primary-cyan)' }} />
                              {evt.date} {evt.startTime && `a las ${evt.startTime}`}
                            </span>

                            {evt.location && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                <MapPin size={13} style={{ color: '#f59e0b' }} />
                                {evt.location}
                              </span>
                            )}

                            {evt.contactName && (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                <User size={13} style={{ color: '#10b981' }} />
                                {evt.contactName}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Event actions */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {waLink && (
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              background: 'rgba(16, 185, 129, 0.12)',
                              border: '1px solid rgba(16, 185, 129, 0.3)',
                              color: '#34d399',
                              padding: '6px 12px',
                              borderRadius: '8px',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              textDecoration: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            <MessageCircle size={14} /> WhatsApp
                          </a>
                        )}

                        {!isReadOnly && (
                          <>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={() => handleOpenEditEvent(evt)}
                              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              type="button"
                              className="btn"
                              onClick={() => onDeleteEvent && onDeleteEvent(evt.id)}
                              style={{ padding: '6px 10px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', color: '#f87171', borderRadius: '8px' }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: CREAR / EDITAR CONTACTO DE DIRECTORIO           */}
      {/* ======================================================== */}
      {showContactModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          boxSizing: 'border-box'
        }}>
          <div className="glass-panel" style={{
            maxWidth: '640px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '26px',
            borderRadius: '16px',
            boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
            border: '1px solid var(--border-glass)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BookUser size={20} style={{ color: 'var(--primary-cyan)' }} />
                {editingContactId ? 'Editar Contacto de Agenda' : 'Nuevo Contacto en la Agenda'}
              </h3>
              <button
                type="button"
                onClick={() => setShowContactModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitContact}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                
                {/* Name / Razón Social */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                    Nombre o Razón Social *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Ferretería El Constructor, Maestro Pedro Gómez, Transportes SAS"
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-glass)',
                      background: 'rgba(0, 0, 0, 0.3)',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>

                {/* Category & Specialty */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                      Categoría
                    </label>
                    <select
                      value={contactForm.category}
                      onChange={(e) => setContactForm({ ...contactForm, category: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-glass)',
                        background: 'rgba(0, 0, 0, 0.3)',
                        color: 'var(--text-primary)',
                        fontSize: '0.9rem'
                      }}
                    >
                      {CONTACT_CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                      Especialidad / Productos
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Hierro figurado, Enchape, Pintura, Volqueta"
                      value={contactForm.specialty}
                      onChange={(e) => setContactForm({ ...contactForm, specialty: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-glass)',
                        background: 'rgba(0, 0, 0, 0.3)',
                        color: 'var(--text-primary)',
                        fontSize: '0.9rem'
                      }}
                    />
                  </div>
                </div>

                {/* Phone & Secondary Phone */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                      Teléfono / WhatsApp Principal *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="Ej. 3001234567"
                      value={contactForm.phone}
                      onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-glass)',
                        background: 'rgba(0, 0, 0, 0.3)',
                        color: 'var(--text-primary)',
                        fontSize: '0.9rem'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                      Teléfono Secundario / Fijo
                    </label>
                    <input
                      type="tel"
                      placeholder="Ej. 6044445566"
                      value={contactForm.phone_2}
                      onChange={(e) => setContactForm({ ...contactForm, phone_2: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-glass)',
                        background: 'rgba(0, 0, 0, 0.3)',
                        color: 'var(--text-primary)',
                        fontSize: '0.9rem'
                      }}
                    />
                  </div>
                </div>

                {/* Contact Person & NIT/Document */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                      Persona de Contacto / Asesor
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Don Jairo (Asesor comercial)"
                      value={contactForm.contactPerson}
                      onChange={(e) => setContactForm({ ...contactForm, contactPerson: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-glass)',
                        background: 'rgba(0, 0, 0, 0.3)',
                        color: 'var(--text-primary)',
                        fontSize: '0.9rem'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                      NIT / Cédula (Opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. 900.123.456-7"
                      value={contactForm.nitOrId}
                      onChange={(e) => setContactForm({ ...contactForm, nitOrId: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-glass)',
                        background: 'rgba(0, 0, 0, 0.3)',
                        color: 'var(--text-primary)',
                        fontSize: '0.9rem'
                      }}
                    />
                  </div>
                </div>

                {/* Email, Address & City */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                      Correo Electrónico
                    </label>
                    <input
                      type="email"
                      placeholder="ejemplo@proveedor.com"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-glass)',
                        background: 'rgba(0, 0, 0, 0.3)',
                        color: 'var(--text-primary)',
                        fontSize: '0.9rem'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                      Ciudad / Municipio
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Medellín, Envigado, Bello"
                      value={contactForm.city}
                      onChange={(e) => setContactForm({ ...contactForm, city: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-glass)',
                        background: 'rgba(0, 0, 0, 0.3)',
                        color: 'var(--text-primary)',
                        fontSize: '0.9rem'
                      }}
                    />
                  </div>
                </div>

                {/* Address & Associated Project */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                      Dirección / Barrio
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Calle 50 # 45-20, Barrio Colón"
                      value={contactForm.address}
                      onChange={(e) => setContactForm({ ...contactForm, address: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-glass)',
                        background: 'rgba(0, 0, 0, 0.3)',
                        color: 'var(--text-primary)',
                        fontSize: '0.9rem'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                      Obra o Proyecto Vinculado
                    </label>
                    <select
                      value={contactForm.projectId}
                      onChange={(e) => setContactForm({ ...contactForm, projectId: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-glass)',
                        background: 'rgba(0, 0, 0, 0.3)',
                        color: 'var(--text-primary)',
                        fontSize: '0.9rem'
                      }}
                    >
                      <option value="general">General / Ninguna en específico</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Notes & Commercial terms */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                    Notas, Condiciones de Pago y Precios
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Ej. Despacho a obra en 24h, crédito a 15 días, precios de cemento con flete incluido..."
                    value={contactForm.notes}
                    onChange={(e) => setContactForm({ ...contactForm, notes: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-glass)',
                      background: 'rgba(0, 0, 0, 0.3)',
                      color: 'var(--text-primary)',
                      fontSize: '0.88rem',
                      resize: 'vertical'
                    }}
                  />
                </div>

              </div>

              {/* Modal Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '22px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowContactModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '9px 24px', fontWeight: 700 }}
                >
                  {editingContactId ? 'Guardar Cambios' : 'Crear Contacto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: CREAR / EDITAR CITA O EVENTO EN CALENDARIO      */}
      {/* ======================================================== */}
      {showEventModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          boxSizing: 'border-box'
        }}>
          <div className="glass-panel" style={{
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '26px',
            borderRadius: '16px',
            boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
            border: '1px solid var(--border-glass)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CalendarIcon size={20} style={{ color: 'var(--primary-cyan)' }} />
                {editingEventId ? 'Editar Cita / Compromiso' : 'Programar Nueva Cita'}
              </h3>
              <button
                type="button"
                onClick={() => setShowEventModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitEvent}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                
                {/* Event Title */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                    Título de la Cita o Compromiso *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Visita avance cimientos, Reunión con cliente Apto 402, Llegada de volqueta"
                    value={eventFormData.title}
                    onChange={(e) => setEventFormData({ ...eventFormData, title: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-glass)',
                      background: 'rgba(0, 0, 0, 0.3)',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>

                {/* Event Type & Associated Project */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                      Tipo de Cita
                    </label>
                    <select
                      value={eventFormData.eventType}
                      onChange={(e) => setEventFormData({ ...eventFormData, eventType: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-glass)',
                        background: 'rgba(0, 0, 0, 0.3)',
                        color: 'var(--text-primary)',
                        fontSize: '0.9rem'
                      }}
                    >
                      {EVENT_TYPES.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                      Obra / Proyecto
                    </label>
                    <select
                      value={eventFormData.projectId}
                      onChange={(e) => setEventFormData({ ...eventFormData, projectId: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-glass)',
                        background: 'rgba(0, 0, 0, 0.3)',
                        color: 'var(--text-primary)',
                        fontSize: '0.9rem'
                      }}
                    >
                      <option value="general">Cita General / Sin Obra</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Date & Time */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                      Fecha *
                    </label>
                    <input
                      type="date"
                      required
                      value={eventFormData.date}
                      onChange={(e) => setEventFormData({ ...eventFormData, date: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-glass)',
                        background: 'rgba(0, 0, 0, 0.3)',
                        color: 'var(--text-primary)',
                        fontSize: '0.9rem'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                      Hora Inicio
                    </label>
                    <input
                      type="time"
                      value={eventFormData.startTime}
                      onChange={(e) => setEventFormData({ ...eventFormData, startTime: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-glass)',
                        background: 'rgba(0, 0, 0, 0.3)',
                        color: 'var(--text-primary)',
                        fontSize: '0.9rem'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                      Hora Fin
                    </label>
                    <input
                      type="time"
                      value={eventFormData.endTime}
                      onChange={(e) => setEventFormData({ ...eventFormData, endTime: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-glass)',
                        background: 'rgba(0, 0, 0, 0.3)',
                        color: 'var(--text-primary)',
                        fontSize: '0.9rem'
                      }}
                    />
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                    Lugar o Dirección de Encuentro
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Obra El Poblado, Oficina Habitech, Cra 43A # 1-50"
                    value={eventFormData.location}
                    onChange={(e) => setEventFormData({ ...eventFormData, location: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-glass)',
                      background: 'rgba(0, 0, 0, 0.3)',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>

                {/* Contact Name & Phone */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                      Contacto / Persona a Reunir
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Juan Pérez (Cliente), Maestro Dumar"
                      value={eventFormData.contactName}
                      onChange={(e) => setEventFormData({ ...eventFormData, contactName: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-glass)',
                        background: 'rgba(0, 0, 0, 0.3)',
                        color: 'var(--text-primary)',
                        fontSize: '0.9rem'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                      Celular / WhatsApp
                    </label>
                    <input
                      type="tel"
                      placeholder="Ej. 3001234567"
                      value={eventFormData.contactPhone}
                      onChange={(e) => setEventFormData({ ...eventFormData, contactPhone: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-glass)',
                        background: 'rgba(0, 0, 0, 0.3)',
                        color: 'var(--text-primary)',
                        fontSize: '0.9rem'
                      }}
                    />
                  </div>
                </div>

                {/* Priority & Status */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                      Prioridad
                    </label>
                    <select
                      value={eventFormData.priority}
                      onChange={(e) => setEventFormData({ ...eventFormData, priority: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-glass)',
                        background: 'rgba(0, 0, 0, 0.3)',
                        color: 'var(--text-primary)',
                        fontSize: '0.9rem'
                      }}
                    >
                      {PRIORITIES.map(pr => (
                        <option key={pr.id} value={pr.id}>{pr.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                      Estado
                    </label>
                    <select
                      value={eventFormData.status}
                      onChange={(e) => setEventFormData({ ...eventFormData, status: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-glass)',
                        background: 'rgba(0, 0, 0, 0.3)',
                        color: 'var(--text-primary)',
                        fontSize: '0.9rem'
                      }}
                    >
                      <option value="pending">Programada / Pendiente</option>
                      <option value="completed">Completada / Realizada</option>
                      <option value="cancelled">Cancelada</option>
                    </select>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                    Notas o Temas a Tratar
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Ej. Llevar muestras de porcelanato, revisar filtración en baño, entrega de acta..."
                    value={eventFormData.notes}
                    onChange={(e) => setEventFormData({ ...eventFormData, notes: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-glass)',
                      background: 'rgba(0, 0, 0, 0.3)',
                      color: 'var(--text-primary)',
                      fontSize: '0.88rem',
                      resize: 'vertical'
                    }}
                  />
                </div>

              </div>

              {/* Modal Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '22px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowEventModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '9px 24px', fontWeight: 700 }}
                >
                  {editingEventId ? 'Guardar Cambios' : 'Agendar Cita'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: EVENTOS DE UN DÍA ESPECÍFICO (DRILLDOWN)        */}
      {/* ======================================================== */}
      {selectedDayEvents && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          boxSizing: 'border-box'
        }}>
          <div className="glass-panel" style={{
            maxWidth: '520px',
            width: '100%',
            maxHeight: '85vh',
            overflowY: 'auto',
            padding: '24px',
            borderRadius: '16px',
            boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
            border: '1px solid var(--border-glass)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Compromisos del día
                </h3>
                <span style={{ fontSize: '0.82rem', color: 'var(--primary-cyan)', fontWeight: 600 }}>
                  {selectedDayEvents.dateStr}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDayEvents(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {selectedDayEvents.events.map(evt => {
                const typeObj = EVENT_TYPES.find(t => t.id === evt.eventType) || EVENT_TYPES[0];
                return (
                  <div
                    key={evt.id}
                    onClick={() => {
                      setSelectedDayEvents(null);
                      handleOpenEditEvent(evt);
                    }}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '10px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: `1px solid ${typeObj.border}`,
                      cursor: 'pointer',
                      transition: 'background 0.15s'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: typeObj.color, textTransform: 'uppercase' }}>
                        {typeObj.name}
                      </span>
                      {evt.startTime && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {evt.startTime} {evt.endTime && `- ${evt.endTime}`}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {evt.title}
                    </div>
                    {evt.location && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <MapPin size={12} style={{ color: '#f59e0b' }} /> {evt.location}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {!isReadOnly && (
              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    const dateStr = selectedDayEvents.dateStr;
                    setSelectedDayEvents(null);
                    handleOpenNewEvent({ date: dateStr });
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
                >
                  <Plus size={16} /> Agregar Cita este Día
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
