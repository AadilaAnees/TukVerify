import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api';

export default function DriverPage() {
  const [nic, setNic] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [session, setSession] = useState(null);
  const [driver, setDriver] = useState(null);
  const [reVerifying, setReVerifying] = useState(false);
  const [reVerifyResult, setReVerifyResult] = useState(null);
  
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // 🚨 NEW: Catch the driver coming back from the SOBA live scan
  useEffect(() => {
    const status = searchParams.get('status');
    const returnedNic = searchParams.get('nic');

    if (status === 'success' && returnedNic) {
      setNic(returnedNic);
      startLiveSession(returnedNic);
      // Clean the URL so it doesn't loop if they refresh
      setSearchParams({}); 
    }
  }, [searchParams, setSearchParams]);

  // Helper function to actually create the session in the backend
  async function startLiveSession(driverNic) {
    setLoading(true);
    setScanning(true);
    try {
      const d = await api.getDriver(driverNic);
      setDriver(d.driver);
      
      const res = await api.startSession({ nic: driverNic });
      setSession(res.session);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setScanning(false);
    }
  }

  // 🚨 UPDATED: Now triggers the live redirect instead of simulating
  async function handleGoOnline(e) {
    e.preventDefault();
    if (!nic) { setError('Please enter your NIC number'); return; }
    setError('');
    setLoading(true);

    try {
      // 1. Ensure driver exists
      await api.getDriver(nic); 

      // 2. Ask backend for the Live SOBA Verification URL
      const res = await fetch('http://localhost:5000/api/sessions/soba-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nic })
      });
      const data = await res.json();

      if (data.sobaRedirectUrl) {
        // 3. Redirect the browser to the live SOBA face scan
        window.location.href = data.sobaRedirectUrl; 
      } else {
        setError("SOBA Verification URL is missing in the backend.");
        setLoading(false);
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  async function handleEndSession() {
    if (!session) return;
    await api.endSession(session.sessionId);
    setSession(null);
    setDriver(null);
    setNic('');
    setReVerifyResult(null);
  }

  async function handleReVerify() {
    setReVerifying(true);
    setReVerifyResult(null);
    await new Promise(r => setTimeout(r, 2000));
    try {
      const res = await api.reVerify(session.sessionId);
      setReVerifyResult(res);
      if (!res.verified) {
        setSession(prev => ({ ...prev, active: false, flagged: true }));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setReVerifying(false);
    }
  }

  // Active session view
  if (session) {
    return (
      <div className="page-enter">
        <div className="page-header">
          <div className="flex-between">
            <div>
              <h2 className="page-title">Active Session</h2>
              <p className="page-subtitle">Driver is online and verified</p>
            </div>
            <button className="btn btn-danger" onClick={handleEndSession}>Go Offline</button>
          </div>
        </div>

        <div className="page-body">
          <div style={{ maxWidth: 640, margin: '0 auto' }}>

            {/* Big verified status */}
            <div className={session.flagged ? 'unverified-block' : 'verified-block'} style={{ marginBottom: 24 }}>
              <div className="verified-icon">{session.flagged ? '🚨' : '✅'}</div>
              <div className={session.flagged ? 'unverified-title' : 'verified-title'}>
                {session.flagged ? 'SESSION FLAGGED' : 'VERIFIED & ONLINE'}
              </div>
              <div className="verified-sub">
                {session.flagged
                  ? 'Re-verification failed. Identity mismatch detected. Session locked.'
                  : `Session started at ${new Date(session.startedAt).toLocaleTimeString()} · SOBA ZK proof active`
                }
              </div>
              {!session.flagged && (
                <div style={{ marginTop: 16 }}>
                  <span className="badge badge-green" style={{ fontSize: 13, padding: '6px 16px' }}>
                    <span className="pulse-dot" /> LIVE SESSION
                  </span>
                </div>
              )}
            </div>

            {/* Driver info */}
            <div className="card" style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-bright)', marginBottom: 16 }}>Driver Details</div>
              {[
                ['Name', driver?.name],
                ['NIC', driver?.nic],
                ['License', driver?.license],
                ['Vehicle', driver?.vehicle],
                ['Rating', `⭐ ${driver?.rating}`],
                ['Session ID', session.sessionId.substring(0, 16) + '...'],
                ['Rides This Session', session.rides?.length ?? 0],
                ['Re-verifications', session.reVerifications?.length ?? 0],
              ].map(([k, v]) => (
                <div key={k} className="flex-between" style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>{k}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-bright)', fontFamily: k === 'Session ID' ? 'Space Mono' : undefined }}>{v}</span>
                </div>
              ))}

              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>ZK Proof</div>
                <div className="zk-proof">{session.zkProof}</div>
              </div>
            </div>

            {/* Actions */}
            {!session.flagged && (
              <div className="card" style={{ marginBottom: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-bright)', marginBottom: 16 }}>Session Actions</div>

                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <button
                    className="btn btn-soba"
                    onClick={handleReVerify}
                    disabled={reVerifying}
                    style={{ flex: 1 }}
                  >
                    {reVerifying ? <><span className="spinner" /> Scanning...</> : '🔐 Trigger Mid-Shift Re-verify'}
                  </button>
                  <button
                    className="btn btn-outline"
                    onClick={() => navigate(`/passenger/${session.sessionId}`)}
                    style={{ flex: 1 }}
                  >
                    👁️ View Passenger Badge
                  </button>
                </div>

                {reVerifyResult && (
                  <div className={`alert ${reVerifyResult.verified ? 'alert-success' : 'alert-error'}`} style={{ marginTop: 16, marginBottom: 0 }}>
                    {reVerifyResult.verified
                      ? '✅ Re-verification passed — same driver confirmed'
                      : '🚨 Re-verification FAILED — identity mismatch. Session locked.'
                    }
                  </div>
                )}
              </div>
            )}

            {/* Passenger link */}
            <div className="card-sm" style={{ background: 'var(--green-dim)', border: '1px solid rgba(0,232,122,0.2)' }}>
              <div style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 6 }}>Passenger Verification Link</div>
              <div style={{ fontFamily: 'Space Mono', fontSize: 12, color: 'var(--green)', wordBreak: 'break-all' }}>
                {window.location.origin}/passenger/{session.sessionId}
              </div>
              <button
                className="btn btn-primary"
                style={{ marginTop: 12, padding: '8px 20px', fontSize: 13 }}
                onClick={() => navigate(`/passenger/${session.sessionId}`)}
              >
                Open Passenger View →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Login / Go Online
  return (
    <div className="page-enter">
      <div className="page-header">
        <h2 className="page-title">Driver Session</h2>
        <p className="page-subtitle">Verify your identity with SOBA before going online</p>
      </div>

      <div className="page-body">
        <div style={{ maxWidth: 480, margin: '0 auto' }}>

          {/* Scanning state */}
          {scanning ? (
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--text-bright)', marginBottom: 8 }}>SOBA Scanning</div>
              <p style={{ fontSize: 14, color: 'var(--text-dim)', marginBottom: 28 }}>
                Please look at the camera. Verifying your identity...
              </p>
              <div className="scan-animation" style={{ marginBottom: 24 }}>
                <div style={{ textAlign: 'center', zIndex: 1 }}>
                  <div style={{ fontSize: 72 }}>👤</div>
                  <div style={{ fontFamily: 'Space Mono', fontSize: 12, color: 'var(--soba)', marginTop: 8 }}>
                    AUTHENTICATING...
                  </div>
                </div>
              </div>
              <div className="alert alert-info" style={{ marginBottom: 0 }}>
                🔐 Zero Knowledge proof being generated. No face data will be stored.
              </div>
            </div>
          ) : (
            <div className="card">
              <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--text-bright)', marginBottom: 8 }}>Go Online</div>
              <p style={{ fontSize: 14, color: 'var(--text-dim)', marginBottom: 24 }}>
                Enter your NIC to start your shift. SOBA will verify your face before you can accept rides.
              </p>

              {error && <div className="alert alert-error">{error}</div>}

              <form onSubmit={handleGoOnline}>
                <div className="form-group">
                  <label className="form-label">Your NIC Number</label>
                  <input
                    className="form-input"
                    placeholder="e.g. 9X1234567V"
                    value={nic}
                    onChange={e => setNic(e.target.value)}
                  />
                  <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 6 }}>
                    Demo: try <button type="button" style={{ background: 'none', border: 'none', color: 'var(--soba)', cursor: 'pointer', fontFamily: 'Space Mono', fontSize: 12 }} onClick={() => setNic('9X1234567V')}>9X1234567V</button>
                  </div>
                </div>

                <div className="alert alert-info" style={{ marginBottom: 20 }}>
                  🔐 After submitting, SOBA will scan your face. You must match the registered driver profile to go online.
                </div>

                <button className="btn btn-primary btn-lg" type="submit" disabled={loading}>
                  {loading ? <><span className="spinner" /> Checking...</> : '🛺 Start SOBA Verification & Go Online'}
                </button>
              </form>
            </div>
          )}

          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: 'var(--text-dim)' }}>
              Not enrolled yet? <button style={{ background: 'none', border: 'none', color: 'var(--green)', cursor: 'pointer', fontWeight: 700 }} onClick={() => navigate('/enroll')}>Enroll here →</button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
