import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

const TELEGRAM_AUTH_URL = 'https://functions.poehali.dev/c89c74f6-84a8-46e5-af84-c6da33670f50';
const EMAIL_AUTH_URL = 'https://functions.poehali.dev/1a7a39de-f267-44a5-aaf6-04b5c3610d87';

interface EditUsernameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUsername: string;
  userId: number;
  usernameUpdatedAt?: string | null;
  onSuccess: (newUsername: string) => void;
}

export default function EditUsernameDialog({
  open,
  onOpenChange,
  currentUsername,
  userId,
  usernameUpdatedAt,
  onSuccess
}: EditUsernameDialogProps) {
  const [username, setUsername] = useState(currentUsername);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [canChangeUsername, setCanChangeUsername] = useState(true);
  const [daysUntilChange, setDaysUntilChange] = useState(0);

  useEffect(() => {
    if (usernameUpdatedAt) {
      const updatedDate = new Date(usernameUpdatedAt);
      const now = new Date();
      const daysSinceUpdate = Math.floor((now.getTime() - updatedDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSinceUpdate < 30) {
        setCanChangeUsername(false);
        setDaysUntilChange(30 - daysSinceUpdate);
      }
    }
  }, [usernameUpdatedAt]);

  const checkUsernameAvailability = async (value: string) => {
    if (value.length < 3 || value === currentUsername) {
      setUsernameAvailable(null);
      return;
    }

    setIsCheckingUsername(true);
    try {
      // Try Telegram auth first
      let response = await fetch(`${TELEGRAM_AUTH_URL}?action=check_username`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: value }),
      });
      
      // Fallback to email auth if needed
      if (!response.ok) {
        response = await fetch(EMAIL_AUTH_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'check_username', username: value }),
        });
      }
      
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!canChangeUsername) {
      setError(`Изменить username можно через ${daysUntilChange} дн.`);
      return;
    }
    
    setIsSubmitting(true);

    if (username.length < 3) {
      setError('Username должен быть минимум 3 символа');
      setIsSubmitting(false);
      return;
    }

    if (username.length > 30) {
      setError('Username должен быть максимум 30 символов');
      setIsSubmitting(false);
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError('Username может содержать только буквы, цифры и _');
      setIsSubmitting(false);
      return;
    }

    try {
      // Try Telegram auth first
      let response = await fetch(`${TELEGRAM_AUTH_URL}?action=set_username`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, username })
      });

      let data = await response.json();

      // If Telegram auth fails, try email auth
      if (!response.ok || !data.access_token) {
        response = await fetch(EMAIL_AUTH_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'set_username', user_id: userId, username })
        });
        data = await response.json();
      }

      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
        if (data.access_token) {
          localStorage.setItem('access_token', data.access_token);
        }
        if (data.refresh_token) {
          localStorage.setItem('refresh_token', data.refresh_token);
        }
        onSuccess(username);
        onOpenChange(false);
      } else {
        setError(data.error || 'Ошибка при изменении username');
      }
    } catch (err) {
      setError('Не удалось подключиться к серверу');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Изменить username</DialogTitle>
          <DialogDescription>
            Ваш уникальный идентификатор в приложении
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!canChangeUsername && (
            <div className="bg-yellow-50 text-yellow-800 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
              <Icon name="AlertCircle" size={18} className="flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Изменение ограничено</p>
                <p className="text-xs mt-1">
                  Следующее изменение будет доступно через {daysUntilChange} {daysUntilChange === 1 ? 'день' : daysUntilChange < 5 ? 'дня' : 'дней'}
                </p>
              </div>
            </div>
          )}
          <div>
            <div className="relative">
              <Input
                type="text"
                placeholder="username"
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value.toLowerCase())}
                disabled={isSubmitting || !canChangeUsername}
                autoFocus
              />
              {isCheckingUsername && (
                <div className="absolute right-3 top-3">
                  <Icon name="Loader2" size={20} className="animate-spin text-gray-400" />
                </div>
              )}
            </div>
            {username.length >= 3 && username !== currentUsername && usernameAvailable !== null && (
              <p className={`text-sm mt-2 ${usernameAvailable ? 'text-green-600' : 'text-red-600'}`}>
                {usernameAvailable ? '✓ Username свободен' : '✗ Username занят'}
              </p>
            )}
            {error && (
              <p className="text-red-500 text-sm mt-2">{error}</p>
            )}
            <p className="text-gray-500 text-xs mt-2">
              3-30 символов, только буквы, цифры и _. Можно изменить раз в 30 дней.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="flex-1"
            >
              Отмена
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !username || username === currentUsername || !canChangeUsername || usernameAvailable === false}
              className="flex-1"
            >
              {isSubmitting ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}