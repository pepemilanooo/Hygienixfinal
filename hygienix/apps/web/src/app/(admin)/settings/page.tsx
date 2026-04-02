'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { Settings, User, Lock, Bell } from 'lucide-react';

export default function SettingsPage() {
  const { user, setAuth } = useAuthStore();
  const [activeSection, setActiveSection] = useState<'profile' | 'security' | 'notifications'>('profile');
  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    phone: '',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof profileForm) => {
      const res = await apiClient.put('/auth/me', data);
      return res.data;
    },
    onSuccess: (data) => {
      setSuccess('Profilo aggiornato con successo');
      setError('');
    },
    onError: () => {
      setError('Errore nell\'aggiornamento del profilo');
      setSuccess('');
    },
  });

  const sections = [
    { key: 'profile', label: 'Profilo', icon: User },
    { key: 'security', label: 'Sicurezza', icon: Lock },
    { key: 'notifications', label: 'Notifiche', icon: Bell },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="page-header">
        <h1 className="page-title flex items-center gap-2"><Settings size={24} /> Impostazioni</h1>
      </div>

      <div className="grid grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="col-span-1">
          <nav className="card p-2">
            {sections.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeSection === key
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
                onClick={() => setActiveSection(key as any)}
              >
                <Icon size={16} /> {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="col-span-3">
          {success && (
            <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded-lg border border-green-200 mb-4">
              ✅ {success}
            </div>
          )}
          {error && (
            <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg border border-red-200 mb-4">
              ❌ {error}
            </div>
          )}

          {activeSection === 'profile' && (
            <div className="card">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Dati personali</h2>

              {/* Avatar */}
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
                <div className="w-16 h-16 rounded-full bg-primary-100 text-primary-700 font-bold text-xl flex items-center justify-center">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{user?.firstName} {user?.lastName}</p>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                  <p className="text-xs text-gray-400 mt-1 capitalize">{user?.role?.toLowerCase()}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Nome</label>
                    <input
                      className="input w-full"
                      value={profileForm.firstName}
                      onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">Cognome</label>
                    <input
                      className="input w-full"
                      value={profileForm.lastName}
                      onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="label">Email</label>
                  <input className="input w-full" value={user?.email ?? ''} disabled className="input w-full opacity-50 cursor-not-allowed" />
                  <p className="text-xs text-gray-400 mt-1">L'email non può essere modificata</p>
                </div>
                <div>
                  <label className="label">Telefono</label>
                  <input
                    className="input w-full"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    placeholder="+39 000 0000000"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  className="btn-primary"
                  onClick={() => updateProfileMutation.mutate(profileForm)}
                  disabled={updateProfileMutation.isPending}
                >
                  {updateProfileMutation.isPending ? 'Salvataggio...' : 'Salva modifiche'}
                </button>
              </div>
            </div>
          )}

          {activeSection === 'security' && (
            <div className="card">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Cambio password</h2>
              <div className="space-y-4">
                <div>
                  <label className="label">Password attuale</label>
                  <input
                    type="password"
                    className="input w-full"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Nuova password</label>
                  <input
                    type="password"
                    className="input w-full"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    placeholder="Min. 8 caratteri"
                  />
                </div>
                <div>
                  <label className="label">Conferma nuova password</label>
                  <input
                    type="password"
                    className="input w-full"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  className="btn-primary"
                  disabled={!passwordForm.currentPassword || !passwordForm.newPassword || passwordForm.newPassword !== passwordForm.confirmPassword}
                >
                  Aggiorna password
                </button>
              </div>
            </div>
          )}

          {activeSection === 'notifications' && (
            <div className="card">
              <h2 className="text-lg font-bold text-gray-900 mb-6">Preferenze notifiche</h2>
              <div className="space-y-4">
                {[
                  { label: 'Nuovi interventi assegnati', desc: 'Ricevi una notifica quando ti viene assegnato un intervento' },
                  { label: 'Promemoria giornaliero', desc: 'Riepilogo degli interventi del giorno alle 8:00' },
                  { label: 'Interventi in ritardo', desc: 'Avviso se un intervento pianificato non è stato avviato' },
                ].map(({ label, desc }) => (
                  <div key={label} className="flex items-start justify-between py-3 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer ml-4">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-primary-600 peer-focus:ring-2 peer-focus:ring-primary-300 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
                    </label>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex justify-end">
                <button className="btn-primary">Salva preferenze</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
