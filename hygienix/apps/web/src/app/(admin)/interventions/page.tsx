'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Plus, ClipboardList, ChevronRight, Calendar } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { TableSkeleton } from '@/components/ui/LoadingSkeleton';
import { formatDate, formatDateTime, SERVICE_TYPE_LABELS, PRIORITY_LABELS } from '@/lib/utils';
import type { InterventionSummary } from '@hygienix/types';

const STATUSES = ['PLANNED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CLOSED'];

export default function InterventionsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['interventions', search, statusFilter, page],
    queryFn: () => api.get<{ data: InterventionSummary[]; meta: { total: number; totalPages: number } }>('/interventions', {
      search: search || undefined,
      status: statusFilter || undefined,
      page,
      limit: 20,
    }),
    placeholderData: (prev) => prev,
  });

  const interventions = data?.data || [];
  const meta = data?.meta;

  const PRIORITY_DOTS: Record<string, string> = {
    LOW: 'bg-gray-300', NORMAL: 'bg-blue-400', HIGH: 'bg-orange-400', URGENT: 'bg-red-500',
  };

  return (
    <div className="max-w-7xl space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Interventi</h1>
          <p className="text-sm text-gray-500 mt-1">{meta?.total ?? '—'} interventi totali</p>
        </div>
        <Link href="/interventions/new" className="btn-primary">
          <Plus className="w-4 h-4" /> Nuovo Intervento
        </Link>
      </div>

      {/* Status tabs */}
      <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        <button onClick={() => { setStatusFilter(''); setPage(1); }} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${!statusFilter ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}>
          Tutti
        </button>
        {STATUSES.map(s => (
          <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${statusFilter === s ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}>
            <StatusBadge value={s} />
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="card p-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Cerca per cliente, sede..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="input pl-9" />
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? <TableSkeleton rows={8} cols={7} /> : interventions.length === 0 ? (
          <EmptyState icon={ClipboardList} title="Nessun intervento trovato" action={{ label: 'Nuovo Intervento', href: '/interventions/new' }} />
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Cliente / Sede</th>
                  <th>Servizio</th>
                  <th>Tecnico</th>
                  <th>Data Pianificata</th>
                  <th>Priorità</th>
                  <th>Stato</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {interventions.map((iv) => (
                  <tr key={iv.id} className="cursor-pointer" onClick={() => window.location.href = `/interventions/${iv.id}`}>
                    <td>
                      <div>
                        <p className="font-semibold text-gray-900">{iv.client.businessName}</p>
                        <p className="text-xs text-gray-400">{iv.site.name}{iv.site.city ? ` · ${iv.site.city}` : ''}</p>
                      </div>
                    </td>
                    <td>
                      <span className="text-sm text-gray-700">{SERVICE_TYPE_LABELS[iv.serviceType] || iv.serviceType}</span>
                    </td>
                    <td>
                      {iv.assignedTechnician ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-semibold text-gray-600">
                            {iv.assignedTechnician.firstName[0]}{iv.assignedTechnician.lastName[0]}
                          </div>
                          <span className="text-sm text-gray-700">{iv.assignedTechnician.firstName} {iv.assignedTechnician.lastName}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-amber-600 font-medium">Non assegnato</span>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        {formatDateTime(iv.scheduledAt)}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${PRIORITY_DOTS[iv.priority]}`} />
                        <span className="text-sm text-gray-600">{PRIORITY_LABELS[iv.priority]}</span>
                      </div>
                    </td>
                    <td><StatusBadge value={iv.status} /></td>
                    <td><ChevronRight className="w-4 h-4 text-gray-400" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {meta && meta.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-sm">
            <span className="text-gray-500">Pagina {page} di {meta.totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-40">← Prec.</button>
              <button onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))} disabled={page >= meta.totalPages} className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-40">Succ. →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
