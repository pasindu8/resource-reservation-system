'use client';

import { useEffect, useState } from 'react';
import { useToast } from '../context/ToastContext';

interface Reservation {
  id: string;
  startTime: string;
  endTime: string;
  purpose: string;
  user: { name: string; email: string };
  resource: { name: string; type: string };
}

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [user, setUser] = useState<{ id: string; role: string } | null>(null);
  const toast = useToast();

  const loadReservations = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reservations');
      const data = await res.json();
      if (Array.isArray(data)) setReservations(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReservations();
    const raw = localStorage.getItem('primewave_user');
    if (raw) {
      try {
        setUser(JSON.parse(raw));
      } catch {
        setUser(null);
      }
    }
  }, []);

  const handleCancel = async (id: string, resourceName: string) => {
    try {
      const res = await fetch(`/api/reservations?id=${id}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': user?.id || '',
        },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || 'Failed to cancel reservation.', 'Error!');
        return;
      }
      toast.success(`Booking for ${resourceName} was cancelled successfully.`, 'Success!');
      loadReservations();
    } catch {
      toast.error('An error occurred while processing your request.', 'Error!');
    }
  };

  const filtered = reservations.filter(
    (b) =>
      b.purpose?.toLowerCase().includes(search.toLowerCase()) ||
      b.user?.name.toLowerCase().includes(search.toLowerCase()) ||
      b.resource?.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-4xl font-normal">All Reservations</h2>
          <p className="mt-1 text-sm text-[#c9a3a7]">
            Live records of all scheduled bookings stored in PostgreSQL.
          </p>
        </div>
        <div className="w-full sm:w-72">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by resource, user, or purpose..."
            className="w-full rounded-xl border border-white/15 bg-black/25 px-4 py-2.5 text-sm text-white placeholder-[#a77f84] focus:border-[#f8bd45] focus:outline-none"
          />
        </div>
      </div>

      <div className="rounded-3xl border border-white/15 bg-white/5 p-6 backdrop-blur-xl">
        {loading ? (
          <p className="text-sm text-[#c9a3a7]">Loading reservations from database…</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-[#c9a3a7]">
            No reservations found in the database.
          </p>
        ) : (
          <div className="space-y-3">
            {filtered.map((b) => {
              const start = new Date(b.startTime);
              const end = new Date(b.endTime);
              return (
                <div
                  key={b.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"
                >
                  <div>
                    <b className="text-lg text-[#f8bd45]">{b.purpose}</b>
                    <div className="mt-0.5 text-sm text-[#fbeff0]">
                      {b.resource?.name} · Reserved by <span className="font-semibold">{b.user?.name}</span>
                    </div>
                    <small className="text-xs text-[#c9a3a7]">
                      {start.toLocaleDateString(undefined, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}{' '}
                      | {String(start.getHours()).padStart(2, '0')}:00 –{' '}
                      {String(end.getHours()).padStart(2, '0')}:00
                    </small>
                  </div>
                  <button
                    onClick={() => handleCancel(b.id, b.resource?.name || 'Resource')}
                    className="self-start sm:self-center rounded-xl border border-[#ff6b5e]/30 bg-[#ff6b5e]/15 px-4 py-2 text-xs font-semibold text-[#ff6b5e] transition hover:bg-[#ff6b5e]/25 cursor-pointer"
                  >
                    Cancel Booking
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}