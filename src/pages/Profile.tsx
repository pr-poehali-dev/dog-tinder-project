import { useState } from 'react';
import { useAuth } from '@/components/extensions/auth-email/useAuth';
import LoginForm from '@/components/extensions/auth-email/LoginForm';
import RegisterForm from '@/components/extensions/auth-email/RegisterForm';
import UserProfile from '@/components/extensions/auth-email/UserProfile';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const AUTH_URL = 'https://functions.poehali.dev/b66d2296-9572-4853-b419-769688fe6e4f';

export default function Profile() {
  const [showLogin, setShowLogin] = useState(true);

  const auth = useAuth({
    apiUrls: {
      login: `${AUTH_URL}?action=login`,
      register: `${AUTH_URL}?action=register`,
      verifyEmail: `${AUTH_URL}?action=verify-email`,
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
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-pink-600 mb-2">Личный кабинет</h1>
          <p className="text-gray-600">Войдите или зарегистрируйтесь</p>
        </div>

        <Tabs value={showLogin ? 'login' : 'register'} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login" onClick={() => setShowLogin(true)}>
              Вход
            </TabsTrigger>
            <TabsTrigger value="register" onClick={() => setShowLogin(false)}>
              Регистрация
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <LoginForm 
              onLogin={auth.login}
              apiUrls={{
                login: `${AUTH_URL}?action=login`,
                resetPassword: `${AUTH_URL}?action=reset-password`,
              }}
            />
          </TabsContent>
          
          <TabsContent value="register">
            <RegisterForm 
              onRegister={auth.register}
              apiUrls={{
                register: `${AUTH_URL}?action=register`,
                verifyEmail: `${AUTH_URL}?action=verify-email`,
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
