import { useState, useEffect } from 'react';
import { useSwipeable } from 'react-swipeable';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const PETS_API_URL = 'https://functions.poehali.dev/2a5a65c0-df1b-4023-980c-b0601b7c462c';

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
  const [pets, setPets] = useState<Pet[]>([]);
  const [filteredPets, setFilteredPets] = useState<Pet[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    city: '',
    gender: '',
    minAge: '',
    maxAge: '',
    breed: '',
    verifiedOnly: false,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<string>('');
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    loadPets();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, pets]);

  const loadPets = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(PETS_API_URL);
      const data = await response.json();
      setPets(data);
      setCurrentIndex(0);
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

    if (filters.minAge) {
      filtered = filtered.filter((pet) => (pet.age || 0) >= parseInt(filters.minAge));
    }

    if (filters.maxAge) {
      filtered = filtered.filter((pet) => (pet.age || 0) <= parseInt(filters.maxAge));
    }

    if (filters.verifiedOnly) {
      filtered = filtered.filter((pet) => pet.verification_paid);
    }

    setFilteredPets(filtered);
    setCurrentIndex(0);
  };

  const resetFilters = () => {
    setFilters({
      city: '',
      gender: '',
      minAge: '',
      maxAge: '',
      breed: '',
      verifiedOnly: false,
    });
  };

  const handleSwipe = (direction: 'left' | 'right') => {
    if (isAnimating || currentIndex >= filteredPets.length) return;
    
    setIsAnimating(true);
    setSwipeDirection(direction);
    
    setTimeout(() => {
      setCurrentIndex(currentIndex + 1);
      setSwipeDirection('');
      setIsAnimating(false);
    }, 300);
  };

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => handleSwipe('left'),
    onSwipedRight: () => handleSwipe('right'),
    trackMouse: true,
    preventScrollOnSwipe: true,
  });

  const currentPet = filteredPets[currentIndex];
  const canSwipe = currentIndex < filteredPets.length;

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
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2"
              >
                <Icon name="SlidersHorizontal" size={20} />
                Фильтры
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Возраст от</label>
                <input
                  type="number"
                  value={filters.minAge}
                  onChange={(e) => setFilters({ ...filters, minAge: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Возраст до</label>
                <input
                  type="number"
                  value={filters.maxAge}
                  onChange={(e) => setFilters({ ...filters, maxAge: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="10"
                />
              </div>

              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.verifiedOnly}
                    onChange={(e) => setFilters({ ...filters, verifiedOnly: e.target.checked })}
                    className="w-5 h-5"
                  />
                  <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                    <Icon name="ShieldCheck" size={16} className="text-green-600" />
                    Только с проверкой
                  </span>
                </label>
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

      <main className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        {isLoading ? (
          <div className="text-center py-20">
            <Icon name="Loader2" size={48} className="animate-spin text-pink-600 mx-auto" />
            <p className="text-gray-600 mt-4">Загрузка питомцев...</p>
          </div>
        ) : filteredPets.length === 0 ? (
          <div className="text-center py-20">
            <Icon name="Dog" size={64} className="mx-auto mb-4 text-gray-300" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Нет питомцев</h2>
            <p className="text-gray-600 mb-4">Попробуйте изменить фильтры или добавьте своего питомца</p>
            <Button onClick={() => (window.location.href = '/profile')}>
              Добавить питомца
            </Button>
          </div>
        ) : !canSwipe ? (
          <div className="text-center py-20">
            <Icon name="Heart" size={64} className="mx-auto mb-4 text-pink-300" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Питомцы закончились!</h2>
            <p className="text-gray-600 mb-4">Попробуйте изменить фильтры или вернитесь позже</p>
            <Button onClick={resetFilters}>
              Сбросить фильтры
            </Button>
          </div>
        ) : (
          <>
            <div 
              {...swipeHandlers}
              className="relative w-full max-w-md h-[600px] mb-8 cursor-grab active:cursor-grabbing"
            >
              <div
                className={`w-full h-full transition-all duration-300 ${
                  swipeDirection === 'left' 
                    ? '-translate-x-[150%] rotate-[-30deg]' 
                    : swipeDirection === 'right'
                    ? 'translate-x-[150%] rotate-[30deg]'
                    : 'translate-x-0 rotate-0'
                }`}
              >
                <div className="relative w-full h-full bg-white rounded-2xl shadow-2xl overflow-hidden">
                  {currentPet?.photo_url ? (
                    <img
                      src={currentPet.photo_url}
                      alt={currentPet.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-pink-200 to-orange-200 flex items-center justify-center">
                      <Icon name="Dog" size={120} className="text-white opacity-50" />
                    </div>
                  )}
                  
                  {currentPet?.verification_paid && (
                    <Badge className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1">
                      <Icon name="ShieldCheck" size={16} className="mr-1" />
                      Проверен
                    </Badge>
                  )}

                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-6 text-white">
                    <h2 className="text-3xl font-bold mb-2">
                      {currentPet?.name}
                      {currentPet?.age && `, ${currentPet.age}`}
                    </h2>
                    
                    {currentPet?.breed && (
                      <p className="text-lg mb-2">{currentPet.breed}</p>
                    )}

                    <div className="flex flex-wrap gap-2 mb-2">
                      {currentPet?.gender && (
                        <Badge variant="secondary" className="bg-white/20 text-white border-0">
                          {currentPet.gender === 'male' ? '🐕 Кобель' : '🐕 Сука'}
                        </Badge>
                      )}
                      {currentPet?.rank && (
                        <Badge variant="secondary" className="bg-white/20 text-white border-0">
                          🏆 {currentPet.rank}
                        </Badge>
                      )}
                    </div>

                    {(currentPet?.city || currentPet?.owner_city) && (
                      <div className="flex items-center gap-1 text-sm mb-2">
                        <Icon name="MapPin" size={16} />
                        <span>{currentPet?.city || currentPet?.owner_city}</span>
                      </div>
                    )}

                    {currentPet?.description && (
                      <p className="text-sm text-white/90 line-clamp-2">{currentPet.description}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-6 items-center justify-center">
              <button
                onClick={() => handleSwipe('left')}
                disabled={isAnimating}
                className="w-16 h-16 rounded-full bg-white shadow-xl flex items-center justify-center hover:scale-110 transition-transform disabled:opacity-50 disabled:hover:scale-100"
              >
                <Icon name="X" size={32} className="text-red-500" />
              </button>

              <button
                onClick={() => handleSwipe('right')}
                disabled={isAnimating}
                className="w-20 h-20 rounded-full bg-gradient-to-r from-pink-500 to-orange-500 shadow-xl flex items-center justify-center hover:scale-110 transition-transform disabled:opacity-50 disabled:hover:scale-100"
              >
                <Icon name="Heart" size={40} className="text-white" />
              </button>
            </div>

            {swipeDirection && (
              <div className="mt-4 text-center">
                <p className="text-gray-600">
                  {swipeDirection === 'right' ? '💚 Нравится!' : '❌ Пропущено'}
                </p>
              </div>
            )}
          </>
        )}
      </main>

      <footer className="bg-white border-t mt-auto">
        <div className="container mx-auto px-4 py-6 text-center text-gray-600">
          <p>© 2024 TinDog. Найди друга для своего питомца 🐾</p>
        </div>
      </footer>
    </div>
  );
}
