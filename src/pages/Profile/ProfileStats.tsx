import Icon from '@/components/ui/icon';

interface ProfileStatsProps {
  petsCount: number;
  memberSince: string;
}

export default function ProfileStats({ petsCount, memberSince }: ProfileStatsProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
    });
  };

  return (
    <div className="grid grid-cols-2 gap-4 mb-8">
      <div className="bg-pink-50 rounded-xl p-4 text-center">
        <Icon name="Heart" size={24} className="mx-auto mb-2 text-pink-600" />
        <div className="text-2xl font-bold text-gray-800">{petsCount}</div>
        <div className="text-sm text-gray-600">Питомцев</div>
      </div>
      <div className="bg-orange-50 rounded-xl p-4 text-center">
        <Icon name="Calendar" size={24} className="mx-auto mb-2 text-orange-600" />
        <div className="text-sm font-medium text-gray-800">
          {formatDate(memberSince)}
        </div>
        <div className="text-sm text-gray-600">С нами с</div>
      </div>
    </div>
  );
}
