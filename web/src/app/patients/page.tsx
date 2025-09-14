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

export default function PatientsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [list, setList] = useState<Patient[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [patientId, setPatientId] = useState('');
  const [name, setName] = useState('');
  const [search, setSearch] = useState('');
  const [err, setErr] = useState<string | null>(null);

  const page = Number(searchParams.get('page') || 1);
  const limit = Number(searchParams.get('limit') || 5);

  // Build a PATH (not absolute URL) so api() can prepend base and add Authorization
  const path = useMemo(() => {
    const qs = new URLSearchParams();
    if (search) qs.set('search', search);
    if (limit) qs.set('limit', String(limit));
    if (page) qs.set('page', String(page));
    return `/patients${qs.toString() ? `?${qs}` : ''}`;
  }, [search, page, limit]);

  // Auth guard
  useEffect(() => {
    (async () => {
      try {
        setErr(null);
        await api('/auth/me'); // will throw if not logged in / token missing
      } catch {
        router.push('/login');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    try {
      setErr(null);
      const data = await api<unknown>(path);
      if (Array.isArray(data)) {
        setList(data as Patient[]);
        setTotal(data.length);
      } else {
        const pg = data as Paginated<Patient>;
        setList(pg.items || []);
        setTotal(pg.total ?? null);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setErr(msg);
    }
  }

  useEffect(() => {
    load().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);

  async function add() {
    try {
      setErr(null);
      await api('/patients', {
        method: 'POST',
        body: JSON.stringify({ patientId, name }),
      });
      setPatientId('');
      setName('');
      await load();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setErr(msg);
    }
  }

  const totalPages = total ? Math.max(1, Math.ceil(total / limit)) : 1;
  function go(to: number) {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(to));
    params.set('limit', String(limit));
    router.push(`/patients?${params.toString()}`);
  }

  return (
    <main style={{ padding: 20, maxWidth: 720, margin: '0 auto' }}>
      <h1>Patients</h1>
      {err && <p style={{ color: 'crimson' }}>{err}</p>}

      <div style={{ display: 'flex', gap: 8, margin: '12px 0' }}>
        <input
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, padding: 8 }}
        />
        <button onClick={load}>Refresh</button>
      </div>

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

      <ul style={{ marginTop: 12 }}>
        {list.map((p) => (
          <li key={p._id} style={{ padding: '6px 0' }}>
            <strong>{p.patientId}</strong> — {p.name}
          </li>
        ))}
        {!list.length && <li style={{ color: '#666' }}>No patients found.</li>}
      </ul>

      {total !== null && (
        <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={() => go(page - 1)} disabled={page <= 1}>Prev</button>
          <span>Page {page} of {totalPages} (total {total})</span>
          <button onClick={() => go(page + 1)} disabled={page >= totalPages}>Next</button>
        </div>
      )}
    </main>
  );
}
