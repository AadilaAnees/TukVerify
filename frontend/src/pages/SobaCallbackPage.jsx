import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function SobaCallbackPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const status = params.get('status');
  const nic = params.get('nic');

  useEffect(() => {
    // Auto-redirect after 3 seconds
    const timer = setTimeout(() => {
      if (status === 'success') navigate('/driver');
      else navigate('/enroll');
    }, 3000);
    return () => clearTimeout(timer);
  }, [status, navigate]);

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--black)',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <div style={{ fontSize: 72, marginBottom: 16 }}>
          {status === 'success' ? '✅' : '❌'}
        </div>
        <div style={{ fontSize: 24, fontWeight: 800, color: status === 'success' ? 'var(--green)' : 'var(--red)', marginBottom: 8 }}>
          {status === 'success' ? 'SOBA Verified!' : 'Verification Failed'}
        </div>
        <div style={{ fontSize: 14, color: 'var(--text-dim)' }}>
          {status === 'success'
            ? `Driver ${nic} has been biometrically enrolled. Redirecting...`
            : 'Face scan did not match. Please try again. Redirecting...'
          }
        </div>
      </div>
    </div>
  );
}