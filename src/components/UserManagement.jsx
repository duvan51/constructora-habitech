import React, { useState, useEffect } from 'react';
import { getUsers, saveUser, deleteUser } from '../db/supabase';
import { UserPlus, Trash2, Shield, Eye, Edit2, Mail, Key, User } from 'lucide-react';

export default function UserManagement({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [role, setRole] = useState('viewer');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const allUsers = await getUsers();
      setUsers(allUsers);
    } catch (err) {
      console.error(err);
      setError('No se pudieron cargar los usuarios. Verifica que la tabla "users" exista en la base de datos.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name || !email || !pin || !role) {
      setError('Por favor completa todos los campos.');
      return;
    }

    if (pin.length !== 4 || isNaN(pin)) {
      setError('El PIN debe ser un número de exactamente 4 dígitos.');
      return;
    }

    setSaving(true);
    try {
      await saveUser({
        name,
        email: email.trim().toLowerCase(),
        pin,
        role
      });
      setSuccess('Usuario guardado exitosamente.');
      // Clear form
      setName('');
      setEmail('');
      setPin('');
      setRole('viewer');
      // Refresh list
      await fetchUsers();
    } catch (err) {
      console.error(err);
      setError('Error al guardar el usuario: ' + (err.message || 'Error desconocido.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (emailToDelete) => {
    if (emailToDelete.toLowerCase() === currentUser.email.toLowerCase()) {
      alert('No puedes eliminar tu propio usuario administrador.');
      return;
    }

    if (confirm(`¿Estás seguro de eliminar al usuario ${emailToDelete}? Esta acción no se puede deshacer.`)) {
      setError('');
      setSuccess('');
      try {
        await deleteUser(emailToDelete);
        setSuccess('Usuario eliminado correctamente.');
        await fetchUsers();
      } catch (err) {
        console.error(err);
        setError('Error al eliminar usuario: ' + (err.message || 'Error desconocido.'));
      }
    }
  };

  const getRoleBadge = (userRole) => {
    switch (userRole) {
      case 'admin':
        return <span className="badge badge-active" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc', borderColor: 'rgba(99, 102, 241, 0.3)' }}>Administrador</span>;
      case 'editor':
        return <span className="badge badge-completed">Editor</span>;
      case 'viewer':
      default:
        return <span className="badge badge-planning" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fde047', borderColor: 'rgba(245, 158, 11, 0.3)' }}>Solo Ver</span>;
    }
  };

  return (
    <div className="user-management-container animate-fade-in">
      <div style={{ marginBottom: '25px' }}>
        <h1>Gestión de Usuarios</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Crea y administra los usuarios y roles autorizados para acceder a Habitech Constructor.
        </p>
      </div>

      {error && (
        <div style={{
          background: 'rgba(244, 63, 94, 0.12)',
          border: '1px solid rgba(244, 63, 94, 0.3)',
          borderRadius: '10px',
          padding: '12px 18px',
          marginBottom: '20px',
          color: '#fda4af',
          fontSize: '0.9rem'
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '10px',
          padding: '12px 18px',
          marginBottom: '20px',
          color: '#6ee7b7',
          fontSize: '0.9rem'
        }}>
          {success}
        </div>
      )}

      <div className="grid-2" style={{ gridTemplateColumns: '1.2fr 1.8fr', alignItems: 'start' }}>
        {/* Form panel to create user */}
        <div className="glass-panel" style={{ padding: '25px' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.25rem', marginTop: 0 }}>
            <UserPlus size={20} style={{ color: 'var(--primary-cyan)' }} />
            Registrar Nuevo Usuario
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
            Los usuarios creados podrán iniciar sesión con su correo electrónico y el PIN de 4 dígitos.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={14} /> Nombre Completo
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="Nombre del usuario..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={saving}
                required
              />
            </div>

            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Mail size={14} /> Correo Electrónico
              </label>
              <input
                type="email"
                className="form-control"
                placeholder="usuario@constructora.com..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={saving}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Key size={14} /> PIN (4 números)
                </label>
                <input
                  type="password"
                  maxLength={4}
                  pattern="[0-9]*"
                  inputMode="numeric"
                  className="form-control"
                  placeholder="1234"
                  value={pin}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    if (val.length <= 4) setPin(val);
                  }}
                  disabled={saving}
                  required
                />
              </div>

              <div className="form-group">
                <label>Rol asignado</label>
                <select
                  className="form-control"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  disabled={saving}
                >
                  <option value="viewer">Solo Ver (Viewer)</option>
                  <option value="editor">Editar (Editor)</option>
                  <option value="admin">Administrador (Admin)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
              style={{ width: '100%', marginTop: '10px' }}
            >
              {saving ? 'Guardando...' : 'Crear Usuario'}
            </button>
          </form>
        </div>

        {/* Users directory panel */}
        <div className="glass-panel" style={{ padding: '25px' }}>
          <h2 style={{ fontSize: '1.25rem', marginTop: 0, marginBottom: '20px' }}>
            Usuarios Registrados ({users.length})
          </h2>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
              <svg width="30" height="30" viewBox="0 0 50 50" style={{ animation: 'spin 1s linear infinite', marginBottom: '10px' }}>
                <circle cx="25" cy="25" r="20" fill="none" stroke="var(--primary-cyan)" strokeWidth="4" strokeDasharray="31.4 31.4" />
              </svg>
              <div>Cargando usuarios...</div>
            </div>
          ) : users.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              No hay usuarios en la base de datos.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    <th style={{ padding: '12px 8px' }}>Usuario</th>
                    <th style={{ padding: '12px 8px' }}>Email</th>
                    <th style={{ padding: '12px 8px' }}>Rol</th>
                    <th style={{ padding: '12px 8px', textAlign: 'center' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => {
                    const isSelf = user.email.toLowerCase() === currentUser.email.toLowerCase();
                    return (
                      <tr key={user.email} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', fontSize: '0.9rem', verticalAlign: 'middle' }}>
                        <td style={{ padding: '14px 8px' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{user.name}</div>
                          {isSelf && <span style={{ fontSize: '0.7rem', color: 'var(--primary-cyan)' }}>(Tú)</span>}
                        </td>
                        <td style={{ padding: '14px 8px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                          {user.email}
                        </td>
                        <td style={{ padding: '14px 8px' }}>
                          {getRoleBadge(user.role)}
                        </td>
                        <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                          <button
                            type="button"
                            className="btn-icon"
                            onClick={() => handleDelete(user.email)}
                            disabled={isSelf}
                            title={isSelf ? 'No puedes borrarte a ti mismo' : 'Eliminar usuario'}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: isSelf ? 'var(--text-muted)' : 'var(--primary-red)',
                              cursor: isSelf ? 'not-allowed' : 'pointer',
                              padding: '5px'
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
