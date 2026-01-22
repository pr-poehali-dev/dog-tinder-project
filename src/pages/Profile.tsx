import { useState, useEffect } from 'react';
import EmailAuth from '@/components/EmailAuth';
import YandexLoginButton from '@/components/extensions/yandex-auth/YandexLoginButton';
import { useYandexAuth } from '@/components/extensions/yandex-auth/useYandexAuth';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

const YANDEX_AUTH_URL = 'https://functions.poehali.dev/39b02f75-9132-4979-a6d8-3685a9ba28f6';

interface User {
  id: number;
  email: string;
  name?: string;
  phone?: string;
  city?: string;
  about?: string;
  avatar_url?: string;
  created_at?: string;
}

export default function Profile() {
  const [user, setUser] = useState<User | null>(null);

  const yandexAuth = useYandexAuth({
    apiUrls: {
      authUrl: `${YANDEX_AUTH_URL}?action=auth-url`,
      callback: `${YANDEX_AUTH_URL}?action=callback`,
      refresh: `${YANDEX_AUTH_URL}?action=refresh`,
      logout: `${YANDEX_AUTH_URL}?action=logout`,
    },
  });

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  useEffect(() => {
    if (yandexAuth.isAuthenticated && yandexAuth.user) {
      localStorage.setItem('user', JSON.stringify(yandexAuth.user));
      setUser(yandexAuth.user as User);
    }
  }, [yandexAuth.isAuthenticated, yandexAuth.user]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    yandexAuth.logout();
    setUser(null);
  };

  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-pink-100 rounded-full mb-4">
                <Icon name="User" size={40} className="text-pink-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Личный кабинет</h1>
              <p className="text-gray-600">{user.email}</p>
            </div>

            <div className="space-y-4">
              <div className="bg-pink-50 rounded-lg p-6">
                <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <Icon name="CheckCircle" size={20} className="text-green-600" />
                  Авторизация успешна
                </h3>
                <p className="text-gray-600 text-sm">
                  Вы успешно вошли в систему TinDog
                </p>
              </div>

              <Button
                variant="outline"
                onClick={handleLogout}
                className="w-full"
              >
                <Icon name="LogOut" size={20} />
                Выйти
              </Button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Button
              variant="ghost"
              onClick={() => window.location.href = '/'}
              className="gap-2"
            >
              <Icon name="ArrowLeft" size={20} />
              На главную
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white py-12">
      <div className="container mx-auto px-4 max-w-md">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => window.location.href = '/'}
            className="gap-2"
          >
            <Icon name="ArrowLeft" size={20} />
            На главную
          </Button>
        </div>

        <div className="space-y-4">
          <EmailAuth onSuccess={() => {
            const savedUser = localStorage.getItem('user');
            if (savedUser) {
              setUser(JSON.parse(savedUser));
            }
          }} />

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">или</span>
            </div>
          </div>

          <YandexLoginButton
            onClick={yandexAuth.login}
            isLoading={yandexAuth.isLoading}
          />
        </div>
      </div>
    </div>
  );
}