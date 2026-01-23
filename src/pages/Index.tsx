import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNotifications } from '@/hooks/useNotifications';
import { requestNotificationPermission } from '@/utils/notifications';
import SwipeCard from '@/components/SwipeCard';

const PETS_API_URL = 'https://functions.poehali.dev/2a5a65c0-df1b-4023-980c-b0601b7c462c';
const LIKES_API_URL = 'https://functions.poehali.dev/4e6641e2-0060-48bf-8259-7b7f08c84498';

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

export default function Index() {
  const [user, setUser] = useState<{id: number} | null>(null);
  const [myPetId, setMyPetId] = useState<number | null>(null);
  const [likedPets, setLikedPets] = useState<Set<number>>(new Set());
  const [pets, setPets] = useState<Pet[]>([]);
  const [filteredPets, setFilteredPets] = useState<Pet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    city: '',
    gender: '',
    breed: '',
    rank: '',
    minAge: 0,
    maxAge: 15,
    maxDistance: 100,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'swipe'>('swipe');
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const { counts } = useNotifications(user?.id || null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      loadMyPet(userData.id);
      loadMyLikes(userData.id);
      requestNotificationPermission();
    }
    loadPets();
  }, []);

  const loadMyPet = async (userId: number) => {
    try {
      const response = await fetch(`${PETS_API_URL}?user_id=${userId}`);
      const data = await response.json();
      if (data.length > 0) {
        setMyPetId(data[0].id);
      }
    } catch (error) {
      console.error('Failed to load my pet:', error);
    }
  };

  const loadMyLikes = async (userId: number) => {
    try {
      const response = await fetch(`${LIKES_API_URL}?action=outgoing&user_id=${userId}`);
      const data = await response.json();
      const likedIds = new Set(data.map((like: any) => like.to_pet_id));
      setLikedPets(likedIds);
    } catch (error) {
      console.error('Failed to load likes:', error);
    }
  };

  const handleLike = async (petId: number) => {
    if (!myPetId || !user) return;

    try {
      const response = await fetch(LIKES_API_URL, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({from_pet_id: myPetId, to_pet_id: petId})
      });
      const data = await response.json();
      
      if (data.success) {
        setLikedPets(prev => new Set([...prev, petId]));
        if (data.is_match) {
          alert('🎉 Взаимная симпатия! Теперь вы можете писать друг другу!');
        }
      }
    } catch (error) {
      console.error('Failed to like:', error);
    }
  };

  const handleUnlike = async (petId: number) => {
    if (!myPetId) return;

    try {
      await fetch(LIKES_API_URL, {
        method: 'DELETE',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({from_pet_id: myPetId, to_pet_id: petId})
      });
      setLikedPets(prev => {
        const newSet = new Set(prev);
        newSet.delete(petId);
        return newSet;
      });
    } catch (error) {
      console.error('Failed to unlike:', error);
    }
  };

  const handleSwipeLeft = (petId: number) => {
    setCurrentCardIndex(prev => prev + 1);
  };

  const handleSwipeRight = async (petId: number) => {
    await handleLike(petId);
    setCurrentCardIndex(prev => prev + 1);
  };

  const getDisplayedPets = () => {
    if (!user || !myPetId) return filteredPets;
    return filteredPets.filter(pet => pet.id !== myPetId);
  };

  const displayedPets = getDisplayedPets();
  const currentCard = displayedPets[currentCardIndex];
  const nextCards = displayedPets.slice(currentCardIndex + 1, currentCardIndex + 3);

  useEffect(() => {
    applyFilters();
  }, [filters, pets]);

  const loadPets = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(PETS_API_URL);
      const data = await response.json();
      setPets(data);
    } catch (error) {
      console.error('Failed to load pets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...pets];

    if (filters.city) {
      filtered = filtered.filter(
        (pet) =>
          pet.city?.toLowerCase().includes(filters.city.toLowerCase()) ||
          pet.owner_city?.toLowerCase().includes(filters.city.toLowerCase())
      );
    }

    if (filters.gender) {
      filtered = filtered.filter((pet) => pet.gender === filters.gender);
    }

    if (filters.breed) {
      filtered = filtered.filter((pet) =>
        pet.breed?.toLowerCase().includes(filters.breed.toLowerCase())
      );
    }

    if (filters.rank) {
      filtered = filtered.filter((pet) =>
        pet.rank?.toLowerCase().includes(filters.rank.toLowerCase())
      );
    }

    if (filters.minAge > 0 || filters.maxAge < 15) {
      filtered = filtered.filter((pet) => {
        if (!pet.age) return false;
        return pet.age >= filters.minAge && pet.age <= filters.maxAge;
      });
    }

    setFilteredPets(filtered);
  };

  const resetFilters = () => {
    setFilters({
      city: '',
      gender: '',
      breed: '',
      rank: '',
      minAge: 0,
      maxAge: 15,
      maxDistance: 100,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-pink-500 to-orange-500 p-2 rounded-xl">
                <Icon name="Heart" size={28} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-orange-600 bg-clip-text text-transparent">
                TinDog
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" className="relative" onClick={() => (window.location.href = '/likes')}>
                <Icon name="Heart" size={24} />
                {(counts.newLikes > 0 || counts.newMatches > 0) && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {counts.newLikes + counts.newMatches}
                  </span>
                )}
              </Button>
              <Button variant="ghost" className="relative" onClick={() => (window.location.href = '/chats')}>
                <Icon name="MessageCircle" size={24} />
                {counts.unreadMessages > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {counts.unreadMessages}
                  </span>
                )}
              </Button>
              <Button variant="ghost" onClick={() => (window.location.href = '/profile')}>
                <Icon name="User" size={24} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {showFilters && (
        <div className="bg-white border-b shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Город</label>
                <input
                  type="text"
                  value={filters.city}
                  onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="Москва"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Порода</label>
                <input
                  type="text"
                  value={filters.breed}
                  onChange={(e) => setFilters({ ...filters, breed: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="Лабрадор"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Пол</label>
                <select
                  value={filters.gender}
                  onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  <option value="">Любой</option>
                  <option value="male">Кобель</option>
                  <option value="female">Сука</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ранг/Титул</label>
                <input
                  type="text"
                  value={filters.rank}
                  onChange={(e) => setFilters({ ...filters, rank: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="Чемпион"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Возраст: {filters.minAge} - {filters.maxAge} лет
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0"
                    max="15"
                    value={filters.minAge}
                    onChange={(e) => setFilters({ ...filters, minAge: Number(e.target.value) })}
                    className="flex-1"
                  />
                  <input
                    type="range"
                    min="0"
                    max="15"
                    value={filters.maxAge}
                    onChange={(e) => setFilters({ ...filters, maxAge: Number(e.target.value) })}
                    className="flex-1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Расстояние: до {filters.maxDistance} км
                </label>
                <input
                  type="range"
                  min="10"
                  max="500"
                  step="10"
                  value={filters.maxDistance}
                  onChange={(e) => setFilters({ ...filters, maxDistance: Number(e.target.value) })}
                  className="w-full"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button variant="outline" onClick={resetFilters} className="flex-1">
                Сбросить
              </Button>
              <Button onClick={() => setShowFilters(false)} className="flex-1">
                Применить
              </Button>
            </div>
          </div>
        </div>
      )}

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <Icon name="SlidersHorizontal" size={20} />
            Фильтры
          </Button>
          

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
                <Button onClick={() => setCurrentCardIndex(0)}>
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
                        onSwipeLeft={handleSwipeLeft}
                        onSwipeRight={handleSwipeRight}
                      />
                    </div>
                  )).reverse()}
                  
                  {currentCard && (
                    <SwipeCard
                      pet={currentCard}
                      onSwipeLeft={handleSwipeLeft}
                      onSwipeRight={handleSwipeRight}
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
                    onClick={() => {
                      alert('Свайпайте карточки:\n\n← Влево — пропустить (💔)\n→ Вправо — лайкнуть (❤️)\n\nИли просто перетаскивайте карточку пальцем/мышкой!');
                    }}
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

      <footer className="bg-white border-t mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-gray-600">
          <p>© 2026 TinDog - Больше, чем просто знакомство 🐾</p>
        </div>
      </footer>
    </div>
  );
}