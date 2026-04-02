'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, getApiError } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import EmptyState from '@/components/ui/EmptyState';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import { Package, Plus, Search, Archive, RotateCcw } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  activeIngredient?: string;
  unit: string;
  registrationNumber?: string;
  hazardLevel?: string;
  isArchived: boolean;
  createdAt: string;
}

const HAZARD_LABELS: Record<string, { label: string; className: string }> = {
  LOW: { label: 'Basso', className: 'bg-green-100 text-green-700' },
  MEDIUM: { label: 'Medio', className: 'bg-yellow-100 text-yellow-700' },
  HIGH: { label: 'Alto', className: 'bg-orange-100 text-orange-700' },
  VERY_HIGH: { label: 'Molto alto', className: 'bg-red-100 text-red-700' },
};

export default function ProductsPage() {
  const [search, setSearch] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', unit: 'ml', activeIngredient: '', registrationNumber: '', hazardLevel: 'LOW' });

  const qc = useQueryClient();

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products', search, showArchived],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '100' });
      if (search) params.set('search', search);
      if (showArchived) params.set('showArchived', 'true');
      const res = await apiClient.get(`/products?${params}`);
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await apiClient.post('/products', data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] });
      setShowModal(false);
      setForm({ name: '', unit: 'ml', activeIngredient: '', registrationNumber: '', hazardLevel: 'LOW' });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async ({ id, archive }: { id: string; archive: boolean }) => {
      if (archive) {
        await apiClient.delete(`/products/${id}`);
      } else {
        await apiClient.patch(`/products/${id}`, { isArchived: false });
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });

  const products: Product[] = productsData?.data ?? [];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="page-header">
        <div>
          <h1 className="page-title">Prodotti</h1>
          <p className="text-gray-500 text-sm mt-1">Gestione prodotti fitosanitari e biocidi</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Nuovo prodotto
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            className="input pl-9 w-full"
            placeholder="Cerca prodotto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            className="rounded"
          />
          Mostra archiviati
        </label>
      </div>

      {/* Products Table */}
      {isLoading ? (
        <LoadingSkeleton.Table />
      ) : !products.length ? (
        <EmptyState icon={Package} title="Nessun prodotto" description="Aggiungi i prodotti fitosanitari" cta={{ label: 'Aggiungi prodotto', onClick: () => setShowModal(true) }} />
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Nome</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">P.A.</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Unità</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Pericolosità</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Reg.</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Stato</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const hazard = HAZARD_LABELS[product.hazardLevel ?? ''];
                return (
                  <tr key={product.id} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${product.isArchived ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3 font-semibold text-gray-900">{product.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{product.activeIngredient ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{product.unit}</td>
                    <td className="px-4 py-3">
                      {hazard ? (
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${hazard.className}`}>{hazard.label}</span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-gray-500">{product.registrationNumber ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${product.isArchived ? 'bg-gray-100 text-gray-500' : 'bg-green-100 text-green-700'}`}>
                        {product.isArchived ? 'Archiviato' : 'Attivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        className="p-1 text-gray-400 hover:text-gray-700 transition-colors"
                        onClick={() => archiveMutation.mutate({ id: product.id, archive: !product.isArchived })}
                        title={product.isArchived ? 'Ripristina' : 'Archivia'}
                      >
                        {product.isArchived ? <RotateCcw size={16} /> : <Archive size={16} />}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* New Product Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900">Nuovo prodotto</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-700 text-xl leading-none">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="label">Nome prodotto *</label>
                <input className="input w-full" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Es. Ratout 2G" />
              </div>
              <div>
                <label className="label">Principio attivo</label>
                <input className="input w-full" value={form.activeIngredient} onChange={(e) => setForm({ ...form, activeIngredient: e.target.value })} placeholder="Es. Brodifacoum 0.005%" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Unità di misura</label>
                  <select className="input w-full" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
                    <option value="ml">ml</option>
                    <option value="L">L</option>
                    <option value="g">g</option>
                    <option value="kg">kg</option>
                    <option value="pz">pz</option>
                  </select>
                </div>
                <div>
                  <label className="label">Pericolosità</label>
                  <select className="input w-full" value={form.hazardLevel} onChange={(e) => setForm({ ...form, hazardLevel: e.target.value })}>
                    <option value="LOW">Bassa</option>
                    <option value="MEDIUM">Media</option>
                    <option value="HIGH">Alta</option>
                    <option value="VERY_HIGH">Molto alta</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label">N° registrazione Min. Salute</label>
                <input className="input w-full" value={form.registrationNumber} onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })} placeholder="Es. 000000" />
              </div>
            </div>
            <div className="p-6 pt-0 flex justify-end gap-3">
              <button className="btn-secondary" onClick={() => setShowModal(false)}>Annulla</button>
              <button
                className="btn-primary"
                onClick={() => createMutation.mutate(form)}
                disabled={!form.name || createMutation.isPending}
              >
                {createMutation.isPending ? '...' : 'Crea prodotto'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
