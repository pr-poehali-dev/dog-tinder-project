import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import SwipeCard from '@/components/SwipeCard';

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
  owner_name?: string;
  owner_city?: string;
  created_at?: string;
}

interface SwipeViewProps {
  user: { id: number } | null;
  displayedPets: Pet[];
  currentCardIndex: number;
  isLoading: boolean;
  onSwipeLeft: (petId: number) => void;
  onSwipeRight: (petId: number) => void;
  onRestart: () => void;
  onShowInstructions: () => void;
  onLoginClick: () => void;
  onToggleFilters: () => void;
}

export default function SwipeView({
  user,
  displayedPets,
  currentCardIndex,
  isLoading,
  onSwipeLeft,
  onSwipeRight,
  onRestart,
  onShowInstructions,
  onLoginClick,
  onToggleFilters,
}: SwipeViewProps) {
  const currentCard = displayedPets[currentCardIndex];
  const nextCards = displayedPets.slice(currentCardIndex + 1, currentCardIndex + 3);

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <Button
          variant="outline"
          onClick={onToggleFilters}
          className="gap-2"
        >
          <Icon name="SlidersHorizontal" size={20} />
          Фильтры
        </Button>
        
        <div className="flex items-center gap-2">
          {!user && (
            <Button
              variant="outline"
              size="sm"
              onClick={onLoginClick}
              className="gap-2"
            >
              <Icon name="LogIn" className="w-4 h-4" />
              Войти
            </Button>
          )}
        </div>
      </div>
      {isLoading ? (
        <div className="text-center py-20">
          <Icon name="Loader2" size={48} className="animate-spin text-pink-600 mx-auto" />
          <p className="text-gray-600 mt-4">Загрузка питомцев...</p>
        </div>
      ) : displayedPets.length === 0 ? (
        <div className="text-center py-20">
          <Icon name="Dog" size={64} className="mx-auto mb-4 text-gray-300" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Нет питомцев</h2>
          <p className="text-gray-600 mb-4">Попробуйте изменить фильтры или добавьте своего питомца</p>
          <Button onClick={() => (window.location.href = '/profile')}>
            Добавить питомца
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          {currentCardIndex >= displayedPets.length ? (
            <div className="text-center py-20">
              <Icon name="CheckCircle" size={64} className="mx-auto mb-4 text-green-500" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Вы просмотрели всех!</h2>
              <p className="text-gray-600 mb-4">Попробуйте изменить фильтры или зайдите позже</p>
              <Button onClick={onRestart}>
                Начать сначала
              </Button>
            </div>
          ) : (
            <>
              <div className="relative w-full max-w-sm h-[600px] mb-8">
                {nextCards.map((pet, index) => (
                  <div
                    key={pet.id}
                    className="absolute top-0 left-0 w-full pointer-events-none"
                    style={{
                      transform: `scale(${1 - index * 0.05}) translateY(${index * 10}px)`,
                      zIndex: 10 - index,
                      opacity: 1 - index * 0.3,
                    }}
                  >
                    <SwipeCard
                      pet={pet}
                      onSwipeLeft={onSwipeLeft}
                      onSwipeRight={onSwipeRight}
                    />
                  </div>
                )).reverse()}
                
                {currentCard && (
                  <SwipeCard
                    pet={currentCard}
                    onSwipeLeft={onSwipeLeft}
                    onSwipeRight={onSwipeRight}
                    style={{ zIndex: 20 }}
                  />
                )}
              </div>

              <div className="mt-6 text-center space-y-3">
                <p className="text-sm text-gray-500">
                  {currentCardIndex + 1} / {displayedPets.length}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-gray-400 hover:text-gray-600"
                  onClick={onShowInstructions}
                >
                  <Icon name="Info" size={14} className="mr-1" />
                  Как пользоваться?
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </main>
  );
}
