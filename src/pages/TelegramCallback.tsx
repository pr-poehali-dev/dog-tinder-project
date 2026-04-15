import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import UsernameSetup from '@/components/UsernameSetup';

const AUTH_API_URL = 'https://functions.poehali.dev/c89c74f6-84a8-46e5-af84-c6da33670f50';

export default function TelegramCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [needsUsername, setNeedsUsername] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    const phone = searchParams.get('phone');
    
    if (!token) {
      setError('Отсутствует токен авторизации');
      return;
    }

    // Обмен токена на JWT
    fetch(`${AUTH_API_URL}?action=callback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, phone })
    })
      .then(res => res.json())
      .then(data => {
        if (data.needs_username) {
          // Нужно установить username
          setNeedsUsername(true);
          setUserId(data.user_id);
        } else if (data.access_token) {
          // Сохраняем токены и данные пользователя
          localStorage.setItem('access_token', data.access_token);
          localStorage.setItem('refresh_token', data.refresh_token);
          localStorage.setItem('user', JSON.stringify(data.user));
          
          // Перенаправляем на главную
          navigate('/');
        } else {
          setError(data.error || 'Ошибка авторизации');
        }
      })
      .catch(() => {
        setError('Не удалось подключиться к серверу');
      });
  }, [searchParams, navigate]);

  const handleUsernameSuccess = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-pink-50 to-white p-4">
      <div className="w-full max-w-md">
        {error ? (
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">❌ Ошибка</h1>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => navigate('/')}>
              Вернуться на главную
            </Button>
          </div>
        ) : needsUsername && userId ? (
          <UsernameSetup
            userId={userId}
            authType="telegram"
            authUrl={AUTH_API_URL}
            onSuccess={handleUsernameSuccess}
          />
        ) : (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Выполняется вход...</p>
          </div>
        )}
      </div>
    </div>
  );
}