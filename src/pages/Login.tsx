import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';

export default function Login() {
  const navigate = useNavigate();
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    localStorage.setItem('isAuthenticated', 'true');
    const onboardingComplete = localStorage.getItem('onboardingComplete');
    if (onboardingComplete === 'true') {
      navigate('/');
    } else {
      navigate('/onboarding');
    }
  };

  const handleEmailLogin = () => {
    setShowEmailForm(true);
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      handleLogin();
    }
  };

  const handleYandexLogin = () => {
    handleLogin();
  };

  const handleTelegramLogin = () => {
    handleLogin();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-orange-50 p-6 flex flex-col items-center justify-center">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-pink-600 to-orange-600 bg-clip-text text-transparent">
            TinDog
          </h1>
          <h2 className="text-2xl font-bold text-gray-900">
            Войти в аккаунт
          </h2>
        </div>

        {!showEmailForm ? (
          <div className="space-y-4">
            <Button
              onClick={handleEmailLogin}
              className="w-full h-14 text-lg bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-200 rounded-full flex items-center justify-center gap-3"
            >
              <Icon name="Mail" size={24} />
              Войти через Email
            </Button>

            <Button
              onClick={handleYandexLogin}
              className="w-full h-14 text-lg bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center gap-3"
            >
              <span className="text-2xl font-bold">Я</span>
              Войти через Яндекс
            </Button>

            <Button
              onClick={handleTelegramLogin}
              className="w-full h-14 text-lg bg-[#0088cc] hover:bg-[#006699] text-white rounded-full flex items-center justify-center gap-3"
            >
              <Icon name="MessageCircle" size={24} />
              Войти через Telegram
            </Button>
          </div>
        ) : (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-14 text-lg rounded-full"
                required
              />
              <Input
                type="password"
                placeholder="Пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-14 text-lg rounded-full"
                required
              />
            </div>
            <div className="text-center">
              <Button
                type="button"
                variant="link"
                className="text-pink-600 hover:text-pink-700"
                onClick={() => setShowForgotPassword(true)}
              >
                Забыли пароль?
              </Button>
            </div>
            <Button
              type="submit"
              className="w-full h-14 text-lg bg-gradient-to-r from-pink-600 to-orange-600 hover:from-pink-700 hover:to-orange-700 rounded-full"
            >
              Войти
            </Button>
            <Button
              type="button"
              onClick={() => setShowEmailForm(false)}
              variant="outline"
              className="w-full h-14 text-lg rounded-full"
            >
              Назад к выбору
            </Button>
          </form>
        )}

        <div className="text-center">
          <Button
            onClick={() => navigate('/welcome')}
            variant="ghost"
            className="text-gray-600"
          >
            Назад
          </Button>
        </div>
      </div>

      {showForgotPassword && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full space-y-6">
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-gray-900">
                Подтвердите действие<br />
                на странице tindog.ru
              </h3>
              <p className="text-gray-600">
                Функция восстановления пароля<br />
                скоро будет доступна
              </p>
            </div>
            <div className="space-y-3">
              <Button
                onClick={() => setShowForgotPassword(false)}
                className="w-full h-12 text-lg bg-blue-500 hover:bg-blue-600 text-white rounded-2xl"
              >
                OK
              </Button>
              <Button
                onClick={() => setShowForgotPassword(false)}
                variant="ghost"
                className="w-full h-12 text-lg text-blue-500 hover:text-blue-600"
              >
                Блокировать диалоговые окна
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}