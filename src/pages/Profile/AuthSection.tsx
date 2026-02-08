import YandexLoginButton from '@/components/extensions/yandex-auth/YandexLoginButton';
import TelegramLoginButton from '@/components/extensions/telegram-bot/TelegramLoginButton';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface AuthSectionProps {
  yandexAuthUrl: string;
  telegramBotUsername: string;
  onYandexAuth: (code: string) => void;
  onTelegramAuth: (user: unknown) => void;
  onLogout: () => void;
  isAuthenticated?: boolean;
}

export default function AuthSection({
  yandexAuthUrl,
  telegramBotUsername,
  onYandexAuth,
  onTelegramAuth,
  onLogout,
  isAuthenticated,
}: AuthSectionProps) {
  if (isAuthenticated) {
    return (
      <div className="text-center">
        <Button
          onClick={onLogout}
          variant="outline"
          className="text-red-600 border-red-600 hover:bg-red-50"
        >
          <Icon name="LogOut" size={18} className="mr-2" />
          Выйти из аккаунта
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-orange-600 bg-clip-text text-transparent mb-2">
            TinDog
          </h1>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Профиль</h2>
          <p className="text-gray-600">Войдите, чтобы управлять питомцами</p>
        </div>

        <div className="space-y-4">
          <YandexLoginButton
            authUrl={yandexAuthUrl}
            onAuth={onYandexAuth}
          />

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">или</span>
            </div>
          </div>

          <TelegramLoginButton
            botUsername={telegramBotUsername}
            onAuth={onTelegramAuth}
          />
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Входя в систему, вы соглашаетесь с{' '}
          <a href="/oferta" className="text-pink-600 hover:underline">
            условиями использования
          </a>
        </p>
      </div>
    </div>
  );
}