import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const AUTH_API_URL = 'https://functions.poehali.dev/c89c74f6-84a8-46e5-af84-c6da33670f50';

export default function TelegramCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setError('Отсутствует токен авторизации');
      return;
    }

    // Обмен токена на JWT
    fetch(`${AUTH_API_URL}?action=callback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    })
      .then(res => res.json())
      .then(data => {
        if (data.access_token) {
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-pink-50 to-white">
      <div className="text-center">
        {error ? (
          <div>
            <h1 className="text-2xl font-bold text-red-600 mb-4">❌ Ошибка</h1>
            <p className="text-gray-600">{error}</p>
            <button 
              onClick={() => navigate('/')}
              className="mt-4 px-6 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600"
            >
              Вернуться на главную
            </button>
          </div>
        ) : (
          <div>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Выполняется вход...</p>
          </div>
        )}
      </div>
    </div>
  );
}
