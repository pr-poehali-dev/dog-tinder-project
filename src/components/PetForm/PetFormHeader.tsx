import Icon from '@/components/ui/icon';

interface PetFormHeaderProps {
  isEditing: boolean;
  onCancel: () => void;
}

export default function PetFormHeader({ isEditing, onCancel }: PetFormHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-2xl font-bold text-gray-800">
        {isEditing ? 'Редактировать питомца' : 'Добавить питомца'}
      </h2>
      <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
        <Icon name="X" size={24} />
      </button>
    </div>
  );
}
