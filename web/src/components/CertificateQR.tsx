'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

export function CertificateQR({ payload }: { payload: string }) {
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    let mounted = true;
    if (!payload) return;
    QRCode.toDataURL(payload, { margin: 1, scale: 6 })
      .then((url) => { if (mounted) setDataUrl(url); })
      .catch(console.error);
    return () => { mounted = false; };
  }, [payload]);

  if (!payload) return null;

  return (
    
    <div style={{ textAlign: 'center' }}>
      
      {dataUrl ? <img src={dataUrl} alt="Certificate QR" /> : <span>Generating QR…</span>}
      <div style={{ marginTop: 6, fontSize: 12, color: '#666', wordBreak: 'break-all' }}>{payload}</div>
    </div>
  );
}
