import { useState } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface ForgotPasswordFlowProps {
  authUrl: string;
  onSuccess: (email: string) => void;
  onBack: () => void;
}

export default function ForgotPasswordFlow({ authUrl, onSuccess, onBack }: ForgotPasswordFlowProps) {
  const [forgotStep, setForgotStep] = useState<'email' | 'code' | 'password'>('email');
  const [email, setEmail] = useState('');
  const [forgotCode, setForgotCode] = useState('');
  const [forgotVerificationData, setForgotVerificationData] = useState<{
    code: string;
    expires_at: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      <button
        onClick={onBack}
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
            const response = await fetch(authUrl, {
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
              placeholder="••••••••"
              minLength={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Минимум 6 символов
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
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
          >
            {isLoading ? 'Сохранение...' : 'Сохранить новый пароль'}
          </Button>
        </form>
      )}
    </div>
  );
}
