import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

export default function Login() {
  const navigate = useNavigate();

  const handleGoogleLogin = () => {
    console.log('Google login');
  };

  const handleYandexLogin = () => {
    console.log('Yandex login');
  };

  const handleTelegramLogin = () => {
    console.log('Telegram login');
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
            onClick={handleGoogleLogin}
            className="w-full h-14 text-lg bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-200 rounded-full flex items-center justify-center gap-3"
          >
            <Icon name="Chrome" size={24} />
            Войти через Google
          </Button>

          <Button
            onClick={handleYandexLogin}
            className="w-full h-14 text-lg bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-200 rounded-full flex items-center justify-center gap-3"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" fill="currentColor"/>
            </svg>
            Войти через Яндекс
          </Button>

          <Button
            onClick={handleTelegramLogin}
            className="w-full h-14 text-lg bg-[#0088cc] hover:bg-[#006699] text-white rounded-full flex items-center justify-center gap-3"
          >
            <Icon name="Send" size={24} />
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
