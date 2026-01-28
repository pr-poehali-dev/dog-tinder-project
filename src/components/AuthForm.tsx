import { useState } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

const AUTH_API_URL = 'https://functions.poehali.dev/1a398d28-e1ae-4c80-9ea4-195ae0eafaf2';
const TELEGRAM_AUTH_URL = 'https://functions.poehali.dev/c89c74f6-84a8-46e5-af84-c6da33670f50?action=auth';
const YANDEX_AUTH_URL = 'https://functions.poehali.dev/39b02f75-9132-4979-a6d8-3685a9ba28f6?action=auth';

interface AuthFormProps {
  onSuccess: (user: any, token: string) => void;
  onClose: () => void;
}

export default function AuthForm({ onSuccess, onClose }: AuthFormProps) {
  const [step, setStep] = useState<'choice' | 'email'>('choice');
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(AUTH_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: isLogin ? 'login' : 'register',
          email: formData.email,
          password: formData.password,
          name: isLogin ? undefined : formData.name,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Произошла ошибка');
      }

      localStorage.setItem('authToken', data.token);
      localStorage.setItem('userId', data.user.id.toString());
      localStorage.setItem('userEmail', data.user.email);
      if (data.user.name) {
        localStorage.setItem('userName', data.user.name);
      }

      onSuccess(data.user, data.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    } finally {
      setIsLoading(false);
    }
  };

  // Шаг 1: Выбор входа или регистрации
  if (step === 'choice') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              Добро пожаловать
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <Icon name="X" size={24} />
            </button>
          </div>

          <div className="space-y-4">
            <p className="text-gray-600 text-center mb-6">
              Выберите способ {isLogin ? 'входа' : 'регистрации'}
            </p>

            {/* Email */}
            <button
              onClick={() => setStep('email')}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 border-2 border-gray-200 rounded-xl hover:border-pink-400 hover:bg-pink-50 transition-all"
            >
              <Icon name="Mail" size={24} className="text-pink-600" />
              <span className="font-medium text-gray-800">Email и пароль</span>
            </button>

            {/* Telegram */}
            <a
              href={TELEGRAM_AUTH_URL}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 border-2 border-gray-200 rounded-xl hover:border-[#0088cc] hover:bg-blue-50 transition-all"
            >
              <Icon name="Send" size={24} className="text-[#0088cc]" />
              <span className="font-medium text-gray-800">Telegram</span>
            </a>

            {/* Яндекс */}
            <a
              href={YANDEX_AUTH_URL}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 border-2 border-gray-200 rounded-xl hover:border-red-400 hover:bg-red-50 transition-all"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 22C6.486 22 2 17.514 2 12S6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z" fill="#FC3F1D"/>
                <path d="M12 5.5C8.41 5.5 5.5 8.41 5.5 12S8.41 18.5 12 18.5 18.5 15.59 18.5 12 15.59 5.5 12 5.5zm0 11c-2.481 0-4.5-2.019-4.5-4.5S9.519 7.5 12 7.5s4.5 2.019 4.5 4.5-2.019 4.5-4.5 4.5z" fill="#FC3F1D"/>
              </svg>
              <span className="font-medium text-gray-800">Яндекс ID</span>
            </a>
          </div>

          <div className="text-center mt-6">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="text-pink-600 hover:text-pink-700 font-medium"
            >
              {isLogin ? 'Нет аккаунта? Зарегистрируйтесь' : 'Уже есть аккаунт? Войдите'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Шаг 2: Форма email/пароль
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setStep('choice')}
            className="text-gray-500 hover:text-gray-700"
          >
            <Icon name="ArrowLeft" size={24} />
          </button>
          <h2 className="text-2xl font-bold text-gray-800">
            {isLogin ? 'Вход' : 'Регистрация'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <Icon name="X" size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 font-medium mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400"
              required
              placeholder="your@email.com"
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-gray-700 font-medium mb-2">Имя</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400"
                placeholder="Ваше имя"
              />
            </div>
          )}

          <div>
            <label className="block text-gray-700 font-medium mb-2">Пароль</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400"
              required
              minLength={6}
              placeholder="Минимум 6 символов"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold py-3 rounded-lg hover:from-pink-600 hover:to-purple-600 disabled:opacity-50"
          >
            {isLoading ? 'Загрузка...' : (isLogin ? 'Войти' : 'Зарегистрироваться')}
          </Button>

          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="text-pink-600 hover:text-pink-700 font-medium"
            >
              {isLogin ? 'Нет аккаунта? Зарегистрируйтесь' : 'Уже есть аккаунт? Войдите'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
