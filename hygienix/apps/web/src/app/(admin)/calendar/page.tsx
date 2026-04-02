'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import StatusBadge from '@/components/ui/StatusBadge';

const DAYS_IT = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
const MONTHS_IT = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
];

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: '#2563eb',
  IN_PROGRESS: '#d97706',
  CLOSED: '#16a34a',
  ARCHIVED: '#94a3b8',
};

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function formatTime(s: string) {
  return new Date(s).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
}

export default function CalendarPage() {
  const router = useRouter();
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(today);

  const dateFrom = new Date(currentYear, currentMonth, 1).toISOString().split('T')[0];
  const dateTo = new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0];

  const { data: entries = [] } = useQuery({
    queryKey: ['calendar', dateFrom, dateTo],
    queryFn: async () => {
      const res = await apiClient.get(`/calendar?dateFrom=${dateFrom}&dateTo=${dateTo}`);
      return res.data.data;
    },
  });

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear((y) => y - 1); }
    else setCurrentMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear((y) => y + 1); }
    else setCurrentMonth((m) => m + 1);
  };

  const selectedEntries = entries.filter((e: any) => isSameDay(new Date(e.scheduledAt), selectedDate));

  const getEntriesForDay = (day: number) => {
    const d = new Date(currentYear, currentMonth, day);
    return entries.filter((e: any) => isSameDay(new Date(e.scheduledAt), d));
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="page-header">
        <h1 className="page-title">Calendario interventi</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 card">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-6">
            <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-lg">‹</button>
            <h2 className="text-lg font-bold text-gray-900">
              {MONTHS_IT[currentMonth]} {currentYear}
            </h2>
            <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-lg">›</button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 mb-2">
            {DAYS_IT.map((d) => (
              <div key={d} className="text-center text-xs font-semibold text-gray-400 py-2">{d}</div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for first week */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}

            {/* Day cells */}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
              const d = new Date(currentYear, currentMonth, day);
              const isToday = isSameDay(d, today);
              const isSelected = isSameDay(d, selectedDate);
              const dayEntries = getEntriesForDay(day);

              return (
                <button
                  key={day}
                  className={`
                    relative p-2 rounded-xl text-sm min-h-[60px] text-left transition-all
                    ${isSelected ? 'bg-primary-600 text-white shadow-md' : 'hover:bg-gray-50'}
                    ${isToday && !isSelected ? 'ring-2 ring-primary-300' : ''}
                  `}
                  onClick={() => setSelectedDate(d)}
                >
                  <span className={`font-semibold ${isToday && !isSelected ? 'text-primary-600' : ''}`}>{day}</span>
                  {dayEntries.length > 0 && (
                    <div className="mt-1 space-y-0.5">
                      {dayEntries.slice(0, 2).map((e: any) => (
                        <div
                          key={e.id}
                          className="text-[10px] rounded px-1 truncate font-medium"
                          style={{
                            backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : STATUS_COLORS[e.status] + '20',
                            color: isSelected ? 'white' : STATUS_COLORS[e.status],
                          }}
                        >
                          {formatTime(e.scheduledAt)} {e.site?.name}
                        </div>
                      ))}
                      {dayEntries.length > 2 && (
                        <div className={`text-[10px] font-bold ${isSelected ? 'text-white/70' : 'text-gray-400'}`}>
                          +{dayEntries.length - 2} altri
                        </div>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Day Events */}
        <div>
          <div className="card sticky top-6">
            <h3 className="font-bold text-gray-900 mb-4 capitalize">
              {selectedDate.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}
            </h3>

            {selectedEntries.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-3xl mb-2">📭</p>
                <p className="text-sm text-gray-400">Nessun intervento pianificato</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedEntries.map((entry: any) => (
                  <button
                    key={entry.id}
                    className="w-full text-left p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors"
                    onClick={() => router.push(`/interventions/${entry.id}`)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-gray-400">{formatTime(entry.scheduledAt)}</span>
                      <StatusBadge status={entry.status} size="sm" />
                    </div>
                    <p className="font-semibold text-sm text-gray-900">{entry.site?.name}</p>
                    <p className="text-xs text-gray-500">{entry.site?.client?.name}</p>
                    {entry.technician && (
                      <p className="text-xs text-gray-400 mt-1">
                        👤 {entry.technician.firstName} {entry.technician.lastName}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Summary */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400 mb-2">Riepilogo mese</p>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-gray-50 rounded-lg p-2">
                  <p className="text-lg font-bold text-gray-900">{entries.length}</p>
                  <p className="text-xs text-gray-500">Totale</p>
                </div>
                <div className="bg-green-50 rounded-lg p-2">
                  <p className="text-lg font-bold text-green-700">
                    {entries.filter((e: any) => e.status === 'CLOSED').length}
                  </p>
                  <p className="text-xs text-green-600">Chiusi</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
