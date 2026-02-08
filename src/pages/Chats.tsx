import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useNotifications } from '@/hooks/useNotifications';
import BreedingInstructionDialog from '@/components/BreedingInstructionDialog';
import BreedingServiceSelection from '@/components/BreedingServiceSelection';
import BreedingMeetingPlanner from '@/components/BreedingMeetingPlanner';
import VeterinarianSelector from '@/components/VeterinarianSelector';
import ChatList from './Chats/ChatList';
import ChatHeader from './Chats/ChatHeader';
import ChatMessages from './Chats/ChatMessages';
import ChatInput from './Chats/ChatInput';

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
              <Button variant="ghost" onClick={() => (window.location.href = '/feed')}>
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
            <p className="text-gray-600 mb-4">
              Начните лайкать питомцев, чтобы общаться с их владельцами
            </p>
            <Button onClick={() => (window.location.href = '/')}>
              Смотреть питомцев
            </Button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className={`${selectedChat ? 'hidden lg:block' : ''} lg:col-span-1`}>
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="p-4 border-b">
                  <h2 className="font-semibold text-gray-800">Все чаты</h2>
                </div>
                <div className="p-4 max-h-[calc(100vh-250px)] overflow-y-auto">
                  <ChatList
                    chats={chats}
                    selectedChat={selectedChat}
                    currentUserId={user.id}
                    onSelectChat={handleSelectChat}
                  />
                </div>
              </div>
            </div>

            <div className={`${!selectedChat ? 'hidden' : ''} lg:block lg:col-span-2`}>
              {selectedChat ? (
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col h-[calc(100vh-200px)]">
                  <ChatHeader
                    selectedChat={selectedChat}
                    currentUserId={user.id}
                    hasBreedingProcess={hasBreedingProcess}
                    onStartBreeding={() => setBreedingStep('instruction')}
                    onBack={() => setSelectedChat(null)}
                  />

                  <ChatMessages
                    messages={messages}
                    currentUserId={user.id}
                  />

                  <ChatInput
                    newMessage={newMessage}
                    isSending={isSending}
                    onMessageChange={setNewMessage}
                    onSendMessage={handleSendMessage}
                  />
                </div>
              ) : (
                <div className="hidden lg:flex bg-white rounded-2xl shadow-lg h-[calc(100vh-200px)] items-center justify-center">
                  <div className="text-center">
                    <Icon name="MessageCircle" size={64} className="mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-600">Выберите чат для начала общения</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {breedingStep === 'instruction' && (
        <BreedingInstructionDialog
          onClose={() => setBreedingStep(null)}
          onContinue={() => setBreedingStep('service')}
        />
      )}

      {breedingStep === 'service' && (
        <BreedingServiceSelection
          onClose={() => setBreedingStep(null)}
          onSelect={(withVet: boolean) => {
            setBreedingData({ ...breedingData, withVet });
            if (withVet) {
              setBreedingStep('vet');
            } else {
              setBreedingStep('meeting');
            }
          }}
        />
      )}

      {breedingStep === 'vet' && (
        <VeterinarianSelector
          onClose={() => setBreedingStep(null)}
          onSelect={(vetId: number) => {
            setBreedingData({ ...breedingData, vetId });
            setBreedingStep('meeting');
          }}
        />
      )}

      {breedingStep === 'meeting' && (
        <BreedingMeetingPlanner
          onClose={() => setBreedingStep(null)}
          onPlan={(data: { date: string; time: string; location: 'male_home' | 'neutral'; address?: string }) => {
            setBreedingData({ ...breedingData, ...data });
            handleCreateBreedingProcess();
          }}
        />
      )}
    </div>
  );
}