import { useState } from 'react';
import { useAuth } from '@/components/extensions/auth-email/useAuth';
import LoginForm from '@/components/extensions/auth-email/LoginForm';
import RegisterForm from '@/components/extensions/auth-email/RegisterForm';
import ForgotPasswordForm from '@/components/extensions/auth-email/ForgotPasswordForm';
import UserProfile from '@/components/extensions/auth-email/UserProfile';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

const AUTH_URL = 'https://functions.poehali.dev/b66d2296-9572-4853-b419-769688fe6e4f';

type View = 'login' | 'register' | 'forgot-password';

export default function Profile() {
  const [view, setView] = useState<View>('login');

  const auth = useAuth({
    apiUrls: {
      login: `${AUTH_URL}?action=login`,
      register: `${AUTH_URL}?action=register`,
      verifyEmail: `${AUTH_URL}?action=verify-email`,
      verifyPhone: `${AUTH_URL}?action=verify-phone`,
      refresh: `${AUTH_URL}?action=refresh`,
      logout: `${AUTH_URL}?action=logout`,
      resetPassword: `${AUTH_URL}?action=reset-password`,
    },
  });

  if (auth.isAuthenticated && auth.user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white py-12">
        <div className="container mx-auto px-4">
          <UserProfile user={auth.user} onLogout={auth.logout} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white py-12">
      <div className="container mx-auto px-4 max-w-md">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => window.location.href = '/'}
            className="gap-2"
          >
            <Icon name="ArrowLeft" size={20} />
            На главную
          </Button>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-pink-600 mb-2">Личный кабинет</h1>
          <p className="text-gray-600">
            {view === 'login' && 'Войдите в свой аккаунт'}
            {view === 'register' && 'Создайте новый аккаунт'}
            {view === 'forgot-password' && 'Восстановление пароля'}
          </p>
        </div>

        {view === 'login' && (
          <LoginForm
            onLogin={auth.login}
            onSuccess={() => window.location.href = '/profile'}
            onRegisterClick={() => setView('register')}
            onForgotPasswordClick={() => setView('forgot-password')}
            error={auth.error}
            isLoading={auth.isLoading}
          />
        )}

        {view === 'register' && (
          <RegisterForm
            onRegister={auth.register}
            onVerifyEmail={auth.verifyEmail}
            onVerifyPhone={auth.verifyPhone}
            onLogin={auth.login}
            onSuccess={() => window.location.href = '/profile'}
            onLoginClick={() => setView('login')}
            error={auth.error}
            isLoading={auth.isLoading}
          />
        )}

        {view === 'forgot-password' && (
          <ForgotPasswordForm
            onResetPassword={auth.resetPassword}
            onVerifyEmail={auth.verifyEmail}
            onVerifyPhone={auth.verifyPhone}
            onBackClick={() => setView('login')}
            error={auth.error}
            isLoading={auth.isLoading}
          />
        )}
      </div>
    </div>
  );
}
