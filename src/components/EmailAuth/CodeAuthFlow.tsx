import { useState } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface CodeAuthFlowProps {
  authUrl: string;
  onSuccess: (email: string) => void;
  onSwitchToPassword: () => void;
}

export default function CodeAuthFlow({ authUrl, onSuccess, onSwitchToPassword }: CodeAuthFlowProps) {
  const [step, setStep] = useState<'email' | 'code' | 'username'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [username, setUsername] = useState('');
  const [suggestedUsername, setSuggestedUsername] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [verificationData, setVerificationData] = useState<{
    code: string;
    expires_at: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [error, setError] = useState('');

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(authUrl, {
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
      
      const usernameResponse = await fetch(authUrl, {
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
      const response = await fetch(authUrl, {
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
      const response = await fetch(authUrl, {
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

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent mb-2">
          Добро пожаловать в TinDog
        </h1>
        <p className="text-gray-600">
          {step === 'email' && 'Найди друга для своего питомца'}
          {step === 'code' && 'Проверь свою почту'}
          {step === 'username' && 'Придумай себе имя'}
        </p>
      </div>

      {step === 'email' && (
        <form onSubmit={handleSendCode} className="space-y-4">
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
            {isLoading ? 'Отправка...' : 'Получить код'}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={onSwitchToPassword}
              className="text-sm text-pink-600 hover:text-pink-700"
            >
              Войти с паролем
            </button>
          </div>
        </form>
      )}

      {step === 'code' && (
        <form onSubmit={handleVerifyCode} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Код из письма
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
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
              setStep('email');
              setCode('');
              setError('');
            }}
            className="w-full text-sm text-gray-600 hover:text-pink-600"
          >
            Отправить код повторно
          </button>
        </form>
      )}

      {step === 'username' && (
        <form onSubmit={handleCompleteRegistration} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => handleUsernameChange(e.target.value)}
              placeholder="username"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              required
            />
            {suggestedUsername && username === suggestedUsername && (
              <p className="text-xs text-gray-500 mt-1">
                💡 Предложенный username
              </p>
            )}
            {isCheckingUsername && (
              <p className="text-xs text-gray-500 mt-1">Проверка...</p>
            )}
            {usernameAvailable === false && (
              <p className="text-xs text-red-600 mt-1">Username занят</p>
            )}
            {usernameAvailable === true && (
              <p className="text-xs text-green-600 mt-1">Username свободен ✓</p>
            )}
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <Icon name="AlertCircle" size={16} />
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading || usernameAvailable === false}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
          >
            {isLoading ? 'Регистрация...' : 'Завершить регистрацию'}
          </Button>
        </form>
      )}
    </div>
  );
}
