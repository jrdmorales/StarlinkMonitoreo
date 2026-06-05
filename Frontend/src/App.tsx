import { Routes, Route, Navigate } from 'react-router-dom';
import Overview   from './pages/Overview';
import ObraDetail from './pages/ObraDetail';
import Login      from './pages/Login';
import Admin      from './pages/Admin';
import AlertsLog  from './pages/AlertsLog';
import FAQ        from './pages/FAQ';
import { token }  from './api/client';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return token.get() ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/"          element={<Overview />} />
      <Route path="/obras/:key" element={<ObraDetail />} />
      <Route path="/alerts" element={<AlertsLog />} />
      <Route path="/faq"    element={<FAQ />} />
      <Route path="/admin"  element={<ProtectedRoute><Admin /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
