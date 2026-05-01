import { useLocation, useNavigate } from 'react-router-dom';

const links = [
  { path: '/', icon: '📊', label: 'Dashboard' },
  { path: '/enroll', icon: '🪪', label: 'Enroll Driver' },
  { path: '/driver', icon: '🛺', label: 'Driver Session' },
  { path: '/admin', icon: '🔎', label: 'Admin View' },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h1>TukVerify</h1>
        <div className="powered">Powered by SOBA</div>
      </div>
      <nav className="sidebar-nav">
        {links.map(l => (
          <button
            key={l.path}
            className={`nav-link ${location.pathname === l.path ? 'active' : ''}`}
            onClick={() => navigate(l.path)}
          >
            <span className="nav-icon">{l.icon}</span>
            <span>{l.label}</span>
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ padding: '12px', borderTop: '1px solid var(--border)', marginTop: '16px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'Space Mono', lineHeight: 1.6 }}>
            <div style={{ color: 'var(--soba)', fontWeight: 700 }}>SOBA Network</div>
            <div>Zero-Knowledge</div>
            <div>Biometric Auth</div>
          </div>
        </div>
      </nav>
    </aside>
  );
}
