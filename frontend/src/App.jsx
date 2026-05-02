import { Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import EnrollPage from './pages/EnrollPage';
import DriverPage from './pages/DriverPage';
import AdminPage from './pages/AdminPage';
import PassengerPage from './pages/PassengerPage';
import SobaCallbackPage from './pages/SobaCallbackPage';

const FULL_PAGE_ROUTES = ['/passenger', '/soba-callback'];

export default function App() {
  const location = useLocation();
  const isFullPage = FULL_PAGE_ROUTES.some(r => location.pathname.startsWith(r));

  if (isFullPage) {
    return (
      <Routes>
        <Route path="/passenger/:sessionId" element={<PassengerPage />} />
        <Route path="/soba-callback" element={<SobaCallbackPage />} />
      </Routes>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/enroll" element={<EnrollPage />} />
          <Route path="/driver" element={<DriverPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </main>
    </div>
  );
}
