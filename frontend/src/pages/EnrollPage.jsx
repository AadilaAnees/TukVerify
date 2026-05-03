import { useState } from 'react';
import { api } from '../api';

const STEPS = ['Driver Details', 'SOBA Face Scan', 'Complete'];

export default function EnrollPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ name: '', nic: '', license: '', email: '', phone: '', vehicle: 'Three-Wheeler' });
  const [driver, setDriver] = useState(null);
  const [sobaUrl, setSobaUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSubmitDetails(e) {
    e.preventDefault();
    if (!form.name || !form.nic || !form.license || !form.email) {
      setError('All fields including email are required.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await api.enrollDriver(form);
      setDriver(res.driver);
      setSobaUrl(res.sobaRegistrationUrl);
      setStep(1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleOpenSoba() {
    if (sobaUrl) {
      window.location.href = sobaUrl;
    } else {
      api.confirmEnrollment({ nic: driver.nic, sobaRegistrationId: `demo_${Date.now()}` })
        .then(() => setStep(2))
        .catch(err => setError(err.message));
    }
  }

  return (
    <div className="page-enter">
      <div className="page-header">
        <h2 className="page-title">Enroll Driver</h2>
        <p className="page-subtitle">Register a new driver and verify their identity with SOBA</p>
      </div>
      <div className="page-body">
        <div style={{ display: 'flex', marginBottom: 32 }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: i > step ? 0.4 : 1 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: i < step ? 'var(--green)' : i === step ? 'var(--soba)' : 'var(--muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 800, color: i < step ? '#000' : '#fff',
                }}>{i < step ? '✓' : i + 1}</div>
                <span style={{ fontSize: 13, fontWeight: 700, color: i === step ? 'var(--text-bright)' : 'var(--text-dim)' }}>{s}</span>
              </div>
              {i < STEPS.length - 1 && <div style={{ flex: 1, height: 1, background: i < step ? 'var(--green)' : 'var(--border)', margin: '0 16px' }} />}
            </div>
          ))}
        </div>

        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          {step === 0 && (
            <div className="card">
              <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--text-bright)', marginBottom: 6 }}>Driver Details</div>
              <p style={{ fontSize: 14, color: 'var(--text-dim)', marginBottom: 24 }}>
                Each driver needs a unique email — SOBA uses it to identify them during face scan. No .env changes needed per driver.
              </p>
              {error && <div className="alert alert-error">{error}</div>}
              <form onSubmit={handleSubmitDetails}>
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input className="form-input" placeholder="e.g. Kasun Perera" value={form.name} onChange={e => set('name', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Email Address * <span style={{ color: 'var(--soba)', fontSize: 11 }}>(SOBA identity key — unique per driver)</span>
                  </label>
                  <input className="form-input" type="email" placeholder="driver@example.com" value={form.email} onChange={e => set('email', e.target.value)} />
                  <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 6, lineHeight: 1.5 }}>
                    SOBA builds a unique face scan URL per email. No .env change needed for new drivers.
                  </p>
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
                    <label className="form-label">Phone</label>
                    <input className="form-input" placeholder="+94 77 123 4567" value={form.phone} onChange={e => set('phone', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Vehicle</label>
                    <select className="form-select" value={form.vehicle} onChange={e => set('vehicle', e.target.value)}>
                      <option>Three-Wheeler</option>
                      <option>Car</option>
                      <option>Van</option>
                      <option>Mini Car</option>
                    </select>
                  </div>
                </div>
                <button className="btn btn-primary btn-lg" type="submit" disabled={loading}>
                  {loading ? <><span className="spinner" /> Saving...</> : 'Save & Get SOBA Link →'}
                </button>
              </form>
            </div>
          )}

          {step === 1 && (
            <div className="card">
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--text-bright)', marginBottom: 8 }}>SOBA Face Registration</div>
                <p style={{ fontSize: 14, color: 'var(--text-dim)' }}>
                  Driver <strong style={{ color: 'var(--text-bright)' }}>{driver?.name}</strong> will complete a one-time face scan.
                </p>
              </div>
              {error && <div className="alert alert-error">{error}</div>}
              <div style={{ background: 'var(--dark)', borderRadius: 12, padding: 20, marginBottom: 20, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>Registering Driver</div>
                <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--text-bright)' }}>{driver?.name}</div>
                <div style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 4 }}>NIC: {driver?.nic} · {driver?.license}</div>
                <div style={{ marginTop: 8 }}><span className="badge badge-soba">{driver?.email}</span></div>
              </div>
              <div className="alert alert-info" style={{ marginBottom: 20 }}>
                <strong>What happens next:</strong> SOBA opens a secure face scan page with this driver's email embedded in the URL. SOBA creates a Zero Knowledge proof — no raw face data stored anywhere. After the scan, SOBA redirects back automatically.
              </div>
              {sobaUrl ? (
                <>
                  <div style={{ background: 'var(--dark)', borderRadius: 8, padding: 12, marginBottom: 16, border: '1px solid rgba(129, 140, 248, 0.3)', wordBreak: 'break-all', fontSize: 11, fontFamily: 'Space Mono', color: 'var(--soba)' }}>
                    {sobaUrl}
                  </div>
                  <button type="button" className="btn btn-soba btn-lg" onClick={handleOpenSoba}>Open SOBA face registration</button>
                </>
              ) : (
                <>
                  <div className="alert alert-error" style={{ marginBottom: 16 }}>SOBA not configured — running demo mode</div>
                  <button type="button" className="btn btn-primary btn-lg" onClick={handleOpenSoba}>Simulate SOBA enrollment (demo)</button>
                </>
              )}
              <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-dim)', textAlign: 'center' }}>After scan, SOBA redirects back automatically</div>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="verified-block" style={{ marginBottom: 20 }}>
                <div className="verified-title" style={{ fontSize: 22 }}>Driver enrolled</div>
                <div className="verified-sub" style={{ marginTop: 8 }}>SOBA biometric registration complete</div>
              </div>
              <div className="card">
                {[['Name', driver?.name], ['Email', driver?.email], ['NIC', driver?.nic], ['License', driver?.license], ['Vehicle', driver?.vehicle], ['SOBA Status', 'Face Registered']].map(([k, v]) => (
                  <div key={k} className="flex-between" style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>{k}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-bright)' }}>{v}</span>
                  </div>
                ))}
                <button className="btn btn-primary btn-lg" style={{ marginTop: 20 }} onClick={() => { setStep(0); setForm({ name: '', nic: '', license: '', email: '', phone: '', vehicle: 'Three-Wheeler' }); setDriver(null); setSobaUrl(null); }}>
                  + Enroll Another Driver
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
