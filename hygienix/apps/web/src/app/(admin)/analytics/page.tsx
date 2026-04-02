'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { KpiCard } from '@/components/ui/KpiCard';
import { KpiSkeleton } from '@/components/ui/LoadingSkeleton';
import { AlertTriangle, CheckCircle2, Users, MapPin, TrendingUp, Package } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';

interface TechPerf { technician: { firstName: string; lastName: string }; totalInterventions: number; completedInterventions: number; completionRate: number; averageDurationMinutes: number; }
interface ProblematicSite { site: { name: string; city?: string }; client: { businessName: string }; criticalCount: number; attentionCount: number; }
interface ProductUsage { product: { name: string; category: string }; usageCount: number; }
interface TrendPoint { date: string; completed: number; planned: number; }
interface Kpi { interventionsToday: number; interventionsOpen: number; interventionsCompletedThisMonth: number; activeTechnicians: number; activeClients: number; interventionsToSchedule: number; }

const COLORS = ['#1A6B3C', '#2ECC71', '#22c55e', '#16a34a', '#86efac', '#bbf7d0'];

export default function AnalyticsPage() {
  const { data: kpiRes, isLoading: kpiLoading } = useQuery({ queryKey: ['kpi'], queryFn: () => api.get<{ data: Kpi }>('/analytics/overview') });
  const { data: trendRes } = useQuery({ queryKey: ['trend-30'], queryFn: () => api.get<{ data: TrendPoint[] }>('/analytics/interventions', { days: '30' }) });
  const { data: techRes } = useQuery({ queryKey: ['tech-perf'], queryFn: () => api.get<{ data: TechPerf[] }>('/analytics/technicians') });
  const { data: sitesRes } = useQuery({ queryKey: ['prob-sites'], queryFn: () => api.get<{ data: ProblematicSite[] }>('/analytics/sites') });
  const { data: productsRes } = useQuery({ queryKey: ['product-usage'], queryFn: () => api.get<{ data: ProductUsage[] }>('/analytics/products') });

  const kpi = kpiRes?.data;
  const trend = trendRes?.data || [];
  const technicians = techRes?.data || [];
  const problematicSites = sitesRes?.data || [];
  const productUsage = productsRes?.data || [];

  return (
    <div className="max-w-7xl space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="text-sm text-gray-500">Dashboard operativa e performance</p>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpiLoading ? Array.from({ length: 6 }).map((_, i) => <KpiSkeleton key={i} />) : (
          <>
            <KpiCard title="Oggi" value={kpi?.interventionsToday ?? 0} icon={CheckCircle2} iconBg="bg-blue-50" iconColor="text-blue-700" />
            <KpiCard title="Aperti" value={kpi?.interventionsOpen ?? 0} icon={AlertTriangle} iconBg="bg-amber-50" iconColor="text-amber-700" />
            <KpiCard title="Completati (mese)" value={kpi?.interventionsCompletedThisMonth ?? 0} icon={TrendingUp} iconBg="bg-green-50" iconColor="text-green-700" />
            <KpiCard title="Tecnici" value={kpi?.activeTechnicians ?? 0} icon={Users} iconBg="bg-purple-50" iconColor="text-purple-700" />
            <KpiCard title="Clienti Attivi" value={kpi?.activeClients ?? 0} icon={MapPin} iconBg="bg-primary-50" iconColor="text-primary-700" />
            <KpiCard title="Da Pianificare" value={kpi?.interventionsToSchedule ?? 0} icon={AlertTriangle} iconBg="bg-red-50" iconColor="text-red-600" />
          </>
        )}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Trend */}
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 mb-1">Andamento Interventi (30gg)</h3>
          <p className="text-sm text-gray-500 mb-5">Pianificati vs Completati</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={v => { const d = new Date(v); return `${d.getDate()}/${d.getMonth() + 1}`; }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Line type="monotone" dataKey="completed" name="Completati" stroke="#1A6B3C" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="planned" name="Pianificati" stroke="#93c5fd" strokeWidth={2} dot={false} strokeDasharray="4 2" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Tech performance */}
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 mb-1">Performance Tecnici (mese)</h3>
          <p className="text-sm text-gray-500 mb-5">Interventi completati e tasso</p>
          {technicians.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={technicians.map(t => ({ name: `${t.technician.firstName} ${t.technician.lastName[0]}.`, total: t.totalInterventions, completed: t.completedInterventions }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="total" name="Totali" fill="#e5e7eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completed" name="Completati" fill="#1A6B3C" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-gray-400 text-center py-12">Nessun dato disponibile</p>}
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Sedi problematiche */}
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 mb-5">Sedi con Criticità (ultimi 3 mesi)</h3>
          {problematicSites.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Nessuna criticità rilevata — ottimo!</p>
          ) : (
            <div className="space-y-3">
              {problematicSites.slice(0, 6).map((s, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{(s.site as { name: string }).name}</p>
                    <p className="text-xs text-gray-400">{(s.client as { businessName: string }).businessName}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium flex-shrink-0">
                    {s.criticalCount > 0 && <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full">{s.criticalCount} critici</span>}
                    {s.attentionCount > 0 && <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full">{s.attentionCount} attenzione</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Prodotti più usati */}
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 mb-5">Prodotti Più Utilizzati (3 mesi)</h3>
          {productUsage.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 items-center">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={productUsage.slice(0, 6)} dataKey="usageCount" cx="50%" cy="50%" outerRadius={80} innerRadius={50}>
                    {productUsage.slice(0, 6).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => [`${v} usi`]} contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {productUsage.slice(0, 6).map((p, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-xs text-gray-600 truncate">{(p.product as { name: string }).name}</span>
                    <span className="text-xs font-semibold text-gray-900 ml-auto">{p.usageCount}x</span>
                  </div>
                ))}
              </div>
            </div>
          ) : <p className="text-sm text-gray-400 text-center py-12">Nessun dato disponibile</p>}
        </div>
      </div>

      {/* Technician table */}
      {technicians.length > 0 && (
        <div className="card">
          <div className="p-5 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Dettaglio Performance Tecnici</h3>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Tecnico</th>
                  <th>Interventi Totali</th>
                  <th>Completati</th>
                  <th>Tasso Completamento</th>
                  <th>Durata Media</th>
                </tr>
              </thead>
              <tbody>
                {technicians.map((t, i) => (
                  <tr key={i}>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-primary-100 rounded-full flex items-center justify-center text-xs font-bold text-primary-700">
                          {t.technician.firstName[0]}{t.technician.lastName[0]}
                        </div>
                        {t.technician.firstName} {t.technician.lastName}
                      </div>
                    </td>
                    <td><span className="font-semibold">{t.totalInterventions}</span></td>
                    <td><span className="text-primary-700 font-semibold">{t.completedInterventions}</span></td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-24">
                          <div className="bg-primary-700 h-2 rounded-full" style={{ width: `${t.completionRate}%` }} />
                        </div>
                        <span className="text-sm font-semibold text-gray-700">{t.completionRate}%</span>
                      </div>
                    </td>
                    <td>{t.averageDurationMinutes > 0 ? `${Math.floor(t.averageDurationMinutes / 60)}h ${t.averageDurationMinutes % 60}min` : 'N/D'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
