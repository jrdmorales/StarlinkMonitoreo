import { Routes, Route, Navigate } from 'react-router-dom';
import Overview   from './pages/Overview';
import Obras      from './pages/Obras';
import ObraDetail from './pages/ObraDetail';
import Antenas    from './pages/Antenas';
import Consumo    from './pages/Consumo';
import Reportes   from './pages/Reportes';
import Ajustes    from './pages/Ajustes';
import Login      from './pages/Login';
import AlertsLog  from './pages/AlertsLog';
import FAQ        from './pages/FAQ';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/"           element={<Overview />} />
      <Route path="/obras"      element={<Obras />} />
      <Route path="/obras/:key" element={<ObraDetail />} />
      <Route path="/antenas"    element={<Antenas />} />
      <Route path="/consumo"    element={<Consumo />} />
      <Route path="/alerts"     element={<AlertsLog />} />
      <Route path="/reportes"   element={<Reportes />} />
      <Route path="/ajustes"    element={<Ajustes />} />
      <Route path="/faq"        element={<FAQ />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
