'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

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
  startTime: string;
  endTime: string;
  purpose: string;
  user: { name: string };
  resource: { name: string };
}

export default function HomePage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [tilt, setTilt] = useState({ rx: 8, ry: -14 });
  const [timeInfo, setTimeInfo] = useState({ currentHour: 8, todayStr: '' });


  useEffect(() => {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    setTimeInfo({ currentHour: now.getHours(), todayStr });

    Promise.all([
      fetch('/api/resources').then((r) => (r.ok ? r.json() : [])),
      fetch('/api/reservations').then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([resData, bookData]) => {
        if (Array.isArray(resData)) setResources(resData);
        if (Array.isArray(bookData)) setReservations(bookData);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ rx: 8 - y * 18, ry: -14 + x * 22 });
  };

  const freeRightNow = resources.filter((r) => {
    if (!timeInfo.todayStr) return true;
    return !reservations.some((b) => {
      if (b.resourceId !== r.id || !b.startTime.startsWith(timeInfo.todayStr)) return false;
      const s = new Date(b.startTime).getHours();
      const e = new Date(b.endTime).getHours();
      return timeInfo.currentHour >= s && timeInfo.currentHour < e;
    });
  }).length;

  const primaryResource = resources[0];
  const latestBooking = reservations[reservations.length - 1];

  return (
    <main>
      <div className="inline-flex items-center gap-2.5 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm backdrop-blur-md">
        <span className="h-2 w-2 rounded-full bg-[#4cc38a] ring-4 ring-[#4cc38a]/25" />
        <span>
          {loading
            ? 'Checking live database availability…'
            : resources.length === 0
            ? 'No resources registered yet — Add resources to begin'
            : `${freeRightNow} of ${resources.length} resources free right now`}
        </span>
      </div>

      <section
        className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center py-8"
        onMouseMove={handleMouseMove}
      >
        <div className="lg:col-span-7">
          <h1 className="text-5xl sm:text-7xl leading-[0.98] tracking-tight bg-gradient-to-b from-white via-white to-[#d9b3b7] bg-clip-text text-transparent">
            Simply <em className="not-italic text-[#f8bd45]">Reserve,</em> Truly Effortless
          </h1>
          <p className="mt-6 max-w-xl text-lg text-[#c9a3a7]">
            Centralized resource coordination powered by PostgreSQL. View live availability on an interactive timeline, prevent overlapping schedules, and manage shared facilities effortlessly.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/book"
              className="rounded-xl bg-[#f8bd45] px-6 py-3.5 font-semibold text-[#3a1a04] transition hover:-translate-y-0.5 hover:bg-[#ffcb62]"
            >
              Book a Resource →
            </Link>
            <Link
              href="/resources"
              className="rounded-xl border border-white/15 bg-white/5 px-6 py-3.5 font-semibold text-[#fbeff0] backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-white/10"
            >
              Manage Resources ({resources.length})
            </Link>
          </div>
        </div>

        <div className="lg:col-span-5 flex items-center justify-center h-[380px] [perspective:1100px]">
          <div
            className="relative w-full max-w-[360px] h-[340px] transition-transform duration-200 ease-out [transform-style:preserve-3d]"
            style={{ transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)` }}
          >
            <div className="absolute top-0 left-4 right-0 rounded-2xl border border-white/15 bg-gradient-to-br from-white/15 to-white/5 p-5 backdrop-blur-xl shadow-2xl [transform:translateZ(60px)]">
              <small className="block text-xs text-[#c9a3a7]">
                {primaryResource ? `${primaryResource.name} · Today` : 'Live Resource Status'}
              </small>
              <b className="font-serif-display text-2xl font-normal block mt-0.5">
                {primaryResource ? `${primaryResource.status}` : 'No resources added yet'}
              </b>
              <div className="mt-3 grid grid-cols-12 gap-1">
                {Array.from({ length: 12 }, (_, i) => {
                  const h = 8 + i;
                  const busy =
                    primaryResource &&
                    timeInfo.todayStr &&
                    reservations.some((b) => {
                      if (b.resourceId !== primaryResource.id || !b.startTime.startsWith(timeInfo.todayStr)) return false;
                      const s = new Date(b.startTime).getHours();
                      const e = new Date(b.endTime).getHours();
                      return h >= s && h < e;
                    });
                  return (
                    <span
                      key={i}
                      className={`h-7 rounded ${busy ? 'bg-[#86303b]' : 'bg-white/10'}`}
                    />
                  );
                })}
              </div>
            </div>

            <div className="absolute top-36 -left-2 w-2/3 rounded-2xl border border-white/15 bg-gradient-to-br from-white/15 to-white/5 p-5 backdrop-blur-xl shadow-2xl [transform:translateZ(110px)]">
              <small className="block text-xs text-[#c9a3a7]">Registered Facilities</small>
              <b className="font-serif-display text-2xl font-normal block mt-0.5">
                {resources.length} Active {resources.length === 1 ? 'Resource' : 'Resources'}
              </b>
            </div>

            <div className="absolute bottom-0 right-0 w-2/3 rounded-2xl border border-[#f8bd45] bg-[#f8bd45] p-5 text-[#3a1a04] shadow-2xl [transform:translateZ(150px)]">
              <small className="block text-xs text-[#6b3e10]">
                {latestBooking ? `Booked by ${latestBooking.user?.name}` : 'Reservation Status'}
              </small>
              <b className="font-serif-display text-2xl font-normal block mt-0.5 truncate">
                {latestBooking ? `${latestBooking.resource?.name}` : '0 Active Bookings'}
              </b>
            </div>
          </div>
        </div>
      </section>

      <section className="my-10 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-white/15 bg-white/5 p-6 backdrop-blur-lg">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-xl text-[#f8bd45]">
            ◔
          </div>
          <h3 className="text-lg font-semibold">Live availability</h3>
          <p className="mt-1 text-sm text-[#c9a3a7]">
            Every registered room and equipment item on one real-time timeline backed by PostgreSQL.
          </p>
        </div>

        <div className="rounded-2xl border border-white/15 bg-white/5 p-6 backdrop-blur-lg">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-xl text-[#f8bd45]">
            ✓
          </div>
          <h3 className="text-lg font-semibold">Conflict-free</h3>
          <p className="mt-1 text-sm text-[#c9a3a7]">
            Reserved hours are locked both on the UI and verified by backend database checks.
          </p>
        </div>

        <div className="rounded-2xl border border-white/15 bg-white/5 p-6 backdrop-blur-lg">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-xl text-[#f8bd45]">
            ⚡
          </div>
          <h3 className="text-lg font-semibold">Two taps to book</h3>
          <p className="mt-1 text-sm text-[#c9a3a7]">
            Pick a start hour, pick an end hour, confirm. All data persists directly in the database.
          </p>
        </div>
      </section>
    </main>
  );
}