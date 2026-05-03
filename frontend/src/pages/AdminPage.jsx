import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
export default function AdminPage() {
  const [sessions, setSessions] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('sessions');
  const [reVerifying, setReVerifying] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null); // { nic, name }
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  const load = () => {
    Promise.all([api.getSessions(), api.getDrivers(), api.stats()])
      .then(([s, d, st]) => {
        setSessions(s.sessions);
        setDrivers(d.drivers);
        setStats(st.stats);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  async function handleReVerify(sessionId) {
    setReVerifying(r => ({ ...r, [sessionId]: true }));
    await new Promise(r => setTimeout(r, 2000));
    try {
      await api.reVerify(sessionId);
      load();
    } catch (err) {
      console.error(err);
    } finally {
      setReVerifying(r => ({ ...r, [sessionId]: false }));
    }
  }

  async function handleEndSession(sessionId) {
    await api.endSession(sessionId);
    load();
  }

  // ── NEW: delete driver ──────────────────────────────────────
  async function handleDeleteDriver() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.deleteDriver(deleteTarget.nic);
      setDeleteTarget(null);
      load();
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  }
  // ────────────────────────────────────────────────────────────

  if (loading) return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <div className="spinner" style={{ width: 32, height: 32, borderColor: 'var(--border)', borderTopColor: 'var(--green)' }} />
    </div>
  );

  return (
    <div className="page-enter">

      {/* ── Delete confirmation modal ─────────────────────────── */}
      {deleteTarget && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="card" style={{ width: 360, padding: '28px 28px 24px' }}>
            <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--text-bright)', marginBottom: 8 }}>
              Delete driver?
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.6, marginBottom: 24 }}>
              <strong style={{ color: 'var(--text-bright)' }}>{deleteTarget.name}</strong>{' '}
              ({deleteTarget.nic}) will be permanently removed from the platform.
              Any active sessions must be ended first. This cannot be undone.
            </p>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                className="btn btn-outline"
                style={{ padding: '8px 18px', fontSize: 13 }}
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                style={{ padding: '8px 18px', fontSize: 13 }}
                onClick={handleDeleteDriver}
                disabled={deleting}
              >
                {deleting
                  ? <span className="spinner" style={{ width: 12, height: 12 }} />
                  : 'Delete driver'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ──────────────────────────────────────────────────────── */}

      <div className="page-header">
        <div className="flex-between">
          <div>
            <h2 className="page-title">Admin Panel</h2>
            <p className="page-subtitle">Platform-level visibility into all driver sessions</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className="badge badge-green"><span className="pulse-dot" style={{ width: 6, height: 6 }} /> Live</span>
            <button className="btn btn-outline" style={{ padding: '8px 16px', fontSize: 13 }} onClick={load}>Refresh</button>
          </div>
        </div>
      </div>

      <div className="page-body">
        {/* Stats row */}
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
          {[
            { label: 'Active Now', value: stats?.activeSessions ?? 0, color: 'var(--green)' },
            { label: 'Enrolled', value: stats?.enrolledDrivers ?? 0, color: 'var(--text-bright)' },
            { label: 'All Sessions', value: stats?.totalSessions ?? 0, color: 'var(--text-bright)' },
            { label: 'Flagged', value: stats?.flaggedSessions ?? 0, color: stats?.flaggedSessions > 0 ? 'var(--red)' : 'var(--text-bright)' },
            { label: 'Total Rides', value: stats?.totalRides ?? 0, color: 'var(--text-bright)' },
            { label: 'Re-verifies', value: stats?.totalReVerifications ?? 0, color: 'var(--soba)' },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className="stat-label">{s.label}</div>
              <div className="stat-value" style={{ fontSize: 28, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="segmented-control" style={{ marginBottom: 20 }}>
          {[['sessions', 'Sessions'], ['drivers', 'Drivers']].map(([id, label]) => (
            <button
              type="button"
              key={id}
              className={tab === id ? 'segmented-control__active' : ''}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Sessions Table — unchanged */}
        {tab === 'sessions' && (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-bright)' }}>
                All Sessions — {sessions.length} total
              </div>
            </div>
            {sessions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-dim)', fontSize: 14 }}>
                No sessions yet.
                <button type="button" className="btn btn-outline" style={{ padding: '6px 14px', fontSize: 13, marginLeft: 8 }} onClick={() => navigate('/driver')}>
                  Start session
                </button>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Driver</th><th>NIC</th><th>Status</th><th>Started</th>
                      <th>Ended</th><th>Rides</th><th>Re-verifs</th><th>ZK Proof</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map(s => (
                      <tr key={s.sessionId}>
                        <td style={{ fontWeight: 700, color: 'var(--text-bright)' }}>{s.driver?.name ?? 'Unknown'}</td>
                        <td><span className="mono" style={{ fontSize: 12 }}>{s.driverId}</span></td>
                        <td>
                          {s.flagged
                            ? <span className="badge badge-red">Flagged</span>
                            : s.active
                              ? <span className="badge badge-green"><span className="pulse-dot" style={{ width: 6, height: 6 }} /> Active</span>
                              : <span className="badge" style={{ background: 'var(--muted)', color: 'var(--text-dim)' }}>Ended</span>
                          }
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--text-dim)', fontFamily: 'Space Mono' }}>{new Date(s.startedAt).toLocaleTimeString()}</td>
                        <td style={{ fontSize: 12, color: 'var(--text-dim)', fontFamily: 'Space Mono' }}>{s.endedAt ? new Date(s.endedAt).toLocaleTimeString() : '—'}</td>
                        <td style={{ fontFamily: 'Space Mono', textAlign: 'center' }}>{s.rides?.length ?? 0}</td>
                        <td style={{ fontFamily: 'Space Mono', textAlign: 'center' }}>{s.reVerifications?.length ?? 0}</td>
                        <td><span className="badge badge-soba" style={{ fontSize: 10 }}>{s.zkProof?.substring(0, 14)}...</span></td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn btn-outline" style={{ padding: '4px 10px', fontSize: 11 }} onClick={() => navigate(`/passenger/${s.sessionId}`)}>View</button>
                            {s.active && !s.flagged && (
                              <>
                                <button className="btn btn-soba" style={{ padding: '4px 10px', fontSize: 11 }} onClick={() => handleReVerify(s.sessionId)} disabled={reVerifying[s.sessionId]}>
                                  {reVerifying[s.sessionId] ? <span className="spinner" style={{ width: 10, height: 10 }} /> : 'Verify'}
                                </button>
                                <button className="btn btn-danger" style={{ padding: '4px 10px', fontSize: 11 }} onClick={() => handleEndSession(s.sessionId)}>End</button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Drivers Table — with Delete column added */}
        {tab === 'drivers' && (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text-bright)' }}>
                Registered Drivers — {drivers.length} total
              </div>
              <button className="btn btn-primary" style={{ padding: '8px 16px', fontSize: 13 }} onClick={() => navigate('/enroll')}>
                + Enroll Driver
              </button>
            </div>
            {drivers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-dim)', fontSize: 14 }}>
                No drivers enrolled yet.
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th><th>NIC</th><th>License</th><th>Vehicle</th>
                      <th>SOBA Status</th><th>Enrolled At</th><th>Rating</th>
                      <th>Actions</th> {/* ← new column */}
                    </tr>
                  </thead>
                  <tbody>
                    {drivers.map(d => (
                      <tr key={d.nic}>
                        <td style={{ fontWeight: 700, color: 'var(--text-bright)' }}>{d.name}</td>
                        <td><span className="mono" style={{ fontSize: 12 }}>{d.nic}</span></td>
                        <td><span className="mono" style={{ fontSize: 12 }}>{d.license}</span></td>
                        <td>{d.vehicle}</td>
                        <td>
                          {d.enrolled
                            ? <span className="badge badge-green">Enrolled</span>
                            : <span className="badge badge-yellow">Pending</span>
                          }
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                          {d.enrolledAt ? new Date(d.enrolledAt).toLocaleDateString() : '—'}
                        </td>
                        <td>★ {d.rating}</td>

                        {/* ── Delete button ── */}
                        <td>
                          <button
                            className="btn btn-danger"
                            style={{ padding: '4px 10px', fontSize: 11 }}
                            onClick={() => setDeleteTarget({ nic: d.nic, name: d.name })}
                          >
                            Delete
                          </button>
                        </td>
                        {/* ───────────────── */}

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        <div className="alert alert-info" style={{ marginTop: 24 }}>
          <strong>SOBA ZK Protocol Active:</strong> All biometric verifications use Zero Knowledge proofs. No raw face data is stored on this platform or any server. Every verification creates a cryptographic proof tied to a session ID — PDPA 2022 compliant.
        </div>
      </div>
    </div>
  );
}