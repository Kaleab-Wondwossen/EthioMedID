'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

type Props = {
  open: boolean;
  onClose: () => void;
  onResult: (text: string) => void;
};

export default function QrScanDialog({ open, onClose, onResult }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanner, setScanner] = useState<Html5Qrcode | null>(null);

  useEffect(() => {
    if (!open) return;
    let isMounted = true;
    const id = 'qr-reader-' + Math.random().toString(36).slice(2);
    if (containerRef.current) {
      containerRef.current.innerHTML = `<div id="${id}" />`;
    }

    const instance = new Html5Qrcode(id);
    setScanner(instance);

    (async () => {
      try {
        // prefer back camera on mobile if available
        await instance.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            if (!isMounted) return;
            // stop immediately on first result
            instance.stop().then(() => {
              onResult(decodedText);
              onClose();
            });
          },
          () => {
            // optional onScanFailure callback (ignore)
          }
        );
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Failed to start camera. Check permissions.';
        setError(msg);
      }
    })();

    return () => {
      isMounted = false;
      instance
        .stop()
        .catch(() => {})
        .finally(() => instance.clear());
    };
  }, [open, onClose, onResult]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
        display: 'grid', placeItems: 'center', zIndex: 50
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(92vw, 520px)',
          background: 'white',
          borderRadius: 12,
          padding: 16,
          display: 'grid',
          gap: 10
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>Scan QR Code</h3>
          <button onClick={onClose}>Close</button>
        </div>

        {error && <div style={{ color: 'crimson' }}>{error}</div>}

        <div ref={containerRef} style={{ display: 'grid', placeItems: 'center' }}>
          {/* html5-qrcode injects a video/overlay into this element */}
        </div>

        <p style={{ fontSize: 12, color: '#666', margin: 0 }}>
          Tip: If you have multiple cameras, look for a camera selector icon in the preview area.
        </p>
      </div>
    </div>
  );
}
