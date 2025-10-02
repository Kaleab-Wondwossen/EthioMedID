'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { CertificateCard, type Certificate } from '@/components/CertificateCard';

type Page<T> = { items: T[]; total: number; page: number; limit: number };

export default function ClinicianCertificatesPage() {
  const [items, setItems] = useState<Certificate[]>([]);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    try {
      setErr(null);
      const data = await api<Page<Certificate>>('/certificates?page=1&limit=20');
      setItems(data.items ?? []);
    } catch (e: unknown) {
  setErr(e instanceof Error ? e.message : 'Failed to load');
}
  }

  useEffect(() => { load().catch(() => {}); }, []);

  return (
    <main style={{ padding: 20, maxWidth: 900, margin: '0 auto' }}>
      <h1>Certificates (Clinician)</h1>
      {err && <p style={{ color: 'crimson' }}>{err}</p>}
      <div style={{ display: 'grid', gap: 12 }}>
        {items.map((c) => <CertificateCard key={c._id} cert={c} />)}
        {!items.length && <i style={{ color: '#666' }}>No certificates yet.</i>}
      </div>
    </main>
  );
}
