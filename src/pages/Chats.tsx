import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useNotifications } from '@/hooks/useNotifications';
import BreedingInstructionDialog from '@/components/BreedingInstructionDialog';
import BreedingServiceSelection from '@/components/BreedingServiceSelection';
import BreedingMeetingPlanner from '@/components/BreedingMeetingPlanner';
import VeterinarianSelector from '@/components/VeterinarianSelector';

const LIKES_API_URL = 'https://functions.poehali.dev/4e6641e2-0060-48bf-8259-7b7f08c84498';
const BREEDING_API_URL = 'https://functions.poehali.dev/9e55c198-d835-49ca-a996-fcdab68dad27';

interface User {
  id: number;
  email: string;
  name?: string;
}

interface Chat {
  chat_id: number;
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
  last_message?: string;
  last_message_at?: string;
  created_at: string;
}

interface Message {
  id: number;
  sender_user_id: number;
  sender_name: string;
  message: string;
  created_at: string;
}

type BreedingStep = 'instruction' | 'service' | 'meeting' | 'vet' | null;

export default function Chats() {
  const [user, setUser] = useState<User | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const { refresh } = useNotifications(user?.id || null);
  
  const [breedingStep, setBreedingStep] = useState<BreedingStep>(null);
  const [hasBreedingProcess, setHasBreedingProcess] = useState(false);
  const [breedingData, setBreedingData] = useState<{
    withVet: boolean;
    date?: string;
    time?: string;
    location?: 'male_home' | 'neutral';
    address?: string;
    vetId?: number;
  }>({ withVet: false });

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      loadChats(userData.id);
    }
  }, []);

  useEffect(() => {
    if (!selectedChat) return;

    const interval = setInterval(() => {
      loadMessages(selectedChat.chat_id);
      refresh();
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedChat, refresh]);

  const loadChats = async (userId: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${LIKES_API_URL}?resource=chats&user_id=${userId}`);
      const data = await response.json();
      setChats(data);
    } catch (error) {
      console.error('Failed to load chats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (chatId: number) => {
    if (!user) return;
    try {
      const response = await fetch(`${LIKES_API_URL}?resource=chats&user_id=${user.id}&chat_id=${chatId}`);
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const handleSelectChat = async (chat: Chat) => {
    setSelectedChat(chat);
    loadMessages(chat.chat_id);
    
    if (!user) return;
    try {
      const response = await fetch(`${BREEDING_API_URL}?chat_id=${chat.chat_id}&user_id=${user.id}`);
      const data = await response.json();
      
      if (data.has_process === false) {
        setHasBreedingProcess(false);
      } else if (data.id) {
        setHasBreedingProcess(true);
      }
    } catch (error) {
      console.error('Failed to check breeding process:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat || !user) return;

    setIsSending(true);
    try {
      await fetch(LIKES_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_message',
          chat_id: selectedChat.chat_id,
          sender_user_id: user.id,
          message: newMessage,
        }),
      });

      setNewMessage('');
      loadMessages(selectedChat.chat_id);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleCreateBreedingProcess = async () => {
    if (!selectedChat || !user || !breedingData.date || !breedingData.time || !breedingData.location) return;

    try {
      const response = await fetch(BREEDING_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          chat_id: selectedChat.chat_id,
          pet1_id: selectedChat.pet1_id,
          pet2_id: selectedChat.pet2_id,
          user1_id: selectedChat.user1_id,
          user2_id: selectedChat.user2_id,
          meeting_date: breedingData.date,
          meeting_time: breedingData.time,
          location: breedingData.location,
          address: breedingData.address,
          with_vet: breedingData.withVet,
          vet_id: breedingData.vetId,
          vet_name: breedingData.vetId ? 'Выбранный ветеринар' : undefined,
        }),
      });

      const data = await response.json();
      if (data.id) {
        window.location.href = `/breeding-process?id=${data.id}`;
      }
    } catch (error) {
      console.error('Failed to create breeding process:', error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Icon name="MessageCircle" size={64} className="mx-auto mb-4 text-gray-300" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Войдите в аккаунт</h2>
          <p className="text-gray-600 mb-4">Чтобы видеть чаты, нужно войти</p>
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
                <Icon name="MessageCircle" size={28} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-orange-600 bg-clip-text text-transparent">
                Чаты
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={() => (window.location.href = '/')}>
                <Icon name="Home" size={24} />
              </Button>
              <Button variant="ghost" onClick={() => (window.location.href = '/likes')}>
                <Icon name="Heart" size={24} />
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

      <div className="container mx-auto px-4 py-6">
        {isLoading ? (
          <div className="text-center py-20">
            <Icon name="Loader2" size={48} className="animate-spin text-pink-600 mx-auto" />
            <p className="text-gray-600 mt-4">Загрузка чатов...</p>
          </div>
        ) : chats.length === 0 ? (
          <div className="text-center py-20">
            <Icon name="MessageCircle" size={64} className="mx-auto mb-4 text-gray-300" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Нет чатов</h2>
            <p className="text-gray-600 mb-4">Создайте матч, чтобы начать общение</p>
            <Button onClick={() => (window.location.href = '/likes')}>
              Посмотреть матчи
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
            <div className="md:col-span-1 bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="p-4 bg-gradient-to-r from-pink-500 to-orange-500">
                <h2 className="text-lg font-bold text-white">Ваши чаты</h2>
              </div>
              <div className="overflow-y-auto h-[calc(100%-60px)]">
                {chats.map((chat) => {
                  const isUser1 = chat.user1_id === user.id;
                  const otherPetName = isUser1 ? chat.pet2_name : chat.pet1_name;
                  const otherPetPhoto = isUser1 ? chat.pet2_photo : chat.pet1_photo;
                  const otherUserName = isUser1 ? chat.user2_name : chat.user1_name;

                  return (
                    <div
                      key={chat.chat_id}
                      onClick={() => handleSelectChat(chat)}
                      className={`p-4 border-b cursor-pointer hover:bg-pink-50 transition-colors ${
                        selectedChat?.chat_id === chat.chat_id ? 'bg-pink-100' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                          {otherPetPhoto ? (
                            <img src={otherPetPhoto} alt={otherPetName} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-pink-200 to-orange-200 flex items-center justify-center">
                              <Icon name="Dog" size={20} className="text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-800 truncate">{otherPetName}</p>
                          {otherUserName && <p className="text-xs text-gray-500 truncate">{otherUserName}</p>}
                          {chat.last_message && (
                            <p className="text-sm text-gray-600 truncate">{chat.last_message}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="md:col-span-2 bg-white rounded-2xl shadow-lg flex flex-col">
              {selectedChat ? (
                <>
                  <div className="p-4 border-b bg-gradient-to-r from-pink-500 to-orange-500">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden">
                        {(selectedChat.user1_id === user.id ? selectedChat.pet2_photo : selectedChat.pet1_photo) ? (
                          <img
                            src={selectedChat.user1_id === user.id ? selectedChat.pet2_photo : selectedChat.pet1_photo}
                            alt={selectedChat.user1_id === user.id ? selectedChat.pet2_name : selectedChat.pet1_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-pink-200 flex items-center justify-center">
                            <Icon name="Dog" size={20} className="text-white" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-white">
                          {selectedChat.user1_id === user.id ? selectedChat.pet2_name : selectedChat.pet1_name}
                        </p>
                        <p className="text-xs text-white/80">
                          {selectedChat.user1_id === user.id ? selectedChat.user2_name : selectedChat.user1_name}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.length === 0 ? (
                      <div className="text-center py-12">
                        <Icon name="MessageCircle" size={48} className="mx-auto mb-4 text-gray-300" />
                        <p className="text-gray-500">Начните общение!</p>
                      </div>
                    ) : (
                      messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.sender_user_id === user.id ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                              msg.sender_user_id === user.id
                                ? 'bg-gradient-to-r from-pink-500 to-orange-500 text-white'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            <p className="text-sm">{msg.message}</p>
                            <p
                              className={`text-xs mt-1 ${
                                msg.sender_user_id === user.id ? 'text-white/70' : 'text-gray-500'
                              }`}
                            >
                              {new Date(msg.created_at).toLocaleTimeString('ru-RU', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="p-4 border-t space-y-3">
                    {!hasBreedingProcess && (
                      <Button
                        onClick={() => setBreedingStep('instruction')}
                        className="w-full bg-gradient-to-r from-pink-600 to-orange-600"
                      >
                        <Icon name="Heart" size={20} />
                        Начать вязку
                      </Button>
                    )}
                    <form onSubmit={handleSendMessage}>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Напишите сообщение..."
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                          disabled={isSending}
                        />
                        <Button type="submit" disabled={isSending || !newMessage.trim()}>
                          {isSending ? (
                            <Icon name="Loader2" size={20} className="animate-spin" />
                          ) : (
                            <Icon name="Send" size={20} />
                          )}
                        </Button>
                      </div>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <Icon name="MessageCircle" size={64} className="mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500">Выберите чат для начала общения</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <BreedingInstructionDialog
        open={breedingStep === 'instruction'}
        onOpenChange={(open) => !open && setBreedingStep(null)}
        onStartBreeding={() => setBreedingStep('service')}
      />

      {breedingStep === 'service' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <BreedingServiceSelection
              onSelect={(withVet) => {
                setBreedingData({ ...breedingData, withVet });
                setBreedingStep('meeting');
              }}
              onBack={() => setBreedingStep('instruction')}
            />
          </div>
        </div>
      )}

      {breedingStep === 'meeting' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <BreedingMeetingPlanner
              withVet={breedingData.withVet}
              onSubmit={async (data) => {
                const updatedData = { ...breedingData, ...data };
                setBreedingData(updatedData);
                
                if (breedingData.withVet) {
                  setBreedingStep('vet');
                } else {
                  if (!selectedChat || !user) return;
                  try {
                    const response = await fetch(BREEDING_API_URL, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        action: 'create',
                        chat_id: selectedChat.chat_id,
                        pet1_id: selectedChat.pet1_id,
                        pet2_id: selectedChat.pet2_id,
                        user1_id: selectedChat.user1_id,
                        user2_id: selectedChat.user2_id,
                        meeting_date: data.date,
                        meeting_time: data.time,
                        location: data.location,
                        address: data.address,
                        with_vet: false,
                      }),
                    });
                    const result = await response.json();
                    if (result.id) {
                      window.location.href = `/breeding-process?id=${result.id}`;
                    }
                  } catch (error) {
                    console.error('Failed to create breeding process:', error);
                  }
                }
              }}
              onBack={() => setBreedingStep('service')}
            />
          </div>
        </div>
      )}

      {breedingStep === 'vet' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <VeterinarianSelector
              onSelect={async (vetId) => {
                if (!selectedChat || !user) return;
                try {
                  const response = await fetch(BREEDING_API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      action: 'create',
                      chat_id: selectedChat.chat_id,
                      pet1_id: selectedChat.pet1_id,
                      pet2_id: selectedChat.pet2_id,
                      user1_id: selectedChat.user1_id,
                      user2_id: selectedChat.user2_id,
                      meeting_date: breedingData.date,
                      meeting_time: breedingData.time,
                      location: breedingData.location,
                      address: breedingData.address,
                      with_vet: true,
                      vet_id: vetId,
                      vet_name: 'Выбранный ветеринар',
                    }),
                  });
                  const result = await response.json();
                  if (result.id) {
                    window.location.href = `/breeding-process?id=${result.id}`;
                  }
                } catch (error) {
                  console.error('Failed to create breeding process:', error);
                }
              }}
              onBack={() => setBreedingStep('meeting')}
            />
          </div>
        </div>
      )}
    </div>
  );
}