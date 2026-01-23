import { useState } from 'react';
import { useSwipeable } from 'react-swipeable';
import Icon from '@/components/ui/icon';
import { Badge } from '@/components/ui/badge';

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
  owner_name?: string;
  owner_city?: string;
  created_at?: string;
}

interface SwipeCardProps {
  pet: Pet;
  onSwipeLeft: (petId: number) => void;
  onSwipeRight: (petId: number) => void;
  style?: React.CSSProperties;
}

export default function SwipeCard({ pet, onSwipeLeft, onSwipeRight, style }: SwipeCardProps) {
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [offsetX, setOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const handlers = useSwipeable({
    onSwiping: (eventData) => {
      setIsDragging(true);
      setOffsetX(eventData.deltaX);
      
      if (eventData.deltaX > 50) {
        setSwipeDirection('right');
      } else if (eventData.deltaX < -50) {
        setSwipeDirection('left');
      } else {
        setSwipeDirection(null);
      }
    },
    onSwiped: (eventData) => {
      setIsDragging(false);
      
      if (eventData.deltaX > 100) {
        onSwipeRight(pet.id);
      } else if (eventData.deltaX < -100) {
        onSwipeLeft(pet.id);
      }
      
      setOffsetX(0);
      setSwipeDirection(null);
    },
    trackMouse: true,
    trackTouch: true,
  });

  const rotation = offsetX * 0.05;
  const opacity = 1 - Math.abs(offsetX) / 400;

  return (
    <div
      {...handlers}
      className="absolute top-0 left-0 w-full cursor-grab active:cursor-grabbing"
      style={{
        transform: `translateX(${offsetX}px) rotate(${rotation}deg)`,
        transition: isDragging ? 'none' : 'transform 0.3s ease-out',
        opacity: isDragging ? opacity : 1,
        ...style,
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-sm mx-auto">
        {/* Индикаторы свайпа */}
        {swipeDirection === 'right' && (
          <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
            <div className="animate-ping absolute inline-flex h-32 w-32 rounded-full bg-green-400 opacity-75"></div>
            <div className="text-9xl animate-bounce">❤️</div>
          </div>
        )}
        {swipeDirection === 'left' && (
          <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
            <div className="animate-ping absolute inline-flex h-32 w-32 rounded-full bg-red-400 opacity-75"></div>
            <div className="text-9xl animate-pulse">💔</div>
          </div>
        )}

        {/* Фото */}
        <div className="relative h-96">
          {pet.photo_url ? (
            <img
              src={pet.photo_url}
              alt={pet.name}
              className="w-full h-full object-cover"
              draggable={false}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-pink-200 to-orange-200 flex items-center justify-center">
              <Icon name="Dog" size={96} className="text-white opacity-50" />
            </div>
          )}
          
          {pet.verification_paid && (
            <Badge className="absolute top-4 right-4 bg-green-500 text-white">
              <Icon name="ShieldCheck" size={14} className="mr-1" />
              Проверен
            </Badge>
          )}

          {/* Градиент снизу */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/70 to-transparent" />
        </div>

        {/* Информация */}
        <div className="p-6 -mt-24 relative z-10">
          <div className="mb-4">
            <h3 className="text-3xl font-bold text-white drop-shadow-lg">
              {pet.name}
              {pet.age && `, ${pet.age}`}
            </h3>
            {pet.breed && (
              <p className="text-lg text-white/90 drop-shadow-lg">{pet.breed}</p>
            )}
          </div>

          <div className="bg-white rounded-xl p-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              {pet.gender && (
                <Badge variant="secondary" className="text-sm">
                  {pet.gender === 'male' ? '♂ Кобель' : '♀ Сука'}
                </Badge>
              )}
              {pet.rank && (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-sm">
                  🏆 {pet.rank}
                </Badge>
              )}
            </div>

            {(pet.city || pet.owner_city) && (
              <div className="flex items-center gap-2 text-gray-700">
                <Icon name="MapPin" size={16} />
                <span className="text-sm font-medium">{pet.city || pet.owner_city}</span>
              </div>
            )}

            {pet.description && (
              <p className="text-sm text-gray-600 leading-relaxed">{pet.description}</p>
            )}

            {pet.owner_name && (
              <div className="pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">Владелец: {pet.owner_name}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}