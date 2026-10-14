'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'EMPLOYEE';
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);

  const loadUser = () => {
    try {
      const raw = localStorage.getItem('primewave_user');
      setUser(raw ? JSON.parse(raw) : null);
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    loadUser();
    window.addEventListener('auth-change', loadUser);
    return () => window.removeEventListener('auth-change', loadUser);
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('primewave_user');
    window.dispatchEvent(new Event('auth-change'));
    router.push('/login');
  };

  const links = [
    { href: '/', label: 'Overview' },
    { href: '/book', label: 'Book Timeline' },
    { href: '/resources', label: 'Resources' },
    { href: '/reservations', label: 'Reservations' },
  ];

  return (
    <header className="sticky top-4 z-50 mb-8 flex flex-col md:flex-row items-center justify-between gap-4 rounded-2xl border border-white/15 bg-[#2e0b10]/85 px-6 py-3.5 backdrop-blur-xl shadow-2xl">
      <Link href="/" className="font-serif-display text-3xl tracking-tight text-[#fbeff0]">
        PrimeWave <span className="text-[#f8bd45]">Reserve.</span>
      </Link>

      <nav className="flex flex-wrap items-center gap-1.5">
        {links.map((l) => {
          const active = pathname === l.href;
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-xl px-3.5 py-2 text-sm font-medium transition-all ${
                active
                  ? 'bg-[#f8bd45] text-[#3a1a04] font-semibold shadow-md'
                  : 'text-[#c9a3a7] hover:bg-white/10 hover:text-[#fbeff0]'
              }`}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-3">
        {user ? (
          <>
            <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3.5 py-1.5">
              <span
                className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                  user.role === 'ADMIN'
                    ? 'bg-[#f8bd45] text-[#3a1a04]'
                    : 'bg-[#4cc38a]/20 text-[#4cc38a]'
                }`}
              >
                {user.role}
              </span>
              <span className="text-sm font-semibold text-[#fbeff0]">{user.name}</span>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-xl border border-[#ff6b5e]/30 bg-[#ff6b5e]/15 px-3.5 py-2 text-xs font-semibold text-[#ff6b5e] transition hover:bg-[#ff6b5e]/25 cursor-pointer"
            >
              Logout
            </button>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-[#fbeff0] transition hover:bg-white/10"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="rounded-xl bg-[#f8bd45] px-4 py-2 text-sm font-bold text-[#3a1a04] transition hover:bg-[#ffcb62]"
            >
              Register
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}