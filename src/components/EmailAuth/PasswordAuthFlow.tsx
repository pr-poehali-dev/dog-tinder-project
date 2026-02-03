import { useState } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface PasswordAuthFlowProps {
  authUrl: string;
  onSuccess: (email: string) => void;
  onSwitchToCode: () => void;
  onForgotPassword: () => void;
}

export default function PasswordAuthFlow({ authUrl, onSuccess, onSwitchToCode, onForgotPassword }: PasswordAuthFlowProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const isLogin = !isRegistering;
      const response = await fetch(authUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: isLogin ? 'login' : 'register',
          email: email.trim().toLowerCase(),
          password: password,
          ...(isLogin ? {} : { username: username.trim() })
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка авторизации');
      }

      if (data.authenticated || data.success) {
        localStorage.setItem('user', JSON.stringify(data.user));
        onSuccess(email);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка авторизации');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent mb-2">
          {isRegistering ? 'Регистрация' : 'Вход в TinDog'}
        </h1>
        <p className="text-gray-600">
          {isRegistering ? 'Создай аккаунт с паролем' : 'Войди в свой аккаунт'}
        </p>
      </div>

      <form onSubmit={handlePasswordAuth} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            required
          />
        </div>

        {isRegistering && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              required
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Пароль
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            required
          />
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
            <Icon name="AlertCircle" size={16} />
            {error}
          </div>
        )}

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
        >
          {isLoading ? 'Загрузка...' : isRegistering ? 'Зарегистрироваться' : 'Войти'}
        </Button>

        <div className="space-y-2">
          <button
            type="button"
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError('');
              setPassword('');
              setUsername('');
            }}
            className="w-full text-sm text-gray-600 hover:text-pink-600"
          >
            {isRegistering ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
          </button>

          {!isRegistering && (
            <button
              type="button"
              onClick={onForgotPassword}
              className="w-full text-sm text-gray-600 hover:text-pink-600"
            >
              Забыли пароль?
            </button>
          )}

          <button
            type="button"
            onClick={onSwitchToCode}
            className="w-full text-sm text-pink-600 hover:text-pink-700"
          >
            Войти через код из письма
          </button>
        </div>
      </form>
    </div>
  );
}
