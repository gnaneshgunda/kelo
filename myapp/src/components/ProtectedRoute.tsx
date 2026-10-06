import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { api } from '../services/api';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function verify() {
      const isAuth = await api.checkAuth();
      if (isMounted) {
        setIsAuthenticated(isAuth);
      }
    }

    verify();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isAuthenticated === null) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <p style={{ color: '#64748b', fontSize: '1rem' }}>Verifying administrator session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}
