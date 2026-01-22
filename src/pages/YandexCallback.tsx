import { useEffect } from 'react';
import { useYandexAuth } from '@/components/extensions/yandex-auth/useYandexAuth';
import Icon from '@/components/ui/icon';

const YANDEX_AUTH_URL = 'https://functions.poehali.dev/39b02f75-9132-4979-a6d8-3685a9ba28f6';

export default function YandexCallback() {
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

    if (code && yandexAuth.handleCallback) {
      yandexAuth.handleCallback(params).then((success) => {
        if (success) {
          window.location.href = '/profile';
        }
      });
    }
  }, [yandexAuth]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex items-center justify-center">
      <div className="text-center">
        <Icon name="Loader2" size={48} className="animate-spin text-pink-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-800">Авторизация...</h2>
        <p className="text-gray-600 mt-2">Подождите, идет проверка данных</p>
      </div>
    </div>
  );
}