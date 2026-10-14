'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useToast } from '../context/ToastContext';

const START = 8;
const END = 20;
const N = END - START;

interface Resource {
  id: string;
  name: string;
  type: string;
  capacity: number;
  status: string;
}

interface Reservation {
  id: string;
  resourceId: string;
  userId: string;
  startTime: string;
  endTime: string;
  purpose: string;
  user: { id: string; name: string };
  resource: { name: string };
}

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'EMPLOYEE';
}

export default function BookPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState<Date>(() => new Date(2026, 0, 1));

  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setDate(today);
  }, []);
  const [filter, setFilter] = useState('all');
  const [anchor, setAnchor] = useState<{
    res: string;
    h: number;
    locked?: { res: string; start: number; end: number };
  } | null>(null);
  const [hover, setHover] = useState<{ res: string; h: number } | null>(null);
  const [purpose, setPurpose] = useState('');
  const toast = useToast();

  const iso = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const hh = (h: number) => `${String(h).padStart(2, '0')}:00`;

  const loadData = async () => {
    setLoading(true);
    try {
      const [resR, bookR] = await Promise.all([
        fetch('/api/resources').then((r) => r.json()),
        fetch('/api/reservations').then((r) => r.json()),
      ]);
      if (Array.isArray(resR)) setResources(resR);
      if (Array.isArray(bookR)) setReservations(bookR);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const raw = localStorage.getItem('primewave_user');
    if (raw) setUser(JSON.parse(raw));
  }, []);

  const dayBookings = (resId: string) => {
    const targetDate = iso(date);
    return reservations
      .filter((b) => b.resourceId === resId && b.startTime.startsWith(targetDate))
      .map((b) => ({
        ...b,
        start: new Date(b.startTime).getHours(),
        end: new Date(b.endTime).getHours(),
      }));
  };

  const busyAt = (resId: string, h: number) =>
    dayBookings(resId).some((b) => h >= b.start && h < b.end);

  const getRange = () => {
    if (!anchor) return null;
    if (anchor.locked) return anchor.locked;
    const h = hover && hover.res === anchor.res ? hover.h : anchor.h;
    const a = anchor.h;
    const dir = h >= a ? 1 : -1;
    let e = a;
    for (let x = a; dir > 0 ? x <= h : x >= h; x += dir) {
      if (busyAt(anchor.res, x)) break;
      e = x;
    }
    return { res: anchor.res, start: Math.min(a, e), end: Math.max(a, e) + 1 };
  };

  const handleCellClick = (resId: string, h: number) => {
    if (!anchor || anchor.locked || anchor.res !== resId) {
      setAnchor({ res: resId, h });
      setHover(null);
    } else {
      const r = getRange();
      if (r) setAnchor({ ...anchor, locked: r });
    }
  };

  const handleConfirm = async () => {
    if (!anchor?.locked || !user) return;
    if (!purpose.trim()) {
      toast.warning('Please enter the purpose of your reservation.');
      return;
    }

    const res = await fetch('/api/reservations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': user.id,
      },
      body: JSON.stringify({
        resourceId: anchor.locked.res,
        userId: user.id,
        date: iso(date),
        startHour: anchor.locked.start,
        endHour: anchor.locked.end,
        purpose: purpose.trim(),
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || 'Failed to reserve slot. An error occurred while processing your request.');
      setAnchor(null);
      loadData();
      return;
    }

    toast.success('Your action was completed successfully! Reservation confirmed.', 'Success!');
    setAnchor(null);
    setPurpose('');
    loadData();
  };

  const sel = getRange();
  const selectedResource = resources.find((r) => r.id === anchor?.res);

  return (
    <main>

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-4xl font-normal">Book your slot</h2>
          <p className="mt-1 text-sm text-[#c9a3a7]">
            Select a start hour and end hour on the timeline to reserve a resource.
          </p>
        </div>

        <div className="flex items-center gap-1 rounded-2xl border border-white/15 bg-white/5 p-1.5 backdrop-blur-md">
          <button
            className="rounded-lg px-3 py-1.5 font-bold hover:bg-white/10 cursor-pointer"
            onClick={() => {
              const d = new Date(date);
              d.setDate(d.getDate() - 1);
              setDate(d);
              setAnchor(null);
            }}
          >
            ‹
          </button>
          <b className="min-w-[140px] text-center text-sm font-semibold">
            {date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
          </b>
          <button
            className="rounded-lg px-3 py-1.5 font-bold hover:bg-white/10 cursor-pointer"
            onClick={() => {
              const d = new Date(date);
              d.setDate(d.getDate() + 1);
              setDate(d);
              setAnchor(null);
            }}
          >
            ›
          </button>
          <button
            className="rounded-lg px-3 py-1.5 text-sm font-semibold hover:bg-white/10 cursor-pointer"
            onClick={() => {
              const d = new Date();
              d.setHours(0, 0, 0, 0);
              setDate(d);
              setAnchor(null);
            }}
          >
            Today
          </button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-white/15 bg-white/5 p-10 text-[#c9a3a7]">
          Loading timeline from database…
        </div>
      ) : resources.length === 0 ? (
        <div className="rounded-3xl border border-white/15 bg-white/5 p-10 text-center backdrop-blur-xl">
          <p className="font-serif-display text-3xl">No resources available to book</p>
          <p className="mt-2 text-sm text-[#c9a3a7]">
            An Administrator needs to register rooms or equipment before bookings can be scheduled.
          </p>
          <Link
            href="/resources"
            className="mt-5 inline-block rounded-xl bg-[#f8bd45] px-6 py-3 font-bold text-[#3a1a04]"
          >
            Go to Resources Page
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 rounded-3xl border border-white/15 bg-white/5 p-6 backdrop-blur-xl">
            <div className="mb-4 flex flex-wrap gap-2">
              {[
                ['all', 'Everything'],
                ['room', 'Rooms'],
                ['gear', 'Equipment'],
              ].map(([k, l]) => (
                <button
                  key={k}
                  onClick={() => setFilter(k)}
                  className={`rounded-full border px-4 py-1.5 text-sm transition cursor-pointer ${
                    filter === k
                      ? 'border-[#f8bd45] bg-[#f8bd45] font-semibold text-[#3a1a04]'
                      : 'border-white/15 bg-transparent text-[#fbeff0] hover:bg-white/10'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>

            <div className="overflow-x-auto pb-2">
              <div className="min-w-[720px]">
                <div className="grid grid-cols-[170px_1fr] items-center pb-2">
                  <div />
                  <div className="grid grid-cols-12 text-xs text-[#c9a3a7]">
                    {Array.from({ length: N }, (_, i) => (
                      <span key={i} className="pl-1">
                        {START + i}:00
                      </span>
                    ))}
                  </div>
                </div>

                {resources
                  .filter((r) => filter === 'all' || r.type === filter)
                  .map((r) => {
                    const bs = dayBookings(r.id);
                    const used = bs.reduce((sum, b) => sum + (b.end - b.start), 0);

                    return (
                      <div
                        key={r.id}
                        className="grid grid-cols-[170px_1fr] items-center border-t border-white/10 py-2"
                      >
                        <div className="pr-3">
                          <div className="font-semibold leading-tight">{r.name}</div>
                          <small className="block text-xs text-[#c9a3a7]">
                            {N - used}h free · {r.status}
                          </small>
                        </div>

                        <div className="relative h-13">
                          <div className="grid grid-cols-12 gap-1 h-full">
                            {Array.from({ length: N }, (_, i) => {
                              const h = START + i;
                              const isBusy = busyAt(r.id, h);
                              return (
                                <button
                                  key={h}
                                  disabled={isBusy}
                                  onClick={() => handleCellClick(r.id, h)}
                                  onMouseEnter={() => {
                                    if (anchor && !anchor.locked && anchor.res === r.id) {
                                      setHover({ res: r.id, h });
                                    }
                                  }}
                                  className="rounded-lg bg-white/5 transition hover:bg-[#f8bd45]/30 disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
                                />
                              );
                            })}
                          </div>

                          {bs.map((b) => {
                            const isMine = user && b.userId === user.id;
                            return (
                              <div
                                key={b.id}
                                style={{
                                  left: `${((b.start - START) / N) * 100}%`,
                                  width: `calc(${((b.end - b.start) / N) * 100}% - 4px)`,
                                }}
                                className={`pointer-events-none absolute top-0 bottom-0 overflow-hidden rounded-lg px-2.5 py-1.5 text-xs leading-tight ${
                                  isMine
                                    ? 'bg-[#4cc38a] text-[#07301d]'
                                    : 'bg-[#86303b] text-white'
                                }`}
                              >
                                <b className="block truncate">{b.purpose}</b>
                                <span className="truncate block opacity-85">{b.user?.name}</span>
                              </div>
                            );
                          })}

                          {sel && sel.res === r.id && (
                            <div
                              style={{
                                left: `${((sel.start - START) / N) * 100}%`,
                                width: `calc(${((sel.end - sel.start) / N) * 100}% - 4px)`,
                              }}
                              className="pointer-events-none absolute top-0 bottom-0 flex items-center rounded-lg bg-[#f8bd45] px-2.5 text-xs font-bold text-[#3a1a04] ring-2 ring-white inset-ring"
                            >
                              {hh(sel.start)}–{hh(sel.end)}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-4 text-xs text-[#c9a3a7]">
              <span className="flex items-center gap-1.5">
                <i className="inline-block h-3 w-3 rounded bg-white/10" /> Free
              </span>
              <span className="flex items-center gap-1.5">
                <i className="inline-block h-3 w-3 rounded bg-[#86303b]" /> Booked
              </span>
              <span className="flex items-center gap-1.5">
                <i className="inline-block h-3 w-3 rounded bg-[#4cc38a]" /> Yours
              </span>
              <span className="flex items-center gap-1.5">
                <i className="inline-block h-3 w-3 rounded bg-[#f8bd45]" /> Selected
              </span>
            </div>
          </div>

          <aside className="lg:col-span-4 rounded-3xl border border-white/15 bg-white/5 p-6 backdrop-blur-xl">
            {!user ? (
              <div>
                <h3 className="text-lg font-semibold">Sign in to Reserve</h3>
                <p className="mt-2 text-sm text-[#c9a3a7]">
                  Please sign in or register an account to book a time slot on the timeline.
                </p>
                <div className="mt-4 flex gap-2">
                  <Link
                    href="/login"
                    className="flex-1 rounded-xl bg-[#f8bd45] py-2.5 text-center text-sm font-bold text-[#3a1a04]"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="flex-1 rounded-xl border border-white/15 bg-white/5 py-2.5 text-center text-sm font-semibold text-white"
                  >
                    Register
                  </Link>
                </div>
              </div>
            ) : !anchor ? (
              <>
                <h3 className="text-lg font-semibold">New reservation</h3>
                <p className="mt-2 text-sm text-[#c9a3a7]">
                  Choose a free hour block on the timeline to begin booking as <b className="text-white">{user.name}</b>.
                </p>
              </>
            ) : !anchor.locked ? (
              <>
                <h3 className="text-lg font-semibold">Select End Hour</h3>
                <p className="font-serif-display text-3xl mt-1">{selectedResource?.name}</p>
                <p className="mt-2 text-sm text-[#c9a3a7]">
                  Starts at {hh(anchor.h)}. Click an end hour on the same timeline row.
                </p>
                <button
                  onClick={() => setAnchor(null)}
                  className="mt-4 w-full py-2 text-sm text-[#c9a3a7] hover:text-white cursor-pointer"
                >
                  Clear selection
                </button>
              </>
            ) : (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">Confirm reservation</h3>
                  <p className="font-serif-display text-3xl mt-1">{selectedResource?.name}</p>
                  <p className="text-sm text-[#c9a3a7]">
                    {date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })} ·{' '}
                    {hh(anchor.locked.start)}–{hh(anchor.locked.end)} ({anchor.locked.end - anchor.locked.start}h)
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/20 px-3.5 py-2.5 text-xs text-[#c9a3a7]">
                  Booking as: <b className="text-white">{user.name}</b> ({user.email})
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#c9a3a7] mb-1">
                    Purpose of Reservation
                  </label>
                  <input
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder="Enter purpose (e.g. Client Meeting)"
                    className="w-full rounded-xl border border-white/15 bg-black/25 px-3.5 py-2.5 text-sm text-white placeholder-[#a77f84] focus:border-[#f8bd45] focus:outline-none"
                  />
                </div>

                <button
                  onClick={handleConfirm}
                  className="w-full rounded-xl bg-[#f8bd45] py-3 font-bold text-[#3a1a04] transition hover:bg-[#ffcb62] cursor-pointer"
                >
                  Reserve {hh(anchor.locked.start)}–{hh(anchor.locked.end)}
                </button>
                <button
                  onClick={() => setAnchor(null)}
                  className="w-full py-1.5 text-sm text-[#c9a3a7] hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            )}
          </aside>
        </div>
      )}
    </main>
  );
}