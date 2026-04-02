'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, getApiError } from '@/lib/api';
import { formatDateTime, formatDuration } from '@/lib/utils';
import StatusBadge from '@/components/ui/StatusBadge';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import { MapPin, Clock, User, Package, Camera, FileText, CheckSquare, AlertTriangle } from 'lucide-react';

const OUTCOME_LABELS: Record<string, { label: string; className: string }> = {
  OK: { label: '✅ OK', className: 'bg-green-100 text-green-700' },
  ATTENTION: { label: '⚠️ Attenzione', className: 'bg-yellow-100 text-yellow-700' },
  CRITICAL: { label: '🚨 Critico', className: 'bg-red-100 text-red-700' },
};

const PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Bassa',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  CRITICAL: 'Critica',
};

const SERVICE_TYPE_LABELS: Record<string, string> = {
  RODENT_CONTROL: 'Derattizzazione',
  INSECT_CONTROL: 'Disinfestazione',
  BIRD_CONTROL: 'Controllo volatili',
  GENERAL_INSPECTION: 'Ispezione generale',
  PREVENTIVE: 'Prevenzione',
  EMERGENCY: 'Emergenza',
};

export default function InterventionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<'info' | 'work' | 'points' | 'report'>('info');

  const { data: intervention, isLoading, error } = useQuery({
    queryKey: ['intervention', id],
    queryFn: async () => {
      const res = await apiClient.get(`/interventions/${id}`);
      return res.data.data;
    },
  });

  const closeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post(`/interventions/${id}/close`);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['intervention', id] }),
  });

  if (isLoading) return <div className="p-6"><LoadingSkeleton.Card /></div>;
  if (!intervention) return null;

  const duration =
    intervention.checkInAt && intervention.checkOutAt
      ? formatDuration(
          Math.floor((new Date(intervention.checkOutAt).getTime() - new Date(intervention.checkInAt).getTime()) / 1000 / 60)
        )
      : null;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6 text-sm text-gray-500">
        <Link href="/interventions" className="hover:text-gray-900">Interventi</Link>
        <span>/</span>
        <span className="text-gray-900 font-mono font-medium">{intervention.code}</span>
      </div>

      {/* Header */}
      <div className="card mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">{intervention.code}</span>
              <StatusBadge status={intervention.status} />
              {intervention.outcome && (
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${OUTCOME_LABELS[intervention.outcome]?.className}`}>
                  {OUTCOME_LABELS[intervention.outcome]?.label}
                </span>
              )}
            </div>
            <h1 className="page-title">{intervention.site?.name}</h1>
            <p className="text-gray-500 flex items-center gap-1 mt-1">
              <MapPin size={14} /> {intervention.site?.address}
            </p>
            <p className="text-sm text-gray-400 mt-1">Cliente: {intervention.site?.client?.name}</p>
          </div>

          <div className="flex gap-2">
            {intervention.status === 'IN_PROGRESS' && (
              <button
                className="btn-primary text-sm"
                onClick={() => {
                  if (confirm('Chiudere questo intervento e generare il PDF?')) {
                    closeMutation.mutate();
                  }
                }}
                disabled={closeMutation.isPending}
              >
                {closeMutation.isPending ? '...' : '🔒 Chiudi'}
              </button>
            )}
          </div>
        </div>

        {/* Info Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100">
          <div>
            <p className="text-xs text-gray-400 mb-1">Tipo servizio</p>
            <p className="text-sm font-semibold text-gray-900">{SERVICE_TYPE_LABELS[intervention.serviceType] ?? intervention.serviceType}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Priorità</p>
            <p className="text-sm font-semibold text-gray-900">{PRIORITY_LABELS[intervention.priority] ?? intervention.priority}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Tecnico</p>
            <p className="text-sm font-semibold text-gray-900">
              {intervention.technician
                ? `${intervention.technician.firstName} ${intervention.technician.lastName}`
                : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">Durata</p>
            <p className="text-sm font-semibold text-gray-900">{duration ?? '—'}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
        {[
          { key: 'info', label: 'Informazioni' },
          { key: 'work', label: `Lavori (${(intervention.products?.length ?? 0) + (intervention.photos?.length ?? 0)})` },
          { key: 'points', label: `Punti (${intervention.points?.length ?? 0})` },
          { key: 'report', label: 'Rapporto' },
        ].map((tab) => (
          <button
            key={tab.key}
            className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors whitespace-nowrap ${
              activeTab === tab.key
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab(tab.key as any)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Info Tab */}
      {activeTab === 'info' && (
        <div className="grid gap-4">
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Clock size={16} /> Timeline</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Pianificato</span>
                <span className="font-medium">{formatDateTime(intervention.scheduledAt)}</span>
              </div>
              {intervention.checkInAt && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Check-in</span>
                  <span className="font-medium text-green-600">{formatDateTime(intervention.checkInAt)}</span>
                </div>
              )}
              {intervention.checkOutAt && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Check-out</span>
                  <span className="font-medium text-orange-600">{formatDateTime(intervention.checkOutAt)}</span>
                </div>
              )}
              {intervention.closedAt && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Chiuso il</span>
                  <span className="font-medium text-gray-700">{formatDateTime(intervention.closedAt)}</span>
                </div>
              )}
            </div>
          </div>

          {intervention.technicianNotes && (
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><FileText size={16} /> Note tecnico</h3>
              <p className="text-gray-700 text-sm leading-relaxed">{intervention.technicianNotes}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="card">
              <h3 className="text-xs text-gray-400 uppercase tracking-wider mb-3">Firma tecnico</h3>
              {intervention.technicianSignatureUrl ? (
                <img src={intervention.technicianSignatureUrl} alt="Firma tecnico" className="max-h-24 object-contain" />
              ) : (
                <p className="text-sm text-gray-400 italic">Non ancora firmato</p>
              )}
            </div>
            <div className="card">
              <h3 className="text-xs text-gray-400 uppercase tracking-wider mb-3">Firma cliente</h3>
              {intervention.clientSignatureUrl ? (
                <img src={intervention.clientSignatureUrl} alt="Firma cliente" className="max-h-24 object-contain" />
              ) : (
                <p className="text-sm text-gray-400 italic">Non ancora firmato</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Work Tab */}
      {activeTab === 'work' && (
        <div className="grid gap-4">
          {/* Products */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Package size={16} /> Prodotti utilizzati</h3>
            {!intervention.products?.length ? (
              <p className="text-sm text-gray-400 italic">Nessun prodotto registrato</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 text-xs text-gray-400 uppercase">Prodotto</th>
                    <th className="text-right py-2 text-xs text-gray-400 uppercase">Quantità</th>
                    <th className="text-left py-2 text-xs text-gray-400 uppercase pl-4">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {intervention.products.map((p: any) => (
                    <tr key={p.id} className="border-b border-gray-50">
                      <td className="py-2 font-medium text-gray-900">{p.product?.name}</td>
                      <td className="py-2 text-right text-gray-600">{p.quantityUsed} {p.product?.unit}</td>
                      <td className="py-2 pl-4 text-gray-500">{p.notes ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Photos */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Camera size={16} /> Foto ({intervention.photos?.length ?? 0})</h3>
            {!intervention.photos?.length ? (
              <p className="text-sm text-gray-400 italic">Nessuna foto</p>
            ) : (
              <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                {intervention.photos.map((photo: any) => (
                  <a key={photo.id} href={photo.url} target="_blank" rel="noreferrer">
                    <img
                      src={photo.url}
                      alt={photo.caption ?? 'Foto intervento'}
                      className="w-full aspect-square object-cover rounded-lg hover:opacity-80 transition-opacity"
                    />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Points Tab */}
      {activeTab === 'points' && (
        <div className="card overflow-hidden p-0">
          {!intervention.points?.length ? (
            <div className="p-8 text-center text-gray-400">
              <CheckSquare size={32} className="mx-auto mb-2 opacity-30" />
              <p>Nessun punto di controllo registrato</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Codice</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Etichetta</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Stato</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Note</th>
                </tr>
              </thead>
              <tbody>
                {intervention.points.map((p: any) => (
                  <tr key={p.id} className="border-b border-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.siteCardPoint?.code}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{p.siteCardPoint?.label}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                        p.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                        p.status === 'ATTENTION' ? 'bg-yellow-100 text-yellow-700' :
                        p.status === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>{p.status}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{p.notes ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Report Tab */}
      {activeTab === 'report' && (
        <div className="card text-center py-12">
          {intervention.reportPdfUrl ? (
            <div>
              <FileText size={48} className="mx-auto text-primary-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Rapporto disponibile</h3>
              <p className="text-sm text-gray-500 mb-6">Il rapporto PDF è stato generato alla chiusura dell'intervento</p>
              <a
                href={`/api/v1/interventions/${id}/report`}
                target="_blank"
                className="btn-primary inline-flex items-center gap-2"
              >
                <FileText size={16} /> Scarica PDF
              </a>
            </div>
          ) : (
            <div>
              <AlertTriangle size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Rapporto non disponibile</h3>
              <p className="text-sm text-gray-500">Il rapporto verrà generato automaticamente alla chiusura dell'intervento</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
