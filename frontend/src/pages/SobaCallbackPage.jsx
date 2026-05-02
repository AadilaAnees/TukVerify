import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api';

// This page is where SOBA redirects the browser BACK to after face scan.
// SOBA appends: ?type=register|verify&status=success|failed&nic=xxx
export default function SobaCallbackPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const type = params.get('type');      // 'register' or 'verify'
  const status = params.get('status'); // 'success' or 'failed'
  const nic = params.get('nic');
  const txid = params.get('txid');

  const [message, setMessage] = useState('Processing SOBA result...');
  const [done, setDone] = useState(false);
  const success = status === 'success' || status === 'verified';

  useEffect(() => {
    async function handle() {
      if (type === 'register' && success && nic) {
        // Mark driver as enrolled in our system
        try {
          await api.confirmEnrollment({ nic, sobaRegistrationId: txid });
          setMessage(`✅ ${nic} successfully registered with SOBA!`);
        } catch (e) {
          setMessage(`Driver registered in SOBA. Redirecting...`);
        }
        setDone(true);
        setTimeout(() => navigate('/enroll'), 2500);

      } else if (type === 'verify' && success && nic) {
        // Start the session now that SOBA confirmed identity
        try {
          const res = await api.startSession({ nic, sobaVerified: true });
          setMessage(`✅ Identity verified! Starting session...`);
          setDone(true);
          setTimeout(() => navigate(`/driver?sessionId=${res.sessionId}&nic=${nic}`), 2000);
        } catch (e) {
          setMessage(`Session start failed: ${e.message}`);
          setDone(true);
          setTimeout(() => navigate('/driver'), 3000);
        }

      } else if (!success) {
        setMessage('❌ SOBA verification failed. Please try again.');
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
    <div style={{
      minHeight: '100vh', background: 'var(--black)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
    }}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <div style={{ fontWeight: 800, fontSize: 22, color: 'var(--text-bright)', marginBottom: 8 }}>TukVerify</div>
        <div style={{ fontFamily: 'Space Mono', fontSize: 11, color: 'var(--soba)', marginBottom: 40, letterSpacing: 1 }}>SOBA NETWORK</div>

        {!done ? (
          <div>
            <div className="spinner" style={{ width: 48, height: 48, borderColor: 'var(--border)', borderTopColor: 'var(--soba)', margin: '0 auto 24px' }} />
            <div style={{ fontSize: 16, color: 'var(--text-dim)' }}>Processing SOBA verification...</div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 72, marginBottom: 16 }}>{success ? '✅' : '❌'}</div>
            <div style={{
              fontSize: 20, fontWeight: 800, marginBottom: 12,
              color: success ? 'var(--green)' : 'var(--red)'
            }}>
              {success ? 'Verified!' : 'Failed'}
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-dim)', lineHeight: 1.6 }}>{message}</div>
            <div style={{ marginTop: 20, fontSize: 12, color: 'var(--text-dim)' }}>Redirecting automatically...</div>
          </div>
        )}
      </div>
    </div>
  );
}
