'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { formatDate, getInitials } from '@/lib/utils';
import EmptyState from '@/components/ui/EmptyState';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import { Users, Plus, Trash2, Shield } from 'lucide-react';

const ROLE_LABELS: Record<string, { label: string; className: string; emoji: string }> = {
  ADMIN: { label: 'Admin', className: 'bg-purple-100 text-purple-700', emoji: '👑' },
  MANAGER: { label: 'Manager', className: 'bg-blue-100 text-blue-700', emoji: '📊' },
  TECHNICIAN: { label: 'Tecnico', className: 'bg-green-100 text-green-700', emoji: '🔧' },
};

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  phone?: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

const emptyForm = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  role: 'TECHNICIAN',
  phone: '',
};

export default function UsersPage() {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await apiClient.get('/users?limit=100');
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await apiClient.post('/users', data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      setShowModal(false);
      setForm(emptyForm);
      setFormError('');
    },
    onError: (e: any) => {
      setFormError(e?.response?.data?.error?.message ?? 'Errore nella creazione');
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await apiClient.put(`/users/${id}`, { isActive });
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });

  const users: User[] = data?.data ?? [];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="page-header">
        <div>
          <h1 className="page-title">Utenti</h1>
          <p className="text-gray-500 text-sm mt-1">Gestione account e ruoli</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Nuovo utente
        </button>
      </div>

      {/* Role summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {Object.entries(ROLE_LABELS).map(([role, { label, className, emoji }]) => (
          <div key={role} className="card text-center">
            <p className="text-3xl mb-2">{emoji}</p>
            <p className="text-2xl font-bold text-gray-900">
              {users.filter((u) => u.role === role).length}
            </p>
            <p className="text-sm text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Users Table */}
      {isLoading ? (
        <LoadingSkeleton.Table />
      ) : !users.length ? (
        <EmptyState icon={Users} title="Nessun utente" description="Aggiungi il primo membro del team" />
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Utente</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Email</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Ruolo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Stato</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Ultimo login</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const roleInfo = ROLE_LABELS[user.role];
                return (
                  <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 font-bold text-sm flex items-center justify-center">
                          {getInitials(`${user.firstName} ${user.lastName}`)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{user.firstName} {user.lastName}</p>
                          {user.phone && <p className="text-xs text-gray-400">{user.phone}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${roleInfo?.className}`}>
                        {roleInfo?.emoji} {roleInfo?.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {user.isActive ? 'Attivo' : 'Disabilitato'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {user.lastLoginAt ? formatDate(user.lastLoginAt) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        className={`text-xs px-2 py-1 rounded font-semibold transition-colors ${
                          user.isActive
                            ? 'text-red-500 hover:bg-red-50'
                            : 'text-green-600 hover:bg-green-50'
                        }`}
                        onClick={() => toggleActiveMutation.mutate({ id: user.id, isActive: !user.isActive })}
                      >
                        {user.isActive ? 'Disabilita' : 'Riabilita'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* New User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900">Nuovo utente</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-700 text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              {formError && (
                <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg border border-red-200">
                  {formError}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Nome *</label>
                  <input className="input w-full" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
                </div>
                <div>
                  <label className="label">Cognome *</label>
                  <input className="input w-full" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="label">Email *</label>
                <input type="email" className="input w-full" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <label className="label">Password *</label>
                <input type="password" className="input w-full" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min. 8 caratteri" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Ruolo *</label>
                  <select className="input w-full" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                    <option value="TECHNICIAN">🔧 Tecnico</option>
                    <option value="MANAGER">📊 Manager</option>
                    <option value="ADMIN">👑 Admin</option>
                  </select>
                </div>
                <div>
                  <label className="label">Telefono</label>
                  <input className="input w-full" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+39..." />
                </div>
              </div>
            </div>
            <div className="p-6 pt-0 flex justify-end gap-3">
              <button className="btn-secondary" onClick={() => setShowModal(false)}>Annulla</button>
              <button
                className="btn-primary"
                onClick={() => createMutation.mutate(form)}
                disabled={!form.firstName || !form.lastName || !form.email || !form.password || createMutation.isPending}
              >
                {createMutation.isPending ? '...' : 'Crea utente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
