'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Plus, Building2, Phone, MapPin, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { TableSkeleton } from '@/components/ui/LoadingSkeleton';
import { CLIENT_TYPE_LABELS, formatDate } from '@/lib/utils';
import type { ClientSummary } from '@hygienix/types';

const CLIENT_STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  SUSPENDED: 'bg-amber-100 text-amber-700',
  ARCHIVED: 'bg-gray-100 text-gray-500',
};

const CLIENT_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Attivo', SUSPENDED: 'Sospeso', ARCHIVED: 'Archiviato',
};

export default function ClientsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['clients', search, page, typeFilter],
    queryFn: () => api.get<{ data: ClientSummary[]; meta: { total: number; totalPages: number } }>('/clients', { search: search || undefined, page, limit: 20, type: typeFilter || undefined }),
    placeholderData: (prev) => prev,
  });

  const clients = data?.data || [];
  const meta = data?.meta;

  return (
    <div className="max-w-7xl space-y-5">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Clienti</h1>
          <p className="text-sm text-gray-500 mt-1">{meta?.total ?? '—'} clienti totali</p>
        </div>
        <Link href="/clients/new" className="btn-primary">
          <Plus className="w-4 h-4" /> Nuovo Cliente
        </Link>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cerca per nome, email, città..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="input pl-9"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          className="input w-auto min-w-[160px]"
        >
          <option value="">Tutti i tipi</option>
          {Object.entries(CLIENT_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? <TableSkeleton rows={8} cols={6} /> : clients.length === 0 ? (
          <EmptyState icon={Building2} title="Nessun cliente trovato" description={search ? 'Nessun risultato per la ricerca effettuata.' : 'Inizia aggiungendo il primo cliente.'} action={{ label: 'Nuovo Cliente', href: '/clients/new' }} />
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Tipo</th>
                  <th>Città</th>
                  <th>Contatto</th>
                  <th>Sedi / Interventi</th>
                  <th>Stato</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client.id} className="cursor-pointer" onClick={() => window.location.href = `/clients/${client.id}`}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-4 h-4 text-primary-700" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{client.businessName}</p>
                          {client.contactEmail && <p className="text-xs text-gray-400">{client.contactEmail}</p>}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge bg-blue-50 text-blue-700">{CLIENT_TYPE_LABELS[client.type] || client.type}</span>
                    </td>
                    <td>
                      {client.city && (
                        <div className="flex items-center gap-1 text-gray-500">
                          <MapPin className="w-3.5 h-3.5" />{client.city}
                        </div>
                      )}
                    </td>
                    <td>
                      {client.contactPhone && (
                        <div className="flex items-center gap-1 text-gray-500">
                          <Phone className="w-3.5 h-3.5" />{client.contactPhone}
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <span>{(client._count?.sites ?? 0)} sedi</span>
                        <span className="text-gray-300">·</span>
                        <span>{(client._count?.interventions ?? 0)} interventi</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${CLIENT_STATUS_COLORS[client.status] || 'bg-gray-100 text-gray-500'}`}>
                        {CLIENT_STATUS_LABELS[client.status] || client.status}
                      </span>
                    </td>
                    <td>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-sm">
            <span className="text-gray-500">Pagina {page} di {meta.totalPages} ({meta.total} totali)</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-40">← Precedente</button>
              <button onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))} disabled={page >= meta.totalPages} className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-40">Successiva →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
