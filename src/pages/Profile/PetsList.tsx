import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

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

interface PetsListProps {
  pets: Pet[];
  isLoading: boolean;
  onAddNew: () => void;
  onEdit: (pet: Pet) => void;
  onDelete: (petId: number) => void;
  onToggleActive: (petId: number, isActive: boolean) => void;
}

export default function PetsList({
  pets,
  isLoading,
  onAddNew,
  onEdit,
  onDelete,
  onToggleActive,
}: PetsListProps) {
  if (isLoading) {
    return (
      <div className="text-center py-8">
        <Icon name="Loader2" size={32} className="animate-spin mx-auto text-pink-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">Мои питомцы</h2>
        <Button
          onClick={onAddNew}
          size="sm"
          className="bg-gradient-to-r from-pink-600 to-orange-600"
        >
          <Icon name="Plus" size={16} className="mr-1" />
          Добавить
        </Button>
      </div>

      {pets.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <Icon name="Dog" size={64} className="mx-auto mb-4 text-gray-300" />
          <p className="text-gray-600 mb-4">У вас пока нет питомцев</p>
          <Button
            onClick={onAddNew}
            className="bg-gradient-to-r from-pink-600 to-orange-600"
          >
            Добавить первого питомца
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {pets.map((pet) => (
            <div
              key={pet.id}
              className={`bg-white border-2 rounded-xl p-4 transition-all ${
                pet.is_active ? 'border-pink-200' : 'border-gray-200 opacity-60'
              }`}
            >
              <div className="flex gap-4">
                <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  {pet.photo_url ? (
                    <img
                      src={pet.photo_url}
                      alt={pet.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Icon name="Dog" size={32} className="text-gray-400" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        {pet.name}
                        {pet.passport_verified && (
                          <Icon
                            name="BadgeCheck"
                            size={18}
                            className="text-blue-500"
                          />
                        )}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {pet.breed && `${pet.breed}`}
                        {pet.age && `, ${pet.age} лет`}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => onEdit(pet)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Редактировать"
                      >
                        <Icon name="Pencil" size={18} className="text-gray-600" />
                      </button>
                      <button
                        onClick={() => onDelete(pet.id)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                        title="Удалить"
                      >
                        <Icon name="Trash2" size={18} className="text-red-600" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      {pet.breeding_price && (
                        <span className="font-semibold text-pink-600">
                          {pet.breeding_price.toLocaleString()} ₽
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => onToggleActive(pet.id, pet.is_active ?? true)}
                      className={`text-sm px-3 py-1 rounded-full transition-colors ${
                        pet.is_active
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {pet.is_active ? 'Активно' : 'Неактивно'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
