import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api';

export default function PassengerPage() {
  const { sessionId } = useParams();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getSession(sessionId)
      .then(res => setSession(res.session))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));

    // Poll every 10 seconds
    const interval = setInterval(() => {
      api.getSession(sessionId)
        .then(res => setSession(res.session))
        .catch(() => {});
    }, 10000);
    return () => clearInterval(interval);
  }, [sessionId]);

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--black)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner" style={{ width: 40, height: 40, borderColor: 'var(--border)', borderTopColor: 'var(--green)' }} />
    </div>
  );

  // Full-page passenger view (no sidebar)
  const verified = session?.verified && session?.active && !session?.flagged;
  const flagged = session?.flagged;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--black)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontWeight: 800, fontSize: 24, color: 'var(--text-bright)', letterSpacing: -0.5 }}>TukVerify</div>
          <div style={{ fontFamily: 'Space Mono', fontSize: 11, color: 'var(--soba)', marginTop: 4, letterSpacing: 1 }}>POWERED BY SOBA NETWORK</div>
        </div>

        {error ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
            <div style={{ fontWeight: 800, fontSize: 20, color: 'var(--red)', marginBottom: 8 }}>Session Not Found</div>
            <div style={{ fontSize: 14, color: 'var(--text-dim)' }}>{error}</div>
          </div>
        ) : (
          <>
            {/* Main verification status */}
            <div style={{
              borderRadius: 24,
              padding: 32,
              textAlign: 'center',
              marginBottom: 20,
              background: flagged ? 'var(--red-dim)' : verified ? 'var(--green-dim)' : 'var(--yellow-dim)',
              border: `1px solid ${flagged ? 'rgba(255,68,68,0.3)' : verified ? 'rgba(0,232,122,0.3)' : 'rgba(251,191,36,0.3)'}`,
            }}>
              <div style={{ fontSize: 72, marginBottom: 8 }}>
                {flagged ? '🚨' : verified ? '✅' : '⚠️'}
              </div>
              <div style={{
                fontSize: 22, fontWeight: 800,
                color: flagged ? 'var(--red)' : verified ? 'var(--green)' : 'var(--yellow)',
                marginBottom: 8, letterSpacing: -0.5
              }}>
                {flagged ? 'IDENTITY MISMATCH' : verified ? 'DRIVER VERIFIED' : 'SESSION INACTIVE'}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.6 }}>
                {flagged
                  ? 'This driver failed re-verification. The account has been locked. Please do not proceed with this ride.'
                  : verified
                    ? 'This driver\'s identity has been confirmed by SOBA biometric verification.'
                    : 'This session is no longer active.'
                }
              </div>

              {verified && (
                <div style={{ marginTop: 16 }}>
                  <span className="badge badge-green" style={{ fontSize: 13, padding: '6px 16px' }}>
                    <span className="pulse-dot" /> VERIFIED NOW
                  </span>
                </div>
              )}
            </div>

            {/* Driver details */}
            {session?.driver && (
              <div style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 20,
                padding: 24,
                marginBottom: 20
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: '50%',
                    background: verified ? 'var(--green-dim)' : 'var(--muted)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 28, border: `2px solid ${verified ? 'var(--green)' : 'var(--border)'}`
                  }}>
                    🛺
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 20, color: 'var(--text-bright)' }}>{session.driver.name}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>{session.driver.vehicle}</div>
                    <div style={{ fontSize: 13, color: 'var(--yellow)' }}>⭐ {session.driver.rating} rating</div>
                  </div>
                </div>

                {[
                  ['License Number', session.driver.license],
                  ['Verified At', new Date(session.startedAt).toLocaleString()],
                  ['Verification Method', 'SOBA Face Biometric'],
                  ['Data Stored', 'None (ZK Proof only)'],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>{k}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-bright)' }}>{v}</span>
                  </div>
                ))}
              </div>
            )}

            {/* ZK Proof */}
            {verified && (
              <div style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 16,
                padding: 20,
                marginBottom: 20
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span className="badge badge-soba">ZK Proof</span>
                  <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>Privacy-preserving verification</span>
                </div>
                <div className="zk-proof" style={{ fontSize: 10 }}>{session.zkProof}</div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 10, lineHeight: 1.6 }}>
                  This cryptographic proof confirms a verified human completed the face scan — without revealing or storing any biometric data.
                </div>
              </div>
            )}

            {/* Footer */}
            <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.8 }}>
              <div>Secured by <span style={{ color: 'var(--soba)', fontWeight: 700 }}>SOBA Network</span></div>
              <div>Zero Knowledge · Self-Owned Biometrics · PDPA 2022 Compliant</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
