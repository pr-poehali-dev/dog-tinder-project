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
  const [offsetY, setOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const handlers = useSwipeable({
    onSwiping: (eventData) => {
      setIsDragging(true);
      setOffsetX(eventData.deltaX);
      setOffsetY(eventData.deltaY * 0.2);
      
      if (eventData.deltaX > 80) {
        setSwipeDirection('right');
      } else if (eventData.deltaX < -80) {
        setSwipeDirection('left');
      } else {
        setSwipeDirection(null);
      }
    },
    onSwiped: (eventData) => {
      setIsDragging(false);
      
      if (Math.abs(eventData.deltaX) > 120) {
        setIsExiting(true);
        setOffsetX(eventData.deltaX > 0 ? 1000 : -1000);
        
        setTimeout(() => {
          if (eventData.deltaX > 0) {
            onSwipeRight(pet.id);
          } else {
            onSwipeLeft(pet.id);
          }
          setIsExiting(false);
          setOffsetX(0);
          setOffsetY(0);
          setSwipeDirection(null);
        }, 300);
      } else {
        setOffsetX(0);
        setOffsetY(0);
        setSwipeDirection(null);
      }
    },
    trackMouse: true,
    trackTouch: true,
  });

  const rotation = offsetX * 0.08;
  const scale = isDragging ? 1.05 : 1;
  const opacity = Math.max(0.3, 1 - Math.abs(offsetX) / 500);
  const labelOpacity = Math.min(1, Math.abs(offsetX) / 100);

  return (
    <div
      {...handlers}
      className="absolute top-0 left-0 w-full cursor-grab active:cursor-grabbing touch-none"
      style={{
        transform: `translateX(${offsetX}px) translateY(${offsetY}px) rotate(${rotation}deg) scale(${scale})`,
        transition: isDragging || isExiting ? 'none' : 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
        opacity,
        ...style,
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-sm mx-auto relative">
        {/* Иконки LIKE / NOPE */}
        {swipeDirection === 'right' && (
          <div 
            className="absolute top-8 left-8 z-20 pointer-events-none"
            style={{ opacity: labelOpacity }}
          >
            <div className="relative">
              <div className="absolute inset-0 blur-2xl">
                <Icon name="Heart" size={120} className="text-pink-500 animate-ping" />
              </div>
              <div className="relative">
                <Icon name="Heart" size={120} className="text-pink-500 fill-pink-500 animate-pulse drop-shadow-2xl" style={{
                  filter: 'drop-shadow(0 0 20px rgba(236, 72, 153, 0.8))'
                }} />
              </div>
            </div>
          </div>
        )}
        {swipeDirection === 'left' && (
          <div 
            className="absolute top-8 right-8 z-20 pointer-events-none"
            style={{ opacity: labelOpacity }}
          >
            <div className="relative">
              <div className="absolute inset-0 blur-2xl">
                <Icon name="X" size={120} className="text-red-500 animate-ping" />
              </div>
              <div className="relative">
                <Icon name="X" size={120} className="text-red-500 stroke-[4] animate-pulse drop-shadow-2xl" style={{
                  filter: 'drop-shadow(0 0 20px rgba(239, 68, 68, 0.8))'
                }} />
              </div>
            </div>
          </div>
        )}

        {/* Фоновое свечение */}
        {swipeDirection === 'right' && (
          <div 
            className="absolute inset-0 z-10 bg-green-400/20 pointer-events-none transition-opacity duration-200"
            style={{ opacity: labelOpacity * 0.5 }}
          />
        )}
        {swipeDirection === 'left' && (
          <div 
            className="absolute inset-0 z-10 bg-red-400/20 pointer-events-none transition-opacity duration-200"
            style={{ opacity: labelOpacity * 0.5 }}
          />
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