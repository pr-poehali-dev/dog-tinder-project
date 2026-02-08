import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function AuthChecker() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    const publicPaths = ['/', '/welcome', '/login', '/oferta', '/auth/yandex/callback', '/auth/telegram/callback'];
    
    if (!isAuthenticated && !publicPaths.includes(location.pathname)) {
      navigate('/', { replace: true });
    }
  }, [location.pathname, navigate]);

  return null;
}