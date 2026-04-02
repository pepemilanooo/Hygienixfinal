'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Bug, Loader2 } from 'lucide-react';
import { loginSchema, type LoginSchema } from '@hygienix/validators';
import { useAuthStore } from '@/store/auth.store';
import { api, getApiError } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(values: LoginSchema) {
    setError(null);
    try {
      const res = await api.post<{ data: { accessToken: string; refreshToken: string; user: Parameters<typeof setAuth>[0] } }>('/auth/login', values);
      const { accessToken, refreshToken, user } = res.data;
      setAuth(user, accessToken, refreshToken);
      router.push('/dashboard');
    } catch (err) {
      setError(getApiError(err));
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 flex items-center justify-center p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/15 backdrop-blur rounded-2xl mb-4 shadow-lg">
            <Bug className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Hygienix</h1>
          <p className="text-primary-200 mt-1 text-sm">Gestionale Pest Control</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-modal p-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Accedi al tuo account</h2>
            <p className="text-gray-500 text-sm mt-1">Inserisci le credenziali per continuare</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                placeholder="nome@azienda.it"
                className="input"
                autoFocus
              />
              {errors.email && <p className="error-msg">{errors.email.message}</p>}
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="input pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="error-msg">{errors.password.message}</p>}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                {error}
              </div>
            )}

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full mt-2">
              {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Accesso in corso...</> : 'Accedi'}
            </button>
          </form>

          {/* Demo hint */}
          <div className="mt-6 pt-5 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center font-medium mb-3">Credenziali Demo</p>
            <div className="grid grid-cols-3 gap-2 text-xs text-center text-gray-500">
              <div className="bg-gray-50 rounded-lg p-2">
                <div className="font-semibold text-gray-700">Admin</div>
                <div className="text-gray-400">admin@hygienix.app</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <div className="font-semibold text-gray-700">Manager</div>
                <div className="text-gray-400">manager@hygienix.app</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <div className="font-semibold text-gray-700">Tecnico</div>
                <div className="text-gray-400">tecnico1@hygienix.app</div>
              </div>
            </div>
            <p className="text-xs text-center text-gray-400 mt-2">Password: Admin1234! / Manager1234! / Tech1234!</p>
          </div>
        </div>

        <p className="text-center text-primary-200 text-xs mt-6">
          © {new Date().getFullYear()} Hygienix · Tutti i diritti riservati
        </p>
      </div>
    </div>
  );
}
