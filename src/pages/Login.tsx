import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';

export default function Login() {
  const navigate = useNavigate();
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
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

        {showForgotPassword ? (
          <div className="space-y-6">
            {!resetSent ? (
              <>
                <p className="text-center text-gray-700">
                  Введите email, указанный при регистрации
                </p>
                <Input
                  type="email"
                  placeholder="Email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="h-14 text-lg rounded-full"
                />
                <Button
                  onClick={() => {
                    if (resetEmail) {
                      setResetSent(true);
                    }
                  }}
                  className="w-full h-14 text-lg bg-gradient-to-r from-pink-600 to-orange-600 hover:from-pink-700 hover:to-orange-700 rounded-full"
                >
                  Отправить ссылку
                </Button>
                <Button
                  onClick={() => {
                    setShowForgotPassword(false);
                    setShowEmailForm(true);
                  }}
                  variant="outline"
                  className="w-full h-14 text-lg rounded-full"
                >
                  Назад ко входу
                </Button>
              </>
            ) : (
              <>
                <div className="text-center space-y-4 py-8">
                  <Icon name="Mail" size={64} className="mx-auto text-pink-600" />
                  <h3 className="text-xl font-bold text-gray-900">
                    Письмо отправлено!
                  </h3>
                  <p className="text-gray-600">
                    Проверьте {resetEmail} и перейдите по ссылке для сброса пароля
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setShowForgotPassword(false);
                    setResetSent(false);
                    setResetEmail('');
                    setShowEmailForm(true);
                  }}
                  className="w-full h-14 text-lg bg-gradient-to-r from-pink-600 to-orange-600 hover:from-pink-700 hover:to-orange-700 rounded-full"
                >
                  Вернуться ко входу
                </Button>
              </>
            )}
          </div>
        ) : !showEmailForm ? (
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
                onClick={() => {
                  setShowForgotPassword(true);
                  setShowEmailForm(false);
                }}
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


    </div>
  );
}