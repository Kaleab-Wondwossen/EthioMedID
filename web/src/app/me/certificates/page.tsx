'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { CertificateCard, type Certificate } from '@/components/CertificateCard';
import { useRouter } from 'next/navigation';

type Me = { sub: string; username: string; role: 'patient' | 'clinician' | 'admin'; linkedPatientId?: string };
type Page<T> = { items: T[]; total: number; page: number; limit: number };

export default function MyCertificatesPage() {
    const [items, setItems] = useState<Certificate[]>([]);
    const [err, setErr] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        (async () => {
            try {
                setErr(null);
                const me = await api<Me>('/auth/me');
                if (me.role !== 'patient' || !me.linkedPatientId) {
                    router.push('/login'); return;
                }
                const data = await api<Page<Certificate>>(`/certificates?patientId=${encodeURIComponent(me.linkedPatientId)}&page=1&limit=50`);
                setItems(data.items ?? []);
            } catch (e: unknown) {
                setErr(e instanceof Error ? e.message : 'Failed to load');
            }
        })();
    }, []);

    return (
        <main style={{ padding: 20, maxWidth: 900, margin: '0 auto' }}>
            <h1>My Certificates</h1>
            {err && <p style={{ color: 'crimson' }}>{err}</p>}
            <div style={{ display: 'grid', gap: 12 }}>
                {items.map((c) => <CertificateCard key={c._id} cert={c} />)}
                {!items.length && <i style={{ color: '#666' }}>No certificates found.</i>}
            </div>
        </main>
    );
}
