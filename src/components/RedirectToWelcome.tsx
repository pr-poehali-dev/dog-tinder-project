import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function RedirectToWelcome() {
  const navigate = useNavigate();

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    if (!isAuthenticated || isAuthenticated !== 'true') {
      navigate('/welcome', { replace: true });
    }
  }, [navigate]);

  return null;
}
