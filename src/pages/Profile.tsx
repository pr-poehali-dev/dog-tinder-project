import { useState, useEffect } from 'react';
import YandexLoginButton from '@/components/extensions/yandex-auth/YandexLoginButton';
import { useYandexAuth } from '@/components/extensions/yandex-auth/useYandexAuth';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

const YANDEX_AUTH_URL = 'https://functions.poehali.dev/39b02f75-9132-4979-a6d8-3685a9ba28f6';
const PROFILE_API_URL = 'https://functions.poehali.dev/b66d2296-9572-4853-b419-769688fe6e4f';

interface User {
  id: number;
  email: string;
  name?: string;
  phone?: string;
  city?: string;
  about?: string;
  avatar_url?: string;
  created_at?: string;
}

export default function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', city: '' });
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const yandexAuth = useYandexAuth({
    apiUrls: {
      authUrl: `${YANDEX_AUTH_URL}?action=auth-url`,
      callback: `${YANDEX_AUTH_URL}?action=callback`,
      refresh: `${YANDEX_AUTH_URL}?action=refresh`,
      logout: `${YANDEX_AUTH_URL}?action=logout`,
    },
  });

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  useEffect(() => {
    if (yandexAuth.isAuthenticated && yandexAuth.user) {
      localStorage.setItem('user', JSON.stringify(yandexAuth.user));
      setUser(yandexAuth.user as User);
    }
  }, [yandexAuth.isAuthenticated, yandexAuth.user]);

  useEffect(() => {
    if (user) {
      setEditForm({ name: user.name || '', city: user.city || '' });
    }
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    yandexAuth.logout();
    setUser(null);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        const uploadResponse = await fetch(PROFILE_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'upload_avatar', image: base64 }),
        });
        const uploadData = await uploadResponse.json();
        
        if (uploadData.url && user) {
          const updateResponse = await fetch(PROFILE_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'update_profile',
              user_id: user.id,
              avatar_url: uploadData.url,
            }),
          });
          const updateData = await updateResponse.json();
          
          if (updateData.user) {
            setUser(updateData.user);
            localStorage.setItem('user', JSON.stringify(updateData.user));
          }
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const response = await fetch(PROFILE_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_profile',
          user_id: user.id,
          name: editForm.name,
          city: editForm.city,
        }),
      });
      const data = await response.json();
      if (data.user) {
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="text-center mb-8">
              <div className="relative inline-block mb-4">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt="Avatar" className="w-20 h-20 rounded-full object-cover" />
                ) : (
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-pink-100 rounded-full">
                    <Icon name="User" size={40} className="text-pink-600" />
                  </div>
                )}
                <label className="absolute bottom-0 right-0 bg-pink-600 text-white p-2 rounded-full cursor-pointer hover:bg-pink-700 transition-colors">
                  <Icon name={isUploading ? "Loader2" : "Camera"} size={16} className={isUploading ? "animate-spin" : ""} />
                  <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                </label>
              </div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Личный кабинет</h1>
              <p className="text-gray-600">{user.email}</p>
            </div>

            <div className="space-y-4">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Имя</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      placeholder="Ваше имя"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Город</label>
                    <input
                      type="text"
                      value={editForm.city}
                      onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      placeholder="Ваш город"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSaveProfile} disabled={isSaving} className="flex-1">
                      {isSaving ? <Icon name="Loader2" size={20} className="animate-spin" /> : <Icon name="Save" size={20} />}
                      Сохранить
                    </Button>
                    <Button variant="outline" onClick={() => setIsEditing(false)} className="flex-1">
                      Отмена
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-pink-50 rounded-lg p-6">
                    <div className="space-y-3">
                      {user.name && (
                        <div className="flex items-center gap-2">
                          <Icon name="User" size={18} className="text-gray-600" />
                          <span className="text-gray-800">{user.name}</span>
                        </div>
                      )}
                      {user.city && (
                        <div className="flex items-center gap-2">
                          <Icon name="MapPin" size={18} className="text-gray-600" />
                          <span className="text-gray-800">{user.city}</span>
                        </div>
                      )}
                      {!user.name && !user.city && (
                        <p className="text-gray-600 text-sm text-center">
                          Заполните информацию о себе
                        </p>
                      )}
                    </div>
                  </div>

                  <Button variant="outline" onClick={() => setIsEditing(true)} className="w-full">
                    <Icon name="Edit" size={20} />
                    Редактировать профиль
                  </Button>

                  <Button variant="outline" onClick={handleLogout} className="w-full">
                    <Icon name="LogOut" size={20} />
                    Выйти
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 text-center">
            <Button
              variant="ghost"
              onClick={() => window.location.href = '/'}
              className="gap-2"
            >
              <Icon name="ArrowLeft" size={20} />
              На главную
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex items-center justify-center">
      <div className="container mx-auto px-4 max-w-md">
        <div className="absolute top-6 left-6">
          <Button
            variant="ghost"
            onClick={() => window.location.href = '/'}
            className="gap-2"
          >
            <Icon name="ArrowLeft" size={20} />
            На главную
          </Button>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-pink-100 rounded-full mb-4">
              <Icon name="Heart" size={32} className="text-pink-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Вход в TinDog</h2>
            <p className="text-gray-600">Войдите через Яндекс для продолжения</p>
          </div>

          <div className="flex justify-center">
            <YandexLoginButton
              onClick={yandexAuth.login}
              isLoading={yandexAuth.isLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}