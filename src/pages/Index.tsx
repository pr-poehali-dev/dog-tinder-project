import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNotifications } from '@/hooks/useNotifications';
import { requestNotificationPermission } from '@/utils/notifications';
import SwipeCard from '@/components/SwipeCard';
import confetti from 'canvas-confetti';
import TelegramLoginButton from '@/components/extensions/telegram-bot/TelegramLoginButton';
import AuthForm from '@/components/AuthForm';
import { getCurrentUser, logout } from '@/lib/auth';

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
  const [showAuthForm, setShowAuthForm] = useState(false);
  const { counts } = useNotifications(user?.id || null);

  useEffect(() => {
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
        
        // Автоматически настраиваем фильтры под питомца пользователя
        setFilters(prev => ({
          ...prev,
          // Ищем противоположный пол
          gender: myPet.gender === 'Кобель' ? 'Сука' : myPet.gender === 'Сука' ? 'Кобель' : '',
          // Ищем ту же породу
          breed: myPet.breed || '',
          // Ищем в том же городе
          city: myPet.city || '',
          // Возраст +/- 2 года от питомца пользователя
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
              <Button variant="ghost" onClick={() => (window.location.href = '/chatgpt')} title="Поддержка">
                <Icon name="Headphones" size={24} />
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
                  list="filter-cities-list"
                  value={filters.city}
                  onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                  placeholder="Начните вводить город..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
                <datalist id="filter-cities-list">
                  <option value="">Все города</option>
                  <option value="Москва">Москва</option>
                  <option value="Санкт-Петербург">Санкт-Петербург</option>
                  <option value="Новосибирск">Новосибирск</option>
                  <option value="Екатеринбург">Екатеринбург</option>
                  <option value="Казань">Казань</option>
                  <option value="Нижний Новгород">Нижний Новгород</option>
                  <option value="Челябинск">Челябинск</option>
                  <option value="Самара">Самара</option>
                  <option value="Омск">Омск</option>
                  <option value="Ростов-на-Дону">Ростов-на-Дону</option>
                  <option value="Уфа">Уфа</option>
                  <option value="Красноярск">Красноярск</option>
                  <option value="Воронеж">Воронеж</option>
                  <option value="Пермь">Пермь</option>
                  <option value="Волгоград">Волгоград</option>
                  <option value="Краснодар">Краснодар</option>
                  <option value="Саратов">Саратов</option>
                  <option value="Тюмень">Тюмень</option>
                  <option value="Тольятти">Тольятти</option>
                  <option value="Ижевск">Ижевск</option>
                  <option value="Барнаул">Барнаул</option>
                  <option value="Ульяновск">Ульяновск</option>
                  <option value="Иркутск">Иркутск</option>
                  <option value="Хабаровск">Хабаровск</option>
                  <option value="Ярославль">Ярославль</option>
                  <option value="Владивосток">Владивосток</option>
                  <option value="Махачкала">Махачкала</option>
                  <option value="Томск">Томск</option>
                  <option value="Оренбург">Оренбург</option>
                  <option value="Кемерово">Кемерово</option>
                  <option value="Новокузнецк">Новокузнецк</option>
                  <option value="Рязань">Рязань</option>
                  <option value="Астрахань">Астрахань</option>
                  <option value="Набережные Челны">Набережные Челны</option>
                  <option value="Пенза">Пенза</option>
                  <option value="Липецк">Липецк</option>
                  <option value="Киров">Киров</option>
                  <option value="Чебоксары">Чебоксары</option>
                  <option value="Калининград">Калининград</option>
                  <option value="Тула">Тула</option>
                  <option value="Курск">Курск</option>
                  <option value="Ставрополь">Ставрополь</option>
                  <option value="Улан-Удэ">Улан-Удэ</option>
                  <option value="Сочи">Сочи</option>
                  <option value="Магнитогорск">Магнитогорск</option>
                  <option value="Брянск">Брянск</option>
                  <option value="Иваново">Иваново</option>
                  <option value="Белгород">Белгород</option>
                  <option value="Архангельск">Архангельск</option>
                  <option value="Владимир">Владимир</option>
                  <option value="Сургут">Сургут</option>
                  <option value="Калуга">Калуга</option>
                  <option value="Чита">Чита</option>
                  <option value="Смоленск">Смоленск</option>
                  <option value="Волжский">Волжский</option>
                  <option value="Курган">Курган</option>
                  <option value="Орел">Орел</option>
                  <option value="Череповец">Череповец</option>
                  <option value="Вологда">Вологда</option>
                  <option value="Владикавказ">Владикавказ</option>
                  <option value="Мурманск">Мурманск</option>
                  <option value="Саранск">Саранск</option>
                  <option value="Якутск">Якутск</option>
                  <option value="Тамбов">Тамбов</option>
                  <option value="Грозный">Грозный</option>
                  <option value="Стерлитамак">Стерлитамак</option>
                  <option value="Кострома">Кострома</option>
                  <option value="Петрозаводск">Петрозаводск</option>
                  <option value="Нижний Тагил">Нижний Тагил</option>
                  <option value="Новороссийск">Новороссийск</option>
                  <option value="Йошкар-Ола">Йошкар-Ола</option>
                  <option value="Химки">Химки</option>
                  <option value="Таганрог">Таганрог</option>
                  <option value="Комсомольск-на-Амуре">Комсомольск-на-Амуре</option>
                  <option value="Сыктывкар">Сыктывкар</option>
                  <option value="Нижневартовск">Нижневартовск</option>
                  <option value="Нальчик">Нальчик</option>
                  <option value="Шахты">Шахты</option>
                  <option value="Дзержинск">Дзержинск</option>
                  <option value="Энгельс">Энгельс</option>
                  <option value="Благовещенск">Благовещенск</option>
                  <option value="Подольск">Подольск</option>
                  <option value="Псков">Псков</option>
                  <option value="Балашиха">Балашиха</option>
                  <option value="Орск">Орск</option>
                  <option value="Армавир">Армавир</option>
                  <option value="Королев">Королев</option>
                  <option value="Мытищи">Мытищи</option>
                  <option value="Люберцы">Люберцы</option>
                  <option value="Петропавловск-Камчатский">Петропавловск-Камчатский</option>
                  <option value="Северодвинск">Северодвинск</option>
                  <option value="Новочеркасск">Новочеркасск</option>
                  <option value="Абакан">Абакан</option>
                  <option value="Бийск">Бийск</option>
                  <option value="Прокопьевск">Прокопьевск</option>
                  <option value="Рыбинск">Рыбинск</option>
                  <option value="Великий Новгород">Великий Новгород</option>
                </datalist>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Порода</label>
                <input
                  list="filter-breeds-list"
                  value={filters.breed}
                  onChange={(e) => setFilters({ ...filters, breed: e.target.value })}
                  placeholder="Начните вводить породу..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
                <datalist id="filter-breeds-list">
                  <option value="">Все породы</option>
                  <option value="Австралийская овчарка">Австралийская овчарка</option>
                  <option value="Австралийский терьер">Австралийский терьер</option>
                  <option value="Акита-ину">Акита-ину</option>
                  <option value="Аляскинский маламут">Аляскинский маламут</option>
                  <option value="Американский бульдог">Американский бульдог</option>
                  <option value="Американский кокер-спаниель">Американский кокер-спаниель</option>
                  <option value="Американский питбультерьер">Американский питбультерьер</option>
                  <option value="Американский стаффордширский терьер">Американский стаффордширский терьер</option>
                  <option value="Английский бульдог">Английский бульдог</option>
                  <option value="Английский кокер-спаниель">Английский кокер-спаниель</option>
                  <option value="Английский мастиф">Английский мастиф</option>
                  <option value="Английский сеттер">Английский сеттер</option>
                  <option value="Аргентинский дог">Аргентинский дог</option>
                  <option value="Афганская борзая">Афганская борзая</option>
                  <option value="Басенджи">Басенджи</option>
                  <option value="Бассет-хаунд">Бассет-хаунд</option>
                  <option value="Бедлингтон-терьер">Бедлингтон-терьер</option>
                  <option value="Белая швейцарская овчарка">Белая швейцарская овчарка</option>
                  <option value="Бельгийская овчарка">Бельгийская овчарка</option>
                  <option value="Бернский зенненхунд">Бернский зенненхунд</option>
                  <option value="Бигль">Бигль</option>
                  <option value="Бишон фризе">Бишон фризе</option>
                  <option value="Бладхаунд">Бладхаунд</option>
                  <option value="Бобтейл">Бобтейл</option>
                  <option value="Боксер">Боксер</option>
                  <option value="Большой пудель">Большой пудель</option>
                  <option value="Бордер-колли">Бордер-колли</option>
                  <option value="Бордер-терьер">Бордер-терьер</option>
                  <option value="Бордоский дог">Бордоский дог</option>
                  <option value="Бостон-терьер">Бостон-терьер</option>
                  <option value="Бульмастиф">Бульмастиф</option>
                  <option value="Бультерьер">Бультерьер</option>
                  <option value="Вельш-корги кардиган">Вельш-корги кардиган</option>
                  <option value="Вельш-корги пемброк">Вельш-корги пемброк</option>
                  <option value="Венгерская выжла">Венгерская выжла</option>
                  <option value="Вест-хайленд-уайт-терьер">Вест-хайленд-уайт-терьер</option>
                  <option value="Восточноевропейская овчарка">Восточноевропейская овчарка</option>
                  <option value="Голден ретривер">Голден ретривер</option>
                  <option value="Далматин">Далматин</option>
                  <option value="Джек-рассел-терьер">Джек-рассел-терьер</option>
                  <option value="Доберман">Доберман</option>
                  <option value="Дратхаар">Дратхаар</option>
                  <option value="Ирландский волкодав">Ирландский волкодав</option>
                  <option value="Ирландский сеттер">Ирландский сеттер</option>
                  <option value="Йоркширский терьер">Йоркширский терьер</option>
                  <option value="Кавалер-кинг-чарльз-спаниель">Кавалер-кинг-чарльз-спаниель</option>
                  <option value="Кавказская овчарка">Кавказская овчарка</option>
                  <option value="Кане-корсо">Кане-корсо</option>
                  <option value="Карликовый пинчер">Карликовый пинчер</option>
                  <option value="Карликовый пудель">Карликовый пудель</option>
                  <option value="Карликовый шпиц">Карликовый шпиц</option>
                  <option value="Китайская хохлатая">Китайская хохлатая</option>
                  <option value="Колли">Колли</option>
                  <option value="Курцхаар">Курцхаар</option>
                  <option value="Лабрадор">Лабрадор</option>
                  <option value="Левретка">Левретка</option>
                  <option value="Леонбергер">Леонбергер</option>
                  <option value="Мальтезе">Мальтезе</option>
                  <option value="Мастино неаполитано">Мастино неаполитано</option>
                  <option value="Миттельшнауцер">Миттельшнауцер</option>
                  <option value="Мопс">Мопс</option>
                  <option value="Московская сторожевая">Московская сторожевая</option>
                  <option value="Немецкая овчарка">Немецкая овчарка</option>
                  <option value="Немецкий дог">Немецкий дог</option>
                  <option value="Немецкий шпиц">Немецкий шпиц</option>
                  <option value="Ньюфаундленд">Ньюфаундленд</option>
                  <option value="Папильон">Папильон</option>
                  <option value="Пекинес">Пекинес</option>
                  <option value="Померанский шпиц">Померанский шпиц</option>
                  <option value="Пудель">Пудель</option>
                  <option value="Ризеншнауцер">Ризеншнауцер</option>
                  <option value="Родезийский риджбек">Родезийский риджбек</option>
                  <option value="Ротвейлер">Ротвейлер</option>
                  <option value="Русская псовая борзая">Русская псовая борзая</option>
                  <option value="Русский той">Русский той</option>
                  <option value="Русский черный терьер">Русский черный терьер</option>
                  <option value="Самоедская собака">Самоедская собака</option>
                  <option value="Сенбернар">Сенбернар</option>
                  <option value="Сиба-ину">Сиба-ину</option>
                  <option value="Сибирский хаски">Сибирский хаски</option>
                  <option value="Стаффордширский бультерьер">Стаффордширский бультерьер</option>
                  <option value="Такса">Такса</option>
                  <option value="Тибетский мастиф">Тибетский мастиф</option>
                  <option value="Той-пудель">Той-пудель</option>
                  <option value="Уиппет">Уиппет</option>
                  <option value="Фараонова собака">Фараонова собака</option>
                  <option value="Фокстерьер">Фокстерьер</option>
                  <option value="Французский бульдог">Французский бульдог</option>
                  <option value="Цвергшнауцер">Цвергшнауцер</option>
                  <option value="Чау-чау">Чау-чау</option>
                  <option value="Чихуахуа">Чихуахуа</option>
                  <option value="Шарпей">Шарпей</option>
                  <option value="Ши-тцу">Ши-тцу</option>
                  <option value="Шелти">Шелти</option>
                  <option value="Эрдельтерьер">Эрдельтерьер</option>
                  <option value="Южноафриканский бурбуль">Южноафриканский бурбуль</option>
                  <option value="Японский хин">Японский хин</option>
                  <option value="Метис">Метис</option>
                  <option value="Другая порода">Другая порода</option>
                </datalist>
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
                <select
                  value={filters.rank}
                  onChange={(e) => setFilters({ ...filters, rank: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  <option value="">Все ранги</option>
                  <option value="Чемпион России">Чемпион России</option>
                  <option value="Чемпион РКФ">Чемпион РКФ</option>
                  <option value="Юный чемпион">Юный чемпион</option>
                  <option value="Кандидат в чемпионы">Кандидат в чемпионы</option>
                  <option value="Гранд чемпион">Гранд чемпион</option>
                  <option value="Чемпион НКП">Чемпион НКП</option>
                  <option value="Элитный производитель">Элитный производитель</option>
                </select>
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Цена за вязку: {filters.minPrice.toLocaleString('ru-RU')} - {filters.maxPrice.toLocaleString('ru-RU')} ₽
                </label>
                <div className="flex gap-4 items-center">
                  <input
                    type="range"
                    min="0"
                    max="100000"
                    step="5000"
                    value={filters.minPrice}
                    onChange={(e) => setFilters({ ...filters, minPrice: Number(e.target.value) })}
                    className="flex-1"
                  />
                  <input
                    type="range"
                    min="0"
                    max="100000"
                    step="5000"
                    value={filters.maxPrice}
                    onChange={(e) => setFilters({ ...filters, maxPrice: Number(e.target.value) })}
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">0 ₽ = бесплатно или договорная</p>
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
          
          <div className="flex items-center gap-2">
            {!user && (
              <>
                <TelegramLoginButton
                  botUsername={import.meta.env.VITE_TELEGRAM_BOT_USERNAME}
                  onSuccess={(tgUser, token) => {
                    setUser(tgUser);
                    loadMyPet(tgUser.id);
                    loadMyLikes(tgUser.id);
                  }}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAuthForm(true)}
                  className="gap-2"
                >
                  <Icon name="Mail" className="w-4 h-4" />
                  Войти через Email
                </Button>
              </>
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
                    onClick={() => setShowInstructions(true)}
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
          <p className="mb-2">© 2026 TinDog - Больше, чем просто знакомство 🐾</p>
          <a 
            href="/oferta" 
            className="text-sm text-gray-500 hover:text-pink-600 transition-colors underline"
          >
            Публичная оферта
          </a>
        </div>
      </footer>

      {/* Модальное окно с инструкциями */}
      {showInstructions && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowInstructions(false)}
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
              onClick={() => setShowInstructions(false)}
              className="w-full bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600"
              size="lg"
            >
              Понятно!
            </Button>
          </div>
        </div>
      )}
      {showAuthForm && (
        <AuthForm
          onSuccess={(user, token) => {
            setUser(user);
            setShowAuthForm(false);
            loadMyPet(user.id);
            loadMyLikes(user.id);
          }}
          onClose={() => setShowAuthForm(false)}
        />
      )}
    </div>
  );
}