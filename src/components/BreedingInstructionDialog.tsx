import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface BreedingInstructionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartBreeding: () => void;
}

export default function BreedingInstructionDialog({
  open,
  onOpenChange,
  onStartBreeding,
}: BreedingInstructionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Icon name="Heart" size={28} className="text-pink-600" />
            Процесс вязки
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-pink-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Icon name="Info" size={20} className="text-pink-600" />
              Как проходит вязка
            </h3>
            <div className="space-y-3 text-sm text-gray-700">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-pink-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  1
                </div>
                <p>
                  <span className="font-semibold">Планирование:</span> Договоритесь о дате, времени и месте встречи. Выберите, нужно ли сопровождение ветеринара.
                </p>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-pink-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  2
                </div>
                <p>
                  <span className="font-semibold">Знакомство:</span> Собаки должны познакомиться и привыкнуть друг к другу на нейтральной территории.
                </p>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-pink-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  3
                </div>
                <p>
                  <span className="font-semibold">Вязка:</span> Процесс под контролем владельцев (и ветеринара, если выбрана услуга).
                </p>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-pink-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  4
                </div>
                <p>
                  <span className="font-semibold">Контрольная вязка:</span> Рекомендуется через 24-48 часов для повышения шансов на беременность.
                </p>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-pink-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  5
                </div>
                <p>
                  <span className="font-semibold">Завершение:</span> Отметьте завершение процесса и обменяйтесь контактами для дальнейшей связи.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <Icon name="AlertCircle" size={18} className="text-blue-600" />
              Важно знать
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex gap-2">
                <Icon name="Check" size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
                Вязка проводится на 11-15 день течки суки
              </li>
              <li className="flex gap-2">
                <Icon name="Check" size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
                Перед вязкой оба питомца должны быть здоровы и привиты
              </li>
              <li className="flex gap-2">
                <Icon name="Check" size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
                Рекомендуется заключить письменный договор между владельцами
              </li>
              <li className="flex gap-2">
                <Icon name="Check" size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
                Сопровождение ветеринара повышает успешность вязки
              </li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Отмена
            </Button>
            <Button
              onClick={() => {
                onStartBreeding();
                onOpenChange(false);
              }}
              className="flex-1 bg-gradient-to-r from-pink-600 to-orange-600"
            >
              <Icon name="Play" size={20} />
              Начать вязку
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}