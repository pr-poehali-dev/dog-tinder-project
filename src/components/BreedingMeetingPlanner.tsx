import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';

interface BreedingMeetingPlannerProps {
  withVet: boolean;
  onSubmit: (data: {
    date: string;
    time: string;
    location: 'male_home' | 'neutral';
    address?: string;
  }) => void;
  onBack: () => void;
}

export default function BreedingMeetingPlanner({
  withVet,
  onSubmit,
  onBack,
}: BreedingMeetingPlannerProps) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState<'male_home' | 'neutral' | null>(null);
  const [address, setAddress] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time || !location) return;

    onSubmit({
      date,
      time,
      location,
      address: location === 'neutral' ? address : undefined,
    });
  };

  const minDate = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Планирование встречи</h2>
        <p className="text-gray-600">Выберите дату, время и место проведения вязки</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-pink-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Icon name="Calendar" size={20} className="text-pink-600" />
            Дата и время
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Дата встречи
              </label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={minDate}
                required
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Время
              </label>
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
                className="w-full"
              />
            </div>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Icon name="MapPin" size={20} className="text-blue-600" />
            Место встречи
          </h3>
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setLocation('male_home')}
              className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                location === 'male_home'
                  ? 'border-blue-600 bg-blue-100'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  name="Home"
                  size={24}
                  className={location === 'male_home' ? 'text-blue-600' : 'text-gray-600'}
                />
                <div>
                  <div className="font-semibold text-gray-800">Дом самца</div>
                  <div className="text-sm text-gray-600">
                    Собаки обычно чувствуют себя увереннее на своей территории
                  </div>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setLocation('neutral')}
              className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                location === 'neutral'
                  ? 'border-blue-600 bg-blue-100'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  name="MapPinned"
                  size={24}
                  className={location === 'neutral' ? 'text-blue-600' : 'text-gray-600'}
                />
                <div>
                  <div className="font-semibold text-gray-800">Нейтральная территория</div>
                  <div className="text-sm text-gray-600">
                    Парк, ветклиника или другое согласованное место
                  </div>
                </div>
              </div>
            </button>

            {location === 'neutral' && (
              <div className="pt-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Адрес места встречи
                </label>
                <Input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Укажите адрес или название места"
                  required
                  className="w-full"
                />
              </div>
            )}
          </div>
        </div>

        {withVet && (
          <div className="bg-green-50 rounded-lg p-4 flex items-start gap-3">
            <Icon name="Info" size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-gray-700">
              <p className="font-semibold mb-1">Сопровождение ветеринара подключено</p>
              <p>На следующем шаге вы сможете выбрать специалиста из списка</p>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={onBack} className="flex-1">
            <Icon name="ArrowLeft" size={20} />
            Назад
          </Button>
          <Button
            type="submit"
            disabled={!date || !time || !location}
            className="flex-1 bg-gradient-to-r from-pink-600 to-orange-600"
          >
            {withVet ? 'Выбрать ветеринара' : 'Создать процесс'}
            <Icon name="ArrowRight" size={20} />
          </Button>
        </div>
      </form>
    </div>
  );
}
