'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useToast } from '../context/ToastContext';


interface Resource {
  id: string;
  name: string;
  type: string;
  capacity: number;
  status: string;
}

interface AuthUser {
  id: string;
  name: string;
  role: 'ADMIN' | 'EMPLOYEE';
}

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [type, setType] = useState('room');
  const [capacity, setCapacity] = useState('6');
  const [status, setStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  const loadResources = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/resources');
      const data = await res.json();
      if (Array.isArray(data)) setResources(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResources();
    const raw = localStorage.getItem('primewave_user');
    if (raw) setUser(JSON.parse(raw));
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.warning('Please provide a resource name.');
      return;
    }
    if (user?.role !== 'ADMIN') {
      toast.error('Only administrators are authorized to add resources.', 'Error!');
      return;
    }
    setSubmitting(true);

    try {
      const res = await fetch('/api/resources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
        },
        body: JSON.stringify({
          name,
          type,
          capacity: Number(capacity),
          status: status || `Capacity ${capacity}`,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || 'Failed to add resource. An error occurred.', 'Error!');
        setSubmitting(false);
        return;
      }

      toast.success(`Resource "${name}" was created successfully.`, 'Success!');
      setName('');
      setStatus('');
      loadResources();
    } catch {
      toast.error('An unexpected error occurred while adding resource.', 'Error!');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, resName: string) => {
    if (user?.role !== 'ADMIN') {
      toast.error('Only administrators can remove resources.', 'Error!');
      return;
    }
    try {
      const res = await fetch(`/api/resources?id=${id}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': user?.id || '',
        },
      });
      if (!res.ok) {
        toast.error('Failed to remove resource.', 'Error!');
        return;
      }
      toast.info(`"${resName}" was removed successfully.`, 'Info');
      loadResources();
    } catch {
      toast.error('Could not delete resource.', 'Error!');
    }
  };

  const isAdmin = user?.role === 'ADMIN';

  return (
    <main>
      <div className="mb-6">
        <h2 className="text-4xl font-normal">Shared Resources</h2>
        <p className="mt-1 text-sm text-[#c9a3a7]">
          Browse organizational facilities and equipment. Administrators can register or remove resources.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className={isAdmin ? 'lg:col-span-8' : 'lg:col-span-12'}>
          {loading ? (
            <div className="rounded-3xl border border-white/15 bg-white/5 p-8 text-[#c9a3a7]">
              Loading resources from database…
            </div>
          ) : resources.length === 0 ? (
            <div className="rounded-3xl border border-white/15 bg-white/5 p-10 text-center backdrop-blur-xl">
              <p className="font-serif-display text-3xl text-[#fbeff0]">No resources in database yet</p>
              <p className="mt-2 text-sm text-[#c9a3a7]">
                {isAdmin
                  ? 'Use the Administrator panel on the right to add your first resource.'
                  : 'Please sign in with an Administrator account to add organizational resources.'}
              </p>
              {!isAdmin && (
                <Link
                  href="/register"
                  className="mt-4 inline-block rounded-xl bg-[#f8bd45] px-5 py-2.5 text-sm font-bold text-[#3a1a04]"
                >
                  Register as Admin
                </Link>
              )}
            </div>
          ) : (
            <div className={`grid grid-cols-1 ${isAdmin ? 'sm:grid-cols-2' : 'sm:grid-cols-3'} gap-4`}>
              {resources.map((r) => (
                <div
                  key={r.id}
                  className="flex flex-col justify-between rounded-2xl border border-white/15 bg-white/5 p-6 backdrop-blur-lg transition hover:bg-white/10"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="rounded-lg border border-white/15 bg-white/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-[#f8bd45]">
                        {r.type}
                      </span>
                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(r.id, r.name)}
                          className="text-xs text-[#ff6b5e] hover:underline cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <h3 className="mt-4 text-xl font-semibold">{r.name}</h3>
                    <p className="mt-1 text-sm text-[#c9a3a7]">{r.status}</p>
                  </div>
                  <div className="mt-4 border-t border-white/10 pt-3 text-xs font-semibold text-[#f8bd45]">
                    Capacity: {r.capacity || 1}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {isAdmin && (
          <aside className="lg:col-span-4 rounded-3xl border border-white/15 bg-white/5 p-6 backdrop-blur-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Add New Resource</h3>
              <span className="rounded bg-[#f8bd45] px-2 py-0.5 text-[10px] font-bold uppercase text-[#3a1a04]">
                Admin Only
              </span>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#c9a3a7] mb-1.5">
                  Resource Name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter resource name"
                  required
                  className="w-full rounded-xl border border-white/15 bg-black/25 px-3.5 py-2.5 text-sm text-white placeholder-[#a77f84] focus:border-[#f8bd45] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#c9a3a7] mb-1.5">
                  Category
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-[#2e0b10] px-3.5 py-2.5 text-sm text-white focus:border-[#f8bd45] focus:outline-none"
                >
                  <option value="room">Room / Facility</option>
                  <option value="gear">Equipment / Gear</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#c9a3a7] mb-1.5">
                  Capacity
                </label>
                <input
                  type="number"
                  min="1"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-black/25 px-3.5 py-2.5 text-sm text-white focus:border-[#f8bd45] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#c9a3a7] mb-1.5">
                  Details / Notes
                </label>
                <input
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  placeholder="Specifications or location details"
                  className="w-full rounded-xl border border-white/15 bg-black/25 px-3.5 py-2.5 text-sm text-white placeholder-[#a77f84] focus:border-[#f8bd45] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-[#f8bd45] py-3 font-bold text-[#3a1a04] transition hover:bg-[#ffcb62] disabled:opacity-50 cursor-pointer"
              >
                {submitting ? 'Saving...' : '+ Add Resource'}
              </button>
            </form>
          </aside>
        )}
      </div>
    </main>
  );
}