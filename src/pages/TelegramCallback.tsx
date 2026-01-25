import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const AUTH_API_URL = 'https://functions.poehali.dev/c89c74f6-84a8-46e5-af84-c6da33670f50';

export default function TelegramCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [needsUsername, setNeedsUsername] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUsernameError('');
    setIsSubmitting(true);

    // Валидация
    if (username.length < 3) {
      setUsernameError('Username должен быть минимум 3 символа');
      setIsSubmitting(false);
      return;
    }

    if (username.length > 30) {
      setUsernameError('Username должен быть максимум 30 символов');
      setIsSubmitting(false);
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setUsernameError('Username может содержать только буквы, цифры и _');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`${AUTH_API_URL}?action=set_username`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, username })
      });

      const data = await response.json();

      if (data.access_token) {
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('refresh_token', data.refresh_token);
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/');
      } else {
        setUsernameError(data.error || 'Ошибка при установке username');
      }
    } catch {
      setUsernameError('Не удалось подключиться к серверу');
    } finally {
      setIsSubmitting(false);
    }
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
        ) : needsUsername ? (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">
              Придумайте username
            </h1>
            <p className="text-gray-600 mb-6 text-center">
              Это ваш уникальный идентификатор в приложении
            </p>
            <form onSubmit={handleUsernameSubmit} className="space-y-4">
              <div>
                <Input
                  type="text"
                  placeholder="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  disabled={isSubmitting}
                  className="text-center text-lg"
                  autoFocus
                />
                {usernameError && (
                  <p className="text-red-500 text-sm mt-2">{usernameError}</p>
                )}
                <p className="text-gray-500 text-xs mt-2">
                  3-30 символов, только буквы, цифры и _
                </p>
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting || !username}
              >
                {isSubmitting ? 'Сохранение...' : 'Продолжить'}
              </Button>
            </form>
          </div>
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