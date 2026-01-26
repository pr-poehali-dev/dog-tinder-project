import { useState } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface BreedingServiceSelectionProps {
  onSelect: (withVet: boolean) => void;
  onBack: () => void;
}

export default function BreedingServiceSelection({
  onSelect,
  onBack,
}: BreedingServiceSelectionProps) {
  const [selected, setSelected] = useState<boolean | null>(null);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Выберите формат вязки</h2>
        <p className="text-gray-600">Хотите добавить сопровождение ветеринара?</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <button
          onClick={() => setSelected(false)}
          className={`p-6 rounded-xl border-2 transition-all text-left ${
            selected === false
              ? 'border-pink-600 bg-pink-50'
              : 'border-gray-200 hover:border-pink-300'
          }`}
        >
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center">
              <Icon name="Users" size={24} className="text-pink-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-800 mb-1">Без ветеринара</h3>
              <p className="text-sm text-gray-600 mb-3">
                Самостоятельная организация вязки между владельцами
              </p>
              <div className="flex items-center gap-2 text-pink-600 font-semibold">
                <Icon name="Check" size={18} />
                Бесплатно
              </div>
            </div>
          </div>
        </button>

        <button
          onClick={() => setSelected(true)}
          className={`p-6 rounded-xl border-2 transition-all text-left ${
            selected === true
              ? 'border-blue-600 bg-blue-50'
              : 'border-gray-200 hover:border-blue-300'
          }`}
        >
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Icon name="Stethoscope" size={24} className="text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-800 mb-1">С ветеринаром</h3>
              <p className="text-sm text-gray-600 mb-3">
                Профессиональное сопровождение специалиста на всех этапах
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Icon name="Check" size={16} className="text-green-600" />
                  Консультация перед вязкой
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Icon name="Check" size={16} className="text-green-600" />
                  Присутствие при встрече
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Icon name="Check" size={16} className="text-green-600" />
                  Проверка здоровья питомцев
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Icon name="Check" size={16} className="text-green-600" />
                  Рекомендации по уходу
                </div>
                <div className="flex items-center gap-2 text-blue-600 font-semibold mt-3">
                  <Icon name="CreditCard" size={18} />
                  7 500 ₽
                </div>
              </div>
            </div>
          </div>
        </button>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} className="flex-1">
          <Icon name="ArrowLeft" size={20} />
          Назад
        </Button>
        <Button
          onClick={() => selected !== null && onSelect(selected)}
          disabled={selected === null}
          className="flex-1 bg-gradient-to-r from-pink-600 to-orange-600"
        >
          Продолжить
          <Icon name="ArrowRight" size={20} />
        </Button>
      </div>
    </div>
  );
}
