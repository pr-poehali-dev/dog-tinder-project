import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const AUTH_API_URL = 'https://functions.poehali.dev/c89c74f6-84a8-46e5-af84-c6da33670f50';

interface EditUsernameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUsername: string;
  userId: number;
  onSuccess: (newUsername: string) => void;
}

export default function EditUsernameDialog({
  open,
  onOpenChange,
  currentUsername,
  userId,
  onSuccess
}: EditUsernameDialogProps) {
  const [username, setUsername] = useState(currentUsername);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    // Валидация
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
      const response = await fetch(`${AUTH_API_URL}?action=set_username`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, username })
      });

      const data = await response.json();

      if (data.access_token) {
        // Обновляем токены и данные пользователя
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('refresh_token', data.refresh_token);
        localStorage.setItem('user', JSON.stringify(data.user));
        onSuccess(username);
        onOpenChange(false);
      } else {
        setError(data.error || 'Ошибка при изменении username');
      }
    } catch {
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
          <div>
            <Input
              type="text"
              placeholder="username"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              disabled={isSubmitting}
              autoFocus
            />
            {error && (
              <p className="text-red-500 text-sm mt-2">{error}</p>
            )}
            <p className="text-gray-500 text-xs mt-2">
              3-30 символов, только буквы, цифры и _
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
              disabled={isSubmitting || !username || username === currentUsername}
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
