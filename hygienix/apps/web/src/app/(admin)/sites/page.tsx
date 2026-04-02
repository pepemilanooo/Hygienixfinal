'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import EmptyState from '@/components/ui/EmptyState';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import { Building2, MapPin, Search } from 'lucide-react';

export default function SitesPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['sites', search, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      const res = await apiClient.get(`/sites?${params}`);
      return res.data;
    },
  });

  const sites = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="page-header">
        <h1 className="page-title">Siti</h1>
      </div>

      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            className="input pl-9 w-full"
            placeholder="Cerca sito o cliente..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      {isLoading ? (
        <LoadingSkeleton.Table />
      ) : !sites.length ? (
        <EmptyState icon={Building2} title="Nessun sito" description="Nessun sito trovato" />
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Nome sito</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Cliente</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Indirizzo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Interventi</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Registrato il</th>
              </tr>
            </thead>
            <tbody>
              {sites.map((site: any) => (
                <tr
                  key={site.id}
                  className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => router.push(`/sites/${site.id}`)}
                >
                  <td className="px-4 py-3 font-semibold text-gray-900 flex items-center gap-2">
                    <Building2 size={16} className="text-gray-400" /> {site.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{site.client?.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1"><MapPin size={12} />{site.address}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{site._count?.interventions ?? 0}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatDate(site.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="px-4 py-3 border-t border-gray-100 flex justify-between items-center">
              <p className="text-sm text-gray-500">{pagination.total} siti totali</p>
              <div className="flex gap-2">
                <button
                  className="btn-secondary text-sm py-1"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  ‹ Precedente
                </button>
                <span className="text-sm text-gray-500 py-1">Pagina {page} di {pagination.totalPages}</span>
                <button
                  className="btn-secondary text-sm py-1"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= pagination.totalPages}
                >
                  Successiva ›
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
