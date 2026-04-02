'use client';

import { useQuery } from '@tanstack/react-query';
import { ClipboardList, Users, MapPin, AlertTriangle, CheckCircle2, Calendar, TrendingUp, Clock } from 'lucide-react';
import { KpiCard } from '@/components/ui/KpiCard';
import { KpiSkeleton } from '@/components/ui/LoadingSkeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { api } from '@/lib/api';
import { formatDateTime, SERVICE_TYPE_LABELS } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Link from 'next/link';

interface Kpi { interventionsToday: number; interventionsOpen: number; interventionsCompletedThisMonth: number; activeTechnicians: number; activeClients: number; interventionsToSchedule: number; }
interface Intervention { id: string; serviceType: string; status: string; priority: string; scheduledAt: string; client: { businessName: string }; site: { name: string }; assignedTechnician?: { firstName: string; lastName: string }; }
interface TrendPoint { date: string; completed: number; planned: number; }

export default function DashboardPage() {
  const { data: kpiRes, isLoading: kpiLoading } = useQuery({
    queryKey: ['analytics-overview'],
    queryFn: () => api.get<{ data: Kpi }>('/analytics/overview'),
  });

  const { data: todayRes, isLoading: todayLoading } = useQuery({
    queryKey: ['interventions-today'],
    queryFn: () => {
      const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
      return api.get<{ data: Intervention[] }>('/interventions', { from: todayStart.toISOString(), to: todayEnd.toISOString(), limit: 10 });
    },
  });

  const { data: trendRes } = useQuery({
    queryKey: ['analytics-trend'],
    queryFn: () => api.get<{ data: TrendPoint[] }>('/analytics/interventions', { days: '30' }),
  });

  const kpi = kpiRes?.data;
  const todayInterventions = todayRes?.data || [];
  const trend = trendRes?.data || [];

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Alert banner */}
      {kpi && kpi.interventionsToSchedule > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-900">
              {kpi.interventionsToSchedule} interventi senza tecnico assegnato
            </p>
            <p className="text-xs text-amber-700 mt-0.5">Accedi al calendario per assegnarli ai tecnici disponibili.</p>
          </div>
          <Link href="/interventions?status=PLANNED" className="ml-auto text-sm font-semibold text-amber-700 hover:text-amber-900 flex-shrink-0">
            Visualizza →
          </Link>
        </div>
      )}

      {/* KPI Grid */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Riepilogo Operativo</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {kpiLoading ? Array.from({ length: 6 }).map((_, i) => <KpiSkeleton key={i} />) : (
            <>
              <KpiCard title="Interventi Oggi" value={kpi?.interventionsToday ?? 0} icon={Calendar} iconBg="bg-blue-50" iconColor="text-blue-700" subtitle="Pianificati per oggi" />
              <KpiCard title="Aperti" value={kpi?.interventionsOpen ?? 0} icon={Clock} iconBg="bg-amber-50" iconColor="text-amber-700" subtitle="Da completare" />
              <KpiCard title="Questo Mese" value={kpi?.interventionsCompletedThisMonth ?? 0} icon={CheckCircle2} iconBg="bg-green-50" iconColor="text-green-700" subtitle="Completati" />
              <KpiCard title="Tecnici Attivi" value={kpi?.activeTechnicians ?? 0} icon={Users} iconBg="bg-purple-50" iconColor="text-purple-700" />
              <KpiCard title="Clienti Attivi" value={kpi?.activeClients ?? 0} icon={MapPin} iconBg="bg-primary-50" iconColor="text-primary-700" />
              <KpiCard title="Da Pianificare" value={kpi?.interventionsToSchedule ?? 0} icon={AlertTriangle} iconBg="bg-red-50" iconColor="text-red-600" subtitle="Senza tecnico" />
            </>
          )}
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Trend chart */}
        <div className="xl:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold text-gray-900">Andamento Interventi</h3>
              <p className="text-sm text-gray-500">Ultimi 30 giorni</p>
            </div>
            <TrendingUp className="w-5 h-5 text-primary-700" />
          </div>
          {trend.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6b7280' }} tickFormatter={v => { const d = new Date(v); return `${d.getDate()}/${d.getMonth() + 1}`; }} />
                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line type="monotone" dataKey="completed" name="Completati" stroke="#1A6B3C" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="planned" name="Pianificati" stroke="#93c5fd" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-56 flex items-center justify-center text-gray-400 text-sm">Nessun dato disponibile</div>
          )}
        </div>

        {/* Today interventions */}
        <div className="card">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Interventi di Oggi</h3>
              <p className="text-sm text-gray-500">{todayInterventions.length} totali</p>
            </div>
            <Link href="/interventions" className="text-sm font-semibold text-primary-700 hover:text-primary-800">
              Tutti →
            </Link>
          </div>
          {todayLoading ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />)}
            </div>
          ) : todayInterventions.length === 0 ? (
            <EmptyState icon={Calendar} title="Nessun intervento oggi" description="Non ci sono interventi pianificati per oggi." />
          ) : (
            <div className="divide-y divide-gray-100">
              {todayInterventions.map((iv) => (
                <Link key={iv.id} href={`/interventions/${iv.id}`} className="flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{iv.client.businessName}</p>
                    <p className="text-xs text-gray-500 truncate">{iv.site.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{SERVICE_TYPE_LABELS[iv.serviceType]}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <StatusBadge value={iv.status} />
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(iv.scheduledAt).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { href: '/interventions/new', label: 'Nuovo Intervento', icon: ClipboardList, color: 'bg-primary-700' },
          { href: '/clients/new', label: 'Nuovo Cliente', icon: Users, color: 'bg-blue-600' },
          { href: '/calendar', label: 'Apri Calendario', icon: Calendar, color: 'bg-purple-600' },
          { href: '/analytics', label: 'Vedi Analytics', icon: TrendingUp, color: 'bg-amber-600' },
        ].map(item => (
          <Link key={item.href} href={item.href} className={`${item.color} text-white rounded-xl p-4 flex items-center gap-3 hover:opacity-90 transition-opacity`}>
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-semibold">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
