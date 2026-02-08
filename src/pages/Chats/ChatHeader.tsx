import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

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

interface ChatHeaderProps {
  selectedChat: Chat;
  currentUserId: number;
  hasBreedingProcess: boolean;
  onStartBreeding: () => void;
  onBack: () => void;
}

export default function ChatHeader({
  selectedChat,
  currentUserId,
  hasBreedingProcess,
  onStartBreeding,
  onBack,
}: ChatHeaderProps) {
  const otherUser =
    selectedChat.user1_id === currentUserId
      ? { id: selectedChat.user2_id, name: selectedChat.user2_name }
      : { id: selectedChat.user1_id, name: selectedChat.user1_name };

  return (
    <div className="flex items-center justify-between p-4 border-b bg-white">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="lg:hidden">
          <Icon name="ArrowLeft" size={20} />
        </Button>
        <div className="flex -space-x-2">
          <div className="w-10 h-10 rounded-full bg-pink-100 overflow-hidden border-2 border-white">
            {selectedChat.pet1_photo ? (
              <img
                src={selectedChat.pet1_photo}
                alt={selectedChat.pet1_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Icon name="Dog" size={20} className="text-pink-400" />
              </div>
            )}
          </div>
          <div className="w-10 h-10 rounded-full bg-orange-100 overflow-hidden border-2 border-white">
            {selectedChat.pet2_photo ? (
              <img
                src={selectedChat.pet2_photo}
                alt={selectedChat.pet2_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Icon name="Dog" size={20} className="text-orange-400" />
              </div>
            )}
          </div>
        </div>
        <div>
          <h2 className="font-semibold text-gray-800">
            {selectedChat.pet1_name} & {selectedChat.pet2_name}
          </h2>
          <p className="text-sm text-gray-600">
            с {otherUser.name || 'Пользователь'}
          </p>
        </div>
      </div>
      {!hasBreedingProcess && (
        <Button
          onClick={onStartBreeding}
          size="sm"
          className="bg-gradient-to-r from-pink-600 to-orange-600"
        >
          <Icon name="Heart" size={16} className="mr-2" />
          Начать вязку
        </Button>
      )}
    </div>
  );
}
