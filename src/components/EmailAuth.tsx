import { useState } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

const AUTH_URL = 'https://functions.poehali.dev/b66d2296-9572-4853-b419-769688fe6e4f';

interface EmailAuthProps {
  onSuccess: (email: string) => void;
}

export default function EmailAuth({ onSuccess }: EmailAuthProps) {
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [verificationData, setVerificationData] = useState<{
    code: string;
    expires_at: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

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
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Неверный код');
      }

      if (data.authenticated) {
        onSuccess(email);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка проверки');
    } finally {
      setIsLoading(false);
    }
  };

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
            disabled={isLoading || code.length !== 6}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Icon name="Loader2" size={20} className="animate-spin" />
                Проверка...
              </>
            ) : (
              <>
                <Icon name="CheckCircle" size={20} />
                Войти
              </>
            )}
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
      </form>
    </div>
  );
}
