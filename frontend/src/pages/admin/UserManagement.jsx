import { useState, useEffect } from 'react';
import { Users, Shield, ShieldOff, Search, MoreHorizontal, Mail, Calendar, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { getAdminUsers, updateUserRole, updateUserStatus, deleteUser } from '../../api';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
  
  const currentUser = JSON.parse(sessionStorage.getItem('user') || '{}');

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await getAdminUsers(currentUser.id);
      setUsers(data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = async (targetId, newRole) => {
    try {
      await updateUserRole(currentUser.id, targetId, newRole);
      toast.success('Rol actualizado');
      fetchUsers();
    } catch (err) { toast.error(err.message); }
  };

  const handleStatusChange = async (targetId, currentStatus) => {
    try {
      await updateUserStatus(currentUser.id, targetId, !currentStatus);
      toast.success(currentStatus ? 'Usuario deshabilitado' : 'Usuario habilitado');
      fetchUsers();
    } catch (err) { toast.error(err.message); }
  };

  const handleDeleteUser = async (targetId) => {
    if (!window.confirm('¿Eliminar este usuario permanentemente?')) return;
    try {
      await deleteUser(currentUser.id, targetId);
      toast.success('Usuario eliminado');
      fetchUsers();
    } catch (err) { toast.error(err.message); }
    finally { setOpenMenuId(null); }
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-8 min-h-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[20px] font-bold text-[var(--upt-text-primary)] tracking-tight">Gestión de Usuarios</h1>
          <p className="text-[var(--upt-text-tertiary)] text-sm mt-1">Administra los accesos y roles de la comunidad universitaria EPIS.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--upt-text-tertiary)]" />
          <input type="text" placeholder="Buscar por nombre o correo..."
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-[var(--upt-surface)] border border-[var(--upt-surface-border)] rounded-lg py-2 pl-10 pr-4 text-sm text-[var(--upt-text-primary)] focus:outline-none focus:border-[var(--upt-gold)]/40 w-full md:w-72 transition-colors"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <StatCard icon={Users}     label="Total Usuarios"  value={users.length}                                 accent="blue" />
        <StatCard icon={UserCheck} label="Docentes"        value={users.filter(u => u.role === 'teacher').length} accent="gold" />
        <StatCard icon={Shield}    label="Administradores" value={users.filter(u => u.role === 'admin').length}   accent="gold" />
      </div>

      {/* Table */}
      <div className="bg-[var(--upt-surface)] rounded-xl border border-[var(--upt-surface-border)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[var(--upt-surface-border)] text-[11px] uppercase tracking-wider text-[var(--upt-text-tertiary)] font-semibold">
                <th className="px-5 py-3">Usuario</th>
                <th className="px-5 py-3">Rol</th>
                <th className="px-5 py-3">Estado</th>
                <th className="px-5 py-3">Último Acceso</th>
                <th className="px-5 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--upt-surface-border)]">
              {isLoading ? (
                Array(5).fill(0).map((_, i) => <LoadingRow key={i} />)
              ) : filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-[var(--upt-surface-light)]/40 transition-colors group">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} className="w-8 h-8 rounded-md border border-[var(--upt-surface-border)]" alt="" />
                      ) : (
                        <div className="w-8 h-8 rounded-md bg-[var(--upt-accent)]/10 border border-[var(--upt-accent)]/20 text-[var(--upt-accent)] flex items-center justify-center font-bold text-xs">
                          {user.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="text-[13px] font-semibold text-[var(--upt-text-primary)]">{user.name}</p>
                        <div className="flex items-center gap-1 text-[11px] text-[var(--upt-text-tertiary)]">
                          <Mail className="w-3 h-3" />{user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <select value={user.role} onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      disabled={user.id === currentUser.id}
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-md border outline-none cursor-pointer transition-colors focus:border-[var(--upt-gold)]/30
                        ${user.role === 'admin'   ? 'bg-[var(--upt-gold)]/10 text-[var(--upt-gold)] border-[var(--upt-gold)]/25' :
                          user.role === 'teacher'  ? 'bg-[var(--upt-accent)]/10 text-[var(--upt-accent-light)] border-[var(--upt-accent)]/20' :
                                                    'bg-[var(--upt-surface-light)] text-[var(--upt-text-secondary)] border-[var(--upt-surface-border)]'}`}
                      style={{ colorScheme: 'inherit' }}
                    >
                      <option value="student">Estudiante</option>
                      <option value="teacher">Docente</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </td>
                  <td className="px-5 py-3.5">
                    <button onClick={() => handleStatusChange(user.id, user.is_active)}
                      disabled={user.id === currentUser.id}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border cursor-pointer bg-transparent disabled:opacity-30 transition-colors"
                      style={{
                        color: user.is_active ? 'var(--upt-success)' : 'var(--upt-error)',
                        borderColor: user.is_active ? 'color-mix(in srgb, var(--upt-success) 25%, transparent)' : 'color-mix(in srgb, var(--upt-error) 25%, transparent)',
                      }}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${user.is_active ? 'bg-[var(--upt-success)]' : 'bg-[var(--upt-error)]'}`} />
                      {user.is_active ? 'Activo' : 'Suspendido'}
                    </button>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5 text-[11px] text-[var(--upt-text-tertiary)]">
                      <Calendar className="w-3 h-3" />
                      {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'N/A'}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-right relative">
                    <button onClick={() => setOpenMenuId(openMenuId === user.id ? null : user.id)}
                      className={`w-7 h-7 rounded-md inline-flex items-center justify-center transition-colors ${openMenuId === user.id ? 'bg-[var(--upt-surface-light)]/80 text-[var(--upt-text-primary)]' : 'text-[var(--upt-text-tertiary)] hover:text-[var(--upt-text-primary)] hover:bg-[var(--upt-surface-light)]'}`}>
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                    {openMenuId === user.id && (
                      <div className="absolute right-5 top-12 w-40 bg-[var(--upt-bg-deep)] border border-[var(--upt-surface-border)] rounded-lg shadow-xl z-50 py-1">
                        <button onClick={() => { navigator.clipboard.writeText(user.id); toast.success('ID copiado'); setOpenMenuId(null); }}
                          className="w-full text-left px-3.5 py-2 text-xs text-[var(--upt-text-secondary)] hover:bg-[var(--upt-surface-light)] transition-colors">Copiar ID</button>
                        <button disabled={user.id === currentUser.id} onClick={() => handleDeleteUser(user.id)}
                          className="w-full text-left px-3.5 py-2 text-xs text-[var(--upt-error)]/70 hover:bg-[var(--upt-error)]/[0.06] hover:text-[var(--upt-error)] transition-colors disabled:opacity-30">Eliminar Usuario</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!isLoading && filteredUsers.length === 0 && (
            <div className="py-16 text-center">
              <Users className="w-8 h-8 text-[var(--upt-text-tertiary)]/10 mx-auto mb-3" />
              <p className="text-sm text-[var(--upt-text-tertiary)]">No se encontraron usuarios.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, accent }) {
  const isGold = accent === 'gold';
  return (
    <div className="p-4 rounded-xl bg-[var(--upt-surface)] border border-[var(--upt-surface-border)] flex items-center gap-3.5 hover:bg-[var(--upt-surface-light)] transition-colors">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
        isGold ? 'bg-[var(--upt-gold)]/10 border-[var(--upt-gold)]/20' : 'bg-[var(--upt-accent)]/10 border-[var(--upt-accent)]/20'
      }`}>
        <Icon className={`w-4 h-4 ${isGold ? 'text-[var(--upt-gold)]' : 'text-[var(--upt-accent-light)]'}`} />
      </div>
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--upt-text-tertiary)]">{label}</p>
        <p className="text-xl font-bold text-[var(--upt-text-primary)] leading-tight">{value}</p>
      </div>
    </div>
  );
}

function LoadingRow() {
  return (
    <tr className="animate-pulse">
      <td className="px-5 py-3.5"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-md bg-[var(--upt-surface-light)]" /><div className="space-y-1.5"><div className="h-3 w-24 bg-[var(--upt-surface-light)] rounded" /><div className="h-2 w-32 bg-[var(--upt-surface-light)] rounded" /></div></div></td>
      <td className="px-5 py-3.5"><div className="h-6 w-20 bg-[var(--upt-surface-light)] rounded-md" /></td>
      <td className="px-5 py-3.5"><div className="h-6 w-20 bg-[var(--upt-surface-light)] rounded-md" /></td>
      <td className="px-5 py-3.5"><div className="h-3 w-16 bg-[var(--upt-surface-light)] rounded" /></td>
      <td className="px-5 py-3.5 text-right"><div className="h-7 w-7 bg-[var(--upt-surface-light)] rounded-md ml-auto" /></td>
    </tr>
  );
}
