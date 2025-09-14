'use client';

import { useEffect, useMemo, useState, ChangeEvent } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';

type Patient = {
  _id: string;
  patientId: string;
  name: string;
  phone?: string;
  dob?: string;
  sex?: 'male' | 'female' | 'other';
  createdAt: string;
  updatedAt: string;
};

type Paginated<T> = { items: T[]; total: number; page: number; limit: number };

const API = process.env.NEXT_PUBLIC_API_CORE ?? 'http://localhost:4000';

export default function PatientsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // UI state
  const [list, setList] = useState<Patient[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [patientId, setPatientId] = useState('');
  const [name, setName] = useState('');
  const [search, setSearch] = useState('');

  // ✅ Auth guard: redirect to /login if not authenticated
  useEffect(() => {
    (async () => {
      try {
        await api('/auth/me'); // throws if 401
      } catch {
        router.push('/login');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pagination from URL
  const page = Number(searchParams.get('page') || 1);
  const limit = Number(searchParams.get('limit') || 5);

  // Build URL to fetch
  const fetchUrl = useMemo(() => {
    const qs = new URLSearchParams();
    if (search) qs.set('search', search);
    if (limit) qs.set('limit', String(limit));
    if (page) qs.set('page', String(page));
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return `${API}/patients${suffix}`;
  }, [search, page, limit]);

  async function logout() {
  try {
    await api('/auth/logout', { method: 'POST' });
    router.push('/login');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) { /* ignore */ }
}

  async function load() {
    const res = await fetch(fetchUrl, { cache: 'no-store' });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();

    // Accept either an array or a paginated object
    if (Array.isArray(data)) {
      setList(data as Patient[]);
      setTotal(data.length);
    } else {
      const pg = data as Paginated<Patient>;
      setList(pg.items || []);
      setTotal(pg.total ?? null);
    }
  }

  useEffect(() => {
    load().catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchUrl]);

  async function add() {
    const res = await fetch(`${API}/patients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientId, name }),
    });
    if (!res.ok) {
      alert(await res.text());
      return;
    }
    setPatientId('');
    setName('');
    await load();
  }

  // Pagination helpers
  const totalPages = useMemo(() => {
    if (!total) return 1;
    return Math.max(1, Math.ceil(total / limit));
  }, [total, limit]);

  function go(toPage: number) {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(toPage));
    params.set('limit', String(limit));
    router.push(`/patients?${params.toString()}`);
  }

  return (
    <main style={{ padding: 20, maxWidth: 720, margin: '0 auto' }}>
      <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>Patients</h1>

      {/* Search + refresh */}
      <div style={{ display: 'flex', gap: 8, margin: '12px 0' }}>
        <input
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, padding: 8 }}
        />
        <button onClick={load}>Refresh</button>
      </div>

      {/* Add patient */}
      <div style={{ display: 'flex', gap: 8, margin: '12px 0' }}>
        <input
          placeholder="patientId"
          value={patientId}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setPatientId(e.target.value)}
          style={{ padding: 8 }}
        />
        <input
          placeholder="name"
          value={name}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
          style={{ padding: 8 }}
        />
        <button onClick={add}>Add</button>
      </div>

      {/* List */}
      <ul style={{ marginTop: 12 }}>
        {list.map((p) => (
          <li key={p._id} style={{ padding: '6px 0' }}>
            <strong>{p.patientId}</strong> — {p.name}
          </li>
        ))}
        {!list.length && <li style={{ color: '#666' }}>No patients found.</li>}
      </ul>

      {/* Pagination controls (only if total is known) */}
      {total !== null && (
        <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={() => go(page - 1)} disabled={page <= 1}>
            Prev
          </button>
          <span>
            Page {page} of {totalPages} {total !== null ? `(total ${total})` : ''}
          </span>
          <button onClick={() => go(page + 1)} disabled={page >= totalPages}>
            Next
          </button>
          <button onClick={logout}>Logout</button>
        </div>
      )}
    </main>
  );
}
