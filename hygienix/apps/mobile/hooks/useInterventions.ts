import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuthStore } from '../store/auth.store';

export interface InterventionSummary {
  id: string;
  code: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'CLOSED' | 'ARCHIVED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  serviceType: string;
  scheduledAt: string;
  checkInAt?: string;
  checkOutAt?: string;
  site: { id: string; name: string; address: string; client: { id: string; name: string } };
  technician?: { id: string; firstName: string; lastName: string };
}

export interface InterventionDetail extends InterventionSummary {
  outcome?: 'OK' | 'ATTENTION' | 'CRITICAL';
  technicianNotes?: string;
  clientSignatureUrl?: string;
  technicianSignatureUrl?: string;
  reportPdfUrl?: string;
  photos: Array<{ id: string; url: string; caption?: string; takenAt: string }>;
  products: Array<{ id: string; product: { name: string; unit: string }; quantityUsed: number; notes?: string }>;
  points: Array<{ id: string; siteCardPoint: { code: string; label: string; type: string }; status: string; notes?: string }>;
}

export function useMyInterventions(params?: { status?: string; dateFrom?: string; dateTo?: string }) {
  return useQuery({
    queryKey: ['my-interventions', params],
    queryFn: async () => {
      const query = new URLSearchParams();
      if (params?.status) query.set('status', params.status);
      if (params?.dateFrom) query.set('dateFrom', params.dateFrom);
      if (params?.dateTo) query.set('dateTo', params.dateTo);
      const res = await api.get(`/interventions/my?${query}`);
      return res.data.data as InterventionSummary[];
    },
  });
}

export function useIntervention(id: string) {
  return useQuery({
    queryKey: ['intervention', id],
    queryFn: async () => {
      const res = await api.get(`/interventions/${id}`);
      return res.data.data as InterventionDetail;
    },
    enabled: !!id,
  });
}

export function useTodayInterventions() {
  const today = new Date();
  const dateFrom = today.toISOString().split('T')[0];
  const dateTo = dateFrom;
  return useMyInterventions({ dateFrom, dateTo });
}

export function useCheckIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/interventions/${id}/check-in`);
      return res.data;
    },
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['intervention', id] });
      qc.invalidateQueries({ queryKey: ['my-interventions'] });
    },
  });
}

export function useCheckOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/interventions/${id}/check-out`);
      return res.data;
    },
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['intervention', id] });
      qc.invalidateQueries({ queryKey: ['my-interventions'] });
    },
  });
}

export function useUpdateOutcome() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, outcome, notes }: { id: string; outcome: string; notes?: string }) => {
      const res = await api.put(`/interventions/${id}/outcome`, { outcome, technicianNotes: notes });
      return res.data;
    },
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['intervention', id] });
    },
  });
}

export function useCloseIntervention() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/interventions/${id}/close`);
      return res.data;
    },
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['intervention', id] });
      qc.invalidateQueries({ queryKey: ['my-interventions'] });
    },
  });
}

export function useAddProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      interventionId,
      productId,
      quantityUsed,
      notes,
    }: {
      interventionId: string;
      productId: string;
      quantityUsed: number;
      notes?: string;
    }) => {
      const res = await api.post(`/interventions/${interventionId}/products`, {
        productId,
        quantityUsed,
        notes,
      });
      return res.data;
    },
    onSuccess: (_, { interventionId }) => {
      qc.invalidateQueries({ queryKey: ['intervention', interventionId] });
    },
  });
}

export function useSaveSignature() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      interventionId,
      type,
      signatureBase64,
    }: {
      interventionId: string;
      type: 'technician' | 'client';
      signatureBase64: string;
    }) => {
      const endpoint =
        type === 'technician'
          ? `/interventions/${interventionId}/signature/technician`
          : `/interventions/${interventionId}/signature/client`;
      const res = await api.post(endpoint, { signatureBase64 });
      return res.data;
    },
    onSuccess: (_, { interventionId }) => {
      qc.invalidateQueries({ queryKey: ['intervention', interventionId] });
    },
  });
}
