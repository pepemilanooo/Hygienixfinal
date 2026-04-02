'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiClient, getApiError } from '@/lib/api';
import { formatDate, formatDateTime } from '@/lib/utils';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import { Building2, MapPin, Phone, Mail, Calendar, ArrowLeft, ClipboardList } from 'lucide-react';

const CLIENT_TYPE_LABELS: Record<string, string> = {
  RESTAURANT: 'Ristorante',
  HOTEL: 'Hotel',
  HOSPITAL: 'Ospedale',
  SCHOOL: 'Scuola',
  OFFICE: 'Ufficio',
  WAREHOUSE: 'Magazzino',
  RETAIL: 'Retail',
  FOOD_PRODUCTION: 'Produzione alimentare',
  OTHER: 'Altro',
};

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'sites' | 'interventions'>('sites');

  const { data: client, isLoading, error } = useQuery({
    queryKey: ['client', id],
    queryFn: async () => {
      const res = await apiClient.get(`/clients/${id}`);
      return res.data.data;
    },
  });

  const { data: sites } = useQuery({
    queryKey: ['client-sites', id],
    queryFn: async () => {
      const res = await apiClient.get(`/clients/${id}/sites`);
      return res.data.data;
    },
    enabled: !!id,
  });

  const { data: interventions } = useQuery({
    queryKey: ['client-interventions', id],
    queryFn: async () => {
      const res = await apiClient.get(`/clients/${id}/interventions?limit=20`);
      return res.data.data;
    },
    enabled: !!id,
  });

  if (isLoading) return <div className="p-6"><LoadingSkeleton.Card /></div>;
  if (error) return (
    <div className="p-6">
      <div className="text-red-600">Errore: {getApiError(error)}</div>
    </div>
  );
  if (!client) return null;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6 text-sm text-gray-500">
        <Link href="/clients" className="hover:text-gray-900">Clienti</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{client.name}</span>
      </div>

      {/* Header */}
      <div className="card mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary-100 flex items-center justify-center">
              <Building2 className="text-primary-600" size={28} />
            </div>
            <div>
              <h1 className="page-title">{client.name}</h1>
              <p className="text-gray-500 text-sm mt-1">
                {CLIENT_TYPE_LABELS[client.clientType] ?? client.clientType}
                {client.vatNumber && ` · P.IVA: ${client.vatNumber}`}
              </p>
              <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                {client.address && (
                  <span className="flex items-center gap-1">
                    <MapPin size={14} /> {client.address}
                  </span>
                )}
                {client.phone && (
                  <span className="flex items-center gap-1">
                    <Phone size={14} /> {client.phone}
                  </span>
                )}
                {client.email && (
                  <span className="flex items-center gap-1">
                    <Mail size={14} /> {client.email}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <span className={`badge ${client.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
              {client.isActive ? 'Attivo' : 'Inattivo'}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{client._count?.sites ?? 0}</p>
            <p className="text-xs text-gray-500 mt-1">Siti</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{client._count?.interventions ?? 0}</p>
            <p className="text-xs text-gray-500 mt-1">Interventi totali</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700">{formatDate(client.createdAt)}</p>
            <p className="text-xs text-gray-500 mt-1">Cliente dal</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${
            activeTab === 'sites'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('sites')}
        >
          Siti ({sites?.length ?? 0})
        </button>
        <button
          className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${
            activeTab === 'interventions'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('interventions')}
        >
          Interventi ({interventions?.length ?? 0})
        </button>
      </div>

      {/* Sites Tab */}
      {activeTab === 'sites' && (
        <div>
          {!sites?.length ? (
            <EmptyState icon={MapPin} title="Nessun sito" description="Nessun sito associato a questo cliente" />
          ) : (
            <div className="grid gap-4">
              {sites.map((site: any) => (
                <Link key={site.id} href={`/sites/${site.id}`}>
                  <div className="card hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{site.name}</h3>
                        <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                          <MapPin size={12} /> {site.address}
                        </p>
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        <p>{site._count?.interventions ?? 0} interventi</p>
                        <p className="text-xs mt-1">Area: {site.squareMeters ?? '-'} m²</p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Interventions Tab */}
      {activeTab === 'interventions' && (
        <div>
          {!interventions?.length ? (
            <EmptyState icon={ClipboardList} title="Nessun intervento" description="Nessun intervento registrato per questo cliente" />
          ) : (
            <div className="card overflow-hidden p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Codice</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Sito</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Stato</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Data</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tecnico</th>
                  </tr>
                </thead>
                <tbody>
                  {interventions.map((i: any) => (
                    <tr
                      key={i.id}
                      className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => router.push(`/interventions/${i.id}`)}
                    >
                      <td className="px-4 py-3 text-xs font-mono text-gray-600">{i.code}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{i.site?.name}</td>
                      <td className="px-4 py-3"><StatusBadge status={i.status} /></td>
                      <td className="px-4 py-3 text-sm text-gray-500">{formatDate(i.scheduledAt)}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {i.technician ? `${i.technician.firstName} ${i.technician.lastName}` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
