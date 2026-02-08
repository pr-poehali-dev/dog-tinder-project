import { useState, useEffect } from 'react';
import { useYandexAuth } from '@/components/extensions/yandex-auth/useYandexAuth';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import PetForm from '@/components/PetForm';
import EditUsernameDialog from '@/components/EditUsernameDialog';
import ProfileHeader from './Profile/ProfileHeader';
import ProfileStats from './Profile/ProfileStats';
import PetsList from './Profile/PetsList';
import AuthSection from './Profile/AuthSection';

const YANDEX_AUTH_URL =
  'https://functions.poehali.dev/39b02f75-9132-4979-a6d8-3685a9ba28f6';
const TELEGRAM_BOT_USERNAME = 'tindog_bot';
const PROFILE_API_URL =
  'https://functions.poehali.dev/b2989243-6e4e-472c-9f80-2ae9d50a3a79';
const PETS_API_URL =
  'https://functions.poehali.dev/2a5a65c0-df1b-4023-980c-b0601b7c462c';

interface User {
  id: number;
  email: string;
  username?: string;
  username_updated_at?: string | null;
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
  breeding_price?: number;
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
  const [pets, setPets] = useState<Pet[]>([]);
  const [showPetForm, setShowPetForm] = useState(false);
  const [isLoadingPets, setIsLoadingPets] = useState(false);
  const [editingPet, setEditingPet] = useState<EditingPet | null>(null);
  const [showUsernameDialog, setShowUsernameDialog] = useState(false);

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
      
      const username = (yandexAuth.user as User).username || '';
      if (username.startsWith('yandex')) {
        setShowUsernameDialog(true);
      }
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
    if (!confirm('Удалить объявление навсегда? Это действие нельзя отменить.'))
      return;

    try {
      const response = await fetch(`${PETS_API_URL}?pet_id=${petId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setPets(pets.filter((p) => p.id !== petId));
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
      isNew: true,
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
      }
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleUsernameUpdate = async (newUsername: string) => {
    if (!user) return;

    try {
      const response = await fetch(PROFILE_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_profile',
          user_id: user.id,
          username: newUsername,
        }),
      });
      const data = await response.json();

      if (data.user) {
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        setShowUsernameDialog(false);
      } else if (data.error) {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Username update failed:', error);
      throw error;
    }
  };

  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <Button
            variant="ghost"
            onClick={() => (window.location.href = '/feed')}
            className="mb-4"
          >
            <Icon name="ArrowLeft" size={20} className="mr-2" />
            На главную
          </Button>
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <ProfileHeader
              user={user}
              isEditing={isEditing}
              editForm={editForm}
              isSaving={isSaving}
              isUploading={isUploading}
              onEditToggle={() => setIsEditing(!isEditing)}
              onEditFormChange={(field, value) =>
                setEditForm((prev) => ({ ...prev, [field]: value }))
              }
              onSave={handleSaveProfile}
              onCancel={() => {
                setIsEditing(false);
                setEditForm({ name: user.name || '', city: user.city || '' });
              }}
              onAvatarUpload={handleAvatarUpload}
              onDeleteAvatar={handleDeleteAvatar}
              onEditUsername={() => setShowUsernameDialog(true)}
            />

            <div className="border-t pt-6">
              <ProfileStats
                petsCount={pets.length}
                memberSince={user.created_at || new Date().toISOString()}
              />

              <PetsList
                pets={pets}
                isLoading={isLoadingPets}
                onAddNew={handleAddNewPet}
                onEdit={handleEditPet}
                onDelete={handleDeletePet}
                onToggleActive={handleToggleActive}
              />
            </div>

            <div className="border-t mt-8 pt-6">
              <Button
                onClick={handleLogout}
                variant="outline"
                className="w-full text-red-600 border-red-600 hover:bg-red-50"
              >
                <Icon name="LogOut" size={18} className="mr-2" />
                Выйти из аккаунта
              </Button>
            </div>
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

        {showUsernameDialog && (
          <EditUsernameDialog
            currentUsername={user.username || ''}
            usernameUpdatedAt={user.username_updated_at || null}
            onClose={() => setShowUsernameDialog(false)}
            onUpdate={handleUsernameUpdate}
          />
        )}
      </div>
    );
  }

  return (
    <AuthSection
      yandexAuthUrl={`${YANDEX_AUTH_URL}?action=auth-url`}
      telegramBotUsername={TELEGRAM_BOT_USERNAME}
      onYandexAuth={yandexAuth.handleAuthCallback}
      onTelegramAuth={(userData) => {
        console.log('Telegram auth:', userData);
      }}
      onLogout={handleLogout}
      isAuthenticated={false}
    />
  );
}