import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface UsernameSetupProps {
  userId: number;
  initialUsername?: string;
  authType: 'email' | 'telegram' | 'yandex' | 'vk';
  authUrl: string;
  onSuccess: (username: string) => void;
  onCancel?: () => void;
}

export default function UsernameSetup({
  userId,
  initialUsername = '',
  authType,
  authUrl,
  onSuccess,
  onCancel,
}: UsernameSetupProps) {
  const [username, setUsername] = useState(initialUsername);
  const [suggestedUsername, setSuggestedUsername] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!initialUsername) {
      generateUsername();
    }
  }, []);

  const generateUsername = async () => {
    try {
      let url = '';
      if (authType === 'email') {
        url = `${authUrl}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'generate_username', email: '' }),
        });
        const data = await response.json();
        if (data.username) {
          setSuggestedUsername(data.username);
          setUsername(data.username);
          setUsernameAvailable(true);
        }
      } else if (authType === 'telegram') {
        url = `${authUrl}?action=generate_username`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });
        const data = await response.json();
        if (data.username) {
          setSuggestedUsername(data.username);
          setUsername(data.username);
          setUsernameAvailable(true);
        }
      } else if (authType === 'yandex') {
        url = `${authUrl}?action=generate-username`;
        const response = await fetch(url);
        const data = await response.json();
        if (data.username) {
          setSuggestedUsername(data.username);
          setUsername(data.username);
          setUsernameAvailable(true);
        }
      }
    } catch (err) {
      console.error('Error generating username:', err);
    }
  };

  const checkUsernameAvailability = async (value: string) => {
    if (value.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    setIsCheckingUsername(true);
    try {
      let url = '';
      if (authType === 'email') {
        url = authUrl;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'check_username', username: value }),
        });
        const data = await response.json();
        setUsernameAvailable(data.available);
      } else if (authType === 'telegram') {
        url = `${authUrl}?action=check_username`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: value }),
        });
        const data = await response.json();
        setUsernameAvailable(data.available);
      } else if (authType === 'yandex') {
        url = `${authUrl}?action=check-username&username=${encodeURIComponent(value)}`;
        const response = await fetch(url);
        const data = await response.json();
        setUsernameAvailable(data.available);
      }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      let url = '';
      let response;

      if (authType === 'email') {
        response = await fetch(authUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'set_username',
            user_id: userId,
            username: username.trim(),
          }),
        });
      } else if (authType === 'telegram') {
        url = `${authUrl}?action=set_username`;
        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId,
            username: username.trim(),
          }),
        });
      } else if (authType === 'yandex') {
        url = `${authUrl}?action=set-username`;
        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId,
            username: username.trim(),
          }),
        });
      }

      const data = await response!.json();

      if (!response!.ok) {
        throw new Error(data.error || 'Ошибка установки username');
      }

      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      onSuccess(username);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка установки username');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
      {onCancel && (
        <button
          onClick={onCancel}
          className="flex items-center gap-2 text-gray-600 hover:text-pink-600 mb-6"
        >
          <Icon name="ArrowLeft" size={20} />
          Назад
        </button>
      )}

      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-pink-100 rounded-full mb-4">
          <Icon name="AtSign" size={32} className="text-pink-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Выберите username</h2>
        <p className="text-gray-600">Придумайте уникальный username или используйте предложенный</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
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
