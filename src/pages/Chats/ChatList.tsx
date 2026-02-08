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

interface ChatListProps {
  chats: Chat[];
  selectedChat: Chat | null;
  currentUserId: number;
  onSelectChat: (chat: Chat) => void;
}

export default function ChatList({
  chats,
  selectedChat,
  currentUserId,
  onSelectChat,
}: ChatListProps) {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <div className="space-y-2">
      {chats.map((chat) => {
        const isSelected = selectedChat?.chat_id === chat.chat_id;
        const otherUser =
          chat.user1_id === currentUserId
            ? { id: chat.user2_id, name: chat.user2_name }
            : { id: chat.user1_id, name: chat.user1_name };

        return (
          <button
            key={chat.chat_id}
            onClick={() => onSelectChat(chat)}
            className={`w-full text-left p-4 rounded-xl transition-all ${
              isSelected
                ? 'bg-gradient-to-r from-pink-100 to-orange-100 border-2 border-pink-300'
                : 'bg-white hover:bg-gray-50 border-2 border-transparent'
            }`}
          >
            <div className="flex gap-3">
              <div className="flex -space-x-2">
                <div className="w-12 h-12 rounded-full bg-pink-100 overflow-hidden border-2 border-white">
                  {chat.pet1_photo ? (
                    <img
                      src={chat.pet1_photo}
                      alt={chat.pet1_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Icon name="Dog" size={24} className="text-pink-400" />
                    </div>
                  )}
                </div>
                <div className="w-12 h-12 rounded-full bg-orange-100 overflow-hidden border-2 border-white">
                  {chat.pet2_photo ? (
                    <img
                      src={chat.pet2_photo}
                      alt={chat.pet2_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Icon name="Dog" size={24} className="text-orange-400" />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-1">
                  <h3 className="font-semibold text-gray-800 truncate">
                    {chat.pet1_name} & {chat.pet2_name}
                  </h3>
                  {chat.last_message_at && (
                    <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                      {formatTime(chat.last_message_at)}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-1">
                  с {otherUser.name || 'Пользователь'}
                </p>
                {chat.last_message && (
                  <p className="text-sm text-gray-500 truncate">
                    {chat.last_message}
                  </p>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
