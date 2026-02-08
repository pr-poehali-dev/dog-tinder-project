import { useEffect, useRef } from 'react';
import Icon from '@/components/ui/icon';

interface Message {
  id: number;
  sender_user_id: number;
  sender_name: string;
  message: string;
  created_at: string;
}

interface ChatMessagesProps {
  messages: Message[];
  currentUserId: number;
}

export default function ChatMessages({
  messages,
  currentUserId,
}: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <Icon name="MessageCircle" size={64} className="mx-auto mb-4 text-gray-300" />
          <p className="text-gray-600">Нет сообщений</p>
          <p className="text-sm text-gray-400 mt-2">
            Начните общение первым!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((msg) => {
        const isOwn = msg.sender_user_id === currentUserId;
        return (
          <div
            key={msg.id}
            className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] ${
                isOwn
                  ? 'bg-gradient-to-r from-pink-500 to-orange-500 text-white'
                  : 'bg-white text-gray-800'
              } rounded-2xl px-4 py-2 shadow-sm`}
            >
              {!isOwn && (
                <p className="text-xs font-medium mb-1 opacity-70">
                  {msg.sender_name}
                </p>
              )}
              <p className="break-words">{msg.message}</p>
              <p
                className={`text-xs mt-1 ${
                  isOwn ? 'text-white/70' : 'text-gray-500'
                }`}
              >
                {formatTime(msg.created_at)}
              </p>
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
}
