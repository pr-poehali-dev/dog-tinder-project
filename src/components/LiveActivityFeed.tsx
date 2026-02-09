import { useState, useEffect } from 'react';
import Icon from '@/components/ui/icon';

interface ActivityLog {
  id: string;
  type: 'match' | 'like' | 'message' | 'register';
  text: string;
  timestamp: Date;
  icon: string;
  color: string;
}

const activityTemplates = [
  { type: 'match', text: 'Новая пара! Лабрадор и Ретривер', icon: 'Heart', color: 'text-pink-600' },
  { type: 'like', text: 'Хаски оценил Корги', icon: 'ThumbsUp', color: 'text-blue-600' },
  { type: 'message', text: 'Сообщение: "Привет! Пойдем гулять?"', icon: 'MessageCircle', color: 'text-green-600' },
  { type: 'register', text: 'Новый питомец: Немецкая овчарка', icon: 'UserPlus', color: 'text-purple-600' },
  { type: 'match', text: 'Взаимная симпатия: Мопс ♥ Бульдог', icon: 'Heart', color: 'text-pink-600' },
  { type: 'like', text: 'Спаниель лайкнул Бигля', icon: 'ThumbsUp', color: 'text-blue-600' },
  { type: 'message', text: 'Чат: "Какой красавчик!"', icon: 'MessageCircle', color: 'text-green-600' },
  { type: 'register', text: 'Регистрация: Золотистый ретривер', icon: 'UserPlus', color: 'text-purple-600' },
  { type: 'match', text: 'Мэтч! Джек Рассел и Бигль', icon: 'Heart', color: 'text-pink-600' },
  { type: 'like', text: 'Йорк проявил интерес к Мальтезе', icon: 'ThumbsUp', color: 'text-blue-600' },
];

export default function LiveActivityFeed() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);

  useEffect(() => {
    // Генерируем начальные логи
    const initialLogs: ActivityLog[] = activityTemplates
      .slice(0, 5)
      .map((template, index) => ({
        id: `${Date.now()}-${index}`,
        type: template.type as ActivityLog['type'],
        text: template.text,
        timestamp: new Date(Date.now() - (5 - index) * 3000),
        icon: template.icon,
        color: template.color,
      }));
    setLogs(initialLogs);

    // Добавляем новый лог каждые 3-5 секунд
    const interval = setInterval(() => {
      const template = activityTemplates[Math.floor(Math.random() * activityTemplates.length)];
      const newLog: ActivityLog = {
        id: `${Date.now()}-${Math.random()}`,
        type: template.type as ActivityLog['type'],
        text: template.text,
        timestamp: new Date(),
        icon: template.icon,
        color: template.color,
      };

      setLogs((prev) => [newLog, ...prev].slice(0, 6)); // Оставляем только 6 последних
    }, Math.random() * 2000 + 3000); // 3-5 секунд

    return () => clearInterval(interval);
  }, []);

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diff < 10) return 'только что';
    if (diff < 60) return `${diff} сек назад`;
    if (diff < 3600) return `${Math.floor(diff / 60)} мин назад`;
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-lg p-4 border border-pink-200">
      <div className="flex items-center gap-2 mb-3">
        <div className="relative">
          <Icon name="Activity" size={20} className="text-pink-600" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
        </div>
        <h3 className="font-semibold text-gray-800">Активность сейчас</h3>
      </div>
      
      <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
        {logs.map((log, index) => (
          <div 
            key={log.id}
            className={`flex items-start gap-2 p-2 bg-white/60 rounded-lg transition-all duration-500 ${
              index === 0 ? 'animate-slide-in scale-105' : ''
            }`}
            style={{
              animation: index === 0 ? 'slideIn 0.5s ease-out' : undefined
            }}
          >
            <Icon name={log.icon} size={16} className={`mt-0.5 ${log.color} flex-shrink-0`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-700 truncate">{log.text}</p>
              <p className="text-xs text-gray-500">{formatTime(log.timestamp)}</p>
            </div>
          </div>
        ))}
      </div>
      
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-slide-in {
          animation: slideIn 0.5s ease-out;
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #f9a8d4;
          border-radius: 2px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #f472b6;
        }
      `}</style>
    </div>
  );
}
