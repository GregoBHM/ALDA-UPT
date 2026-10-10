import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Home from './pages/Home';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        reverseOrder={false}
        toastOptions={{
          style: { borderRadius: '12px', fontSize: '13px', fontWeight: '500' },
          success: { iconTheme: { primary: '#3b82f6', secondary: '#fff' } },
        }}
      />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="*" element={<Auth />} />
      </Routes>
    </BrowserRouter>
  );
}
