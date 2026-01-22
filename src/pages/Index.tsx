import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { Card } from '@/components/ui/card';
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

      <main className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="text-center py-20">
            <Icon name="Loader2" size={48} className="animate-spin text-pink-600 mx-auto" />
            <p className="text-gray-600 mt-4">Загрузка объявлений...</p>
          </div>
        ) : filteredPets.length === 0 ? (
          <div className="text-center py-20">
            <Icon name="Dog" size={64} className="mx-auto mb-4 text-gray-300" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Нет объявлений</h2>
            <p className="text-gray-600">Попробуйте изменить фильтры или добавьте своего питомца</p>
            <Button onClick={() => (window.location.href = '/profile')} className="mt-4">
              Добавить питомца
            </Button>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                Найдено объявлений: {filteredPets.length}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredPets.map((pet) => (
                <Card
                  key={pet.id}
                  className="overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
                >
                  <div className="relative">
                    {pet.photo_url ? (
                      <img
                        src={pet.photo_url}
                        alt={pet.name}
                        className="w-full h-64 object-cover"
                      />
                    ) : (
                      <div className="w-full h-64 bg-pink-100 flex items-center justify-center">
                        <Icon name="Dog" size={64} className="text-pink-400" />
                      </div>
                    )}
                    {pet.verification_paid && (
                      <Badge className="absolute top-2 right-2 bg-green-500 text-white">
                        <Icon name="ShieldCheck" size={14} className="mr-1" />
                        Проверен
                      </Badge>
                    )}
                  </div>

                  <div className="p-4">
                    <h3 className="text-xl font-bold text-gray-800 mb-1">
                      {pet.name}
                      {pet.age && `, ${pet.age} ${pet.age === 1 ? 'год' : pet.age < 5 ? 'года' : 'лет'}`}
                    </h3>

                    {pet.breed && (
                      <p className="text-sm text-gray-600 mb-2">{pet.breed}</p>
                    )}

                    <div className="flex flex-wrap gap-2 mb-3">
                      {pet.gender && (
                        <Badge variant="secondary" className="text-xs">
                          {pet.gender === 'male' ? 'Кобель' : 'Сука'}
                        </Badge>
                      )}
                      {pet.rank && (
                        <Badge variant="secondary" className="text-xs">
                          {pet.rank}
                        </Badge>
                      )}
                    </div>

                    {(pet.city || pet.owner_city) && (
                      <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                        <Icon name="MapPin" size={14} />
                        <span>{pet.city || pet.owner_city}</span>
                      </div>
                    )}

                    {pet.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">{pet.description}</p>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="bg-white border-t mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-gray-600">
          <p>© 2024 TinDog. Найди друга для своего питомца 🐾</p>
        </div>
      </footer>
    </div>
  );
}
