import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuthStore } from '../store/auth.store';

export interface CalendarEntry {
  id: string;
  scheduledAt: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'CLOSED' | 'ARCHIVED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  serviceType: string;
  site: { id: string; name: string; client: { name: string } };
  technician?: { id: string; firstName: string; lastName: string };
}

export function useMyCalendar(dateFrom: string, dateTo: string) {
  return useQuery({
    queryKey: ['my-calendar', dateFrom, dateTo],
    queryFn: async () => {
      const res = await api.get(`/calendar/my?dateFrom=${dateFrom}&dateTo=${dateTo}`);
      return res.data.data as CalendarEntry[];
    },
    enabled: !!dateFrom && !!dateTo,
  });
}

export function useCalendar(dateFrom: string, dateTo: string, technicianId?: string) {
  return useQuery({
    queryKey: ['calendar', dateFrom, dateTo, technicianId],
    queryFn: async () => {
      const params = new URLSearchParams({ dateFrom, dateTo });
      if (technicianId) params.set('technicianId', technicianId);
      const res = await api.get(`/calendar?${params}`);
      return res.data.data as CalendarEntry[];
    },
    enabled: !!dateFrom && !!dateTo,
  });
}
