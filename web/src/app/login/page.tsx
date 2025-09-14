'use client';
import { useState } from 'react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { setToken } from '@/lib/session';

export default function LoginPage() {
  const [username, setUsername] = useState('doc1');
  const [password, setPassword] = useState('secret123');
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  async function login() {
    try {
      setErr(null);
      // Expect token from backend
      const data = await api<{ ok: true; token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      setToken(data.token);      // ✅ save JWT in localStorage
      router.push('/patients');  // redirect to protected page
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
