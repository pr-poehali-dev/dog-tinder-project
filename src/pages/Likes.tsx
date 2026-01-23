import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useNotifications } from '@/hooks/useNotifications';

const LIKES_API_URL = 'https://functions.poehali.dev/4e6641e2-0060-48bf-8259-7b7f08c84498';

interface User {
  id: number;
  email: string;
  name?: string;
}

interface Like {
  id: number;
  to_pet_id: number;
  to_pet_name: string;
  to_pet_photo?: string;
  to_pet_breed?: string;
  to_pet_age?: number;
  created_at: string;
}

interface IncomingLike {
  id: number;
  from_pet_id: number;
  from_pet_name: string;
  from_pet_photo?: string;
  from_pet_breed?: string;
  from_pet_age?: number;
  from_user_name?: string;
  created_at: string;
}

interface Match {
  match_id: number;
  pet1_id: number;
  pet1_name: string;
  pet1_photo?: string;
  pet2_id: number;
  pet2_name: string;
  pet2_photo?: string;
  user1_id: number;
  user1_name?: string;
  user2_id: number;
  user2_name?: string;
  matched_at: string;
}

export default function Likes() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'outgoing' | 'incoming' | 'matches'>('outgoing');
  const [outgoingLikes, setOutgoingLikes] = useState<Like[]>([]);
  const [incomingLikes, setIncomingLikes] = useState<IncomingLike[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { markAsRead, counts } = useNotifications(user?.id || null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      loadLikes(userData.id);
      markAsRead();
    }
  }, [markAsRead]);

  const loadLikes = async (userId: number) => {
    setIsLoading(true);
    try {
      const [outgoing, incoming, matchesData] = await Promise.all([
        fetch(`${LIKES_API_URL}?user_id=${userId}&action=outgoing`).then((r) => r.json()),
        fetch(`${LIKES_API_URL}?user_id=${userId}&action=incoming`).then((r) => r.json()),
        fetch(`${LIKES_API_URL}?user_id=${userId}&action=matches`).then((r) => r.json()),
      ]);

      setOutgoingLikes(outgoing);
      setIncomingLikes(incoming);
      setMatches(matchesData);
    } catch (error) {
      console.error('Failed to load likes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Icon name="Heart" size={64} className="mx-auto mb-4 text-gray-300" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Войдите в аккаунт</h2>
          <p className="text-gray-600 mb-4">Чтобы видеть лайки, нужно войти</p>
          <Button onClick={() => (window.location.href = '/profile')}>Войти</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-pink-500 to-orange-500 p-2 rounded-xl">
                <Icon name="Heart" size={28} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-orange-600 bg-clip-text text-transparent">
                Лайки
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={() => (window.location.href = '/')}>
                <Icon name="Home" size={24} />
              </Button>
              <Button variant="ghost" onClick={() => (window.location.href = '/chats')}>
                <Icon name="MessageCircle" size={24} />
              </Button>
              <Button variant="ghost" onClick={() => (window.location.href = '/profile')}>
                <Icon name="User" size={24} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === 'outgoing' ? 'default' : 'outline'}
            onClick={() => setActiveTab('outgoing')}
            className="flex-1"
          >
            Мои лайки ({outgoingLikes.length})
          </Button>
          <Button
            variant={activeTab === 'incoming' ? 'default' : 'outline'}
            onClick={() => setActiveTab('incoming')}
            className="flex-1"
          >
            Мне лайкнули ({incomingLikes.length})
          </Button>
          <Button
            variant={activeTab === 'matches' ? 'default' : 'outline'}
            onClick={() => setActiveTab('matches')}
            className="flex-1"
          >
            Матчи ({matches.length})
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-20">
            <Icon name="Loader2" size={48} className="animate-spin text-pink-600 mx-auto" />
            <p className="text-gray-600 mt-4">Загрузка...</p>
          </div>
        ) : (
          <>
            {activeTab === 'outgoing' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {outgoingLikes.length === 0 ? (
                  <div className="col-span-full text-center py-20">
                    <Icon name="Heart" size={64} className="mx-auto mb-4 text-gray-300" />
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Нет лайков</h2>
                    <p className="text-gray-600">Начните лайкать питомцев на главной</p>
                  </div>
                ) : (
                  outgoingLikes.map((like) => (
                    <div key={like.id} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                      <div className="relative h-48">
                        {like.to_pet_photo ? (
                          <img src={like.to_pet_photo} alt={like.to_pet_name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-pink-200 to-orange-200 flex items-center justify-center">
                            <Icon name="Dog" size={48} className="text-white opacity-50" />
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="text-lg font-bold text-gray-800">{like.to_pet_name}</h3>
                        {like.to_pet_breed && <p className="text-sm text-gray-600">{like.to_pet_breed}</p>}
                        {like.to_pet_age && <p className="text-sm text-gray-500">{like.to_pet_age} лет</p>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'incoming' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {incomingLikes.length === 0 ? (
                  <div className="col-span-full text-center py-20">
                    <Icon name="Heart" size={64} className="mx-auto mb-4 text-gray-300" />
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Нет входящих лайков</h2>
                    <p className="text-gray-600">Пока никто не лайкнул ваших питомцев</p>
                  </div>
                ) : (
                  incomingLikes.map((like) => (
                    <div key={like.id} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                      <div className="relative h-48">
                        {like.from_pet_photo ? (
                          <img src={like.from_pet_photo} alt={like.from_pet_name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-pink-200 to-orange-200 flex items-center justify-center">
                            <Icon name="Dog" size={48} className="text-white opacity-50" />
                          </div>
                        )}
                        <Badge className="absolute top-3 right-3 bg-pink-500 text-white">
                          <Icon name="Heart" size={14} className="mr-1" />
                          Новый лайк
                        </Badge>
                      </div>
                      <div className="p-4">
                        <h3 className="text-lg font-bold text-gray-800">{like.from_pet_name}</h3>
                        {like.from_pet_breed && <p className="text-sm text-gray-600">{like.from_pet_breed}</p>}
                        {like.from_user_name && <p className="text-xs text-gray-500 mt-2">Владелец: {like.from_user_name}</p>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'matches' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {matches.length === 0 ? (
                  <div className="col-span-full text-center py-20">
                    <Icon name="HeartHandshake" size={64} className="mx-auto mb-4 text-gray-300" />
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Нет матчей</h2>
                    <p className="text-gray-600">Когда вы и другой владелец лайкнете друг друга — появится матч</p>
                  </div>
                ) : (
                  matches.map((match) => {
                    const isUser1 = match.user1_id === user.id;
                    const otherPetName = isUser1 ? match.pet2_name : match.pet1_name;
                    const otherPetPhoto = isUser1 ? match.pet2_photo : match.pet1_photo;
                    const otherUserName = isUser1 ? match.user2_name : match.user1_name;

                    return (
                      <div key={match.match_id} className="bg-white rounded-2xl shadow-lg p-6">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-20 h-20 rounded-full overflow-hidden flex-shrink-0">
                            {otherPetPhoto ? (
                              <img src={otherPetPhoto} alt={otherPetName} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-pink-200 to-orange-200 flex items-center justify-center">
                                <Icon name="Dog" size={32} className="text-white opacity-50" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-800">{otherPetName}</h3>
                            {otherUserName && <p className="text-sm text-gray-600">Владелец: {otherUserName}</p>}
                            <Badge className="mt-2 bg-green-500 text-white">
                              <Icon name="Check" size={12} className="mr-1" />
                              Взаимная симпатия
                            </Badge>
                          </div>
                        </div>
                        <Button onClick={() => (window.location.href = '/chats')} className="w-full">
                          <Icon name="MessageCircle" size={16} className="mr-2" />
                          Написать
                        </Button>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}