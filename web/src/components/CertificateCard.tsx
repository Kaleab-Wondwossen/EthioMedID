'use client';

import { CertificateQR } from './CertificateQR';

export type Certificate = {
  _id: string;
  certificateId: string;
  patientId: string;
  type: 'DrivingLicenceMedical' | 'ImmigrationMedical';
  status: 'DRAFT' | 'SIGNED' | 'REVOKED';
  issuedAt?: string;
  revokedAt?: string;
  url?: string;
  verifyCode?: string;
  qrPayload?: string;
  createdAt: string;
  updatedAt: string;
};

export function CertificateCard({ cert }: { cert: Certificate }) {
  function copy(text?: string) {
    if (!text) return;
    navigator.clipboard.writeText(text).catch(() => {});
  }

  const statusColor =
    cert.status === 'SIGNED' ? '#0a7f2e' :
    cert.status === 'DRAFT'  ? '#8a8a00' :
    '#a10d0d';

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 14, display: 'grid', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontWeight: 600 }}>{cert.certificateId}</div>
          <div style={{ fontSize: 13, color: '#555' }}>{cert.type}</div>
        </div>
        <div style={{ fontWeight: 600, color: statusColor }}>{cert.status}</div>
      </div>

      <div style={{ fontSize: 13, color: '#666' }}>
        Patient: <b>{cert.patientId}</b>
        {cert.issuedAt && <> • Issued: {new Date(cert.issuedAt).toLocaleString()}</>}
        {cert.revokedAt && <> • Revoked: {new Date(cert.revokedAt).toLocaleString()}</>}
      </div>

      {cert.url && (
        <div style={{ fontSize: 13 }}>
          PDF: <a href={cert.url} target="_blank" rel="noreferrer">{cert.url}</a>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 16 }}>
        <div>
          {cert.qrPayload ? <CertificateQR payload={cert.qrPayload} /> : <i style={{ color: '#666' }}>No QR yet</i>}
        </div>
        <div style={{ display: 'grid', gap: 6, alignContent: 'start' }}>
          <div>
            Verify Code:{' '}
            {cert.verifyCode ? <b>{cert.verifyCode}</b> : <i style={{ color: '#666' }}>N/A</i>}{' '}
            {cert.verifyCode && <button onClick={() => copy(cert.verifyCode)} style={{ marginLeft: 6 }}>Copy</button>}
          </div>
          <div>
            Verify URL:{' '}
            {cert.qrPayload ? <span style={{ wordBreak: 'break-all' }}>{cert.qrPayload}</span> : <i>N/A</i>}{' '}
            {cert.qrPayload && <button onClick={() => copy(cert.qrPayload)} style={{ marginLeft: 6 }}>Copy</button>}
          </div>
        </div>
      </div>
    </div>
  );
}
