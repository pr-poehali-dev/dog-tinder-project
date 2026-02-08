import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { useNotifications } from '@/hooks/useNotifications';
import { requestNotificationPermission } from '@/utils/notifications';
import confetti from 'canvas-confetti';
import { getCurrentUser } from '@/lib/auth';
import Header from './Index/Header';
import FiltersPanel from './Index/FiltersPanel';
import SwipeView from './Index/SwipeView';
import InstructionsModal from './Index/InstructionsModal';
import AuthModal from '@/components/AuthModal';

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
  breeding_price?: number;
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
    minPrice: 0,
    maxPrice: 100000,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'swipe'>('swipe');
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { counts } = useNotifications(user?.id || null);

  useEffect(() => {
    const onboardingComplete = localStorage.getItem('onboardingComplete');
    if (!onboardingComplete) {
      window.location.href = '/welcome';
      return;
    }

    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      loadMyPet(currentUser.id);
      loadMyLikes(currentUser.id);
      requestNotificationPermission();
    } else {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        loadMyPet(userData.id);
        loadMyLikes(userData.id);
        requestNotificationPermission();
      }
    }
    loadPets();
  }, []);

  const loadMyPet = async (userId: number) => {
    try {
      const response = await fetch(`${PETS_API_URL}?user_id=${userId}`);
      const data = await response.json();
      if (data.length > 0) {
        const myPet = data[0];
        setMyPetId(myPet.id);
        
        setFilters(prev => ({
          ...prev,
          gender: myPet.gender === 'Кобель' ? 'Сука' : myPet.gender === 'Сука' ? 'Кобель' : '',
          breed: myPet.breed || '',
          city: myPet.city || '',
          minAge: myPet.age ? Math.max(0, myPet.age - 2) : 0,
          maxAge: myPet.age ? Math.min(15, myPet.age + 2) : 15,
        }));
      }
    } catch (error) {
      console.error('Failed to load my pet:', error);
    }
  };

  const loadMyLikes = async (userId: number) => {
    try {
      const response = await fetch(`${LIKES_API_URL}?action=outgoing&user_id=${userId}`);
      const data = await response.json();
      const likedIds = new Set(data.map((like: { to_pet_id: number }) => like.to_pet_id));
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
          if (navigator.vibrate) {
            navigator.vibrate([100, 50, 100, 50, 200]);
          }
          
          confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#ff69b4', '#ff1493', '#ff6347', '#ffa500', '#ffb6c1']
          });
          
          setTimeout(() => {
            confetti({
              particleCount: 100,
              angle: 60,
              spread: 55,
              origin: { x: 0 },
              colors: ['#ff69b4', '#ff1493', '#ff6347', '#ffa500', '#ffb6c1']
            });
            confetti({
              particleCount: 100,
              angle: 120,
              spread: 55,
              origin: { x: 1 },
              colors: ['#ff69b4', '#ff1493', '#ff6347', '#ffa500', '#ffb6c1']
            });
          }, 200);
          
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

    if (filters.minPrice > 0 || filters.maxPrice < 100000) {
      filtered = filtered.filter((pet) => {
        if (!pet.breeding_price) return filters.minPrice === 0;
        return pet.breeding_price >= filters.minPrice && pet.breeding_price <= filters.maxPrice;
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
      minPrice: 0,
      maxPrice: 100000,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      <Header 
        user={user}
        counts={counts}
        onLoginClick={() => setShowAuthModal(true)}
      />

      {showFilters && (
        <FiltersPanel
          filters={filters}
          onFiltersChange={setFilters}
          onReset={resetFilters}
          onClose={() => setShowFilters(false)}
        />
      )}

      <SwipeView
        user={user}
        displayedPets={displayedPets}
        currentCardIndex={currentCardIndex}
        isLoading={isLoading}
        onSwipeLeft={handleSwipeLeft}
        onSwipeRight={handleSwipeRight}
        onRestart={() => setCurrentCardIndex(0)}
        onShowInstructions={() => setShowInstructions(true)}
        onLoginClick={() => setShowAuthModal(true)}
        onToggleFilters={() => setShowFilters(!showFilters)}
      />

      <footer className="bg-white border-t mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-gray-600">
          <p className="mb-2">© 2026 TinDog - Больше, чем просто знакомство 🐾</p>
          <a 
            href="/oferta" 
            className="text-sm text-gray-500 hover:text-pink-600 transition-colors underline"
          >
            Публичная оферта
          </a>
        </div>
      </footer>

      {showInstructions && (
        <InstructionsModal onClose={() => setShowInstructions(false)} />
      )}

      <AuthModal 
        open={showAuthModal}
        onOpenChange={setShowAuthModal}
        onSuccess={() => {
          const savedUser = localStorage.getItem('user');
          if (savedUser) {
            const userData = JSON.parse(savedUser);
            setUser(userData);
            loadMyPet(userData.id);
            loadMyLikes(userData.id);
          }
        }}
      />
    </div>
  );
}