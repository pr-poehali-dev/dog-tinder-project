import { useState } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface Veterinarian {
  id: number;
  name: string;
  clinic: string;
  rating: number;
  experience: string;
  photo?: string;
}

interface VeterinarianSelectorProps {
  onSelect: (vetId: number) => void;
  onBack: () => void;
}

const SAMPLE_VETS: Veterinarian[] = [
  {
    id: 1,
    name: 'Елена Иванова',
    clinic: 'Ветклиника "Айболит"',
    rating: 4.9,
    experience: '12 лет опыта',
  },
  {
    id: 2,
    name: 'Дмитрий Петров',
    clinic: 'Центр ветеринарии "ПроВет"',
    rating: 4.8,
    experience: '8 лет опыта',
  },
  {
    id: 3,
    name: 'Мария Сидорова',
    clinic: 'Ветеринарная клиника "Друг"',
    rating: 5.0,
    experience: '15 лет опыта',
  },
];

export default function VeterinarianSelector({
  onSelect,
  onBack,
}: VeterinarianSelectorProps) {
  const [selectedVet, setSelectedVet] = useState<number | null>(null);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Выбор ветеринара</h2>
        <p className="text-gray-600">Выберите специалиста для сопровождения вязки</p>
      </div>

      <div className="space-y-3">
        {SAMPLE_VETS.map((vet) => (
          <button
            key={vet.id}
            onClick={() => setSelectedVet(vet.id)}
            className={`w-full p-5 rounded-xl border-2 transition-all text-left ${
              selectedVet === vet.id
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Icon name="User" size={28} className="text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-lg font-bold text-gray-800">{vet.name}</h3>
                  <div className="flex items-center gap-1 text-yellow-500">
                    <Icon name="Star" size={16} className="fill-yellow-500" />
                    <span className="text-sm font-semibold text-gray-700">{vet.rating}</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-2">{vet.clinic}</p>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Icon name="Award" size={14} className="text-blue-600" />
                    {vet.experience}
                  </div>
                  <div className="flex items-center gap-1">
                    <Icon name="Stethoscope" size={14} className="text-blue-600" />
                    Специалист по репродукции
                  </div>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="bg-blue-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
          <Icon name="Info" size={18} className="text-blue-600" />
          Что входит в услугу
        </h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex gap-2">
            <Icon name="Check" size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
            Предварительная консультация и осмотр обеих собак
          </li>
          <li className="flex gap-2">
            <Icon name="Check" size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
            Присутствие при вязке и профессиональная помощь
          </li>
          <li className="flex gap-2">
            <Icon name="Check" size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
            Рекомендации по уходу после вязки
          </li>
          <li className="flex gap-2">
            <Icon name="Check" size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
            Консультация по телефону в течение месяца
          </li>
        </ul>
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1">
          <Icon name="ArrowLeft" size={20} />
          Назад
        </Button>
        <Button
          onClick={() => selectedVet && onSelect(selectedVet)}
          disabled={!selectedVet}
          className="flex-1 bg-gradient-to-r from-pink-600 to-orange-600"
        >
          Создать процесс
          <Icon name="Check" size={20} />
        </Button>
      </div>
    </div>
  );
}
