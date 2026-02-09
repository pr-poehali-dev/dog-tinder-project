import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import AuthModal from '@/components/AuthModal';
import LiveActivityFeed from '@/components/LiveActivityFeed';

const PETS_API_URL = 'https://functions.poehali.dev/c7b05c84-a7a2-404e-a1f0-a80c56816d60';

export default function WelcomePage() {
  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      const accessToken = localStorage.getItem('access_token');
      
      if (!accessToken) {
        setChecking(false);
        return;
      }

      try {
        // Проверяем, есть ли у пользователя питомец
        const response = await fetch(`${PETS_API_URL}?action=my-pets`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });

        const data = await response.json();

        if (data.pets && data.pets.length > 0) {
          // Есть питомец - направляем в ленту
          navigate('/feed', { replace: true });
        } else {
          // Питомца нет - направляем на создание профиля
          navigate('/profile/create-pet', { replace: true });
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        setChecking(false);
      }
    };

    checkAuthAndRedirect();
  }, [navigate]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-orange-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  const features = [
    {
      icon: 'Heart',
      title: 'Найди пару',
      description: 'Свайпай карточки питомцев и находи идеальную пару для вязки',
      color: 'from-pink-500 to-rose-500'
    },
    {
      icon: 'MessageCircle',
      title: 'Общайся',
      description: 'Переписывайся с владельцами после взаимной симпатии',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: 'Shield',
      title: 'Безопасность',
      description: 'Проверенные профили с паспортами и документами',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: 'Award',
      title: 'Родословные',
      description: 'Питомцы с титулами и наградами для породистого потомства',
      color: 'from-purple-500 to-violet-500'
    }
  ];

  const stats = [
    { value: '1000+', label: 'Питомцев' },
    { value: '500+', label: 'Пар' },
    { value: '50+', label: 'Городов' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-orange-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="text-3xl">🐾</div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-orange-600 bg-clip-text text-transparent">
                TinDog
              </h1>
            </div>
            <button
              onClick={() => setShowAuthModal(true)}
              className="px-6 py-2 bg-gradient-to-r from-pink-600 to-orange-600 text-white rounded-full font-semibold hover:shadow-lg transition-all duration-300 hover:scale-105"
            >
              Войти
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 md:py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-4xl md:text-6xl font-bold leading-tight">
              Найди идеальную пару для своего
              <span className="bg-gradient-to-r from-pink-600 to-orange-600 bg-clip-text text-transparent"> питомца</span>
            </h2>
            <p className="text-xl text-gray-600">
              Первый в России сервис знакомств для породистых собак. Свайпы, чаты, проверенные профили.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => setShowAuthModal(true)}
                className="px-8 py-4 bg-gradient-to-r from-pink-600 to-orange-600 text-white rounded-full font-bold text-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
              >
                Начать знакомства
                <Icon name="ArrowRight" size={20} />
              </button>
              <button
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-4 border-2 border-pink-600 text-pink-600 rounded-full font-bold text-lg hover:bg-pink-50 transition-all duration-300"
              >
                Узнать больше
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-orange-600 bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="bg-white rounded-2xl shadow-2xl p-6 transform hover:scale-105 transition-transform duration-300">
              <div className="aspect-[3/4] bg-gradient-to-br from-pink-100 to-orange-100 rounded-xl flex items-center justify-center overflow-hidden">
                <div className="text-center space-y-4">
                  <div className="text-8xl">🐕</div>
                  <div className="text-2xl font-bold text-gray-700">Лабрадор Макс</div>
                  <div className="text-gray-600">3 года • Москва</div>
                  <div className="flex gap-2 justify-center pt-4">
                    <button className="p-4 bg-white rounded-full shadow-lg hover:scale-110 transition-transform">
                      <Icon name="X" size={24} className="text-gray-400" />
                    </button>
                    <button className="p-4 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full shadow-lg hover:scale-110 transition-transform">
                      <Icon name="Heart" size={24} className="text-white" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Floating cards */}
            <div className="hidden lg:block absolute -top-6 -left-6 bg-white rounded-xl shadow-xl p-4 transform rotate-[-5deg] animate-float">
              <div className="flex items-center gap-2">
                <Icon name="Heart" size={16} className="text-pink-600" />
                <span className="text-sm font-semibold">Новая пара!</span>
              </div>
            </div>
            <div className="hidden lg:block absolute -bottom-6 -right-6 bg-white rounded-xl shadow-xl p-4 transform rotate-[5deg] animate-float-delayed">
              <div className="flex items-center gap-2">
                <Icon name="MessageCircle" size={16} className="text-blue-600" />
                <span className="text-sm font-semibold">+5 сообщений</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16 bg-white/50">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Почему выбирают <span className="bg-gradient-to-r from-pink-600 to-orange-600 bg-clip-text text-transparent">TinDog</span>
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
              >
                <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${feature.color} flex items-center justify-center mb-4`}>
                  <Icon name={feature.icon} size={32} className="text-white" />
                </div>
                <h4 className="text-xl font-bold mb-2">{feature.title}</h4>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Live Activity */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Что происходит <span className="bg-gradient-to-r from-pink-600 to-orange-600 bg-clip-text text-transparent">прямо сейчас</span>
          </h3>
          <div className="max-w-2xl mx-auto">
            <LiveActivityFeed />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-pink-600 to-orange-600">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Готов найти пару для своего питомца?
          </h3>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Присоединяйся к сообществу ответственных владельцев породистых собак
          </p>
          <button
            onClick={() => setShowAuthModal(true)}
            className="px-12 py-5 bg-white text-pink-600 rounded-full font-bold text-xl hover:shadow-2xl transition-all duration-300 hover:scale-110"
          >
            Зарегистрироваться бесплатно
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-600 mb-2">© 2026 TinDog - Больше, чем просто знакомство 🐾</p>
          <a 
            href="/oferta" 
            className="text-sm text-gray-500 hover:text-pink-600 transition-colors underline"
          >
            Публичная оферта
          </a>
        </div>
      </footer>

      <AuthModal 
        open={showAuthModal}
        onOpenChange={setShowAuthModal}
        onSuccess={() => {
          setShowAuthModal(false);
          window.location.href = '/feed';
        }}
      />

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(-5deg); }
          50% { transform: translateY(-10px) rotate(-5deg); }
        }
        
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px) rotate(5deg); }
          50% { transform: translateY(-10px) rotate(5deg); }
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animate-float-delayed {
          animation: float-delayed 3s ease-in-out infinite 1.5s;
        }
      `}</style>
    </div>
  );
}