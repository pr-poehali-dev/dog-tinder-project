import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';

interface User {
  id: number;
  email: string;
  username?: string;
  name?: string;
  phone?: string;
  city?: string;
  about?: string;
  avatar_url?: string;
  created_at?: string;
}

interface ProfileHeaderProps {
  user: User;
  isEditing: boolean;
  editForm: { name: string; city: string };
  isSaving: boolean;
  isUploading: boolean;
  onEditToggle: () => void;
  onEditFormChange: (field: 'name' | 'city', value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onAvatarUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDeleteAvatar: () => void;
  onEditUsername: () => void;
}

export default function ProfileHeader({
  user,
  isEditing,
  editForm,
  isSaving,
  isUploading,
  onEditToggle,
  onEditFormChange,
  onSave,
  onCancel,
  onAvatarUpload,
  onDeleteAvatar,
  onEditUsername,
}: ProfileHeaderProps) {
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);

  return (
    <div className="text-center mb-8">
      <div className="relative inline-block mb-4">
        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-pink-400 to-orange-400 flex items-center justify-center overflow-hidden">
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            <Icon name="User" size={64} className="text-white" />
          )}
        </div>
        <button
          onClick={() => setShowAvatarMenu(!showAvatarMenu)}
          className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg hover:bg-gray-50"
        >
          <Icon name="Camera" size={20} className="text-pink-600" />
        </button>

        {showAvatarMenu && (
          <div className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-xl border z-10 min-w-[180px]">
            <label className="block px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors">
              <span className="flex items-center gap-2">
                <Icon name="Upload" size={18} />
                Загрузить фото
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  onAvatarUpload(e);
                  setShowAvatarMenu(false);
                }}
                className="hidden"
                disabled={isUploading}
              />
            </label>
            {user.avatar_url && (
              <button
                onClick={() => {
                  onDeleteAvatar();
                  setShowAvatarMenu(false);
                }}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-2 text-red-600"
                disabled={isUploading}
              >
                <Icon name="Trash2" size={18} />
                Удалить фото
              </button>
            )}
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-4">
          <Input
            value={editForm.name}
            onChange={(e) => onEditFormChange('name', e.target.value)}
            placeholder="Имя"
            className="text-center"
          />
          <Input
            value={editForm.city}
            onChange={(e) => onEditFormChange('city', e.target.value)}
            placeholder="Город"
            className="text-center"
          />
          <div className="flex gap-2 justify-center">
            <Button onClick={onSave} disabled={isSaving} size="sm">
              {isSaving ? 'Сохранение...' : 'Сохранить'}
            </Button>
            <Button onClick={onCancel} variant="outline" size="sm">
              Отмена
            </Button>
          </div>
        </div>
      ) : (
        <>
          <h1 className="text-2xl font-bold text-gray-800 mb-1">
            {user.name || user.username || 'Без имени'}
          </h1>
          <p className="text-gray-600 mb-2">{user.city || 'Город не указан'}</p>
          <button
            onClick={onEditUsername}
            className="text-sm text-pink-600 hover:text-pink-700 flex items-center gap-1 mx-auto"
          >
            @{user.username}
            <Icon name="Pencil" size={14} />
          </button>
          <Button
            onClick={onEditToggle}
            variant="ghost"
            size="sm"
            className="mt-2"
          >
            Редактировать профиль
          </Button>
        </>
      )}
    </div>
  );
}
