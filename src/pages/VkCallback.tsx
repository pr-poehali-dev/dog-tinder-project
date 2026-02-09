import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVkAuth } from '@/components/extensions/vk-auth/useVkAuth';

const VK_AUTH_URL = 'https://functions.poehali.dev/f48f6142-3b7e-4c7c-aa97-6fdb255f102c';

export default function VkCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  
  const vkAuth = useVkAuth({
    apiUrls: {
      authUrl: `${VK_AUTH_URL}?action=auth-url`,
      callback: `${VK_AUTH_URL}?action=callback`,
      refresh: `${VK_AUTH_URL}?action=refresh`,
      logout: `${VK_AUTH_URL}?action=logout`,
    },
  });

  useEffect(() => {
    vkAuth.handleCallback().then((success) => {
      if (success) {
        window.location.href = '/feed';
      } else {
        setError('Ошибка авторизации через VK');
      }
    }).catch(() => {
      setError('Ошибка авторизации через VK');
    });
  }, []);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-pink-50 to-orange-50">
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center">
          <div className="text-red-500 text-5xl mb-4">❌</div>
          <h2 className="text-2xl font-bold mb-2">{error}</h2>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-6 py-2 bg-gradient-to-r from-pink-600 to-orange-600 text-white rounded-full font-semibold hover:shadow-lg transition-all"
          >
            Вернуться на главную
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-pink-50 to-orange-50">
      <div className="bg-white p-8 rounded-2xl shadow-lg text-center">
        <div className="animate-spin text-5xl mb-4">🐾</div>
        <h2 className="text-2xl font-bold mb-2">Авторизация через VK...</h2>
        <p className="text-gray-600">Подождите, идет проверка данных</p>
      </div>
    </div>
  );
}
