'use client';
import { useState } from 'react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [username, setUsername] = useState('doc1');
  const [password, setPassword] = useState('secret123');
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  async function login() {
    try {
      setErr(null);
      await api<{ ok: true }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      router.push('/patients'); // go to protected page
    } catch (e: unknown) {
  const msg = e instanceof Error ? e.message : String(e);
  setErr(msg);
}

  }

  return (
    <main style={{ padding: 20, maxWidth: 420, margin: '0 auto' }}>
      <h1>Login</h1>
      {err && <p style={{ color: 'red' }}>{err}</p>}
      <div style={{ display: 'grid', gap: 8 }}>
        <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" />
        <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="password" type="password" />
        <button onClick={login}>Login</button>
      </div>
    </main>
  );
}
