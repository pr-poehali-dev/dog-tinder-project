import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface DogProfile {
  id: number;
  name: string;
  breed: string;
  age: number;
  gender: 'Мальчик' | 'Девочка';
  image: string;
  location: string;
  description: string;
  verified: boolean;
}

const dogs: DogProfile[] = [
  {
    id: 1,
    name: 'Рекс',
    breed: 'Золотистый ретривер',
    age: 3,
    gender: 'Мальчик',
    image: 'https://cdn.poehali.dev/projects/d74a4f5a-6886-4dec-8dc8-f01016c0890c/files/94a44930-2b70-467d-852b-ed75cd9c1441.jpg',
    location: 'Москва, Парк Горького',
    description: 'Дружелюбный и активный пёс, обожает плавать и играть с мячом 🎾',
    verified: true,
  },
  {
    id: 2,
    name: 'Луна',
    breed: 'Хаски',
    age: 2,
    gender: 'Девочка',
    image: 'https://cdn.poehali.dev/projects/d74a4f5a-6886-4dec-8dc8-f01016c0890c/files/175997cd-d9a2-4f4e-abfa-42b37ee57f8b.jpg',
    location: 'Санкт-Петербург',
    description: 'Энергичная красавица с голубыми глазами, любит длительные прогулки 🐺',
    verified: true,
  },
  {
    id: 3,
    name: 'Арчи',
    breed: 'Корги',
    age: 4,
    gender: 'Мальчик',
    image: 'https://cdn.poehali.dev/projects/d74a4f5a-6886-4dec-8dc8-f01016c0890c/files/5e544908-0b0e-4430-aea1-621a831a841b.jpg',
    location: 'Казань',
    description: 'Весёлый коротколапик, мастер поднимать настроение всей семье 😊',
    verified: false,
  },
];

