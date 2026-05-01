import { useState } from 'react';
import { api } from '../api';

const STEPS = ['Details', 'SOBA Verify', 'Complete'];

export default function EnrollPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ name: '', nic: '', license: '', phone: '', vehicle: 'Three-Wheeler' });
  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [enrolled, setEnrolled] = useState(false);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSubmitDetails(e) {
    e.preventDefault();
    if (!form.name || !form.nic || !form.license) {
      setError('Please fill all required fields.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await api.enrollDriver(form);
      setDriver(res.driver);
      setStep(1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSobaVerify() {
    setScanning(true);
    setError('');

    try {
      // Get SOBA redirect URL from backend
      const res = await fetch('http://localhost:5000/api/drivers/soba-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nic: driver.nic, sobaRef: driver.sobaRef })
      });
      const data = await res.json();

      // 🚨 BUG FIXED HERE: We now check the demoMode flag properly
      if (data.sobaRedirectUrl && data.demoMode === false) {
        // REAL SOBA — redirect to their face scan page!
        window.location.href = data.sobaRedirectUrl;
      } else {
        // DEMO mode — simulate locally
        await new Promise(r => setTimeout(r, 3000));
        await api.confirmEnrollment({ nic: driver.nic, sobaRef: driver.sobaRef });
        setEnrolled(true);
        setStep(2);
        setScanning(false);
      }
    } catch (err) {
      setError(err.message);
      setScanning(false);
    }
  }

  return (
    <div className="page-enter">
      <div className="page-header">
        <h2 className="page-title">Driver Enrollment</h2>
        <p className="page-subtitle">Register and biometrically verify a new driver with SOBA</p>
      </div>

      <div className="page-body">
        {/* Step indicator */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 32 }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                opacity: i > step ? 0.4 : 1, transition: 'opacity 0.3s'
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: i < step ? 'var(--green)' : i === step ? 'var(--soba)' : 'var(--muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 800,
                  color: i < step ? '#000' : '#fff',
                  transition: 'all 0.3s'
                }}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: i === step ? 'var(--text-bright)' : 'var(--text-dim)' }}>
                  {s}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ flex: 1, height: 1, background: i < step ? 'var(--green)' : 'var(--border)', margin: '0 16px', transition: 'background 0.3s' }} />
              )}
            </div>
          ))}
        </div>

        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          {/* Step 1: Details */}
          {step === 0 && (
            <div className="card">
              <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--text-bright)', marginBottom: 8 }}>Driver Details</div>
              <p style={{ fontSize: 14, color: 'var(--text-dim)', marginBottom: 24 }}>
                Enter the driver's information. This will be linked to their biometric identity via SOBA.
              </p>

              {error && <div className="alert alert-error">{error}</div>}

              <form onSubmit={handleSubmitDetails}>
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input className="form-input" placeholder="e.g. Kasun Perera" value={form.name} onChange={e => set('name', e.target.value)} />
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">NIC Number *</label>
                    <input className="form-input" placeholder="e.g. 9X1234567V" value={form.nic} onChange={e => set('nic', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Driving License *</label>
                    <input className="form-input" placeholder="e.g. B1234567" value={form.license} onChange={e => set('license', e.target.value)} />
                  </div>
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input className="form-input" placeholder="+94 77 123 4567" value={form.phone} onChange={e => set('phone', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Vehicle Type</label>
                    <select className="form-select" value={form.vehicle} onChange={e => set('vehicle', e.target.value)}>
                      <option>Three-Wheeler</option>
                      <option>Car</option>
                      <option>Van</option>
                      <option>Mini Car</option>
                    </select>
                  </div>
                </div>
                <button className="btn btn-primary btn-lg" type="submit" disabled={loading}>
                  {loading ? <><span className="spinner" /> Registering...</> : 'Continue to SOBA Verification →'}
                </button>
              </form>
            </div>
          )}

          {/* Step 2: SOBA Face Verification */}
          {step === 1 && (
            <div className="card">
              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--text-bright)', marginBottom: 8 }}>SOBA Face Verification</div>
                <p style={{ fontSize: 14, color: 'var(--text-dim)' }}>
                  Driver <strong style={{ color: 'var(--text-bright)' }}>{driver?.name}</strong> needs to complete a biometric face scan.
                  No face data is stored — only a cryptographic proof.
                </p>
              </div>

              {error && <div className="alert alert-error">{error}</div>}

              {/* Face scan animation */}
              <div className="scan-animation" style={{ marginBottom: 24 }}>
                {scanning ? (
                  <>
                    <div style={{ textAlign: 'center', zIndex: 1 }}>
                      <div style={{ fontSize: 64, filter: 'grayscale(0.3)' }}>👤</div>
                      <div style={{ fontFamily: 'Space Mono', fontSize: 12, color: 'var(--soba)', marginTop: 8 }}>
                        SCANNING...
                      </div>
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 64 }}>👤</div>
                    <div style={{ fontFamily: 'Space Mono', fontSize: 12, color: 'var(--text-dim)', marginTop: 8 }}>
                      READY TO SCAN
                    </div>
                  </div>
                )}
              </div>

              <div className="alert alert-info" style={{ marginBottom: 20 }}>
                🔐 <strong>Privacy First:</strong> SOBA's Zero Knowledge protocol means your face data is never transmitted or stored on any server. Only a cryptographic proof is generated.
              </div>

              <div style={{ background: 'var(--dark)', borderRadius: 8, padding: '14px 16px', marginBottom: 20, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 4, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Registering</div>
                <div style={{ fontWeight: 700, color: 'var(--text-bright)' }}>{driver?.name}</div>
                <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>NIC: {driver?.nic} · License: {driver?.license}</div>
              </div>

              <button
                className="btn btn-soba btn-lg"
                onClick={handleSobaVerify}
                disabled={scanning}
              >
                {scanning
                  ? <><span className="spinner" /> SOBA Scanning Face...</>
                  : '🔐 Launch SOBA Face Verification'
                }
              </button>
            </div>
          )}

          {/* Step 3: Success */}
          {step === 2 && (
            <div>
              <div className="verified-block" style={{ marginBottom: 20 }}>
                <div className="verified-icon">✅</div>
                <div className="verified-title">Enrollment Complete!</div>
                <div className="verified-sub">Driver has been biometrically verified and enrolled in TukVerify</div>
              </div>

              <div className="card">
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-bright)', marginBottom: 16 }}>Enrollment Summary</div>
                {[
                  ['Driver Name', driver?.name],
                  ['NIC Number', driver?.nic],
                  ['License', driver?.license],
                  ['Vehicle', driver?.vehicle],
                  ['SOBA Status', '✅ Verified'],
                  ['Enrolled At', new Date().toLocaleString()],
                ].map(([k, v]) => (
                  <div key={k} className="flex-between" style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>{k}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-bright)' }}>{v}</span>
                  </div>
                ))}

                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>ZK Proof Reference</div>
                  <div className="zk-proof">SOBA_PROOF :: {driver?.sobaRef} :: VERIFIED :: {new Date().toISOString()}</div>
                </div>

                <button className="btn btn-primary btn-lg" style={{ marginTop: 20 }} onClick={() => {
                  setStep(0);
                  setForm({ name: '', nic: '', license: '', phone: '', vehicle: 'Three-Wheeler' });
                  setDriver(null);
                  setEnrolled(false);
                }}>
                  Enroll Another Driver
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
