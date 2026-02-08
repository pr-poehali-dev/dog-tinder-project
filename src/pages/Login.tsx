import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

export default function Login() {
  const navigate = useNavigate();

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
    handleLogin();
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