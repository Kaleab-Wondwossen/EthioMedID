'use client';

import { useEffect, useMemo, useState } from 'react';
import QrScanDialog from '@/components/QrScanDialog';

type VerifyResult = {
  valid: boolean;
  certificateId?: string;
  type?: string;
  status?: string;
  issuedAt?: string | null;
  revokedAt?: string | null;
  patient?: string | null; // masked
};

const API = process.env.NEXT_PUBLIC_API_CORE ?? 'http://localhost:4000';

export default function VerifyPage() {
  const [code, setCode] = useState('');
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);

  // Prefill from ?code=...
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const c = p.get('code') || '';
    if (c) {
      setCode(c);
      void handleVerify(c);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleVerify(c?: string) {
    const v = (c ?? code).trim();
    if (!v) return;
    setLoading(true);
    setErr(null);
    setResult(null);
    try {
      const res = await fetch(`${API}/verify?code=${encodeURIComponent(v)}`, { cache: 'no-store' });
      if (res.status === 404) {
        setResult({ valid: false });
      } else if (!res.ok) {
        setErr(await res.text());
      } else {
        const data = (await res.json()) as VerifyResult;
        setResult(data);
      }
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Network error');
    } finally {
      setLoading(false);
    }
  }

  async function pasteFromClipboard() {
    try {
      setErr(null);
      // Modern API (requires https in some browsers; works on localhost)
      const text = await navigator.clipboard.readText();
      if (!text) {
        setErr('Clipboard is empty.');
        return;
      }
      const normalized = text.trim().toUpperCase();
      setCode(normalized);
      void handleVerify(normalized);
    } catch (_e) {
      setErr('Clipboard permission denied. Paste with ⌘/Ctrl+V.');
    }
  }

  const badgeStyle = useMemo(() => {
    if (!result) return {};
    return {
      padding: '6px 10px',
      borderRadius: 8,
      color: 'white',
      background: result.valid ? '#0a7f2e' : '#a10d0d',
      display: 'inline-block'
    } as const;
  }, [result]);

  return (
    <main style={{ padding: 20, maxWidth: 720, margin: '0 auto' }}>
      <h1 style={{ marginBottom: 6 }}>Verify Certificate</h1>
      <p style={{ color: '#555', marginTop: 0 }}>
        Enter or scan the verification code (e.g., <code>ABCD-EFGH</code>).
      </p>

      <div style={{ display: 'flex', gap: 8, margin: '12px 0', flexWrap: 'wrap' }}>
        <input
          placeholder="ABCD-EFGH"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          style={{ flex: 1, minWidth: 220, padding: 10 }}
        />
        <button onClick={() => handleVerify()} disabled={loading || !code.trim()}>
          {loading ? 'Checking…' : 'Verify'}
        </button>
        <button onClick={pasteFromClipboard}>Paste from clipboard</button>
        <button onClick={() => setScanOpen(true)}>Scan QR</button>
      </div>

      {err && <p style={{ color: 'crimson' }}>{err}</p>}

      {result && (
        <div style={{ marginTop: 16, border: '1px solid #e5e7eb', borderRadius: 10, padding: 14 }}>
          <div style={badgeStyle}>
            {result.valid ? 'VALID' : 'INVALID / NOT FOUND'}
          </div>

          {result.valid && (
            <div style={{ marginTop: 10, fontSize: 14, color: '#222' }}>
              <div><b>Certificate ID:</b> {result.certificateId}</div>
              <div><b>Type:</b> {result.type}</div>
              <div><b>Status:</b> {result.status}</div>
              {result.issuedAt && <div><b>Issued:</b> {new Date(result.issuedAt).toLocaleString()}</div>}
              {result.revokedAt && <div><b>Revoked:</b> {new Date(result.revokedAt).toLocaleString()}</div>}
              {typeof result.patient === 'string' && <div><b>Patient:</b> {result.patient}</div>}
            </div>
          )}

          {!result.valid && (
            <p style={{ color: '#444', marginTop: 10 }}>
              The code is invalid or the certificate is not signed/revoked.
              Please double-check the code formatting.
            </p>
          )}
        </div>
      )}

      <QrScanDialog
        open={scanOpen}
        onClose={() => setScanOpen(false)}
        onResult={(text) => {
          // If the QR contains a full URL (e.g., https://host/verify?code=ABCD-EFGH), extract the code:
          try {
            const maybeUrl = new URL(text);
            const fromUrl = maybeUrl.searchParams.get('code');
            const finalCode = (fromUrl || text).trim().toUpperCase();
            setCode(finalCode);
            void handleVerify(finalCode);
          } catch {
            // Not a URL, assume the QR directly encodes the code string
            const finalCode = text.trim().toUpperCase();
            setCode(finalCode);
            void handleVerify(finalCode);
          }
        }}
      />
    </main>
  );
}
