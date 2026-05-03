import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api';

function initials(name) {
  if (!name || typeof name !== 'string') return '—';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return parts[0].slice(0, 2).toUpperCase();
}

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

  const verified = session?.verified && session?.active && !session?.flagged;
  const flagged = session?.flagged;

  let statusTone = 'warn';
  let statusTitle = 'Session inactive';
  let statusBody = 'This session is no longer active.';
  if (flagged) {
    statusTone = 'bad';
    statusTitle = 'Identity mismatch';
    statusBody = 'This driver failed re-verification. The account has been locked. Please do not proceed with this ride.';
  } else if (verified) {
    statusTone = 'ok';
    statusTitle = 'Driver verified';
    statusBody = 'This driver\'s identity has been confirmed by SOBA biometric verification.';
  }

  return (
    <div className="passenger-shell page-enter">
      <div className="passenger-grid">
        <aside className="passenger-brand">
          <div className="passenger-brand-lockup">
            <div className="passenger-logo-wrap">
              <img
                className="passenger-logo"
                src="/ricksaw.png"
                alt=""
                decoding="async"
              />
            </div>
            <div className="passenger-brand-headlines">
              <h1>TukVerify</h1>
              <p className="soba-brand-caption soba-brand-caption--panel">
                Powered by SOBA Network
              </p>
            </div>
          </div>
          <p className="passenger-brand-lede">
            Passenger-facing verification. Built for clarity and trust — minimal noise, maximum signal.
          </p>
        </aside>

        <div className="passenger-panel">
          {error ? (
            <div style={{ textAlign: 'center', padding: '32px 12px' }}>
              <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--red)', marginBottom: 8 }}>Session not found</div>
              <div style={{ fontSize: 14, color: 'var(--text-dim)', lineHeight: 1.6 }}>{error}</div>
            </div>
          ) : (
            <>
              <div className={`passenger-status passenger-status--${statusTone}`}>
                <div style={{
                  fontSize: 13,
                  fontWeight: 600,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: flagged ? 'var(--red)' : verified ? 'var(--green)' : 'var(--yellow)',
                  marginBottom: 10,
                }}>
                  Status
                </div>
                <div style={{
                  fontSize: 'clamp(1.25rem, 3vw, 1.5rem)',
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  color: 'var(--text-bright)',
                  marginBottom: 10,
                }}>
                  {statusTitle}
                </div>
                  <div style={{ fontSize: 14, color: 'var(--text-dim)', lineHeight: 1.65, maxWidth: '42ch', margin: '0 auto' }}>
                  {statusBody}
                </div>
                {verified && (
                  <div style={{ marginTop: 18 }}>
                    <span className="badge badge-green" style={{ fontSize: 12, padding: '6px 14px', borderRadius: 999 }}>
                      <span className="pulse-dot" /> Verified now
                    </span>
                  </div>
                )}
              </div>

              {session?.driver && (
                <div className="card" style={{ marginBottom: 20, padding: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                    <div
                      className="passenger-avatar"
                      style={{
                        background: verified ? 'rgba(200, 240, 49, 0.12)' : 'var(--muted)',
                        color: verified ? 'var(--green)' : 'var(--text-dim)',
                        border: `1px solid ${verified ? 'rgba(200, 240, 49, 0.35)' : 'var(--border)'}`,
                      }}
                      aria-hidden
                    >
                      {initials(session.driver.name)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 20, color: 'var(--text-bright)', letterSpacing: '-0.02em' }}>{session.driver.name}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 2 }}>{session.driver.vehicle}</div>
                      <div style={{ fontSize: 13, color: 'var(--yellow)', marginTop: 2 }}>{session.driver.rating} rating</div>
                    </div>
                  </div>

                  {[
                    ['License number', session.driver.license],
                    ['Verified at', new Date(session.startedAt).toLocaleString()],
                    ['Verification method', 'SOBA face biometric'],
                    ['Data stored', 'None (ZK proof only)'],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '12px 0', borderTop: '1px solid var(--border)' }}>
                      <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>{k}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-bright)', textAlign: 'right' }}>{v}</span>
                    </div>
                  ))}
                </div>
              )}

              {verified && (
                <div className="card-sm" style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-dim)', marginBottom: 10, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    Zero-knowledge proof
                  </div>
                  <div className="zk-proof" style={{ fontSize: 10 }}>{session.zkProof}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 12, lineHeight: 1.65 }}>
                    This cryptographic proof confirms a verified human completed the face scan — without revealing or storing biometric data.
                  </div>
                </div>
              )}

              <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.75 }}>
                <div>Secured by <span style={{ color: 'var(--soba)', fontWeight: 700 }}>SOBA Network</span></div>
                <div>Zero knowledge · Self-owned biometrics · PDPA 2022 compliant</div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
