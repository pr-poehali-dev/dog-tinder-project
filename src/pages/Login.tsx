import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';

export default function Login() {
  const navigate = useNavigate();
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetCode, setResetCode] = useState('');
  const [receivedCode, setReceivedCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('onboardingComplete', 'true');
    navigate('/', { replace: true });
  };

  const handleEmailLogin = () => {
    setShowEmailForm(true);
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      handleLogin();
    }
  };

  const handleYandexLogin = () => {
    handleLogin();
  };

  const handleTelegramLogin = () => {
    handleLogin();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-orange-50 p-6 flex flex-col items-center justify-center">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-pink-600 to-orange-600 bg-clip-text text-transparent">
            TinDog
          </h1>
          <h2 className="text-2xl font-bold text-gray-900">
            Войти в аккаунт
          </h2>
        </div>

        {showForgotPassword ? (
          <div className="space-y-6">
            {!resetSent ? (
              <>
                <p className="text-center text-gray-700">
                  Введите email, указанный при регистрации
                </p>
                <Input
                  type="email"
                  placeholder="Email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="h-14 text-lg rounded-full"
                />
                <Button
                  onClick={async () => {
                    if (!resetEmail) return;
                    
                    setIsSending(true);
                    try {
                      const response = await fetch('https://functions.poehali.dev/f52b5772-a3de-4498-b10d-74574f969e06', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ email: resetEmail }),
                      });

                      const data = await response.json();

                      if (response.ok && data.success) {
                        setReceivedCode(data.code);
                        setResetSent(true);
                        setShowCodeInput(true);
                      } else {
                        alert('Ошибка отправки: ' + (data.error || 'Неизвестная ошибка'));
                      }
                    } catch (error) {
                      alert('Ошибка сети: ' + error);
                    } finally {
                      setIsSending(false);
                    }
                  }}
                  disabled={isSending}
                  className="w-full h-14 text-lg bg-gradient-to-r from-pink-600 to-orange-600 hover:from-pink-700 hover:to-orange-700 rounded-full disabled:opacity-50"
                >
                  {isSending ? 'Отправка...' : 'Отправить код'}
                </Button>
                <Button
                  onClick={() => {
                    setShowForgotPassword(false);
                    setShowEmailForm(true);
                  }}
                  variant="outline"
                  className="w-full h-14 text-lg rounded-full"
                >
                  Назад ко входу
                </Button>
              </>
            ) : showCodeInput ? (
              <>
                <div className="text-center space-y-4 py-4">
                  <Icon name="KeyRound" size={64} className="mx-auto text-pink-600" />
                  <h3 className="text-xl font-bold text-gray-900">
                    Код отправлен!
                  </h3>
                  <p className="text-gray-600">
                    Проверьте {resetEmail} и введите код из письма
                  </p>
                </div>
                <Input
                  type="text"
                  placeholder="Введите 6-значный код"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  className="h-14 text-lg text-center tracking-widest rounded-full"
                  maxLength={6}
                />
                <Button
                  onClick={() => {
                    if (resetCode === receivedCode) {
                      setShowCodeInput(false);
                      setShowNewPassword(true);
                    } else {
                      alert('Неверный код. Проверьте письмо и попробуйте снова');
                    }
                  }}
                  disabled={resetCode.length !== 6}
                  className="w-full h-14 text-lg bg-gradient-to-r from-pink-600 to-orange-600 hover:from-pink-700 hover:to-orange-700 rounded-full disabled:opacity-50"
                >
                  Подтвердить код
                </Button>
                <Button
                  onClick={() => {
                    setShowForgotPassword(false);
                    setResetSent(false);
                    setShowCodeInput(false);
                    setResetEmail('');
                    setResetCode('');
                    setShowEmailForm(true);
                  }}
                  variant="outline"
                  className="w-full h-14 text-lg rounded-full"
                >
                  Назад ко входу
                </Button>
              </>
            ) : showNewPassword ? (
              <>
                <div className="text-center space-y-4 py-4">
                  <Icon name="Lock" size={64} className="mx-auto text-pink-600" />
                  <h3 className="text-xl font-bold text-gray-900">
                    Новый пароль
                  </h3>
                  <p className="text-gray-600">
                    Придумайте новый пароль для {resetEmail}
                  </p>
                </div>
                <div className="space-y-4">
                  <Input
                    type="password"
                    placeholder="Новый пароль"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="h-14 text-lg rounded-full"
                  />
                  <Input
                    type="password"
                    placeholder="Повторите пароль"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-14 text-lg rounded-full"
                  />
                  {newPassword && confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-red-500 text-sm text-center">Пароли не совпадают</p>
                  )}
                </div>
                <Button
                  onClick={async () => {
                    if (newPassword.length < 6) {
                      alert('Пароль должен быть не менее 6 символов');
                      return;
                    }
                    if (newPassword !== confirmPassword) {
                      alert('Пароли не совпадают');
                      return;
                    }

                    setIsSending(true);
                    try {
                      const response = await fetch('https://functions.poehali.dev/f736ea3e-b14a-4ad5-950a-0a363b8459c0', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          email: resetEmail,
                          code: receivedCode,
                          password: newPassword
                        }),
                      });

                      const data = await response.json();

                      if (response.ok && data.success) {
                        alert('Пароль успешно изменён! Теперь можете войти с новым паролем');
                        setShowForgotPassword(false);
                        setResetSent(false);
                        setShowCodeInput(false);
                        setShowNewPassword(false);
                        setResetEmail('');
                        setResetCode('');
                        setReceivedCode('');
                        setNewPassword('');
                        setConfirmPassword('');
                        setShowEmailForm(true);
                      } else {
                        alert('Ошибка: ' + (data.error || 'Не удалось изменить пароль'));
                      }
                    } catch (error) {
                      alert('Ошибка сети: ' + error);
                    } finally {
                      setIsSending(false);
                    }
                  }}
                  disabled={!newPassword || !confirmPassword || newPassword !== confirmPassword || isSending}
                  className="w-full h-14 text-lg bg-gradient-to-r from-pink-600 to-orange-600 hover:from-pink-700 hover:to-orange-700 rounded-full disabled:opacity-50"
                >
                  {isSending ? 'Сохранение...' : 'Сохранить пароль'}
                </Button>
                <Button
                  onClick={() => {
                    setShowForgotPassword(false);
                    setResetSent(false);
                    setShowCodeInput(false);
                    setShowNewPassword(false);
                    setResetEmail('');
                    setResetCode('');
                    setNewPassword('');
                    setConfirmPassword('');
                    setShowEmailForm(true);
                  }}
                  variant="outline"
                  className="w-full h-14 text-lg rounded-full"
                >
                  Отмена
                </Button>
              </>
            ) : null}
          </div>
        ) : !showEmailForm ? (
          <div className="space-y-4">
            <Button
              onClick={handleEmailLogin}
              className="w-full h-14 text-lg bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-200 rounded-full flex items-center justify-center gap-3"
            >
              <Icon name="Mail" size={24} />
              Войти через Email
            </Button>

            <Button
              onClick={handleYandexLogin}
              className="w-full h-14 text-lg bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center gap-3"
            >
              <span className="text-2xl font-bold">Я</span>
              Войти через Яндекс
            </Button>

            <Button
              onClick={handleTelegramLogin}
              className="w-full h-14 text-lg bg-[#0088cc] hover:bg-[#006699] text-white rounded-full flex items-center justify-center gap-3"
            >
              <Icon name="MessageCircle" size={24} />
              Войти через Telegram
            </Button>
          </div>
        ) : (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-14 text-lg rounded-full"
                required
              />
              <Input
                type="password"
                placeholder="Пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-14 text-lg rounded-full"
                required
              />
            </div>
            <div className="text-center">
              <Button
                type="button"
                variant="link"
                className="text-pink-600 hover:text-pink-700"
                onClick={() => {
                  setShowForgotPassword(true);
                  setShowEmailForm(false);
                }}
              >
                Забыли пароль?
              </Button>
            </div>
            <Button
              type="submit"
              className="w-full h-14 text-lg bg-gradient-to-r from-pink-600 to-orange-600 hover:from-pink-700 hover:to-orange-700 rounded-full"
            >
              Войти
            </Button>
            <Button
              type="button"
              onClick={() => setShowEmailForm(false)}
              variant="outline"
              className="w-full h-14 text-lg rounded-full"
            >
              Назад к выбору
            </Button>
          </form>
        )}

        <div className="text-center">
          <Button
            onClick={() => navigate('/welcome')}
            variant="ghost"
            className="text-gray-600"
          >
            Назад
          </Button>
        </div>
      </div>


    </div>
  );
}