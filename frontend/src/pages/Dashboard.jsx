import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([api.stats(), api.getSessions()])
      .then(([s, sess]) => {
        setStats(s.stats);
        setSessions(sess.sessions.filter(s => s.active).slice(0, 5));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <div className="spinner" style={{ width: 32, height: 32, borderColor: 'var(--border)', borderTopColor: 'var(--green)' }} />
    </div>
  );

  return (
    <div className="page-enter">
      <div className="page-header">
        <div className="flex-between">
          <div>
            <h2 className="page-title">Dashboard</h2>
            <p className="page-subtitle">Real-time overview of verified driver sessions</p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn-outline" onClick={() => navigate('/enroll')}>+ Enroll Driver</button>
            <button className="btn btn-primary" onClick={() => navigate('/driver')}>Start Session</button>
          </div>
        </div>
      </div>

      <div className="page-body">
        {/* Stats */}
        <div className="stats-grid">
          {[
            { label: 'Total Drivers', value: stats?.totalDrivers ?? 0, sub: 'registered', icon: '🛺' },
            { label: 'Enrolled', value: stats?.enrolledDrivers ?? 0, sub: 'SOBA verified', icon: '✅', color: 'var(--green)' },
            { label: 'Active Sessions', value: stats?.activeSessions ?? 0, sub: 'online now', icon: '🟢', color: 'var(--green)' },
            { label: 'Total Sessions', value: stats?.totalSessions ?? 0, sub: 'all time', icon: '📋' },
            { label: 'Flagged', value: stats?.flaggedSessions ?? 0, sub: 'identity mismatch', icon: '🚨', color: stats?.flaggedSessions > 0 ? 'var(--red)' : undefined },
            { label: 'Total Rides', value: stats?.totalRides ?? 0, sub: 'verified trips', icon: '🗺️' },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className="stat-label">{s.label}</div>
              <div className="stat-value" style={{ color: s.color || 'var(--text-bright)' }}>
                {s.value}
              </div>
              <div className="stat-sub">{s.icon} {s.sub}</div>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text-bright)', marginBottom: 20 }}>
            How TukVerify Works
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            {[
              { step: '01', title: 'Enroll', desc: 'Driver registers NIC + License. SOBA captures biometric face hash — stored only on the driver\'s device.', icon: '🪪', color: 'var(--blue)' },
              { step: '02', title: 'Verify Per Shift', desc: 'Before going online, SOBA does a 3-second liveness face scan. ZK proof confirms identity without storing any data.', icon: '🔐', color: 'var(--soba)' },
              { step: '03', title: 'Passenger Trust', desc: 'Passenger sees a Verified Driver badge with the exact timestamp of the session\'s face scan.', icon: '🛡️', color: 'var(--green)' },
              { step: '04', title: 'Full Accountability', desc: 'Every complaint is tied to a biometric session ID — not just an account. No account switching escape.', icon: '📌', color: 'var(--yellow)' },
            ].map(s => (
              <div key={s.step} style={{ background: 'var(--dark)', borderRadius: 'var(--radius)', padding: 20, border: '1px solid var(--border)' }}>
                <div style={{ fontFamily: 'Space Mono', fontSize: 11, color: s.color, marginBottom: 8, fontWeight: 700 }}>STEP {s.step}</div>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
                <div style={{ fontWeight: 800, color: 'var(--text-bright)', marginBottom: 6 }}>{s.title}</div>
                <div style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.6 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Active sessions */}
        <div className="card">
          <div className="flex-between" style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text-bright)' }}>Active Sessions</div>
            <button className="btn btn-outline" style={{ padding: '8px 16px', fontSize: 13 }} onClick={() => navigate('/admin')}>
              View All →
            </button>
          </div>
          {sessions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-dim)' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🛺</div>
              <div>No active sessions. <button className="btn btn-outline" style={{ padding: '6px 14px', fontSize: 13, marginLeft: 8 }} onClick={() => navigate('/driver')}>Start one →</button></div>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Driver</th>
                    <th>NIC</th>
                    <th>Status</th>
                    <th>Started</th>
                    <th>Rides</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map(s => (
                    <tr key={s.sessionId}>
                      <td style={{ fontWeight: 700, color: 'var(--text-bright)' }}>{s.driver?.name}</td>
                      <td><span className="mono" style={{ fontSize: 12 }}>{s.driverId}</span></td>
                      <td>
                        {s.flagged
                          ? <span className="badge badge-red">🚨 Flagged</span>
                          : <span className="badge badge-green"><span className="pulse-dot" style={{ width: 6, height: 6 }} /> Active</span>
                        }
                      </td>
                      <td style={{ fontSize: 13, color: 'var(--text-dim)' }}>
                        {new Date(s.startedAt).toLocaleTimeString()}
                      </td>
                      <td style={{ fontFamily: 'Space Mono', fontSize: 13 }}>{s.rides?.length ?? 0}</td>
                      <td>
                        <button
                          className="btn btn-outline"
                          style={{ padding: '6px 14px', fontSize: 12 }}
                          onClick={() => navigate(`/passenger/${s.sessionId}`)}
                        >
                          Passenger View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
