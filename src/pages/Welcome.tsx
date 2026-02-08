import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';

export default function Welcome() {
  const navigate = useNavigate();

  useEffect(() => {
    const onboardingComplete = localStorage.getItem('onboardingComplete');
    if (onboardingComplete === 'true') {
      navigate('/');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-orange-50 p-6 flex flex-col items-center justify-between">
      <div className="flex-1 flex flex-col items-center justify-center max-w-md w-full text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-pink-600 to-orange-600 bg-clip-text text-transparent">
            TinDog
          </h1>
          <h2 className="text-3xl font-bold text-gray-900">
            Твои новые знакомства
          </h2>
        </div>

        <div className="space-y-4 w-full">
          <Button
            onClick={() => navigate('/onboarding')}
            className="w-full h-14 text-lg bg-gradient-to-r from-pink-600 to-orange-600 hover:from-pink-700 hover:to-orange-700 rounded-full"
          >
            Создать профиль
          </Button>

          <Button
            onClick={() => navigate('/')}
            variant="outline"
            className="w-full h-14 text-lg rounded-full"
          >
            Войти
          </Button>
        </div>

        <div className="pt-8">
          <img 
            src="https://cdn.poehali.dev/projects/d74a4f5a-6886-4dec-8dc8-f01016c0890c/bucket/539a5e2a-b363-40d9-be05-015ae09241fa.png"
            alt="Welcome illustration"
            className="w-64 mx-auto"
          />
        </div>
      </div>

      <div className="text-center space-y-2 text-sm text-gray-500 pb-4">
        <p>Продолжая, ты принимаешь условия</p>
        <div className="flex gap-2 justify-center">
          <a href="/oferta" className="text-blue-600 hover:underline">
            Соглашения
          </a>
          <span>и</span>
          <a href="/oferta" className="text-blue-600 hover:underline">
            Конфиденциальности
          </a>
        </div>
        <p className="pt-2">
          На информационном ресурсе применяются рекомендательные технологии
        </p>
        <a href="/oferta" className="text-blue-600 hover:underline block">
          Служба поддержки
        </a>
      </div>
    </div>
  );
}
