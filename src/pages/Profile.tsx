import { useState, useEffect } from 'react';
import YandexLoginButton from '@/components/extensions/yandex-auth/YandexLoginButton';
import { useYandexAuth } from '@/components/extensions/yandex-auth/useYandexAuth';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import PetForm from '@/components/PetForm';

const YANDEX_AUTH_URL = 'https://functions.poehali.dev/39b02f75-9132-4979-a6d8-3685a9ba28f6';
const PROFILE_API_URL = 'https://functions.poehali.dev/b66d2296-9572-4853-b419-769688fe6e4f';
const PETS_API_URL = 'https://functions.poehali.dev/2a5a65c0-df1b-4023-980c-b0601b7c462c';

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

interface Pet {
  id: number;
  user_id: number;
  name: string;
  breed?: string;
  age?: number;
  gender?: string;
  rank?: string;
  city?: string;
  description?: string;
  photo_url?: string;
  verification_paid?: boolean;
  passport_verified?: boolean;
  is_active?: boolean;
  created_at?: string;
}

interface EditingPet extends Pet {
  isNew: boolean;
}

export default function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', city: '' });
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const [pets, setPets] = useState<Pet[]>([]);
  const [showPetForm, setShowPetForm] = useState(false);
  const [isLoadingPets, setIsLoadingPets] = useState(false);
  const [editingPet, setEditingPet] = useState<EditingPet | null>(null);

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
      loadPets();
    }
  }, [user]);

  const loadPets = async () => {
    if (!user) return;
    setIsLoadingPets(true);
    try {
      const response = await fetch(`${PETS_API_URL}?user_id=${user.id}`);
      const data = await response.json();
      setPets(data);
    } catch (error) {
      console.error('Failed to load pets:', error);
    } finally {
      setIsLoadingPets(false);
    }
  };

  const handleDeletePet = async (petId: number) => {
    if (!confirm('Удалить объявление навсегда? Это действие нельзя отменить.')) return;
    
    try {
      const response = await fetch(`${PETS_API_URL}?pet_id=${petId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setPets(pets.filter(p => p.id !== petId));
      }
    } catch (error) {
      console.error('Failed to delete pet:', error);
      alert('Не удалось удалить объявление');
    }
  };

  const handleToggleActive = async (petId: number, isActive: boolean) => {
    try {
      const response = await fetch(`${PETS_API_URL}?pet_id=${petId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pet_id: petId, is_active: !isActive }),
      });
      
      if (response.ok) {
        loadPets();
      }
    } catch (error) {
      console.error('Failed to toggle pet status:', error);
      alert('Не удалось изменить статус объявления');
    }
  };

  const handleEditPet = (pet: Pet) => {
    setEditingPet({ ...pet, isNew: false });
    setShowPetForm(true);
  };

  const handleAddNewPet = () => {
    if (!user) return;
    setEditingPet({
      id: 0,
      user_id: user.id,
      name: '',
      isNew: true
    });
    setShowPetForm(true);
  };

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

  const handleDeleteAvatar = async () => {
    if (!user) return;

    setIsUploading(true);
    try {
      const response = await fetch(PROFILE_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_profile',
          user_id: user.id,
          avatar_url: null,
        }),
      });
      const data = await response.json();
      if (data.user) {
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        setShowAvatarMenu(false);
      }
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setIsUploading(false);
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
                <button
                  onClick={() => setShowAvatarMenu(!showAvatarMenu)}
                  className="absolute bottom-0 right-0 bg-pink-600 text-white p-2 rounded-full hover:bg-pink-700 transition-colors"
                >
                  <Icon name={isUploading ? "Loader2" : "Camera"} size={16} className={isUploading ? "animate-spin" : ""} />
                </button>
                {showAvatarMenu && (
                  <div className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-10">
                    <label className="block px-4 py-2 hover:bg-gray-50 cursor-pointer">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Icon name="Upload" size={16} />
                        Загрузить фото
                      </div>
                      <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                    </label>
                    {user.avatar_url && (
                      <button
                        onClick={handleDeleteAvatar}
                        className="w-full px-4 py-2 hover:bg-gray-50 text-left flex items-center gap-2 text-sm text-red-600"
                      >
                        <Icon name="Trash2" size={16} />
                        Удалить фото
                      </button>
                    )}
                  </div>
                )}
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

          <div className="bg-white rounded-2xl shadow-lg p-8 mt-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Мои питомцы</h2>
              <Button onClick={handleAddNewPet}>
                <Icon name="Plus" size={20} />
                Добавить питомца
              </Button>
            </div>

            {isLoadingPets ? (
              <div className="text-center py-8">
                <Icon name="Loader2" size={32} className="animate-spin text-pink-600 mx-auto" />
              </div>
            ) : pets.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Icon name="Dog" size={48} className="mx-auto mb-4 text-gray-300" />
                <p>У вас пока нет объявлений о питомцах</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pets.map((pet) => (
                  <div 
                    key={pet.id} 
                    className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                      pet.is_active === false ? 'bg-gray-50 border-gray-300 opacity-60' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex gap-4">
                      {pet.photo_url ? (
                        <img src={pet.photo_url} alt={pet.name} className="w-20 h-20 rounded-lg object-cover" />
                      ) : (
                        <div className="w-20 h-20 bg-pink-100 rounded-lg flex items-center justify-center">
                          <Icon name="Dog" size={32} className="text-pink-600" />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-lg text-gray-800">{pet.name}</h3>
                          {pet.is_active === false && (
                            <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">Скрыто</span>
                          )}
                        </div>
                        {pet.breed && <p className="text-sm text-gray-600">{pet.breed}</p>}
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {pet.age && (
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">{pet.age} лет</span>
                          )}
                          {pet.gender && (
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {pet.gender === 'male' ? 'Кобель' : 'Сука'}
                            </span>
                          )}
                          {pet.verification_paid && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded flex items-center gap-1">
                              <Icon name="ShieldCheck" size={12} />
                              Проверен
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2 mt-3 flex-wrap">
                          {pet.is_active !== false ? (
                            <>
                              <Button
                                onClick={() => handleEditPet(pet)}
                                size="sm"
                                variant="outline"
                                className="text-gray-700 hover:text-pink-600 hover:border-pink-300"
                              >
                                <Icon name="Edit" size={14} className="mr-1" />
                                Редактировать
                              </Button>
                              <Button
                                onClick={() => handleToggleActive(pet.id, pet.is_active !== false)}
                                size="sm"
                                variant="outline"
                                className="text-orange-600 hover:text-orange-700 border-orange-200 hover:border-orange-300"
                              >
                                <Icon name="EyeOff" size={14} className="mr-1" />
                                Скрыть
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                onClick={() => handleToggleActive(pet.id, pet.is_active !== false)}
                                size="sm"
                                variant="outline"
                                className="text-green-600 hover:text-green-700 border-green-200 hover:border-green-300"
                              >
                                <Icon name="Eye" size={14} className="mr-1" />
                                Показать
                              </Button>
                              <Button
                                onClick={() => handleDeletePet(pet.id)}
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                              >
                                <Icon name="Trash2" size={14} className="mr-1" />
                                Удалить
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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

        {showPetForm && editingPet && (
          <PetForm
            userId={user.id}
            editingPet={editingPet.isNew ? undefined : editingPet}
            onSuccess={() => {
              setShowPetForm(false);
              setEditingPet(null);
              loadPets();
            }}
            onCancel={() => {
              setShowPetForm(false);
              setEditingPet(null);
            }}
          />
        )}
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