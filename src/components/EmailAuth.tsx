import { useState } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

const AUTH_URL = 'https://functions.poehali.dev/1a7a39de-f267-44a5-aaf6-04b5c3610d87';

interface EmailAuthProps {
  onSuccess: (email: string) => void;
}

export default function EmailAuth({ onSuccess }: EmailAuthProps) {
  const [authMode, setAuthMode] = useState<'code' | 'password' | 'forgot'>('code');
  const [step, setStep] = useState<'email' | 'code' | 'username'>('email');
  const [forgotStep, setForgotStep] = useState<'email' | 'code' | 'password'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [forgotCode, setForgotCode] = useState('');
  const [username, setUsername] = useState('');
  const [suggestedUsername, setSuggestedUsername] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [verificationData, setVerificationData] = useState<{
    code: string;
    expires_at: number;
  } | null>(null);
  const [forgotVerificationData, setForgotVerificationData] = useState<{
    code: string;
    expires_at: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [error, setError] = useState('');

  const handlePasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const isLogin = !username;
      const response = await fetch(AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: isLogin ? 'login' : 'register',
          email: email.trim().toLowerCase(),
          password: code,
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

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_code',
          email: email.trim().toLowerCase(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка отправки кода');
      }

      setVerificationData({
        code: data.code,
        expires_at: data.expires_at,
      });
      
      const usernameResponse = await fetch(AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_username',
          email: email.trim().toLowerCase(),
        }),
      });
      const usernameData = await usernameResponse.json();
      if (usernameData.username) {
        setSuggestedUsername(usernameData.username);
        setUsername(usernameData.username);
      }
      
      setStep('code');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка отправки');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (code.length !== 6) {
      setError('Введите 6-значный код');
      return;
    }

    if (!verificationData) {
      setError('Нет данных для проверки');
      return;
    }

    if (code.trim() !== verificationData.code) {
      setError('Неверный код');
      return;
    }

    setStep('username');
  };

  const checkUsernameAvailability = async (value: string) => {
    if (value.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    setIsCheckingUsername(true);
    try {
      const response = await fetch(AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'check_username',
          username: value,
        }),
      });
      const data = await response.json();
      setUsernameAvailable(data.available);
    } catch (err) {
      setUsernameAvailable(null);
    } finally {
      setIsCheckingUsername(false);
    }
  };

  const handleUsernameChange = (value: string) => {
    setUsername(value);
    checkUsernameAvailability(value);
  };

  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!verificationData) {
      setError('Нет данных для проверки');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify_code',
          email: email.trim().toLowerCase(),
          code: code.trim(),
          expected_code: verificationData.code,
          expires_at: verificationData.expires_at,
          username: username.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка регистрации');
      }

      if (data.authenticated && data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
        onSuccess(email);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка регистрации');
    } finally {
      setIsLoading(false);
    }
  };

  if (authMode === 'forgot') {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <button
          onClick={() => setAuthMode('password')}
          className="flex items-center gap-2 text-gray-600 hover:text-pink-600 mb-6"
        >
          <Icon name="ArrowLeft" size={20} />
          Назад к входу
        </button>

        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Восстановление пароля
        </h2>
        <p className="text-gray-600 mb-6">
          {forgotStep === 'email' 
            ? 'Введите email для восстановления доступа' 
            : forgotStep === 'code'
            ? 'Введите код из письма'
            : 'Придумайте новый пароль'}
        </p>

        {forgotStep === 'email' && (
          <form onSubmit={async (e) => {
            e.preventDefault();
            setError('');
            setIsLoading(true);

            try {
              const response = await fetch(AUTH_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  action: 'send_code',
                  email: email.trim().toLowerCase(),
                }),
              });

              const data = await response.json();

              if (!response.ok) {
                throw new Error(data.error || 'Ошибка отправки кода');
              }

              setForgotVerificationData({
                code: data.code,
                expires_at: data.expires_at,
              });
              
              setForgotStep('code');
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Ошибка отправки');
            } finally {
              setIsLoading(false);
            }
          }} className="space-y-4">
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
              {isLoading ? 'Отправка...' : 'Отправить код'}
            </Button>
          </form>
        )}

        {forgotStep === 'code' && (
          <form onSubmit={(e) => {
            e.preventDefault();
            setError('');

            if (forgotCode.length !== 6) {
              setError('Введите 6-значный код');
              return;
            }

            if (!forgotVerificationData) {
              setError('Нет данных для проверки');
              return;
            }

            if (forgotCode.trim() !== forgotVerificationData.code) {
              setError('Неверный код');
              return;
            }

            setForgotStep('password');
          }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Код из письма
              </label>
              <input
                type="text"
                value={forgotCode}
                onChange={(e) => setForgotCode(e.target.value)}
                placeholder="123456"
                maxLength={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-center text-2xl tracking-widest font-bold"
                required
              />
              <p className="text-sm text-gray-500 mt-2">
                Код отправлен на {email}
              </p>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                <Icon name="AlertCircle" size={16} />
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
            >
              Подтвердить код
            </Button>

            <button
              type="button"
              onClick={() => {
                setForgotStep('email');
                setForgotCode('');
                setError('');
              }}
              className="w-full text-sm text-gray-600 hover:text-pink-600"
            >
              Отправить код повторно
            </button>
          </form>
        )}

        {forgotStep === 'password' && (
          <form onSubmit={async (e) => {
            e.preventDefault();
            setError('');
            setIsLoading(true);

            if (!forgotVerificationData) {
              setError('Нет данных для проверки');
              setIsLoading(false);
              return;
            }

            try {
              const response = await fetch(AUTH_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  action: 'reset_password',
                  email: email.trim().toLowerCase(),
                  code: forgotCode.trim(),
                  expected_code: forgotVerificationData.code,
                  expires_at: forgotVerificationData.expires_at,
                  password: (e.target as HTMLFormElement).newPassword.value,
                }),
              });

              const data = await response.json();

              if (!response.ok) {
                throw new Error(data.error || 'Ошибка сброса пароля');
              }

              if (data.success && data.user) {
                localStorage.setItem('user', JSON.stringify(data.user));
                onSuccess(email);
              }
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Ошибка сброса пароля');
            } finally {
              setIsLoading(false);
            }
          }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Новый пароль
              </label>
              <input
                type="password"
                name="newPassword"
                placeholder="Минимум 6 символов"
                minLength={6}
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
              {isLoading ? 'Сохранение...' : 'Сохранить пароль'}
            </Button>
          </form>
        )}
      </div>
    );
  }

  if (authMode === 'password') {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <button
          onClick={() => setAuthMode('code')}
          className="flex items-center gap-2 text-gray-600 hover:text-pink-600 mb-6"
        >
          <Icon name="ArrowLeft" size={20} />
          Вход через код
        </button>

        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          {username ? 'Регистрация' : 'Вход'}
        </h2>
        <p className="text-gray-600 mb-6">
          {username ? 'Создайте аккаунт с паролем' : 'Войдите по email и паролю'}
        </p>

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

          {username !== '' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
                minLength={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                required
              />
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Пароль
              </label>
              {username === '' && (
                <button
                  type="button"
                  onClick={() => setAuthMode('forgot')}
                  className="text-sm text-pink-600 hover:text-pink-700 font-medium"
                >
                  Забыли пароль?
                </button>
              )}
            </div>
            <input
              type="password"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="••••••••"
              minLength={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <Icon name="AlertCircle" size={18} />
              {error}
            </div>
          )}

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Icon name="Loader2" size={20} className="animate-spin" />
                Загрузка...
              </>
            ) : username !== '' ? (
              'Зарегистрироваться'
            ) : (
              'Войти'
            )}
          </Button>

          <button
            type="button"
            onClick={() => setUsername(username === '' ? ' ' : '')}
            className="w-full text-center text-sm text-pink-600 hover:underline"
          >
            {username === '' ? 'Нет аккаунта? Зарегистрируйтесь' : 'Уже есть аккаунт? Войдите'}
          </button>
        </form>
      </div>
    );
  }

  if (step === 'username') {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <button
          onClick={() => {
            setStep('code');
            setError('');
          }}
          className="flex items-center gap-2 text-gray-600 hover:text-pink-600 mb-6"
        >
          <Icon name="ArrowLeft" size={20} />
          Назад
        </button>

        <h2 className="text-2xl font-bold text-gray-800 mb-2">Выберите username</h2>
        <p className="text-gray-600 mb-6">
          Придумайте уникальный username или используйте предложенный
        </p>

        <form onSubmit={handleCompleteRegistration} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                placeholder="username"
                minLength={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                required
              />
              {isCheckingUsername && (
                <div className="absolute right-3 top-3">
                  <Icon name="Loader2" size={20} className="animate-spin text-gray-400" />
                </div>
              )}
            </div>
            {username.length >= 3 && usernameAvailable !== null && (
              <p className={`text-sm mt-2 ${usernameAvailable ? 'text-green-600' : 'text-red-600'}`}>
                {usernameAvailable ? '✓ Username свободен' : '✗ Username занят'}
              </p>
            )}
            {username.length < 3 && username.length > 0 && (
              <p className="text-sm mt-2 text-gray-500">Минимум 3 символа</p>
            )}
          </div>

          {suggestedUsername && username !== suggestedUsername && (
            <button
              type="button"
              onClick={() => {
                setUsername(suggestedUsername);
                setUsernameAvailable(true);
              }}
              className="text-sm text-pink-600 hover:text-pink-700 underline"
            >
              Использовать предложенный: {suggestedUsername}
            </button>
          )}

          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <Icon name="AlertCircle" size={18} />
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading || !username || username.length < 3 || usernameAvailable === false}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Icon name="Loader2" size={20} className="animate-spin" />
                Завершение...
              </>
            ) : (
              <>
                <Icon name="CheckCircle" size={20} />
                Завершить регистрацию
              </>
            )}
          </Button>
        </form>
      </div>
    );
  }

  if (step === 'code') {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <button
          onClick={() => {
            setStep('email');
            setCode('');
            setError('');
          }}
          className="flex items-center gap-2 text-gray-600 hover:text-pink-600 mb-6"
        >
          <Icon name="ArrowLeft" size={20} />
          Назад
        </button>

        <h2 className="text-2xl font-bold text-gray-800 mb-2">Проверка кода</h2>
        <p className="text-gray-600 mb-6">
          Мы отправили код на <strong>{email}</strong>
        </p>

        <form onSubmit={handleVerifyCode} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Код подтверждения
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              maxLength={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent text-center text-2xl tracking-widest"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <Icon name="AlertCircle" size={18} />
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={code.length !== 6}
            className="w-full"
          >
            <Icon name="ArrowRight" size={20} />
            Продолжить
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-pink-100 rounded-full mb-4">
          <Icon name="Mail" size={32} className="text-pink-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Вход через Email</h2>
        <p className="text-gray-600">Введите email для получения кода</p>
      </div>

      <form onSubmit={handleSendCode} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email адрес
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

        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
            <Icon name="AlertCircle" size={18} />
            {error}
          </div>
        )}

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <Icon name="Loader2" size={20} className="animate-spin" />
              Отправка...
            </>
          ) : (
            <>
              <Icon name="Send" size={20} />
              Получить код
            </>
          )}
        </Button>

        <button
          type="button"
          onClick={() => setAuthMode('password')}
          className="w-full text-center text-sm text-pink-600 hover:underline mt-4"
        >
          Войти с паролем
        </button>
      </form>
    </div>
  );
}