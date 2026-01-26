import { useEffect, useState } from 'react';
import { useYandexAuth } from '@/components/extensions/yandex-auth/useYandexAuth';
import Icon from '@/components/ui/icon';
import UsernameSetup from '@/components/UsernameSetup';

const YANDEX_AUTH_URL = 'https://functions.poehali.dev/39b02f75-9132-4979-a6d8-3685a9ba28f6';

export default function YandexCallback() {
  const [needsUsername, setNeedsUsername] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const yandexAuth = useYandexAuth({
    apiUrls: {
      authUrl: `${YANDEX_AUTH_URL}?action=auth-url`,
      callback: `${YANDEX_AUTH_URL}?action=callback`,
      refresh: `${YANDEX_AUTH_URL}?action=refresh`,
      logout: `${YANDEX_AUTH_URL}?action=logout`,
    },
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    if (code) {
      handleCallback(code);
    }
  }, []);

  const handleCallback = async (code: string) => {
    try {
      const response = await fetch(`${YANDEX_AUTH_URL}?action=callback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (data.needs_username) {
        setNeedsUsername(true);
        setUserId(data.user_id);
        setIsLoading(false);
      } else if (data.access_token && data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
        window.location.href = '/profile';
      }
    } catch (error) {
      console.error('Callback error:', error);
      setIsLoading(false);
    }
  };

  const handleUsernameSuccess = () => {
    window.location.href = '/profile';
  };

  if (needsUsername && userId) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex items-center justify-center p-4">
        <UsernameSetup
          userId={userId}
          authType="yandex"
          authUrl={YANDEX_AUTH_URL}
          onSuccess={handleUsernameSuccess}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex items-center justify-center">
      <div className="text-center">
        <Icon name="Loader2" size={48} className="animate-spin text-pink-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-800">
          {isLoading ? 'Авторизация...' : 'Ошибка авторизации'}
        </h2>
        <p className="text-gray-600 mt-2">
          {isLoading ? 'Подождите, идет проверка данных' : 'Попробуйте войти снова'}
        </p>
      </div>
    </div>
  );
}