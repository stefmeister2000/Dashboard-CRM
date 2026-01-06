import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { BusinessProvider } from './contexts/BusinessContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import ClientsList from './pages/ClientsList';
import ClientProfile from './pages/ClientProfile';
import Settings from './pages/Settings';
import Contracts from './pages/Contracts';
import Invoices from './pages/Invoices';
import Businesses from './pages/Businesses';
import Layout from './components/Layout';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} />}
        />
        <Route
          path="/signup"
          element={user ? <Navigate to="/dashboard" /> : <Signup />}
        />
        <Route
          path="/"
          element={
            user ? (
              <BusinessProvider>
                <Layout user={user} onLogout={handleLogout} />
              </BusinessProvider>
            ) : (
              <Navigate to="/login" />
            )
          }
        >
          <Route index element={<Navigate to="/dashboard" />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="clients" element={<ClientsList />} />
          <Route path="clients/:id" element={<ClientProfile />} />
          <Route path="settings" element={<Settings />} />
          <Route path="contracts" element={<Contracts />} />
          <Route path="invoices" element={<Invoices />} />
          <Route path="businesses" element={<Businesses />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;

