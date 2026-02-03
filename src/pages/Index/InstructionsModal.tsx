import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';

interface InstructionsModalProps {
  onClose: () => void;
}

export default function InstructionsModal({ onClose }: InstructionsModalProps) {
  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 animate-in fade-in zoom-in duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon name="Heart" size={32} className="text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800">Как пользоваться?</h3>
        </div>

        <div className="space-y-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">💔</span>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-1">Свайп влево</h4>
              <p className="text-sm text-gray-600">Пропустить питомца. Перетащите карточку влево или смахните пальцем.</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">❤️</span>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-1">Свайп вправо</h4>
              <p className="text-sm text-gray-600">Лайкнуть питомца. Перетащите карточку вправо или смахните пальцем.</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Icon name="Hand" size={24} className="text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-1">Совет</h4>
              <p className="text-sm text-gray-600">Можно использовать мышку на компьютере или свайпать пальцем на телефоне!</p>
            </div>
          </div>
        </div>

        <Button 
          onClick={onClose}
          className="w-full bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600"
          size="lg"
        >
          Понятно!
        </Button>
      </div>
    </div>
  );
}
