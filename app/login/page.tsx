'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '../context/ToastContext';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMsg = data.error || 'Login failed';
        setError(errorMsg);
        toast.error(errorMsg, 'Error!');
        setLoading(false);
        return;
      }

      localStorage.setItem('primewave_user', JSON.stringify(data));
      window.dispatchEvent(new Event('auth-change'));
      toast.success(`Welcome back, ${data.name}! You signed in successfully.`, 'Success!');
      router.push(data.role === 'ADMIN' ? '/resources' : '/book');
    } catch {
      const err = 'Something went wrong. Please try again.';
      setError(err);
      toast.error(err, 'Error!');
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-[75vh] items-center justify-center">
      <div className="w-full max-w-md rounded-3xl border border-white/15 bg-white/5 p-8 backdrop-blur-xl shadow-2xl">
        <div className="mb-6 text-center">
          <span className="inline-block rounded-full border border-[#f8bd45]/40 bg-[#f8bd45]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#f8bd45]">
            Welcome Back
          </span>
          <h1 className="mt-3 text-4xl font-normal text-[#fbeff0]">
            Sign in to <em className="not-italic text-[#f8bd45]">Reserve</em>
          </h1>
          <p className="mt-2 text-sm text-[#c9a3a7]">
            Access your Admin or Employee account to manage reservations.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-[#ff6b5e]/40 bg-[#ff6b5e]/15 px-4 py-3 text-xs font-semibold text-[#ff6b5e]">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#c9a3a7]">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              className="w-full rounded-xl border border-white/15 bg-black/25 px-4 py-3 text-sm text-white placeholder-[#a77f84] focus:border-[#f8bd45] focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#c9a3a7]">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              className="w-full rounded-xl border border-white/15 bg-black/25 px-4 py-3 text-sm text-white placeholder-[#a77f84] focus:border-[#f8bd45] focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-xl bg-[#f8bd45] py-3.5 font-bold text-[#3a1a04] transition hover:bg-[#ffcb62] disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Signing in...' : 'Sign In →'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[#c9a3a7]">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-semibold text-[#f8bd45] hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}