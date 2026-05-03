import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api';

export default function SobaCallbackPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const type = params.get('type');
  const status = params.get('status');
  const nic = params.get('nic');
  const txid = params.get('txid');

  const [message, setMessage] = useState('Processing SOBA result...');
  const [done, setDone] = useState(false);
  const success = status === 'success' || status === 'verified';

  useEffect(() => {
    async function handle() {
      if (type === 'register' && success && nic) {
        try {
          await api.confirmEnrollment({ nic, sobaRegistrationId: txid });
          setMessage(`Success: ${nic} successfully registered with SOBA!`);
        } catch {
          setMessage('Driver registered in SOBA. Redirecting...');
        }
        setDone(true);
        setTimeout(() => navigate('/enroll'), 2500);

      } else if (type === 'verify' && success && nic) {
        try {
          const res = await api.startSession({ nic, sobaVerified: true });
          setMessage('Success: Identity verified! Starting session...');
          setDone(true);
          setTimeout(() => navigate(`/driver?sessionId=${res.sessionId}&nic=${nic}`), 2000);
        } catch (e) {
          setMessage(`Session start failed: ${e.message}`);
          setDone(true);
          setTimeout(() => navigate('/driver'), 3000);
        }

      } else if (!success) {
        setMessage('Error: SOBA verification failed. Please try again.');
        setDone(true);
        setTimeout(() => navigate(type === 'register' ? '/enroll' : '/driver'), 3000);

      } else {
        setMessage('Processing...');
        setDone(true);
        setTimeout(() => navigate('/'), 2000);
      }
    }
    handle();
  }, []);

  return (
    <div className="passenger-shell page-enter">
      <div className="soba-callback-card" style={{ textAlign: 'center' }}>
        <img
          className="callback-logo"
          src="/ricksaw.png"
          alt=""
          width={120}
          height={120}
          decoding="async"
        />
        <div style={{ fontWeight: 700, fontSize: 20, color: 'var(--text-bright)', letterSpacing: '-0.02em', marginBottom: 6 }}>TukVerify</div>
        <div className="soba-brand-caption soba-brand-caption--callback">SOBA Network</div>

        {!done ? (
          <div>
            <div className="spinner" style={{ width: 44, height: 44, borderColor: 'var(--border)', borderTopColor: 'var(--soba)', margin: '0 auto 20px' }} />
            <div style={{ fontSize: 15, color: 'var(--text-dim)' }}>Processing SOBA verification…</div>
          </div>
        ) : (
          <div>
            <div style={{
              fontSize: 17,
              fontWeight: 700,
              marginBottom: 10,
              letterSpacing: '-0.02em',
              color: success ? 'var(--green)' : 'var(--red)',
            }}>
              {success ? 'Verified' : 'Failed'}
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-dim)', lineHeight: 1.65 }}>{message}</div>
            <div style={{ marginTop: 20, fontSize: 12, color: 'var(--text-dim)' }}>Redirecting automatically…</div>
          </div>
        )}
      </div>
    </div>
  );
}
