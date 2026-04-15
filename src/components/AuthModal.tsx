import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EmailAuth from '@/components/EmailAuth';
import { useYandexAuth } from '@/components/extensions/yandex-auth/useYandexAuth';
import { useVkAuth } from '@/components/extensions/vk-auth/useVkAuth';
import { useTelegramAuth } from '@/components/extensions/telegram-bot/useTelegramAuth';
import YandexLoginButton from '@/components/extensions/yandex-auth/YandexLoginButton';
import VkLoginButton from '@/components/extensions/vk-auth/VkLoginButton';
import TelegramLoginButton from '@/components/extensions/telegram-bot/TelegramLoginButton';
import LiveActivityFeed from '@/components/LiveActivityFeed';

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const YANDEX_AUTH_URL = 'https://functions.poehali.dev/39b02f75-9132-4979-a6d8-3685a9ba28f6';
const VK_AUTH_URL = 'https://functions.poehali.dev/3a8e0b3c-7fe6-48be-bb95-6bf5ee0bba15';
const TELEGRAM_AUTH_URL = 'https://functions.poehali.dev/3b5c7e68-2890-4ae2-bc77-35b0b86a40c3';

export default function AuthModal({ open, onOpenChange, onSuccess }: AuthModalProps) {
  const yandexAuth = useYandexAuth({
    apiUrls: {
      authUrl: `${YANDEX_AUTH_URL}?action=auth-url`,
      callback: `${YANDEX_AUTH_URL}?action=callback`,
      refresh: `${YANDEX_AUTH_URL}?action=refresh`,
      logout: `${YANDEX_AUTH_URL}?action=logout`,
    },
  });

  const vkAuth = useVkAuth({
    apiUrls: {
      authUrl: `${VK_AUTH_URL}?action=auth-url`,
      callback: `${VK_AUTH_URL}?action=callback`,
      refresh: `${VK_AUTH_URL}?action=refresh`,
      logout: `${VK_AUTH_URL}?action=logout`,
    },
  });

  const telegramAuth = useTelegramAuth({
    botUsername: 'TinDogAuthBot',
    apiUrls: {
      verifyAuth: `${TELEGRAM_AUTH_URL}?action=verify`,
      createUser: `${TELEGRAM_AUTH_URL}?action=create-user`,
      logout: `${TELEGRAM_AUTH_URL}?action=logout`,
    },
  });

  const handleAuthSuccess = (email?: string) => {
    onOpenChange(false);
    if (onSuccess) {
      onSuccess();
    } else {
      window.location.reload();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold bg-gradient-to-r from-pink-600 to-orange-600 bg-clip-text text-transparent">
            Вход в TinDog
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Форма авторизации */}
          <div>
            <Tabs defaultValue="social" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="social">Соцсети</TabsTrigger>
                <TabsTrigger value="email">Email</TabsTrigger>
              </TabsList>
              
              <TabsContent value="social" className="space-y-4 mt-4">
                <div className="space-y-3">
                  <YandexLoginButton 
                    onClick={() => yandexAuth.login()}
                    isLoading={yandexAuth.isLoading}
                    className="w-full"
                  />
                  
                  <VkLoginButton 
                    onClick={() => vkAuth.login()}
                    isLoading={vkAuth.isLoading}
                    className="w-full"
                  />
                  
                  <TelegramLoginButton 
                    onClick={() => telegramAuth.login()}
                    isLoading={telegramAuth.isLoading}
                    className="w-full"
                  />
                </div>
                
                <p className="text-sm text-gray-500 text-center mt-4">
                  Войдите через любую соцсеть для быстрого доступа
                </p>
              </TabsContent>
              
              <TabsContent value="email" className="mt-4">
                <EmailAuth onSuccess={handleAuthSuccess} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Живая лента активности */}
          <div className="hidden md:block">
            <LiveActivityFeed />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}