export default function Index() {
  const [currentDogIndex, setCurrentDogIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationType, setAnimationType] = useState<'left' | 'right' | null>(null);
  const [activeTab, setActiveTab] = useState<'home' | 'likes' | 'messages' | 'profile'>('home');
  const [likes, setLikes] = useState<DogProfile[]>([]);

  const currentDog = dogs[currentDogIndex];

  const handleSwipe = (direction: 'left' | 'right') => {
    if (isAnimating) return;

    setIsAnimating(true);
    setAnimationType(direction);

    if (direction === 'right') {
      setLikes([...likes, currentDog]);
    }

    setTimeout(() => {
      if (currentDogIndex < dogs.length - 1) {
        setCurrentDogIndex(currentDogIndex + 1);
      } else {
        setCurrentDogIndex(0);
      }
      setIsAnimating(false);
      setAnimationType(null);
    }, 500);
  };

  const renderHomeTab = () => (
    <div className="flex-1 flex items-center justify-center p-4 pb-24">
      {currentDog ? (
        <Card
          className={`relative w-full max-w-md h-[600px] overflow-hidden shadow-2xl ${
            animationType === 'left' ? 'animate-swipe-left' : ''
          } ${animationType === 'right' ? 'animate-swipe-right' : ''}`}
        >
          <div className="relative h-full">
            <img
              src={currentDog.image}
              alt={currentDog.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            <div className="absolute top-4 right-4 flex gap-2">
              {currentDog.verified && (
                <Badge className="bg-blue-500 text-white">
                  <Icon name="BadgeCheck" size={14} className="mr-1" />
                  Проверен
                </Badge>
              )}
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <h2 className="text-4xl font-fredoka font-bold mb-2">
                {currentDog.name}, {currentDog.age}
              </h2>
              <div className="flex items-center gap-2 mb-3">
                <Icon name="MapPin" size={18} />
                <span className="text-lg">{currentDog.location}</span>
              </div>
              <p className="text-lg mb-2">
                {currentDog.breed} • {currentDog.gender}
              </p>
              <p className="text-base opacity-90">{currentDog.description}</p>
            </div>
          </div>
        </Card>
      ) : (
        <div className="text-center">
          <Icon name="Dog" size={64} className="mx-auto mb-4 text-muted-foreground" />
          <p className="text-xl text-muted-foreground">Больше нет питомцев поблизости</p>
        </div>
      )}

      {currentDog && (
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 flex gap-6">
          <Button
            onClick={() => handleSwipe('left')}
            disabled={isAnimating}
            size="lg"
            className="h-16 w-16 rounded-full bg-white text-red-500 hover:bg-red-50 shadow-xl"
          >
            <Icon name="X" size={32} />
          </Button>
          <Button
            onClick={() => handleSwipe('right')}
            disabled={isAnimating}
            size="lg"
            className="h-20 w-20 rounded-full bg-gradient-to-r from-pink-500 to-orange-400 text-white hover:opacity-90 shadow-xl"
          >
            <Icon name="Heart" size={36} />
          </Button>
        </div>
      )}
    </div>
  );

  const renderLikesTab = () => (
    <div className="flex-1 p-4 pb-24 overflow-auto">
      <h2 className="text-3xl font-fredoka font-bold mb-6 text-center bg-gradient-to-r from-pink-500 to-orange-400 bg-clip-text text-transparent">
        Понравившиеся 💕
      </h2>
      {likes.length === 0 ? (
        <div className="text-center mt-20">
          <Icon name="Heart" size={64} className="mx-auto mb-4 text-muted-foreground" />
          <p className="text-xl text-muted-foreground">Пока нет лайков</p>
          <p className="text-base text-muted-foreground mt-2">
            Начните свайпать вправо на питомцев, которые вам нравятся!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {likes.map((dog) => (
            <Card key={dog.id} className="overflow-hidden animate-fade-in">
              <img src={dog.image} alt={dog.name} className="w-full h-48 object-cover" />
              <div className="p-3">
                <h3 className="font-fredoka font-bold text-lg">
                  {dog.name}, {dog.age}
                </h3>
                <p className="text-sm text-muted-foreground">{dog.breed}</p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderMessagesTab = () => (
    <div className="flex-1 p-4 pb-24">
      <h2 className="text-3xl font-fredoka font-bold mb-6 text-center bg-gradient-to-r from-pink-500 to-orange-400 bg-clip-text text-transparent">
        Сообщения 💬
      </h2>
      <div className="text-center mt-20">
        <Icon name="MessageCircle" size={64} className="mx-auto mb-4 text-muted-foreground" />
        <p className="text-xl text-muted-foreground">Пока нет сообщений</p>
        <p className="text-base text-muted-foreground mt-2">
          Когда найдёте пару, здесь появятся чаты!
        </p>
      </div>
    </div>
  );

  const renderProfileTab = () => (
    <div className="flex-1 p-4 pb-24 overflow-auto">
      <h2 className="text-3xl font-fredoka font-bold mb-6 text-center bg-gradient-to-r from-pink-500 to-orange-400 bg-clip-text text-transparent">
        Платные услуги 🎯
      </h2>
      <div className="max-w-md mx-auto space-y-4">
        <Card className="p-6 hover:shadow-xl transition-shadow">
          <div className="flex items-start gap-4">
            <div className="bg-gradient-to-br from-pink-500 to-orange-400 rounded-full p-3">
              <Icon name="Stethoscope" size={32} className="text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-fredoka font-bold mb-2">
                Ветеринарное сопровождение
              </h3>
              <p className="text-muted-foreground mb-4">
                Полный контроль здоровья питомца на всех этапах вязки
              </p>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold text-primary">7 500 ₽</span>
                <Button className="bg-gradient-to-r from-pink-500 to-orange-400">
                  Подключить
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-xl transition-shadow">
          <div className="flex items-start gap-4">
            <div className="bg-gradient-to-br from-purple-500 to-blue-400 rounded-full p-3">
              <Icon name="FileCheck" size={32} className="text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-fredoka font-bold mb-2">Проверка документов</h3>
              <p className="text-muted-foreground mb-4">
                Полная проверка родословной и медицинских документов
              </p>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold text-secondary">500 ₽</span>
                <Button className="bg-gradient-to-r from-purple-500 to-blue-400">
                  Проверить
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-orange-50 to-purple-50 flex flex-col">
      <header className="bg-white/80 backdrop-blur-sm shadow-sm p-4 sticky top-0 z-10">
        <div className="flex items-center justify-center gap-2">
          <Icon name="Dog" size={32} className="text-primary" />
          <h1 className="text-4xl font-fredoka font-bold bg-gradient-to-r from-pink-500 to-orange-400 bg-clip-text text-transparent">
            TinDog
          </h1>
        </div>
      </header>

      {activeTab === 'home' && renderHomeTab()}
      {activeTab === 'likes' && renderLikesTab()}
      {activeTab === 'messages' && renderMessagesTab()}
      {activeTab === 'profile' && renderProfileTab()}

      <nav className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t">
        <div className="flex items-center justify-around p-4">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center gap-1 transition-colors ${
              activeTab === 'home' ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <Icon name="Home" size={24} />
            <span className="text-xs font-medium">Главная</span>
          </button>
          <button
            onClick={() => setActiveTab('likes')}
            className={`flex flex-col items-center gap-1 transition-colors relative ${
              activeTab === 'likes' ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <Icon name="Heart" size={24} />
            <span className="text-xs font-medium">Лайки</span>
            {likes.length > 0 && (
              <Badge className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs p-0">
                {likes.length}
              </Badge>
            )}
          </button>
          <button
            onClick={() => setActiveTab('messages')}
            className={`flex flex-col items-center gap-1 transition-colors ${
              activeTab === 'messages' ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <Icon name="MessageCircle" size={24} />
            <span className="text-xs font-medium">Сообщения</span>
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center gap-1 transition-colors ${
              activeTab === 'profile' ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <Icon name="ShoppingBag" size={24} />
            <span className="text-xs font-medium">Услуги</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
