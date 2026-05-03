import { useLocation, useNavigate } from 'react-router-dom';

const links = [
  { path: '/', label: 'Dashboard' },
  { path: '/enroll', label: 'Enroll Driver' },
  { path: '/driver', label: 'Driver Session' },
  { path: '/admin', label: 'Admin View' },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-lockup">
          <div className="brand-mark-wrap">
            <img
              className="brand-mark"
              src="/ricksaw.png"
              alt=""
              width={44}
              height={44}
              decoding="async"
            />
          </div>
          <div className="sidebar-logo-text">
            <h1>TukVerify</h1>
            <div className="powered">Powered by SOBA</div>
          </div>
        </div>
      </div>
      <nav className="sidebar-nav">
        {links.map(l => (
          <button
            key={l.path}
            type="button"
            className={`nav-link ${location.pathname === l.path ? 'active' : ''}`}
            onClick={() => navigate(l.path)}
          >
            <span className="nav-icon" aria-hidden />
            <span>{l.label}</span>
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ padding: '12px', borderTop: '1px solid var(--border)', marginTop: '16px' }}>
          <div className="sidebar-footer-meta">
            <div className="soba-footer-heading">SOBA Network</div>
            <div>Zero-knowledge</div>
            <div>Biometric auth</div>
          </div>
        </div>
      </nav>
    </aside>
  );
}
